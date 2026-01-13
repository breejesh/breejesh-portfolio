---
title: "Diseñar consistent hashing: anillos, nodos virtuales y reasignación mínima"
description: "Por qué hash(key) % N reseata a casi todos cuando un servidor se va, cómo un anillo de hash mapea claves caminando en sentido horario, nodos virtuales para carga justa, y dónde aparece consistent hashing en cachés, bases de datos y balanceadores."
date: "2026-01-13"
tags: [Diseño de sistemas]
coverImage: /assets/images/design-consistent-hashing.webp
previewImage: /assets/images/design-consistent-hashing.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Por qué hash(key) % N reseata a casi todos cuando un servidor se va, cómo un anillo de hash mapea claves caminando en sentido horario, nodos virtuales para carga justa, y dónde aparece consistent hashing en cachés, bases de datos y balanceadores.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Tienes muchos usuarios y muchos servidores de caché. Cada dato (una **clave**) debe caer en un servidor, y debes poder encontrarlo después. Cuando un servidor muere o añades capacidad, quieres que se mueva la menor cantidad posible de datos.

**Consistent hashing** es la forma estándar de colocar claves de modo que un cambio de miembros solo toque un trozo pequeño de los datos, no todo el cluster.

Este post construye la idea desde el plano de un restaurante, y luego la mapea al anillo de hash, a los nodos virtuales y a sistemas reales.

---

## El problema en palabras simples

Imagina un restaurante con mesas numeradas. Sientas a los clientes con una regla simple: toma el número del cliente, divídelo por el número de mesas y usa el resto.

```
mesa = numeroCliente % numeroDeMesas
```

Funciona mientras el número de mesas no cambie nunca.

### Se cierra una mesa, caos

Supón 4 mesas y 8 clientes habituales:

| Cliente | numeroCliente | numero % 4 | Mesa |
| --- | --- | --- | --- |
| A | 11 | 3 | T3 |
| B | 14 | 2 | T2 |
| C | 17 | 1 | T1 |
| D | 20 | 0 | T0 |
| E | 23 | 3 | T3 |
| F | 26 | 2 | T2 |
| G | 29 | 1 | T1 |
| H | 32 | 0 | T0 |

Se rompe la mesa T1. Ahora hay 3 mesas. Mismos números, nuevo resto:

| Cliente | numeroCliente | numero % 3 | Mesa |
| --- | --- | --- | --- |
| A | 11 | 2 | T2 |
| B | 14 | 2 | T2 |
| C | 17 | 2 | T2 |
| D | 20 | 2 | T2 |
| E | 23 | 2 | T2 |
| F | 26 | 2 | T2 |
| G | 29 | 2 | T2 |
| H | 32 | 2 | T2 |

En una tabla real aún caes en más de una mesa, pero el hecho doloroso se mantiene: **casi todos cambian de asiento**, no solo los que estaban en la mesa rota.

En un cluster de caché eso significa:

1. Los clientes preguntan al nodo equivocado por datos que aún existen en otro sitio.
2. Los misses inundan la base de datos.
3. Querías perder cerca de 1/N de la caché. Pagaste casi un arranque en frío completo.

Ese es el problema del rehashing. `hash(key) % N` va bien hasta que `N` cambia. Entonces reseata casi todo el restaurante.

---

## Un mejor plano: taquillas en un pasillo circular

Imagina un pasillo largo de taquillas numeradas en círculo. Si caminas lo bastante en una dirección, vuelves a la taquilla 0. Ese círculo es el **espacio de hash**.

```
              0
          .         .
       .               .
     .                   .
   max                     small
     .                   .
       .               .
          .         .
            mid ring
```

Dos ideas:

1. Los **servidores** reciben números de taquilla fijos (hasheando su nombre o IP).
2. Las **claves** también reciben números de taquilla (hasheando la clave).

No hay `% numeroDeServidores`. Las posiciones viven en un rango fijo, como `0` a `2^32 - 1` o un espacio mayor. El círculo no se encoge cuando un servidor se va.

### Camareros en asientos fijos

Piensa en cada servidor como un camarero de pie en un asiento de una mesa redonda.

Anillo de juguete con posiciones de 0 a 99:

| Servidor | Asiento |
| --- | --- |
| s0 | 12 |
| s1 | 37 |
| s2 | 61 |
| s3 | 88 |

Claves en el mismo círculo:

| Clave | Asiento |
| --- | --- |
| key0 | 18 |
| key1 | 42 |
| key2 | 70 |
| key3 | 95 |

```
Anillo (horario desde 0):

  0
  |-- s0@12 -- key0@18 -- s1@37 -- key1@42 --
  |-- s2@61 -- key2@70 -- s3@88 -- key3@95 -- (vuelta a 0)
```

---

## Lookup: camina en sentido horario hasta un camarero

Regla:

1. Hashea la clave a un asiento `p`.
2. Camina en **sentido horario** hasta el siguiente asiento de servidor.
3. Ese servidor es dueño de la clave.

| Clave | Asiento | Primer servidor en horario | Dueño |
| --- | --- | --- | --- |
| key0 | 18 | s1@37 | s1 |
| key1 | 42 | s2@61 | s2 |
| key2 | 70 | s3@88 | s3 |
| key3 | 95 | s0@12 (da la vuelta) | s0 |

En código mantienes los asientos ordenados y haces búsqueda binaria del primer valor mayor o igual que `p`. Si no hay, vuelves al primero del anillo.

```python
import bisect
import hashlib

def h(x: str) -> int:
    # espacio de juguete de 32 bits; en producción a menudo 64 bits o más
    return int(hashlib.md5(x.encode()).hexdigest()[:8], 16)

class HashRing:
    def __init__(self, nodes: list[str]):
        self.positions: list[int] = []
        self.owners: dict[int, str] = {}
        for n in nodes:
            p = h(n)
            self.positions.append(p)
            self.owners[p] = n
        self.positions.sort()

    def lookup(self, key: str) -> str:
        p = h(key)
        i = bisect.bisect_left(self.positions, p)
        if i == len(self.positions):
            i = 0  # vuelta al anillo
        return self.owners[self.positions[i]]
```

Frase de entrevista: "posiciones ordenadas más búsqueda binaria, del orden O(log n) en puntos del anillo."

---

## Añadir un camarero: solo se mueven los vecinos

Añade `s4` en el asiento 25.

Antes: `key0@18` caminaba hasta `s1@37`.

Después: desde 18, el primer servidor es `s4@25`. Solo las claves del arco que antes pertenecían al vecino antiguo cambian de dueño.

```
Antes:   ... s0@12 -- key0@18 -------- s1@37 ...
Después: ... s0@12 -- key0@18 -- s4@25 -- s1@37 ...
                    solo este arco se reasigna a s4
```

**Qué se mueve al añadir un servidor:** las claves entre el nuevo servidor y el servidor anterior en sentido antihorario. El resto se queda con su camarero.

---

## Quitar un camarero: solo se mueven sus clientes

Quita `s1@37`.

Las claves que usaban `s1` como primer servidor en horario siguen hasta el siguiente servidor vivo (`s2@61`). Las que ya tenían otro dueño no se mueven.

```
Antes: claves que golpeaban s1 primero -> s1
Después: esas claves continúan a s2; los otros arcos no cambian
```

En una caché aún tienes una tormenta de misses en ese arco. **No** reseatas todo el restaurante.

Regla práctica: cuando cambia 1 de n servidores, en promedio se mueven unas **k/n** claves (k claves en total), no casi todas.

---

## Qué promete consistent hashing (y qué no)

| Objetivo | Por qué importa |
| --- | --- |
| Reasignación mínima al unirse o salir | Evitar estampidas de caché y rebalances largos |
| Carga suficientemente pareja | Que una sola caja no posea casi todo el anillo |
| Lookup determinista | Misma vista de miembros implica mismo dueño |
| Barato de calcular | La colocación está en el camino caliente |

**No** te da por sí solo replicación, consistencia fuerte ni failover automático. Eso va encima: los siguientes N servidores en horario como réplicas, gossip para membresía, etc.

---

## Dos problemas con un solo asiento por camarero

### Arcos injustos

El tramo de círculo entre dos servidores vecinos es una **partición**. Si tres camareros se agrupan por azar, uno posee un arco enorme y hace casi todo el trabajo de esa zona.

```
Diseño con mala suerte:

  s0 -------- s1 - s2 ------------------- s3 ---- (vuelta)

  s2 posee un hueco enorme; la carga se desbalancea
```

### Asientos agrupados

Con pocos servidores físicos en un anillo enorme, la colocación aleatoria puede amontonarse. Un N pequeño empeora la injusticia.

---

## Nodos virtuales: muchos asientos por camarero

Un **nodo virtual** es un asiento extra en el anillo que sigue apuntando a un servidor real. Cada servidor físico aparece muchas veces con hashes distintos:

```
s0 -> s0_0, s0_1, s0_2, ...
s1 -> s1_0, s1_1, s1_2, ...
```

Imagen del restaurante: cada camarero tiene muchos asientos reservados alrededor de la mesa, no una sola silla. El trabajo se reparte porque un solo hueco no decide toda su noche.

Ejemplo de juguete con 3 asientos virtuales por servidor:

| Id virtual | Servidor real | Asiento (ejemplo) |
| --- | --- | --- |
| s0_0 | s0 | 10 |
| s0_1 | s0 | 55 |
| s0_2 | s0 | 90 |
| s1_0 | s1 | 22 |
| s1_1 | s1 | 48 |
| s1_2 | s1 | 73 |

El lookup no cambia: camina en horario al siguiente asiento **virtual** y sigue el puntero al servidor real.

```
key @ 50 -> siguiente vnode s0_1@55 -> real s0
```

### Por qué ayuda

| Efecto | Explicación |
| --- | --- |
| Menos varianza | Muchos arcos pequeños en lugar de una gran apuesta |
| Escala más suave | Un nodo nuevo roba rebanadas finas de muchos vecinos |
| Capacidad ponderada | Máquinas más grandes pueden tener más asientos virtuales |
| Carga más justa | El trabajo se mezcla alrededor de la mesa |

Textos clásicos suelen usar del orden de **100 a 200 nodos virtuales por servidor** para que la carga quede lo bastante pareja. Más nodos virtuales: mejor balance y un mapa del anillo más grande en memoria. Ajústalo.

```python
class VNodeRing:
    def __init__(self, nodes: list[str], vnodes: int = 150):
        self.positions: list[int] = []
        self.owners: dict[int, str] = {}
        for n in nodes:
            for i in range(vnodes):
                p = h(f"{n}#{i}")
                self.positions.append(p)
                self.owners[p] = n
        self.positions.sort()

    def lookup(self, key: str) -> str:
        p = h(key)
        i = bisect.bisect_left(self.positions, p)
        if i == len(self.positions):
            i = 0
        return self.owners[self.positions[i]]
```

Clientes y servidores deben coincidir en la función de hash y en el número de nodos virtuales, o no se pondrán de acuerdo en los dueños.

---

## Qué claves deben moverse

Cuando cambia la membresía, el anillo ya define los rangos.

**Añadir servidor S en la posición p:**

```
prev = vecino antihorario de S
claves en (prev, p] pasan del dueño antiguo de ese arco a S
```

**Quitar servidor S en la posición p:**

```
prev = vecino antihorario de S
next = vecino horario de S
claves en (prev, p] pasan de S a next
```

Con nodos virtuales, hazlo por cada asiento virtual de la máquina que entra o sale. Muchas transferencias pequeñas vencen a una gigante.

En cachés puras, "transferir" suele ser "dejar que el nuevo dueño se llene en miss." En bases de datos, copias rangos a propósito y controlas escrituras durante el traspaso.

---

## Replicación en el anillo (añadido corto)

Consistent hashing coloca el **primario**. La replicación suele ser "seguir caminando en horario":

```
key -> N1 (primario), N2, N3  # primeros tres servidores físicos distintos
```

Salta asientos virtuales del mismo host físico para que las réplicas caigan en máquinas distintas. Almacenes al estilo Dynamo y anillos de tokens de Cassandra usan este patrón. Menciona quórums solo si la entrevista se convierte en el diseño completo de un almacén clave-valor.

---

## Dónde lo ves de verdad

| Clase de sistema | Cómo aparece consistent hashing |
| --- | --- |
| **Cachés distribuidas** | Clientes de Memcached, shards de caché multi-nodo, colocación en edge de CDN (y parientes cercanos) |
| **Bases / KV stores** | Particiones Dynamo, anillos de tokens de Cassandra, muchos anillos a medida |
| **Chat / tiempo real** | Propiedad sticky de guilds o canales para que un evento de escala no reordene todo |
| **Balanceadores** | Elección estable de backend cuando el pool cambia (Maglev y parientes) |
| **Enrutado de peticiones** | Usuarios, tenants o shards sticky sin un mapa central en cada request |

Ideas cercanas, no idénticas: **jump consistent hash**, **rendezvous (HRW) hashing** y **tablas de permutación Maglev**. En entrevista, nombra primero consistent hashing y luego di que hay variantes más rápidas o con menos memoria.

---

## Flujo de entrevista que puedes seguir

1. **Problema:** `hash % N` reseata a casi todos cuando cambia N.
2. **Anillo:** espacio de hash fijo; servidores y claves son puntos; no hay `% N` en vivo.
3. **Lookup:** primer servidor en horario (búsqueda binaria en asientos ordenados).
4. **Añadir/quitar:** solo se reasigna el arco vecino (unas 1/n de las claves).
5. **Dolor:** arcos injustos con un asiento por servidor.
6. **Nodos virtuales:** muchos asientos por servidor físico; carga más justa; pesos opcionales.
7. **Ops:** cómo se mueven datos, cómo los clientes aprenden la membresía, qué son dueños temporalmente incorrectos.
8. **Usos:** cachés, DB particionadas, balanceadores sticky.

**Aclara pronto:**

- ¿Solo caché (miss al remapear OK) o almacén durable (hay que migrar)?
- ¿Factor de replicación?
- ¿Quién posee la membresía (config estática, ZooKeeper, gossip)?
- ¿Pueden los clientes equivocarse un momento durante un cambio de miembros?

**Trade-offs para decir en voz alta:**

| Elección | Ventaja | Coste |
| --- | --- | --- |
| Más nodos virtuales | Carga más plana | Anillo más grande, rebuilds más lentos |
| Anillo en el cliente | Sin salto de proxy | Cada cliente necesita la misma vista de miembros |
| Proxy / coordinador | Una vista central | Un hop extra |
| Rellenar caché en miss | Ops simples | Pico en el origen al rebalancear |
| Migración en streaming | Más seguro para DB | Complejidad de traspaso |

---

## Checklist de producción

- [ ] El hash es rápido y bien repartido en el camino caliente
- [ ] El número de nodos virtuales está elegido y documentado; los pesos coinciden con el tamaño de máquina
- [ ] El lookup es O(log n) en puntos del anillo, no un escaneo lineal
- [ ] Los cambios de membresía van versionados; mide ventanas de dueño incorrecto
- [ ] Al perder un nodo, solo se remontan o rellenan los arcos afectados
- [ ] Las réplicas saltan el mismo host físico
- [ ] Métricas: claves por nodo, tamaños de arco, bytes de rebalance, tasa de miss al unirse
- [ ] Runbooks para "añadir nodo" y "reemplazar nodo muerto" sin reiniciar todo el cluster

---

## Resumen para un amigo

Imagina un restaurante redondo. La regla tonta de asientos es `número de cliente % número de mesas`. Cierras una mesa y casi todos cambian de sitio. Eso es `hash(key) % N`.

La regla lista pone mesas (servidores) y clientes (claves) en el mismo pasillo circular de taquillas. Para sentar a un cliente, caminas en sentido horario hasta el siguiente camarero. Cierras una mesa y solo se mueven los de esa sección al siguiente camarero. El resto se queda.

Si cada camarero solo tiene un asiento, la suerte puede hacer secciones enormes o minúsculas. Dale a cada camarero muchos asientos reservados alrededor del círculo (nodos virtuales) para que el trabajo sea justo.

La misma idea mueve clusters de caché, bases fragmentadas y balanceadores sticky: coloca datos para que el crecimiento y los fallos muevan un trozo, no todo el sistema.

---

## Cierre

`hash(key) % N` va bien hasta que el pool se mueve. Entonces reasigna casi todo y convierte un evento de escala en un evento de fiabilidad.

Consistent hashing pone claves y servidores en un anillo compartido, asigna cada clave al siguiente servidor en horario y limita la reasignación a un arco local cuando entran o salen nodos. Los nodos virtuales corrigen arcos injustos. Si puedes dibujar el anillo, explicar el límite de reasignación y defender el número de nodos virtuales más la membresía, tienes el capítulo de entrevista y los instintos de producción que van encima.