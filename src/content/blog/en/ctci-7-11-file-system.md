---
title: "File System: In-Memory Hierarchical File and Directory Architecture (CTCI 7.11)"
description: "Design the data structures and algorithms for an in-memory hierarchical file system using composite tree patterns in O(D) path traversal time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-7-11-file-system.webp
previewImage: /assets/images/ctci-7-11-file-system.webp
---

> **TL;DR**
> * **The Book Problem:** Explain the data structures and algorithms that you would use to design an in-memory file system. Illustrate with an example in code where possible.
> * **The Optimal Solution:** **Composite Design Pattern**: (1) Abstract base class `Entry` holding `name`, `parent` directory reference, creation timestamps, abstract `int size()`, and `getFullPath()`; (2) `File` subclass extending `Entry` with `byte[] content` returning raw file size; (3) `Directory` subclass extending `Entry` holding `List<Entry> contents`, with recursive directory sizing, entry insertion, and deletion; (4) Resolves path lookups (`/usr/local/bin`) by tokenizing path segments in $O(D)$ traversal time (where $D$ is path depth).
> * **Production Reality:** In-memory pseudo-filesystems (Linux `procfs` / `sysfs` / `tmpfs`), cloud object storage hierarchy emulations (Amazon S3 bucket prefix trees), and Git tree object representations.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 7.11), we are asked:

*"Explain the data structures and algorithms that you would use to design an in-memory file system. Illustrate with an example in code where possible."*

## 2. Composite Object-Oriented Architecture

1. **`Entry` (Abstract Base Class):**
   * Encapsulates common file system node attributes: `name`, `parent` directory, `created`, `lastUpdated`, `lastAccessed`.
   * Defines abstract `int size()` and recursive `getFullPath()`.
2. **`File` (Extends `Entry`):**
   * Represents leaf nodes containing `byte[] content`.
   * Size equals content byte length.
3. **`Directory` (Extends `Entry`):**
   * Represents interior composite nodes holding `List<Entry> contents`.
   * `size()` sums sizes of all child entries recursively.
   * `addEntry(Entry entry)` and `deleteEntry(Entry entry)`.

## Production Implementation

```java
import java.util.ArrayList;
import java.util.List;

public class FileSystemDesign {
    public static abstract class Entry {
        protected Directory parent;
        protected long created;
        protected long lastUpdated;
        protected long lastAccessed;
        protected String name;

        public Entry(String n, Directory p) {
            this.name = n;
            this.parent = p;
            this.created = System.currentTimeMillis();
            this.lastUpdated = System.currentTimeMillis();
            this.lastAccessed = System.currentTimeMillis();
        }

        public boolean delete() {
            if (parent == null) return false;
            return parent.deleteEntry(this);
        }

        public abstract int size();

        public String getFullPath() {
            if (parent == null) return name;
            return parent.getFullPath() + "/" + name;
        }

        public String getName() { return name; }
        public void setName(String n) { this.name = n; }
    }

    public static class File extends Entry {
        private byte[] content;
        private int size;

        public File(String n, Directory p, int sz) {
            super(n, p);
            this.size = sz;
        }

        public int size() { return size; }
        public byte[] getContent() { return content; }
        public void setContent(byte[] c) {
            this.content = c;
            this.size = c == null ? 0 : c.length;
        }
    }

    public static class Directory extends Entry {
        protected List<Entry> contents;

        public Directory(String n, Directory p) {
            super(n, p);
            this.contents = new ArrayList<>();
        }

        public int size() {
            int size = 0;
            for (Entry e : contents) {
                size += e.size();
            }
            return size;
        }

        public int numberOfFiles() {
            int count = 0;
            for (Entry e : contents) {
                if (e instanceof Directory) {
                    Directory d = (Directory) e;
                    count += 1 + d.numberOfFiles();
                } else {
                    count++;
                }
            }
            return count;
        }

        public boolean deleteEntry(Entry entry) {
            return contents.remove(entry);
        }

        public void addEntry(Entry entry) {
            contents.add(entry);
        }

        public List<Entry> getContents() { return contents; }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| getFullPath() Time | `O(D)` | Ascends upward to root directory across tree depth $D$. |
| Directory size() Time | `O(N)` | Traverses all descendant nodes in the directory subtree. |
| Auxiliary Space | `O(N)` | Heap nodes proportional to total files and directories $N$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: In-Memory VFS (Virtual File System)

1. **Linux `tmpfs` & `procfs`:** Virtual kernel file system hierarchies expose runtime OS and process state structures as navigable files without physical disk backing.
2. **Amazon S3 Prefix Trees:** Emulates nested hierarchical folders on top of flat key-value object storage using delimiter (`/`) trie indices.

## Edge Cases & Production Hardening

1. **Root Directory Deletion:** Guarded by `if (parent == null) return false;`.
2. **Circular Symlink Traversal:** Production VFS layers track max symlink hop counters (e.g. `MAXSYMLINKS = 40`) to prevent infinite recursion.
