---
title: "URLs en Doublon: Déduplication de 10 Milliards d'URLs à Grande Échelle (CTCI 9.4)"
description: "Concevez des algorithmes scalables pour détecter les doublons parmi 10 milliards d'URLs via partitionnement disque, MapReduce et filtres de Bloom."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-9-4-duplicate-urls.webp
previewImage: /assets/images/ctci-9-4-duplicate-urls.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Vous disposez d'une liste de 10 milliards d'URLs. Comment détectez-vous les doublons ?
> * **La Solution Optimale:** Trois Architectures selon les Contraintes Matérielles : (1) **Filtre de Bloom en Mémoire Vive** : Avec un taux de faux positifs de 0,1 %, il requiert $18\text{ Go}$ de RAM, tenant sur un unique serveur de 32 Go ; (2) **Partitionnement Disque Externe** : Hacher les URLs en 4 000 fichiers de 250 Mo via `hash(URL) % 4000`, puis dédupliquer chaque bloc dans un `HashSet` en RAM ; (3) **Cluster MapReduce Distribué** : Émettre `(hash(url), url)` et dédupliquer dans la phase de réduction.
> * **Réalité en Production:** Déduplication dans les moteurs de recherche et ingestion de logs dans Snowflake / BigQuery.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 9.4), l'énoncé est :

*"Comment detecter et eliminer efficacement les doublons au sein d'une collection de 10 milliards d'URLs ?"*

## 2. Évaluation de l'Échelle

* **Nombre d'URLs :** $10^{10}$.
* **Longueur Moyenne :** 100 octets.
* **Volume Brut :** $10^{10} \times 100\text{ octets} = 1\text{ To}$.

1 To dépassant la RAM d'une machine standard (32-64 Go), nous explorons trois solutions adaptées.

---

### Solution 1 : Découpage Externe sur Disque
1. Lire le fichier de 1 To séquentiellement.
2. Calculer $k = \text{hash}(\text{URL}) \pmod{4000}$.
3. Écrire l'URL dans le fichier intermédiaire $F_k$ ($\approx 250\text{ Mo}$).
4. Traiter chaque fichier $F_k$ successivement dans un `HashSet<String>` en RAM.

---

### Solution 2 : MapReduce Distribué
* **Map :** Émet `(hash(url), url)`.
* **Shuffle :** Regroupe les clés identiques sur le même nœud réducteur.
* **Reduce :** Élimine les doublons et persiste les URLs uniques.

---

### Solution 3 : Filtre de Bloom Probabiliste
Pour $10^{10}$ entrées avec $p = 0{,}001$ :
$$m \approx 14{,}4 \times 10^{10}\text{ bits} \approx 18\text{ Go RAM}$$

Cette structure tient dans 32 Go de RAM pour une vérification en sous-microseconde.

## Implémentation de Production

```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

public class DuplicateUrlDetector {
    private static final int NUM_BUCKETS = 4000;

    public static void splitIntoBuckets(String inputFilePath, String tempDir) throws IOException {
        BufferedWriter[] writers = new BufferedWriter[NUM_BUCKETS];
        for (int i = 0; i < NUM_BUCKETS; i++) {
            writers[i] = new BufferedWriter(new FileWriter(new File(tempDir, "bucket_" + i + ".txt")));
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(inputFilePath))) {
            String url;
            while ((url = reader.readLine()) != null) {
                int bucketIndex = Math.abs(url.hashCode() % NUM_BUCKETS);
                writers[bucketIndex].write(url);
                writers[bucketIndex].newLine();
            }
        } finally {
            for (BufferedWriter w : writers) {
                if (w != null) w.close();
            }
        }
    }

    public static void processBuckets(String tempDir, BufferedWriter outputWriter) throws IOException {
        for (int i = 0; i < NUM_BUCKETS; i++) {
            File bucketFile = new File(tempDir, "bucket_" + i + ".txt");
            if (!bucketFile.exists()) continue;

            Set<String> uniqueUrls = new HashSet<>();
            try (BufferedReader reader = new BufferedReader(new FileReader(bucketFile))) {
                String url;
                while ((url = reader.readLine()) != null) {
                    if (uniqueUrls.add(url)) {
                        outputWriter.write(url);
                        outputWriter.newLine();
                    }
                }
            }
            bucketFile.delete();
        }
    }
}
```

## Analyse de Complexité et Architecture

| Métrique | Complexité | Détail Technique |
|---|---|---|
| E/S Disque (1 Machine) | `O(N)` | 2 passes séquentielles complètes sur le disque. |
| Temps MapReduce | `O(N / M)` | Scalabilité linéaire avec $M$ nœuds de calcul. |
| Empreinte Filtre de Bloom | `18 Go` | Tient dans la mémoire RAM d'un serveur unique. |

## Ingénierie des Systèmes en Production

### Architecture Système : Moteurs de Déduplication

1. **Ingestion Télémetrique (Snowflake / BigQuery) :** Algorithmes d'agrégation externe par hachage pour éliminer les événements redondants.
2. **Listes Noires DNS :** Consultation ultra-rapide par filtre de Bloom avant accès disque.

## Cas Limites et Robustesse

1. **Déséquilibre de Hachage :** Si un fichier intermédiaire dépasse 500 Mo, un sous-découpage récursif est appliqué.
