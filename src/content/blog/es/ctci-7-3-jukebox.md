---
title: "Jukebox: Arquitectura Orientada a Objetos para una Máquina de Música (CTCI 7.3)"
description: "Disena las clases y maquinas de estado para una rockola musical con reproductor de CD, listas de reproduccion y seleccion por creditos en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-7-3-jukebox.webp
previewImage: /assets/images/ctci-7-3-jukebox.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disena una maquina de musica (jukebox / rockola) utilizando principios orientados a objetos.
> * **La Solución Óptima:** Arquitectura Modular de Reproducción: (1) Entidades de dominio `Song`, `CD`, `Playlist`, `User`; (2) Capa de control de audio `CDPlayer` con estados (`PLAYING`, `PAUSED`, `IDLE`); (3) Controlador central `Jukebox` que gestiona creditos, insercion de monedas, colas de canciones y reproduccion en tiempo $O(1)$.
> * **Realidad en Producción:** Gestores de colas de streaming de musica (Spotify / Apple Music) y sistemas de entretenimiento digitales.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 7.3), se nos plantea:

*"Disena una rockola musical (jukebox) utilizando principios orientados a objetos."*

## 2. Arquitectura de Clases

1. **Modelo de Dominio:** `Song`, `CD`, `Playlist` (cola de canciones `Queue<Song>`).
2. **Motor de Reproducción:** `CDPlayer` (maneja pista actual y controles de audio).
3. **Controlador Central:** `Jukebox` (coordina saldo de monedas, interfaz de seleccion y cola de reproduccion).

## Implementación de Producción

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

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| selectSong() | `O(1)` | Verificacion de creditos e insercion en cola. |
| playNextSong() | `O(1)` | Desencolado FIFO de la lista activa. |
| Espacio Auxiliar | `O(S + C)` | Memoria proporcional a canciones en cola y catalogo de CDs. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Motores de Audio

1. **Gestores de Colas de Streaming (Spotify):** Desacopla la cola de reproduccion local del motor de decodificacion de audio nativo.
2. **Rockolas Digitales (TouchTunes):** Integran pasarelas de pago con subasta de prioridad para adelantar turnos.

## Casos Límite y Robustez en Producción

1. **Sin créditos suficientes:** Rechazo seguro retornando `false`.
2. **Seguridad en Hilos:** Metodos sincronizados para evitar condiciones de carrera entre usuarios simultaneos.
