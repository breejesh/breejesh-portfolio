---
title: "Private Constructor: Preventing Subclassing and Enforcing Creational Patterns in Java (CTCI 13.1)"
description: "Analyze the architectural effects of private constructors on inheritance in Java, detailing compiler super() resolution, Singletons, and Factory patterns."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-13-1-private-constructor.webp
previewImage: /assets/images/ctci-13-1-private-constructor.webp
---

> **TL;DR**
> * **The Book Problem:** In terms of inheritance, what is the effect of keeping a constructor private in Java?
> * **The Optimal Solution:** **Subclassing Prevention via Super() Inaccessibility**: (1) In Java, every subclass constructor must invoke a constructor of its superclass (either explicitly via `super(...)` or implicitly via default `super()`); (2) If all constructors in a class are declared `private`, no external class can access `super()`, making inheritance completely impossible (resulting in a compile-time error); (3) **Nested Inner Class Exception**: Static nested inner classes within the same outer class *can* access private constructors and subclass the outer class; (4) **Primary Creational Patterns**: Used to enforce the Singleton pattern, utility classes with only static methods (e.g., `java.lang.Math`), and static Factory / Builder patterns.
> * **Production Reality:** Spring Framework bean factories, Google Guava utility classes, and Jackson immutable record builders.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 13.1), we are asked:

*"In terms of inheritance, what is the effect of keeping a constructor private in Java? Explain compiler enforcement and architectural design patterns."*

## 2. Java Inheritance & Super() Resolution

When a class is instantiated in Java, constructor chaining requires every constructor in the inheritance tree to execute from `Object` down to the leaf:

```
[Derived Class Constructor]
┌──────────────────────────────────────┐
│ public Child() {                     │
│     super(); // Implicit or Explicit │ ───> [Parent Class Constructor]
│     // Child initialization          │       private Parent() { ... }
└──────────────────────────────────────┘       ▲
                                               │
                                       COMPILER ERROR:
                       "Parent() has private access in Parent"
```

## Production Implementation & Creational Patterns

```java
public class DatabaseConnectionPool {
    // 1. Private constructor prevents direct external instantiation and subclassing
    private DatabaseConnectionPool() {
        System.out.println("Initializing singleton connection pool...");
    }

    // 2. Thread-Safe Initialization-on-Demand Holder Idiom (Bill Pugh Singleton)
    private static class InstanceHolder {
        private static final DatabaseConnectionPool INSTANCE = new DatabaseConnectionPool();
    }

    public static DatabaseConnectionPool getInstance() {
        return InstanceHolder.INSTANCE;
    }

    // 3. Static Nested Subclasses CAN access private constructors
    public static class TestablePool extends DatabaseConnectionPool {
        public TestablePool() {
            super(); // Permitted because TestablePool is an inner class of DatabaseConnectionPool
        }
    }
}

/**
 * Pure Static Utility Class
 */
public final class StringUtils {
    // Suppress default public constructor for non-instantiability
    private StringUtils() {
        throw new AssertionError("Cannot instantiate utility class");
    }

    public static boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
}
```

## Architectural Patterns Enabled by Private Constructors

| Design Pattern | Purpose | Why Private Constructor is Essential |
|---|---|---|
| **Singleton Pattern** | Enforces exactly 1 global instance. | Prevents callers from calling `new MyClass()`. |
| **Static Utility Class** | Groups pure functions (`Math`, `Arrays`). | Prevents useless empty object allocations in heap. |
| **Static Factory Method** | Named instance creation (`Optional.of()`). | Controls caching, instance reuse, and polymorphism. |
| **Builder Pattern** | Constructs complex immutable objects. | Forces instantiation exclusively through the Builder. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Joshua Bloch's Defensive Architecture

1. **Effective Java (Item 4):** "Enforce non-instantiability with a private constructor." Adding `throw new AssertionError()` inside the private constructor defends against reflection attacks invoking `setAccessible(true)`.
2. **Java 17+ Sealed Classes:** Modern Java introduces the `sealed` keyword (`public abstract sealed class Shape permits Circle, Square`), offering a native language-level mechanism to restrict subclassing to an explicit whitelist while keeping constructors accessible.

## Edge Cases & Production Hardening

1. **Reflection Attacks:** Malicious reflection code can invoke `constructor.setAccessible(true)`. Protect by checking instance presence inside the constructor body.
2. **Serialization Vulnerability:** Deserialization creates objects without calling constructors. Defend by implementing `readResolve()` returning the existing instance.
