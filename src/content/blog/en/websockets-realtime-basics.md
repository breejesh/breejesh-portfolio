---
title: "WebSockets for Real-Time Apps: Handshake, Heartbeats, Reconnect, Auth, Scale"
description: "How WebSockets actually work in production: the HTTP upgrade, ping and pong, reconnect with backoff, auth patterns that do not leak tokens, and multi-node fan-out with pub/sub."
date: "2026-07-01"
tags: [Networking, Backend, Web Development]
coverImage: /assets/images/websockets-realtime-basics.webp
previewImage: /assets/images/websockets-realtime-basics.webp
---

Standard HTTP follows a strict request-response lifecycle. Real-time applications require full-duplex communication channels where servers push events instantaneously without polling overhead. chat, live dashboards, multiplayer state, trading ticks, collaborative cursors. **WebSockets** give you a long-lived, full-duplex channel over a single TCP connection. The hard part is not opening one socket. The hard part is keeping thousands of them honest under network blips, auth expiry, and multi-pod deploy.

This post is the production checklist I wish I had the first time a "simple live feed" met load balancers and mobile clients.

---

## When WebSockets earn their keep

| Approach | Server push | Overhead | Best fit |
| --- | --- | --- | --- |
| Short polling | No (client asks) | High request rate, empty 200s | Rare updates, simple caches |
| Long polling | Approximate | Held HTTP request per wait | Fallback when WS blocked |
| Server-Sent Events (SSE) | One way (server → client) | Light, HTTP-friendly | Feeds, notifications |
| **WebSocket** | Full duplex | One connection, frames | Chat, games, bidir control |
| WebRTC data | Peer-to-peer | ICE/NAT complexity | Media, direct peer apps |

Use WebSockets when **both** sides send often, or when latency must stay low and stable. Prefer SSE for one-way streams if you do not need client→server on the same channel. Prefer plain HTTP for request/response APIs that do not care about push.

---

## The handshake: HTTP that becomes a socket

A WebSocket starts as a normal HTTP request with upgrade headers. The browser (or client library) sends something like:

```http
GET /ws HTTP/1.1
Host: api.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://app.example.com
```

If the server accepts, it replies:

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

After that `101`, the same TCP connection carries **WebSocket frames**, not HTTP request bodies. Key details:

1. **`Sec-WebSocket-Key` / `Accept`**: not encryption. The client picks a nonce; the server hashes it with a fixed GUID (RFC 6455). That proves both sides speak the protocol and blocks accidental upgrades by dumb proxies.
2. **`Origin`**: browsers send it. Validate it on the server for cookie-authenticated apps so a random site cannot open a socket as the user.
3. **Path and query**: still available at handshake time for routing and (carefully) auth. Prefer path for endpoint choice (`/ws/chat` vs `/ws/prices`).
4. **Subprotocols**: `Sec-WebSocket-Protocol` lets you negotiate a named app protocol. Useful when one host serves several clients with different message schemas.

Reverse proxies must allow upgrades. On nginx you typically need `proxy_http_version 1.1`, `Upgrade` and `Connection` headers passed through, and long (or disabled) idle timeouts. On cloud LBs, look for "websocket support" and idle timeout settings; a 60s idle kill will look like random disconnects.

---

## Frames, messages, and what you send

The wire format is frames: text, binary, ping, pong, close. Your app usually sees **messages** (assembled frames). Keep the contract boring:

- **JSON text** for control and small payloads (chat, presence).
- **Binary** (protobuf, MessagePack, flatbuffers) when payload size or parse cost matters.
- A **message envelope**: `{ "type": "...", "id": "...", "payload": ... }` so you can add types without breaking every client.

Define **close codes** and reasons. `1000` means normal. Auth failures, policy kicks, and server restarts should use distinct codes so clients know whether to reconnect, re-login, or stop.

Do not treat the socket as a free form RPC bus with unbounded size. Cap message size. Reject or close on abuse. Apply backpressure: if a client is slow and your send buffer grows, drop non-critical updates or disconnect rather than OOM the process.

---

## Heartbeats: knowing the dead from the quiet

TCP can sit half-open for a long time after a laptop sleeps, a NAT times out, or a cable is pulled. Without application-level liveness checks, your server still thinks the user is online.

### Ping / pong

RFC 6455 defines control frames **ping** and **pong**. Servers or clients send ping; the peer must reply with pong. Many libraries expose this as an interval option.

Practical defaults many teams start from:

| Setting | Typical range | Notes |
| --- | --- | --- |
| Ping interval | 15s-30s | Shorter for trading UIs; longer for battery |
| Pong timeout | 5s-15s after ping | Missed pong → close and free resources |
| Idle timeout | Related to LB | Must be **greater** than ping interval |

If your load balancer kills idle connections at 60s, your ping interval must be clearly under that (for example 20s-30s). Heartbeats keep the path warm and prove the app layer still responds.

### App-level heartbeats

Some stacks also send a small app message (`{"type":"ping"}`) so middleboxes that only understand HTTP do not confuse control frames, and so you can measure RTT in application metrics. Prefer protocol pings when the library supports them; use app pings when you need custom payload or when a proxy mishandles control frames.

On close (clean or timeout), update presence, cancel server-side subscriptions for that connection, and free memory. Leaked "online" users are a classic WebSocket bug report from product.

---

## Reconnect: clients will drop, plan for it

Mobile networks switch cells. Deploys restart pods. Users close laptops. Reconnect is not an edge case; it is the main loop of a durable client.

### Exponential backoff with jitter

Naïve reconnect-on-close storms the server after a deploy:

```
all clients reconnect at T+0 → thundering herd
```

Better pattern:

```
delay = min(cap, base * 2^attempt) * (0.5 + random())
```

Example: base `1s`, cap `30s`, full jitter. Attempt 0 waits roughly 0.5s-1s. Later attempts stretch out. Reset the attempt counter only after a **stable** open (for example 10s without error), not on the first `onopen`.

### What to re-sync after reconnect

A new socket has no memory of missed events. Common patterns:

1. **Last event id / cursor**: client stores the last applied sequence or timestamp; first message after open is `SUBSCRIBE` + `since`.
2. **Snapshot then delta**: server sends current state, then live updates. Simple for dashboards; heavier for large state.
3. **Versioned rooms**: client holds `roomVersion`; if stale, full resync.

Without one of these, users see gaps after every blip.

### Resume tokens (optional)

Some systems mint a short-lived **resume token** bound to a user and stream offset. On reconnect, present the token to skip full re-auth and resume from the offset. Treat tokens like credentials: short TTL, rotate, revoke on logout.

### Close reasons that should not reconnect

| Close meaning | Client action |
| --- | --- |
| Normal shutdown / user logout | Stay closed |
| Auth invalid / forbidden | Re-login, then open |
| Rate limited / policy | Back off hard, maybe stop |
| Server restart / idle timeout | Reconnect with backoff |

Parse close codes (and your own app error messages) so you do not spin forever on a ban.

---

## Auth: who is on this socket?

Handshake is the main gate. After `101`, many servers never re-check identity until the token expires mid-session.

### Patterns that work

| Pattern | How | Pros | Cons |
| --- | --- | --- | --- |
| **Cookie session** | Same-site cookie on upgrade request | Familiar web auth; CSRF-like Origin checks matter | Harder for native/mobile; sticky cookie domain setup |
| **Query token** | `wss://host/ws?token=...` | Easy in browser `WebSocket` API | Tokens land in logs, proxies, Referer history |
| **First message auth** | Connect anonymously, then `{"type":"auth","token":"..."}` | Token not in URL | Brief unauthenticated connection window |
| **Sec-WebSocket-Protocol trick** | Stuff token into protocol header | Avoids query string | Non-standard abuse of subprotocol; careful validation |

Prefer **`Authorization` via a custom client** or **first-message auth** for SPAs that already hold a bearer token in memory. For first-party browser apps with HTTP-only cookies, cookie + strict **Origin** check is clean.

Never put long-lived secrets in query strings. If you must use a query param (some environments force it), mint a **short-lived, single-purpose** WS ticket from your HTTP API and reject reuse.

### Token expiry mid-connection

Access tokens expire while the socket is still open. Options:

1. **Close with auth code** when expiry hits; client refreshes HTTP token and reconnects.
2. **Refresh over the socket**: client sends a new access token; server re-validates and continues.
3. **Server-side session**: handshake establishes a server session with longer lifetime; access token only used once at open.

Option 2 is smooth for chat apps. Option 1 is easier to reason about for security reviews. Either way, document it; silent death at minute 15 is a support ticket factory.

### Authorization after authentication

AuthN is "who". AuthZ is "which rooms/channels". On `SUBSCRIBE channel:X`, check ACL again. Re-check on reconnect. Do not trust client-supplied room ids blindly. For multi-tenant products, bind every subscription to tenant id from the verified token, not from the message body.

---

## Scaling beyond one process

One Node or Go process can hold many connections, but:

- Deploys and crashes take everyone down.
- CPU for JSON fan-out becomes the limit before RAM does.
- User A on pod 1 cannot receive a message published only in memory on pod 2.

### Sticky sessions are not enough

Load balancers can pin a client to one pod (cookie or IP stickiness). That helps **in-memory** connection maps for a single user's connection, but it does **not** solve "message produced on pod A, consumer connected on pod B." Any broadcast or cross-user event needs a shared bus.

### Pub/sub fan-out

The standard shape:

```
Client ←→ WS gateway pod ←→ Redis (or NATS, Kafka, etc.) ←→ other gateway pods
                              ↑
                         app workers / API
```

1. Client connects to any gateway pod; pod registers local conn → user/rooms.
2. When something happens (API write, worker job), publish to a channel: `room:42`, `user:7`, `tenant:acme:alerts`.
3. Every gateway pod subscribed to that channel receives the event and writes only to **local** matching sockets.

Redis Pub/Sub is common for ephemeral fan-out. Redis Streams or Kafka fit when you need retention and consumer groups. NATS is popular for low-latency internal messaging. Pick based on durability needs, not brand loyalty.

### Horizontal concerns

| Concern | Approach |
| --- | --- |
| Connection count | Many small gateway pods; autoscale on open sockets + CPU |
| Hot rooms | Shard by room id; avoid one process owning a celebrity channel alone if possible |
| Ordered delivery | Per-room sequence numbers; clients sort or drop stale |
| At-least-once | Clients de-dupe by event id |
| Graceful drain | Stop new accepts, wait for close or force close with "reconnect", deregister from pub/sub |
| Observability | Metrics: open conns, pings missed, send queue depth, pub/sub lag, auth failures |

### Stateful extras

Presence ("who is online") and typing indicators want short TTLs and heartbeats, usually in Redis. Do not store presence only in process memory if more than one pod serves traffic.

Large binary blasts (file chunks, video) usually do not belong on the same socket as control chat. Separate channels or switch to object storage + signed URLs.

---

## Minimal server sketch (mental model)

Pseudocode, not a framework:

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

The important split: **local socket map** on the gateway, **shared bus** for cross-pod delivery, **auth on every privilege change**.

---

## Client checklist

1. Open with `wss://` in production (TLS).
2. Heartbeat (protocol or app) under LB idle timeout.
3. Reconnect with exponential backoff + jitter.
4. Resume with last event id or snapshot.
5. Handle auth expiry without infinite reconnect loops.
6. Cap inbound message size and validate schema.
7. Surface connection state in the UI (online / reconnecting / offline).
8. On page hide / app background, decide whether to keep the socket or pause (mobile battery).

---

## Common failure modes

| Symptom | Likely cause |
| --- | --- |
| Random disconnect every ~60s | Proxy idle timeout; heartbeats too slow |
| Works on one server, silent miss multi-pod | No pub/sub; in-memory only |
| Reconnect storm after deploy | No backoff/jitter; no drain |
| Token in access logs | Query-string auth |
| "Online" ghosts | No pong timeout; presence not cleared |
| OOM on gateway | Unbounded send buffers; no backpressure |
| CSRF-like hijack | Cookie auth without Origin checks |

---

## When not to use WebSockets

- Mostly request/response CRUD with rare updates: HTTP is simpler.
- One-way server push on HTTP infrastructure you already trust: SSE may be enough.
- Massive fan-out of identical public data: CDN + SSE or polling a cache edge can be cheaper.
- Serverless platforms with short request lifetimes and no socket support: use a managed realtime service or a long-running gateway tier.

WebSockets are a transport. They do not replace auth design, idempotent event ids, or a plan for multi-node fan-out. Get the handshake right, prove liveness with heartbeats, reconnect with patience, gate every subscription, and put a bus between pods. The rest is product polish on a connection that stays up.
