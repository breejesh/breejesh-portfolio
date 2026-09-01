---
title: "Jukebox: Architecture Orientée Objet pour Borne Musicale (CTCI 7.3)"
description: "Concevez les classes et machines d'état pour un juke-box musical avec lecteur CD, files d'attente et sélection par crédits en temps O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-3-jukebox.webp
previewImage: /assets/images/ctci-7-3-jukebox.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez un juke-box musical en utilisant les principes de la programmation orientée objet.
> * **La Solution Optimale:** Architecture Modulaire Audio : (1) Entités métier `Song`, `CD`, `Playlist`, `User` ; (2) Lecteur matériel `CDPlayer` avec états (`PLAYING`, `PAUSED`, `IDLE`) ; (3) Contrôleur central `Jukebox` orchestrant les crédits, l'insertion de pièces, la sélection de titres et la file d'attente (`Queue<Song>`) en temps $O(1)$.
> * **Réalité en Production:** Gestionnaires de files de lecture de streaming (Spotify / Apple Music) et bornes multimédia interactives (TouchTunes).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 7.3), l'énoncé est :

*"Concevez un juke-box musical en appliquant les principes de la conception orientee objet."*

## 2. Architecture des Classes

1. **Modèle Domaine :** `Song`, `CD`, `Playlist` (file d'attente FIFO).
2. **Moteur Audio :** `CDPlayer` (gère la piste active et les commandes de lecture).
3. **Contrôleur Central :** `Jukebox` (gère les crédits monétaires, l'interface utilisateur et le déclenchement des pistes).

## Implémentation de Production

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

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| selectSong() | `O(1)` | Débit de crédit et insertion en file FIFO. |
| playNextSong() | `O(1)` | Dépilement de tête de liste. |
| Espace Auxiliaire | `O(S + C)` | Proportionnel aux morceaux en file et aux CD indexés. |

## Ingénierie des Systèmes en Production

### Architecture Système : Files d'Attente Audio

1. **Lecteurs de Streaming (Spotify) :** Découplage de la file d'attente applicative et du moteur de décodage audio bas niveau.
2. **Bornes Commerciales (TouchTunes) :** Intégration de monnayeurs avec files de priorité tarifées.

## Cas Limites et Robustesse

1. **Crédits insuffisants :** Refus immédiat avec retour `false`.
2. **Concurrence multi-utilisateurs :** Synchronisation sur les opérations d'insertion et de lecture.
