---
title: "Design a Unique ID Generator: UUID, Ticket Servers, and Snowflake"
description: "Unique IDs explained for beginners: why one database counter fails with many writers, then UUID, ticket servers, and Snowflake as time plus machine number plus counter, like a receipt, including clocks that jump backward."
date: "2025-11-16"
tags: [System Design]
coverImage: /assets/images/design-unique-id-generator.webp
previewImage: /assets/images/design-unique-id-generator.webp
---


> **TL;DR**
> * **The Problem:** Design a production architecture that balances throughput, latency, and fault tolerance without introducing runaway operational complexity.
> * **The Insight:** Unique IDs explained for beginners: why one database counter fails with many writers, then UUID, ticket servers, and Snowflake as time plus machine number plus counter, like a receipt, including clocks that jump backward.
> * **The Result:** Concrete blueprint with quantitative performance targets and production failure mode mitigations.

Every order, tweet, photo, and chat message needs a name that no other thing shares. That name is a **unique ID**. On one laptop this is easy: start at 1, then 2, then 3. At company scale, many machines invent names at the same time. Two machines must never invent the same name.

Think of bank check numbers, the paper ticket machine at a bakery, and the receipt from a store. Each system solves "give me the next unique number" in a different way. This post uses those everyday pictures so the computer version stops feeling mysterious.

---

## What problem are we solving?

When you create a user or an order, the system assigns an ID. Later, every service looks up "order 91827364" and expects exactly one row.

Good IDs usually need a few properties:

| Need | Plain English |
| --- | --- |
| Unique | No two things get the same ID |
| Fast | Making an ID should not become the slow part of checkout |
| Often numeric | Fits a single integer column in the database |
| Often roughly time-ordered | Newer IDs are larger, so feeds and indexes stay tidy |

Gaps are almost always fine. You do not need every integer. You need no collisions.

For the rest of this post we want **64-bit numbers** (they fit in a normal SQL `BIGINT`), unique across the whole product, and roughly ordered by time.

---

## Why one database auto-increment fails when many machines write

A single database primary key with auto-increment is like **one roll of check numbers in one branch**. The bank stamps check 1, then 2, then 3. Perfect, because only one stamp exists.

Problems start when you grow:

1. **Many writers.** You split data across several databases. Each wants its own counter. Two counters both say "next is 7." Collision.
2. **Many app servers.** Twenty pods insert rows. They still share one counter if one database owns it. That counter becomes a line everyone waits in.
3. **Far away regions.** A server in India waiting on a counter in the US pays network delay on every create.
4. **Failover.** If the machine that "knows the next number" dies mid-switch, two sides may reuse a range by accident.

You can give each shard its own sequence (user 1001 lives on shard A with local IDs). That works for some products. It does **not** give one global order across shards without more work.

So: one stamp is safe and slow at scale. Many stamps need a smarter rule.

---

## Option 1: UUID (random passport numbers)

A **UUID** is a long identifier, usually 128 bits. The common string looks like:

```
09c93e62-50b4-468d-bf8a-c07e1040bfb2
```

**Everyday comparison:** each phone or server invents a passport number by rolling many dice. Nobody calls a central office. The chance two people roll the same full number is tiny for normal product scale.

**Why people like it**

- Any machine can mint an ID offline: phone, laptop, cloud pod.
- No shared counter. No single machine to overload.
- Horizontal scale is free.

**Why interviews and databases often push back**

- 128 bits, not 64. Wider keys and more storage than a simple integer.
- Random UUIDs (version 4) do not grow with time. The database index receives inserts in random order, which can slow pages and waste cache.
- The dashed string is ugly if you wanted "numbers only."

There is a newer style (**UUIDv7**) that packs time into the front so IDs sort roughly by creation time. You still pay 128 bits.

**When UUID wins:** client-generated IDs, offline apps, or teams happy with 128-bit keys.

---

## Option 2: Ticket server (one bakery ticket machine)

A **ticket server** is a small system whose only job is to hand out the next number. Flickr described a famous version years ago: a tiny database runs auto-increment and returns the new id. Every app asks: "What is next?"

**Everyday comparison:** the paper ticket machine at a bakery. Everyone pulls a ticket from the same machine. Numbers stay unique. If the machine jams, the line stops.

**Why people like it**

- Short, simple numeric IDs.
- Easy to explain and debug.
- Fine for small and medium write rates.

**Why it hurts at high load**

- Every create depends on that one machine (or a small pair). If tickets stop, creates stop.
- Two ticket machines need a split rule (odds and evens, or separate ranges) so they never collide. That reintroduces config risk.
- Throughput is basically "how hard can one counter push?"

**Common upgrade: hand out a block of tickets.** Instead of asking for one number per order, each app server gets a range, say 5000 to 5999. It burns that range locally. The ticket machine is called rarely. That is closer to how many production systems allocate IDs.

Still, someone central owns the ranges. That is the trade-off.

---

## Option 3: Snowflake (receipt: time + machine + counter)

**Snowflake** (the Twitter-style design, not the cloud warehouse) builds a 64-bit ID from three ideas:

1. **When** was it made (timestamp).
2. **Which machine** made it (worker or machine id).
3. **Which count** on that machine in that tiny time slice (sequence).

**Everyday comparison:** a store receipt.

- Date and time are printed first.
- Register number is printed next (register 3 vs register 7).
- Sequence on that register for that moment finishes the line.

Two registers can both print "item 4" at the same second. The receipt is still unique because the register number differs. One register printing two items in the same millisecond bumps the local counter.

```
Bit Layout: [1-bit Unused] [41-bit Timestamp] [5-bit Datacenter] [5-bit Worker] [12-bit Sequence]
```

| Bit Offset | Field Name | Width | Purpose |
| --- | --- | --- | --- |
| Bit 63 | Unused sign bit | 1 bit | Fixed to `0` to keep the integer positive |
| Bits 62-22 | Timestamp | 41 bits | Milliseconds elapsed since custom epoch (up to 69 years) |
| Bits 21-17 | Datacenter ID | 5 bits | Datacenter or region index (0-31) |
| Bits 16-12 | Worker ID | 5 bits | Worker / machine instance ID (0-31) |
| Bits 11-0 | Sequence | 12 bits | Incrementing counter per millisecond (0-4095) |

| Piece | Bits | Role in plain English |
| --- | --- | --- |
| Unused / sign | 1 | Keep the number positive |
| Timestamp | 41 | Milliseconds since a chosen start date (your product launch, not necessarily 1970) |
| Datacenter | 5 | Which building or region (up to 32) |
| Worker | 5 | Which machine in that building (up to 32) |
| Sequence | 12 | Counter inside that millisecond on that worker (up to 4096) |

Some teams merge datacenter and worker into one 10-bit machine id. The idea stays the same: **time + machine number + counter**.

### Why this matches the usual goals

- Fits in 64 bits.
- Unique if worker ids stay unique and the sequence never wraps in the same millisecond on the same worker.
- Roughly time-ordered: later timestamps make larger IDs (if clocks are honest).
- High throughput: thousands of IDs per millisecond per machine in theory. Real limits are usually CPU and how you serve the API.

### Capacity numbers worth knowing

- 41 bits of milliseconds is about **69 years** from your chosen start date. Pick a start near launch so you do not waste empty decades.
- 12 bits of sequence is **4096** IDs per worker per millisecond. If you need more, wait for the next millisecond.
- Worker ids must not collide. Two processes sharing worker "7" can mint the same ID. Assign workers carefully (config, lease from a coordinator, or a fixed map).

### Tiny encode sketch (one process)

```python
import time
import threading

class Snowflake:
    def __init__(self, datacenter_id: int, worker_id: int, epoch_ms: int):
        assert 0 <= datacenter_id < 32
        assert 0 <= worker_id < 32
        self.datacenter_id = datacenter_id
        self.worker_id = worker_id
        self.epoch_ms = epoch_ms
        self.sequence = 0
        self.last_ms = -1
        self.lock = threading.Lock()

    def next_id(self) -> int:
        with self.lock:
            now = int(time.time() * 1000)
            if now < self.last_ms:
                raise RuntimeError("clock went backwards")
            if now == self.last_ms:
                self.sequence = (self.sequence + 1) & 0xFFF
                if self.sequence == 0:
                    while now <= self.last_ms:
                        now = int(time.time() * 1000)
            else:
                self.sequence = 0
            self.last_ms = now
            ts = now - self.epoch_ms
            return (
                (ts << 22)
                | (self.datacenter_id << 17)
                | (self.worker_id << 12)
                | self.sequence
            )
```

Notes:

- Custom start time makes the 41-bit field last longer from day one.
- The lock protects the sequence inside one process. Two processes on one box need two worker ids.
- On sequence overflow, wait. Do not wrap and reuse numbers in the same millisecond.

---

## Clock problems in plain English

Snowflake trusts time. Clocks on real computers sometimes misbehave.

### Clocks that jump backward

Servers sync time with NTP. Sometimes the clock is nudged gently (good). Sometimes it is shoved backward by a full step (dangerous for ID generators).

Imagine the receipt printer thinks it is 3:00:10, prints a batch, then the wall clock is forced back to 3:00:05. If you print again with the same register number and the same local counter starting from zero, you reprint numbers you already used. That is a **collision**.

Safe habits:

1. **Refuse to mint** until the clock is past the last time you used.
2. **Sleep a few milliseconds** if you are only slightly behind.
3. Track a **logical last time**: if the wall clock goes a little backward, keep using the last known time and burn sequence; if sequence runs out, wait.
4. Monotonic clocks (timers that only go forward on one machine) help internal pacing, but the timestamp field still needs a shared idea of wall time so IDs sort across machines.

### Freezes and restarts

A process can pause (garbage collection, VM pause) and wake later. On restart, do not reuse an old (worker, millisecond, sequence) triple. If you store a high-water mark per worker, wait until current time is past that mark.

### Different cities, different clocks

IDs are ordered by the clocks that made them. Region A might be a few milliseconds off from region B. An event that happened first in B might still get a larger ID if B's clock is ahead. For strict global order you need extra tools. For most products, "mostly ordered" is enough. Say that honestly.

### Ops hygiene

- Run time sync (chrony or ntpd) on every ID worker.
- Alert on large clock offsets and on sudden steps.
- Do not hand-set the clock on a live generator.
- Some teams generate IDs only on a small set of well-watched machines.

---

## Where the generator lives

| Placement | Strength | Weakness |
| --- | --- | --- |
| Library inside each service | Fastest, no extra hop | Every process needs a unique worker id |
| Local sidecar | One implementation, still nearby | Tied to the pod lifecycle |
| Central mint API | Easy to audit | Network delay and shared outage risk |
| Central ranges, local burn | Often the practical middle | Must not lose ranges unsafely |

High write rates usually prefer **in-process Snowflake with careful worker ids**. Low-rate admin objects are fine with a ticket server or a plain database sequence.

---

## Security notes (short)

- Sequential or time-sortable IDs leak volume and rough timing. Do not treat them as secret tokens. Always authorize with real auth.
- Sometimes you keep Snowflake ids internal and show users a separate random public id.
- Timestamp-heavy ids can hint when something was created. Treat logs and URLs with that in mind.

---

## Side-by-side comparison

| Approach | Everyday picture | Bits | Time order | Coordination | Main failure |
| --- | --- | --- | --- | --- | --- |
| DB auto-increment | One roll of checks | 64 | Yes on one primary | One database | That database is a bottleneck |
| UUID v4 | Random passport numbers | 128 | No | None | Random index inserts |
| UUID v7 | Passport with date stamped first | 128 | Yes | None (local clock) | Wider keys |
| Ticket server | Bakery ticket machine | 64 | Yes | Central tickets | Machine jams, line stops |
| Snowflake | Receipt: time + register + counter | 64 | Roughly yes | Unique worker ids | Clock jumps, shared worker id |

---

## Recap you can tell a friend

Imagine every new order needs a unique ticket number.

- **One database counter** is one stamp at one branch. Safe until many branches stamp at once, or until everyone lines up at the same stamp.
- **UUID** is rolling dice for a long passport number. No central office. The number is big and often random, so database indexes can get messy.
- **Ticket server** is the bakery machine. Everyone pulls from one place. Numbers stay neat. If the machine dies, nobody gets a number unless you hand out blocks of tickets in advance.
- **Snowflake** is a store receipt: **time + machine number + local counter**. Machines work in parallel without calling home every time. You must give each machine its own number, and you must not trust a clock that jumps backward without safeguards.

If you remember only two production bugs: two processes sharing the same worker id, and time going backward while the sequence resets. The bit layout is the easy part. Guarding identity and time is the real job.

---

## A design you can defend (short)

**Wanted:** 64-bit numbers, unique product-wide, roughly time-ordered, tens of thousands of IDs per second, multi-AZ.

**Proposal:**

1. Snowflake-style bits: unused + timestamp + worker + sequence.
2. Custom epoch = service launch day UTC.
3. Worker ids leased or assigned so no two live generators share one.
4. Mint inside the process, not over a remote call on every insert.
5. On clock rollback: stop minting and alert.
6. Store as `BIGINT`. For public JSON APIs, consider decimal strings so JavaScript clients do not lose precision above `2^53 - 1`.

**When to pick something else out loud:** UUID if 128 bits are fine and simplicity wins. Ticket server if write rate is low and short integers matter. Snowflake when you want compact, sortable, high-rate IDs and will invest in worker identity and clock discipline.

---

## Closing

Unique IDs look like a one-line feature until many writers share the product. **UUID** removes coordination and pays with width and (for random versions) index locality. **Ticket servers** keep short integers and reintroduce a central choke unless you allocate ranges. **Snowflake** packs time, machine identity, and a per-tick counter into 64 bits, like a receipt that never reprints the same line on the same register at the same moment.

Protect the clock and the worker id. Everything else is arithmetic.