---
title: "Master Mind: Two-Pass Frequency Histogram Matching (CTCI 16.15)"
description: "Compute exact Hits and Pseudo-Hits for Master Mind guesses using a two-pass color frequency histogram and character masking in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-16-15-master-mind.webp
previewImage: /assets/images/ctci-16-15-master-mind.webp
---

> **TL;DR**
> * **The Book Problem:** In Master Mind, the computer has 4 slots filled with colors: Red (`R`), Yellow (`Y`), Green (`G`), or Blue (`B`). A "hit" occurs when the guess matches both color and slot. A "pseudo-hit" occurs when the guessed color exists in the solution but in a different unmatched slot. Compute the total hits and pseudo-hits for any guess.
> * **The Optimal Solution:** **Two-Pass Frequency Histogram Matching**:
>   1. **Pass 1 (Hits)**: Iterate over the 4 slots. If `guess[i] == solution[i]`, increment `hits++`. Otherwise, record unmatched color frequencies in `solutionFrequencies[]` and `guessFrequencies[]`.
>   2. **Pass 2 (Pseudo-Hits)**: For each distinct color $c \in \{R, G, B, Y\}$, add the minimum count to pseudo-hits:
>      $$\text{pseudoHits} += \min(\text{solutionFrequencies}[c], \text{guessFrequencies}[c])$$
>   3. Runs in **$O(1)$ time** (or $O(N)$ for $N$-length boards) and strictly **$O(1)$ space**.
> * **Production Reality:** Fuzzy string distance algorithms, Wordle game engines, and DNA nucleotide sequence alignment.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16.15), we are asked:

*"Given a solution string (e.g. 'RGGB') and a guess string (e.g. 'YRGB'), calculate the exact number of hits and pseudo-hits without double-counting matched slots."*

## 2. Two-Pass Histogram Matching Architecture

```
Solution: R  G  G  B
Guess:    Y  R  G  B
          │  │  │  │
          │  │  ├──┼──> Slot 2: 'G' == 'G' (HIT!)
          │  │  │  └──> Slot 3: 'B' == 'B' (HIT!)
          │  └──┴─────> Slot 1: 'R' in guess, 'G' in solution (Unmatched)
          └───────────> Slot 0: 'Y' in guess, 'R' in solution (Unmatched)

Pass 2:
  Unmatched Solution: { R: 1, G: 1 }
  Unmatched Guess:    { Y: 1, R: 1 }
  Intersection:       min(Sol[R], Guess[R]) = 1 ('R' is a PSEUDO-HIT!)
Total Result: Hits = 2, Pseudo-Hits = 1
```

## Production Java Implementation

```java
public class MasterMind {

    public static class Result {
        public final int hits;
        public final int pseudoHits;

        public Result(int hits, int pseudoHits) {
            this.hits = hits;
            this.pseudoHits = pseudoHits;
        }

        @Override
        public String toString() {
            return "Hits: " + hits + ", Pseudo-Hits: " + pseudoHits;
        }
    }

    private static final int CODE_R = 0;
    private static final int CODE_G = 1;
    private static final int CODE_B = 2;
    private static final int CODE_Y = 3;

    private static int code(char c) {
        switch (c) {
            case 'R': case 'r': return CODE_R;
            case 'G': case 'g': return CODE_G;
            case 'B': case 'b': return CODE_B;
            case 'Y': case 'y': return CODE_Y;
            default: return -1;
        }
    }

    public static Result estimate(String guess, String solution) {
        if (guess == null || solution == null || guess.length() != solution.length()) {
            return new Result(0, 0);
        }

        int hits = 0;
        int[] solutionFrequencies = new int[4];
        int[] guessFrequencies = new int[4];

        // Pass 1: Count exact hits and build frequency histograms for unmatched slots
        for (int i = 0; i < guess.length(); i++) {
            char g = guess.charAt(i);
            char s = solution.charAt(i);

            if (g == s) {
                hits++;
            } else {
                int codeG = code(g);
                int codeS = code(s);
                if (codeG >= 0) guessFrequencies[codeG]++;
                if (codeS >= 0) solutionFrequencies[codeS]++;
            }
        }

        // Pass 2: Calculate pseudo-hits via histogram overlap
        int pseudoHits = 0;
        for (int c = 0; c < 4; c++) {
            pseudoHits += Math.min(guessFrequencies[c], solutionFrequencies[c]);
        }

        return new Result(hits, pseudoHits);
    }
}
```

## Complexity Analysis

| Metric | Fixed 4-Slot Game | Generalized $N$-Slot Game |
|---|---|---|
| **Time Complexity** | `O(1)` | $O(N)$ single-pass scan |
| **Auxiliary Space** | `O(1)` | $O(\Sigma)$ color alphabet size ($\Sigma = 4$) |
| **Hit Isolation** | Guaranteed | Prevents already-hit slots from triggering pseudo-hits |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Wordle Engines & Bioinformatics

1. **Wordle Letter Scoring:** Wordle evaluates 5-letter guesses using the exact same two-pass histogram algorithm: Green (Hit $\to$ exact index match) is extracted first to prevent yellow (Pseudo-Hit $\to$ misplaced letter) from inflating letter frequency bounds.
2. **Bioinformatics Sequence Comparison:** Hamming distance (Hits) and $k$-mer frequency overlap (Pseudo-Hits) evaluate genomic DNA read alignments.

## Edge Cases & Production Hardening

1. **Duplicate Letters in Guess:** If solution is `"RGBY"` and guess is `"RRRR"`, output is correctly `1 Hit, 0 Pseudo-Hits`.
2. **Case Insensitivity:** Normalized via uppercase/lowercase switch statements.
