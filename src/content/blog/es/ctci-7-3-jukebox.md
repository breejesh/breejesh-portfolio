---
title: "Jukebox: canciones, listas, catálogo, usuarios y pago (OOD en Java)"
description: "Problema estilo CTCI 7.3 para principiantes: diseña una jukebox musical con clases orientadas a objetos. Modela Song, Playlist, catálogo de CD, User y pago con monedas, y conecta un boceto enfocado en Java alrededor de una cola de reproducción."
date: "2025-08-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-7-3-jukebox.webp
previewImage: /assets/images/ctci-7-3-jukebox.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 7.3 para principiantes: diseña una jukebox musical con clases orientadas a objetos. Modela Song, Playlist, catálogo de CD, User y pago con monedas, y conecta un boceto enfocado en Java alrededor de una cola de reproducción.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Una **jukebox** es una máquina de música a la que la gente se acerca, elige temas y los oye en orden. En una entrevista esto no va de códecs MP3. Va de **objetos**, de **quién posee qué**, y de **qué métodos mueven una petición desde la moneda hasta los altavoces**.

Este post es enseñanza original para principiantes en **Java**. Misma familia de prompts de diseño orientado a objetos, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 7, diseño orientado a objetos, problema 7.3.

---

## 1. Analogía cotidiana

Imagina la máquina de un diner con frontal de cristal y ranura para monedas.

* Dentro hay un **catálogo** de CDs. Cada CD tiene muchas **canciones**.
* Echas dinero. La máquina suma **crédito**.
* Eliges un CD y luego un tema. Si hay crédito suficiente, el tema entra en una **playlist** (una cola).
* Cuando termina la canción actual, empieza la siguiente de la cola.
* Más tarde puede llegar otra persona, echar monedas y encolar más canciones.

Tu código no tiene que dibujar la caja cromada. Tiene que hacer los mismos trabajos: catálogo, pago, selección, cola y reproducción.

---

## 2. Aclara antes de diseñar

Los prompts de OOD se quedan a propósito vagos. Pregunta y **di las asunciones** en voz alta.

Preguntas útiles:

* ¿CDs físicos, discos o solo archivos digitales?
* ¿Gratis o de pago? ¿Efectivo, monedas, tarjeta o créditos de cuenta?
* ¿Un usuario a la vez o sesiones concurrentes?
* ¿Puede la misma canción aparecer dos veces en la cola?
* ¿Quién controla volumen, saltar y parar: solo la máquina o el usuario actual?

**Asunciones de este post:**

* Simulación de jukebox **estilo físico** con **catálogo de CD**.
* **Pago con monedas**: insertas dinero, gastas crédito por canción.
* **Una sesión de usuario activa** a la vez (máquina de bar típica).
* Las canciones se eligen por id (o por CD + índice de pista).
* La playlist es una **cola FIFO**. La misma canción puede encolarse más de una vez.
* Solo suena un tema a la vez. Saltar/parar son métodos opcionales en la jukebox.

Si el entrevistador quiere reproducción ilimitada gratis o cuentas multi-usuario, cambia el pago y la posesión de `User`. El resto de la forma suele seguir valiendo.

---

## 3. Enunciado en palabras llanas

**Objetivo:** diseñar clases para una jukebox musical con principios orientados a objetos.

**Trabajos centrales:**

| Trabajo | Idea de dueño |
| --- | --- |
| Conocer canciones y en qué CD viven | `Song`, `CD`, `Catalog` |
| Guardar temas por venir | `Playlist` (cola) |
| Saber quién usa la máquina y cuánto crédito tiene | `User` |
| Aceptar dinero y cobrar un pick | métodos de pago en `Jukebox` / crédito en `User` |
| Coordinar elegir, pagar, encolar, reproducir | fachada `Jukebox` |

**Operaciones que la gente usa de verdad:**

1. Insertar monedas → ganar crédito.
2. Explorar catálogo → elegir una canción.
3. Si hay crédito, descontar el precio y encolar.
4. Reproducir la actual; al terminar, sacar la siguiente de la cola.
5. Opcional: saltar actual, vaciar cola, cambiar de usuario.

**Forma de la API (enfocada):**

```java
void insertCoin(int cents);
boolean selectSong(String songId); // false if unknown or not enough credit
Song nowPlaying();
Song nextUp();
void skip(); // end current, start next if any
```

Luego puedes ampliar. Las entrevistas premian primero una **superficie pequeña y clara**.

---

## 4. Piensa primero: objetos y responsabilidades

### Objetos de datos

* **`Song`**: id, título, artista, duración en segundos, precio en céntimos. Enlace opcional al id del CD padre.
* **`CD`**: id, título, artista, lista ordenada de canciones.
* **`Catalog`**: mapa o conjunto de CDs; busca canción por id en toda la colección.

Que sean sobre todo datos y getters simples. El catálogo posee la búsqueda para que `Jukebox` no recorra cada CD a mano en diez sitios.

### Objetos de comportamiento

* **`Playlist`**: cola de `Song`. Métodos: `queue(Song)`, `peek()`, `poll()`, `isEmpty()`, quizá `size()`.
* **`User`**: id, nombre, crédito actual en céntimos. Métodos: `addCredit`, `charge` (o comprobar + descontar).
* **`Jukebox`**: tiene catálogo, playlist, usuario actual y canción en reproducción. Los verbos de cara al usuario viven aquí.

### Pago sin sobreingeniería

**No** necesitas un SDK bancario en entrevista. Un modelo limpio:

* `insertCoin(cents)` suma al crédito del usuario actual.
* Cada `Song` tiene precio (o un precio fijo en la jukebox).
* `selectSong` falla si crédito < precio.
* Si va bien, descuenta, encola, y si no suena nada, arranca la canción.

Si les importa el cambio, añade `dispenseChange()` que devuelve el crédito sobrante al irse. Hasta entonces, deja el crédito en el usuario.

### Quién habla con quién

```
User --inserts coins / picks--> Jukebox
Jukebox --looks up--> Catalog --has--> CD --has--> Song
Jukebox --charges--> User
Jukebox --queues--> Playlist
Jukebox --plays--> current Song (from Playlist)
```

`Song` no debe saber de monedas. `Playlist` no debe saber de CDs. Esa separación es el punto del ejercicio.

---

## 5. Boceto Java enfocado

Tamaño de entrevista, no de producto. Nombres cortos; hardware real e hilos de audio fuera.

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

### Mini recorrido

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

Ese camino basta para defender el diseño: entra el dinero, búsqueda, cobro, cola, avance.

---

## 6. Qué escucha el entrevistador

| Señal | Por qué importa |
| --- | --- |
| Preguntaste gratis vs pago, CD vs digital | No inventas un producto equivocado |
| Propiedad clara (catálogo vs playlist vs usuario) | Evita una clase dios llena de campos ajenos |
| Playlist como cola | Encaja con el orden real de reproducción |
| Fallo de pago | `selectSong` devuelve false en vez de ir a negativo |
| API fachada pequeña | Puedes hablar 20 minutos sin montar un framework |
| "Este es un diseño" | OOD admite muchas formas válidas |

Extensiones opcionales si aprietan:

* **Aleatorio / shuffle** desde un CD sin cobro por pista (modo radio).
* Objeto **Display** con título, tiempo restante, crédito.
* Ayuda **SongSelector** que recuerda el último CD explorado.
* **Hilo o temporizador** que llama `onTrackFinished` tras `durationSec` (menciónalo; no lo implementes).

No arrastres bases de datos, APIs REST ni microservicios salvo que reformulen el prompt como servicio de música en red.

---

## 7. Casos límite y errores habituales

El entrevistador pincha aquí:

* **Id de canción desconocido:** false o error de dominio claro. No encoles `null`.
* **Crédito insuficiente:** cola y reproducción sin cambios; no cobres a medias.
* **Catálogo vacío:** todo select falla; dilo.
* **Máquina idle:** `playing == null` y cola vacía. El primer select con éxito arranca, no solo encola.
* **Skip en vacío:** `playing` pasa a null; bien.
* **Cambio de usuario a mitad de cola:** decide si la cola es de la máquina (se queda) o de la sesión (se limpia). Di la regla.
* **Monedas negativas:** rechaza en `insertCoin` / `addCredit`.
* **Ids duplicados entre CDs:** define la política del `put` del catálogo (último gana vale si lo dices).

Errores comunes:

1. **Una sola clase `Jukebox` gigante** con arrays de strings y sin tipo `Song`.
2. **Playlist como `List` con índice aleatorio** cuando el problema es una cola de jukebox.
3. **Cobrar después de encolar** de modo que un fallo deja una canción gratis en la cola.
4. **Hacer que `Song` dependa de `User`** o de tipos de pago.
5. **Modelar toda la industria discográfica** (álbumes, royalties, DRM) cuando pedían la caja del diner.
6. **Olvidar el camino idle → primera canción** y que nunca arranque hasta el segundo pick.

Idea mínima de humo:

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

## 8. Explícaselo a un amigo

Diseña la jukebox del diner en objetos, no en diagramas de red.

1. **Pregunta límites:** tipo de medio, dinero, un usuario vs muchos.
2. **`Song` / `CD` / `Catalog`** guardan lo reproducible.
3. **`Playlist`** es una cola FIFO de picks pagados.
4. **`User`** tiene crédito; las monedas lo suben; cada select intenta cobrar.
5. **`Jukebox`** es la fachada: insertar moneda, elegir canción, now playing, skip / fin de pista.
6. Pago simple: céntimos enteros, falla cerrado si no hay saldo.
7. La primera canción pagada arranca al momento; las siguientes esperan en la cola.

Si puedes dibujar las flechas desde la moneda hasta la búsqueda en catálogo, el cobro y la cola sin que una sola clase lo haga todo, dominas el 7.3. El capítulo 7 premia este hábito: nombra los sustantivos, dale un trabajo a cada uno, mantén pequeña la API pública.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Call Center](/blog/es/ctci-7-2-call-center)
* Siguiente: [Parking Lot](/blog/es/ctci-7-4-parking-lot)