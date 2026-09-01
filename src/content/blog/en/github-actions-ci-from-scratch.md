---
title: "GitHub Actions CI from Scratch"
description: "Workflows, jobs, caching, secrets, matrix builds, and the pitfalls that waste hours when you set up CI on GitHub for the first time."
date: "2026-07-07"
tags: [Cloud & DevOps]
coverImage: /assets/images/github-actions-ci-from-scratch.webp
previewImage: /assets/images/github-actions-ci-from-scratch.webp
---


GitHub Actions embeds continuous integration directly alongside source code. Workflows defined under `.github/workflows/` execute on pull requests, pushes, and schedules with matrix build parallelism. pull request, push to `main`, a schedule, or a manual click.

This post is the minimal mental model plus the pieces that actually show up in production pipelines: **workflows, jobs, steps, caching, secrets, matrix builds**, and the mistakes that make green checks lie or make every run take 12 minutes.

No marketplace tour. No "use every feature" checklist. One working CI path you can copy and tighten.

---

## What you are actually configuring

Three layers:

| Layer | What it is | File / place |
| --- | --- | --- |
| **Workflow** | A named pipeline triggered by events | `.github/workflows/*.yml` |
| **Job** | A unit of work on one runner (VM or container) | `jobs.<id>:` |
| **Step** | A shell command or a reusable Action | under `steps:` |

A workflow can run several jobs. Jobs can run in parallel or wait on each other with `needs`. Steps inside a job always run in order on the same machine, so later steps see files and env from earlier ones.

That last sentence is why people put "checkout, then install, then test" in one job instead of three jobs that each start cold.

---

## The smallest useful workflow

Create `.github/workflows/ci.yml`:

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

What this does:

1. Runs on every PR and every push to `main`.
2. Spins up a fresh Ubuntu runner.
3. Checks out the repo at the commit under test.
4. Installs Node 20 and restores an npm cache when possible.
5. Installs deps with `npm ci` (lockfile-strict) and runs tests.

If the test step exits non-zero, the job fails and the check on the PR fails. That is the whole contract.

---

## Triggers: `on` without the noise

Common events:

```yaml
on:
  pull_request:
    paths:
      - "src/**"
      - "package-lock.json"
      - ".github/workflows/ci.yml"
  push:
    branches: [main]
  workflow_dispatch:   # manual "Run workflow" in the UI
  schedule:
    - cron: "0 6 * * 1"  # Mondays 06:00 UTC
```

Notes that save re-runs:

* **`paths` filters** skip the workflow when the change is docs-only (or whatever you exclude). Missed path globs are a common "why did CI not run?" answer.
* **`workflow_dispatch`** is how you re-run after fixing secrets without a dummy commit.
* **`schedule`** only runs on the default branch, and GitHub can delay low-priority cron under load. Do not use cron alone for "must run before every release."
* Fork PRs have limited access to secrets. That is intentional. Treat it as a security boundary, not a bug.

---

## Jobs, runners, and `needs`

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

`needs: lint` means `test` waits until `lint` succeeds. If `lint` fails, `test` and `build` are skipped (unless you set `if:` conditions that say otherwise).

Each job is a **new machine**. There is no shared filesystem between `lint` and `test` unless you pass **artifacts** or re-install. That is why naive multi-job graphs reinstall deps three times.

When to split jobs:

* Different OS or language versions (matrix).
* Slow independent suites you want in parallel.
* A deploy job that must not run until tests pass, and that needs extra secrets.

When to keep one job:

* Small repos where install dominates wall-clock.
* Steps that share a warm local cache on disk (node_modules, target/, .venv).

---

## Steps: `run` vs `uses`

* **`run:`** shell on the runner. Default on Linux is bash. Use for project scripts you already trust.
* **`uses:`** a published Action (or a local `./.github/actions/...`). Prefer **version pins** (`@v4` or a full SHA for high-trust paths).

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Run unit tests
    run: |
      set -euo pipefail
      npm ci
      npm test -- --coverage
```

`actions/checkout` is almost always step one. Without it, the runner has an empty workspace.

For third-party Actions that touch secrets or deploy credentials, pin to a commit SHA and review the Action source. Tags can move.

---

## Caching dependencies

Cache is how you stop paying full install cost every run. Prefer the cache built into setup Actions when it exists:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: "20"
    cache: npm          # uses package-lock.json as the key seed

- uses: actions/setup-python@v5
  with:
    python-version: "3.12"
    cache: pip          # uses requirements.txt / pyproject as configured

- uses: actions/setup-go@v5
  with:
    go-version: "1.22"
    cache: true
```

Manual cache when you must:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

Rules of thumb:

* **Key must change when the lockfile changes.** Stale keys install the wrong tree or skip needed updates.
* **Cache is best-effort.** A miss is normal after 7 days of inactivity or when the key is new. Your job must still work cold.
* **Do not cache secrets or build outputs you would not put in a PR artifact.** Cache is for dependencies and toolchains, not for "skip tests if we cached last night's binary."
* **Restore-keys** are prefixes: a partial hit can restore an older cache and then layer on top. That speeds installs but can hide lockfile mistakes if your install is not strict.

Artifacts are different: use `actions/upload-artifact` / `download-artifact` to pass build outputs between jobs in the **same** workflow run. Cache is across runs; artifacts are within a run (with retention you configure).

---

## Secrets and environment variables

Repo or org secrets live in GitHub settings. Workflows read them as:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production   # optional: protection rules, env-scoped secrets
    steps:
      - uses: actions/checkout@v4

      - name: Deploy
        env:
          API_TOKEN: ${{ secrets.API_TOKEN }}
          APP_ENV: production
        run: ./scripts/deploy.sh
```

Hard rules:

* **Never echo secrets** into logs. GitHub masks known secret *values*, not every derived string. Printing `API_TOKEN` base64 or a substring can leak.
* **Do not commit secrets** "just for CI" in the repo or in workflow YAML.
* **`pull_request` from forks** does not get write secrets the same way as `pull_request_target`. Prefer `pull_request` for untrusted code. Only use `pull_request_target` if you understand the checkout and privilege model; misuse is a classic supply-chain footgun.
* **OIDC + cloud roles** (AWS, GCP, Azure) beat long-lived keys when you can use them. Short-lived tokens from `permissions` + cloud federation leave less permanent residue.
* Scope `permissions:` at the top of the workflow or per job. Default token rights have tightened over time; still, set what you need:

```yaml
permissions:
  contents: read
  pull-requests: write   # only if a bot must comment
```

---

## Matrix builds

Matrix fans one job definition into many runs:

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

What to watch:

* **Cost and queue time scale with the product** of dimensions. Three OS times four versions is twelve jobs.
* **`fail-fast: true`** (default) cancels siblings when one matrix cell fails. Set `false` when you want the full failure picture on a PR.
* **`include` / `exclude`** keep the grid honest instead of listing every combination by hand.
* OS-specific path and shell differences show up here first (`\` vs `/`, PowerShell vs bash). Prefer project scripts that abstract that.

---

## A tighter multi-language example

Service with Node front and Python tests:

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

**`concurrency`** cancels an older in-progress run on the same branch when you push again. That keeps the Actions minutes bill and the "which run is latest?" confusion under control.

---

## Common pitfalls (the expensive ones)

### 1. Testing a different commit than you think

Always checkout the PR head for untrusted PR CI. Misconfigured `ref` on checkout (or using `pull_request_target` with the merge ref carelessly) can run trusted workflow code against attacker-controlled source. Default `actions/checkout@v4` on `pull_request` is the safe baseline for most teams.

### 2. `npm install` instead of `npm ci` in CI

`npm install` can rewrite the lockfile behavior and drift from what developers installed. CI should use the lockfile-strict path (`npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable`, etc.).

### 3. Caching `node_modules` directly

Works until it does not (optional deps, native addons, OS skew). Prefer caching the package manager store and doing a clean install. Setup-node's `cache: npm` is the boring correct default for npm.

### 4. Secrets in `run: echo` "debug" steps

Someone leaves `echo "token=$API_TOKEN"` "for five minutes." Logs outlive the PR. Use temporary local debugging or GitHub's secret scanning mindset: assume logs are public to anyone with repo read access appropriate to that run.

### 5. No `concurrency`, endless overlapping deploys

Two pushes to `main` can deploy out of order. Use concurrency groups on deploy workflows, or an environment with required reviewers / wait timers.

### 6. Matrix explosion without `fail-fast: false` when debugging

You see one red X, cancel siblings, and miss that Windows+Node 22 was also broken. Flip `fail-fast` while stabilizing; turn it back on when the suite is trustworthy.

### 7. Relying on `latest` tags for critical Actions

`uses: some-org/some-action@main` can change under you on a Tuesday. Pin majors at least (`@v4`). Pin SHAs for deploy and release paths.

### 8. Forgetting required checks on protected branches

Workflow exists, PR merges with a red X ignored. Branch protection (or rulesets) must **require** the job names you care about. Rename a job without updating the required check and merges go free.

### 9. GITHUB_TOKEN permissions surprise

A step that opens an issue or pushes a tag fails with 403 after a permissions default change. Set explicit `permissions` and a dedicated PAT or GitHub App only when the default token cannot do the job.

### 10. Flaky tests blamed on Actions

Retrying the whole workflow hides product bugs. Fix flakes or quarantine with an explicit allowlist. Infinite "Re-run jobs" is not a stability strategy.

---

## Expressions, contexts, and `if`

```yaml
- name: Publish
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: ./scripts/publish.sh
```

Useful contexts: `github`, `env`, `secrets`, `matrix`, `needs`, `runner`, `steps`.

```yaml
- name: Upload coverage
  if: always() && steps.test.outcome == 'success'
  uses: actions/upload-artifact@v4
  with:
    name: coverage
    path: coverage/
```

`if: always()` runs even when a previous step failed (still subject to job cancellation). Use sparingly for cleanup or uploads you truly want on failure.

---

## Local iteration without burning minutes

* Run the same scripts Actions runs: `npm ci && npm test`. If it fails locally, it will fail in CI.
* [Act](https://github.com/nektos/act) can approximate workflows with Docker. It is not identical to GitHub-hosted runners (images, available software, networking).
* Use `workflow_dispatch` with inputs to test deploy paths on a staging environment without merging.

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

## A sane default checklist

Before you call CI "done":

1. Workflow on `pull_request` and `push` to the default branch.
2. Lockfile-strict installs.
3. Language setup Action with built-in cache.
4. Explicit `permissions: contents: read` (add more only as needed).
5. `concurrency` for PR branches.
6. Required status checks on protected branches matching **exact job names**.
7. Secrets only via `${{ secrets.* }}` / OIDC, never in git.
8. Pinned major versions of first-party Actions; SHA pins for deploy.
9. One documented "re-run / manual dispatch" path for releases.
10. Job time budget: if install+test is over ~10 minutes, profile before adding more matrix cells.

---

## What success looks like

A PR opens, checks start in under a minute, install is mostly cache hits, tests match what developers run, and a red X means "this commit is wrong," not "the runner had a bad day" or "we tested the wrong ref."

Start from the single-job Node (or Python) workflow above. Add matrix when you support multiple runtimes. Split jobs when parallel wall-clock or deploy isolation is worth the reinstall cost. Cache deps, not excuses.

When something is green and you still do not trust it, the bug is almost always in **what** you run or **which commit** you run it on, not in YAML indentation.

