---
title: "Fargate vs EC2 para servicios always-on: cuándo la prima deja de tener sentido"
description: "Fargate va bien para trabajo con picos. Para APIs y workers que no duermen, la prima por vCPU se acumula. Aquí va la matemática de 2026 y el trade-off de ops."
date: "2026-06-23"
tags: [Cloud y DevOps]
coverImage: /assets/images/fargate-vs-ec2-always-on.webp
previewImage: /assets/images/fargate-vs-ec2-always-on.webp
---


Fargate es la respuesta por defecto en muchos architecture reviews. Sin AMIs. Sin capacity providers. Sin "quién parcheó el nodo." Defines CPU y memoria, publicas un task y AWS lo ejecuta.

Ese es el producto correcto para mucho trabajo. Es el producto incorrecto para mucho trabajo **always-on**. La factura lo deja claro tras unos meses de tráfico 24/7 estable.

Es el mismo hábito de coste que aparece con NAT Gateways y otras conveniencias gestionadas: pagas una prima por no poseer una caja. La prima está bien cuando la utilización es irregular. Es cara cuando la utilización es plana.

---

## Qué estás comprando de verdad

| Modelo | Pagas por | Gestionas |
| --- | --- | --- |
| **Fargate** | vCPU-hora + GB-hora de cada task en ejecución | Task definition, red, IAM, logging |
| **ECS en EC2** | La instancia (On-Demand, Spot o Savings Plan) | Capacidad, packing, AMI/OS, más modos de fallo |
| **EC2 crudo + Docker/systemd** | La instancia | Casi todo |

Fargate factura la **rebanada reservada** de cada task. Si un task pide 1 vCPU y usa el 15% de un core casi toda la noche, sigues pagando 1 vCPU toda la noche. En EC2, ese headroom idle se puede compartir con otros tasks en el mismo host, o reduces el tamaño del host.

AWS lo ha publicado durante años en sus propios textos de coste de ECS: con packing bajo, Fargate puede parecer más barato que un EC2 a medio vacío. Con utilización alta y estable, EC2 suele ganar en dólares de compute puros.

---

## Matemática mensual aproximada (us-east-1, orden de magnitud)

Los números se mueven con Savings Plans y región. Úsalos como **forma**, no como cotización.

| Workload | Fargate (siempre encendido) | Equivalente EC2 cercano | Notas |
| --- | --- | --- | --- |
| 0.5 vCPU / 1 GB, 1 task | ~$18/mes | clase `t3.micro` / `t4g.micro` | Fargate sigue ganando en simplicidad de ops para un servicio minúsculo |
| 1 vCPU / 2 GB, 2 tasks (HA) | ~$70/mes | Un host pequeño multi-vCPU o dos micros | El break-even depende de cuánto empaquetes |
| 2 vCPU / 4 GB, 4 tasks | ~$280/mes | packing tipo `t3.large` / `m7i` | EC2 empieza a adelantarse si los hosts se mantienen ocupados |
| 4 vCPU / 16 GB, flota estable | Cientos+/mes | `m7i.xlarge` y compañía | El estado estable + compromisos a 1 año favorecen más a EC2 |

Reglas prácticas que se sostienen:

1. **Una API always-on pequeña** con deploys raros: Fargate suele valer el impuesto.
2. **Una flota de workers y APIs todo el día, todos los días**: empaquétalos en ECS/EC2 o nodos EKS y compra un Compute Savings Plan.
3. **Batch con picos** (jobs de train, ETL nocturno, preview envs): Fargate o Fargate Spot evita pagar metal idle.

Si el CPU medio de tus tasks Fargate está por debajo de ~30% durante meses, no eres "eficiente." Estás alquilando capacidad reservada que no usas, a un precio unitario más alto que EC2.

---

## Ops es el segundo precio real

Los dólares puros son solo la mitad de la decisión.

**Fargate gana cuando:**

* No quieres una historia de upgrade de nodos
* Los equipos publican muchos servicios pequeños y odian el capacity planning
* Scale-to-zero o casi-cero importa (junto con buenos min task counts)
* El cumplimiento es más fácil cuando AWS posee el host de runtime

**EC2 (con ECS o EKS) gana cuando:**

* Ya tienes un platform team que parchea y monitorea nodos
* Necesitas DaemonSets, módulos de kernel custom o agentes a nivel host que Fargate bloquea o complica
* Importan GPU, alto throughput de red o bin-packing denso
* Puedes mantener el packing alto como para que la prima de Fargate sea puro desperdicio

La trampa es fingir que tienes un platform team cuando no lo tienes. Un cluster EC2 mal operado sale más caro que Fargate cuando sumas pages, deploys fallidos y fines de semana de "por qué está lleno el disco."

---

## Un camino de decisión simple

```
¿El servicio está idle la mayor parte del día o es muy bursty?
  sí -> Fargate (o Lambda si el runtime encaja)
  no -> sigue

¿Ya operáis bien nodos de contenedores?
  no -> quédate en Fargate hasta que la factura mensual duela más que el tiempo de ops
  sí -> modela EC2 con % de packing real

¿Podéis mantener utilización media del host sana (aprox. >50-60% de lo que pagáis)?
  sí -> ECS en EC2 o EKS con Savings Plans
  no -> Fargate sigue siendo más barato que instancias vacías
```

Mide el packing con métricas reales: CPU, memoria y **red** (la gente olvida la red). Ajusta las reservas de los tasks antes de migrar. Mover un task Fargate sobre-reservado a EC2 sin arreglar requests/limits solo traslada el desperdicio a otra línea de la factura.

---

## Patrón de migración que no tumba prod

Si ya estás en Fargate y la factura duele:

1. **Exporta 30 días de CloudWatch** de CPU, memoria y task count. Busca el suelo, no el pico del slide de marketing.
2. **Corta CPU/memoria del task** donde el headroom es fantasía. Muchos equipos descubren que el 50% de la factura Fargate es sobre-reserva, no Fargate en sí.
3. **Elige un servicio** always-on y aburrido (API interna, queue worker). Muévelo primero.
4. **Corre capacidad dual** un rato: servicio Fargate + capacity provider EC2, mueve tráfico con peso o feature flag.
5. **Compra compromiso solo después** de que la forma se estabilice. Savings Plans del tamaño incorrecto son un segundo impuesto.

Mira también el resto de la factura mientras estás ahí. Es común "optimizar compute" y seguir sangrando en procesamiento de datos del NAT, load balancers multi-AZ idle y logging verboso. El compute rara vez es el único impuesto idle.

---

## Conclusión

Fargate no es una estafa. Es una **prima de conveniencia**. Págalo para trabajo con picos, equipos pequeños y servicios donde gestionar el host es el riesgo real.

Para flotas always-on con suelos predecibles, capacidad EC2 (ECS o EKS) más packing honesto y un Savings Plan suele ser la decisión adulta. Haz la matemática con **tus** tasas de reserva y **tu** coste de ops, no con un slide de conferencia que asume bin packing perfecto o cero tiempo de ingenieros.

Si la factura de la nube de enero ya se siente como resaca, empieza con un servicio always-on, treinta días de métricas y una hoja de cálculo. El architecture review puede esperar a que los números sean aburridos.

