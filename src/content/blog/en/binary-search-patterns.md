---
title: "Binary Search Patterns That Keep Showing Up"
description: "Classic binary search, lower and upper bound, answer-space search, and the off-by-one traps that burn interviews and production code. Templates you can reuse."
date: "2026-06-27"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/binary-search-patterns.webp
previewImage: /assets/images/binary-search-patterns.webp
---

Binary search is not a single trick. Both interviews and real production systems reuse three core patterns: finding an exact target, finding a boundary, and searching over the monotonic answer space. Most bugs are not "I forgot log n." They are off-by-one mistakes in the loop invariant.

This post is the short map I keep. Python templates, the mental model for each shape, and the traps that waste half an hour on a whiteboard.

---

## The one idea you need

You maintain a range `[lo, hi]` (or half-open `[lo, hi)`) where the answer still lives. Every step drops roughly half of that range. That only works if:

1. The search space is **ordered** by some key (values, or a monotonic predicate).
2. You can decide, in O(1) or better, which half still holds the answer.
3. Your loop **shrinks** every iteration, and exit leaves `lo`/`hi` in a known state.

If the predicate is not monotonic, binary search is the wrong tool. No amount of clever mid math fixes a non-monotone problem.

---

## Pattern 1: classic find (exact value)

Sorted array, find `target` or report missing. Half-open range avoids some fencepost pain:

```python
def binary_search(a: list[int], target: int) -> int:
    """Return index of target, or -1 if missing. a must be sorted ascending."""
    lo, hi = 0, len(a)  # search in [lo, hi)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return -1
```

Notes:

* `mid = lo + (hi - lo) // 2` avoids overflow in languages with fixed-width ints. In Python it is mostly style. Still a good habit when you interview in C++ or Java.
* On miss, `lo` is the insertion point (first index where `a[i] >= target` if all comparisons were `<` / `>=`). Useful for the next pattern.
* Duplicates: this returns *some* match, not the leftmost or rightmost.

---

## Pattern 2: lower bound and upper bound

**Lower bound:** first index `i` with `a[i] >= target` (or `len(a)` if every element is smaller).

**Upper bound:** first index `i` with `a[i] > target`.

Together they give the full equal-range for duplicates, and they power "count of X in sorted list" in log time.

```python
def lower_bound(a: list[int], target: int) -> int:
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo


def upper_bound(a: list[int], target: int) -> int:
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] <= target:
            lo = mid + 1
        else:
            hi = mid
    return lo


def equal_range(a: list[int], target: int) -> tuple[int, int]:
    return lower_bound(a, target), upper_bound(a, target)
```

Example: `a = [1, 2, 2, 2, 5]`, `target = 2` → lower `1`, upper `4`, count `3`.

C++ has `std::lower_bound` / `std::upper_bound`. Python's `bisect.bisect_left` and `bisect.bisect_right` are the same idea. In interviews, write the loop once so you prove you own the invariant.

### Production uses

* Sorted event logs: first timestamp `>= t0`, first timestamp `> t1`.
* Price ladders or rate tables: smallest tier that covers a quantity.
* Deduped ID lists: membership plus range length without scanning.

---

## Pattern 3: answer-space search (binary search on the answer)

You are not indexing an array. You are guessing a number `x` (capacity, days, minimum max-load, speed) and asking a **monotonic check**: `feasible(x)` is false for small `x` and true for large `x` (or the reverse). Binary search finds the smallest true (or largest false).

Skeleton for "minimum `x` such that `feasible(x)`":

```python
def min_feasible(lo: int, hi: int, feasible) -> int:
    """
    Assume feasible is False for values below the answer,
    True for values at and above. Search in [lo, hi].
    Returns the smallest x where feasible(x) is True.
    Precondition: feasible(hi) is True (or widen hi first).
    """
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if feasible(mid):
            hi = mid          # mid works; try smaller
        else:
            lo = mid + 1      # mid fails; need larger
    return lo
```

Classic interview shapes that map to this:

| Problem family | `x` means | `feasible(x)` |
| --- | --- | --- |
| Koko eating bananas | eat speed | finishes all piles in `h` hours |
| Split array largest sum | max subarray sum allowed | can split into `<= m` parts |
| Capacity to ship packages | ship capacity | all packages ship in `D` days |
| Min max distance / aggressive cows | minimum distance | place `k` cows with that gap |
| Time to produce `n` items | elapsed time | machines produce enough by then |

The hard part is not the binary search. It is:

1. Proving **monotonicity** (if speed 5 works, speed 6 also works).
2. Setting **bounds** (`lo` = max single pile for Koko-style problems; `hi` = sum of piles or a safe upper).
3. Implementing `feasible` correctly and in good time (often O(n) per check → O(n log R) total).

### Tiny worked example: minimum capacity

Packages weights `[1, 2, 3, 4, 5]`, days `D = 3`. Find min capacity to ship in order without reordering.

```python
def can_ship(weights: list[int], days: int, cap: int) -> bool:
    used, load = 1, 0
    for w in weights:
        if w > cap:
            return False
        if load + w > cap:
            used += 1
            load = 0
        load += w
    return used <= days


def ship_within_days(weights: list[int], days: int) -> int:
    lo = max(weights)
    hi = sum(weights)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if can_ship(weights, days, mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

`lo` starts at the heaviest package (capacity cannot be smaller). `hi` is "ship everything in one day." The loop lands on the minimum capacity that still finishes in `days`.

---

## Pattern 4: rotated sorted array (still binary search)

Array was sorted, then rotated: `[4, 5, 6, 7, 0, 1, 2]`. One half is always sorted. Compare `target` against the sorted half to decide which side to drop.

```python
def search_rotated(a: list[int], target: int) -> int:
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[lo] <= a[mid]:  # left half sorted
            if a[lo] <= target < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:  # right half sorted
            if a[mid] < target <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
```

Duplicates make the `a[lo] <= a[mid]` test ambiguous when `a[lo] == a[mid] == a[hi]`. Then you may need to shrink one end linearly in the worst case. Say that out loud in interviews; it shows you know the limit.

---

## Off-by-one traps that actually bite

These are the bugs I see most, including my own.

### Closed vs half-open

| Style | Init | Loop | On `a[mid] < target` | On else |
| --- | --- | --- | --- | --- |
| Half-open `[lo, hi)` | `hi = n` | `while lo < hi` | `lo = mid + 1` | `hi = mid` |
| Closed `[lo, hi]` | `hi = n - 1` | `while lo <= hi` | `lo = mid + 1` | `hi = mid - 1` |

Mixing styles mid-function is the classic infinite loop: `hi = mid` with `while lo <= hi` and no progress when `lo == hi`.

Pick one style per function and stick to it. I default to half-open for bounds, closed when the problem text thinks in inclusive indices.

### Infinite loop with `mid = (lo + hi) // 2`

When `hi = lo + 1` and you set `lo = mid` (not `mid + 1`) on the "go right" branch, `mid` stays `lo` forever. Fix: either use half-open with `lo = mid + 1`, or for "maximize" searches use `mid = lo + (hi - lo + 1) // 2` (bias up) when you write `lo = mid`.

```python
# Maximize: last True under a monotone predicate on [lo, hi]
def max_true(lo: int, hi: int, ok) -> int:
    while lo < hi:
        mid = lo + (hi - lo + 1) // 2  # bias upward
        if ok(mid):
            lo = mid
        else:
            hi = mid - 1
    return lo
```

### Empty array and single element

Always test `[]`, `[x]` with hit and miss, and two elements. Those sizes break sloppy mid updates first.

### Integer overflow on bounds

Answer-space problems can push `hi` to `10**18`. In C++/Java, `lo + hi` overflows; prefer `lo + (hi - lo) / 2`. In Python you are fine, but interviewers still notice the safe form.

### Predicate direction

For "minimum capacity," when `feasible(mid)` is true you set `hi = mid` (keep mid). When false, `lo = mid + 1`. Flip that once and you return a capacity that does not work, or you loop forever. Write the English sentence above the loop before you code.

### Floating point binary search

Rare in interviews, common for geometric "smallest radius" problems. Use a fixed iteration count (60-100) or an epsilon on `hi - lo`. Do not compare floats with `==`. Prefer integer search on scaled units when you can.

---

## A decision checklist

Before you type `mid = ...`:

1. **What is the search space?** Indices into an array, or candidate answers on a number line?
2. **What is monotonic?** Sorted values, or `feasible(x)` flipping once from false to true?
3. **What do you return?** Any match, leftmost, rightmost, insertion point, min true, max true?
4. **Half-open or closed?** One style only.
5. **Bounds?** Can `lo` start at 0 / max(element)? Is `hi` exclusive `n`, or inclusive `n-1`, or a proven max capacity?
6. **Empty and edge cases** written down before the happy path.

If you cannot answer (2), stop. Linear scan or a different algorithm may be correct; binary search is not.

---

## Production notes (not only LeetCode)

Binary search shows up outside interviews:

* **Config / feature rollout:** find the first build id that regressed a metric (search over ordered deploys with a flake-aware check).
* **Autoscaling thresholds:** binary search a concurrency or batch size until latency SLO fails.
* **Database / storage:** B-tree leaf search is the same idea; your app code rarely reimplements it, but the invariant is identical.
* **Game / sim tuning:** min time step, max load, spawn rate that still stays under a budget.

In production the `feasible` call is often an experiment or a load test, so iteration count matters more than micro-optimizing mid. Still log every `(lo, hi, mid, result)` so a non-monotone metric does not silently return nonsense.

---

## Cheat sheet

| Goal | Template |
| --- | --- |
| Find any equal | classic; return mid on match |
| First `>= x` | lower_bound; `if a[mid] < x: lo = mid+1 else hi = mid` |
| First `> x` | upper_bound; `if a[mid] <= x: lo = mid+1 else hi = mid` |
| Count equals | `upper - lower` |
| Min `x` with ok(x) | if ok: `hi = mid` else `lo = mid+1` |
| Max `x` with ok(x) | bias mid up; if ok: `lo = mid` else `hi = mid-1` |
| Rotated array | identify sorted half; discard the other |

Memorize the **invariants**, not twelve problem names. Once lower/upper bound and answer-space search are muscle memory, most "binary search" LeetCode tags are the same loop with a different `feasible`.

---

## Closing

Binary search fails when the range does not shrink, the predicate is not monotone, or you mix closed and half-open updates. Nail those three and the rest is naming.

If you only practice one drill this week: implement lower_bound and min-feasible from scratch twice, without looking, and run them on empty, one-element, and all-duplicates arrays. That covers most of what interviews and production actually ask for.
