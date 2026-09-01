---
title: "La jugada de Intel en Hot Chips 2026: 256 núcleos en Diamond Rapids y la apuesta sin HBM de Crescent Island"
description: "Intel presentó dos arquitecturas en Hot Chips que apuntan directamente al dominio de Nvidia en aceleradores. Diamond Rapids integra 256 núcleos P en 18A-P para cargas de IA agéntica. Crescent Island prescinde por completo de HBM, utilizando 480GB de LPDDR5X para inferencia refrigerada por aire a 350W."
date: "2026-08-24"
tags: [Hardware y Semiconductores]
coverImage: /assets/images/intel-hot-chips-2026-diamond-rapids-crescent-island.webp
previewImage: /assets/images/intel-hot-chips-2026-diamond-rapids-crescent-island.webp
---


> **TL;DR**
> * **Diamond Rapids (Xeon 7):** 256 núcleos de rendimiento Panther Cove, proceso Intel 18A-P, 1.28GB de caché de último nivel (LLC), 16 canales de memoria DDR5-12800, CXL 3.0, PCIe Gen6. Diseñado para IA agéntica y centros de datos empresariales en 2027.
> * **Crescent Island (Xe3P):** 32 núcleos Xe, refrigeración por aire a 350W, hasta 480GB de LPDDR5X (sin HBM). Optimizado para tokens por vatio en servidores estándar.
> * **La apuesta contraria:** Mientras la industria se vuelca hacia aceleradores dependientes de HBM con refrigeración líquida, Intel apunta al 80% de los racks de centros de datos que nunca incorporarán tuberías de líquido refrigerante.

## Dos arquitecturas, una sola tesis estratégica

Las presentaciones de Intel en Hot Chips 2026 fueron complejas en lo técnico pero sumamente coherentes en lo estratégico: abordar el mercado de aceleradores de IA desde dos frentes donde la arquitectura de Nvidia deja flancos abiertos.

Diamond Rapids representa la fuerza bruta: dotar a la CPU de suficiente potencia para cargas de IA agéntica que no requieren el cálculo matricial masivo de una GPU pero sí exigen un número elevado de hilos, gran ancho de banda de memoria y baja latencia de acceso a grandes conjuntos de datos de trabajo.

Crescent Island representa la eficiencia práctica: construir un acelerador de inferencia específico para operar en racks convencionales refrigerados por aire, empleando memoria LPDDR5X estándar en lugar de HBM escasa y costosa, compitiendo en tokens por vatio en lugar de FLOPS teóricos pico.

## Diamond Rapids: La CPU como motor principal de IA

| Especificación | Diamond Rapids (Xeon 7) |
|----------------|------------------------|
| Recuento de núcleos | 256 núcleos P Panther Cove |
| Nodo de proceso | Intel 18A-P (chiplets de cómputo) |
| Arquitectura de chiplets | 16 chiplets de 16 núcleos cada uno |
| Empaquetado | Foveros Direct 3D hybrid bonding + interconexiones UCIe-S |
| Caché de último nivel (LLC) | **1.28 GB** |
| Canales de memoria | 16 canales DDR5 hasta 12,800 MT/s |
| PCIe | 128 líneas Gen6 |
| CXL | 3.0 |
| Extensiones ISA | APX (Advanced Performance Extensions), AMX ampliado |
| Lanzamiento previsto | 2027 |

La cifra de 1.28GB de caché LLC resulta determinante. Como referencia, equivale a más memoria SRAM en el propio chip que la memoria DRAM total presente en muchos servidores. La justificación reside en la IA agéntica: flujos autónomos que lanzan decenas de hilos paralelos, manteniendo extensas ventanas de contexto y estados de llamadas a herramientas. Estas cargas están limitadas por la latencia de memoria, no por la potencia de cálculo. Una LLC masiva minimiza las lecturas a DRAM externa, reduciendo la latencia de respuesta de los agentes.

El empaquetado demuestra el valor de Intel como fabricante integrado. Los chiplets de cómputo en 18A-P se unen a baldosas base en Intel 3-T mediante Foveros Direct (unión híbrida con paso inferior a 1 micra). Las baldosas de interconexión en Intel 3 se conectan vía UCIe-S. Toda la integración se produce en fábricas de Intel, sin depender de TSMC.

256 núcleos P en un único zócalo permiten ejecutar inferencias en modelos medianos (7B a 30B de parámetros) directamente en la CPU, sin necesidad de aceleradores dedicados. Para entornos corporativos que buscan capacidades de IA sin gestionar infraestructura compleja de GPUs, este enfoque resulta sumamente atractivo.

## Crescent Island: El acelerador de inferencia sin HBM

| Especificación | Crescent Island |
|----------------|----------------|
| Arquitectura | Xe3P |
| Núcleos Xe | 32 (4 secciones de 8) |
| Motores vectoriales | 256 en total |
| Aceleradores matriciales XMX | 256 en total (matriz sistólica de 16 niveles) |
| Banco de registros (GRF) | 1MB por núcleo |
| Caché L1/SLM | 512KB por núcleo |
| Caché L2 | 32MB unificada |
| Memoria | **LPDDR5X, hasta 480GB** (referencia: 160GB) |
| TDP | **350W, refrigeración por aire** |
| Formatos numéricos | FP4, MXFP4, FP8, BF16, FP16, FP32, FP64 |
| Formato físico | Tarjeta PCIe |

La filosofía de diseño es deliberadamente contracorriente. Los competidores de referencia (Nvidia H100/H200/B200, AMD MI300X/MI400) utilizan HBM. Esta memoria aporta anchos de banda muy elevados (>3 TB/s en H200), pero introduce limitaciones severas:

- **Coste.** La memoria HBM4 de SK Hynix y Samsung cotiza entre un 20% y un 30% por encima de HBM3e. En un acelerador con 6 a 8 módulos HBM, el coste de la memoria por sí sola puede superar los $5,000 por chip.
- **Restricciones de suministro.** La capacidad de empaquetado CoWoS en TSMC es limitada, lo que convierte la asignación de HBM en un cuello de botella para la producción de aceleradores.
- **Refrigeración.** Los módulos HBM generan densidades térmicas muy altas. Los chips B200 y MI300X requieren refrigeración líquida. La gran mayoría de los centros de datos actuales emplean refrigeración por aire y no pueden reconvertirse sin obras e inversiones mayúsculas.

Crescent Island sortea estos tres obstáculos. LPDDR5X es memoria de amplia disponibilidad comercial y aproximadamente 5 veces más barata por gigabyte que HBM. Con una capacidad máxima de 480GB, ofrece 2.4 veces la capacidad de un H200 (80GB HBM3e) a una fracción del coste por gigabyte. Aunque el ancho de banda es inferior (LPDDR5X ronda los 130 GB/s por canal frente a los >3 TB/s de HBM), muchas tareas de inferencia están limitadas por capacidad de memoria más que por ancho de banda puro.

Una tarjeta PCIe de 350W encaja en cualquier ranura estándar, sin necesidad de circuitos de líquido refrigerante ni adaptaciones especiales. Para el 80% de los centros de datos corporativos que no son instalaciones a escala hiperescala, esta es la única vía viable para desplegar hardware de inferencia de IA.

## Posicionamiento frente a Nvidia y AMD

La propuesta de Intel no busca superar a Nvidia en rendimiento bruto pico. El planteamiento es:

**Para Diamond Rapids:** "Tus flujos de IA agéntica no requieren GPUs costosas; necesitan 256 núcleos veloces, 1.28GB de LLC y CXL 3.0 para direccionar terabytes de memoria. Utiliza Xeons".

**Para Crescent Island:** "Tu despliegue de inferencia no necesita HBM, refrigeración líquida ni tarjetas de $30,000. Utiliza una tarjeta PCIe de 350W con 480GB de LPDDR5X y genera tokens en los racks que ya posees".

Ambas propuestas se dirigen a la brecha existente entre lo que construyen los proveedores hiperescala y lo que el resto de las organizaciones puede operar de forma realista.

El reto para Intel radica en la ejecución. Los rendimientos de producción de 18A-P deben demostrarse a escala y la arquitectura Xe3P no cuenta aún con un historial probado en inferencia masiva. La fecha de lanzamiento de Diamond Rapids en 2027 será la prueba decisiva.

## La métrica de tokens por vatio

El énfasis en tokens por vatio en lugar de FLOPS o tokens por segundo es un cambio de enfoque intencionado. Reconoce la ventaja de Nvidia en rendimiento puro y sitúa la competencia en el coste total de propiedad (TCO).

Una tarjeta de 350W por aire en un rack convencional reduce drásticamente los costes operativos frente a un acelerador de 700W con refrigeración líquida. Para las organizaciones que planifican costes de inferencia a varios años, la ecuación considera el coste del hardware, el consumo eléctrico y la infraestructura necesaria. Crescent Island busca imponerse en esa relación global de eficiencia y coste.

---

*Detalles arquitectónicos obtenidos de las presentaciones en Hot Chips 2026 reportadas por TechPowerUp, Tom's Hardware, Serve the Home, TweakTown y TrendForce. Análisis competitivo basado en las especificaciones actuales de Nvidia y AMD.*

