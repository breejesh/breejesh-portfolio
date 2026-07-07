---
title: "GitHub Actions CI desde cero"
description: "Workflows, jobs, caché, secrets, builds matrix y los errores que hacen perder horas la primera vez que montas CI en GitHub."
date: "2026-07-07"
tags: [DevOps]
coverImage: /assets/images/github-actions-ci-from-scratch.webp
previewImage: /assets/images/github-actions-ci-from-scratch.webp
---

GitHub Actions es CI que vive junto al código. Dejas YAML en `.github/workflows/`, haces push, y los runners ejecutan jobs en los eventos que elijas: pull request, push a `main`, un schedule o un clic manual.

Este post es el modelo mental mínimo más las piezas que sí aparecen en pipelines de producción: **workflows, jobs, steps, caché, secrets, matrix builds**, y los fallos que hacen mentir a los checks verdes o alargan cada run a 12 minutos.

Sin tour del marketplace. Sin lista de "usa todas las features". Un camino de CI que puedas copiar y endurecer.

---

## Qué estás configurando de verdad

Tres capas:

| Capa | Qué es | Archivo / sitio |
| --- | --- | --- |
| **Workflow** | Pipeline con nombre disparado por eventos | `.github/workflows/*.yml` |
| **Job** | Unidad de trabajo en un runner (VM o contenedor) | `jobs.<id>:` |
| **Step** | Comando shell o una Action reutilizable | bajo `steps:` |

Un workflow puede ejecutar varios jobs. Los jobs van en paralelo o esperan con `needs`. Los steps de un job siempre van en orden en la misma máquina, así que los posteriores ven archivos y env de los anteriores.

Por eso la gente pone "checkout, luego install, luego test" en un solo job y no en tres jobs que arrancan en frío cada uno.

---

## El workflow útil más pequeño

Crea `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm

      - name: Install
        run: npm ci

      - name: Test
        run: npm test
```

Qué hace:

1. Corre en cada PR y en cada push a `main`.
2. Levanta un runner Ubuntu nuevo.
3. Hace checkout del repo en el commit bajo prueba.
4. Instala Node 20 y restaura caché de npm cuando puede.
5. Instala deps con `npm ci` (estricto con el lockfile) y corre tests.

Si el step de test sale distinto de cero, el job falla y el check del PR falla. Ese es el contrato completo.

---

## Triggers: `on` sin ruido

Eventos habituales:

```yaml
on:
  pull_request:
    paths:
      - "src/**"
      - "package-lock.json"
      - ".github/workflows/ci.yml"
  push:
    branches: [main]
  workflow_dispatch:   # "Run workflow" manual en la UI
  schedule:
    - cron: "0 6 * * 1"  # lunes 06:00 UTC
```

Notas que evitan re-runs inútiles:

* Los **filtros `paths`** saltan el workflow cuando el cambio es solo docs (o lo que excluyas). Globs mal puestos son una respuesta clásica a "¿por qué no corrió el CI?"
* **`workflow_dispatch`** sirve para re-ejecutar tras arreglar secrets sin un commit basura.
* **`schedule`** solo corre en la rama por defecto, y GitHub puede retrasar cron de baja prioridad con carga. No uses solo cron para "tiene que correr antes de cada release."
* Los PR de forks tienen acceso limitado a secrets. Es intencional. Trátalo como frontera de seguridad, no como bug.

---

## Jobs, runners y `needs`

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
```

`needs: lint` hace que `test` espere a que `lint` tenga éxito. Si `lint` falla, `test` y `build` se saltan (salvo `if:` que diga lo contrario).

Cada job es una **máquina nueva**. No hay filesystem compartido entre `lint` y `test` salvo que pases **artifacts** o reinstales. Por eso grafos multi-job ingenuos reinstalan deps tres veces.

Cuándo partir jobs:

* Distinto OS o versiones de lenguaje (matrix).
* Suites lentas e independientes que quieres en paralelo.
* Un job de deploy que no debe correr hasta que pasen tests y necesita secrets extra.

Cuándo dejar un solo job:

* Repos pequeños donde el install domina el wall-clock.
* Steps que comparten caché local en disco (node_modules, target/, .venv).

---

## Steps: `run` vs `uses`

* **`run:`** shell en el runner. En Linux por defecto es bash. Úsalo para scripts del proyecto en los que ya confías.
* **`uses:`** una Action publicada (o local `./.github/actions/...`). Prefiere **pins de versión** (`@v4` o un SHA completo en rutas de alto riesgo).

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Run unit tests
    run: |
      set -euo pipefail
      npm ci
      npm test -- --coverage
```

`actions/checkout` casi siempre es el primer step. Sin él, el runner tiene un workspace vacío.

Para Actions de terceros que tocan secrets o credenciales de deploy, pin al SHA del commit y revisa el código de la Action. Las tags se pueden mover.

---

## Caché de dependencias

La caché evita pagar el install completo en cada run. Prefiere la caché integrada en las setup Actions cuando exista:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: "20"
    cache: npm          # usa package-lock.json como semilla de la key

- uses: actions/setup-python@v5
  with:
    python-version: "3.12"
    cache: pip          # requirements.txt / pyproject según config

- uses: actions/setup-go@v5
  with:
    go-version: "1.22"
    cache: true
```

Caché manual cuando haga falta:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

Reglas prácticas:

* **La key debe cambiar cuando cambia el lockfile.** Keys viejas instalan el árbol incorrecto o se saltan updates necesarios.
* **La caché es best-effort.** Un miss es normal tras 7 días de inactividad o con key nueva. El job debe funcionar en frío.
* **No caches secrets ni outputs de build que no pondrías en un artifact de PR.** Caché es para deps y toolchains, no para "saltar tests si cacheamos el binario de anoche."
* **Restore-keys** son prefijos: un hit parcial restaura una caché más vieja y encima se apila. Acelera installs, pero puede tapar errores de lockfile si el install no es estricto.

Los artifacts son otra cosa: `actions/upload-artifact` / `download-artifact` pasan outputs entre jobs del **mismo** run del workflow. Caché cruza runs; artifacts viven dentro de un run (con la retención que configures).

---

## Secrets y variables de entorno

Los secrets del repo u org viven en la configuración de GitHub. Los workflows los leen así:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production   # opcional: reglas de protección, secrets por env
    steps:
      - uses: actions/checkout@v4

      - name: Deploy
        env:
          API_TOKEN: ${{ secrets.API_TOKEN }}
          APP_ENV: production
        run: ./scripts/deploy.sh
```

Reglas duras:

* **Nunca hagas echo de secrets** en los logs. GitHub enmascara valores de secret *conocidos*, no cada string derivado. Imprimir `API_TOKEN` en base64 o un substring puede filtrar.
* **No subas secrets** "solo para CI" al repo ni al YAML del workflow.
* **`pull_request` desde forks** no obtiene write secrets igual que `pull_request_target`. Prefiere `pull_request` para código no confiable. Solo usa `pull_request_target` si entiendes el modelo de checkout y privilegios; el mal uso es un footgun clásico de supply chain.
* **OIDC + roles cloud** (AWS, GCP, Azure) ganan a las keys de larga vida cuando puedes. Tokens de corta vida con `permissions` + federación dejan menos residuo permanente.
* Acota `permissions:` arriba del workflow o por job. Los derechos por defecto del token se han endurecido; aun así, declara lo que necesitas:

```yaml
permissions:
  contents: read
  pull-requests: write   # solo si un bot debe comentar
```

---

## Matrix builds

Matrix convierte una definición de job en muchos runs:

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: ["18", "20", "22"]
        exclude:
          - os: windows-latest
            node: "18"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test
```

Qué vigilar:

* **Coste y cola crecen con el producto** de dimensiones. Tres OS por cuatro versiones son doce jobs.
* **`fail-fast: true`** (por defecto) cancela hermanos cuando falla una celda. Pon `false` cuando quieras el mapa completo de fallos en un PR.
* **`include` / `exclude`** mantienen la rejilla honesta en lugar de listar cada combinación a mano.
* Diferencias de path y shell por OS aparecen aquí primero (`\` vs `/`, PowerShell vs bash). Prefiere scripts del proyecto que lo abstracten.

---

## Un ejemplo multi-lenguaje más cerrado

Servicio con front Node y tests Python:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
          cache-dependency-path: api/requirements.txt
      - run: pip install -r requirements.txt
      - run: pytest -q

  docker:
    runs-on: ubuntu-latest
    needs: [frontend, backend]
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t app:ci .
```

**`concurrency`** cancela un run anterior en progreso de la misma rama cuando vuelves a pushear. Controla minutos de Actions y la confusión de "¿cuál es el run más reciente?"

---

## Errores comunes (los caros)

### 1. Probar un commit distinto del que crees

Siempre haz checkout del head del PR para CI de PR no confiable. Un `ref` mal puesto en checkout (o `pull_request_target` con el merge ref a la ligera) puede ejecutar workflow de confianza contra código controlado por un atacante. `actions/checkout@v4` por defecto en `pull_request` es la base segura para la mayoría de equipos.

### 2. `npm install` en lugar de `npm ci` en CI

`npm install` puede reescribir el comportamiento del lockfile y desviarse de lo que instalaron los devs. CI debe usar la ruta estricta del lockfile (`npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable`, etc.).

### 3. Cachear `node_modules` a pelo

Funciona hasta que deja de funcionar (optional deps, addons nativos, sesgo de OS). Prefiere cachear el store del package manager e instalar limpio. El `cache: npm` de setup-node es el default aburrido y correcto para npm.

### 4. Secrets en steps `run: echo` de "debug"

Alguien deja `echo "token=$API_TOKEN"` "cinco minutos." Los logs viven más que el PR. Depura en local o asume que los logs son legibles para quien tenga el acceso de lectura del run.

### 5. Sin `concurrency`, deploys solapados sin fin

Dos pushes a `main` pueden desplegar fuera de orden. Usa grupos de concurrency en workflows de deploy, o un environment con reviewers / timers.

### 6. Explosión de matrix sin `fail-fast: false` al depurar

Ves una X roja, cancelas hermanos y te pierdes que Windows+Node 22 también estaba roto. Cambia `fail-fast` mientras estabilizas; vuelve a `true` cuando la suite sea confiable.

### 7. Confiar en tags `latest` para Actions críticas

`uses: some-org/some-action@main` puede cambiar un martes sin avisar. Pin al menos majors (`@v4`). Pin SHAs en deploy y release.

### 8. Olvidar required checks en ramas protegidas

El workflow existe, el PR se mergea con una X roja ignorada. Branch protection (o rulesets) debe **exigir** los nombres de job que te importan. Renombras un job sin actualizar el check requerido y los merges se liberan.

### 9. Sorpresa de permisos de GITHUB_TOKEN

Un step que abre un issue o pushea un tag falla con 403 tras un cambio de defaults. Pon `permissions` explícitas y un PAT o GitHub App solo cuando el token por defecto no baste.

### 10. Tests flaky culpando a Actions

Reintentar el workflow entero esconde bugs de producto. Arregla flakes o cuarentenalos con una lista explícita. "Re-run jobs" infinito no es estrategia de estabilidad.

---

## Expresiones, contexts e `if`

```yaml
- name: Publish
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: ./scripts/publish.sh
```

Contexts útiles: `github`, `env`, `secrets`, `matrix`, `needs`, `runner`, `steps`.

```yaml
- name: Upload coverage
  if: always() && steps.test.outcome == 'success'
  uses: actions/upload-artifact@v4
  with:
    name: coverage
    path: coverage/
```

`if: always()` corre aunque un step anterior fallara (sigue sujeto a cancelación del job). Úsalo con cuidado para cleanup o uploads que de verdad quieras en fallo.

---

## Iterar en local sin quemar minutos

* Corre los mismos scripts que Actions: `npm ci && npm test`. Si falla en local, fallará en CI.
* [Act](https://github.com/nektos/act) aproxima workflows con Docker. No es idéntico a runners hosted de GitHub (imágenes, software disponible, red).
* Usa `workflow_dispatch` con inputs para probar deploys a staging sin mergear.

```yaml
on:
  workflow_dispatch:
    inputs:
      target:
        description: "deploy target"
        required: true
        default: staging
```

---

## Checklist de un default sensato

Antes de dar CI por "listo":

1. Workflow en `pull_request` y `push` a la rama por defecto.
2. Installs estrictos con lockfile.
3. Setup Action del lenguaje con caché integrada.
4. `permissions: contents: read` explícito (añade más solo si hace falta).
5. `concurrency` en ramas de PR.
6. Required status checks en ramas protegidas con los **nombres exactos de job**.
7. Secrets solo vía `${{ secrets.* }}` / OIDC, nunca en git.
8. Majors pinneados en Actions de first-party; SHA en deploy.
9. Un camino documentado de "re-run / manual dispatch" para releases.
10. Presupuesto de tiempo: si install+test pasa de ~10 minutos, perfila antes de añadir celdas de matrix.

---

## Cómo se ve el éxito

Abre un PR, los checks arrancan en menos de un minuto, el install es casi todo cache hit, los tests coinciden con lo que corren los devs, y una X roja significa "este commit está mal," no "el runner tuvo un mal día" ni "probamos el ref equivocado."

Empieza por el workflow de un solo job Node (o Python) de arriba. Añade matrix cuando soportes varios runtimes. Parte jobs cuando el wall-clock en paralelo o el aislamiento de deploy valgan el coste de reinstalar. Cachea deps, no excusas.

Cuando algo está verde y aún no te fías, el bug casi siempre está en **qué** corres o en **qué commit** lo corres, no en la indentación del YAML.
