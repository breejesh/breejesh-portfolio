---
title: "Kimi K3.1 Pro: a tres puntos de la frontera y a doce días de los pesos abiertos"
description: "Kimi K3.1 Pro de Moonshot es el mismo modelo de 2,8 billones de parámetros que K3, con mucho más aprendizaje por refuerzo. Obtiene 55 en el Intelligence Index de Artificial Analysis, tres puntos por debajo de Claude Opus 5.5, cuesta 2 / 10 dólares por millón de tokens y sus pesos están prometidos para el 4 de noviembre. Esto es lo que significan de verdad la rebaja de precio, los benchmarks y el filtrado de ciberseguridad."
date: "2026-10-23"
tags: [IA y Machine Learning]
coverImage: /assets/images/kimi-k3-1-pro.webp
previewImage: /assets/images/kimi-k3-1-pro.webp
---

> **TL;DR**
> * **El detonante:** Moonshot AI lanzó Kimi K3.1 Pro y una variante más rápida, K3.1 Pro Highspeed, el 23 de octubre de 2026. Ya está disponible en las apps de Kimi, Kimi Work, Kimi Code y la API, a 2 / 10 dólares por millón de tokens de entrada / salida. Moonshot dice que publicará los pesos completos antes del 4 de noviembre.
> * **El mecanismo:** No hay arquitectura nueva. K3.1 Pro es K3, el modelo mixture-of-experts de 2,8 billones de parámetros de julio, sometido a mucho más post-entrenamiento: aprendizaje por refuerzo a gran escala en cientos de dominios de tareas. En el Intelligence Index de Artificial Analysis pasa de 44 a 55, cuarto en la clasificación general y a tres puntos de Claude Opus 5.5.
> * **La perspectiva:** El precio por token bajó un tercio, pero el coste por tarea apenas se movió porque el modelo escribe más. La verdadera noticia es el calendario. Si los pesos llegan como se prometió, la distancia entre el mejor modelo abierto y el mejor cerrado se reduce a tres puntos del índice.

En julio escribí que [Kimi K3 era un modelo abierto sólido y no un asesino de Fable 5](/blog/es/kimi-k3-benchmarks). Tres meses después Moonshot vuelve con un modelo más cerca de la frontera, más barato por token y todavía no del todo en la cima.

Lo interesante es cómo llegó hasta aquí. No entrenó un modelo más grande. Gastó más cómputo en enseñar al mismo.

---

## Lo que se lanzó

| Elemento | Kimi K3 (julio) | Kimi K3.1 Pro | K3.1 Pro Highspeed |
| --- | --- | --- | --- |
| Parámetros totales / activos | MoE de 2,8 billones | Mismas dimensiones que K3; se reportan unos 104.000 millones activos | Mismo modelo, servicio más rápido |
| Ventana de contexto | 1 millón de tokens | 1 millón de tokens | 1 millón de tokens |
| Modalidades de entrada | Texto, imagen | Texto, imagen | Texto, imagen |
| Precio de entrada / salida (por millón de tokens) | 3 / 15 $ | 2 / 10 $ | 4 / 20 $ |
| Entrada en caché (por millón de tokens) | 0,30 $ | 0,20 $ | 0,20 $ |
| Velocidad | n/d | Referencia | De 2 a 3 veces más rápido, según Moonshot |
| ID de modelo en la API | `kimi-k3` | `kimi-k3.1-pro` | `kimi-k3.1-pro-highspeed` |
| Pesos | Publicados | Prometidos antes del 4 de noviembre | Los mismos pesos |

Moonshot describe K3.1 Pro como "una versión post-entrenada de Kimi K3, con un cómputo de post-entrenamiento sustancialmente mayor". El mérito es de la infraestructura, no de la arquitectura: su framework de aprendizaje por refuerzo, la inferencia de contexto largo, los entornos sandbox, la planificación de rollouts y los controles de calidad de los entornos.

Algunos detalles prácticos importan más que el titular. La API usa por defecto el esfuerzo de razonamiento máximo y fija la temperatura en 1,0. Los clientes de la API pueden usar Zero Data Retention. Las entradas alojadas van a servidores que la política de privacidad de Moonshot sitúa en Singapur. El acceso empresarial viene desactivado, así que un administrador tiene que activarlo.

---

## El mismo modelo, más enseñanza

Este es el patrón del año. Preentrenar un modelo base de escala frontera es carísimo y lleva meses. El post-entrenamiento (aprendizaje por refuerzo en tareas con resultado verificable, como pasar tests, resolver problemas de terminal o rellenar bien una hoja de cálculo) es más barato por punto de mejora y mucho más rápido de repetir.

K3.1 Pro es el ejemplo más claro hasta ahora de cuánto quedaba por sacar de un modelo base. Las cifras internas de Moonshot muestran dónde fue el aprendizaje por refuerzo:

| Evaluación interna (Moonshot) | Kimi K3 | Kimi K3.1 Pro |
| --- | --- | --- |
| Kimi Code Bench 3.0, horizonte largo | 55,95 % | 61,2 % |
| Modelización financiera | 50,4 | 57,6 |
| Investigación financiera | 58,8 | 70,4 |
| Operaciones de negocio | 8,9 | 37,0 |
| Kimi Hallu Bench Hard, alucinación por afirmación (menos es mejor) | 23,4 % | 8,3 % |

El salto en operaciones de negocio, de unas 4 veces, es el tipo de resultado que aparece cuando un modelo se entrena en una familia de tareas que antes apenas había visto. La caída de alucinaciones es la que querría ver verificada de forma independiente, y en parte ya lo está: en la prueba AA-Omniscience de Artificial Analysis, la tasa de alucinación bajó del 53 % al 44 %. Es un avance real, pero mucho menor que el que muestra el benchmark interno de Moonshot.

---

## Los benchmarks, primero los independientes

### Artificial Analysis

| Métrica | Kimi K3 | Kimi K3.1 Pro | Contexto |
| --- | --- | --- | --- |
| Intelligence Index | 44 | **55** (4.º en general) | Opus 5.5: 58; Sonnet 5.5 y Muse Wonder Full: 56 |
| Terminal-Bench 4.0 | 13 % | 67 % | Sonnet 5.5: 64 % |
| GDPval-AA (Elo) | 1.534 | 1.846 | Opus 5.5: 1.866; Wonder Full: 1.857 |
| Humanity's Last Exam | 47 % | 52 % | Opus 5.5: 61 % |
| CritPt | 23 % | 25 % | Opus 5.5: 32 % |
| SciCode | 59 % | 61 % | |
| AutomationBench-AA | 58 % | 73 % | Opus 5.5: 70 % |
| Cyber Index | 41 % | 64 % | El más alto de cualquier modelo disponible abiertamente |

El patrón es claro. Las mayores mejoras están en tareas agénticas y de oficina: trabajo en terminal, automatización y tareas con valor económico. Las menores, en razonamiento científico difícil (CritPt, SciCode, Humanity's Last Exam), donde Opus 5.5 sigue claramente por delante. El aprendizaje por refuerzo en tareas verificables mejora aquello en lo que entrena. No convierte a un modelo en mejor físico.

Una advertencia al comparar entre artículos. En julio, Artificial Analysis le dio a K3 un 57. Ahora lo lista con 44. El modelo no empeoró. El índice se revisó, y las versiones de los benchmarks también cambiaron: K3 sacó 88,3 en Terminal-Bench 2.1 y un 13 % en Terminal-Bench 4.0. Compara solo cifras de la misma versión del mismo tablero.

### La tabla de Moonshot

| Benchmark (reportado por Moonshot, esfuerzo máximo) | K3.1 Pro | Claude Opus 5.5 | GPT-6 Astra | DeepSeek V4.1 Flash |
| --- | --- | --- | --- | --- |
| Terminal-Bench 4.0 | 65,7 | 66,4 | 58,2 | 42,3 |
| SWE Marathon v1.1 | 51,7 | 46,3 | 42,5 | 40,0 |
| DeepSWE v1.1 | 75,5 | 74,2 | 74,1 | 77,0 |
| HLE-Full (con herramientas) | 70,0 | 67,7 | 57,2 | 58,8 |
| BrowseComp | 92,1 | 90,8 | 91,5 | n/d |
| OfficeQA Pro v2 | 64,4 | 62,2 | 54,4 | 40,4 |
| GPQA Diamond | 94,2 | 93,9 | 96,1 | 92,2 |
| BenchCAD (con herramientas) | 92,7 | 96,2 | 95,9 | 81,6 |
| ExploitBench | 74,7 | 91,0 | 100 | n/d |

Destacan dos cosas. Primero, la cifra de Moonshot en Terminal-Bench 4.0 (65,7) deja a K3.1 Pro ligeramente *por detrás* de Opus 5.5, mientras que la ejecución de Artificial Analysis (67 %) lo pone ligeramente por delante. Dentro del margen que introduce la configuración del arnés de pruebas, es un empate. Segundo, estas filas vienen de configuraciones de evaluación distintas para modelos distintos, no de una comparación controlada única. Tómalas como evidencia sobre el producto, no como una clasificación limpia.

La ventaja en SWE Marathon, 51,7 frente a 46,3 de Opus, es la cifra que Moonshot más va a promocionar. El trabajo en proyectos de varias horas es justo lo que debería mejorar un aprendizaje por refuerzo intenso en programación de horizonte largo. También es autodeclarada, así que esperaría al tablero público antes de fiarme de ella.

---

## La rebaja de precio que casi no lo es

La tarifa bajó un tercio: de 3 / 15 a 2 / 10 dólares. Eso deja a K3.1 Pro exactamente al mismo precio de lista que Claude Sonnet 5.5 y GPT-6 Sol, el [nivel de 2 / 10 dólares en el que todos convergieron](/blog/es/frontier-model-price-convergence) este mes.

Ahora mira la factura por tarea:

| | Kimi K3 | Kimi K3.1 Pro | Cambio |
| --- | --- | --- | --- |
| Precio de entrada / salida por millón de tokens | 3 / 15 $ | 2 / 10 $ | -33 % |
| Tokens de salida medios por tarea del Intelligence Index | ~48.000 | ~55.000 | +14 % |
| Coste por tarea del Intelligence Index (informe de lanzamiento de AA) | ~2,00 $ | ~1,98 $ | ~-1 % |

El modelo es más capaz y escribe más para conseguirlo. Los tokens más baratos se compensan casi exactamente con los tokens extra. Artificial Analysis cuenta unos 150 millones de tokens de salida para ejecutar su índice completo con K3.1 Pro, frente a una mediana de unos 81 millones en modelos comparables, y mide su velocidad de salida cerca de la cola de los modelos que sigue.

Eso no lo hace caro. A unos 2 dólares por tarea del índice sigue costando más o menos un tercio de lo que cuesta Opus 5.5 en la misma batería. Pero el resumen honesto es "el mismo precio por un modelo mucho mejor", no "una rebaja". Y la variante Highspeed, a 4 / 20 dólares, cuesta por token lo mismo que Opus 5.5.

El resto del mercado, para comparar:

| Modelo | Entrada / salida (por millón de tokens) |
| --- | --- |
| Xiaomi MiMo-V2.6-Pro | 0,435 / 0,87 $ |
| DeepSeek V4.1 Flash 1017 (pico) | 0,30 / 1,20 $ |
| Kimi K3.1 Pro | 2 / 10 $ |
| Claude Sonnet 5.5 / GPT-6 Sol | 2 / 10 $ |
| Kimi K3.1 Pro Highspeed | 4 / 20 $ |
| Claude Opus 5.5 / Meta Muse Wonder | 4 / 20 $ |
| GPT-6 Astra | 10 / 50 $ |

Moonshot no compite con DeepSeek en precio. Pone precio de modelo occidental de trabajo diario y apuesta a que los pesos abiertos y unas puntuaciones cercanas a Opus lo justifican.

---

## La línea de ciberseguridad que trazó Moonshot

El párrafo más interesante del anuncio trata de lo que Moonshot quitó. Dice que "identificó y eliminó los datos relacionados con ciberseguridad de ambas etapas de entrenamiento" para la versión de pesos abiertos, y enuncia un principio: "no pretendemos publicar pesos abiertos que amplíen la frontera absoluta de la capacidad ofensiva en ciberseguridad".

Publicó el coste de esa decisión en su xdev-bench-hard interno (pass@3):

| Checkpoint | xdev-bench-hard |
| --- | --- |
| K3.1 Pro antes de la reducción de riesgo | 90,5 % |
| K3.1 Pro tal como se lanzó | 81,0 % |
| DeepSeek V4.1 Flash | 85,7 % |
| GLM-5.3 | 57,1 % |
| Kimi K3 | 33,3 % |

Es raro que un laboratorio publique una cifra de antes y después por limitar deliberadamente una capacidad en pesos abiertos. Sigue la lógica del [umbral cibernético crítico de GPT-6 Astra](/blog/es/gpt-6-astra-critical-cyber-threshold): una vez que los pesos son públicos no hay manera de restringir el acceso después, así que la restricción tiene que ocurrir durante el entrenamiento.

Pero hay una tensión. Incluso tras el filtrado, Artificial Analysis sitúa a K3.1 Pro como el modelo disponible abiertamente más fuerte en su Cyber Index (64 %) y reporta un 95 % en CyberGym-E2E-AA, sin rechazos por seguridad en sus pruebas. El modelo publicado sigue sacando más del doble que K3 en el propio benchmark de exploits de Moonshot. Moonshot dice que su capacidad en ciberseguridad "sigue por detrás de la de los modelos propietarios de frontera", y es cierto. Pero por detrás de la frontera sigue siendo muy por encima de cualquier cosa descargable libremente hace un año.

---

## Lo que de verdad te dan 2,8 billones de parámetros abiertos

"Pesos abiertos" a este tamaño no significa que puedas ejecutarlo en tu portátil. Para K3, en julio, Moonshot recomendaba un supernodo de 64 aceleradores o más para alojarlo uno mismo. K3.1 Pro tiene las mismas dimensiones, así que planifica la misma escala.

Quienes salen ganando son concretos:

1. **Proveedores de inferencia.** Cualquiera con un clúster grande puede alojarlo y competir con la API de Moonshot en precio y velocidad. Es de esperar que aparezcan en OpenRouter varios proveedores pocos días después de la publicación de los pesos.
2. **Despliegues soberanos y regulados.** Gobiernos, bancos y hospitales que no pueden enviar datos a Singapur, ni a ninguna API alojada, consiguen un modelo casi de frontera que pueden ejecutar en su propio hardware.
3. **Quienes hacen fine-tuning e investigadores.** Una base de 55 puntos para destilar, especializar o estudiar es algo que ninguna publicación abierta había ofrecido antes.

Para todos los demás, K3.1 Pro es una API alojada que además tiene un checkpoint público. Eso sigue importando: pone un techo a lo que los laboratorios cerrados pueden cobrar por este nivel de capacidad.

---

## Qué vigilar antes del 4 de noviembre

1. **La licencia.** Moonshot ha dicho "licencia abierta" y nada más. Kimi K2 salió con una licencia MIT modificada que solo añade un requisito de atribución para despliegues comerciales muy grandes. Cualquier cosa más estricta sería la noticia.
2. **Si los pesos coinciden con la API.** El checkpoint filtrado en ciberseguridad se describe como el modelo publicado. Comprueba que los pesos descargables y `kimi-k3.1-pro` se comportan igual en pruebas independientes.
3. **Resultados independientes de SWE Marathon y DeepSWE.** Son las afirmaciones de programación que justifican el precio. Los tableros públicos deberían confirmarlas o desinflarlas en unas semanas.
4. **Precios de alojamiento de terceros.** Si otros proveedores lo sirven muy por debajo de 2 / 10 dólares, la tarifa de Moonshot deja de ser el precio de referencia.

---

## Lo que queda

La página de investigación de Moonshot tiene una frase que describe su estrategia: "Nuestra investigación busca la conversión óptima de energía en inteligencia".

K3.1 Pro muestra lo que eso significa en la práctica. Los mismos parámetros y la misma arquitectura, con once puntos ganados en el índice solo con post-entrenamiento. Si la ventaja de los laboratorios cerrados depende ahora sobre todo del post-entrenamiento, y el post-entrenamiento es la parte barata de repetir, una distancia de tres puntos no va a durar mucho.

---

## Fuentes

* [Anuncio de Kimi K3.1 Pro (Moonshot AI)](https://www.kimi.com/blog/kimi-k3-1-pro)
* [Kimi K3.1 Pro: análisis de inteligencia, rendimiento y precio (Artificial Analysis)](https://artificialanalysis.ai/models/kimi-k3-1-pro)
* [Moonshot's Kimi K3.1 Pro flirts with open weights leadership (VentureBeat)](https://venturebeat.com/technology/moonshots-kimi-k3-1-pro-flirts-with-open-weights-leadership-amid-paid-influencer-scandal-allegations)
* [Kimi K3.1 Pro: 1M Context, 3T Open Weights (Tech Insider)](https://tech-insider.org/kimi-k3-1-pro-moonshot-ai-1m-context-open-weight-2026/)
* [Kimi continues to challenge the frontier with K3.1 Pro (The Rundown AI)](https://www.therundown.ai/articles/kimi-continues-to-challenge-the-frontier-with-k3-1-pro)
* Relacionado: [Kimi K3 más allá del hype](/blog/es/kimi-k3-benchmarks), [la convergencia de precios en 2 / 10 dólares](/blog/es/frontier-model-price-convergence) y [las subidas de precio de DeepSeek](/blog/es/deepseek-price-hikes-china-ai-repricing)
