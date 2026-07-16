---
title: "Manejo de conexiones de bases de datos a escala en funciones Serverless"
description: "Cómo evitar el agotamiento de conexiones de bases de datos en AWS Lambda y gestionar grupos de conexiones de forma eficaz."
date: 2026-01-03
tags: [Serverless, Base de Datos, AWS Lambda, PostgreSQL, Diseño de Sistemas]
coverImage: /assets/images/serverless-database.webp
previewImage: /assets/images/serverless-database.webp
---

Las arquitecturas Serverless como AWS Lambda se escalan instantáneamente para manejar picos de tráfico entrante. Sin embargo, las bases de datos relacionales tradicionales como PostgreSQL y MySQL no fueron creadas para este modelo de escalado efímero. Esperan un grupo estable de conexiones de larga duración.

Cuando miles de funciones Lambda se inician simultáneamente, pueden saturar fácilmente tu base de datos, lo que provoca el **agotamiento del grupo de conexiones** y la caída de la aplicación.

---

## La causa raíz: Picos de conexión

In una arquitectura de servidor tradicional, una única instancia de aplicación establece un grupo de conexiones (por ejemplo, 20 conexiones) y lo comparte entre todas las solicitudes simultáneas.

En un modelo Serverless:
* Cada instancia activa de Lambda se ejecuta en su propio contenedor aislado.
* Cada contenedor establece su propia conexión a la base de datos.
* Si tu aplicación se escala a **1,000 ejecuciones simultáneas**, realizarás **1,000 solicitudes de conexión independientes** a tu base de datos. La mayoría de los motores de bases de datos se quedarán sin memoria o superarán sus límites máximos de conexión, lanzando errores de `Too Many Connections`.

---

## Buenas prácticas para conexiones DB Serverless

Para evitar el agotamiento de las conexiones y mantener tu aplicación serverless funcionando sin problemas, implementa estos patrones:

### 1. Inicializa las conexiones fuera del controlador (Handler)
En AWS Lambda, declara tu cliente de base de datos *fuera* de la función controladora. Esto permite que la conexión persista en las ejecuciones posteriores de la misma instancia de contenedor (arranque en caliente o warm start).

```javascript
// Cliente de base de datos inicializado fuera del controlador (se ejecuta una vez en el arranque en frío)
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
let isConnected = false;

exports.handler = async (event) => {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  
  const res = await client.query('SELECT NOW()');
  return { statusCode: 200, body: JSON.stringify(res.rows) };
};
```

### 2. Utiliza un Proxy de Base de Datos
En lugar de conectarte directamente a la base de datos, enruta tus solicitudes de conexión a través de un proxy. Un proxy intercepta las solicitudes, agrupa las conexiones a la base de datos y las comparte de manera eficiente entre miles de funciones efímeras.

* **AWS RDS Proxy:** Un proxy de base de datos totalmente administrado que agrupa las conexiones a la base de datos, mejora la seguridad y gestiona los fallos de forma transparente.
* **Prisma Accelerate:** Un proxy de base de datos serverless popular para aplicaciones Node.js.

### 3. Minimiza el tamaño de los grupos (Pool Sizes)
Si estás utilizando un ORM o una biblioteca de grupos de conexiones dentro de tu función serverless, establece el tamaño máximo del grupo (`max`) en **1**. No es necesario que un solo contenedor Lambda mantenga un grupo de 10 conexiones, ya que un solo contenedor solo procesa una solicitud a la vez.

---

## Resumen

El escalado de arquitecturas serverless requiere repensar cómo se gestionan las bases de datos relacionales. Al almacenar en caché los clientes de conexión fuera del controlador, minimizar el tamaño de los grupos internos y utilizar un proxy de base de datos como AWS RDS Proxy, puedes evitar caídas en las conexiones de la base de datos y crear aplicaciones serverless a escala en la nube a prueba de fallos.
