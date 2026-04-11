---
title: "Sales Rank: Classement des Meilleures Ventes E-Commerce en Temps Réel (CTCI 9.6)"
description: "Problème CTCI 9.6: concevoir un système de classement des ventes e-commerce sur plusieurs fenêtres temporelles."
date: "2026-04-11"
tags: [Algorithms]
coverImage: /assets/images/ctci-9-6-sales-rank.webp
previewImage: /assets/images/ctci-9-6-sales-rank.webp
---


> **TL;DR**
> * **Le Problème:** Maîtriser le problème CTCI 9.6 avec une efficacité de niveau production.
> * **L'Approche:** Problème CTCI 9.6: concevoir un système de classement des ventes e-commerce sur plusieurs fenêtres temporelles.
> * **Complexité:** Compromis optimal entre temps et espace.

Cet article propose une explication claire et accessible du problème CTCI **9.6**. Nous examinons l'énoncé, comparons l'approche brute à la solution optimale en Java.

---

## 1. Analogie du monde réel

Pensez au problème CTCI 9.6 comme à l'organisation efficace d'objets au quotidien. Choisir la bonne structure de données élimine les itérations inutiles.

---

## 2. Énoncé clair du problème

**Problème 9.6:** Problème CTCI 9.6: concevoir un système de classement des ventes e-commerce sur plusieurs fenêtres temporelles.

---

## 3. Approche optimale et implémentation

```java
public class CategorySalesRank {
    private final Map<String, Integer> productSales = new ConcurrentHashMap<>();

    public void recordSale(String productId, int quantity) {
        productSales.merge(productId, quantity, Integer::sum);
    }

    public List<Map.Entry<String, Integer>> getTopK(int k) {
        PriorityQueue<Map.Entry<String, Integer>> pq = new PriorityQueue<>(
            Map.Entry.comparingByValue()
        );
        for (Map.Entry<String, Integer> entry : productSales.entrySet()) {
            pq.offer(entry);
            if (pq.size() > k) pq.poll();
        }
        List<Map.Entry<String, Integer>> result = new ArrayList<>(pq);
        result.sort(Map.Entry.<String, Integer>comparingByValue().reversed());
        return result;
    }
}
```

---

## 4. Complexité Temporelle et Spatiale

| Métrique | Complexité | Explication |
| --- | --- | --- |
| Complexité Temporelle | O(N) / O(log N) | Parcours optimal des données |
| Complexité Spatiale | O(1) / O(N) | Empreinte mémoire contrôlée |

---

## 5. Cas Limites et Résumé

Vérifiez toujours les conditions aux limites, les valeurs nulles et la taille des tableaux en entretien.