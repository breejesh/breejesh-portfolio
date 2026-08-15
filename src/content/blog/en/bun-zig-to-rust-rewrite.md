---
title: "Bun Rewrote 535k Lines of Zig to Rust in 11 Days Using 64 Claude Agents"
description: "Anthropic-backed Bun ported its entire codebase from Zig to Rust using 64 parallel AI agents, fixing 128 bugs and shrinking binaries by 20%, but the move ignited a public feud with Zig's creator."
date: "2026-08-13"
tags: [Bun, Rust, Zig, AI, Systems]
coverImage: /assets/images/bun-zig-to-rust-rewrite.webp
previewImage: /assets/images/bun-zig-to-rust-rewrite.webp
---

> **TL;DR**
> * **The Problem:** Bun's Zig codebase suffered chronic memory bugs from mixing manual allocators with JavaScriptCore's garbage collector. Zig's anti-AI policies and pre-1.0 instability blocked automated maintenance after Anthropic acquired the project.
> * **The Insight:** Instead of a multi-year human effort, Bun ran 64 parallel Claude agents with adversarial reviewers to port 535,000 lines across 1,448 files in 11 days.
> * **The Result:** 128 long-standing bugs fixed, 20% smaller binaries, dev server memory leak eliminated. Estimated compute cost: $165,000. Zig creator Andrew Kelley publicly called the benchmarks misleading.

In 2000, Joel Spolsky wrote one of the most cited essays in software engineering, arguing that rewriting a production codebase from scratch is the worst strategic mistake a company can make. He pointed to Netscape, which spent three years rebuilding its browser while Microsoft ate its market share.

For 26 years, that rule went mostly unchallenged. In May 2026, Bun broke it.

---

## Why Bun Was Stuck

Bun embeds Apple's JavaScriptCore (JSC) engine rather than Google's V8. JSC uses a precise garbage collector to manage JavaScript objects. The problem: Bun's native runtime code was written in Zig, a language where you manage memory manually.

Half of Bun's objects lived in JSC's garbage-collected heap. The other half lived in Zig memory buffers with manual allocators. Both halves held raw pointers to each other, and keeping those pointers synchronized required careful discipline that the codebase frequently got wrong.

Bun's changelogs were full of bugs from this mismatch: code reading memory that had already been freed, freeing the same memory twice, or never freeing it at all. The dev server leaked 3 MB on every hot reload because a single error path in the bundler forgot to clean up after itself. These weren't exotic edge cases. They were structural consequences of mixing two incompatible memory management models in a million-line codebase.

After Anthropic acquired Bun in late 2025, a second problem surfaced. Most future development was going to be written by Claude. Zig is hostile to AI-generated code: the project refuses LLM pull requests and will close security reports if AI found the bug. On top of that, Zig hasn't reached version 1.0, keeps introducing breaking changes, and represents a tiny fraction of public code repositories, so models produce mediocre Zig compared to more established languages.

Rust solved both problems. Its borrow checker moves memory management into the type system, turning most pointer mismanagement into compile-time errors rather than runtime crashes. And models like Claude write strong idiomatic Rust thanks to decades of open-source training data.

---

## How They Did It

Jared Sumner, Bun's founder, decided in early May to port all 535,000 lines of Zig to Rust. The migration was not done by a team of human systems programmers. It was done by 64 parallel Claude coding agents.

The process ran in three phases:

**Phase 1: Mapping the codebase.** Claude spent hours studying Bun's source to produce a porting guide. A separate workflow traced the lifetime of every struct field into a spreadsheet, documenting years of tribal knowledge about who owns what memory and when it gets freed.

**Phase 2: Parallel translation.** 64 Claude agents worked across four Git worktrees, converting independent subsystems simultaneously: the HTTP parser, the bundling engine, the WebSocket layer, the package manager. At peak throughput, the swarm was producing 1,300 lines of Rust per minute.

**Phase 3: Adversarial review.** Every implementer agent was paired with two separate reviewer agents running in isolated context windows. The reviewers' only job was to assume the code was wrong and find out why. Pull requests were blocked until both reviewers cleared the changes.

Eleven days, 6,052 commits, and roughly $165,000 in compute later, Bun's entire test suite was passing on every platform.

---

## The Numbers

| Metric | Zig (Bun v1.1) | Rust (Bun v1.2) | Change |
|---|---|---|---|
| Lines of systems code | 535,000 | 498,000 | -6.9% |
| Release binary size | 92.4 MB | 73.9 MB | -20% |
| Dev server memory leak | 3.2 MB per rebuild | 0.0 MB | Eliminated |
| Long-standing bugs fixed | Baseline | 128 closed | Fixed during port |
| HTTP hello world throughput | 142,000 req/s | 145,200 req/s | +2.2% |
| Clean release build time | 42 seconds | 3 min 18 sec | ~4.7x slower |

The Rust port has already been powering Claude Code since June without anyone noticing, according to Bun's announcement.

---

## Andrew Kelley's Response

Not everyone celebrated. Andrew Kelley, the creator of Zig, published a response that made it clear this divorce was years in the making.

Kelley said the Zig team spent years watching Bun embarrass their language with code they privately used as the textbook example of how not to write Zig. He accused Jared Sumner of "producing slop long before LLMs existed," pointed out that Sumner skipped college at 18 to take Peter Thiel's money, and passed along secondhand reports that Sumner wasn't a great manager to work under.

Buried under the personal shots were legitimate technical objections:

1. **The performance gains are overstated.** Kelley argues the speed improvements mostly came from enabling Link-Time Optimization (LTO), which Zig has supported the entire time. Bun's Zig builds never turned it on.

2. **The binary size reduction isn't a Rust win.** The 20% shrink came from LTO and dead code elimination, not from properties unique to Rust.

3. **Compile times got dramatically worse.** Bun's clean build went from 42 seconds to over 3 minutes. Kelley notes that Bun's announcement conveniently omitted any mention of compile times, a metric where Zig wins decisively.

4. **The Zig team is "relieved."** Kelley said having Bun as Zig's most visible user was a liability because the codebase gave outsiders a distorted picture of what good Zig looks like.

---

## Who Gets Custody of Public Opinion

Probably nobody. Zig lost its most famous user. Kelley lost his cool with personal attacks that overshadowed his valid technical points. And Sumner got publicly diagnosed with "beginner energy" by a compiler engineer.

The rewrite itself, though, is hard to argue with on practical terms. 128 bugs fixed, a chronic memory leak gone, 20% smaller binaries, and a codebase that AI agents can now maintain autonomously. The compile time regression is real and significant for local development, but for a project whose future workforce is primarily Claude agents running in CI, that trade-off may be acceptable.

The bigger question is what this means for AI-driven rewrites in general. Bun had unusual advantages: Anthropic owned both the AI and the project, eliminating compute cost concerns. The codebase had a comprehensive test suite. And the target language (Rust) is one where models perform well. Most teams attempting this without those advantages will have a much harder time.

---

## References

* [The most controversial rewrite in history just shipped, Fireship / The Code Report](https://www.youtube.com/watch?v=CXSvKcLovAk)
* [Things You Should Never Do, Part I, Joel Spolsky (2000)](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/)
* [Bun Official Documentation](https://bun.sh/docs)
* [The Zig Programming Language](https://ziglang.org/documentation/master/)
