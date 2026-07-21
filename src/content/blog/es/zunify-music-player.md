---
title: "Zunify: Reimaginando el Icónico Reproductor Zune para la Web Moderna"
description: "Una mirada a Zunify, un reproductor de música ligero y offline-first que revive la interfaz tipográfica de finales de los 2000 usando Angular 19, Dexie.js y File System Access API."
date: 2026-07-09
tags: [Angular, Desarrollo Web, Base de datos]
coverImage: /assets/images/zunify-music.webp
previewImage: /assets/images/zunify-music.webp
---

A finales de la década de 2000, Microsoft presentó el Zune, un reproductor de medios digitales que, a pesar de competir difícilmente contra el iPod por la cuota de mercado, ganó un ferviente grupo de seguidores gracias a su revolucionario lenguaje de diseño. La interfaz "Metro" se centraba en la tipografía, un diseño minimalista, menús de alto contraste y esquemas digitales limpios en lugar de imitar objetos físicos (esqueuomorfismo).

**Zunify** es un homenaje moderno a esa legendaria interfaz. Se trata de una PWA (Progressive Web App) ligera y de funcionamiento local (offline-first) que sincroniza tu colección de música local directamente en el navegador, sin necesidad de subir archivos a servidores externos, sin cuentas de usuario, sin rastreadores y 100% preparada para funcionar sin internet.

* **Repositorio en GitHub:** [github.com/breejesh/zunify](https://github.com/breejesh/zunify)
* **Demostración en vivo:** [zunify.breejeshrathod.com](https://zunify.breejeshrathod.com/)

---

## Interfaz de la Aplicación y Galería de Pantallas

Para ver cómo luce y funciona Zunify, exploremos las pantallas y los flujos de usuario.

### 1. Panel de Inicio / Centro de Reproducción Rápida
La pantalla de inicio ofrece acceso rápido al historial de reproducción, los temas más escuchados y las canciones favoritas.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/home.png" width="600" alt="Zunify Home Screen">
</p>

---

### 2. Colección de Música y Navegación
Explora álbumes, artistas y listas de reproducción con un diseño de lista centrado en la tipografía, inspirado directamente en el cliente original de Microsoft Zune.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/collection.png" width="600" alt="Zunify Music Collection">
</p>

---

### 3. Pantalla de Reproducción en Curso
Dos diseños tipográficos diferentes que cambian dinámicamente los colores de fondo según la portada del álbum.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/now-playing-1.png" width="280" alt="Now Playing Layout 1">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/now-playing-2.png" width="280" alt="Now Playing Layout 2">
</p>

---

### 4. Configuración y Sincronización de Carpetas
Sincroniza archivos de forma sencilla mediante las estructuras de IndexedDB y la API File System Access.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/settings.png" width="600" alt="Zunify Settings">
</p>

---

## La Arquitectura Principal de Zunify

A diferencia de los reproductores de música tradicionales basados en streaming o servidores en la nube, Zunify no necesita un backend. Se ejecuta por completo en tu navegador y accede a los archivos de música directamente desde el almacenamiento de tu ordenador.

Para lograr esto, Zunify aprovecha las ventajas de tecnologías web modernas:

### 1. File System Access API
Normalmente, las aplicaciones web solo pueden interactuar con archivos a través de campos de entrada de tipo file picker, requiriendo que el usuario vuelva a seleccionar los archivos cada vez que carga la página. Zunify utiliza la API moderna **File System Access API** (`showDirectoryPicker`) para solicitar acceso de lectura a una carpeta local de música.

Una vez concedido el acceso, la aplicación obtiene un identificador persistente `FileSystemDirectoryHandle`. Al almacenar este identificador en IndexedDB, Zunify puede solicitar permisos de lectura en las siguientes visitas, permitiendo a los usuarios cargar y reproducir su música local con un solo clic.

### 2. IndexedDB a través de Dexie.js
Escanear cientos de archivos de audio, extraer metadatos y procesar portadas de álbumes consume muchos recursos de procesamiento de la CPU. Para hacer que las cargas posteriores sean instantáneas, Zunify almacena en caché la estructura de la biblioteca en **IndexedDB** utilizando **Dexie.js** (un envoltorio ágil e intuitivo para IndexedDB).

Dexie indexa títulos de canciones, artistas, álbumes, géneros y recuentos de reproducción, lo que permite realizar búsquedas en milisegundos, registrar el historial y crear listas de reproducción personalizadas directamente en la base de datos local del navegador.

### 3. Web Audio API y Análisis de Metadatos
Zunify utiliza `music-metadata-browser` para escanear y analizar archivos de audio dentro del navegador. Extrae metadatos ID3v2, frecuencias de muestreo, tasa de bits, letras y portadas de discos integradas. Una vez analizados, los archivos de audio se transmiten directamente al contexto de audio HTML5 `<audio>`, lo que reduce al mínimo el uso de memoria.

---

## Aspectos Técnicos: Implementando File System Access API en Angular

Aquí se muestra cómo Zunify registra y recuerda los permisos de carpetas entre reinicios del navegador. Cuando un usuario selecciona una carpeta, el identificador del directorio se guarda en la base de datos de IndexedDB:

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

### La Fase de Escaneo

Una vez concedido el acceso al directorio, Zunify recorre el árbol de directorios de manera recursiva. Inspecciona cada elemento filtrando por extensiones de archivo de audio (`.mp3`, `.m4a`, `.ogg`, `.flac`):

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

## Retos al Desarrollar un Reproductor PWA Local

Crear un reproductor multimedia completamente local dentro del navegador de internet conlleva restricciones particulares:

### 1. Persistencia de Permisos de Archivos
Por razones de seguridad, el navegador restablece los permisos de lectura del sistema de archivos cada vez que se cierra o recarga la página. Aunque el identificador `FileSystemDirectoryHandle` permanece guardado en IndexedDB, el usuario debe aprobar explícitamente un aviso al iniciar la aplicación para otorgar permisos de lectura nuevamente.

**Solución:** Zunify implementa una pantalla de bienvenida limpia que ofrece un botón único de "Sincronizar Biblioteca" para volver a autorizar el acceso a la carpeta.

### 2. Transmisión de Audio desde Identificadores Locales
Los navegadores no pueden asignar directamente identificadores de archivos locales al atributo `src` de una etiqueta `<audio>`.

**Solución:** Zunify soluciona esto generando URLs de objeto temporales a través de `URL.createObjectURL(file)`. Cuando cambia de canción, Zunify revoca la URL de objeto antigua para evitar fugas de memoria, manteniendo un uso óptimo del montón de memoria.

### 3. Integración Nativa de Controles Multimedia
Para conseguir que Zunify se sienta como una aplicación nativa de escritorio, se integra con la API **Media Session API**. Esto vincula los controles multimedia globales (teclas físicas de reproducir/pausar, mandos de auriculares, notificaciones del sistema operativo) al motor de reproducción del navegador:

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

## Por Qué Importan las Aplicaciones Web Offline-First

Zunify es más que un tributo nostálgico. Forma parte de un cambio más amplio hacia el software local-first. Con APIs web modernas puedes construir aplicaciones potentes e interactivas que:

* Se ejecutan completamente en el cliente, logrando un **coste de servidores de cero**.
* Funcionan **sin conexión a internet**, manteniendo los datos del usuario a salvo del rastreo.
* Consiguen un rendimiento idéntico al de una aplicación nativa dentro del entorno seguro del navegador.

Si quieres la estética Metro del Zune o un ejemplo concreto de File System Access API para apps offline-first, Zunify es open-source y acepta colaboraciones. Elige una carpeta local de música, abre [Zunify](https://zunify.breejeshrathod.com/) y prueba tu biblioteca con una interfaz clara y tipográfica.
