---
title: "Continuer à apprendre le system design : blocs, ordre de pratique et cette série"
description: "Après les designs d'entretien classiques, apprenez les blocs réutilisables en langage simple, suivez un ordre de pratique pour débutants, et utilisez cette série du blog comme carte d'étude."
date: "2026-01-30"
tags: [Conception de systèmes]
coverImage: /assets/images/design-interview-learning-path.webp
previewImage: /assets/images/design-interview-learning-path.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Après les designs d'entretien classiques, apprenez les blocs réutilisables en langage simple, suivez un ordre de pratique pour débutants, et utilisez cette série du blog comme carte d'étude.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Vous avez fini la liste. Rate limiter. Raccourcisseur d'URL. Feed. Chat. Drive. Vidéo. On a l'impression d'une ligne d'arrivée.

Puis un nouveau sujet arrive avec un autre nom de produit, et les mêmes quelques idées reviennent dans la pièce. Ce n'est pas un échec. C'est la leçon.

**Les designs étaient des exercices. Les blocs de construction sont le vrai cours.**

Ce billet est un plan d'étude pour après ce premier passage. Je reste simple. Une phrase par bloc. Un ordre de pratique qui s'accumule. Des liens vers cette série pour toujours savoir quoi ouvrir ensuite. Imaginez un professeur patient : pas de hype, juste une carte que vous pouvez vraiment suivre.

Si le process d'entretien reste flou, commencez par le [framework d'entretien](/blog/fr/design-interview-framework) et l'[estimation back-of-the-envelope](/blog/fr/design-back-of-envelope-estimation). Si vous n'avez jamais mené un seul serveur jusqu'à un croquis multi-région, faites [passer de zéro à des millions](/blog/fr/design-scale-zero-to-millions) une fois avec un timer.

---

## Ce que "prêt" veut vraiment dire

Vous n'êtes pas prêt parce que vous redessinez une architecture de mémoire. Vous êtes en bonne posture quand vous pouvez :

1. **Nommer les blocs** dont un design a besoin avant de tracer des boîtes.
2. **Expliquer pourquoi** un bloc entre ou sort pour ce produit.
3. **Changer d'outils** (Redis vs Memcached, Kafka vs SQS, hash vs range shard) sans réécrire toute l'histoire.
4. **Estimer grossièrement** (QPS, stockage, bande passante) avant d'inventer des services.
5. **Défendre deux ou trois trade-offs** à voix haute sous une pression légère.

Les entretiens récompensent ce muscle. Le vrai travail d'on-call le récompense davantage.

---

## Blocs de construction (une phrase simple chacun)

La plupart des designs produit sont des remix d'un petit ensemble d'idées. Apprenez-les à froid. Chaque nouveau sujet raccourcit.

### Load balancer

Un **load balancer** se place devant beaucoup de serveurs et envoie chaque requête vers un serveur sain pour qu'aucune machine n'ait à absorber tout le trafic.

### Cache

Un **cache** garde une copie chaude des données près de l'app pour que la plupart des lectures ne touchent jamais la base primaire lente.

### Shard

Un **shard** est une tranche du dataset (ou de la charge d'écriture) pour que plusieurs machines partagent un travail qu'une seule ne pourrait jamais tenir pour toujours.

### File d'attente (queue)

Une **queue** garde du travail pour plus tard pour que la requête utilisateur n'attende pas l'email, l'encodage, le fan-out, le crawl ou une API tierce instable.

### Réplica

Une **réplica** est une copie supplémentaire des données, utilisée pour le failover et souvent pour plus de capacité de lecture quand une seule copie ne suffit pas.

### Idée bonus : cohérence vs disponibilité

Quand le réseau se casse entre machines, vous ne pouvez souvent pas promettre un accord parfait et une dispo parfaite sur le même chemin en même temps, donc vous choisissez par fonction quelle douleur vous acceptez.

Vous n'avez pas besoin de slogans CAP sur chaque slide. Vous avez besoin d'une phrase calme : "Pour le checkout je préfère une cohérence plus forte. Pour un feed social je peux vivre avec un court délai."

---

## Comment les blocs apparaissent dans la série

Vous n'avez pas besoin de remplir chaque case au tableau. Vous devez savoir quelles cases portent le poids du sujet devant vous.

| Design | Load balance | Cache | Shard | Queue | Réplica |
| --- | --- | --- | --- | --- | --- |
| [Raccourcisseur d'URL](/blog/fr/design-url-shortener) | tier redirect | codes chauds | par code | analytics plus tard | store de mapping |
| [Rate limiter](/blog/fr/design-a-rate-limiter) | gateway | état Redis | par clé | rare | HA Redis |
| [News feed](/blog/fr/design-news-feed-system) | API + workers | timeline | par user | jobs fan-out | graphe + posts |
| [Chat](/blog/fr/design-chat-system) | serveurs de connexion | présence | par conversation | push offline | store de messages |
| [Autocomplete de recherche](/blog/fr/design-search-autocomplete) | tier query | cache de préfixes | dictionnaire | rebuilds | copies d'index |
| [Style YouTube](/blog/fr/design-youtube-streaming) | CDN + API | thumbs, manifests | vidéo / user | transcode | object store |
| [Style Google Drive](/blog/fr/design-google-drive) | bords d'upload | metadata | par owner / fichier | scan, index | metadata + blobs |

Motifs plus profonds par bloc :

- Cache : [patterns de cache Redis](/blog/fr/redis-caching-patterns)
- Travail async : [architecture event-driven](/blog/fr/event-driven-architecture-intro)
- Connexions live : [bases des WebSockets](/blog/fr/websockets-realtime-basics)

---

## Ordre de pratique pour débutants

Sauter au hasard donne l'impression d'avancer jusqu'à ce que ça ne marche plus. Cet ordre construit d'abord les prérequis. Ajustez si une section est déjà solide pour vous.

### Phase 0 : Process et chiffres (1 à 2 sessions)

1. [Framework d'entretien](/blog/fr/design-interview-framework) : exigences, API, données, haut niveau, detailed technical breakdowns, wrap-up.
2. [Estimation back-of-the-envelope](/blog/fr/design-back-of-envelope-estimation) : QPS, stockage, bande passante, nombre approximatif de machines sans fausse précision.
3. [De zéro à des millions](/blog/fr/design-scale-zero-to-millions) : scale vertical, load balancer, cache, réplica, shard comme une seule histoire.

### Phase 1 : Blocs du data plane (3 à 5 sessions)

4. [Consistent hashing](/blog/fr/design-consistent-hashing)
5. [Key-value store](/blog/fr/design-key-value-store)
6. [Générateur d'IDs uniques](/blog/fr/design-unique-id-generator)
7. [Rate limiter](/blog/fr/design-a-rate-limiter)
8. [Raccourcisseur d'URL](/blog/fr/design-url-shortener)

Pourquoi cet ordre : le hashing et le key-value reviennent sans cesse. Les IDs apparaissent dans presque chaque chemin d'écriture. Le rate limiting enseigne les compteurs partagés avec des horloges imparfaites. Le raccourcisseur d'URL est le premier produit complet qui tient encore en 45 minutes.

### Phase 2 : Async et graphes sociaux (4 à 6 sessions)

9. [Web crawler](/blog/fr/design-web-crawler)
10. [Système de notifications](/blog/fr/design-notification-system)
11. [News feed](/blog/fr/design-news-feed-system)
12. [Système de chat](/blog/fr/design-chat-system)
13. [Autocomplete de recherche](/blog/fr/design-search-autocomplete)

Ici les queues, le fan-out, la présence et les structures de préfixe cessent d'être abstraites. Couplez le chat avec les [bases des WebSockets](/blog/fr/websockets-realtime-basics) si l'état de connexion semble encore magique.

### Phase 3 : Média lourd et fichiers (2 à 3 sessions)

14. [Streaming style YouTube](/blog/fr/design-youtube-streaming)
15. [Google Drive](/blog/fr/design-google-drive)

Ceux-ci forcent à penser CDN, object storage, upload par chunks, pipelines d'encodage et cohérence des metadata. Faites-les quand vous savez déjà raconter une histoire propre sur les queues et la réplication.

---

## Comment pratiquer chaque design

Utilisez la même boucle à chaque fois. Les boucles ennuyeuses gagnent.

1. **Timer allumé** (35 à 45 minutes). Parlez à voix haute même seul.
2. **Exigences d'abord.** Qu'est-ce qui est in scope ? Qu'est-ce qui est hors scope ?
3. **Chiffres tôt.** Même approximatifs, ils changent le design.
4. **Un diagramme haut niveau.** Puis deep-dive sur seulement deux ou trois points chauds.
5. **Écrivez trois trade-offs** à la fin, pas dix.
6. **Le lendemain, redessinez à froid** sans notes. Les trous deviennent votre liste d'étude.

Extension optionnelle : construisez une mini version d'un bloc (token bucket dans Redis, un service de codes courts, un worker fan-out simple). Les entretiens valorisent le jugement plus que le code, mais livrer un bloc une fois tue beaucoup de vague à la main.

---

## Carte de la série (ce blog)

| Ordre | Sujet | Lien |
| --- | --- | --- |
| 1 | De zéro à des millions | [design-scale-zero-to-millions](/blog/fr/design-scale-zero-to-millions) |
| 2 | Estimation back-of-the-envelope | [design-back-of-envelope-estimation](/blog/fr/design-back-of-envelope-estimation) |
| 3 | Framework d'entretien | [design-interview-framework](/blog/fr/design-interview-framework) |
| 4 | Rate limiter | [design-a-rate-limiter](/blog/fr/design-a-rate-limiter) |
| 5 | Consistent hashing | [design-consistent-hashing](/blog/fr/design-consistent-hashing) |
| 6 | Key-value store | [design-key-value-store](/blog/fr/design-key-value-store) |
| 7 | Générateur d'IDs uniques | [design-unique-id-generator](/blog/fr/design-unique-id-generator) |
| 8 | Raccourcisseur d'URL | [design-url-shortener](/blog/fr/design-url-shortener) |
| 9 | Web crawler | [design-web-crawler](/blog/fr/design-web-crawler) |
| 10 | Système de notifications | [design-notification-system](/blog/fr/design-notification-system) |
| 11 | News feed | [design-news-feed-system](/blog/fr/design-news-feed-system) |
| 12 | Système de chat | [design-chat-system](/blog/fr/design-chat-system) |
| 13 | Autocomplete de recherche | [design-search-autocomplete](/blog/fr/design-search-autocomplete) |
| 14 | Streaming style YouTube | [design-youtube-streaming](/blog/fr/design-youtube-streaming) |
| 15 | Google Drive | [design-google-drive](/blog/fr/design-google-drive) |
| 16 | Ce learning path | [design-interview-learning-path](/blog/fr/design-interview-learning-path) |

Billets de soutien qui aiguisent les bords :

- [Comment fonctionne le DNS](/blog/fr/how-dns-works-for-engineers)
- [Comment fonctionnent HTTPS et TLS](/blog/fr/how-https-tls-works)
- [OAuth 2.0 pour les développeurs](/blog/fr/oauth2-for-developers)
- [Patterns de cache Redis](/blog/fr/redis-caching-patterns)
- [Architecture event-driven](/blog/fr/event-driven-architecture-intro)
- [WebSockets pour les apps temps réel](/blog/fr/websockets-realtime-basics)

---

## Un plan hebdomadaire simple

Si vous avez peu de temps, n'optimisez pas le plan. Exécutez le plan.

| Jour | Focus | Livrable |
| --- | --- | --- |
| Lun | Un bloc en profondeur (cache ou queue ou shard) | Une page de notes + modes de panne |
| Mer | Un design complet de la série | Tableau ou doc chronométré |
| Ven | Redessiner le design précédent à froid | Liste des trous seulement |
| Week-end (optionnel) | Un vrai eng blog d'entreprise | Trois idées réutilisables |

Quatre semaines régulières battent douze week-ends de vidéo passive.

---

## Comment continuer après la série

Les drills au tableau plafonnent. Étirez-vous dans trois directions calmes.

**1. Lisez une vraie architecture par semaine.** Demandez seulement : quels blocs ont-ils utilisés, qu'est-ce qui a cassé à l'échelle précédente, et qu'ont-ils refusé de faire ?

**2. Comparez deux designs qui partagent un bloc.** Rate limiter vs générateur d'IDs demandent tous deux du soin en écriture multi-nœuds. Fan-out de feed vs fan-out de notifications demandent queues et idempotence, mais avec des budgets de latence différents. Écrivez cinq puces sur ce qui se transfère et ce qui ne se transfère pas.

**3. Ajoutez un peu de profondeur opérationnelle.** Métriques (QPS, p99, lag de queue, hit ratio du cache), drills de panne simples (tuer un nœud de cache, freiner un consumer) et coût (quand le CDN bat le code malin).

Enseigner à quelqu'un d'autre est l'audit le plus rapide. Si vous ne pouvez pas expliquer le consistent hashing sans regarder un schéma, vous ne le possédez pas encore. C'est bien. C'est de l'information.

---

## Récap pour un ami

Si vous deviez envoyer ça en un message :

Tu as fini une pile de problèmes de system design. C'étaient des reps, pas le programme. Le programme, c'est cinq blocs : le load balancer répartit le trafic, le cache accélère les lectures chaudes, le shard découpe les données entre machines, la queue repousse le travail lent, la réplica copie les données pour la sécurité et les lectures. Apprends les blocs, pratique les designs dans l'ordre du process et des chiffres jusqu'aux systèmes média, et garde une petite boucle hebdo d'étude, de design chronométré et de redessin à froid. La série de ce blog est un chemin complet dans ce plan.

---

## Clôture

La compétence en system design n'est pas "j'ai mémorisé YouTube". C'est "je peux assembler load balancing, cache, sharding, queues, réplication et des choix honnêtes de cohérence sous une nouvelle histoire produit".

Commencez là où vous êtes faible. Si les chiffres font peur, faites l'estimation. Si l'async embrouille, faites crawler et notifications avant Drive. Si vous bloquez sur la structure, lancez le billet framework deux fois avec un timer.

Puis continuez. Une pratique régulière suffit. Pas besoin d'être dramatique. Il faut seulement venir à la prochaine session.