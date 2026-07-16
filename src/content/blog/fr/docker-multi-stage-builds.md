---
title: "Réduire vos images Docker : la puissance des builds multi-étapes"
description: "Comment réduire la taille de votre image Docker de production de 90 % et sécuriser vos conteneurs grâce aux builds multi-étapes."
date: 2026-01-02
tags: [Docker, DevOps, Conteneurs, Optimisation]
coverImage: /assets/images/docker-optimization.webp
previewImage: /assets/images/docker-optimization.webp
---

Les images de conteneurs volumineuses ralentissent les déploiements, consomment de l'espace de stockage inutile dans le registre et augmentent la surface d'attaque en matière de sécurité. Si votre image Docker de production contient des compilateurs, des outils de test et des dépendances de compilation, vous transportez du poids mort.

C'est là qu'interviennent les **builds multi-étapes (Multi-Stage Builds)**, qui vous permettent de compiler votre application dans un environnement temporaire et de copier uniquement les actifs de production compilés dans une image finale minimale.

---

## Le problème : les images volumineuses

Considérez une application standard en Go, Node.js ou Java. Pour compiler l'application, vous avez besoin de SDK, d'outils de compilation, de gestionnaires de paquets et de fichiers d'en-tête.

Si vous utilisez un `Dockerfile` à étape unique comme celui-ci :
```dockerfile
FROM golang:1.21
WORKDIR /app
COPY . .
RUN go build -o main .
CMD ["./main"]
```
Votre image finale dépassera facilement **800 Mo** car elle inclut l'intégralité du compilateur Go, les outils et le cache des paquets locaux. En production, vous n'avez besoin que du binaire compilé (`main`), qui pèse généralement moins de **30 Mo** !

---

## La solution : les builds multi-étapes

Avec les builds multi-étapes, vous définissez plusieurs instructions `FROM` dans votre Dockerfile. Chaque `FROM` commence une nouvelle étape avec une image de base propre. Vous pouvez nommer ces étapes à l'aide du mot-clé `AS` et copier des fichiers entre elles à l'aide de `COPY --from`.

Voici la version multi-étapes optimisée :
```dockerfile
# Étape 1 : Phase de compilation
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Étape 2 : Image d'exécution finale minimale
FROM alpine:3.18
WORKDIR /app
COPY --from=builder /app/main .
CMD ["./main"]
```

### Pourquoi cela fonctionne :
1. **Séparation des préoccupations :** Le compilateur et les fichiers sources restent dans la première étape.
2. **Taille finale minimale :** L'image finale est construite sur `alpine`, ce qui donne une taille finale d'environ **35 Mo** au lieu de 800 Mo.
3. **Sécurité renforcée :** Le conteneur final ne contient pas d'outils de compilation, ce qui limite les capacités du shell pour les attaquants potentiels.

---

## Conclusion

Les builds multi-étapes sont un outil indispensable pour tout workflow DevOps moderne. En isolant vos outils de build de l'image d'exécution finale, vous obtenez des temps de démarrage plus rapides, des téléchargements accélérés et une surface d'attaque considérablement réduite.
