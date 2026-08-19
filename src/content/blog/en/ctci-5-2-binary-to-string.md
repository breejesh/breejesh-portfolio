---
title: "Binary to String: Print a Fraction as Bits or ERROR (Java)"
description: "CTCI-style problem 5.2 for beginners: take a double in (0, 1), print its binary fraction string, or ERROR if it needs more than 32 bits after the point. Multiply-by-2 method in plain Java."
date: "2026-04-16"
tags: [Algorithms]
coverImage: /assets/images/ctci-5-2-binary-to-string.webp
previewImage: /assets/images/ctci-5-2-binary-to-string.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 5.2 for beginners: take a double in (0, 1), print its binary fraction string, or ERROR if it needs more than 32 bits after the point. Multiply-by-2 method in plain Java.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

You have a measuring cup marked only in halves, quarters, eighths, and so on. Someone pours a bit of water: more than empty, less than full. You want to write how full it is using only 0 and 1 after a binary point: `0.101` means half plus an eighth. Some amounts fit in a short binary string. Others keep needing smaller marks forever. If you run out of space after 32 marks, you stop and say ERROR. That is **binary to string** for a real number between 0 and 1.

This post is original teaching for beginners in **Java**. Same problem family as classic interview bit questions on fractional doubles, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 5, bit manipulation, problem 5.2.

---

## 1. Everyday analogy

Think of binary fractions the same way you think of decimal fractions, just with base 2.

In decimal, `0.75` means:

```
7 * (1/10) + 5 * (1/100)
```

In binary, `0.11` means:

```
1 * (1/2) + 1 * (1/4) = 0.75
```

So each place after the binary point is half the weight of the place before it: 1/2, 1/4, 1/8, 1/16, ...

How do you discover those bits without guessing? A common school trick for decimal is multiply by 10 and peel off the next digit. Here you **multiply by 2** and peel off the next bit:

1. Start with `num` in (0, 1).
2. `num = num * 2`.
3. If the result is at least 1, the next bit is `1`, and you subtract 1 to keep only the fractional part.
4. If the result is still less than 1, the next bit is `0`.
5. Repeat until the fraction is exactly 0 (done) or you already wrote 32 bits and still have leftover (ERROR).

Why this works: multiplying by 2 shifts the binary point one place left. The integer bit that pops out is exactly the next binary digit after the point.

---

## 2. Plain problem statement

**Input:** a `double num` with `0 < num < 1` (strictly between 0 and 1).

**Output:** a `String` that looks like `"0."` followed by binary digits, for example `"0.101"`. If the value cannot be represented **exactly** with at most **32** characters after the binary point (interview wording often says "32 characters" for the bit string budget; in code we cap the bits after the point at 32), return `"ERROR"`.

**Examples:**

| Input (decimal) | Binary string | Why |
| --- | --- | --- |
| `0.5` | `"0.1"` | one half |
| `0.25` | `"0.01"` | one quarter |
| `0.75` | `"0.11"` | half + quarter |
| `0.625` | `"0.101"` | half + eighth |
| `0.1` | `"ERROR"` | 0.1 is recurring in binary; it will not hit exactly 0 within 32 bits |
| `0.0` or `1.0` | out of range | problem assumes strictly between 0 and 1 |

**Clarify before coding:**

* Is 0 or 1 allowed? (Classic statement: between 0 and 1, not including the ends.)
* Do we return the string or print it? (Either; return is easier to test.)
* Is the length limit 32 bits after the point, or 32 characters total including `"0."`? (Say both out loud. This article uses **32 bits after the point**, which is the usual coding intent.)
* Floating-point noise: real `double` values are already binary. Interviewers still want the multiply-by-2 loop and the ERROR path for non-terminating cases.

For this article: `double` in (0, 1), return `"0." + bits` or `"ERROR"`, max 32 bits after the point.

---

## 3. Think first

### What not to do

* Call `Integer.toBinaryString` on the whole double. That is for integers, not fractional parts.
* Print `Double.toHexString` or scientific notation. Wrong format.
* Assume every decimal fraction has a short binary form. Many do not. `0.1` in decimal is the classic counterexample, like `1/3 = 0.333...` in decimal.

### Core loop: multiply by 2

```
builder = "0."
while num > 0:
    if builder length (bits after point) already 32:
        return ERROR
    num = num * 2
    if num >= 1:
        append '1'
        num = num - 1
    else:
        append '0'
return builder
```

Stop when `num` becomes 0: you represented it exactly.

If you would need a 33rd bit, return ERROR.

### Why some numbers never finish

Any fraction whose denominator (in lowest terms) has a prime factor other than 2 cannot be a finite binary expansion. Decimal `0.1` is `1/10`. Ten has a factor of 5, so the binary expansion of 0.1 repeats. Your loop keeps producing bits and never lands on exactly 0. After 32 steps you correctly give up.

### Floating point caveat (say it once, then move on)

A Java `double` is already stored in binary IEEE-754 form. So "print the binary of this double" can also mean "read the mantissa bits." Interview 5.2 is usually the **algorithmic** version: pretend you are expanding the real number with multiply-by-2, and ERROR if it will not terminate in 32 bits. Use a comparison to 0 carefully; for teaching we use the simple loop. In production you might also bound with an epsilon, but interviews want the clean ERROR rule.

---

## 4. Java solution

```java
/**
 * Binary representation of a real number strictly between 0 and 1.
 * Returns "0." followed by bits, or "ERROR" if more than 32 bits are needed.
 */
String binaryToString(double num) {
    if (num <= 0 || num >= 1) {
        return "ERROR";
    }

    StringBuilder bits = new StringBuilder("0.");
    int maxBits = 32;

    while (num > 0) {
        if (bits.length() - 2 >= maxBits) {
            // Already used 32 places after the point and still not zero.
            return "ERROR";
        }

        num = num * 2;
        if (num >= 1) {
            bits.append('1');
            num = num - 1;
        } else {
            bits.append('0');
        }
    }

    return bits.toString();
}
```

### Walkthrough: `0.625`

| Step | `num` before | after `* 2` | bit | `num` after |
| --- | --- | --- | --- | --- |
| 1 | 0.625 | 1.25 | `1` | 0.25 |
| 2 | 0.25 | 0.5 | `0` | 0.5 |
| 3 | 0.5 | 1.0 | `1` | 0.0 |

Result: `"0.101"`. Loop ends because `num` is 0.

### Walkthrough: `0.1` (will ERROR)

| Step | idea |
| --- | --- |
| 1 | `0.1 * 2 = 0.2` → bit `0` |
| 2 | `0.2 * 2 = 0.4` → bit `0` |
| 3 | `0.4 * 2 = 0.8` → bit `0` |
| 4 | `0.8 * 2 = 1.6` → bit `1`, remainder `0.6` |
| ... | bits keep coming; remainder never lands on exact 0 within 32 steps |

After 32 bits after the point, return `"ERROR"`.

### Minimal smoke tests

```java
public static void main(String[] args) {
    System.out.println(binaryToString(0.5));    // 0.1
    System.out.println(binaryToString(0.25));   // 0.01
    System.out.println(binaryToString(0.75));   // 0.11
    System.out.println(binaryToString(0.625));  // 0.101
    System.out.println(binaryToString(0.1));    // ERROR
    System.out.println(binaryToString(0.0));    // ERROR (out of range here)
    System.out.println(binaryToString(1.0));    // ERROR
}
```

Note: on some JVMs, a literal like `0.1` already has floating-point rounding baked in. The loop still fails to clear to exact 0 within 32 bits for typical values that are not dyadic rationals (fractions with denominator a power of 2). That is what you want for the ERROR path.

---

## 5. Complexity table

| Approach | Time | Extra space | Notes |
| --- | --- | --- | --- |
| Multiply-by-2 loop | O(1) | O(1) | At most 32 iterations; string of length ≤ 34 (`"0."` + 32 bits) |
| Precompute all dyadic fractions | O(1) or worse | larger | Overkill; interviewers want the loop |
| Bit-twiddle IEEE mantissa | O(1) | O(1) | Different problem: dump stored bits, not "ERROR if not exact in 32" |

Bounded by 32 steps, so time and space are constant for interview purposes.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Exactly 0 or 1** → treat as invalid for this problem, return ERROR or reject up front.
* **Exactly 0.5, 0.25, 0.125, ...** → finite binary; should print cleanly and stop.
* **32nd bit still needed leftover** → ERROR. Off-by-one on the length check is common.
* **Comparing with `== 0` forever** → for true non-dyadic fractions you rely on the length cap. Do not spin forever.
* **Forgetting `"0."` prefix** → format matters in interviews.
* **Using integer cast instead of `>= 1`** → `(int) num` after multiply works when num is in [0, 2), but `>= 1` is clearer.
* **Appending bits into a fixed char[32] without counting** → easy to overflow the mental limit.

Common mistakes:

1. **Length check after appending, not before.** You might emit 33 bits once. Check before each new bit (or after, with `> 32`, consistently).
2. **`num *= 2` then always subtract 1.** Only subtract when the bit is 1.
3. **Infinite loop with no max length.** The whole point of ERROR is the 32-bit budget.
4. **Confusing character budget with bit budget.** Agree on the rule before coding.
5. **Thinking ERROR means "bad input only".** ERROR also means "cannot represent exactly in 32 bits."

---

## 7. Explain to a friend recap

Binary to String asks: write a double between 0 and 1 as `"0."` plus binary digits, or ERROR if it will not fit in 32 bits after the point.

1. Each bit is the next place value: 1/2, 1/4, 1/8, ...
2. Multiply the fraction by 2. The integer part (0 or 1) is the next bit. Keep the fractional remainder.
3. Stop when the remainder is 0: exact representation.
4. If you need more than 32 bits, return `"ERROR"`.
5. Many everyday decimals (like 0.1) never terminate in binary. The cap is not optional.

If you can walk `0.625 → 0.101` on a whiteboard and explain why `0.1` hits ERROR, you own problem 5.2.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Insertion](/blog/en/ctci-5-1-insertion)
* Next: [Flip Bit to Win](/blog/en/ctci-5-3-flip-bit-to-win)