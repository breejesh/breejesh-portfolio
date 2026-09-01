---
title: "Robot d'Indexation: Prévention des Boucles Infinies dans les Crawlers (CTCI 9.3)"
description: "Concevez l'architecture d'un robot d'indexation web distribué évitant les pièges et boucles infinies via filtres de Bloom et détection SimHash."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-9-3-web-crawler.webp
previewImage: /assets/images/ctci-9-3-web-crawler.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Si vous conceviez un robot d'indexation web (web crawler), comment éviteriez-vous de tomber dans des boucles infinies ?
> * **La Solution Optimale:** Pipeline de Défense Multi-Niveaux : (1) **Normalisation Canonique des URLs** : Suppression des paramètres de suivi (`utm_*`), tri des paramètres de requête et résolution des chemins relatifs ; (2) **Registre des URLs Déjà Vues** : Filtre de Bloom distribué en mémoire vive ; (3) **Empreinte de Contenu (SimHash)** : Détection des pièges dynamiques servant du contenu identique sous des URLs distinctes ; (4) **Budget de Crawl par Domaine** : Plafond strict de profondeur ($d \le 15$) et limitation du débit de requêtes.
> * **Réalité en Production:** Architecture de Googlebot et Apache Nutch.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 9.3), l'énoncé est :

*"Comment concevoir un robot d'indexation web capable d'eviter les boucles infinies et les pieges a robots sur le web distribue ?"*

## 2. Typologie des Pièges et Mécanismes de Défense

### Causes de Boucles Infinies
1. **Cycles dans le Graphe :** $A \to B \to A$.
2. **Arbres de Chemins Infinis :** Calendriers dynamiques (`/events?year=2026...`) ou liens symboliques récursifs (`/dir/dir/dir/...`).
3. **Identifiants de Session :** URLs multiples pointant vers une même page statique.

### Mesures de Protection
1. **Normalisation d'URL :** Transformation canonique des adresses.
2. **Filtre de Bloom :** Rejet ultra-rapide en mémoire des URLs déjà explorées.
3. **Hachage SimHash 64 bits :** Élimination des pages quasi-doublons.
4. **Plafond de Profondeur :** Limitation du nombre de sous-niveaux par domaine.

## Implémentation de Production

```java
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.Set;

public class WebCrawlerLoopGuard {
    private final Set<String> visitedCanonicalUrls = new HashSet<>();
    private final Set<Long> contentSimHashes = new HashSet<>();
    private final int MAX_PATH_DEPTH = 10;

    public String normalizeUrl(String rawUrl) {
        try {
            URI uri = new URI(rawUrl.trim()).normalize();
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            String path = uri.getPath() == null ? "" : uri.getPath();
            
            if (path.endsWith("/") && path.length() > 1) {
                path = path.substring(0, path.length() - 1);
            }

            return uri.getScheme() + "://" + host + path;
        } catch (URISyntaxException e) {
            return null;
        }
    }

    public boolean shouldCrawl(String url, int currentDepth) {
        if (currentDepth > MAX_PATH_DEPTH) return false;

        String canonical = normalizeUrl(url);
        if (canonical == null || visitedCanonicalUrls.contains(canonical)) {
            return false;
        }

        if (hasRepeatingPathSegments(canonical)) {
            return false;
        }

        visitedCanonicalUrls.add(canonical);
        return true;
    }

    private boolean hasRepeatingPathSegments(String url) {
        String[] segments = url.split("/");
        Set<String> seenSegments = new HashSet<>();
        int repeatCount = 0;
        for (String segment : segments) {
            if (!segment.isEmpty() && !seenSegments.add(segment)) {
                repeatCount++;
                if (repeatCount >= 3) return true;
            }
        }
        return false;
    }

    public boolean isDuplicateContent(long simHash64) {
        return !contentSimHashes.add(simHash64);
    }
}
```

## Analyse de Complexité et Architecture

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Déduplication d'URL | `O(1)` | Consultation instantanée en filtre de Bloom. |
| Détection de Doublons | `O(1)` | Recherche de collision dans la table SimHash. |
| Validation de Chemin | `O(L)` | Découpage et vérification de la chaîne de longueur $L$. |

## Ingénierie des Systèmes en Production

### Architecture Système : Crawl Budget de Googlebot

1. **Files d'Attente de Courtoisie :** File de priorité distincte par serveur hôte avec délai minimal entre requêtes (ex. 500 ms).
2. **Mise en Quarantaine Automatique :** Isolement automatique des sous-arborescences générant des milliers de pages sans apport sémantique.

## Cas Limites et Robustesse

1. **Boucles de Redirection (HTTP 301/302) :** Compteur de sauts limité à 5.
2. **Erreurs de Syntaxe :** Capture systématique des exceptions d'analyse URI.
