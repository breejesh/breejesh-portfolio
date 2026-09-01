---
title: "Towers of Hanoi: Recursive Disk Movement and Stack Model (CTCI 8.6)"
description: "Solve the classic Towers of Hanoi puzzle for N disks across 3 rods using an object-oriented Stack model and divide-and-conquer recursion in O(2^N) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
previewImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
---

> **TL;DR**
> * **The Book Problem:** In the classic problem of the Towers of Hanoi, you have 3 towers and $N$ disks of different sizes which can slide onto any tower. The puzzle starts with disks sorted in ascending order of size from top to bottom. You can only move one disk at a time, and a larger disk can never be placed on top of a smaller disk. Move all disks from the first tower to the last.
> * **The Optimal Solution:** Divide-and-Conquer Tower Recursion: (1) Move top $n - 1$ disks from `Origin` to `Buffer` using `Destination` as intermediary; (2) Move the $n$-th (largest) disk directly from `Origin` to `Destination`; (3) Move the $n - 1$ disks from `Buffer` to `Destination` using `Origin` as intermediary. Executes in exactly $2^N - 1$ disk moves ($O(2^N)$ time) and $O(N)$ recursion depth / stack space.
> * **Production Reality:** Recursive backup storage rotation schemes (Grandfather-Father-Son rotation), state-space search verification in model checkers, and CPU register spill/reload order optimization.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 8.6), we are asked:

*"In the classic problem of the Towers of Hanoi, you have 3 towers and N disks of different sizes which can slide onto any tower. The puzzle starts with disks sorted in ascending order of size from top to bottom. Move all disks from the first tower to the last using object-oriented stacks."*

## 2. Recursive Decomposition

To move $n$ disks from Tower 1 (`Origin`) to Tower 3 (`Destination`) using Tower 2 (`Buffer`):
1. **Step 1:** Move top $n - 1$ disks from `Origin` to `Buffer` (leaves disk $n$ exposed).
2. **Step 2:** Move disk $n$ from `Origin` to `Destination`.
3. **Step 3:** Move the $n - 1$ disks from `Buffer` to `Destination`.

**Recurrence:** $T(n) = 2T(n - 1) + 1 = 2^n - 1$.

## Production Implementation

```java
import java.util.Stack;

public class TowersOfHanoi {
    public static class Tower {
        private final Stack<Integer> disks = new Stack<>();
        private final int index;

        public Tower(int i) { this.index = i; }
        public int index() { return index; }

        public void add(int d) {
            if (!disks.isEmpty() && disks.peek() <= d) {
                throw new IllegalStateException("Error placing disk " + d + " on top of " + disks.peek());
            }
            disks.push(d);
        }

        public void moveTopTo(Tower t) {
            int top = disks.pop();
            t.add(top);
        }

        public void moveDisks(int quantity, Tower destination, Tower buffer) {
            if (quantity <= 0) return;

            // Move top (quantity - 1) disks from this to buffer using destination as temporary
            moveDisks(quantity - 1, buffer, destination);

            // Move bottom-most disk from this to destination
            moveTopTo(destination);

            // Move (quantity - 1) disks from buffer to destination using this as temporary
            buffer.moveDisks(quantity - 1, destination, this);
        }

        public Stack<Integer> getDisks() { return disks; }
    }

    public static void solveHanoi(int n) {
        Tower[] towers = new Tower[3];
        for (int i = 0; i < 3; i++) {
            towers[i] = new Tower(i);
        }

        for (int i = n - 1; i >= 0; i--) {
            towers[0].add(i);
        }

        towers[0].moveDisks(n, towers[2], towers[1]);
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(2^N)` | Executes exactly $2^N - 1$ discrete disk movements. |
| Auxiliary Space | `O(N)` | Call stack depth bounded by $N$ frames and $N$ total stack integers. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Backup Schedules & Stack State

1. **GFS Backup Tape Rotation Schemes:** The Grandfather-Father-Son hierarchical backup strategy mathematically mirrors Hanoi disk movement schedules to minimize tape rewrites.
2. **CPU Call Frame Stack Spilling:** Register allocation spills oldest frame registers to auxiliary memory before repopulating active registers.

## Edge Cases & Production Hardening

1. **Stack Invariant Validation:** `Tower.add()` throws an exception if an attempt is made to place a larger disk atop a smaller disk.
2. **$N = 0$ or negative:** Terminates immediately without action.
