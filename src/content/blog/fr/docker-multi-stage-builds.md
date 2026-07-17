---
title: "Réduire la taille de vos images Docker : Le pouvoir des builds multi-étapes"
description: "Comment réduire la taille de vos images Docker de production de 90 % et sécuriser vos conteneurs grâce aux builds multi-étapes."
date: 2026-01-02
tags: [Docker, DevOps, Conteneurisation, Optimisation]
coverImage: /assets/images/docker-optimization.webp
previewImage: /assets/images/docker-optimization.webp
---

Les images de conteneurs volumineuses ralentissent les déploiements, consomment de l'espace disque inutile dans vos registres et augmentent la surface d'attaque de sécurité. Si votre image Docker de production contient des compilateurs, des outils de test et des dépendances de build, vous transportez un poids mort qui nuit activement à votre infrastructure.

C'est là que les **builds multi-étapes** (Multi-Stage Builds) interviennent : ils vous permettent de construire votre application dans un environnement temporaire, puis de copier uniquement les fichiers compilés nécessaires vers une image finale minimale.

---

## Le problème : Des images trop lourdes

Prenons l'exemple d'une application Go classique. Pour la compiler, vous avez besoin du compilateur Go, de sa bibliothèque standard, du cache des modules et de divers outils système. Si vous utilisez un `Dockerfile` à étape unique comme celui-ci :

```dockerfile
FROM golang:1.23
WORKDIR /app
COPY . .
RUN go build -o main .
CMD ["./main"]
```

Votre image finale dépassera facilement **800 Mo** car elle inclut l'intégralité du compilateur Go, ses outils et le cache des packages locaux. En production, vous n'avez besoin que du binaire compilé (`main`), qui pèse généralement moins de **15 Mo** !

Le même problème se pose pour les applications Node.js. Une image de base `node:20` standard pèse plus de **1 Go**, alors que votre application en production n'a besoin que du runtime Node, de vos `node_modules` de production et des fichiers compilés.

---

## La solution : Les builds multi-étapes

Avec les builds multi-étapes, vous définissez plusieurs instructions `FROM` dans votre Dockerfile. Chaque instruction `FROM` démarre une nouvelle étape avec une image de base propre. Vous pouvez nommer ces étapes à l'aide du mot-clé `AS` et copier sélectivement des fichiers de l'une à l'autre grâce à `COPY --from`.

### Exemple avec Go

```dockerfile
# Étape 1 : Build
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main .

# Étape 2 : Runtime minimal
FROM alpine:3.20
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/main .
CMD ["./main"]
```

**Points clés :**
- `go mod download` est séparé de `COPY . .` afin que le téléchargement de vos dépendances soit mis en cache d'un build à l'autre (l'étape ne s'exécute que si `go.mod` o `go.sum` changent).
- `-ldflags="-s -w"` supprime les symboles de débogage et les informations DWARF, ce qui réduit encore la taille du binaire.
- `ca-certificates` est ajouté à l'image finale pour permettre à votre application d'effectuer des appels HTTPS.

### Exemple avec Node.js / TypeScript

Pour Node.js, l'approche est légèrement différente puisque vous avez besoin du runtime Node en production (contrairement à Go qui produit un binaire autonome) :

```dockerfile
# Étape 1 : Installation complète et build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : Image finale avec dépendances de production uniquement
FROM node:20-alpine AS production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

**Points clés :**
- `npm ci` dans l'étape builder installe *toutes* les dépendances (y compris les devDependencies comme TypeScript, ESLint, frameworks de test).
- `npm ci --omit=dev` dans l'étape de production n'installe *que* les dépendances requises au runtime, évitant ainsi d'embarquer les outils de build.
- Seul le dossier de sortie compilé `dist/` est copié depuis le builder, laissant de côté les fichiers sources `.ts`, les tests et les configurations de développement.

### Comparatif de taille des images

| Stack | Image à étape unique | Image multi-étapes | Réduction |
|---|---|---|---|
| Go (`golang:1.23` → `alpine`) | ~850 Mo | ~15 Mo | **98%** |
| Node.js (`node:20` → `node:20-alpine`, deps prod) | ~1.1 Go | ~180 Mo | **84%** |
| Go (`golang:1.23` → `scratch`) | ~850 Mo | ~8 Mo | **99%** |

---

## N'oubliez pas le fichier `.dockerignore`

Les builds multi-étapes optimisent le contenu de votre image finale, mais le fichier `.dockerignore` permet d'optimiser les données envoyées au démon Docker lors du build. Sans lui, Docker envoie l'intégralité du répertoire du projet — y compris le dossier `.git/`, les `node_modules/` locaux, les fichiers de test et les variables d'environnement locales — augmentant inutilement le temps de build.

Créez un fichier `.dockerignore` à la racine de votre projet :

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

Cela peut réduire la taille du contexte de build de plusieurs centaines de mégaoctets à seulement quelques mégaoctets, accélérant considérablement le processus, en particulier dans les pipelines CI/CD.

---

## Durcissement de la sécurité : Au-delà de la taille

Réduire la taille des images améliore naturellement la sécurité (moins de paquets = moins de failles potentielles), mais vous pouvez aller plus loin grâce à ces bonnes pratiques :

### Exécuter en tant qu'utilisateur non-root

Par défaut, les conteneurs s'exécutent avec les privilèges `root`. Si un attaquant parvient à exploiter une faille dans votre application, il disposera des droits root dans le conteneur. Veillez à toujours créer et utiliser un utilisateur non privilégié :

```dockerfile
FROM alpine:3.20
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/main .
USER appuser
CMD ["./main"]
```

### Utiliser des images de base `scratch` ou Distroless

Pour Go et les langages compilés statiquement, vous pouvez aller encore plus loin qu'Alpine en utilisant `scratch` (un système de fichiers vide) ou les images **distroless** de Google :

```dockerfile
# scratch — le strict minimum, aucun shell, aucun gestionnaire de paquets
FROM scratch
COPY --from=builder /app/main /main
CMD ["/main"]
```

```dockerfile
# distroless — pas de shell, mais inclut les certificats CA, fuseaux horaires et glibc
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /main
CMD ["/main"]
```

**Avantages et inconvénients :**
| Image de base | Taille | Présence d'un Shell | Gestionnaire de paquets | Usage recommandé |
|---|---|---|---|---|
| `alpine:3.20` | ~7 Mo | ✅ | ✅ (`apk`) | Usage général, débogage facile |
| `distroless/static` | ~2 Mo | ❌ | ❌ | Go, Rust, C++ en production |
| `scratch` | 0 Mo | ❌ | ❌ | Binaires statiques, sécurité maximale |

> En l'absence de shell, un attaquant ne peut pas exécuter de commandes arbitraires ou explorer le système de fichiers, ce qui représente un atout de sécurité majeur.

---

## Modèle de Dockerfile prêt pour la production

Voici un Dockerfile complet et robuste combinant l'ensemble de ces pratiques : build multi-étapes, utilisateur non-root, vérification de santé (healthcheck), étiquetage standardisé et gestion correcte des signaux :

```dockerfile
# Étape 1 : Build
FROM golang:1.23-alpine AS builder
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /app/server .

# Étape 2 : Production
FROM alpine:3.20

LABEL org.opencontainers.image.source="https://github.com/votre-org/votre-app"
LABEL org.opencontainers.image.description="Description de votre application"

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

**Pourquoi ces éléments sont importants :**
- Les **labels OCI** permettent de lier les images à leurs dépôts sources dans vos registres.
- **`tzdata`** assure le bon fonctionnement des opérations liées aux fuseaux horaires.
- **`HEALTHCHECK`** permet à Docker ou aux orchestrateurs (ECS, Kubernetes) de détecter et de redémarrer automatiquement les conteneurs défaillants.
- **`EXPOSE`** documente le port d'écoute (informatif, mais crucial pour les outils d'orchestration).

---

## Bonus : Accélérer les builds avec le cache BuildKit

Docker BuildKit permet d'utiliser des montages de cache qui partagent les dossiers de vos gestionnaires de paquets d'un build à l'autre, accélérant ainsi l'installation des dépendances :

```dockerfile
# Mettre en cache les dépendances Go
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Mettre en cache les paquets npm  
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

Contrairement au cache de couches traditionnel, le cache de type `--mount=type=cache` est conservé même si les couches précédentes ont été modifiées. C'est une optimisation précieuse pour vos environnements de CI.

---

## Conclusion

Les builds multi-étapes sont indispensables à tout workflow DevOps moderne. En isolant les outils de build de votre image finale, vous accélérez les temps de démarrage, facilitez le transfert de vos images et réduisez considérablement votre surface d'attaque.

Associez-les à un fichier `.dockerignore` pour des transferts de contexte plus rapides, à des utilisateurs non-root et des bases distroless pour la sécurité, et enfin aux caches de BuildKit pour optimiser vos pipelines de CI/CD. Grâce à ces pratiques, vos conteneurs de production seront légers, sécurisés et performants.
