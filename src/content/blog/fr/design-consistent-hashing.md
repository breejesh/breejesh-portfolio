---
title: "Concevoir le consistent hashing : anneaux, nœuds virtuels et remapping minimal"
description: "Pourquoi hash(key) % N réassigne presque tout le monde quand un serveur part, comment un anneau de hachage place les clés en marchant dans le sens horaire, les nœuds virtuels pour une charge équitable, et où le consistent hashing apparaît dans les caches, bases et load balancers."
date: "2026-01-13"
tags: [Design Système et Architecture]
coverImage: /assets/images/design-consistent-hashing.webp
previewImage: /assets/images/design-consistent-hashing.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Pourquoi hash(key) % N réassigne presque tout le monde quand un serveur part, comment un anneau de hachage place les clés en marchant dans le sens horaire, les nœuds virtuels pour une charge équitable, et où le consistent hashing apparaît dans les caches, bases et load balancers.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Vous avez beaucoup d'utilisateurs et beaucoup de serveurs de cache. Chaque donnée (une **clé**) doit atterrir sur un serveur, et vous devez pouvoir la retrouver plus tard. Quand un serveur meurt ou que vous ajoutez de la capacité, vous voulez déplacer le moins de données possible.

Le **consistent hashing** est la façon standard de placer les clés pour qu'un changement de membership ne touche qu'une petite tranche des données, pas tout le cluster.

Ce billet construit l'idée à partir du plan d'un restaurant, puis la mappe à l'anneau de hachage, aux nœuds virtuels et aux systèmes réels.

---

## Le problème en mots simples

Imaginez un restaurant avec des tables numérotées. Vous placez les clients avec une règle simple : prenez le numéro du client, divisez par le nombre de tables, et utilisez le reste.

```
table = numeroClient % nombreDeTables
```

Cela marche tant que le nombre de tables ne change jamais.

### Une table ferme, le chaos

Supposons 4 tables et 8 habitués :

| Client | numeroClient | numero % 4 | Table |
| --- | --- | --- | --- |
| A | 11 | 3 | T3 |
| B | 14 | 2 | T2 |
| C | 17 | 1 | T1 |
| D | 20 | 0 | T0 |
| E | 23 | 3 | T3 |
| F | 26 | 2 | T2 |
| G | 29 | 1 | T1 |
| H | 32 | 0 | T0 |

La table T1 casse. Il reste 3 tables. Mêmes numéros, nouveau reste :

| Client | numeroClient | numero % 3 | Table |
| --- | --- | --- | --- |
| A | 11 | 2 | T2 |
| B | 14 | 2 | T2 |
| C | 17 | 2 | T2 |
| D | 20 | 2 | T2 |
| E | 23 | 2 | T2 |
| F | 26 | 2 | T2 |
| G | 29 | 2 | T2 |
| H | 32 | 2 | T2 |

Dans un vrai tableau vous tombez encore sur plusieurs tables, mais le fait douloureux reste : **la plupart des gens changent de place**, pas seulement ceux de la table cassée.

Dans un cluster de cache, cela veut dire :

1. Les clients demandent au mauvais nœud des données qui existent encore ailleurs.
2. Les misses inondent la base.
3. Vous vouliez perdre environ 1/N du cache. Vous avez payé un redémarrage à froid presque complet.

C'est le problème du rehashing. `hash(key) % N` va bien jusqu'à ce que `N` change. Alors il réassigne presque tout le restaurant.

---

## Un meilleur plan : des casiers dans un couloir circulaire

Imaginez un long couloir de casiers numérotés en cercle. Marchez assez loin dans une direction et vous revenez au casier 0. Ce cercle est l'**espace de hachage**.

```
              0
          .         .
       .               .
     .                   .
   max                     small
     .                   .
       .               .
          .         .
            mid ring
```

Deux idées :

1. Les **serveurs** reçoivent des numéros de casier fixes (en hashant leur nom ou IP).
2. Les **clés** reçoivent aussi des numéros de casier (en hashant la clé).

Il n'y a pas de `% nombreDeServeurs`. Les positions vivent dans une plage fixe, comme `0` à `2^32 - 1` ou un espace plus grand. Le cercle ne rétrécit pas quand un serveur part.

### Des serveurs comme des serveurs de salle à des places fixes

Pensez chaque serveur machine comme un serveur de salle debout à une place d'une table ronde.

Anneau jouet avec des positions de 0 à 99 :

| Serveur | Place |
| --- | --- |
| s0 | 12 |
| s1 | 37 |
| s2 | 61 |
| s3 | 88 |

Clés sur le même cercle :

| Clé | Place |
| --- | --- |
| key0 | 18 |
| key1 | 42 |
| key2 | 70 |
| key3 | 95 |

```
Anneau (horaire depuis 0) :

  0
  |-- s0@12 -- key0@18 -- s1@37 -- key1@42 --
  |-- s2@61 -- key2@70 -- s3@88 -- key3@95 -- (retour à 0)
```

---

## Lookup : marcher dans le sens horaire jusqu'à un serveur

Règle :

1. Hasher la clé vers une place `p`.
2. Marcher dans le **sens horaire** jusqu'à la prochaine place serveur.
3. Ce serveur possède la clé.

| Clé | Place | Premier serveur horaire | Propriétaire |
| --- | --- | --- | --- |
| key0 | 18 | s1@37 | s1 |
| key1 | 42 | s2@61 | s2 |
| key2 | 70 | s3@88 | s3 |
| key3 | 95 | s0@12 (tour complet) | s0 |

En code, gardez les places triées et faites une recherche binaire de la première position `>= p`. Sinon, revenez au premier élément de l'anneau.

```python
import bisect
import hashlib

def h(x: str) -> int:
    # espace jouet 32 bits ; en production souvent 64 bits ou plus
    return int(hashlib.md5(x.encode()).hexdigest()[:8], 16)

class HashRing:
    def __init__(self, nodes: list[str]):
        self.positions: list[int] = []
        self.owners: dict[int, str] = {}
        for n in nodes:
            p = h(n)
            self.positions.append(p)
            self.owners[p] = n
        self.positions.sort()

    def lookup(self, key: str) -> str:
        p = h(key)
        i = bisect.bisect_left(self.positions, p)
        if i == len(self.positions):
            i = 0  # tour de l'anneau
        return self.owners[self.positions[i]]
```

Phrase d'entretien : "positions triées plus recherche binaire, environ O(log n) en points de l'anneau."

---

## Ajouter un serveur : seuls les voisins bougent

Ajoutez `s4` à la place 25.

Avant : `key0@18` marchait jusqu'à `s1@37`.

Après : depuis 18, le premier serveur est `s4@25`. Seules les clés de l'arc qui appartenait à l'ancien voisin changent de propriétaire.

```
Avant :  ... s0@12 -- key0@18 -------- s1@37 ...
Après :  ... s0@12 -- key0@18 -- s4@25 -- s1@37 ...
                    seul cet arc est remappé vers s4
```

**Ce qui bouge quand vous ajoutez un serveur :** les clés entre le nouveau serveur et le serveur précédent dans le sens antihoraire. Tout le reste garde son serveur.

---

## Retirer un serveur : seuls ses clients bougent

Retirez `s1@37`.

Les clés qui utilisaient `s1` comme premier serveur horaire continuent jusqu'au prochain serveur vivant (`s2@61`). Les clés déjà possédées ailleurs ne bougent pas.

```
Avant : clés qui frappaient s1 en premier -> s1
Après : ces clés continuent vers s2 ; les autres arcs inchangés
```

Dans un cache, vous prenez encore une tempête de misses sur cet arc. Vous ne **réassignez pas** tout le restaurant.

Règle empirique : quand 1 serveur sur n change, environ **k/n** clés bougent en moyenne (k clés au total), pas presque toutes.

---

## Ce que promet le consistent hashing (et ce qu'il ne promet pas)

| Objectif | Pourquoi c'est important |
| --- | --- |
| Remapping minimal à l'arrivée ou au départ | Éviter les stampedes de cache et les longs rebalances |
| Charge assez égale | Qu'une seule machine ne possède pas presque tout l'anneau |
| Lookup déterministe | Même vue de membership implique même propriétaire |
| Pas cher à calculer | Le placement est sur le chemin chaud |

Il ne donne **pas** à lui seul la réplication, la cohérence forte ou le failover automatique. Cela s'ajoute par-dessus : les N prochains serveurs dans le sens horaire comme réplicas, le gossip pour le membership, etc.

---

## Deux problèmes avec une seule place par serveur

### Arcs injustes

Le segment de cercle entre deux serveurs adjacents est une **partition**. Si trois serveurs se regroupent par hasard, l'un possède un énorme arc et fait presque tout le travail de cette zone.

```
Mauvais tirage :

  s0 -------- s1 - s2 ------------------- s3 ---- (retour)

  s2 possède un grand vide ; la charge est biaisée
```

### Places regroupées

Avec peu de serveurs physiques sur un immense anneau, le placement aléatoire peut s'agglutiner. Un petit N aggrave l'injustice.

---

## Nœuds virtuels : beaucoup de places par serveur

Un **nœud virtuel** est une place supplémentaire sur l'anneau qui pointe encore vers un serveur réel. Chaque serveur physique apparaît de nombreuses fois sous des hashs différents :

```
s0 -> s0_0, s0_1, s0_2, ...
s1 -> s1_0, s1_1, s1_2, ...
```

Image restaurant : chaque serveur de salle a plusieurs places réservées autour de la table, pas une seule chaise. Le travail se répartit parce qu'un seul écart ne décide pas de toute sa soirée.

Exemple jouet avec 3 places virtuelles par serveur :

| Id virtuel | Serveur réel | Place (exemple) |
| --- | --- | --- |
| s0_0 | s0 | 10 |
| s0_1 | s0 | 55 |
| s0_2 | s0 | 90 |
| s1_0 | s1 | 22 |
| s1_1 | s1 | 48 |
| s1_2 | s1 | 73 |

Le lookup ne change pas : marchez dans le sens horaire jusqu'à la prochaine place **virtuelle**, puis suivez le pointeur vers le serveur réel.

```
key @ 50 -> prochain vnode s0_1@55 -> réel s0
```

### Pourquoi cela aide

| Effet | Explication |
| --- | --- |
| Moins de variance | Beaucoup de petits arcs au lieu d'un gros pari |
| Scale-out plus doux | Un nouveau nœud vole de fines tranches à beaucoup de voisins |
| Capacité pondérée | Les plus grosses machines peuvent avoir plus de places virtuelles |
| Charge plus juste | Le travail se mélange autour de la table |

Les textes classiques utilisent souvent de l'ordre de **100 à 200 nœuds virtuels par serveur** pour que la charge reste assez égale. Plus de nœuds virtuels : meilleur équilibre et carte d'anneau plus grande en mémoire. À régler.

```python
class VNodeRing:
    def __init__(self, nodes: list[str], vnodes: int = 150):
        self.positions: list[int] = []
        self.owners: dict[int, str] = {}
        for n in nodes:
            for i in range(vnodes):
                p = h(f"{n}#{i}")
                self.positions.append(p)
                self.owners[p] = n
        self.positions.sort()

    def lookup(self, key: str) -> str:
        p = h(key)
        i = bisect.bisect_left(self.positions, p)
        if i == len(self.positions):
            i = 0
        return self.owners[self.positions[i]]
```

Clients et serveurs doivent s'accorder sur la fonction de hash et le nombre de nœuds virtuels, sinon ils ne seront pas d'accord sur les propriétaires.

---

## Quelles clés doivent bouger

Quand le membership change, l'anneau définit déjà les plages.

**Ajouter le serveur S à la position p :**

```
prev = voisin antihoraire de S
clés dans (prev, p] passent de l'ancien propriétaire de cet arc à S
```

**Retirer le serveur S à la position p :**

```
prev = voisin antihoraire de S
next = voisin horaire de S
clés dans (prev, p] passent de S à next
```

Avec des nœuds virtuels, faites-le pour chaque place virtuelle de la machine qui arrive ou part. Beaucoup de petits transferts battent un seul transfert géant.

Pour un cache pur, "transférer" veut souvent dire "laisser le nouveau propriétaire se remplir au miss." Pour une base, vous streamez les plages exprès et vous contrôlez les écritures pendant la passation.

---

## Réplication sur l'anneau (ajout court)

Le consistent hashing place le **primaire**. La réplication est souvent "continuer dans le sens horaire" :

```
key -> N1 (primaire), N2, N3  # trois premiers serveurs physiques distincts
```

Sautez les places virtuelles du même hôte physique pour que les réplicas atterrissent sur des machines différentes. Les systèmes style Dynamo et les anneaux de tokens Cassandra utilisent ce motif. Mentionnez les quorums seulement si l'entretien devient un design complet de key-value store.

---

## Où vous le voyez vraiment

| Classe de système | Comment le consistent hashing apparaît |
| --- | --- |
| **Caches distribués** | Clients Memcached, shards multi-nœuds, placement edge CDN (et cousins proches) |
| **Bases / KV stores** | Partitions Dynamo, anneaux de tokens Cassandra, beaucoup d'anneaux maison |
| **Chat / temps réel** | Propriété sticky de guildes ou canaux pour qu'un événement de scale ne redistribue pas tout |
| **Load balancers** | Choix stable de backend quand le pool bouge (Maglev et parents) |
| **Routage de requêtes** | Utilisateurs, tenants ou shards sticky sans carte centrale à chaque requête |

Idées voisines, pas identiques : **jump consistent hash**, **rendezvous (HRW) hashing**, et **tables de permutation Maglev**. En entretien, nommez d'abord le consistent hashing, puis dites qu'il existe des variantes plus rapides ou moins gourmandes en mémoire.

---

## Flux d'entretien que vous pouvez suivre

1. **Problème :** `hash % N` réassigne presque tout le monde quand N change.
2. **Anneau :** espace de hash fixe ; serveurs et clés sont des points ; pas de `% N` vivant.
3. **Lookup :** premier serveur dans le sens horaire (recherche binaire sur places triées).
4. **Ajout/retrait :** seul l'arc voisin est remappé (environ 1/n des clés).
5. **Douleur :** arcs injustes avec une place par serveur.
6. **Nœuds virtuels :** beaucoup de places par serveur physique ; charge plus juste ; poids optionnels.
7. **Ops :** comment les données bougent, comment les clients apprennent le membership, à quoi ressemblent des propriétaires temporairement faux.
8. **Usages :** caches, bases partitionnées, load balancers sticky.

**Clarifiez tôt :**

- Cache seulement (miss au remap OK) ou store durable (il faut migrer) ?
- Facteur de réplication ?
- Qui possède le membership (config statique, ZooKeeper, gossip) ?
- Les clients peuvent-ils se tromper un instant pendant une mise à jour de membership ?

**Trade-offs à dire à voix haute :**

| Choix | Avantage | Coût |
| --- | --- | --- |
| Plus de nœuds virtuels | Charge plus plate | Anneau plus grand, rebuilds plus lents |
| Anneau côté client | Pas de saut proxy | Chaque client doit voir le même membership |
| Proxy / coordinateur | Vue centrale unique | Un hop de plus |
| Remplir le cache au miss | Ops simples | Pic sur l'origine au rebalance |
| Migration en streaming | Plus sûr pour les DB | Complexité de handoff |

---

## Checklist production

- [ ] Le hash est rapide et bien réparti sur le chemin chaud
- [ ] Le nombre de nœuds virtuels est choisi et documenté ; les poids matchent la taille des machines
- [ ] Le lookup est O(log n) sur les points de l'anneau, pas un scan linéaire
- [ ] Les changements de membership sont versionnés ; mesurez les fenêtres de mauvais propriétaire
- [ ] À la perte d'un nœud, seuls les arcs touchés se remontent ou se rechargent
- [ ] Les réplicas sautent le même hôte physique
- [ ] Métriques : clés par nœud, tailles d'arc, octets de rebalance, taux de miss pendant les joins
- [ ] Runbooks pour "ajouter un nœud" et "remplacer un nœud mort" sans redémarrer tout le cluster

---

## Récap pour un ami

Imagine un restaurant rond. La règle bête de placement est `numéro du client % nombre de tables`. Tu fermes une table et presque tout le monde change de place. C'est `hash(key) % N`.

La règle intelligente met tables (serveurs) et clients (clés) sur le même couloir circulaire de casiers. Pour placer un client, tu marches dans le sens horaire jusqu'au prochain serveur de salle. Tu fermes une table et seuls les clients de cette section passent au serveur suivant. Les autres restent.

Si chaque serveur n'a qu'une place, la chance peut faire des sections énormes ou minuscules. Donne à chaque serveur beaucoup de places réservées autour du cercle (nœuds virtuels) pour que le travail reste juste.

La même idée anime les clusters de cache, les bases shardées et les load balancers sticky : placer les données pour que la croissance et les pannes déplacent une tranche, pas tout le système.

---

## Conclusion

`hash(key) % N` va bien jusqu'à ce que le pool bouge. Alors il remap presque tout et transforme un événement de scale en événement de fiabilité.

Le consistent hashing place clés et serveurs sur un anneau partagé, assigne chaque clé au prochain serveur dans le sens horaire, et limite le remapping à un arc local quand des nœuds arrivent ou partent. Les nœuds virtuels corrigent les arcs injustes. Si vous pouvez dessiner l'anneau, expliquer la borne de remapping, et défendre le nombre de nœuds virtuels plus le membership, vous avez le chapitre d'entretien et les réflexes de production qui vont avec.