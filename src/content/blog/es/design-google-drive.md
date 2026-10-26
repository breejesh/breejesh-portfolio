---
title: "Diseña Google Drive: sincronización por bloques, almacenamiento direccionado por contenido, versiones y conflictos"
description: "Cómo funciona por dentro la sincronización de ficheros en la nube: dividir los ficheros en bloques con hash para que solo viajen los cambios, almacenamiento de bloques direccionado por contenido, un servicio de metadatos con diarios de cambios por espacio de nombres, notificaciones que avisan a los dispositivos, concurrencia optimista, copias en conflicto, versiones, compartición y almacenamiento frío."
date: "2026-02-10"
tags: [Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/design-google-drive.webp
previewImage: /assets/images/design-google-drive.webp
---

> **TL;DR**
> * **El problema:** Mantener idéntica la misma carpeta en un portátil, un móvil y un navegador, para decenas de millones de usuarios con gigabytes cada uno, sobre redes inestables, mientras la gente edita los mismos ficheros sin conexión y espera que nunca se pierda nada.
> * **El diseño:** Dividir los ficheros en bloques de tamaño fijo identificados por su hash, subir solo los bloques que el servidor no tiene y confirmar cada versión nueva como una lista de hashes de bloques en una base de datos de metadatos. Cada confirmación se añade a un diario de cambios por espacio de nombres; un servicio de notificaciones avisa a los demás dispositivos para que traigan los cambios posteriores a su cursor. Las confirmaciones usan concurrencia optimista, y perder una carrera produce una copia en conflicto en lugar de una sobrescritura silenciosa.
> * **El resultado:** Editar un fichero grande sube megabytes en lugar de gigabytes, el contenido idéntico se guarda una vez, los dispositivos se ponen al día con una consulta de cursor y el único escenario de pérdida de datos que queda es el que provocan los usuarios a propósito.

Un producto de sincronización hace una promesa que suena sencilla y no lo es: *la carpeta es la misma en todas partes*. Por debajo, es un sistema distribuido donde cada portátil es una réplica que pasa días desconectada, y los usuarios que la editan son quienes escriben los conflictos.

Dropbox popularizó la arquitectura que describe este artículo, y Google Drive, OneDrive e iCloud Drive resuelven el mismo problema de formas bastante parecidas.

---

## Requisitos y cifras

**Funcionales:** subir, descargar y sincronizar ficheros y carpetas entre dispositivos; historial de versiones y restauración; compartir con permisos; ediciones sin conexión que se sincronizan después; notificaciones cuando cambia el contenido compartido.

**No funcionales:** no perder nunca datos confirmados; sincronizar los cambios en segundos cuando los dispositivos están conectados; ser eficiente en redes lentas y con datos medidos; escalar a cientos de petabytes.

| Supuesto | Valor | Derivado |
| --- | --- | --- |
| Usuarios | 50M | |
| Almacenamiento medio por usuario | 10 GB | ~500 PB lógicos, antes de deduplicar y comprimir |
| Cambios de ficheros por usuario y día | ~2 | ~100M confirmaciones/día, ~1.200/s de media |
| Tamaño medio de fichero | ~500 KB, con una cola larga de ficheros de varios GB | La mayoría de confirmaciones son pequeñas; unas pocas dominan el ancho de banda |
| Dispositivos por usuario | 2 a 3 | Cada cambio lo descargan 1 o 2 dispositivos más |

---

## La arquitectura

![Arquitectura de una unidad en la nube: clientes de portátil, móvil y web llegan a un balanceador; el servicio de bloques sube y deduplica bloques direccionados por contenido en un almacén de bloques, la API de metadatos confirma versiones de ficheros en una base de datos de metadatos particionada por espacio de nombres, las confirmaciones se añaden a un diario de cambios por espacio de nombres, un servicio de notificaciones avisa a otros dispositivos de que algo cambió y los bloques antiguos pasan a un nivel frío](/assets/images/hld/design-drive-architecture.webp)

* **Cliente de sincronización del portátil.** La pieza más compleja. Vigila el sistema de ficheros, mantiene una base de datos local con lo que cree que tiene el servidor, divide los ficheros modificados en bloques, sube, confirma y aplica los cambios remotos. Dropbox reescribió el suyo (el motor "Nucleus", en Rust) precisamente porque la corrección de la sincronización es así de difícil.
* **Móvil / Web.** Normalmente no replican toda la carpeta; navegan por los metadatos y descargan ficheros bajo demanda.
* **Load Balancer.** Envía el tráfico de bloques y el de metadatos a flotas separadas, porque tienen formas distintas: cuerpos grandes en streaming frente a peticiones pequeñas y transaccionales.
* **Block Service (subida, deduplicación).** Acepta bloques direccionados por hash. Si ya existe un bloque con ese hash, se omite la subida. Admite transferencias reanudables.
* **Block Store (direccionado por contenido).** Un almacén de objetos donde la clave es el hash del bloque. Inmutable: un bloque nunca se modifica, solo se referencia o se recolecta. Dropbox trasladó en 2016 la mayor parte de este nivel desde Amazon S3 a su propio sistema de escala de exabytes, Magic Pocket.
* **Metadata API (ficheros, versiones).** El registro autoritativo del árbol: rutas, versiones, listas de bloques y permisos. Cada cambio es una transacción aquí.
* **Metadata DB (particionada por espacio de nombres).** Un espacio de nombres es la raíz de un usuario o una carpeta compartida. Particionar por espacio de nombres mantiene en un mismo fragmento todo el historial de una carpeta y su diario, así que las confirmaciones son transacciones de un solo fragmento.
* **Change Journal (por espacio de nombres).** Un log ordenado de cada confirmación en un espacio de nombres. Cada dispositivo recuerda su cursor (su posición en el diario).
* **Notification (long-poll / WebSocket).** No transporta los cambios, solo "algo cambió en el espacio de nombres N". El dispositivo pide entonces a la API de metadatos todo lo posterior a su cursor.
* **Cold tier.** Los bloques referenciados solo por versiones antiguas o por ficheros poco usados pasan a un almacenamiento más barato.

---

## Por qué los bloques lo cambian todo

![Flujo de subida y confirmación: dividir el fichero en bloques de 4 MB, calcular el hash de cada bloque, preguntar al servidor qué hashes faltan, subir solo los bloques que faltan y confirmar una versión nueva con la versión padre esperada; si el padre coincide se guarda la versión 8 y se avisa a los dispositivos, y si otra confirmación llegó antes el cliente guarda una copia en conflicto](/assets/images/hld/design-drive-upload-commit.webp)

Tratar los ficheros como objetos enteros significa que cambiar un byte de un vídeo de 1 GB vuelve a subir 1 GB. Tratarlos como listas de bloques resuelve tres problemas a la vez:

1. **Sincronización delta.** Solo viajan los bloques cambiados. Dropbox ha contado que usa bloques de 4 MB. Una edición en mitad de un fichero grande suele tocar uno o dos bloques. (Los bloques de tamaño fijo se desplazan cuando se insertan bytes al principio de un fichero; el troceado definido por contenido con un hash rodante, la idea detrás de rsync y de muchas herramientas de copia de seguridad, mantiene estables los límites a cambio de más complejidad.)
2. **Deduplicación.** Los bloques idénticos se guardan una vez, estén en la versión anterior del mismo fichero, en una copia que hizo el usuario o en el mismo instalador descargado por muchos usuarios. La deduplicación entre usuarios tiene implicaciones de privacidad: un atacante puede averiguar si un contenido ya existe observando la velocidad de subida, así que muchos servicios limitan la deduplicación a una misma cuenta.
3. **Reanudación.** Una subida fallida continúa en el siguiente bloque que falta, no desde cero.

**El protocolo de confirmación:**

1. El cliente calcula los hashes de los bloques y pregunta "¿cuáles de estos hashes te faltan?".
2. El cliente sube solo esos.
3. El cliente confirma `fichero X, nueva lista de bloques, versión padre v7`.
4. El servidor solo acepta si la versión actual sigue siendo v7, y entonces lo añade al diario.

La nota verde es la recompensa práctica. La nota roja es la regla de concurrencia que hace funcionar la siguiente sección.

---

## Conflictos: nunca elegir un ganador en silencio

Dos dispositivos editan el mismo fichero sin conexión. Los dos vuelven a conectarse. Los dos confirman con padre v7. El primero gana y se convierte en v8. El segundo recibe "conflicto: el padre ha cambiado".

¿Qué debe hacer el cliente? Todos los grandes productos de sincronización tomaron la misma decisión: **conservar ambos**. La edición perdedora se guarda al lado con un nombre como `report (Alice's conflicted copy 2026-02-10).docx`. Es feo. También es la única respuesta que nunca destruye el trabajo de nadie.

Los editores colaborativos en tiempo real (Google Docs, Office online) lo evitan de otra forma: sincronizan operaciones finas mediante transformación operacional o CRDT, no ficheros enteros. La sincronización de ficheros y la colaboración en documentos son productos distintos por algo.

Otros casos de conflicto que conviene tratar de forma explícita:

| Caso | Resolución sensata |
| --- | --- |
| Edición en un dispositivo, borrado en otro | Conservar el fichero editado; los borrados no deben destruir ediciones más nuevas |
| Renombrado en un dispositivo, edición en otro | Aplicar ambas cosas: el fichero acaba renombrado y con el contenido nuevo |
| Dos carpetas creadas con el mismo nombre | Fusionar si es seguro; si no, añadir un sufijo a una |
| Renombrados que solo cambian mayúsculas en sistemas que no las distinguen | Tratarlos con cuidado; una fuente clásica de bugs de sincronización |

---

## Versiones, restauración y borrado

Como los bloques son inmutables y las versiones son listas de hashes, el historial de versiones sale casi gratis: cada versión es una pequeña fila de metadatos. Restaurar una versión antigua es una nueva confirmación que apunta a la lista de bloques antigua.

Borrar es más difícil de lo que parece. Un bloque solo puede eliminarse cuando ninguna versión de ningún fichero lo referencia, y las versiones se conservan durante una ventana de retención (por ejemplo, 30 días o más en los planes de pago). La recolección de basura es un trabajo en segundo plano cuidadoso, con recuento de referencias o marcado y barrido sobre los metadatos, porque borrar un bloque que sigue referenciado es una pérdida de datos permanente.

---

## Compartir

Una carpeta compartida es su propio espacio de nombres, montado en el árbol de cada miembro. Los permisos viven en el espacio de nombres (lector, comentarista, editor). Como el diario y las notificaciones van por espacio de nombres, una edición de un miembro avisa a los dispositivos de todos los miembros exactamente por la misma ruta que los cambios propios de un usuario.

Los enlaces ("cualquiera con el enlace") son una concesión aparte y revocable, con caducidad y contraseña opcionales, que la API de metadatos comprueba en cada acceso.

---

## Modos de fallo

| Fallo | Comportamiento |
| --- | --- |
| Subida interrumpida | Reanudar en el siguiente bloque que falta |
| La confirmación funciona, pero el cliente cae antes de registrarla | Al reiniciar, el cliente consulta el diario y ve su propia confirmación |
| Servicio de notificaciones caído | Los clientes vuelven a consultar su cursor periódicamente |
| Fragmento de metadatos caído | Ese espacio de nombres no puede confirmar; los demás no se ven afectados. Los clientes encolan los cambios locales |
| Bloque corrupto en el almacenamiento | La discrepancia de hash se detecta al leer; se repara desde una réplica o desde fragmentos con códigos de borrado |
| Un bug del cliente lo borra todo en local | El historial de versiones del servidor y la papelera permiten recuperarlo; limita y confirma los borrados masivos |

---

## Lista de comprobación para producción

- [ ] Hash de bloques y negociación de bloques que faltan antes de subir
- [ ] Almacenamiento de bloques direccionado por contenido e inmutable, con comprobación de integridad al leer
- [ ] Metadatos particionados por espacio de nombres; confirmaciones como transacciones de un solo fragmento
- [ ] Concurrencia optimista con versiones padre; copias en conflicto, nunca sobrescrituras silenciosas
- [ ] Diario de cambios por espacio de nombres y cursores por dispositivo
- [ ] Notificaciones como pistas con consulta periódica de respaldo
- [ ] Política de retención de versiones y recolección de basura segura y auditada
- [ ] Protección frente a borrados masivos y papelera
- [ ] Paneles: latencia de sincronización (de la confirmación a su aplicación en otro dispositivo), tasa de conflictos, bytes de subida ahorrados por deduplicación, retraso del diario

---

## Lo que queda

La magia de una carpeta sincronizada es que la gente olvida que existe. Guardan un fichero en el portátil por la noche y lo abren en el móvil por la mañana sin pensar en los cientos de bloques, hashes, diarios y cursores que hay en medio.

El día que recuerdan que existe suele ser el día en que hizo una copia en conflicto. Nombre feo, ambas versiones intactas. Ese fichero es el sistema cumpliendo su única promesa real.

---

## Fuentes

* [Dropbox Tech Blog: Rewriting the heart of our sync engine (Nucleus)](https://dropbox.tech/infrastructure/rewriting-the-heart-of-our-sync-engine)
* [Dropbox Tech Blog: Inside the Magic Pocket](https://dropbox.tech/infrastructure/inside-the-magic-pocket)
* [Dropbox Tech Blog: Streaming file synchronization](https://dropbox.tech/infrastructure/streaming-file-synchronization)
* [Ayuda de Dropbox: copias en conflicto](https://help.dropbox.com/organize/conflicted-copy)
* [Tridgell y Mackerras, "The rsync algorithm"](https://rsync.samba.org/tech_report/)
* Relacionado en esta serie: [Diseña un almacén clave-valor](/blog/es/design-key-value-store), [Diseña una plataforma de vídeo a escala YouTube](/blog/es/design-youtube-streaming), [Diseña un sistema de notificaciones](/blog/es/design-notification-system)
