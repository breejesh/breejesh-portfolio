---
title: "Modelos de Precios de AWS EC2: Comparativa de On-Demand, Spot e Instancias Reservadas"
description: "Compara los modelos de precios de AWS EC2 con costes por hora reales, mecanica de interrupcion spot, riesgos de compromiso y estrategia hibrida."
date: 2026-02-20
tags: [AWS, Computacion en la Nube, Optimizacion de Costes, DevOps]
coverImage: /assets/images/aws-spot-reserved-ondemand.webp
previewImage: /assets/images/aws-spot-reserved-ondemand.webp
---

El cómputo en la nube suele consumir más de la mitad de la factura mensual de AWS de una empresa. Sin embargo, muchos equipos de ingeniería eligen instancias On-Demand por costumbre. Otros evitan las instancias Spot por completo tras experimentar una sola interrupción inesperada, o se comprometen a contratos de 3 años para cargas de trabajo que cambian en seis meses.

Elegir el modelo de precios incorrecto en EC2 malgasta dinero rápidamente. Entender las diferencias exactas entre On-Demand, Spot e Instancias Reservadas (incluyendo Savings Plans) permite reducir los costes de infraestructura entre un 50% y un 70% sin sacrificar el tiempo de actividad.

---

## Instancias On-Demand: Máxima Flexibilidad, Mayor Coste Unitario

El modelo On-Demand es la tarifa base de AWS. Pagas por el cómputo por segundo (con un mínimo de 60 segundos) sin compromiso a largo plazo ni pagos por adelantado.

### Perfil de Coste Real

Para una instancia optimizada para cómputo como `c6i.2xlarge` (8 vCPU, 16 GB de RAM) en la región `us-east-1`:

* **Tarifa On-Demand:** $0.34 por hora
* **Coste Mensual (24/7):** ~$248.20 al mes

### Cuándo Usar On-Demand

* Cargas de trabajo de corta duración que duran menos de unas pocas semanas.
* Picos de tráfico impredecibles donde el escalado inmediato es obligatorio.
* Entornos de desarrollo y pruebas que funcionan en intervalos breves e irregulares.
* Pruebas iniciales de aplicaciones antes de establecer la demanda de recursos a largo plazo.

### El Problema de Usar 100% On-Demand

Ejecutar cargas de producción exclusivamente en On-Demand equivale a pagar el precio de venta completo por cada servidor las 24 horas del día. Si un servicio se ejecuta continuamente durante más de dos meses, mantenerlo en On-Demand supone un gasto innecesario.

---

## Instancias Spot: Descuentos de hasta el 90% con Mecánica de Interrupción

Las instancias Spot permiten utilizar la capacidad excedente de AWS EC2. AWS ofrece estos servidores desocupados con importantes descuentos, normalmente entre un 65% y un 75% por debajo de los precios On-Demand, y hasta un 90% para tipos de instancia menos comunes.

### Perfil de Coste Real

Comparando la misma instancia `c6i.2xlarge` en `us-east-1`:

* **Tarifa Spot:** ~$0.091 por hora (varía dinámicamente según la oferta)
* **Coste Mensual (24/7):** ~$66.42 al mes
* **Ahorro:** ~73% de descuento en comparación con On-Demand

### El Detalle: Interrupciones y Reclamación de Capacidad

AWS puede reclamar una instancia Spot en cualquier momento cuando aumenta la demanda de capacidad On-Demand. Cuando AWS necesita recuperar la capacidad, envía un **aviso de interrupción con 2 minutos de antelación**.

La capacidad Spot se organiza en grupos (pools). Un grupo Spot se define por tres parámetros:

1. Tipo de Instancia (por ejemplo, `c6i.2xlarge`)
2. Zona de Disponibilidad (por ejemplo, `us-east-1a`)
3. Región (por ejemplo, `us-east-1`)

Si un grupo específico se queda sin hardware disponible, AWS interrumpe los nodos Spot de ese grupo.

### Línea de Tiempo de Interrupción Spot

* **0:00:** AWS señala la interrupción mediante IMDS o EventBridge.
* **0:05:** Node Handler marca el nodo como no programable (`kubectl cordon`).
* **0:10:** Pods activos reciben `SIGTERM`, nuevos pods van a otros nodos.
* **1:50:** Cargas de trabajo terminan de guardar estado en disco o red.
* **2:00:** AWS termina la instancia EC2.

### Cómo Diseñar para la Fiabilidad en Spot

1. **Diversificación de Instancias:** No dependas de un solo tipo de instancia. Configura los Auto Scaling Groups o Kubernetes Karpenter para solicitar múltiples familias de instancias en varias Zonas de Disponibilidad (por ejemplo: `c6i.2xlarge`, `c5.2xlarge`, `c6a.2xlarge`, `m6i.2xlarge`).
2. **Automatizar el Drenado de Nodos:** Captura el aviso de 2 minutos mediante el Servicio de Metadatos de Instancia (IMDS) en `http://169.254.169.254/latest/meta-data/spot/instance-action` o EventBridge `EC2 Instance State-change Notification`.
3. **Usar Avisos de Reequilibrio de Capacidad:** AWS proporciona la señal `EC2 Instance-rebalance-recommendation` hasta 15 minutos antes de la interrupción cuando la capacidad del grupo empieza a reducirse.

### Mejores Cargas de Trabajo para Spot

* Servidores web sin estado y microservicios API tras un equilibrador de carga.
* Nodos de trabajo de Kubernetes para pods tolerantes a fallos.
* Procesamiento por lotes (AWS Batch, EMR, Ray, Spark).
* Agentes de compilación CI/CD y pruebas automatizadas.

### Evitar Spot En

* Bases de datos relacionales (RDS PostgreSQL, MySQL) y almacenes de datos de un solo nodo.
* Aplicaciones monolíticas sin código de cierre controlado.
* Aplicaciones con estado sin replicación en tiempo real entre nodos.

---

## Instancias Reservadas y Savings Plans: Descuentos por Compromiso

Para cargas de trabajo estables y predecibles, AWS ofrece descuentos a cambio de un compromiso de 1 o 3 años.

### RIs frente a Savings Plans

Aunque las Instancias Reservadas (RIs) tradicionales siguen existiendo, los AWS Savings Plans son la opción moderna preferida para descuentos basados en compromiso.

| Opción de Precio | Compromiso | Flexibilidad | Descuento Habitual |
|---|---|---|---|
| **Compute Savings Plans** | 1 o 3 Años | Máxima. Aplica a familias de instancias, SO, regiones, Fargate y Lambda. | 37% (1 Año) a 66% (3 Años) |
| **EC2 Instance Savings Plans** | 1 o 3 Años | Media. Limitado a una familia de instancias en una sola región. | 40% (1 Año) a 72% (3 Años) |
| **RIs Estándar** | 1 o 3 Años | Baja. Limitado a tipo de instancia, SO y región. Se pueden vender en el RI Marketplace. | 35% (1 Año) a 60% (3 Años) |
| **RIs Convertibles** | 1 o 3 Años | Media. Permite cambiar a diferentes especificaciones de instancia. | 30% (1 Año) a 54% (3 Años) |

### Perfil de Coste Real

Para una instancia `c6i.2xlarge` en `us-east-1`:

* **On-Demand:** $0.340 por hora ($248.20 / mes)
* **1-Year Compute Savings Plan (Sin pago inicial):** ~$0.214 por hora ($156.22 / mes, 37% de ahorro)
* **3-Year EC2 Instance Savings Plan (Todo por adelantado):** ~$0.095 por hora ($69.35 / mes, 72% de ahorro)

### El Riesgo de Bloqueo (Lock-in)

El inconveniente de los compromisos es el bloqueo financiero. Si firmas un EC2 Instance Savings Plan de 3 años para instancias `c6i` y tu equipo cambia la arquitectura a procesadores Graviton `c7g` o AWS Lambda seis meses después, sigues obligado a pagar los 2.5 años restantes del contrato `c6i`.

Los Compute Savings Plans reducen este riesgo al aplicar automáticamente el compromiso por hora a todas las familias de instancias, arquitecturas (x86 frente a ARM) y servicios de cómputo (EC2, Fargate, Lambda).

---

## Comparativa Directa de Precios y Funciones

Así se comparan las cuatro opciones principales para un servidor de 8 vCPU y 16 GB de RAM (equivalente a `c6i.2xlarge`):

| Métrica / Función | On-Demand | Instancias Spot | 1-Yr Compute Savings Plan | 3-Yr EC2 Instance Savings Plan |
|---|---|---|---|---|
| **Precio por Hora** | $0.340 | ~$0.091 | ~$0.214 | ~$0.095 |
| **Factura Mensual** | $248.20 | ~$66.42 | ~$156.22 | ~$69.35 |
| **Descuento vs. OD** | 0% | 65% - 75% | ~37% | ~72% |
| **Compromiso** | Ninguno | Ninguno | 1 Año | 3 Años |
| **Riesgo de Interrupción** | Ninguno | Alto (aviso de 2 min) | Ninguno | Ninguno |
| **Flexibilidad de Familia** | Inmediata | Inmediata | Alta (automática) | Baja (familia fija) |
| **Flexibilidad de Región** | Inmediata | Inmediata | Alta (global) | Baja (región fija) |

---

## La Estrategia Híbrida 70/20/10 en Producción

Las arquitecturas de nube más eficientes no eligen un solo modelo de precios. Combinan los tres en una estructura de asignación híbrida.

### Estructura de Asignación Híbrida

* **Base Estable (60% a 70%):** Compute Savings Plans (1 o 3 Años) para infraestructura central.
* **Escalado (20% a 30%):** Instancias Spot en múltiples zonas y familias de instancias.
* **Picos Altos (10%):** Auto Scaling Groups On-Demand para margen de seguridad.

### Desglose Arquitectónico

1. **60% a 70% Base Estable (Compute Savings Plans):** Cubre tu consumo mínimo diario con Compute Savings Plans a 1 o 3 años. Esto incluye clusters de bases de datos, planos de control y servidores web base.
2. **20% a 30% Cómputo Escalable (Instancias Spot):** Usa instancias Spot para escalar aplicaciones sin estado durante picos de tráfico diurnos. Configura Karpenter o Auto Scaling Groups con al menos 4 a 6 tipos de instancias.
3. **10% Margen de Seguridad (On-Demand):** Mantén On-Demand como mecanismo de respaldo. Si los grupos Spot se agotan, los Auto Scaling Groups inician instancias On-Demand temporalmente hasta que se recupere la capacidad Spot.

### Cálculo de ROI: Carga de Trabajo de 100 vCPU

Para una infraestructura que requiere 100 vCPUs (equivalente a doce instancias `c6i.2xlarge`) ejecutándose de forma continua:

* **Estrategia 100% On-Demand:** 12 x $248.20 = **$2,978.40 al mes**
* **Estrategia 100% 3-Year EC2 Savings Plan:** 12 x $69.35 = **$832.20 al mes** (Riesgo: cero agilidad)
* **Estrategia Híbrida 70/20/10:**
  * 8 nodos en Compute Savings Plan (3 Años): 8 x $95.00 = $760.00
  * 3 nodos en Instancias Spot: 3 x $66.42 = $199.26
  * 1 nodo en On-Demand (pico): 1 x $248.20 = $248.20
  * **Coste Total Híbrido:** **$1,207.46 al mes**

El enfoque híbrido reduce el gasto mensual un **59.4%** manteniendo la agilidad técnica y eliminando puntos únicos de fallo durante eventos de reclamación de capacidad Spot.

---

## Lista de Comprobación para Tomar Decisiones

Antes de seleccionar una modalidad de contratación en EC2, evalúa tu carga de trabajo con estos criterios:

* ¿La carga de trabajo tolera la finalización de nodos con un aviso de 2 minutos? **Usa Spot.**
* ¿Es una base de datos con estado o un componente de infraestructura central que funciona 24/7? **Usa Savings Plans.**
* ¿Es un prototipo inicial o un pico de tráfico breve e impredecible? **Usa On-Demand.**
* ¿Planeas migrar entre arquitecturas o tipos de instancia en los próximos 12 meses? **Elige Compute Savings Plans en lugar de EC2 Instance Savings Plans.**
