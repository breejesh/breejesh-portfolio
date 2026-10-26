---
title: "Diseña un sistema de chat: WebSockets, orden de mensajes, ticks de entrega y presencia"
description: "Un diseño de chat para producción: servidores WebSocket con estado y un registro de sesiones, números de secuencia por conversación, envíos idempotentes, almacenamiento particionado por conversación, confirmaciones de entrega y lectura como cursores, grupos, sincronización entre dispositivos, presencia, notificaciones push de respaldo y cifrado de extremo a extremo."
date: "2025-11-19"
tags: [Diseño de Sistemas y Arquitectura, Backend y Bases de Datos]
coverImage: /assets/images/design-chat-system.webp
previewImage: /assets/images/design-chat-system.webp
---

> **TL;DR**
> * **El problema:** Entregar mensajes entre usuarios en bastante menos de un segundo, en orden, exactamente una vez desde el punto de vista del usuario, con redes móviles inestables, varios dispositivos por usuario y usuarios que pasan días desconectados.
> * **El diseño:** Mantener un WebSocket persistente por dispositivo en servidores de chat con estado, registrar en un registro de sesiones qué servidor tiene a cada usuario, asignar a cada mensaje un número de secuencia por conversación al persistirlo, enrutarlo por un bus de entrega al servidor del destinatario, recurrir a notificaciones push si está desconectado y tratar las confirmaciones de entrega y lectura como cursores sobre esa secuencia.
> * **El resultado:** El orden y la deduplicación salen de los números de secuencia, una reconexión se convierte en "mándame todo lo posterior a la secuencia N" y la parte con estado del sistema se reduce a una capa fina de conexiones que puede fallar sin perder un solo mensaje.

El chat parece el producto más sencillo de esta serie: escribes y el otro lo ve. Por debajo, es aquel en el que los usuarios notan cada fallo. Un mensaje desordenado, un duplicado tras reconectar, un tick que dice "leído" cuando no lo fue: cada uno es un informe de error con captura de pantalla incluida.

Este artículo diseña una mensajería de conversaciones 1:1 y grupos pequeños al estilo de WhatsApp, Signal o Messenger.

---

## Requisitos y cifras

**Funcionales:** chats 1:1 y de grupo (hasta unos cientos de miembros), texto y multimedia, indicadores de enviado, entregado y leído, presencia en línea, historial en todos los dispositivos y notificaciones push cuando se está desconectado.

**No funcionales:** latencia de extremo a extremo por debajo de 500 ms para destinatarios conectados; ningún mensaje perdido después de que el remitente vea "enviado"; orden dentro de cada conversación; funcionar en redes móviles poco fiables.

| Supuesto | Valor | Derivado |
| --- | --- | --- |
| Usuarios activos diarios | 50M | |
| Mensajes por usuario y día | 40 | 2.000M mensajes/día, ~23k/s de media, ~70k/s en pico |
| Tamaño medio del mensaje (con metadatos) | ~200 bytes | ~400 GB/día antes de replicar |
| Conexiones concurrentes en pico | 15M | Con ~500k conexiones por servidor bien afinado, ~30 servidores más margen |

Las conexiones persistentes son baratas una a una, pero son muchísimas. WhatsApp contó en 2012 que tenía más de dos millones de conexiones concurrentes en un solo servidor Erlang, así que la capa de conexiones tiene menos que ver con el número bruto y más con lo bien que aguanta las tormentas de reconexión.

---

## Por qué WebSockets

| Transporte | Cómo llega el servidor al cliente | Encaje para chat |
| --- | --- | --- |
| Short polling | El cliente pregunta cada pocos segundos | Derrochador y con retraso |
| Long polling | El cliente mantiene una petición abierta hasta que hay novedades | Funciona, pero cada mensaje cuesta una petición nueva |
| Server-Sent Events | Flujo en una sola dirección desde el servidor | Sirve para recibir, pero hace falta otra ruta para enviar |
| WebSocket | Conexión bidireccional sobre un único socket TCP/TLS | Encaje natural: poco sobrecoste en ambos sentidos |

Las apps móviles usan además el canal push del sistema operativo (APNs, FCM) como señal para despertar cuando la app está en segundo plano y el socket cerrado.

---

## La arquitectura

![Arquitectura del chat: Alice y Bob se conectan por WebSocket a servidores de chat distintos; el servicio de mensajes asigna un número de secuencia y lo añade a la base de datos de mensajes, enruta por un bus de entrega que busca el servidor de Bob en el registro de sesiones, entrega en el servidor de chat de Bob, recurre a un notificador push si Bob está desconectado, y un servicio de presencia sigue los latidos](/assets/images/hld/design-chat-architecture.webp)

* **Alice / Bob.** Cada dispositivo mantiene un WebSocket abierto mientras la app está en primer plano. La unidad de conexión son los dispositivos, no los usuarios.
* **Chat Servers.** Terminan los WebSockets y apenas hacen nada más. Son la única capa con estado (tienen los sockets), así que se mantienen finos: autenticar, reenviar envíos, empujar entregas y retransmitir confirmaciones.
* **Message Service.** Sin estado. Valida el mensaje, asigna el siguiente **número de secuencia de la conversación**, lo persiste y solo entonces confirma al remitente. Es el momento del "un tick gris": cuando Alice lo ve, el mensaje es duradero.
* **Messages DB.** Particionada por conversación y ordenada por número de secuencia, para que "dame los mensajes de la conversación X posteriores a la secuencia N" sea una lectura de rango contigua. Discord describió exactamente esta forma (canal más intervalo de tiempo como partición, con IDs Snowflake dentro) en sus artículos sobre cómo guarda miles de millones, y después billones, de mensajes.
* **Delivery Bus.** Cada servidor de chat se suscribe a su propio tema. Enrutar un mensaje a Bob es publicarlo en el tema del servidor que tenga los sockets de Bob.
* **Session Registry.** `user -> [(device, server)]`, en Redis con TTL que renuevan los latidos. Responde a "¿dónde está Bob ahora mismo?".
* **Push Notifier.** Si Bob no tiene ningún socket vivo, se envía un push por APNs o FCM. El push es una pista, no la entrega: cuando la app despierta, sincroniza desde la base de datos.
* **Presence Service.** Sigue los latidos para calcular el estado en línea y la última conexión, como se ve más abajo.

La decisión de diseño clave es que **la persistencia va antes que la entrega**. Un mensaje existe desde el momento en que está en la base de datos con un número de secuencia. Todo lo demás es un intento de hacerlo llegar antes a los dispositivos.

---

## Orden, idempotencia y sincronización

Tres mecanismos pequeños hacen casi todo el trabajo de corrección:

1. **IDs de mensaje generados por el cliente.** El cliente adjunta un `client_id` único a cada envío. Si la red pierde la confirmación y el cliente reintenta, el Message Service ve el mismo `client_id` en esa conversación y devuelve el número de secuencia original en lugar de guardar un duplicado.
2. **Números de secuencia por conversación.** Un orden global entre todos los chats es innecesario y caro. Lo que los usuarios ven es el orden dentro de una conversación. Un contador por conversación (en la base de datos o en un servicio secuenciador dueño de esa partición) da un orden total y permite detectar huecos.
3. **Sincronización por cursor.** Cada dispositivo recuerda la secuencia más alta que tiene de cada conversación. Al reconectar, pide todo lo posterior. Sin ambigüedad sobre si se perdió algo, y el mismo mecanismo sirve para un móvil que vuelve tras una semana desconectado y para un portátil que acaba de despertar.

---

## Los ticks de entrega son cursores

![Secuencia de confirmaciones de entrega y lectura: Alice envía un mensaje con un client id, el servidor de chat 1 lo añade con la secuencia 1043 y devuelve un tick gris, el mensaje se enruta al servidor de chat 7 y se entrega a Bob, la confirmación de entrega de Bob produce dos ticks grises, y la actualización del cursor de lectura de Bob se guarda y produce dos ticks azules](/assets/images/hld/design-chat-ticks.webp)

| Indicador | Qué significa de verdad | Lo dispara |
| --- | --- | --- |
| Un tick gris (enviado) | Persistido en el servidor con número de secuencia | Commit del Message Service |
| Dos ticks grises (entregado) | Al menos un dispositivo del destinatario lo tiene | Confirmación del dispositivo |
| Dos ticks azules (leído) | El destinatario abrió la conversación hasta ese punto | Avance del cursor de lectura |

La nota verde es el truco que escala: **las confirmaciones de lectura son cursores, no marcas por mensaje.** El dispositivo de Bob informa de "he leído la conversación X hasta la secuencia 1043". Una sola escritura cubre todos los mensajes anteriores. En un grupo, cada miembro tiene su cursor, y "leído por 12 de 40" es un recuento sobre cursores, no 40 escrituras por mensaje.

---

## Grupos

Para grupos pequeños (hasta unos cientos de miembros), funciona el **fan-out en escritura**: tras persistir una vez en la partición de la conversación del grupo, se enruta una entrega al servidor de cada miembro conectado y se envían notificaciones push a los desconectados. El mensaje se guarda una vez; solo se multiplican las entregas.

Para canales muy grandes (de miles a millones de miembros, al estilo de los servidores de Discord o los canales de difusión), se deja de entregar a todos. Los miembros leen el log del canal al abrirlo y solo quienes lo están mirando reciben empujes en tiempo real. Es el mismo dilema push frente a pull del [artículo del news feed](/blog/es/design-news-feed-system).

---

## Presencia sin fundir el sistema

La presencia es engañosamente cara. Si cada cambio de estado se difunde a todos los contactos, un usuario que se conecta puede disparar cientos de mensajes, y una red móvil que hace parpadear su conexión los dispara una y otra vez.

* **Latidos con TTL.** Los clientes envían un latido cada 30 segundos más o menos; el usuario está en línea mientras la clave esté fresca. Una desconexión breve no lo pasa a desconectado al instante.
* **Suscribir, no difundir.** Envía actualizaciones de presencia solo de los contactos cuyo chat está abierto en la pantalla de alguien, o agrupa actualizaciones para las listas de contactos.
* **Antirrebote.** Junta en una sola actualización los cambios rápidos entre conectado y desconectado.
* **La última conexión es barata; la presencia en vivo no.** Muchos productos muestran "última vez" (una marca de tiempo leída bajo demanda) en lugar de un punto en vivo para todos.

---

## Varios dispositivos

Cada dispositivo es una conexión y un cursor distintos. Un mensaje para Bob se entrega a todos sus dispositivos conectados, y un mensaje que Bob envía desde el portátil también debe aparecer en su móvil, que no es más que otra entrega a sus propios dispositivos. Con cifrado de extremo a extremo esto se complica: el remitente cifra por separado para cada dispositivo destinatario (el enfoque del protocolo Signal que WhatsApp adoptó en 2016), así que el servidor enruta texto cifrado que no puede leer.

---

## Cifrado de extremo a extremo, en breve

Con E2EE, el servidor guarda y enruta texto cifrado opaco. Eso cambia el diseño en puntos concretos:

* La búsqueda en el servidor sobre el contenido es imposible; se busca en el dispositivo.
* La detección de spam y abusos se apoya en metadatos, denuncias y señales del cliente, no en analizar el contenido.
* El historial en un dispositivo nuevo exige una copia de seguridad cifrada o una transferencia entre dispositivos, porque el servidor no puede descifrarlo por ti.

El diseño de enrutamiento, secuencias y cursores de arriba funciona igual; nunca necesitó leer el contenido.

---

## Modos de fallo

| Fallo | Comportamiento |
| --- | --- |
| Caída de un servidor de chat | Sus sockets se cortan; los clientes reconectan (con jitter) a otro servidor y sincronizan desde sus cursores. No se pierde nada porque nada vive solo en los servidores de chat |
| Tormenta de reconexiones tras un despliegue o un corte de red | Espera exponencial con jitter en los clientes; vaciar servidores gradualmente durante los despliegues |
| Se pierde la confirmación de vuelta al remitente | El cliente reintenta con el mismo `client_id`; el servidor deduplica |
| Destinatario desconectado una semana | Notificaciones push como pistas; sincronización completa desde el cursor al abrir |
| Registro de sesiones desactualizado | La entrega a un servidor muerto agota el tiempo; se recurre al push y la sincronización lo arregla |
| Partición lenta en la Messages DB | Los envíos de esa conversación se ralentizan; las demás no se ven afectadas gracias al particionado |

---

## Lista de comprobación para producción

- [ ] Persistir antes de confirmar; "enviado" significa duradero
- [ ] IDs generados por el cliente para reintentos idempotentes
- [ ] Números de secuencia por conversación; detección de huecos en los clientes
- [ ] Sincronización por cursor en cada reconexión
- [ ] Confirmaciones de lectura guardadas como cursores, no como filas por mensaje
- [ ] Registro de sesiones con TTL renovados por latidos; push de respaldo si falla el enrutamiento
- [ ] Presencia con antirrebote y basada en suscripciones
- [ ] Reconexión con espera y jitter; vaciado gradual de conexiones al desplegar
- [ ] Paneles: p99 de envío a entrega, conexiones por servidor, tasa de reconexión, tasa de push de respaldo, duplicados detectados

---

## Lo que queda

Los ticks son la interfaz más honesta del software moderno. Un tick gris dice que el servidor lo tiene. Dos dicen que un dispositivo lo tiene. El azul dice que una persona lo miró.

Todo en este diseño existe para que esas tres pequeñas afirmaciones sean ciertas, siempre, en un tren que atraviesa un túnel. Y aun así, en algún lugar, un tick gris se quedará ahí una hora y quien envió el mensaje lo mirará fijamente, algo que ninguna arquitectura puede arreglar.

---

## Fuentes

* [Blog de WhatsApp: 1 million is so 2011 (dos millones de conexiones por servidor)](https://blog.whatsapp.com/1-million-is-so-2011)
* [Discord: How Discord Stores Billions of Messages](https://discord.com/blog/how-discord-stores-billions-of-messages)
* [Discord: How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages)
* [Signal: The Double Ratchet Algorithm](https://signal.org/docs/specifications/doubleratchet/)
* [RFC 6455: The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455)
* Relacionado en esta serie: [Diseña un sistema de notificaciones](/blog/es/design-notification-system), [Diseña un sistema de news feed](/blog/es/design-news-feed-system), [Fundamentos de WebSockets y tiempo real](/blog/es/websockets-realtime-basics)
