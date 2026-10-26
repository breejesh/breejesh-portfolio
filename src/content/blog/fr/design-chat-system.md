---
title: "Concevoir un système de chat : WebSockets, ordre des messages, accusés de réception et présence"
description: "Une conception de messagerie prête pour la production : serveurs WebSocket avec état et registre de sessions, numéros de séquence par conversation, envois idempotents, stockage partitionné par conversation, accusés de réception et de lecture sous forme de curseurs, groupes, synchronisation multi-appareils, présence, notifications push de secours et chiffrement de bout en bout."
date: "2025-11-19"
tags: [Design Système et Architecture, Backend et Bases de Données]
coverImage: /assets/images/design-chat-system.webp
previewImage: /assets/images/design-chat-system.webp
---

> **TL;DR**
> * **Le problème :** Acheminer des messages entre utilisateurs en bien moins d'une seconde, dans l'ordre, une seule fois du point de vue de l'utilisateur, malgré des réseaux mobiles capricieux, plusieurs appareils par utilisateur et des utilisateurs hors ligne pendant des jours.
> * **La conception :** Maintenir un WebSocket persistant par appareil sur des serveurs de chat avec état, enregistrer dans un registre de sessions quel serveur détient chaque utilisateur, attribuer à chaque message un numéro de séquence par conversation au moment de sa persistance, le router via un bus de livraison vers le serveur du destinataire, se rabattre sur les notifications push si le destinataire est hors ligne, et traiter les accusés de réception et de lecture comme des curseurs sur cette séquence.
> * **Le résultat :** L'ordre et la déduplication découlent des numéros de séquence, une reconnexion devient « envoie-moi tout ce qui suit la séquence N », et la partie avec état du système se réduit à une fine couche de connexions qui peut tomber sans perdre un seul message.

Le chat ressemble au produit le plus simple de cette série : vous tapez, l'autre voit. En dessous, c'est celui où les utilisateurs remarquent chaque défaut. Un message dans le désordre, un doublon après une reconnexion, une coche « lu » alors que ce n'est pas le cas : chacun devient un rapport de bug avec capture d'écran.

Cet article conçoit une messagerie 1:1 et petits groupes dans l'esprit de WhatsApp, Signal ou Messenger.

---

## Exigences et chiffres

**Fonctionnelles :** discussions 1:1 et de groupe (jusqu'à quelques centaines de membres), texte et médias, indicateurs envoyé, distribué et lu, présence en ligne, historique sur tous les appareils, notifications push hors ligne.

**Non fonctionnelles :** latence de bout en bout sous 500 ms pour les destinataires connectés ; aucun message perdu une fois que l'expéditeur voit « envoyé » ; ordre garanti dans chaque conversation ; fonctionnement sur des réseaux mobiles peu fiables.

| Hypothèse | Valeur | Conséquence |
| --- | --- | --- |
| Utilisateurs actifs quotidiens | 50 M | |
| Messages par utilisateur et par jour | 40 | 2 Md de messages/jour, ~23 k/s en moyenne, ~70 k/s en pic |
| Taille moyenne d'un message (avec métadonnées) | ~200 octets | ~400 Go/jour avant réplication |
| Connexions simultanées en pic | 15 M | À ~500 k connexions par serveur bien réglé, ~30 serveurs, plus la marge |

Les connexions persistantes coûtent peu à l'unité, mais elles sont innombrables. WhatsApp a annoncé dès 2012 plus de deux millions de connexions simultanées sur un seul serveur Erlang : la couche de connexion est donc moins une question de nombre brut que de résistance aux tempêtes de reconnexion.

---

## Pourquoi les WebSockets

| Transport | Comment le serveur atteint le client | Adéquation au chat |
| --- | --- | --- |
| Short polling | Le client interroge toutes les quelques secondes | Gaspilleur et en retard |
| Long polling | Le client garde une requête ouverte jusqu'à ce qu'il y ait du nouveau | Fonctionne, mais chaque message coûte une nouvelle requête |
| Server-Sent Events | Flux unidirectionnel depuis le serveur | Convient pour recevoir, mais il faut un autre chemin pour envoyer |
| WebSocket | Connexion bidirectionnelle sur une seule socket TCP/TLS | Adéquation naturelle : peu de surcoût dans les deux sens |

Les applications mobiles utilisent aussi le canal push du système (APNs, FCM) comme signal de réveil quand l'app est en arrière-plan et la socket fermée.

---

## L'architecture

![Architecture du chat : Alice et Bob se connectent en WebSocket à des serveurs de chat différents ; le service de messages attribue un numéro de séquence et l'ajoute à la base des messages, route via un bus de livraison qui cherche le serveur de Bob dans le registre de sessions, livre au serveur de chat de Bob, se rabat sur un notificateur push si Bob est hors ligne, et un service de présence suit les battements de cœur](/assets/images/hld/design-chat-architecture.webp)

* **Alice / Bob.** Chaque appareil garde un WebSocket ouvert tant que l'app est au premier plan. L'unité de connexion, ce sont les appareils, pas les utilisateurs.
* **Chat Servers.** Terminent les WebSockets et ne font presque rien d'autre. C'est la seule couche avec état (ils détiennent les sockets), on la garde donc fine : authentifier, transmettre les envois, pousser les livraisons, relayer les accusés.
* **Message Service.** Sans état. Valide le message, attribue le **numéro de séquence suivant de la conversation**, le persiste, et seulement ensuite accuse réception auprès de l'expéditeur. C'est le moment de la « coche grise » : quand Alice la voit, le message est durable.
* **Messages DB.** Partitionnée par conversation, ordonnée par numéro de séquence, pour que « donne-moi les messages de la conversation X après la séquence N » soit une lecture de plage contiguë. Discord a décrit exactement cette forme (canal plus tranche de temps comme partition, identifiants Snowflake à l'intérieur) dans ses articles sur le stockage de milliards, puis de milliers de milliards de messages.
* **Delivery Bus.** Chaque serveur de chat s'abonne à son propre sujet. Router un message vers Bob, c'est le publier sur le sujet du serveur qui détient les sockets de Bob.
* **Session Registry.** `user -> [(device, server)]`, dans Redis avec des TTL rafraîchis par les battements de cœur. Il répond à « où est Bob en ce moment ? ».
* **Push Notifier.** Si Bob n'a aucune socket active, on envoie un push via APNs ou FCM. Le push est un indice, pas la livraison : quand l'app se réveille, elle se synchronise depuis la base.
* **Presence Service.** Suit les battements de cœur pour calculer le statut en ligne et la dernière connexion, voir plus bas.

Le choix de conception clé : **la persistance précède la livraison**. Un message existe dès qu'il est en base avec un numéro de séquence. Tout le reste n'est qu'une tentative de le faire arriver plus vite sur les appareils.

---

## Ordre, idempotence et synchronisation

Trois petits mécanismes font l'essentiel du travail de justesse :

1. **Des identifiants de message générés par le client.** Le client attache un `client_id` unique à chaque envoi. Si le réseau perd l'accusé et que le client réessaie, le Message Service voit le même `client_id` dans cette conversation et renvoie le numéro de séquence d'origine au lieu de stocker un doublon.
2. **Des numéros de séquence par conversation.** Un ordre global entre toutes les discussions est inutile et coûteux. Ce que voient les utilisateurs, c'est l'ordre dans une conversation. Un compteur par conversation (en base ou dans un service séquenceur qui possède cette partition) donne un ordre total et permet de détecter les trous.
3. **La synchronisation par curseur.** Chaque appareil retient la plus haute séquence reçue pour chaque conversation. À la reconnexion, il demande tout ce qui suit. Aucune ambiguïté sur ce qui a pu manquer, et le même mécanisme sert au téléphone qui revient après une semaine hors ligne comme à l'ordinateur portable qui sort de veille.

---

## Les coches de livraison sont des curseurs

![Séquence des accusés de livraison et de lecture : Alice envoie un message avec un client id, le serveur de chat 1 l'ajoute avec la séquence 1043 et renvoie une coche grise, le message est routé vers le serveur de chat 7 et livré à Bob, l'accusé de livraison de Bob produit deux coches grises, et la mise à jour du curseur de lecture de Bob est stockée et produit deux coches bleues](/assets/images/hld/design-chat-ticks.webp)

| Indicateur | Ce qu'il signifie vraiment | Déclencheur |
| --- | --- | --- |
| Une coche grise (envoyé) | Persisté sur le serveur avec un numéro de séquence | Validation par le Message Service |
| Deux coches grises (distribué) | Au moins un appareil du destinataire l'a reçu | Accusé de l'appareil |
| Deux coches bleues (lu) | Le destinataire a ouvert la conversation jusqu'à ce point | Avancée du curseur de lecture |

La note verte, c'est l'astuce qui passe à l'échelle : **les accusés de lecture sont des curseurs, pas des drapeaux par message.** L'appareil de Bob signale « j'ai lu la conversation X jusqu'à la séquence 1043 ». Une seule écriture couvre tous les messages précédents. Dans un groupe, chaque membre a son curseur, et « lu par 12 sur 40 » est un comptage sur les curseurs, pas 40 écritures par message.

---

## Les groupes

Pour les petits groupes (jusqu'à quelques centaines de membres), le **fan-out à l'écriture** fonctionne : après une unique persistance dans la partition de la conversation du groupe, on route une livraison vers le serveur de chaque membre connecté et on envoie des notifications push aux autres. Le message est stocké une fois ; seules les livraisons se multiplient.

Pour les très grands canaux (des milliers à des millions de membres, façon serveurs Discord ou canaux de diffusion), on arrête de livrer à tout le monde. Les membres lisent le journal du canal à l'ouverture, et seuls ceux qui le regardent reçoivent des envois en temps réel. C'est le même arbitrage push contre pull que dans l'[article sur le fil d'actualité](/blog/fr/design-news-feed-system).

---

## La présence sans faire fondre le système

La présence coûte étonnamment cher. Si chaque changement de statut est diffusé à tous les contacts, un utilisateur qui se connecte peut déclencher des centaines de messages, et un réseau mobile qui fait clignoter sa connexion les déclenche encore et encore.

* **Battements de cœur avec TTL.** Les clients envoient un battement toutes les 30 secondes environ ; l'utilisateur est en ligne tant que la clé est fraîche. Une brève déconnexion ne le fait pas passer hors ligne immédiatement.
* **S'abonner plutôt que diffuser.** N'envoyez des mises à jour de présence que pour les contacts dont la conversation est ouverte sur l'écran de quelqu'un, ou regroupez-les pour les listes de contacts.
* **Anti-rebond.** Fusionnez les bascules rapides en ligne et hors ligne en une seule mise à jour.
* **La dernière connexion coûte peu ; la présence en direct, non.** Beaucoup de produits affichent « vu pour la dernière fois » (un horodatage lu à la demande) plutôt qu'un point en direct pour tout le monde.

---

## Plusieurs appareils

Chaque appareil est une connexion et un curseur distincts. Un message pour Bob est livré à tous ses appareils connectés, et un message envoyé par Bob depuis son ordinateur doit aussi apparaître sur son téléphone, ce qui n'est qu'une livraison de plus vers ses propres appareils. Avec le chiffrement de bout en bout, les choses se compliquent : l'expéditeur chiffre séparément pour chaque appareil destinataire (l'approche du protocole Signal adoptée par WhatsApp en 2016), si bien que le serveur route un texte chiffré qu'il ne peut pas lire.

---

## Le chiffrement de bout en bout, en bref

Avec le chiffrement de bout en bout, le serveur stocke et route un texte chiffré opaque. Cela modifie la conception sur des points précis :

* Toute recherche côté serveur dans le contenu est impossible ; la recherche se fait sur l'appareil.
* La détection du spam et des abus s'appuie sur les métadonnées, les signalements et des signaux côté client, pas sur l'analyse du contenu.
* L'historique sur un nouvel appareil exige une sauvegarde chiffrée ou un transfert d'appareil à appareil, car le serveur ne peut pas le déchiffrer pour vous.

La conception de routage, de séquences et de curseurs ci-dessus fonctionne sans changement ; elle n'a jamais eu besoin de lire le contenu.

---

## Modes de défaillance

| Défaillance | Comportement |
| --- | --- |
| Crash d'un serveur de chat | Ses sockets tombent ; les clients se reconnectent (avec jitter) à un autre serveur et se synchronisent depuis leurs curseurs. Rien n'est perdu, car rien ne vit uniquement sur les serveurs de chat |
| Tempête de reconnexions après un déploiement ou une coupure réseau | Délais exponentiels avec jitter côté client ; vidage progressif des serveurs pendant les déploiements |
| Accusé perdu sur le retour vers l'expéditeur | Le client réessaie avec le même `client_id` ; le serveur déduplique |
| Destinataire hors ligne pendant une semaine | Notifications push comme indices ; synchronisation complète depuis le curseur à la prochaine ouverture |
| Registre de sessions périmé | La livraison vers un serveur mort expire ; on se rabat sur le push et la synchronisation corrige |
| Partition lente dans la Messages DB | Les envois de cette conversation ralentissent ; les autres conversations ne sont pas touchées grâce au partitionnement |

---

## Liste de contrôle pour la production

- [ ] Persister avant d'accuser réception ; « envoyé » signifie durable
- [ ] Identifiants générés par le client pour des réessais idempotents
- [ ] Numéros de séquence par conversation ; détection des trous côté client
- [ ] Synchronisation par curseur à chaque reconnexion
- [ ] Accusés de lecture stockés comme curseurs, pas comme lignes par message
- [ ] Registre de sessions avec TTL rafraîchis par battements ; push de secours en cas d'échec de routage
- [ ] Présence avec anti-rebond et fondée sur l'abonnement
- [ ] Reconnexion avec délai et jitter ; vidage progressif des connexions au déploiement
- [ ] Tableaux de bord : p99 de l'envoi à la livraison, connexions par serveur, taux de reconnexion, taux de push de secours, doublons détectés

---

## Ce qui reste

Les coches sont l'interface la plus honnête du logiciel moderne. Une coche grise dit que le serveur a le message. Deux disent qu'un appareil l'a. Le bleu dit qu'une personne l'a regardé.

Tout dans cette conception existe pour que ces trois petites affirmations soient vraies, à chaque fois, dans un train qui traverse un tunnel. Et quelque part, une coche grise restera là pendant une heure malgré tout, et l'expéditeur la fixera, ce qu'aucune architecture ne peut réparer.

---

## Sources

* [Blog WhatsApp : 1 million is so 2011 (deux millions de connexions par serveur)](https://blog.whatsapp.com/1-million-is-so-2011)
* [Discord : How Discord Stores Billions of Messages](https://discord.com/blog/how-discord-stores-billions-of-messages)
* [Discord : How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages)
* [Signal : The Double Ratchet Algorithm](https://signal.org/docs/specifications/doubleratchet/)
* [RFC 6455 : The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455)
* Dans la même série : [Concevoir un système de notifications](/blog/fr/design-notification-system), [Concevoir un fil d'actualité](/blog/fr/design-news-feed-system), [Les bases des WebSockets et du temps réel](/blog/fr/websockets-realtime-basics)
