---
title: "Concevoir un système d'autocomplétion de recherche : comment le typeahead marche vraiment"
description: "Autocomplétion de recherche pour débutants : préfixes, arbre de lettres (trie), meilleures suggestions, pourquoi on précalcule les réponses, et une marche lettre par lettre en tapant din."
date: "2025-11-14"
tags: [Design Système et Architecture]
coverImage: /assets/images/design-search-autocomplete.webp
previewImage: /assets/images/design-search-autocomplete.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Autocomplétion de recherche pour débutants : préfixes, arbre de lettres (trie), meilleures suggestions, pourquoi on précalcule les réponses, et une marche lettre par lettre en tapant din.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Vous utilisez déjà l'autocomplétion de recherche tous les jours. Ouvrez Google, Amazon ou les messages du téléphone. Vous tapez quelques lettres, et une courte liste de phrases finies apparaît avant d'appuyer sur Entrée. Ce menu déroulant n'est pas de la magie. C'est un petit système avec un seul travail : **étant donné les lettres déjà tapées, renvoyer quelques bonnes requêtes, très vite.**

Pensez aux **suggestions du clavier du téléphone**. Pendant que vous tapez `din`, le clavier essaie de finir le mot pour vous. Ou pensez à un **dictionnaire qui ne regarde que le début des mots**, pas le milieu, et vous tend d'abord les correspondances les plus courantes. C'est le modèle mental de tout ce design.

Ce billet enseigne l'autocomplétion comme je l'expliquerais au tableau à quelqu'un qui n'a jamais construit de recherche. Langage simple, un petit exemple (`din`), et seulement les idées utiles pour un entretien ou une première version en production.

---

## Ce que l'on construit (et ce que l'on ne construit pas)

**Dans le périmètre**

1. L'utilisateur tape un **préfixe** (le début d'une requête).
2. Le système renvoie les **top k** suggestions (souvent 5 à 10).
3. Les suggestions sont classées surtout selon **combien de fois les gens les ont cherchées**.
4. La réponse doit sembler instantanée (cible indicative : sous environ **100ms**).
5. On garde la liste raisonnablement à jour à partir des logs de recherche réels.

**Hors périmètre sauf si on le demande**

- Ranking façon Google avec apprentissage automatique
- Correction de typos (`dinnr` → `dinner`)
- Trouver des correspondances au milieu d'une phrase
- Listes personnalisées "rien que pour vous"

Nommez-les à voix haute en entretien pour ne pas finir dans un article de recherche.

---

## Commencez par un mot : préfixe

Un **préfixe** est simplement le début d'une chaîne.

| Vous avez tapé | C'est le préfixe de |
| --- | --- |
| `d` | `dinner`, `dinosaur`, `doctor`, ... |
| `di` | `dinner`, `dinosaur`, `diners near me`, ... |
| `din` | `dinner recipes`, `dinosaur`, `diners near me`, ... |
| `dino` | `dinosaur`, `dinosaur toys`, ... |

L'autocomplétion signifie presque toujours une **correspondance de préfixe depuis le début**, pas "trouve ce morceau n'importe où".

Si le produit n'a besoin que de ça, dites-le. La correspondance en milieu de chaîne est un autre problème, plus dur.

---

## Pourquoi une simple liste de mots ne suffit pas

Imaginez que vous stockez chaque recherche populaire dans une grande table :

```
query                 times_searched
------------------------------------
dinner recipes        98012
dinosaur              77120
diners near me        54001
doctor near me        41000
... des millions d'autres ...
```

Une réponse naïve pour le préfixe `din` :

```sql
SELECT query
FROM queries
WHERE query LIKE 'din%'
ORDER BY times_searched DESC
LIMIT 5;
```

Ça marche en démo sur un laptop. À vraie échelle, chaque frappe peut devenir une requête, et des dizaines de milliers de requêtes par seconde peuvent arriver. Scanner ou trier une table géante pour chaque lettre est trop lent et trop cher.

Il nous faut une structure faite pour **parcourir les lettres une par une**.

---

## L'idée du clavier téléphone : un arbre de lettres

Voici l'image centrale.

Imaginez un **arbre**. La racine est vide (vous n'avez rien tapé). Chaque pas vers le bas est une lettre. Les débuts partagés partagent le même chemin.

Cet arbre s'appelle un **trie** (on prononce "try"). On l'appelle aussi **arbre de préfixes**.

Minuscule dictionnaire : `be`, `bee`, `beer`, `best`, `bet`.

```
        (root)
          |
          b
          |
          e
       /  |  \
      e   s   t
      |   |
      r   t
```

Comment le lire :

- Le chemin `b → e` est le préfixe `be`.
- Le chemin `b → e → e → r` est le mot `beer`.
- Les mots qui partagent un début partagent des nœuds, donc vous ne stockez pas les lettres de `be` trois fois séparément pour `be`, `bee` et `beer`.

Même idée que les suggestions clavier : le clavier ne relit pas tout le dictionnaire de A à Z pour chaque lettre. Il suit le chemin des lettres déjà tapées, puis regarde ce qui peut encore grandir à partir de là.

---

## Marche en tapant `din` lettre par lettre

Supposons que les requêtes populaires qui commencent par `d` incluent :

- `dinner recipes` (score 98012)
- `dinosaur` (score 77120)
- `diners near me` (score 54001)
- `doctor near me` (score 41000)
- `disney movies` (score 39000)

**Étape 1 : l'utilisateur tape `d`**

Le serveur marche un bord : racine → `d`.

Tout ce qui est sous `d` est candidat : dinner, dinosaur, doctor, disney, et plus. Si on listait *tout*, la liste serait énorme. Donc on ne garde que les **quelques meilleures** pour ce préfixe (on y revient). Peut-être :

```
prefix "d" → dinner recipes, dinosaur, diners near me, doctor near me, disney movies
```

**Étape 2 : l'utilisateur tape `i` (maintenant `di`)**

Marche un bord de plus : `d` → `i`.

`doctor` et tout ce qui ne continue pas avec `i` sortent. Restent sous `di` : dinner, dinosaur, diners, disney, et proches.

```
prefix "di" → dinner recipes, dinosaur, diners near me, disney movies, ...
```

**Étape 3 : l'utilisateur tape `n` (maintenant `din`)**

Marche : `i` → `n`.

Le chemin est maintenant `d-i-n`. Seules les requêtes qui commencent par `din` restent :

```
prefix "din" → dinner recipes, dinosaur, diners near me, ...
```

Toute la route de requête en une phrase : **suivre les lettres tapées par l'utilisateur, puis renvoyer les meilleures requêtes complètes accrochées sous ce nœud.**

Le temps pour atteindre le nœud est proportionnel au nombre de caractères tapés. Pour de courtes barres de recherche, c'est une poignée de pas, pas un scan de table entier.

---

## Meilleures suggestions : on ne montre pas tout

Les utilisateurs ne veulent pas 10 000 correspondances. Ils veulent une liste courte et utile.

Le produit dit donc : renvoyer **top k**, souvent `k = 5` ou `k = 10`.

**Comment classer ?**

Réponse simple d'entretien : **fréquence historique**. Compter combien de fois les gens ont fini cette recherche. Plus le compte est haut → meilleur rang. Améliorations optionnelles plus tard : tendances récentes, clics sur suggestions, langue, lieu. Commencez par la fréquence pour garder le design clair.

Forme de réponse exemple :

```http
GET /v1/autocomplete?q=din&limit=5
```

```json
{
  "prefix": "din",
  "suggestions": [
    {"query": "dinner recipes", "score": 98012},
    {"query": "dinosaur", "score": 77120},
    {"query": "diners near me", "score": 54001}
  ]
}
```

Les préfixes vides ou d'une lettre sont gênants (presque tout le dictionnaire). Beaucoup de produits attendent **2 ou 3 caractères** avant d'appeler le serveur, ou montrent une liste spéciale de "tendances" pour une saisie très courte.

---

## Pourquoi on précalcule (l'idée de production la plus importante)

Vous *pourriez* faire ceci à chaque requête :

1. Marcher jusqu'au nœud du préfixe (`din`).
2. Explorer tout le sous-arbre en dessous.
3. Collecter chaque requête terminée.
4. Trier par score.
5. Prendre le top 5.

Pour un préfixe rare comme `xylophone`, le sous-arbre est minuscule. Pour un préfixe courant comme `a` ou `the`, il peut être énorme. Trier un tas géant sous un budget de 100ms, à fort QPS, échoue.

Donc on **précalcule**.

À chaque nœud important (ou pour chaque préfixe important), on stocke la réponse à l'avance :

```
Node "din":
  top: [dinner recipes, dinosaur, diners near me, ...]
```

La route de requête devient :

1. Marcher jusqu'au nœud (ou chercher le préfixe dans une map).
2. Renvoyer la liste déjà stockée.

Vous échangez de la **mémoire** contre de la **latence**. Cet échange est voulu. L'autocomplétion est un produit très orienté lecture où la vitesse *est* le produit.

### Quand ces listes sont-elles construites ?

Pas à chaque frappe sous le nez de l'utilisateur. À part :

1. Les gens finissent des recherches (logs).
2. Un pipeline compte les fréquences (par heure, jour, semaine : choix produit).
3. Un job construit un nouveau trie (ou une map `prefix → top-k`).
4. Les machines de service chargent le nouveau snapshot et basculent.

Pensez à imprimer un dictionnaire de poche la nuit, puis à utiliser ce livre imprimé le lendemain. Pour des produits d'actualité vous ajoutez aussi un court chemin "tendances", mais l'idée principale reste : **travail lourd hors ligne, réponses en ligne avec des listes déjà prêtes.**

---

## Deux chemins : apprendre vs répondre

Dessinez cette séparation tôt. Elle garde le design honnête.

```
APPRENDRE (lent est OK)
  recherches finies → comptages → construire top-k → publier snapshot

RÉPONDRE (doit être rapide)
  utilisateur tape → API → cache / trie → liste top-k → réponse
```

Si vous mettez à jour un arbre global en direct à chaque recherche finie dans le monde, vous créez des tempêtes d'écriture, des combats de verrous et des rangs inconsistants. Pour un premier design, préférez **rebuild périodique + bascule atomique**.

---

## Une mini histoire de capacité (pour que l'échelle soit concrète)

Chiffres d'entretien que vous pouvez dire à voix haute :

- 10 millions de personnes utilisent le produit par jour
- Chaque personne cherche environ 10 fois
- Chaque recherche peut taper environ 20 caractères (si chaque frappe frappe le serveur)

```
QPS moyen ≈ 10M * 10 * 20 / 86400 ≈ 24 000
Le pic peut être ~2x → ~50 000
```

En production le client devrait faire un **debounce** (attendre ~150-300ms après la dernière touche avant d'appeler) et annuler les anciennes requêtes quand une nouvelle lettre arrive. Cela coupe beaucoup de trafic. Planifiez quand même une API chaude et très orientée lecture.

Aussi : les navigateurs peuvent mettre en cache un moment des suggestions non personnelles. Les caches serveur (Redis ou en processus) stockent les préfixes chauds comme `din`, `how`, noms de marques. Un miss charge depuis le snapshot du trie.

---

## Sécurité et résultats moches

La popularité seule peut faire remonter de mauvaises suggestions. Discours haineux, arnaques ou retraits légaux ne peuvent pas attendre le rebuild de la semaine prochaine.

Mettez un **filtre rapide** sur le chemin de réponse :

- Liste de blocage de requêtes complètes et de préfixes
- Écarter les correspondances avant l'utilisateur
- Les retirer aussi au prochain rebuild pour qu'elles cessent d'occuper des places top-k

Masquage immédiat maintenant, index propre bientôt.

---

## Scaler sans se noyer dans le jargon

Une machine ne tiendra pas toutes les langues et toute la longue traîne pour toujours.

Idées pratiques appréciées en entretien :

| Idée | Sens simple |
| --- | --- |
| Shard par préfixe | Requêtes commençant par `a-m` sur un groupe de machines, `n-z` sur un autre |
| Corriger le biais des lettres | L'anglais aime `s` et `c` plus que `x` et `z` ; shard selon le vrai trafic, pas de tranches d'alphabet pures |
| Tries par locale | Le ranking en espagnol n'est pas celui en hindi ; des index séparés aident |
| Minimum de caractères | Ne servez pas le top-k global pour la chaîne vide |

Vous n'avez pas besoin d'un graphe global temps réel parfait le jour un. Vous avez besoin d'un service **prefix → top-k** qui reste rapide quand le trafic grossit.

---

## Détails client qui rendent le produit agréable

| Détail | Pourquoi |
| --- | --- |
| Debounce 150-300ms | Éviter une requête par frappe |
| Annuler les appels en vol | Le retour arrière ne doit pas montrer une liste périmée |
| Longueur min 2-3 | Éviter de déverser tout le dictionnaire |
| Recherches locales récentes | Offline ou panne reste utile |
| Plafond de longueur du préfixe | 50 caractères suffisent pour une barre de recherche |

Le design backend est le même pour apps mobiles et web.

---

## Image de bout en bout que vous pouvez défendre

**Produit :** top-5 par préfixe selon popularité, dizaines de milliers de QPS en pic, p99 sous ~100ms, anglais d'abord, rebuild périodique, modération rapide.

**Pièces :**

1. API d'autocomplétion (sans état, beaucoup de copies)
2. Trie ou snapshot `prefix → top-k` en mémoire / Redis
3. Stockage durable de snapshots (builds versionnés)
4. Log → agrégation → workers de build
5. Blocklist sur le chemin de lecture
6. Fusion optionnelle de tendances à fenêtre courte pour l'actualité

**Requête :** valider → cache → top-k précalculé → filtrer → répondre.

**Apprendre :** échantillonner les recherches finies → agréger → construire → publier → chauffer le cache → basculer de version.

---

## Récap pour un ami

Si vous deviez l'expliquer au dîner en une minute :

> L'autocomplétion, c'est comme les suggestions du clavier du téléphone pour la recherche. Vous tapez le début d'une phrase (un **préfixe**). Le système ne relit pas toutes les recherches de l'histoire. Il garde un **arbre de lettres** (un trie). Chaque pas est une lettre. Quand vous tapez `d`, puis `i`, puis `n`, il marche `d → i → n` et regarde une **courte liste précalculée** des requêtes complètes les plus populaires sous ce chemin, comme `dinner recipes` et `dinosaur`. On précalcule ces listes top hors ligne à partir de vrais comptages de recherche pour que chaque frappe reste bon marché et rapide. Servir les réponses et apprendre des nouvelles recherches sont deux jobs différents. Les mélanger dans une mise à jour live à chaque recherche, c'est comme ces systèmes deviennent lents et confus.

Voilà le design. Tout le reste (shards, caches, tendances, filtres) est du détail autour de cette histoire.

---

## Checklist avant de livrer (ou de finir l'entretien)

- [ ] Correspondance préfixe seule convenue avec le produit
- [ ] `k` et règle de ranking dits (fréquence d'abord)
- [ ] Debounce, annulation et longueur min côté client
- [ ] Top-k stocké par nœud ou map par préfixe
- [ ] Build offline ou périodique avec bascule atomique
- [ ] Filtre de sécurité en lecture avec mise à jour rapide
- [ ] Couches de cache pour préfixes chauds
- [ ] Rate limits sur l'endpoint d'autocomplétion
- [ ] Tableaux de bord : latence, hit rate du cache, résultats vides, lag du build

---

## Clôture

L'autocomplétion de recherche n'est pas une démo d'IA tape-à-l'œil. C'est un **service top-k par préfixe** avec un index presque temps réel. La structure qui colle au produit est un arbre de lettres. L'astuce qui fait marcher la production, ce sont les **listes courtes précalculées** aux nœuds que les gens marchent vraiment. Séparez le chemin d'apprentissage du chemin de réponse, et le système reste à la fois rapide et compréhensible.

