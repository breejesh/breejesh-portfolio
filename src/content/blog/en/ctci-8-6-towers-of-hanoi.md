---
title: "Towers of Hanoi: Move n Disks With Three Pegs (Java)"
description: "CTCI-style problem 8.6 for beginners: classic Towers of Hanoi with three pegs and n disks. Recursive move of the top tower, Java stacks for each peg."
date: "2025-08-02"
tags: [Algorithms]
coverImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
previewImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 8.6 for beginners: classic Towers of Hanoi with three pegs and n disks. Recursive move of the top tower, Java stacks for each peg.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You have three rods and a stack of disks. Disks start on the first rod, largest at the bottom, smallest on top. You must move the whole stack to the last rod. One disk moves at a time. You may never put a larger disk on a smaller one. The middle rod is your only parking space. That puzzle is **Towers of Hanoi**, and the clean interview solution is recursion plus a stack per peg.

This post is original teaching for absolute beginners in **Java**. Same problem family as classic recursive Hanoi questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 8, recursion and dynamic programming. Problem 8.6.

---

## 1. Everyday analogy

Think of three poles at a playground and a pile of nested rings:

* **Source peg:** where the full tower starts.
* **Destination peg:** where the full tower must end.
* **Buffer peg:** temporary parking so you never break the "bigger under smaller" rule.

To move a tower of five rings, you do not invent five special rules. You clear the top four off the largest ring (by parking them on the buffer, using the destination as *their* buffer), slide the largest ring to the destination, then move the tower of four on top of it. The same idea works for four, for three, for two, and for one.

Recursion is that "same idea, smaller pile" habit made into code.

---

## 2. Plain problem statement

**Setup:**

* Three pegs: often named A (source), B (buffer), C (destination).
* `n` disks of distinct sizes. Disk `1` is smallest, disk `n` is largest (or the reverse labeling; pick one and stick to it).
* Start: all disks on the source, stacked largest at bottom to smallest on top.
* Goal: all disks on the destination, same legal order.

**Rules:**

1. Move only one disk at a time.
2. A move takes the top disk of one peg and places it on another peg.
3. Never place a larger disk on a smaller disk.

**Output:** a sequence of legal moves that solves the puzzle, or a program that performs those moves on stack-backed pegs.

**Examples (n = 1, 2, 3):**

| n | Minimum moves | Idea |
| --- | --- | --- |
| 1 | 1 | Source → destination |
| 2 | 3 | Small to buffer, large to dest, small to dest |
| 3 | 7 | Move 2 to buffer, large to dest, move 2 to dest |
| n | 2^n - 1 | Recurrence T(n) = 2 T(n-1) + 1 |

**Clarify before coding:**

* Represent each peg as a `Stack` of disk sizes? (Yes. Top of stack is the movable disk.)
* Disk labels: larger number = larger disk, or the opposite? State it. Here: **larger int = larger disk**.
* Print moves, or mutate stacks? Prefer both: a `moveDisks` that mutates and optional logging.
* Illegal move handling? Throw or assert when a larger disk would land on a smaller one.

---

## 3. Think first (recursive move)

### Base case

To move **1** disk from source to destination: pop from source, push on destination. Done.

### Recursive case

To move **n** disks from source to destination using buffer:

1. Move `n - 1` disks from **source → buffer**, using **destination** as the temporary peg.
2. Move the remaining (largest of this subproblem) disk from **source → destination**.
3. Move `n - 1` disks from **buffer → destination**, using **source** as the temporary peg.

Roles of the three pegs swap at each recursive call. That role swap is the whole trick. You are not hardcoding "always park on B".

### Why it never breaks the size rule

Inductively: a legal tower of `n - 1` can be moved as a unit. After step 1, the largest disk of this subproblem sits alone on the source (or under only larger disks that are not part of this subcall). Step 2 places it on a peg whose top is either empty or larger than it (the disks smaller than it are all on the buffer). Step 3 rebuilds the smaller tower on top.

### Walkthrough: n = 3, A → C via B

Disks: `3` (bottom), `2`, `1` (top) on A.

| Step | Action | A (bottom → top) | B | C |
| --- | --- | --- | --- | --- |
| start | | 3, 2, 1 | empty | empty |
| 1 | move 2: A → B via C | 3 | 2, 1 | empty |
| 2 | move disk 3: A → C | empty | 2, 1 | 3 |
| 3 | move 2: B → C via A | empty | empty | 3, 2, 1 |

Expanding "move 2: A → B via C":

1. Move 1: A → C
2. Move 2: A → B
3. Move 1: C → B

Total moves for n = 3: 7. Pattern holds for any n.

### What not to do

* Nested loops that hardcode only n = 3. Interviewers want the general recursive structure.
* Arrays without stack discipline if the problem asks for pegs as stacks.
* Moving a whole subtower in one non-recursive "cheat" without showing the three-step plan.

---

## 4. Java solution

Model each peg as a small class wrapping a `Stack<Integer>`. Disk values grow with size: top of stack must be smaller than what you push, or the peg is empty.

```java
import java.util.Stack;

/**
 * One peg in Towers of Hanoi. Top of stack is the movable disk.
 * Larger int means larger disk.
 */
class Tower {
    private final Stack<Integer> disks = new Stack<Integer>();
    private final int index; // 0, 1, or 2 for logging

    Tower(int index) {
        this.index = index;
    }

    int index() {
        return index;
    }

    void add(int disk) {
        if (!disks.isEmpty() && disks.peek() <= disk) {
            throw new IllegalStateException(
                "Cannot place disk " + disk + " on " + disks.peek());
        }
        disks.push(disk);
    }

    void moveTopTo(Tower destination) {
        int top = disks.pop();
        destination.add(top);
        System.out.println(
            "Move disk " + top + " from " + index + " to " + destination.index());
    }

    /**
     * Move the top n disks from this tower to destination,
     * using buffer as temporary storage.
     */
    void moveDisks(int n, Tower destination, Tower buffer) {
        if (n <= 0) {
            return;
        }
        if (n == 1) {
            moveTopTo(destination);
            return;
        }
        // n-1 off this peg onto buffer (destination is their buffer)
        moveDisks(n - 1, buffer, destination);
        // largest of this subproblem to destination
        moveTopTo(destination);
        // n-1 from buffer onto destination (this peg is their buffer)
        buffer.moveDisks(n - 1, destination, this);
    }
}
```

Driver that builds three pegs and solves for `n`:

```java
void solveHanoi(int n) {
    Tower[] towers = new Tower[3];
    for (int i = 0; i < 3; i++) {
        towers[i] = new Tower(i);
    }

    // Source = towers[0]. Load largest first so it sits at the bottom.
    for (int disk = n; disk >= 1; disk--) {
        towers[0].add(disk);
    }

    towers[0].moveDisks(n, towers[2], towers[1]);
    // towers[2] now holds  n, n-1, ..., 1  (bottom → top)
}
```

Minimal check for n = 2 (three printed moves):

```java
// solveHanoi(2) prints something like:
// Move disk 1 from 0 to 1
// Move disk 2 from 0 to 2
// Move disk 1 from 1 to 2
```

If you prefer free functions instead of methods on `Tower`, keep the same three steps and pass source, destination, and buffer as arguments. The recursion shape does not change.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Classic recursion | O(2^n) moves | O(n) call stack | Exactly 2^n - 1 moves; each move is O(1) stack work |
| Iterative with explicit stack | O(2^n) moves | O(n) | Same bound; simulates the recursion |
| Closed form only | O(1) to count | O(1) | Count is 2^n - 1; still need O(2^n) if you emit moves |

You cannot beat 2^n - 1 legal moves for the classic three-peg rules. The exponential cost is the problem, not a bug in your code. Extra space for the recursive solution is the call depth O(n), plus O(n) disk storage on the pegs.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **n = 0** → no moves. Guard with `n <= 0`.
* **n = 1** → single `moveTopTo`. Base case must work alone.
* **n = 2, n = 3** → walk through by hand; count must be 3 and 7.
* **Wrong buffer role** → swapping destination and buffer in the recursive calls corrupts the tower.
* **Loading disks smallest-first** → largest ends on top; `add` throws or the puzzle starts illegal.
* **Comparing disk sizes backward** → if you flip the "larger int = larger disk" convention, flip the safety check too.

Common mistakes:

1. **Only coding the middle move.** Forgetting the two recursive `n - 1` calls leaves disks stranded.
2. **Hardcoding peg indices** inside the recursive method instead of passing roles. Breaks when roles rotate.
3. **Allowing illegal stacks.** Without the `add` check, silent bugs hide until the final layout looks wrong.
4. **Off-by-one on n.** Moving `n` disks when only `n - 1` remain on the source after a bad prior call.
5. **Thinking DP memo helps.** Every subproblem must actually move disks; there is no overlapping "skip work" the way path-counting DP does. Recursion structure matters more than memo tables here.

Null-safe entry:

```java
void solveHanoiSafe(int n) {
    if (n < 0) {
        throw new IllegalArgumentException("n must be >= 0");
    }
    solveHanoi(n);
}
```

---

## 7. Explain to a friend recap

Towers of Hanoi asks: move n disks from peg A to peg C using peg B, never putting a larger disk on a smaller one.

1. Represent each peg as a stack. Top is the only disk you may move.
2. Base: move one disk source → destination.
3. General: move n-1 source → buffer (dest as temp), move one source → dest, move n-1 buffer → dest (source as temp).
4. Total moves: 2^n - 1. Time O(2^n), recursion depth O(n).
5. Enforce size rules on every push so illegal states fail fast.

If you can say the three-step plan, load disks largest-first, and not mix up the buffer role, you own problem 8.6.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Recursive Multiply](/blog/en/ctci-8-5-recursive-multiply)
* Next: [Permutations without Dups](/blog/en/ctci-8-7-permutations-without-dups)