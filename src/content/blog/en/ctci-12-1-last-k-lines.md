---
title: "Last K Lines: Circular Ring Buffer File Streaming in C++ (CTCI 12.1)"
description: "How to print the last K lines of an input file in C++ using a Circular Ring Buffer array in O(N) time and strictly bounded O(K) memory without loading the file into RAM."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-12-1-last-k-lines.webp
previewImage: /assets/images/ctci-12-1-last-k-lines.webp
---

> **TL;DR**
> * **The Book Problem:** Write a method in C++ to print the last K lines of an input file using C++ I/O streams.
> * **The Core Breakthrough:** Maintain a circular ring buffer array of strings of size $K$. Read lines sequentially, storing each at index `count % K`. When EOF is reached, print lines starting from `count % K` up to $K$ in strict chronological order in $O(K)$ space.
> * **Production Reality:** Exact algorithmic foundation of UNIX `tail -n K`, Kubernetes pod log streaming, and kernel dmesg ring buffers.

## 1. Problem Statement & Memory Constraints

In *Cracking the Coding Interview* (Problem 12.1), we are given a large text file and an integer $K$. We must print the last $K$ lines to standard output.

*Crucial Constraint:* The file may be massive (e.g. 50GB web server access log), while $K$ is small (e.g. $K = 100$). Loading the whole file into an array (`std::vector<std::string>`) or calling `lines.size()` crashes the program with memory exhaustion. Memory usage must remain strictly bounded to $O(K)$.

## 2. The Circular Ring Buffer Mechanism

We allocate a static array of strings of size $K$:
`std::string L[K];`

1. Initialize line counter `count = 0`.
2. In a loop, read lines with `std::getline(file, L[count % K])` and increment `count++`.
3. The modulo operator `% K` causes new lines to naturally overwrite the oldest stored line in a circular fashion without moving or shifting existing array elements.
4. When file reaches EOF:
   * Total lines stored is `size = min(count, K)`.
   * The oldest line resides at index `start = (count < K) ? 0 : (count % K)`.
   * Print $K$ lines sequentially: `L[(start + i) % K]` for $i = 0 \dots \text{size}-1$.

## Production Implementation

```cpp
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <algorithm>

void printLastKLines(const std::string& filename, int k) {
    if (k <= 0) return;

    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Error: Unable to open file " << filename << std::endl;
        return;
    }

    std::vector<std::string> ringBuffer(k);
    int count = 0;
    std::string line;

    // Read sequentially line by line into circular ring buffer
    while (std::getline(file, line)) {
        ringBuffer[count % k] = std::move(line);
        count++;
    }

    // Determine circular starting point and number of elements to print
    int start = (count < k) ? 0 : (count % k);
    int totalToPrint = std::min(count, k);

    for (int i = 0; i < totalToPrint; i++) {
        std::cout << ringBuffer[(start + i) % k] << "\n";
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| Time Complexity | `O(N)` | Single linear streaming pass over the file containing N lines. |
| Auxiliary Space | `O(K)` | Strictly bounded to exactly K string buffers in RAM. |
| Disk I/O | `Sequential` | Single forward pass with standard OS page caching. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: UNIX `tail`, Linux `dmesg`, and Kubernetes Logs

1. **GNU Coreutils `tail -n K`:** For non-seekable streams (like standard input pipes `cat log | tail -n 100`), GNU `tail` allocates an in-memory circular ring buffer of size $K$. For regular disk files, it seeks backward from the file end in 4KB chunks until counting $K$ newline bytes (`\n`).
2. **Linux Kernel `printk` Log Buffer (`dmesg`):** The Linux kernel writes boot logs and hardware alerts to a fixed-size contiguous kernel memory ring buffer (`__log_buf`). When full, new kernel messages overwrite the oldest entries, allowing debug tools (`dmesg`) to dump the latest crash trace without kernel memory leaks.
3. **High-Performance Financial Messaging (LMAX Disruptor):** High-frequency trading engines use lock-free circular ring buffers (`RingBuffer<Event>`) to pass market ticks between threads in sub-microsecond latencies without garbage collection pauses.

## Edge Cases & Production Hardening

1. File has fewer than K lines ($N < K$): Loop prints exactly $N$ lines from index 0 to $N-1$ without printing empty uninitialized slots.
2. Empty file ($N = 0$): Handled cleanly with zero output.
3. Non-existent file: Gracefully catches error and logs failure without crashing.
