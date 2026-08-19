---
title: "Recursive Multiply: Product by Double and Halve (Java)"
description: "CTCI-style problem 8.5 for beginners: multiply two positive ints without * or /. Recurse on half the smaller factor, double the half-product, add once when odd. Plain Java."
date: "2025-12-29"
tags: [Algorithms]
coverImage: /assets/images/ctci-8-5-recursive-multiply.webp
previewImage: /assets/images/ctci-8-5-recursive-multiply.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 8.5 for beginners: multiply two positive ints without * or /. Recurse on half the smaller factor, double the half-product, add once when odd. Plain Java.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

Multiplication is repeated addition, but adding `a` to itself `b` times is slow when both numbers are large. You can do better with **halve and double**: cut the smaller factor in half, solve the smaller problem, then double the answer (and add the larger factor once when the smaller one was odd). No `*`, no `/`. Only `+`, `-`, and bit shifts if you want them.

This post is original teaching for beginners in **Java**. Same problem family as classic interview recursion questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 8, recursion and dynamic programming, problem 8.5.

---

## 1. Everyday analogy

Picture a parking lot that is `rows` by `cols`. You need the total number of spots without multiplying the two sides.

* Count every spot one by one. That works. It also takes forever if the lot is huge.
* Better: count half the rows, then **double** that count (add the half-count to itself). You just did twice the work of a half-size lot.
* If the row count is odd, half the rows plus half the rows is still one short. Add one more full row of spots at the end.

Same idea for numbers. `7 * 8` is "seven eights." Compute `3 * 8`, double it to get six eights, then add one more eight because 7 is odd: `3*8 + 3*8 + 8`.

Halving shrinks the work. Doubling rebuilds the product. Odd leftovers need one extra add of the bigger factor.

---

## 2. Plain problem statement

**Input:** two positive integers `a` and `b` (interviews sometimes allow 0; treat it as a free base case).

**Output:** the product `a * b`.

**Constraints for the exercise:**

* Do **not** use the `*` operator (or `/` for dividing by two if the interviewer bans it).
* You **may** use `+`, `-`, and bit shifts (`<<`, `>>`).
* Minimize how many of those operations you need (log-scale work beats linear work).

**Examples:**

| a | b | Product | Idea |
| --- | --- | --- | --- |
| 7 | 8 | 56 | half of 7 is 3; `3*8=24`; double to 48; add 8 → 56 |
| 8 | 7 | 56 | swap so smaller is 7; same path |
| 5 | 5 | 25 | half of 5 is 2; `2*5=10`; double to 20; add 5 → 25 |
| 1 | 99 | 99 | base case: smaller is 1 |
| 0 | 40 | 0 | base case: smaller is 0 |
| 16 | 3 | 48 | smaller 3 is odd; half is 1; double 3 and add 3 |

**Clarify before coding:**

* Positive only, or zeros and negatives too? Stick to non-negative here. Negatives are sign bookkeeping on top of the same core.
* Overflow? `int` product can overflow for large inputs. Mention `long` if values can exceed 2³¹-1.
* Is `<< 1` allowed as double? Yes. `a + a` is fine too and sometimes clearer on a whiteboard.
* Is `>> 1` allowed as half? Yes. `(smaller - (smaller & 1)) / 2` is the no-divide story if `/` is banned; interviewers almost always accept `>> 1`.

---

## 3. Think first

### Naive: add smaller times

```
product = 0
repeat smaller times:
    product += bigger
```

Correct. Time is O(smaller). Fine for tiny numbers. Weak when smaller is a million.

### Insight: product of half, then double

If `smaller` is even:

```
smaller * bigger = 2 * ((smaller / 2) * bigger)
```

If `smaller` is odd:

```
smaller * bigger = 2 * ((smaller / 2) * bigger) + bigger
```

Because `2 * floor(smaller/2) + 1 = smaller` when smaller is odd.

So you only need **one** recursive call on `smaller >> 1`, not two independent halves.

### Why not recurse on both halves when odd?

An early recursive sketch sometimes does:

```
side1 = minProduct(smaller >> 1, bigger)
side2 = minProduct(smaller - (smaller >> 1), bigger)  // when odd
return side1 + side2
```

When `smaller` is odd, `smaller - (smaller >> 1)` is not equal to `smaller >> 1`. You fire two recursive trees. Work duplicates and the call graph fans out. Memoizing that version fixes the duplicate work, but the cleaner formula already avoids the second tree: double the half-product and add `bigger` once.

### Always recurse on the smaller factor

`3 * 1000000` with the naive loop would add a million times if you picked the wrong side. Swap so `smaller` is min(a, b) and `bigger` is max(a, b). Depth becomes O(log min(a, b)).

### Trace: 7 × 8

```
minProduct(7, 8)
  half = 3
  halfProd = minProduct(3, 8)
    half = 1
    halfProd = minProduct(1, 8) = 8
    3 is odd → 8 + 8 + 8 = 24
  7 is odd → 24 + 24 + 8 = 56
```

Three recursive steps. The naive loop would have added 8 seven times.

### Trace: 16 × 3 (after swap: smaller = 3)

```
minProduct(3, 16)
  halfProd = minProduct(1, 16) = 16
  3 is odd → 16 + 16 + 16 = 48
```

---

## 4. Java solution

Preferred interview version: one recursive call, double by adding the half-product to itself, add `bigger` when odd.

```java
/**
 * Multiply two non-negative ints without using * or /.
 * Recurses on half the smaller factor: O(log min(a, b)) adds.
 */
public static int minProduct(int a, int b) {
    int bigger = a < b ? b : a;
    int smaller = a < b ? a : b;
    return minProductHelper(smaller, bigger);
}

private static int minProductHelper(int smaller, int bigger) {
    if (smaller == 0) {
        return 0;
    }
    if (smaller == 1) {
        return bigger;
    }

    int half = smaller >> 1; // floor divide by 2
    int halfProd = minProductHelper(half, bigger);

    if ((smaller & 1) == 0) {
        // even: 2 * half * bigger
        return halfProd + halfProd;
    } else {
        // odd: 2 * floor(smaller/2) * bigger + bigger
        return halfProd + halfProd + bigger;
    }
}
```

### Optional: double with a shift

```java
// same meaning as halfProd + halfProd when halfProd >= 0
return halfProd << 1;
// odd case:
return (halfProd << 1) + bigger;
```

Shifts look clever. `halfProd + halfProd` is harder to mess up under interview stress and makes the "double" story obvious. Either is fine if you explain it.

### Weaker version people write first (know it, then improve)

```java
// Linear: O(smaller) additions. Say it, then replace it.
private static int minProductNaive(int smaller, int bigger) {
    int sum = 0;
    for (int i = 0; i < smaller; i++) {
        sum += bigger;
    }
    return sum;
}
```

Interviewers like hearing the O(s) answer first, then the log version.

### Walkthrough table: 7 × 8

| Call | half | halfProd | smaller parity | return |
| --- | --- | --- | --- | --- |
| helper(7, 8) | 3 | helper(3, 8) → 24 | odd | 24+24+8 = 56 |
| helper(3, 8) | 1 | helper(1, 8) → 8 | odd | 8+8+8 = 24 |
| helper(1, 8) | - | - | base | 8 |

### Minimal smoke tests

```java
public static void main(String[] args) {
    System.out.println(minProduct(7, 8));   // 56
    System.out.println(minProduct(8, 7));   // 56
    System.out.println(minProduct(5, 5));   // 25
    System.out.println(minProduct(1, 99));  // 99
    System.out.println(minProduct(0, 40));  // 0
    System.out.println(minProduct(16, 3));  // 48
    System.out.println(minProduct(2, 2));   // 4
}
```

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Add `bigger`, `smaller` times | O(s) | O(1) | correct baseline |
| Two recursive halves when odd | ~O(s) worst without memo | O(log s) stack | duplicates work |
| Two halves + memo array | O(s) fills possible | O(s) memo + stack | better, still not best story |
| One half call, double, +bigger if odd | O(log s) | O(log s) stack | preferred |

Here `s = min(a, b)`. The preferred path halves `s` every call, so depth and number of adds are logarithmic in `s`.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Zero** → `0 * x = 0`. Hit the base case. Do not enter a loop that adds forever.
* **One** → return the other factor immediately.
* **Both equal** → still works; swap is a no-op when `a == b`.
* **Power of two smaller** → pure doubling path, never takes the odd branch after the first halvings (for example 8 × 7 becomes smaller 7, not smaller 8, if you always take min; if inputs arrive as 8 and 9, smaller 8 is all even halvings down to 1).
* **Large product** → `int` overflow is real for big factors. Say you would use `long` for production math.
* **Negatives** → problem statement usually says positive. If asked, strip signs, multiply absolutes, reapply sign. Still no `*`.

Common mistakes:

1. **Forgetting to put the smaller factor first.** You still get the right product, but recursion depth follows the larger number.
2. **Two recursive calls on odd without memo.** Works, slow, hard to analyze cleanly. Prefer double + add.
3. **Using `smaller % 2` when bit ops are the theme.** Fine, but `(smaller & 1) == 0` matches the "bits allowed" story.
4. **Dividing with `/ 2` after the interviewer banned `/`.** Use `>> 1` and say so.
5. **Returning `halfProd << 1` on negative halfProd.** Not an issue for non-negative inputs; still prefer `+` if signs might appear later.
6. **Mutating globals or building a full grid of cells.** The grid is a teaching picture, not the data structure you allocate.

---

## 7. Explain to a friend recap

Recursive Multiply asks: product of two non-negative ints without `*` or `/`, with as few adds as you can manage.

1. Multiplication is repeated addition. Adding `s` times is the honest baseline.
2. Always recurse on the **smaller** factor so work tracks `min(a, b)`.
3. Compute `halfProd = product(floor(s/2), bigger)` once.
4. If `s` is even, answer is `halfProd + halfProd`. If odd, add `bigger` once more.
5. Base cases: `0 → 0`, `1 → bigger`. Time O(log s), stack O(log s).

If you can walk `7 × 8` down to 56 on a whiteboard and explain why one recursive call beats two half-products, you own problem 8.5.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Power Set](/blog/en/ctci-8-4-power-set)
* Next: [Towers of Hanoi](/blog/en/ctci-8-6-towers-of-hanoi)