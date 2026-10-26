---
title: "Design Consistent Hashing: Rings, Virtual Nodes, and Minimal Remapping"
description: "Why hash(key) % N moves about 90% of keys when one node joins, how a hash ring with virtual nodes moves only about 1/N, measured load balance at 1, 10 and 200 vnodes, replication on the ring, and when rendezvous, jump or Maglev hashing is the better tool."
date: "2026-01-13"
tags: [System Design & Architecture]
coverImage: /assets/images/design-consistent-hashing.webp
previewImage: /assets/images/design-consistent-hashing.webp
---

> **TL;DR**
> * **The Problem:** Placing keys with `hash(key) % N` works until N changes. Add an eleventh cache node to ten and about 90% of keys suddenly map somewhere else, which for a cache means a near-total miss storm on the database behind it.
> * **The Design:** Hash both keys and servers onto the same circular space. A key belongs to the first server point clockwise from it. Give each server a few hundred virtual nodes so load evens out, and walk further clockwise to pick replicas on distinct servers.
> * **The Result:** Adding or removing a node moves roughly 1/N of keys. In a measured run with 10 nodes and 200 virtual nodes each, the most loaded node carried 1.11x the average, against 2.3x with one point per node.

Most distributed systems have to answer one boring question millions of times per second: *which machine owns this key?* Caches, sharded databases, load balancers that want session affinity, and object stores all need an answer that is fast, needs no central lookup, and does not fall apart when a machine is added or dies.

Consistent hashing is the classic answer. It was introduced by Karger and colleagues in 1997 for web caching, popularized by Amazon's Dynamo paper in 2007, and today sits inside Cassandra, memcached clients, Envoy's load balancer and many more. This post explains how it works, measures what virtual nodes actually buy you, and covers the alternatives that are sometimes better.

---

## Why `hash(key) % N` Breaks

Modulo placement is perfectly balanced and perfectly fragile. A key stays on the same node after N changes to N+1 only if `h % N == h % (N+1)`, which happens for roughly 1 in N+1 keys.

I measured it with 200,000 keys:

| Change | Keys that moved |
| --- | --- |
| `% 10` to `% 11` | 90.7% |
| Consistent hash ring, 10 to 11 nodes, 200 virtual nodes each | 9.0% |

For a cache, 90% movement means 90% of reads miss at once and fall through to the database, usually at exactly the moment you added capacity because load was high. For a sharded database, it means moving 90% of your data to add one machine. Neither is acceptable.

---

## The Ring

![Hash ring with virtual nodes for servers A, B and C, keys k1, k2 and k3 assigned to the first virtual node clockwise, plus notes on replication and adding a server](/assets/images/hld/design-consistent-hashing-ring.webp)

* **Hash space.** Pick a hash function with a large output (64 bits is plenty) and treat its range as a circle: after the largest value comes zero.
* **Servers on the ring.** Each server is hashed onto the circle, in practice many times, as virtual nodes (A1, A2, A3 in the diagram).
* **Keys on the ring.** Each key is hashed onto the same circle.
* **Ownership.** A key belongs to the first virtual node found walking clockwise. `k1` lands just before `B1`, so server B owns it.
* **Joining.** A new server D places its virtual nodes on the ring. Each one takes over only the arc between itself and the previous point. Everything else stays where it was.
* **Leaving.** When a server leaves, each of its arcs is absorbed by the next point clockwise. Again, only that server's keys move.

Lookup is a binary search over the sorted list of virtual-node positions: `O(log V)` where V is the total number of virtual nodes. With 100 servers and 200 virtual nodes each, that is a search over 20,000 integers, which takes well under a microsecond.

```python
import bisect, hashlib

def h(s: str) -> int:
    return int.from_bytes(hashlib.md5(s.encode()).digest()[:8], "big")

class Ring:
    def __init__(self, nodes, vnodes=200):
        self.vnodes, self.points, self.owner = vnodes, [], {}
        for n in nodes:
            self.add(n)

    def add(self, node):
        for i in range(self.vnodes):
            p = h(f"{node}#{i}")
            bisect.insort(self.points, p)
            self.owner[p] = node

    def remove(self, node):
        self.points = [p for p in self.points if self.owner[p] != node]
        self.owner = {p: n for p, n in self.owner.items() if n != node}

    def lookup(self, key):
        i = bisect.bisect(self.points, h(key)) % len(self.points)
        return self.owner[self.points[i]]
```

MD5 here is used for distribution, not security. Any fast, well-mixed hash works; production systems often use Murmur3 or xxHash.

---

## Virtual Nodes: What They Actually Buy

With one point per server, arcs have wildly different lengths, so some servers own far more of the ring than others. Virtual nodes fix this by averaging many small arcs. Same experiment, 200,000 keys across 10 servers:

| Virtual nodes per server | Most loaded / average | Least loaded / average |
| --- | --- | --- |
| 1 | 2.30x | 0.12x |
| 10 | 1.46x | 0.69x |
| 200 | 1.11x | 0.92x |

The one-point ring is close to useless: one server carries more than twice its fair share while another sits nearly idle. At 200 virtual nodes, the spread is about ±10%.

Virtual nodes have two more benefits:

* **Weighted capacity.** A server with twice the memory gets twice the virtual nodes.
* **Smoother failure.** When a server dies, its many small arcs are absorbed by many different successors, instead of one unlucky neighbor inheriting its entire load.

The cost is memory for the ring and more metadata to move around. Cassandra historically defaulted to 256 tokens per node; version 4.0 lowered the default to 16 alongside a smarter token allocation algorithm, because very high counts made repairs and streaming more expensive. More is not free.

---

## Replication on the Ring

Dynamo-style systems use the ring to choose replicas as well. To store a key with replication factor 3, walk clockwise from the key and take the first **three distinct physical servers**, skipping additional virtual nodes of a server already chosen. The diagram's note shows this for `k1`: B owns it, then C and A hold replicas.

Two refinements matter in production:

* **Rack or zone awareness.** "Distinct servers" should really be "distinct failure domains." Three replicas in one rack are one replica during a power failure.
* **Preference lists.** The ordered list of candidates (first three healthy nodes clockwise) is what lets a coordinator route around a temporarily failed replica, which is how sloppy quorums and hinted handoff work in Dynamo and Cassandra.

---

## A Cache Cluster Built on the Ring

![Cache cluster architecture: users reach app servers with an embedded ring client, which watches membership in etcd and reads and writes cache nodes A to C, while a rebalancer copies moved arcs to joining node D](/assets/images/hld/design-consistent-hashing-cluster.webp)

* **App Server + ring client.** The ring lives in the client library (this is how ketama-style memcached clients work). No proxy hop, no central lookup on the request path.
* **etcd (membership).** The source of truth for which nodes are in the ring and their weights. Clients watch it and rebuild their ring when it changes. ZooKeeper, Consul or a gossip protocol can play the same role.
* **Cache Nodes A, B, C.** Plain key-value servers. They do not need to know about the ring at all.
* **Cache Node D (joining).** Added to membership in a "warming" state first. Clients start sending writes for its arcs while the rebalancer fills it.
* **Rebalancer.** For a cache, rebalancing is optional: misses refill naturally. For a database or anything with state you cannot regenerate, the rebalancer streams the arcs that changed owners, throttled so it does not starve live traffic.

The green note is the whole point: only about 1/N of keys move.

---

## What Consistent Hashing Does Not Solve

* **Hot keys.** If one key gets 10% of all traffic, it still lives on one server. The ring balances keys, not requests. You need replication of hot keys, request coalescing or a local near-cache.
* **Inconsistent ring views.** If half your clients have the new ring and half have the old one during a membership change, the same key is read from two places. For caches that means extra misses. For databases it means you need versioned ownership (epochs) and a handoff protocol.
* **Cascading overload.** When a node dies, its successors absorb its load. If they were already at 80%, they may fall over too. "Consistent hashing with bounded loads" (Mirrokni, Thorup and Zadimoghaddam) caps each node's load and overflows to the next node clockwise; Vimeo described adopting it for their video delivery load balancing.

---

## The Alternatives Worth Knowing

| Technique | How it works | Strength | Weakness | Seen in |
| --- | --- | --- | --- | --- |
| Hash ring with virtual nodes | Clockwise successor on a circle | Arbitrary node add/remove, natural replica lists | Needs vnodes for balance; ring metadata | Dynamo, Cassandra, ketama clients, Envoy ring hash |
| Rendezvous (highest random weight) | For each key, score every node with `hash(key, node)`, pick the highest | No ring, near-perfect balance, trivial weighted replicas (take top K) | `O(N)` per lookup | Load balancers and small clusters |
| Jump consistent hash | Arithmetic jump function mapping a key to bucket 0..N-1 | No memory, very fast, excellent balance | Nodes can only be added or removed at the end of the numbering | Sharded storage with numbered shards |
| Maglev hashing | Precomputed lookup table filled from per-backend permutations | `O(1)` lookups, very even, minimal disruption | Table rebuild on change; built for load balancers | Google Maglev, Envoy Maglev policy |

My rule of thumb: rendezvous hashing for small sets of backends (tens), a ring with virtual nodes for storage systems that need replica lists and arbitrary membership changes, jump hash when shards are numbered and only grow, and Maglev for L4 load balancers.

---

## Interview Flow

1. Start with `hash % N` and show what happens when N changes. Use the 90% number.
2. Draw the ring and explain clockwise ownership.
3. Show that adding a node moves only one arc.
4. Point out imbalance with one point per node, then introduce virtual nodes.
5. Add replication: next K distinct servers, ideally across zones.
6. Mention one limitation (hot keys) and one alternative (rendezvous or jump hash).

---

## Production Checklist

- [ ] Hash function is fast and well-distributed (Murmur3, xxHash); never Java-style `hashCode`
- [ ] Virtual node count chosen and measured (load spread under your target)
- [ ] Weights reflect real node capacity
- [ ] Membership has a single source of truth and clients watch it
- [ ] Ring changes are versioned so clients and servers can detect stale views
- [ ] Replicas chosen across distinct failure domains
- [ ] Rebalancing streams are throttled and observable
- [ ] Hot-key handling exists separately from placement
- [ ] Dashboard shows per-node key count and request rate, not just averages

---

## The Leftover

The ring is one of those ideas that feels obvious once you see it and stays useful for decades. It does one thing: when the cluster changes, it keeps most of the world where it was.

That is a modest promise. It is also the difference between adding a node at 3 a.m. to relieve pressure and adding a node at 3 a.m. that takes the database down with it.

---

## Sources

* [Karger et al., "Consistent Hashing and Random Trees" (STOC 1997)](https://dl.acm.org/doi/10.1145/258533.258660)
* [DeCandia et al., "Dynamo: Amazon's Highly Available Key-value Store" (SOSP 2007)](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
* [Lamping and Veach, "A Fast, Minimal Memory, Consistent Hash Algorithm" (jump hash, 2014)](https://arxiv.org/abs/1406.2294)
* [Eisenbud et al., "Maglev: A Fast and Reliable Software Network Load Balancer" (NSDI 2016)](https://research.google/pubs/maglev-a-fast-and-reliable-software-network-load-balancer/)
* [Mirrokni, Thorup and Zadimoghaddam, "Consistent Hashing with Bounded Loads"](https://arxiv.org/abs/1608.01350)
* [Envoy: load balancer types (ring hash and Maglev)](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/load_balancers)
* Related in this series: [Design a Key-Value Store](/blog/en/design-key-value-store), [Scale From Zero to Millions](/blog/en/design-scale-zero-to-millions)
