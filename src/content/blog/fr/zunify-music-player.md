---
title: "Zunify : Réinventer l'Iconique Lecteur Zune pour le Web Moderne"
description: "Un regard sur Zunify, un lecteur de musique léger et offline-first qui fait renaître l'interface typographique de la fin des années 2000 avec Angular 19, Dexie.js et l'API File System Access."
date: 2026-07-09
tags: [Angular, Développement Web, Base de données]
coverImage: /assets/images/zunify-music.webp
previewImage: /assets/images/zunify-music.webp
---

À la fin des années 2000, Microsoft a lancé le Zune, un lecteur multimédia numérique qui, bien qu'il ait eu du mal à concurrencer l'iPod sur le marché mondial, a réuni une communauté de passionnés grâce à sa charte graphique révolutionnaire. Son interface "Metro" accordait une place centrale à la typographie, à un affichage épuré, à des contrastes élevés et à des mises en page numériques propres, rompant avec le design imitant les objets physiques (le skeuomorphisme).

**Zunify** est un hommage moderne à cette interface légendaire. C'est une Progressive Web App (PWA) légère, conçue pour un fonctionnement en mode déconnecté (offline-first), qui synchronise votre bibliothèque musicale locale directement au sein du navigateur, sans téléchargement sur des serveurs distants, sans compte utilisateur et sans outil de suivi, garantissant ainsi une confidentialité absolue.

* **Dépôt GitHub :** [github.com/breejesh/zunify](https://github.com/breejesh/zunify)
* **Démonstration en direct :** [zunify.breejeshrathod.com](https://zunify.breejeshrathod.com/)

---

## Interface de l'Application & Galerie d'Écrans

Pour voir à quoi ressemble Zunify, découvrons ses écrans et l'expérience utilisateur.

### 1. Écran d'Accueil / Hub de Lecture Rapide
L'écran de démarrage offre un accès rapide à l'historique de lecture, aux morceaux les plus écoutés et aux morceaux favoris.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/home.png" width="600" alt="Zunify Home Screen">
</p>

---

### 2. Bibliothèque Musicale & Navigation
Explorez les albums, les artistes et les playlists dans une mise en page épurée et axée sur la typographie, inspirée du client Microsoft Zune d'origine.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/collection.png" width="600" alt="Zunify Music Collection">
</p>

---

### 3. Écran de Lecture
Deux variantes typographiques qui adaptent dynamiquement leurs couleurs de fond en fonction de la pochette de l'album en cours.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/now-playing-1.png" width="280" alt="Now Playing Layout 1">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/now-playing-2.png" width="280" alt="Now Playing Layout 2">
</p>

---

### 4. Paramètres & Synchronisation des Répertoires
Synchronisez vos répertoires musicaux locaux en toute simplicité grâce à IndexedDB et l'API File System Access.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/settings.png" width="600" alt="Zunify Settings">
</p>

---

## L'Architecture de Zunify

Contrairement aux lecteurs traditionnels de streaming ou hébergés dans le cloud, Zunify ne s'appuie sur aucun serveur dorsal (backend). Il s'exécute entièrement dans le navigateur de l'utilisateur et lit les morceaux de musique directement depuis le stockage local de l'ordinateur.

Pour rendre cette prouesse possible, Zunify utilise un éventail de technologies web modernes :

### 1. File System Access API
Habituellement, les applications web ne peuvent interagir avec les fichiers locaux que via des formulaires d'importation classiques, obligeant l'utilisateur à re-sélectionner ses dossiers à chaque démarrage. Zunify exploite l'API moderne **File System Access API** (`showDirectoryPicker`) pour solliciter un accès en lecture à votre dossier de musique local.

Une fois cet accord obtenu, l'application reçoit un identifiant persistant `FileSystemDirectoryHandle`. En enregistrant cet identifiant dans IndexedDB, Zunify est capable de demander l'accès lors des connexions suivantes, permettant à l'utilisateur de charger et d'écouter ses musiques locales en un seul clic.

### 2. IndexedDB via Dexie.js
Parcourir des centaines de fichiers musicaux, en extraire les métadonnées et charger les pochettes d'albums est une opération lourde pour le processeur. Afin d'accélérer les lancements ultérieurs, Zunify enregistre la structure de la bibliothèque dans la base **IndexedDB** via la bibliothèque **Dexie.js** (une surcouche fluide et simplifiée pour IndexedDB).

Dexie indexe les titres, artistes, albums, genres et historiques de lecture, ce qui rend les recherches quasi instantanées, gère l'historique et configure des listes de lecture directement dans le navigateur.

### 3. Web Audio API & Analyse de Métadonnées
Zunify utilise la bibliothèque `music-metadata-browser` pour lire et analyser les fichiers audio directement au sein du navigateur. Elle extrait les balises ID3v2, la fréquence d'échantillonnage, les débits binaires, les paroles et les pochettes d'album. Une fois analysés, les flux de données audio sont transmis directement au contexte audio HTML5 `<audio>`, minimisant le coût en mémoire vive.

---

## Analyse Technique : Intégration de l'API File System Access dans Angular

Voici comment Zunify mémorise et conserve les accès aux répertoires entre les lancements de l'application. Lorsque l'utilisateur sélectionne un dossier, l'identifiant du répertoire est sauvegardé dans IndexedDB :

```typescript
import { Injectable } from '@angular/core';
import Dexie from 'dexie';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private db = new Dexie('ZunifyLibrary');

  constructor() {
    this.db.version(1).stores({
      settings: 'key',
      tracks: '++id, title, artist, album, genre, path',
    });
  }

  // Request directory access and save the handle
  async selectLibraryDirectory(): Promise<void> {
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'read'
      });
      
      // Store the directory handle in Dexie settings table
      await this.db.table('settings').put({ key: 'dirHandle', value: handle });
      await this.scanDirectory(handle);
    } catch (err) {
      console.error('Directory access rejected:', err);
    }
  }

  // Verify and request permission for the cached handle on app startup
  async verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
    const opts = { mode: 'read' };
    if ((await handle.queryPermission(opts)) === 'granted') {
      return true;
    }
    if ((await handle.requestPermission(opts)) === 'granted') {
      return true;
    }
    return false;
  }
}
```

### La Phase de Balayage

Dès que l'autorisation est validée, Zunify parcourt l'arborescence des fichiers de manière récursive. Il analyse chaque fichier en appliquant un filtre sur les formats audio autorisés (`.mp3`, `.m4a`, `.ogg`, `.flac`) :

```typescript
async scanDirectory(directoryHandle: FileSystemDirectoryHandle): Promise<void> {
  const tracks: any[] = [];
  
  for await (const entry of (directoryHandle as any).values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      if (this.isAudioFile(file.name)) {
        // Parse metadata on-device
        const metadata = await this.parseAudioMetadata(file);
        tracks.push({
          title: metadata.title || file.name,
          artist: metadata.artist || 'Unknown Artist',
          album: metadata.album || 'Unknown Album',
          fileHandle: entry // Save file handle to stream later
        });
      }
    } else if (entry.kind === 'directory') {
      // Recursively scan subfolders
      await this.scanDirectory(entry);
    }
  }
  
  await this.db.table('tracks').bulkPut(tracks);
}
```

---

## Les Défis d'un Lecteur PWA en Local

Concevoir un lecteur audio s'exécutant à 100% dans le navigateur soulève des contraintes techniques particulières :

### 1. Persistance des Autorisations de Fichiers
Par mesure de sécurité, les navigateurs réinitialisent les autorisations d'accès aux fichiers du système local à chaque fois que la page est fermée ou rechargée. Bien que le `FileSystemDirectoryHandle` soit enregistré dans IndexedDB, l'utilisateur doit obligatoirement valider une invite système au démarrage pour rétablir les accès en lecture.

**Solution :** Zunify propose un écran d'accueil épuré avec un bouton d'action unique "Synchroniser la bibliothèque" afin de relancer la validation de l'invite.

### 2. Flux Audio depuis les Fichiers Locaux
Les navigateurs ne permettent pas de lier directement les identifiants de fichiers locaux à l'attribut `src` d'une balise `<audio>`.

**Solution :** Zunify contourne ce problème en créant des URL d'objets temporaires via `URL.createObjectURL(file)`. À chaque changement de piste, Zunify révoque l'ancienne URL d'objet pour éviter les fuites de mémoire, maintenant ainsi une utilisation minimale de la mémoire vive (heap).

### 3. Intégration Native des Boutons Multimédias
Pour donner à Zunify l'ergonomie d'une application native, il exploite l'API **Media Session API**. Cette API associe les raccourcis multimédias généraux (touches physiques lecture/pause, commandes de casque, widgets média du système d'exploitation) au système de lecture de l'application :

```typescript
navigator.mediaSession.metadata = new MediaMetadata({
  title: currentTrack.title,
  artist: currentTrack.artist,
  album: currentTrack.album,
  artwork: [
    { src: currentTrack.coverUrl || 'assets/default-art.png', sizes: '512x512', type: 'image/png' }
  ]
});

navigator.mediaSession.setActionHandler('play', () => this.playbackService.play());
navigator.mediaSession.setActionHandler('pause', () => this.playbackService.pause());
navigator.mediaSession.setActionHandler('nexttrack', () => this.playbackService.next());
navigator.mediaSession.setActionHandler('previoustrack', () => this.playbackService.previous());
```

---

## Pourquoi les Applications Web Offline-First Sont Essentielles

Zunify est plus qu'un hommage nostalgique. Il s'inscrit dans un mouvement plus large vers le logiciel local-first. Avec les API web modernes, on peut construire des applications riches et interactives qui :

* Tournent intégralement sur le terminal de l'utilisateur, ce qui induit un **coût d'hébergement serveur nul**.
* Fonctionnent **sans aucune connexion internet**, protégeant ainsi vos données personnelles de tout suivi publicitaire.
* Offrent des performances similaires à celles des applications natives, tout en profitant du bac à sable sécurisé du navigateur.

Si vous voulez l'esthétique Metro du Zune ou un exemple concret de l'API File System Access pour des apps offline-first, Zunify est open-source et ouvert aux contributions. Prenez un dossier de musique local, ouvrez [Zunify](https://zunify.breejeshrathod.com/), et parcourez votre bibliothèque dans une interface typographique claire.
