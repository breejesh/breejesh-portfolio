---
title: "Online Book Reader: User, Library, Display, and Reading Session (Java OOD)"
description: "CTCI-style problem 7.5 for beginners: design an online book reader with User, Book, Library, Display, and a single active reading session. Original Java sketch, not a product build."
date: "2026-04-24"
tags: [Algorithms]
coverImage: /assets/images/ctci-7-5-online-book-reader.webp
previewImage: /assets/images/ctci-7-5-online-book-reader.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 7.5 for beginners: design an online book reader with User, Book, Library, Display, and a single active reading session. Original Java sketch, not a product build.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

Design the **data structures** for an **online book reader**. Not a full Kindle clone. Not a distributed content CDN. An interview-sized object model: users join and renew membership, books live in a library, one active reader has one open book, and a display shows the current page.

This post is original teaching for beginners, with a **Java** sketch that keeps responsibilities split across small classes. Same family as classic CTCI object-oriented design prompts, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 7, object-oriented design, problem 7.5.

---

## 1. Everyday analogy

Think of a tiny neighborhood library that only has **one reading chair** and **one desk lamp**.

Members have library cards. The shelves hold books. When you sit down, you pick one book, open to a page, and the lamp lights that page. Someone else cannot sit in the same chair at the same time in this simplified story. When you leave, the next member sits, chooses a book, and the page resets.

That maps cleanly:

* **User** = member with a card and membership status
* **Book** = shelf item with an id and details
* **Library** = shelves and lookup
* **Display** = lamp and open page (what is on screen)
* **Session** = who is in the chair, which book is open, which page they are on
* **OnlineReaderSystem** = the front desk that wires the pieces together

The interview is not about shipping multiplayer reading. It is about **who owns which responsibility** so the main class does not become a 2000-line junk drawer.

---

## 2. Plain problem statement

**Prompt:** design the data structures for an online book reader system.

The classic prompt is thin on requirements. You must **state assumptions**. A reasonable beginner scope:

**Supported:**

* Create a user membership and renew it later
* Add, remove, and find books in a library
* Find users by id
* Open a book for the active user (start a reading session)
* Show user info, book title/details, and current page on a display
* Turn pages forward and backward
* At most **one active user** and **one active book** at a time (single session)

**Out of scope for this sketch (say so out loud):**

* Concurrent readers, device sync, DRM, payments, recommendations
* Full-text search ranking, catalogs with millions of titles
* Network protocol, offline download, annotations, highlights
* Permissions beyond a simple `accountType` int

**Goal in the interview:** name the classes, fields, and main methods. Show how setting the active user or active book updates the display. Keep the orchestrator thin.

**Signature shape (mental model):**

```java
// wire everything
OnlineReaderSystem system = new OnlineReaderSystem();

// catalog + membership
system.getLibrary().addBook(42, "Clean Code notes");
system.getUserManager().addUser(7, "Alex", /*accountType*/ 1);

// start a session: one user, one book
system.login(7);
system.openBook(42);
system.getDisplay().turnPageForward();
```

---

## 3. Think first

### Clarify before you draw boxes

Ask:

1. Single device / single session, or multi-user concurrent?
2. Do we store page progress per user per book, or only "current open page"?
3. Search by id only, or by title?
4. Membership types matter for feature flags?

For a 45-minute whiteboard, pick **single active session**, **page on the display/session**, **lookup by id**, and a stub `renewMembership()`. Write those assumptions at the top of the board.

### Split by responsibility (not by "screens")

Bad default: dump users, books, pages, and UI refresh into one `OnlineReaderSystem` god class.

Better split:

| Class | Owns |
| --- | --- |
| `Book` | id, details (title/metadata blob for the sketch) |
| `User` | id, details, account type, renew membership |
| `Library` | map of book id to `Book`; add / remove / find |
| `UserManager` | map of user id to `User`; add / remove / find |
| `Display` | what the UI shows: active user, active book, page; refresh helpers |
| `ReadingSession` | who is logged in, which book is open, current page index |
| `OnlineReaderSystem` | creates the parts, login/openBook, delegates |

Why tear `Library`, `UserManager`, and `Display` off the main system? On a toy app it feels like extra files. As the system grows (search, loans, bookmarks), the main class stays a short coordinator instead of absorbing every feature.

### Session vs display

You can store "active user" and "active book" only on `OnlineReaderSystem` and keep `pageNumber` only on `Display`. That is valid.

Making **`ReadingSession`** explicit is often clearer in an interview:

* Session answers: *who is reading what, at which page?*
* Display answers: *how do we paint that state on the screen?*

When `openBook` runs, session updates, then display refreshes from session state.

### One active user, one active book

This is a **scope cut**, not a claim about real products. It removes locking, multi-tab sync, and "user A on phone, user B on tablet." State it. If the interviewer wants multi-session later, you add a map `userId -> ReadingSession` without redesigning `Book` and `Library`.

### Data structures

* `HashMap<Integer, Book>` in `Library` for O(1) find by id
* `HashMap<Integer, User>` in `UserManager` for O(1) find by id
* Optional later: title index, full-text, or catalog service (do not invent it unless asked)

---

## 4. Java solution (sketch)

This is interview-shaped code: constructors, maps, and the methods you would talk through. Not a GUI framework.

### Book and User

```java
public class Book {
    private int bookId;
    private String details;

    public Book(int id, String details) {
        this.bookId = id;
        this.details = details;
    }

    public int getId() { return bookId; }
    public void setId(int id) { this.bookId = id; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}

public class User {
    private int userId;
    private String details;
    private int accountType;

    public User(int id, String details, int accountType) {
        this.userId = id;
        this.details = details;
        this.accountType = accountType;
    }

    public void renewMembership() {
        // stub: extend expiry, reset flags, etc.
    }

    public int getId() { return userId; }
    public void setId(int id) { this.userId = id; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public int getAccountType() { return accountType; }
    public void setAccountType(int accountType) { this.accountType = accountType; }
}
```

`Book` and `User` are mostly data. That is fine. Behavior lives in managers and the session.

### Library and UserManager

```java
import java.util.HashMap;
import java.util.Map;

public class Library {
    private final Map<Integer, Book> books = new HashMap<>();

    public Book addBook(int id, String details) {
        if (books.containsKey(id)) {
            return null; // already catalogued
        }
        Book book = new Book(id, details);
        books.put(id, book);
        return book;
    }

    public boolean remove(Book book) {
        return book != null && remove(book.getId());
    }

    public boolean remove(int id) {
        if (!books.containsKey(id)) {
            return false;
        }
        books.remove(id);
        return true;
    }

    public Book find(int id) {
        return books.get(id);
    }
}

public class UserManager {
    private final Map<Integer, User> users = new HashMap<>();

    public User addUser(int id, String details, int accountType) {
        if (users.containsKey(id)) {
            return null;
        }
        User user = new User(id, details, accountType);
        users.put(id, user);
        return user;
    }

    public User find(int id) {
        return users.get(id);
    }

    public boolean remove(User user) {
        return user != null && remove(user.getId());
    }

    public boolean remove(int id) {
        if (!users.containsKey(id)) {
            return false;
        }
        users.remove(id);
        return true;
    }
}
```

Duplicate ids return `null` (or throw; pick one style and stick to it). Interviewers care that you **check before insert**.

### ReadingSession and Display

```java
public class ReadingSession {
    private User activeUser;
    private Book activeBook;
    private int pageNumber; // 0-based for the sketch

    public User getActiveUser() { return activeUser; }
    public Book getActiveBook() { return activeBook; }
    public int getPageNumber() { return pageNumber; }

    public void setActiveUser(User user) {
        this.activeUser = user;
        // new reader: clear book/page unless you want to restore saved progress
        this.activeBook = null;
        this.pageNumber = 0;
    }

    public void openBook(Book book) {
        this.activeBook = book;
        this.pageNumber = 0;
    }

    public void turnPageForward() {
        if (activeBook == null) {
            return;
        }
        pageNumber++;
    }

    public void turnPageBackward() {
        if (activeBook == null || pageNumber <= 0) {
            return;
        }
        pageNumber--;
    }

    public void clear() {
        activeUser = null;
        activeBook = null;
        pageNumber = 0;
    }
}

public class Display {
    private User activeUser;
    private Book activeBook;
    private int pageNumber;

    public void displayUser(User user) {
        activeUser = user;
        refreshUsername();
    }

    public void displayBook(Book book, int page) {
        activeBook = book;
        pageNumber = page;
        refreshTitle();
        refreshDetails();
        refreshPage();
    }

    public void refreshFromSession(ReadingSession session) {
        displayUser(session.getActiveUser());
        if (session.getActiveBook() != null) {
            displayBook(session.getActiveBook(), session.getPageNumber());
        } else {
            activeBook = null;
            pageNumber = 0;
            // clear book UI in a real app
        }
    }

    public void turnPageForward(ReadingSession session) {
        session.turnPageForward();
        pageNumber = session.getPageNumber();
        refreshPage();
    }

    public void turnPageBackward(ReadingSession session) {
        session.turnPageBackward();
        pageNumber = session.getPageNumber();
        refreshPage();
    }

    private void refreshUsername() { /* paint username */ }
    private void refreshTitle() { /* paint title */ }
    private void refreshDetails() { /* paint details */ }
    private void refreshPage() { /* paint page body */ }
}
```

Page bounds are soft here (no total page count on `Book`). If the interviewer wants hard limits, add `int pageCount` on `Book` and clamp in `turnPageForward`.

### OnlineReaderSystem

```java
public class OnlineReaderSystem {
    private final Library library;
    private final UserManager userManager;
    private final Display display;
    private final ReadingSession session;

    public OnlineReaderSystem() {
        library = new Library();
        userManager = new UserManager();
        display = new Display();
        session = new ReadingSession();
    }

    public Library getLibrary() { return library; }
    public UserManager getUserManager() { return userManager; }
    public Display getDisplay() { return display; }
    public ReadingSession getSession() { return session; }

    /** Put this member in the single reading chair. */
    public boolean login(int userId) {
        User user = userManager.find(userId);
        if (user == null) {
            return false;
        }
        session.setActiveUser(user);
        display.refreshFromSession(session);
        return true;
    }

    /** Open a catalogued book for the active user. */
    public boolean openBook(int bookId) {
        if (session.getActiveUser() == null) {
            return false;
        }
        Book book = library.find(bookId);
        if (book == null) {
            return false;
        }
        session.openBook(book);
        display.refreshFromSession(session);
        return true;
    }

    public void logout() {
        session.clear();
        display.refreshFromSession(session);
    }
}
```

Flow:

1. Catalog books and users through `Library` / `UserManager`
2. `login` binds the session user and paints identity
3. `openBook` binds the book, resets page, paints title and page 0
4. Display page turns update session then refresh only the page region

---

## 5. Walk-through

Seed data:

```java
OnlineReaderSystem app = new OnlineReaderSystem();
app.getUserManager().addUser(1, "Sam", 1);
app.getLibrary().addBook(100, "Algorithms notes");
app.getLibrary().addBook(200, "System design notes");
```

**Login Sam, open book 100:**

1. `login(1)` finds user 1, session.activeUser = Sam, page/book cleared, display shows Sam
2. `openBook(100)` finds book 100, session.activeBook set, pageNumber = 0, display shows title and page 0
3. `display.turnPageForward(session)` twice: pageNumber becomes 2, only page paint runs

**Switch books without logout:**

* `openBook(200)` replaces active book, page back to 0. Old book progress is not stored in this sketch (call that out).

**Logout:**

* `logout()` clears session; display refresh shows empty reader state.

**Failed paths:**

* `openBook` with no login: false, no book painted
* `login(99)` when user missing: false
* `addBook(100, ...)` twice: second call returns null

Tiny check table:

| Step | activeUser | activeBook | page |
| --- | --- | --- | --- |
| start | null | null | 0 |
| login(1) | Sam | null | 0 |
| openBook(100) | Sam | Algorithms notes | 0 |
| forward x2 | Sam | Algorithms notes | 2 |
| openBook(200) | Sam | System design notes | 0 |
| logout | null | null | 0 |

---

## 6. Edge cases and interview notes

* **No active user opens a book:** reject. Display should not invent a guest unless you designed guests.
* **Book removed while open:** either block remove while session holds that id, or clear session if `library.remove` hits the active book.
* **Page under/overflow:** clamp to `[0, pageCount-1]` if you add `pageCount`.
* **Duplicate user/book ids:** reject on add; do not overwrite silently unless product wants upsert.
* **Membership renew:** keep on `User` (or a `Membership` object) so billing is not mixed into `Display`.
* **Saved progress per user per book:** extend with `Map<UserBookKey, Integer> lastPage` or a `ReadingProgress` store. Session still holds the *current* open state.
* **Search by title:** `Library` can hold a second index; do not stuff string scan into `OnlineReaderSystem`.
* **Multiple sessions:** `Map<Integer, ReadingSession>` keyed by user id (or device id). Display becomes per-client.

Common mistakes:

1. **One mega class** with users, books, pages, and UI all as fields and methods.
2. **Forgetting to state** single-session and one-book constraints.
3. **Display owning the catalog** (UI should not be the database).
4. **No find-before-add** so maps silently overwrite.
5. **Page turns without an open book**, mutating a ghost page number.
6. **Jumping to microservices / Kafka** when the prompt asked for data structures on a whiteboard.

Minimal smoke idea:

```java
OnlineReaderSystem app = new OnlineReaderSystem();
assert app.getUserManager().addUser(1, "Sam", 1) != null;
assert app.getLibrary().addBook(10, "Demo") != null;
assert app.login(1);
assert app.openBook(10);
app.getDisplay().turnPageForward(app.getSession());
assert app.getSession().getPageNumber() == 1;
assert !app.openBook(999); // missing book
app.logout();
assert app.getSession().getActiveUser() == null;
```

---

## 7. Explain to a friend recap

Online book reader OOD, interview size:

1. **State assumptions:** membership, library lookup, read with one active user and one active book.
2. **Split classes:** `User`, `Book`, `Library`, `UserManager`, `Display`, `ReadingSession`, thin `OnlineReaderSystem`.
3. **Maps** for users and books by id. Add / remove / find live on the managers, not on the UI.
4. **Session** holds who is reading, which book is open, and the page.
5. **Display** paints from session (username, title, details, page) and handles page turns by updating session then refreshing.
6. **System** wires parts: login, openBook, logout. It does not become the library itself.
7. Scale talk is optional: multi-session map, saved progress, search index. Only if asked.

If you can draw the boxes and walk `login` then `openBook` then `turnPageForward` without mixing catalog logic into the display, you own problem 7.5.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Parking Lot](/blog/en/ctci-7-4-parking-lot)
* Next: [Jigsaw](/blog/en/ctci-7-6-jigsaw)