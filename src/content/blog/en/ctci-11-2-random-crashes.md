---
title: "Random Crashes: Diagnosing Non-Deterministic Bugs (CTCI 11.2)"
description: "CTCI problem 11.2: a systematic 6-step engineering methodology to isolate, reproduce, and fix non-deterministic production crashes."
date: "2025-12-21"
tags: [Algorithms & Data Structures, Development]
coverImage: /assets/images/ctci-11-2-random-crashes.webp
previewImage: /assets/images/ctci-11-2-random-crashes.webp
---

> **TL;DR**
> * **The Problem:** An application crashes intermittently with no obvious trigger in standard test suites.
> * **The Approach:** Formulate hypotheses across memory corruption, race conditions, unhandled external timeouts, and hardware limits; instrument deterministic tracing; reproduce under stress.
> * **Outcome:** Transform a flaky ghost bug into a deterministic, reproducible test case.

"It crashed once yesterday on staging. We ran the test again and it passed."

Intermittent crashes are the most expensive bugs in software engineering. If you cannot reproduce a failure deterministically, you cannot verify whether a proposed fix actually worked.

---

## 1. The 6 Primary Root Cause Categories

| Root Cause | Mechanism | Detection Technique |
| --- | --- | --- |
| **Race Conditions / Concurrency** | Two threads access shared state without locking | ThreadSanitizer (`TSan`), lock analysis |
| **Memory Corruption / Use-After-Free** | Dangling pointer or buffer overrun corrupts heap | AddressSanitizer (`ASan`), Valgrind |
| **Resource Exhaustion** | Leaking file descriptors, sockets, or thread handles | `lsof`, `/proc/<pid>/fd`, memory profilers |
| **Unhandled External I/O Timeouts** | Network latency spike causes unhandled null response | Chaos testing, mock network delays |
| **Uninitialized Memory** | Reading garbage stack/heap values | Static analysis, compiler warnings (`-Wuninitialized`) |
| **Garbage Collection Pauses** | Stop-the-world GC causes heartbeat timeouts | GC logging (`-Xlog:gc`), APM traces |

---

## 2. Systematic 5-Step Isolation Process

```
[1. Collect Core Dumps & Logs] -> [2. Isolate Environmental Variables] -> [3. Stress Test & Chaos Loop] -> [4. Deterministic Mocking] -> [5. Automated Regression Test]
```

1. **Capture Artifacts**: Enable core dumps (`ulimit -c unlimited`) and structured JSON logs with correlation IDs.
2. **Narrow the Variables**: Does it happen only under high concurrency? Only after running for 48 hours (leak)? Only on multi-core machines?
3. **Stress Testing**: Write a script running 100 concurrent workers hammering the suspicious code path.
4. **Binary Instrumentation**: Run the build under AddressSanitizer or ThreadSanitizer.
5. **Write a Failing Test**: The fix is complete only when a deterministic unit or integration test reproduces the failure on demand.
