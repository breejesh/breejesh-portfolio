---
title: "Design a Unique ID Generator: UUID, Ticket Servers, and Snowflake"
description: "Generating unique IDs across many machines: why auto-increment stops scaling, UUIDv4 vs UUIDv7, Flickr-style ticket servers, Twitter's Snowflake layout with a tested implementation, worker ID leasing, and how to survive clocks that jump backward."
date: "2025-11-16"
tags: [System Design & Architecture]
coverImage: /assets/images/design-unique-id-generator.webp
previewImage: /assets/images/design-unique-id-generator.webp
---

> **TL;DR**
> * **The Problem:** A single database auto-increment is unique and ordered, but it puts one machine on every write path. Once you shard, or create IDs before the database insert, you need IDs that are unique across many machines without asking anyone.
> * **The Design:** For most systems, a 64-bit Snowflake-style ID: 41 bits of milliseconds since a custom epoch, 10 bits of worker ID leased from a coordination service, 12 bits of per-millisecond sequence. Where 128 bits is acceptable, UUIDv7 gives you the same time ordering with no worker coordination at all.
> * **The Result:** Up to 4,096 IDs per millisecond per generator, about 69 years of range, roughly time-sorted IDs that keep B-tree inserts cheap, and a clear policy for the one real failure mode: the clock moving backward.

IDs look like plumbing until they are wrong. Duplicate IDs corrupt data silently. Random IDs bloat indexes. Sequential IDs leak your business volume to anyone who signs up twice a week apart. And IDs that depend on one database make that database the throughput ceiling of the whole company.

This post walks through the options in the order most companies discover them, then designs the one most of them end up with.

---

## Requirements

1. **Unique** across every generator, forever. No exceptions, including after restarts and clock trouble.
2. **Roughly sortable by creation time**, so "newest first" queries and time-bucketed storage work without a separate timestamp index.
3. **Fits in 64 bits** if possible, because 64-bit integers are cheap to store, index, compare and pass through every language and database.
4. **No coordination on the hot path.** Generating an ID should not require a network call.
5. **High throughput**: tens of thousands of IDs per second per service, with bursts.

Not every system needs all five. The comparison below shows what you give up with each option.

---

## The Options

| Approach | Size | Sortable | Coordination | Weakness |
| --- | --- | --- | --- | --- |
| Database auto-increment | 64-bit | Yes | Every insert goes through one DB | Single write bottleneck; breaks with sharding; leaks volume |
| Multi-master auto-increment (step = N) | 64-bit | Per server only | Fixed server count | Adding a server means renumbering the scheme |
| UUIDv4 | 128-bit | No | None | Random inserts fragment B-tree indexes; large keys |
| UUIDv7 (RFC 9562) | 128-bit | Yes (ms) | None | 128 bits; still larger than an integer key |
| Ticket server (Flickr) | 64-bit | Yes | A network call per ID, or per batch | Ticket servers become critical infrastructure |
| Snowflake (Twitter) | 64-bit | Yes (ms) | Worker ID assignment at startup only | Depends on clocks behaving |

**UUIDv4** is 122 random bits. Collisions are not a practical concern. Index locality is: each insert lands on a random page of the primary-key B-tree, which causes page splits and keeps far more of the index hot in memory. On large tables this is a measurable write-throughput and cache-efficiency penalty.

**UUIDv7**, standardized in RFC 9562 in 2024, puts a 48-bit Unix millisecond timestamp in the high bits followed by random bits. You get time ordering and good index locality with zero coordination. If your database has a native UUID type and 16-byte keys are acceptable, UUIDv7 is the simplest good answer in 2025.

**Ticket servers** are what Flickr described in 2010: a tiny MySQL table where `REPLACE INTO Tickets64 (stub) VALUES ('a'); SELECT LAST_INSERT_ID();` hands out the next number. Two servers configured with `auto_increment_increment = 2` and offsets 1 and 2 give you redundancy (odd and even IDs). It works well and is easy to reason about, but every ID needs a round trip unless you hand out batches.

**Snowflake**, which Twitter open-sourced in 2010, gets ordering, 64 bits and no per-ID coordination at the same time. That is why variants of it show up at Discord, in Instagram's sharded ID scheme and in Sony's Sonyflake.

---

## The Snowflake Layout

![Snowflake 64-bit ID layout: one sign bit, 41 bits of milliseconds since a custom epoch, 5 bits of datacenter, 5 bits of worker, and 12 bits of sequence, with notes on 69.7 years of range, 1,024 generators and 4,096 IDs per millisecond](/assets/images/hld/design-unique-id-snowflake-bits.webp)

* **Sign bit (0).** Kept at zero so the ID is a positive signed 64-bit integer in languages and databases that have no unsigned type.
* **Timestamp, 41 bits.** Milliseconds since an epoch you choose. 2^41 milliseconds is about 69.7 years. Twitter's epoch is in November 2010; Discord's is the first millisecond of 2015. Pick a recent epoch so you do not waste range.
* **Datacenter and worker, 10 bits.** Identifies the generator. Splitting it into 5 + 5 is a convention, not a requirement. What matters is that no two live generators share a value.
* **Sequence, 12 bits.** A counter that resets each millisecond. 4,096 IDs per millisecond per generator is about 4 million per second.

Because the timestamp sits in the high bits, sorting IDs numerically sorts them by creation time (to the millisecond, and across generators only as accurately as their clocks agree).

Instagram's 2012 variant swaps the layout to 41 bits of time, 13 bits of logical shard ID and 10 bits of sequence, generated inside PostgreSQL itself. The principle is identical: time first, then "who", then "how many this millisecond."

---

## A Working Generator

This is a complete, thread-safe generator. It uses a flat 10-bit worker ID instead of the 5 + 5 split, and it handles the two edge cases that matter: exhausting the sequence within one millisecond, and the clock moving backward.

```python
import threading
import time

EPOCH_MS = 1_704_067_200_000          # 2024-01-01T00:00:00Z, your own epoch
WORKER_BITS, SEQ_BITS = 10, 12
MAX_WORKER, MAX_SEQ = (1 << WORKER_BITS) - 1, (1 << SEQ_BITS) - 1
MAX_BACKWARD_MS = 5

class Snowflake:
    def __init__(self, worker_id: int):
        if not 0 <= worker_id <= MAX_WORKER:
            raise ValueError("worker_id out of range")
        self.worker_id, self.last_ms, self.seq = worker_id, -1, 0
        self.lock = threading.Lock()

    def next_id(self) -> int:
        with self.lock:
            now = time.time_ns() // 1_000_000
            if now < self.last_ms:                      # clock moved backward
                if self.last_ms - now > MAX_BACKWARD_MS:
                    raise RuntimeError("clock moved backward, refusing to mint IDs")
                now = self._wait_until(self.last_ms)
            if now == self.last_ms:
                self.seq = (self.seq + 1) & MAX_SEQ
                if self.seq == 0:                       # 4,096 IDs used this ms
                    now = self._wait_until(self.last_ms + 1)
            else:
                self.seq = 0
            self.last_ms = now
            return ((now - EPOCH_MS) << (WORKER_BITS + SEQ_BITS)) | (self.worker_id << SEQ_BITS) | self.seq

    @staticmethod
    def _wait_until(target_ms: int) -> int:
        while (now := time.time_ns() // 1_000_000) < target_ms:
            time.sleep(0.0001)
        return now
```

I ran it for 300,000 IDs on one generator: all unique, strictly increasing, and each decoded back to the right timestamp and worker ID. Decoding is just shifts and masks: `timestamp = (id >> 22) + EPOCH_MS`, `worker = (id >> 12) & 1023`, `sequence = id & 4095`.

---

## Where the Generator Lives

![Unique ID architecture: order and payment service pods embed a Snowflake library with leased worker IDs from etcd, sync time with chrony, insert rows keyed by the 64-bit ID into the orders database and publish events carrying the same ID](/assets/images/hld/design-unique-id-architecture.webp)

* **Service pods with an embedded library.** The generator is a library inside each service, not a network service. Minting an ID is a function call under a lock: no hop, no dependency on the request path.
* **etcd (worker-id leases).** At startup each pod leases a free worker ID with a TTL (say 30 seconds) and renews it while alive. If the pod dies, the lease expires and the ID can be reused, but only after the TTL, so two live pods never share one. ZooKeeper ephemeral nodes or a database table with leases work the same way. Static configuration also works for fixed fleets, but it is exactly the thing autoscaling breaks.
* **Time Sync (chrony, slew mode).** Clock discipline is the generator's real dependency. Configure NTP/chrony to slew (gradually speed up or slow down the clock) rather than step it, so corrections do not jump time backward.
* **Orders DB.** The primary key is the 64-bit ID. Because IDs are time-ordered, new rows land at the right edge of the B-tree, which is the cheap case for every relational engine.
* **Order Events.** The same ID travels in events, logs and traces, which makes it trivial to correlate a row with everything that happened around it.

The red note is the policy for the only scary failure, covered next.

---

## Clocks Are the Real Problem

Snowflake uniqueness rests on one assumption: a generator never reuses a `(timestamp, sequence)` pair. A clock that jumps backward breaks that assumption.

**Why clocks jump backward:** NTP stepping after a long drift, a VM migrating to a host with a different clock, a manual change, or a leap-second implementation that repeats a second.

**Defenses, in order of preference:**

1. **Prevent big jumps.** Run chrony or ntpd configured to slew. Use leap-second smearing (Google and AWS publish smeared time), so there is never a repeated second.
2. **Absorb small jumps.** If the clock is a few milliseconds behind the last timestamp used, wait until it catches up, as the code above does.
3. **Refuse large jumps.** If the clock is far behind, stop minting IDs and alert. Failing loudly is far better than silently producing duplicates.
4. **Survive restarts.** On startup, wait until the clock is past the last timestamp the previous process could have used (or persist it), especially if restarts can land on a different host.

Also remember that time order across generators is only as good as clock agreement. Two IDs minted a millisecond apart on different machines can sort in either order. "Roughly sorted" is the honest promise.

---

## Security and Product Notes

* **IDs leak information.** A Snowflake ID reveals when something was created, and sometimes which datacenter made it. Sequential database IDs reveal volume (create two orders a week apart, subtract). For public-facing identifiers, consider a separate opaque ID or encrypt the internal one.
* **Never use IDs as secrets.** Unguessable is not the same as unauthorized. Authorization checks still apply to every lookup by ID.
* **JavaScript precision.** Numbers in JavaScript are doubles, safe only up to 2^53. A 64-bit Snowflake sent as a JSON number will be silently rounded in browsers. Send IDs as strings in JSON. Discord's API does exactly this.

---

## How I Would Choose

| Situation | Choice |
| --- | --- |
| One database, moderate write rate, internal IDs | Database auto-increment is fine. Do not over-engineer |
| Need IDs before insert, can store 16 bytes, no ops budget for coordination | UUIDv7 |
| Need 64-bit integers, many services, high throughput | Snowflake with leased worker IDs |
| Need strictly sequential numbers (invoice numbers, legal sequences) | A ticket server or a database sequence, accepting the bottleneck |

---

## Production Checklist

- [ ] Epoch chosen recently and documented; 69-year horizon noted
- [ ] Worker IDs leased with a TTL from a coordination service, never hand-assigned in autoscaled fleets
- [ ] Clock sync configured to slew; leap-second smearing enabled
- [ ] Backward-clock policy implemented: wait for small skew, fail and alert for large skew
- [ ] Sequence exhaustion waits for the next millisecond instead of wrapping
- [ ] IDs serialized as strings in JSON APIs
- [ ] Public-facing IDs reviewed for information leakage
- [ ] Metrics: IDs minted per second, sequence exhaustion waits, clock-skew errors, lease renew failures

---

## The Leftover

A Snowflake ID is a tiny autobiography: when it was born, where, and how many siblings it had that millisecond.

It is also a quiet bet that the clock on that machine will keep moving forward. Most of the time, it does. The whole design is about the few times it does not, and making sure the generator notices before your database does.

---

## Sources

* [Twitter Engineering: Announcing Snowflake (2010)](https://blog.x.com/engineering/en_us/a/2010/announcing-snowflake)
* [Flickr: Ticket Servers, Distributed Unique Primary Keys on the Cheap](https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap/)
* [Instagram Engineering: Sharding and IDs at Instagram](https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c)
* [RFC 9562: Universally Unique IDentifiers (UUIDv7)](https://www.rfc-editor.org/rfc/rfc9562)
* [Discord developer docs: Snowflakes](https://discord.com/developers/docs/reference#snowflakes)
* [Google Public NTP: leap smear](https://developers.google.com/time/smear)
* Related in this series: [Design a URL Shortener](/blog/en/design-url-shortener), [Design a Key-Value Store](/blog/en/design-key-value-store)
