---
title: "El impuesto oculto de la nube: Por qué tu NAT Gateway se está comiendo tu presupuesto"
description: "Cómo reducir tu factura mensual de AWS cambiando de NAT Gateway a una instancia NAT autogestionada y rentable."
date: 2026-01-01
tags: [AWS, Optimización de Costos en la Nube, DevOps, Infraestructura]
coverImage: /assets/images/aws-cost-spike.webp
previewImage: /assets/images/aws-cost-spike.webp
---

Todos hemos estado allí. Miras tu factura mensual de AWS, esperando los números predecibles de siempre, solo para encontrar un aumento masivo que te devuelve la mirada. Tu mente empieza a correr, tratando de descubrir qué salió mal. ¿Se volvió loco un script? ¿Se duplicó repentinamente el tráfico?

Luego profundizas en el Cost Explorer y encuentras al culpable: **NAT Gateway**.

Se siente como un golpe en el estómago, especialmente cuando te das cuenta de que te cobran no solo por tener la puerta de enlace activa, sino por cada gigabyte de datos que pasa a través de ella. Si estás ejecutando cargas de trabajo con uso intensivo de datos, descargando imágenes de contenedores grandes o comunicándote constantemente con APIs externas, las tarifas de procesamiento de datos de NAT Gateway pueden convertirse rápidamente en tu mayor impuesto oculto de la nube.

Pero no tienes que seguir pagando por las cosas simplemente porque "así es como lo hacen todos". Si deseas dar un paso significativo hacia una optimización de costos seria, es hora de hablar de una alternativa más ágil y amigable: **La instancia NAT** (NAT Instance).

---

## El costo real: NAT Gateway vs. Instancia NAT

Antes de saltar a la solución, veamos por qué NAT Gateway agota tu billetera tan rápido. AWS cobra **~$0.045/hora** solo por ejecutar un NAT Gateway (aproximadamente **$32.40/mes** antes de que se mueva cualquier dato), más **$0.045 por GB** de datos procesados. Si tu arquitectura mueve terabytes de datos a Internet u otros servicios de AWS fuera de tu VPC, esa tarifa de procesamiento se acumula rápidamente, y escala linealmente con tu volumen de tráfico, por lo que no hay descuentos por volumen que te salven.

Una **instancia NAT**, por otro lado, cambia el juego por completo:

* **Sin tarifas de procesamiento de datos:** Pagas estrictamente por el tamaño de la instancia EC2 subyacente que elijas. Ya sea que transfieras 10 GB o 10 TB, el costo de procesamiento de datos es cero.
* **Precios flexibles:** Tú eliges la familia de instancias. ¿Necesitas una configuración pequeña para un entorno de staging? Usa una `t4g.nano` o `t4g.micro` por centavos al día.
* **Control total:** Debido a que es una instancia EC2 estándar que ejecuta Linux, puedes monitorear el tráfico directamente, aplicar reglas de firewall personalizadas o apagarla fuera del horario laboral para ahorrar aún más.

### Comparación de costos a escala

Así es como se ven los números reales para una carga de trabajo típica en `us-east-1`:

| Transferencia de datos mensual | Costo de NAT Gateway | Instancia NAT (`t4g.small`) | Ahorros |
|---|---|---|---|
| 100 GB | $32.40 + $4.50 = **$36.90** | **~$12.26** | **67%** |
| 1 TB | $32.40 + $45.00 = **$77.40** | **~$12.26** | **84%** |
| 5 TB | $32.40 + $225.00 = **$257.40** | **~$12.26** | **95%** |
| 10 TB | $32.40 + $450.00 = **$482.40** | **~$12.26** | **97%** |

*Precios de la instancia NAT: `t4g.small` On-Demand a ~$0.0168/hr. Se aplican las tarifas estándar de transferencia de datos de EC2 (los primeros 100 GB/mes gratis, luego $0.09/GB), pero la tarifa de procesamiento de NAT por GB se elimina por completo.*

Los números hablan por sí solos. Para cargas de trabajo con uso intensivo de datos, los ahorros son dramáticos.

---

## Paso a paso: Configuración de tu instancia NAT

¿Listo para liberarte de esas interminables sorpresas de facturación? Configurar una instancia NAT es sencillo. Aquí te explicamos cómo hacerlo.

### Paso 1: Lanzar la instancia

> **Nota:** La AMI NAT preconfigurada heredada de AWS (`amzn-ami-vpc-nat`) se basó en Amazon Linux 1, que llegó al final de su vida útil en diciembre de 2023. Debes usar una AMI moderna de **Amazon Linux 2023** y configurar NAT manualmente (descrito en el Paso 2), o usar la AMI mantenida por la comunidad [fck-nat](https://fck-nat.dev/) que automatiza toda la configuración en una instancia Graviton moderna basada en ARM.

1. Ve al panel de EC2 y haz clic en **Launch Instance**.
2. Selecciona **Amazon Linux 2023** (ARM/Graviton para ahorrar costos) o busca la AMI comunitaria **fck-nat**.
3. Selecciona un tamaño de instancia que se adapte a tus necesidades de ancho de banda (una `t4g.small` maneja hasta 5 Gbps de ráfaga y es un excelente punto de partida).
4. Lánzala dentro de tu **Subred Pública**. Asegúrate de que reciba una IP pública o adjúntale una Elastic IP.

### Paso 2: Configurar NAT con iptables

Si estás utilizando una AMI estándar de Amazon Linux 2023 (no fck-nat), debes habilitar el reenvío de IP (IP forwarding) y configurar las reglas de enmascaramiento (masquerade). Accede por SSH a tu instancia y ejecuta:

```bash
# Habilitar el reenvío de IP (persiste después de reiniciar)
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/90-nat.conf
sudo sysctl -p /etc/sysctl.d/90-nat.conf

# Configurar iptables para enmascarar el tráfico saliente
sudo iptables -t nat -A POSTROUTING -o ens5 -j MASQUERADE

# Persistir las reglas de iptables después de reiniciar
sudo yum install -y iptables-services
sudo service iptables save
sudo systemctl enable iptables
```

> Reemplaza `ens5` con el nombre de la interfaz de red principal de tu instancia (verifícalo con `ip link show`).

### Paso 3: Desactivar la verificación de origen/destino (Source/Destination Checking)

Este es el paso que todos olvidan. Por defecto, las instancias EC2 solo aceptan o envían tráfico si son el origen o el destino. Debido a que esta instancia actuará como intermediaria (enrutando el tráfico para otros servidores), debes desactivar esta opción.

1. Selecciona tu nueva instancia NAT en la consola de EC2.
2. Haz clic en **Actions** > **Networking** > **Change Source/Destination Check**.
3. Establécelo en **Stop/Disable**.

### Paso 4: Actualizar tus tablas de enrutamiento (Route Tables)

Ahora, debes indicarle a tus subredes privadas que envíen su tráfico con destino a Internet a través de tu nueva instancia en lugar de la puerta de enlace antigua.

1. Ve al panel de VPC y selecciona **Route Tables**.
2. Busca la tabla de enrutamiento asociada con tus **Subredes Privadas**.
3. Edita las rutas. Busca el destino `0.0.0.0/0`.
4. Cambia el objetivo (target) de tu antiguo `nat-xxxxxxxxxxxx` a tu nueva **Instancia** (`i-xxxxxxxxxxxx`).
5. Guarda los cambios.

### Paso 5: Proteger con Grupos de Seguridad (Security Groups)

Una ventaja a menudo pasada por alto de una instancia NAT sobre NAT Gateway es el **soporte de Grupos de Seguridad**. Los NAT Gateways solo admiten NACL, pero una instancia NAT puede usar Grupos de Seguridad para un control detallado:

* **Regla de entrada (Inbound):** Permitir tráfico de las CIDR de tus subredes privadas únicamente (por ejemplo, `10.0.2.0/24` y `10.0.3.0/24` en todos los puertos).
* **Regla de salida (Outbound):** Permitir HTTPS (443) y HTTP (80) a `0.0.0.0/0`, además de cualquier puerto específico que tus cargas de trabajo necesiten (por ejemplo, 5432 para PostgreSQL externo).
* **Acceso SSH:** Restringir SSH (22) a tu host bastión (bastion host) o CIDR de VPN para acceso de administración.

Esto te brinda un control mucho más granular sobre qué tráfico tiene permitido salir de tu VPC en comparación con lo que ofrece un NAT Gateway.

---

## Hacerlo autoregenerable con Auto Scaling

La mayor preocupación operativa con una instancia NAT es la disponibilidad: si la instancia EC2 falla, tus subredes privadas pierden el acceso a Internet. Puedes mitigar esto con un grupo de Auto Scaling (Auto Scaling Group) autoregenerable:

**Estrategia:** Crea un ASG con una capacidad mínima, máxima y deseada de **1**. Emparéjalo con una plantilla de lanzamiento (Launch Template) y una Elastic IP. Si la instancia termina (fallo de hardware, reclamación de instancia spot, etc.), el ASG lanza automáticamente un reemplazo. Utiliza un script de datos de usuario (user data script) simple para volver a adjuntar la Elastic IP y actualizar la tabla de enrutamiento al arrancar:

```bash
#!/bin/bash
INSTANCE_ID=$(ec2-metadata -i | cut -d' ' -f2)
ALLOC_ID="eipalloc-0abcdef1234567890"        # ID de asignación de tu Elastic IP
ROUTE_TABLE_ID="rtb-0abcdef1234567890"        # ID de tu tabla de enrutamiento privada

# Asociar la Elastic IP
aws ec2 associate-address \
  --instance-id "$INSTANCE_ID" \
  --allocation-id "$ALLOC_ID" \
  --allow-reassociation

# Actualizar la tabla de enrutamiento para apuntar a esta instancia
aws ec2 replace-route \
  --route-table-id "$ROUTE_TABLE_ID" \
  --destination-cidr-block "0.0.0.0/0" \
  --instance-id "$INSTANCE_ID"
```

> Asegúrate de que el rol IAM de la instancia tenga permisos para `ec2:AssociateAddress` y `ec2:ReplaceRoute`.

Con esta configuración, la recuperación de un fallo de instancia suele ser de menos de **2-3 minutos**, no instantánea como la alta disponibilidad incorporada de NAT Gateway, pero más que aceptable para entornos que no son de producción.

---

## La realidad: Tabla de comparación de características

Aunque los ahorros de costos son dramáticos, elegir una instancia NAT es una decisión consciente. Así es como se comparan en cada dimensión:

| Característica | NAT Gateway | Instancia NAT |
|---|---|---|
| **Gestión** | Totalmente gestionado por AWS | Tú gestionas el SO, parches y config NAT |
| **Ancho de banda** | Hasta 100 Gbps (escala auto) | Limitado por tipo de instancia EC2 (ej. 5 Gbps para `t4g.small`) |
| **Disponibilidad** | Redundante multi-AZ por defecto | Instancia única; necesita ASG para autoregeneración |
| **Tarifa de proc. de datos** | $0.045/GB | Ninguna |
| **Costo por hora** | ~$0.045/hr ($32.40/mes) | Depende del tipo de instancia (~$12/mes para `t4g.small`) |
| **Grupos de Seguridad** | ❌ No soportado (NACLs únicamente) | ✅ Soporte completo de Grupos de Seguridad |
| **Reenvío de puertos** | ❌ No soportado | ✅ Configurable con iptables |
| **Combo con Bastion Host** | ❌ Requiere recurso separado | ✅ Puede duplicar su función como bastion host |

---

## Reduce el gasto, mantén el rendimiento

Es perfectamente razonable cambiar tu arquitectura cuando las opciones predeterminadas ya no benefician a tus finanzas. No tienes que tolerar facturas masivas simplemente porque un NAT Gateway es la recomendación estándar.

Si ejecutas entornos que no son de producción, áreas de staging o pipelines de datos que no requieren un tiempo de actividad de grado operador del 99.99%, cambiar el gateway por una instancia NAT es una victoria fácil y masiva para tu presupuesto mensual. Incluso para cargas de trabajo de producción con necesidades de ancho de banda moderadas, una instancia NAT configurada correctamente con un grupo de Auto Scaling puede ofrecer un servicio confiable a una fracción del costo.

Pruébalo, monitorea el rendimiento y disfruta viendo cómo tu factura de AWS se reduce al lugar donde pertenece.
