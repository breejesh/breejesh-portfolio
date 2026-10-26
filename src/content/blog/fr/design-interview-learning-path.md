---
title: "Continuer à apprendre la conception de systèmes : briques, ordre de pratique et cette série"
description: "Un plan d'étude pour la conception de systèmes : dans quel ordre lire cette série et pourquoi, les briques que réutilise toute conception, comment s'entraîner pour que cela reste, les livres et blogs d'ingénierie qui valent votre temps, et comment savoir quand vous êtes vraiment prêt."
date: "2026-01-30"
tags: [Design Système et Architecture]
coverImage: /assets/images/design-interview-learning-path.webp
previewImage: /assets/images/design-interview-learning-path.webp
---

> **TL;DR**
> * **Le problème :** La conception de systèmes s'apprend souvent comme un tas d'études de cas sans lien entre elles. On mémorise « comment fonctionne Twitter », puis on se fige dès que l'énoncé change un peu.
> * **Le parcours :** Apprenez d'abord le processus (cadre, estimations, montée en charge), puis les briques (partitionnement, réplication, identifiants, limitation de débit), ensuite les conceptions de produits classiques qui les combinent, et enfin les grands systèmes gourmands en données. Entraînez-vous sur chacun à voix haute, chronomètre en main, avant de lire la solution.
> * **Le résultat :** Vous arrêtez de mémoriser des conceptions et commencez à reconnaître la même douzaine d'idées dans de nouvelles combinaisons. C'est ce qui se transfère aux entretiens et aux vraies revues d'architecture.

Chaque article de cette série réutilise le même petit ensemble d'idées : répartir les données, copier les données, placer une file devant le travail lent, mettre en cache ce qui est souvent lu, et décider de ce qui se passe quand quelque chose tombe en panne. Les études de cas ne sont que des agencements différents de ces idées.

Cet article est la carte : quoi lire et dans quel ordre, sur quoi s'entraîner, et où aller une fois cette série terminée.

---

## La feuille de route

![Feuille de route en quatre phases : la phase zéro couvre le processus avec le cadre d'entretien, les estimations et la montée en charge de zéro à des millions ; la phase un couvre les briques avec le hachage cohérent, le magasin clé-valeur, le générateur d'identifiants uniques, le limiteur de débit et le raccourcisseur d'URL ; la phase deux couvre les conceptions de produits avec les notifications, le fil d'actualité, le chat et l'autocomplétion ; la phase trois couvre les grands systèmes avec le robot d'exploration web, Google Drive et le streaming vidéo ; une note rappelle que les briques reviennent dans toutes les conceptions suivantes](/assets/images/hld/design-learning-roadmap.webp)

Les phases sont ordonnées pour que chacune s'appuie sur la précédente. Le fil d'actualité est bien plus facile quand vous savez déjà comment se comportent le partitionnement et le cache ; la plateforme vidéo est bien plus facile quand les files et les workers idempotents vous sont devenus familiers.

---

## Phase 0 : le processus

Lisez-les en premier, même si vous avez déjà fait de la conception de systèmes. Ce sont les habitudes que le reste de la série suppose acquises.

* [Un cadre pratique pour les entretiens de conception de systèmes](/blog/fr/design-interview-framework) : comment répartir 45 minutes et ce qui est noté.
* [Estimations au dos de l'enveloppe](/blog/fr/design-back-of-envelope-estimation) : transformer des adjectifs en chiffres qui choisissent la conception à votre place.
* [Passer de zéro à des millions d'utilisateurs](/blog/fr/design-scale-zero-to-millions) : l'évolution classique d'un serveur unique à un système multirégion, chaque étape déclenchée par un vrai goulot d'étranglement.

---

## Phase 1 : les briques

Chacune est assez petite pour être conçue entièrement et apparaît dans presque toutes les conceptions plus grandes.

| Article | L'idée à retenir |
| --- | --- |
| [Hachage cohérent](/blog/fr/design-consistent-hashing) | Ajouter un nœud doit déplacer une petite fraction des clés, pas presque toutes |
| [Magasin clé-valeur distribué](/blog/fr/design-key-value-store) | Quorums, réplication, gestion des conflits et comment le stockage LSM rend les écritures bon marché |
| [Générateur d'identifiants uniques](/blog/fr/design-unique-id-generator) | Des identifiants ordonnés sans compteur central, et le coût des problèmes d'horloge |
| [Limiteur de débit](/blog/fr/design-a-rate-limiter) | Les compromis entre algorithmes et les compteurs atomiques dans un stockage partagé |
| [Raccourcisseur d'URL](/blog/fr/design-url-shortener) | Génération de clés, cache pour une charge dominée par les lectures, chemin critique minimal |

---

## Phase 2 : les conceptions de produits

Elles combinent les briques en systèmes que les utilisateurs touchent directement. L'intérêt tient à la latence, à la diffusion et aux garanties de livraison.

| Article | L'idée à retenir |
| --- | --- |
| [Système de notifications](/blog/fr/design-notification-system) | Files, nouvelles tentatives, idempotence et respect des préférences des utilisateurs |
| [Fil d'actualité](/blog/fr/design-news-feed-system) | Diffusion à l'écriture ou à la lecture, et l'hybride qui gère les célébrités |
| [Système de chat](/blog/fr/design-chat-system) | Connexions de longue durée, ordre par conversation et états de livraison |
| [Autocomplétion de recherche](/blog/fr/design-search-autocomplete) | Précalculer les réponses hors ligne pour que le chemin en ligne soit une simple lecture |

---

## Phase 3 : les grands systèmes gourmands en données

Ici, la difficulté tient au volume et au coût : des pétaoctets, des milliards de pages, des millions de spectateurs simultanés.

| Article | L'idée à retenir |
| --- | --- |
| [Robot d'exploration web](/blog/fr/design-web-crawler) | Une frontière qui équilibre priorité et politesse, plus la déduplication à grande échelle |
| [Google Drive](/blog/fr/design-google-drive) | Synchronisation par blocs, adressage par contenu et gestion des conflits |
| [Streaming vidéo](/blog/fr/design-youtube-streaming) | Envois reprenables, transcodage parallèle, débit adaptatif et économie du CDN |

---

## Les briques, une ligne chacune

Si vous ne gardez qu'un tableau de cette série, gardez celui-ci. Presque toute question de conception est une combinaison de ces briques.

| Brique | Utilisez-la quand | Coût principal |
| --- | --- | --- |
| Répartiteur de charge | Vous avez plus d'une instance | Un saut de plus ; des contrôles de santé à bien régler |
| Cache | Les lectures dominent et un peu de retard est acceptable | Invalidation et démarrages à froid |
| Réplicas de lecture | Les lectures dépassent une base de données | Retard de réplication |
| Partitionnement | Les données ou les écritures dépassent une base de données | Requêtes entre partitions, rééquilibrage, clés chaudes |
| Réplication et quorums | Il faut survivre à la perte de nœuds | Latence d'écriture et gestion des conflits |
| File de messages | Le travail peut être asynchrone ou doit être relancé | Doublons ; il faut des consommateurs idempotents |
| CDN | Contenu statique ou multimédia pour beaucoup d'utilisateurs | Coût et invalidation du cache |
| Stockage objet | Gros fichiers | Latence plus élevée qu'un disque local |
| Hachage cohérent | Les nœuds arrivent et partent souvent | Charge inégale sans nœuds virtuels |
| Limitation de débit | Protéger des ressources partagées | Faux positifs lors de pics légitimes |

---

## Comment s'entraîner pour que cela reste

Lire une solution donne l'impression d'apprendre. Ce n'est presque jamais le cas. Ce qui marche :

1. **Essayez d'abord.** Avant de lire un article de cette série, réglez un chronomètre sur 45 minutes et concevez le système vous-même sur papier, à voix haute, en suivant le cadre.
2. **Puis comparez.** Lisez l'article et notez la ou les deux choses qui vous ont échappé. Ces notes sont votre vrai matériel d'étude.
3. **Revenez-y une semaine plus tard.** Reconcevez le même système de zéro sans regarder. Si vous savez expliquer le compromis principal sans notes, il est à vous.
4. **Changez une exigence.** Refaites une conception avec une variante : le raccourcisseur d'URL avec une audience mondiale et une confidentialité stricte, le chat avec chiffrement de bout en bout, le fil sans classement. Les variantes sont exactement ce que font les entretiens.
5. **Entraînez-vous avec quelqu'un.** Les entretiens blancs avec un pair révèlent les lacunes de communication que la pratique en solo cache. Jouez le recruteur à tour de rôle ; ce rôle vous apprend à quoi ressemble une bonne réponse.

---

## Où aller après cette série

**Livres**

* *Designing Data-Intensive Applications*, de Martin Kleppmann. Le meilleur livre sur le fonctionnement réel du stockage, de la réplication et de la cohérence. Lisez-le lentement.
* *System Design Interview*, volumes 1 et 2, d'Alex Xu. Un bon éventail d'études de cas ; cette série couvre beaucoup des mêmes problèmes sous un autre angle.
* *Site Reliability Engineering* (le livre SRE de Google). Gratuit en ligne. Les chapitres sur le risque, la supervision et la surcharge expliquent le côté opérationnel que les conceptions au tableau oublient.

**Articles de recherche à lire une fois**

* L'article Dynamo d'Amazon (les idées derrière l'article sur le magasin clé-valeur).
* Les articles Bigtable et MapReduce de Google.
* L'article Raft, pour une explication lisible du consensus.

**Blogs d'ingénierie**

Les blogs d'ingénierie des entreprises décrivent de vrais systèmes avec de vraies contraintes. Netflix, Discord, Cloudflare, Uber, Slack et Meta publient tous des articles détaillés sur la façon dont ils ont construit et fait grandir des systèmes précis. Lisez-en un par semaine et demandez-vous quelles briques il utilise.

---

## Comment savoir que vous êtes prêt

Vous êtes prêt pour les entretiens, et pour de vraies discussions de conception, quand :

* Vous pouvez prendre un énoncé inconnu et produire une liste d'exigences en cinq minutes sans bloquer.
* Vos estimations se terminent par une conclusion, pas seulement par des chiffres.
* Pour chaque composant que vous dessinez, vous savez dire ce qui casse sans lui.
* Vous savez nommer le compromis principal de votre conception et ce qui vous ferait choisir autrement.
* Vous pouvez approfondir au moins un domaine (stockage, messagerie ou cache) jusqu'à ce que le recruteur soit à court de questions.

---

## Ce qui reste

Je pensais que le but était de connaître plus d'architectures. En réalité, le but était d'en avoir besoin de moins. Une fois la douzaine de briques devenue familière, chaque nouveau système ressemble à un remix, et la vraie question devient : quel compromis ce produit-là peut-il se permettre ?

C'est un endroit bien plus serein d'où concevoir. Commencez par la phase 0.

---

## Sources

* [Martin Kleppmann, « Designing Data-Intensive Applications »](https://dataintensive.net/)
* [Livre SRE de Google (gratuit en ligne)](https://sre.google/sre-book/table-of-contents/)
* [DeCandia et al., « Dynamo: Amazon's Highly Available Key-value Store » (2007)](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
* [Chang et al., « Bigtable: A Distributed Storage System for Structured Data » (2006)](https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/)
* [Ongaro et Ousterhout, « In Search of an Understandable Consensus Algorithm » (Raft, 2014)](https://raft.github.io/raft.pdf)
* [Alex Xu, « System Design Interview: An Insider's Guide »](https://www.amazon.com/System-Design-Interview-insiders-Second/dp/B08CMF2CQF)
