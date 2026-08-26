---
title: "Diseñar un generador de IDs únicos: UUID, ticket servers y Snowflake"
description: "IDs únicos para principiantes: por qué un contador de una sola base falla con muchos escritores, luego UUID, ticket servers y Snowflake como hora más número de máquina más contador, como un recibo, incluyendo relojes que saltan hacia atrás."
date: "2025-11-16"
tags: [Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/design-unique-id-generator.webp
previewImage: /assets/images/design-unique-id-generator.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** IDs únicos para principiantes: por qué un contador de una sola base falla con muchos escritores, luego UUID, ticket servers y Snowflake como hora más número de máquina más contador, como un recibo, incluyendo relojes que saltan hacia atrás.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Cada pedido, tuit, foto y mensaje de chat necesita un nombre que no comparta con nada más. Ese nombre es un **ID único**. En un solo portátil es fácil: empieza en 1, luego 2, luego 3. A escala de empresa, muchas máquinas inventan nombres al mismo tiempo. Dos máquinas nunca deben inventar el mismo nombre.

Piensa en los números de cheque del banco, la máquina de turnos de una panadería y el recibo de una tienda. Cada sistema resuelve "dame el siguiente número único" de otra forma. Este post usa esas imágenes cotidianas para que la versión informática deje de parecer misteriosa.

---

## ¿Qué problema resolvemos?

Cuando creas un usuario o un pedido, el sistema asigna un ID. Luego, cada servicio busca "pedido 91827364" y espera exactamente una fila.

Los buenos IDs suelen necesitar:

| Necesidad | En lenguaje sencillo |
| --- | --- |
| Único | Ninguna pareja de cosas recibe el mismo ID |
| Rápido | Crear un ID no debe ser lo lento del checkout |
| A menudo numérico | Cabe en una columna entera de la base |
| A menudo casi ordenado por tiempo | Los IDs nuevos son mayores; feeds e índices se portan mejor |

Los huecos casi siempre están bien. No necesitas cada entero. Necesitas cero colisiones.

Para el resto del post queremos **números de 64 bits** (caben en un `BIGINT` SQL normal), únicos en todo el producto y más o menos ordenados por tiempo.

---

## Por qué el auto-increment de una sola BD falla cuando muchas máquinas escriben

Una clave primaria auto-increment en una sola base es como **un solo talonario de cheques en una sucursal**. El banco sella el cheque 1, luego el 2, luego el 3. Perfecto, porque solo hay un sello.

Los problemas empiezan al crecer:

1. **Muchos escritores.** Partes los datos en varias bases. Cada una quiere su contador. Dos contadores dicen "el siguiente es 7." Colisión.
2. **Muchos servidores de app.** Veinte pods insertan filas. Si una sola base posee el contador, ese contador es la cola donde todos esperan.
3. **Regiones lejanas.** Un servidor en India esperando un contador en EE. UU. paga latencia de red en cada create.
4. **Failover.** Si la máquina que "sabe el siguiente número" muere a mitad de un cambio, dos lados pueden reutilizar un rango por accidente.

Puedes dar a cada shard su propia secuencia (el usuario 1001 vive en el shard A con IDs locales). Sirve en algunos productos. **No** te da un orden global entre shards sin más trabajo.

Resumen: un sello es seguro y se vuelve lento a escala. Muchos sellos necesitan una regla más inteligente.

---

## Opción 1: UUID (números de pasaporte al azar)

Un **UUID** es un identificador largo, normalmente 128 bits. La forma string habitual es:

```
09c93e62-50b4-468d-bf8a-c07e1040bfb2
```

**Comparación cotidiana:** cada teléfono o servidor inventa un número de pasaporte tirando muchos dados. Nadie llama a una oficina central. La probabilidad de que dos personas saquen el mismo número completo es minúscula a escala de producto normal.

**Por qué gusta**

- Cualquier máquina puede acuñar un ID offline: teléfono, portátil, pod en la nube.
- Sin contador compartido. Sin una sola máquina a saturar.
- Escalar en horizontal es gratis.

**Por qué entrevistas y bases a menudo se resisten**

- 128 bits, no 64. Claves más anchas y más almacenamiento que un entero simple.
- Los UUID aleatorios (versión 4) no crecen con el tiempo. El índice recibe inserts en orden aleatorio, lo que puede ralentizar páginas y malgastar caché.
- La string con guiones es fea si querías "solo números."

Hay un estilo más nuevo (**UUIDv7**) que mete el tiempo al frente para que los IDs ordenen más o menos por creación. Sigues pagando 128 bits.

**Cuándo gana UUID:** IDs generados en el cliente, apps offline, o equipos cómodos con claves de 128 bits.

---

## Opción 2: Ticket server (una máquina de turnos de panadería)

Un **ticket server** es un sistema pequeño cuya única tarea es entregar el siguiente número. Flickr describió una versión famosa hace años: una base diminuta hace auto-increment y devuelve el nuevo id. Cada app pregunta: "¿Cuál es el siguiente?"

**Comparación cotidiana:** la máquina de papel de turnos en la panadería. Todos sacan ticket de la misma máquina. Los números siguen únicos. Si la máquina se atasca, la cola se para.

**Por qué gusta**

- IDs numéricos cortos y simples.
- Fácil de explicar y depurar.
- Suficiente para tasas de escritura pequeñas y medias.

**Por qué duele con mucha carga**

- Cada create depende de esa máquina (o de un par pequeño). Si fallan los tickets, fallan los creates.
- Dos máquinas de tickets necesitan una regla de reparto (impares y pares, o rangos) para no colisionar. Eso reintroduce riesgo de configuración.
- El techo de throughput es más o menos "cuánto aguanta un contador."

**Mejora habitual: repartir un bloque de tickets.** En lugar de pedir un número por pedido, cada servidor de app recibe un rango, por ejemplo del 5000 al 5999. Lo consume en local. La máquina de tickets se llama poco. Eso se acerca a cómo muchas producciones asignan IDs.

Aun así, alguien central es dueño de los rangos. Ese es el trade-off.

---

## Opción 3: Snowflake (recibo: hora + máquina + contador)

**Snowflake** (el diseño al estilo Twitter, no el almacén en la nube) construye un ID de 64 bits con tres ideas:

1. **Cuándo** se hizo (timestamp).
2. **Qué máquina** lo hizo (worker o id de máquina).
3. **Qué cuenta** en esa máquina en esa rebanada minúscula de tiempo (sequence).

**Comparación cotidiana:** el recibo de una tienda.

- Primero se imprime la fecha y la hora.
- Luego el número de caja (caja 3 frente a caja 7).
- El contador local de esa caja en ese momento cierra la línea.

Dos cajas pueden imprimir ambas "ítem 4" en el mismo segundo. El recibo sigue único porque el número de caja difiere. Una sola caja que imprime dos ítems en el mismo milisegundo sube el contador local.

Un layout de enseñanza habitual:

```
Estructura de Bits: [1-bit Sin Uso] [41-bits Timestamp] [5-bits Datacenter] [5-bits Worker] [12-bits Secuencia]
```

| Desplazamiento | Nombre del Campo | Tamaño | Propósito |
| --- | --- | --- | --- |
| Bit 63 | Bit de signo sin uso | 1 bit | Fijado en `0` para mantener el número positivo |
| Bits 62-22 | Timestamp | 41 bits | Milisegundos transcurridos desde la época personalizada (hasta 69 años) |
| Bits 21-17 | ID Datacenter | 5 bits | Índice de centro de datos o región (0-31) |
| Bits 16-12 | ID Worker | 5 bits | ID de instancia de máquina/proceso (0-31) |
| Bits 11-0 | Secuencia | 12 bits | Contador incremental por milisegundo (0-4095) |

| Pieza | Bits | Rol en lenguaje sencillo |
| --- | --- | --- |
| Sin uso / signo | 1 | Mantener el número positivo |
| Timestamp | 41 | Milisegundos desde una fecha de inicio elegida (el lanzamiento del producto, no hace falta 1970) |
| Datacenter | 5 | Qué edificio o región (hasta 32) |
| Worker | 5 | Qué máquina en ese edificio (hasta 32) |
| Sequence | 12 | Contador dentro de ese milisegundo en ese worker (hasta 4096) |

Algunos equipos unen datacenter y worker en un id de máquina de 10 bits. La idea es la misma: **hora + número de máquina + contador**.

### Por qué encaja con los objetivos habituales

- Cabe en 64 bits.
- Único si los worker ids siguen únicos y la sequence nunca envuelve en el mismo milisegundo en el mismo worker.
- Más o menos ordenado por tiempo: timestamps mayores hacen IDs mayores (si los relojes son honestos).
- Alto throughput: miles de IDs por milisegundo por máquina en teoría. Los límites reales suelen ser CPU y cómo sirves la API.

### Números de capacidad que conviene saber

- 41 bits de milisegundos son unos **69 años** desde tu fecha de inicio. Elige un inicio cerca del lanzamiento para no tirar décadas vacías.
- 12 bits de sequence son **4096** IDs por worker por milisegundo. Si necesitas más, espera al siguiente milisegundo.
- Los worker ids no deben colisionar. Dos procesos que comparten el worker "7" pueden acuñar el mismo ID. Asigna workers con cuidado (config, lease desde un coordinador, o un mapa fijo).

### Boceto mínimo de encode (un proceso)

```python
import time
import threading

class Snowflake:
    def __init__(self, datacenter_id: int, worker_id: int, epoch_ms: int):
        assert 0 <= datacenter_id < 32
        assert 0 <= worker_id < 32
        self.datacenter_id = datacenter_id
        self.worker_id = worker_id
        self.epoch_ms = epoch_ms
        self.sequence = 0
        self.last_ms = -1
        self.lock = threading.Lock()

    def next_id(self) -> int:
        with self.lock:
            now = int(time.time() * 1000)
            if now < self.last_ms:
                raise RuntimeError("clock went backwards")
            if now == self.last_ms:
                self.sequence = (self.sequence + 1) & 0xFFF
                if self.sequence == 0:
                    while now <= self.last_ms:
                        now = int(time.time() * 1000)
            else:
                self.sequence = 0
            self.last_ms = now
            ts = now - self.epoch_ms
            return (
                (ts << 22)
                | (self.datacenter_id << 17)
                | (self.worker_id << 12)
                | self.sequence
            )
```

Notas:

- Un inicio personalizado hace que el campo de 41 bits dure más desde el día uno.
- El lock protege la sequence dentro de un proceso. Dos procesos en una caja necesitan dos worker ids.
- Si se agota la sequence, espera. No envuelvas y reutilices números en el mismo milisegundo.

---

## Problemas de reloj en lenguaje sencillo

Snowflake confía en el tiempo. Los relojes de computadoras reales a veces fallan.

### Relojes que saltan hacia atrás

Los servidores sincronizan la hora con NTP. A veces el reloj se mueve con suavidad (bien). A veces lo empujan hacia atrás de un golpe (peligroso para generadores de IDs).

Imagina que la impresora de recibos cree que son las 3:00:10, imprime un lote, y luego el reloj de pared se fuerza a 3:00:05. Si vuelves a imprimir con el mismo número de caja y el contador local reiniciado a cero, reimprimes números ya usados. Eso es una **colisión**.

Hábitos seguros:

1. **Negarte a acuñar** hasta que el reloj pase la última hora que usaste.
2. **Dormir unos milisegundos** si solo vas un poco atrás.
3. Llevar una **última hora lógica**: si el reloj de pared retrocede un poco, sigue con la última hora conocida y gasta sequence; si se agota, espera.
4. Los relojes monotónicos (temporizadores que solo avanzan en una máquina) ayudan al ritmo interno, pero el campo timestamp sigue necesitando una idea compartida de hora de pared para ordenar entre máquinas.

### Congelaciones y reinicios

Un proceso puede pausarse (recolección de basura, pausa de VM) y despertar más tarde. Al reiniciar, no reutilices un triple viejo (worker, milisegundo, sequence). Si guardas una marca de agua por worker, espera hasta que el tiempo actual supere esa marca.

### Ciudades distintas, relojes distintos

Los IDs se ordenan según los relojes que los crearon. La región A puede ir unos milisegundos desfasada de la B. Un evento que ocurrió primero en B puede obtener un ID mayor si el reloj de B va adelantado. Para un orden global estricto hacen falta otras herramientas. En la mayoría de productos, "casi ordenado" basta. Dil o con honestidad.

### Higiene operativa

- Corre sincronización de tiempo (chrony o ntpd) en cada worker de IDs.
- Alerta por offsets grandes y por pasos bruscos.
- No pongas la hora a mano en un generador en vivo.
- Algunos equipos generan IDs solo en un conjunto pequeño de máquinas bien vigiladas.

---

## Dónde vive el generador

| Ubicación | Fuerza | Debilidad |
| --- | --- | --- |
| Librería dentro de cada servicio | Más rápido, sin hop extra | Cada proceso necesita un worker id único |
| Sidecar local | Una implementación, aún cerca | Ligado al ciclo de vida del pod |
| API central de mint | Fácil de auditar | Latencia de red y riesgo de caída compartida |
| Rangos centrales, consumo local | A menudo el punto medio práctico | No perder rangos de forma insegura |

Altas tasas de escritura suelen preferir **Snowflake in-process con worker ids cuidadosos**. Objetos de admin de bajo ritmo van bien con un ticket server o una secuencia de base normal.

---

## Notas de seguridad (breves)

- Los IDs secuenciales o ordenables por tiempo filtran volumen y timing aproximado. No los trates como tokens secretos. Autoriza siempre con auth real.
- A veces guardas ids Snowflake internos y muestras al usuario un id público aleatorio aparte.
- Los ids cargados de timestamp pueden insinuar cuándo se creó algo. Trata logs y URLs con eso en mente.

---

## Comparación lado a lado

| Enfoque | Imagen cotidiana | Bits | Orden temporal | Coordinación | Fallo principal |
| --- | --- | --- | --- | --- | --- |
| Auto-increment de BD | Un talonario de cheques | 64 | Sí en un primary | Una base | Esa base es el cuello de botella |
| UUID v4 | Pasaportes al azar | 128 | No | Ninguna | Inserts aleatorios en el índice |
| UUID v7 | Pasaporte con fecha al frente | 128 | Sí | Ninguna (reloj local) | Claves más anchas |
| Ticket server | Máquina de turnos de panadería | 64 | Sí | Tickets centrales | La máquina se atasca, la cola para |
| Snowflake | Recibo: hora + caja + contador | 64 | Más o menos sí | Worker ids únicos | Saltos de reloj, worker id compartido |

---

## Resumen que puedes contar a un amigo

Imagina que cada pedido nuevo necesita un número de ticket único.

- **Un contador de una base** es un sello en una sucursal. Seguro hasta que muchas sucursales sellan a la vez, o hasta que todos hacen cola en el mismo sello.
- **UUID** es tirar dados por un pasaporte largo. Sin oficina central. El número es grande y a menudo aleatorio, así que los índices de la base pueden desordenarse.
- **Ticket server** es la máquina de la panadería. Todos sacan del mismo sitio. Los números se mantienen limpios. Si la máquina muere, nadie recibe número salvo que repartas bloques de tickets por adelantado.
- **Snowflake** es un recibo de tienda: **hora + número de máquina + contador local**. Las máquinas trabajan en paralelo sin llamar a casa cada vez. Debes dar a cada máquina su propio número, y no confiar en un reloj que salta hacia atrás sin protecciones.

Si solo recuerdas dos bugs de producción: dos procesos que comparten el mismo worker id, y el tiempo que va hacia atrás mientras la sequence se reinicia. El layout de bits es la parte fácil. Proteger la identidad y el tiempo es el trabajo de verdad.

---

## Un diseño que puedes defender (corto)

**Queremos:** números de 64 bits, únicos en todo el producto, más o menos ordenados por tiempo, decenas de miles de IDs por segundo, multi-AZ.

**Propuesta:**

1. Bits estilo Snowflake: sin uso + timestamp + worker + sequence.
2. Epoch personalizado = día de lanzamiento del servicio en UTC.
3. Worker ids en lease o asignados para que no haya dos generadores vivos con el mismo.
4. Acuñar dentro del proceso, no con una llamada remota en cada insert.
5. Ante rollback de reloj: dejar de acuñar y avisar.
6. Guardar como `BIGINT`. En APIs JSON públicas, valora strings decimales para que los clientes JavaScript no pierdan precisión por encima de `2^53 - 1`.

**Cuándo elegir otra cosa en voz alta:** UUID si 128 bits te valen y gana la simplicidad. Ticket server si la tasa de escritura es baja y importan los enteros cortos. Snowflake cuando quieres IDs compactos, ordenables y de alto ritmo y vas a invertir en identidad de worker y disciplina de reloj.

---

## Cierre

Los IDs únicos parecen una feature de una línea hasta que muchos escritores comparten el producto. **UUID** quita coordinación y cobra en anchura y (en versiones aleatorias) localidad de índice. **Ticket servers** mantienen enteros cortos y reintroducen un cuello central salvo que asignes rangos. **Snowflake** empaqueta hora, identidad de máquina y un contador por tick en 64 bits, como un recibo que nunca reimprime la misma línea en la misma caja en el mismo momento.

Protege el reloj y el worker id. Todo lo demás es aritmética.