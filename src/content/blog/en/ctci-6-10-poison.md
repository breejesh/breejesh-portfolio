---
title: "Poison: Finding the Poisoned Bottle in Minimum Days using Binary Encoding (CTCI 6.10)"
description: "Design an optimal testing scheme using 10 test strips and binary representation to identify 1 poisoned bottle out of 1000 in exactly 7 days."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-6-10-poison.webp
previewImage: /assets/images/ctci-6-10-poison.webp
---

> **TL;DR**
> * **The Book Problem:** You have 1000 bottles of soda, and exactly one is poisoned. You have 10 test strips which can be used to detect poison. A single drop of poison turns a strip positive. You can put any number of drops on a strip simultaneously. Results take 7 days. How do you find the poisoned bottle in as few days as possible?
> * **The Optimal Solution:** **Binary Representation Encoding (7 Days / 1 Round)**: Number the bottles 0 to 999. Because $2^{10} = 1024 > 1000$, each bottle index can be uniquely represented with 10 binary bits ($b_9 b_8 \dots b_0$). On Day 0, place a drop from bottle $k$ onto test strip $i$ if and only if the $i$-th bit of $k$ is `1`. On Day 7, the subset of positive test strips directly forms the 10-bit binary index of the poisoned bottle in exactly **7 days** with zero ambiguity.
> * **Production Reality:** Group testing in medical epidemiology (Dorfman pooling), genomic variant multiplexed screening, and fault isolation in high-throughput network fabrics.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 6.10), we are asked:

*"You have 1000 bottles of soda, and exactly one is poisoned. You have 10 test strips which can be used to detect poison. A single drop of poison will turn the test strip positive. You can put any number of drops on a test strip at once, and you can reuse a test strip as many times as you'd like (as long as the results are negative). However, you can only run tests once per day and it takes 7 days to return a result. How'd you figure out the poisoned bottle in as few days as possible?"*

## 2. Binary Digit Assignment (1-Round Optimal Solution)

1. **Information Capacity:**
   * 10 binary test strips have $2^{10} = 1024$ possible state outcomes (each strip is either positive or negative).
   * Since $1024 \ge 1000$, a single parallel testing round is sufficient.
2. **Drop Allocation Protocol (Day 0):**
   * Express every bottle ID $k \in [0, 999]$ as a 10-bit binary integer:
     $$k = \sum_{i=0}^9 b_i \cdot 2^i, \quad b_i \in \{0, 1\}$$
   * For each bottle $k$, if bit $b_i == 1$, add a drop of bottle $k$ onto test strip $i$.
3. **Result Reading (Day 7):**
   * On Day 7, inspect all 10 strips.
   * Construct the binary number $P$:
     $$P = \sum_{i=0}^9 (\text{strip}[i]\text{.isPositive}() \ ? \ 1 : 0) \cdot 2^i$$
   * $P$ is the exact ID of the poisoned bottle.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.List;

public class PoisonDetection {
    public static class TestStrip {
        public static final int DAYS_FOR_RESULT = 7;
        private final int id;
        private final List<Integer> drops = new ArrayList<>();

        public TestStrip(int id) { this.id = id; }
        public int getId() { return id; }

        public void addDropOnDay(int day, int bottleId) {
            drops.add(bottleId);
        }

        public boolean isPositiveOnDay(int day, int poisonedBottleId) {
            return drops.contains(poisonedBottleId);
        }
    }

    /**
     * Identifies the poisoned bottle in a single 7-day round using binary encoding.
     * Time Complexity: O(B * log S) where B = 1000 bottles, S = 10 strips
     * Space Complexity: O(B * log S)
     */
    public static int findPoisonedBottle(int poisonedBottleId, int totalBottles, int totalStrips) {
        List<TestStrip> strips = new ArrayList<>();
        for (int i = 0; i < totalStrips; i++) {
            strips.add(new TestStrip(i));
        }

        // Day 0: Add drops based on binary bits
        for (int bottle = 0; bottle < totalBottles; bottle++) {
            for (int bit = 0; bit < totalStrips; bit++) {
                if (((bottle >> bit) & 1) == 1) {
                    strips.get(bit).addDropOnDay(0, bottle);
                }
            }
        }

        // Day 7: Decode positive strips into the binary integer
        int resultBottleId = 0;
        for (int bit = 0; bit < totalStrips; bit++) {
            if (strips.get(bit).isPositiveOnDay(7, poisonedBottleId)) {
                resultBottleId |= (1 << bit);
            }
        }

        return resultBottleId;
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Latency | `7 Days` | Minimal physical turnaround time (single testing wave). |
| Strip Drops | $O(N \log S)$ | At most 500 drops per strip. |
| Auxiliary Space | `O(S)` | 10 boolean outcomes in memory. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Multiplexed Group Testing

1. **Epidemiological Batch Testing (Dorfman Pooling):** Lab testing pooling multiple blood/saliva samples into logarithmically fewer PCR tests during epidemics.
2. **Network Switch Diagnostic Probes:** Traces bad optical lanes by sending multiplexed packet headers across striped link aggregation groups (LAG).

## Edge Cases & Production Hardening

1. **Bottle 0 (All zero bits):** None of the test strips turn positive; correctly decodes to index 0.
2. **Multi-round trade-offs:** Sequential tests can reduce the number of strips needed if days are not constrained (e.g. base-4 digit grouping for 2 rounds).
