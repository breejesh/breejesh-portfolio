---
title: "Chat Server: Users, Conversations, Messages, and Status (Java OOD)"
description: "CTCI-style problem 7.7 for beginners: design a chat server in Java with User, PrivateChat and GroupChat, Message, presence status, and friend add requests. Scope first, then classes."
date: "2026-03-04"
tags: [Algorithms]
coverImage: /assets/images/ctci-7-7-chat-server.webp
previewImage: /assets/images/ctci-7-7-chat-server.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 7.7 for beginners: design a chat server in Java with User, PrivateChat and GroupChat, Message, presence status, and friend add requests. Scope first, then classes.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

A chat server is a product, not a single method. Interviewers know that. They want you to **scope** the work, name the objects, and show how friends, private chats, group chats, messages, and online status hang together. Networking, push delivery, and full multi-region scale usually stay out of the first sketch unless they ask.

This post is original **object-oriented design** teaching for beginners in **Java**. Same problem family as classic interview OOD, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 7 continues after [Jigsaw](/blog/en/ctci-7-6-jigsaw).

---

## 1. Everyday analogy

Think of a company chat board on the wall of a small office.

* Each person has a **name tag** and a sticky note for mood: available, busy, away, offline.
* **Friends** are people on your contact list. You cannot spam strangers; someone has to accept an add request first.
* A **private chat** is a sealed envelope that only two people open.
* A **group chat** is a shared folder. People join or leave. Messages stack in order.
* When you write a note, it goes into the right folder, with a timestamp, and the people in that folder should see it.

The server is the clerk who keeps the contact lists, folders, and sticky notes consistent. Your job in the interview is to design the clerk's filing system as classes, not to wire every TCP socket.

---

## 2. Plain problem statement

**Goal:** sketch backend classes and methods for a chat server focused on users and conversations.

**In scope (default for this post):**

* Sign online and offline (presence).
* Status type plus optional status message (available, busy, away, idle, offline).
* Mutual friending: send, accept, reject add requests.
* Private (1:1) chats and group chats.
* Append text messages to a conversation.
* Look up users by id or account name.

**Out of scope unless asked:**

* Voice, video, file transfer.
* End-to-end encryption.
* WebSocket framing and client UI.
* Full sharded production scale (discuss as hard follow-ups, not first code).

**Assumptions to say out loud:**

* Friendship is mutual. If A is on B's contact list, B is on A's.
* A private chat is always exactly two participants.
* Group chats can add and remove participants.
* We design in-memory domain objects first. A database would persist users and message history behind the same interfaces later.

**Core types you will end up with:**

| Type | Role |
| --- | --- |
| `User` | identity, contacts, chats, status, send paths |
| `Conversation` | participants + message list (abstract) |
| `PrivateChat` / `GroupChat` | two concrete conversation shapes |
| `Message` | content + timestamp |
| `UserStatus` / `UserStatusType` | presence + optional text |
| `AddRequest` / `RequestStatus` | pending friend requests |
| `UserManager` | registry of users, online set, approve/reject adds |

---

## 3. Think first

### Scope beats "WhatsApp clone"

If you start with Kafka, Redis, and multi-DC failover, you never reach classes. Open with:

1. What actions must work?
2. What objects own those actions?
3. What is deliberately ignored?

That is the interview. The code is evidence that the model is real.

### Why Conversation is abstract

Private and group chats both hold participants and messages. They differ on membership rules:

* Private: fixed pair; helper to get "the other person."
* Group: dynamic membership (`addParticipant` / `removeParticipant`).

Share the message list and id on an abstract `Conversation`. Put membership rules on subclasses. That keeps `User.sendMessageToGroupChat` and history reads simple.

### Where messages go

A common clean flow for private chat:

1. Sender looks up or creates the `PrivateChat` with the other user.
2. Builds a `Message` with content and time.
3. Appends to the conversation.
4. (Real system) notifies recipients over the network. In OOD sketch, returning `true` after append is enough.

Group chat: resolve chat by id, check sender is a participant, append.

### Friending flow

1. A calls `requestAddUser(B's account name)`.
2. `UserManager` creates an `AddRequest`, records it on both users (sent and received maps).
3. B accepts: manager adds each user to the other's contacts and clears the request.
4. B rejects: request status becomes rejected; no contact link.

Do not let A message B as a contact until accept completes, if your product rules require that. State the rule.

### Status is not the same as "in a chat"

`UserStatusType` answers "can I bother this person?" (Available, Busy, Away, Idle, Offline). Being in a conversation does not replace presence. Online maps on `UserManager` track who is signed on for routing later.

### Singleton UserManager?

A single registry is fine in an interview sketch so every path finds the same user map. In production you would replace that with a service and a datastore. Say so: "singleton for the whiteboard, not a production decree."

---

## 4. Java solution

Original teaching model: enough method bodies to walk a friend request and a private message. Not a full server.

### Enums and small value types

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

### Conversation hierarchy

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

### Walkthrough

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

What matters in the interview is the **object graph**: manager owns the directory, users own contacts and chat handles, conversations own message history, status lives on the user.

---

## 5. Hard problems (say these if you have time)

These are the classic "what would hurt?" questions after the class diagram.

### How do you know someone is really online?

Clients can vanish without a clean sign-off (laptop sleep, killed process, flaky network). Treat presence as a **lease**:

* Client heartbeats on a timer.
* Missed heartbeats move the user to Offline (or Away first, then Offline).
* Never trust only "user clicked log out."

### Memory vs database conflict

Hot data (who is online, open sockets) lives in process memory. Durable data (accounts, archives) lives in a database. When they disagree, **durable usually wins for history**, and **last heartbeat wins for presence**. Design explicit ownership so you do not double-write without a rule.

### Scale

One `UserManager` singleton does not serve millions of concurrent users. You split by user id ranges or chat id, replicate carefully, and accept that cross-machine friend requests need coordination. Name the pain: consistency of contact lists and message order across machines.

### Abuse and denial of service

Any API that accepts client traffic can be flooded: spam add requests, huge messages, join/leave thrash. Rate limit per user and per IP, cap message size, and drop or queue excess work. Even a whiteboard answer should mention caps.

### Delivery guarantees (bonus)

At-most-once is easy and loses messages. At-least-once needs ids and client de-dupe. Exactly-once is expensive. For chat interviews, "persist then fan out, client retries with message id" is a solid default sentence. For product-scale architecture of the same idea, see [Design a Chat System](/blog/en/design-chat-system).

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Add self** or **add missing account** → no-op or clear error.
* **Double accept** of the same request → contacts stay correct; no duplicate private chat.
* **Message non-contact** → reject if that is your rule; say the rule.
* **Empty message body** → reject.
* **Group message from non-member** → reject.
* **Sign-off without sign-on** → remove is safe no-op.
* **Two private chats for the same pair** → create once and reuse the map entry on both users.

Common mistakes:

1. **Jumping to Kafka and load balancers** before naming `User` and `Conversation`.
2. **One giant Chat class** with flags for private vs group instead of a small hierarchy.
3. **Forgetting mutual contacts** on accept (only A gets B).
4. **Putting all messages on User** instead of on the conversation both people share.
5. **Mixing presence with message delivery** so offline users break the model.
6. **Silent networking hand-wave** when asked how B sees A's message: at least say "notify online sessions; offline users pick up from store later."

Minimal smoke ideas:

```java
// after register + mutual accept
assert ana.isContact(ben);
assert ben.isContact(ana);
assert ana.sendMessageToUser(ben, "hi");
assert !ana.sendMessageToUser(ben, ""); // empty rejected
```

---

## 7. Explain to a friend recap

Chat Server OOD is a scoped filing system:

1. **User** holds account identity, status, contacts, private chat map, group chat list, and add-request maps.
2. **Conversation** is abstract: id, participants, messages. **PrivateChat** is a fixed pair. **GroupChat** can add and remove people.
3. **Message** is content, time, and sender.
4. **AddRequest** plus **RequestStatus** model pending friendships. Accept makes contacts mutual.
5. **UserManager** is the directory: register, online set, approve/reject, create chats.
6. Hard follow-ups: true presence (heartbeats), memory vs DB truth, scale, and abuse protection.

If you can draw User, Conversation, Message, and the friend-request path on a whiteboard, then walk one private send, you own problem 7.7 for interview depth. Full distributed chat is a longer system design conversation; this post keeps the object model honest.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Jigsaw](/blog/en/ctci-7-6-jigsaw)
* Next: [Othello](/blog/en/ctci-7-8-othello)