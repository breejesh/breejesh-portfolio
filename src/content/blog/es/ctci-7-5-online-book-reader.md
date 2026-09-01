---
title: "Lector de Libros Online: Arquitectura de Sistema Orientada a Objetos (CTCI 7.5)"
description: "Disena las estructuras de datos y modelos de clase para un sistema lector de libros online separando el estado de sesion activa del catalogo en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-7-5-online-book-reader.webp
previewImage: /assets/images/ctci-7-5-online-book-reader.webp
---

> **TL;DR**
> * **El Problema del Libro:** Disena las estructuras de datos para un sistema de lectura de libros online.
> * **La Solución Óptima:** Arquitectura Desacoplada de Estado y Repositorio: (1) Modelos de dominio `Book` y `User`; (2) Capa de repositorios `Library` (catalogo indexado por `bookId`) y `UserManager` (cuentas indexadas por `userId`); (3) Motor de presentacion `Display` que rastrea el libro activo, usuario y pagina actual; (4) Fachada principal `OnlineReaderSystem` en tiempo $O(1)$.
> * **Realidad en Producción:** Plataformas de lectura en la nube (Kindle Cloud Reader / Apple Books).

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 7.5), se nos plantea:

*"Disena las estructuras de datos y clases para un sistema lector de libros en linea."*

## 2. Arquitectura de Componentes

1. **`Book`:** Metadatos y paginas de contenido (`List<String>`).
2. **`User`:** Identificador y tipo de suscripcion.
3. **`Library` & `UserManager`:** Tablas hash para busqueda y gestion rapida.
4. **`Display`:** Mantiene el estado visual actual (libro activo y desplazamiento de pagina).
5. **`OnlineReaderSystem`:** Fachada que unifica los componentes.

## Implementación de Producción

```java
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class OnlineBookReader {
    public static class Book {
        private final int bookId;
        private String title;
        private String author;
        private List<String> pages;

        public Book(int id, String title, String author, List<String> pages) {
            this.bookId = id;
            this.title = title;
            this.author = author;
            this.pages = pages;
        }

        public int getID() { return bookId; }
        public String getTitle() { return title; }
        public String getPage(int pageNumber) {
            if (pageNumber >= 0 && pageNumber < pages.size()) {
                return pages.get(pageNumber);
            }
            return null;
        }
        public int getTotalPages() { return pages.size(); }
    }

    public static class User {
        private final int userId;
        private String username;

        public User(int id, String name) {
            this.userId = id;
            this.username = name;
        }

        public int getID() { return userId; }
        public String getUsername() { return username; }
    }

    public static class Library {
        private final Map<Integer, Book> books = new HashMap<>();

        public void addBook(Book b) { books.put(b.getID(), b); }
        public Book find(int id) { return books.get(id); }
    }

    public static class UserManager {
        private final Map<Integer, User> users = new HashMap<>();

        public void addUser(User u) { users.put(u.getID(), u); }
        public User find(int id) { return users.get(id); }
    }

    public static class Display {
        private Book activeBook;
        private User activeUser;
        private int pageNumber = 0;

        public void displayBook(Book book) {
            this.activeBook = book;
            this.pageNumber = 0;
        }

        public void nextPage() {
            if (activeBook != null && pageNumber < activeBook.getTotalPages() - 1) {
                pageNumber++;
            }
        }

        public void previousPage() {
            if (activeBook != null && pageNumber > 0) {
                pageNumber--;
            }
        }

        public int getPageNumber() { return pageNumber; }
    }

    public static class OnlineReaderSystem {
        private final Library library = new Library();
        private final UserManager userManager = new UserManager();
        private final Display display = new Display();

        public Library getLibrary() { return library; }
        public UserManager getUserManager() { return userManager; }
        public Display getDisplay() { return display; }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Búsqueda de Libros/Usuarios | `O(1)` | Acceso directo en tabla hash. |
| Avance de Página | `O(1)` | Incremento con validacion de limites. |
| Espacio Auxiliar | `O(B * P + U)` | Proporcional a libros, paginas y usuarios almacenados. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Plataformas E-Reader

1. **Protocolo Whispersync de Kindle:** Sincroniza la posicion de lectura exacta y notas en todos los dispositivos del usuario mediante relojes de secuencia.
2. **Tokens DRM y Distribución CDN:** Verificacion de licencias activas antes de servir fragmentos de paginas.

## Casos Límite y Robustez en Producción

1. **Límites de Páginas:** `nextPage()` y `previousPage()` previenen desbordamientos fuera del rango de paginas disponible.
