---
title: "Jukebox: Object-Oriented Musical Jukebox Architecture (CTCI 7.3)"
description: "Design the classes and state machines for a musical jukebox with CD players, playlists, song queues, and credit-based selection in O(1) queue operations."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-7-3-jukebox.webp
previewImage: /assets/images/ctci-7-3-jukebox.webp
---

> **TL;DR**
> * **The Book Problem:** Design a musical jukebox using object-oriented principles.
> * **The Optimal Solution:** Modular Player State Architecture: (1) Core domain entities `Song`, `CD`, `Playlist`, `User`; (2) Hardware control layer `CDPlayer` with playback states (`PLAYING`, `PAUSED`, `IDLE`); (3) Central controller `Jukebox` managing user credits, coin slot inputs, song selector queue (`Queue<Song>`), and physical display output in $O(1)$ queue operations.
> * **Production Reality:** Music streaming queue managers (Spotify / Apple Music playback cores) and digital touch-screen amusement systems (TouchTunes).

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 7.3), we are asked:

*"Design a musical jukebox using object-oriented principles."*

## 2. Component Class Architecture

1. **Domain Model:**
   * `Song`: `id`, `title`, `artist`, `lengthInSeconds`.
   * `CD`: `id`, `artist`, `List<Song> songs`.
   * `Playlist`: `name`, `Queue<Song> queue`, with methods `getNextSongToPlay()`, `queueUpSong(Song s)`.
2. **Audio Playback Engine:**
   * `CDPlayer`: Manages `CD currentCD`, `Song currentSong`, and media controls `playSong()`, `pause()`, `stop()`.
3. **Hardware / User Interface Orchestrator:**
   * `User`: User identity and credit balance.
   * `SongSelector`: Handles user inputs, displays available songs, and charges credits.
   * `Jukebox`: Coordinates coin insertion, user authentication, playlist queues, and audio output.

## Production Implementation

```java
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.Set;

public class JukeboxDesign {
    public static class Song {
        private final String id;
        private final String title;
        private final String artist;
        private final int lengthInSeconds;

        public Song(String id, String title, String artist, int length) {
            this.id = id;
            this.title = title;
            this.artist = artist;
            this.lengthInSeconds = length;
        }

        public String getTitle() { return title; }
        public String getArtist() { return artist; }
    }

    public static class CD {
        private final String id;
        private final String artist;
        private final List<Song> songs;

        public CD(String id, String artist, List<Song> songs) {
            this.id = id;
            this.artist = artist;
            this.songs = songs;
        }

        public List<Song> getSongs() { return songs; }
    }

    public static class Playlist {
        private final Queue<Song> songQueue = new LinkedList<>();

        public synchronized Song getNextSongToPlay() {
            return songQueue.poll();
        }

        public synchronized void queueUpSong(Song song) {
            songQueue.offer(song);
        }

        public synchronized boolean isEmpty() {
            return songQueue.isEmpty();
        }
    }

    public static class CDPlayer {
        private Playlist playlist;
        private CD currentCD;
        private Song currentSong;
        private boolean isPlaying = false;

        public CDPlayer(Playlist playlist) { this.playlist = playlist; }

        public void playNextSong() {
            if (!playlist.isEmpty()) {
                currentSong = playlist.getNextSongToPlay();
                isPlaying = true;
            } else {
                isPlaying = false;
                currentSong = null;
            }
        }

        public void pause() { isPlaying = false; }
        public void stop() { isPlaying = false; currentSong = null; }
        public Song getCurrentSong() { return currentSong; }
        public boolean isPlaying() { return isPlaying; }
    }

    public static class Jukebox {
        private final CDPlayer cdPlayer;
        private final Playlist playlist;
        private final Set<CD> cdCollection;
        private int credits = 0;

        public Jukebox(Set<CD> cdCollection) {
            this.cdCollection = cdCollection;
            this.playlist = new Playlist();
            this.cdPlayer = new CDPlayer(playlist);
        }

        public synchronized void insertCoin(int creditValue) {
            this.credits += creditValue;
        }

        public synchronized boolean selectSong(Song song) {
            if (credits >= 1) {
                credits--;
                playlist.queueUpSong(song);
                if (!cdPlayer.isPlaying()) {
                    cdPlayer.playNextSong();
                }
                return true;
            }
            return false;
        }

        public CDPlayer getCdPlayer() { return cdPlayer; }
    }
}
```

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| selectSong() Time | `O(1)` | Direct credit check and queue insertion. |
| playNextSong() Time | `O(1)` | FIFO poll operation. |
| Auxiliary Space | `O(S + C)` | Memory proportional to active playlist size $S$ and loaded CDs $C$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Audio Streaming Playback Queues

1. **Spotify / Apple Music Client Core:** Decouples the user's priority play queue from track metadata caches and native audio decoders.
2. **Digital Commercial Jukeboxes (TouchTunes):** Integrates credit payment gateways with priority bidding queues (paying extra credits to skip ahead).

## Edge Cases & Production Hardening

1. **Zero credits remaining:** `selectSong()` fails gracefully, returning `false`.
2. **Thread safety:** Synchronized operations prevent race conditions between simultaneous song selections and player transitions.
