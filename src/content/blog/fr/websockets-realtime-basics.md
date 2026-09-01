---
title: "WebSockets pour apps temps réel : handshake, heartbeats, reconnexion, auth, scale"
description: "Comment les WebSockets fonctionnent en production : l'upgrade HTTP, ping et pong, reconnexion avec backoff, auth sans fuite de tokens, et fan-out multi-nœuds avec pub/sub."
date: "2026-07-01"
tags: [Frontend et Développement Web]
coverImage: /assets/images/websockets-realtime-basics.webp
previewImage: /assets/images/websockets-realtime-basics.webp
---


HTTP, c'est requête et réponse. Les produits temps réel ont besoin que le serveur pousse sans attendre le prochain poll : chat, tableaux de bord live, état multijoueur, ticks de trading, curseurs collaboratifs. Les **WebSockets** offrent un canal full-duplex de longue durée sur une seule connexion TCP. Le difficile n'est pas d'ouvrir un socket. Le difficile est de garder des milliers d'entre eux honnêtes face aux coupures réseau, à l'expiration d'auth et aux deploys multi-pods.

Voici la checklist de production que j'aurais aimé avoir la première fois qu'un « simple flux live » a rencontré balanceurs de charge et clients mobiles.

---

## Quand les WebSockets valent le coup

| Approche | Push serveur | Overhead | Meilleur usage |
| --- | --- | --- | --- |
| Short polling | Non (le client demande) | Beaucoup de requêtes, 200 vides | Mises à jour rares, caches simples |
| Long polling | Approximatif | Une requête HTTP retenue par attente | Fallback si WS bloqué |
| Server-Sent Events (SSE) | Unidirectionnel (serveur → client) | Léger, amical avec HTTP | Flux, notifications |
| **WebSocket** | Full duplex | Une connexion, frames | Chat, jeux, contrôle bidirectionnel |
| WebRTC data | Peer-to-peer | Complexité ICE/NAT | Média, apps peer directes |

Utilisez les WebSockets quand **les deux** côtés envoient souvent, ou quand la latence doit rester basse et stable. Préférez SSE pour des flux unidirectionnels si vous n'avez pas besoin de client→serveur sur le même canal. Préférez le HTTP simple pour des APIs request/response sans push.

---

## Le handshake : du HTTP qui devient socket

Un WebSocket commence comme une requête HTTP normale avec des en-têtes d'upgrade. Le navigateur (ou la lib client) envoie quelque chose comme :

```http
GET /ws HTTP/1.1
Host: api.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://app.example.com
```

Si le serveur accepte, il répond :

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

Après ce `101`, la même connexion TCP transporte des **frames WebSocket**, pas des corps de requête HTTP. Points clés :

1. **`Sec-WebSocket-Key` / `Accept`** : ce n'est pas du chiffrement. Le client choisit un nonce ; le serveur le hache avec un GUID fixe (RFC 6455). Cela prouve que les deux parlent le protocole et bloque les upgrades accidentels par des proxies naïfs.
2. **`Origin`** : les navigateurs l'envoient. Validez-le côté serveur pour les apps authentifiées par cookie, afin qu'un site aléatoire n'ouvre pas un socket en tant qu'utilisateur.
3. **Path et query** : encore disponibles au handshake pour le routage et (avec prudence) l'auth. Préférez le path pour le choix d'endpoint (`/ws/chat` vs `/ws/prices`).
4. **Sous-protocoles** : `Sec-WebSocket-Protocol` permet de négocier un protocole d'app nommé. Utile quand un hôte sert plusieurs clients avec des schémas de messages différents.

Les reverse proxies doivent autoriser les upgrades. Sur nginx, il faut en général `proxy_http_version 1.1`, transmettre `Upgrade` et `Connection`, et des idle timeouts longs (ou désactivés). Sur les LB cloud, cherchez le support WebSocket et le réglage d'idle timeout ; une coupure à 60s ressemble à des déconnexions aléatoires.

---

## Frames, messages et ce que vous envoyez

Le format sur le fil, ce sont des frames : text, binary, ping, pong, close. Votre app voit surtout des **messages** (frames assemblés). Gardez le contrat simple :

- **JSON text** pour le contrôle et les petits payloads (chat, présence).
- **Binary** (protobuf, MessagePack, flatbuffers) quand la taille ou le coût de parse compte.
- Une **enveloppe de message** : `{ "type": "...", "id": "...", "payload": ... }` pour ajouter des types sans casser chaque client.

Définissez des **codes de close** et des raisons. `1000` est normal. Échecs d'auth, kicks de politique et redémarrages serveur devraient utiliser des codes distincts pour que le client sache s'il doit reconnecter, se réauthentifier ou s'arrêter.

Ne traitez pas le socket comme un bus RPC libre sans limite de taille. Plafonnez la taille des messages. Rejetez ou fermez en cas d'abus. Appliquez du backpressure : si un client est lent et que votre buffer d'envoi grossit, jetez les updates non critiques ou déconnectez plutôt que de faire OOM le process.

---

## Heartbeats : distinguer les morts des silencieux

TCP peut rester half-open longtemps après la mise en veille d'un laptop, un timeout NAT ou un câble tiré. Sans checks de vivacité applicatifs, le serveur croit encore l'utilisateur en ligne.

### Ping / pong

RFC 6455 définit les frames de contrôle **ping** et **pong**. Serveurs ou clients envoient un ping ; le pair doit répondre par un pong. Beaucoup de libs exposent ça en intervalle.

Valeurs de départ courantes :

| Réglage | Plage typique | Notes |
| --- | --- | --- |
| Intervalle de ping | 15s-30s | Plus court pour UIs de trading ; plus long pour la batterie |
| Timeout de pong | 5s-15s après le ping | Pong manqué → fermer et libérer les ressources |
| Idle timeout | Lié au LB | Doit être **plus grand** que l'intervalle de ping |

Si le balanceur tue les connexions idle à 60s, votre intervalle de ping doit clairement être en dessous (par ex. 20s-30s). Les heartbeats gardent le chemin chaud et prouvent que la couche app répond encore.

### Heartbeats applicatifs

Certains stacks envoient aussi un petit message app (`{"type":"ping"}`) pour les middleboxes qui ne comprennent que le HTTP, et pour mesurer le RTT dans les métriques. Préférez les pings protocole quand la lib le permet ; utilisez des pings app quand vous avez besoin d'un payload custom ou qu'un proxy maltraite les frames de contrôle.

À la fermeture (propre ou timeout), mettez à jour la présence, annulez les souscriptions serveur de cette connexion et libérez la mémoire. Les utilisateurs « online » fantômes sont un classique des tickets produit WebSocket.

---

## Reconnexion : les clients tombent, planifiez-le

Les réseaux mobiles changent de cellule. Les deploys redémarrent des pods. Les gens ferment le laptop. La reconnexion n'est pas un cas limite ; c'est la boucle principale d'un client durable.

### Backoff exponentiel avec jitter

Se reconnecter à chaque close sans attendre sature le serveur après un deploy :

```
all clients reconnect at T+0 → thundering herd
```

Meilleur motif :

```
delay = min(cap, base * 2^attempt) * (0.5 + random())
```

Exemple : base `1s`, plafond `30s`, full jitter. La tentative 0 attend environ 0.5s-1s. Les suivantes s'étirent. Réinitialisez le compteur seulement après un open **stable** (par ex. 10s sans erreur), pas au premier `onopen`.

### Que re-synchroniser après reconnexion

Un nouveau socket n'a pas la mémoire des événements manqués. Motifs courants :

1. **Last event id / curseur** : le client stocke la dernière séquence ou timestamp appliqué ; le premier message après open est `SUBSCRIBE` + `since`.
2. **Snapshot puis delta** : le serveur envoie l'état courant, puis les updates live. Simple pour les dashboards ; lourd pour un grand état.
3. **Rooms versionnées** : le client garde `roomVersion` ; si périmé, resync complet.

Sans l'un de ces motifs, l'utilisateur voit des trous après chaque coupure.

### Tokens de resume (optionnel)

Certains systèmes émettent un **resume token** de courte durée lié à un utilisateur et à un offset de stream. À la reconnexion, présenter le token pour éviter une re-auth complète et reprendre depuis l'offset. Traitez-les comme des credentials : TTL court, rotation, révocation au logout.

### Raisons de close qui ne doivent pas reconnecter

| Signification du close | Action client |
| --- | --- |
| Arrêt normal / logout | Rester fermé |
| Auth invalide / interdite | Re-login puis ouvrir |
| Rate limit / politique | Backoff fort, peut-être s'arrêter |
| Redémarrage serveur / idle timeout | Reconnecter avec backoff |

Parsez les codes de close (et vos messages d'erreur app) pour ne pas tourner indéfiniment sur un ban.

---

## Auth : qui est sur ce socket ?

Le handshake est la porte principale. Après le `101`, beaucoup de serveurs ne revérifient l'identité que quand le token expire en cours de session.

### Motifs qui marchent

| Motif | Comment | Avantages | Inconvénients |
| --- | --- | --- | --- |
| **Session cookie** | Cookie same-site sur l'upgrade | Auth web familière ; checks Origin importants | Plus dur en natif/mobile ; domaine cookie |
| **Token en query** | `wss://host/ws?token=...` | Facile avec l'API `WebSocket` navigateur | Tokens dans logs, proxies, historique Referer |
| **Auth premier message** | Connecter anonyme puis `{"type":"auth","token":"..."}` | Token hors URL | Fenêtre brève non authentifiée |
| **Astuce Sec-WebSocket-Protocol** | Mettre le token dans l'en-tête protocol | Évite la query string | Abus non standard du sous-protocole |

Préférez **`Authorization` via un client custom** ou **auth au premier message** pour les SPAs qui ont déjà un bearer en mémoire. Pour les apps first-party navigateur avec cookies HTTP-only, cookie + check strict d'**Origin** est propre.

Ne mettez jamais de secrets longue durée dans les query strings. Si vous devez utiliser un param query (certains environnements l'imposent), émettez un ticket WS **courte durée, usage unique** depuis votre API HTTP et refusez la réutilisation.

### Expiration du token en cours de connexion

Les access tokens expirent alors que le socket est encore ouvert. Options :

1. **Fermer avec un code auth** à l'expiration ; le client rafraîchit le token HTTP et reconnecte.
2. **Refresh sur le socket** : le client envoie un nouvel access token ; le serveur revalide et continue.
3. **Session côté serveur** : le handshake crée une session serveur plus longue ; l'access token ne sert qu'à l'ouverture.

L'option 2 est fluide pour le chat. L'option 1 est plus simple à raisonner en revue sécurité. Dans les deux cas, documentez-le ; une mort silencieuse à la minute 15 fabrique des tickets support.

### Autorisation après authentification

AuthN, c'est « qui ». AuthZ, c'est « quelles rooms/canaux ». Sur `SUBSCRIBE channel:X`, revérifiez l'ACL. Revérifiez à la reconnexion. Ne faites pas confiance aveuglément aux room ids côté client. Pour les produits multi-tenant, liez chaque souscription au tenant id du token vérifié, pas au corps du message.

---

## Scaler au-delà d'un process

Un process Node ou Go peut tenir beaucoup de connexions, mais :

- Deploys et crashes emportent tout le monde.
- Le CPU du fan-out JSON limite souvent avant la RAM.
- L'utilisateur A sur le pod 1 ne reçoit pas un message publié seulement en mémoire sur le pod 2.

### Les sticky sessions ne suffisent pas

Les balanceurs peuvent coller un client à un pod (cookie ou IP). Cela aide les maps de connexions **en mémoire** pour un seul utilisateur, mais **ne** résout **pas** « message produit sur le pod A, consommateur connecté sur le pod B ». Tout broadcast ou événement inter-utilisateurs a besoin d'un bus partagé.

### Fan-out pub/sub

La forme standard :

```
Client ←→ WS gateway pod ←→ Redis (or NATS, Kafka, etc.) ←→ other gateway pods
                              ↑
                         app workers / API
```

1. Le client se connecte à n'importe quel pod gateway ; le pod enregistre conn locale → user/rooms.
2. Quand quelque chose se passe (écriture API, job worker), publier sur un canal : `room:42`, `user:7`, `tenant:acme:alerts`.
3. Chaque pod gateway abonné à ce canal reçoit l'événement et n'écrit qu'aux sockets **locaux** correspondants.

Redis Pub/Sub est courant pour un fan-out éphémère. Redis Streams ou Kafka conviennent quand vous avez besoin de rétention et de consumer groups. NATS est populaire pour la messagerie interne à faible latence. Choisissez selon les besoins de durabilité, pas la marque.

### Préoccupations horizontales

| Préoccupation | Approche |
| --- | --- |
| Nombre de connexions | Beaucoup de petits pods gateway ; autoscale sur sockets ouverts + CPU |
| Rooms chaudes | Shard par room id ; évitez qu'un seul process possède un canal célébrité |
| Livraison ordonnée | Séquences par room ; le client trie ou jette le stale |
| At-least-once | Le client dé-duplique par event id |
| Drain gracieux | Arrêter les accepts, attendre close ou forcer close avec « reconnect », se désinscrire du pub/sub |
| Observabilité | Métriques : conns ouvertes, pings manqués, profondeur de file d'envoi, lag pub/sub, échecs auth |

### Extras stateful

Présence (« qui est en ligne ») et indicateurs de frappe veulent des TTL courts et des heartbeats, souvent dans Redis. Ne stockez pas la présence seulement en mémoire de process si plus d'un pod sert le trafic.

Les gros blasts binaires (chunks de fichiers, vidéo) n'ont en général pas leur place sur le même socket que le chat de contrôle. Canaux séparés ou object storage + URLs signées.

---

## Esquisse minimale serveur (modèle mental)

Pseudocode, pas un framework :

```
on HTTP upgrade:
  user = authenticate(request)
  if not user: reject 401
  if not origin_allowed(request): reject 403
  socket = accept()
  register(socket, user)
  subscribe_bus(user.rooms)

on message(socket, msg):
  if msg.type == "subscribe":
    if authorize(user, msg.room): add_local(socket, msg.room); bus_sub(msg.room)
  elif msg.type == "publish":
    if authorize(...): bus_publish(msg.room, envelope(msg))

on bus_event(room, event):
  for socket in local_sockets(room):
    try send(socket, event) except backpressure: drop_or_close

on ping timeout / close:
  unregister(socket)
  update_presence(user)
```

La découpe importante : **map locale de sockets** sur le gateway, **bus partagé** pour la livraison multi-pod, **auth à chaque changement de privilège**.

---

## Checklist client

1. Ouvrir en `wss://` en production (TLS).
2. Heartbeat (protocole ou app) sous l'idle timeout du LB.
3. Reconnexion avec backoff exponentiel + jitter.
4. Resume avec last event id ou snapshot.
5. Gérer l'expiration d'auth sans boucles infinies de reconnect.
6. Plafonner la taille des messages entrants et valider le schéma.
7. Afficher l'état de connexion dans l'UI (online / reconnecting / offline).
8. Au hide de page / background app, décider de garder le socket ou de le mettre en pause (batterie mobile).

---

## Modes de panne fréquents

| Symptôme | Cause probable |
| --- | --- |
| Déconnexion aléatoire toutes les ~60s | Idle timeout du proxy ; heartbeats trop lents |
| OK sur un serveur, manques silencieux multi-pod | Pas de pub/sub ; mémoire seule |
| Tempête de reconnect après deploy | Pas de backoff/jitter ; pas de drain |
| Token dans les access logs | Auth par query string |
| Fantômes « online » | Pas de timeout pong ; présence non nettoyée |
| OOM sur le gateway | Buffers d'envoi non bornés ; pas de backpressure |
| Hijack type CSRF | Auth cookie sans checks Origin |

---

## Quand ne pas utiliser les WebSockets

- Surtout du CRUD request/response avec peu d'updates : HTTP est plus simple.
- Push unidirectionnel sur une infra HTTP déjà de confiance : SSE peut suffire.
- Fan-out massif de données publiques identiques : CDN + SSE ou polling d'un edge de cache peut coûter moins.
- Plateformes serverless à durée de vie courte sans support socket : utilisez un service realtime managé ou un tier gateway long-running.

Les WebSockets sont un transport. Ils ne remplacent pas le design d'auth, les event ids idempotents ni un plan de fan-out multi-nœuds. Réussissez le handshake, prouvez la vivacité avec des heartbeats, reconnectez avec patience, contrôlez chaque souscription, et mettez un bus entre les pods. Le reste est du polish produit sur une connexion qui reste debout.

