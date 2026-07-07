---
title: "GitHub Actions CI depuis zéro"
description: "Workflows, jobs, cache, secrets, builds matrix et les pièges qui coûtent des heures la première fois que vous montez du CI sur GitHub."
date: "2026-07-07"
tags: [DevOps]
coverImage: /assets/images/github-actions-ci-from-scratch.webp
previewImage: /assets/images/github-actions-ci-from-scratch.webp
---

GitHub Actions, c'est du CI collé au code. Vous déposez du YAML sous `.github/workflows/`, vous poussez, et des runners prennent les jobs sur les événements que vous choisissez : pull request, push sur `main`, un schedule, ou un clic manuel.

Ce billet donne le modèle mental minimal plus les briques qui existent vraiment en production : **workflows, jobs, steps, cache, secrets, matrix builds**, et les erreurs qui font mentir les checks verts ou allongent chaque run à 12 minutes.

Pas de visite du marketplace. Pas de checklist "activez toutes les features". Un chemin CI que vous pouvez copier et durcir.

---

## Ce que vous configurez vraiment

Trois couches :

| Couche | Rôle | Fichier / endroit |
| --- | --- | --- |
| **Workflow** | Pipeline nommé déclenché par des événements | `.github/workflows/*.yml` |
| **Job** | Unité de travail sur un runner (VM ou conteneur) | `jobs.<id>:` |
| **Step** | Commande shell ou Action réutilisable | sous `steps:` |

Un workflow peut lancer plusieurs jobs. Les jobs tournent en parallèle ou s'attendent avec `needs`. Les steps d'un job s'exécutent toujours dans l'ordre sur la même machine, donc les suivants voient fichiers et env des précédents.

C'est pour ça qu'on met "checkout, puis install, puis test" dans un seul job, pas dans trois jobs qui repartent à froid.

---

## Le plus petit workflow utile

Créez `.github/workflows/ci.yml` :

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

Ce que ça fait :

1. Tourne sur chaque PR et chaque push vers `main`.
2. Démarre un runner Ubuntu neuf.
3. Checkout le dépôt au commit sous test.
4. Installe Node 20 et restaure un cache npm si possible.
5. Installe les deps avec `npm ci` (strict sur le lockfile) et lance les tests.

Si le step de test sort non zéro, le job échoue et le check de la PR échoue. C'est tout le contrat.

---

## Triggers : `on` sans le bruit

Événements courants :

```yaml
on:
  pull_request:
    paths:
      - "src/**"
      - "package-lock.json"
      - ".github/workflows/ci.yml"
  push:
    branches: [main]
  workflow_dispatch:   # "Run workflow" manuel dans l'UI
  schedule:
    - cron: "0 6 * * 1"  # lundis 06:00 UTC
```

Notes qui évitent des re-runs inutiles :

* Les **filtres `paths`** sautent le workflow quand le changement est purement docs (ou ce que vous excluez). Des globs ratés répondent souvent à "pourquoi le CI n'a pas tourné ?"
* **`workflow_dispatch`** permet de relancer après correction de secrets sans commit factice.
* **`schedule`** ne tourne que sur la branche par défaut, et GitHub peut retarder les crons peu prioritaires sous charge. N'utilisez pas le cron seul pour "doit tourner avant chaque release."
* Les PR de forks ont un accès limité aux secrets. C'est voulu. Traitez-le comme frontière de sécurité, pas comme bug.

---

## Jobs, runners et `needs`

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

`needs: lint` fait attendre `test` jusqu'au succès de `lint`. Si `lint` échoue, `test` et `build` sont sautés (sauf `if:` contraire).

Chaque job est une **nouvelle machine**. Pas de filesystem partagé entre `lint` et `test` sauf **artifacts** ou réinstall. D'où les graphes multi-job naïfs qui réinstallent trois fois.

Quand découper les jobs :

* OS ou versions de langage différents (matrix).
* Suites lentes indépendantes à paralléliser.
* Un job de deploy qui ne doit pas tourner avant les tests, avec secrets en plus.

Quand garder un seul job :

* Petits dépôts où l'install domine le wall-clock.
* Steps qui partagent un cache disque local (node_modules, target/, .venv).

---

## Steps : `run` vs `uses`

* **`run:`** shell sur le runner. Sous Linux, bash par défaut. Pour les scripts du projet déjà de confiance.
* **`uses:`** une Action publiée (ou locale `./.github/actions/...`). Préférez des **pins de version** (`@v4` ou un SHA complet sur les chemins sensibles).

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Run unit tests
    run: |
      set -euo pipefail
      npm ci
      npm test -- --coverage
```

`actions/checkout` est presque toujours le premier step. Sans lui, le workspace du runner est vide.

Pour les Actions tierces qui touchent secrets ou credentials de deploy, pinez un SHA de commit et lisez le code de l'Action. Les tags bougent.

---

## Cache des dépendances

Le cache évite de payer l'install complet à chaque run. Préférez le cache intégré des setup Actions quand il existe :

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: "20"
    cache: npm          # package-lock.json comme graine de clé

- uses: actions/setup-python@v5
  with:
    python-version: "3.12"
    cache: pip          # requirements.txt / pyproject selon config

- uses: actions/setup-go@v5
  with:
    go-version: "1.22"
    cache: true
```

Cache manuel si besoin :

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

Règles de base :

* **La clé doit changer quand le lockfile change.** Une clé périmée installe le mauvais arbre ou saute des updates.
* **Le cache est best-effort.** Un miss est normal après 7 jours d'inactivité ou avec une nouvelle clé. Le job doit marcher à froid.
* **Ne cachez pas secrets ni sorties de build** que vous ne mettriez pas en artifact de PR. Le cache sert aux deps et toolchains, pas à "sauter les tests si on a le binaire d'hier."
* **Restore-keys** sont des préfixes : un hit partiel restaure un cache plus vieux puis empile dessus. Ça accélère l'install, mais peut masquer des erreurs de lockfile si l'install n'est pas strict.

Les artifacts sont autre chose : `actions/upload-artifact` / `download-artifact` passent des sorties entre jobs du **même** run. Le cache traverse les runs ; les artifacts restent dans un run (avec la rétention configurée).

---

## Secrets et variables d'environnement

Les secrets repo ou org vivent dans les réglages GitHub. Les workflows les lisent ainsi :

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production   # optionnel : règles de protection, secrets par env
    steps:
      - uses: actions/checkout@v4

      - name: Deploy
        env:
          API_TOKEN: ${{ secrets.API_TOKEN }}
          APP_ENV: production
        run: ./scripts/deploy.sh
```

Règles dures :

* **N'écrivez jamais les secrets** dans les logs. GitHub masque les *valeurs* de secrets connues, pas chaque dérivé. Afficher `API_TOKEN` en base64 ou un sous-string peut fuiter.
* **Ne commitez pas de secrets** "juste pour le CI" dans le dépôt ou le YAML.
* **`pull_request` depuis un fork** n'a pas les mêmes droits write secrets que `pull_request_target`. Préférez `pull_request` pour le code non de confiance. N'utilisez `pull_request_target` que si vous comprenez checkout et privilèges ; le mauvais usage est un classique de la supply chain.
* **OIDC + rôles cloud** (AWS, GCP, Azure) battent les clés longue durée quand c'est possible. Des tokens courts via `permissions` + fédération laissent moins de résidu.
* Bornez `permissions:` en tête de workflow ou par job. Les droits par défaut du token se sont resserrés ; déclarez quand même le besoin :

```yaml
permissions:
  contents: read
  pull-requests: write   # seulement si un bot doit commenter
```

---

## Matrix builds

La matrix décline une définition de job en plusieurs runs :

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

Points de vigilance :

* **Coût et file d'attente suivent le produit** des dimensions. Trois OS fois quatre versions = douze jobs.
* **`fail-fast: true`** (défaut) annule les frères quand une cellule échoue. Mettez `false` pour voir tout le tableau d'échecs sur une PR.
* **`include` / `exclude`** gardent la grille honnête sans lister chaque combinaison à la main.
* Différences de chemins et de shell par OS apparaissent d'abord ici (`\` vs `/`, PowerShell vs bash). Préférez des scripts projet qui l'abstraient.

---

## Un exemple multi-langages plus serré

Service avec front Node et tests Python :

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

**`concurrency`** annule un run en cours sur la même branche quand vous poussez à nouveau. Ça tient la facture de minutes Actions et la confusion "quel run est le dernier ?"

---

## Pièges fréquents (les chers)

### 1. Tester un autre commit que celui que vous croyez

Checkout toujours le head de la PR pour du CI de PR non de confiance. Un `ref` mal configuré (ou `pull_request_target` avec le merge ref à la légère) peut exécuter un workflow de confiance sur du code contrôlé par un attaquant. `actions/checkout@v4` par défaut sur `pull_request` est la base sûre pour la plupart des équipes.

### 2. `npm install` au lieu de `npm ci` en CI

`npm install` peut réécrire le comportement du lockfile et diverger de ce que les devs ont installé. Le CI doit suivre le chemin strict (`npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable`, etc.).

### 3. Cacher `node_modules` directement

Ça marche jusqu'au jour où ça casse (deps optionnelles, addons natifs, biais d'OS). Préférez le store du package manager + install propre. Le `cache: npm` de setup-node est le défaut ennuyeux et correct pour npm.

### 4. Secrets dans des steps `run: echo` de "debug"

Quelqu'un laisse `echo "token=$API_TOKEN"` "cinq minutes." Les logs survivent à la PR. Déboguez en local ou partez du principe que les logs sont lisibles pour qui a le droit de lecture du run.

### 5. Pas de `concurrency`, deploys qui se chevauchent

Deux push sur `main` peuvent déployer dans le désordre. Groupes de concurrency sur les workflows de deploy, ou environment avec reviewers / timers.

### 6. Explosion de matrix sans `fail-fast: false` en debug

Vous voyez une croix rouge, les frères sont annulés, et vous ratez Windows+Node 22 aussi cassé. Basculez `fail-fast` le temps de stabiliser ; remettez-le quand la suite est fiable.

### 7. Se fier aux tags `latest` pour des Actions critiques

`uses: some-org/some-action@main` peut changer un mardi. Pinez au moins les majors (`@v4`). Pinez des SHA pour deploy et release.

### 8. Oublier les required checks sur les branches protégées

Le workflow existe, la PR merge avec une croix rouge ignorée. Branch protection (ou rulesets) doit **exiger** les noms de job qui comptent. Renommez un job sans mettre à jour le check requis et les merges passent libres.

### 9. Surprise de permissions GITHUB_TOKEN

Un step qui ouvre une issue ou pousse un tag échoue en 403 après un changement de défauts. `permissions` explicites, et PAT ou GitHub App seulement si le token par défaut ne suffit pas.

### 10. Tests flaky accusés sur Actions

Relancer tout le workflow cache des bugs produit. Corrigez les flakes ou mettez-les en quarantaine listée. "Re-run jobs" en boucle n'est pas une stratégie de stabilité.

---

## Expressions, contexts et `if`

```yaml
- name: Publish
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: ./scripts/publish.sh
```

Contexts utiles : `github`, `env`, `secrets`, `matrix`, `needs`, `runner`, `steps`.

```yaml
- name: Upload coverage
  if: always() && steps.test.outcome == 'success'
  uses: actions/upload-artifact@v4
  with:
    name: coverage
    path: coverage/
```

`if: always()` tourne même si un step précédent a échoué (toujours soumis à l'annulation du job). À utiliser avec parcimonie pour cleanup ou uploads vraiment voulus en échec.

---

## Itérer en local sans brûler des minutes

* Lancez les mêmes scripts qu'Actions : `npm ci && npm test`. Si ça casse en local, ça cassera en CI.
* [Act](https://github.com/nektos/act) approxime les workflows avec Docker. Ce n'est pas identique aux runners hébergés GitHub (images, logiciels, réseau).
* Utilisez `workflow_dispatch` avec inputs pour tester un deploy staging sans merger.

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

## Checklist d'un défaut raisonnable

Avant de dire que le CI est "fini" :

1. Workflow sur `pull_request` et `push` vers la branche par défaut.
2. Installs stricts au lockfile.
3. Setup Action du langage avec cache intégré.
4. `permissions: contents: read` explicite (ajoutez le reste seulement si besoin).
5. `concurrency` sur les branches de PR.
6. Required status checks sur branches protégées avec les **noms exacts de job**.
7. Secrets uniquement via `${{ secrets.* }}` / OIDC, jamais dans git.
8. Majors pinés pour les Actions first-party ; SHA pour le deploy.
9. Un chemin documenté "re-run / manual dispatch" pour les releases.
10. Budget temps : si install+test dépasse ~10 minutes, profilez avant d'ajouter des cellules matrix.

---

## À quoi ressemble le succès

Une PR s'ouvre, les checks démarrent en moins d'une minute, l'install est surtout des cache hits, les tests collent à ce que les devs lancent, et une croix rouge veut dire "ce commit est faux," pas "le runner a eu une mauvaise journée" ni "on a testé le mauvais ref."

Parte de monojob Node (ou Python) ci-dessus. Ajoutez la matrix quand vous supportez plusieurs runtimes. Découpez les jobs quand le wall-clock parallèle ou l'isolement du deploy valent le coût de réinstall. Cachez les deps, pas les excuses.

Quand c'est vert et que vous ne faites toujours pas confiance, le bug est presque toujours dans **ce que** vous lancez ou **quel commit** vous lancez, pas dans l'indentation YAML.
