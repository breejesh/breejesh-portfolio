---
title: "Concevoir un store clé-valeur comme un vestiaire : put, get, CAP et quorums"
description: "Guide pour débutants des stores clé-valeur distribués. Put et get comme ranger et récupérer, CAP en histoire simple, partitions comme des livres sur des rayons, réplication comme des copies, quorums comme des bibliothécaires qui doivent se mettre d'accord."
date: "2025-10-28"
tags: [Conception de systèmes]
coverImage: /assets/images/design-key-value-store.webp
previewImage: /assets/images/design-key-value-store.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Guide pour débutants des stores clé-valeur distribués. Put et get comme ranger et récupérer, CAP en histoire simple, partitions comme des livres sur des rayons, réplication comme des copies, quorums comme des bibliothécaires qui doivent se mettre d'accord.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Imagine un vestiaire géant dans un stade. Tu donnes ton manteau. On te remet un ticket avec un numéro. Plus tard tu montres le ticket et tu récupères le même manteau. C'est un **store clé-valeur** dans la vraie vie.

- La **clé** est le numéro du ticket.
- La **valeur** est le manteau.
- **put** signifie ranger ce manteau sous ce ticket.
- **get** signifie récupérer le manteau de ce ticket.

Tu n'as pas besoin de savoir comment le portant est organisé. Tu as seulement besoin d'une règle fiable : même ticket, même manteau.

Les ordinateurs utilisent la même idée. Redis, Memcached, les systèmes façon Dynamo et beaucoup de couches de métadonnées de produits commencent ici. Deux verbes, une montagne d'ingénierie derrière.

Ce billet enseigne cette ingénierie comme le ferait un bon professeur : d'abord l'image, puis les noms difficiles seulement quand ils comptent.

---

## Les deux verbes : ranger et récupérer

Un store clé-valeur est une base de données avec une interface minuscule.

| Verbe | Sens du quotidien | Ce qu'il fait |
| --- | --- | --- |
| `put(key, value)` | Ranger | Enregistrer ou remplacer la valeur de cette clé |
| `get(key)` | Récupérer | Renvoyer la valeur, ou dire clairement "introuvable" |

Les clés sont uniques. Les valeurs peuvent être tout ce qui est assez petit pour ton design : une session, un JSON, un compteur, un instantané de panier. Dans la version entretien, les valeurs font souvent quelques kilo-octets, pas des films entiers.

Optionnel plus tard : supprimer, expirer avec une minuterie (TTL), "écrire seulement si la clé est encore en version X." Laisse-les de côté tant que le chemin central ne tient pas.

**Tiroirs étiquetés :** imagine un mur de tiroirs. Chaque tiroir a une étiquette (clé). Dedans se trouve un objet (valeur). Put ouvre le tiroir et range. Get ouvre le tiroir et regarde. Ce modèle mental suffit pour commencer.

---

## Pourquoi une seule machine ne suffit pas

Sur une seule machine, le store peut être une table de hachage en mémoire. Parfait pour des démos et de tout petits caches.

Puis la réalité arrive :

1. La map ne rentre plus en RAM.
2. La machine redémarre et tout disparaît si tu n'as pas aussi écrit sur disque.
3. Une machine ne peut pas répondre à un million de requêtes par seconde pour toujours.
4. Un bâtiment perd le courant et tout le produit tombe.

Tu ajoutes donc beaucoup de machines. Tu as maintenant un nouveau problème : **quelle machine détient quelle clé**, et **que se passe-t-il si cette machine meurt** ?

C'est toute l'histoire d'un store clé-valeur *distribué*.

---

## Fichier de bibliothèque : trouver le bon rayon

Une bibliothèque ne jette pas tous les livres en un seul tas. Elle utilise un catalogue et un plan de rayons.

- Le **catalogue** te dit où vit un livre.
- Les livres sont **répartis sur les rayons** pour qu'aucun rayon ne porte toute la bibliothèque.
- Les livres populaires ont des **copies supplémentaires** pour que plus de gens puissent emprunter.

Un store clé-valeur distribué fait les mêmes trois métiers :

| Idée de bibliothèque | Idée système | Pourquoi ça existe |
| --- | --- | --- |
| Règle du catalogue pour "quel rayon" | **Partitionnement** (souvent avec hachage cohérent) | Répartir les clés entre machines |
| Copies supplémentaires d'un livre | **Réplication** | Survivre à la perte d'une machine et servir plus de lectures |
| Règles du personnel pour l'emprunt et le retour | **Quorums et politique de cohérence** | Décider quand une écriture ou une lecture "compte" |

Garde ce tableau en tête. Presque chaque boîte que tu dessines y revient.

---

## CAP, raconté avec une histoire simple

Tu gères un vestiaire avec **trois comptoirs** qui doivent rester synchronisés par talkie-walkie. Appelle-les A, B et C. Un invité peut s'adresser à n'importe lequel.

Maintenant les radios cassent. Le comptoir C ne peut plus parler à A et B. Les invités continuent d'arriver. Tu dois choisir une politique.

### Option 1 : Tout le monde voit toujours la même réponse

Tu gèles le côté cassé. Le comptoir C arrête d'accepter des manteaux jusqu'à ce que les radios marchent. A et B peuvent aussi refuser des opérations risquées tant qu'ils ne sont pas sûrs.

Les invités à C entendent : "Désolé, le système est coupé. Revenez plus tard."

Personne n'obtient deux histoires différentes sur le ticket 42. Le prix est que certains invités n'obtiennent **aucune réponse** pendant la panne.

En langage CAP, cela penche **CP** : préférer la **cohérence** sous une **partition**. Les banques et les grands livres veulent souvent ce goût. Afficher le mauvais solde est pire qu'un "réessayez" temporaire.

### Option 2 : Quelqu'un obtient toujours une réponse même si le réseau casse

Les comptoirs A et B continuent d'accepter des manteaux. C aussi, avec ce qu'il sait encore. Les invités reçoivent toujours un ticket et une réponse.

Plus tard les radios guérissent. Le personnel découvre que le ticket 42 a deux manteaux différents sur deux comptoirs. Quelqu'un doit fusionner, choisir un gagnant, ou demander à l'invité de résoudre le bazar.

En langage CAP, cela penche **AP** : préférer la **disponibilité** sous une **partition**. Paniers, sessions et beaucoup de caches produit choisissent cela et réparent ensuite.

### Ce que signifient les lettres en mots simples

| Lettre | Sens simple |
| --- | --- |
| **C** Consistency | Les clients sains voient la même réponse à jour (forme forte) |
| **A** Availability | Les nœuds vivants continuent de répondre aux requêtes |
| **P** Partition tolerance | Le système a un plan quand les nœuds ne peuvent pas parler |

Dans un vrai système multi-machines, les réseaux cassent. Il faut vivre avec **P**. Le choix vivant est souvent **à quel point tu t'accroches à C plutôt qu'à A quand le réseau est malade**.

Il n'y a pas de bouton gratuit "toujours parfait, toujours ouvert, toujours anti split-brain." En entretien, on aime t'entendre demander : *qu'est-ce qui est pire pour ce produit, une réponse temporairement fausse ou aucune réponse ?*

---

## Partitionnement : répartir les livres sur les rayons

Tu ne peux pas mettre chaque clé sur chaque machine sans un coût énorme. Tu **partitionnes** (shards) l'espace de clés.

Image du quotidien : le rayon 1 a les tickets 1-1000, le 2 a 1001-2000, et ainsi de suite. En informatique la règle est souvent plus maligne que des plages fixes pour la plupart des designs clé-valeur.

### Hachage cohérent en une phrase

Imagine des serveurs debout sur un grand cercle (un "anneau de hash"). Tu hashes chaque clé sur le même cercle. Tu marches dans le sens des aiguilles d'une montre jusqu'à un serveur. Ce serveur possède la clé.

Pourquoi les gens aiment ça :

- Quand un serveur rejoint ou quitte, **seules les clés proches bougent**, pas presque toutes.
- Avec des **nœuds virtuels**, une grosse machine peut posséder plus de points sur l'anneau qu'une petite, et la charge se répartit mieux.

Tu n'as pas besoin de toute la maths pour designer au tableau. Tu as besoin de l'intention : **propriété stable des clés avec un remaniement minimal**.

Les clés chaudes font encore mal. Une clé célébrité tombe toujours sur un seul emplacement primaire. Des caches devant, un design de clé plus malin ou un plan dédié pour le chemin chaud aident. L'anneau seul ne soigne pas la célébrité.

---

## Réplication : garder des copies pour qu'un incendie de rayon ne soit pas fatal

Si le ticket 42 vit sur une seule machine et que cette machine meurt, le manteau est parti. Les bibliothèques gardent plusieurs copies des livres populaires. Les systèmes clé-valeur gardent **N réplicas**.

Défaut d'entretien courant : **N = 3**. Trois copies de chaque clé sur trois machines distinctes, idéalement dans des racks ou zones différents pour qu'une coupure électrique n'efface pas toutes les copies.

Règle de placement après avoir trouvé le premier serveur sur l'anneau : avance et choisis les **N machines distinctes** suivantes.

La réplication achète :

1. **Durabilité** si un disque meurt.
2. **Disponibilité** si un nœud est hors ligne.
3. **Échelle de lecture** si beaucoup de lecteurs peuvent frapper des copies différentes.

Elle crée aussi un nouveau casse-tête : les copies peuvent **diverger** un moment. C'est pourquoi CAP et les quorums comptent.

---

## Quorum : la majorité des bibliothécaires doit se mettre d'accord

Trois bibliothécaires tiennent des copies de la même fiche. Tu as besoin d'une règle pour savoir quand un dépôt ou une consultation est "terminé."

| Symbole | Sens simple |
| --- | --- |
| **N** | Combien de copies existent |
| **W** | Combien de copies doivent confirmer une **écriture** avant le succès |
| **R** | Combien de copies tu dois entendre sur une **lecture** |

Un **coordinateur** (n'importe quel nœud qui a reçu la requête client) interroge l'ensemble de réplicas et compte les réponses.

### La règle d'or du chevauchement

Si **W + R > N**, une lecture réussie et une écriture réussie doivent partager au moins une copie en régime stable. Cette copie devrait avoir vu la dernière écriture réussie. Tu obtiens une **cohérence plus forte**.

Exemples avec **N = 3** :

| W | R | Sensation |
| --- | --- | --- |
| 1 | 1 | Rapide et fragile. Lectures périmées plus probables. |
| 2 | 2 | Défaut courant. Majorité d'accord en écriture et en lecture. |
| 3 | 1 | Écritures très soigneuses, lectures rapides. Encore faible si R est minuscule et qu'une copie en retard répond. |
| 1 | 3 | Écritures rapides, lectures soigneuses qui interrogent tout le monde. |

**Important :** W = 1 ne signifie **pas** "stocker une seule copie." Cela signifie "dire succès au client après une confirmation," pendant que d'autres copies peuvent encore rattraper.

La latence suit le **membre le plus lent du quorum**, pas le plus rapide. Monte W ou R et la cohérence s'améliore ; la latence de queue empire souvent.

En histoire : pour classer une nouvelle fiche, deux bibliothécaires sur trois doivent la tamponner (W = 2). Pour répondre à un visiteur, deux sur trois doivent rapporter la fiche qu'ils tiennent (R = 2). Si leurs histoires s'entrechoquent, tu résous les versions (section suivante) avant de parler.

---

## Quand les copies divergent : versions

Deux invités mettent à jour le ticket 42 en même temps de part et d'autre d'une partition réseau. Les deux écritures réussissent sous une politique souple. Tu as maintenant deux "vérités."

Simple mais rude : **la dernière écriture gagne** par horodatage. Les horloges peuvent mentir sous décalage, donc tu peux jeter en silence une vraie mise à jour.

Plus soigneux : les **horloges vectorielles** (ou vecteurs de version similaires) suivent *qui* a vu *quoi*. Si une version vient clairement après l'autre, garde la lignée plus récente. Si elles divergent, tu as des **frères** (siblings) : vrai conflit. L'app fusionne (les articles du panier se combinent) ou montre les deux.

Pour beaucoup de clés produit, last-write-wins est ce que les équipes livrent car la perte silencieuse est acceptable. Pour paniers et état collaboratif, fusionner les frères est plus sûr. Dis la règle produit à voix haute.

---

## Que se passe-t-il quand un bibliothécaire est malade

### Panne courte : quorum souple et hinted handoff

Les règles strictes peuvent tout bloquer si trop de réplicas préférés sont down. Le **quorum souple** (sloppy quorum) garde le comptoir ouvert : pour une écriture, prends les **W premières machines saines** de la liste de préférence, même si ce ne sont pas les propriétaires habituels. Un voisin peut garder une note : "ce manteau appartient au comptoir C." Quand C revient, le voisin **remet** la note. C'est le **hinted handoff**.

### Dérive longue : anti-entropie et arbres de Merkle

Les indices réparent les micro-pannes. L'isolement long a besoin d'une réparation en arrière-plan. Les réplicas comparent les données efficacement avec des **arbres de Merkle** (arbres de hash) : si deux racines coïncident, cette plage coïncide. Sinon, on descend et on synchronise seulement les seaux qui diffèrent. Tu copies la **différence**, pas toute la bibliothèque.

### Gossip pour l'appartenance

Les nœuds ont besoin d'une idée partagée de qui est vivant. Ils font du **gossip** : ils échangent périodiquement l'appartenance et les battements de cœur avec des pairs au hasard. Pas besoin d'une seule "machine patronne" pour ce dessin, même si les ops réelles ajoutent souvent un plan de contrôle.

---

## Comment put et get voyagent de bout en bout

### put(key, value) - ranger le manteau

1. Le client envoie put à un coordinateur (n'importe quel nœud, ou un load balancer en choisit un).
2. Le coordinateur hashe la clé et trouve la liste de préférence de N machines.
3. Il transmet l'écriture à ces machines (ou à des remplaçants sains sous quorum souple).
4. Il attend **W** accusés de réception réussis.
5. Il renvoie le succès, ou une erreur si le quorum ne se forme jamais.

Sur chaque réplica qui accepte l'écriture, un chemin durable courant est :

1. Ajouter au **commit log** sur disque (survivre au crash du processus).
2. Mettre à jour une structure en mémoire (**memtable**).
3. Plus tard **flusher** vers des fichiers triés sur disque (**SSTables**).
4. La **compaction** en arrière-plan fusionne les fichiers et nettoie les clés supprimées.

### get(key) - récupérer le manteau

1. Le coordinateur trouve la liste de préférence.
2. Il lit jusqu'à **R** réponses (ou des substituts sains).
3. Si les versions entrent en conflit, il les résout.
4. Optionnellement il répare les copies en retard (**read repair**).
5. Il renvoie la valeur ou not-found.

Astuces de lecture locale que tu peux nommer : regarder la mémoire d'abord, utiliser des **filtres de Bloom** pour sauter les fichiers disque qui ne peuvent pas contenir la clé, fusionner les versions, appliquer les suppressions.

---

## Forme de l'architecture (un dessin)

```
Client
  |
  v
Coordinateur (n'importe quel nœud peut jouer ce rôle)
  |
  +---> N réplicas pour cette clé (sur l'anneau de hash)
  |
  +---> Gossip / appartenance
  |
  +---> Stockage local (commit log + memtable + SSTables)
```

Propriétés qui valent d'être dites en entretien :

- L'API client reste **get/put**.
- Il n'y a **pas de maître unique pour tout l'espace de clés**. Chaque clé a sa liste de préférence.
- Chaque nœud peut coordonner, stocker, réparer et faire du gossip. Des rôles symétriques simplifient les opérations.
- Ajouter un nœud met à jour l'anneau et streame les plages de clés qu'il doit posséder.

---

## Ce que ce design optimise

Ce croquis classique façon Dynamo penche **AP avec cohérence réglable** :

- Les partitions sont attendues.
- Le système préfère continuer de répondre.
- Tu règles le soin des lectures et écritures avec **N, W, R**.

Si le produit est un solde de paiement, tu peux choisir une histoire plus stricte et accepter plus de refus sous panne. Si c'est un blob de session ou un cache de feature flags, la disponibilité gagne souvent.

---

## Intuition de capacité (dis des chiffres ronds à voix haute)

Style tableau blanc, pas un plan financier :

- Valeur moyenne 1 KB, petite clé, un peu de métadonnées → environ 1,3 KB sur disque par item avant copies.
- 1 milliard de clés → environ 1,3 TB bruts. Avec N = 3 et l'overhead de fichiers, prévois plusieurs TB de stockage cluster utile.
- 100k QPS lecture et 10k écriture : dimensionne le fan-out. Chaque écriture peut toucher N machines ; le client attend W.
- Le trafic inter-zones est une vraie ligne de coût, pas de la magie gratuite.

Te tromper d'un facteur 2 va. Oublier la réplication ou le pic de charge ne va pas.

---

## Histoires de panne à raconter

1. **Un réplica down :** quorum souple et hints gardent put/get vivants ; handoff à la reprise.
2. **Deux sur trois down (N = 3, W = 2) :** les écritures peuvent échouer tant que tu n'as pas W. Discute politique temporaire vs refuser les writes.
3. **Partition réseau :** AP continue des deux côtés ; les conflits apparaissent à la guérison. CP gèle le côté dangereux.
4. **Réplica lent :** la latence du quorum suit la W-ième ou R-ième réponse, pas la plus rapide.
5. **Disque plein sur un nœud :** ce nœud se décharge ou meurt ; l'anneau et la réparation doivent déplacer des plages.

Si tu peux dérouler put et get sous "un nœud down" et "deux versions ont divergé," tu as le cœur de l'entretien.

---

## Antisèche des curseurs

| Curseur | Ce qu'il change |
| --- | --- |
| N | Combien de copies ; durabilité et coût de stockage |
| W / R | Cohérence vs latence |
| Nombre de nœuds virtuels | À quel point le rééquilibrage de charge est doux |
| Placement multi-zones | Survivre à de plus grosses pannes vs plus de latence d'écriture |
| Durée de vie des hints | Combien de temps les détenteurs temporaires gardent des données étrangères |
| Planning de réparation | À quelle vitesse la dérive est nettoyée vs bande passante de fond |

---

## Récap pour un ami

Un store clé-valeur est un **vestiaire géant** : ticket entre, manteau sort. **put** range, **get** récupère.

Une machine est un seul placard. Beaucoup de machines ont besoin d'un **plan de bibliothèque** : répartir les livres sur les rayons (**partitionnement**), garder des copies de rechange (**réplication**), et faire s'accorder le personnel avec des règles claires (**quorums**).

Quand les talkie-walkies cassent entre comptoirs, tu choisis : **la même réponse pour tout le monde** (même si certains invités attendent) ou **toujours répondre à quelqu'un** (même s'il faut nettoyer les écarts plus tard). Ce choix, c'est CAP sous partition.

Avec trois bibliothécaires, **N** est combien tiennent la fiche, **W** combien doivent tamponner une écriture, **R** combien tu interroges en lecture. Si W + R > N, une bonne lecture devrait voir une bonne écriture.

Les copies divergent parfois. Répare les trous courts avec handoffs et hints. Répare la longue dérive avec une réparation en arrière-plan. Garde l'API client minuscule pour que le travail dur reste dans le cluster.

Voilà un store clé-valeur distribué : pas une table de hachage magique sur le réseau, mais un plan de rayons, un plan de copies, et un règlement du personnel pour les jours où quelque chose casse.