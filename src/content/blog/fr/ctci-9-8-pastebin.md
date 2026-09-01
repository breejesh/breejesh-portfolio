---
title: "Pastebin: Architecture de Stockage de Texte et Réducteur d'URL (CTCI 9.8)"
description: "Concevez un service de partage de texte et de raccourcissement d'URL (Pastebin) à haute échelle via encodage Base62, stockage objet S3 et service KGS."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-9-8-pastebin.webp
previewImage: /assets/images/ctci-9-8-pastebin.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez un système comme Pastebin, où un utilisateur peut saisir un texte et obtenir une URL générée aléatoirement pour y accéder.
> * **La Solution Optimale:** Stockage Objet + Service de Génération de Clés (KGS) : (1) Encodage Base62 sur 7 caractères (`[a-zA-Z0-9]`) offrant $62^7 \approx 3{,}52\text{ billions}$ de combinaisons uniques ; (2) **Service KGS** : Pré-génération de clés uniques en mémoire éliminant tout risque de conflit et de verrouillage base de données ; (3) **Stockage Hybride** : Métadonnées dans Cassandra/DynamoDB et contenu brut dans Amazon S3 / MinIO ; (4) **Cache Redis** : Mise en cache des textes viraux avec accès en sous-milliseconde.
> * **Réalité en Production:** Pastebin.com, GitHub Gist et réducteurs d'URL Bitly.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 9.8), l'énoncé est :

*"Concevez l'architecture d'un service de partage de texte et de generation d'URL courtes de type Pastebin."*

## 2. Dimensionnement et Volumétrie

* **Écritures :** 10 millions de textes/jour ($\approx 115\text{ pastes/s}$).
* **Lectures :** 100 millions de lectures/jour (ratio lecture/écriture de 10:1).
* **Taille Moyenne :** 10 Ko par texte.
* **Volume Annuel :** $100\text{ Go/jour} \implies 36{,}5\text{ To/an}$.
* **Espace d'Adressage :** $62^7 \approx 3{,}52 \times 10^{12}$ clés alphanumériques uniques.

## Implémentation de Production

```java
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class PastebinService {
    private static final String BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public static class PasteMetadata {
        public final String slug;
        public final String content;
        public final long createdAt;
        public final long expiresAt;

        public PasteMetadata(String slug, String content, long ttlSeconds) {
            this.slug = slug;
            this.content = content;
            this.createdAt = System.currentTimeMillis();
            this.expiresAt = ttlSeconds > 0 ? this.createdAt + (ttlSeconds * 1000) : Long.MAX_VALUE;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    private final AtomicLong counter = new AtomicLong(10000000000L);
    private final ConcurrentHashMap<String, PasteMetadata> pasteStorage = new ConcurrentHashMap<>();

    public String encodeBase62(long num) {
        StringBuilder sb = new StringBuilder();
        while (num > 0) {
            sb.append(BASE62.charAt((int) (num % 62)));
            num /= 62;
        }
        return sb.reverse().toString();
    }

    public String createPaste(String content, long ttlSeconds) {
        long id = counter.incrementAndGet();
        String slug = encodeBase62(id);
        PasteMetadata meta = new PasteMetadata(slug, content, ttlSeconds);
        pasteStorage.put(slug, meta);
        return slug;
    }

    public String getPaste(String slug) {
        PasteMetadata meta = pasteStorage.get(slug);
        if (meta == null || meta.isExpired()) {
            pasteStorage.remove(slug);
            return null;
        }
        return meta.content;
    }
}
```

## Analyse de Complexité et Architecture

| Opération | Complexité | Détail Technique |
|---|---|---|
| Création de Paste | `O(1)` | Incrément atomique + encodage Base62 + persistance S3. |
| Lecture de Paste | `O(1)` | Lecture directe en cache mémoire Redis ou NoSQL. |
| Probabilité de Collision | `0%` | Garantie absolue par le service KGS centralisé. |

## Ingénierie des Systèmes en Production

### Architecture Système : Service de Génération de Clés (KGS)

1. **Génération Anticipée en RAM :** Le service KGS alimente continuellement une file de clés prêtes à l'emploi. Chaque création consomme instantanément un identifiant sans verrouiller la base de données.
2. **Cycle de Vie Amazon S3 :** Suppression automatique des objets dont la date d'expiration est échue, libérant la base de données de toute tâche de nettoyage lourd.

## Cas Limites et Robustesse

1. **Plafond de Taille :** Limitation stricte des textes à 10 Mo par envoi.
2. **Protection Anti-Abus :** Limitation de débit par algorithme de seau à jetons (Token Bucket).
