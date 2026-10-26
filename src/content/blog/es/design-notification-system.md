---
title: "Diseña un sistema de notificaciones: push, email, SMS, preferencias y entrega fiable"
description: "Una plataforma de notificaciones para producción: una sola API para todos los productores, comprobación de preferencias y horas de silencio, colas y workers por canal, proveedores APNs/FCM, email y SMS, claves de idempotencia, reintentos con espera y colas de mensajes muertos, higiene de tokens, reglas de entregabilidad y las métricas que demuestran que funciona."
date: "2026-06-07"
tags: [Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/design-notification-system.webp
previewImage: /assets/images/design-notification-system.webp
---

> **TL;DR**
> * **El problema:** Decenas de servicios internos quieren decirles cosas a los usuarios. Sin una plataforma compartida, cada uno integra por su cuenta APNs, un proveedor de email y una pasarela SMS, ignora las preferencias del usuario a su manera y reintenta hasta que el usuario recibe el mismo mensaje tres veces.
> * **El diseño:** Una única Notification API acepta peticiones con una clave de idempotencia, comprueba preferencias, contactos y horas de silencio, y reparte a colas por canal. Los workers de cada canal renderizan plantillas, llaman a los proveedores, reintentan los fallos transitorios con espera y jitter, mandan el resto a una cola de mensajes muertos y limpian los tokens inválidos. Las confirmaciones de los proveedores alimentan un registro de entregas.
> * **El resultado:** Entrega al menos una vez que al usuario le parece exactamente una vez, canales que fallan de forma independiente, campañas que no pueden dejar sin turno a un restablecimiento de contraseña y un único sitio donde responder "¿le llegó al usuario?".

Las notificaciones son la parte de un producto que sale del producto. Aterrizan en pantallas de bloqueo y bandejas de entrada, junto a todo lo demás que compite por la atención. Si las haces mal, los usuarios no abren incidencias: desactivan las notificaciones y pierdes el canal para siempre.

Este artículo diseña la plataforma compartida que hay entre "se ha enviado un pedido" y "ha vibrado un móvil".

---

## Requisitos

**Funcionales**

* Canales: push móvil (iOS y Android), email, SMS y, opcionalmente, notificaciones dentro de la app.
* Los productores envían un evento con significado ("pedido enviado", "restablecer contraseña"), no un mensaje ya renderizado.
* Respetar las preferencias por categoría y canal, las bajas y las horas de silencio.
* Plantillas por tipo de notificación e idioma.
* Estado de entrega por notificación, consultable por los equipos de soporte.

**No funcionales**

* Los mensajes transaccionales (restablecer contraseña, alertas de seguridad) se entregan en segundos, incluso en mitad de un envío masivo de marketing.
* Nunca enviar dos veces la misma notificación al mismo usuario por un reintento interno.
* Canales y proveedores fallan de forma independiente: una caída del proveedor de SMS no debe retrasar los push.

**Cifras:** 50M de notificaciones en un día normal son unas 600 por segundo de media, pero una campaña de marketing a 30M de usuarios programada a las 9 de la mañana puede exigir decenas de miles por segundo durante un rato. **Diseña para el pico y aíslalo.**

---

## La arquitectura

![Arquitectura de notificaciones: los productores de pedidos, marketing y seguridad llaman a la Notification API con una clave de idempotencia, que comprueba preferencias y contactos y reparte en colas de push, email y SMS; los workers de cada canal renderizan plantillas y llaman a APNs/FCM, a un proveedor de email y a una pasarela SMS, cuyas confirmaciones y webhooks alimentan un registro de entregas](/assets/images/hld/design-notification-architecture.webp)

* **Productores (Order Service, Marketing Campaigns, Security Alerts).** Llaman a una sola API con un tipo de evento, un destinatario y datos. Nunca hablan directamente con APNs o Twilio.
* **Notification API (clave de idempotencia).** Valida la petición, rechaza duplicados por clave de idempotencia (por ejemplo `order-8812:shipped`), asigna una clase de prioridad y decide qué canales aplican.
* **Preferences + Contacts.** Consentimientos por categoría y canal, bajas, horas de silencio y zona horaria, además de tokens de dispositivo, emails verificados y números de teléfono. Las bajas legalmente obligatorias (email de marketing, SMS) se comprueban aquí, siempre.
* **Channel Queues (push, email, sms).** Una cola por canal y, en la práctica, colas separadas de alta prioridad y de envío masivo por canal, para que una campaña no se ponga delante de un restablecimiento de contraseña.
* **Senders (workers de push, email y SMS).** Sacan trabajos, renderizan la plantilla, llaman al proveedor, registran el resultado y aplican la política de reintentos de abajo.
* **Templates (i18n).** Plantillas versionadas por tipo de notificación e idioma. Se renderiza en el momento del envío, así que una errata corregida se aplica a los mensajes que siguen en cola.
* **Providers (APNs / FCM, proveedor de email, pasarela SMS).** Sistemas externos con sus propios límites, códigos de error y caídas. Envuelve cada uno en un adaptador para poder añadir un segundo proveedor de respaldo.
* **Delivery Log.** Aquí acaba cada intento y cada confirmación o webhook del proveedor (entregado, rebotado, abierto, baja). Soporte puede responder "¿le llegó el código?" sin leer logs.

---

## Un evento de principio a fin: "pedido enviado"

1. El servicio de pedidos llama a `POST /notifications` con `type=order_shipped`, `user_id=42`, los datos de seguimiento e `idempotency_key=order-8812:shipped`.
2. La API comprueba la clave. Si la vio en los últimos días, devuelve el resultado original. Los reintentos del servicio de pedidos pasan a ser inofensivos.
3. Las preferencias dicen que el usuario 42 quiere avisos de envío por push y email, no por SMS. Son las 2 de la madrugada en su zona horaria, pero los avisos de envío se permiten en horas de silencio como push "silencioso".
4. La API encola un trabajo de push y uno de email, ambos de alta prioridad y con la clave de idempotencia.
5. El worker de push renderiza la plantilla localizada, envía a cada token de dispositivo activo por APNs o FCM y registra la respuesta. El worker de email renderiza la plantilla HTML y la entrega al proveedor de email.
6. Más tarde, los webhooks del proveedor informan de "entregado" para el email y, mediante la confirmación de la propia app, de "mostrado" para el push. El registro de entregas tiene la historia completa.

---

## Reintentos, mensajes muertos y la ilusión del exactamente una vez

![Flujo de reintentos de notificaciones: sacar un trabajo, comprobar deduplicación y horas de silencio, llamar al proveedor; con 2xx marcar como enviado, con errores reintentables como 429, 5xx o timeouts reencolar con espera exponencial y jitter hasta un límite antes de mandarlo a una cola de mensajes muertos, y con errores permanentes como 410 eliminar el token o la dirección inválidos](/assets/images/hld/design-notification-retries.webp)

Los sistemas distribuidos entregan **al menos una vez**. El truco es que al usuario le parezca exactamente una vez:

* **Clasifica los errores.** Reintenta la limitación (429), los errores de servidor (5xx) y los timeouts. No reintentes los errores permanentes: APNs responde `410 Unregistered` para tokens que ya no son válidos, y los proveedores de email informan de rebotes duros. Reintentarlos solo daña tu reputación como remitente.
* **Espera con jitter.** 1 s, 2 s, 4 s, con aleatoriedad y un tope. Sin jitter, todos los trabajos fallidos reintentan en el mismo instante y machacan a un proveedor que ya va mal.
* **Intentos limitados y luego cola de mensajes muertos.** Al llegar al límite, mueve el trabajo a una DLQ con el error adjunto. Alguien o algo tiene que mirar esa cola; una DLQ que nadie lee es solo una forma más lenta de perder mensajes.
* **La misma clave de idempotencia en cada intento.** El worker consulta el registro de entregas antes de enviar, y muchos proveedores también aceptan una clave de idempotencia. Así, una caída entre "el proveedor lo aceptó" y "lo registramos" no provoca duplicados.
* **Limpia.** Elimina en el acto los tokens push muertos y suprime los emails con rebote duro, o cada envío futuro a ese usuario desperdiciará un intento.

---

## Realidades de cada canal

| Canal | Coste | Latencia | Trampas |
| --- | --- | --- | --- |
| Push (APNs, FCM) | Prácticamente gratis | Segundos | Los tokens rotan y caducan; límite de carga de unos 4 KB; el sistema operativo puede limitar o descartar push de baja prioridad; Google retiró en 2024 las APIs heredadas de FCM en favor de HTTP v1 |
| Email | Fracciones de céntimo | De segundos a minutos | La entregabilidad es reputación: SPF, DKIM y DMARC son obligatorios; desde 2024 Gmail y Yahoo exigen a los remitentes masivos baja con un clic y tasas de quejas de spam bajas |
| SMS | Céntimos por mensaje, según el país | Segundos | Caro a escala; registro ante los operadores (10DLC en EE. UU.) y normas de consentimiento; los identificadores de remitente cambian por país |
| Dentro de la app | Gratis | Instantáneo si está conectada | Solo funciona con la app abierta; suele guardarse como bandeja y sincronizarse |

La columna de coste dicta la política de enrutamiento. Un código OTP puede merecer un SMS. Un "tu amigo ha publicado" no.

---

## Proteger a los usuarios de tu propia empresa

Los requisitos más difíciles no son técnicos:

* **Topes de frecuencia.** No más de N push de marketing por usuario y día, aplicados de forma central, quieran enviar los equipos que quieran.
* **Horas de silencio** en la zona horaria del usuario, con excepciones explícitas para seguridad y mensajes transaccionales.
* **Agrupar y resumir.** Diez "me gusta" en cinco minutos deberían ser una notificación, no diez. Los proveedores de push admiten claves de colapso; tu plataforma debería admitir ventanas de agrupación.
* **Una baja es una baja.** El almacén de preferencias es la única fuente de verdad, y cada canal lo comprueba en el momento del envío, no cuando se programó la campaña.

---

## Métricas que importan

| Métrica | Por qué |
| --- | --- |
| Tiempo desde el evento hasta la aceptación del proveedor, por prioridad | Muestra si el tráfico masivo retrasa los mensajes transaccionales |
| Tasa de errores del proveedor por código | Separa tus bugs (4xx) de sus caídas (5xx) |
| Profundidad y antigüedad de la DLQ | Los mensajes que has dejado de entregar en silencio |
| Tasa de tokens inválidos y rebotes duros | Higiene de los datos de contacto |
| Tasa de bajas tras cada campaña | La única medida honesta de si la gente quiere lo que envías |

---

## Lista de comprobación para producción

- [ ] Una API para todos los productores; ninguna integración directa con proveedores en otro sitio
- [ ] Claves de idempotencia obligatorias en cada petición y reutilizadas en cada reintento
- [ ] Preferencias, bajas y horas de silencio comprobadas en el momento del envío
- [ ] Colas separadas de alta prioridad y de envío masivo por canal
- [ ] Clasificación de reintentos, espera con jitter, límite de intentos y una DLQ vigilada
- [ ] Tokens inválidos y rebotes duros eliminados automáticamente
- [ ] SPF, DKIM, DMARC y baja con un clic para el email
- [ ] Topes de frecuencia y agrupación o resumen para los eventos ruidosos
- [ ] Registro de entregas consultable por soporte, con las confirmaciones del proveedor
- [ ] Proveedor secundario configurado para los canales críticos

---

## Lo que queda

El mejor sistema de notificaciones es aquel que los usuarios apenas notan: el código llega cuando lo pidieron, el aviso del paquete llega cuando el paquete se mueve y a las 3 de la madrugada no llega nada que pudiera esperar.

Esa contención es una decisión de diseño, no un valor por defecto. Cada equipo que lanza una funcionalidad querrá una notificación para ella. La plataforma es el lugar donde alguien puede decir "mételo en el resumen diario" y tener razón.

---

## Fuentes

* [Apple: Sending notification requests to APNs (códigos de estado, incluido el 410)](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns)
* [Firebase Cloud Messaging: migrar de las APIs heredadas a HTTP v1](https://firebase.google.com/docs/cloud-messaging/migrate-v1)
* [Google: Directrices para remitentes de email (requisitos para envíos masivos)](https://support.google.com/a/answer/81126)
* [RFC 8058: Signaling one-click functionality for list email headers](https://www.rfc-editor.org/rfc/rfc8058)
* [AWS Architecture Blog: Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
* Relacionado en esta serie: [Diseña un sistema de chat](/blog/es/design-chat-system), [Diseña un limitador de tasa](/blog/es/design-a-rate-limiter), [Arquitectura orientada a eventos](/blog/es/event-driven-architecture-intro)
