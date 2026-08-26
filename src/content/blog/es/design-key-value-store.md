---
title: "Diseñar un almacén clave-valor como un guardarropa: put, get, CAP y quórums"
description: "Guía para principiantes de almacenes clave-valor distribuidos. Put y get como guardar y buscar, CAP con una historia simple, particiones como libros en estantes, réplicas como copias y quórums como bibliotecarios que deben acordar."
date: "2025-10-28"
tags: [Diseño de Sistemas y Arquitectura, Backend y Bases de Datos]
coverImage: /assets/images/design-key-value-store.webp
previewImage: /assets/images/design-key-value-store.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Guía para principiantes de almacenes clave-valor distribuidos. Put y get como guardar y buscar, CAP con una historia simple, particiones como libros en estantes, réplicas como copias y quórums como bibliotecarios que deben acordar.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Imagina un guardarropa gigante en un estadio. Entregas tu abrigo. Te dan un ticket con un número. Más tarde muestras el ticket y recuperas el mismo abrigo. Eso es un **almacén clave-valor** en la vida real.

- La **clave** es el número del ticket.
- El **valor** es el abrigo.
- **put** significa guardar este abrigo bajo este ticket.
- **get** significa recuperar el abrigo de este ticket.

No necesitas saber cómo está organizado el perchero. Solo necesitas una regla fiable: mismo ticket, mismo abrigo.

Los ordenadores usan la misma idea. Redis, Memcached, sistemas al estilo Dynamo y muchas capas de metadatos de productos empiezan aquí. Dos verbos, mucha ingeniería detrás.

Este post enseña esa ingeniería como lo haría un buen profesor: primero la imagen, luego los nombres difíciles solo cuando importan.

---

## Los dos verbos: guardar y buscar

Un almacén clave-valor es una base de datos con una interfaz minúscula.

| Verbo | Significado cotidiano | Qué hace |
| --- | --- | --- |
| `put(key, value)` | Guardar | Guardar o reemplazar el valor de esta clave |
| `get(key)` | Buscar / recuperar | Devolver el valor, o decir con claridad "no encontrado" |

Las claves son únicas. Los valores pueden ser cualquier cosa lo bastante pequeña para tu diseño: una sesión, un JSON, un contador, la foto de un carrito. En la versión de entrevista, los valores suelen ser unos pocos kilobytes, no películas enteras.

Opcional más tarde: borrar, caducar con un temporizador (TTL), "escribir solo si la clave sigue en la versión X." Déjalos fuera hasta que el camino central funcione.

**Cajones etiquetados:** imagina una pared de cajones. Cada cajón tiene una etiqueta (clave). Dentro hay un objeto (valor). Put abre el cajón y guarda. Get abre el cajón y mira. Ese modelo mental basta para empezar.

---

## Por qué un solo ordenador no alcanza

En una sola máquina, el almacén puede ser un mapa hash en memoria. Perfecto para demos y cachés minúsculas.

Luego llega la realidad:

1. El mapa ya no cabe en RAM.
2. La máquina se reinicia y todo se pierde si no escribiste también a disco.
3. Una máquina no puede contestar un millón de peticiones por segundo para siempre.
4. Un edificio se queda sin luz y el producto entero cae.

Así que añades muchas máquinas. Ahora tienes un problema nuevo: **qué máquina guarda cada clave**, y **qué pasa si esa máquina muere**.

Esa es toda la historia de un almacén clave-valor *distribuido*.

---

## Catálogo de biblioteca: encontrar el estante correcto

Una biblioteca no tira todos los libros en un montón. Usa un catálogo y un plan de estantes.

- El **catálogo** te dice dónde vive un libro.
- Los libros se **reparten entre estantes** para que ninguno cargue con toda la biblioteca.
- Los libros populares tienen **copias extra** para que más gente pueda sacar uno.

Un almacén clave-valor distribuido hace los mismos tres trabajos:

| Idea de biblioteca | Idea de sistema | Por qué existe |
| --- | --- | --- |
| Regla del catálogo para "qué estante" | **Particionado** (a menudo con hashing consistente) | Repartir claves entre máquinas |
| Copias extra de un libro | **Replicación** | Sobrevivir a fallos y servir más lecturas |
| Normas del personal para préstamo y devolución | **Quórums y política de consistencia** | Decidir cuándo un write o un read "cuenta" |

Guarda esa tabla en la cabeza. Casi cada caja que dibujes vuelve a ella.

---

## CAP, contado con una historia simple

Diriges un guardarropa con **tres mostradores** que deben mantenerse sincronizados por walkie-talkie. Llámalos A, B y C. Un invitado puede acercarse a cualquiera.

Ahora se rompen las radios. El mostrador C ya no puede hablar con A y B. Siguen llegando invitados. Tienes que elegir una política.

### Opción 1: Todo el mundo ve siempre la misma respuesta

Congelas el lado roto. El mostrador C deja de aceptar abrigos hasta que las radios vuelvan. A y B también pueden rechazar operaciones arriesgadas hasta estar seguros.

Los invitados en C oyen: "Lo siento, el sistema está partido. Vuelve más tarde."

Nadie recibe dos historias distintas sobre el ticket 42. El precio es que algunos invitados **no obtienen respuesta** durante el corte.

En lenguaje CAP esto se inclina a **CP**: preferir **consistencia** bajo una **partición**. Bancos y libros de contabilidad suelen querer este sabor. Mostrar el saldo equivocado es peor que un "inténtalo de nuevo" temporal.

### Opción 2: Alguien siempre obtiene una respuesta aunque la red se rompa

Los mostradores A y B siguen aceptando abrigos. El C también, con lo que aún sepa. Los invitados siempre reciben ticket y respuesta.

Más tarde las radios se curan. El personal descubre que el ticket 42 tiene dos abrigos distintos en dos mostradores. Alguien debe fusionar, elegir un ganador o pedir al invitado que resuelva el lío.

En lenguaje CAP esto se inclina a **AP**: preferir **disponibilidad** bajo una **partición**. Carritos, sesiones y muchas cachés de producto eligen esto y reparan después.

### Qué significan las letras en palabras llanas

| Letra | Significado sencillo |
| --- | --- |
| **C** Consistency | Los clientes sanos ven la misma respuesta al día (forma fuerte) |
| **A** Availability | Los nodos vivos siguen contestando peticiones |
| **P** Partition tolerance | El sistema tiene un plan cuando los nodos no pueden hablar |

En un sistema multi-máquina real, las redes fallan. Hay que vivir con **P**. La elección viva suele ser **cuánto te apegas a C frente a A cuando la red está enferma**.

No hay un botón gratis de "siempre perfecto, siempre abierto, siempre a prueba de cerebro partido." En entrevistas gusta oírte preguntar: *¿qué es peor para este producto, una respuesta temporalmente incorrecta o ninguna respuesta?*

---

## Particionado: repartir los libros entre estantes

No puedes poner cada clave en cada máquina sin un coste enorme. **Particionas** (haces shards) el espacio de claves.

Imagen cotidiana: el estante 1 tiene tickets 1-1000, el 2 tiene 1001-2000, y así. En informática la regla suele ser más inteligente que rangos fijos para la mayoría de diseños clave-valor.

### Hashing consistente en una frase

Imagina servidores de pie en un círculo grande (un "anillo de hash"). Hasheas cada clave al mismo círculo. Caminas en el sentido de las agujas del reloj hasta chocar con un servidor. Ese servidor es dueño de la clave.

Por qué gusta:

- Cuando un servidor entra o sale, **solo se mueven las claves cercanas**, no casi todas.
- Con **nodos virtuales**, una máquina grande puede poseer más puntos del anillo que una pequeña, y la carga se reparte mejor.

No necesitas toda la matemática para diseñar en pizarra. Necesitas la intención: **propiedad estable de las claves con el mínimo reordenamiento**.

Las claves calientes siguen doliendo. Una clave de celebridad cae en un único sitio primario. Cachés delante, un diseño de clave más listo o un plan dedicado para el camino caliente ayudan. El anillo solo no arregla la fama.

---

## Replicación: copias para que un incendio en un estante no sea fatal

Si el ticket 42 vive en una sola máquina y esa máquina muere, el abrigo se va. Las bibliotecas guardan varias copias de libros populares. Los sistemas clave-valor guardan **N réplicas**.

Valor por defecto típico en entrevista: **N = 3**. Tres copias de cada clave en tres máquinas distintas, idealmente en racks o zonas distintas para que un corte de luz no borre todas las copias.

Regla de colocación tras encontrar el primer servidor del anillo: avanza y elige las siguientes **N máquinas distintas**.

La replicación compra:

1. **Durabilidad** si muere un disco.
2. **Disponibilidad** si un nodo está caído.
3. **Escala de lectura** si muchos lectores pueden golpear copias distintas.

También crea un nuevo dolor de cabeza: las copias pueden **discrepar** un tiempo. Por eso importan CAP y los quórums.

---

## Quórum: la mayoría de bibliotecarios debe acordar

Tres bibliotecarios tienen copias de la misma ficha. Necesitas una regla para cuándo un ingreso o una consulta está "hecho."

| Símbolo | Significado sencillo |
| --- | --- |
| **N** | Cuántas copias existen |
| **W** | Cuántas copias deben confirmar una **escritura** para dar éxito |
| **R** | De cuántas copias debes oír en una **lectura** |

Un **coordinador** (cualquier nodo que recibió la petición del cliente) pregunta al conjunto de réplicas y cuenta respuestas.

### La regla de solapamiento de oro

Si **W + R > N**, una lectura exitosa y una escritura exitosa deben compartir al menos una copia en estado estable. Esa copia debería haber visto la última escritura exitosa. Obtienes **consistencia más fuerte**.

Ejemplos con **N = 3**:

| W | R | Sensación |
| --- | --- | --- |
| 1 | 1 | Rápido y frágil. Lecturas caducadas más probables. |
| 2 | 2 | Default común. Mayoría de acuerdo en write y read. |
| 3 | 1 | Escrituras muy cuidadosas, lecturas rápidas. Aún débil si R es minúsculo y responde una copia atrasada. |
| 1 | 3 | Escrituras rápidas, lecturas cuidadosas que preguntan a todos. |

**Importante:** W = 1 **no** significa "guardar solo una copia." Significa "decir al cliente éxito tras una confirmación," mientras otras copias aún pueden estar poniéndose al día.

La latencia sigue al **miembro más lento del quórum**, no al más rápido. Subes W o R y la consistencia mejora; la latencia de cola suele empeorar.

En forma de historia: para archivar una ficha nueva, dos de tres bibliotecarios deben sellarla (W = 2). Para contestar a un visitante, dos de tres deben reportar la ficha que tienen (R = 2). Si sus historias chocan, resuelves versiones (siguiente sección) antes de hablar.

---

## Cuando las copias discrepan: versiones

Dos invitados actualizan el ticket 42 a la vez en lados distintos de una partición de red. Ambas escrituras tienen éxito con una política laxa. Ahora hay dos "verdades."

Simple pero tosco: **gana la última escritura** por marca de tiempo. Los relojes pueden mentir con desfase, así que puedes borrar en silencio una actualización real.

Más cuidadoso: **relojes vectoriales** (o vectores de versión similares) rastrean *quién* vio *qué*. Si una versión viene claramente después de la otra, te quedas con el linaje posterior. Si divergen, tienes **hermanos**: conflicto real. La app fusiona (los ítems del carrito se combinan) o muestra ambos.

Para muchas claves de producto, last-write-wins es lo que se envía a producción porque la pérdida silenciosa es aceptable. Para carritos y estado colaborativo, fusionar hermanos es más seguro. Di la regla del producto en voz alta.

---

## Qué pasa cuando un bibliotecario está enfermo

### Corte corto: quórum laxo y hinted handoff

Las reglas estrictas pueden bloquearlo todo si demasiadas réplicas preferidas están caídas. El **quórum laxo** (sloppy quorum) mantiene el mostrador abierto: para un write, toma las primeras **W máquinas sanas** de la lista de preferencia, aunque no sean las dueñas habituales. Un vecino puede guardar una nota: "este abrigo pertenece al mostrador C." Cuando C vuelve, el vecino **entrega** la nota. Eso es **hinted handoff**.

### Deriva larga: anti-entropía y árboles de Merkle

Las pistas arreglan parpadeos. El aislamiento largo necesita reparación en segundo plano. Las réplicas comparan datos con eficiencia usando **árboles de Merkle** (árboles de hash): si dos raíces coinciden, ese rango coincide. Si no, bajan por los hijos y solo sincronizan los cubos que difieren. Copias la **diferencia**, no toda la biblioteca.

### Gossip para la membresía

Los nodos necesitan una idea compartida de quién está vivo. Hacen **gossip**: de vez en cuando intercambian membresía y latidos con pares al azar. No hace falta una sola "máquina jefa" para ese dibujo, aunque en operaciones reales a menudo se añade un plano de control.

---

## Cómo viajan put y get de punta a punta

### put(key, value) - guardar el abrigo

1. El cliente envía put a un coordinador (cualquier nodo, o un balanceador elige uno).
2. El coordinador hashea la clave y encuentra la lista de preferencia de N máquinas.
3. Reenvía la escritura a esas máquinas (o a sustitutos sanos bajo quórum laxo).
4. Espera **W** acks exitosos.
5. Devuelve éxito, o error si el quórum nunca se forma.

En cada réplica que acepta el write, un camino durable habitual es:

1. Añadir al **commit log** en disco (sobrevivir al crash del proceso).
2. Actualizar una estructura en memoria (**memtable**).
3. Más tarde **volcar** a ficheros ordenados en disco (**SSTables**).
4. La **compactación** en segundo plano fusiona ficheros y limpia claves borradas.

### get(key) - recuperar el abrigo

1. El coordinador encuentra la lista de preferencia.
2. Lee hasta obtener **R** respuestas (o sustitutos sanos).
3. Si las versiones chocan, las resuelve.
4. Opcionalmente repara copias atrasadas (**read repair**).
5. Devuelve el valor o not-found.

Trucos locales de lectura que puedes nombrar: mirar memoria primero, usar **filtros de Bloom** para saltar ficheros de disco que no pueden contener la clave, fusionar versiones, aplicar borrados.

---

## Forma de la arquitectura (un dibujo)

```
Cliente
  |
  v
Coordinador (cualquier nodo puede jugar este rol)
  |
  +---> N réplicas de esta clave (en el anillo de hash)
  |
  +---> Gossip / membresía
  |
  +---> Almacenamiento local (commit log + memtable + SSTables)
```

Propiedades que vale la pena decir en una entrevista:

- La API del cliente se queda en **get/put**.
- **No hay un único maestro para todo el espacio de claves**. Cada clave tiene su lista de preferencia.
- Cada nodo puede coordinar, almacenar, reparar y hacer gossip. Roles simétricos simplifican operaciones.
- Añadir un nodo actualiza el anillo y transmite los rangos de claves que debe poseer.

---

## Qué optimiza este diseño

Este boceto clásico al estilo Dynamo se inclina a **AP con consistencia ajustable**:

- Se esperan particiones.
- El sistema prefiere seguir contestando.
- Ajustas el cuidado de lecturas y escrituras con **N, W, R**.

Si el producto es un saldo de pago, puedes elegir una historia más estricta y aceptar más rechazos bajo fallo. Si es un blob de sesión o una caché de feature flags, la disponibilidad suele ganar.

---

## Intuición de capacidad (di números redondos en voz alta)

Estilo pizarra, no un plan financiero:

- Valor medio 1 KB, clave pequeña, algo de metadatos → unos 1,3 KB en disco por ítem antes de las copias.
- 1000 millones de claves → unos 1,3 TB en bruto. Con N = 3 y overhead de ficheros, planifica varios TB de almacenamiento útil del clúster.
- 100k QPS de lectura y 10k de escritura: dimensiona el fan-out. Cada write puede tocar N máquinas; el cliente espera a W.
- El tráfico entre zonas es una línea de coste real, no magia gratis.

Equivocarte por 2x está bien. Olvidar la replicación o la carga pico no.

---

## Historias de fallo para narrar

1. **Una réplica caída:** quórum laxo y pistas mantienen put/get; handoff al recuperarse.
2. **Dos de tres caídas (N = 3, W = 2):** las escrituras pueden fallar hasta reunir W. Habla de política temporal frente a rechazar writes.
3. **Partición de red:** AP sigue en ambos lados; los conflictos aparecen al curar. CP congela el lado inseguro.
4. **Réplica lenta:** la latencia del quórum sigue a la respuesta W-ésima o R-ésima, no a la más rápida.
5. **Disco lleno en un nodo:** ese nodo se descarga o muere; el anillo y la reparación deben mover rangos.

Si puedes recorrer put y get bajo "un nodo caído" y "dos versiones divergieron," tienes el núcleo de la entrevista.

---

## Chuleta de mandos

| Mando | Qué cambia |
| --- | --- |
| N | Cuántas copias; durabilidad y coste de almacenamiento |
| W / R | Consistencia frente a latencia |
| Número de nodos virtuales | Qué tan suave se reequilibra la carga |
| Colocación multi-zona | Sobrevivir a cortes mayores frente a más latencia de write |
| Vida de las pistas | Cuánto tiempo los titulares temporales guardan datos ajenos |
| Agenda de reparación | Qué tan rápido se limpia la deriva frente a ancho de banda de fondo |

---

## Resumen para un amigo

Un almacén clave-valor es un **guardarropa gigante**: ticket entra, abrigo sale. **put** guarda, **get** recupera.

Una máquina es un solo armario. Muchas máquinas necesitan un **plan de biblioteca**: repartir libros entre estantes (**particionado**), guardar copias de repuesto (**replicación**) y hacer que el personal acuerde con reglas claras (**quórums**).

Cuando fallan los walkie-talkies entre mostradores, eliges: **la misma respuesta para todos** (aunque algunos invitados esperen) o **responder siempre a alguien** (aunque limpies desajustes después). Esa elección es CAP bajo una partición.

Con tres bibliotecarios, **N** es cuántos tienen la ficha, **W** cuántos deben sellar un write, **R** a cuántos preguntas en un read. Si W + R > N, un buen read debería ver un buen write.

Las copias a veces discrepan. Arregla huecos cortos con handoffs y pistas. Arregla la deriva larga con reparación en segundo plano. Mantén la API del cliente minúscula para que el trabajo duro se quede dentro del clúster.

Eso es un almacén clave-valor distribuido: no un mapa hash mágico en la red, sino un plan de estantes, un plan de copias y un reglamento del personal para los días en que algo se rompe.