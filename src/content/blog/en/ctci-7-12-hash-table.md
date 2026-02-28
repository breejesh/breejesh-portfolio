---
title: "Hash Table: Chaining with LinkedList Buckets (Java)"
description: "CTCI-style problem 7.12 for beginners: build a simple HashMap with an array of linked-list buckets. put, get, and remove with collision chaining in Java."
date: "2026-02-28"
tags: [Algorithms]
coverImage: /assets/images/ctci-7-12-hash-table.webp
previewImage: /assets/images/ctci-7-12-hash-table.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 7.12 for beginners: build a simple HashMap with an array of linked-list buckets. put, get, and remove with collision chaining in Java.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

A map that answers **get(key)** in roughly constant time is a **hash table**. You hash the key to a bucket index, then look only in that bucket. When two keys land in the same slot, you need a collision plan. The classic teaching plan is **chaining**: each bucket is a linked list of key-value cells.

This post is original teaching for beginners in **Java**. Same problem family as classic OOD interview questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 7 ends here with a small, sharp data structure you can code on a whiteboard.

---

## 1. Everyday analogy

Think of a wall of **mailboxes**, numbered `0` to `capacity - 1`.

* Each letter has an address. You run a simple rule on the address and get a mailbox number.
* You drop the letter in that box.
* Sometimes two letters hash to the same number. That box holds a **stack of letters** (a chain), not one letter only.
* To find mail for Alice, hash her address, open that box, and scan the small stack until you see her name.
* To remove a letter, open the same box and pull that letter out of the stack.

The wall is the array. Each stack is a linked list. The rule is your hash function. You never search the whole wall; you only scan one short chain.

You are not building `java.util.HashMap` with tree bins and resize heuristics. You are modeling the idea with clear classes.

---

## 2. Plain problem statement

**Goal:** design and implement a simple **HashTable / HashMap** that uses **chaining** (linked-list buckets) for collisions.

**Core operations:**

* `put(key, value)`: insert or update
* `get(key)`: return the value, or null / empty if missing
* `remove(key)`: delete the mapping if present

**Clarify in the interview:**

* Key and value types? Generics `K` and `V` are clean. `null` keys? Usually forbid or special-case; pick one and say it.
* What does `put` do if the key already exists? Update the value (map semantics), do not create a second cell.
* Return type of `get` / `remove`? Value or boolean is fine if you state it.
* Fixed capacity or resize when load is high? Fixed is enough for a first sketch. Mention load factor as a follow-up.
* Thread safety? Single-threaded unless asked.

**Shape of the type hierarchy:**

```
HashMap<K, V>
  └── buckets: LinkedList<Cell<K, V>>[]   (or List of lists)
        └── Cell: key, value
```

Some people name the node `Entry`. Same idea: one object per mapping, hanging in a chain under one index.

---

## 3. Think first

### Why not a plain array of values

Keys are not small consecutive integers. You cannot index by `key` directly for strings or arbitrary objects. Hashing maps any key into `0 .. capacity - 1`.

### Collision is normal

A good hash spreads keys, but two different keys can still produce the same index. That is a **collision**, not a bug.

Two standard fixes:

| Strategy | Idea | Interview note |
| --- | --- | --- |
| **Chaining** | Each bucket holds a list of cells | Simple to code and explain |
| **Open addressing** | Probe other slots in the array | Fewer pointers; harder delete |

This problem asks for **chaining**. Stick to lists unless the interviewer steers you elsewhere.

### Hash to bucket index

```
index = hashCode(key) % capacity
```

In Java, `hashCode()` can be negative. A negative remainder from `%` makes a bad array index. Fix it:

```
index = (hashCode(key) & 0x7fffffff) % capacity
```

or

```
index = Math.floorMod(hashCode(key), capacity)
```

Either is fine. Say why you normalize.

### put / get / remove walk the same chain

1. Compute `index` from the key.
2. Walk the linked list at `buckets[index]`.
3. Compare keys with `equals` (not `==` for objects).
4. **put:** if key found, overwrite value; else append a new cell.
5. **get:** if key found, return value; else return null.
6. **remove:** if key found, unlink that cell; else no-op.

Average time is O(1 + chain length). Worst case is O(n) if everything piles into one bucket (bad hash or adversarial keys).

### Capacity and load

`load factor ≈ n / capacity`. When it grows past something like 0.75, production maps **resize** (new array, rehash all keys). For the interview sketch, fixed capacity is OK if you name resize as the next step.

### Design sketch on the whiteboard

1. Draw an array of 4 empty buckets.
2. `put("apple", 1)` hashes to index 1: chain is `apple→1`.
3. `put("apricot", 2)` also hashes to 1: chain is `apple→1` then `apricot→2`.
4. `get("apricot")` walks index 1, skips apple, returns 2.
5. `remove("apple")` unlinks the first cell; apricot stays.

---

## 4. Java solution

Teaching version with generics, fixed capacity, and singly linked cells. `LinkedList` from the JDK works too; an explicit `Cell` next pointer makes the chain obvious on a whiteboard.

```java
/**
 * Simple hash map with chaining.
 * Each bucket is a singly linked list of Cell nodes.
 */
public class ChainedHashMap<K, V> {
    private static class Cell<K, V> {
        final K key;
        V value;
        Cell<K, V> next;

        Cell(K key, V value, Cell<K, V> next) {
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    private final Cell<K, V>[] buckets;
    private int size;

    @SuppressWarnings("unchecked")
    public ChainedHashMap(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("capacity must be positive");
        }
        // Generic array: allocate as Object[], cast once.
        buckets = (Cell<K, V>[]) new Cell[capacity];
        size = 0;
    }

    public ChainedHashMap() {
        this(16);
    }

    private int indexFor(K key) {
        int h = key.hashCode();
        // clear sign bit so % never yields a negative index
        return (h & 0x7fffffff) % buckets.length;
    }

    private Cell<K, V> findCell(K key) {
        int i = indexFor(key);
        for (Cell<K, V> c = buckets[i]; c != null; c = c.next) {
            if (c.key.equals(key)) {
                return c;
            }
        }
        return null;
    }

    /** Insert or update. Null keys rejected for simplicity. */
    public void put(K key, V value) {
        if (key == null) {
            throw new IllegalArgumentException("null key not supported");
        }
        Cell<K, V> existing = findCell(key);
        if (existing != null) {
            existing.value = value;
            return;
        }
        int i = indexFor(key);
        // insert at head: O(1), order inside the bucket does not matter for map ops
        buckets[i] = new Cell<>(key, value, buckets[i]);
        size++;
    }

    public V get(K key) {
        if (key == null) {
            return null;
        }
        Cell<K, V> c = findCell(key);
        return c == null ? null : c.value;
    }

    /**
     * True when the key is present. Needed if null values are allowed,
     * because get(key) == null is then ambiguous.
     */
    public boolean containsKey(K key) {
        if (key == null) {
            return false;
        }
        return findCell(key) != null;
    }

    /** Remove mapping if present. Returns true when a cell was removed. */
    public boolean remove(K key) {
        if (key == null) {
            return false;
        }
        int i = indexFor(key);
        Cell<K, V> prev = null;
        Cell<K, V> cur = buckets[i];
        while (cur != null) {
            if (cur.key.equals(key)) {
                if (prev == null) {
                    buckets[i] = cur.next;
                } else {
                    prev.next = cur.next;
                }
                size--;
                return true;
            }
            prev = cur;
            cur = cur.next;
        }
        return false;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }
}
```

This sketch allows null **values**. If you want simpler interview code, ban null values and treat `get == null` as missing.

Demo walkthrough:

```java
public class HashTableDemo {
    public static void main(String[] args) {
        ChainedHashMap<String, Integer> map = new ChainedHashMap<>(4);

        map.put("apple", 1);
        map.put("banana", 2);
        map.put("apricot", 3); // may collide with apple depending on hash

        System.out.println(map.get("apple"));    // 1
        System.out.println(map.get("banana"));   // 2
        System.out.println(map.get("missing"));  // null

        map.put("apple", 10); // update
        System.out.println(map.get("apple"));    // 10
        System.out.println(map.size());          // 3

        System.out.println(map.remove("banana")); // true
        System.out.println(map.get("banana"));    // null
        System.out.println(map.size());           // 2
    }
}
```

| Step | Call | Effect |
| --- | --- | --- |
| start | capacity 4 | empty buckets |
| 1 | `put("apple", 1)` | new cell in `indexFor(apple)` |
| 2 | `put("banana", 2)` | new cell (same or other bucket) |
| 3 | `put("apricot", 3)` | chain grows if collision |
| 4 | `put("apple", 10)` | same cell, value overwritten, size stays 3 |
| 5 | `remove("banana")` | unlink cell, size 2 |

If the interviewer wants JDK lists instead of a hand-rolled `next`:

```java
// sketch: buckets as List<Cell>[]
List<Cell<K, V>> bucket = buckets[i];
if (bucket == null) {
    bucket = new LinkedList<>();
    buckets[i] = bucket;
}
for (Cell<K, V> c : bucket) {
    if (c.key.equals(key)) {
        c.value = value;
        return;
    }
}
bucket.add(new Cell<>(key, value, null));
```

Same asymptotics. Explicit `next` is nicer when you must show remove with prev/cur pointers.

---

## 5. Complexity table

| Operation | Average time | Worst time | Extra space | Notes |
| --- | --- | --- | --- | --- |
| `put` (new key) | O(1 + α) | O(n) | O(1) | α ≈ load factor / chain length |
| `put` (update) | O(1 + α) | O(n) | O(1) | walk until key equals |
| `get` | O(1 + α) | O(n) | O(1) | same walk |
| `remove` | O(1 + α) | O(n) | O(1) | unlink with prev pointer |
| Construction | O(capacity) | O(capacity) | O(capacity) | empty array of bucket heads |
| Storage for n pairs | - | - | O(n + capacity) | cells + bucket array |

Interviewers care that you named chaining, used `hash` then `equals`, and handled update vs insert. Resize is a strong follow-up, not required for a first pass.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Null key:** throw or support a dedicated slot. Do not call `key.hashCode()` on null.
* **Null value:** allowed in this sketch. Then `get == null` is ambiguous; use `containsKey` or `Optional`.
* **Duplicate put:** must update, not grow size twice.
* **Remove head of chain:** `buckets[i] = cur.next`, not only `prev.next = ...`.
* **Remove missing key:** return false / null; do not decrement size.
* **Negative hashCode:** normalize before `%` or you get `ArrayIndexOutOfBoundsException`.
* **capacity = 1:** every key collides; map still correct, just a single long list.
* **Bad `equals` / `hashCode` contract** on custom keys: equal keys must share hashCode or lookups break.
* **Iterator / concurrent mutation:** out of scope unless asked.

Common mistakes:

1. **Using `==` for key compare.** Strings and boxed types need `equals`.
2. **Forgetting update path in `put`.** Two cells with the same key; `get` returns the first and size lies.
3. **Broken remove on the first node.** Head pointer never updates.
4. **`hash % capacity` with negative hash.** Crash on index.
5. **Building open addressing by accident** (linear probe) after saying "chaining."
6. **Resizing without rehashing.** Copying list heads to a larger array keeps wrong indices.

Minimal smoke idea:

```java
ChainedHashMap<String, Integer> m = new ChainedHashMap<>(2);
m.put("a", 1);
m.put("b", 2);
m.put("a", 3);
assert m.get("a") == 3;
assert m.size() == 2;
assert m.remove("b");
assert m.get("b") == null;
assert m.size() == 1;
assert !m.remove("b");
```

---

## 7. Explain to a friend recap

Hash table with chaining, interview version:

1. Array of buckets. Each bucket is a **linked list** of key-value cells.
2. `index = normalize(hashCode(key)) % capacity`.
3. **put:** walk the chain; update if key exists, else add a cell (head insert is fine).
4. **get:** walk the chain; return value or null.
5. **remove:** walk with prev/cur; unlink and decrement size.
6. Average O(1) when chains stay short. Worst O(n) if everything collides.
7. Follow-ups: resize at load factor, null policy, open addressing, thread safety.

If you can draw four buckets, hang two colliding keys on one list, and write put/get/remove without off-by-one remove bugs, you own problem 7.12. Chapter 7 OOD closes on a structure you will reuse everywhere.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [File System](/blog/en/ctci-7-11-file-system)
* Next: [Triple Step](/blog/en/ctci-8-1-triple-step)