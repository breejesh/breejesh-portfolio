---
title: "Design a Chat System: WebSockets, Message Ordering, Delivery Ticks, and Presence"
description: "A production chat design: stateful WebSocket servers with a session registry, per-conversation sequence numbers, idempotent sends, storage partitioned by conversation, delivery and read receipts as cursors, groups, multi-device sync, presence, push fallback and end-to-end encryption."
date: "2025-11-19"
tags: [System Design & Architecture, Backend & Databases]
coverImage: /assets/images/design-chat-system.webp
previewImage: /assets/images/design-chat-system.webp
---

> **TL;DR**
> * **The Problem:** Deliver messages between users in well under a second, in order, exactly once from the user's point of view, across flaky mobile networks, multiple devices per user, and users who are offline for days.
> * **The Design:** Keep a persistent WebSocket per device on stateful chat servers, record which server holds each user in a session registry, assign each message a per-conversation sequence number when it is persisted, route it through a delivery bus to the recipient's server, fall back to push notifications when the recipient is offline, and treat delivery and read receipts as cursors over that sequence.
> * **The Result:** Ordering and deduplication fall out of the sequence numbers, reconnects become "send me everything after seq N," and the stateful part of the system shrinks to a thin connection tier that can fail without losing a single message.

Chat looks like the simplest product in this series: you type, they see it. Underneath, it is the one where users notice every flaw. A message out of order, a duplicate after a reconnect, a tick that says "read" when it was not: each of these is a bug report with a screenshot attached.

This post designs a 1:1 and small-group messenger in the WhatsApp, Signal or Messenger mold.

---

## Requirements and Numbers

**Functional:** 1:1 and group chats (up to a few hundred members), text and media, sent/delivered/read indicators, online presence, history on every device, push notifications when offline.

**Non-functional:** end-to-end latency under 500 ms for online recipients; no lost messages after the sender sees "sent"; per-conversation ordering; works on unreliable mobile networks.

| Assumption | Value | Derived |
| --- | --- | --- |
| Daily active users | 50M | |
| Messages per user per day | 40 | 2B messages/day, ~23k/s average, ~70k/s peak |
| Average message size (with metadata) | ~200 bytes | ~400 GB/day before replication |
| Peak concurrent connections | 15M | At ~500k connections per tuned server, ~30 servers, plus headroom |

Persistent connections are cheap per connection but numerous. WhatsApp famously reported more than two million concurrent connections on a single Erlang server back in 2012, so the connection tier is less about raw count and more about how gracefully it handles reconnect storms.

---

## Why WebSockets

| Transport | How the server reaches the client | Fit for chat |
| --- | --- | --- |
| Short polling | Client asks every few seconds | Wasteful and laggy |
| Long polling | Client holds a request open until there is news | Works, but every message costs a new request |
| Server-Sent Events | One-way stream from server | Fine for receiving, still needs a separate send path |
| WebSocket | Full-duplex connection over a single TCP/TLS socket | Natural fit: low overhead in both directions |

Mobile apps also use the OS push channel (APNs, FCM) as a wake-up signal when the app is in the background and the socket is closed.

---

## The Architecture

![Chat architecture: Alice and Bob connect over WebSockets to different chat servers; the message service assigns a sequence number and appends to the messages database, routes through a delivery bus that looks up Bob's server in the session registry, delivers to Bob's chat server, falls back to a push notifier when Bob is offline, and a presence service tracks heartbeats](/assets/images/hld/design-chat-architecture.webp)

* **Alice / Bob.** Each device keeps one WebSocket open while the app is in the foreground. Devices, not users, are the unit of connection.
* **Chat Servers.** Terminate WebSockets and do almost nothing else. They are the only stateful tier (they hold sockets), so they are kept thin: authenticate, forward sends, push deliveries, relay acks.
* **Message Service.** Stateless. Validates the message, assigns the next **per-conversation sequence number**, persists it, and only then acknowledges to the sender. This is the "one grey tick" moment: once Alice sees it, the message is durable.
* **Messages DB.** Partitioned by conversation, clustered by sequence number, so "give me messages in conversation X after seq N" is one contiguous range read. Discord described exactly this shape (channel plus time bucket as the partition, Snowflake message IDs within) in its posts about storing billions, and later trillions, of messages.
* **Delivery Bus.** Each chat server subscribes to its own topic. Routing a message to Bob means publishing to the topic of whichever server holds Bob's sockets.
* **Session Registry.** `user -> [(device, server)]`, in Redis with TTLs refreshed by heartbeats. It answers "where is Bob right now?"
* **Push Notifier.** If Bob has no live socket, send a push via APNs or FCM. The push is a hint, not the delivery: when the app wakes, it syncs from the database.
* **Presence Service.** Tracks heartbeats to compute online and last-seen status, covered below.

The key design choice is that **persistence comes before delivery**. A message exists the moment it is in the database with a sequence number. Everything after that is an attempt to get it to devices faster.

---

## Ordering, Idempotency and Sync

Three small mechanisms do most of the correctness work:

1. **Client-generated message IDs.** The client attaches a unique `client_id` to each send. If the network drops the ack and the client retries, the Message Service sees the same `client_id` in that conversation and returns the original sequence number instead of storing a duplicate.
2. **Per-conversation sequence numbers.** Global ordering across all chats is unnecessary and expensive. Ordering within a conversation is what users see. A counter per conversation (in the database or a sequencer service owning that conversation's partition) gives a total order and makes gaps detectable.
3. **Cursor-based sync.** Every device remembers the highest sequence it has for each conversation. On reconnect it asks for everything after that. No "did I miss something?" ambiguity, and the same mechanism serves a phone back from a week offline and a laptop that just woke from sleep.

---

## Delivery Ticks Are Cursors

![Delivery and read receipt sequence: Alice sends a message with a client id, chat server 1 appends it with sequence 1043 and returns a single grey tick, the message is routed to chat server 7 and delivered to Bob, Bob's delivered ack produces two grey ticks, and Bob's read cursor update is stored and produces two blue ticks](/assets/images/hld/design-chat-ticks.webp)

| Indicator | What it actually means | Trigger |
| --- | --- | --- |
| One grey tick (sent) | Persisted on the server with a sequence number | Message Service commit |
| Two grey ticks (delivered) | At least one of the recipient's devices has it | Device ack |
| Two blue ticks (read) | Recipient opened the conversation up to this point | Read cursor advanced |

The green note is the scalable trick: **read receipts are cursors, not per-message flags.** Bob's device reports "I have read conversation X up to seq 1043." One write covers every earlier message. In a group, each member has a cursor, and "read by 12 of 40" is a count over cursors, not 40 writes per message.

---

## Groups

For small groups (up to a few hundred members), **fan-out on write** works: after persisting once in the group's conversation partition, route a delivery to each online member's server and push notifications to offline ones. The message is stored once; only deliveries fan out.

For very large channels (thousands to millions of members, Discord-style servers or broadcast channels), stop delivering to everyone. Members read the channel log when they open it, and only those actively viewing the channel get real-time pushes. That is the same push-versus-pull trade-off as in the [news feed post](/blog/en/design-news-feed-system).

---

## Presence Without Melting the System

Presence is deceptively expensive. If every status change is broadcast to every contact, one user going online can trigger hundreds of messages, and a mobile network flapping a user's connection triggers them repeatedly.

* **Heartbeats with TTLs.** Clients heartbeat every 30 seconds or so; a user is online while the key is fresh. A brief disconnect does not immediately flip them offline.
* **Subscribe, do not broadcast.** Only send presence updates for contacts whose chat is currently open on someone's screen, or batch updates for contact lists.
* **Debounce.** Coalesce rapid online/offline flips into one update.
* **Last seen is cheap; live presence is not.** Many products show "last seen" (a timestamp read on demand) instead of a live dot for everyone.

---

## Multi-Device

Each device is a separate connection and a separate cursor. A message to Bob is delivered to all of Bob's live devices, and a message Bob sends from his laptop must also appear on his phone, which is just another delivery to his own devices. With end-to-end encryption this gets more involved: the sender encrypts separately for each recipient device (the Signal protocol approach WhatsApp adopted in 2016), so the server routes ciphertext it cannot read.

---

## End-to-End Encryption, Briefly

With E2EE, the server stores and routes opaque ciphertext. That changes the design in specific ways:

* Server-side search over message content is impossible; search happens on the device.
* Spam and abuse detection relies on metadata, reports and client-side signals rather than content scanning.
* Message history on a new device requires an encrypted backup or a device-to-device transfer, since the server cannot decrypt history for you.

The routing, sequencing and cursor design above works unchanged; it never needed to read the content.

---

## Failure Modes

| Failure | Behavior |
| --- | --- |
| Chat server crash | Its sockets drop; clients reconnect (with jitter) to another server and sync from their cursors. Nothing is lost because nothing lives only on chat servers |
| Reconnect storm after a deploy or network blip | Jittered backoff on clients; drain servers gradually during deploys |
| Ack lost on the way back to the sender | Client retries with the same `client_id`; server deduplicates |
| Recipient offline for a week | Push notifications as hints; full sync from cursor on next open |
| Session registry stale | Delivery to a dead server times out; fall back to push and let sync fix it |
| Messages DB partition slow | Sends for that conversation slow down; other conversations unaffected because of partitioning |

---

## Production Checklist

- [ ] Persist before acknowledging; "sent" means durable
- [ ] Client-generated IDs for idempotent retries
- [ ] Per-conversation sequence numbers; gap detection on clients
- [ ] Cursor-based sync on every reconnect
- [ ] Read receipts stored as cursors, not per-message rows
- [ ] Session registry with heartbeat TTLs; push fallback on routing failure
- [ ] Presence debounced and subscription-based
- [ ] Jittered reconnect backoff; graceful connection draining on deploy
- [ ] Dashboards: send-to-deliver latency p99, connections per server, reconnect rate, push fallback rate, dedup hits

---

## The Leftover

The tick marks are the most honest UI in modern software. One grey tick says the server has it. Two say a device has it. Blue says a person looked.

Everything in this design exists to make those three small claims true, every time, on a train going through a tunnel. And somewhere a grey tick will sit there for an hour anyway, and the sender will stare at it, which no architecture can fix.

---

## Sources

* [WhatsApp blog: 1 million is so 2011 (two million connections per server)](https://blog.whatsapp.com/1-million-is-so-2011)
* [Discord: How Discord Stores Billions of Messages](https://discord.com/blog/how-discord-stores-billions-of-messages)
* [Discord: How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages)
* [Signal: The Double Ratchet Algorithm](https://signal.org/docs/specifications/doubleratchet/)
* [RFC 6455: The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455)
* Related in this series: [Design a Notification System](/blog/en/design-notification-system), [Design a News Feed System](/blog/en/design-news-feed-system), [WebSockets and real-time basics](/blog/en/websockets-realtime-basics)
