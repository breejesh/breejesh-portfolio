---
title: "Mistake: Unsigned Integer Underflow and Infinite Loop Debugging (CTCI 11.1)"
description: "Diagnose and fix unsigned integer underflow and loop termination bugs in C/C++ systems programming with type-safety analysis."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-11-1-mistake.webp
previewImage: /assets/images/ctci-11-1-mistake.webp
---

> **TL;DR**
> * **The Book Problem:** Find the mistake(s) in the following code:
>   ```c
>   unsigned int i;
>   for (i = 100; i >= 0; --i)
>       printf("%d\n", i);
>   ```
> * **The Flaws & Root Causes:** (1) **Unsigned Underflow Loop Invariant**: An `unsigned int` is fundamentally non-negative ($i \ge 0$ is a tautology and always evaluates to `true`). When $i = 0$, `--i` causes modular underflow wrapping to `UINT_MAX` ($2^{32}-1 = 4,294,967,295$), creating an infinite loop; (2) **Format Specifier Mismatch**: `%d` expects a signed 32-bit integer rather than `%u` for unsigned values.
> * **The Optimal Solution:** Replace `unsigned int i` with signed `int i` (or use bounded loop predicates `for (int i = 100; i >= 0; --i)`).
> * **Production Reality:** Linux kernel vulnerability CVEs, avionics counter rollovers, and embedded C buffer overflow exploits.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 11.1), we are given the following C code snippet and asked to diagnose the software defects:

```c
unsigned int i;
for (i = 100; i >= 0; --i)
    printf("%d\n", i);
```

## 2. Deep Dive: The Arithmetic Mechanics of Unsigned Types

In C/C++ (C99 / C11 standard §6.2.5), arithmetic operations on unsigned integers are guaranteed to never overflow in a traditional hardware trap sense. Instead, they perform modular arithmetic modulo $2^W$:

$$\text{Result} = (\text{value}) \pmod{2^W}$$

When $i = 0$:
$$0 - 1 \equiv -1 \pmod{2^{32}} = 4,294,967,295\ (\text{UINT\_MAX})$$

Because $4,294,967,295 \ge 0$, the condition `i >= 0` never evaluates to `false`. The loop runs forever, emitting four billion numbers per cycle until process termination.

## Production Implementation

```c
#include <stdio.h>
#include <limits.h>

/**
 * Fix 1: Standard Signed Counter (Recommended)
 */
void printNumbersSigned(void) {
    for (int i = 100; i >= 0; --i) {
        printf("%d\n", i);
    }
}

/**
 * Fix 2: Unsigned Counter with Strict Positive Boundary
 */
void printNumbersUnsigned(void) {
    for (unsigned int i = 100; i > 0; --i) {
        printf("%u\n", i);
    }
    printf("%u\n", 0); // Explicitly handle zero
}

/**
 * Fix 3: Loop with Break Condition
 */
void printNumbersBreak(void) {
    for (unsigned int i = 100; ; --i) {
        printf("%u\n", i);
        if (i == 0) break;
    }
}
```

## Defect Matrix & Static Analysis

| Defect | Severity | Consequence | Compiler Warning |
|---|---|---|---|
| `unsigned int i >= 0` | Critical | Infinite Loop / Process Hang. | `-Wtype-limits` (GCC / Clang). |
| `%d` for `unsigned int` | Moderate | Undefined Behavior on large unsigned numbers. | `-Wformat` (GCC / Clang). |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Underflow Exploitation

1. **Linux Kernel Memory Allocation (CVE-2016-0728):** Unsigned 32-bit reference counter overflows triggered use-after-free privilege escalation in system keyring subsystems.
2. **Boeing 787 Generator Control Unit (FAA AD 2015-09-07):** Internal 32-bit unsigned 10ms timer overflowed after 248 days of continuous operation, forcing a fail-safe electric bus shutdown.

## Edge Cases & Production Hardening

1. **Compiler Optimization (`-O3`):** Modern compilers may eliminate `i >= 0` entirely, compiling the loop into an unconditional infinite `jmp` instruction.
2. **Static Analysis Rule:** Enable `-Wall -Wextra -Werror` in CI pipelines to turn unsigned tautological comparison warnings into hard build failures.
