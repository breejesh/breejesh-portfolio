---
title: "Tres millones de tarjetas de estación de trabajo: el pedido chino de 35.000 millones a Nvidia muestra por dónde se filtran los controles de exportación"
description: "ByteDance, Alibaba y Tencent habrían pedido más de 3 millones de tarjetas Nvidia RTX PRO 5500, más de 35.000 millones de dólares a precio de lista, para ejecutar inferencia de IA. Nvidia advirtió que quizá solo cubra entre un 5% y un 10%. El pedido dice más sobre la demanda de inferencia y el diseño de los controles de exportación que sobre el próximo trimestre de Nvidia."
date: "2026-10-20"
tags: [Hardware y Semiconductores, Políticas Tech y Legislación]
coverImage: /assets/images/china-nvidia-rtx-pro-5500-orders.webp
previewImage: /assets/images/china-nvidia-rtx-pro-5500-orders.webp
---

> **TL;DR**
> * **El detonante:** Reuters informó de que ByteDance, Alibaba y Tencent han pedido más de 3 millones de tarjetas Nvidia RTX PRO 5500 a unos 11.400 dólares cada una, más de 35.000 millones a precio de lista. Los pedidos chinos totales de la tarjeta superarían los 6 millones de unidades.
> * **El mecanismo:** La RTX PRO 5500 es una tarjeta de estación de trabajo de generación Blackwell que cumple las normas de exportación de EE. UU., que prohíben el B300 y revisan caso por caso las ventas de H200. Los compradores chinos la quieren sobre todo para inferencia, la carga que más crece y que necesita menos cómputo por chip que el entrenamiento.
> * **La perspectiva:** Nvidia ha advertido que quizá solo entregue entre un 5% y un 10% de los volúmenes pedidos, que podría limitar la producción mundial a unos 3 millones de unidades en 2027 y que está desplazando capacidad de TSMC hacia Rubin. El pedido es menos una venta que una señal: la demanda china de inferencia es enorme, los chips nacionales son caros y escasos, y los controles trazados en torno a productos de "centro de datos" dejan un hueco con forma de estación de trabajo.

La cifra más interesante de esta historia no son los 35.000 millones. Es el 5% a 10%.

Esa es la parte de sus pedidos que algunos compradores podrían recibir realmente, según una de las fuentes de Reuters. Nvidia ha dicho a clientes y socios que no puede garantizar la entrega. Otra fuente dijo que Nvidia no podría fabricar más de unos 3 millones de tarjetas RTX PRO 5500 en todo el mundo en 2027. Solo los clientes chinos han pedido más de 6 millones.

Así que tres de las mayores empresas tecnológicas del mundo hicieron pedidos que saben que en su mayor parte no se servirán. Eso indica lo desesperada que se ha vuelto la situación del cómputo en China.

---

## Qué se pidió y por qué esta tarjeta

| Elemento | Detalle |
| --- | --- |
| Compradores | ByteDance, Alibaba, Tencent (y otros clientes chinos) |
| Tarjeta | Nvidia RTX PRO 5500, GPU de estación de trabajo de la era Blackwell |
| Volumen | Más de 3M de las tres; más de 6M de todos los clientes chinos |
| Precio | Unos 11.400 $ por tarjeta; más de 35.000M $ a precio de lista para las tres |
| Uso | Principalmente inferencia |
| Calendario | Primeras muestras en diciembre de 2026; entregas comerciales desde el T1 de 2027 |
| Riesgo de suministro | Algunos compradores podrían recibir entre un 5% y un 10%; Nvidia desplaza capacidad de TSMC hacia Rubin a partir de 2027 |

La RTX PRO 5500 no es un chip de centro de datos. Esa es la clave. Las normas de EE. UU. prohíben vender el B300 a China y someten el H200 a revisión caso por caso. Las tarjetas de estación de trabajo están en otra categoría. Son menos capaces por chip, pero en inferencia importa menos la capacidad por chip que la capacidad por dólar y por vatio a lo largo de miles de tarjetas.

Hay historia detrás. El año pasado Nvidia creó la RTX 6000D, una tarjeta recortada para cumplir las normas chinas. Las empresas chinas la ignoraron en su mayoría, con la esperanza de que Washington permitiera chips mejores. Cuando esa esperanza se desvaneció, la demanda de todo lo legal volvió con intereses. Nvidia ha dejado de fabricar la 6000D, y una fuente dijo que su precio en China se ha duplicado.

---

## La inferencia es la demanda que nadie planificó

Los controles de exportación se diseñaron pensando en el entrenamiento: los enormes clústeres que producen los modelos de frontera. La inferencia se trató como un problema secundario.

Ya no lo es. Fíjate en lo que supimos solo este mes:

* DeepSeek dedicaría más del 70% de su cómputo al entrenamiento y menos del 30% a atender clientes, y subió los precios de su API entre 2,3 y 4,5 veces porque la demanda superó a la oferta.
* ByteDance consumiría alrededor de una quinta parte de la capacidad de centros de datos entregada en China. SemiAnalysis estima que China tiene más de 24 GW operativos y unos 20 GW en desarrollo.
* Los aceleradores Ascend más recientes de Huawei subieron entre un 20% y un 50% en dos meses por la escasez de HBM.

Si se juntan las piezas, la lógica del pedido es clara. Los aceleradores nacionales son caros y les falta memoria. Los laboratorios chinos necesitan más capacidad para servir, no solo para entrenar. Una tarjeta de estación de trabajo de Nvidia legal, de unos 11.400 dólares, que ejecuta la pila CUDA que todos los motores de inferencia ya soportan, es la unidad de inferencia más barata disponible.

---

## Dónde están las líneas de la política

| Producto | Estado de exportación de EE. UU. para China (según lo publicado) | Papel práctico |
| --- | --- | --- |
| B300 (centro de datos Blackwell) | Prohibido | Entrenamiento e inferencia a gran escala |
| H200 | Revisión caso por caso; Nvidia dijo en agosto que no esperaba ingresos de centros de datos de los primeros envíos | Entrenamiento e inferencia |
| RTX 6000D | Permitida, descatalogada | Tarjeta de estación de trabajo recortada específica para China |
| RTX PRO 5500 | Cumple las normas de exportación | Tarjeta de estación de trabajo, usada aquí para inferencia |
| Nacionales (Huawei Ascend, Alibaba Zhenwu V900, Cambricon) | No aplica | Cuota creciente, limitada por el suministro de HBM |

Hay otros dos hilos importantes. Washington está revisando cómo las empresas chinas alquilan chips de Nvidia que no pueden comprar, que es la otra fuga evidente. Y Pekín también tiene voz: The Information informó el mes pasado de que las autoridades chinas podrían permitir a Alibaba y ByteDance comprar la nueva tarjeta, lo que implica que el permiso no era automático. China lleva dos años empujando a sus empresas hacia el silicio nacional.

La postura de Nvidia es directa. Jensen Huang ha dicho que las restricciones estadounidenses redujeron la cuota de Nvidia en el mercado chino de chips de IA para centros de datos de casi un monopolio a prácticamente nada. Un portavoz criticó los "controles de exportación obsoletos de EE. UU., que cubren productos de gaming lanzados hace casi media década".

---

## Por qué Nvidia quizá no quiera atenderlo de todos modos

Suena extraño que una empresa rechace 35.000 millones de dólares. Pero mira los compromisos:

1. **Asignación de obleas.** Cada oblea destinada a tarjetas de estación de trabajo para China es una oblea que no va a Rubin, la próxima plataforma de centros de datos, donde los márgenes y el valor estratégico son mayores.
2. **Riesgo político.** Una oleada visible de silicio de generación Blackwell entrando en clústeres de inferencia chinos es justo el tipo de titular que desencadena una nueva norma. Enviar despacio es una forma de gestionar riesgos.
3. **Concentración de clientes.** Los hiperescaladores en EE. UU. ya compiten por el suministro de Nvidia. Desviar capacidad a China en plena escasez genera fricción con los clientes que compran B300.

Así que el resultado más probable es una entrega parcial, repartida a lo largo de 2027, con buena parte de la demanda restante yendo a Huawei y al ecosistema nacional a precios más altos.

---

## Qué significa fuera de China

* **Para los proveedores de inferencia de todo el mundo:** el silicio de inferencia utilizable más barato escasea a escala global, no solo en China. Las tarjetas Blackwell de estación de trabajo eran una válvula de escape. Un pedido de 6 millones de unidades la absorbe.
* **Para quienes siguen la política:** los controles definidos por categoría de producto (centro de datos frente a estación de trabajo frente a gaming) seguirán filtrándose por los bordes. Los controles definidos por capacidad agregada o por uso final son más difíciles de redactar y de hacer cumplir, pero este pedido es el argumento para intentarlo.
* **Para los modelos chinos de pesos abiertos:** más capacidad de servicio significa menos latencia y más disponibilidad para modelos como DeepSeek, Qwen y Kimi, que buena parte del mundo descarga y ejecuta. La geopolítica del hardware de inferencia no es solo una historia china.

---

## Lo que queda

Tansun Technology, que cotiza en Shenzhen, dijo en un documento del 13 de octubre que compraría 20.000 tarjetas RTX PRO 5500, sin nombrar al vendedor, y advirtió de que la escasez y los controles tecnológicos extranjeros podrían retrasar las entregas o reducir los volúmenes.

Veinte mil tarjetas, de una empresa de la que casi nadie fuera de China ha oído hablar. Presentado con una advertencia de que quizá no lleguen. Así se ve hoy el mercado del cómputo: pedidos de compra escritos como deseos.

---

## Fuentes

* [ByteDance, Alibaba and Tencent order $35bn of Nvidia chips, Reuters reports (The Next Web)](https://thenextweb.com/news/nvidia-rtx-pro-5500-china-orders-bytedance-alibaba-tencent)
* [ByteDance, Alibaba, Tencent place over US$35b worth of Nvidia chip orders (The Edge Malaysia / Reuters)](https://theedgemalaysia.com/node/822533)
* [China's tech giants drop $35 billion on export-compliant Nvidia RTX Pro 5500 orders (Tom's Hardware)](https://www.tomshardware.com/pc-components/gpus/chinas-tech-giants-drop-usd35-billion-on-export-compliant-nvidia-rtx-pro-5500-workstation-gpu-orders-to-power-ai-ambitions-according-to-reports-bytedance-alibaba-and-tencent-order-3-million-cards-despite-warnings-that-only-10-percent-of-orders-are-fulfillable)
* [Tech News Today, October 20, 2026 (TechStartups)](https://techstartups.com/2026/10/20/tech-news-today-october-20-2026-amazon-apple-bytedance-microsoft-nvidia-openai-salesforce-more/)
* [Top Tech News Today, September 29, 2026 (TechStartups)](https://techstartups.com/2026/09/29/top-tech-news-today-september-29-2026-anthropic-bytedance-google-meta-openai-samsung-more/)
* Relacionado: [Las subidas de precio de DeepSeek y la revalorización de la IA china](/blog/es/deepseek-price-hikes-china-ai-repricing)
