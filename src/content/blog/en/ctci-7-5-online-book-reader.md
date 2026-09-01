---
title: "Online Book Reader: Object-Oriented System Architecture (CTCI 7.5)"
description: "Design the data structures and class models for an online book reader system separating active user session state from library repositories in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-7-5-online-book-reader.webp
previewImage: /assets/images/ctci-7-5-online-book-reader.webp
---

> **TL;DR**
> * **The Book Problem:** Design the data structures for an online book reader system.
> * **The Optimal Solution:** Decoupled State & Repository Architecture: (1) Core domain models `Book` (metadata, page content) and `User` (account, membership type); (2) Repository layer `Library` (catalog indexed by `bookId`) and `UserManager` (account database indexed by `userId`); (3) Presentation engine `Display` tracking the currently active book, active user, and page number; (4) Master facade `OnlineReaderSystem` coordinating operations in $O(1)$ dictionary lookups.
> * **Production Reality:** E-reader cloud platforms (Amazon Kindle Cloud Reader / Apple Books) and digital subscription services (O'Reilly Learning).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 7.5), we are asked:

*"Design the data structures for an online book reader system."*

## 2. Component Class Architecture

1. **`Book`:** `bookId`, `title`, `author`, `List<String> pages`. Provides `getPage(int pageNumber)`.
2. **`User`:** `userId`, `username`, `accountType`.
3. **`Library`:** Manages the collection of books via `HashMap<Integer, Book> books`. Supports `addBook()`, `removeBook()`, `find(int id)`.
4. **`UserManager`:** Manages registered accounts via `HashMap<Integer, User> users`.
5. **`Display`:** Encapsulates the active view rendering: `Book activeBook`, `User activeUser`, `int pageNumber`.
6. **`OnlineReaderSystem`:** Singleton system facade coordinating `Library`, `UserManager`, and `Display`.

## Production Implementation

```java
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class OnlineBookReader {
    public static class Book {
        private final int bookId;
        private String title;
        private String author;
        private List<String> pages;

        public Book(int id, String title, String author, List<String> pages) {
            this.bookId = id;
            this.title = title;
            this.author = author;
            this.pages = pages;
        }

        public int getID() { return bookId; }
        public String getTitle() { return title; }
        public String getAuthor() { return author; }
        public String getPage(int pageNumber) {
            if (pageNumber >= 0 && pageNumber < pages.size()) {
                return pages.get(pageNumber);
            }
            return null;
        }
        public int getTotalPages() { return pages.size(); }
    }

    public static class User {
        private final int userId;
        private String username;
        private int accountType;

        public User(int id, String name, int type) {
            this.userId = id;
            this.username = name;
            this.accountType = type;
        }

        public int getID() { return userId; }
        public String getUsername() { return username; }
    }

    public static class Library {
        private final Map<Integer, Book> books = new HashMap<>();

        public void addBook(Book b) { books.put(b.getID(), b); }
        public boolean removeBook(int id) { return books.remove(id) != null; }
        public Book find(int id) { return books.get(id); }
    }

    public static class UserManager {
        private final Map<Integer, User> users = new HashMap<>();

        public void addUser(User u) { users.put(u.getID(), u); }
        public boolean removeUser(int id) { return users.remove(id) != null; }
        public User find(int id) { return users.get(id); }
    }

    public static class Display {
        private Book activeBook;
        private User activeUser;
        private int pageNumber = 0;

        public void displayUser(User user) { this.activeUser = user; }
        public void displayBook(Book book) {
            this.activeBook = book;
            this.pageNumber = 0;
            refresh();
        }

        public void nextPage() {
            if (activeBook != null && pageNumber < activeBook.getTotalPages() - 1) {
                pageNumber++;
                refresh();
            }
        }

        public void previousPage() {
            if (activeBook != null && pageNumber > 0) {
                pageNumber--;
                refresh();
            }
        }

        public void refresh() {
            // Render active page content on physical screen
        }

        public int getPageNumber() { return pageNumber; }
        public Book getActiveBook() { return activeBook; }
    }

    public static class OnlineReaderSystem {
        private final Library library;
        private final UserManager userManager;
        private final Display display;

        public OnlineReaderSystem() {
            this.library = new Library();
            this.userManager = new UserManager();
            this.display = new Display();
        }

        public Library getLibrary() { return library; }
        public UserManager getUserManager() { return userManager; }
        public Display getDisplay() { return display; }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| findBook() / findUser() | `O(1)` | Hash table key lookup. |
| nextPage() / previousPage() | `O(1)` | Direct page index increment and bound check. |
| Auxiliary Space | `O(B * P + U)` | Storage proportional to total books $B$, pages $P$, and users $U$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Cloud E-Reader Subsystems

1. **Kindle Whispersync Protocol:** Synchronizes active reading positions, highlights, and annotations across multiple mobile and e-ink clients using monotonic sequence clocks.
2. **Multi-Tenant DRM Access Tokens:** Validates concurrent user session limits before serving encrypted book page slices from CDN caches.

## Edge Cases & Production Hardening

1. **Page boundary underflow/overflow:** `nextPage()` and `previousPage()` guard against negative indices and out-of-range bounds.
2. **Missing book/user queries:** Handled cleanly with null-safe map operations.
