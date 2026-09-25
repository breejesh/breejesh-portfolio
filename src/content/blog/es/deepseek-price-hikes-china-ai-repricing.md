---
title: "DeepSeek subió precios hasta 4,5 veces y duplicó ingresos. La era de la IA china barata termina a la vista de todos"
description: "DeepSeek alcanzó un ritmo anualizado de ingresos de 1.000 millones de dólares tras subir los precios de su API entre 2,3 y 4,5 veces. Los chips de IA chinos se encarecieron entre un 20% y un 50%, Moonshot pidió salir a bolsa y la guerra de precios que definió a la IA china se convierte en un mercado de escasez."
date: "2026-09-25"
tags: [IA y Machine Learning, Negocios Tech y Finanzas, Hardware y Semiconductores]
coverImage: /assets/images/deepseek-price-hikes-china-ai-repricing.webp
previewImage: /assets/images/deepseek-price-hikes-china-ai-repricing.webp
---

> **TL;DR**
> * **El detonante:** DeepSeek ha alcanzado un ritmo anualizado de ingresos de 1.000 millones de dólares, más del doble que hace unos meses, según The Information. Parte del salto vino de subidas de precios de su API de entre 2,3 y 4,5 veces. Ahora busca unos 50.000 millones de yuanes (unos 7.450 millones de dólares) y ha contratado a CITIC Securities para una posible salida a bolsa en Shanghái.
> * **El mecanismo:** La IA china era barata porque los laboratorios compraban cuota de mercado y el cómputo todavía se podía conseguir. Ninguna de las dos cosas es cierta ya. Los controles de EE. UU. sobre la memoria de alto ancho de banda encarecieron entre un 20% y un 50% en dos meses el acelerador Ascend más reciente de Huawei, y DeepSeek dedica supuestamente más del 70% de su cómputo al entrenamiento, dejando menos del 30% para atender a clientes.
> * **La perspectiva:** Los laboratorios que iniciaron la guerra de precios de 2025 ponen ahora precio a la escasez y a los inversores de los mercados públicos. Quien construyó sobre los precios de derribo de las API chinas debería prever costes mucho más parecidos a los de los demás, o alojar por su cuenta los pesos abiertos.

En enero de 2025, el R1 de DeepSeek borró en un día cerca de medio billón de dólares del valor de mercado de Nvidia porque parecía barato. Barato de entrenar, barato de servir, barato de llamar. Durante dieciocho meses, "los laboratorios chinos te harán competencia a la baja" fue la suposición más fiable en los precios de la IA.

Esta semana supimos qué hizo DeepSeek con esa reputación. Subió precios hasta 4,5 veces y sus ingresos se duplicaron con creces.

No es una contradicción. Es un mercado diciéndote que el producto estaba por debajo de su precio.

---

## Las cifras de DeepSeek

| Métrica | Cifra reportada |
| --- | --- |
| Ritmo anualizado de ingresos | ~1.000M $, más del doble que hace unos meses |
| Subidas de precio de la API | Aproximadamente entre 2,3 y 4,5 veces |
| Objetivo de financiación | ~50.000M de yuanes (~7.450M $), con cierre previsto a finales de octubre |
| Valoración reportada | ~500.000M de yuanes |
| Preparación de OPV | CITIC Securities contratada para una posible salida al STAR Market (calendario por decidir) |
| Reparto del cómputo | Supuestamente más del 70% a entrenamiento, menos del 30% a inferencia |
| Último modelo | DeepSeek-V4.1-Flash, lanzado este mes |

El CEO Liang Wenfeng habría revelado el ritmo de ingresos en una reunión con inversores. Conviene ser preciso con lo que es un ritmo anualizado: el ritmo actual multiplicado al año, no ingresos contabilizados durante el último año. Los ingresos reportados de enero a julio fueron mucho menores, en torno a 475 millones de yuanes. La curva es empinada y reciente.

El reparto del cómputo es la línea que yo subrayaría. Un laboratorio que manda siete de cada diez aceleradores a entrenar tiene muy poco margen para servir tráfico. Cuando la demanda sube y la oferta no puede, la única palanca que queda es el precio. DeepSeek tiró de ella.

---

## El lado de la oferta: los chips también se encarecieron

DeepSeek no sube precios en el vacío. Hace dos semanas, Reuters informó de que los fabricantes chinos de chips de IA subían precios por la escasez de memoria de alto ancho de banda.

| Chip | Precio anterior (aprox.) | Precio nuevo (aprox.) | Cambio |
| --- | --- | --- | --- |
| Huawei Ascend 950DT (llega en el T4 de 2026) | n/d | Más de 250.000 yuanes (~37.000 $) | Entre un 20% y un 50% por encima de las cotizaciones de dos meses antes |
| Huawei Ascend 950PR | ~60.000 yuanes | Más de 80.000 yuanes | ~30% |
| Huawei Ascend 910C | ~90.000 yuanes | Más de 110.000 yuanes | ~22% |
| Cambricon 690 (sin lanzar) | n/d | n/d | Repreciado entre un 20% y un 30% al alza |
| MetaX, Iluvatar CoreX | n/d | n/d | Subidas similares reportadas |

La causa es la memoria, no la lógica. Los controles de exportación de EE. UU. sobre la HBM avanzada se endurecieron en diciembre de 2024. Los fabricantes chinos de aceleradores pueden diseñar chips de cómputo competitivos y fabricarlos en casa, pero necesitan pilas de HBM al lado, y la HBM del mercado gris cuesta supuestamente varias veces lo que pagan los compradores fuera de China. CXMT ha empezado a producir HBM3E a pequeña escala y planea ampliar en 2027. Hasta entonces, cada placa Ascend arrastra un problema de memoria caro.

La cadena es sencilla. La memoria escasea, los aceleradores se encarecen, la capacidad de inferencia sigue ajustada y los precios de la API suben.

---

## El lado del capital: todos quieren cotizar

Fijar precios para la escasez es también fijarlos para los inversores.

* **DeepSeek** busca unos 7.450 millones de dólares y prepara una posible salida al STAR Market.
* **Moonshot AI**, creadora de Kimi, presentó de forma confidencial su solicitud de salida a bolsa en Hong Kong a principios de septiembre, tras una ronda privada que la valoró en torno a 50.000 millones de dólares, frente a 31.500 millones a principios del verano. Los informes sitúan la captación entre 3.000 y 5.000 millones, con estreno ya en el primer trimestre de 2027.
* **Zhipu y MiniMax** ya salieron a bolsa en Hong Kong a principios de este año, lo que da a los inversores una referencia pública para las empresas chinas de modelos.

Los inversores de mercados públicos quieren ver líneas de ingresos que suben y márgenes brutos que no sean negativos. Un laboratorio que cobra por debajo de coste para ganar cuota es una gran historia en una ronda privada. En un folleto de salida a bolsa es un factor de riesgo. La subida de 2,3 a 4,5 veces me parece una empresa ordenando sus números antes de que lleguen los auditores.

---

## El lado geopolítico

La historia de precios se inscribe en una discusión más ruidosa. Washington ha acusado a los laboratorios chinos de una destilación "a escala industrial" de los modelos de frontera estadounidenses. Este mes, el Ministerio de Comercio chino rechazó la acusación, dijo que la técnica se usa ampliamente y advirtió de que podría tomar represalias si EE. UU. añade restricciones.

La ironía es que los pesos abiertos chinos forman parte cada vez más de la pila estadounidense. Harvey, la empresa de IA legal que acaba de levantar 550 millones de dólares con una valoración de 15.500 millones, construyó su primer modelo propio, Harvey Tenet, sobre Kimi K3, el modelo de pesos abiertos de Moonshot. La pelea por la destilación trata de quién copió a quién. La realidad del despliegue es que todos construyen sobre todos.

---

## Qué significa si construyes sobre modelos chinos

| Si dependes de... | Qué cambia | Qué hacer |
| --- | --- | --- |
| Las API alojadas de DeepSeek o Kimi por coste | Tu coste por token puede haberse duplicado o más | Recalcula tu economía unitaria con la tarifa de hoy, no con la del año pasado |
| Pesos abiertos (DeepSeek, Qwen, Kimi) | Nada en la licencia. Los pesos siguen siendo tuyos para ejecutarlos | Calcula el coste de alojarlos en tus propias GPU o con un proveedor de inferencia neutral |
| Un modelo chino como "respaldo barato" en un router | La distancia entre los niveles económicos y los de frontera se estrecha | Compara ese respaldo con los modelos económicos estadounidenses (tipo Haiku, Flash, Luna) en tus propias tareas |
| Compromisos a largo plazo | Los laboratorios están a punto de tener accionistas públicos | Espera que los precios sigan objetivos de margen, no de cuota de mercado |

La lección de fondo es dónde vive el foso. Durante un tiempo pareció que los laboratorios chinos habían encontrado la forma de hacer la inteligencia casi gratuita. Lo que habían encontrado en realidad era la forma de que pareciera casi gratuita mientras el cómputo era barato y los inversores eran pacientes. Ambas cosas eran temporales.

---

## Lo que queda

No dejo de pensar en ese reparto del cómputo. Setenta por ciento a entrenar. Treinta a servir.

Describe a una empresa que todavía cree que el próximo modelo importa más que los clientes de este mes. Es un buen instinto para un laboratorio de investigación. Es uno extraño para una empresa que está a punto de explicar sus ingresos a inversores públicos. En algún lugar entre el 70 y el 30 vive ahora la lista de precios de DeepSeek.

---

## Fuentes

* [DeepSeek hits $1 billion revenue run rate as Chinese AI startup targets $7.5 billion raise (TechStartups, citando a The Information)](https://techstartups.com/2026/09/24/deepseek-hits-1-billion-revenue-run-rate-as-chinese-ai-startup-targets-7-5-billion-raise/)
* [China's AI chipmakers raise prices as high-bandwidth memory shortage bites (Kuwait Times / Reuters)](https://kuwaittimes.com/article/49537/business/chinas-ai-chipmakers-raise-prices-as-high-bandwidth-memory-shortage-bites/)
* [Prices of Chinese AI chips soar (TrendForce)](https://www.trendforce.com/news/?p=63912)
* [Moonshot AI files confidentially for Hong Kong IPO (Dealroom)](https://dealroom.co/news/info-kyt1c4-moonshot-ai-files-confidentially-for-hong-kong-ipo/)
* [Top Tech News Today, September 10, 2026 (TechStartups)](https://techstartups.com/2026/09/10/top-tech-news-today-september-10-2026-apple-anthropic-ibm-meta-openai-spacex-more/)
* [Top Tech News Today, September 24, 2026 (TechStartups)](https://techstartups.com/2026/09/24/top-tech-news-today-september-24-2026-amazon-anthropic-deepseek-google-meta-openai-oracle-more/)
* Relacionado: [Benchmarks de Kimi K3](/blog/es/kimi-k3-benchmarks)
