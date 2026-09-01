---
title: "Embeddings vectoriels expliqués : ce dont un ingénieur a vraiment besoin"
description: "Ce que les embeddings encodent, comment marche la similarité, ce que changent les dimensions, comment la recherche et le RAG s'en servent, et les erreurs qui cassent discrètement la qualité du retrieval."
date: "2026-08-01"
tags: [IA et Machine Learning]
coverImage: /assets/images/vector-embeddings-explained.webp
previewImage: /assets/images/vector-embeddings-explained.webp
---


La plupart des équipes découvrent les embeddings le jour où quelqu'un dit "mets ça dans une vector DB." Ce raccourci tient pour une démo. Il cache aussi la seule chose qui compte : un embedding est un **résumé numérique de longueur fixe du sens**, et tout système de retrieval n'est aussi bon que ce que ce résumé garde et ce qu'il jette.

Ce billet est la version ingénieur. Pas un survey de recherche. Ce que sont les embeddings, comment on les compare, ce que les dimensions veulent dire en pratique, comment la recherche et le RAG les utilisent, et les erreurs qui apparaissent une fois en prod.

Le contenu est calé début 2026. Les noms de modèles tournent. La géométrie et les modes de panne restent.

---

## La version en une ligne

Un **embedding vectoriel** est une liste de nombres (un vecteur) qui place du texte, une image, de l'audio ou un autre item dans un espace à haute dimension de façon que **les items similaires se retrouvent proches**.

"Proche" n'est pas de la poésie. C'est une distance ou un angle calculable avec des maths simples. Chercher devient "embed la query, trouve les vecteurs stockés les plus proches, renvoie leurs payloads."

```
"refund policy for annual plans"
        |
   [embedding model]
        |
  [0.12, -0.44, 0.08, ..., 0.31]   // ex. 768 ou 1536 floats
        |
  comparer à chaque vecteur de chunk
        |
  top-k chunks les plus proches → contexte de la réponse
```

C'est tout le tour de magie produit. Le reste, c'est quel modèle tu choisis, comment tu découpes, comment tu indexes, et si tu prétends que les vecteurs purs corrigent des problèmes de mots-clés qu'ils ne voient pas.

---

## Ce qu'un embedding encode vraiment

Un modèle d'embeddings est entraîné pour que les items censés être liés finissent avec des vecteurs proches. Pour le texte, "lié" mélange souvent :

* **Paraphrase sémantique :** "annuler mon abonnement" et "comment arrêter le renouvellement auto" se retrouvent proches même avec peu de mots en commun.
* **Sujet / domaine :** deux paragraphes sur le réseau Kubernetes se regroupent face à des recettes de cuisine.
* **Signal de tâche (parfois) :** les modèles entraînés pour le retrieval tirent souvent les **queries** vers les **documents qui y répondent**, pas seulement vers ceux qui répètent la query.

Ce que les embeddings **n'encodent pas** par magie :

* Les identifiants exacts qui comptent au pied de la lettre (SKU `AB-4419`, code d'erreur `E_TIMEOUT_92`, un UUID).
* Les contraintes logiques strictes ("toutes les factures de plus de 10k $ au Q3 impayées").
* Les faits frais que le modèle n'a jamais vus si tu attends que **l'embedding seul** "sache" ça (c'est le job du retrieval + générateur, pas du vecteur).
* La géométrie inter-modèles. Le vecteur A du modèle X n'est pas comparable au vecteur B du modèle Y. Espaces différents.

Pense le vecteur comme une **compression avec perte du sens pour la recherche de plus proches voisins**, pas comme une ligne de base de données ni comme l'état interne complet d'un LLM.

### Embeddings de token vs embeddings de document

Deux choses partagent le mot "embedding" et embrouillent les gens :

| Type | Ce que c'est | Où tu le vois |
| --- | --- | --- |
| **Embedding de token** | Vecteur appris pour une pièce de vocabulaire dans un transformer | Internes LLM, schémas d'entraînement |
| **Embedding de phrase / document** | Un vecteur pour toute une chaîne (ou un chunk), souvent pooling ou encodeur dédié | Recherche, clustering, RAG, recommandations |

Ce billet porte sur le second type : les vecteurs que tu stockes et interroges dans des systèmes produit. (Les embeddings de token comptent encore en dessous. Tu stockes rarement un vecteur par token pour le RAG.)

---

## Similarité : cosinus, produit scalaire, L2

Tu compares deux vecteurs avec un score. Les trois que tu verras dans chaque vector DB et SDK :

### Similarité cosinus

Mesure l'**angle** entre vecteurs. La direction compte plus que la longueur.

```
cosine(a, b) = (a · b) / (||a|| * ||b||)
```

La plage est à peu près -1 à 1 pour des embeddings réels (beaucoup de modèles texte vivent dans une bande positive plus étroite après entraînement). Plus haut = plus similaire quand tu classes par cosinus.

**Pourquoi les équipes le prennent par défaut :** la longueur du document et la magnitude de l'embedding varient ; le cosinus ignore l'échelle pure. Si tu **normalises L2** d'abord, le classement cosinus équivaut au classement par **produit scalaire**, souvent plus rapide dans les index.

### Produit scalaire (inner product)

```
dot(a, b) = sum_i a_i * b_i
```

Vecteurs normalisés : même classement que le cosinus. Sinon, les vecteurs plus longs peuvent dominer. Certains dual-encoders sont entraînés pour le maximum inner product search (MIPS). Aligne la métrique sur l'entraînement du modèle. N'assume pas.

### Distance euclidienne (L2)

```
L2(a, b) = sqrt(sum_i (a_i - b_i)^2)
```

Plus petit = plus proche. En haute dimension, avec vecteurs normalisés, les voisins L2 et cosinus coïncident souvent de près. Malgré tout : choisis une métrique, configure l'index pour elle, reste cohérent au query time.

| Métrique | Classer par | Bon défaut quand |
| --- | --- | --- |
| Cosinus | Plus haut mieux | Recherche texte générale, la plupart des API SaaS d'embeddings |
| Produit scalaire | Plus haut mieux | La fiche modèle dit MIPS / inner product ; vecteurs normalisés |
| L2 | Plus bas mieux | Certains pipelines CV classiques ; quand le produit l'utilise par défaut |

**Règle pratique :** lis la fiche du modèle d'embeddings pour la distance prévue. Normalise si tu utilises le cosinus. Ne mélange jamais les métriques entre build et query.

---

## Dimensions : ce que le nombre t'achète

Tailles courantes dans les stacks produit 2025-2026 : **384, 512, 768, 1024, 1536, 3072** (et bizarreries selon le modèle). La dimension est la longueur de la liste de floats.

### Ce que des dimensions plus élevées tendent à signifier

* **Plus de capacité** pour séparer des nuances fines (en théorie).
* **Plus de stockage et de RAM** par vecteur (et overhead du graphe ANN).
* **Un peu plus de calcul** par distance (rarement ton premier goulot ; index + I/O souvent oui).
* **Pas une montée gratuite en qualité.** Un bon modèle open en 768-d peut battre un usage paresseux d'un gros vecteur commercial si tes chunks et ton eval sont meilleurs.

### Matryoshka et troncature

Certains modèles sont entraînés pour que les **N premières dimensions** restent un embedding utilisable (style Matryoshka). Tu peux stocker 256-d pour des candidats bon marché et la dim pleine pour le rerank, ou couper le stockage sans tout réentraîner. Ne tronque que si la doc le dit. Couper un modèle au hasard en deux n'est pas le même tour.

### Calcul rapide de stockage

Octets approx. par vecteur (float32, hors overhead d'index) :

```
bytes ≈ dimensions * 4
```

Exemples pour **1 million** de chunks :

| Dims | Vecteurs bruts (approx.) | Réalité HNSW / metadata |
| --- | --- | --- |
| 384 | ~1.5 Go | Souvent plusieurs Go une fois indexé |
| 768 | ~3 Go | Prévois plusieurs Go de RAM/disque |
| 1536 | ~6 Go | Stockage et p95 de latence apparaissent |
| 3072 | ~12 Go | OK pour petits corpus ; douloureux à très grande échelle sans quantification |

La quantification (int8, binaire, product quant) échange qualité contre mémoire. Mesure sur **ton** jeu d'eval avant de fêter le ratio de compression.

---

## Comment la recherche et le RAG utilisent les embeddings

### Recherche sémantique / vectorielle

1. Découpe et embed le corpus offline (ou à l'écriture).
2. Stocke les vecteurs dans un index ANN (HNSW, IVF, variantes disque, vector DB managés).
3. Au query time, embed la query utilisateur avec le **même** modèle (ou l'encodeur query pairé si asymétrique).
4. Récupère les top-k voisins, attache texte et metadata d'origine, renvoie ou passe en aval.

ANN veut dire nearest neighbor **approximatif**. Tu échanges un peu de recall contre de la vitesse à l'échelle. Pour la plupart des corpus produit, c'est le bon trade. Pour un tout petit corpus, la recherche exacte suffit et se raisonne mieux.

### RAG (retrieval-augmented generation)

Le RAG, c'est de la recherche vectorielle (souvent **plus** de la recherche par mots-clés) qui alimente un LLM :

```
Question utilisateur
    → embed la query
    → récupère top-k chunks (dense ± sparse)
    → rerank optionnel
    → injecte les chunks dans le prompt
    → le LLM répond avec ce contexte
```

Le modèle d'embeddings ne "répond" pas. Il **sélectionne des preuves**. Si le bon chunk n'entre jamais dans le top-k, le générateur improvise avec une meilleure prose.

Le retrieval hybride est le défaut ennuyeux des apps sérieuses : vecteurs denses pour la paraphrase, BM25/sparse pour les tokens exacts et termes rares, puis fusion (par ex. Reciprocal Rank Fusion) et parfois rerank avec un cross-encoder.

### Autres usages produit (même géométrie)

* **Dédup / quasi-doublons** de tickets, annonces ou macros support
* **Clustering** de feedback ou notes d'incidents
* **Recommandations** ("plus comme ça")
* **Routage de modération** (embed le texte, bucket de politique le plus proche)

Mêmes mises en garde : métrique, version de modèle et évaluation décident si c'est utile ou du théâtre.

---

## Choisir et opérer un modèle

Checklist qui survit au churn des vendors :

* **Même modèle (et version) pour index et query**, sauf paire asymétrique entraînée exprès ainsi.
* **Longueur max d'entrée** ≥ taille de tes chunks. La troncature silencieuse est un bug de qualité silencieux.
* **Couverture linguistique** de tes utilisateurs, pas seulement les benchmarks anglais.
* **Adéquation domaine.** Code, juridique et biomédical ont souvent besoin d'embedders spécialisés ou fine-tunés.
* **Latence et coût** à ton QPS, cold starts inclus si tu self-hostes.
* **Épingle la version.** "Latest" en prod, c'est une migration surprise de re-embed.
* **Garde le texte brut à côté du vecteur.** Tu en as besoin pour prompts, citations, debug et réindexation.

Re-embedder est une **migration** : dual-write ou index blue/green, backfill, bascule des lectures, suppression de l'ancien espace. Budgète-le comme un changement de schéma, pas un flip de config.

---

## Erreurs courantes (celles qui brûlent des sprints)

### 1. Mauvais chunks, blâme sur le modèle

Les embeddings scorent l'unité que tu as stockée. Coupures en milieu de phrase, tableaux en miettes et blobs de 4k tokens donnent de faibles voisins. Corrige chunking et metadata avant de changer de fournisseur.

### 2. Un modèle dans la doc, un autre sur le chemin query

Le staging utilisait le modèle A. La prod avait encore le modèle B d'un spike. Les scores ont l'air aléatoires. Verrouille le model id en config et assert au boot.

### 3. Mauvaise métrique de similarité

Index construit pour le cosinus, queries scorées en L2 sans la normalisation qui va (ou l'inverse). Le ranking bouge d'une façon qui ressemble à "l'ANN est cassé."

### 4. Vecteurs seuls pour des IDs exacts

Les utilisateurs cherchent `INC-20481` ou un nom de fonction. Le retrieval dense paraphrase ; il ne garantit pas les hits lexicaux. Ajoute keyword/sparse ou des filtres structurés.

### 5. Ignorer filtres et ACL

Le plus proche voisin sur tout le corpus renvoie le bon doc pour le mauvais tenant. Les filtres metadata (tenant, version produit, langue, ACL) appartiennent au plan de retrieval, pas en afterthought dans le prompt.

### 6. Cargo cult du top-k

`k=5` pour toujours. Parfois il faut 20 candidats vers un reranker. Parfois 3 chunks serrés battent 15 bruités qui remplissent la fenêtre de contexte. Tune avec un jeu d'eval, pas au feeling.

### 7. Pas de harness d'évaluation

Sans queries labellisées (ou au moins un golden set fixe), chaque changement est du storytelling. Suis les métriques de retrieval (recall@k, MRR) et la qualité de réponse de bout en bout séparément. Le retrieval peut être bon et la génération mauvaise, et l'inverse.

### 8. Traiter la dimension comme un curseur de qualité

Doubler les dimensions sans mesurer ne répare ni le bilingue, ni les docs périmés, ni les ACL manquantes. Mesure.

### 9. Oublier normalisation et vecteurs en double

Setups cosinus non normalisés, ou le même paragraphe embeddix fois par un mauvais ingest, polluent la liste de voisins. Dédup à l'écriture. Normalise quand ta métrique l'attend.

### 10. Attendre que les embeddings remplacent les features de ranking

Click-through, récence, autorité et règles métier comptent encore. Les vecteurs sont un signal. Les stacks de recherche prod les mélangent exprès.

---

## Un modèle mental minimal à garder

1. **Embed** = projeter des items dans un espace vectoriel partagé.
2. **Similarité** = angle ou distance dans cet espace (choisis-en une, reste cohérent).
3. **Dimension** = levier de capacité et de coût, pas un score magique de qualité.
4. **Recherche / RAG** = plus proches voisins comme preuves candidates, souvent hybride, souvent reranké.
5. **Qualité** = chunking + modèle + métrique + filtres + eval. En rate une et la démo a encore l'air bien jusqu'à l'arrivée des vrais utilisateurs.

Si tu ne retiens qu'une phrase : **les embeddings transforment "trouver un sens lié" en géométrie, et ton système doit encore choisir les bonnes unités, la bonne métrique et les bons candidats avant qu'un LLM rédige une réponse soignée.**

Ça suffit pour dessiner un chemin de retrieval, lire une fiche modèle sans décrocher, et pousser quand quelqu'un traite une base vectorielle comme un substitut à la réflexion produit.

