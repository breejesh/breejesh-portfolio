---
title: "Chat Server: utilisateurs, conversations, messages et statut (OOD Java)"
description: "Problème style CTCI 7.7 pour débutants: concevoir un serveur de chat en Java avec User, PrivateChat et GroupChat, Message, présence et demandes d'ami. D'abord le périmètre, puis les classes."
date: "2026-03-04"
tags: [Algorithmes]
coverImage: /assets/images/ctci-7-7-chat-server.webp
previewImage: /assets/images/ctci-7-7-chat-server.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 7.7 pour débutants: concevoir un serveur de chat en Java avec User, PrivateChat et GroupChat, Message, présence et demandes d'ami. D'abord le périmètre, puis les classes.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un serveur de chat est un produit, pas une seule méthode. Les intervieweurs le savent. Ils veulent que tu **bornes** le travail, nommes les objets, et montres comment amis, chats privés, chats de groupe, messages et statut en ligne s'emboîtent. Réseau, push et scale multi-région restent souvent hors du premier croquis sauf s'ils demandent.

Ce billet est un enseignement original de **conception orientée objet** pour débutants en **Java**. Même famille que l'OOD d'entretien classique, pas une copie de livre. Partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 7 continue après [Jigsaw](/blog/fr/ctci-7-6-jigsaw).

---

## 1. Analogie du quotidien

Imagine un tableau de chat d'entreprise sur le mur d'un petit bureau.

* Chaque personne a un **badge** et un post-it d'humeur: disponible, occupé, absent, hors ligne.
* Les **amis** sont ta liste de contacts. Tu ne spams pas des inconnus; quelqu'un doit accepter une demande d'ajout.
* Un **chat privé** est une enveloppe scellée que seules deux personnes ouvrent.
* Un **chat de groupe** est un dossier partagé. Les gens rejoignent ou quittent. Les messages s'empilent dans l'ordre.
* Quand tu écris une note, elle va dans le bon dossier, avec horodatage, et les gens de ce dossier devraient la voir.

Le serveur est le greffier qui garde cohérentes listes de contacts, dossiers et post-its. En entretien, tu conçois le classeur en classes, pas chaque socket TCP.

---

## 2. Énoncé en mots simples

**Objectif:** esquisser classes et méthodes backend pour un serveur de chat centré sur utilisateurs et conversations.

**Dans le périmètre (par défaut ici):**

* Se connecter et se déconnecter (présence).
* Type de statut plus message optionnel (disponible, occupé, absent, idle, offline).
* Amitié mutuelle: envoyer, accepter, refuser des demandes.
* Chats privés (1:1) et de groupe.
* Ajouter des messages texte à une conversation.
* Chercher des utilisateurs par id ou nom de compte.

**Hors périmètre sauf demande:**

* Voix, vidéo, transfert de fichiers.
* Chiffrement de bout en bout.
* Framing WebSocket et UI client.
* Scale de production shardé (à discuter en follow-up dur, pas en premier code).

**Hypothèses à dire à voix haute:**

* L'amitié est mutuelle. Si A est dans les contacts de B, B est dans ceux de A.
* Un chat privé a toujours exactement deux participants.
* Les groupes peuvent ajouter et retirer des participants.
* On conçoit d'abord des objets en mémoire. Une base de données persisterait comptes et historique derrière les mêmes interfaces plus tard.

**Types centraux:**

| Type | Rôle |
| --- | --- |
| `User` | identité, contacts, chats, statut, envoi |
| `Conversation` | participants + liste de messages (abstraite) |
| `PrivateChat` / `GroupChat` | deux formes concrètes de conversation |
| `Message` | contenu + horodatage |
| `UserStatus` / `UserStatusType` | présence + texte optionnel |
| `AddRequest` / `RequestStatus` | demandes d'ami en attente |
| `UserManager` | annuaire, ensemble online, approuver/refuser |

---

## 3. Réfléchir d'abord

### Le périmètre bat le "clone WhatsApp"

Si tu commences par Kafka, Redis et le failover multi-DC, tu n'atteins jamais les classes. Ouvre avec:

1. Quelles actions doivent marcher?
2. Quels objets portent ces actions?
3. Qu'est-ce qu'on ignore volontairement?

C'est l'entretien. Le code prouve que le modèle est réel.

### Pourquoi Conversation est abstraite

Privé et groupe partagent participants et messages. Ils diffèrent sur l'adhésion:

* Privé: paire fixe; helper pour "l'autre personne".
* Groupe: adhésion dynamique (`addParticipant` / `removeParticipant`).

Partage la liste de messages et l'id sur `Conversation` abstraite. Mets les règles d'adhésion sur les sous-classes. Ainsi `User.sendMessageToGroupChat` et la lecture d'historique restent simples.

### Où vont les messages

Flux propre habituel pour le privé:

1. L'émetteur trouve ou crée le `PrivateChat` avec l'autre utilisateur.
2. Construit un `Message` avec contenu et heure.
3. L'ajoute à la conversation.
4. (Système réel) notifie les destinataires sur le réseau. Dans le croquis OOD, renvoyer `true` après l'append suffit.

Groupe: résous le chat par id, vérifie que l'émetteur est participant, ajoute.

### Flux d'amitié

1. A appelle `requestAddUser(nom de compte de B)`.
2. `UserManager` crée un `AddRequest`, l'enregistre chez les deux (cartes envoyées et reçues).
3. B accepte: le manager ajoute chaque user aux contacts de l'autre et nettoie la demande.
4. B refuse: le statut devient rejected; pas de lien contact.

N'autorise pas A à écrire à B comme contact tant que l'acceptation n'est pas faite, si ta règle produit l'exige. Dis la règle.

### Le statut n'est pas "être dans un chat"

`UserStatusType` répond "puis-je déranger cette personne?" (Available, Busy, Away, Idle, Offline). Être dans une conversation ne remplace pas la présence. Les cartes online de `UserManager` suivent qui est connecté pour le routage plus tard.

### UserManager singleton?

Un registre unique convient au croquis d'entretien pour que tous les chemins voient la même carte d'utilisateurs. En production tu le remplaces par un service et un store. Dis-le: "singleton pour le tableau blanc, pas un décret de production."

---

## 4. Solution Java

Modèle pédagogique original: assez de corps de méthodes pour parcourir une demande d'ami et un message privé. Pas un serveur complet.

### Enums et petits types valeur

```java
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

enum UserStatusType {
    Offline, Away, Idle, Available, Busy
}

enum RequestStatus {
    Unread, Read, Accepted, Rejected
}

class UserStatus {
    private final UserStatusType type;
    private final String message; // optional free text, may be null

    UserStatus(UserStatusType type, String message) {
        this.type = type;
        this.message = message;
    }

    UserStatusType getStatusType() {
        return type;
    }

    String getMessage() {
        return message;
    }
}

class Message {
    private final String content;
    private final Date date;
    private final int senderId;

    Message(String content, Date date, int senderId) {
        this.content = content;
        this.date = date;
        this.senderId = senderId;
    }

    String getContent() {
        return content;
    }

    Date getDate() {
        return date;
    }

    int getSenderId() {
        return senderId;
    }
}

class AddRequest {
    private final User fromUser;
    private final User toUser;
    private final Date date;
    private RequestStatus status;

    AddRequest(User from, User to, Date date) {
        this.fromUser = from;
        this.toUser = to;
        this.date = date;
        this.status = RequestStatus.Unread;
    }

    RequestStatus getStatus() {
        return status;
    }

    void setStatus(RequestStatus status) {
        this.status = status;
    }

    User getFromUser() {
        return fromUser;
    }

    User getToUser() {
        return toUser;
    }

    Date getDate() {
        return date;
    }
}
```

### Hiérarchie Conversation

```java
abstract class Conversation {
    protected final int id;
    protected final ArrayList<User> participants = new ArrayList<>();
    protected final ArrayList<Message> messages = new ArrayList<>();

    Conversation(int id) {
        this.id = id;
    }

    int getId() {
        return id;
    }

    ArrayList<Message> getMessages() {
        return messages;
    }

    boolean addMessage(Message m) {
        if (m == null || m.getContent() == null) {
            return false;
        }
        messages.add(m);
        return true;
    }

    boolean hasParticipant(User u) {
        return participants.contains(u);
    }
}

class PrivateChat extends Conversation {
    PrivateChat(int id, User user1, User user2) {
        super(id);
        participants.add(user1);
        participants.add(user2);
    }

    User getOtherParticipant(User primary) {
        if (participants.get(0).equals(primary)) {
            return participants.get(1);
        }
        if (participants.get(1).equals(primary)) {
            return participants.get(0);
        }
        return null;
    }
}

class GroupChat extends Conversation {
    GroupChat(int id) {
        super(id);
    }

    void addParticipant(User user) {
        if (user != null && !participants.contains(user)) {
            participants.add(user);
        }
    }

    void removeParticipant(User user) {
        participants.remove(user);
    }
}
```

### User

```java
class User {
    private final int id;
    private final String accountName;
    private final String fullName;
    private UserStatus status = new UserStatus(UserStatusType.Offline, null);

    // other user id -> private chat
    private final Map<Integer, PrivateChat> privateChats = new HashMap<>();
    private final ArrayList<GroupChat> groupChats = new ArrayList<>();

    private final Map<Integer, AddRequest> receivedAddRequests = new HashMap<>();
    private final Map<Integer, AddRequest> sentAddRequests = new HashMap<>();
    private final Map<Integer, User> contacts = new HashMap<>();

    User(int id, String accountName, String fullName) {
        this.id = id;
        this.accountName = accountName;
        this.fullName = fullName;
    }

    int getId() {
        return id;
    }

    String getAccountName() {
        return accountName;
    }

    String getFullName() {
        return fullName;
    }

    UserStatus getStatus() {
        return status;
    }

    void setStatus(UserStatus status) {
        this.status = status;
    }

    boolean addContact(User user) {
        if (user == null || user.getId() == id) {
            return false;
        }
        contacts.put(user.getId(), user);
        return true;
    }

    boolean isContact(User other) {
        return other != null && contacts.containsKey(other.getId());
    }

    void receivedAddRequest(AddRequest req) {
        receivedAddRequests.put(req.getFromUser().getId(), req);
    }

    void sentAddRequest(AddRequest req) {
        sentAddRequests.put(req.getToUser().getId(), req);
    }

    void removeAddRequest(AddRequest req) {
        receivedAddRequests.remove(req.getFromUser().getId());
        sentAddRequests.remove(req.getToUser().getId());
    }

    void requestAddUser(String accountName) {
        UserManager.getInstance().addUser(this, accountName);
    }

    void addConversation(PrivateChat conversation) {
        User other = conversation.getOtherParticipant(this);
        if (other != null) {
            privateChats.put(other.getId(), conversation);
        }
    }

    void addConversation(GroupChat conversation) {
        if (!groupChats.contains(conversation)) {
            groupChats.add(conversation);
        }
    }

    boolean sendMessageToUser(User to, String content) {
        if (to == null || content == null || content.isEmpty()) {
            return false;
        }
        // product rule: only message contacts (state if you allow open messaging)
        if (!isContact(to)) {
            return false;
        }

        PrivateChat chat = privateChats.get(to.getId());
        if (chat == null) {
            chat = UserManager.getInstance()
                    .createPrivateChat(this, to);
        }

        Message msg = new Message(content, new Date(), id);
        return chat.addMessage(msg);
    }

    boolean sendMessageToGroupChat(int groupId, String content) {
        GroupChat chat = null;
        for (GroupChat g : groupChats) {
            if (g.getId() == groupId) {
                chat = g;
                break;
            }
        }
        if (chat == null || !chat.hasParticipant(this)) {
            return false;
        }
        return chat.addMessage(new Message(content, new Date(), id));
    }
}
```

### UserManager

```java
class UserManager {
    private static UserManager instance;

    private final Map<Integer, User> usersById = new HashMap<>();
    private final Map<String, User> usersByAccountName = new HashMap<>();
    private final Map<Integer, User> onlineUsers = new HashMap<>();
    private int nextConversationId = 1;

    private UserManager() {
    }

    static UserManager getInstance() {
        if (instance == null) {
            instance = new UserManager();
        }
        return instance;
    }

    /** Register a brand-new account in the system. */
    User register(int id, String accountName, String fullName) {
        if (usersByAccountName.containsKey(accountName)) {
            return null;
        }
        User u = new User(id, accountName, fullName);
        usersById.put(id, u);
        usersByAccountName.put(accountName, u);
        return u;
    }

    /** A asks to add B by account name. */
    void addUser(User fromUser, String toAccountName) {
        User toUser = usersByAccountName.get(toAccountName);
        if (fromUser == null || toUser == null || fromUser.getId() == toUser.getId()) {
            return;
        }
        if (fromUser.isContact(toUser)) {
            return;
        }

        AddRequest req = new AddRequest(fromUser, toUser, new Date());
        fromUser.sentAddRequest(req);
        toUser.receivedAddRequest(req);
    }

    void approveAddRequest(AddRequest req) {
        if (req == null) {
            return;
        }
        User from = req.getFromUser();
        User to = req.getToUser();
        from.addContact(to);
        to.addContact(from);
        req.setStatus(RequestStatus.Accepted);
        from.removeAddRequest(req);
        to.removeAddRequest(req);
    }

    void rejectAddRequest(AddRequest req) {
        if (req == null) {
            return;
        }
        req.setStatus(RequestStatus.Rejected);
        req.getFromUser().removeAddRequest(req);
        req.getToUser().removeAddRequest(req);
    }

    void userSignedOn(String accountName) {
        User u = usersByAccountName.get(accountName);
        if (u == null) {
            return;
        }
        onlineUsers.put(u.getId(), u);
        u.setStatus(new UserStatus(UserStatusType.Available, null));
    }

    void userSignedOff(String accountName) {
        User u = usersByAccountName.get(accountName);
        if (u == null) {
            return;
        }
        onlineUsers.remove(u.getId());
        u.setStatus(new UserStatus(UserStatusType.Offline, null));
    }

    PrivateChat createPrivateChat(User a, User b) {
        PrivateChat chat = new PrivateChat(nextConversationId++, a, b);
        a.addConversation(chat);
        b.addConversation(chat);
        return chat;
    }

    GroupChat createGroupChat(User creator, String ignoredTitleForSketch) {
        GroupChat chat = new GroupChat(nextConversationId++);
        chat.addParticipant(creator);
        creator.addConversation(chat);
        return chat;
    }

    boolean isOnline(int userId) {
        return onlineUsers.containsKey(userId);
    }
}
```

### Parcours

```java
UserManager um = UserManager.getInstance();
User ana = um.register(1, "ana", "Ana Rao");
User ben = um.register(2, "ben", "Ben Cole");

um.userSignedOn("ana");
um.userSignedOn("ben");

ana.requestAddUser("ben");
// ben accepts the pending request from ana (in a real API, pull from received map)
AddRequest pending = /* ben's received request from ana */;
um.approveAddRequest(pending);

ana.sendMessageToUser(ben, "lunch at 1?");
// private chat now has one Message; both users share the same PrivateChat object
```

Ce qui compte en entretien est le **graphe d'objets**: le manager possède l'annuaire, les users possèdent contacts et poignées de chat, les conversations possèdent l'historique, le statut vit sur l'utilisateur.

---

## 5. Problèmes durs (dis-les si tu as le temps)

Ce sont les questions classiques "qu'est-ce qui ferait mal?" après le diagramme de classes.

### Comment savoir si quelqu'un est vraiment en ligne?

Les clients peuvent disparaître sans déconnexion propre (veille du laptop, process tué, réseau instable). Traite la présence comme un **bail**:

* Le client envoie des heartbeats sur un timer.
* Des heartbeats manqués passent l'utilisateur en Offline (ou Away d'abord, puis offline).
* Ne te fie jamais seulement à "l'utilisateur a cliqué se déconnecter."

### Conflit mémoire vs base de données

Les données chaudes (qui est online, sockets ouverts) vivent en mémoire de processus. Les données durables (comptes, archives) vivent en base. En cas de désaccord, **le durable gagne en général pour l'historique**, et **le dernier heartbeat gagne pour la présence**. Concevoir une propriété explicite pour ne pas double-écrire sans règle.

### Scale

Un singleton `UserManager` ne sert pas des millions d'utilisateurs concurrents. Tu découpes par plages d'id user ou chat, tu répliques avec soin, et tu acceptes que les demandes d'ami entre machines demandent de la coordination. Nomme la douleur: cohérence des listes de contacts et ordre des messages entre machines.

### Abus et déni de service

Toute API qui accepte du trafic client peut être inondée: spam de demandes, messages énormes, thrash join/leave. Limite le débit par user et par IP, plafonne la taille des messages, et jette ou met en file l'excès. Même au tableau, mentionne des plafonds.

### Garanties de livraison (bonus)

At-most-once est facile et perd des messages. At-least-once demande des ids et de la dé-duplication client. Exactly-once est cher. Pour les entretiens chat, "persister puis fan-out; le client réessaie avec message id" est une bonne phrase par défaut. Pour l'architecture produit à l'échelle de la même idée, voir [Concevoir un système de chat](/blog/fr/design-chat-system).

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs touchent ceux-ci:

* **S'ajouter soi-même** ou **compte absent** → no-op ou erreur claire.
* **Double accept** de la même demande → contacts corrects; pas de chat privé en double.
* **Message à un non-contact** → refuse si c'est ta règle; dis la règle.
* **Corps de message vide** → refuse.
* **Message de groupe d'un non-membre** → refuse.
* **Sign-off sans sign-on** → remove est un no-op sûr.
* **Deux chats privés pour la même paire** → crée une fois et réutilise l'entrée de carte des deux côtés.

Erreurs fréquentes:

1. **Sauter vers Kafka et les load balancers** avant de nommer `User` et `Conversation`.
2. **Une classe Chat monstre** avec des flags private vs group au lieu d'une petite hiérarchie.
3. **Oublier les contacts mutuels** à l'acceptation (seul A obtient B).
4. **Mettre tous les messages sur User** au lieu de la conversation partagée.
5. **Mélanger présence et livraison** de façon à casser le modèle pour les offline.
6. **Main de réseau floue** quand on demande comment B voit le message de A: dis au moins "notifie les sessions online; offline rattrape depuis le store ensuite."

Idées de fumée minimales:

```java
// after register + mutual accept
assert ana.isContact(ben);
assert ben.isContact(ana);
assert ana.sendMessageToUser(ben, "hi");
assert !ana.sendMessageToUser(ben, ""); // empty rejected
```

---

## 7. Explique à un ami

L'OOD Chat Server est un classeur borné:

1. **User** porte l'identité de compte, le statut, les contacts, la carte de chats privés, la liste de groupes et les cartes de demandes.
2. **Conversation** est abstraite: id, participants, messages. **PrivateChat** est une paire fixe. **GroupChat** peut ajouter et retirer des gens.
3. **Message** est contenu, heure et émetteur.
4. **AddRequest** plus **RequestStatus** modélisent les amitiés en attente. Accepter rend les contacts mutuels.
5. **UserManager** est l'annuaire: enregistrement, ensemble online, approuver/refuser, créer des chats.
6. Follow-ups durs: vraie présence (heartbeats), vérité mémoire vs BD, scale et protection contre l'abus.

Si tu peux dessiner User, Conversation, Message et le chemin de demande d'ami au tableau, puis parcourir un envoi privé, tu maîtrises le 7.7 à la profondeur d'entretien. Le chat distribué complet est une longue conversation system design; ce billet garde le modèle d'objets honnête.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Jigsaw](/blog/fr/ctci-7-6-jigsaw)
* Suivant: [Othello](/blog/fr/ctci-7-8-othello)