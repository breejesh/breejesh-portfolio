---
title: "File System: In-Memory Tree with Entry, File, and Directory (Java)"
description: "CTCI-style problem 7.11 for beginners: design an in-memory file system. Shared Entry base, File leaves, Directory nodes, recursive size, and path helpers in Java."
date: "2025-11-09"
tags: [Algorithms & Data Structures, Developer Tools & Policy, System Design & Architecture]
coverImage: /assets/images/ctci-7-11-file-system.webp
previewImage: /assets/images/ctci-7-11-file-system.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 7.11 for beginners: design an in-memory file system. Shared Entry base, File leaves, Directory nodes, recursive size, and path helpers in Java.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

An interview says: design an **in-memory file system**. No disk drivers. No block allocation. Just the objects and algorithms you would use for folders and files in RAM, with a small code sketch.

This is object-oriented design, not a kernel tutorial. The classic shape is a **tree**: a shared `Entry` base, `File` leaves, and `Directory` nodes that hold more entries. This post is original teaching for beginners in **Java**. Same problem family as classic OOD interview questions, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 7, object-oriented design.

---

## 1. Everyday analogy

Think of a physical filing cabinet.

* A **folder** can hold papers and other folders.
* A **paper** holds text. It does not hold other folders.
* Every item has a **name**, sits inside a parent folder (except the root drawer), and was created or last touched at some time.
* The **size** of a paper is how long the text is. The size of a folder is the sum of everything inside it, nested folders included.

That cabinet is a tree. The root is the top drawer. Paths like `docs/notes/todo.txt` are walks down named children. Delete a paper by asking its parent folder to remove it. Rename is just changing the name field (and maybe re-keying a child map).

You are not designing hard drives. You are modeling that cabinet with classes.

---

## 2. Plain problem statement

**Goal:** explain the data structures and algorithms for a simple **in-memory** file system, and illustrate with code where it helps.

**Core concepts:**

* **File:** named blob of content (for the sketch, a `String` is enough) plus a size.
* **Directory:** named container of child entries (files and subdirectories).
* **Shared metadata:** name, parent, created / last updated / last accessed times.
* **Operations people expect:** create, delete, rename, get full path, compute size, list children, maybe count files.

**Clarify in the interview:**

* In memory only? Yes for this problem. Persistence is out of scope unless asked.
* Soft links, hard links, permissions, users? Nice follow-ups. Start without them.
* Case sensitivity, invalid characters, max path length? Mention and pick simple rules.
* Unique names per directory? Yes: two children under the same parent should not share a name.
* Root has no parent. Deleting the root is either forbidden or a special case.

**Shape of the type hierarchy:**

```
Entry (abstract)
  ├── File
  └── Directory  (holds List or Map of Entry)
```

`size()` is abstract on `Entry`. Files return their own size. Directories sum children.

---

## 3. Think first

### Why a shared base class

Files and directories both have name, parent, and timestamps. Both need delete and full path. Duplicating those fields on two unrelated classes is noisy. Put shared state and behavior on `Entry`. Make `size()` abstract so each type answers differently.

Composition alone (a free-standing node object with a type flag) also works. Inheritance is the usual teaching version because `instanceof` and polymorphism show up naturally when walking children.

### Tree links

* **Parent pointer** on every entry (null for root): makes `getFullPath()` and `delete()` easy.
* **Children collection** only on `Directory`.
* Use `ArrayList<Entry>` if you care about insertion order and simple code.
* Use `HashMap<String, Entry>` keyed by name if you want O(1) lookup by child name (better for path resolve).

A solid default for interviews: `Map<String, Entry>` for children, plus a note that you can keep a list if you need stable ordering.

### Path resolution

Split a path on `/`. Start at root (or current working directory). For each segment, look up the child. Fail if a segment is missing or if you try to walk into a file as if it were a directory.

Absolute path: start at root. Relative path: start at a given directory. Either is fine if you state which.

### Size and number of files

Directory `size()` walks the subtree and sums. That is O(subtree) unless you **cache** sizes and update on mutate (optimization follow-up).

`numberOfFiles()` can count only files, or count files plus directories. Say which. A recursive walk is enough for the sketch.

### Alternate: two lists in Directory

You could keep `List<File>` and `List<Directory>` separately. Counting is cleaner (no `instanceof`), but mixed sort by name or date across both types gets awkward. One list of `Entry` is simpler for "list everything."

### What you are not building

Block maps, inode tables, journaling, concurrency locks across mounts. If the interviewer wants OS depth, ask which layer. For 7.11, object model of a tree is the win.

### Design sketch on the whiteboard

1. Draw `Entry` with `name`, `parent`, times, abstract `size()`, `delete()`, `getFullPath()`.
2. Draw `File` with `content` and fixed or stored size.
3. Draw `Directory` with children map, `addEntry`, `deleteEntry`, recursive `size`.
4. Walk one example tree: `/home/notes.txt` and show path and size math.

---

## 4. Java solution

Clean teaching version. Children live in a `LinkedHashMap` so lookup is fast and insertion order is stable.

```java
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Shared node in the in-memory file system tree. */
abstract class Entry {
    protected Directory parent;
    protected String name;
    protected final long created;
    protected long lastUpdated;
    protected long lastAccessed;

    Entry(String name, Directory parent) {
        this.name = name;
        this.parent = parent;
        long now = System.currentTimeMillis();
        this.created = now;
        this.lastUpdated = now;
        this.lastAccessed = now;
    }

    abstract int size();

    /** Ask the parent to drop this entry. Root cannot delete itself this way. */
    boolean delete() {
        if (parent == null) {
            return false;
        }
        return parent.deleteEntry(this);
    }

    String getFullPath() {
        if (parent == null) {
            return name == null ? "" : name;
        }
        String parentPath = parent.getFullPath();
        if (parentPath.isEmpty() || parentPath.equals("/")) {
            return "/" + name;
        }
        return parentPath + "/" + name;
    }

    void changeName(String newName) {
        if (parent != null) {
            parent.renameChild(this, newName);
        } else {
            this.name = newName;
            touch();
        }
    }

    String getName() {
        return name;
    }

    Directory getParent() {
        return parent;
    }

    long getCreated() {
        return created;
    }

    long getLastUpdated() {
        return lastUpdated;
    }

    long getLastAccessed() {
        return lastAccessed;
    }

    protected void touch() {
        long now = System.currentTimeMillis();
        lastUpdated = now;
        lastAccessed = now;
    }
}

class File extends Entry {
    private String content;
    private int size;

    File(String name, Directory parent, int size) {
        super(name, parent);
        this.size = Math.max(0, size);
        this.content = "";
    }

    @Override
    int size() {
        return size;
    }

    String getContents() {
        lastAccessed = System.currentTimeMillis();
        return content;
    }

    void setContents(String content) {
        this.content = content == null ? "" : content;
        this.size = this.content.length();
        touch();
    }
}

class Directory extends Entry {
    private final Map<String, Entry> children = new LinkedHashMap<>();

    Directory(String name, Directory parent) {
        super(name, parent);
    }

    @Override
    int size() {
        int total = 0;
        for (Entry e : children.values()) {
            total += e.size();
        }
        return total;
    }

    void addEntry(Entry entry) {
        if (entry == null || entry.getName() == null) {
            throw new IllegalArgumentException("entry and name required");
        }
        if (children.containsKey(entry.getName())) {
            throw new IllegalStateException("name already exists: " + entry.getName());
        }
        children.put(entry.getName(), entry);
        entry.parent = this;
        touch();
    }

    boolean deleteEntry(Entry entry) {
        if (entry == null) {
            return false;
        }
        Entry removed = children.remove(entry.getName());
        if (removed == entry) {
            entry.parent = null;
            touch();
            return true;
        }
        // name collision or already gone: try identity scan
        return false;
    }

    void renameChild(Entry entry, String newName) {
        if (!children.containsKey(entry.getName()) || children.get(entry.getName()) != entry) {
            throw new IllegalStateException("entry is not a child of this directory");
        }
        if (children.containsKey(newName)) {
            throw new IllegalStateException("name already exists: " + newName);
        }
        children.remove(entry.getName());
        entry.name = newName;
        children.put(newName, entry);
        entry.touch();
        touch();
    }

    Entry getChild(String name) {
        return children.get(name);
    }

    Collection<Entry> getContents() {
        return Collections.unmodifiableCollection(children.values());
    }

    /** Count files and directories in this subtree (including nested). */
    int numberOfEntries() {
        int count = 0;
        for (Entry e : children.values()) {
            count++;
            if (e instanceof Directory) {
                count += ((Directory) e).numberOfEntries();
            }
        }
        return count;
    }

    int numberOfFilesOnly() {
        int count = 0;
        for (Entry e : children.values()) {
            if (e instanceof File) {
                count++;
            } else if (e instanceof Directory) {
                count += ((Directory) e).numberOfFilesOnly();
            }
        }
        return count;
    }

    /**
     * Resolve a simple absolute path from this directory if this is root-like,
     * or treat path as relative segments joined by '/'.
     * Empty segments from leading/trailing slashes are skipped.
     */
    Entry resolve(String path) {
        if (path == null || path.isEmpty()) {
            return this;
        }
        Entry current = this;
        String[] parts = path.split("/");
        for (String part : parts) {
            if (part.isEmpty() || part.equals(".")) {
                continue;
            }
            if (part.equals("..")) {
                if (current.parent != null) {
                    current = current.parent;
                }
                continue;
            }
            if (!(current instanceof Directory)) {
                return null;
            }
            current = ((Directory) current).getChild(part);
            if (current == null) {
                return null;
            }
        }
        return current;
    }
}

/** Tiny demo of building a tree and querying it. */
class FileSystemDemo {
    public static void main(String[] args) {
        Directory root = new Directory("", null); // root path pieces show as /name

        Directory home = new Directory("home", null);
        Directory docs = new Directory("docs", null);
        File notes = new File("notes.txt", null, 0);
        File readme = new File("README.md", null, 0);

        root.addEntry(home);
        home.addEntry(docs);
        home.addEntry(readme);
        docs.addEntry(notes);

        notes.setContents("buy milk");
        readme.setContents("hello");

        System.out.println(notes.getFullPath());   // /home/docs/notes.txt
        System.out.println(docs.size());           // length of "buy milk"
        System.out.println(home.size());           // notes + readme
        System.out.println(home.numberOfFilesOnly()); // 2

        Entry found = root.resolve("/home/docs/notes.txt");
        System.out.println(found != null && found.getName().equals("notes.txt"));

        notes.delete();
        System.out.println(docs.getChild("notes.txt") == null);
    }
}
```

Walkthrough of the demo tree:

| Step | Structure | Notes |
| --- | --- | --- |
| start | `root` | parent is null |
| add | `root/home` | directory |
| add | `home/docs`, `home/README.md` | mixed children |
| add | `docs/notes.txt` | file leaf |
| write | notes content `"buy milk"` | size becomes 8 |
| path | `notes.getFullPath()` | walks parents with `/` |
| size | `home.size()` | recursive sum of files below |
| resolve | `/home/docs/notes.txt` | map lookups per segment |
| delete | `notes.delete()` | parent removes by name |

---

## 5. Complexity table

| Operation | Time | Extra space | Notes |
| --- | --- | --- | --- |
| `addEntry` / `deleteEntry` / `getChild` | O(1) average | O(1) | with `HashMap` / `LinkedHashMap` by name |
| `getFullPath` | O(depth) | O(depth) for string building | parent walk |
| `size()` on a directory | O(subtree size) | O(depth) recursion | can cache if hot |
| `numberOfFilesOnly` | O(subtree size) | O(depth) | same walk style |
| `resolve(path)` | O(segments) map lookups | O(1) besides path split | fails fast on missing child |
| Whole tree storage | - | O(n) entries | n = files + directories |

Interviewers care that you chose a tree, shared metadata, and recursive size, not that you micro-optimized path caches.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Root delete:** `parent == null`, so `delete()` returns false. Do not NPE.
* **Duplicate names** under one directory: reject on add, or define overwrite policy up front.
* **Delete while iterating children:** remove by name from the map; do not rely on list identity only.
* **Empty root name:** path formatting can start with `/` + child name. Be consistent.
* **Walking into a file:** `resolve` must stop or fail if a non-directory segment is not the last one.
* **Cycles:** normal create APIs never set a directory as its own ancestor. If you add `move`, check for cycle.
* **Null content:** treat as empty string; size 0.
* **Large trees:** recursive `size()` can blow the stack on pathological depth; mention iterative walk as a hardening step.

Common mistakes:

1. **No shared base.** Copy-pasting timestamps into File and Directory, then forgetting one method.
2. **Directory size as number of direct children only.** Interviewers often want recursive total bytes.
3. **List without unique names.** Two `notes.txt` under the same folder, and lookup becomes ambiguous.
4. **Forgetting to clear parent on delete.** Orphan still points at a directory that no longer lists it.
5. **Building a full OS.** Blocks, permissions, and mounts before you have a working tree.
6. **Hard-coding only files in a flat map.** That is a key-value store, not a hierarchical file system.

Minimal smoke idea:

```java
Directory root = new Directory("", null);
Directory a = new Directory("a", null);
File f = new File("f.txt", null, 0);
root.addEntry(a);
a.addEntry(f);
f.setContents("hi"); // size 2
assert a.size() == 2;
assert root.resolve("a/f.txt") == f;
assert f.delete();
assert a.getChild("f.txt") == null;
```

---

## 7. Explain to a friend recap

In-memory file system design, interview version:

1. Model a **tree**, not a disk.
2. Put shared fields on abstract **`Entry`**: name, parent, times, `delete`, `getFullPath`, abstract `size()`.
3. **`File`** holds content and returns its own size.
4. **`Directory`** holds a map of children, sums sizes recursively, adds and removes entries.
5. Paths are walks: split on `/`, look up each name, fail cleanly when missing.
6. Start simple. Links, permissions, and cached sizes are follow-ups once the tree is solid.

If you can draw the hierarchy, explain why `size()` is polymorphic, and show add/delete/path on a tiny example, you own problem 7.11.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Minesweeper](/blog/en/ctci-7-10-minesweeper)
* Next: [Hash Table](/blog/en/ctci-7-12-hash-table)