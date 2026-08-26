---
title: "Cómo funcionan los transformers: un mapa práctico para ingenieros"
description: "Atención, embeddings, stacks encoder/decoder, ventanas de contexto y caché KV sin la niebla de los papers. Lo que importa cuando despliegas o sirves LLMs."
date: "2026-08-02"
tags: [IA y Machine Learning]
coverImage: /assets/images/transformers-explained-engineers.webp
previewImage: /assets/images/transformers-explained-engineers.webp
---

No necesitas un doctorado para razonar sobre transformers. Necesitas un modelo mental que aguante producción: por qué la latencia salta con prompts largos, por qué la VRAM muere antes que la CPU, y por qué "128k de contexto" no es gratis.

Este es ese mapa. Sin resumen de paper. Sin hype. Solo las piezas que tocas cuando llamas una API, corres un modelo local o depuras un servidor de inferencia.

---

## La versión en una línea

Un transformer convierte una secuencia de tokens en predicciones del siguiente token dejando que cada token mire a los demás (o a una ventana restringida) una y otra vez, y mezclando esas señales con capas densas.

El resto es ingeniería alrededor de esa idea: cómo representamos tokens, cuán profunda es la pila, cuánta historia permitimos, y cómo evitamos recomputar trabajo en cada token nuevo.

---

## Tokens y embeddings: el texto discreto se vuelve vectores

Los modelos no ven palabras. Ven **tokens**, trozos de texto (subpalabras, palabras enteras, puntuación, a veces bytes). El tokenizador es plomería aburrida que define o rompe tus estimaciones de coste. La misma frase en inglés puede ser 12 tokens en una familia de modelos y 20 en otra.

Cada id de token se mapea a un vector aprendido: el **embedding**. Piénsalo como una tabla `vocab_size x d_model`. Las capas tempranas refinan esos vectores; las posteriores los mezclan con contexto hasta que el vector final sirve para predecir el siguiente token (o una cabeza de clasificación).

La posición importa. La atención pura no trae orden de fábrica, así que los modelos añaden **información posicional** (posiciones absolutas, sesgos relativos, embeddings rotatorios tipo RoPE y variantes). No necesitas la fórmula. Necesitas la implicación: las secuencias largas estresan el cómputo y la calidad de cómo se codifica la posición.

```
"Transformers are useful."
        |
   [tokenizer]
        |
 [tok1, tok2, tok3, tok4, ...]
        |
  [embedding + position]
        |
  matrix of shape [seq_len, d_model]
```

---

## Atención: la intuición útil (no el álgebra de matrices)

La atención responde: para este token, ¿a qué otros tokens debería escuchar ahora?

En cada posición, el modelo construye tres proyecciones del estado oculto actual:

| Nombre | Rol (intuición de ingeniería) |
| --- | --- |
| **Query (Q)** | ¿Qué estoy buscando? |
| **Key (K)** | ¿Qué anuncio que contengo? |
| **Value (V)** | ¿Qué contenido paso si me seleccionan? |

La similitud entre Q y K decide los pesos. Esos pesos mezclan los vectores V en una nueva representación para esa posición. La atención multi-cabeza ejecuta varias de estas en paralelo: una cabeza puede seguir sintaxis y otra nombres, números o estructura de código. El modelo aprende el reparto. Tú te preocupas sobre todo de que las cabezas cuestan memoria y matmuls.

La **atención causal (decoder)** enmascara el futuro: el token *t* solo puede atender a `1..t`. Eso hace válida la generación de izquierda a derecha. La **atención bidireccional (encoder)** deja que cada token vea toda la entrada; es lo que usaban los modelos tipo BERT para tareas de comprensión.

Una imagen concreta con un prompt corto:

```
Tokens:  [The] [cat] [sat] [on] [the] [mat]
Al predecir después de "sat":
  "sat" puede ver: The, cat, sat
  "sat" no puede ver: on, the, mat   (máscara causal)
```

El coste famoso: la atención completa ingenua es **O(n²)** en la longitud de secuencia, tanto en cómputo como en el patrón de almacenamiento de scores. Duplicas el contexto y, grosso modo, multiplicas por 4 el trabajo de atención (antes de kernels y aproximaciones). Por eso el contexto largo es a la vez feature de producto y problema de sistemas.

---

## Encoder, decoder y los modelos que usas de verdad

El paper de 2017 usaba un stack **encoder-decoder** para traducción: el encoder lee la frase fuente por completo; el decoder genera el destino con atención causal más cross-attention hacia los estados del encoder.

El mapa práctico de hoy es más simple:

| Familia | Patrón | Uso típico |
| --- | --- | --- |
| **Solo encoder** | Stack bidireccional | Clasificación, embeddings, NER (estilo BERT) |
| **Solo decoder** | Stack causal | Chat, código, agentes, la mayoría de LLMs frontera |
| **Encoder-decoder** | Ambos stacks | Traducción, algo de resumen / tareas seq2seq |

Cuando en producto se dice "LLM" en 2025-2026, casi siempre es un transformer **solo decoder** entrenado para predecir el siguiente token y luego ajustado con instrucciones y alineación. Los solo-encoder siguen importando para embeddings de retrieval y NLP clásico. Los encoder-decoder siguen en trabajo seq2seq especializado. La matemática de atención es compartida; cambian la máscara y el objetivo de entrenamiento.

Profundidad, ancho (`d_model`), número de cabezas y ratio del feed-forward fijan el recuento de parámetros. Más parámetros pueden dar más calidad, pero también más pesos que cargar y más FLOPs por token.

---

## Qué significa de verdad una "ventana de contexto"

La **ventana de contexto** es el máximo de tokens sobre los que el modelo puede atender en un forward (prompt + tokens generados hasta el momento, según cómo cuente el producto).

**No es**:

* Memoria ilimitada y gratis para tu app
* Garantía de que el modelo use bien el medio de un prompt largo
* Lo mismo que "tamaño de datos de entrenamiento"

**Sí es**:

* Un límite duro de arquitectura y de producto (config + posiciones entrenadas + política de serving)
* Un presupuesto compartido entre system prompt, docs recuperados, historial de chat, trazas de tools y la respuesta
* Un motor de coste y latencia, porque atención y almacenamiento KV crecen con los tokens

| Qué metes en contexto | Qué te cuesta |
| --- | --- |
| Instrucciones de sistema | Tokens base estables en cada request |
| Chunks de RAG | Suele ser la variable más grande |
| Historial multi-turno | Crece hasta truncar o resumir |
| Tool calls / trazas JSON | Fácil de subestimar |
| La propia salida del modelo | Cuenta en la ventana mientras genera |

Regla práctica: trata el contexto como un working set, no como un basurero. La calidad del retrieval gana a meter otras 20 páginas "por si acaso". Los modelos de contexto largo ayudan, pero no cancelan un mal prompt ni un retrieval descuidado.

Vigila también el desajuste de tokenizador. Límites y facturación van en **tokens**, no en palabras o caracteres. Un dump de logs lleno de UUIDs y base64 puede quemar la ventana muy rápido.

---

## Por qué importa la caché KV en inferencia

Entrenar y hacer prefill es una historia. La generación interactiva es otra.

Si generas token a token, una implementación ingenua reejecutaría el modelo completo sobre todo el prefijo en cada token nuevo. Es correcto y absurdamente caro.

La **caché KV** guarda los tensores Key y Value ya calculados de tokens pasados en cada capa. Para el token nuevo solo calculas su Q/K/V, atiendes contra el historial K/V en caché y añades el nuevo K/V.

```
Prefill (prompt una vez):
  for each prompt token: compute K, V → store in cache
  produce first output distribution

Decode (un token cada vez):
  compute Q, K, V for new token only
  attend to cached K, V (+ new)
  append new K, V
  sample / argmax next token
  repeat
```

Por qué le importa a un ingeniero:

1. **Forma de la latencia:** El prefill suele ser pesado en cómputo y paralelo sobre el prompt. El decode suele estar acotado por ancho de banda de memoria: mueves pesos y una caché creciente con batch pequeño (a menudo 1).
2. **VRAM:** El tamaño de la caché escala con `layers x heads x seq_len x head_dim x precision` (y batch). Chats largos y batches grandes revientan memoria aunque quepan los pesos.
3. **Throughput:** Continuous batching y paged attention (ideas de sistemas en stacks de serving de producción) existen en gran parte para gestionar el layout KV y evitar fragmentación.
4. **APIs multi-turno:** El "estado de conversación" en servidor suele ser "mantener o reconstruir KV". Por eso algunas plataformas cobran distinto el input cacheado del input fresco cuando reutilizan prefijos.

Modelo mental de presión de memoria:

| Palanca | Efecto en la caché KV |
| --- | --- |
| Prompt / historial más largo | Crecimiento lineal en seq_len |
| Batch mayor (usuarios concurrentes) | Crecimiento lineal en batch |
| Más capas / cabezas / ancho | Lineal en la forma del modelo |
| FP16 → FP8 / INT8 / KV cuantizado | Menos bytes por elemento (calidad variable) |
| Ventana deslizante / atención sparsa | Limita hasta dónde miras y puede acotar la caché |

Si la GPU hace OOM a mitad de conversación, los pesos no siempre son el villano. La caché suele ser la culpable.

---

## Juntando las piezas: ciclo de vida de un request

1. **Tokenizar** el prompt.
2. **Embedder** los tokens y añadir posición.
3. **Prefill** por N bloques transformer (atención + feed-forward en cada uno), construyendo la caché KV.
4. **Muestrear** el siguiente token de los logits finales (temperatura, top-p, etc. viven aquí).
5. **Decode:** añadir token, actualizar caché, muestrear otra vez hasta stop o max tokens.
6. **Detokenizar** para el usuario.

Dónde duele en producción:

* System prompts enormes hacen pagar un prefill grande en cada request (salvo que acierte el prefix caching).
* RAG sin presupuestos de chunk convierte un chat barato en un trabajo de contexto largo.
* Alta concurrencia multiplica la memoria KV.
* Los límites de tokens de salida capan el coste, pero el usuario siente el TTFT (time to first token) del prefill y los tokens/s del ancho de banda de decode.

---

## Qué recordar al diseñar sistemas

* Los **embeddings** llevan tokens discretos al espacio vectorial donde opera la pila.
* La **atención** es mezcla selectiva de información en la secuencia; las máscaras causales hacen viable la generación.
* **Encoder vs decoder** es sobre todo máscara + objetivo; la mayoría de LLMs de chat son solo decoder.
* La **ventana de contexto** es un presupuesto compartido de tokens y un centro de coste más o menos cuadrático, no almacenamiento gratis.
* La **caché KV** hace factible el decoding interactivo y es un motor principal de VRAM de inferencia y de la estrategia de batching.

Si te quedas con una sola frase de sistemas: **el prefill construye la caché, el decode lee una caché creciente mientras hace stream de pesos, y la factura sigue a los tokens en ambas fases.**

Eso basta para leer docs de producto, dimensionar GPUs y discutir con el equipo de modelos sin fingir que reescribiste el álgebra del paper de 2017.
