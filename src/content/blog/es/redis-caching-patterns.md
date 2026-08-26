---
title: "Patrones de caché Redis que aguantan en producción"
description: "Cache-aside, control de stampede, jitter de TTL, invalidación y hot keys. Patrones para que Redis sirva de verdad bajo tráfico real sin derretir la base de datos."
date: "2026-07-15"
tags: [Backend y Bases de Datos]
coverImage: /assets/images/redis-caching-patterns.webp
previewImage: /assets/images/redis-caching-patterns.webp
---

La caché parece simple hasta que el tráfico es irregular, las claves caducan a la vez y un id de producto famoso quema un solo shard de Redis. La mayoría de incidentes que he visto no eran "Redis va lento". Eran stampede, datos viejos para siempre, o una hot key que nadie midió.

Esta es la lista corta que aparece en servicios reales: **cache-aside**, **control de stampede**, **TTL con jitter**, **invalidación** y **hot keys**. No es un catálogo de cada comando Redis. Solo los patrones que necesitas antes de poner caché en el camino de lectura.

---

## Qué hace de verdad cache-aside

**Cache-aside** (carga perezosa) es el valor por defecto cuando la app posee la caché:

1. Leer Redis con `key`.
2. Si hay hit, devolver el valor.
3. Si hay miss, cargar de la fuente de verdad (suele ser Postgres), escribir en Redis con TTL y devolver.
4. Las escrituras van primero a la base. Luego borras la clave de caché o la sobrescribes.

```
value = GET cache:user:{id}
if value is nil:
  value = db.query("SELECT ... WHERE id = ?")
  if value is nil:
    SET cache:user:{id} "null" EX 60   # negative cache; see below
  else:
    SET cache:user:{id} value EX 300
return value
```

Por qué lo eligen los equipos:

* La app controla el esquema de claves y la política de TTL.
* La base sigue siendo la fuente de verdad.
* Puedes empezar por un endpoint y crecer.

Costes que aceptas:

* La primera petición tras un miss paga la latencia completa de la DB.
* Misses concurrentes de la misma clave pueden hacer stampede a la DB (siguiente sección).
* Hay que pensar qué pasa después de un write.

**Read-through** y **write-through** mueven más lógica a una capa o librería de caché. Bien si la tienes. La mayoría del código en microservicios sigue haciendo cache-aside a mano.

---

## Cache stampede (thundering herd)

Stampede: una clave popular expira (o la expulsan), y **cientos de requests concurrentes** hacen miss y golpean la base con la misma query. La DB se dispara. Sube la latencia. Los timeouts generan reintentos. El rebaño crece.

Disparadores clásicos:

* Un TTL fijo en una clave caliente para que todas las instancias vean el expiry en el mismo segundo.
* Un deploy que vacía la caché.
* Pico de tráfico justo cuando muere una clave.
* Sin negative cache: una fila inexistente se reconsulta sin fin.

### Defensa 1: single-flight / coalescing de requests

Solo una petición reconstruye el valor. Las demás esperan (o sirven datos un poco viejos).

```
value = GET key
if hit: return value

if SETNX lock:key "1" EX 10:
  value = load_from_db()
  SET key value EX ttl
  DEL lock:key
  return value
else:
  sleep briefly and retry GET
  # or return last-known if you keep a soft TTL copy
```

`SETNX` (o `SET key NX EX`) es un lock grueso. En multi-pod suele bastar contra el stampede. Para más control, lock de vida corta más bucle de espera con timeout duro, y solo cae a la DB si el dueño del lock murió.

El single-flight in-process (una goroutine/promesa por clave por pod) ayuda **dentro** del proceso. No evita que N pods hagan cada uno un rebuild. Combina ambos en claves calientes.

### Defensa 2: refresh anticipado probabilístico

Antes del expiry duro, una fracción de requests refresca pronto. Las claves populares se reconstruyen antes del acantilado. Las menos usadas suelen esperar el miss natural.

Lógica estilo XFetch: si el TTL restante es pequeño respecto al total, y un sorteo aleatorio gana, rebuild y reescritura. La fórmula importa menos que la idea: **repartir el trabajo de refresh en el tiempo** en lugar de un miss sincronizado.

### Defensa 3: stale-while-revalidate

Guarda dos tiempos: soft TTL (sirve pero refresca) y hard TTL (hay que recargar). O guarda el payload con un campo `stale_after` y un `EX` de Redis más largo.

En soft miss: devuelve el valor viejo al momento y lanza un refresh async. Los usuarios siguen rápidos. Workers de fondo absorben el rebuild. Cambias frescura estricta por estabilidad.

### Defensa 4: negative caching

Si la DB dice "no encontrado", cachea ese hecho con un TTL corto (30s-2m). Sin eso, bots y clientes rotos martillean ids inexistentes para siempre. TTL corto para que una fila nueva no sea invisible horas.

---

## TTL: no un número para todo

El TTL es un **presupuesto de staleness**, no un default mágico de 3600.

| Forma de datos | TTL típico | Notas |
| --- | --- | --- |
| Sesión de usuario / snapshot de authz | minutos | Sensible de seguridad; invalidar en logout/cambio de rol |
| Fila de catálogo de producto | 5-30 min | Invalidar en edición de admin |
| Ranking de feed / cards de home | 30s-5 min | Puede ir un poco stale |
| Feature flags | 10-60s | Mejor invalidación push si existe |
| Contadores de rate / idempotencia | duración de la ventana | A menudo TTL exacto, no "para siempre" |
| Negative cache ("not found") | 30s-2 min | Corto a propósito |

### Jitter para que las claves no caduquen en fila

Si 50.000 claves de producto usan todas `EX 300`, un cold start o un insert masivo puede crear olas de expiry sincronizadas. Añade jitter:

```
ttl = base_ttl + random(0, base_ttl * 0.1)
# e.g. 300 + random(0, 30) seconds
```

El jitter no sustituye los locks de stampede. Reduce la probabilidad de que **muchas claves distintas** mueran juntas y saturen Redis y la DB.

### Memoria y eviction

Redis no es infinito. Cuando se toca `maxmemory`, la política importa:

* `allkeys-lru` / `allkeys-lfu`: bien para cachés puras donde cualquier clave puede morir.
* `volatile-lru`: solo claves con TTL. Peligroso si algunas no tienen TTL y clavan memoria.
* Nunca corras una caché de producción sin **TTL en casi toda clave** y un `maxmemory-policy` claro.

Si una clave no debe desaparecer bajo presión (locks, colas), ponla en otro Redis con otra política, o acepta que una instancia de caché no es el sitio para durabilidad.

---

## Invalidación: la parte difícil

Hay pocos problemas difíciles en CS, y la invalidación de caché es el chiste por una razón. Los modos de fallo son concretos:

* **Carrera delete-then-write:** A borra la caché, B carga la fila vieja de la DB en caché, C confirma un write nuevo. La caché queda stale hasta el TTL.
* **Write-then-forget:** la app actualiza la DB y no toca Redis. Stale hasta el TTL.
* **Objetos multi-clave:** perfil en `user:42`, pero también embebido en `team:9:members`. Actualizaste una clave y dejaste la copia desnormalizada.

### Patrones que funcionan

**1. Escribe DB, luego borra caché (rebuild perezoso)**

```
BEGIN; UPDATE users SET name = ? WHERE id = ?; COMMIT;
DEL cache:user:{id}
```

La siguiente lectura reconstruye. Prefiere **borrar antes que sobrescribir** cuando el write no tiene el objeto completo que cacheas, o cuando writers concurrentes se entrelazan.

**2. Escribe DB, luego set de caché (si tienes el payload completo)**

Útil cuando la forma de la respuesta coincide con el blob. Sigue siendo propenso a carreras con writers concurrentes. Campos de versión o "escribir solo si la versión sube" ayudan.

**3. Claves versionadas**

`cache:user:{id}:v{version}` o incluye `updated_at` en el hash de la clave. Sube la versión en el write; las viejas mueren por TTL. Los lectores piden siempre la versión actual de la DB o de una clave puntero pequeña. Más piezas, menos bugs de "stale silencioso" en objetos complejos.

**4. Invalidación por Pub/Sub o stream**

El writer publica `invalidate user:42`. Las instancias tiran L1 local. Sigue haciendo falta el delete de la clave Redis para L2 compartido. L1 local sin invalidación es cómo "lo arreglé en mi pod" se convierte en incidente.

**5. TTL como red de seguridad, no como único plan**

Aunque los deletes sean perfectos, un worker puede perder un mensaje. El TTL acota el peor caso de staleness. Elige ese tope con producto, no por superstición.

### Orden bajo concurrencia

Regla práctica de muchos equipos:

1. Actualizar la base (commit de la transacción).
2. Borrar la clave de caché (o subir versión).
3. Dejar que la siguiente lectura rellene.

Si debes setear la caché en el write, hazlo **después** del commit con la fila confirmada, y mantén TTL. En filas con mucha contención, columna de versión y no cachear una versión vieja encima de una nueva.

---

## Hot keys: cuando una clave es el outage

Una hot key absorbe una parte desproporcionada de ops: blob de config de homepage, perfil de celebridad, documento global de feature flags, producto de flash sale.

Síntomas:

* Un core de CPU de Redis al máximo (sobre todo en Cluster: un hash slot).
* Sube la latencia de claves **no relacionadas** porque ese nodo está ocupado.
* Timeouts de clientes y tormentas de reconnect.

### Mitigaciones

**L1 local en la app**

LRU in-process (Caffeine, Ristretto, Guava, etc.) con TTL corto (1s-30s) para claves calientes conocidas. La mayoría de lecturas no salen del pod. Invalida por Pub/Sub o acepta staleness corta.

**Partir la clave / shard del valor**

Si el valor es un hash grande, parte en `product:{id}:core`, `product:{id}:stats`, etc., solo si los patrones de acceso difieren. Partir un contador lógico en `N` shards (leer suma, escribir shard aleatorio) ayuda más a contadores write-hot que a blobs read-hot.

**Réplicas de lectura**

Las réplicas de Redis pueden llevar lecturas de cache-aside **si** aceptas lag de replicación. Datos críticos de sesión: primary. JSON de homepage que puede ir 100ms atrás: las réplicas ayudan.

**Copiar la hot key (caché en edge)**

CDN o edge para blobs públicos y casi estáticos. Redis no debería ser la única defensa del tráfico anónimo que no necesita frescura por usuario.

**Instancia dedicada para el namespace más caliente**

A veces el arreglo honesto es aislamiento: un Redis pequeño solo para `config:*` y `flags:*`, para que una tormenta ahí no mate las sesiones del carrito.

---

## Juntarlo: un default aburrido y sólido

Para una API CRUD típica con Postgres y Redis:

| Preocupación | Elección por defecto |
| --- | --- |
| Camino de lectura | Cache-aside |
| Tormenta de miss | Lock (`SET NX`) + single-flight in-process opcional |
| TTL | Base por dominio + 10% de jitter |
| Tras write | Commit DB, luego `DEL` de la clave |
| Not found | Negative cache, TTL corto |
| Claves ultra-calientes | L1 en proceso + TTL corto + métricas |
| Redis caído | Fall open a DB con timeout y circuit breaker; alertar |

### Métricas mínimas que merecen la pena

* Hit ratio por prefijo de clave (no un solo número global).
* Latencia de miss vs hit.
* Fallos de acquire del lock de stampede / tiempo de espera.
* CPU de Redis, claves evicted, conexiones rechazadas.
* Top keys por ops (`HOTKEYS` / métricas del proxy / sampling).

Un hit ratio del 99% puede esconder un prefijo al 20% que está matando la DB. Separa los números.

### Modo de fallo: Redis no disponible

Decídelo por escrito:

* **Fail open a la DB:** más latencia, riesgo de sobrecarga de DB. Habitual en lecturas de producto.
* **Fail closed:** devolver errores. Habitual en stores de sesión de auth (que a veces no son caché pura).
* **Servir stale desde disco/L1:** solo si aún tienes algo que servir.

Empareja fail-open con **timeouts, bulkheads y load shedding**. Un fallback infinito a la DB durante un outage de Redis es cómo conviertes un incidente de caché en uno de base de datos.

---

## Forma de código pequeña (boceto Python)

```python
import json
import random
import time
from typing import Any, Callable, Optional

def cache_aside(
    redis,
    key: str,
    loader: Callable[[], Optional[Any]],
    base_ttl: int = 300,
    neg_ttl: int = 60,
    lock_ttl: int = 10,
) -> Optional[Any]:
    raw = redis.get(key)
    if raw is not None:
        return json.loads(raw)

    lock_key = f"lock:{key}"
    if redis.set(lock_key, "1", nx=True, ex=lock_ttl):
        try:
            value = loader()
            ttl = base_ttl + random.randint(0, max(1, base_ttl // 10))
            if value is None:
                redis.set(key, json.dumps(None), ex=neg_ttl)
            else:
                redis.set(key, json.dumps(value), ex=ttl)
            return value
        finally:
            redis.delete(lock_key)

    # Someone else is loading; brief wait then one more get
    time.sleep(0.02)
    raw = redis.get(key)
    if raw is not None:
        return json.loads(raw)
    # Last resort: load without holding the lock (rare)
    return loader()
```

A propósito es llano. Producción añade métricas, circuit breakers, codecs tipados y a menudo un wrapper de soft-TTL. Importa la estructura: **get, lock, load, set con jitter, unlock, retry**.

---

## Checklist antes de dar la caché por "lista"

* [ ] Toda clave de caché tiene TTL (o un motivo documentado de por qué no).
* [ ] Los prefijos calientes tienen jitter y protección de stampede.
* [ ] Los writes hacen commit a la DB antes de borrar/actualizar la caché.
* [ ] Negative caching en lookups de alto tráfico que pueden fallar.
* [ ] Hit ratio y latencia desglosados por prefijo de clave.
* [ ] Comportamiento documentado cuando Redis cae.
* [ ] Candidatos a hot key listados (config, homepage, SKUs de flash) con plan L1 o edge.
* [ ] `maxmemory` y política de eviction puestos a propósito, no por default de la imagen.

---

## Cierre

La caché Redis no es "poner GET/SET alrededor de la query". Es un conjunto de contratos sobre **frescura**, **carga bajo miss** y **quién posee la clave tras un write**. Cache-aside cubre la mayor parte del código de app. Control de stampede y jitter de TTL mantienen viva la base cuando mueren claves populares. La invalidación mantiene honesta la verdad de producto. Los planes de hot key evitan que un blob famoso se dueño del cluster.

Empieza por un path, mide hit ratio y QPS de DB en ese path, y añade locks y L1 donde los gráficos lo pidan. Los patrones de arriba son aburridos a propósito. Lo aburrido es lo que sobrevive al on-call.
