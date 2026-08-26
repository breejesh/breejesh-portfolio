---
title: "Docker Compose for Local Dev That Matches Production Closely Enough"
description: "Shape a Compose stack with services, volumes, env files, and healthchecks so local failures look like prod failures, not random laptop bugs."
date: "2026-07-05"
tags: [Cloud & DevOps]
coverImage: /assets/images/docker-compose-local-dev.webp
previewImage: /assets/images/docker-compose-local-dev.webp
---

"Works on my machine" usually means a local laptop is not running the same process graph as production. Different database versions, missing caches, and unpinned dependencies create subtle bugs. Different Postgres version. No Redis. API process starts before the database accepts connections. Env vars set in a shell profile that CI never sees.

**Docker Compose** will not make local identical to Kubernetes or ECS. It can get close enough that startup order, config, and dependency health behave the same way on every developer machine and in most CI jobs. Close enough is the goal.

---

## What "close enough" means

You do not need production replicas, service meshes, or multi-AZ networking on a laptop. You need:

1. **Same service set** for the path you actually exercise (API, DB, cache, worker, maybe a mail catcher).
2. **Same major versions** of stateful deps (Postgres 16 locally if prod is 16).
3. **Config injected the same way** (env files / compose `environment`, not magic shell exports).
4. **Startup that waits for readiness**, not only container start.
5. **Data that survives restarts** when you want it, and a clean wipe when you do not.

If those five hold, most "it only fails in staging" bugs show up on day one.

---

## A practical Compose sketch

Minimal API + Postgres + Redis stack. Adjust image tags to match what you run in prod.

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

Run it:

```bash
docker compose up --build
# or detached:
docker compose up -d --build
```

Compose project name defaults to the directory name. Pin it with `name:` at the top of the file or `COMPOSE_PROJECT_NAME` if multiple checkouts share a machine.

---

## Services: model the real graph, not every replica

List the **roles** production has on the request path you care about. One API container is fine locally even if prod runs eight replicas. One Postgres is fine. One Redis is fine.

Things that usually belong in Compose:

* App process (or processes: API + worker + scheduler if they are separate binaries).
* Primary datastore.
* Cache / queue broker you actually call in code.
* Sidecars you depend on for correctness (OpenTelemetry collector stub, MinIO for S3-shaped APIs, Mailpit for SMTP).

Things that usually do **not**:

* Full service mesh.
* Prod load balancers.
* Observability backends you never query during feature work (add them later with an optional override file).

Split optional tooling into a second file so the default stack stays fast:

```bash
docker compose -f docker-compose.yml -f docker-compose.tools.yml up
```

---

## Volumes: code hot-reload vs durable data

Two different jobs:

| Volume type | Use | Survives `compose down`? |
|---|---|---|
| Bind mount (`./src:/app/src`) | Live code edit without rebuild | N/A (host files) |
| Named volume (`pgdata:`) | Database files, caches | Yes (until `down -v`) |
| Anonymous volume | Rarely intentional | Easy to lose track of |

**Bind mounts** for source, not for `node_modules` or compiled output if the container OS differs from the host. Mounting host `node_modules` into Linux containers is a classic source of broken native modules.

**Named volumes** for Postgres/MySQL/Mongo data. Without them, every `down` + recreate loses local state. With them, schema drift accumulates, so keep a documented wipe path:

```bash
docker compose down -v   # removes named volumes declared in this project
```

Init scripts under `/docker-entrypoint-initdb.d` run **only on first empty data directory**. Changing an init SQL file will not re-run it on an existing volume. Migrations belong in the app (or a one-shot `migrate` service), not only in init scripts.

---

## Environment: one story for local, CI, and prod shape

Bad pattern: secrets and URLs only in your shell, README says "export these twelve variables", and half the team has stale values.

Better pattern:

1. **`.env.example`** committed: keys, dummy values, comments on required vs optional.
2. **`.env.local`** (or `.env`) gitignored: real local overrides.
3. **Compose `environment:`** for values that are fixed by the network topology (`db` hostname, internal URLs).
4. **Never** commit production credentials into compose files.

Compose automatically loads a project `.env` for **variable substitution** in the YAML (`${POSTGRES_PASSWORD}`). That is separate from `env_file:` on a service, which injects vars **into the container**. Mixing them up is a frequent source of "var is empty in the process but set on my host."

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

Keep **hostnames as service names** inside the network (`db`, `redis`), not `localhost`. Inside a container, `localhost` is the container itself. From the host browser or `psql` on your Mac, `localhost:5432` works only because of the published `ports:` mapping.

---

## Healthchecks and depends_on: wait for ready, not started

`depends_on` without a condition only waits for the dependency **container to start**. Postgres can still be running init. Your API will crash-loop on `connection refused`, then sometimes recover and hide the race.

Compose v2 style:

```yaml
depends_on:
  db:
    condition: service_healthy
```

That only works if `db` defines a real `healthcheck`. Prefer the database's own readiness probe (`pg_isready`, `mysqladmin ping`, Redis `PING`) over a generic `exit 0`.

For the API, a `/health` that checks **process up** is fine for orchestrators. A `/ready` that also pings DB/Redis is better when you want compose (or k8s later) to withhold traffic until deps answer. Keep the healthcheck command available in the image (`curl`, `wget`, or a tiny binary you install in the dev stage).

`start_period` gives the process time to boot before failures count. Without it, slow JVMs and cold migrations look "unhealthy" and flaky.

---

## Common mistakes (and the fix)

### 1. `localhost` inside containers

**Symptom:** API cannot reach Postgres even though `psql` works on the host.  
**Fix:** use service DNS names on the Compose network; reserve `localhost` for host-side tools.

### 2. No healthcheck, only `depends_on`

**Symptom:** intermittent boot failures, worse on slower machines and CI.  
**Fix:** `service_healthy` + real readiness command.

### 3. Bind-mounting everything

**Symptom:** permission errors, wrong arch binaries, dirty host `node_modules`.  
**Fix:** mount source only; install deps inside the image or a named volume dedicated to container modules.

### 4. Prod image for daily coding

**Symptom:** 2 minute rebuild for a one-line change.  
**Fix:** multi-stage Dockerfile with a `development` target (hot reload, debug tools) and a slim `production` target used by CI/CD. Compose builds `target: development`; deploy pipelines build the final stage.

### 5. Divergent versions

**Symptom:** SQL works locally on Postgres 14, fails on prod 16 (or the reverse).  
**Fix:** pin the same major (ideally minor) as production in `image:`.

### 6. Secrets in compose committed to git

**Symptom:** credential leak in PR history.  
**Fix:** placeholders in git, real values in gitignored env files or a secret manager; rotate if it ever leaked.

### 7. One giant compose for every concern

**Symptom:** 4 GB RAM for a frontend tweak.  
**Fix:** default file for the core path; `docker-compose.override.yml` (auto-merged locally) or explicit `-f` overrides for profilers, extra workers, and observability.

### 8. Ignoring exit codes in CI

**Symptom:** green pipeline while `compose up` left a crashed service.  
**Fix:** `docker compose up --wait` (waits on healthy), or run tests with `compose run --rm api pytest` so the command status is the job status.

```bash
docker compose up -d --build --wait
docker compose exec api npm test
docker compose down -v
```

---

## Override file for personal local tweaks

Commit `docker-compose.yml` as the shared baseline. Developers can add `docker-compose.override.yml` (gitignored if it is personal) for port conflicts, extra volume mounts, or IDE debug ports. Compose merges it automatically when both files exist in the project directory.

Team-wide optional stacks stay explicit:

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml up
```

---

## Matching prod without shipping prod to the laptop

| Concern | Local Compose | Production |
|---|---|---|
| Process graph | Same roles | Same roles, more replicas |
| Images | Dev target or same runtime base | Multi-stage final image |
| Config | env files + compose `environment` | Secrets manager / platform env |
| Networking | Compose DNS (`db`) | Service discovery / mesh |
| Readiness | Compose healthchecks | k8s probes / ALB health |
| Data | Named volumes, seed scripts | Managed DB, migrations in pipeline |

The win is shared **semantics**: same env keys, same dependency order, same health meaning. The platform underneath can differ.

---

## A short local workflow that sticks

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

Document that sequence in the repo README in under fifteen lines. If onboarding needs a wiki page and a tribal checklist, the compose file is not doing enough of the work.

---

## Closing

Compose is not a production orchestrator substitute. It is the cheapest way to make every laptop run the same service graph with the same readiness rules. Pin versions, inject config explicitly, wait on healthchecks, and keep volumes intentional.

Do that, and "works on my machine" starts meaning "works on the shared local stack," which is much closer to staging than a bare process and a system Postgres install.
