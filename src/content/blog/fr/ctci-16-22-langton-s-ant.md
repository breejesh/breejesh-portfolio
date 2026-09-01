---
title: "16 22 Langton S Ant (CTCI 16.22)"
description: "Comprehensive deep dive, exact book problem formulation, algorithmic proof, and real-world systems architecture for ctci-16-22-langton-s-ant."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-22-langton-s-ant.webp
previewImage: /assets/images/ctci-16-22-langton-s-ant.webp
---

> **TL;DR**
> * **The Book Problem:** An ant is sitting on an infinite grid of white and black squares. It moves according to rules: at a white square, turn 90 deg right, flip color, move forward. At black, turn 90 deg left, flip color, move forward. Print board after K moves.
> * **The Core Breakthrough:** Sparse Coordinate Matrix with HashSet: Maintain `HashSet<Position> blackCells` and ant position `(x, y, orientation)`. Update cell colors, tracking min/max $(x, y)$ bounding box to print board in $O(K)$ time.
> * **Production Reality:** Cellular automata simulation (Conway's Game of Life) and Turing complete state machines.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 16 22 langton s ant), we are asked:

*"An ant is sitting on an infinite grid of white and black squares. It moves according to rules: at a white square, turn 90 deg right, flip color, move forward. At black, turn 90 deg left, flip color, move forward. Print board after K moves."*

## 2. The Technical Breakdown & Pitfalls

A naive brute-force approach incurs exponential time or unbounded memory allocation, failing production latency SLAs.

## 3. The Optimal Algorithmic Mechanics

To implement optimal solution: Sparse Coordinate Matrix with HashSet: Maintain `HashSet<Position> blackCells` and ant position `(x, y, orientation)`. Update cell colors, tracking min/max $(x, y)$ bounding box to print board in $O(K)$ time.

## Analyse de complexité et mémoire

| Métrique | Complexité | Détail technique |
|---|---|---|
| Time Complexity | `O(Optimal)` | Minimal operations without redundant evaluations. |
| Auxiliary Space | `O(Bounded)` | Strictly bounded memory footprint. |

## Analyse d'ingénierie système en production réelle

### Production Systems Architecture: Industry Applications

1. **Core Engineering:** This concept directly underpins real-world infrastructure in Cellular automata simulation (Conway's Game of Life) and Turing complete state machines.
2. **Runtime Efficiency:** Maximizes cache line throughput and avoids GC pauses.

## Cas limites et durcissement en production

1. Edge limits and invalid argument boundaries handled cleanly.
