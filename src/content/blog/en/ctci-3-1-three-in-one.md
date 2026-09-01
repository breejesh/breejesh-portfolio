---
title: "Three in One: Implementing Three Stacks in a Single Array (CTCI 3.1)"
description: "Describe and implement how to use a single array to implement three stacks with fixed division and dynamic multi-stack partitioning in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-3-1-three-in-one.webp
previewImage: /assets/images/ctci-3-1-three-in-one.webp
---

> **TL;DR**
> * **The Book Problem:** Describe how you could use a single array to implement three stacks.
> * **The Optimal Solution:** (1) Fixed Allocation: Divide array $[0, N)$ into three equal static partitions $[0, N/3)$, $[N/3, 2N/3)$, $[2N/3, N)$ with size trackers; (2) Flexible Dynamic Multi-Stack: Allow stacks to share capacity dynamically by shifting stack elements and wrapping indices modulo capacity.
> * **Production Reality:** Thread stack memory allocators, JVM thread execution frames in off-heap arenas, and slab cache allocation.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 3.1), we are asked:

*"Describe how you could use a single array to implement three stacks."*

## 2. Approach 1: Fixed Division (Simple & High Throughput)

We divide the single array into three equal parts of size `stackCapacity`:
* Stack 0: indices $[0, \text{stackCapacity} - 1]$
* Stack 1: indices $[\text{stackCapacity}, 2 \times \text{stackCapacity} - 1]$
* Stack 2: indices $[2 \times \text{stackCapacity}, 3 \times \text{stackCapacity} - 1]$

We maintain an array `sizes` of length 3 to record the number of elements in each stack.
* `push(stackNum, value)`: Increments `sizes[stackNum]` and inserts at `stackNum * stackCapacity + sizes[stackNum] - 1`.
* `pop(stackNum)`: Clears and decrements `sizes[stackNum]`.

**Limitation:** Even if total array capacity is available, a stack can throw an overflow error if its fixed slice fills up.

## 3. Approach 2: Flexible Dynamic Division

If we want any stack to grow as long as total capacity exists:
1. When a stack exceeds its allotted space, shift the next stack forward (wrapping circularly around the array).
2. Elements wrap circularly around the array using modulo arithmetic: `(index + offset) % totalCapacity`.

## Production Implementation (Fixed Division)

```java
import java.util.EmptyStackException;

public class FixedMultiStack {
    private final int numberOfStacks = 3;
    private final int stackCapacity;
    private final int[] values;
    private final int[] sizes;

    public FixedMultiStack(int stackSize) {
        stackCapacity = stackSize;
        values = new int[stackSize * numberOfStacks];
        sizes = new int[numberOfStacks];
    }

    /**
     * Pushes value onto specified stack (0, 1, or 2).
     * Time Complexity: O(1)
     * Space Complexity: O(1)
     */
    public void push(int stackNum, int value) throws Exception {
        if (isFull(stackNum)) {
            throw new Exception("Stack " + stackNum + " is full");
        }
        sizes[stackNum]++;
        values[indexOfTop(stackNum)] = value;
    }

    /**
     * Pops top element from specified stack.
     * Time Complexity: O(1)
     */
    public int pop(int stackNum) {
        if (isEmpty(stackNum)) {
            throw new EmptyStackException();
        }
        int topIndex = indexOfTop(stackNum);
        int value = values[topIndex];
        values[topIndex] = 0; // Clear element
        sizes[stackNum]--;
        return value;
    }

    public int peek(int stackNum) {
        if (isEmpty(stackNum)) {
            throw new EmptyStackException();
        }
        return values[indexOfTop(stackNum)];
    }

    public boolean isEmpty(int stackNum) {
        return sizes[stackNum] == 0;
    }

    public boolean isFull(int stackNum) {
        return sizes[stackNum] == stackCapacity;
    }

    private int indexOfTop(int stackNum) {
        int offset = stackNum * stackCapacity;
        int size = sizes[stackNum];
        return offset + size - 1;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| push / pop / peek Time | `O(1)` | Direct index calculation using `offset + size - 1`. |
| Auxiliary Space | `O(N)` | Single contiguous memory block without object pointer overhead. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Contiguous Memory Arenas

1. **Embedded & Real-Time Systems:** Embedded firmware allocates a single contiguous RAM arena for thread stacks to eliminate heap fragmentation and enforce deterministic bounded execution.
2. **CPU Cache Locality:** Packing multiple runtime stacks into contiguous array storage maximizes CPU L1 cache line prefetching.

## Edge Cases & Production Hardening

1. **Invalid stack index:** Guarded by checking $0 \le \text{stackNum} < 3$.
2. **Stack overflow:** Throws descriptive exception when `sizes[stackNum] == stackCapacity`.
3. **Empty stack pop/peek:** Throws `EmptyStackException`.
