---
title: "Lector de libros online: User, Library, Display y sesión de lectura (Java OOD)"
description: "Problema estilo CTCI 7.5 para principiantes: diseña un lector de libros online con User, Book, Library, Display y una sola sesión de lectura activa. Esbozo Java original, no un producto completo."
date: "2026-04-24"
tags: [Algoritmos]
coverImage: /assets/images/ctci-7-5-online-book-reader.webp
previewImage: /assets/images/ctci-7-5-online-book-reader.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 7.5 para principiantes: diseña un lector de libros online con User, Book, Library, Display y una sola sesión de lectura activa. Esbozo Java original, no un producto completo.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Diseña las **estructuras de datos** de un **lector de libros online**. No un clon completo de Kindle. No un CDN de contenido distribuido. Un modelo de objetos a tamaño de entrevista: los usuarios se registran y renuevan la membresía, los libros viven en una biblioteca, un lector activo tiene un libro abierto y una pantalla muestra la página actual.

Esta entrada es enseñanza original para principiantes, con un esbozo en **Java** que reparte responsabilidades en clases pequeñas. Misma familia que los clásicos de diseño orientado a objetos de CTCI, no una copia del libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 7, diseño orientado a objetos, problema 7.5.

---

## 1. Analogía cotidiana

Piensa en una biblioteca de barrio que solo tiene **una silla de lectura** y **una lámpara de escritorio**.

Los socios tienen carnet. Los estantes guardan libros. Cuando te sientas, eliges un libro, abres una página y la lámpara ilumina esa página. En esta historia simple, nadie más se sienta en la misma silla a la vez. Cuando te vas, el siguiente socio se sienta, elige un libro y la página se reinicia.

Eso se mapea así:

* **User** = socio con carnet y estado de membresía
* **Book** = ítem del estante con id y detalles
* **Library** = estantes y búsqueda
* **Display** = lámpara y página abierta (lo que se ve en pantalla)
* **Session** = quién está en la silla, qué libro está abierto, en qué página
* **OnlineReaderSystem** = el mostrador que conecta las piezas

La entrevista no va de lanzar lectura multijugador. Va de **quién es dueño de cada responsabilidad** para que la clase principal no se convierta en un cajón de 2000 líneas.

---

## 2. Enunciado en palabras simples

**Enunciado:** diseña las estructuras de datos de un sistema lector de libros online.

El prompt clásico da pocos requisitos. Debes **dejar supuestos explícitos**. Un alcance razonable para principiantes:

**Soportado:**

* Crear membresía de usuario y renovarla después
* Añadir, quitar y buscar libros en una biblioteca
* Buscar usuarios por id
* Abrir un libro para el usuario activo (iniciar sesión de lectura)
* Mostrar datos de usuario, título/detalles del libro y página actual en un display
* Pasar páginas adelante y atrás
* Como máximo **un usuario activo** y **un libro activo** a la vez (sesión única)

**Fuera de alcance de este esbozo (dilo en voz alta):**

* Lectores concurrentes, sincronización de dispositivos, DRM, pagos, recomendaciones
* Ranking de búsqueda full-text, catálogos con millones de títulos
* Protocolo de red, descarga offline, anotaciones, subrayados
* Permisos más allá de un simple `accountType` int

**Meta en la entrevista:** nombrar clases, campos y métodos principales. Mostrar cómo fijar el usuario o el libro activo actualiza el display. Mantener el orquestador delgado.

**Forma de la firma (modelo mental):**

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

## 3. Piensa primero

### Aclara antes de dibujar cajas

Pregunta:

1. ¿Un solo dispositivo / una sola sesión, o multi-usuario concurrente?
2. ¿Guardamos progreso de página por usuario y libro, o solo la "página abierta ahora"?
3. ¿Búsqueda solo por id, o también por título?
4. ¿Importan los tipos de membresía para feature flags?

En una pizarra de 45 minutos, elige **sesión activa única**, **página en display/sesión**, **lookup por id** y un stub `renewMembership()`. Escribe esos supuestos arriba del tablero.

### Divide por responsabilidad (no por "pantallas")

Mal default: meter usuarios, libros, páginas y refresco de UI en una sola clase dios `OnlineReaderSystem`.

Mejor reparto:

| Clase | Posee |
| --- | --- |
| `Book` | id, details (título/metadatos en el esbozo) |
| `User` | id, details, tipo de cuenta, renovar membresía |
| `Library` | mapa de id de libro a `Book`; add / remove / find |
| `UserManager` | mapa de id de usuario a `User`; add / remove / find |
| `Display` | lo que pinta la UI: usuario activo, libro activo, página; helpers de refresh |
| `ReadingSession` | quién está logueado, qué libro está abierto, índice de página actual |
| `OnlineReaderSystem` | crea las piezas, login/openBook, delega |

¿Por qué sacar `Library`, `UserManager` y `Display` del sistema principal? En una app de juguete parecen archivos de más. Cuando crece el sistema (búsqueda, préstamos, bookmarks), la clase principal sigue siendo un coordinador corto en lugar de absorber cada feature.

### Sesión vs display

Puedes guardar "usuario activo" y "libro activo" solo en `OnlineReaderSystem` y dejar `pageNumber` solo en `Display`. Es válido.

Hacer **`ReadingSession`** explícita suele quedar más claro en entrevista:

* La sesión responde: *¿quién lee qué, en qué página?*
* El display responde: *¿cómo pintamos ese estado en pantalla?*

Cuando corre `openBook`, la sesión se actualiza y el display se refresca desde el estado de la sesión.

### Un usuario activo, un libro activo

Es un **recorte de alcance**, no una afirmación sobre productos reales. Quita locking, sync multi-pestaña y "usuario A en el móvil, usuario B en la tablet". Dílo. Si luego piden multi-sesión, añades un mapa `userId -> ReadingSession` sin rediseñar `Book` ni `Library`.

### Estructuras de datos

* `HashMap<Integer, Book>` en `Library` para find por id en O(1)
* `HashMap<Integer, User>` en `UserManager` para find por id en O(1)
* Más adelante opcional: índice por título, full-text o servicio de catálogo (no lo inventes si no te lo piden)

---

## 4. Solución Java (esbozo)

Código con forma de entrevista: constructores, mapas y los métodos que explicarías en voz alta. No es un framework de GUI.

### Book y User

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

`Book` y `User` son sobre todo datos. Está bien. El comportamiento vive en managers y en la sesión.

### Library y UserManager

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

Ids duplicados devuelven `null` (o lanzan; elige un estilo y mantenlo). Importa que **compruebes antes de insertar**.

### ReadingSession y Display

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

Los límites de página son suaves aquí (no hay total de páginas en `Book`). Si quieren límites duros, añade `int pageCount` en `Book` y acota en `turnPageForward`.

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

Flujo:

1. Cataloga libros y usuarios vía `Library` / `UserManager`
2. `login` enlaza el usuario de la sesión y pinta la identidad
3. `openBook` enlaza el libro, reinicia la página, pinta título y página 0
4. Los giros de página actualizan la sesión y solo refrescan la región de la página

---

## 5. Recorrido

Datos semilla:

```java
OnlineReaderSystem app = new OnlineReaderSystem();
app.getUserManager().addUser(1, "Sam", 1);
app.getLibrary().addBook(100, "Algorithms notes");
app.getLibrary().addBook(200, "System design notes");
```

**Login de Sam, abrir libro 100:**

1. `login(1)` encuentra usuario 1, session.activeUser = Sam, limpia libro/página, display muestra a Sam
2. `openBook(100)` encuentra libro 100, fija activeBook, pageNumber = 0, display muestra título y página 0
3. `display.turnPageForward(session)` dos veces: pageNumber pasa a 2, solo se repinta la página

**Cambiar de libro sin logout:**

* `openBook(200)` sustituye el libro activo, página vuelve a 0. El progreso del libro anterior no se guarda en este esbozo (menciónalo).

**Logout:**

* `logout()` limpia la sesión; el refresh del display deja el lector vacío.

**Caminos fallidos:**

* `openBook` sin login: false, no se pinta libro
* `login(99)` si falta el usuario: false
* `addBook(100, ...)` dos veces: la segunda devuelve null

Tabla rápida:

| Paso | activeUser | activeBook | page |
| --- | --- | --- | --- |
| start | null | null | 0 |
| login(1) | Sam | null | 0 |
| openBook(100) | Sam | Algorithms notes | 0 |
| forward x2 | Sam | Algorithms notes | 2 |
| openBook(200) | Sam | System design notes | 0 |
| logout | null | null | 0 |

---

## 6. Casos límite y notas de entrevista

* **Abrir libro sin usuario activo:** rechazar. El display no inventa un invitado salvo que lo hayas diseñado.
* **Libro eliminado mientras está abierto:** bloquea el remove si la sesión tiene ese id, o limpia la sesión si `library.remove` pega en el libro activo.
* **Sub/desbordamiento de página:** acota a `[0, pageCount-1]` si añades `pageCount`.
* **Ids de usuario/libro duplicados:** rechaza en add; no sobrescribas en silencio salvo que el producto quiera upsert.
* **Renovación de membresía:** déjala en `User` (o un objeto `Membership`) para no mezclar billing con `Display`.
* **Progreso guardado por usuario y libro:** amplía con `Map<UserBookKey, Integer> lastPage` o un store `ReadingProgress`. La sesión sigue guardando el estado *actual* abierto.
* **Búsqueda por título:** `Library` puede tener un segundo índice; no metas un scan de strings en `OnlineReaderSystem`.
* **Varias sesiones:** `Map<Integer, ReadingSession>` por user id (o device id). El display pasa a ser por cliente.

Errores frecuentes:

1. **Una mega clase** con usuarios, libros, páginas y UI como campos y métodos.
2. **No enunciar** las restricciones de sesión única y un solo libro.
3. **Que el display posea el catálogo** (la UI no es la base de datos).
4. **No comprobar antes de add**, así el mapa sobrescribe en silencio.
5. **Pasar página sin libro abierto**, mutando un número de página fantasma.
6. **Saltar a microservicios / Kafka** cuando el prompt pedía estructuras de datos en pizarra.

Idea mínima de smoke:

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

## 7. Recap para contárselo a un amigo

Lector de libros online OOD, tamaño entrevista:

1. **Deja supuestos claros:** membresía, lookup en biblioteca, lectura con un usuario activo y un libro activo.
2. **Divide clases:** `User`, `Book`, `Library`, `UserManager`, `Display`, `ReadingSession`, `OnlineReaderSystem` delgado.
3. **Mapas** de usuarios y libros por id. Add / remove / find viven en los managers, no en la UI.
4. **La sesión** guarda quién lee, qué libro está abierto y la página.
5. **El display** pinta desde la sesión (nombre, título, detalles, página) y en los giros de página actualiza la sesión y luego refresca.
6. **El sistema** conecta piezas: login, openBook, logout. No se convierte en la biblioteca.
7. Hablar de escala es opcional: mapa multi-sesión, progreso guardado, índice de búsqueda. Solo si te lo piden.

Si puedes dibujar las cajas y recorrer `login`, luego `openBook`, luego `turnPageForward` sin meter lógica de catálogo en el display, dominas el problema 7.5.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Parking Lot](/blog/es/ctci-7-4-parking-lot)
* Siguiente: [Jigsaw](/blog/es/ctci-7-6-jigsaw)