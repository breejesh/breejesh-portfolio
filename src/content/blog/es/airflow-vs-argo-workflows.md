---
title: "Airflow vs Argo Workflows: elige el orquestador que encaje con tu runtime"
description: "DAGs en Python y una base de metadatos, o pasos nativos de Kubernetes y YAML. Cuándo gana Airflow, cuándo Argo Workflows encaja mejor, y cuándo lo confunden con Argo CD."
date: "2026-06-29"
tags: [Cloud y DevOps, Backend y Bases de Datos]
coverImage: /assets/images/airflow-vs-argo-workflows.webp
previewImage: /assets/images/airflow-vs-argo-workflows.webp
---

La gente dice "Airflow vs Argo" como si fuera un mano a mano de un solo producto. No lo es.

**Apache Airflow** es un orquestador de workflows con larga historia en equipos de datos: DAGs en Python, scheduler, workers y una base de metadatos. **Argo Workflows** es un motor de workflows nativo de Kubernetes: cada paso suele ser un pod, las definiciones son YAML (o YAML generado) y el control plane vive en el cluster.

**Argo CD** es otra herramienta (deploys GitOps). Si el debate es "Airflow vs Argo" y alguien habla de CD, para y renombra la conversación.

Este post es Airflow vs **Argo Workflows** para pipelines: ETL, cadenas de entrenamiento ML, jobs batch de features, reportes, cualquier grafo de pasos con reintentos y dependencias.

---

## La versión corta

| Dimensión | Airflow | Argo Workflows |
| --- | --- | --- |
| **Lenguaje nativo** | DAGs en Python | YAML / CRs (a menudo generados) |
| **Dónde corren los pasos** | Workers, executors Celery/K8s/Local, operators | Sobre todo pods de Kubernetes |
| **Estado** | DB de metadatos Postgres/MySQL | Kubernetes + status del workflow CR |
| **UI / cultura de ops** | UI madura, ecosistema rico de providers | kubectl + UI de Argo, modelo mental K8s-native |
| **Default razonable** | Plataforma de datos con sistemas mixtos | Ya vives en Kubernetes |

Si la empresa es "un equipo de datos que también tiene un cluster," Airflow suele seguir siendo el centro de gravedad. Si es "un equipo de plataforma donde cada job es un contenedor," Argo Workflows encaja con menos fricción.

---

## En qué es bueno Airflow

Airflow modela tiempo y lógica de negocio en Python. Suena blando. No lo es. Sensors, branching, dynamic task mapping, datasets y un catálogo enorme de providers (warehouses, colas, APIs SaaS) son la razón por la que se quedó.

Fortalezas concretas:

* **Sistemas heterogéneos.** Un DAG puede tocar Snowflake, S3, una API HTTP y luego un job Spark sin forzar cada paso a una imagen que tú mantienes.
* **Cultura de scheduling.** Schedules tipo cron, catchup, backfills y el pensamiento de "data interval" son de primera clase. Los data engineers viven ahí.
* **Ecosistema de operators.** Casi nunca inventas el hook de Snowflake o BigQuery desde cero.
* **UI para humanos que no son SREs.** Limpiar un task fallido, vista de grafo, logs y fallos de SLA son acciones del día a día.

Costes concretos:

* **Operas una app distribuida.** Scheduler, webserver, workers, DB de metadatos, broker si usas Celery. Eso es toil real.
* **Parse de DAGs en Python y complejidad.** DAGs dinámicos y archivos gigantes se vuelven su propio problema de rendimiento.
* **Kubernetes es opcional, no identidad.** KubernetesExecutor/PodOperator ayudan, pero Airflow no es "solo CRDs."

Airflow 2.x (y las features TaskFlow / datasets de la era 2.x que los equipos estandarizaron en 2024-2025) mejoró mucho el dolor antiguo de DAGs. No convirtió Airflow en un producto ligero solo de sidecars.

---

## En qué es bueno Argo Workflows

Argo Workflows asume que la unidad de trabajo es un contenedor en Kubernetes. Steps, DAGs, retries, artifacts y exit handlers se apoyan en esa asunción.

Fortalezas concretas:

* **Mismo runtime que los servicios de producción.** Construyes una vez, corres la misma imagen como Job/pod con pegamento de workflow.
* **Escalado nativo del cluster.** No hay una flota separada de workers Celery si el cluster ya escala nodos.
* **Definiciones con forma de Git.** YAML en el repo, review en PR, a menudo generado con herramientas de más alto nivel (Hera, Couler, codegen).
* **Buen encaje con ML y batch en K8s.** Nodos GPU, volume claims, service accounts, network policies: objetos K8s normales.

Costes concretos:

* **Todo se vuelve contenedor.** "Solo ejecuta este SQL en el warehouse" implica imagen, credenciales y ciclo de vida de pod aunque el cliente de query dure 200ms.
* **La lógica de negocio en Python vive en otro sitio.** O la metes en imágenes o mantienes una capa de generación. No obtienes gratis el "edita un DAG y piensa en Python" de Airflow.
* **Multi-cluster / sistemas fuera de K8s son incómodos.** El modelo de providers de Airflow sigue siendo más fuerte cuando la mitad del estate no está en el cluster.

Si todavía no operas bien Kubernetes, Argo Workflows no quita complejidad. La mueve a CRDs, controllers y RBAC.

---

## Tests de decisión que sí funcionan

### 1. ¿Dónde ejecutan hoy los pasos?

* Sobre todo warehouses, APIs SaaS, VMs, jobs multi-cloud → **Airflow** (o Airflow gestionado) es el cerebro con menos fricción.
* Sobre todo contenedores en uno o pocos clusters → **Argo Workflows** es coherente.

### 2. ¿Quién escribe los pipelines?

* Analytics/data engineers en notebooks Python y SQL de warehouse → **Airflow**.
* Platform/ML engineers que ya escriben Deployment YAML y Dockerfiles → **Argo**.

### 3. ¿Cuál es el failure domain que quieres?

* Airflow: scheduler + DB + workers. Si la DB de metadatos duele, duele todo.
* Argo: API de Kubernetes + workflow controller. Si el cluster duele, los workflows duelen con las apps.

Elige el failure domain que tu on-call ya entiende.

### 4. ¿Necesitas backfills de primera clase?

Los backfills y el reprocesado histórico siguen siendo deporte de equipos de datos. El modelo de Airflow está muy peleado ahí. Argo puede re-ejecutar workflows; la cultura de producto alrededor de data intervals y catchup es más delgada.

### 5. ¿Estáis a punto de "usar los dos"?

A veces es correcto:

* **Argo** para pasos pesados de compute en K8s (training, spark-on-k8s, builds grandes de imagen)
* **Airflow** como schedule de negocio externo y pegamento entre sistemas

El anti-patrón es dos orquestadores para el mismo grafo sin línea de ownership. Entonces debugueas dos veces.

---

## Un mapeo práctico

| Tipo de pipeline | Inclínate a |
| --- | --- |
| Transforms nocturnos de warehouse + extracts SaaS | Airflow |
| Entrenamiento ML multi-paso en nodos GPU | Argo Workflows |
| Batch tipo CI (build → test → scan → publish) en K8s | Argo Workflows |
| Pegamento multi-cloud con muchos operators | Airflow |
| DAGs cortos, event-ish, 100% contenedor | Argo Workflows |
| Backfills pesados de años de particiones | Airflow |

Las opciones gestionadas cambian la matemática de ops (MWAA, Cloud Composer, Astro y varios instaladores de Argo), no el modelo mental. Airflow gestionado sigue pensando en DAGs y providers. Argo empaquetado o gestionado sigue pensando en pods y CRDs.

---

## Notas de implementación que la gente se salta

**Airflow**

* Mantén los DAGs finos: empuja el trabajo pesado a warehouses, Spark o contenedores; no corras bucles de CPU de 40 minutos en un PythonOperator.
* Trata la DB de metadatos como datos de producción. Backup. Vigila connection counts.
* Prefiere pools y SLAs explícitos para capacidad compartida de workers.

**Argo Workflows**

* Estandariza imágenes base y entrypoints o te ahogas en contenedores one-off.
* Usa repositorios de artifacts a propósito (S3/GCS/MinIO). "logs en el pod" no es un contrato de datos.
* Genera YAML desde código si los humanos no pueden revisar specs de workflow de 2.000 líneas.

**Ambos**

* Secretos en un secret store de verdad. Ninguno perdona plaintext eterno en DAGs o ConfigMaps.
* Define ownership: a quién despiertan cuando el pipeline de las 3am falla el dashboard.

---

## Conclusión

Airflow y Argo Workflows resuelven el mismo titular (correr un grafo de pasos con fiabilidad) con campos base distintos.

* Elige **Airflow** cuando el grafo cruza sistemas y los autores piensan en Python y tiempo de datos.
* Elige **Argo Workflows** cuando el grafo es container-native y los autores ya operan Kubernetes como runtime.
* No elijas por moda de blog post. Elige por dónde corre el trabajo, quién escribe los pipelines y qué control plane estás dispuesto a mantener sano a las 3am.

Si el cluster es joven y el data stack es ancho, empieza con Airflow. Si cada job ya es un contenedor y el warehouse es solo otro cliente API en un pod, Argo Workflows se sentirá menos falso.
