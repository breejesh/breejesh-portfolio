---
title: "Jukebox: chansons, playlists, catalogue, utilisateurs et paiement (OOD Java)"
description: "Problème style CTCI 7.3 pour débutants: concevoir une jukebox musicale avec des classes orientées objet. Modéliser Song, Playlist, catalogue de CD, User et paiement en pièces, puis brancher un croquis Java ciblé autour d'une file de lecture."
date: "2025-08-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-3-jukebox.webp
previewImage: /assets/images/ctci-7-3-jukebox.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 7.3 pour débutants: concevoir une jukebox musicale avec des classes orientées objet. Modéliser Song, Playlist, catalogue de CD, User et paiement en pièces, puis brancher un croquis Java ciblé autour d'une file de lecture.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Une **jukebox** est une machine à musique devant laquelle on choisit des titres et on les entend dans l'ordre. En entretien, ce n'est pas une question de codecs MP3. C'est une question d'**objets**, de **qui possède quoi**, et de **quelles méthodes font passer une demande de la pièce de monnaie aux haut-parleurs**.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de prompts de conception orientée objet, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 7, conception orientée objet, problème 7.3.

---

## 1. Analogie du quotidien

Imagine la machine d'un diner, façade vitrée et fente pour les pièces.

* À l'intérieur, un **catalogue** de CD. Chaque CD contient beaucoup de **chansons**.
* Tu glisses de l'argent. La machine ajoute du **crédit**.
* Tu choisis un CD, puis un morceau. S'il reste assez de crédit, le morceau entre dans une **playlist** (une file).
* Quand la chanson en cours se termine, la suivante de la file démarre.
* Quelqu'un d'autre peut arriver plus tard, ajouter des pièces et enfiler d'autres titres.

Ton code n'a pas à dessiner la boîte chrome. Il doit faire les mêmes métiers: catalogue, paiement, sélection, file et lecture.

---

## 2. Clarifie avant de concevoir

Les prompts OOD restent volontairement flous. Pose des questions, puis **énonce tes hypothèses** à voix haute.

Questions utiles:

* CD physiques, vinyles, ou fichiers purement numériques?
* Gratuit ou payant? Espèces, pièces, carte, ou crédits de compte?
* Un utilisateur à la fois, ou des sessions concurrentes?
* La même chanson peut-elle apparaître deux fois dans la file?
* Qui contrôle le volume, le skip et le stop: seulement la machine, ou l'utilisateur courant?

**Hypothèses de ce billet:**

* Simulation d'une jukebox **style physique** avec un **catalogue de CD**.
* **Paiement en pièces**: on insère de l'argent, on dépense du crédit par chanson.
* **Une session utilisateur active** à la fois (machine de bar typique).
* Sélection par id (ou par CD + index de piste).
* La playlist est une **file FIFO**. La même chanson peut être enfilée plusieurs fois.
* Un seul morceau joue à la fois. Skip/stop sont des méthodes optionnelles sur la jukebox.

Si l'intervieweur veut la lecture gratuite illimitée ou des comptes multi-utilisateurs, change le paiement et la possession de `User`. Le reste de la forme reste en général valable.

---

## 3. Énoncé en mots simples

**But:** concevoir les classes d'une jukebox musicale selon des principes orientés objet.

**Métiers centraux:**

| Métier | Idée de propriétaire |
| --- | --- |
| Connaître les chansons et leur CD | `Song`, `CD`, `Catalog` |
| Tenir les prochains titres | `Playlist` (file) |
| Savoir qui utilise la machine et son crédit | `User` |
| Accepter l'argent et facturer un choix | méthodes de paiement sur `Jukebox` / crédit sur `User` |
| Coordonner choisir, payer, enfiler, jouer | façade `Jukebox` |

**Opérations réellement utilisées:**

1. Insérer des pièces → gagner du crédit.
2. Parcourir le catalogue → choisir une chanson.
3. Si le crédit suffit, débiter et enfiler.
4. Jouer le titre courant; à la fin, sortir le suivant de la file.
5. Optionnel: skip du courant, vider la file, changer d'utilisateur.

**Forme d'API (ciblée):**

```java
void insertCoin(int cents);
boolean selectSong(String songId); // false if unknown or not enough credit
Song nowPlaying();
Song nextUp();
void skip(); // end current, start next if any
```

Tu pourras élargir ensuite. Les entretiens récompensent d'abord une **surface petite et claire**.

---

## 4. Réfléchis d'abord: objets et responsabilités

### Objets de données

* **`Song`**: id, titre, artiste, durée en secondes, prix en centimes. Lien optionnel vers l'id du CD parent.
* **`CD`**: id, titre, artiste, liste ordonnée de chansons.
* **`Catalog`**: map ou ensemble de CD; recherche d'une chanson par id dans toute la collection.

Reste surtout sur des données et des getters simples. Le catalogue possède la recherche pour que `Jukebox` ne parcourt pas chaque CD à la main en dix endroits.

### Objets de comportement

* **`Playlist`**: file de `Song`. Méthodes: `queue(Song)`, `peek()`, `poll()`, `isEmpty()`, peut-être `size()`.
* **`User`**: id, nom, crédit courant en centimes. Méthodes: `addCredit`, `charge` (ou vérifier + débiter).
* **`Jukebox`**: tient catalogue, playlist, utilisateur courant et chanson en cours. Tous les verbes face utilisateur vivent ici.

### Paiement sans usine à gaz

Tu n'as **pas** besoin d'un SDK bancaire en entretien. Un modèle propre:

* `insertCoin(cents)` ajoute au crédit de l'utilisateur courant.
* Chaque `Song` a un prix (ou un prix fixe sur la jukebox).
* `selectSong` échoue si crédit < prix.
* En cas de succès, on débite, on enfile, et s'il ne joue rien, on démarre la chanson.

Si le rendu de monnaie compte, ajoute `dispenseChange()` qui renvoie le crédit restant quand l'utilisateur part. En attendant, laisse le crédit sur l'utilisateur.

### Qui parle à qui

```
User --inserts coins / picks--> Jukebox
Jukebox --looks up--> Catalog --has--> CD --has--> Song
Jukebox --charges--> User
Jukebox --queues--> Playlist
Jukebox --plays--> current Song (from Playlist)
```

`Song` ne doit pas connaître les pièces. `Playlist` ne doit pas connaître les CD. Cette séparation est le but de l'exercice.

---

## 5. Croquis Java ciblé

Taille entretien, pas produit. Noms courts; matériel réel et threads audio hors sujet.

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

### Mini parcours

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

Ce chemin suffit pour défendre le design: argent entrant, recherche, débit, file, avance.

---

## 6. Ce que l'intervieweur écoute

| Signal | Pourquoi ça compte |
| --- | --- |
| Tu as demandé gratuit vs payant, CD vs numérique | Tu n'inventes pas le mauvais produit |
| Propriété claire (catalogue vs playlist vs user) | Évite une classe dieu pleine de champs hors sujet |
| Playlist comme file | Correspond à l'ordre de lecture réel |
| Échec de paiement | `selectSong` renvoie false au lieu d'aller en négatif |
| Petite API façade | Tu peux parler 20 minutes sans écrire un framework |
| "Ceci est un design" | L'OOD admet beaucoup de formes valides |

Extensions optionnelles s'ils poussent:

* **Lecture aléatoire / shuffle** depuis un CD sans paiement par piste (mode radio).
* Objet **Display** avec titre, temps restant, crédit.
* Aide **SongSelector** qui mémorise le dernier CD parcouru.
* **Thread ou timer** qui appelle `onTrackFinished` après `durationSec` (mentionne, n'implémente pas).

N'embarque pas bases de données, API REST ni microservices sauf si l'on reformule le sujet en service musical réseau.

---

## 7. Cas limites et erreurs fréquentes

L'intervieweur pique ici:

* **Id de chanson inconnu:** false ou erreur de domaine claire. N'enfile pas `null`.
* **Crédit insuffisant:** file et lecture inchangées; pas de débit partiel.
* **Catalogue vide:** chaque select échoue; dis-le.
* **Machine idle:** `playing == null` et file vide. Le premier select réussi démarre, il ne se contente pas d'enfiler.
* **Skip à vide:** `playing` devient null; correct.
* **Changement d'utilisateur en milieu de file:** décide si la file appartient à la machine (reste) ou à la session (on vide). Énonce la règle.
* **Pièces négatives:** refuse dans `insertCoin` / `addCredit`.
* **Ids dupliqués entre CD:** définis la politique du `put` du catalogue (dernier gagne est ok si tu le dis).

Erreurs courantes:

1. **Une seule classe `Jukebox` monstrueuse** avec des tableaux de chaînes et sans type `Song`.
2. **Playlist en `List` avec index aléatoire** alors que le problème est une file de jukebox.
3. **Débiter après l'enfilement** de sorte qu'un échec laisse une chanson gratuite dans la file.
4. **Faire dépendre `Song` de `User`** ou de types de paiement.
5. **Modéliser toute l'industrie du disque** (albums, royalties, DRM) quand on demandait la boîte du diner.
6. **Oublier le chemin idle → première chanson** et ne jamais démarrer avant un second choix.

Idée minimale de fumée:

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

## 8. Explique à un ami

Conçois la jukebox du diner en objets, pas en diagrammes réseau.

1. **Demande les contraintes:** type de média, argent, un user vs plusieurs.
2. **`Song` / `CD` / `Catalog`** tiennent ce qui peut être joué.
3. **`Playlist`** est une file FIFO de choix payés.
4. **`User`** tient le crédit; les pièces l'augmentent; chaque select tente de débiter.
5. **`Jukebox`** est la façade: insérer une pièce, choisir une chanson, now playing, skip / fin de piste.
6. Paiement simple: centimes entiers, échec fermé si le solde manque.
7. La première chanson payée démarre tout de suite; les suivantes attendent dans la file.

Si tu peux tracer les flèches de la pièce à la recherche catalogue, au débit et à la file sans qu'une seule classe fasse tout, tu maîtrises le 7.3. Le chapitre 7 récompense cette habitude: nomme les noms, donne un métier à chacun, garde l'API publique petite.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Call Center](/blog/fr/ctci-7-2-call-center)
* Suivant: [Parking Lot](/blog/fr/ctci-7-4-parking-lot)