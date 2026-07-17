---
title: "Manejo de conexiones a bases de datos a escala en funciones Serverless"
description: "Cómo evitar el agotamiento de conexiones a bases de datos en AWS Lambda y gestionar los grupos de conexiones de forma eficaz."
date: 2026-01-03
tags: [Serverless, Base de Datos, AWS Lambda, PostgreSQL, Diseño de Sistemas]
coverImage: /assets/images/serverless-database.webp
previewImage: /assets/images/serverless-database.webp
---

Las arquitecturas serverless como AWS Lambda se escalan instantáneamente para manejar picos de tráfico entrante. Sin embargo, las bases de datos relacionales tradicionales como PostgreSQL y MySQL no se diseñaron para este modelo de escalado efímero. Estas esperan un grupo estable de conexiones de larga duración, no miles de conexiones efímeras creadas y destruidas en segundos.

Cuando cientos o miles de instancias de Lambda se inician simultáneamente, pueden abrumar fácilmente a tu base de datos, lo que provoca el **agotamiento del grupo de conexiones**, fallas en cascada y tiempo de inactividad de la aplicación.

---

## La causa raíz: Tormentas de conexiones

En una arquitectura de servidor tradicional, una única instancia de aplicación establece un grupo de conexiones (por ejemplo, 20 conexiones) y las comparte entre todas las solicitudes concurrentes. Tres instancias detrás de un balanceador de carga significan 60 conexiones de base de datos en total: algo predecible y manejable.

En un modelo serverless, este contrato se rompe por completo:

* Cada instancia activa de Lambda se ejecuta en su propio **contenedor aislado**.
* Cada contenedor establece su propia conexión independiente a la base de datos.
* Si tu aplicación escala a **1,000 ejecuciones concurrentes**, realizarás **1,000 solicitudes de conexión independientes** a tu base de datos.
* La mayoría de las instancias de PostgreSQL tienen por defecto `max_connections = 100`. Un RDS `db.t3.medium` admite aproximadamente **150 conexiones**. Tus 1,000 instancias de Lambda agotarán este límite casi instantáneamente, arrojando errores del tipo `FATAL: too many connections`.

El problema se amplifica con los **arranques en frío (cold starts)**: cuando llega un pico de tráfico, Lambda lanza muchos contenedores nuevos simultáneamente. Cada uno abre de forma independiente una conexión antes de que comience el procesamiento de solicitudes, lo que crea una avalancha de intentos de conexión antes de que tu aplicación comience a responder.

---

## Estrategia 1: Reutilización de conexiones en ejecuciones tibias (Warm Starts)

La optimización más sencilla (y que muchos equipos pasan por alto) es inicializar el cliente de la base de datos **fuera** de la función del controlador (handler). Los contenedores de Lambda persisten entre invocaciones durante los arranques tibios, por lo que una conexión establecida en la primera invocación se puede reutilizar para solicitudes posteriores sin necesidad de volver a conectar.

```javascript
const { Client } = require('pg');

// Conexión inicializada fuera del controlador: persiste en invocaciones tibias
let client = null;

async function getClient() {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
      statement_timeout: 30000,
    });
    await client.connect();
  }
  return client;
}

exports.handler = async (event) => {
  const db = await getClient();
  
  try {
    const res = await db.query('SELECT id, name FROM users WHERE active = $1', [true]);
    return { statusCode: 200, body: JSON.stringify(res.rows) };
  } catch (err) {
    // Manejar conexiones inactivas de ciclos de congelación/descongelación del contenedor
    if (err.code === 'EPIPE' || err.code === 'ECONNRESET') {
      client = null; // Forzar reconexión en la próxima invocación
      throw err;
    }
    throw err;
  }
};
```

**Detalles clave:**
- Las **consultas parametrizadas** (`$1`) evitan la inyección de SQL. Nunca interpoles la entrada del usuario directamente en las cadenas de consulta.
- **`connectionTimeoutMillis`** evita que la función se cuelgue indefinidamente si la base de datos está abrumada.
- **El manejo de conexiones inactivas (stale connections)** es crítico. Lambda congela los contenedores entre invocaciones. Si un contenedor se congela durante demasiado tiempo, la base de datos puede cerrar la conexión en el lado del servidor, pero el cliente sigue manteniendo una referencia al socket muerto. Sin la lógica de reconexión, la función fallará.

### Limpieza al apagar

Los contenedores de Lambda se reciclan con el tiempo. Puedes registrar un controlador de limpieza para cerrar las conexiones de forma elegante:

```javascript
process.on('beforeExit', async () => {
  if (client) {
    await client.end();
    client = null;
  }
});
```

Esto evita fugas de conexiones (connection leaks) de contenedores huérfanos que la base de datos todavía registra como activos.

---

## Estrategia 2: Usar un Proxy de Base de Datos

La reutilización de conexiones ayuda con los contenedores tibios, pero no resuelve el problema fundamental: **N instancias de Lambda = N conexiones a la base de datos**. Para desacoplar realmente tu capa de cómputo serverless de los límites de conexión de tu base de datos, necesitas un proxy que agrupe las conexiones.

### AWS RDS Proxy (Gestionado)

**AWS RDS Proxy** se sitúa entre tus funciones de Lambda y tu base de datos RDS. Mantiene un grupo persistente de conexiones a la base de datos y multiplexa miles de conexiones de Lambda a través de ese grupo.

**Cómo funciona:**
1. Tu función de Lambda se conecta al endpoint de RDS Proxy en lugar de a la base de datos directamente.
2. RDS Proxy mantiene un grupo de conexiones de larga duración a la base de datos real (por ejemplo, 50 conexiones).
3. Cuando el Contenedor A de Lambda envía una consulta, el proxy toma prestada una conexión del grupo, ejecuta la consulta y devuelve la conexión al grupo.
4. La consulta del Contenedor B de Lambda reutiliza la misma conexión de base de datos subyacente momentos después.

**Beneficios:**
- Maneja la multiplexación de conexiones de forma transparente: el código de tu aplicación no cambia (solo intercambia la cadena de conexión).
- Admite la autenticación basada en IAM, lo que elimina la necesidad de almacenar contraseñas en variables de entorno.
- Conmutación por error (failover) automática a réplicas de lectura en caso de cortes en la base de datos principal.

**Compromiso:** RDS Proxy añade un costo de ~$15-25/mes por proxy más $0.015 por hora de vCPU. Para despliegues grandes, es un costo insignificante en comparación con el tiempo de desarrollo que ahorra.

### PgBouncer (Autogestionado)

**PgBouncer** es el pooler de conexiones de código abierto más utilizado para PostgreSQL y una excelente alternativa si deseas más control o si no estás en AWS.

PgBouncer funciona en tres modos:

| Modo | Comportamiento | Ideal para |
|---|---|---|
| **Session** | Un cliente = una conexión al servidor durante la vida útil de la sesión | Transacciones de larga duración |
| **Transaction** | La conexión vuelve al grupo después de que se completa cada transacción | **La mayoría de cargas de trabajo serverless** |
| **Statement** | La conexión se devuelve después de cada declaración individual | Solo patrones de consulta simples |

Para arquitecturas serverless, el **modo de transacción** es casi siempre la opción correcta. Permite que un grupo de 50 conexiones de servidor atienda a miles de conexiones de Lambda de corta duración, porque cada conexión solo se "reserva" durante la duración de una sola transacción.

**Opciones de despliegue:**
- **Sidecar en EC2/ECS:** Ejecuta PgBouncer en una pequeña instancia en la misma VPC que tu base de datos. Lambda se conecta a PgBouncer y este a PostgreSQL.
- **Servicios gestionados:** Proveedores como Supabase, Neon y Crunchy Bridge incluyen instancias de PgBouncer integradas con sus ofertas de PostgreSQL gestionado.

### Comparación de soluciones de pool de conexiones

| Solución | Tipo | PostgreSQL | MySQL | Costo | Ideal para |
|---|---|---|---|---|---|
| **AWS RDS Proxy** | Gestionado | ✅ | ✅ | ~$20/mes + horas vCPU | Nativo de AWS, sin mantenimiento |
| **PgBouncer** | Autogestionado | ✅ | ❌ | Solo el costo de la instancia EC2 | Control máximo, multi-cloud |
| **Prisma Accelerate** | Gestionado | ✅ | ✅ | Plan gratuito, luego basado en uso | Usuarios de Node.js/Prisma ORM |
| **Neon Serverless Driver** | Gestionado | ✅ | ❌ | Incluido con Neon | Usuarios de Neon PostgreSQL |

---

## Estrategia 3: Minimizar el tamaño del pool

Si utilizas un ORM o una biblioteca de grupos de conexiones dentro de tu función de Lambda, establece el tamaño máximo del grupo (`max`) en **1**. Esto es contraintuitivo si vienes de un entorno de servidor tradicional, pero es lo correcto para Lambda:

```javascript
// Configuración de Knex.js para Lambda
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 0,  // Permitir que el grupo esté vacío cuando esté inactivo
    max: 1,  // Una conexión por contenedor de Lambda
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
  },
});
```

**¿Por qué `max: 1`?** Un solo contenedor de Lambda procesa exactamente una solicitud a la vez. No hay concurrencia dentro de un contenedor individual, por lo que mantener un grupo de 10 conexiones significa que 9 estarán permanentemente inactivas y desperdiciadas, pero seguirán contando para el límite de `max_connections` de tu base de datos.

> Establece `min: 0` también. Si el contenedor está tibio pero inactivo, una configuración de `min: 1` mantiene una conexión abierta innecesariamente. Con `min: 0`, el grupo libera la conexión después del tiempo de inactividad especificado, liberando un espacio en la base de datos para otros contenedores.

---

## Estrategia 4: Controlar las tormentas de conexiones en arranques en frío

Los arranques en frío (cold starts) es cuando el problema de conexión es peor. Durante un pico de tráfico, Lambda puede lanzar cientos de nuevos contenedores simultáneamente, y cada uno intentará establecer una conexión de base de datos en el mismo instante.

### Concurrencia Provisionada (Provisioned Concurrency)

La **Concurrencia Provisionada** de AWS Lambda mantiene un número específico de contenedores preinicializados y tibios en todo momento. Estos contenedores ya han establecido sus conexiones a la base de datos, por lo que cuando llega un pico de tráfico, los contenedores precalentados manejan las solicitudes iniciales sin tormentas de conexiones por arranque en frío.

```bash
aws lambda put-provisioned-concurrency-config \
  --function-name mi-funcion-api \
  --qualifier prod \
  --provisioned-concurrent-executions 50
```

**Compromiso:** Pagas por los contenedores provisionados incluso cuando están inactivos (~$0.0000041667/GB-segundo). Para una función de 512 MB con 50 instancias provisionadas, esto equivale a unos **$2.70/día**. Vale la pena para APIs de producción; excesivo para tareas por lotes (batch jobs).

### Concurrencia Reservada (Reserved Concurrency)

Si no puedes usar un proxy y necesitas un límite estricto en las conexiones de base de datos, establece la **Concurrencia Reservada** en tu función de Lambda para que coincida con el límite de conexiones de tu base de datos:

```bash
aws lambda put-function-concurrency \
  --function-name mi-funcion-api \
  --reserved-concurrent-executions 100
```

Esto garantiza que no se ejecuten más de 100 contenedores de Lambda simultáneamente, lo que significa un máximo de 100 conexiones a la base de datos. Las solicitudes que superen este límite serán rechazadas (reciben HTTP 429) en lugar de colapsar tu base de datos.

---

## Estrategia 5: Monitorear tus conexiones

Incluso con todas las estrategias anteriores, necesitas visibilidad de lo que sucede a nivel de base de datos. Las fugas de conexiones y los grupos mal configurados son asesinos silenciosos que solo salen a la luz durante los picos de tráfico.

### Monitoreo de conexiones activas en PostgreSQL

Ejecuta esta consulta periódicamente (o crea una métrica personalizada de CloudWatch a partir de ella) para realizar un seguimiento del uso de conexiones:

```sql
-- Conexiones actuales por estado
SELECT state, count(*) 
FROM pg_stat_activity 
WHERE datname = 'tu_base_de_datos'
GROUP BY state;

-- Conexiones por aplicación (identifica qué Lambda consume más conexiones)
SELECT application_name, count(*), state
FROM pg_stat_activity 
WHERE datname = 'tu_base_de_datos'
GROUP BY application_name, state
ORDER BY count DESC;

-- Buscar conexiones inactivas de larga duración (candidatas a fugas de conexión)
SELECT pid, usename, application_name, state, 
       now() - state_change AS idle_duration
FROM pg_stat_activity 
WHERE state = 'idle' 
  AND now() - state_change > interval '5 minutes';
```

### Alarmas de CloudWatch

Configura alarmas para estas métricas clave:

* **`DatabaseConnections`** (métrica de RDS): Alerta cuando las conexiones superen el 80% de `max_connections`. Esto te da una ventana de advertencia antes de que comiencen las fallas.
* **Métrica `Throttles` de Lambda:** Si estás utilizando la concurrencia reservada como límite máximo, monitorea la tasa de rechazo para saber cuándo la demanda supera tu presupuesto de conexión.
* **`ConcurrentExecutions` de Lambda:** Realiza un seguimiento de la concurrencia máxima para comprender cuántas conexiones de base de datos necesita realmente tu función.

> **Consejo:** Establece el parámetro de conexión `application_name` en tu función de Lambda para incluir el nombre y la versión de la función. Esto hace que la salida de `pg_stat_activity` sea inmediatamente útil para la depuración: puedes ver exactamente qué funciones de Lambda están manteniendo las conexiones.

```javascript
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  application_name: `${process.env.AWS_LAMBDA_FUNCTION_NAME}-${process.env.AWS_LAMBDA_FUNCTION_VERSION}`,
});
```

---

## Conclusión

El escalado de arquitecturas serverless requiere repensar fundamentalmente cómo gestionas las bases de datos relacionales. El modelo de conexión que funciona perfectamente para servidores tradicionales (grupos persistentes compartidos entre solicitudes concurrentes) trabaja activamente en tu contra cuando cada invocación de función es un contenedor aislado.

El enfoque de defensa en profundidad combina múltiples estrategias:

1. **Reutilizar conexiones** entre invocaciones tibias con un manejo adecuado de conexiones inactivas.
2. **Interponer un proxy de conexión** (RDS Proxy o PgBouncer) para desacoplar la concurrencia de Lambda de las conexiones a la base de datos.
3. **Minimizar los tamaños de los grupos** a `max: 1` dentro de cada función.
4. **Controlar la concurrencia** con concurrencia provisionada o reservada para evitar tormentas de conexiones.
5. **Monitorear activamente** con consultas a `pg_stat_activity` y alarmas de CloudWatch.

Ninguna estrategia es una solución mágica. En la práctica, las arquitecturas serverless más resilientes utilizan un proxy como defensa principal y aplican las demás estrategias como capas de seguridad operacional adicionales.
