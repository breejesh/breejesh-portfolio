---
title: "Docker Compose para desarrollo local lo bastante cerca de producción"
description: "Arma un stack de Compose con servicios, volúmenes, env y healthchecks para que los fallos locales se parezcan a los de prod, no a bugs raros del portátil."
date: "2026-07-05"
tags: [Cloud y DevOps]
coverImage: /assets/images/docker-compose-local-dev.webp
previewImage: /assets/images/docker-compose-local-dev.webp
---


"En mi máquina funciona" suele significar que el portátil no ejecuta el mismo grafo de procesos que producción. Otra versión de Postgres. Sin Redis. La API arranca antes de que la base acepte conexiones. Variables de entorno en el perfil del shell que CI nunca ve.

**Docker Compose** no hará que local sea idéntico a Kubernetes o ECS. Sí puede acercarse lo bastante para que el orden de arranque, la config y la salud de dependencias se comporten igual en cada máquina de desarrollo y en la mayoría de jobs de CI. Lo bastante cerca es el objetivo.

---

## Qué significa "lo bastante cerca"

No necesitas réplicas de producción, service meshes ni red multi-AZ en un portátil. Necesitas:

1. **El mismo conjunto de servicios** para la ruta que realmente ejercitas (API, DB, caché, worker, quizá un catcher de correo).
2. **Las mismas major versions** de deps con estado (Postgres 16 en local si prod es 16).
3. **Config inyectada del mismo modo** (archivos env / `environment` de compose, no exports mágicos del shell).
4. **Arranque que espera readiness**, no solo el start del contenedor.
5. **Datos que sobreviven reinicios** cuando quieres, y un wipe limpio cuando no.

Si esas cinco se cumplen, la mayoría de bugs de "solo falla en staging" aparecen el primer día.

---

## Un esbozo práctico de Compose

Stack mínimo API + Postgres + Redis. Ajusta los tags de imagen a lo que corres en prod.

```yaml
# docker-compose.yml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: development   # multi-stage: keep a thin prod stage for real deploys
    ports:
      - "8080:8080"
    env_file:
      - .env.example
      - .env.local          # gitignored; overrides example
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app
      REDIS_URL: redis://redis:6379/0
      APP_ENV: local
    volumes:
      - ./src:/app/src:cached
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 20s

  db:
    image: postgres:16.4-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    ports:
      - "5432:5432"        # optional: host tools / GUI clients
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 2s
      retries: 10

volumes:
  pgdata:
```

Ejecución:

```bash
docker compose up --build
# or detached:
docker compose up -d --build
```

El nombre del proyecto Compose por defecto es el del directorio. Fíjalo con `name:` arriba del archivo o con `COMPOSE_PROJECT_NAME` si varias copias del repo comparten máquina.

---

## Servicios: modela el grafo real, no cada réplica

Lista los **roles** que producción tiene en la ruta de request que te importa. Un contenedor de API basta en local aunque prod lleve ocho réplicas. Un Postgres basta. Un Redis basta.

Lo que suele ir en Compose:

* Proceso de app (o procesos: API + worker + scheduler si son binarios separados).
* Datastore principal.
* Caché / broker de cola que el código llama de verdad.
* Sidecars de los que dependes para corrección (stub de OpenTelemetry collector, MinIO para APIs con forma de S3, Mailpit para SMTP).

Lo que suele **no** ir:

* Service mesh completo.
* Load balancers de prod.
* Backends de observabilidad que no consultas en el día a día (añádelos después con un override opcional).

Separa tooling opcional en un segundo archivo para que el stack por defecto siga siendo rápido:

```bash
docker compose -f docker-compose.yml -f docker-compose.tools.yml up
```

---

## Volúmenes: hot-reload de código vs datos duraderos

Dos trabajos distintos:

| Tipo de volumen | Uso | ¿Sobrevive a `compose down`? |
|---|---|---|
| Bind mount (`./src:/app/src`) | Editar código en vivo sin rebuild | N/A (archivos del host) |
| Named volume (`pgdata:`) | Ficheros de base, cachés | Sí (hasta `down -v`) |
| Anonymous volume | Casi nunca a propósito | Fácil de perder de vista |

**Bind mounts** para el source, no para `node_modules` ni output compilado si el SO del contenedor difiere del host. Montar el `node_modules` del host en contenedores Linux es una fuente clásica de módulos nativos rotos.

**Named volumes** para datos de Postgres/MySQL/Mongo. Sin ellos, cada `down` + recreate pierde el estado local. Con ellos se acumula drift de esquema, así que documenta un wipe:

```bash
docker compose down -v   # removes named volumes declared in this project
```

Los scripts de init en `/docker-entrypoint-initdb.d` corren **solo con un data directory vacío la primera vez**. Cambiar un SQL de init no lo re-ejecuta sobre un volumen existente. Las migraciones van en la app (o en un servicio `migrate` de un solo shot), no solo en init scripts.

---

## Entorno: una sola historia para local, CI y forma de prod

Mal patrón: secretos y URLs solo en tu shell, el README dice "exporta estas doce variables", y media equipo tiene valores viejos.

Mejor patrón:

1. **`.env.example`** en el repo: claves, valores dummy, comentarios de required vs optional.
2. **`.env.local`** (o `.env`) en gitignore: overrides locales reales.
3. **`environment:` de Compose** para valores fijos por la topología de red (hostname `db`, URLs internas).
4. **Nunca** commits de credenciales de producción en archivos compose.

Compose carga automáticamente un `.env` del proyecto para **sustitución de variables** en el YAML (`${POSTGRES_PASSWORD}`). Eso es distinto de `env_file:` en un servicio, que inyecta vars **dentro del contenedor**. Confundirlos es una causa habitual de "la var está vacía en el proceso pero puesta en el host."

```yaml
# substitution in compose (host-side .env)
services:
  db:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-app}
```

```yaml
# injection into the container
services:
  api:
    env_file:
      - .env.local
```

Mantén **hostnames como nombres de servicio** dentro de la red (`db`, `redis`), no `localhost`. Dentro de un contenedor, `localhost` es el propio contenedor. Desde el navegador del host o `psql` en tu Mac, `localhost:5432` solo funciona por el mapeo de `ports:`.

---

## Healthchecks y depends_on: espera ready, no started

`depends_on` sin condición solo espera a que el contenedor dependencia **arranque**. Postgres puede seguir en init. Tu API hará crash-loop con `connection refused` y a veces se recuperará ocultando la carrera.

Estilo Compose v2:

```yaml
depends_on:
  db:
    condition: service_healthy
```

Solo funciona si `db` define un `healthcheck` real. Prefiere la sonda de readiness de la base (`pg_isready`, `mysqladmin ping`, Redis `PING`) frente a un `exit 0` genérico.

Para la API, un `/health` que comprueba **proceso arriba** sirve a orquestadores. Un `/ready` que también pingea DB/Redis es mejor si quieres que compose (o k8s después) no dé tráfico hasta que las deps respondan. El comando del healthcheck debe existir en la imagen (`curl`, `wget`, o un binario mínimo en el stage de dev).

`start_period` da tiempo a arrancar antes de contar fallos. Sin él, JVMs lentas y migraciones en frío parecen "unhealthy" y flaky.

---

## Errores habituales (y el arreglo)

### 1. `localhost` dentro de contenedores

**Síntoma:** la API no llega a Postgres aunque `psql` funcione en el host.  
**Arreglo:** nombres DNS de servicio en la red Compose; reserva `localhost` para herramientas del host.

### 2. Sin healthcheck, solo `depends_on`

**Síntoma:** fallos de boot intermitentes, peores en máquinas lentas y en CI.  
**Arreglo:** `service_healthy` + comando real de readiness.

### 3. Bind-mount de casi todo

**Síntoma:** errores de permisos, binarios de otra arch, `node_modules` del host sucios.  
**Arreglo:** monta solo source; instala deps en la imagen o en un named volume para módulos del contenedor.

### 4. Imagen de prod para el día a día

**Síntoma:** 2 minutos de rebuild por un cambio de una línea.  
**Arreglo:** Dockerfile multi-stage con target `development` (hot reload, debug) y un stage `production` fino para CI/CD. Compose construye `target: development`; el pipeline de deploy construye el stage final.

### 5. Versiones divergentes

**Síntoma:** SQL ok en local con Postgres 14, falla en prod 16 (o al revés).  
**Arreglo:** fija la misma major (idealmente minor) que producción en `image:`.

### 6. Secretos en compose commiteados

**Síntoma:** filtración de credenciales en el historial de PRs.  
**Arreglo:** placeholders en git, valores reales en env gitignored o un secret manager; rota si alguna vez se filtró.

### 7. Un compose gigante para todo

**Síntoma:** 4 GB de RAM para un cambio de frontend.  
**Arreglo:** archivo por defecto para la ruta core; `docker-compose.override.yml` (auto-merged en local) o overrides `-f` explícitos para profilers, workers extra y observabilidad.

### 8. Ignorar exit codes en CI

**Síntoma:** pipeline verde mientras un servicio de `compose up` quedó caído.  
**Arreglo:** `docker compose up --wait` (espera healthy), o tests con `compose run --rm api pytest` para que el status del comando sea el del job.

```bash
docker compose up -d --build --wait
docker compose exec api npm test
docker compose down -v
```

---

## Override para ajustes locales personales

Commitea `docker-compose.yml` como baseline compartido. Los devs pueden añadir `docker-compose.override.yml` (gitignore si es personal) para conflictos de puertos, mounts extra o puertos de debug del IDE. Compose lo fusiona solo cuando ambos existen en el directorio del proyecto.

Stacks opcionales de equipo van explícitos:

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml up
```

---

## Acercarse a prod sin traer prod al portátil

| Preocupación | Compose local | Producción |
|---|---|---|
| Grafo de procesos | Mismos roles | Mismos roles, más réplicas |
| Imágenes | Target dev o misma base runtime | Imagen final multi-stage |
| Config | env files + `environment` de compose | Secrets manager / env de plataforma |
| Red | DNS de Compose (`db`) | Service discovery / mesh |
| Readiness | Healthchecks de Compose | Probes k8s / health de ALB |
| Datos | Named volumes, seeds | DB gestionada, migraciones en pipeline |

La ganancia son **semánticas** compartidas: mismas claves de env, mismo orden de dependencias, mismo significado de healthy. La plataforma de debajo puede diferir.

---

## Un flujo local corto que se sostiene

```bash
cp .env.example .env.local   # once
docker compose up --build    # daily
# run migrations if not automatic:
docker compose exec api npm run migrate
# tests against the stack:
docker compose exec api npm test
# clean slate:
docker compose down -v
```

Documenta esa secuencia en el README del repo en menos de quince líneas. Si el onboarding necesita una wiki y una checklist tribal, el compose no está haciendo suficiente trabajo.

---

## Cierre

Compose no sustituye un orquestador de producción. Es la forma más barata de que cada portátil ejecute el mismo grafo de servicios con las mismas reglas de readiness. Fija versiones, inyecta config de forma explícita, espera healthchecks y trata los volúmenes a propósito.

Haz eso, y "en mi máquina funciona" empieza a significar "funciona en el stack local compartido," mucho más cerca de staging que un proceso suelto y un Postgres del sistema.

