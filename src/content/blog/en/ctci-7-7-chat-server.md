---
title: "Chat Server: Object-Oriented Architecture and Scalable Messaging (CTCI 7.7)"
description: "Design the backend components, classes, and data structures for a real-time chat server supporting private 1-on-1 and group conversations."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-7-7-chat-server.webp
previewImage: /assets/images/ctci-7-7-chat-server.webp
---

> **TL;DR**
> * **The Book Problem:** Explain how you would design a chat server. In particular, provide details about the various backend components, classes, and methods. What would be the hardest problems to solve?
> * **The Optimal Solution:** Decoupled User Management & Polymorphic Conversation Model: (1) Abstract base `Conversation` subclassed into `PrivateChat` (exactly 2 participants) and `GroupChat` (dynamic participants); (2) `Message` entity containing timestamp, sender, and payload; (3) `UserManager` singleton maintaining user directory, friend requests (`AddRequest`), and online/offline presence states; (4) Hardest engineering challenges: presence synchronization at scale, offline message delivery queues, and WebSocket connection connection-pool clustering.
> * **Production Reality:** Enterprise chat systems (Slack / Discord gateway gateways) and mobile instant messaging protocols (WhatsApp / Signal protocol architectures).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 7.7), we are asked:

*"Explain how you would design a chat server. In particular, provide details about the various backend components, classes, and methods. What would be the hardest problems to solve?"*

## 2. Object-Oriented Backend Architecture

1. **`User`:** `userId`, `username`, `status`, `accountSettings`. Tracks active `conversations` and `contacts`.
2. **`Conversation` (Abstract):** Subclassed by `PrivateChat` and `GroupChat`. Maintains `List<Message> messages` and `List<User> participants`.
3. **`Message`:** `messageId`, `content`, `date`, `senderId`.
4. **`AddRequest`:** Represents pending contact authorization requests (`fromUser`, `toUser`, `status`).
5. **`UserManager` (Singleton):** Manages user registration, authentication, presence discovery, and socket routing.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ChatServerDesign {
    public enum UserStatusType { Offline, Away, Idle, Available, Busy }
    public enum RequestStatus { Unread, Read, Accepted, Rejected }

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
        protected int id;
        protected List<Message> messages = new ArrayList<>();

        public List<Message> getMessages() { return messages; }
        public boolean addMessage(Message m) {
            messages.add(m);
            return true;
        }
        public int getId() { return id; }
    }

    public static class PrivateChat extends Conversation {
        public PrivateChat(User user1, User user2) {
            participants.add(user1);
            participants.add(user2);
        }
        public User getOtherParticipant(User primary) {
            if (participants.get(0).equals(primary)) return participants.get(1);
            return participants.get(0);
        }
    }

    public static class GroupChat extends Conversation {
        public void removeParticipant(User user) { participants.remove(user); }
        public void addParticipant(User user) { participants.add(user); }
    }

    public static class User {
        private final int id;
        private final String accountName;
        private UserStatusType status = UserStatusType.Offline;
        private final Map<Integer, PrivateChat> privateChats = new HashMap<>();
        private final List<GroupChat> groupChats = new ArrayList<>();
        private final Map<Integer, User> contacts = new HashMap<>();

        public User(int id, String accountName) {
            this.id = id;
            this.accountName = accountName;
        }

        public int getId() { return id; }
        public void setStatus(UserStatusType type) { this.status = type; }
        public UserStatusType getStatus() { return status; }
        public boolean sendMessageToUser(User toUser, String content) {
            PrivateChat chat = privateChats.get(toUser.getId());
            if (chat == null) {
                chat = new PrivateChat(this, toUser);
                privateChats.put(toUser.getId(), chat);
                toUser.privateChats.put(this.id, chat);
            }
            Message message = new Message(content, new Date(), this.id);
            return chat.addMessage(message);
        }
    }

    public static class UserManager {
        private static UserManager instance;
        private final Map<Integer, User> usersById = new HashMap<>();
        private final Map<String, User> usersByAccountName = new HashMap<>();
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

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| sendMessageToUser() Time | `O(1)` | Direct map lookup and list append. |
| User Presence Updates | `O(1)` | Hash table insertion/removal. |
| Auxiliary Space | `O(M + U)` | Scales with total stored messages $M$ and registered users $U$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Hardest Technical Challenges

1. **Presence Fanout at Scale:** When a user with 5,000 contacts signs online, naive broadcast generates $O(K)$ socket writes. Production systems use Redis Pub/Sub channels partitioned by contact groups with debounce coalescing.
2. **Offline Message Queuing:** Storing unacknowledged message streams in Apache Kafka or Cassandra partitioned by recipient ID for atomic sync upon client reconnection.

## Edge Cases & Production Hardening

1. **Concurrent chat creation:** Synchronized block prevents duplicate `PrivateChat` instance creation between the same two users.
2. **Disconnected recipient:** Message is persisted in conversation history regardless of recipient status.
