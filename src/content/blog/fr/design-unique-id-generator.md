---
title: "Concevoir un générateur d'IDs uniques : UUID, ticket servers et Snowflake"
description: "IDs uniques pour débutants : pourquoi un compteur d'une seule base casse avec beaucoup d'écrivains, puis UUID, ticket servers et Snowflake comme heure plus numéro de machine plus compteur, comme un ticket de caisse, y compris les horloges qui reculent d'un coup."
date: "2025-11-16"
tags: [Conception de systèmes]
coverImage: /assets/images/design-unique-id-generator.webp
previewImage: /assets/images/design-unique-id-generator.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** IDs uniques pour débutants : pourquoi un compteur d'une seule base casse avec beaucoup d'écrivains, puis UUID, ticket servers et Snowflake comme heure plus numéro de machine plus compteur, comme un ticket de caisse, y compris les horloges qui reculent d'un coup.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Chaque commande, tweet, photo et message de chat a besoin d'un nom qu'aucune autre chose ne partage. Ce nom est un **ID unique**. Sur un seul ordinateur c'est simple : on commence à 1, puis 2, puis 3. À l'échelle d'une entreprise, beaucoup de machines inventent des noms en même temps. Deux machines ne doivent jamais inventer le même nom.

Pensez aux numéros de chèque de banque, à la machine à tickets d'une boulangerie, et au ticket de caisse d'un magasin. Chaque système résout "donne-moi le prochain numéro unique" d'une autre façon. Ce billet utilise ces images du quotidien pour que la version informatique cesse d'avoir l'air mystérieuse.

---

## Quel problème résout-on ?

Quand vous créez un utilisateur ou une commande, le système assigne un ID. Ensuite, chaque service cherche "commande 91827364" et attend exactement une ligne.

Les bons IDs ont en général quelques propriétés :

| Besoin | En français simple |
| --- | --- |
| Unique | Aucune paire d'objets ne reçoit le même ID |
| Rapide | Créer un ID ne doit pas devenir le goulot du checkout |
| Souvent numérique | Tient dans une colonne entière de base de données |
| Souvent à peu près ordonné par le temps | Les IDs plus récents sont plus grands ; feeds et index restent propres |

Les trous sont presque toujours acceptables. Vous n'avez pas besoin de chaque entier. Vous avez besoin de zéro collision.

Pour la suite, on veut des **nombres 64 bits** (ils tiennent dans un `BIGINT` SQL normal), uniques dans tout le produit, et à peu près ordonnés par le temps.

---

## Pourquoi l'auto-increment d'une seule BD casse quand beaucoup de machines écrivent

Une clé primaire auto-incrémentée sur une seule base, c'est comme **un seul carnet de chèques dans une agence**. La banque tamponne le chèque 1, puis 2, puis 3. Parfait, parce qu'il n'existe qu'un tampon.

Les problèmes commencent en grandissant :

1. **Beaucoup d'écrivains.** Vous découpez les données sur plusieurs bases. Chacune veut son compteur. Deux compteurs disent "le suivant est 7." Collision.
2. **Beaucoup de serveurs d'app.** Vingt pods insèrent des lignes. Si une seule base possède le compteur, ce compteur devient la file d'attente où tout le monde attend.
3. **Régions lointaines.** Un serveur en Inde qui attend un compteur aux États-Unis paie la latence réseau à chaque create.
4. **Failover.** Si la machine qui "connaît le prochain numéro" meurt en plein basculement, deux côtés peuvent réutiliser une plage par accident.

Vous pouvez donner à chaque shard sa propre séquence (l'utilisateur 1001 vit sur le shard A avec des IDs locaux). Ça marche pour certains produits. Ça ne donne **pas** un ordre global entre shards sans travail supplémentaire.

Donc : un tampon est sûr et devient lent à l'échelle. Plusieurs tampons demandent une règle plus intelligente.

---

## Option 1 : UUID (numéros de passeport au hasard)

Un **UUID** est un long identifiant, en général 128 bits. La forme string courante ressemble à :

```
09c93e62-50b4-468d-bf8a-c07e1040bfb2
```

**Comparaison du quotidien :** chaque téléphone ou serveur invente un numéro de passeport en lançant beaucoup de dés. Personne n'appelle un bureau central. La chance que deux personnes tirent exactement le même long numéro est minuscule à l'échelle produit normale.

**Pourquoi les gens aiment**

- N'importe quelle machine peut frapper un ID hors ligne : téléphone, portable, pod cloud.
- Pas de compteur partagé. Pas de machine unique à saturer.
- Le scale horizontal est gratuit.

**Pourquoi les entretiens et les bases résistent souvent**

- 128 bits, pas 64. Clés plus larges et plus de stockage qu'un simple entier.
- Les UUID aléatoires (version 4) n'augmentent pas avec le temps. L'index reçoit des inserts dans un ordre aléatoire, ce qui peut ralentir les pages et gaspiller le cache.
- La string à tirets est laide si vous vouliez "uniquement des nombres."

Il existe un style plus récent (**UUIDv7**) qui met le temps devant pour que les IDs se trient à peu près par création. Vous payez toujours 128 bits.

**Quand UUID gagne :** IDs générés côté client, apps offline, ou équipes à l'aise avec des clés 128 bits.

---

## Option 2 : Ticket server (une machine à tickets de boulangerie)

Un **ticket server** est un petit système dont le seul job est de distribuer le prochain numéro. Flickr a décrit une version célèbre il y a des années : une toute petite base fait de l'auto-increment et renvoie le nouvel id. Chaque app demande : "Quel est le suivant ?"

**Comparaison du quotidien :** la machine à tickets papier d'une boulangerie. Tout le monde tire un ticket de la même machine. Les numéros restent uniques. Si la machine coince, la file s'arrête.

**Pourquoi les gens aiment**

- IDs numériques courts et simples.
- Facile à expliquer et à déboguer.
- Suffisant pour des débits d'écriture petits et moyens.

**Pourquoi ça fait mal sous forte charge**

- Chaque create dépend de cette machine (ou d'une petite paire). Si les tickets s'arrêtent, les creates s'arrêtent.
- Deux machines à tickets ont besoin d'une règle de partage (impairs et pairs, ou plages) pour ne jamais collisionner. Ça réintroduit le risque de config.
- Le plafond de débit est à peu près "jusqu'où un compteur peut pousser."

**Amélioration habituelle : distribuer un bloc de tickets.** Au lieu de demander un numéro par commande, chaque serveur d'app reçoit une plage, par exemple 5000 à 5999. Il la consomme en local. La machine à tickets est appelée rarement. C'est plus proche de beaucoup d'allocators de production.

Même ainsi, quelqu'un au centre possède les plages. C'est le trade-off.

---

## Option 3 : Snowflake (ticket de caisse : heure + machine + compteur)

**Snowflake** (le design façon Twitter, pas l'entrepôt cloud) construit un ID 64 bits à partir de trois idées :

1. **Quand** il a été fait (timestamp).
2. **Quelle machine** l'a fait (worker ou id de machine).
3. **Quel compte** sur cette machine dans cette minuscule tranche de temps (sequence).

**Comparaison du quotidien :** un ticket de caisse.

- La date et l'heure sont imprimées en premier.
- Le numéro de caisse suit (caisse 3 vs caisse 7).
- Le compteur local de cette caisse à ce moment termine la ligne.

Deux caisses peuvent toutes les deux imprimer "article 4" à la même seconde. Le ticket reste unique parce que le numéro de caisse diffère. Une seule caisse qui imprime deux articles dans la même milliseconde augmente le compteur local.

Un layout d'enseignement courant :

```
 0                   41 bits                    5     5      12
+-+----------------------------------------+-----+-----+----------+
|0|          timestamp (ms)                | DC  | Wkr | sequence |
+-+----------------------------------------+-----+-----+----------+
```

| Pièce | Bits | Rôle en français simple |
| --- | --- | --- |
| Inutilisé / signe | 1 | Garder le nombre positif |
| Timestamp | 41 | Millisecondes depuis une date de départ choisie (le lancement produit, pas forcément 1970) |
| Datacenter | 5 | Quel bâtiment ou région (jusqu'à 32) |
| Worker | 5 | Quelle machine dans ce bâtiment (jusqu'à 32) |
| Sequence | 12 | Compteur dans cette milliseconde sur ce worker (jusqu'à 4096) |

Certaines équipes fusionnent datacenter et worker en un id machine de 10 bits. L'idée reste : **heure + numéro de machine + compteur**.

### Pourquoi ça colle aux objectifs habituels

- Tient en 64 bits.
- Unique si les worker ids restent uniques et que la sequence ne wrap jamais dans la même milliseconde sur le même worker.
- À peu près ordonné par le temps : un timestamp plus grand fait un ID plus grand (si les horloges sont honnêtes).
- Haut débit : des milliers d'IDs par milliseconde par machine en théorie. Les vraies limites sont souvent le CPU et la façon de servir l'API.

### Chiffres de capacité utiles

- 41 bits de millisecondes, c'est environ **69 ans** depuis votre date de départ. Choisissez un départ près du lancement pour ne pas gaspiller des décennies vides.
- 12 bits de sequence, c'est **4096** IDs par worker par milliseconde. S'il en faut plus, attendez la milliseconde suivante.
- Les worker ids ne doivent pas collisionner. Deux process qui partagent le worker "7" peuvent frapper le même ID. Assignez les workers avec soin (config, lease depuis un coordinateur, ou carte fixe).

### Esquisse d'encode (un seul process)

```python
import time
import threading

class Snowflake:
    def __init__(self, datacenter_id: int, worker_id: int, epoch_ms: int):
        assert 0 <= datacenter_id < 32
        assert 0 <= worker_id < 32
        self.datacenter_id = datacenter_id
        self.worker_id = worker_id
        self.epoch_ms = epoch_ms
        self.sequence = 0
        self.last_ms = -1
        self.lock = threading.Lock()

    def next_id(self) -> int:
        with self.lock:
            now = int(time.time() * 1000)
            if now < self.last_ms:
                raise RuntimeError("clock went backwards")
            if now == self.last_ms:
                self.sequence = (self.sequence + 1) & 0xFFF
                if self.sequence == 0:
                    while now <= self.last_ms:
                        now = int(time.time() * 1000)
            else:
                self.sequence = 0
            self.last_ms = now
            ts = now - self.epoch_ms
            return (
                (ts << 22)
                | (self.datacenter_id << 17)
                | (self.worker_id << 12)
                | self.sequence
            )
```

Notes :

- Un départ personnalisé fait durer le champ 41 bits plus longtemps dès le jour un.
- Le lock protège la sequence dans un process. Deux process sur une machine ont besoin de deux worker ids.
- En overflow de sequence, attendez. Ne wrappez pas pour réutiliser des numéros dans la même milliseconde.

---

## Problèmes d'horloge en français simple

Snowflake fait confiance au temps. Les horloges des vrais ordinateurs se comportent parfois mal.

### Horloges qui reculent d'un coup

Les serveurs synchronisent l'heure avec NTP. Parfois l'horloge est poussée en douceur (bien). Parfois on la force en arrière d'un grand pas (dangereux pour un générateur d'IDs).

Imaginez que l'imprimante de tickets croit qu'il est 3:00:10, imprime un lot, puis l'horloge murale est forcée à 3:00:05. Si vous réimprimez avec le même numéro de caisse et le compteur local remis à zéro, vous réimprimez des numéros déjà utilisés. C'est une **collision**.

Bons réflexes :

1. **Refuser de frapper** jusqu'à ce que l'horloge dépasse la dernière heure utilisée.
2. **Dormir quelques millisecondes** si vous n'êtes que légèrement en retard.
3. Tenir une **dernière heure logique** : si l'horloge murale recule un peu, gardez la dernière heure connue et brûlez de la sequence ; si elle s'épuise, attendez.
4. Les horloges monotones (timers qui n'avancent que sur une machine) aident le rythme interne, mais le champ timestamp a encore besoin d'une idée partagée d'heure murale pour trier entre machines.

### Gel et redémarrages

Un process peut se figer (garbage collection, pause VM) et se réveiller plus tard. Au redémarrage, ne réutilisez pas un vieux triple (worker, milliseconde, sequence). Si vous stockez une marque haute par worker, attendez que le temps courant dépasse cette marque.

### Villes différentes, horloges différentes

Les IDs sont ordonnés selon les horloges qui les ont créés. La région A peut avoir quelques millisecondes de décalage avec B. Un événement arrivé d'abord en B peut encore obtenir un ID plus grand si l'horloge de B avance. Pour un ordre global strict, il faut d'autres outils. Pour la plupart des produits, "à peu près ordonné" suffit. Dites-le honnêtement.

### Hygiène ops

- Faites tourner la sync d'heure (chrony ou ntpd) sur chaque worker d'IDs.
- Alertez sur les grands offsets et les pas brutaux.
- Ne réglez pas l'horloge à la main sur un générateur en live.
- Certaines équipes ne génèrent des IDs que sur un petit ensemble de machines bien surveillées.

---

## Où vit le générateur

| Emplacement | Force | Faiblesse |
| --- | --- | --- |
| Lib dans chaque service | Le plus rapide, pas de hop | Chaque process a besoin d'un worker id unique |
| Sidecar local | Une implémentation, encore proche | Lié au cycle de vie du pod |
| API centrale de mint | Facile à auditer | Latence réseau et risque de panne partagée |
| Plages centrales, conso locale | Souvent le milieu pratique | Ne pas perdre des plages de façon dangereuse |

Les forts débits d'écriture préfèrent en général **Snowflake in-process avec des worker ids soignés**. Les objets admin à bas débit vont bien avec un ticket server ou une séquence de base classique.

---

## Notes de sécurité (courtes)

- Les IDs séquentiels ou triables par temps fuient le volume et le timing approximatif. Ne les traitez pas comme des jetons secrets. Autorisez toujours avec une vraie auth.
- Parfois vous gardez des ids Snowflake en interne et montrez aux utilisateurs un id public aléatoire à part.
- Les ids lourds en timestamp peuvent indiquer quand quelque chose a été créé. Traitez logs et URLs en conséquence.

---

## Comparaison côte à côte

| Approche | Image du quotidien | Bits | Ordre temporel | Coordination | Panne principale |
| --- | --- | --- | --- | --- | --- |
| Auto-increment BD | Un carnet de chèques | 64 | Oui sur un primary | Une base | Cette base est le goulot |
| UUID v4 | Passeports au hasard | 128 | Non | Aucune | Inserts aléatoires dans l'index |
| UUID v7 | Passeport avec date devant | 128 | Oui | Aucune (horloge locale) | Clés plus larges |
| Ticket server | Machine à tickets de boulangerie | 64 | Oui | Tickets centraux | La machine coince, la file s'arrête |
| Snowflake | Ticket de caisse : heure + caisse + compteur | 64 | À peu près oui | Worker ids uniques | Sauts d'horloge, worker id partagé |

---

## Récap à raconter à un ami

Imaginez que chaque nouvelle commande a besoin d'un numéro de ticket unique.

- **Un compteur d'une seule base**, c'est un tampon dans une agence. Sûr jusqu'à ce que beaucoup d'agences tamponnent en même temps, ou jusqu'à ce que tout le monde fasse la queue au même tampon.
- **UUID**, c'est lancer des dés pour un long passeport. Pas de bureau central. Le numéro est grand et souvent aléatoire, donc les index de base peuvent se désorganiser.
- **Ticket server**, c'est la machine de la boulangerie. Tout le monde tire au même endroit. Les numéros restent propres. Si la machine meurt, plus personne n'a de numéro sauf si vous distribuez des blocs de tickets à l'avance.
- **Snowflake**, c'est un ticket de caisse : **heure + numéro de machine + compteur local**. Les machines travaillent en parallèle sans appeler le central à chaque fois. Il faut donner à chaque machine son propre numéro, et ne pas faire confiance à une horloge qui recule sans garde-fous.

Si vous ne retenez que deux bugs de production : deux process qui partagent le même worker id, et le temps qui recule pendant que la sequence se réinitialise. Le layout de bits est la partie facile. Protéger l'identité et le temps, c'est le vrai travail.

---

## Un design que vous pouvez défendre (court)

**Objectif :** nombres 64 bits, uniques dans le produit, à peu près ordonnés par le temps, des dizaines de milliers d'IDs par seconde, multi-AZ.

**Proposition :**

1. Bits style Snowflake : inutilisé + timestamp + worker + sequence.
2. Epoch custom = jour de lancement du service en UTC.
3. Worker ids en lease ou assignés pour qu'aucun couple de générateurs vivants ne partage le même.
4. Frapper dans le process, pas via un appel distant à chaque insert.
5. Sur rollback d'horloge : arrêter de frapper et alerter.
6. Stocker en `BIGINT`. Pour les APIs JSON publiques, envisagez des strings décimales pour que les clients JavaScript ne perdent pas la précision au-dessus de `2^53 - 1`.

**Quand choisir autre chose à voix haute :** UUID si 128 bits vous vont et que la simplicité gagne. Ticket server si le débit d'écriture est bas et que les entiers courts comptent. Snowflake quand vous voulez des IDs compacts, triables, haut débit et que vous investirez dans l'identité worker et la discipline d'horloge.

---

## Clôture

Les IDs uniques ressemblent à une feature d'une ligne jusqu'à ce que beaucoup d'écrivains partagent le produit. **UUID** enlève la coordination et se paie en largeur et (pour les versions aléatoires) en localité d'index. **Ticket servers** gardent de courts entiers et réintroduisent un goulot central sauf si vous allouez des plages. **Snowflake** emballe heure, identité de machine et compteur par tick en 64 bits, comme un ticket de caisse qui ne réimprime jamais la même ligne sur la même caisse au même moment.

Protégez l'horloge et le worker id. Le reste est de l'arithmétique.