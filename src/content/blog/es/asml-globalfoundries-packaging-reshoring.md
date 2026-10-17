---
title: "El cuello de botella de los chips de IA se movió otra vez: el trimestre récord de ASML, los 21.000 millones de Japón para fábricas en Nueva York y el interposer del que nadie habla"
description: "En una semana, ASML anunció ventas récord, GlobalFoundries firmó un acuerdo de 2.000 millones de dólares para fabricar los interposers CoWoS de TSMC en Nueva York, y Japón aceptó financiar hasta 21.000 millones en nuevas fábricas de GlobalFoundries. La restricción del hardware de IA pasa de las obleas al encapsulado, y de la ingeniería a la política industrial."
date: "2026-10-17"
tags: [Hardware y Semiconductores, Políticas Tech y Legislación]
coverImage: /assets/images/asml-globalfoundries-packaging-reshoring.webp
previewImage: /assets/images/asml-globalfoundries-packaging-reshoring.webp
---

> **TL;DR**
> * **El detonante:** ASML anunció ventas récord de 11.700 millones de euros en el tercer trimestre y dijo que sus clientes ya hablan de las herramientas que necesitarán en 2029 y 2030. El 8 de octubre, GlobalFoundries firmó un acuerdo de 2.000 millones de dólares a cinco años para fabricar interposers de silicio para el encapsulado CoWoS de TSMC en Malta, Nueva York. El 14 de octubre, Japón aceptó financiar hasta 21.000 millones para dos nuevas fábricas de GlobalFoundries en el mismo lugar.
> * **El mecanismo:** Todos los aceleradores de IA que importan (GPU de Nvidia, TPU de Google, XPU fabricadas por Broadcom) se asientan sobre un encapsulado avanzado que une los chips lógicos con la HBM a través de un interposer de silicio. La litografía se lleva los titulares. La capacidad de encapsulado decide cuántos aceleradores se envían de verdad.
> * **La perspectiva:** Los primeros interposers CoWoS fabricados en EE. UU. llegan en el primer semestre de 2028, y la primera fábrica financiada por Japón, en 2029. Ninguna de las dos cosas arregla 2026 ni 2027. Ambas muestran que el suministro de hardware de IA se negocia ahora entre gobiernos tanto como entre empresas.

Cuando en 2026 la gente dice "escasez de chips", suele referirse a las GPU. Cuando lo dicen los ingenieros de la cadena de suministro, cada vez se refieren más a algo menos glamuroso: el cuadrado de silicio sobre el que se apoya la GPU.

Ese cuadrado se llama interposer. Es una placa pasiva de silicio cubierta de cableado extremadamente fino que permite a un chip de cómputo hablar con pilas de memoria de alto ancho de banda situadas a milímetros, con anchos de banda que una placa normal no puede soportar. La versión de TSMC de este encapsulado se llama CoWoS. Casi todos los aceleradores de frontera la usan o usan algo parecido. Y durante buena parte del auge de la IA ha sido una de las restricciones más duras de toda la cadena.

Esta semana, tres anuncios tocaron todas las capas de esa cadena a la vez.

---

## Tres anuncios, una cadena de suministro

| Fecha | Anuncio | Capa de la pila |
| --- | --- | --- |
| 8 oct. | GlobalFoundries firma un acuerdo de 2.000M $ a cinco años para fabricar interposers de silicio para el CoWoS de TSMC en Malta, Nueva York; producción en volumen en el S1 de 2028 | Encapsulado avanzado |
| 8 oct. | TSMC reporta ingresos de septiembre de 511.860M de dólares taiwaneses, +54,6% interanual; ingresos de nueve meses de 3,90 billones, +41,1% | Obleas de vanguardia |
| 14 oct. | ASML reporta ventas del T3 de 11.700M €, beneficio neto de 5.000M €, margen bruto del 57,5% y 113 sistemas de litografía vendidos (frente a 86) | Herramientas de litografía |
| 14 oct. | Japón acepta financiar hasta 21.000M $ para dos fábricas de GlobalFoundries en Malta, Nueva York; la participación de EE. UU. en GF sube a cerca del 7% | Obleas maduras y especializadas, política industrial |

Leído de arriba abajo, es toda la pila física de un acelerador de IA: las máquinas que imprimen los transistores, las fábricas que operan esas máquinas, el encapsulado que une los chips y los gobiernos que lo financian todo.

---

## ASML: la cartera de pedidos ya está en 2030

Las cifras de ASML fueron sólidas por cualquier criterio. Ventas del T3 de 11.700 millones de euros, beneficio neto de 5.000 millones y un margen bruto del 57,5%. Envió 113 sistemas de litografía, frente a 86 el trimestre anterior. Previó para el T4 entre 14.200 y 15.200 millones de euros, y para todo 2026 ventas de entre 44.000 y 45.000 millones.

La frase más reveladora no fue una cifra. ASML dijo que sus clientes ya hablan de sus necesidades de equipos para 2029 y 2030.

Las herramientas de litografía tienen plazos de entrega que se miden en años, así que las conversaciones siempre son tempranas. Pero hablar de capacidad para 2030 en octubre de 2026 significa que los fabricantes creen que la curva de demanda actual de la IA es lo bastante duradera como para justificar fábricas que no producirán una oblea en tres o cuatro años. Esa creencia es el verdadero activo detrás de cada plan de inversión en IA del sector, y la cartera de pedidos de ASML es donde primero se le pone precio.

---

## El acuerdo del interposer: poco dinero, gran señal

Con 2.000 millones de dólares en cinco años, el acuerdo entre GlobalFoundries y TSMC es pequeño para los estándares de la IA. Importa por tres razones.

1. **Es la primera fuente estadounidense de interposers CoWoS.** Hoy, un acelerador diseñado en EE. UU. y fabricado en las obleas de vanguardia de TSMC en Arizona aún tiene que volver a Taiwán para encapsularse. El acuerdo de Malta empieza a cerrar ese círculo, al menos para el interposer.
2. **Usa un proceso maduro.** Los interposers no necesitan un nodo de vanguardia. Necesitan piezas grandes de silicio sin defectos y con cableado fino. GlobalFoundries, que abandonó la carrera de vanguardia hace años, tiene justo ese tipo de capacidad. Es una reutilización inteligente de una fábrica existente para la parte más restringida de la cadena de la IA.
3. **No termina el trabajo.** Los analistas señalaron enseguida que los interposers por sí solos no crean una línea CoWoS en EE. UU. El ensamblaje final, las pruebas y el suministro de HBM son operaciones distintas de proveedores distintos. Ninguna de las dos empresas ha nombrado a un cliente final ni ha desglosado los 2.000 millones.

La producción en volumen arranca en el primer semestre de 2028. Dicho de otro modo: los aceleradores que Broadcom, Nvidia y los hiperescaladores planean desplegar en 2028 podrían ser los primeros en llevar un interposer "hecho en Nueva York".

---

## Los 21.000 millones de Japón: política industrial vía acuerdo arancelario

La financiación japonesa es otro tipo de historia. GlobalFoundries dijo que Japón aportará hasta 21.000 millones de dólares para dos fábricas de 300 mm en Malta. Unos 10.000 millones aceleran la primera, prevista para 2029. Otros 10.000 millones aproximadamente podrían financiar una segunda, con una decisión antes de finales de 2028.

El dinero sale del compromiso más amplio de Japón de invertir 550.000 millones de dólares en EE. UU., pactado dentro del acuerdo arancelario con la administración Trump. El gobierno estadounidense también tomará una participación adicional, con lo que su propiedad en GlobalFoundries llegará a cerca del 7%, según su CEO, Tim Breen. Renesas y Apple figuran como clientes iniciales previstos.

| Rasgo | Lo que indica |
| --- | --- |
| Japón aporta todo el capital | Los gobiernos aliados pagan ya directamente capacidad de fabricación en EE. UU. |
| EE. UU. toma acciones, no solo da subvenciones | Washington pasa de subvencionar a los fabricantes a ser dueño de parte de ellos |
| La ayuda federal anterior se redirige a otros fines | El modelo de financiación de la era CHIPS se sustituye, no se complementa |
| Entre los clientes, un fabricante de chips para automoción y Apple | Estas fábricas sirven chips maduros y especializados, los que causaron la escasez del automóvil de 2021 |

No son fábricas de aceleradores de IA. Son las fábricas que hacen chips de gestión de energía, microcontroladores y componentes de radiofrecuencia que también necesitan todos los servidores, coches y teléfonos. La lección de 2021 fue que un chip de 5 dólares puede parar un coche de 50.000. La lección de 2026 es que también puede parar un rack de IA de 3 millones.

---

## Dónde está ahora el cuello de botella

| Capa | Restricción en 2024 y 2025 | Restricción a finales de 2026 |
| --- | --- | --- |
| Litografía | Suministro de herramientas EUV | Hay herramientas, pero los pedidos llegan ya a 2030 |
| Obleas de vanguardia | Capacidad N3 y N2 de TSMC | Sigue ajustada; ingresos de TSMC más de un 50% por encima del año anterior |
| Encapsulado avanzado | Capacidad CoWoS en Taiwán | Sigue ajustada; el primer suministro estadounidense de interposers llega en 2028 |
| Memoria | Suministro de HBM | Ajustada en todas partes; grave en China por los controles de exportación |
| Chips maduros | Mayormente bien | Nuevas fábricas financiadas, pero no operativas hasta 2029 |
| Energía y edificios | Preocupación emergente | A menudo, la restricción que realmente limita el despliegue |

Si construyes productos de IA, nada de esto cambia tu sprint. Sí cambia tus supuestos de planificación. El suministro de hardware para 2027 está en gran parte comprometido. La nueva capacidad, en encapsulado y en fábricas maduras, llega en 2028 y 2029. Es más probable que el precio del cómputo se mantenga firme que que se desplome, lo que encaja con lo que vimos este trimestre en los precios de los modelos y en el mercado chino de chips.

---

## Lo que queda

En algún lugar de Malta, Nueva York, hay una fábrica que empezará a hacer interposers en 2028, junto a un terreno donde podrían existir dos fábricas más en 2029, en parte propiedad del gobierno de EE. UU. y pagadas por Japón.

Es un lugar extraño para que llegue la historia de la IA. Sin modelos, sin agentes, sin benchmarks. Solo una pieza plana de silicio con cables muy finos, que resulta ser una de las cosas que toda la industria estaba esperando.

---

## Fuentes

* [Top Tech News Today, October 14, 2026 (TechStartups, con enlace a relación con inversores de ASML)](https://techstartups.com/2026/10/14/top-tech-news-today-october-14-2026-apple-asml-google-openai-microsoft-nvidia-more/)
* [Top Tech News Today, October 8, 2026 (TechStartups, con enlace a ingresos de TSMC)](https://techstartups.com/2026/10/08/top-tech-news-today-october-8-2026-globalfoundries-google-manus-microsoft-nvidia-openai-tencent-more/)
* [GlobalFoundries signs $2bn five-year deal with TSMC for advanced packaging components (DatacenterDynamics)](https://datacenterdynamics.com/en/news/globalfoundries-signs-2bn-five-year-deal-with-tsmc-for-production-of-advanced-packaging-components)
* [GlobalFoundries and TSMC sign U.S. manufacturing deal for AI packaging (HPCwire)](https://hpcwire.com/off-the-wire/globalfoundries-and-tsmc-sign-us-manufacturing-deal-for-ai-packaging)
* [Japan to invest up to $21 billion in two US chip factories to be run by GlobalFoundries (Korea Times / Reuters)](https://www.koreatimes.co.kr/world/20261014/japan-to-invest-up-to-21-billion-in-two-us-chip-factories-to-be-run-by-globalfoundries)
* [Japan puts up to $21bn into two GlobalFoundries chip fabs in New York (The Next Web)](https://thenextweb.com/news/globalfoundries-japan-21bn-new-york-fabs-us-stake)
* Relacionado: [El auge XPU de Broadcom](/blog/es/broadcom-custom-ai-accelerators-xpu) y [Las subidas de precio de DeepSeek y la revalorización de la IA china](/blog/es/deepseek-price-hikes-china-ai-repricing)
