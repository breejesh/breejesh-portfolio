---
title: "Concevoir un système de chat : talkies-walkies, bureau de poste et coches vertes"
description: "Conception d'un système de chat pour débutants absolus : chemin en ligne en direct contre stockage de l'historique, 1:1 et petits groupes, présence, coches de livraison, et comment tout expliquer à un ami."
date: "2025-11-19"
tags: [Design Système et Architecture, Backend et Bases de Données]
coverImage: /assets/images/design-chat-system.webp
previewImage: /assets/images/design-chat-system.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Conception d'un système de chat pour débutants absolus : chemin en ligne en direct contre stockage de l'historique, 1:1 et petits groupes, présence, coches de livraison, et comment tout expliquer à un ami.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Ouvre WhatsApp ou iMessage. Tape une ligne. Envoie. Une coche apparaît. Parfois un point vert dit que ton ami est en ligne. On dirait de la magie. Ce n'est pas de la magie. Ce sont deux vieilles idées en habits modernes.

**Idée 1 : un talkie-walkie.** Quand les deux personnes sont connectées tout de suite, le serveur garde une ligne ouverte pour que les mots passent en une fraction de seconde.

**Idée 2 : un bureau de poste.** Chaque message est aussi classé dans un entrepôt (la base de données). Quand quelqu'un était hors ligne, ou rouvre l'app plus tard sur un autre téléphone, l'historique vient de cet entrepôt, pas de l'air.

Si tu ne retiens qu'une phrase de ce billet, que ce soit celle-ci : **la connexion en direct sert à la vitesse ; le store de messages sert à la vérité.**

Ce guide enseigne le design d'un système de chat comme un professeur patient : langage simple d'abord, comportement produit ensuite, boîtes d'entretien en dernier. On cadre un produit style Messenger : chat 1:1, petits groupes, texte, présence en ligne, coches de livraison et historique multi-appareils. Pour le détail filaire WebSocket (handshake, heartbeats, reconnect), voir [WebSockets pour apps temps réel](/blog/fr/websockets-realtime-basics). Ici on reste sur l'architecture produit.

---

## Que construisons-nous ?

Avant les boîtes et les flèches, fixe le produit. Les entretiens se cassent quand on invente des salons à l'échelle Discord alors que l'énoncé était « WhatsApp entre amis ».

| Question | Réponse par défaut de ce billet |
| --- | --- |
| 1:1, groupes, ou les deux ? | Les deux |
| Taille de groupe | Environ 100 membres max |
| Clients | Téléphone et web |
| Échelle d'exemple | Des dizaines de millions d'utilisateurs par jour (ordre de grandeur) |
| Type de message | Texte d'abord ; photos plus tard |
| Historique | Garder longtemps |
| Même compte téléphone + ordinateur | Oui |
| Chiffrement de bout en bout | Hors périmètre sauf demande |
| Notifier hors ligne | Oui (notification push) |

**Ce que l'utilisateur doit pouvoir faire**

1. Envoyer et recevoir des messages 1:1 vite quand les deux sont en ligne.
2. Discuter dans un petit groupe.
3. Voir qui est en ligne ou hors ligne (présence).
4. Ouvrir l'app et charger les anciens messages.
5. Rester synchronisé sur plusieurs appareils.
6. Recevoir un push hors ligne, puis rattraper à l'ouverture de l'app.

**Ce qu'on ne conçoit pas sauf demande :** appels voix, salons d'un million de personnes, réactions, recherche dans tout l'historique, crypto E2E complète. Nomme-les hors périmètre pour rester honnête.

---

## Le modèle mental central : talkie-walkie et bureau de poste

### Talkie-walkie = chemin en ligne

Imagine deux amis avec des talkies-walkies sur le même canal. Appuie, parle, relâche. L'autre entend **si** il écoute **maintenant**.

Dans le chat :

- Le téléphone tient une **connexion longue durée** vers un serveur de chat (souvent un WebSocket).
- Quand tu envoies « j'arrive », le serveur peut **pousser** ce texte sur la connexion ouverte de ton ami tout de suite.
- Pas besoin de demander toutes les secondes « des messages ? ». Le serveur parle quand quelque chose se passe.

Ce fil en direct explique pourquoi le chat semble instantané. Il explique aussi pourquoi les serveurs de chat sont durs : des millions de téléphones peuvent garder un socket ouvert en même temps.

### Bureau de poste = stockage de l'historique

Un talkie-walkie ne sert à rien pour la conversation de la semaine dernière. Il faut un système d'archivage.

Dans le chat :

- Chaque message accepté est **écrit en stockage durable** (une base faite pour beaucoup de petits appends).
- Si ton ami était hors ligne, le message reste dans le store.
- Quand il ouvre l'app, le client demande : « donne-moi tout après le message id X ».
- Quand il passe du téléphone à l'ordinateur, l'ordinateur charge l'historique depuis le même store.

**Règle pratique**

| Chemin | Rôle | Échec si tu t'y fies seul |
| --- | --- | --- |
| Connexion en direct (talkie-walkie) | Livraison rapide tant que tu es en ligne | Rate tout ce qui est envoyé déconnecté |
| Store de messages (poste) | Historique durable et rattrapage | Trop lent si on ne fait que du pull sans push |

Le chat de production utilise **les deux**. Le push en direct accélère. Le store est la source de vérité. Si un push est perdu sur un réseau capricieux, le prochain sync depuis le store referme le trou.

---

## Comment le téléphone reste « sur la ligne » ?

Les requêtes web classiques ressemblent à une carte postale avec réponse. Bien pour le login ou le profil. Mauvais pour le chat.

Le chat a besoin que le serveur parle **en premier** quand un message t'arrive. Options courantes :

| Approche | Résumé débutant | Bon pour le chat ? |
| --- | --- | --- |
| Short polling | L'app demande toutes les quelques secondes « quelque chose de neuf ? » | Gaspilleur ; souvent « non » |
| Long polling | L'app demande et le serveur attend qu'il y ait quelque chose | Ça marche ; maladroit à l'échelle |
| **WebSocket** | Un long tuyau ouvert dans les deux sens après un petit handshake | **Oui, par défaut** |
| HTTP REST | Requête et réponse normales | Login, pages d'historique, réglages |

Beaucoup de produits envoient les messages en WebSocket et gardent HTTP pour le travail ennuyeux (inscription, liste d'amis, vieux historique). La coupure importante :

- **APIs HTTP sans état :** n'importe quel serveur peut répondre ; facile à scaler.
- **Gateways de chat avec état :** chaque téléphone vivant est épinglé sur **un** nœud de chat qui tient son socket.

Les connexions collantes demandent une carte : « l'utilisateur B est connecté sur le chat server 7, appareil téléphone ». Cette carte vit dans un store rapide (souvent Redis). Sans elle, le serveur 1 ne sait pas crier vers B qui est sur le serveur 7.

---

## Architecture vue d'ensemble (encore simple)

Trois sortes de pièces, pas cinquante logos.

### 1. APIs produit ennuyeuses (sans état)

Auth, profil, contacts, liste de conversations, historique. Derrière un load balancer normal. On ajoute des machines quand le trafic grandit.

### 2. Serveurs de chat (avec état)

Tiennent les sessions WebSocket. Acceptent les nouveaux messages. Poussent messages, « est en train d'écrire » et événements de présence. Cherchent où un utilisateur est connecté.

### 3. Systèmes de soutien

| Pièce | Travail en mots simples |
| --- | --- |
| Store de messages | L'entrepôt postal de tout l'historique |
| Générateur d'IDs | Ids de message uniques, idéalement à peu près ordonnés dans le temps |
| Carte de sessions | `user_id → quel serveur de chat et quels appareils` |
| Store de présence | En ligne / hors ligne, dernière activité |
| Bus entre serveurs | Dit aux autres nœuds « livre ceci à l'utilisateur B » |
| Service push | Notification écran verrouillé s'il n'y a pas de socket vivant |
| Object storage (plus tard) | Photos et vidéos |

```
Téléphone / web ──HTTP──► API (auth, pages d'historique)
Téléphone / web ──WS────► Serveur de chat ──► bus ──► autres serveurs
                               │
                               ├── store de messages (vérité)
                               ├── carte session + présence
                               └── fournisseur push (si hors ligne)
```

---

## Se mettre en ligne : rejoindre la bonne tour talkie-walkie

Quand l'app s'ouvre :

1. Le client s'authentifie auprès de l'API et reçoit un token de courte durée.
2. **Service discovery** répond : « ouvre ton WebSocket sur cet hôte de chat » (sain, pas saturé, de préférence région proche).
3. Le client ouvre le WebSocket avec ce token.
4. Le serveur de chat valide le token, écrit l'entrée de session, te marque **en ligne**, et écoute les heartbeats.

Si ce serveur meurt, discovery arrête de l'annoncer. Les clients se reconnectent avec backoff et atterrissent sur un nœud sain. Les messages non envoyés attendent dans une outbox locale du téléphone jusqu'à l'ack serveur.

Pense à discovery comme l'opérateur qui t'assigne une tour radio libre au lieu d'entasser tout le monde sur une tour cassée.

---

## Que stocke-t-on pour chaque message ?

Les écritures de chat sont surtout des appends : de nouvelles lignes en fin de conversation. Un enregistrement pratique ressemble à ceci :

| Champ | Pourquoi |
| --- | --- |
| `message_id` | Id unique, de préférence triable par le temps |
| `conversation_id` | Quel fil de discussion |
| `sender_id` | Qui a envoyé |
| `body` | Le texte |
| `created_at` | Heure serveur |
| `type` | texte, notice système, etc. |
| `client_msg_id` (optionnel) | Évite le double envoi quand le réseau réessaie |

Patterns d'accès qui comptent :

1. **Ouvrir une conversation :** les N derniers messages pour ce `conversation_id`, puis plus anciens en scrollant.
2. **Rattraper un appareil :** tout pour cet utilisateur plus récent que le curseur X.
3. **Fan-out de petit groupe :** souvent une copie ou un pointeur dans l'inbox de chaque membre pour que chaque téléphone ne lise **que son** courrier.

En entretien, on aime souvent une histoire key-value ou wide-column (partition par conversation ou par inbox destinataire) parce que le volume d'écriture est élevé et l'accès se fait par clé, pas par jointures complexes. SQL avec de bons index marche à plus petite échelle ; dis quand tu en sortirais.

**Idempotence :** le téléphone peut renvoyer le même message deux fois après un micro-coupure. Clé `(sender_id, client_msg_id)` pour que le bureau de poste tamponne une lettre, pas deux copies.

---

## Flux 1:1 : A écrit à B

A est sur le chat server 1. B est sur le chat server 2.

```
1. A → WebSocket → serveur 1 : {to: B, body, client_msg_id}
2. Serveur 1 vérifie : autorisés à parler ? rate limit ok ?
3. Attribue message_id, écrit dans le store
4. Ack vers A → l'UI affiche « envoyé »
5. Cherche B dans la carte de sessions
6a. B en ligne : prévient le serveur 2 via le bus → push sur le socket de B → « livré » quand l'app de B ack
6b. B hors ligne : file une notification push ; le message attend dans le store pour le sync
7. Lecture : l'app de B signale « j'ai vu jusqu'à message_id » → met à jour le store → notifie les appareils de A
```

**Ordre :** garde l'ordre **dans une conversation** (ou au moins par expéditeur). L'ordre global de tous les chats de la planète est cher et inutile.

**Vérité contre vitesse :** si le bus perd un push en direct, B reçoit quand même le message au sync depuis le store. Le fan-out en direct ne remplace pas le stockage durable.

---

## Coches de livraison : ce que chaque marque signifie vraiment

Les utilisateurs lisent les coches comme des émotions. Les ingénieurs doivent les mapper à des événements.

| Ce que tu vois | Ce que le système signifie |
| --- | --- |
| Horloge / envoi / échec | Encore seulement sur le téléphone ; le serveur n'a pas accepté |
| **Envoyé** (une coche) | Le serveur a écrit le message et renvoyé `message_id` |
| **Livré** (deux coches) | Au moins un appareil du destinataire l'a reçu (ou marqué livré après fetch) |
| **Lu** (bleu / rempli) | Le client du destinataire a signalé le message comme vu |

Notes défendables en entretien :

- **Envoyé** est autorité serveur après persist. N'affiche pas « envoyé » seulement parce que l'UI l'a peint de façon optimiste.
- **Livré** a besoin d'un ack client sur le chemin en direct, ou d'un ack après pull depuis le store. Multi-appareils : choisis une règle, souvent « n'importe quel appareil ».
- **Lu** est souvent coalescé : « lu jusqu'à l'id X » au lieu d'une ligne par message à chaque scroll.
- Ne bloque jamais l'envoi sur la lecture de l'autre. Le statut voyage à côté du chemin principal.

Analogie : « envoyé » signifie que le bureau de poste a accepté la lettre. « Livré » signifie qu'elle a atteint sa boîte ou sa main. « Lu » signifie qu'il l'a ouverte.

---

## Petits groupes : un cri, beaucoup de boîtes aux lettres

Pour des groupes jusqu'à environ 100 personnes, un modèle pratique est le **fan-out à l'écriture** vers des inboxes par utilisateur :

1. A envoie à `group_id`.
2. Le serveur charge la liste des membres (en cache).
3. Écrit le message canonique une fois pour l'historique du groupe.
4. Place une copie ou un pointeur dans l'**inbox de sync de chaque membre**.
5. Pousse en direct vers chaque membre en ligne sur son serveur de chat.
6. Les hors ligne reçoivent un push et se synchronisent plus tard.

Pourquoi copier pour un petit N ?

- Chaque client ne lit **que son** inbox pour rattraper. Modèle mental simple.
- Livraisons partielles et bizarreries d'appartenance sont plus faciles par utilisateur.
- Le coût est O(membres) en stockage et travail par message. Fine à 100. Douloureux à 100 000.

Pour d'énormes salons (pense Discord public), on inverse le modèle : stocker une fois par canal, les membres tirent ou s'abonnent au flux, et la présence devient approximative. Dis ce trade-off à voix haute. Ne prétends pas qu'un design 1:1 scale à une salle d'un million juste en « ajoutant des serveurs ».

**Changement d'appartenance :** un nouveau membre voit-il l'historique d'avant son arrivée ? C'est une règle produit. Mentionne-la.

---

## Présence : les points verts et gris

« En ligne » n'est pas un booléen peint une fois au login. Les réseaux mobiles clignotent. Un design naïf te met hors ligne à chaque micro-coupure et la liste de contacts clignote.

### Signaux qui marchent

| Événement | Effet sur la présence |
| --- | --- |
| Login WebSocket réussi | Candidat en ligne |
| Heartbeat toutes les quelques secondes | Rester en ligne |
| Logout propre | Hors ligne tout de suite |
| Heartbeats manqués au-delà d'une fenêtre de grâce (exemple : 30s) | Hors ligne |
| Micro-coupure sous la fenêtre de grâce | Rester en ligne |

Stocke quelque chose comme :

```
user_id → { status: online|offline, last_active_at, devices: [...] }
```

Souvent dans Redis avec un TTL rafraîchi par les heartbeats.

### Qui doit être informé ?

Pour une liste d'amis modeste, publie les changements de présence aux amis intéressés (ou à ceux qui consultent ce profil). Leurs serveurs de chat poussent un petit « maintenant en ligne ».

Pour d'énormes groupes, ne spamme pas 100 000 personnes à chaque clignement en ligne. Charge la présence à l'ouverture de la liste des membres ; rafraîchis à la demande.

La présence est **éventuellement cohérente**. Quelques secondes d'erreur valent mieux qu'un système qui fond sous les tempêtes de statut.

Analogie : la lumière verte signifie « je t'entends sur le canal maintenant », pas « je possède un talkie quelque part sur Terre ».

---

## Multi-appareils : la même personne, deux radios

Téléphone et ordinateur ouverts. Chaque appareil garde un **curseur** : le dernier message id déjà appliqué.

À la connexion ou à la reprise :

1. Ouvre la connexion en direct (et/ou sync HTTP).
2. Demande : messages pour moi où `message_id > cursor`.
3. Applique, avance le curseur, peins l'UI.

Tant que les deux sont vivants, la carte de sessions tient **plusieurs** connexions par utilisateur. Le fan-out pousse vers chaque connexion pour que les deux écrans se mettent à jour sans attendre le prochain pull. Le curseur répare le mode veille, le mode avion et les apps tuées.

---

## Scale sans jargon de panique

### Connexions

Chaque nœud de chat tient une tranche de sockets ouverts. Le nombre de connexions (et la mémoire par socket) fait souvent mal avant le CPU. Scale horizontal = plus de nœuds de chat et discovery qui répartit les nouveaux logins. Au déploiement, draine les vieux nœuds ; les clients se reconnectent.

Math d'entretien ajustable en direct :

- 50M d'utilisateurs par jour.
- Le pic de connexions concurrentes peut être une fraction du DAU (exemple : 10M en ligne à la fois).
- Si chaque connexion coûte de l'ordre de 10 Ko de RAM serveur pour buffers et état de session, ce sont des dizaines de Go de mémoire de connexion **sur la flotte entière**, pas sur un seul ordinateur.

### Chemin des messages

- Partitionne le store par conversation ou par inbox destinataire.
- Chemin chaud : autoriser → id → **persister** → ack « envoyé » → fan-out asynchrone.
- Garde les notifications push et l'analytique hors du chemin critique de l'ack.

### Pannes qui méritent d'être nommées

| Panne | Mitigation |
| --- | --- |
| Un nœud de chat meurt | Reconnect client + discovery ; rattrapage depuis le store |
| Bus coupé entre nœuds | Store + sync = vérité |
| Envoi en double | Idempotence via `client_msg_id` |
| Groupe chaud | Cache des membres ; rate limit ; backpressure |
| Tempête de présence | Grâce heartbeat ; à la demande pour les grands rosters |
| Message monstre | Plafond de taille à la gateway |

### Cohérence en une respiration

- Après ack serveur : le message est durable et apparaîtra (push ou sync plus tard).
- Livraison en direct : best effort, chemin rapide.
- Accusés de lecture et présence : éventuels.

Cette coupure garde le bouton Envoyer honnête sous pannes partielles.

---

## Sécurité et abus (profondeur entretien)

- Authentifie le WebSocket ; renouvelle les tokens sans jeter le tuyau à la légère.
- Autorise chaque envoi (blocages, appartenance au groupe).
- Rate limit par utilisateur et par groupe.
- Plafonne la taille du corps.
- TLS sur le fil (WSS). Chiffrement au repos dans le store. L'E2E complet est un autre design (clés sur chaque appareil).
- Le fan-out côté serveur implique que le serveur peut lire le texte en clair sauf engagement E2E. Dis dans quel monde tu es.

---

## Design que tu peux défendre au tableau

**Produit :** style Messenger à grande échelle, 1:1 + groupes ≤100, texte, présence, multi-appareils, push hors ligne.

**Pièces :**

1. Cluster d'API HTTP (auth, profil, historique).
2. Discovery d'endpoints de chat sains.
3. Flotte de gateways de chat (WebSockets + mises à jour de session).
4. Générateur d'IDs.
5. Store de messages (partitionné pour append et lectures par conversation).
6. Store rapide pour sessions et présence.
7. Pub/sub ou file pour livraison entre nœuds.
8. Workers push (APNs / FCM).

**Envoi 1:1 :** WS → valider → id → persister → ack envoyé → router vers le nœud destinataire ou push → livré/lu en événements latéraux.

**Groupe :** pareil, avec expansion d'appartenance et fan-out d'inbox par utilisateur pour petit N.

**Sync :** curseur par appareil depuis le store ; push en direct vers toutes les sessions actives.

**Trade-offs à dire à voix haute :**

- WebSocket dans les deux sens simplifie le client ; HTTP pour envoyer + WS pour recevoir marche aussi.
- Les copies d'inbox par utilisateur simplifient les petits groupes ; elles cassent pour d'énormes canaux.
- Le fan-out en direct ne remplace pas le stockage durable.
- La présence a besoin de heartbeats et de grâce, pas d'événements bruts de déconnexion TCP.
- Un seul serveur qui tient tous les sockets est un jouet, pas un chat mondial.

---

## Checklist production

- [ ] Périmètre : 1:1, taille de groupe, média, chiffrement, rétention
- [ ] Coupure HTTP vs WebSocket claire
- [ ] Discovery ne renvoie que des nœuds de chat sains
- [ ] Carte de sessions multi-appareils
- [ ] Ids de message uniques et faciles à fusionner
- [ ] Envoi idempotent avec ids client
- [ ] Persister avant (ou avec sémantique claire de) « envoyé »
- [ ] Livré et lu définis pour multi-appareils
- [ ] Chemin push hors ligne testé
- [ ] Heartbeat de présence + fenêtre de grâce
- [ ] Coût de fan-out de groupe borné (ou autre modèle pour grand N)
- [ ] Rate limits et taille max de corps en bordure
- [ ] Histoire de drain et reconnect pour deploys et mort de nœud
- [ ] Métriques : connexions, QPS d'envoi, latence d'ack, lag de fan-out, succès push, taux de reconnect

---

## Récap que tu peux raconter à un ami

Imagine le chat comme deux systèmes collés.

D'abord, un **réseau de talkies-walkies**. Tant que tu es en ligne, le téléphone garde une ligne vivante vers un serveur de chat. Les messages poussent sur cette ligne et le chat semble instantané. Les points verts disent « je suis sur le canal maintenant », rafraîchis par des heartbeats silencieux pour qu'un micro-trou de tunnel ne te peigne pas hors ligne.

Ensuite, un **bureau de poste**. Chaque message accepté est classé. Les coches signifient : accepté par la poste (envoyé), arrivé sur leur appareil (livré), ouvert (lu). Si ton ami dormait ou était hors ligne, la lettre reste dans le store. Quand il ouvre l'app, ou un second appareil, il tire l'historique avec un curseur : « donne-moi tout après la dernière chose que j'ai déjà ».

Le chat un à un est une lettre avec un cri en direct s'ils sont connectés. Les petits groupes font beaucoup de copies (ou pointeurs) de boîte aux lettres pour que chacun rattrape depuis sa propre inbox. Les salons publics énormes demandent un autre modèle ; n'étire pas pour toujours le design des petits groupes.

Si un cri en direct échoue, l'entrepôt a encore la lettre. **La vitesse, c'est le talkie-walkie. La vérité, c'est le bureau de poste.** Voilà tout le système de chat en une respiration.

---

## Clôture

Un système de chat n'est pas « des WebSockets plus une base de données ». Ce sont des sessions temps réel collantes, un journal durable de messages en append, et des règles de fan-out qui changent avec la taille du groupe, plus présence et sync pour que la vie multi-appareils et les réseaux capricieux semblent voulus plutôt que cassés.

Épine d'entretien : **HTTP pour le CRUD ennuyeux, WebSocket pour le fil en direct, store comme source de vérité, push comme chemin rapide, inbox par utilisateur pour les petits groupes, heartbeats pour la présence.** Le reste, c'est du dimensionnement, de la gestion de panne et du périmètre produit.

Quand quelqu'un demande « et si le groupe a un million de membres ? », change le modèle de fan-out. N'ajoute pas seulement des serveurs à un design de talkie-walkie en espérant.