---
title: "Ahora todos cobran 2 y 10 dólares: la guerra de precios de los modelos de frontera terminó en empate y se mudó a un lugar más difícil de ver"
description: "Claude Sonnet 5.5, Gemini 4 Argon y GPT-6.1 Sol de OpenAI aterrizaron en unos 2 dólares por millón de tokens de entrada y 10 por millón de salida. Haiku 5.5 bajó a 0,10. Las diferencias reales de precio se esconden ahora en los niveles de esfuerzo, los tokenizadores, los umbrales de contexto y los periodos introductorios."
date: "2026-10-14"
tags: [IA y Machine Learning, Negocios Tech y Finanzas]
coverImage: /assets/images/frontier-model-price-convergence.webp
previewImage: /assets/images/frontier-model-price-convergence.webp
---

> **TL;DR**
> * **El detonante:** Entre el 22 de septiembre y el 13 de octubre, Anthropic lanzó Opus 5.5, Sonnet 5.5 y Haiku 5.5, OpenAI pasó ChatGPT a GPT-6 y listó GPT-6.1 Sol en su API, y Google puso Gemini 4 Argon a disposición general. El nivel de caballo de batalla convergió en unos 2 dólares por millón de tokens de entrada y 10 por millón de salida.
> * **El mecanismo:** Cuando los precios de lista coinciden, los proveedores compiten en las partes de la factura más difíciles de comparar: tokens por tarea, niveles de esfuerzo, cambios de tokenizador, recargos por contexto largo, precio de la caché y tarifas introductorias que caducan. El precio de Gemini 4 Argon se duplica después del 30 de noviembre. El de Haiku 5.5 se multiplica por 5 por encima de los 100.000 tokens.
> * **La perspectiva:** El precio por token ya no sirve para comparar. Los equipos que eligen modelos por la tarifa pagarán de más. Los que midan el coste por tarea completada en sus propias cargas, y vuelvan a medir tras cada actualización de modelo, no.

Esta semana abrí cuatro páginas de precios y tuve la extraña experiencia de ver los mismos dos números en tres de ellas.

2 dólares por millón de tokens de entrada. 10 dólares por millón de tokens de salida.

Claude Sonnet 5.5. Gemini 4 Argon, a su precio introductorio. Y, según los rastreadores de precios, GPT-6.1 Sol de OpenAI. Tres laboratorios que pasaron dos años rebajándose unos a otros han llegado, para sus principales modelos de trabajo, a la misma tarifa.

Eso no significa que la guerra de precios haya terminado. Significa que se ha mudado.

---

## Las tarifas, una al lado de otra

| Modelo | Lanzamiento | Entrada / Salida (por 1M de tokens) | Notas |
| --- | --- | --- | --- |
| Claude Fable 5.1 | A principios de 2026 | 10 $ / 50 $ | El nivel superior de Anthropic |
| GPT-6 Astra | 3 sep. | 10 $ / 50 $ | Primer modelo "Critical" en ciber; tareas ofensivas restringidas |
| Claude Opus 5.5 | 22 sep. | 4 $ / 20 $ | Rebajado desde 5 $ / 25 $; lecturas de caché a 0,20 $ (antes 0,50 $); modo rápido 8 $ / 40 $ |
| Claude Sonnet 5.5 | 28 sep. | 2 $ / 10 $ | Mismo precio de lista que Sonnet 5; Anthropic afirma hasta un 30% menos por tarea |
| GPT-6.1 Sol | Finales de sep. | 2 $ / 10 $ (según los rastreadores de precios) | Contexto de 1,1M reportado |
| Gemini 4 Argon | Disponible el 13 oct. | 2 $ / 10 $ introductorio, luego 4 $ / 20 $ desde el 1 dic. | Entrada en caché un 95% más barata; hasta 1M de tokens |
| Gemini 3.8 Flash | 3 sep. | 0,75 $ / 3,75 $ | Introductorio hasta el 31 dic. |
| Claude Haiku 5.5 | 7 oct. | 0,10 $ / 0,50 $ por debajo de 100K tokens; 0,50 $ / 2,50 $ por encima | Contexto de 1M, salida de 128K; ese mismo día se redujeron a la mitad las lecturas de caché de Sonnet 5.5 |

Los niveles son ya evidentes. Un nivel premium a 10 $ / 50 $, cada vez más restringido por identidad para las capacidades más sensibles. Un nivel de trabajo a unos 2 $ / 10 $. Un nivel económico de 0,10 a 0,75 $ de entrada. Opus de Anthropic se sitúa entre los dos primeros, y es una elección deliberada: lo bastante cerca del precio de trabajo como para que los usuarios intensivos dejen de esquivarlo.

---

## Dónde vive ahora el precio real

Si la etiqueta es la misma, la factura no. Aquí es adonde se movieron las diferencias.

### 1. Tokens por tarea

El argumento de Anthropic para Sonnet 5.5 no es una tarifa más baja. Es que el modelo termina el mismo trabajo con menos tokens, así que pagas hasta un 30% menos por tarea. Es un efecto real cuando se cumple. Pero evaluadores independientes han señalado la otra cara: en el nivel de esfuerzo máximo, el modelo alcanza las mejores puntuaciones gastando muchos más tokens, y la factura puede subir en vez de bajar. Un análisis estimó que solo el dial de esfuerzo puede hacer variar el coste por un factor de veinte.

### 2. Niveles de esfuerzo y valores por defecto

La afirmación de que Opus 5.5 es "en torno a un 40% más barato de ejecutar que Opus 5" compara cada modelo con su esfuerzo por defecto, que para Opus 5.5 es medio y para Opus 5 era alto. Mientras tanto, las victorias en benchmarks se reportaron con esfuerzo máximo. Ambas afirmaciones pueden ser ciertas. Simplemente describen productos distintos.

### 3. Tokenizadores

Un análisis de Haiku 5.5 encontró que su nuevo tokenizador cuenta el mismo texto como aproximadamente un 30% más de tokens que Haiku 4.5. Un precio un 75% más bajo sobre un 30% más de tokens sigue siendo un gran recorte, pero no es el del titular. Cada vez que un proveedor cambia de tokenizador, tu comparación por token se rompe en silencio.

### 4. Umbrales y escalones

* Haiku 5.5 cuesta 5 veces más por token en prompts de más de 100K tokens.
* Los 2 $ / 10 $ de Gemini 4 Argon son introductorios. Tras el 30 de noviembre pasan a 4 $ / 20 $ para el modelo público.
* El precio de Gemini 3.8 Flash es introductorio hasta el 31 de diciembre.

Si haces benchmarks en octubre para un sistema que ejecutarás en enero, estás evaluando un precio que no existirá.

### 5. Precio de la caché

En cargas de agentes que releen el mismo código o conjunto de documentos, el precio de lectura de caché importa más que el de entrada. Anthropic recortó un 60% las lecturas de caché de Opus 5.5 y redujo a la mitad las de Sonnet 5.5. Google fija la entrada en caché de Argon un 95% por debajo de la entrada nueva. Para un agente de programación de larga duración, estas cifras dominan la factura.

---

## Por qué ocurrió la convergencia

Varias fuerzas empujaron el nivel de trabajo al mismo punto a la vez:

* **Economía de hardware compartida.** Los laboratorios compran aceleradores parecidos, de Nvidia o silicio a medida fabricado por Broadcom, a precios parecidos y con las mismas restricciones de HBM. Los costes de servir convergen, y los precios también.
* **Compras empresariales.** Los grandes compradores usan cada vez más routers multimodelo. Un modelo un 30% más caro que sus pares con calidad similar simplemente pierde tráfico.
* **El nivel premium se lleva el margen.** Con las capacidades más altas restringidas (Daybreak de OpenAI, Fairwind de Google y Mythos 5.1 de Anthropic, liberado el 6 de octubre solo para defensores cibernéticos y científicos de ciencias de la vida verificados), el acceso de más valor se vende por confianza e identidad, no por precio por token.
* **Escala de consumo.** ChatGPT tiene ya más de 1.200 millones de usuarios semanales, y GPT-6 Sol y Luna llegaron a usuarios gratuitos y de pago en la primera semana de octubre. Cuando el producto de consumo es la distribución, el precio de la API es menos un centro de beneficio y más un punto de referencia.

---

## Cómo elegiría un modelo este trimestre

| Pregunta | Por qué importa más que la tarifa |
| --- | --- |
| ¿Cuál es el coste por tarea *completada* en mi conjunto de evaluación? | Recoge tokens por tarea, reintentos y fallos en una sola cifra |
| ¿Con qué nivel de esfuerzo? | El mismo modelo puede ser la opción más barata o la más cara según este dial |
| ¿Cuántos de mis prompts superan los 100K tokens? | Los recargos por contexto largo pueden dominar una carga de RAG o de agentes |
| ¿Cuál es mi tasa de aciertos de caché? | Para agentes, el precio de lectura de caché suele importar más que el de entrada |
| ¿Cuándo termina el precio introductorio? | Presupuesta el precio que pagarás, no el que probaste |
| ¿Cambió el tokenizador? | Vuelve a medir tras cada actualización de modelo, incluso dentro de una familia |

El patrón de router es el valor por defecto correcto. Manda el grueso del tráfico a un modelo económico, escala a un modelo de trabajo cuando el económico no supere un control de calidad, y reserva el nivel premium para la pequeña porción de tareas en las que cambia el resultado. Luego mide cada mes, porque los proveedores sin duda lo harán.

---

## Lo que queda

Tiene algo casi gracioso que tres competidores aterricen en 2 y 10 dólares. Parece la paz.

No lo es. La pelea simplemente se mudó a las notas al pie: un tokenizador, un esfuerzo por defecto, un umbral en 100.000 tokens, una fecha de fin el 30 de noviembre. El modelo más barato es ahora aquel cuyas notas al pie de verdad lees.

---

## Fuentes

* [Claude Opus 5.5 launch and price cut (BetaNews)](https://betanews.com/article/claude-opus-5-5-launch-price-cut/)
* [Claude Opus 5.5: benchmarks, pricing and real costs (MetricNexus)](https://metricnexus.ai/blog/claude-opus-5-5-benchmarks-pricing)
* [Claude Sonnet 5.5: benchmarks, pricing and real costs (MetricNexus)](https://metricnexus.ai/blog/claude-sonnet-5-5-benchmarks-pricing)
* [Reading the Claude Haiku 5.5 price table (BrainDetox)](https://braindetox.kr/en/posts/claude_haiku_5_5_release_pricing_2026.html)
* [Introducing Gemini 4 Argon (Google)](https://blog.google/intl/en-in/products/introducing-gemini-4-argon/)
* [GPT-6.1 Sol pricing (AnotherWrapper)](https://anotherwrapper.com/llm-pricing/gpt-6.1-sol)
* [OpenAI launches GPT-6 with Intelligent UI (TechStartups)](https://techstartups.com/2026/10/07/openai-launches-gpt-6-with-intelligent-ui-turning-chatgpt-into-an-interactive-visual-experience/)
* [Top Tech News Today, October 8, 2026 (TechStartups)](https://techstartups.com/2026/10/08/top-tech-news-today-october-8-2026-globalfoundries-google-manus-microsoft-nvidia-openai-tencent-more/)
* Relacionado: [Gemini 3.8 Flash y Flash Cyber](/blog/es/gemini-3-8-flash-cyber)
