---
title: "Final, Finally, and Finalize: Core Java Keywords and Lifecycle Mechanics (CTCI 13.3)"
description: "Differentiate final, finally, and finalize in Java, detailing immutability modifiers, guaranteed cleanup blocks, GC deprecation, and modern Cleaner alternatives."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-13-3-final-etc.webp
previewImage: /assets/images/ctci-13-3-final-etc.webp
---

> **TL;DR**
> * **The Book Problem:** What is the difference between `final`, `finally`, and `finalize` in Java?
> * **The Optimal Solution:** **Keyword Classification & Lifecycle Roles**: (1) **`final` (Keyword / Modifier)**: Applied to variables (makes value/reference binding immutable), methods (prevents overriding and enables JIT inlining), and classes (prevents subclassing, e.g., `java.lang.String`); (2) **`finally` (Control Flow Block)**: Guaranteed cleanup block attached to `try-catch` executed regardless of exceptions or returns; (3) **`finalize()` (GC Method)**: Legacy method on `java.lang.Object` invoked by the Garbage Collector before memory reclamation (**deprecated in Java 9, removed in Java 18+** due to unbounded latency, deadlocks, and resurrection security vulnerabilities; replaced by `AutoCloseable` and `java.lang.ref.Cleaner`).
> * **Production Reality:** Thread-safe immutable data classes in Java records, lock management via `try-with-resources`, and native memory deallocation via `Cleaner`.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 13.3), we are asked:

*"What is the difference between final, finally, and finalize in Java? Compare their syntactic roles, runtime guarantees, and modern JVM deprecations."*

## 2. Structural & Architectural Comparison

| Dimension | `final` | `finally` | `finalize()` |
|---|---|---|---|
| **Type** | Access Modifier / Keyword | Control Flow Keyword | Method on `java.lang.Object` |
| **Applies To** | Variables, Methods, Classes | `try-catch` blocks | Objects undergoing Garbage Collection |
| **Execution Trigger** | Compile-time checking + runtime enforcement | Synchronous control flow jump | Asynchronous Garbage Collector cycle |
| **Status in Modern Java** | Actively used everywhere | Standard cleanup block | **Deprecated & Removed** (Use `Cleaner` / `AutoCloseable`) |

## Production Implementation & Modern Patterns

```java
import java.lang.ref.Cleaner;

/**
 * 1. final: Immutable Class and Thread-Safe References
 */
public final class ImmutableSecurityToken {
    private final String tokenValue; // Reference cannot be reassigned
    private final long createdAtEpoch;

    public ImmutableSecurityToken(String token) {
        this.tokenValue = token;
        this.createdAtEpoch = System.currentTimeMillis();
    }

    // final method: cannot be overridden by any derived class
    public final String getTokenValue() {
        return tokenValue;
    }
}

/**
 * 2. finally & 3. Modern Cleaner (Replacement for finalize)
 */
public class NativeMemoryBuffer implements AutoCloseable {
    private static final Cleaner CLEANER = Cleaner.create();

    private static class State implements Runnable {
        private long nativeMemoryAddress;

        State(long address) {
            this.nativeMemoryAddress = address;
        }

        @Override
        public void run() {
            if (nativeMemoryAddress != 0) {
                System.out.println("Releasing native memory: " + nativeMemoryAddress);
                nativeMemoryAddress = 0;
            }
        }
    }

    private final State state;
    private final Cleaner.Cleanable cleanable;

    public NativeMemoryBuffer(long address) {
        this.state = new State(address);
        this.cleanable = CLEANER.register(this, state);
    }

    @Override
    public void close() {
        cleanable.clean(); // Explicit deterministic cleanup
    }

    public static void executeWithCleanup() {
        // finally block guaranteed execution
        try (NativeMemoryBuffer buf = new NativeMemoryBuffer(0xDEADBEEF)) {
            System.out.println("Processing buffer safely...");
        } // Auto-closes via try-with-resources without manual finally
    }
}
```

## Why `finalize()` Was Deprecated and Removed

1. **Non-Deterministic Execution:** The JVM provides zero guarantee on *when* (or even *if*) `finalize()` will run.
2. **Performance Degradation:** Objects with finalizers must be preserved across multiple GC cycles into a dedicated `Finalizer` reference queue, causing massive garbage collector pauses.
3. **Object Resurrection Attacks:** An attacker could re-assign `this` inside `finalize()` to a static reference, reviving a partially constructed, insecure object.

## Real-World Systems Engineering Discussion

### Production Systems Architecture: JIT Optimization with `final`

1. **Monomorphic Inlining:** Declaring methods `final` permits the HotSpot JIT compiler to bypass `vtable` dynamic dispatch checks and inline method bytecode directly into machine assembly.
2. **Java Memory Model (JMM) Safe Publication:** The JMM guarantees that `final` fields are fully constructed and visible to other threads immediately upon constructor completion without requiring volatile memory barriers or synchronization.

## Edge Cases & Production Hardening

1. **Final Reference vs Object Immutability:** A `final List<String> list = new ArrayList<>()` prevents reassigning `list = new OtherList()`, but `list.add("item")` is still permitted. True immutability requires `List.of()` or `Collections.unmodifiableList()`.
