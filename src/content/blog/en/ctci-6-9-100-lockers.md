---
title: "100 Lockers: Which Stay Open After 100 Toggles? (Java)"
description: "CTCI-style problem 6.9 for beginners: 100 closed lockers, 100 people each toggle every i-th door. Open lockers are perfect squares (1, 4, 9, ..., 100) because only squares have an odd number of factors. Optional Java simulation."
date: "2026-06-17"
tags: [Algorithms]
coverImage: /assets/images/ctci-6-9-100-lockers.webp
previewImage: /assets/images/ctci-6-9-100-lockers.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 6.9 for beginners: 100 closed lockers, 100 people each toggle every i-th door. Open lockers are perfect squares (1, 4, 9, ..., 100) because only squares have an odd number of factors. Optional Java simulation.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

There are **100 lockers** in a hallway, all **closed**. **100 people** walk through. Person `i` toggles every `i`-th locker: person 1 flips all, person 2 flips 2, 4, 6, ..., person 100 flips only locker 100. When everyone is done, **which lockers are open?**

You can simulate the whole hallway in a loop. That works, and interviewers may ask you to code it. The real answer is cleaner: **only perfect-square lockers are open** (`1, 4, 9, 16, 25, 36, 49, 64, 81, 100`). Each locker starts closed and flips once per divisor. Only squares have an **odd** number of divisors, so only they finish open.

This post is original teaching for beginners, with optional **Java** to simulate the toggles. Same family as classic interview math puzzles, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 6, math and logic, problem 6.9.

---

## 1. Everyday analogy

Picture a school hallway with 100 metal lockers. Every door starts shut.

A line of students walks past. Student number 1 opens or closes every door (so they all open). Student 2 hits every second door (closes half of them). Student 3 hits every third door, and so on, until student 100 touches only locker 100.

You do not need to watch every student. Ask a different question: **how many times does locker `k` get touched?** Once for each number that divides `k`. Locker 12 is touched by students 1, 2, 3, 4, 6, and 12: six times. Six is even, so it ends closed (start closed, even flips back to closed). Locker 16 is touched by 1, 2, 4, 8, and 16: five times. Odd, so it ends open.

The odd counts only show up when one of the factors is "paired with itself": perfect squares.

---

## 2. Plain problem statement

**Setup:**

* 100 lockers, numbered 1 through 100.
* All start **closed**.
* 100 people, numbered 1 through 100.
* Person `i` toggles lockers `i, 2i, 3i, ...` (every multiple of `i` that is at most 100).
* Toggle means: closed becomes open, open becomes closed.

**Goal:** after person 100 finishes, list (or count) the open lockers.

**Assumptions to state in an interview:**

* Lockers and people are both 1-based, 1..100.
* Exactly one pass per person, in order (order does not actually matter for the final state; each locker still toggles once per divisor).
* No other operations between passes.

**Signature shape if you code a simulator:**

```java
// returns true if locker is open after the full process (1-based indices in comments)
boolean[] openLockers(int n);
```

Or just print the open indices:

```java
// simulate n lockers / n people; return list of open locker numbers (1-based)
List<Integer> openAfterProcess(int n);
```

**Tiny numeric preview (n = 10):**

| Locker | Divisors (who toggles) | Count | Final (start closed) |
| --- | --- | --- | --- |
| 1 | 1 | 1 odd | open |
| 2 | 1, 2 | 2 even | closed |
| 3 | 1, 3 | 2 even | closed |
| 4 | 1, 2, 4 | 3 odd | open |
| 5 | 1, 5 | 2 even | closed |
| 6 | 1, 2, 3, 6 | 4 even | closed |
| 7 | 1, 7 | 2 even | closed |
| 8 | 1, 2, 4, 8 | 4 even | closed |
| 9 | 1, 3, 9 | 3 odd | open |
| 10 | 1, 2, 5, 10 | 4 even | closed |

Open for n = 10: **1, 4, 9**. For n = 100: **1, 4, 9, ..., 100** (ten doors).

---

## 3. Think first

### Brute force first

Two nested loops:

```
lockers[1..n] = closed
for person p = 1..n:
    for locker k = p, 2p, 3p, ... <= n:
        toggle lockers[k]
```

That is O(n²) worst case in a naive form, actually about O(n log n) toggles total because person `p` hits `n/p` doors. Fine for n = 100. Interviewers still want the **why**.

### Who toggles locker k?

Person `p` hits locker `k` only when `p` divides `k`. So locker `k` is toggled **once per positive divisor** of `k`.

Start closed:

* Even number of toggles → closed
* Odd number of toggles → open

So open lockers are exactly those with an **odd divisor count**.

### When is the number of divisors odd?

Divisors usually pair: if `d` divides `k`, so does `k/d`, and `d ≠ k/d` unless `d² = k`.

Example for 12:

```
1 × 12
2 × 6
3 × 4
```

Six distinct divisors, three pairs.

Example for 16:

```
1 × 16
2 × 8
4 × 4   // sqrt pairs with itself
```

Divisors: 1, 2, 4, 8, 16. Five values. The middle factor is counted once.

**Only perfect squares** have a divisor that is the square root "pairing with itself," so only they have an odd count.

Therefore open lockers are:

```
1², 2², 3², ..., floor(sqrt(n))²
```

For n = 100: `1, 4, 9, 16, 25, 36, 49, 64, 81, 100`. Count: **10**.

### O(1) closed form for the count

Number of open lockers for general n is `floor(sqrt(n))`. No simulation required once you have the theorem.

### Why this is "math and logic," not coding trivia

Anyone can write the double loop. The interview win is connecting **toggle parity** to **divisor parity** to **perfect squares**. Say that chain out loud before you touch the keyboard.

### Variants people bring up

* **Start open instead of closed:** flip the final state (or redefine "open"). Always state the initial state.
* **n not 100:** same rule; open = squares up to n.
* **Only count, not list:** answer is `floor(sqrt(n))`.
* **"Which people leave a locker open?"** Still the square indices; people do not "own" a final state, toggles do.

---

## 4. Java solution (simulation)

Reasoning alone is enough. Code proves the claim for n = 100 and general n.

### Full simulation

```java
import java.util.ArrayList;
import java.util.List;

/** Simulate n lockers / n people. Returns 1-based open locker numbers. */
static List<Integer> openAfterProcess(int n) {
    boolean[] open = new boolean[n + 1]; // index 0 unused; false = closed
    for (int person = 1; person <= n; person++) {
        for (int locker = person; locker <= n; locker += person) {
            open[locker] = !open[locker];
        }
    }
    List<Integer> result = new ArrayList<>();
    for (int k = 1; k <= n; k++) {
        if (open[k]) {
            result.add(k);
        }
    }
    return result;
}
```

### Math-only answer (what you should say first)

```java
/** Open lockers are perfect squares: 1, 4, 9, ..., floor(sqrt(n))^2. */
static List<Integer> openBySquares(int n) {
    List<Integer> result = new ArrayList<>();
    for (int i = 1; i * i <= n; i++) {
        result.add(i * i);
    }
    return result;
}
```

### Self-check against simulation

```java
static void verify(int n) {
    List<Integer> sim = openAfterProcess(n);
    List<Integer> math = openBySquares(n);
    if (!sim.equals(math)) {
        throw new AssertionError("mismatch for n=" + n + " sim=" + sim + " math=" + math);
    }
    System.out.println("ok n=" + n + " open=" + math + " count=" + math.size());
}

// verify(10);  // [1, 4, 9]
// verify(100); // [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

### Count without a list

```java
static int countOpen(int n) {
    return (int) Math.floor(Math.sqrt(n));
    // or integer loop: int c = 0; for (int i = 1; i * i <= n; i++) c++; return c;
}
```

For n = 100, `floor(sqrt(100)) = 10`.

### Worked numbers for locker 36

Divisors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. That is **9** (odd).

```
start closed
after 1: open
after 2: closed
after 3: open
after 4: closed
after 6: open
after 9: closed
after 12: open
after 18: closed
after 36: open
```

Ends open. 36 = 6².

Locker 50: divisors 1, 2, 5, 10, 25, 50. Six times, even, ends closed.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Double loop simulation | O(n log n) toggles | O(n) for the boolean array | clear, good for coding rounds |
| List perfect squares `i*i <= n` | O(sqrt(n)) | O(sqrt(n)) for the answer list | optimal once you know the insight |
| Count only `floor(sqrt(n))` | O(1) with `Math.sqrt`, or O(sqrt(n)) integer loop | O(1) | best if they only ask "how many" |
| Factor every k and count divisors | O(n sqrt(n)) naive | O(1) besides output | correct but slower; teaches the divisor view |

For n = 100 everything is instant. For huge n, prefer the square list or the floor-sqrt count.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **n = 1:** only locker 1, person 1 opens it. Open: `[1]`.
* **n = 0 or negative:** define as empty; reject in code.
* **Off-by-one arrays:** Java arrays are 0-based; leave index 0 unused or map carefully.
* **Starting open:** flips the answer. Confirm the problem says closed at the start.
* **Person i toggles locker i only once?** Yes, among others. Some people forget multiples and only toggle `i`.
* **Floating sqrt for the count:** `Math.sqrt` is fine for n up to about 2^53 exact integer squares in double; for huge `long` n prefer an integer binary search for floor sqrt, or a careful cast.
* **"All lockers visited by person 1 are open at the end"** wrong; later people close many of them.

Common mistakes:

1. **Simulating only person 1 and person 100** and guessing patterns without divisors.
2. **Saying primes stay open** (they do not: primes have exactly two divisors, even count, closed).
3. **Including non-squares that "feel special"** (powers of two, etc.).
4. **Counting 0 as a square locker** when lockers are 1..n.
5. **O(n²) nested `for k=1..n if k % p == 0`** when `for locker = p; locker <= n; locker += p` is cleaner and faster.

Minimal smoke idea:

```java
verify(1);
verify(10);
verify(100);
System.out.println(countOpen(100)); // 10
System.out.println(openBySquares(100));
// [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

---

## 7. Explain to a friend recap

Hundred lockers, all shut. Hundred people. Person i flips every i-th door.

1. Locker k flips once for each divisor of k.
2. Start closed: odd flips → open, even flips → closed.
3. Divisors pair up, except when k is a perfect square (the square root is only one divisor).
4. So open lockers are **1, 4, 9, ..., 100**. There are **10** of them (`floor(sqrt(100))`).
5. Code can simulate with a boolean array, or just emit `i*i` while `i*i <= n`.

If you can say "odd number of factors, only squares" without drawing the whole table, you own problem 6.9. Chapter 6 keeps rewarding this style: one invariant beats a pile of simulation details.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [The Egg Drop Problem](/blog/en/ctci-6-8-the-egg-drop-problem)
* Next: [Poison](/blog/en/ctci-6-10-poison)