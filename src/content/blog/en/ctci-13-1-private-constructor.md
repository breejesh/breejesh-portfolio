---
title: "Private Constructor: Use Cases and Inheritance Constraints in Java (CTCI 13.1)"
description: "CTCI problem 13.1 in Java: why declare a constructor private, how it prevents subclassing, and its role in Singleton and Utility classes."
date: "2026-03-18"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-13-1-private-constructor.webp
previewImage: /assets/images/ctci-13-1-private-constructor.webp
---

> **TL;DR**
> * **The Core Rule:** A class with only `private` constructors cannot be instantiated from outside its scope, nor can it be subclassed.
> * **Primary Use Cases:** Singleton patterns, static utility classes (like `java.lang.Math`), and factory-method patterns.
> * **Mechanism:** Subclass constructors must call a `super()` constructor; if no accessible super constructor exists, compilation fails.

In Java, declaring a constructor `private` serves two main architectural purposes: controlling instantiation and preventing inheritance.

---

## 1. The Two Primary Patterns

### 1. Static Utility Class (Prevent Instantiation)
```java
public final class MathUtils {
    // Suppress default public constructor to prevent instantiation
    private MathUtils() {
        throw new AssertionError("Cannot instantiate utility class");
    }

    public static int clamp(int val, int min, int max) {
        return Math.max(min, Math.min(val, max));
    }
}
```

### 2. Singleton / Controlled Factory Creation
```java
public class DatabaseConnectionPool {
    private static DatabaseConnectionPool instance;

    private DatabaseConnectionPool() {
        // Initialize pool connections
    }

    public static synchronized DatabaseConnectionPool getInstance() {
        if (instance == null) {
            instance = new DatabaseConnectionPool();
        }
        return instance;
    }
}
```

---

## 2. Inheritance Constraint Explained

When a child class constructor runs, Java implicitly calls `super()`. If all constructors in the parent class are `private`, the child class cannot access `super()`, and the code will fail to compile with `Constructor in SuperClass is private`.
