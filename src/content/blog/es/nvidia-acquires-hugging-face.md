---
title: "Nvidia compra Hugging Face: el terreno neutral de la IA abierta ahora tiene casero"
description: "Nvidia acordó pagar 12.930 millones de dólares por Hugging Face, su mayor operación de la historia. La promesa es que el hub sigue abierto. Los incentivos dicen que se convierte en el canal de distribución de CUDA más barato jamás construido."
date: "2026-09-04"
tags: [Negocios Tech y Finanzas, IA y Machine Learning]
coverImage: /assets/images/nvidia-acquires-hugging-face.webp
previewImage: /assets/images/nvidia-acquires-hugging-face.webp
---

> **TL;DR**
> * **El detonante:** El 3 de septiembre, Nvidia acordó adquirir Hugging Face por 12.930.300.000 dólares, casi el doble de su récord anterior (Mellanox, 6.900 millones en 2020) y casi tres veces la valoración de Hugging Face en 2023, de 4.500 millones.
> * **El mecanismo:** Nvidia no compra ingresos. Compra el lugar por defecto donde 18 millones de desarrolladores descargan pesos, ejecutan evaluaciones y eligen proveedor de inferencia. Quien controla esa página decide qué hardware es el camino de menor resistencia.
> * **La perspectiva:** Jensen Huang prometió que la plataforma sigue abierta y que no se exigirá cómputo de Nvidia. Probablemente sea cierto el primer día. La presión aparece después: en los valores por defecto, en qué botón de "Deploy" sale primero y en qué checkpoint optimizado recibe la insignia.

Todos los ingenieros de ML que conozco tienen la misma memoria muscular. Sale un paper. Abres Hugging Face. Lees la model card, revisas la licencia, miras las descargas y haces `from_pretrained` en un notebook antes de comer.

El 3 de septiembre, esa página consiguió un dueño con un interés de 5 billones de dólares en lo que pase después.

Nvidia acordó comprar Hugging Face por 12.930 millones de dólares. Huang lo anunció con la cifra completa y curiosamente precisa ("$12,930,300,000") y luego dijo las dos frases que importan más que el precio: "Hugging Face seguirá siendo una plataforma abierta para todo el ecosistema de IA" y "no se requerirá cómputo de NVIDIA para construir o desplegar a través de Hugging Face".

Le creo. También creo que la frase responde a la pregunta equivocada.

---

## Qué compró Nvidia en realidad

Hugging Face no es un gran negocio para la escala de Nvidia. Es una gran *posición*.

| Activo | Escala (datos de la empresa) | Por qué le importa a Nvidia |
| --- | --- | --- |
| Hub de modelos | Más de 3M de modelos | La fuente canónica de pesos abiertos, incluida la mayoría de lanzamientos chinos |
| Datasets | ~500.000 | Datos de entrenamiento y evaluación que los pipelines referencian por nombre |
| Spaces (apps) | Más de 1M | Demos en vivo que también son cargas de inferencia |
| Comunidad | Más de 18M de usuarios, 200.000 empresas | El mayor embudo de desarrolladores de IA fuera de los propios laboratorios |
| Librerías | `transformers`, `diffusers`, `datasets`, TGI, `accelerate` | El camino de código entre un checkpoint y una GPU |

La última fila es la que yo vigilaría. `transformers` es la capa que convierte "una carpeta de safetensors" en "un modelo corriendo en un dispositivo". Kernels, backends de atención, formatos de cuantización y tipos de datos por defecto se deciden ahí, en pull requests, por mantenedores. Desde septiembre, muchos de esos mantenedores tendrán acciones de Nvidia. Según lo publicado sobre el acuerdo, se reservan hasta 1.000 millones para retener empleados, de unos 11.900 millones que van a los accionistas.

Nada de eso requiere cerrar nada. Solo requiere ser el equipo que publica primero el camino rápido.

---

## El precio, en contexto

| Operación | Año | Precio | Lo que obtuvo Nvidia |
| --- | --- | --- | --- |
| Mellanox | 2020 | 6.900M $ | InfiniBand y la red que hizo posibles los clústeres DGX |
| Arm (abandonada) | 2020 a 2022 | 40.000M $ (propuesta) | La ISA de CPU que todos licencian. Los reguladores la tumbaron |
| Groq (licencia y fichajes) | Dic. 2025 | ~17.000M a 20.000M $ (según informes) | Propiedad intelectual de inferencia y su equipo directivo, sin fusión formal |
| Bonos convertibles de MediaTek | 31 ago. 2026 | 3.500M $ | Un socio de silicio a medida atraído a NVLink Fusion |
| Hugging Face | 3 sep. 2026 | 12.930M $ | La capa de distribución de modelos abiertos |

Si se lee la tabla de arriba abajo, el patrón es claro. Nvidia sigue comprando lo que está *al lado* de la GPU y decide si la GPU es la elegida: la red, la interconexión, la startup de inferencia, el ASIC del socio y ahora el registro de modelos.

La fila de Arm es la que los abogados de Nvidia tendrán en un post-it. Una plataforma neutral sobre la que todos construyen, comprada por la empresa que vende lo más caro que se construye encima, es justo la historia que hundió a Arm. La diferencia es que Hugging Face no tiene ingresos por licencias que retener. Su palanca es más blanda: atención, valores por defecto y confianza.

---

## "Abierto" no es lo mismo que "neutral"

La promesa de Huang cubre el acceso. Nadie estará obligado a usar hardware de Nvidia para usar el hub. Esa es la parte fácil, porque imponerlo destruiría el activo en una semana.

La neutralidad es otra propiedad, y vive en pequeñas decisiones de producto:

1. **El botón Deploy.** Hoy una página de modelo ofrece varios proveedores de inferencia y nubes. El orden de esa lista, y cuál viene preseleccionado, vale más que cualquier comunicado de alianza.
2. **Checkpoints optimizados.** Si las versiones NVFP4 o TensorRT-LLM de los modelos populares empiezan a aparecer primero como variantes "oficiales", las builds de ROCm de AMD y las rutas de TPU de Google pasan a ser la descarga de segunda, aunque funcionen.
3. **Leaderboards y evaluaciones.** Importa quién paga el cómputo detrás de los rankings abiertos. "Más tokens por segundo" es una métrica con forma de hardware.
4. **Kernels por defecto en `transformers`.** Un backend de atención por defecto afinado para Hopper y Blackwell es una decisión de ingeniería perfectamente razonable. También es la forma en que los ecosistemas se inclinan sin que nadie escriba una política.

Cada una se puede defender por separado. Juntas son un foso. Esa es la lectura honesta: Nvidia no necesita cerrar Hugging Face para beneficiarse de ser su dueña. Solo necesita ser el camino mejor soportado en una plataforma que controla.

---

## Quién pierde poder de fijación de precios

**AMD y el bando del silicio a medida.** AMD pasó dos años convirtiendo ROCm en un objetivo creíble para modelos abiertos. Google, Amazon, Meta y Microsoft impulsan sus propios aceleradores. Todos dependían de Hugging Face como la rampa compartida donde un modelo se publica una vez y corre en cualquier sitio. Esa rampa ahora tiene un interesado.

**Nubes de inferencia.** Together, Fireworks, Replicate, Baseten y el resto compiten por el clic de "Deploy" en las páginas de modelo. Ahora compiten dentro de un escaparate propiedad de su mayor proveedor.

**Laboratorios chinos de pesos abiertos.** Una gran parte de los modelos abiertos más descargados de 2026 vino de laboratorios chinos (Qwen, DeepSeek, Kimi). Su canal de distribución por defecto pertenece ahora a una empresa estadounidense situada en el centro de la política de control de exportaciones. No me sorprendería ver más espejos y más lanzamientos que llegan primero a ModelScope.

**Quién gana:** Hugging Face, a corto plazo. Clem Delangue presentó el acuerdo en términos de cómputo, apoyo, colaboración y visibilidad. Un hub que sirve petabytes de pesos al día tiene costes de infraestructura reales, y sus inversores de 2023 (Salesforce Ventures lideró esa ronda, con Nvidia, Google, Amazon, IBM, Intel, AMD y Qualcomm) obtienen una salida limpia a casi 3 veces.

Hay una ironía en esa lista de inversores. Casi todas las empresas que aparecen compiten con el nuevo dueño.

---

## La cuestión regulatoria

El acuerdo aún necesita revisión regulatoria, y un informe espera el cierre en 2027. El argumento para el escrutinio se escribe solo: Nvidia controla el acelerador de IA dominante, la pila de software dominante (CUDA), la red de escalado dominante (heredada de Mellanox) y ahora sería dueña del registro de modelos abiertos dominante.

El argumento en contra también es simple. Hugging Face no tiene un foso de ingresos relevante, el coste de cambiar de sitio para descargar un modelo es casi cero y cualquiera puede alojar safetensors en S3. Los reguladores que tuvieron problemas para definir un mercado en la licencia de Groq tendrán problemas para definir uno de "sitios donde descargas pesos".

Mi apuesta es que el acuerdo se cierra con compromisos de conducta: neutralidad en los listados de proveedores de inferencia, contribuciones públicas de kernels para otro hardware y algún tipo de gobernanza sobre las librerías de código abierto. Esos compromisos los redactarán abogados y los harán cumplir los mantenedores, es decir, la cultura.

---

## Qué deberían hacer los desarrolladores ahora

* **Fija dependencias por revisión, no por `main`.** Si cambian las model cards, las configs o los kernels por defecto, quieres enterarte en un diff, no en producción.
* **Haz espejo de lo que usas.** Los equipos con cargas reguladas o de larga vida ya deberían guardar copias internas de pesos y datasets. Esta es buena semana para hacerlo de verdad.
* **Prueba de vez en cuando el camino sin Nvidia.** Si tu pila solo funciona hoy en CUDA, es un hecho. Si en 2028 solo funciona en CUDA porque nadie probó otra cosa, es una decisión que no sabías que habías tomado.
* **Lee la licencia, no el logo.** Que cambie el dueño del hub no cambia la licencia de ningún modelo concreto. Los pesos Apache 2.0 siguen siendo Apache 2.0.

---

## Lo que queda

Hugging Face nació en 2016 como una app de chatbot para adolescentes. Se convirtió en el bien común de la IA abierta casi por accidente, porque era útil y porque no tenía hardware que vender.

La segunda parte de esa frase dejó de ser cierta el 3 de septiembre.

El hub seguirá abierto. La pregunta es si seguirá siendo aburrido, una estantería neutral donde los pesos esperan. Lo mejor que podría pasar es que dentro de dos años nadie note quién es el dueño. Aun así, alguien estará mirando el orden de los botones de Deploy. Yo lo haré.

---

## Fuentes

* [Nvidia buys Hugging Face for $12.93 billion in its biggest acquisition ever (TechStartups, citando al Financial Times)](https://techstartups.com/2026/09/03/nvidia-buys-hugging-face-for-12-93-billion-in-its-biggest-acquisition-ever/)
* [NVIDIA Acquiring Hugging Face For $12.93 Billion (Phoronix)](https://www.phoronix.com/news/NVIDIA-Hugging-Face)
* [Nvidia buying artificial intelligence platform Hugging Face for $13 billion (La Nación / AP)](https://www.lanacion.com.ar/usa/nvidia-buying-artificial-intelligence-platform-hugging-face-for-13-billion-nid03092026/)
* [Nvidia invests $3.5B in MediaTek to extend its grip on AI (Network World)](https://www.networkworld.com/article/4220808/nvidia-invests-3-5b-in-mediatek-to-extend-its-grip-on-ai.html)
* [Top Tech News Today, September 3, 2026 (TechStartups)](https://techstartups.com/2026/09/03/top-tech-news-today-september-3-2026-google-hugging-face-meta-moonshot-ai-nvidia-more/)
* Relacionado: [Cómo un agente de OpenAI hackeó Hugging Face](/blog/es/openai-agent-hacks-huggingface)
