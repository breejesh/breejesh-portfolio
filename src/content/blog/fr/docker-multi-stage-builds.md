---
title: "Réduire la taille de vos images Docker : Le pouvoir des builds multi-étapes"
description: "Comment les builds multi-étapes Docker réduisent la taille en production, avec des benchmarks réels sur Go, Node, Java et Python."
date: 2026-01-02
tags: [Docker, DevOps, Sécurité]
coverImage: /assets/images/docker-optimization.webp
previewImage: /assets/images/docker-optimization.webp
---

Les images volumineuses ralentissent les déploiements, remplissent les registries et élargissent la surface d'attaque. Si l'image de production contient encore compilateurs, runners de tests et outillage de build, vous livrez du poids mort.

Les **builds multi-étapes** s'attaquent au packaging : vous compilez dans un stage lourd, puis vous ne copiez que l'artefact de runtime dans une petite image finale.

J'ai aussi mesuré cela face à deux alternatives courantes (single-stage et base préconstruite avec deps) sur quatre écosystèmes. Le harness, les Dockerfiles et les chiffres sont ici :

* **GitHub :** [github.com/breejesh/multi-stage-docker-benchmarking](https://github.com/breejesh/multi-stage-docker-benchmarking)

---

## Le problème : des images trop lourdes

Une app Go typique a besoin du compilateur, du cache de modules et d'outils système pour builder. Un Dockerfile mono-étape laisse tout cela dans l'image finale :

```dockerfile
FROM golang:1.23
WORKDIR /app
COPY . .
RUN go build -o main .
CMD ["./main"]
```

Au runtime, il ne faut que le binaire. Le même schéma apparaît en Node, Java et Python : le SDK reste dans l'image après le build.

---

## Trois stratégies de build

Le benchmark compare trois stratégies de packaging sur le même petit service HTTP `/health` par langage :

1. **Single-stage :** une image installe, build et exécute.
2. **Base préconstruite :** les deps (et souvent le SDK) vivent dans une base custom ; le build de l'app copie le code par-dessus. L'image finale reste grosse.
3. **Multi-stage :** le builder a le SDK ; le stage final ne reçoit que l'artefact (binaire, `dist/`, JAR ou extrait d'env conda).

L'ordre des couches est fixe dans chaque Dockerfile (manifest → deps → source → build) pour comparer les stratégies, pas des gains de cache accidentels.

---

## Résultats du benchmark

Dernière exécution dans le repo : **2026-07-21**, Darwin x86_64, moyennes wall-clock, tailles non compressées via `docker image inspect`. Graphiques :

![Taille d'image finale par stratégie](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_size.png)

![Temps de build à froid / sans cache](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_cold.png)

![Temps de rebuild sur changement de code](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_incremental.png)

![Temps de rebuild sur changement de dépendances](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_dependency.png)

### Taille d'image (le multi-stage gagne)

| Stack | Single-stage | Pre-built | Multi-stage | Baisse vs single |
|---|---:|---:|---:|---:|
| Go | 69.2 MB | 69.2 MB | **5.4 MB** | **~92%** |
| Node.js (TypeScript) | 64.3 MB | 64.3 MB | **47.4 MB** | **~26%** |
| Java (fat JAR) | 231.7 MB | 231.7 MB | **69.9 MB** | **~70%** |
| Python (Conda) | 355.1 MB | 355.1 MB | **85.7 MB** | **~76%** |

Sur ces apps, le multi-stage a réduit la taille finale d'environ **26% à 92%**. Le pre-built égale le single-stage en taille parce qu'il livre volontairement tout le toolchain.

Go est l'extrême : un binaire statique sur un runner type Alpine/`scratch` et presque tout le reste disparaît. Node baisse moins car la prod a encore besoin du runtime Node et des `node_modules` de prod. Java et Conda se placent au milieu.

### Vitesse de rebuild (le pre-built gagne sur les edits de code)

Quand seul le code applicatif change :

| Stack | Single (s) | Pre-built (s) | Multi-stage (s) |
|---|---:|---:|---:|
| Go | 1.05 | **0.68** | 1.22 |
| Node | 1.55 | **1.09** | 2.08 |
| Java | 2.26 | **1.50** | 1.92 |
| Python (Conda) | 1.25 | **0.31** | 0.98 |

Le pre-built a été le plus rapide sur les **rebuilds purement code dans les quatre** écosystèmes. Les deps sont déjà dans la base ; Docker recompile surtout le code app.

Les builds à froid et les changements de manifest de deps sont **mitigés**. Les temps cold et dep-change du pre-built incluent la reconstruction de la base custom (juste pour un agent CI froid). Le multi-stage ne gagne pas toujours en wall-clock ; pour Conda, le cold était plus lent sur cette run (~25s multi-stage vs ~16s single).

### Smoke tests

Toutes les images, toutes stratégies confondues, ont répondu à `/health`. Plus petit ne veut pas dire cassé si le stage runtime est bien monté.

### Enseignement pratique

* **Livrez en multi-stage** pour la taille et la surface d'attaque en production.
* **Utilisez une base préconstruite** quand la vitesse de rebuild sur pur code domine (images de dev, certains chemins CI). Image de confort, pas runtime de prod.
* **Single-stage** reste une baseline simple. Rarement le meilleur sur la taille, parfois seulement correct sur la vitesse.

Pour reproduire ou étendre les chiffres :

```bash
git clone https://github.com/breejesh/multi-stage-docker-benchmarking.git
cd multi-stage-docker-benchmarking
./benchmark.sh
# or: python3 benchmark.py --apps go node java conda --runs 3
```

---

## Dockerfiles multi-étapes

### Go

```dockerfile
# Stage 1: Build
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main .

# Stage 2: Runtime
FROM alpine:3.20
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/main .
CMD ["./main"]
```

**Notes :**
- Séparez `go mod download` de `COPY . .` pour cacher les deps quand seul le source change.
- `-ldflags="-s -w"` retire les symboles de debug.
- `ca-certificates` garde le HTTPS dans l'image slim.

### Node.js / TypeScript

Node a encore besoin d'un runtime en production ; le multi-stage aide en retirant devDependencies et source :

```dockerfile
# Stage 1: Install all dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime with only production dependencies
FROM node:20-alpine AS production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

C'est pourquoi le gain Node (~26% dans le bench) est plus faible que Go (~92%) : vous payez encore Node + modules de prod.

---

## N'oubliez pas `.dockerignore`

Le multi-stage contrôle ce qui finit dans l'image finale. `.dockerignore` contrôle ce qui part au démon comme contexte de build. Sans lui, Docker peut uploader `.git/`, des `node_modules/` locaux, des fixtures de tests et des fichiers d'env à chaque build.

```
.git
.gitignore
node_modules
dist
*.md
.env*
.vscode
coverage
__tests__
Dockerfile
docker-compose*.yml
```

Les apps du benchmark ignorent les artefacts host de la même façon pour garder des timings comparables.

---

## Durcissement sécurité : au-delà de la taille

Moins de paquets, moins de chemins CVE, mais la taille ne fait pas tout.

### Tourner en utilisateur non-root

```dockerfile
FROM alpine:3.20
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/main .
USER appuser
CMD ["./main"]
```

### Bases `scratch` ou Distroless

Pour des binaires statiques :

```dockerfile
# scratch : minimum absolu, pas de shell, pas de gestionnaire de paquets
FROM scratch
COPY --from=builder /app/main /main
CMD ["/main"]
```

```dockerfile
# distroless : pas de shell, mais CA certs, données de fuseau et glibc
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /main
CMD ["/main"]
```

| Image de base | Taille | Shell | Gestionnaire de paquets | Idéal pour |
|---|---|---|---|---|
| `alpine:3.20` | ~7 MB | ✅ | ✅ (`apk`) | Usage général, debug |
| `distroless/static` | ~2 MB | ❌ | ❌ | Prod Go, Rust, C++ |
| `scratch` | 0 MB | ❌ | ❌ | Sécurité max, binaires statiques |

Sans shell, un attaquant ne peut pas faire un `exec` dans le conteneur et lancer des commandes arbitraires aussi facilement.

---

## Motif de Dockerfile prêt pour la production

Un motif Go plus complet : multi-stage, non-root, health check, labels et layout compatible signaux :

```dockerfile
# Stage 1: Build
FROM golang:1.23-alpine AS builder
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /app/server .

# Stage 2: Production
FROM alpine:3.20

LABEL org.opencontainers.image.source="https://github.com/your-org/your-app"
LABEL org.opencontainers.image.description="Your application description"

RUN apk --no-cache add ca-certificates tzdata \
    && addgroup -S appgroup \
    && adduser -S appuser -G appgroup

WORKDIR /app
COPY --from=builder /app/server .

USER appuser

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD ["./server", "health"]

EXPOSE 8080
CMD ["./server"]
```

**Pourquoi chaque pièce compte :**
- **OCI Labels** relient l'image au dépôt dans les registries.
- **`tzdata`** pour le code sensible aux fuseaux (`time.LoadLocation` en Go).
- **`HEALTHCHECK`** permet à Docker/Kubernetes de redémarrer les conteneurs malsains.
- **`EXPOSE`** documente le port pour les humains et les orchestrateurs.

---

## Bonus : accélérer les builds avec les cache mounts BuildKit

BuildKit (par défaut depuis Docker 23.0) peut garder des caches de paquets entre builds même si des couches précédentes changent :

```dockerfile
# Cache Go module downloads across builds
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Cache npm packages across builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

Surtout utile en CI, où le cache de couches est souvent froid. Ça complète le packaging multi-stage ; ça ne le remplace pas.

---

## Conclusion

Le multi-stage est le défaut que je veux pour les images de production. Le benchmark confirme le gain de taille sur Go, Node, Java et Python, d'environ un quart à plus de 90% selon le runtime encore nécessaire.

Ce n'est pas gratuit sur tous les axes. Les bases préconstruites peuvent reconstruire plus vite un pur changement de code. Cold et dep rebuilds dépendent de l'écosystème. Mesurez vos propres apps si la latence de rebuild est le goulot.

Combinez l'essentiel : multi-stage pour ce que vous livrez, `.dockerignore` pour le contexte, non-root (et distroless/`scratch` quand c'est pertinent) pour la sécurité, health checks pour l'ops, caches BuildKit pour la CI. Harness et graphiques de ce billet : [multi-stage-docker-benchmarking](https://github.com/breejesh/multi-stage-docker-benchmarking).
