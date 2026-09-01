---
title: "Serveur de Messagerie: Architecture Orientée Objet et Chat Évolutif (CTCI 7.7)"
description: "Concevez les composants backend, classes et structures de données pour un serveur de messagerie instantanée gérant conversations privées et de groupe."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-7-chat-server.webp
previewImage: /assets/images/ctci-7-7-chat-server.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Expliquez comment concevoir un serveur de messagerie instantanée (chat). Détaillez les composants backend, classes et méthodes. Quels sont les défis techniques les plus ardus ?
> * **La Solution Optimale:** Modèle Polymorphique de Conversation : (1) Classe abstraite `Conversation` sous-classée en `PrivateChat` (2 participants) et `GroupChat` (participants multiples) ; (2) Entité `Message` horodatée ; (3) `UserManager` (Singleton) gérant les comptes, les demandes de contact et le statut de présence en ligne/hors ligne ; (4) Principaux défis : diffusion de présence à large échelle et gestion des messages hors ligne.
> * **Réalité en Production:** Passerelles WebSockets de Slack/Discord et stockage distribué sur cluster Cassandra.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 7.7), l'énoncé est :

*"Expliquez comment concevoir un serveur de chat. Donnez les details des classes, methodes et composants backend, ainsi que les defis de scalabilite."*

## 2. Architecture Orientée Objet

1. **`User` :** Compte utilisateur, état de présence, annuaire de conversations privées et de groupes.
2. **`Conversation` :** Classe de base pour l'historique de messages et la liste des participants.
3. **`Message` :** Texte, horodatage et identifiant de l'émetteur.
4. **`UserManager` :** Gestionnaire d'authentification et de routage réseau.

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ChatServerDesign {
    public enum UserStatusType { Offline, Away, Idle, Available, Busy }

    public static class Message {
        private final String content;
        private final Date date;
        private final int senderId;

        public Message(String content, Date date, int senderId) {
            this.content = content;
            this.date = date;
            this.senderId = senderId;
        }

        public String getContent() { return content; }
        public Date getDate() { return date; }
        public int getSenderId() { return senderId; }
    }

    public static abstract class Conversation {
        protected List<User> participants = new ArrayList<>();
        protected List<Message> messages = new ArrayList<>();

        public List<Message> getMessages() { return messages; }
        public boolean addMessage(Message m) {
            messages.add(m);
            return true;
        }
    }

    public static class PrivateChat extends Conversation {
        public PrivateChat(User user1, User user2) {
            participants.add(user1);
            participants.add(user2);
        }
    }

    public static class GroupChat extends Conversation {
        public void addParticipant(User user) { participants.add(user); }
        public void removeParticipant(User user) { participants.remove(user); }
    }

    public static class User {
        private final int id;
        private final String accountName;
        private UserStatusType status = UserStatusType.Offline;
        private final Map<Integer, PrivateChat> privateChats = new HashMap<>();

        public User(int id, String accountName) {
            this.id = id;
            this.accountName = accountName;
        }

        public int getId() { return id; }
        public void setStatus(UserStatusType type) { this.status = type; }

        public boolean sendMessageToUser(User toUser, String content) {
            PrivateChat chat = privateChats.get(toUser.getId());
            if (chat == null) {
                chat = new PrivateChat(this, toUser);
                privateChats.put(toUser.getId(), chat);
                toUser.privateChats.put(this.id, chat);
            }
            return chat.addMessage(new Message(content, new Date(), this.id));
        }
    }

    public static class UserManager {
        private static UserManager instance;
        private final Map<Integer, User> usersById = new HashMap<>();
        private final Map<Integer, User> onlineUsers = new HashMap<>();

        public static synchronized UserManager getInstance() {
            if (instance == null) instance = new UserManager();
            return instance;
        }

        public void userSignedOn(int userId) {
            User user = usersById.get(userId);
            if (user != null) {
                user.setStatus(UserStatusType.Available);
                onlineUsers.put(userId, user);
            }
        }

        public void userSignedOff(int userId) {
            User user = usersById.get(userId);
            if (user != null) {
                user.setStatus(UserStatusType.Offline);
                onlineUsers.remove(userId);
            }
        }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Envoi de Message | `O(1)` | Accès en table de hachage et ajout en liste. |
| Mise à Jour Présence | `O(1)` | Modification directe dans le dictionnaire des connectés. |
| Espace Auxiliaire | `O(M + U)` | Proportionnel aux messages archivés et utilisateurs enregistrés. |

## Ingénierie des Systèmes en Production

### Défis d'Architecture Système

1. **Diffusion de Présence :** L'arrivée d'un utilisateur avec des milliers de contacts requiert un système Pub/Sub distribué (Redis / Kafka) pour éviter l'explosion du nombre d'écritures sockets.
2. **Messages en File d'Attente :** Stockage des messages non distribués dans Cassandra partitionné par destinataire pour synchronisation à la reconnexion.

## Cas Limites et Robustesse

1. **Destinataire hors ligne :** Le message est persisté dans l'historique sans bloquer le flux d'exécution.
