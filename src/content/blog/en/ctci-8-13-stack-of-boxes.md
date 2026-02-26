---
title: "Stack of Boxes: Tallest Strictly Decreasing Stack (Java)"
description: "CTCI-style problem 8.13 for beginners: stack boxes only when width, depth, and height are all strictly smaller. Sort one dimension, then DP with memo for the max total height."
date: "2026-02-26"
tags: [Algorithms]
coverImage: /assets/images/ctci-8-13-stack-of-boxes.webp
previewImage: /assets/images/ctci-8-13-stack-of-boxes.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 8.13 for beginners: stack boxes only when width, depth, and height are all strictly smaller. Sort one dimension, then DP with memo for the max total height.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

You have a pile of shipping boxes on the floor. Each box is a solid rectangle: width, depth, height. You want the tallest tower you can build, but the rule is harsh. A box may sit on another only if it is **strictly smaller in every dimension**: width, depth, and height. No tipping, no rotating mid-stack, no "close enough". That is **Stack of Boxes**.

This post is original teaching for beginners in **Java**. Same problem family as classic interview recursion and DP questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 8, recursion and dynamic programming, problem 8.13.

---

## 1. Everyday analogy

Think of stacking **matryoshka-style crates**, except all three axes must shrink, not just one.

* The crate on top must be narrower, shallower, and shorter than the one under it.
* You do not have to use every crate. Skip the ones that block a taller tower.
* Height of the tower is the **sum of the heights** of the crates you keep, not the count of crates.

If box A is `4 x 5 x 6` and box B is `3 x 4 x 5`, B can sit on A (all three sides smaller). If B is `3 x 6 x 5`, depth fails, so B cannot sit on A.

The puzzle is combinatorial: for each box, decide whether it is in the stack, and where. Brute force over subsets explodes. Sorting plus memoized recursion (or bottom-up DP) brings it back to something you can write on a whiteboard.

---

## 2. Plain problem statement

**Input:** a list of `n` boxes. Each box has positive integers `width`, `height`, `depth`.

**Output:** the maximum total height of a stack where every upper box is **strictly smaller** in width, depth, and height than the box below it.

**Rules:**

* Strict inequality on **all three** dimensions for every adjacent pair in the stack.
* You may leave boxes out of the stack.
* Order of the input list does not define stack order; you choose the order.
* Boxes are not rotated in this version (each box keeps its given width, height, depth). Say so in the interview if the prompt allows rotations.
* Height of the stack is the sum of `height` fields of chosen boxes.

**Box shape we use:**

```java
class Box {
    int width;
    int height;
    int depth;

    Box(int width, int height, int depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
    }

    /** True if this box can sit strictly above 'below'. */
    boolean canBeAbove(Box below) {
        return this.width < below.width
            && this.height < below.height
            && this.depth < below.depth;
    }
}
```

**Examples:**

| Boxes (w, h, d) | Max height | Why |
| --- | --- | --- |
| `(4,6,7), (1,2,3), (4,5,6), (10,12,32)` | `20` | stack bottom `10x12x32` then `4x6x7` then `1x2x3` → heights `12+6+2`. Path via `4x5x6` is `12+5+2=19` |
| one box `(2,3,4)` | `3` | only choice is that box |
| empty list | `0` | nothing to stack |
| all equal sizes | height of tallest single box | none can sit on another |
| already nested chain of 3 | sum of three heights | one valid total order |

Clarify the classic sample carefully in the room. A common teaching set is:

```
(4, 6, 7), (1, 2, 3), (4, 5, 6), (10, 12, 32)
```

One valid tall stack uses the large box, then a mid box that fits, then the small one. Walk the numbers so you and the interviewer agree on the answer before coding.

**Clarify before coding:**

* Rotations allowed? (Usually no unless stated.)
* Strict or non-strict? (Strict: `<` on all three.)
* Duplicate sizes? (Equal dims cannot stack; pick at most one from a tied pair unless dims differ elsewhere.)
* Return only the height, or also the sequence of boxes? (Height only here.)
* Negative or zero dims? (Reject or assume positive.)

---

## 3. Think first

### Why pure subset search fails

For each box you either skip it or place it somewhere in a stack. Checking all subsets and all orders is exponential. You need structure.

### Observation: sort one dimension

Sort boxes by **height descending** (largest height first). Then a valid stack tends to walk from larger boxes toward smaller ones in that list order. Sorting alone does not guarantee validity: width and depth can still disagree. But it gives a natural left-to-right scan: once you pick a bottom, candidates that can sit above it appear later in the list if you also sort carefully, or you still scan all remaining boxes and call `canBeAbove`.

Many solutions sort by height descending and, for bottom index `i`, only try boxes with index `j > i`. That is correct **if** height is sorted descending and `canBeAbove` requires `height` strictly smaller: any box that could sit above bottom must have smaller height, so it appears after `i`. Width and depth are still checked in `canBeAbove`.

### Recursion with memo (interview story)

Define:

```
maxHeightAbove(bottomIndex) =
  bottom.height
  + max over j that can sit on bottom of maxHeightAbove(j)
  (or just bottom.height if no j works)
```

Also try every box as a possible bottom of a full stack, take the global max. Memoize on `bottomIndex` so each box as bottom is solved once.

That is the same shape as "longest chain of pairs" or a 3D version of longest increasing subsequence.

### Bottom-up DP (LIS style)

1. Sort boxes (for example by height ascending).
2. Let `dp[i]` = max stack height with box `i` on **top** (or on bottom; pick one convention and stick to it).
3. For each `i`, scan all `j` that can legally sit under `i` (or above, matching your convention) and take `dp[i] = box[i].height + max(dp[j])`.
4. Answer is `max(dp[i])`.

Time O(n²) either way. Space O(n) for the memo or `dp` array.

### Choice for the post

We ship the **sort + recursive memo** version first (clear story: "tallest stack with this box at the bottom"), then a short bottom-up twin.

---

## 4. Java solution

### Primary: sort + memoized recursion

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

class Box {
    int width;
    int height;
    int depth;

    Box(int width, int height, int depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
    }

    boolean canBeAbove(Box below) {
        return this.width < below.width
            && this.height < below.height
            && this.depth < below.depth;
    }
}

int stackOfBoxes(List<Box> input) {
    if (input == null || input.isEmpty()) {
        return 0;
    }

    Box[] boxes = input.toArray(new Box[0]);
    // tallest first so candidates above a bottom tend to appear later
    Arrays.sort(boxes, Comparator.comparingInt((Box b) -> b.height).reversed());

    int[] memo = new int[boxes.length]; // 0 means unset; heights are positive
    int best = 0;
    for (int i = 0; i < boxes.length; i++) {
        best = Math.max(best, maxHeightWithBottom(boxes, i, memo));
    }
    return best;
}

/** Max stack height when boxes[bottomIndex] is the bottom box of the stack. */
int maxHeightWithBottom(Box[] boxes, int bottomIndex, int[] memo) {
    if (memo[bottomIndex] > 0) {
        return memo[bottomIndex];
    }

    Box bottom = boxes[bottomIndex];
    int bestAbove = 0;
    for (int i = bottomIndex + 1; i < boxes.length; i++) {
        if (boxes[i].canBeAbove(bottom)) {
            bestAbove = Math.max(bestAbove, maxHeightWithBottom(boxes, i, memo));
        }
    }

    memo[bottomIndex] = bottom.height + bestAbove;
    return memo[bottomIndex];
}
```

Walkthrough idea for four boxes sorted by height descending:

```
A (10, 12, 32)
B (4, 6, 7)
C (4, 5, 6)
D (1, 2, 3)
```

* With A at bottom: try B, C, D on top of A. B fits. Stack with B at bottom of the upper part continues to D. C may or may not fit on A (compare all dims). Take the best chain.
* With B at bottom: maybe D above B.
* Single-box stacks are the base when nothing fits above.

Memo means once you computed "best stack with B as bottom", you reuse it when A and others ask for that sub-result.

### Bottom-up twin (same complexity)

```java
int stackOfBoxesBottomUp(List<Box> input) {
    if (input == null || input.isEmpty()) {
        return 0;
    }

    Box[] boxes = input.toArray(new Box[0]);
    Arrays.sort(boxes, Comparator.comparingInt((Box b) -> b.height).reversed());

    int n = boxes.length;
    int[] dp = new int[n]; // max height with boxes[i] as bottom
    int best = 0;

    for (int i = n - 1; i >= 0; i--) {
        int bestAbove = 0;
        for (int j = i + 1; j < n; j++) {
            if (boxes[j].canBeAbove(boxes[i])) {
                bestAbove = Math.max(bestAbove, dp[j]);
            }
        }
        dp[i] = boxes[i].height + bestAbove;
        best = Math.max(best, dp[i]);
    }
    return best;
}
```

Same recurrence, filled from the end of the sorted array so "above" results already exist.

### Optional: track the actual stack

If the interviewer wants the sequence, store `parent[i]` or rebuild by replaying the choices that produced `dp[i]`. Height-only is enough for the base problem.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Subsets + permute | exponential | stack depth | Teaching only; do not ship |
| Sort + memo recursion | O(n²) | O(n) memo + O(n) stack | Clear interview answer |
| Sort + bottom-up DP | O(n²) | O(n) | Same idea, no recursion |
| Sort by one dim only, no full checks | wrong | - | Must check all three dims |

Sorting is O(n log n). The nested scans dominate at O(n²). For interview n (dozens to a few hundred boxes), that is fine.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Empty input** → 0.
* **Single box** → that box's height.
* **No box can sit on any other** → max of individual heights (not sum).
* **Already a perfect nested chain** → sum of all heights.
* **Equal dimensions on one axis** → cannot stack (`<` fails). Easy bug if someone uses `<=`.
* **Same height, different width/depth** → sorting by height alone puts them adjacent; `canBeAbove` still rejects when height is not strictly smaller.
* **Many boxes, only one tall chain** → memo still O(n²) but avoids redoing sub-stacks.
* **Rotations** → if allowed, generate up to 3 orientations per box (unique permutations of dims), then run the same DP. Say you are **not** doing that unless asked.

Common mistakes:

1. **Checking only one or two dimensions.** The rule is all three.
2. **Using `<=` instead of `<`.** Equal faces cannot stack under the strict rule.
3. **Forgetting to try every box as a possible bottom.** The global answer is the max over bottoms, not only `maxHeightWithBottom(0)`.
4. **Memo initialized wrong.** Using `0` as "unset" is safe when heights are positive. If zero-height boxes were allowed, use a separate boolean array or `Integer` nulls.
5. **Sorting and then assuming order alone is enough.** You still need `canBeAbove` for width and depth.
6. **Maximizing count of boxes instead of sum of heights.** A short fat stack of two tall boxes can beat five tiny ones.

Minimal smoke test:

```java
List<Box> boxes = new ArrayList<>();
boxes.add(new Box(4, 6, 7));
boxes.add(new Box(1, 2, 3));
boxes.add(new Box(4, 5, 6));
boxes.add(new Box(10, 12, 32));

System.out.println(stackOfBoxes(boxes)); // tallest valid sum of heights
System.out.println(stackOfBoxes(List.of())); // 0
System.out.println(stackOfBoxes(List.of(new Box(2, 3, 4)))); // 3
```

Compute the expected number by hand on the whiteboard with the interviewer so you both trust the printout.

---

## 7. Explain to a friend recap

Stack of Boxes asks: what is the tallest tower if each upper box must be strictly smaller in width, depth, and height?

1. Model a `Box` with `canBeAbove(below)`.
2. Sort by height descending so smaller-height candidates come later.
3. Define "max height with box i at the bottom" as `height[i]` plus the best valid stack on top of i.
4. Memoize that function (or fill `dp` bottom-up). Answer is the max over all bottoms.
5. Time O(n²). Watch strict inequalities and the "try every bottom" outer loop.

If you can sort, write `canBeAbove`, and explain why memo turns exponential search into O(n²), you own problem 8.13. Next up is boolean expression parenting, another DP on strings.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Eight Queens](/blog/en/ctci-8-12-eight-queens)
* Next: [Boolean Evaluation](/blog/en/ctci-8-14-boolean-evaluation)