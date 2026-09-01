---
title: "Diseñar un sistema de notificaciones: push, SMS, email, colas y fiabilidad"
description: "Cómo funciona un sistema de notificaciones, explicado para principiantes: canales, preferencias, plantillas, colas, reintentos y el camino desde un pedido enviado hasta una alerta en el teléfono."
date: "2026-06-07"
tags: [Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/design-notification-system.webp
previewImage: /assets/images/design-notification-system.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Cómo funciona un sistema de notificaciones, explicado para principiantes: canales, preferencias, plantillas, colas, reintentos y el camino desde un pedido enviado hasta una alerta en el teléfono.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Imagina la secretaría de un colegio que debe avisar a los padres de noticias importantes. A veces manda un SMS. A veces un email. A veces una nota corta que aparece en el teléfono del padre o la madre. La secretaría no grita en la calle esperando que alguien oiga. Mantiene una lista de padres, comprueba cómo quiere ser contactado cada uno, rellena un formulario estándar con el nombre del niño y la noticia, y solo entonces envía el mensaje. Si el SMS falla porque el teléfono está apagado, lo intenta otra vez más tarde. Esa secretaría es la imagen correcta de un **sistema de notificaciones**.

Este post enseña ese diseño desde cero. Sin jerga de entrevista al principio. Piezas claras y luego un recorrido completo desde "pedido enviado" hasta la vibración del teléfono.

---

## ¿Qué problema resolvemos?

Una app tiene muchas razones para hablar con una persona:

- Tu paquete salió del almacén.
- Aquí tienes tu código de acceso.
- Se cobró tu tarjeta.
- Un amigo dio like a tu foto.

Esos son **eventos**. Un sistema de notificaciones convierte eventos en mensajes que la gente puede ver: **push** en el teléfono, **SMS** o **email**. Los demás servicios del producto no deberían reinventar el envío de textos y correos. Le dicen al sistema de notificaciones "avisa a este usuario de este evento" y el sistema hace el resto.

En la imagen del colegio:

| Secretaría del colegio | Sistema de notificaciones |
| --- | --- |
| Noticia sobre un alumno | Evento de producto (pedido enviado, reset de contraseña) |
| Ficha de contacto del padre | Perfil de usuario (email, teléfono, tokens de dispositivo) |
| Reglas "solo llamar en emergencias" | Preferencias del usuario (opt-in / opt-out) |
| Carta modelo con huecos | Plantillas (templates) |
| Bandeja de salida esperando al mensajero | Cola (queue) |
| Mensajero que llama o envía | Worker que habla con Apple, SMS o email |
| Reintentar si la línea está ocupada | Reintentos (retries) |

---

## Canales: las tres puertas por las que salen los mensajes

Un **canal** es simplemente *cómo* se entrega el mensaje.

### 1. Push

Una alerta corta en la pantalla de bloqueo. Tú no hablas con la radio del teléfono. Envías a **Apple** (APNs en iPhone) o a **Google** (FCM en muchos Android). Ellos entregan cuando el dispositivo está disponible.

Imagen del colegio: una nota rápida en el teléfono del padre, no una carta larga.

### 2. SMS

Un texto a un número de teléfono. Pagas a una pasarela (Twilio y similares). Ellos hablan con las operadoras. El SMS es caro y suele usarse para códigos y alertas urgentes.

Imagen del colegio: un SMS real al número del padre.

### 3. Email

Un mensaje más largo a un buzón. La mayoría de equipos usa plataformas de email (SendGrid, Amazon SES, Mailgun) para no reinventar rebotes y reputación.

Imagen del colegio: una carta completa en el buzón de correo.

**Regla de diseño:** cada canal tiene la misma forma: *cola → worker → proveedor externo*. Cerebro compartido, mensajeros distintos.

Casi nunca controlas la última milla. Apple, las operadoras y las redes de email lo hacen. Tu trabajo es pedir bien, recordar lo que pediste y recuperarte cuando fallen.

---

## Preferencias: no avises a quien dijo que no

Los padres se enfadan si el colegio manda un SMS con cada menú del comedor. Los usuarios silencian apps que spamean. Por eso el sistema guarda **preferencias**:

- Canal: push sí, SMS no, email sí.
- Categoría: seguridad sí, marketing no, tips de producto sí.
- Horas tranquilas: nada de marketing a las 2am en la zona horaria del usuario.

Antes de enviar, la secretaría mira la ficha:

1. Carga ajustes de este usuario, canal y categoría.
2. Omite si hizo opt-out.
3. Para noticias que no son de seguridad, respeta horas tranquilas.
4. Mensajes de seguridad y dinero (reset de contraseña, pago fallido) a menudo siguen saliendo aunque el marketing esté apagado. Eso lo deciden producto y la ley. Díselo en voz alta.

Respetar preferencias no es solo cortesía. Protege la confianza y la entregabilidad del email. Un sistema que ignora el silencio está roto.

---

## Plantillas: cartas modelo con huecos

No quieres que cada equipo escriba HTML de email en su propio servicio. El sistema de notificaciones posee las **plantillas**: texto aprobado con huecos.

Ejemplo de plantilla push:

```
Tu pedido {{order_id}} ha sido enviado. Síguelo: {{tracking_url}}
```

Al enviar, el sistema rellena los huecos con datos reales: id de pedido, nombre, importe, enlace.

Las plantillas deben ser:

- **Por canal** (push corto; email HTML largo; SMS con presupuesto de caracteres).
- **Por idioma** si tienes varios locales.
- **Versionadas** para poder revertir un error.
- **Seguras**: escapar texto controlado por el usuario para que un nombre raro no rompa el HTML.

Imagen del colegio: una pila de formularios. El personal no improvisa el texto legal en cada llamada.

---

## Colas: la bandeja de salida

Si el director se queda en espera con cada operadora mientras se acumulan padres en el mostrador, la secretaría entera se congela. Igual en software.

Una **cola** es una fila de espera para el trabajo:

1. Ocurre algo importante (pedido enviado).
2. La **API** de notificaciones registra la intención y pone trabajos en la cola.
3. Responde "aceptado" enseguida (estilo HTTP 202).
4. **Workers** aparte sacan trabajos y hablan con Apple, SMS o email.

Por qué importan las colas:

- Los picos (rebajas, campaña) caen en la bandeja en vez de aplastar la API.
- Una caída de SMS no bloquea el push. Dale a cada canal su propia cola.
- Los trabajos fallidos pueden esperar y reintentar sin colgar al servicio original.

```
[ Servicio de pedidos ]
       |
       v
[ API de notificaciones ]
  comprueba usuario, prefs, plantilla
  escribe una fila de log
       |
       +---> [ Cola push ]  --> workers push  --> Apple / Google
       |
       +---> [ Cola SMS ]   --> workers SMS   --> proveedor SMS
       |
       +---> [ Cola email ] --> workers email --> proveedor email
```

**Separa aceptar de entregar.** Aceptar es "lo apuntamos y lo metimos en la bandeja." Entregar es "el mundo exterior lo recibió." Son dos pasos.

---

## Reintentos: prueba otra vez, pero no para siempre

Las redes fallan. Los proveedores dicen "ocupado." Los teléfonos están offline. Por eso los workers **reintentan**.

Reglas simples:

| Qué falló | Qué hacer |
| --- | --- |
| Error temporal (timeout, 503) | Espera más cada vez (backoff) y reintenta |
| Token malo o email muerto | Fallo permanente; deja de reintentar ese destino |
| Límite del proveedor | Ralentiza; reencola con retraso |
| Mensaje tóxico (datos de plantilla rotos) | Tras N intentos, **cola de cartas muertas** y avisa a humanos |

Pon un tope de intentos. Reintentar sin fin un template roto es un autoataque a tu factura del proveedor.

Además: el mundo es **al menos una vez**, no exactamente una vez perfecta. Un timeout puede dejarte sin saber si el SMS ya salió. Los llamadores deben enviar una **clave de idempotencia** (un id único de "ya pedimos este recibo una vez"). El sistema la recuerda y descarta duplicados exactos dentro de una ventana. La gente odia más un reset de contraseña perdido que un push duplicado raro, pero igual deduplicas fuerte cuando puedes.

---

## Datos de contacto que debes guardar

Sin direcciones, no sale nada del edificio.

| Dato | Por qué |
| --- | --- |
| Email, teléfono | Destinos de email y SMS |
| Tokens push del dispositivo | Un usuario puede tener varios móviles; los tokens caducan |
| Idioma y zona horaria | Idioma y horas tranquilas |
| Preferencias | Interruptores de canal y categoría |
| Log de notificaciones | Qué intentaste, estado, ids del proveedor |

Los tokens llegan al instalar la app o al iniciar sesión. Cuando Apple o Google dicen que un token está muerto para siempre, márcalo inactivo. Nunca asumas un solo teléfono para siempre.

---

## Recorre un evento: pedido enviado → vibración del teléfono

Sigue una historia de punta a punta.

**Escena:** El almacén marca el pedido `ord_9f3a` como enviado para el usuario `cus_12`. El producto quiere push y email. El usuario desactivó SMS de marketing, pero esto es un aviso transaccional de envío.

### Paso 1: El evento

El servicio de pedidos llama al de notificaciones:

```http
POST /internal/v1/notifications

{
  "idempotency_key": "ord_9f3a:shipped:v1",
  "user_id": "cus_12",
  "template_id": "order_shipped",
  "channels": ["email", "push"],
  "category": "transactional",
  "data": {
    "order_id": "ord_9f3a",
    "tracking_url": "https://shop.example/t/abc"
  }
}
```

Solo servicios internos de confianza deberían llamar aquí. Los secretos de Apple y SMS viven en un almacén de secretos, no en el chat ni en configs sueltas.

### Paso 2: La secretaría mira la ficha

La API de notificaciones:

1. Autentica al llamador.
2. Comprueba que la misma clave de idempotencia no esté ya resuelta.
3. Carga email, dispositivos, preferencias y la plantilla `order_shipped`.
4. Omite SMS (no se pidió). Mantiene email y push si los ajustes lo permiten.
5. Revisa límites de tasa para que un servicio no inunde a un usuario ni queme el presupuesto de SMS.
6. Escribe una fila en el **log de notificaciones** con estado `pending` (la intención queda registrada).
7. Encola un trabajo de email y uno de push (o uno de push por dispositivo activo).
8. Devuelve `202 Accepted` con un `notification_id`. El servicio de pedidos no espera a Apple.

Imagen del colegio: el personal sella el formulario, deja papeles en la bandeja y dice al almacén "lo tenemos."

### Paso 3: Worker de email

1. Saca el trabajo de la cola de email.
2. Rellena la plantilla con id de pedido y enlace de seguimiento.
3. Llama al proveedor de email.
4. Guarda el id de mensaje del proveedor.
5. Marca el log como `sent` (o `failed` con motivo).

### Paso 4: Worker de push (el camino al teléfono)

1. Saca el trabajo de push.
2. Busca tokens de dispositivo activos de `cus_12`.
3. Construye un payload corto desde la plantilla push.
4. Publica en APNs o FCM por cada token.
5. Si el token es inválido, desactiva esa fila de dispositivo.
6. Si el error es temporal, reintenta con backoff.
7. Actualiza el log.

### Paso 5: El teléfono

Apple o Google entregan cuando el dispositivo está online. El usuario ve: "Tu pedido ord_9f3a ha sido enviado..." Un deep link opcional abre el seguimiento.

### Paso 6: Recibos posteriores

Los proveedores pueden mandar webhooks: entregado, rebotado, abierto. Eso actualiza analítica sin bloquear el envío. El camino caliente se mantiene delgado.

Esa es la columna vertebral: **evento → preferencias → registrar intención → cola → worker → proveedor → dispositivo**.

---

## Un diseño que puedes defender (forma de entrevista)

Si te piden diseñarlo en la pizarra, di:

1. **API de notificaciones sin estado** para auth, validación, preferencias, límites e idempotencia.
2. **Base de datos + caché** para usuarios, dispositivos, ajustes, plantillas y el log.
3. **Colas y workers por canal** con adaptadores para push, SMS y email.
4. **Plantillas** renderizadas en workers, versionadas y localizadas.
5. Entrega **al menos una vez** con reintentos, cola de cartas muertas y claves de idempotencia.
6. **Monitorización** de la edad de la cola y tasas de error del proveedor.

Trade-offs a decir en voz alta:

- Una sola cola es más simple; colas por canal aíslan fallos.
- Enviar en sync es más fácil de depurar y muere cuando un proveedor va lento.
- Exactamente una vez perfecta entre operadoras no es gratis; idempotencia y dedupe son la barra práctica.
- Campañas de marketing y códigos de contraseña no deben compartir la misma prioridad ni el mismo presupuesto.
- Montar tus propios servidores de email parece barato hasta que la reputación se come al equipo.

Ejemplo de escala (ajústalo con el entrevistador): millones de push al día, menos SMS porque cuestan dinero, soft real-time (segundos valen para un envío; un OTP necesita un camino prioritario rápido).

---

## Resumen para un amigo

Un sistema de notificaciones es la secretaría de tu producto. Otros servicios traen noticias. La secretaría mira cómo quiere ser contactada cada persona, rellena un formulario estándar, anota la petición en un log y deja trabajo en bandejas de espera. Distintos mensajeros manejan push, SMS y email a través de empresas externas. Si un envío falla por una razón temporal, lo intentan unas cuantas veces. Si está roto de forma permanente, paran y avisan a alguien. Quien dijo "no a textos de marketing" no recibe textos de marketing. Un evento "pedido enviado" se convierte en una alerta corta en el teléfono porque la API aceptó el trabajo, un worker rellenó la plantilla y Apple o Google lo entregaron cuando el teléfono estaba listo. Lo difícil no es el JSON que mandas a un proveedor. Lo difícil es aceptar trabajo rápido, respetar preferencias, sobrevivir a terceros caprichosos y no perder en silencio los mensajes importantes.

---

## Cierre

Construye bien la secretaría: **canales** para las puertas, **preferencias** para el consentimiento, **plantillas** para un texto coherente, **colas** para que el mostrador no se congele y **reintentos** para que un fallo temporal no sea silencio permanente. Separa aceptar de entregar. Aísla canales. Trata a los proveedores externos como compañeros poco fiables. Todo lo demás cuelga de esa columna.

