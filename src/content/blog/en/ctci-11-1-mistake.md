---
title: "Mistake: Debugging an Unsigned Loop Bug in C/C++ (CTCI 11.1)"
description: "CTCI problem 11.1 in C: find the flaw in an unsigned integer countdown loop causing an infinite loop underflow bug."
date: "2025-12-20"
tags: [Algorithms & Data Structures, Development]
coverImage: /assets/images/ctci-11-1-mistake.webp
previewImage: /assets/images/ctci-11-1-mistake.webp
---

> **TL;DR**
> * **The Bug:** An unsigned integer countdown loop with condition `i >= 0` never terminates because unsigned integers can never be negative.
> * **The Fix:** Use a signed integer (`int`), change the termination condition, or loop strictly while `i > 0` with offset indexing.
> * **Complexity:** $O(1)$ Space, $O(N)$ execution time.

You write a quick countdown loop in C. It looks harmless. You compile, run, and your terminal hangs with CPU pinned at 100%.

```c
void printCountdown() {
    unsigned int i;
    for (i = 100; i >= 0; --i) {
        printf("%d\n", i);
    }
}
```

---

## 1. Why the Bug Happens

An `unsigned int` represents non-negative numbers ($0$ to $2^{32}-1$).

When `i` reaches `0` and decrements via `--i`, it does not become `-1`. It **underflows** to `UINT_MAX` (`4,294,967,295`). Because `4294967295 >= 0` is `true`, the condition `i >= 0` is always satisfied, creating an infinite loop.

---

## 2. Three Clean Fixes

### Option 1: Use a signed integer (Recommended)
```c
void printCountdownSigned() {
    for (int i = 100; i >= 0; --i) {
        printf("%d\n", i);
    }
}
```

### Option 2: Strictly positive loop with post-decrement
```c
void printCountdownUnsigned() {
    for (unsigned int i = 100; i > 0; --i) {
        printf("%u\n", i);
    }
    printf("0\n");
}
```

### Option 3: Loop while size_t is positive
```c
void printCountdownIdiomatic() {
    unsigned int i = 100;
    do {
        printf("%u\n", i);
    } while (i-- > 0);
}
```

---

## 3. Production Takeaway

Never use `unsigned int` simply to communicate that a value should be positive, unless you explicitly need modular wrap-around arithmetic or bitwise masking. In loop counters, unsigned variables are a common source of off-by-one infinite loops.
