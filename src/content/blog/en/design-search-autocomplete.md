---
title: "Design Search Autocomplete: Tries With Precomputed Top-K, Two Paths, and a 100 ms Budget"
description: "How typeahead works at scale: the per-keystroke latency budget, a trie that stores the top suggestions at every node, the offline pipeline that builds it from search logs with time decay and blocklists, sharding and CDN caching, client debouncing, and the failure modes that embarrass companies."
date: "2025-11-14"
tags: [System Design & Architecture]
coverImage: /assets/images/design-search-autocomplete.webp
previewImage: /assets/images/design-search-autocomplete.webp
---

> **TL;DR**
> * **The Problem:** Return the ten best completions for whatever prefix the user has typed, on every keystroke, fast enough that suggestions feel instant (well under 100 ms end to end), for tens of thousands of requests per second, without ever suggesting something offensive.
> * **The Design:** Split the system into two paths. The query path is a pure in-memory lookup in a trie where every node already stores its top-k completions, fronted by CDN and client caches. The data path aggregates search logs offline with time decay, filters them, builds new trie snapshots, and ships them to servers.
> * **The Result:** A lookup costs one walk of `len(prefix)` steps and returns a list that was computed hours ago. All the expensive work, ranking, filtering and deduplication, happens offline where it can be slow and careful.

Autocomplete is one of the few features where latency is the product. A search box that suggests "dinner recipes" 300 ms after you typed "din" feels broken, even if the suggestions are good. The design follows from that one constraint: **nothing expensive may happen while the user is typing.**

---

## Requirements and Numbers

**Functional:** given a prefix, return up to 10 suggestions ranked by popularity (optionally personalized and localized); update suggestions as search behavior changes; never suggest blocked content.

**Non-functional:** p99 under about 50 ms server-side so the end-to-end experience stays under 100 ms; highly available (if autocomplete fails, search must still work); results can be hours stale.

| Assumption | Value | Derived |
| --- | --- | --- |
| Daily active searchers | 10M | |
| Searches per user per day | 10 | 100M searches/day |
| Requests per search after debouncing | ~6 | ~600M requests/day, ~7k/s average, ~20k/s peak |
| Distinct queries kept | ~100M | After dropping the long tail seen only once or twice |
| Suggestions per node | 10 | Memory grows with nodes x k, which is why k stays small |

The requests per search number is where client design matters. Without debouncing, a 15-character query is 15 requests.

---

## Two Paths

![Search autocomplete architecture: on the query path the search box calls a CDN cache per prefix, which on a miss calls the autocomplete service that looks up in-memory trie shards holding top-10 lists; on the data path search logs feed an aggregator with counts and decay, a trie builder with blocklist filtering writes snapshots to object storage, and servers load new versions](/assets/images/hld/design-autocomplete-architecture.webp)

**Query path (milliseconds)**

* **Search Box.** Debounces keystrokes (about 100 ms), caches responses per prefix locally, and cancels in-flight requests when a newer prefix is typed.
* **CDN cache per prefix.** Short prefixes ("a", "th", "how") are requested by millions of users. Caching responses at the edge for a few minutes absorbs a large share of traffic before it reaches your servers. Personalized results cannot be cached this way, which is one reason personalization is usually a thin reranking layer on top.
* **Autocomplete Service.** Stateless request handling: normalize the prefix (lowercase, trim, Unicode normalization), route to the right trie shard, return the stored list.
* **Trie shards in RAM.** The whole index lives in memory. Every node stores its precomputed top 10.

**Data path (hours)**

* **Search Logs.** Every submitted search (not every keystroke) is logged with time, locale and whether the user clicked a result.
* **Aggregator (counts + decay).** A batch or streaming job computes a score per query, weighting recent searches more heavily, so last week's breaking news fades and a new product name rises.
* **Trie Builder + blocklist filter.** Drops blocked terms, personal data and spam, then builds the trie with top-k lists per node.
* **Snapshots (object store).** Versioned trie files. Servers load a new version in the background and swap atomically; a bad build can be rolled back by pointing at the previous version.

The split is the whole design. The query path never computes anything; the data path never serves anything.

---

## The Trie, With Top-K at Every Node

![Trie for the prefix d, di, din and dis, where each node stores its own precomputed top-3 suggestions, so a lookup for din walks three nodes and returns dinner recipes, dinosaur and dining table without scanning the subtree](/assets/images/hld/design-autocomplete-trie.webp)

A plain trie finds all words with a prefix by walking to the prefix node and then scanning everything below it. For the prefix "d," that subtree is enormous. The fix is to **store the answer at the node**: when building, push each query's score into the top-k list of every node along its path. A lookup is then a walk of `len(prefix)` steps followed by returning a list.

```python
import heapq

class Node:
    __slots__ = ("children", "top")
    def __init__(self):
        self.children, self.top = {}, []

def build(counts: dict[str, int], k: int = 10) -> Node:
    root = Node()
    for query, score in counts.items():
        node = root
        for ch in query:
            node = node.children.setdefault(ch, Node())
            heapq.heappush(node.top, (score, query))
            if len(node.top) > k:
                heapq.heappop(node.top)          # keep only the k best
    for node in _walk(root):                      # freeze: best first
        node.top = [q for _, q in sorted(node.top, reverse=True)]
    return root

def _walk(node):
    yield node
    for child in node.children.values():
        yield from _walk(child)

def suggest(root: Node, prefix: str) -> list[str]:
    node = root
    for ch in prefix.lower():
        node = node.children.get(ch)
        if node is None:
            return []
    return node.top
```

With scores `discord: 2000, dictionary: 1200, dinner recipes: 900, disney plus: 850, discount codes: 800, dinosaur: 700, dining table: 650` and k = 3, `suggest("din")` returns `["dinner recipes", "dinosaur", "dining table"]`, matching the diagram. I ran it to check.

**Memory trade-off.** Storing k suggestions at every node multiplies memory, so production systems store query IDs instead of strings, cap the depth at which lists are stored (deep prefixes are rare and can fall back to a subtree scan), and compress the structure. Lucene and Elasticsearch's completion suggester use finite state transducers (FSTs) for exactly this reason: they share common prefixes and suffixes and fit large vocabularies in memory.

---

## Ranking and Freshness

| Signal | Effect |
| --- | --- |
| Query frequency with time decay | Base popularity that still lets new trends rise |
| Click-through on results | Queries that lead nowhere are demoted |
| Locale and language | "football" means different things in different countries |
| Personal history | A light rerank of the global list, done in the service, not in the trie |
| Trending detection | A small streaming side path that injects rising queries between full rebuilds |

A full rebuild every few hours handles most freshness needs. For breaking events, a streaming job can compute a small "trending" trie that the service merges with the main result, so a sudden spike appears in minutes rather than hours.

---

## Scaling the Query Path

* **Replicate before you shard.** A filtered trie for one language often fits in tens of gigabytes of RAM. Replicating the whole trie to every server is simpler than sharding and gives each server the complete answer.
* **Shard by prefix when it no longer fits.** Partition on the first character or two, with smarter splits for skewed letters (far more queries start with "s" than with "x"). The service routes by the normalized prefix.
* **Cache aggressively at the edge.** Short prefixes are the hottest and least personal; give them CDN TTLs measured in minutes.
* **Fail open to nothing.** If autocomplete is down, return an empty list quickly. The search box still works; users just type a bit more.

---

## Safety Is Not Optional

Autocomplete puts words in users' mouths. Every major search company has been embarrassed by a suggestion that completed a person's name with an accusation or a group's name with a slur.

* Maintain blocklists for hate, violence, sexual content and self-harm, applied in the builder and rechecked at serve time for emergency additions.
* Strip personal data such as phone numbers and email addresses from logs before aggregation.
* Apply extra caution to queries about people; many products do not suggest completions about named individuals in sensitive contexts.
* Require a minimum number of distinct users before a query can be suggested, so one person or a bot cannot inject suggestions.
* Provide an emergency kill switch per suggestion that takes effect in minutes, not at the next rebuild.

---

## Production Checklist

- [ ] Client debounce, local prefix cache and request cancellation
- [ ] Prefix normalization identical in builder and service
- [ ] Top-k stored per node; memory measured per build
- [ ] Builds versioned, validated (size, sample queries, blocklist check) and atomically swapped
- [ ] Rollback to the previous snapshot in one step
- [ ] CDN caching for short, non-personalized prefixes
- [ ] Minimum distinct-user threshold and blocklists, plus an emergency removal path
- [ ] Fail fast with an empty list; search must not depend on autocomplete
- [ ] Dashboards: p99 latency, cache hit rates (client, CDN, service), suggestion click-through, build age

---

## The Leftover

The best autocomplete is the one users never think about. They type three letters, the thing they wanted is already there, and they press enter.

Behind that moment is a pipeline that ran hours ago, a blocklist someone updated at midnight, and a snapshot that loaded without a sound. The user saw ten words. The system remembered millions of other people asking the same question first.

---

## Sources

* [Elasticsearch: completion suggester (FST-based)](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html#completion-suggester)
* [Apache Lucene: FST package documentation](https://lucene.apache.org/core/9_0_0/core/org/apache/lucene/util/fst/package-summary.html)
* [Google Search Help: how Google autocomplete works and its policies](https://support.google.com/websearch/answer/7368877)
* [MDN: debouncing and throttling user input (glossary)](https://developer.mozilla.org/en-US/docs/Glossary/Debounce)
* Related in this series: [Design a Web Crawler](/blog/en/design-web-crawler), [Back-of-the-Envelope Estimation](/blog/en/design-back-of-envelope-estimation), [Redis caching patterns](/blog/en/redis-caching-patterns)
