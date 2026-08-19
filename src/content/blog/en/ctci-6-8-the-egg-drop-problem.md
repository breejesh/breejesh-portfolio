---
title: "The Egg Drop Problem: 100 Floors, 2 Eggs, Minimize Worst Case (Java)"
description: "CTCI-style problem 6.8 for beginners: find the critical floor with two eggs and 100 floors while minimizing the worst-case number of drops. Use decreasing intervals so every path costs the same, and solve x(x+1)/2 >= 100."
date: "2026-03-29"
tags: [Algorithms]
coverImage: /assets/images/ctci-6-8-the-egg-drop-problem.webp
previewImage: /assets/images/ctci-6-8-the-egg-drop-problem.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 6.8 for beginners: find the critical floor with two eggs and 100 floors while minimizing the worst-case number of drops. Use decreasing intervals so every path costs the same, and solve x(x+1)/2 >= 100.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

A building has **100 floors**. You have **two eggs**. There is some critical floor `F` such that an egg dropped from floor `F` or higher breaks, and from any floor below `F` it survives. Eggs that survive can be reused. Eggs that break are gone. You do not know `F` (it can be 1 through 100, or even "never breaks," depending how you model the top). Goal: find `F` while **minimizing the number of drops in the worst case**.

This is a strategy puzzle with a clean closed form for two eggs. The trick is not binary search. You choose drop floors so every outcome path burns the same remaining budget. This post is original teaching for beginners, with **Java** to compute the optimal drop count and the floor schedule. Same family as classic interview egg-drop questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 6, math and logic, problem 6.8.

---

## 1. Everyday analogy

You are testing glass phone cases by dropping them off a staircase. Two sample cases. Once a case cracks, that sample is dead. You still need the exact lowest step where cracks start.

If you only climb one step at a time from the bottom, you never waste a case, but the worst day is a hundred climbs.

If you jump halfway, then halfway again, a crack early forces you to crawl every step between the last safe landing and the crack, with only one case left. That crawl can be long. Binary search is great when samples are free. Here samples are scarce.

So you plan like a coach with a fixed timeout. "I will allow at most `x` drops on the worst path." Every first jump leaves enough steps below to finish with the second case, and enough jumps above if the case survives. The jumps get shorter as the remaining timeout shrinks. That is the whole idea.

---

## 2. Plain problem statement

**Setup:**

* Building with `n` floors (classic: `n = 100`).
* `k` eggs (classic: `k = 2`).
* Critical floor `F`: breaks from `F` and above, survives below `F`.
* A drop is one experiment from one floor with one egg.
* Surviving eggs can be dropped again. Broken eggs cannot.
* You must identify `F` (or prove no break on any floor).

**Goal:** choose a strategy that **minimizes the worst-case number of drops**. Not the average case. Not "hope the egg never breaks."

**Clarify in an interview:**

* Is floor 1 possibly critical? (Yes. Sometimes model `F` from 0 to `n`, where 0 means breaks even from floor 1, and `n+1` means never breaks.)
* Does "find F" include the never-breaks case? (State your model. Coverage of 100 floors usually means you can distinguish the break threshold among 100 possibilities in the classic statement.)
* Are you optimizing worst case or expected case under uniform `F`? (Worst case for this problem.)
* How many eggs? Stick to 2 unless they open the general DP.

**Signature shapes if you code helpers:**

```java
// smallest max drops D such that 2 eggs can cover n floors
int minDropsTwoEggs(int floors);

// first-drop floors for a plan with D drops (1-based floor numbers)
int[] dropSchedule(int floors, int drops);
```

**Tiny numeric preview (the answer you want ready):**

You need the smallest `x` with:

```
x(x + 1) / 2 >= 100
```

```
13 * 14 / 2 = 91   < 100
14 * 15 / 2 = 105  >= 100
```

So the minimal worst-case drop count for 100 floors and 2 eggs is **14**.

---

## 3. Think first

### Linear scan with one egg (or after the first breaks)

With one egg left, you have no choice: walk up one floor at a time from the last safe floor. If you skip, a break leaves a gap you cannot resolve.

Worst case for pure linear from floor 1: **100** drops. Correct, boring, and what you fall back to after egg 1 breaks.

### Why plain binary search is not optimal

Binary search halves the range. With unlimited eggs that is fine. With two eggs:

* First drop at floor 50. If it breaks, egg 2 must linear-scan floors 1..49. Worst path length: `1 + 49 = 50`.
* If it survives, you still have two eggs above, but every early break on a later binary cut still leaves a large linear segment.

The worst case under binary-style first cuts is around **50**, much better than 100, still far from optimal. The problem is **asymmetric cost**: a break costs you an egg and forces linear search below; a survival only costs a drop. Equal-sized intervals ignore that.

### Equalize the remaining worst case

Pick a budget `D`: "no path may use more than `D` drops."

With 2 eggs and `D` drops left, your first drop should be from a floor such that:

1. **If it breaks:** you have `D - 1` drops and 1 egg. You can check at most `D - 1` floors below (linear). So you may place the first drop at floor `(D - 1) + 1 = D`.
2. **If it survives:** you have `D - 1` drops and 2 eggs still. Repeat the same logic above that floor.

So the intervals between successive attempt floors (while both eggs remain) are:

```
D, then D-1, then D-2, ..., then 1
```

Total floors you can cover with budget `D`:

```
sum = D + (D - 1) + ... + 1 = D(D + 1) / 2
```

Find the smallest `D` with `D(D + 1) / 2 >= n`.

For `n = 100`:

| D | D(D+1)/2 | Enough? |
| --- | --- | --- |
| 12 | 78 | no |
| 13 | 91 | no |
| 14 | 105 | yes |
| 15 | 120 | yes, but larger worst case |

**Answer: 14.**

### Example schedule (floors, 1-based)

With `D = 14`, first attempt floors while both eggs are alive (cumulative):

```
14,
14 + 13 = 27,
27 + 12 = 39,
39 + 11 = 50,
50 + 10 = 60,
60 + 9  = 69,
69 + 8  = 77,
77 + 7  = 84,
84 + 6  = 90,
90 + 5  = 95,
95 + 4  = 99,
99 + 3  = 102  (clamp to 100; you only need 100 floors)
```

You only need coverage of 100, and 105 theoretical slots exist, so the last few intervals can shrink or stop at 100. The worst path still never exceeds 14 drops.

### Worked path

Suppose `F = 32` (breaks starting at 32).

1. Drop at 14: survives.
2. Drop at 27: survives.
3. Drop at 39: breaks. One egg left. Last safe = 27.
4. Linear: 28, 29, 30, 31, 32 (breaks at 32).

Drops used: 3 two-egg attempts that matter + linear steps from 28 to 32. Count carefully on the whiteboard; the point is every branch was sized so you never exceed 14.

### Generalization (say if they ask)

With `k` eggs and `D` drops, the classic recurrence is:

```
floors(D, k) = 1 + floors(D - 1, k - 1)  // break
             + floors(D - 1, k)          // survive
```

Base: `floors(0, *) = 0`, `floors(*, 1) = D` (linear), `floors(D, 0) = 0`. For `k = 2` this collapses to the triangular numbers above. Interview 6.8 wants the 2-egg closed form; DP is bonus.

---

## 4. Java solution (compute optimal drops)

Reasoning solves the puzzle. Code shows you can compute `D`, list the schedule, and maybe binary-search `D` for arbitrary `n`.

### Smallest D with triangular coverage

```java
/** Sum 1+2+...+d. Careful with overflow for huge d. */
static long triangular(int d) {
    return (long) d * (d + 1) / 2;
}

/**
 * Minimal worst-case drops for 2 eggs and {@code floors} floors.
 * Smallest d with d*(d+1)/2 >= floors.
 */
static int minDropsTwoEggs(int floors) {
    if (floors <= 0) {
        return 0;
    }
    int d = 1;
    while (triangular(d) < floors) {
        d++;
        // optional guard for absurd inputs
        if (d > floors) {
            return floors; // linear is always enough
        }
    }
    return d;
}
```

For 100 floors this returns **14**.

### Closed form (optional, faster)

Solve `d(d+1)/2 >= n` with the quadratic formula:

```
d ≈ ceil( (-1 + sqrt(1 + 8n)) / 2 )
```

```java
static int minDropsTwoEggsClosed(int floors) {
    if (floors <= 0) {
        return 0;
    }
    // ceil( (-1 + sqrt(1+8n)) / 2 )
    double d = Math.ceil((-1.0 + Math.sqrt(1.0 + 8.0 * floors)) / 2.0);
    int ans = (int) d;
    // float safety: bump until coverage holds
    while (triangular(ans) < floors) {
        ans++;
    }
    while (ans > 1 && triangular(ans - 1) >= floors) {
        ans--;
    }
    return ans;
}
```

On a whiteboard, the loop or the "try 13 then 14" table is enough. Mention the closed form if you want style points.

### Build a first-drop schedule

```java
/**
 * Floors (1-based) where you attempt while both eggs remain,
 * for a plan with {@code drops} budget covering {@code floors}.
 * Stops at or before {@code floors}.
 */
static int[] dropSchedule(int floors, int drops) {
    if (floors <= 0 || drops <= 0) {
        return new int[0];
    }
    java.util.ArrayList<Integer> list = new java.util.ArrayList<>();
    int floor = 0;
    int step = drops;
    while (floor < floors && step >= 1) {
        floor = Math.min(floors, floor + step);
        list.add(floor);
        if (floor >= floors) {
            break;
        }
        step--;
    }
    int[] out = new int[list.size()];
    for (int i = 0; i < list.size(); i++) {
        out[i] = list.get(i);
    }
    return out;
}
```

### Quick verification

```java
static void demo() {
    int n = 100;
    int d = minDropsTwoEggs(n);
    System.out.println("min worst-case drops = " + d); // 14
    System.out.println("coverage = " + triangular(d)); // 105

    System.out.println(minDropsTwoEggs(91));  // 13
    System.out.println(minDropsTwoEggs(92));  // 14
    System.out.println(minDropsTwoEggs(1));   // 1
    System.out.println(minDropsTwoEggs(0));   // 0

    int[] plan = dropSchedule(n, d);
    System.out.println(java.util.Arrays.toString(plan));
    // [14, 27, 39, 50, 60, 69, 77, 84, 90, 95, 99, 100] style sequence
}
```

### One-egg and infinite-egg extremes (interview talk track)

```java
// 1 egg: must linear scan
static int minDropsOneEgg(int floors) {
    return Math.max(floors, 0);
}

// unlimited eggs: binary search worst case
static int minDropsUnlimitedEggs(int floors) {
    if (floors <= 0) {
        return 0;
    }
    return (int) Math.ceil(Math.log(floors + 1) / Math.log(2)); // rough model; state your floor numbering
}
```

For 2 eggs you sit between those extremes: better than linear, worse than pure binary, and the math is triangular.

---

## 5. Complexity table

| Approach | Worst-case drops (n=100, 2 eggs) | Notes |
| --- | --- | --- |
| Linear from floor 1 | 100 | Optimal if only 1 egg |
| Binary first cut, then linear on break | ~50 | Ignores asymmetric cost |
| Equal intervals of size s | about n/s + s | Tunable, usually worse than decreasing steps |
| Decreasing intervals D, D-1, ... | **14** | Optimal for 2 eggs |
| DP general k eggs | depends on k | Overkill for classic 6.8 |

Time to **compute** `D` with the while-loop: O(sqrt(n)) iterations because `D ~ O(sqrt(n))`. Closed form is O(1) arithmetic plus a tiny fixup. Building the schedule is O(D).

The interview metric that matters is **worst-case drops**, not CPU time of the planner.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **n = 1:** answer 1. One floor, one drop tells you break or not.
* **n = 0:** answer 0.
* **Exactly triangular:** `n = 91` needs 13, not 14. Off-by-one on the inequality is common.
* **n = 100:** must be 14. If someone says 13, coverage is only 91 floors.
* **After first egg breaks:** force linear scan. Skipping floors with one egg is a hard fail.
* **Optimizing average case** under uniform `F`: different objective. This problem is worst case.
* **Modeling F = 0 .. n vs 1 .. n:** say how many distinct outcomes you need. The triangular argument covers "how many floors of information" you can buy with budget D.
* **Three eggs:** interviewer may ask the recurrence. Do not pretend the answer is still 14 without recompute.

Common mistakes:

1. **Declaring binary search optimal** because "log 100 is about 7." That assumes eggs are free.
2. **Using fixed gap 10** (drop at 10, 20, 30, ...): worst case is 10 + 9 = 19 when it breaks at 10 and you scan 1..9 after, or similar. Worse than 14.
3. **Solving x^2 = 100 → x = 10** and stopping. You need `x(x+1)/2`, not `x^2`.
4. **Forgetting that intervals shrink.** Constant step size leaves the late paths cheaper than the early-break paths; you can rebalance.
5. **Counting only first-egg drops** and ignoring the linear second-egg segment in the worst case.
6. **Integer overflow** in `d * (d + 1)` for huge n if you use `int` carelessly. Use `long` for the product.

Minimal smoke:

```java
assert minDropsTwoEggs(100) == 14;
assert minDropsTwoEggs(91) == 13;
assert minDropsTwoEggs(92) == 14;
assert triangular(14) == 105;
assert minDropsTwoEggsClosed(100) == 14;
```

---

## 7. Explain to a friend recap

Two eggs, 100 floors, minimize the worst day.

1. One egg left means crawl one floor at a time. Never skip.
2. Binary search wastes worst case because a break in a big half forces a long crawl.
3. Fix a drop budget `D`. Space attempts so break and survive paths both finish in `D` total drops.
4. That makes gaps `D, D-1, ..., 1`. Coverage is the triangle number `D(D+1)/2`.
5. Smallest `D` with `D(D+1)/2 >= 100` is **14** (because 91 is short, 105 is enough).
6. In Java, loop `d` upward until the triangle covers `n`, or use the quadratic closed form with a safety adjust.

If you can derive "why 14" on a napkin without memorizing the number, you own problem 6.8. Next up in the series is a pure counting puzzle with lockers.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [The Apocalypse](/blog/en/ctci-6-7-the-apocalypse)
* Next: [100 Lockers](/blog/en/ctci-6-9-100-lockers)