---
title: "ज्यूकबॉक्स (Jukebox): म्यूजिकल ज्यूकबॉक्स के लिए ऑब्जेक्ट-ओरिएंटेड आर्किटेक्चर (सीटीसीआई ७.३)"
description: "सीडी प्लेयर, प्लेलिस्ट, गाना कतारों और क्रेडिट-आधारित चयन के साथ म्यूजिकल ज्यूकबॉक्स के लिए O(१) समय में ऑब्जेक्ट-ओरिएंटेड क्लास डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-3-jukebox.webp
previewImage: /assets/images/ctci-7-3-jukebox.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** ऑब्जेक्ट-ओरिएंटेड सिद्धांतों का उपयोग करके एक म्यूजिकल ज्यूकबॉक्स डिज़ाइन करें।
> * **मुख्य समाधान:** **मॉड्यूलर प्लेयर स्टेट आर्किटेक्चर**: (१) मुख्य डोमेन इकाइयां `Song`, `CD`, `Playlist`, `User`; (२) हार्डवेयर कंट्रोलर `CDPlayer` स्थिति प्रबंधन (`PLAYING`, `PAUSED`, `IDLE`); (३) केंद्रीय नियंत्रक `Jukebox` जो उपयोगकर्ता क्रेडिट, सिक्का स्लॉट इनपुट, गाना चयन कतार (`Queue<Song>`), और ऑडियो प्लेबैक को $O(१)$ समय में प्रबंधित करता है।
> * **रियल-वर्ल्ड सिस्टम:** म्यूजिक स्ट्रीमिंग प्लेबैक कोर (Spotify / Apple Music) और टचस्क्रीन मनोरंजन उपकरण (TouchTunes)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ७.३) में पूछा गया है:

*"ऑब्जेक्ट-ओरिएंटेड सिद्धांतों का उपयोग करके एक संगीत ज्यूकबॉक्स डिज़ाइन करें।"*

## २. क्लास संरचना और कंपोनेंट्स

१. **डोमेन मॉडल:** `Song`, `CD`, `Playlist` (`Queue<Song>` फिफो कतार)।
२. **ऑडियो प्लेयर:** `CDPlayer` (सक्रिय ट्रैक और प्लेबैक नियंत्रण)।
३. **केंद्रीय नियंत्रक:** `Jukebox` (सिक्का प्रबंधन, क्रेडिट बिलिंग और गाना शेड्यूलिंग)।

## प्रोडक्शन कार्यान्वयन

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

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| selectSong() समय | `O(१)` | क्रेडिट सत्यापन और कतार में प्रविष्टि। |
| playNextSong() समय | `O(१)` | फिफो (FIFO) कतार से निष्कासन। |
| सहायक मेमोरी | `O(S + C)` | कतारबद्ध गानों और सीडी संग्रह के अनुपात में मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: ऑडियो स्ट्रीमिंग कतारें

१. **स्ट्रीमिंग म्यूजिक इंजन (Spotify):** स्थानीय प्लेबैक कतार को नेटवर्क ऑडियो डिकोडर से अलग करना।
२. **डिजिटल ज्यूकबॉक्स (TouchTunes):** प्राथमिकता आधारित भुगतान प्रणाली।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **अपर्याप्त क्रेडिट:** सुरक्षित रूप से `false` लौटाना।
२. **थ्रेड सुरक्षा:** समवर्ती उपयोगकर्ताओं के लिए सिंक्रनाइज़्ड विधियाँ।
