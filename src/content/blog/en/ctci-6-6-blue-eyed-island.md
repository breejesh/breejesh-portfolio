---
title: "Blue-Eyed Island: Common Knowledge and Induction for Beginners"
description: "CTCI-style problem 6.6: n blue-eyed islanders leave on the nth night after the guru says I see someone with blue eyes. Teach base case, inductive step, and common knowledge without jargon fog."
date: "2025-12-23"
tags: [Algorithms]
coverImage: /assets/images/ctci-6-6-blue-eyed-island.webp
previewImage: /assets/images/ctci-6-6-blue-eyed-island.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 6.6: n blue-eyed islanders leave on the nth night after the guru says I see someone with blue eyes. Teach base case, inductive step, and common knowledge without jargon fog.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

A ferry leaves every night at midnight. Anyone who has **figured out their own eye color** must board and leave forever. The islanders are perfect logicians. They can see everyone else's eyes. There are no mirrors, no photos, no "your eyes are blue" chats. For years, life is quiet. Then a visitor says, in public: **"I see someone with blue eyes."**

Nothing looks different on night one. Or night two. Then, if there were `n` blue-eyed people, **all `n` leave together on night `n`**.

This post is original teaching for beginners. Same problem family as the classic blue-eyes / muddy children puzzles, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 6, math and logic, problem 6.6. Reasoning is the product. Optional tiny Java only models the night counter for small `n`.

---

## 1. Everyday analogy

Think of a classroom where every student has either a blue sticker or a brown sticker on their forehead. Nobody can see their own sticker. Everyone can see everyone else's. The rule: if you deduce your sticker is blue, you stand up and leave at the end of the day.

For a long time, the teacher never mentions stickers. Blue-sticker kids already see other blue stickers (if any). Brown-sticker kids see the blues. Nothing forces anyone to leave.

Then the teacher says out loud, so everyone hears and everyone sees that everyone heard:

> "I see at least one blue sticker."

That sentence sounds empty if you already saw a blue sticker. The power is not new pixel-data about the room. The power is **shared certainty**: now every student knows that every student knows that there is at least one blue sticker, and so on up the chain. That is called **common knowledge**. With only private observation, that infinite "I know that you know that I know..." stack was incomplete for the people who needed it.

The rest of the puzzle is **induction**: prove a claim for 1 blue sticker, then show that if it holds for `k` blues, it holds for `k + 1`.

---

## 2. Plain problem statement

**Setup (standard form):**

* Islanders have either blue eyes or brown eyes (only these two for the story).
* There are `n` blue-eyed people and some positive number of brown-eyed people (the browns are "other"; they never leave in the classic resolution).
* Everyone can see every other person's eyes. Nobody sees their own.
* No communication about eye color. Perfect memory. Perfect logic. They trust that everyone else is also a perfect logician.
* A ferry leaves each night at midnight. If you deduce your own eye color is blue, you leave that night.
* Before the visitor, everyone has been living under these rules for a long time and **nobody has left**.

**The public statement (day 0, daytime):**

A guru / visitor announces to the whole group:

> "I can see someone who has blue eyes."

**Question:** what happens, and when?

**Answer to aim for:**

* If `n = 1`, that one blue-eyed person leaves on **night 1**.
* If `n = 2`, both leave on **night 2**.
* In general, all `n` blue-eyed people leave on **night `n`**.
* Brown-eyed people stay.

**Clarify before "solving":**

* Is the announcement public and known to be heard by all? (Yes. That is load-bearing.)
* Do they leave only when sure of **blue** eyes, or when sure of any color? (Classic CTCI form: leave when you know you have blue eyes. Browns never get that deduction from this announcement alone.)
* Are there zero blue eyes possible before the guru? (Yes in the hypothetical models people use in their heads. The guru kills the "maybe zero" branch in the public view.)
* Simultaneous ferry: yes. Everyone who knows leaves the same night.

---

## 3. Think first: induction without the fog

### What induction means here (beginner version)

You want a claim `P(n)`:

> If there are exactly `n` blue-eyed people, and the guru has spoken, then all `n` leave on night `n`.

**Base case:** prove `P(1)`.

**Inductive step:** assume `P(k)` is true for some fixed `k >= 1`. Prove `P(k + 1)`.

Then `P(n)` holds for every positive integer `n`.

You are not "hoping" the pattern continues. You are chaining a guarantee: 1 works, and each size inherits from the size one smaller.

### What each blue-eyed person sees

Person `B` with blue eyes (they do not know that yet) looks around:

* They see **`n - 1`** other blue-eyed people.
* They see some brown-eyed people.

So from `B`'s private view, the world might have `n - 1` blues (if `B` is brown) or `n` blues (if `B` is blue). The induction is about how those two worlds diverge night by night after the guru speaks.

### Why the guru's sentence matters (common knowledge)

Before the guru:

* If `n >= 1`, every brown-eyed person already sees at least one blue.
* If `n >= 2`, every blue-eyed person already sees at least one blue.

So for most people, "there exists a blue-eyed person" is **old news** as raw fact. What was missing is a **public, synchronized starting gun** that puts that fact into common knowledge:

1. Everyone knows there is at least one blue.
2. Everyone knows that everyone knows there is at least one blue.
3. Everyone knows that everyone knows that everyone knows... and so on.

Without that stack, the induction clock never starts. With it, people can run nested expectations: "If I am not blue, the people I see will behave like a size-`(n-1)` island after a common-knowledge announcement."

---

## 4. Solution: base case, then step up

### Base case: `n = 1`

Call the only blue-eyed person **A**.

* A looks around and sees **zero** blue eyes.
* Before the guru, A could think: "Maybe there are no blue eyes at all; maybe I am brown."
* Guru says: "I see someone with blue eyes."
* A is the only person who sees zero blues. The someone must be A.
* A deduces "I have blue eyes" on day 0 after the speech, and leaves on **night 1**.

Everyone else sees A's blue eyes already. They expected A might leave if A is the only blue. When A leaves night 1, the world matches that story. Browns still do not learn they are brown in a way that forces a blue-exit; they are not blue.

`P(1)` holds.

### Two people: `n = 2` (the step you can feel)

Call them **A** and **B**, both blue. Guru speaks on day 0.

What A sees: exactly one blue (B). So A thinks:

> Either I am brown and there is 1 blue (B), or I am blue and there are 2 blues.

If A is brown, then from B's point of view the island is a **size-1** blue-eye world. By the base case, B should leave on **night 1**.

Night 1 arrives. B is still there. (B is running the symmetric argument about A.)

A now knows the "I am brown, only B is blue" world is dead. So A has blue eyes. Same for B.

Both leave on **night 2**.

The key move is not telepathy. It is **failed expectation**:

> I expected the person I see to leave on night 1 if I am not blue. They did not. Therefore I am blue.

### Three people: `n = 3`

A, B, C all blue. Each sees **two** blues.

Take A's private model:

* If I am brown, then B and C live in a size-2 world with common knowledge from the guru.
* By the `n = 2` case, B and C should both leave on **night 2**.

Night 1: nobody leaves (as expected even in the size-2 sub-world, because size 2 leaves on night 2).
Night 2: still nobody leaves.

A's "I am brown" hypothesis dies. A deduces blue. Same for B and C. All three leave on **night 3**.

### Inductive step: assume `P(k)`, prove `P(k + 1)`

Assume: whenever there are exactly `k` blues and the guru has spoken, they all leave on night `k`.

Now the real world has `k + 1` blues. Pick any blue-eyed person `X`.

* `X` sees exactly `k` blues.
* `X` considers: "If I am brown, those `k` people form a size-`k` instance with common knowledge. By the inductive hypothesis they leave on night `k`."
* Nights `1` through `k` pass. The `k` people `X` sees are still on the island (each of them is waiting on the same failed-expectation clock).
* So `X`'s "I am brown" branch is false. `X` has blue eyes.
* Every blue-eyed person runs the same argument. All `k + 1` leave on night `k + 1`.

That is `P(k + 1)`. Induction closes. For any `n`, all `n` blues leave on night `n`.

### What about brown-eyed people?

A brown-eyed person `Y` sees all `n` blues. After the guru, `Y` expects those `n` people to leave on night `n` (by the theorem). When they do, the world matches "there are `n` blues and I am not one of them" in a soft sense, but the ferry rule in this puzzle is about discovering **you have blue eyes**. Browns never get a night where the only way to explain a missing departure is "I must be blue." Their color is consistent with everything they see. They stay.

### Why waiting years did nothing, then the guru changed everything

Before the guru, there was no public day-0 anchor and no common-knowledge chain of "at least one blue." Each person could always invent a smaller island in their head without a shared clock. The visitor does not hand anyone a mirror. The visitor starts the induction clock that everyone can see everyone else running.

---

## 5. Walk-through table and optional tiny simulation

### Night-by-night table

| True blues `n` | What each blue sees | First night they expected others to leave if "I am brown" | Actual departure night |
| --- | --- | --- | --- |
| 1 | 0 | (no other blue; guru forces self) | Night 1 |
| 2 | 1 | Night 1 | Night 2 |
| 3 | 2 | Night 2 | Night 3 |
| `n` | `n - 1` | Night `n - 1` | Night `n` |

Pattern you can say out loud:

> Each blue-eyed person waits for the group they see to leave on the night equal to the count they see. When that night fails, they board the next ferry.

### Optional Java: night counter for small `n`

You cannot "simulate full epistemic logic" in twenty lines. You can still encode the **closed form** the induction proves, and a tiny loop that prints the story for `n = 1..5`.

```java
/** Night when all n blue-eyed people leave after a day-0 common-knowledge announcement. */
static int departureNight(int n) {
    if (n < 1) {
        throw new IllegalArgumentException("n must be at least 1");
    }
    return n; // P(n): leave on night n
}

static void narrate(int n) {
    System.out.println("True blue count n = " + n);
    System.out.println("  Each blue sees " + (n - 1) + " blue(s).");
    if (n == 1) {
        System.out.println("  Sees zero blues; guru implies self. Leaves night 1.");
        return;
    }
    System.out.println("  If I were brown, the " + (n - 1)
            + " I see would leave on night " + (n - 1) + ".");
    System.out.println("  They stay. I deduce blue. All " + n
            + " leave on night " + departureNight(n) + ".");
}

public static void main(String[] args) {
    for (int n = 1; n <= 5; n++) {
        narrate(n);
    }
}
```

Sample mental output:

```
True blue count n = 1
  Each blue sees 0 blue(s).
  Sees zero blues; guru implies self. Leaves night 1.
True blue count n = 2
  Each blue sees 1 blue(s).
  If I were brown, the 1 I see would leave on night 1.
  They stay. I deduce blue. All 2 leave on night 2.
...
```

If an interviewer wants code, this is enough to show you know the answer is the inductive `n`, not a search over island graphs. If they want the proof, walk `n = 1`, `n = 2`, then the general step. That is the real interview.

### Common wrong turns

1. **"Everyone already saw blue eyes, so the guru said nothing new."** Private knowledge is not common knowledge. The nested "they know that I know" chain is the missing piece.
2. **"They leave the morning of the announcement."** Only the `n = 1` person can act on night 1. Larger `n` need failed expectations over previous nights.
3. **"Brown-eyed people leave too."** Not in the classic statement. They never deduce "I have blue eyes."
4. **"Induction is circular because they need to know the theorem."** Islanders do not need the word "induction." They need nested case reasoning that bottoms out at 1. Mathematicians package that nesting as induction.
5. **"Any public sentence would work."** It has to establish the base fact in common knowledge. "I see blue eyes" is exactly the base atom the size-1 person needs, and that everyone knows the size-1 person would use.

---

## 6. Complexity, edges, interview tips

| Topic | Answer |
| --- | --- |
| Core technique | Mathematical induction + common knowledge |
| Closed form | `n` blues leave on night `n` |
| "Runtime" of the social process | `n` nights after the announcement |
| Code | Optional O(1) answer `return n`; narration O(1) per `n` |
| Related puzzles | Muddy children, sum-and-product, blue-eyed island variants |

**Edges and follow-ups:**

* **`n = 0`:** guru would not truthfully say she sees a blue-eyed person. Outside the puzzle if the guru is always truthful.
* **Guru is wrong / lying:** model breaks; perfect logicians need a trusted public fact.
* **Someone leaves early by mistake:** destroys the failed-expectation signal. The puzzle assumes no noise.
* **More than two eye colors:** same induction on the distinguished color the guru mentioned, if the leave-rule is "leave when you know you have that color."
* **They can leave on any color once known:** then browns may also get deductions in some variants. Stick to the blue-only ferry rule unless the interviewer changes it.
* **Continuous time vs discrete nights:** the ferry discretizes observation windows so "they did not leave on night k" is a sharp public event.

**How to talk it (45-second version):**

1. Guru makes "there is at least one blue" common knowledge.
2. If I see 0 blues, I leave night 1.
3. If I see 1 blue, I expect them to leave night 1; if not, I leave night 2.
4. Inductively, if I see `k` blues, I expect them to leave night `k`; if not, I leave night `k + 1`.
5. So with true count `n`, all blues leave night `n`.

**Where this shows up outside the riddle:**

* Distributed systems: common knowledge vs "everyone got the message" (Byzantine / email digressions).
* Protocol design: public broadcasts that synchronize state machines.
* Interview signal: can you run a clean base case and inductive step under pressure without waving hands.

---

## 7. Explain to a friend recap

Blue-Eyed Island is an induction story with a ferry.

1. Perfect logicians. See others' eyes, not their own. Leave at midnight only when sure they have blue eyes.
2. Guru says publicly: I see someone with blue eyes. That starts a common-knowledge clock.
3. One blue: sees zero blues, realizes it is them, leaves night 1.
4. Two blues: each expects the other to leave night 1; neither does; both leave night 2.
5. In general: each blue sees `n - 1` others, expects them to leave on night `n - 1` if "I am brown"; when they stay, all `n` leave on night `n`.

If you can prove `P(1)`, state the inductive step in one paragraph, and explain why the guru is not "useless information," you own problem 6.6. No heavy Java required. Careful reasoning is the whole point.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Jugs of Water](/blog/en/ctci-6-5-jugs-of-water)
* Next: [The Apocalypse](/blog/en/ctci-6-7-the-apocalypse)