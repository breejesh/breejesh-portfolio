---
title: "El auge XPU de Broadcom: los laboratorios de IA se convierten en empresas de chips y Wall Street paga las fábricas"
description: "Los ingresos de Broadcom por chips de IA crecieron un 221%, hasta 16.700 millones de dólares, y Anthropic va camino de ser su mayor cliente de aceleradores a medida. Detrás del crecimiento hay una máquina de financiación, una cartera de pedidos de 10 gigavatios y el contraataque silencioso de Nvidia."
date: "2026-09-18"
tags: [Hardware y Semiconductores, Negocios Tech y Finanzas]
coverImage: /assets/images/broadcom-custom-ai-accelerators-xpu.webp
previewImage: /assets/images/broadcom-custom-ai-accelerators-xpu.webp
---

> **TL;DR**
> * **El detonante:** Broadcom reportó unos ingresos por semiconductores de IA de 16.700 millones de dólares en el tercer trimestre fiscal de 2026 (un 221% más interanual), guió el cuarto trimestre a 21.700 millones y presentó una previsión de ingresos de IA de unos 115.000 millones para el ejercicio 2027 y 230.000 millones para 2028.
> * **El mecanismo:** Seis clientes diseñan ya sus propios aceleradores (XPU) con Broadcom. Solo Anthropic tiene 1 GW de TPU desplegándose este año, 5 GW planificados para 2027 y 10 GW adicionales a la vista para 2028. Los dos laboratorios que no pueden financiarlo con su flujo de caja, Anthropic y OpenAI, se financian a través de un vehículo con Apollo y Blackstone.
> * **La perspectiva:** El monopolio de la GPU no se rompe. Se rodea, gigavatio a gigavatio. La respuesta de Nvidia, una inversión de 3.500 millones en MediaTek y NVLink Fusion, busca que los chips a medida sigan enchufándose en sus racks.

Durante tres años, la historia del hardware de IA tuvo un solo protagonista. Comprabas Nvidia o esperabas a Nvidia.

La llamada de resultados del tercer trimestre de Broadcom fue la prueba más clara hasta ahora de que los mayores compradores han dejado de esperar. Diseñan su propio silicio, y Broadcom es la empresa que convierte esos diseños en obleas, encapsulados, redes y racks.

La cifra que acaparó titulares fue el 221%. La que yo no dejo de mirar es 10 gigavatios. Es la capacidad adicional que Hock Tan dijo que Broadcom tiene a la vista para entregar en 2028, y luego añadió: "10 gigavatios son solo para Anthropic".

---

## El trimestre en una tabla

| Métrica (T3 fiscal 2026, cerrado el 2 de agosto) | Valor |
| --- | --- |
| Ingresos totales | 29.600M $, +86% interanual |
| Ingresos de semiconductores de IA | 16.700M $, +221% interanual y +54% trimestral |
| Soluciones de semiconductores | 20.800M $ (70% de los ingresos) |
| Software de infraestructura (VMware) | 8.800M $ (30% de los ingresos) |
| Flujo de caja libre | 13.700M $ (46% de los ingresos) |
| Previsión de ingresos T4 | ~34.800M $, +93% interanual |
| Previsión de semiconductores de IA T4 | 21.700M $, +236% interanual |
| Previsión de ingresos de IA del ejercicio 2026 | Elevada a 58.000M $ desde 56.000M $ |
| Perspectiva de ingresos de IA | ~115.000M $ en el ejercicio 2027, ~230.000M $ en 2028 |
| Margen bruto | 75% en T3, previsto en ~73% en T4 |

La línea del margen es la honesta. Broadcom espera que el margen bruto baje por el mayor contenido de memoria en los envíos de XPU. Compra mucha HBM en nombre de sus clientes y la repercute. Es lo que pasa cuando dejas de vender chips y vendes algo más parecido a un acelerador terminado.

---

## Quién construye qué

Broadcom no suele nombrar clientes. En esta llamada lo hizo, con detalle:

| Cliente | Programa | Plan de despliegue |
| --- | --- | --- |
| Anthropic | TPU de Google (Ironwood y luego TPU v8i) | 1 GW en 2026, 5 GW en 2027, 10 GW adicionales en 2028. Previsto como el mayor cliente XPU de Broadcom en 2027 y 2028 |
| OpenAI | Jalapeno, más un sucesor cerca del tape-out | 1,3 GW en 2027, más de 5 GW en 2028. Previsto como el segundo mayor |
| Google | TPU (acuerdo de desarrollo y suministro a largo plazo) | "Decenas de miles de millones de dólares" en TPU al año durante varios años |
| Meta | MTIA, tres generaciones hasta 2027 | Unos 3 GW hasta 2028; envíos de producción a partir del T4 |
| Otros dos | No revelados | Autofinanciados, según la dirección |

Hay dos cosas en esa tabla que habrían sonado absurdas hace dieciocho meses.

Primero, un laboratorio de modelos que no posee un centro de datos va camino de ser el mayor cliente de silicio a medida de la mayor empresa de silicio a medida. Anthropic no diseña las TPU, las diseña Google, pero las compra a una escala que en la práctica reserva una línea de producción.

Segundo, el chip de OpenAI tiene nombre en clave, calendario de tape-out y una tercera generación en desarrollo. "Construir nuestro propio chip" era antes una postura de negociación frente a Nvidia. Ahora es una hoja de ruta.

---

## Sigue el dinero: el vehículo XPV

La pregunta obvia es cómo paga una empresa con las pérdidas de Anthropic 15 gigavatios de aceleradores.

La respuesta es que, en su mayor parte, no paga por adelantado. En junio, Broadcom creó una plataforma con Apollo y Blackstone (la dirección la llama XPV) para financiar más de 20 GW de cómputo para OpenAI y Anthropic hasta finales de 2028. Inversores externos suscriben y poseen los activos. El primer tramo, de 35.000 millones de dólares, se cerró en junio para el primer gigavatio de Anthropic.

| Pieza | Quién la asume |
| --- | --- |
| Diseño y suministro de chips | Broadcom (y Google para las TPU) |
| Capital para el hardware | Apollo, Blackstone y coinversores |
| Riesgo de uso e ingresos | Anthropic y OpenAI |
| Valor residual del hardware | Los inversores, con garantías de valor residual "modestas" de Broadcom |

La dirección dio dos reglas de bolsillo que conviene apuntar. El contenido de Broadcom ronda entre 20.000 y 30.000 millones de dólares por gigavatio. Y, según la estimación de la dirección, Anthropic podría generar unos 30.000 millones de ingresos anuales por gigavatio desplegado.

Si la segunda cifra se cumple, las cuentas salen y la deuda es barata. Si no, el crédito privado se queda con mucho silicio muy específico de vida útil corta. La garantía de valor residual es la línea que yo vigilaría en futuros informes. "Modesta" y "de bajo riesgo" es lo que todo el mundo dice antes de que gire un ciclo de amortización.

---

## Nvidia no se queda quieta

Dos días antes de que Broadcom presentara resultados, Nvidia invirtió 3.500 millones de dólares en bonos convertibles de MediaTek, la mayor parte de la emisión exterior récord de MediaTek. A cambio, MediaTek adoptó NVLink Fusion y ofrecerá servicios de diseño en torno al chiplet de Nvidia, NVLink-C2C y su arquitectura de memoria.

Si se lee junto a la llamada de Broadcom, la estrategia está clara. Nvidia no puede impedir que los mayores compradores construyan XPU. Puede intentar que esas XPU vivan dentro de racks de Nvidia, sobre la interconexión de Nvidia, junto a GPU de Nvidia y CPU Grace o Vera. Si no puedes ser dueño del acelerador, sé dueño del backplane.

Jensen Huang rechazó la etiqueta de "financiación circular": "Esto no es circular porque, obviamente, ellos hacen su negocio y nosotros el nuestro". Puede ser. Sigue siendo Nvidia usando su balance para atraer a los clientes de un posible competidor a su interconexión.

Mientras tanto, según el New York Times, el Departamento de Justicia estaría examinando si el acuerdo de licencia y fichajes de Nvidia con Groq en diciembre se estructuró para evitar una revisión de fusión. Nvidia lo llama "un ejemplo perfecto del sistema estadounidense funcionando como está diseñado". En cualquier caso, los reguladores miran ahora los bordes del imperio de Nvidia, no solo su centro.

Y el capital sigue fluyendo hacia el siguiente aspirante. Positron, una startup de chips de inferencia de Reno, acaba de levantar 875 millones de dólares con una valoración de 5.000 millones, unas cinco veces la de hace seis meses, prometiendo hasta 2,3 TB de memoria por chip.

---

## Ethernet ganó la red sin hacer ruido

La otra mitad del negocio de IA de Broadcom es la red, y crece tan rápido como los aceleradores. Los ingresos de redes de IA se multiplicaron por más de 2,5 interanual.

* **Tomahawk 6** (clase 100 Tbps) está desplegado en los hiperescaladores que construyen XPU.
* **Tomahawk 7** ha hecho tape-out como switch Ethernet de 200 Tbps.
* **Tomahawk Ultra** lleva Ethernet al scale-up, el dominio estrecho de GPU a GPU donde NVLink de Nvidia no tenía rival.

Esto importa porque el bando del silicio a medida necesita una red que no sea de Nvidia. InfiniBand llegó con Mellanox. Ethernet es la alternativa abierta, y Broadcom vende la mayor parte del silicio de switch sobre el que funciona.

---

## Qué podría salir mal

1. **Concentración.** Si Anthropic se convierte en el mayor cliente XPU, el 2028 de Broadcom depende mucho del crecimiento de ingresos de una sola empresa y de su acceso al capital.
2. **Dilución del margen.** Más memoria y más contenido de sistema reducen el margen porcentual aunque suban los dólares. Los inversores que valoraban a Broadcom como una empresa de chips con 75% de margen bruto tendrán que recalibrar.
3. **Energía y naves.** La propia dirección señaló que el suelo, la energía y las naves de centros de datos limitan el despliegue. Un gigavatio en una diapositiva no es un gigavatio energizado.
4. **Eficiencia de los modelos.** Si la inferencia se abarata por token más rápido de lo que crece la demanda, los planes de gigavatios de hoy parecerán la fibra óptica del año 2000.

---

## Lo que queda

La expresión que se me quedó grabada es "a la vista". Es lo que dices de algo que puedes ver pero a lo que todavía no has llegado.

Diez gigavatios, para un solo cliente, dentro de dos años, financiados por capital privado, con una garantía modesta. Todos en la llamada sonaban tranquilos. La cartera de pedidos es real. También lo es la distancia entre ver algo y llegar hasta ello.

---

## Fuentes

* [Broadcom Q3 FY2026 results, Form 8-K exhibit (SEC)](https://www.sec.gov/Archives/edgar/data/0001730168/000173016826000076/avgo-08022026x8kxex99.htm)
* [Broadcom (AVGO) Q3 2026 earnings call transcript (The Motley Fool)](https://www.fool.com/earnings/call-transcripts/2026/09/09/broadcom-avgo-q3-2026-earnings-call-transcript/)
* [Broadcom Q3 revenue jumps 86 pct on strong AI demand (The Star / Reuters)](https://www.thestar.com.my/news/world/2026/09/03/broadcom-q3-revenue-jumps-86-pct-on-strong-ai-demand)
* [Nvidia invests $3.5B in MediaTek to extend its grip on AI (Network World)](https://www.networkworld.com/article/4220808/nvidia-invests-3-5b-in-mediatek-to-extend-its-grip-on-ai.html)
* [US DOJ probes Nvidia's licensing deal with AI startup Groq, NYT reports (The Star / Reuters)](https://www.thestar.com.my/tech/tech-news/2026/09/10/us-doj-probes-nvidia039s-licensing-deal-with-ai-startup-groq-nyt-reports)
* [Top Tech News Today, September 10, 2026 (TechStartups)](https://techstartups.com/2026/09/10/top-tech-news-today-september-10-2026-apple-anthropic-ibm-meta-openai-spacex-more/)
