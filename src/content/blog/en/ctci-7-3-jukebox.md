---
title: "Jukebox: Songs, Playlists, Catalog, Users, and Payment (Java OOD)"
description: "CTCI-style problem 7.3 for beginners: design a musical jukebox with object-oriented classes. Model Song, Playlist, CD catalog, User, and coin payment, then wire a focused Java sketch around a play queue."
date: "2025-08-06"
tags: [Algorithms]
coverImage: /assets/images/ctci-7-3-jukebox.webp
previewImage: /assets/images/ctci-7-3-jukebox.webp
---


> **TL;DR**
> * **The Problem:** Optimizing algorithmic space and time complexity for core interview data structures.
> * **The Approach:** CTCI-style problem 7.3 for beginners: design a musical jukebox with object-oriented classes. Model Song, Playlist, CD catalog, User, and coin payment, then wire a focused Java sketch around a play queue.
> * **Complexity:** Optimal Time and Space trade-off with edge-case memory handling.

A **jukebox** is a music machine people walk up to, pick tracks, and hear them play in order. In an interview this is not about MP3 codecs. It is about **objects**, **who owns what**, and **which methods move a request from coin drop to speakers**.

This post is original teaching for beginners in **Java**. Same problem family as classic object-oriented design prompts, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 7, object-oriented design, problem 7.3.

---

## 1. Everyday analogy

Picture a diner booth machine with a glass front and a slot for coins.

* Inside sits a **catalog** of CDs. Each CD holds many **songs**.
* You drop money. The machine adds **credit**.
* You pick a CD, then a track. If you have enough credit, the track goes into a **playlist** (a queue).
* When the current song ends, the next one in the queue starts.
* Someone else can walk up later, add their own coins, and queue more songs.

Your code does not need to render the chrome box. It needs the same jobs: catalog, payment, selection, queue, and play.

---

## 2. Clarify before you design

OOD prompts stay vague on purpose. Ask, then **state assumptions** out loud.

Useful questions:

* Physical CDs, records, or pure digital files?
* Free or paid? Cash, coins, card, or account credits?
* One user at a time, or concurrent sessions?
* Can the same song appear twice in the queue?
* Who controls volume, skip, and stop: only the machine, or the current user?

**Assumptions for this post:**

* Simulation of a **physical-style** jukebox with a **CD catalog**.
* **Coin payment**: insert money, spend credit per song.
* **One active user session** at a time (typical bar machine).
* Songs are selected by id (or by CD + track index).
* Playlist is a **FIFO queue**. Same song may be queued more than once.
* One track plays at a time. Skip/stop are optional methods on the jukebox.

If your interviewer wants free unlimited play or multi-user accounts, change payment and `User` ownership. The rest of the shape usually still works.

---

## 3. Plain problem statement

**Goal:** design classes for a musical jukebox using object-oriented principles.

**Core jobs:**

| Job | Owner idea |
| --- | --- |
| Know songs and which CD they live on | `Song`, `CD`, `Catalog` |
| Hold upcoming tracks | `Playlist` (queue) |
| Track who is using the machine and how much credit they have | `User` |
| Accept money and charge for a pick | payment methods on `Jukebox` / credits on `User` |
| Coordinate select, pay, queue, play | `Jukebox` facade |

**Operations people actually use:**

1. Insert coins → gain credit.
2. Browse catalog → pick a song.
3. If credit is enough, deduct cost and enqueue the song.
4. Play current song; when finished, dequeue next.
5. Optional: skip current, clear queue, switch user.

**Signature shape (focused API):**

```java
void insertCoin(int cents);
boolean selectSong(String songId); // false if unknown or not enough credit
Song nowPlaying();
Song nextUp();
void skip(); // end current, start next if any
```

You can expand that API later. Interviews reward a **small, clear surface** first.

---

## 4. Think first: objects and responsibilities

### Data objects

* **`Song`**: id, title, artist, duration seconds, price in cents. Optional link to parent CD id.
* **`CD`**: id, title, artist, ordered list of songs.
* **`Catalog`**: map or set of CDs; lookup song by id across the collection.

Keep these mostly data plus simple getters. Catalog owns search so `Jukebox` does not loop every CD by hand in ten places.

### Behavior objects

* **`Playlist`**: queue of `Song`. Methods: `queue(Song)`, `peek()`, `poll()`, `isEmpty()`, maybe `size()`.
* **`User`**: id, name, current credit in cents. Methods: `addCredit`, `charge` (or check + deduct).
* **`Jukebox`**: holds catalog, playlist, current user, and currently playing song. All user-facing verbs live here.

### Payment without overbuilding

You do **not** need a bank SDK in an interview. A clean model is:

* `insertCoin(cents)` adds to the current user's credit.
* Each `Song` has a price (or a flat price on the jukebox).
* `selectSong` fails if credit < price.
* On success, deduct price, enqueue, and if nothing is playing, start the song.

If the interviewer cares about change-making, add a `dispenseChange()` that returns leftover credit when the user walks away. Until then, leave credit on the user.

### Who talks to whom

```
User --inserts coins / picks--> Jukebox
Jukebox --looks up--> Catalog --has--> CD --has--> Song
Jukebox --charges--> User
Jukebox --queues--> Playlist
Jukebox --plays--> current Song (from Playlist)
```

`Song` should not know about coins. `Playlist` should not know about CDs. That separation is the point of the exercise.

---

## 5. Focused Java sketch

This is interview-sized, not a product. Names stay short; real hardware and audio threads stay out.

```java
import java.util.*;

final class Song {
    final String id;
    final String title;
    final String artist;
    final int durationSec;
    final int priceCents;

    Song(String id, String title, String artist, int durationSec, int priceCents) {
        this.id = id;
        this.title = title;
        this.artist = artist;
        this.durationSec = durationSec;
        this.priceCents = priceCents;
    }
}

final class CD {
    final String id;
    final String title;
    final List<Song> tracks;

    CD(String id, String title, List<Song> tracks) {
        this.id = id;
        this.title = title;
        this.tracks = List.copyOf(tracks);
    }
}

final class Catalog {
    private final Map<String, Song> songsById = new HashMap<>();
    private final Map<String, CD> cdsById = new HashMap<>();

    void addCD(CD cd) {
        cdsById.put(cd.id, cd);
        for (Song s : cd.tracks) {
            songsById.put(s.id, s);
        }
    }

    Song findSong(String songId) {
        return songsById.get(songId);
    }

    Collection<CD> allCDs() {
        return Collections.unmodifiableCollection(cdsById.values());
    }
}

final class Playlist {
    private final Deque<Song> queue = new ArrayDeque<>();

    void queue(Song s) { queue.addLast(s); }
    Song peek() { return queue.peekFirst(); }
    Song poll() { return queue.pollFirst(); }
    boolean isEmpty() { return queue.isEmpty(); }
    int size() { return queue.size(); }
}

final class User {
    final String id;
    final String name;
    private int creditCents;

    User(String id, String name) {
        this.id = id;
        this.name = name;
    }

    int credit() { return creditCents; }

    void addCredit(int cents) {
        if (cents < 0) throw new IllegalArgumentException("cents");
        creditCents += cents;
    }

    boolean charge(int cents) {
        if (cents < 0 || creditCents < cents) return false;
        creditCents -= cents;
        return true;
    }
}

final class Jukebox {
    private final Catalog catalog;
    private final Playlist playlist = new Playlist();
    private User currentUser;
    private Song playing; // null if idle

    Jukebox(Catalog catalog, User user) {
        this.catalog = catalog;
        this.currentUser = user;
    }

    void setUser(User user) {
        this.currentUser = Objects.requireNonNull(user);
    }

    void insertCoin(int cents) {
        currentUser.addCredit(cents);
    }

    /** Returns true if the song was paid for and queued (or started). */
    boolean selectSong(String songId) {
        Song song = catalog.findSong(songId);
        if (song == null) return false;
        if (!currentUser.charge(song.priceCents)) return false;

        if (playing == null) {
            playing = song;
        } else {
            playlist.queue(song);
        }
        return true;
    }

    Song nowPlaying() { return playing; }

    Song nextUp() { return playlist.peek(); }

    /** Finish current track and start the next queued song, if any. */
    void onTrackFinished() {
        playing = playlist.poll();
    }

    void skip() {
        onTrackFinished();
    }
}
```

### Tiny walk-through

```
catalog has CD "Hits" with song S1 ($1.00) and S2 ($1.00)
user credit = 0
insertCoin(200)           -> credit 200
selectSong("S1")          -> charge 100, playing = S1
selectSong("S2")          -> charge 100, queue = [S2]
nowPlaying()              -> S1
nextUp()                  -> S2
onTrackFinished()         -> playing = S2, queue empty
selectSong("S1")          -> false (credit 0)
```

That path is enough to defend the design: money in, lookup, charge, queue, advance.

---

## 6. What interviewers listen for

| Signal | Why it matters |
| --- | --- |
| You asked about free vs paid, CD vs digital | Shows you do not invent a wrong product |
| Clear ownership (catalog vs playlist vs user) | Avoids a god class stuffed with unrelated fields |
| Playlist as a queue | Matches real play order |
| Payment failure path | `selectSong` returns false instead of going negative |
| Small facade API | You can talk for 20 minutes without writing a framework |
| "This is one design" | OOD has many valid shapes |

Optional extensions if they push:

* **Shuffle / random play** from a CD without payment per track (radio mode).
* **Display** object that shows title, remaining time, credit.
* **SongSelector** helper that remembers the last browsed CD.
* **Thread or timer** that calls `onTrackFinished` after `durationSec` (usually mention, do not implement).

Do not drag in databases, REST APIs, or microservices unless the interviewer reframes the prompt as a networked music service.

---

## 7. Edge cases and common mistakes

Interviewers poke these:

* **Unknown song id:** return false or throw a clear domain error. Do not enqueue `null`.
* **Not enough credit:** leave queue and playing unchanged; do not partial-charge.
* **Empty catalog:** every select fails; say so.
* **Idle machine:** `playing == null` and empty playlist. First successful select starts play, does not only queue.
* **Skip on empty:** `playing` becomes null; fine.
* **User switch mid-queue:** decide whether the queue is machine-owned (stays) or session-owned (clear). State the rule.
* **Negative coins:** reject in `insertCoin` / `addCredit`.
* **Duplicate song ids across CDs:** catalog `put` policy must be defined (last wins is fine if you say it).

Common mistakes:

1. **One giant `Jukebox` class** with arrays of strings and no `Song` type.
2. **Playlist as a `List` with random index play** when the problem is a jukebox queue.
3. **Charging after enqueue** so a failure leaves a free song in the queue.
4. **Making `Song` depend on `User`** or payment types.
5. **Modeling the entire record label industry** (albums, royalties, DRM) when they asked for a diner box.
6. **Forgetting the idle → first song path** so nothing ever starts until a second pick.

Minimal smoke idea:

```java
// build catalog with two songs at 100 cents each
Jukebox box = new Jukebox(catalog, new User("u1", "Alex"));
box.insertCoin(150);
assert box.selectSong("S1");
assert box.nowPlaying().id.equals("S1");
assert !box.selectSong("S2"); // only 50 cents left
box.insertCoin(50);
assert box.selectSong("S2");
assert box.nextUp().id.equals("S2");
box.skip();
assert box.nowPlaying().id.equals("S2");
```

---

## 8. Explain to a friend recap

Design a diner jukebox in objects, not in network diagrams.

1. **Ask constraints:** media type, money, one user vs many.
2. **`Song` / `CD` / `Catalog`** hold what can be played.
3. **`Playlist`** is a FIFO queue of paid picks.
4. **`User`** holds credit; coins increase it; each select tries to charge.
5. **`Jukebox`** is the facade: insert coin, select song, now playing, skip / finish track.
6. Keep payment simple: integer cents, fail closed when broke.
7. First paid song starts immediately; later ones wait in the queue.

If you can draw the arrows from coin drop to catalog lookup to charge to queue without a single class doing everything, you own problem 7.3. Chapter 7 keeps rewarding this habit: name the nouns, give each one a job, keep the public API small.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Call Center](/blog/en/ctci-7-2-call-center)
* Next: [Parking Lot](/blog/en/ctci-7-4-parking-lot)