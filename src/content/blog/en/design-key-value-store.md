---
title: "Design a Distributed Key-Value Store: Partitioning, Quorums, Hinted Handoff, and LSM Storage"
description: "A Dynamo-style key-value store from the ground up: partitioning on a hash ring, N/W/R quorum math and what it does not guarantee, conflict resolution, hinted handoff and Merkle-tree repair, gossip membership, and the LSM storage engine underneath."
date: "2025-10-28"
tags: [System Design & Architecture, Backend & Databases]
coverImage: /assets/images/design-key-value-store.webp
previewImage: /assets/images/design-key-value-store.webp
---

> **TL;DR**
> * **The Problem:** Store billions of small values behind `put(key, value)` and `get(key)`, across many machines, staying writable when some of them fail, with predictable single-digit-millisecond latency.
> * **The Design:** Partition keys on a consistent hash ring, replicate each key to N nodes, and let clients choose W and R per request. Accept writes during failures with sloppy quorums and hinted handoff, repair drift with read repair and Merkle trees, detect failures with gossip, and store data on each node in an LSM tree.
> * **The Result:** A system that trades some consistency for availability in a controlled, tunable way. This is the design behind Amazon's Dynamo paper, Cassandra and Riak, and the mental model behind DynamoDB.

A key-value store has the smallest API in this whole series: two verbs. That is exactly why it is a good interview question. With nothing to hide behind, every decision is about distribution: where data lives, how many copies exist, what happens when a copy is missing, and what "the current value" even means when two machines disagree.

This post builds a Dynamo-style store, because that design forces you to confront every one of those questions explicitly.

---

## Requirements

* **API:** `put(key, value)`, `get(key)`, optionally `delete(key)`. Values up to around 1 MB; most are under 10 KB.
* **Scale:** tens of terabytes, hundreds of thousands of operations per second.
* **Availability first:** writes should succeed even when a few nodes or a whole availability zone are unreachable. Shopping carts and session stores are the classic examples: losing a write is worse than briefly reading an old value.
* **Tunable consistency:** some callers need read-your-writes; others will happily take a slightly stale value for lower latency.
* **Operability:** add and remove nodes without downtime; recover from disk loss automatically.

**Capacity sketch:** 20 TB of data with replication factor 3 is 60 TB on disk. With nodes holding about 2 TB each, and keeping them under 60% full for compaction headroom, that is roughly 50 nodes. If each node serves 10,000 operations per second comfortably, the cluster serves around 500,000 operations per second before any caching.

---

## CAP, Said Precisely

The CAP theorem says that during a network **partition**, a system must choose between **consistency** (every read sees the latest write) and **availability** (every request to a live node gets a non-error response). Without a partition, you can have both.

PACELC adds the part people forget: **else**, when there is no partition, you still trade **latency** against **consistency**, because waiting for more replicas takes longer.

| System style | During a partition | Normally | Examples |
| --- | --- | --- | --- |
| CP | Refuses requests on the minority side | Consistent, higher latency | etcd, ZooKeeper, Spanner |
| AP | Keeps accepting reads and writes everywhere | Tunable; often eventually consistent | Dynamo, Cassandra, Riak |

This post builds the AP flavor, with knobs that let callers move toward consistency when they need it.

---

## Partitioning and Replication

Keys are placed on a consistent hash ring with virtual nodes (see the [consistent hashing post](/blog/en/design-consistent-hashing) in this series). Each key's **preference list** is the first N distinct physical nodes clockwise from its position, spread across availability zones. With N = 3, every key has three replicas, and losing any single node or zone loses no data.

Any node can act as **coordinator** for a request. Clients either send requests to any node (which forwards as needed) or use a partition-aware client that sends directly to a replica, saving a hop.

---

## Quorums: The Knob Everyone Talks About

For each request, the coordinator sends the operation to all N replicas and waits for a subset:

* **W** = how many replicas must acknowledge a write before it succeeds.
* **R** = how many replicas must respond to a read before it returns.

If **R + W > N**, every read quorum overlaps every write quorum in at least one replica, so a read will see at least one copy of the latest successful write.

| N, W, R | Behavior | Use when |
| --- | --- | --- |
| 3, 1, 1 | Fastest, weakest; reads can easily miss recent writes | Caching-like data, metrics |
| 3, 2, 2 | Overlapping quorums; tolerates one slow or dead replica on each path | The common default |
| 3, 3, 1 | Fast reads, writes fail if any replica is down | Read-heavy data that rarely changes |
| 3, 1, 3 | Fast writes, slow reads | Write-heavy logging where reads are rare |

**What quorums do not give you.** R + W > N is not linearizability. With concurrent writes, last-write-wins timestamps and sloppy quorums (below), a read can still return an older value or a value that was later overwritten. Martin Kleppmann's *Designing Data-Intensive Applications* is the clearest explanation of these edge cases. If you need true compare-and-set semantics, you need a consensus protocol (Paxos, Raft) or a conditional write, not a bigger quorum.

---

## The Write Path When a Replica Is Down

![Dynamo-style quorum write: the client sends put to coordinator node A, which writes to replicas B and C, times out on replica D, sends a hinted write to node E, and replies ok after two acknowledgements; E replays the hint to D later; gossip handles membership](/assets/images/hld/design-kv-store-quorum.webp)

* **Client.** Sends `put(k, v)` with its chosen consistency level.
* **Node A (coordinator).** Forwards the write to the key's preference list and replies once W replicas have acknowledged. It does not wait for the slowest replica.
* **Nodes B and C (replicas 1 and 2).** Acknowledge. With W = 2, the client gets success here.
* **Node D (replica 3, down).** The write times out. In a strict quorum, the coordinator would count only B and C and move on.
* **Node E (holds hint for D).** In a **sloppy quorum**, the coordinator writes D's copy to the next healthy node on the ring, tagged with a hint saying "this belongs to D." That keeps durability at three copies during the outage.
* **Replay later.** When gossip reports D is back, E streams the hinted writes to D and deletes them. This is **hinted handoff**.
* **Gossip.** Every node exchanges membership and heartbeat state with a few random peers each second. Cassandra uses a phi accrual failure detector on top, which outputs a suspicion level rather than a binary up/down, so a slow network does not instantly mark nodes dead.

The green note states the overlap rule. The trade-off of sloppy quorums is that, for a while, the "W nodes" that acknowledged may not be the key's real home nodes, which is one of the reasons quorums alone do not guarantee strong consistency.

---

## When Replicas Disagree

Replicas drift: a node misses writes during an outage longer than the hint window, a disk is replaced, a network flaps. Three mechanisms bring them back together:

1. **Read repair.** When a read with R > 1 sees different versions, the coordinator returns the newest and writes it back to the stale replicas.
2. **Anti-entropy with Merkle trees.** Each node builds a hash tree over its key ranges. Two replicas compare root hashes and descend only into subtrees that differ, so they can find a handful of mismatched keys among billions while exchanging very little data. Cassandra runs this as `nodetool repair`.
3. **Hinted handoff**, covered above, for short outages.

**Which version wins?** You need a rule:

| Strategy | How it works | Cost |
| --- | --- | --- |
| Last write wins (LWW) | Highest timestamp wins | Simple, but concurrent writes silently lose data; depends on clock sync |
| Vector clocks | Each version carries per-node counters; concurrent versions are kept as siblings | No silent loss, but the application must merge siblings (Dynamo's shopping cart did this) |
| CRDTs | Data types whose merges are mathematically conflict-free (counters, sets, maps) | Elegant where they fit; not every data type has a natural CRDT |

Cassandra uses LWW per column. The original Dynamo used vector clocks and pushed merges to the application. DynamoDB offers conditional writes so applications can avoid conflicts instead of resolving them.

**Deletes are writes.** A delete writes a **tombstone**, a marker that says "this key was deleted at time T." Tombstones must live longer than the longest possible replica outage, or a replica that missed the delete will resurrect the value during repair. Cassandra's `gc_grace_seconds` (10 days by default) exists for exactly this reason.

---

## Inside One Node: The LSM Storage Engine

![LSM storage engine: writes append to a commit log and insert into an in-memory memtable that flushes to immutable SSTables; reads check the memtable, consult bloom filters and read only the SSTables likely to contain the key; background compaction merges SSTables and drops tombstones](/assets/images/hld/design-kv-store-lsm.webp)

Most Dynamo-style stores use a log-structured merge tree (LSM), the design behind LevelDB, RocksDB and Cassandra's storage engine.

**Write path**

1. Append the write to the **commit log** and fsync (or group-commit), so it survives a crash.
2. Insert it into the **memtable**, a sorted in-memory structure.
3. When the memtable fills, flush it to disk as an **SSTable**, an immutable sorted file. Writes never modify files in place, which makes them sequential and fast.

**Read path**

1. Check the memtable.
2. For each SSTable, consult its **bloom filter**, a compact probabilistic structure that answers "definitely not here" or "maybe here." A well-sized bloom filter skips the vast majority of files that do not contain the key.
3. Read only the SSTables that might contain it, newest first.

**Compaction** runs in the background, merging SSTables, discarding overwritten values and expired tombstones. Size-tiered compaction favors write throughput; leveled compaction favors read latency and space at the cost of more write amplification.

| | LSM tree | B-tree |
| --- | --- | --- |
| Writes | Sequential, fast | In-place page updates, random IO |
| Reads | May touch several files; bloom filters help | One tree walk |
| Space | Temporary duplication until compaction | Fragmentation over time |
| Typical engines | RocksDB, LevelDB, Cassandra | InnoDB, PostgreSQL, BoltDB |

---

## Failure Stories to Narrate

| Event | What the system does |
| --- | --- |
| One node dies for 5 minutes | Sloppy quorum writes go to the next node with hints; hinted handoff replays on recovery |
| One node's disk dies permanently | Replace the node; stream its ranges from the other replicas; Merkle repair verifies |
| An availability zone partitions away | With replicas spread across zones and W = 2, writes continue on the majority side; the minority side can still accept writes with sloppy quorums, to be reconciled later |
| Clock skew on one node | With LWW, its writes may win or lose incorrectly. Monitor clock offset and alert on it |
| A hot key | One key's replicas get overloaded; partitioning cannot fix this. Cache it or redesign the key |

---

## Knob Cheat Sheet

| Knob | Typical value | Turn it up for | Turn it down for |
| --- | --- | --- | --- |
| Replication factor N | 3 | Durability, read capacity | Storage cost |
| Write quorum W | 2 | Durability on ack | Write latency, availability |
| Read quorum R | 2 | Fresher reads | Read latency |
| Hint window | 3 hours | Longer outages covered by handoff | Disk used for hints |
| Tombstone grace period | 10 days | Safety against resurrection | Space and read cost of tombstones |

---

## Production Checklist

- [ ] Replicas spread across availability zones, not just across nodes
- [ ] Default consistency level chosen per table and documented for callers
- [ ] Conflict strategy explicit (LWW with monitored clocks, vector clocks, or CRDTs)
- [ ] Hinted handoff window and repair schedule aligned with tombstone grace period
- [ ] Regular anti-entropy repair running and monitored
- [ ] Bloom filter false-positive rate and SSTables-per-read tracked
- [ ] Compaction strategy chosen per workload; disk kept below ~60% for headroom
- [ ] Dashboards: p99 per operation and consistency level, pending hints, repair progress, dropped mutations

---

## The Leftover

A key-value store is where distributed systems stop being abstract. Two verbs, and still every hard question shows up: which copy is real, how long to wait, what to do with the node that was gone for an hour and has opinions about the past.

The best designs do not pretend those questions have one answer. They hand the caller a knob and write down, very clearly, what each setting promises and what it does not.

---

## Sources

* [DeCandia et al., "Dynamo: Amazon's Highly Available Key-value Store" (SOSP 2007)](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
* [Lakshman and Malik, "Cassandra: A Decentralized Structured Storage System"](https://www.cs.cornell.edu/projects/ladis2009/papers/lakshman-ladis2009.pdf)
* [O'Neil et al., "The Log-Structured Merge-Tree (LSM-Tree)" (1996)](https://www.cs.umb.edu/~poneil/lsmtree.pdf)
* [Apache Cassandra documentation: hints, repair and compaction](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/index.html)
* [Abadi, "Consistency Tradeoffs in Modern Distributed Database System Design" (PACELC)](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf)
* [Hayashibara et al., "The Phi Accrual Failure Detector"](https://ieeexplore.ieee.org/document/1353004)
* Related in this series: [Design Consistent Hashing](/blog/en/design-consistent-hashing), [Design a Unique ID Generator](/blog/en/design-unique-id-generator)
