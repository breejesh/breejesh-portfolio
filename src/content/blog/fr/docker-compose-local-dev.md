---
title: "Docker Compose en local, assez proche de la production"
description: "Construire un stack Compose avec services, volumes, fichiers env et healthchecks pour que les pannes locales ressemblent à la prod, pas à des bugs de laptop."
date: "2026-07-05"
tags: [Cloud et DevOps]
coverImage: /assets/images/docker-compose-local-dev.webp
previewImage: /assets/images/docker-compose-local-dev.webp
---


"Ça marche sur ma machine" veut souvent dire que le laptop n'exécute pas le même graphe de processus que la production. Autre version de Postgres. Pas de Redis. L'API démarre avant que la base accepte des connexions. Des variables d'env dans un profil shell que la CI ne voit jamais.

**Docker Compose** ne rendra pas le local identique à Kubernetes ou ECS. Il peut s'en rapprocher assez pour que l'ordre de démarrage, la config et la santé des dépendances se comportent de la même façon sur chaque machine de dev et dans la plupart des jobs CI. Assez proche, c'est l'objectif.

---

## Ce que signifie "assez proche"

Pas besoin de réplicas de production, de service mesh ni de réseau multi-AZ sur un laptop. Il faut :

1. **Le même jeu de services** pour le chemin que vous exercez vraiment (API, DB, cache, worker, peut-être un catcher mail).
2. **Les mêmes major versions** des deps stateful (Postgres 16 en local si la prod est en 16).
3. **Une config injectée de la même façon** (fichiers env / `environment` Compose, pas d'exports magiques du shell).
4. **Un démarrage qui attend la readiness**, pas seulement le start du conteneur.
5. **Des données qui survivent aux redémarrages** quand vous le voulez, et un wipe propre quand vous ne le voulez pas.

Si ces cinq points tiennent, la plupart des bugs "ça ne casse qu'en staging" apparaissent le premier jour.

---

## Un schéma Compose pragmatique

Stack minimal API + Postgres + Redis. Alignez les tags d'image sur la prod.

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

Lancement :

```bash
docker compose up --build
# or detached:
docker compose up -d --build
```

Le nom de projet Compose vaut par défaut le nom du répertoire. Fixez-le avec `name:` en tête de fichier ou `COMPOSE_PROJECT_NAME` si plusieurs checkouts partagent la machine.

---

## Services : le vrai graphe, pas chaque réplica

Listez les **rôles** que la prod a sur le chemin de requête qui compte. Un conteneur API suffit en local même si la prod en a huit. Un Postgres suffit. Un Redis suffit.

Ce qui va en général dans Compose :

* Processus applicatif (ou processus : API + worker + scheduler s'ils sont des binaires séparés).
* Datastore principal.
* Cache / broker de file que le code appelle vraiment.
* Sidecars dont vous dépendez pour la correction (stub OpenTelemetry collector, MinIO pour des API façon S3, Mailpit pour SMTP).

Ce qui n'y va en général **pas** :

* Service mesh complet.
* Load balancers de prod.
* Backends d'observabilité que vous ne consultez pas au quotidien (ajoutez-les plus tard avec un override optionnel).

Séparez le tooling optionnel dans un second fichier pour garder le stack par défaut rapide :

```bash
docker compose -f docker-compose.yml -f docker-compose.tools.yml up
```

---

## Volumes : hot-reload du code vs données durables

Deux jobs distincts :

| Type de volume | Usage | Survivit à `compose down` ? |
|---|---|---|
| Bind mount (`./src:/app/src`) | Éditer le code sans rebuild | N/A (fichiers host) |
| Named volume (`pgdata:`) | Fichiers DB, caches | Oui (jusqu'à `down -v`) |
| Anonymous volume | Rarement volontaire | Facile à perdre de vue |

**Bind mounts** pour le source, pas pour `node_modules` ni le build output si l'OS du conteneur diffère de l'host. Monter le `node_modules` de l'host dans des conteneurs Linux casse souvent les modules natifs.

**Named volumes** pour les données Postgres/MySQL/Mongo. Sans eux, chaque `down` + recreate perd l'état local. Avec eux, le schema drift s'accumule : documentez un wipe :

```bash
docker compose down -v   # removes named volumes declared in this project
```

Les scripts d'init sous `/docker-entrypoint-initdb.d` ne tournent **que sur un data directory vide, la première fois**. Modifier un SQL d'init ne le relance pas sur un volume existant. Les migrations vivent dans l'app (ou un service `migrate` one-shot), pas seulement dans les init scripts.

---

## Environnement : une seule histoire pour local, CI et forme prod

Mauvais pattern : secrets et URLs uniquement dans votre shell, le README dit "exportez ces douze variables", et la moitié de l'équipe a des valeurs périmées.

Meilleur pattern :

1. **`.env.example`** commité : clés, valeurs dummy, commentaires required vs optional.
2. **`.env.local`** (ou `.env`) en gitignore : vrais overrides locaux.
3. **`environment:` Compose** pour les valeurs fixées par la topologie réseau (hostname `db`, URLs internes).
4. **Jamais** de credentials de production dans les fichiers compose versionnés.

Compose charge automatiquement un `.env` du projet pour la **substitution de variables** dans le YAML (`${POSTGRES_PASSWORD}`). C'est distinct de `env_file:` sur un service, qui injecte des vars **dans le conteneur**. Les confondre donne souvent "la var est vide dans le process mais définie sur l'host."

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

Gardez les **hostnames = noms de service** dans le réseau (`db`, `redis`), pas `localhost`. Dans un conteneur, `localhost` est le conteneur lui-même. Depuis le navigateur de l'host ou `psql` sur votre Mac, `localhost:5432` ne marche que grâce au mapping `ports:`.

---

## Healthchecks et depends_on : attendre ready, pas started

`depends_on` sans condition attend seulement que le conteneur dépendance **démarre**. Postgres peut encore être en init. Votre API fait un crash-loop sur `connection refused`, puis parfois se rétablit et masque la course.

Style Compose v2 :

```yaml
depends_on:
  db:
    condition: service_healthy
```

Ça ne marche que si `db` définit un vrai `healthcheck`. Préférez la sonde de readiness de la base (`pg_isready`, `mysqladmin ping`, Redis `PING`) à un `exit 0` générique.

Pour l'API, un `/health` qui vérifie **processus up** convient aux orchestrateurs. Un `/ready` qui ping aussi DB/Redis est mieux si vous voulez que Compose (ou k8s plus tard) retienne le trafic tant que les deps ne répondent pas. La commande du healthcheck doit exister dans l'image (`curl`, `wget`, ou un petit binaire installé dans le stage dev).

`start_period` laisse le process booter avant de compter les échecs. Sans lui, les JVM lentes et les migrations à froid paraissent "unhealthy" et flaky.

---

## Erreurs fréquentes (et le correctif)

### 1. `localhost` dans les conteneurs

**Symptôme :** l'API n'atteint pas Postgres alors que `psql` marche sur l'host.  
**Correctif :** noms DNS des services sur le réseau Compose ; réservez `localhost` aux outils host.

### 2. Pas de healthcheck, seulement `depends_on`

**Symptôme :** boot intermittent, pire sur machines lentes et en CI.  
**Correctif :** `service_healthy` + vraie commande de readiness.

### 3. Bind-mount de tout

**Symptôme :** permissions, binaires d'une autre arch, `node_modules` host sales.  
**Correctif :** monter seulement le source ; installer les deps dans l'image ou un named volume dédié aux modules du conteneur.

### 4. Image prod pour le code du quotidien

**Symptôme :** 2 minutes de rebuild pour une ligne.  
**Correctif :** Dockerfile multi-stage avec target `development` (hot reload, debug) et un stage `production` mince pour la CI/CD. Compose build `target: development` ; le pipeline de deploy build le stage final.

### 5. Versions divergentes

**Symptôme :** SQL ok en local sur Postgres 14, casse en prod 16 (ou l'inverse).  
**Correctif :** piner la même major (idéalement minor) que la prod dans `image:`.

### 6. Secrets compose commités dans git

**Symptôme :** fuite de credentials dans l'historique des PR.  
**Correctif :** placeholders dans git, vraies valeurs dans des env gitignorés ou un secret manager ; rotation si fuite passée.

### 7. Un compose monstrueux pour tout

**Symptôme :** 4 Go de RAM pour un tweak frontend.  
**Correctif :** fichier par défaut pour le chemin core ; `docker-compose.override.yml` (fusion auto en local) ou overrides `-f` explicites pour profilers, workers en plus et observabilité.

### 8. Ignorer les exit codes en CI

**Symptôme :** pipeline vert alors qu'un service de `compose up` a crashé.  
**Correctif :** `docker compose up --wait` (attend healthy), ou tests via `compose run --rm api pytest` pour que le status de la commande soit celui du job.

```bash
docker compose up -d --build --wait
docker compose exec api npm test
docker compose down -v
```

---

## Override pour les tweaks locaux personnels

Commitez `docker-compose.yml` comme baseline partagée. Les devs peuvent ajouter `docker-compose.override.yml` (gitignore s'il est personnel) pour conflits de ports, mounts en plus ou ports de debug IDE. Compose le fusionne automatiquement si les deux fichiers sont dans le répertoire du projet.

Les stacks optionnels d'équipe restent explicites :

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml up
```

---

## Se rapprocher de la prod sans l'embarquer sur le laptop

| Sujet | Compose local | Production |
|---|---|---|
| Graphe de process | Mêmes rôles | Mêmes rôles, plus de réplicas |
| Images | Target dev ou même base runtime | Image finale multi-stage |
| Config | fichiers env + `environment` Compose | Secrets manager / env plateforme |
| Réseau | DNS Compose (`db`) | Service discovery / mesh |
| Readiness | Healthchecks Compose | Probes k8s / health ALB |
| Données | Named volumes, seeds | DB managée, migrations pipeline |

Le gain, ce sont des **sémantiques** partagées : mêmes clés d'env, même ordre de dépendances, même sens de healthy. La plateforme en dessous peut différer.

---

## Un workflow local court qui tient

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

Documentez cette séquence dans le README du repo en moins de quinze lignes. Si l'onboarding a besoin d'un wiki et d'une checklist tribale, le fichier compose ne fait pas assez le travail.

---

## Pour finir

Compose ne remplace pas un orchestrateur de production. C'est le moyen le moins cher de faire tourner sur chaque laptop le même graphe de services avec les mêmes règles de readiness. Piner les versions, injecter la config explicitement, attendre les healthchecks, traiter les volumes avec intention.

Faites ça, et "ça marche sur ma machine" commence à vouloir dire "ça marche sur le stack local partagé," bien plus proche du staging qu'un process nu et un Postgres système.

