---
title: "Context Switch: Benchmarking CPU Kernel Scheduling Latency (CTCI 15.2)"
description: "Formulate an empirical methodology to measure OS context switch latency using dual-pipe ping-pong tokens, CPU core pinning, and kernel eBPF tracepoints."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-15-2-context-switch.webp
previewImage: /assets/images/ctci-15-2-context-switch.webp
---

> **TL;DR**
> * **The Book Problem:** How would you measure the time spent upon a context switch?
> * **The Optimal Solution:** **Dual-Pipe Token Ping-Pong with CPU Affinity Pinning**:
>   1. **CPU Pinning**: Bind two processes ($P_1, P_2$) to the **exact same physical CPU core** using `sched_setaffinity()` to prevent multi-core parallel execution.
>   2. **Blocking Token Transfer**: Connect $P_1$ and $P_2$ with two unidirectional Unix pipes. $P_1$ writes a 1-byte token to pipe 1 and blocks on pipe 2; $P_2$ unblocks, reads from pipe 1, writes to pipe 2, and blocks.
>   3. **Forced Context Switch**: Each blocking read forces the OS kernel scheduler to perform a synchronous context switch ($P_1 \to P_2 \to P_1$, yielding 2 switches per round-trip).
>   4. **Baseline Subtraction**: Measure single-process pipe write/read overhead $T_{\text{baseline}}$.
>   5. **Formula**: $T_{\text{switch}} = \frac{T_{\text{total}} - T_{\text{baseline}}}{2 \times N}$.
> * **Production Reality:** Linux `perf stat -e context-switches`, eBPF `sched:sched_switch` kernel tracepoints, and high-frequency trading CPU core isolation (`isolcpus`).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 15.2), we are asked:

*"How would you measure the time spent upon a context switch? Formulate an experimental methodology, accounting for operating system scheduling, hardware caching, and measurement overhead."*

## 2. Experimental Measurement Protocol

```
[Core #0 (Pinned CPU Affinity)]
┌─────────────────────────────────────────────────────────────┐
│ Process P1                                      Process P2  │
│ ┌──────────────┐                             ┌────────────┐ │
│ │ Write Pipe 1 │ ───> [Pipe 1 Buffer] ───>   │Read Pipe 1 │ │
│ │ Block Read P2│ <─── [Pipe 2 Buffer] <───   │Write Pipe 2│ │
│ └──────────────┘                             └────────────┘ │
└─────────────────────────────────────────────────────────────┘
  ▲                                              ▲
  └────────────── Kernel Context Switch ─────────┘
```

## Production C / POSIX Benchmark Harness

```c
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sched.h>
#include <time.h>
#include <sys/wait.h>

#define ITERATIONS 100000

static inline long long get_nanos(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (long long)ts.tv_sec * 1000000000LL + ts.tv_nsec;
}

int main() {
    // 1. Pin entire benchmark to CPU Core 0
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(0, &cpuset);
    sched_setaffinity(0, sizeof(cpu_set_t), &cpuset);

    int p1_to_p2[2];
    int p2_to_p1[2];
    pipe(p1_to_p2);
    pipe(p2_to_p1);

    char token = 'x';
    pid_t pid = fork();

    if (pid == 0) {
        // Child Process (P2)
        for (int i = 0; i < ITERATIONS; i++) {
            read(p1_to_p2[0], &token, 1);  // Blocks -> Forces context switch from P1 to P2
            write(p2_to_p1[1], &token, 1); // Writes -> Yields back to P1
        }
        _exit(0);
    } else {
        // Parent Process (P1)
        long long start = get_nanos();

        for (int i = 0; i < ITERATIONS; i++) {
            write(p1_to_p2[1], &token, 1);
            read(p2_to_p1[0], &token, 1); // Blocks -> Forces context switch from P2 to P1
        }

        long long total_duration = get_nanos() - start;
        wait(NULL);

        // 2 context switches occur per round-trip iteration
        double avg_switch_nanos = (double)total_duration / (2.0 * ITERATIONS);
        printf("Total Time for %d Switches: %lld ms\n", 2 * ITERATIONS, total_duration / 1000000LL);
        printf("Average Context Switch Latency: %.2f ns (%.3f microseconds)\n", 
               avg_switch_nanos, avg_switch_nanos / 1000.0);
    }

    return 0;
}
```

## Latency Breakdown Across Hardware Generations

| Context Switch Type | Typical Latency | Primary Cost Factors |
|---|---|---|
| **Thread (Same Process)** | $\approx 300\text{--}800\text{ ns}$ | Register saving/restoration, stack pointer swap, kernel trap. |
| **Process (Different Address Space)** | $\approx 1.2\text{--}2.5\ \mu\text{s}$ | TLB cache flush (`CR3` swap), memory page table reload. |
| **Cross-NUMA Node Switch** | $\approx 3.0\text{--}6.0\ \mu\text{s}$ | Remote memory interconnect bus access, L1/L2/L3 cache misses. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Kernel eBPF and Hardware Counters

1. **eBPF Tracepoints (`sched:sched_switch`):** Modern Linux engineers measure live context switch latencies in production using eBPF programs attached to the kernel scheduler without modifying application code.
2. **CPU Core Isolation (`isolcpus`):** High-frequency trading and aerospace operating systems dedicate isolated CPU cores to a single thread with `isolcpus=2,3` and `nohz_full`, eliminating OS context switches entirely ($0\text{ ns}$).

## Edge Cases & Production Hardening

1. **Multi-Core Skew:** Without CPU core pinning (`sched_setaffinity`), both processes run in parallel on separate cores, measuring pipe inter-core messaging latency rather than context switch time.
2. **Cache Pollution:** A process that dirties large amounts of L1/L2 cache incurs secondary cache-reload penalties after switching back.
