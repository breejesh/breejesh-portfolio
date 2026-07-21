---
title: "Gemini 3.6 Flash: 17% menos tokens, Lite a 350 tok/s y un especialista en ciber"
description: "Google lanza Gemini 3.6 Flash, 3.5 Flash-Lite y 3.5 Flash Cyber en CodeMender. Benchmarks, precios $1.50/$7.50, 350 tok/s y computer use nativo."
date: 2026-07-21
tags: [IA, Gemini, LLM, Google, Benchmarks, Ciberseguridad]
coverImage: /assets/images/gemini-3-6-flash-cover.webp
previewImage: /assets/images/gemini-3-6-flash-cover.webp
---

Google publicó tres modelos ligeros de una vez: **Gemini 3.6 Flash**, **Gemini 3.5 Flash-Lite** y **Gemini 3.5 Flash Cyber**.

Si operas agentes en producción, el cuello de botella casi nunca es solo "¿es el modelo lo bastante listo?". Suele ser el gasto de tokens, la latencia y el coste por tarea terminada. Este lanzamiento apunta a ese bucle: menos verbosidad, decodificación más rápida y una variante de seguridad para CodeMender.

Mapa rápido de los tres:

| Modelo | Rol | Cifra destacada |
| --- | --- | --- |
| **3.6 Flash** | Caballo de batalla (código, multimodal, general) | ~17% menos tokens de salida vs 3.5 Flash |
| **3.5 Flash-Lite** | Alto throughput, trabajo de volumen barato | **350** tokens de salida/seg |
| **3.5 Flash Cyber** | Agente de seguridad dentro de CodeMender | Resultados CyberGym de frontera a coste Flash |

---

## Gemini 3.6 Flash: mejores respuestas, menos relleno

3.6 Flash sustituye a 3.5 Flash como modelo principal de código y multimodal. Google no lo vende como un flex de parámetros. El mensaje es ejecuciones de agente más limpias: menos tokens tirados mientras las herramientas dan vueltas.

![Eficiencia de tokens y menor verbosidad de Gemini 3.6 Flash en OSWorld (Google)](https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-3-6-flash__evals__figure-.width-1200.format-webp.webp)

*Fuente: [Google Blog, anuncio de Gemini 3.6 Flash](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)*

### Números de eficiencia que importan

* **~17% menos tokens de salida** en el índice de Artificial Analysis frente a 3.5 Flash para el mismo trabajo.
* **Hasta ~65% menos tokens de salida en código** (estilos DeepSWE), por menos bucles muertos y ediciones más cortas.
* **Precio:** **$1.50 / 1M entrada** y **$7.50 / 1M salida**.

En agentes multi-paso pagas menos dos veces: generaciones más cortas y tarifa más baja sobre lo que queda.

![Mejoras de Gemini 3.6 Flash en DeepSWE, MLE Bench y OSWorld (Google)](https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-3-6-flash__evals__quality.width-1200.format-webp.webp)

*Fuente: [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)*

### Calidad (no solo más barato)

| Benchmark | 3.5 Flash | 3.6 Flash | Qué mide |
| --- | --- | --- | --- |
| DeepSWE | 37.0% | **49.0%** | Precisión de edición de código y resolución de issues |
| MLE Bench | 49.7% | **63.9%** | Flujos de ingeniería ML |
| OSWorld-Verified | 78.4% | **83.0%** | Computer use y navegación GUI |
| GDPval-AA v2 | 1349 | **1421** | Documentos multimodales y razonamiento |

### Computer use nativo en el cliente

Computer use pasa a ser herramienta de cliente de primera clase en la API de Gemini y Gemini Enterprise. No hace falta un montón de wrappers para que el modelo lea pantalla, haga clic y mueva la UI.

Google también endureció la resistencia a jailbreaks CBRN y de ciberofensa, intentando no romper prompts normales de desarrolladores.

---

## Gemini 3.5 Flash-Lite: 350 tokens por segundo

Cuando el trabajo es volumen y latencia, no razonamiento multi-hop profundo, **3.5 Flash-Lite** es el SKU de volumen.

![Posicionamiento de precio y rendimiento de Gemini 3.5 Flash-Lite (Google)](https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-3-5-flash-lite__evals__co.width-1200.format-webp.webp)

*Fuente: [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)*

* **Velocidad:** **350 tokens de salida/seg** en el índice de Artificial Analysis (el más rápido de la familia 3.5 que cita Google aquí).
* **Precio:** **$0.30 / 1M entrada**, **$2.50 / 1M salida**.
* **Encaja en:** extracción masiva de documentos, agentes de búsqueda a alto QPS, pipelines de tickets/recibos, bucles cortos de prototipado de UI.

Frente a Flash-Lite anteriores, Google habla de un salto claro de calidad sin renunciar a respuestas sub-segundo bajo QPS alto.

---

## Gemini 3.5 Flash Cyber y CodeMender

Encontrar y parchear vulnerabilidades es un problema de agentes con curva de coste fea si cada paso usa un generalista gigante.

**3.5 Flash Cyber** es la variante Flash afinada en seguridad que corre dentro de **CodeMender**, el stack de agentes de seguridad de código de Google.

![Rendimiento de Gemini 3.5 Flash Cyber en CodeMender sobre CyberGym (Google)](https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-3-5-flash-cyber__evals__c.width-1200.format-webp.webp)

*Fuente: [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)*

* Varios agentes Cyber pueden correr en paralelo en CodeMender: auditar, validar, proponer parches.
* CyberGym se describe a nivel frontera con gasto de clase Flash.
* Acceso limitado: partners enterprise y gobierno de confianza vía CodeMender; aplica política de doble uso.

---

## Precios lado a lado

| Modelo | Entrada / 1M | Salida / 1M | Mejor cuando |
| --- | --- | --- | --- |
| **3.6 Flash** | $1.50 | $7.50 | Agente / código / multimodal por defecto |
| **3.5 Flash-Lite** | $0.30 | $2.50 | Throughput y trabajos masivos |
| **3.5 Flash Cyber** | partner | partner | Solo agentes de seguridad CodeMender |

Las cifras de Flash públicas son las listadas por Google. Revisa siempre la [página de precios](https://ai.google.dev/pricing) antes de presupuestar una flota.

---

## Disponibilidad y lo que Google dijo después

* **3.6 Flash:** API de Gemini, AI Studio, Gemini Enterprise, app de consumidor Gemini.
* **3.5 Flash-Lite:** API y AI Studio ya, con despliegue en Search mencionado.
* **3.5 Pro:** pruebas con partners, lanzamiento público "pronto" en el lenguaje de Google.
* **Gemini 4:** pre-entrenamiento en marcha (afirmación de Google, no fecha de envío).

---

## A quién le importa

* **Quien construye agentes:** 3.6 Flash es el cambio por defecto si los bucles de tools se comían la factura.
* **Pipelines de alto QPS:** Flash-Lite a 350 tok/s y $0.30/$2.50 es el carril de volumen.
* **Equipos de seguridad ya en el camino enterprise de Google:** Cyber + CodeMender es la vía especializada, no un free-for-all público.

Si solo pruebas una cosa esta semana, corre la misma suite de agentes en 3.5 Flash vs 3.6 Flash y registra **tokens por tarea terminada** y tasa de acierto. Ese A/B suele decir más que un gráfico de blog.

Anuncio completo: [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/).
