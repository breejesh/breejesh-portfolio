---
title: "Stack Min: Constant Time O(1) Minimum Element Tracking (CTCI 3.2)"
description: "How would you design a stack which, in addition to push and pop, has a function min which returns the minimum element? Push, pop, and min should all operate in O(1) time."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-3-2-stack-min.webp
previewImage: /assets/images/ctci-3-2-stack-min.webp
---

> **TL;DR**
> * **The Book Problem:** How would you design a stack which, in addition to push and pop, has a function min which returns the minimum element? Push, pop, and min should all operate in $O(1)$ time.
> * **The Core Breakthrough:** Auxiliary Min-Stack: Maintain a parallel stack storing previous minimums. When pushing $x \le \text{min}$, push to `minStack`. When popping $x == \text{min}$, pop from `minStack` in $O(1)$ time and space proportional only to new minimums.
> * **Production Reality:** Sliding window minimum queues and low-latency audio DSP buffering.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 3.2), we are asked:

*"How would you design a stack which, in addition to push and pop, has a function min which returns the minimum element? Push, pop, and min should all operate in O(1) time."*

## 2. Why Scanning Fails & The Auxiliary Min-Stack Design

Scanning the stack on every `min()` call takes $O(N)$ time. Storing the minimum inside every single node takes $O(N)$ extra memory.

*Optimal Design:* Maintain a secondary `minStack` that only pushes a value when it is less than or equal to the current minimum. Because minimums change infrequently, space consumption on the second stack is minimal.

## Implementación en producción

```java
import java.util.Stack;

public class StackWithMin extends Stack<Integer> {
    private final Stack<Integer> minStack = new Stack<>();

    public void push(int value) {
        if (value <= min()) {
            minStack.push(value);
        }
        super.push(value);
    }

    public Integer pop() {
        int value = super.pop();
        if (value == min()) {
            minStack.pop();
        }
        return value;
    }

    public int min() {
        if (minStack.isEmpty()) {
            return Integer.MAX_VALUE;
        } else {
            return minStack.peek();
        }
    }
}
```

## Análisis de complejidad y memoria

| Métrica | Complejidad | Detalle técnico |
|---|---|---|
| push(x) Time | `O(1)` | Direct array push + conditional minStack push. |
| pop() Time | `O(1)` | Direct array pop + conditional minStack pop. |
| min() Time | `O(1)` | Instant peek at minStack top. |
| Auxiliary Space | `O(M)` | Space proportional to number of descending minimums (M <= N). |

## Discusión de ingeniería de sistemas en el mundo real

Audio Digital Signal Processing (DSP) filters and sliding-window financial order book monitors use dual-stack min/max queues to calculate rolling moving minima in constant time.

## Casos límite y robustez en producción

1. Duplicate minimums pushed (`push(2), push(2)`): Both pushed to minStack to avoid premature eviction.
2. Empty stack min(): Returns Integer.MAX_VALUE.
