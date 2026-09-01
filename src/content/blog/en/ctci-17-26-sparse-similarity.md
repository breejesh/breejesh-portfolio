---
title: "Sparse Similarity: Inverted Index for Pairwise Document Jaccard Similarity (CTCI 17.26)"
description: "Compute Jaccard similarity across pairs of documents sharing words using an inverted index to skip non-intersecting document pairs in O(D * W + P) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-17-26-sparse-similarity.webp
previewImage: /assets/images/ctci-17-26-sparse-similarity.webp
---

> **TL;DR**
> * **The Book Problem:** You have a collection of documents, each represented by an array of distinct integers (words). Compute the similarity (Jaccard index = $\frac{|A \cap B|}{|A \cup B|}$) for all pairs of documents that have similarity $> 0$.
> * **The Optimal Solution:** **Inverted Index with Pair Intersection Aggregation**:
>   1. **Build Inverted Index**: Map each word (integer) to the list of document IDs containing it: `word -> [doc1, doc2, ...]`.
>   2. **Aggregate Intersections**: For each word, for every pair of document IDs in its list `(docA, docB)` where `docA < docB`, increment the shared word count `intersections[(docA, docB)]++`.
>   3. **Compute Jaccard Similarity**: For each document pair with intersection $> 0$:
>      $$\text{similarity} = \frac{\text{intersection}}{|\text{docA}| + |\text{docB}| - \text{intersection}}$$
>   4. Time: **$O(D \cdot W + P)$** where $D \cdot W$ is total words across all documents and $P$ is total co-occurrences. Space: **$O(D \cdot W)$**.
> * **Production Reality:** Search engine inverted index posting lists, MinHash locality-sensitive hashing (LSH), and recommendation system collaborative filtering item similarity matrices.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 17.26), we are asked:

*"The similarity of two documents is defined to be the size of the intersection divided by the size of the union. Given a collection of documents, design an algorithm to compute the similarity of all pairs of documents that have a similarity greater than zero."*

## 2. Inverted Index Intersection Strategy

```
Documents:
  13: {14, 15, 100, 9, 3}
  16: {32, 1, 9, 3, 5}
  19: {15, 29, 2, 6, 8, 7}
  24: {7, 10}

Inverted Index:
  14 -> [13]
  15 -> [13, 19]  ==> pair (13, 19) +1
  100 -> [13]
  9  -> [13, 16]  ==> pair (13, 16) +1
  3  -> [13, 16]  ==> pair (13, 16) +1
  7  -> [19, 24]  ==> pair (19, 24) +1

Shared Word Counts:
  (13, 16): 2 words (9, 3)
  (13, 19): 1 word (15)
  (19, 24): 1 word (7)

Jaccard calculation for (13, 16):
  |13| = 5, |16| = 5, intersection = 2
  union = 5 + 5 - 2 = 8
  similarity = 2 / 8 = 0.25
```

## Production Java Implementation

```java
import java.util.*;

public class SparseSimilarity {

    public static class DocPair {
        public final int doc1, doc2;
        public DocPair(int d1, int d2) {
            this.doc1 = Math.min(d1, d2);
            this.doc2 = Math.max(d1, d2);
        }
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof DocPair)) return false;
            DocPair p = (DocPair) o;
            return doc1 == p.doc1 && doc2 == p.doc2;
        }
        @Override
        public int hashCode() {
            return Objects.hash(doc1, doc2);
        }
    }

    public static Map<DocPair, Double> computeSimilarities(Map<Integer, int[]> documents) {
        // Step 1: Build inverted index
        Map<Integer, List<Integer>> invertedIndex = new HashMap<>();
        for (Map.Entry<Integer, int[]> entry : documents.entrySet()) {
            int docId = entry.getKey();
            for (int word : entry.getValue()) {
                invertedIndex.computeIfAbsent(word, k -> new ArrayList<>()).add(docId);
            }
        }

        // Step 2: Count intersections for document pairs
        Map<DocPair, Integer> intersections = new HashMap<>();
        for (List<Integer> docList : invertedIndex.values()) {
            int size = docList.size();
            for (int i = 0; i < size; i++) {
                for (int j = i + 1; j < size; j++) {
                    DocPair pair = new DocPair(docList.get(i), docList.get(j));
                    intersections.merge(pair, 1, Integer::sum);
                }
            }
        }

        // Step 3: Compute Jaccard similarities
        Map<DocPair, Double> result = new HashMap<>();
        for (Map.Entry<DocPair, Integer> entry : intersections.entrySet()) {
            DocPair pair = entry.getKey();
            int intersect = entry.getValue();
            int size1 = documents.get(pair.doc1).length;
            int size2 = documents.get(pair.doc2).length;
            double union = size1 + size2 - intersect;
            result.put(pair, intersect / union);
        }

        return result;
    }
}
```

## Complexity Analysis

| Phase | Time Complexity | Auxiliary Space |
|---|---|---|
| Inverted Index Build | $O(\sum |D_i|)$ | $O(\sum |D_i|)$ |
| Pair Intersection Counting | $O(\sum \binom{|L_w|}{2})$ | $O(\text{unique overlapping pairs})$ |
| Similarity Computation | $O(\text{pairs with intersection } > 0)$ | $O(\text{pairs with intersection } > 0)$ |
| **Total** | **$O(\sum |D_i| + P)$** | **$O(\sum |D_i|)$** |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Search Engines and Collaborative Filtering

1. **Search Engine Posting Lists:** Apache Lucene and Elasticsearch use inverted index posting lists to intersect query terms without scanning document text arrays sequentially.
2. **Item-to-Item Collaborative Filtering:** E-commerce recommendation engines calculate pairwise cosine or Jaccard similarity across customer purchase vectors by inverting the user-to-product interaction graph.

## Edge Cases & Production Hardening

1. **Empty Document Collection:** Returns empty map cleanly.
2. **No Overlapping Words:** Returns empty map without allocating pair entries.
3. **Identical Documents:** Computes similarity of `1.0` correctly via $A \cap A = A$.
