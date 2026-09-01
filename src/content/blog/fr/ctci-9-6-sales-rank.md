---
title: "Classement des Ventes: Moteur de Meilleures Ventes en Temps Réel (CTCI 9.6)"
description: "Concevez un moteur de classement des meilleures ventes e-commerce par catégories et fenêtres temporelles glissantes via Redis Sorted Sets et agrégation de flux."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-9-6-sales-rank.webp
previewImage: /assets/images/ctci-9-6-sales-rank.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Une plateforme e-commerce souhaite lister les articles les plus vendus, globalement et par catégorie, sur différents intervalles (dernière heure, 24 heures, 7 jours, historique complet). Décrivez les structures de données et l'architecture pour maintenir ces rangs en temps réel.
> * **La Solution Optimale:** **Ensembles Triés Redis (ZSET) + Fenêtres Glissantes** : (1) Flux d'achats diffusé sur Apache Kafka ; (2) Tableaux de classement temps réel maintenus par des Redis Sorted Sets (`ZSET` basés sur des Skip Lists) avec opérations `ZINCRBY` et `ZREVRANK` en $O(\log N)$ ; (3) Fenêtres temporelles circulaires (60 bacs de 1 minute pour 1 heure) ; (4) Traitements par lots (Apache Flink / Spark) pour les agrégations historiques.
> * **Réalité en Production:** Algorithme Amazon Best Sellers Rank (BSR) et classements App Store.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 9.6), l'énoncé est :

*"Concevez les structures et l'architecture d'un moteur de calcul de rang des meilleures ventes e-commerce multi-categories en temps reel."*

## 2. Structures de Données et Architecture

### Ensembles Triés Redis (`ZSET`)
* Clé : `rank:categorie:fenetre` (ex. `rank:sports:24h`).
* Membre : `product_id`.
* Score : Volume cumulé des ventes.
* `ZINCRBY` : Incrémentation en temps $O(\log N)$.
* `ZREVRANGE` : Extraction du Top K en $O(\log N + K)$.
* `ZREVRANK` : Lecture de la position exacte d'un article en $O(\log N)$.

## Implémentation de Production

```java
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

public class SalesRankEngine {
    public static class ProductSales implements Comparable<ProductSales> {
        public final String productId;
        public int salesCount;

        public ProductSales(String id, int sales) {
            this.productId = id;
            this.salesCount = sales;
        }

        @Override
        public int compareTo(ProductSales other) {
            return Integer.compare(this.salesCount, other.salesCount);
        }
    }

    private final Map<String, Map<String, Integer>> categorySales = new HashMap<>();

    public synchronized void recordPurchase(String productId, String[] categories, int quantity) {
        for (String cat : categories) {
            categorySales.putIfAbsent(cat, new HashMap<>());
            Map<String, Integer> salesMap = categorySales.get(cat);
            salesMap.put(productId, salesMap.getOrDefault(productId, 0) + quantity);
        }
    }

    public synchronized PriorityQueue<ProductSales> getTopK(String category, int k) {
        Map<String, Integer> salesMap = categorySales.get(category);
        if (salesMap == null) return new PriorityQueue<>();

        PriorityQueue<ProductSales> minHeap = new PriorityQueue<>(k);

        for (Map.Entry<String, Integer> entry : salesMap.entrySet()) {
            ProductSales ps = new ProductSales(entry.getKey(), entry.getValue());
            if (minHeap.size() < k) {
                minHeap.add(ps);
            } else if (ps.salesCount > minHeap.peek().salesCount) {
                minHeap.poll();
                minHeap.add(ps);
            }
        }

        return minHeap;
    }
}
```

## Analyse de Complexité et Performance

| Opération | Complexité | Détail Technique |
|---|---|---|
| Ingestion d'Achat | `O(log N)` | Mise à jour de score dans la skip list Redis. |
| Récupération Top K | `O(log N + K)` | Parcours de plage ordonnée sur les $K$ premiers éléments. |
| Recherche de Rang | `O(log N)` | Requête de positionnement d'indice inverse. |

## Ingénierie des Systèmes en Production

### Architecture Système : Décroissance Temporelle (Amazon BSR)

1. **Pondération Exponentielle :** Les ventes récentes ont un poids supérieur aux ventes anciennes via des modèles de demi-vie ($S = \sum \text{ventes} \cdot e^{-\lambda \Delta t}$).
2. **Mise en Cache CDN du Top 100 :** 99 % des utilisateurs consultant uniquement les 100 premiers produits, la publication statique en périphérie de réseau absorbe la quasi-totalité des lectures.

## Cas Limites et Robustesse

1. **Propagation Hiérarchique :** Un achat d'un article sous « Chaussures de Course » incrémente automatiquement « Chaussures », « Sport » et le classement général.
