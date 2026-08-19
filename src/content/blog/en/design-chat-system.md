---
title: "Design a Chat System: Walkie-Talkies, Post Offices, and Green Ticks"
description: "Chat system design for absolute beginners: live online path vs history storage, 1:1 and small groups, presence, delivery ticks, and how to explain the whole design to a friend."
date: "2025-11-19"
tags: [System Design]
coverImage: /assets/images/design-chat-system.webp
previewImage: /assets/images/design-chat-system.webp
---


> **TL;DR**
> * **The Problem:** Design a production architecture that balances throughput, latency, and fault tolerance without introducing runaway operational complexity.
> * **The Insight:** Chat system design for absolute beginners: live online path vs history storage, 1:1 and small groups, presence, delivery ticks, and how to explain the whole design to a friend.
> * **The Result:** Concrete blueprint with quantitative performance targets and production failure mode mitigations.

Open WhatsApp or iMessage. Type a line. Hit send. A tick appears. Sometimes a green dot says your friend is online. It feels like magic. It is not magic. It is two old ideas wearing modern clothes.

**Idea 1: a walkie-talkie.** When both people are connected right now, the server keeps a live line open so words can push through in a fraction of a second.

**Idea 2: a post office.** Every message is also filed in a warehouse (the database). When someone was offline, or opens the app later on another phone, history is fetched from that warehouse, not from the air.

If you remember only one sentence from this post, make it this: **the live connection is for speed; the message store is for truth.**

This guide teaches chat system design the way a patient professor would: plain language first, real product behavior second, interview boxes third. We scope a Messenger-style product: 1:1 chat, small groups, text, online presence, delivery ticks, and multi-device history. For wire-level WebSocket details (handshake, heartbeats, reconnect), see [WebSockets for Real-Time Apps](/blog/en/websockets-realtime-basics). Here we stay on the product architecture.

---

## What are we building?

Before boxes and arrows, pin the product. Interviews fail when people invent Discord-scale channels while the prompt was "WhatsApp for friends."

| Question | Default answer for this post |
| --- | --- |
| 1:1, groups, or both? | Both |
| Group size | About 100 people max |
| Clients | Phone and web |
| Scale example | Tens of millions of daily users (order of magnitude) |
| Message type | Text first; photos later |
| History | Keep for a long time |
| Same account on phone + laptop | Yes |
| End-to-end encryption | Out of scope unless asked |
| Notify when offline | Yes (push notification) |

**What users must be able to do**

1. Send and receive 1:1 messages quickly when both are online.
2. Chat in a small group.
3. See who is online or offline (presence).
4. Open the app and load past messages.
5. Stay in sync across multiple devices.
6. Get a push when offline, then catch up when they open the app.

**What we will not design unless asked:** voice calls, million-person channels, reactions, search across all history, full end-to-end crypto. Name those out of scope so the conversation stays honest.

---

## The core mental model: walkie-talkie and post office

### Walkie-talkie = online path

Picture two friends with walkie-talkies on the same channel. Press the button, talk, release. The other hears it **if** they are listening **right now**.

In chat:

- Your phone holds a **long-lived connection** to a chat server (usually a WebSocket).
- When you send "on my way," the server can **push** that text to your friend's open connection immediately.
- No repeated "any new messages?" every second. The server talks when something happens.

That live wire is why chat feels instant. It is also why chat servers are hard: millions of phones may keep a socket open at the same time.

### Post office = history storage

A walkie-talkie is useless for last week's conversation. For that you need a filing system.

In chat:

- Every accepted message is **written to durable storage** (a database designed for many small appends).
- When your friend was offline, the message still sits in the store.
- When they open the app, the client asks: "give me everything after message id X."
- When they switch from phone to laptop, the laptop loads history from the same store.

**Rule of thumb**

| Path | Job | Failure mode if you rely on it alone |
| --- | --- | --- |
| Live connection (walkie-talkie) | Fast delivery while online | Misses anything sent while disconnected |
| Message store (post office) | Durable history and catch-up | Too slow if every chat only pulled on demand with no push |

Production chat uses **both**. Live push is acceleration. The store is the source of truth. If a push is lost on a flaky network, the next sync from storage heals the gap.

---

## How does the phone stay "on the line"?

Regular web requests are like mailing a postcard and waiting for a reply. Fine for login or loading profile. Bad for chat.

Chat needs the server to speak **first** when a message arrives for you. Common options:

| Approach | Beginner summary | Good for chat? |
| --- | --- | --- |
| Short polling | App asks every few seconds "anything new?" | Wasteful; mostly "no" |
| Long polling | App asks and server holds the question until something appears | Works; clumsy at scale |
| **WebSocket** | One long open pipe both ways after a small setup handshake | **Default yes** |
| HTTP REST | Normal request and response | Login, history pages, settings |

Many products send messages over the WebSocket and also use HTTP for boring work (signup, friend list, older history pages). The important split:

- **Stateless HTTP APIs:** any server can answer; easy to scale.
- **Stateful chat gateways:** each live phone is pinned to **one** chat node that holds its socket.

Sticky connections mean you need a map: "user B is currently connected on chat server 7, device phone." That map lives in a fast store (often Redis). Without it, server 1 has no idea how to shout to B who is on server 7.

---

## Big picture architecture (still simple)

Three kinds of pieces, not fifty logos.

### 1. Boring product APIs (stateless)

Auth, profile, contact list, conversation list, history fetch. Sit behind a normal load balancer. Add more machines when traffic grows.

### 2. Chat servers (stateful)

Hold WebSocket sessions. Accept new messages. Push messages, typing dots, and presence events. Look up where a user is connected.

### 3. Support systems

| Piece | Job in plain words |
| --- | --- |
| Message store | The post office warehouse of all chat history |
| ID generator | Unique message ids, ideally roughly time-ordered |
| Session map | `user_id → which chat server and which devices` |
| Presence store | Online / offline, last active time |
| Cross-server bus | Tells other chat nodes "deliver this to user B" |
| Push service | Phone lock-screen notification when no live socket |
| Object storage (later) | Photos and videos |

```
Phone / web ──HTTP──► API (auth, history pages)
Phone / web ──WS────► Chat server ──► bus ──► other chat servers
                         │
                         ├── message store (truth)
                         ├── session + presence map
                         └── push provider (if offline)
```

---

## Getting online: joining the right walkie-talkie tower

When the app opens:

1. Client logs in through the API and gets a short-lived token.
2. **Service discovery** answers: "connect your WebSocket to this chat host" (healthy, not overloaded, preferably nearby region).
3. Client opens the WebSocket with that token.
4. Chat server checks the token, writes the session map entry, marks you **online**, and starts listening for heartbeats.

If that chat server dies, discovery stops advertising it. Clients reconnect with backoff and land on a healthy node. Unsent messages wait in a local outbox on the phone until the server acks them.

Think of discovery as the operator who assigns you a free radio tower instead of jamming everyone onto one broken tower.

---

## What is stored for each message?

Chat writes are mostly appends: new lines at the end of a conversation. A practical record looks like this:

| Field | Why |
| --- | --- |
| `message_id` | Unique id, preferably sortable by time |
| `conversation_id` | Which chat thread |
| `sender_id` | Who sent it |
| `body` | The text |
| `created_at` | Server time |
| `type` | text, system notice, and so on |
| `client_msg_id` (optional) | Stops double-send when the network retries |

Access patterns that matter:

1. **Open a conversation:** last N messages for that `conversation_id`, then older pages while scrolling.
2. **Catch up a device:** everything for this user newer than cursor X.
3. **Small group fan-out:** often a copy or pointer into each member's inbox so each phone only reads **its** mail.

Interviewers often like a key-value or wide-column story (partition by conversation or by recipient inbox) because write volume is high and access is by key, not by fancy joins. SQL with good indexes works at smaller scale; say when you would graduate off it.

**Idempotency:** your phone might send the same message twice after a blip. Key by `(sender_id, client_msg_id)` so the post office stamps one letter, not two copies.

---

## 1:1 flow: A texts B

A is on chat server 1. B is on chat server 2.

```
1. A → WebSocket → server 1: {to: B, body, client_msg_id}
2. Server 1 checks: allowed to talk? rate limit ok?
3. Assign message_id, write to the message store
4. Ack back to A → UI shows "sent"
5. Look up B in the session map
6a. B online: tell server 2 via the bus → push on B's socket → "delivered" when B's app acks
6b. B offline: queue a push notification; message waits in the store for later sync
7. Read: B's app reports "I saw up to message_id" → update store → notify A's devices
```

**Ordering:** keep order **inside one conversation** (or at least per sender). Global order across every chat on earth is expensive and useless.

**Truth vs speed:** if the bus drops a live push, B still gets the message when the app syncs from the store. Live fan-out is not a substitute for durable storage.

---

## Delivery ticks: what each mark really means

Users read ticks as feelings. Engineers must map ticks to events.

| What you see | What the system means |
| --- | --- |
| Clock / sending / failed | Still only on the phone; server has not accepted it |
| **Sent** (one tick) | Server wrote the message and returned `message_id` |
| **Delivered** (two ticks) | At least one of the recipient's devices got it (or marked delivered after fetch) |
| **Read** (blue / filled) | Recipient's client reported the message as seen |

Notes you can defend in an interview:

- **Sent** is server-authoritative after persist. Do not show "sent" only because the local UI optimistically painted it.
- **Delivered** needs a client ack on the live path, or an ack after pull-from-store. For multi-device, pick a rule: "any device" is common.
- **Read** is often coalesced: "read up to id X" instead of one database write per message every time someone scrolls.
- Never block the send path on the other person reading. Status rides beside the main path.

Walkie-talkie analogy: "sent" means the post office accepted the letter. "Delivered" means it reached their mailbox or their hand. "Read" means they opened it.

---

## Small groups: one shout, many mailboxes

For groups up to about 100 people, a practical model is **fan-out on write** into per-user inboxes:

1. A sends to `group_id`.
2. Server loads the member list (cache it).
3. Write the canonical message once for group history.
4. Place a copy or pointer into **each member's sync inbox**.
5. Push live to every online member's chat server.
6. Offline members get a push notification and sync later.

Why copy for small N?

- Each client only reads **its** inbox to catch up. Simple mental model.
- Partial delivery and membership quirks are easier per user.
- Cost is O(members) storage and work per message. Fine at 100. Painful at 100,000.

For huge channels (think public Discord), you flip the model: store once per channel, members pull or subscribe to the stream, and presence becomes approximate. Say that trade-off out loud. Do not pretend a 1:1 design scales to a million-person room by "adding servers."

**Membership change:** can a new joiner see history from before they joined? That is a product rule. Mention it.

---

## Presence: the green and grey dots

"Online" is not a boolean painted once at login. Mobile networks blink. A naive design flips offline on every short disconnect and the contact list strobes.

### Signals that work

| Event | Presence effect |
| --- | --- |
| WebSocket login success | Candidate for online |
| Heartbeat every few seconds | Stay online |
| Clean logout | Offline immediately |
| Missed heartbeats past a grace window (example: 30s) | Offline |
| Brief network blip under the grace window | Stay online |

Store something like:

```
user_id → { status: online|offline, last_active_at, devices: [...] }
```

Often in Redis with a TTL refreshed by heartbeats.

### Who should be told?

For a normal friend list, publish presence changes to interested friends (or to people currently viewing that profile). Their chat servers push a tiny "now online" event.

For huge groups, do not spam 100,000 people every time someone blinks online. Load presence when opening the member list; refresh on demand.

Presence is **eventually consistent**. A few seconds wrong is better than melting the system under status storms.

Walkie-talkie analogy: the green light means "I hear you on the channel right now," not "I own a radio somewhere in the world."

---

## Multi-device: same person, two radios

Phone and laptop both open. Each device keeps a **cursor**: the latest message id it has applied.

On connect or resume:

1. Open the live connection (and/or HTTP sync).
2. Ask: messages for me where `message_id > cursor`.
3. Apply them, advance the cursor, paint the UI.

While both are live, the session map holds **multiple** connections per user. Fan out pushes to every connection so both screens update without waiting for the next pull. The cursor path heals sleep mode, airplane mode, and killed apps.

---

## Scale without the panic jargon

### Connections

Chat nodes each hold a slice of open sockets. Connection count (and memory per socket) often hurts before CPU does. Horizontal scale means more chat nodes and discovery that spreads new logins. On deploy, drain old nodes; clients reconnect.

Rough interview math you can adjust live:

- 50M daily users.
- Peak concurrent connections might be a fraction of DAU (example: 10M online at once).
- If each connection costs on the order of 10 KB of server RAM for buffers and session state, that is tens of gigabytes of connection memory **across the fleet**, not on one laptop.

### Message path

- Partition the store by conversation or by recipient inbox.
- Hot path: authorize → id → **persist** → ack "sent" → async fan-out.
- Keep push notifications and analytics off the critical ack path.

### Failures worth naming

| Failure | Mitigation |
| --- | --- |
| Chat node dies | Client reconnect + discovery; catch up from store |
| Bus drop between nodes | Store + sync is truth |
| Duplicate send | `client_msg_id` idempotency |
| Hot group | Cache members; rate limit; backpressure |
| Presence storm | Heartbeat grace; on-demand for large rosters |
| Giant message | Size cap at the gateway |

### Consistency in one breath

- After server ack: message is durable and will show up (push or later sync).
- Live delivery: best-effort fast path.
- Read receipts and presence: eventual.

That split keeps the send button honest under partial failures.

---

## Security and abuse (interview depth)

- Authenticate the WebSocket; refresh tokens without dropping the pipe carelessly.
- Authorize every send (blocks, group membership).
- Rate limit per user and per group.
- Cap body size.
- TLS on the wire (WSS). Encrypt at rest in the store. Full end-to-end encryption is a separate design (keys on every device).
- Server-side fan-out means the server can read plaintext unless you commit to end-to-end. Say which world you are in.

---

## Design you can defend on a whiteboard

**Product:** large-scale Messenger style, 1:1 + groups ≤100, text, presence, multi-device, push when offline.

**Pieces:**

1. HTTP API cluster (auth, profile, history).
2. Discovery for healthy chat endpoints.
3. Chat gateway fleet (WebSockets + session updates).
4. ID generator.
5. Message store (partitioned for append and by-conversation reads).
6. Fast store for sessions and presence.
7. Pub/sub or queue for cross-node delivery.
8. Push workers (APNs / FCM).

**1:1 send:** WS → validate → id → persist → ack sent → route to recipient node or push → delivered/read as side events.

**Group:** same, with membership expand and per-user inbox fan-out for small N.

**Sync:** cursor per device from store; live push to all active sessions.

**Trade-offs to say out loud:**

- WebSocket both ways simplifies the client; HTTP send + WS receive also works.
- Per-user inbox copies simplify small groups; they break for huge channels.
- Live fan-out is not a substitute for durable storage.
- Presence needs heartbeats and grace, not raw TCP disconnect events.
- One server holding all sockets is a toy, not a global chat product.

---

## Production checklist

- [ ] Scope: 1:1, group size, media, encryption, retention
- [ ] HTTP vs WebSocket split is clear
- [ ] Discovery returns healthy chat nodes only
- [ ] Session map supports multi-device
- [ ] Message ids unique and merge-friendly
- [ ] Idempotent send with client ids
- [ ] Persist before (or with clear semantics of) "sent"
- [ ] Delivered and read defined for multi-device
- [ ] Offline push path tested
- [ ] Presence heartbeat + grace window
- [ ] Group fan-out cost bounded (or different model for large N)
- [ ] Rate limits and max body size at the edge
- [ ] Drain and reconnect story for deploys and node death
- [ ] Metrics: connections, send QPS, ack latency, fan-out lag, push success, reconnect rate

---

## Recap you can tell a friend

Imagine chat as two systems glued together.

First, a **walkie-talkie network**. While you are online, your phone keeps a live line to a chat server. Messages push through that line so chat feels instant. Green dots are "I am on the channel right now," refreshed by quiet heartbeats so a tunnel blip does not paint you offline.

Second, a **post office**. Every accepted message is filed. Ticks mean: accepted by the post office (sent), reached their device (delivered), opened (read). If your friend was asleep or offline, the letter still sits in storage. When they open the app, or open a second device, they pull history with a cursor: "give me everything after the last thing I already have."

One-to-one chat is one letter with a live shout if they are connected. Small groups make many mailbox copies (or pointers) so each person can catch up from their own inbox. Huge public rooms need a different model; do not stretch the small-group design forever.

If a live shout fails, the warehouse still has the letter. **Speed is the walkie-talkie. Truth is the post office.** That is the whole chat system in one breath.

---

## Closing

A chat system is not "WebSockets plus a database." It is sticky real-time sessions, a durable append log of messages, and fan-out rules that change with group size, plus presence and sync so multi-device life and flaky networks feel intentional instead of broken.

Interview spine: **HTTP for boring CRUD, WebSocket for the live wire, store as source of truth, push as fast path, per-user inbox for small groups, heartbeats for presence.** Everything else is sizing, failure handling, and product scope.

When someone asks "what if the group has a million members?" change the fan-out model. Do not only add servers to a walkie-talkie design and hope.