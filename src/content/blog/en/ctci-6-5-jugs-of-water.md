---
title: "Jugs of Water: Measure Exactly 4 Liters with 3 and 5 (Java)"
description: "CTCI-style problem 6.5 for beginners: two jugs of capacity 3 and 5 liters, measure exactly 4. Manual pour steps, Bézout identity, and optional Java BFS over jug states."
date: "2025-08-19"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-5-jugs-of-water.webp
previewImage: /assets/images/ctci-6-5-jugs-of-water.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 6.5 for beginners: two jugs of capacity 3 and 5 liters, measure exactly 4. Manual pour steps, Bézout identity, and optional Java BFS over jug states.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You have a 3-liter jug and a 5-liter jug. No other marks. An unlimited lake (or faucet) to fill from, and you can empty either jug on the ground. Can you end up with exactly **4 liters** in one of them?

This is the classic water-jug puzzle. It is also number theory in a kitchen: the amounts you can measure are multiples of `gcd(3, 5)`, which is 1, so 4 is possible. Interviews want the steps, the why, and sometimes a search program that finds them.

This post is original teaching for beginners in **Java**. Same problem family as classic jug puzzles and Die Hard-style riddles, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 6, math and logic puzzles.

---

## 1. Everyday analogy

Think of two measuring cups with no half-liter lines. One holds three cups of water, the other five. You can:

* Fill a cup all the way from the sink.
* Dump a cup all the way out.
* Pour from one into the other until the source is empty or the destination is full.

You never get a half fill "by eye." Every amount you create is a combination of full fills, full empties, and pours that stop at capacity. The puzzle is whether 4 liters shows up as the contents of one jug after a short sequence of those moves.

---

## 2. Plain problem statement

**Given:**

* Jug A capacity: 3 liters.
* Jug B capacity: 5 liters.
* Unlimited water source and unlimited empty space (you may empty either jug completely).

**Allowed operations:**

1. Fill A completely from the source.
2. Fill B completely from the source.
3. Empty A completely.
4. Empty B completely.
5. Pour A into B until A is empty or B is full.
6. Pour B into A until B is empty or A is full.

**Goal:** reach any state where A or B (or both) holds exactly 4 liters. In the usual statement, 4 ends up in the 5-liter jug.

**Clarify before coding or writing steps:**

* Must 4 be in a single jug? (Yes for this classic version.)
* Can we use a third container? (No.)
* Do jugs start empty? (Yes.)
* Is water discrete liters only? (Yes: integer amounts.)
* General case later: capacities `m`, `n`, target `d`. Same ideas.

---

## 3. Think first

### What you can actually measure

Every pour either:

* Adds a full capacity (`+3` or `+5` from the source, when you fill),
* Subtracts a full capacity (when you empty),
* Or moves water between jugs without changing the **total** water currently held.

If you only care about amounts that appear in one jug, those amounts are integer linear combinations of 3 and 5:

```
a*3 + b*5   for some integers a, b (positive or negative)
```

Negative means "empty that many times" in the classic accounting. **Bézout's identity:** the set of all such combinations is exactly the multiples of `gcd(3, 5) = 1`. So you can measure 1, 2, 3, 4, or 5 liters in one of the jugs (subject to capacity). You cannot measure 4 with jugs of size 6 and 9, because `gcd(6, 9) = 3` and 3 does not divide 4.

Rule for the general puzzle: **target `d` is solvable iff `d` is a multiple of `gcd(m, n)` and `0 < d <= max(m, n)`** (for "exactly `d` in one jug").

### States, not magic

A state is a pair `(a, b)`: liters in the 3-jug and liters in the 5-jug.

* Start: `(0, 0)`.
* Goal: any state with `a == 4` or `b == 4`. Here only B can hold 4, so `b == 4`.

From any state you have at most six moves. The graph is tiny: 4 possible values for A (0..3) times 6 for B (0..5) = 24 states. Breadth-first search finds a shortest sequence if you want code. For the interview whiteboard, one short manual path is enough.

### One clean manual path (6 pours)

Track `(3-jug, 5-jug)`:

```
(0, 0)  start
(0, 5)  fill the 5
(3, 2)  pour 5 into 3 until 3 is full; 2 left in the 5
(0, 2)  empty the 3
(2, 0)  pour the remaining 2 into the 3
(2, 5)  fill the 5 again
(3, 4)  pour 5 into 3 until 3 is full (needs 1 more); 4 left in the 5
```

Done. The 5-liter jug holds exactly 4 liters.

### Another path (start with the 3)

```
(0, 0)
(3, 0)  fill 3
(0, 3)  pour into 5
(3, 3)  fill 3
(1, 5)  pour into 5 until full; 1 left in the 3
(1, 0)  empty 5
(0, 1)  pour the 1 into 5
(3, 1)  fill 3
(0, 4)  pour into 5; 5 now holds 1+3 = 4
```

Longer, same idea: you are building residues of 3 modulo 5 (or the other way around).

---

## 4. Java solutions

### (a) Document the manual recipe (what most interviews want first)

```java
// Manual sequence for (3, 5) -> 4 in the five-liter jug.
// States written as (small, large).
//
// (0,0) fill large  -> (0,5)
// pour large->small -> (3,2)
// empty small       -> (0,2)
// pour large->small -> (2,0)
// fill large        -> (2,5)
// pour large->small -> (3,4)  // large has 4
```

Say this out loud, then write the Bézout check so they know you are not guessing.

### (b) Solvability helper (general m, n, d)

```java
static int gcd(int x, int y) {
    x = Math.abs(x);
    y = Math.abs(y);
    while (y != 0) {
        int t = x % y;
        x = y;
        y = t;
    }
    return x;
}

/** True if you can obtain exactly d liters in one jug of capacities m and n. */
static boolean canMeasure(int m, int n, int d) {
    if (d == 0) {
        return true; // both empty
    }
    if (m + n < d) {
        return false;
    }
    // Exactly d in one jug: d must fit in at least one jug
    if (d > m && d > n) {
        return false;
    }
    return d % gcd(m, n) == 0;
}
```

For `m = 3`, `n = 5`, `d = 4`: `gcd` is 1, 4 fits in the 5, so true.

### (c) Optional: BFS over states (shortest step list)

Useful when capacities are larger or the interviewer asks for a program. State space is `(m+1)*(n+1)`.

```java
import java.util.*;

public class WaterJugs {
    record State(int a, int b) {}

    static List<String> measure(int m, int n, int d) {
        if (!canMeasure(m, n, d) && d != 0) {
            return List.of(); // impossible
        }
        if (d == 0) {
            return List.of("start (0,0)");
        }

        Queue<State> q = new ArrayDeque<>();
        Map<State, String> how = new HashMap<>(); // state -> last move label
        Map<State, State> prev = new HashMap<>();

        State start = new State(0, 0);
        q.add(start);
        how.put(start, "start");
        prev.put(start, null);

        while (!q.isEmpty()) {
            State cur = q.poll();
            if (cur.a == d || cur.b == d || cur.a + cur.b == d) {
                // classic "in one jug": prefer a==d or b==d
                if (cur.a == d || cur.b == d) {
                    return reconstruct(cur, prev, how);
                }
            }

            for (Object[] step : neighbors(cur, m, n)) {
                State nxt = (State) step[0];
                String label = (String) step[1];
                if (how.containsKey(nxt)) {
                    continue;
                }
                how.put(nxt, label);
                prev.put(nxt, cur);
                q.add(nxt);
            }
        }
        return List.of(); // unreachable (should not happen if canMeasure)
    }

    static List<Object[]> neighbors(State s, int m, int n) {
        int a = s.a, b = s.b;
        List<Object[]> out = new ArrayList<>();
        out.add(new Object[]{new State(m, b), "fill A"});
        out.add(new Object[]{new State(a, n), "fill B"});
        out.add(new Object[]{new State(0, b), "empty A"});
        out.add(new Object[]{new State(a, 0), "empty B"});

        // pour A -> B
        int pourAB = Math.min(a, n - b);
        out.add(new Object[]{new State(a - pourAB, b + pourAB), "pour A->B"});

        // pour B -> A
        int pourBA = Math.min(b, m - a);
        out.add(new Object[]{new State(a + pourBA, b - pourBA), "pour B->A"});
        return out;
    }

    static List<String> reconstruct(State end, Map<State, State> prev, Map<State, String> how) {
        LinkedList<String> path = new LinkedList<>();
        State cur = end;
        while (cur != null) {
            path.addFirst(how.get(cur) + " -> (" + cur.a + "," + cur.b + ")");
            cur = prev.get(cur);
        }
        return path;
    }

    static boolean canMeasure(int m, int n, int d) {
        if (d == 0) return true;
        if (d > m && d > n) return false;
        if (m + n < d) return false;
        return d % gcd(m, n) == 0;
    }

    static int gcd(int x, int y) {
        x = Math.abs(x);
        y = Math.abs(y);
        while (y != 0) {
            int t = x % y;
            x = y;
            y = t;
        }
        return x;
    }

    public static void main(String[] args) {
        System.out.println(canMeasure(3, 5, 4)); // true
        for (String step : measure(3, 5, 4)) {
            System.out.println(step);
        }
    }
}
```

BFS returns one shortest path. The six-step manual path above is a shortest length for 4 liters; the longer "start with 3" path is valid but not minimal.

### Walk-through of pour math

When you pour A into B:

```
spaceInB = n - b
moved = min(a, spaceInB)
newA = a - moved
newB = b + moved
```

Same idea the other way. That is the whole simulation. No floats.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Manual 6-step recipe | O(1) | O(1) | Fine for fixed 3 and 5 |
| Bézout / gcd check | O(log min(m,n)) | O(1) | Solvability only, not the steps |
| BFS on states | O(m * n) | O(m * n) | Shortest sequence of operations |
| DFS / recursion | same order | can be worse stack | Prefer BFS for shortest path |

For interview sizes like 3 and 5, constants dominate. The gcd test is the sharp theoretical tool.

---

## 6. Edge cases

* **Target 0** → already solved: both empty.
* **Target equals a capacity** → one fill. Example: target 3 with a 3-jug.
* **Target larger than both jugs** → impossible if you need `d` in a single jug.
* **`gcd` does not divide `d`** → impossible. Example: 4 with jugs 6 and 9.
* **One jug size 0** → only multiples of the other capacity (usually just 0 and that capacity).
* **Same capacities** → you only measure 0 or that capacity (plus total 2m if totals count; for one jug, only 0 or m).
* **Prefer 4 in the big jug** → goal test `b == 4` only, or accept either jug.
* **Do not invent half liters** → all amounts stay integers.
* **LeetCode 365 style** → "can measure" only needs gcd; "print steps" needs BFS or an explicit construction.

Minimal smoke checks:

```java
assert canMeasure(3, 5, 4);
assert canMeasure(3, 5, 1);
assert !canMeasure(2, 6, 5);
assert canMeasure(3, 5, 0);
```

---

## 7. Explain to a friend recap

Jugs of water asks: with only full fills, full empties, and pours between a 3 and a 5, can you get exactly 4 liters?

1. Moves only produce integer combinations of 3 and 5.
2. Those combinations are multiples of `gcd(3, 5) = 1`, so 4 is possible and fits in the 5-liter jug.
3. One short recipe: fill 5, pour into 3, empty 3, pour remaining 2 into 3, fill 5, pour into 3 until full. Left in the 5: **4**.
4. In code, model states `(a, b)` and BFS the six operations if you need the path automatically.
5. In general: solvable when `d % gcd(m, n) == 0` and `d` fits in at least one jug.

If you can walk the `(0,0) ... (3,4)` table on a whiteboard, say "Bézout" without freezing, and sketch a 24-state BFS, you own problem 6.5.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Ants on a Triangle](/blog/en/ctci-6-4-ants-on-a-triangle)
* Next: [Blue-Eyed Island](/blog/en/ctci-6-6-blue-eyed-island)