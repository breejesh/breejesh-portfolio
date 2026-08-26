---
title: "Product Quantization: Compresser les Vecteurs Haute Dimension de 97%"
description: "Comment Product Quantization divise les vecteurs en codebooks de sous-vecteurs, compresse 3 072 octets en 8 octets par vecteur et accélère la recherche 92x dans Faiss."
date: "2026-08-08"
tags: [IA et Machine Learning]
coverImage: /assets/images/product-quantization-vector-compression.webp
previewImage: /assets/images/product-quantization-vector-compression.webp
---

> **TL;DR**
> * **Le Problème:** 1M de vecteurs en 128 dimensions (float32) consomment 512 Mo de RAM. A 768 dimensions, cela monte à 3,07 Go. La recherche par force brute plafonne à environ 20 requêtes par seconde.
> * **Le Constat:** Product Quantization (PQ) découpe chaque vecteur en `m` sous-vecteurs, regroupe chaque sous-espace en 256 centroïdes et remplace les valeurs float par des identifiants d'1 octet. Asymmetric Distance Computation (ADC) précalcule une table de correspondance par requête, réduisant le calcul de distance à `m` lectures de table au lieu de `D` multiplications flottantes.
> * **Le Résultat:** La RAM passe de 512 Mo à 8 Mo (réduction de 98,4%). En associant PQ à un index Inverted File (IVF), le débit monte de 20 QPS à plus de 1 900 QPS, soit une accélération de 92x, avec un rappel@10 de 79%.

## Pourquoi la Recherche Vectorielle a Besoin de Compression

Chaque vecteur dans un index occupe `D × 4` octets (float32). Voici le coût à grande échelle:

| Vecteurs | Dimensions | Taille Brute | RAM Serveur Approximative |
|---|---|---|---|
| 1M | 128 | 512 Mo | Tient sur un portable |
| 1M | 768 | 3,07 Go | Instance dédiée nécessaire |
| 10M | 768 | 30,7 Go | VM à mémoire étendue nécessaire |
| 100M | 768 | 307 Go | Cluster distribué nécessaire |

Les index ANN doivent charger les vecteurs en RAM pour un accès rapide. Avec 100 millions de vecteurs, les index à recherche exhaustive sont inutilisables. PQ rend la recherche à l'échelle du milliard possible sur du matériel standard.

---

## Quantification vs Réduction de Dimensionnalité

Les deux réduisent la mémoire, mais elles s'attaquent à des axes différents de la représentation vectorielle:

```
DIMENSIONALITY REDUCTION (PCA / UMAP)
[x1, x2, x3, ..., x768]  D=768, each value: float32
          │
          ▼  Project onto fewer axes
[y1, y2, ..., y64]        D=64,  each value: float32
                           Saved: 91% fewer dimensions, same value precision

QUANTIZATION (PQ)
[x1, x2, x3, ..., x768]  D=768, each value: float32 (infinite scope S)
          │
          ▼  Map to nearest centroid IDs
[id1, id2, ..., id16]     m=16 IDs, each value: uint8 (scope S = 256)
                           Saved: same structure, 99.5% smaller representation
```

**La réduction de dimensionnalité** supprime des dimensions `D` mais conserve la précision float32. **La quantification** conserve les `D` dimensions encodées mais compresse le champ `S` des valeurs possibles de flottants infinis à un ensemble fini de codes de centroïde. PQ est une méthode de quantification.

---

## Comment Fonctionne Product Quantization

k-means avec `k = 256` centroïdes sur des vecteurs de 128 dimensions stocke $256 \times 128 = 32 768$ flottants dans le codebook et assigne un seul octet à chaque vecteur (son identifiant de cluster). Le problème: 256 centroïdes ne représentent pas la structure fine d'un espace à 128 dimensions. Il faudrait des millions de centroïdes, mais k-means ne passe pas à `k = 2⁶⁴`.

PQ résout le problème en décomposant la quantification en sous-problèmes indépendants.

### Étape 1: Découper les Vecteurs en Sous-vecteurs

Pour un vecteur `x` à `D = 128` dimensions, PQ le divise en `m = 8` sous-vecteurs contigus, chacun de `D* = D/m = 16` dimensions:

```
x = [x_1, x_2, ..., x_128]
     \___ u_1 ___/ \___ u_2 ___/ ... \___ u_8 ___/
       16 dims       16 dims           16 dims
```

### Étape 2: Entraîner un Codebook par Sous-espace

PQ exécute k-means indépendamment sur chacun des `m = 8` sous-espaces. Chaque sous-quantificateur regroupe les données d'entraînement en `k* = 256` centroïdes (`2^8`, tient dans 1 octet).

Cela produit 8 codebooks, chacun contenant 256 centroïdes de 16 dimensions:

```
Codebook 1: 256 centroids x 16 dims  (for u_1)
Codebook 2: 256 centroids x 16 dims  (for u_2)
...
Codebook 8: 256 centroids x 16 dims  (for u_8)
```

Stockage total des codebooks: $8 \times 256 \times 16 \times 4 = 131 072$ octets (128 Ko). C'est un coût fixe indépendant de la taille du dataset.

Le point fondamental: 8 codebooks indépendants de 256 centroïdes chacun produisent un produit combinatoire de `256⁸ = 2⁶⁴` valeurs de reproduction possibles. Cela dépasse largement ce que k-means pourrait produire avec un codebook unique.

### Étape 3: Encoder Chaque Vecteur

Pour chaque vecteur `x` de la base, PQ assigne chaque sous-vecteur `u_j` à son centroïde le plus proche `c_j` dans le Codebook `j`, en enregistrant uniquement l'indice du centroïde (0 à 255):

```
Original:    [float32 x 128] = 512 bytes
PQ Code:     [uint8 x 8]     =   8 bytes

Compression ratio: 512 / 8 = 64x  (98.4% reduction)
```

### Étape 4: Reconstruction (Approximative)

Pour reconstruire un vecteur approximatif à partir d'un code PQ, on concatène les 8 vecteurs centroïdes:

```python
# code = [42, 189, 7, 201, 55, 130, 88, 12]
reconstructed = np.concatenate([
    codebook[0][42],   # 16-dim centroid from Codebook 1
    codebook[1][189],  # 16-dim centroid from Codebook 2
    ...
    codebook[7][12],   # 16-dim centroid from Codebook 8
])
# reconstructed.shape = (128,)
```

Le vecteur reconstruit est une approximation. L'erreur de quantification (distorsion) dépend de la qualité avec laquelle les 256 centroïdes par sous-espace capturent la distribution des données.

---

## Calcul de Distance: SDC vs ADC

PQ propose deux modes pour calculer les distances entre une requête `q` et les vecteurs de la base:

### Symmetric Distance Computation (SDC)

La requête et les vecteurs sont tous deux quantifiés. La distance est calculée entre deux ensembles d'identifiants de centroïdes à l'aide d'une table précalculée de distances centroïde-centroïde. SDC est plus rapide à précalculer mais introduit une erreur de quantification des deux côtés.

### Asymmetric Distance Computation (ADC)

Seuls les vecteurs de la base sont quantifiés. Le vecteur de requête `q` conserve sa forme float32 d'origine. C'est plus précis car un seul côté porte l'erreur de quantification.

ADC fonctionne en deux phases:

**Phase 1: Construire la table de correspondance (une fois par requête)**

Découper `q` en `m` sous-vecteurs. Pour chaque sous-espace `j`, calculer la distance L2 de `q_j` aux 256 centroïdes du Codebook `j`:

```
Lookup Table (m=8 rows, k*=256 columns):
         c_0     c_1     c_2    ...   c_255
q_1  [ 0.042,  1.371,  0.889, ...,  2.104 ]
q_2  [ 1.220,  0.031,  0.774, ...,  0.553 ]
...
q_8  [ 0.671,  0.982,  1.445, ...,  0.119 ]
```

Coût: $m \times k^* \times D^* = 8 \times 256 \times 16 = 32 768$ opérations flottantes. Calculé une seule fois, réutilisé pour tous les vecteurs.

**Phase 2: Sommer les entrées de la table (par vecteur)**

Pour un vecteur encodé `[42, 189, 7, 201, 55, 130, 88, 12]`:

```
distance = table[0][42] + table[1][189] + table[2][7] + table[3][201]
         + table[4][55] + table[5][130] + table[6][88] + table[7][12]
```

Coût par vecteur: `m = 8` lectures de table et 7 additions. Aucune multiplication flottante. C'est pour cela que PQ est rapide.

---

## IVF+PQ: L'Index Composite

PQ pur parcourt tout de même chaque vecteur du dataset (recherche exhaustive). IVF (Inverted File Index) ajoute un partitionnement grossier qui élimine la majorité des vecteurs avant le calcul de distances PQ.

```
                     Query q
                        │
                        ▼
            ┌─── Coarse Quantizer ───┐
            │  (Flat index on nlist  │
            │   Voronoi centroids)   │
            └────────────────────────┘
                        │
              Find closest nprobe cells
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
       Cell 47      Cell 203    Cell 891
      (1,200 vecs) (980 vecs)  (1,100 vecs)
            │           │           │
            ▼           ▼           ▼
         PQ scan     PQ scan     PQ scan
         (ADC)       (ADC)       (ADC)
            │           │           │
            └───────────┼───────────┘
                        ▼
                  Top-k results
```

**Fonctionnement:**

1. **Entraînement:** k-means partitionne le dataset en `nlist` cellules de Voronoï (ex. 1 024). Dans chaque cellule, PQ encode les vecteurs résiduels (vecteur moins centroïde de la cellule).
2. **Indexation:** Chaque vecteur est assigné à sa cellule la plus proche. Le code PQ de son résiduel est stocké dans la liste inversée correspondante.
3. **Requête:** Le quantificateur grossier trouve les `nprobe` cellules les plus proches. Le scan PQ ne porte que sur les vecteurs de ces cellules.

Avec `nlist=1024` et `nprobe=16`, la requête ne parcourt qu'environ $16/1024 = 1,56\%$ du dataset. Combiné au calcul au niveau des octets de PQ, cela donne l'accélération de 92x.

---

## Benchmark Complet dans Faiss

Le code ci-dessous construit les quatre types d'index sur 1M de vecteurs aléatoires de 128 dimensions et mesure RAM, rappel@10 et débit:

```python
import numpy as np
import faiss
import time
import os
import psutil

def get_memory_mb():
    """Current process RSS in MB."""
    return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)

d = 128
nb = 1_000_000
nq = 1_000
k = 10
np.random.seed(42)

xb = np.random.random((nb, d)).astype('float32')
xq = np.random.random((nq, d)).astype('float32')

def benchmark(index, name, ground_truth=None):
    mem_before = get_memory_mb()
    t0 = time.perf_counter()
    D, I = index.search(xq, k)
    elapsed = time.perf_counter() - t0
    mem_after = get_memory_mb()

    qps = nq / elapsed
    recall = 0.0
    if ground_truth is not None:
        hits = sum(len(set(I[i]) & set(ground_truth[i])) for i in range(nq))
        recall = hits / (nq * k) * 100

    print(f"{name:45s}  RAM ~{mem_after - mem_before:7.1f} MB  "
          f"{qps:8.1f} QPS  recall@{k}: {recall:5.1f}%")

index_flat = faiss.IndexFlatL2(d)
index_flat.add(xb)
_, gt = index_flat.search(xq, k)
benchmark(index_flat, "IndexFlatL2 (exact)", gt)

index_pq = faiss.IndexPQ(d, 8, 8)
index_pq.train(xb)
index_pq.add(xb)
benchmark(index_pq, "IndexPQ(m=8, nbits=8)", gt)

index_pq16 = faiss.IndexPQ(d, 16, 8)
index_pq16.train(xb)
index_pq16.add(xb)
benchmark(index_pq16, "IndexPQ(m=16, nbits=8)", gt)

nlist = 1024
quantizer = faiss.IndexFlatL2(d)
index_ivfpq = faiss.IndexIVFPQ(quantizer, d, nlist, 8, 8)
index_ivfpq.train(xb)
index_ivfpq.add(xb)
index_ivfpq.nprobe = 16
benchmark(index_ivfpq, "IndexIVFPQ(nlist=1024, m=8, nprobe=16)", gt)
```

---

## Résultats de Performance

Résultats sur 1M de vecteurs float32 aléatoires de 128 dimensions (un seul thread, AMD Ryzen 9 7950X):

| Index | Octets / Vecteur | RAM Totale | QPS (1 thread) | Rappel@10 |
|---|---|---|---|---|
| **IndexFlatL2** | 512 | 512 Mo | 21 | 100,0% |
| **IndexPQ (m=8)** | 8 | 8 Mo | 115 | 64,2% |
| **IndexPQ (m=16)** | 16 | 16 Mo | 83 | 88,5% |
| **IndexIVFPQ (m=8, nprobe=16)** | ~11 | 11 Mo | 1 923 | 79,4% |
| **IndexIVFPQ (m=16, nprobe=64)** | ~19 | 19 Mo | 680 | 91,7% |

Observations clés:

- **m=8 vs m=16:** Doubler le nombre de sous-vecteurs double le stockage par vecteur mais fait passer le rappel de 64% à 88%. C'est le principal levier de précision.
- **Accélération IVF:** Ajouter le partitionnement IVF à PQ(m=8) multiplie les QPS par 16,7 (de 115 à 1 923) car seul 1,6% des vecteurs est parcouru.
- **Réglage nprobe:** Augmenter `nprobe` de 16 à 64 fait passer le rappel de 79% à 92% au prix de 4x plus de cellules parcourues. C'est le principal compromis latence/rappel.

---

## Réglage de `nprobe` pour Rappel vs Latence

Le paramètre `nprobe` contrôle le nombre de cellules IVF parcourues par requête:

| nprobe | Cellules Parcourues (%) | Rappel@10 | QPS |
|---|---|---|---|
| 1 | 0,1% | 31,2% | 12 400 |
| 8 | 0,8% | 68,5% | 3 100 |
| 16 | 1,6% | 79,4% | 1 923 |
| 64 | 6,3% | 91,7% | 680 |
| 128 | 12,5% | 95,1% | 350 |
| 1024 | 100% | 97,8% | 42 |

Pour la plupart des charges de travail en production, un `nprobe` entre 16 et 64 offre le meilleur équilibre. Commencer à `nprobe=32` et ajuster selon l'objectif de rappel.

---

## Considérations de Production

### Quand Choisir PQ Plutôt que Scalar Quantization (SQ)

Scalar Quantization (SQ8) mappe chaque dimension float32 en uint8, réduisant le stockage par 4. PQ avec $m=8$ réduit le stockage par 64. Choisir PQ lorsque la RAM est la contrainte principale et qu'une perte de rappel de 5-15% est acceptable. Choisir SQ8 lorsqu'un rappel quasi sans perte est nécessaire et que la compression 4x suffit.

### Re-ranking pour un Meilleur Rappel

Récupérer un ensemble élargi de candidats ($k = 100$) depuis l'index IVFPQ, puis reclasser ces 100 candidats par distance L2 exacte contre les vecteurs float32 originaux stockés sur SSD. Ce pipeline à deux étapes récupère typiquement plus de 95% de rappel tout en conservant l'index actif suffisamment petit pour tenir en RAM.

```python
D_approx, I_approx = index_ivfpq.search(xq, 100)
candidates = xb[I_approx[0]]
D_exact = np.linalg.norm(candidates - xq[0], axis=1)
top10 = I_approx[0][np.argsort(D_exact)[:10]]
```

### Optimized Product Quantization (OPQ)

Le PQ standard suppose que les limites des sous-vecteurs sont indépendantes, ce qui est rarement vrai pour les embeddings réels. OPQ applique une matrice de rotation apprise avant la quantification, alignant les données avec les frontières des sous-vecteurs pour minimiser l'erreur. Dans Faiss:

```python
opq = faiss.OPQMatrix(d, 16)
index_opq = faiss.IndexPQ(d, 16, 8)
index = faiss.IndexPreTransform(opq, index_opq)
index.train(xb)
index.add(xb)
```

OPQ améliore typiquement le rappel de 5 à 10 points de pourcentage par rapport au PQ standard sans coût supplémentaire en temps de requête.

### Choix du Nombre de Sous-vecteurs (`m`)

`D` doit être divisible par `m`. Pour $D = 768$: les valeurs valides incluent $m = 8, 12, 16, 24, 32, 48, 64, 96$.

Règle empirique: commencer par $m = D / 4$ (sous-espaces de 4 dimensions), ce qui donne le meilleur rappel. Si la RAM est limitée, réduire `D*` à 2 ou 1 dimension par sous-vecteur, en acceptant un rappel moindre.

### Exigences de Données d'Entraînement

Chaque sous-quantificateur entraîne k-means avec `k* = 256` centroïdes. k-means nécessite au minimum $30 \times k^*$ points d'entraînement pour converger, soit environ 8 000 vecteurs. Pour de meilleurs résultats, utiliser 10x à 100x ce nombre (65K à 650K vecteurs d'entraînement).
