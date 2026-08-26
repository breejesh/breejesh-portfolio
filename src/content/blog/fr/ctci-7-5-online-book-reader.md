---
title: "Lecteur de livres en ligne: User, Library, Display et session de lecture (Java OOD)"
description: "Problème style CTCI 7.5 pour débutants: concevoir un lecteur de livres en ligne avec User, Book, Library, Display et une seule session de lecture active. Esquisse Java originale, pas un produit complet."
date: "2026-04-24"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-5-online-book-reader.webp
previewImage: /assets/images/ctci-7-5-online-book-reader.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 7.5 pour débutants: concevoir un lecteur de livres en ligne avec User, Book, Library, Display et une seule session de lecture active. Esquisse Java originale, pas un produit complet.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Conçois les **structures de données** d'un **lecteur de livres en ligne**. Pas un clone complet de Kindle. Pas un CDN de contenu distribué. Un modèle d'objets à taille d'entretien: les utilisateurs s'inscrivent et renouvellent leur abonnement, les livres vivent dans une bibliothèque, un lecteur actif a un livre ouvert, et un affichage montre la page courante.

Cet article est un enseignement original pour débutants, avec une esquisse **Java** qui répartit les responsabilités en petites classes. Même famille que les classiques de conception orientée objet CTCI, pas une copie du livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 7, conception orientée objet, problème 7.5.

---

## 1. Analogie du quotidien

Imagine une petite bibliothèque de quartier qui n'a qu'**une chaise de lecture** et **une lampe de bureau**.

Les adhérents ont une carte. Les étagères tiennent les livres. Quand tu t'assieds, tu choisis un livre, tu ouvres une page, et la lampe éclaire cette page. Dans cette histoire simplifiée, personne d'autre ne s'assoit sur la même chaise en même temps. Quand tu pars, le membre suivant s'assoit, choisit un livre, et la page repart à zéro.

Correspondance:

* **User** = adhérent avec carte et statut d'abonnement
* **Book** = élément d'étagère avec un id et des détails
* **Library** = étagères et recherche
* **Display** = lampe et page ouverte (ce qui est à l'écran)
* **Session** = qui est sur la chaise, quel livre est ouvert, à quelle page
* **OnlineReaderSystem** = le bureau d'accueil qui relie les pièces

L'entretien ne porte pas sur un produit multi-lecteurs. Il porte sur **qui possède quelle responsabilité** pour que la classe principale ne devienne pas un tiroir de 2000 lignes.

---

## 2. Énoncé en mots simples

**Énoncé:** conçois les structures de données d'un système de lecture de livres en ligne.

Le prompt classique est mince en exigences. Tu dois **énoncer des hypothèses**. Portée raisonnable pour un débutant:

**Supporté:**

* Créer une adhésion utilisateur et la renouveler plus tard
* Ajouter, retirer et trouver des livres dans une bibliothèque
* Trouver des utilisateurs par id
* Ouvrir un livre pour l'utilisateur actif (démarrer une session de lecture)
* Afficher les infos utilisateur, le titre/détails du livre et la page courante
* Tourner les pages en avant et en arrière
* Au plus **un utilisateur actif** et **un livre actif** à la fois (session unique)

**Hors scope de cette esquisse (dis-le à voix haute):**

* Lecteurs concurrents, sync multi-appareils, DRM, paiements, recommandations
* Ranking de recherche full-text, catalogues à millions de titres
* Protocole réseau, téléchargement offline, annotations, surlignages
* Permissions au-delà d'un simple `accountType` int

**But en entretien:** nommer les classes, champs et méthodes principales. Montrer comment fixer l'utilisateur ou le livre actif met à jour l'affichage. Garder l'orchestrateur mince.

**Forme de signature (modèle mental):**

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

## 3. Réfléchir d'abord

### Clarifie avant de dessiner des boîtes

Demande:

1. Un seul appareil / une seule session, ou multi-utilisateur concurrent?
2. Stocke-t-on la progression de page par utilisateur et par livre, ou seulement la "page ouverte maintenant"?
3. Recherche par id seulement, ou aussi par titre?
4. Les types d'abonnement comptent-ils pour des feature flags?

Sur un tableau de 45 minutes, choisis **session active unique**, **page sur display/session**, **lookup par id**, et un stub `renewMembership()`. Écris ces hypothèses en haut du tableau.

### Découpe par responsabilité (pas par "écrans")

Mauvais défaut: tout mettre (users, books, pages, refresh UI) dans une classe dieu `OnlineReaderSystem`.

Meilleure répartition:

| Classe | Possède |
| --- | --- |
| `Book` | id, details (titre/métadonnées dans l'esquisse) |
| `User` | id, details, type de compte, renouveler l'abonnement |
| `Library` | map id livre vers `Book`; add / remove / find |
| `UserManager` | map id user vers `User`; add / remove / find |
| `Display` | ce que peint l'UI: user actif, livre actif, page; helpers de refresh |
| `ReadingSession` | qui est connecté, quel livre est ouvert, index de page courant |
| `OnlineReaderSystem` | crée les pièces, login/openBook, délègue |

Pourquoi détacher `Library`, `UserManager` et `Display` du système principal? Sur une appli jouet, ça semble du code en trop. Quand le système grandit (recherche, prêts, bookmarks), la classe principale reste un coordinateur court au lieu d'absorber chaque feature.

### Session vs display

Tu peux stocker "user actif" et "livre actif" seulement sur `OnlineReaderSystem` et garder `pageNumber` seulement sur `Display`. C'est valide.

Rendre **`ReadingSession`** explicite est souvent plus clair en entretien:

* La session répond: *qui lit quoi, à quelle page?*
* Le display répond: *comment peindre cet état à l'écran?*

Quand `openBook` s'exécute, la session se met à jour, puis le display se rafraîchit depuis l'état de session.

### Un user actif, un livre actif

C'est une **coupe de scope**, pas une affirmation sur les vrais produits. Ça enlève le locking, le sync multi-onglets et "user A sur téléphone, user B sur tablette". Dis-le. Si l'interviewer veut du multi-session ensuite, tu ajoutes une map `userId -> ReadingSession` sans redessiner `Book` et `Library`.

### Structures de données

* `HashMap<Integer, Book>` dans `Library` pour find par id en O(1)
* `HashMap<Integer, User>` dans `UserManager` pour find par id en O(1)
* Plus tard optionnel: index titre, full-text, ou service catalogue (ne l'invente pas sans demande)

---

## 4. Solution Java (esquisse)

Code en forme d'entretien: constructeurs, maps, et les méthodes que tu expliques à voix haute. Pas un framework GUI.

### Book et User

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

`Book` et `User` sont surtout des données. C'est correct. Le comportement vit dans les managers et la session.

### Library et UserManager

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

Les ids en double renvoient `null` (ou throw; choisis un style et tiens-toi-y). L'important est de **vérifier avant d'insérer**.

### ReadingSession et Display

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

Les bornes de page sont souples ici (pas de nombre total de pages sur `Book`). Si l'interviewer veut des limites dures, ajoute `int pageCount` sur `Book` et borne dans `turnPageForward`.

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

Flux:

1. Catalogue livres et users via `Library` / `UserManager`
2. `login` lie l'user de session et peint l'identité
3. `openBook` lie le livre, remet la page à 0, peint titre et page 0
4. Les tours de page mettent à jour la session puis ne rafraîchissent que la zone page

---

## 5. Parcours

Données de départ:

```java
OnlineReaderSystem app = new OnlineReaderSystem();
app.getUserManager().addUser(1, "Sam", 1);
app.getLibrary().addBook(100, "Algorithms notes");
app.getLibrary().addBook(200, "System design notes");
```

**Login Sam, ouvrir le livre 100:**

1. `login(1)` trouve l'user 1, session.activeUser = Sam, livre/page effacés, display montre Sam
2. `openBook(100)` trouve le livre 100, activeBook fixé, pageNumber = 0, display montre titre et page 0
3. `display.turnPageForward(session)` deux fois: pageNumber passe à 2, seule la page est repeinte

**Changer de livre sans logout:**

* `openBook(200)` remplace le livre actif, page à 0. La progression de l'ancien livre n'est pas stockée dans cette esquisse (dis-le).

**Logout:**

* `logout()` vide la session; le refresh du display laisse le lecteur vide.

**Chemins en échec:**

* `openBook` sans login: false, aucun livre peint
* `login(99)` si l'user manque: false
* `addBook(100, ...)` deux fois: le second renvoie null

Petit tableau de contrôle:

| Étape | activeUser | activeBook | page |
| --- | --- | --- | --- |
| start | null | null | 0 |
| login(1) | Sam | null | 0 |
| openBook(100) | Sam | Algorithms notes | 0 |
| forward x2 | Sam | Algorithms notes | 2 |
| openBook(200) | Sam | System design notes | 0 |
| logout | null | null | 0 |

---

## 6. Cas limites et notes d'entretien

* **Ouvrir un livre sans user actif:** refuser. Le display n'invente pas d'invité sauf si tu l'as conçu.
* **Livre retiré pendant qu'il est ouvert:** bloque le remove si la session tient cet id, ou vide la session si `library.remove` touche le livre actif.
* **Sous/dépassement de page:** borne à `[0, pageCount-1]` si tu ajoutes `pageCount`.
* **Ids user/livre en double:** refuse à l'add; ne pas écraser en silence sauf upsert voulu.
* **Renouvellement d'abonnement:** reste sur `User` (ou un objet `Membership`) pour ne pas mélanger la facturation au `Display`.
* **Progression sauvée par user et livre:** étends avec `Map<UserBookKey, Integer> lastPage` ou un store `ReadingProgress`. La session garde toujours l'état *courant* ouvert.
* **Recherche par titre:** `Library` peut avoir un second index; ne fourre pas un scan de chaînes dans `OnlineReaderSystem`.
* **Plusieurs sessions:** `Map<Integer, ReadingSession>` par user id (ou device id). Le display devient par client.

Erreurs fréquentes:

1. **Une méga-classe** avec users, books, pages et UI en champs et méthodes.
2. **Oublier d'énoncer** les contraintes session unique et un seul livre.
3. **Le display qui possède le catalogue** (l'UI n'est pas la base de données).
4. **Pas de check avant add**, donc la map écrase en silence.
5. **Tourner la page sans livre ouvert**, en mutant un numéro de page fantôme.
6. **Sauter aux microservices / Kafka** alors que le prompt demandait des structures de données au tableau.

Idée de smoke minimale:

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

## 7. Récap à expliquer à un ami

Lecteur de livres en ligne OOD, taille entretien:

1. **Énonce les hypothèses:** abonnement, lookup bibliothèque, lecture avec un user actif et un livre actif.
2. **Découpe les classes:** `User`, `Book`, `Library`, `UserManager`, `Display`, `ReadingSession`, `OnlineReaderSystem` mince.
3. **Maps** pour users et books par id. Add / remove / find vivent sur les managers, pas sur l'UI.
4. **La session** tient qui lit, quel livre est ouvert, et la page.
5. **Le display** peint depuis la session (nom, titre, détails, page) et, pour les tours de page, met à jour la session puis rafraîchit.
6. **Le système** relie les pièces: login, openBook, logout. Il ne devient pas la bibliothèque.
7. La discussion scale est optionnelle: map multi-session, progression sauvée, index de recherche. Seulement si on te le demande.

Si tu peux dessiner les boîtes et parcourir `login` puis `openBook` puis `turnPageForward` sans mélanger la logique catalogue dans le display, tu maîtrises le problème 7.5.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Parking Lot](/blog/fr/ctci-7-4-parking-lot)
* Suivant: [Jigsaw](/blog/fr/ctci-7-6-jigsaw)