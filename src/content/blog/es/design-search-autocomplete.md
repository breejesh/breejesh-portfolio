---
title: "Diseñar un sistema de autocompletado de búsqueda: cómo funciona el typeahead de verdad"
description: "Autocompletado de búsqueda para principiantes: prefijos, un árbol de letras (trie), mejores sugerencias, por qué precomputamos respuestas y un paseo letra a letra al escribir din."
date: "2025-11-14"
tags: [Diseño de sistemas]
coverImage: /assets/images/design-search-autocomplete.webp
previewImage: /assets/images/design-search-autocomplete.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Autocompletado de búsqueda para principiantes: prefijos, un árbol de letras (trie), mejores sugerencias, por qué precomputamos respuestas y un paseo letra a letra al escribir din.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Ya usas el autocompletado de búsqueda cada día. Abre Google, Amazon o los mensajes del teléfono. Escribes unas letras y aparece una lista corta de frases completas antes de pulsar Enter. Ese desplegable no es magia. Es un sistema pequeño con un solo trabajo: **dado lo que has escrito hasta ahora, devolver unas pocas consultas buenas, muy rápido.**

Piensa en las **sugerencias del teclado del teléfono**. Mientras escribes `din`, el teclado intenta terminar la palabra por ti. O piensa en un **diccionario que solo mira el comienzo de las palabras**, no el medio, y te entrega primero las coincidencias más comunes. Ese es el modelo mental de todo este diseño.

Este post enseña el autocompletado como lo explicaría en una pizarra a alguien que nunca ha construido búsqueda. Lenguaje sencillo, un ejemplo pequeño (`din`) y solo las ideas que necesitas para una entrevista o una primera versión en producción.

---

## Qué construimos (y qué no)

**En alcance**

1. El usuario escribe un **prefijo** (el inicio de una consulta).
2. El sistema devuelve las **top k** sugerencias (a menudo de 5 a 10).
3. Las sugerencias se ordenan sobre todo por **cuántas veces la gente las buscó**.
4. La respuesta debe sentirse instantánea (objetivo orientativo: menos de unos **100ms**).
5. Mantenemos la lista razonablemente al día a partir de logs reales de búsqueda.

**Fuera de alcance salvo que pregunten**

- Ranking al estilo Google con aprendizaje automático
- Corregir typos (`dinnr` → `dinner`)
- Encontrar coincidencias en medio de una frase
- Listas personalizadas "solo para ti"

Nómbralos en voz alta en una entrevista para no acabar en un paper de investigación.

---

## Empieza con una palabra: prefijo

Un **prefijo** es simplemente el comienzo de una cadena.

| Escribiste | Es prefijo de |
| --- | --- |
| `d` | `dinner`, `dinosaur`, `doctor`, ... |
| `di` | `dinner`, `dinosaur`, `diners near me`, ... |
| `din` | `dinner recipes`, `dinosaur`, `diners near me`, ... |
| `dino` | `dinosaur`, `dinosaur toys`, ... |

Autocompletado casi siempre significa **coincidencia de prefijo desde el inicio**, no "busca este trozo en cualquier sitio".

Si el producto solo necesita eso, dilo. La coincidencia en medio de la cadena es otro problema, más duro.

---

## Por qué una lista plana de palabras no basta

Imagina que guardas cada búsqueda popular en una tabla grande:

```
query                 times_searched
------------------------------------
dinner recipes        98012
dinosaur              77120
diners near me        54001
doctor near me        41000
... millones más ...
```

Una respuesta ingenua para el prefijo `din` es:

```sql
SELECT query
FROM queries
WHERE query LIKE 'din%'
ORDER BY times_searched DESC
LIMIT 5;
```

Eso funciona en un demo en el portátil. A escala real, cada tecla puede ser una petición, y pueden llegar decenas de miles por segundo. Escanear u ordenar una tabla enorme por cada letra es demasiado lento y caro.

Necesitamos una estructura hecha para **recorrer letras una a una**.

---

## La idea del teclado del teléfono: un árbol de letras

Esta es la imagen central.

Imagina un **árbol**. La raíz está vacía (no has escrito nada). Cada paso hacia abajo es una letra. Los inicios compartidos comparten el mismo camino.

Ese árbol se llama **trie** (se dice "try"). También se llama **árbol de prefijos**.

Diccionario minúsculo: `be`, `bee`, `beer`, `best`, `bet`.

```
        (root)
          |
          b
          |
          e
       /  |  \
      e   s   t
      |   |
      r   t
```

Cómo leerlo:

- El camino `b → e` es el prefijo `be`.
- El camino `b → e → e → r` es la palabra `beer`.
- Las palabras que comparten inicio comparten nodos, así no guardas las letras de `be` tres veces por separado para `be`, `bee` y `beer`.

Misma idea que las sugerencias del teclado: el teclado no relee todo el diccionario de la A a la Z por cada letra. Sigue el camino de las letras que ya escribiste y mira qué puede seguir creciendo desde ahí.

---

## Paseo al escribir `din` letra a letra

Supón que las consultas populares que empiezan por `d` incluyen:

- `dinner recipes` (score 98012)
- `dinosaur` (score 77120)
- `diners near me` (score 54001)
- `doctor near me` (score 41000)
- `disney movies` (score 39000)

**Paso 1: el usuario escribe `d`**

El servidor camina un borde: raíz → `d`.

Todo lo que cuelga de `d` es candidato: dinner, dinosaur, doctor, disney y más. Si listáramos *todo*, la lista sería enorme. Así que solo guardamos las **mejores pocas** para este prefijo (ya lo veremos). Quizá:

```
prefix "d" → dinner recipes, dinosaur, diners near me, doctor near me, disney movies
```

**Paso 2: el usuario escribe `i` (ahora `di`)**

Camina un borde más: `d` → `i`.

`doctor` y todo lo que no continúe con `i` cae. Siguen bajo `di`: dinner, dinosaur, diners, disney y similares.

```
prefix "di" → dinner recipes, dinosaur, diners near me, disney movies, ...
```

**Paso 3: el usuario escribe `n` (ahora `din`)**

Camina: `i` → `n`.

Ahora el camino es `d-i-n`. Solo quedan consultas que empiezan por `din`:

```
prefix "din" → dinner recipes, dinosaur, diners near me, ...
```

Esa es toda la ruta de consulta en una frase: **sigue las letras que el usuario escribió y devuelve las mejores consultas completas colgadas de ese nodo.**

El tiempo para llegar al nodo es proporcional a cuántos caracteres escribió. En cajas de búsqueda cortas son unos pocos pasos, no un escaneo completo de tabla.

---

## Mejores sugerencias: no mostramos todo

El usuario no quiere 10.000 coincidencias. Quiere una lista corta y útil.

Así que el producto dice: devuelve **top k**, a menudo `k = 5` o `k = 10`.

**¿Cómo ordenamos?**

Respuesta simple de entrevista: **frecuencia histórica**. Cuenta cuántas veces la gente terminó esa búsqueda. Más conteo → mejor rango. Mejoras opcionales después: tendencias recientes, clics en sugerencias, idioma, ubicación. Empieza por frecuencia para que el diseño se entienda.

Forma de respuesta de ejemplo:

```http
GET /v1/autocomplete?q=din&limit=5
```

```json
{
  "prefix": "din",
  "suggestions": [
    {"query": "dinner recipes", "score": 98012},
    {"query": "dinosaur", "score": 77120},
    {"query": "diners near me", "score": 54001}
  ]
}
```

Los prefijos vacíos o de una letra son incómodos (casi todo el diccionario). Muchos productos esperan **2 o 3 caracteres** antes de llamar al servidor, o muestran una lista especial de "tendencias" para entradas muy cortas.

---

## Por qué precomputamos (la idea de producción más importante)

*Podrías* hacer esto en cada petición:

1. Caminar al nodo del prefijo (`din`).
2. Explorar todo el subárbol debajo.
3. Recoger cada consulta terminada.
4. Ordenar por score.
5. Quedarte con las top 5.

Para un prefijo raro como `xylophone`, el subárbol es minúsculo. Para uno común como `a` o `the`, puede ser enorme. Ordenar un montón gigante bajo un presupuesto de 100ms, a QPS alto, falla.

Así que **precomputamos**.

En cada nodo importante (o para cada prefijo importante), guardamos la respuesta de antemano:

```
Node "din":
  top: [dinner recipes, dinosaur, diners near me, ...]
```

La ruta de consulta queda:

1. Caminar al nodo (o buscar el prefijo en un mapa).
2. Devolver la lista ya guardada.

Cambias **memoria** por **latencia**. Ese intercambio es deliberado. El autocompletado es un producto muy de lectura donde la velocidad *es* el producto.

### ¿Cuándo se construyen esas listas?

No en cada tecla delante del usuario. Por separado:

1. La gente termina búsquedas (logs).
2. Un pipeline cuenta frecuencias (por hora, día, semana: elección de producto).
3. Un job construye un trie nuevo (o un mapa `prefix → top-k`).
4. Las máquinas de servicio cargan el snapshot nuevo y cambian de versión.

Piensa en imprimir un diccionario de bolsillo por la noche y usar ese libro impreso al día siguiente. En productos de noticias también añades un camino corto de "tendencias", pero la idea principal se mantiene: **trabajo pesado offline, respuestas online con listas ya hechas.**

---

## Dos caminos: aprender vs responder

Dibuja esta separación pronto. Mantiene el diseño honesto.

```
APRENDER (lento está bien)
  búsquedas terminadas → conteos → construir top-k → publicar snapshot

RESPONDER (debe ser rápido)
  usuario escribe → API → caché / trie → lista top-k → respuesta
```

Si actualizas un árbol global en vivo con cada búsqueda terminada en el mundo, creas tormentas de escritura, pelea de locks y rankings inconsistentes. En un primer diseño, prefiere **rebuild periódico + swap atómico**.

---

## Una mini historia de capacidad (para que la escala se sienta real)

Números de entrevista que puedes decir en voz alta:

- 10 millones de personas usan el producto al día
- Cada persona busca unas 10 veces
- Cada búsqueda puede teclear unos 20 caracteres (si cada tecla pega al servidor)

```
QPS medio ≈ 10M * 10 * 20 / 86400 ≈ 24.000
El pico puede ser ~2x → ~50.000
```

En producción el cliente debería hacer **debounce** (esperar ~150-300ms tras la última tecla antes de llamar) y cancelar peticiones viejas cuando llega una letra nueva. Eso corta mucho tráfico. Aun así, planifica una API caliente y muy de lectura.

Además: los navegadores pueden cachear sugerencias no personales un rato. Las cachés de servidor (Redis o en proceso) guardan prefijos calientes como `din`, `how`, nombres de marca. Un miss carga desde el snapshot del trie.

---

## Seguridad y resultados feos

La popularidad sola puede sacar sugerencias malas. Discurso de odio, estafas o retiradas legales no pueden esperar al rebuild de la próxima semana.

Pon un **filtro rápido** en la ruta de respuesta:

- Lista de bloqueo de consultas completas y prefijos
- Descarta coincidencias antes de llegar al usuario
- También quítalas en el siguiente rebuild para que dejen de ocupar huecos del top-k

Ocultación inmediata ahora, índice limpio pronto.

---

## Escalar sin ahogarte en jerga

Una máquina no guardará todos los idiomas y toda la cola larga para siempre.

Ideas prácticas que gustan en entrevistas:

| Idea | Significado sencillo |
| --- | --- |
| Shard por prefijo | Consultas que empiezan por `a-m` en un grupo de máquinas, `n-z` en otro |
| Corregir sesgo de letras | El inglés usa más `s` y `c` que `x` y `z`; shard por tráfico real, no por rebanadas puras del alfabeto |
| Tries por locale | El ranking en español no es el mismo que en hindi; índices separados ayudan |
| Mínimo de caracteres | No sirvas el top-k global para la cadena vacía |

No necesitas un grafo global en tiempo real perfecto el día uno. Necesitas un servicio **prefix → top-k** que siga siendo rápido cuando crece el tráfico.

---

## Detalles de cliente que hacen que el producto se sienta bien

| Detalle | Por qué |
| --- | --- |
| Debounce 150-300ms | Evitar una petición por cada golpe de tecla |
| Cancelar llamadas en vuelo | El backspace no debe mostrar una lista vieja |
| Longitud mínima 2-3 | Evitar volcar todo el diccionario |
| Búsquedas locales recientes | Offline o fallo sigue sintiéndose útil |
| Tope de longitud del prefijo | 50 caracteres sobran para una caja de búsqueda |

El diseño de backend es el mismo para apps móviles y web.

---

## Imagen de punta a punta que puedes defender

**Producto:** top-5 por prefijo según popularidad, decenas de miles de QPS en pico, p99 bajo ~100ms, inglés primero, rebuild periódico, moderación rápida.

**Piezas:**

1. API de autocompletado (sin estado, muchas copias)
2. Trie o snapshot `prefix → top-k` en memoria / Redis
3. Almacén durable de snapshots (builds versionados)
4. Log → agregar → workers de build
5. Blocklist en la ruta de lectura
6. Merge opcional de tendencias de ventana corta para noticias de última hora

**Consulta:** validar → caché → top-k precomputado → filtrar → responder.

**Aprender:** muestrear búsquedas terminadas → agregar → construir → publicar → calentar caché → cambiar de versión.

---

## Resumen para un amigo

Si tuvieras que explicarlo en la cena en un minuto:

> El autocompletado es como las sugerencias del teclado del teléfono, pero para búsqueda. Escribes el comienzo de una frase (un **prefijo**). El sistema no relee todas las búsquedas de la historia. Mantiene un **árbol de letras** (un trie). Cada paso es una letra. Cuando escribes `d`, luego `i`, luego `n`, camina `d → i → n` y mira una **lista corta precomputada** de las consultas completas más populares bajo ese camino, como `dinner recipes` y `dinosaur`. Precomputamos esas listas top offline a partir de conteos reales de búsqueda para que cada tecla sea barata y rápida. Servir respuestas y aprender de búsquedas nuevas son dos trabajos distintos. Mezclarlos en una actualización en vivo por cada búsqueda es como estos sistemas se vuelven lentos y confusos.

Ese es el diseño. Todo lo demás (shards, cachés, tendencias, filtros) es detalle alrededor de esa historia.

---

## Checklist antes de lanzar (o de cerrar la entrevista)

- [ ] Coincidencia solo por prefijo acordada con producto
- [ ] `k` y regla de ranking dichos (frecuencia primero)
- [ ] Debounce, cancelación y longitud mínima en el cliente
- [ ] Top-k guardado por nodo o mapa por prefijo
- [ ] Build offline o periódico con swap atómico
- [ ] Filtro de seguridad en lectura con actualización rápida
- [ ] Capas de caché para prefijos calientes
- [ ] Rate limits en el endpoint de autocompletado
- [ ] Dashboards: latencia, hit rate de caché, resultados vacíos, lag del build

---

## Cierre

El autocompletado de búsqueda no es una demo de IA elegante. Es un **servicio de top-k por prefijo** con un índice casi en tiempo real. La estructura que encaja con el producto es un árbol de letras. El truco que hace que producción funcione son las **listas cortas precomputadas** en los nodos que la gente camina de verdad. Separa el camino de aprender del de responder, y el sistema se queda rápido y entendible.