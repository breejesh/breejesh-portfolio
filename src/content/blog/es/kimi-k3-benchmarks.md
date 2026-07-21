---
title: "Kimi K3 detrás del hype: ¿es realmente un asesino de Fable 5?"
description: "Detrás del hype de Kimi K3: benchmarks de Artificial Analysis, LMArena y Moonshot frente a Claude Fable 5. Spoiler: modelo open fuerte, no un asesino limpio de Fable 5."
date: 2026-07-19
tags: [IA, LLM, Benchmarks, Kimi, Moonshot AI]
coverImage: /assets/images/kimi-k3-cover.webp
previewImage: /assets/images/kimi-k3-cover.webp
---

El timeline trató a **Kimi K3** como el funeral de **Claude Fable 5**. Un modelo open de 2,8T, #1 en una arena de coding, scores de inteligencia cerca de la frontera. Luego llegaron los posts de "China acaba con la frontera".

Entonces: ¿es K3 realmente un asesino de Fable 5?

**No.** No en capacidad global. Moonshot admite que K3 sigue por detrás de **Claude Fable 5** y **GPT-5.6 Sol**. Los boards independientes lo ponen cerca de la clase Opus, no por encima de Fable. En unos pocos boards de coding pega arriba. En precio, velocidad y verbosidad no es poder gratis.

Lo que sigue son las pruebas: scores vendor vs independientes, y dónde el hype se pasa de los datos. Los boards en vivo para marcar están al final.

### Qué es realmente Kimi K3

Según el [post de lanzamiento de Moonshot](https://www.kimi.com/blog/kimi-k3):

- **2,8T de parámetros** totales, posicionado como abierto de clase 3T
- **Stable LatentMoE**: 896 expertos, **16 activos por token**
- **Kimi Delta Attention (KDA)** y **Attention Residuals** para secuencias largas y profundidad
- **Multimodal nativo**: texto + imagen (workflows de vídeo y capturas en demos de producto)
- Contexto de **1.048.576 tokens**, con precio API plano en toda la ventana
- Cerca de **2,5x de eficiencia de escalado** frente a Kimi K2, según Moonshot
- Notas de entrenamiento/servicio: pesos MXFP4 con activaciones MXFP8, y supernodo recomendado de **64+ aceleradores** para self-hosting

Precio API en el lanzamiento: **$0,30 / 1M input con cache hit**, **$3,00 / 1M input sin cache**, **$15,00 / 1M output**. Moonshot afirma que en coding en su stack suelen superar **90% de cache hits**.

Es caro para un lab chino, más cerca de tiers medios-altos occidentales que de precios antiguos de Kimi. La apuesta es que el coding de largo horizonte y el knowledge work paguen la factura de tokens.

### Benchmarks independientes (no diapositivas del vendor)

#### Artificial Analysis Intelligence Index

[Artificial Analysis](https://artificialanalysis.ai/models/kimi-k3/) es la foto pública de terceros más limpia justo después del lanzamiento.

| Métrica | Valor reportado (AA) | Notas |
| --- | --- | --- |
| Intelligence Index v4.1 | **57** | Cerca del **#4 de 186** modelos en el ranking de clase de AA |
| Velocidad de salida | **~36,9 tokens/s** | Claramente lento frente a la mediana de pares |
| Precio input / output | **$3 / $15** por 1M tokens | Cache hit input **$0,30** |
| Verbosidad en el eval | **~130M** tokens de salida en la corrida del índice | Muy por encima de una mediana ~63M |
| Ventana de contexto | **1M** tokens | Input multimodal texto + imagen |
| Coste total del eval | unos **$2,7k** por la suite completa del índice | El uso de tokens impulsa el coste |

El índice v4.1 combina nueve evaluaciones, entre ellas GDPval-AA v2, Terminal-Bench v2.1, SciCode, Humanity's Last Exam, GPQA Diamond, CritPt, AA-Omniscience y AA-LCR. La metodología completa está en [Artificial Analysis](https://artificialanalysis.ai/methodology/intelligence-benchmarking).

**Cómo leer el gráfico:** abre la [sección de Intelligence de Kimi K3](https://artificialanalysis.ai/models/kimi-k3/#intelligence) y el [scatter de coste por tarea](https://artificialanalysis.ai/models/kimi-k3/) en la misma página. La capacidad está cerca de la frontera. La eficiencia no es gratis.

Cobertura del lanzamiento también sitúa a K3 aproximadamente al nivel de **Claude Opus 4.8** y **GPT-5.5** en ese índice, y por detrás de **Claude Fable 5** y **GPT-5.6 Sol**. Eso encaja con la propia línea de Moonshot.

#### Vals Index

[Vals](https://www.vals.ai/models/kimi_kimi-k3) lista Kimi K3 en **74,70% ± 0,96** en el Vals Index (fecha de release 16 de julio de 2026), con 1M de contexto. Vals es una suite distinta orientada a enterprise: no mezcles el 74,7 con el 57 de AA como si compartieran escala.

#### LMArena Frontend Code Arena

Tras el unblinding, K3 debutó como **#1 en Frontend Code Arena de LMArena con 1679 Elo**, por delante de Claude Fable 5 en esa tabla, con un salto grande respecto a Kimi K2.6. Los recaps están en piezas como la [nota de BenchLM](https://benchlm.ai/blog/posts/kimi-3-release-data-coming-soon) y el [artículo de Simon Willison](https://simonwillison.net/2026/Jul/16/kimi-k3/).

Una tabla de preferencia no es toda la frontera. Sigue siendo una señal pública fuerte para frontend y UI, alineada con las demos de "vision in the loop" de Moonshot.

### Scores de coding de Moonshot (reportados por el vendor)

Estos números salen de la [tabla completa oficial](https://www.kimi.com/blog/kimi-k3#full-benchmark-table). La mayoría de filas de K3 se corrieron con el harness **Kimi Code** a máximo esfuerzo de razonamiento. Otros modelos suelen usar su mejor harness (Claude Code, Codex, Terminus). Léelo como evidencia a nivel de producto, no como bake-off puro de modelos.

Gráficos oficiales de lanzamiento (suite auto-reportada):

![Gráfico oficial de comparación de benchmarks de Kimi K3 (Moonshot AI)](https://kimi-file.moonshot.cn/prod-chat-kimi/kfs/4/2/2026-07-16/1d9chlgn6rtp4tqfnnmjg?x-tos-process=image%2Fauto-orient%2C1%2Fstrip%2Fignore-error%2C1)

*Fuente: [Moonshot AI, Kimi K3: Open Frontier Intelligence](https://www.kimi.com/blog/kimi-k3)*

![Segundo gráfico oficial de comparación de Kimi K3 (Moonshot AI)](https://kimi-file.moonshot.cn/prod-chat-kimi/kfs/4/2/2026-07-16/1d9chlbnf2ena6205244g?x-tos-process=image%2Fauto-orient%2C1%2Fstrip%2Fignore-error%2C1)

*Fuente: [post de lanzamiento de Moonshot AI](https://www.kimi.com/blog/kimi-k3)*

| Benchmark | Kimi K3 | Qué mide | Tabla pública / notas |
| --- | --- | --- | --- |
| Terminal-Bench 2.1 | **88,3** | Tareas agenticas de terminal | Cruza con [AA Terminal-Bench](https://artificialanalysis.ai/evaluations/terminalbench-v2-1) |
| FrontierSWE | **81,2** de dominancia | SWE / research difícil | [frontierswe.com](https://www.frontierswe.com/) (K3 puede retrasarse en el listado público) |
| ProgramBench | **77,8** raw pass rate | Reconstruir programas desde binario + docs | [programbench.com](https://programbench.com/) / [Vals ProgramBench](https://www.vals.ai/benchmarks/programbench) |
| DeepSWE | **67,5** (Kimi Code); **67,3** mini-SWE-agent | Fix de issues multi-repo frescos | [deepswe.datacurve.ai](https://deepswe.datacurve.ai/) |
| SWE Marathon | **42,0** | Trabajo de proyecto multi-hora | [swe-marathon.org](https://www.swe-marathon.org/) |

Matices importantes si lo compras para un equipo:

1. **Raw pass rate ≠ fully resolved.** El 77,8 de ProgramBench es tasa a nivel de tests, no "el 77,8% de los programas reconstruidos al 100%".
2. **El harness forma parte del score.** Moonshot avisa de que K3 es sensible al **historial de thinking preservado**. Si se pierde, la calidad puede oscilar.
3. **Dominancia es probabilidad de victoria por pares**, no porcentaje de tareas completadas.
4. Varias filas de K3 las corrió el vendor antes de que cada owner board se actualizara. Prefiere las páginas independientes cuando se refresquen.

### Coste, velocidad y hambre de tokens

Mediciones independientes y reportes tempranos coinciden:

- Score de inteligencia fuerte, **decode lento** (clase ~37 t/s en AA)
- **Alta verbosidad** en evals difíciles (más tokens de salida que la mediana)
- Coste por tarea del Intelligence Index competitivo con **GPT-5.6 Sol** en algunos recaps, más barato que tiers max pesados de Claude, pero no es precio de "modelo abierto barato"
- Los cache hits importan mucho: $0,30 vs $3,00 de input es un factor 10x en contexto de repo repetido

Si lanzas chats cortos, K3 puede sentirse caro y demasiado proactivo. Si corres agentes de coding multi-hora con prefijos estables y buen reuse de cache, la factura cambia.

### Visión nativa y trabajo de largo horizonte

K3 es multimodal por diseño. Los case studies de Moonshot empujan optimización de kernels, trabajo de compiladores, bucles de juego/UI con capturas en vivo, sandboxes de chip design y pipelines research-to-code. Son demos, no leaderboards. Aun así explican el pitch: sesiones largas, tools, feedback visual y menos babysitting.

En producto, Moonshot lista [kimi.com](https://www.kimi.com/), [Kimi Work](https://www.kimi.com/products/kimi-work), [Kimi Code](https://www.kimi.com/code) y la [API de Kimi](https://platform.kimi.ai/) (`kimi-k3`).

### Quién debería prestar atención ahora

**Vale la pena un pilot si:**

- Necesitas agentes de coding de largo horizonte en repos grandes
- Quieres calidad cercana a la frontera con camino a **self-host de pesos** tras el 27 de julio
- Te importa frontend / UI, donde Arena ya situó a K3 primero
- Puedes medir **coste por PR aceptado**, no solo coste por millón de tokens

**Probablemente no es tu default si:**

- Necesitas chat de baja latencia o completions baratas a alto QPS
- No toleras agentes proactivos que improvisan en tareas ambiguas
- Esta semana necesitas boards independientes same-harness para procurement

### Resumen honesto

Kimi K3 no coronó un nuevo #1 global. Hizo algo más interesante para builders: comprimió la brecha **open vs closed** a meses, puso pesos abiertos de clase 3T en el calendario y mostró coding agent competitivo mientras labs independientes aún lo colocan justo detrás de Fable 5 y GPT-5.6 Sol.

Tres señales concretas a vigilar:

1. Release de pesos del 27 de julio (licencia, checkpoints, stack de serving)
2. Boards independientes publicando K3 con traces, costes e intervalos de confianza
3. Tu propio bake-off: harness fijo, presupuesto fijo, repos reales

### Gráficos y boards en vivo

Guarda estos enlaces cuando quieras el número actualizado, no una captura congelada en este post. Los gráficos clave también están enlazados arriba junto a los scores que respaldan.

| Gráfico / tabla | Qué muestra | Enlace |
| --- | --- | --- |
| Página de modelo en Artificial Analysis | Intelligence Index, velocidad, precio, coste por tarea, uso de tokens | [artificialanalysis.ai/models/kimi-k3](https://artificialanalysis.ai/models/kimi-k3/) |
| Inicio de Artificial Analysis | Calidad, precio y velocidad entre modelos | [artificialanalysis.ai](https://artificialanalysis.ai/) |
| Terminal-Bench 2.1 (AA) | Resultados independientes de coding en terminal | [artificialanalysis.ai/evaluations/terminalbench-v2-1](https://artificialanalysis.ai/evaluations/terminalbench-v2-1) |
| Página de Vals | Vals Index y suite enterprise / coding | [vals.ai/models/kimi_kimi-k3](https://www.vals.ai/models/kimi_kimi-k3) |
| DeepSWE | Reparación de issues en repos frescos | [deepswe.datacurve.ai](https://deepswe.datacurve.ai/) |
| FrontierSWE | Tareas duras de implementación / rendimiento / investigación | [frontierswe.com](https://www.frontierswe.com/) |
| ProgramBench | Reconstruir programas a partir de comportamiento + docs | [programbench.com](https://programbench.com/) |
| SWE Marathon | Ingeniería multi-hora a escala de proyecto | [swe-marathon.org](https://www.swe-marathon.org/) |
| Post de lanzamiento de Moonshot | Arquitectura y tabla completa de scores | [kimi.com/blog/kimi-k3](https://www.kimi.com/blog/kimi-k3) |
| Ruta en OpenRouter | Precio API en vivo y enrutado de proveedores | [openrouter.ai/moonshotai/kimi-k3](https://openrouter.ai/moonshotai/kimi-k3) |

### Fuentes y créditos

Fuentes primarias e independientes usadas para números y gráficos de este post:

1. [Kimi K3: Open Frontier Intelligence](https://www.kimi.com/blog/kimi-k3) : post de lanzamiento de Moonshot AI, arquitectura, precios, tabla completa, gráficos oficiales
2. [Kimi K3 en Artificial Analysis](https://artificialanalysis.ai/models/kimi-k3/) : Intelligence Index, velocidad, precio, verbosidad, gráficos de coste
3. [Metodología del Intelligence Index de Artificial Analysis](https://artificialanalysis.ai/methodology/intelligence-benchmarking)
4. [Terminal-Bench 2.1 en Artificial Analysis](https://artificialanalysis.ai/evaluations/terminalbench-v2-1)
5. [Kimi K3 en Vals](https://www.vals.ai/models/kimi_kimi-k3) : Vals Index y evals relacionadas
6. [DeepSWE leaderboard](https://deepswe.datacurve.ai/)
7. [ProgramBench](https://programbench.com/)
8. [FrontierSWE](https://www.frontierswe.com/)
9. [SWE Marathon](https://www.swe-marathon.org/)
10. [OpenRouter: moonshotai/kimi-k3](https://openrouter.ai/moonshotai/kimi-k3)
11. [Simon Willison sobre Kimi K3](https://simonwillison.net/2026/Jul/16/kimi-k3/) : contexto de lanzamiento, highlights de AA, notas prácticas de API
12. [BenchLM: nota de release de Kimi K3](https://benchlm.ai/blog/posts/kimi-3-release-data-coming-soon) : Elo de Arena y marco de índices independientes

Las puntuaciones cambian cuando se refrescan las tablas. Prefiere los enlaces de la sección de gráficos en vivo de arriba cuando necesites rankings actuales.
