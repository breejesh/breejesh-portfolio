---
title: "Lecteur de Livres en Ligne: Architecture Système Orientée Objet (CTCI 7.5)"
description: "Concevez les structures de données et classes pour un lecteur de livres en ligne en séparant l'état de session active du catalogue en temps O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-5-online-book-reader.webp
previewImage: /assets/images/ctci-7-5-online-book-reader.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Concevez les structures de données pour un système de lecture de livres en ligne.
> * **La Solution Optimale:** Architecture Découplée État / Répertoire : (1) Modèles métier `Book` et `User` ; (2) Couche d'accès aux données `Library` (catalogue indexé par `bookId`) et `UserManager` (comptes indexés par `userId`) ; (3) Module de présentation `Display` mémorisant l'utilisateur actif, le livre en cours et la page affichée ; (4) Façade unifiée `OnlineReaderSystem` opérant en temps $O(1)$.
> * **Réalité en Production:** Plateformes de lecture numérique dans le cloud (Kindle Cloud Reader / Apple Books).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 7.5), l'énoncé est :

*"Concevez les structures de donnees et les classes pour un systeme de lecture de livres en ligne."*

## 2. Architecture des Composants

1. **`Book` :** Identifiant, titre, auteur et liste des pages (`List<String>`).
2. **`User` :** Identifiant et type d'abonnement.
3. **`Library` & `UserManager` :** Tables de hachage pour accès direct.
4. **`Display` :** Maintient l'état d'affichage (livre actif et défilement de pages).
5. **`OnlineReaderSystem` :** Façade principale coordonnant l'ensemble.

## Implémentation de Production

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

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Recherche Livre/Utilisateur | `O(1)` | Accès direct via table de hachage. |
| Navigation de Page | `O(1)` | Incrémentation avec contrôle des bornes. |
| Espace Auxiliaire | `O(B * P + U)` | Proportionnel aux livres, pages et utilisateurs enregistrés. |

## Ingénierie des Systèmes en Production

### Architecture Système : Liseuses Numériques Cloud

1. **Protocole Whispersync de Kindle :** Synchronisation multi-appareils de la progression de lecture et des annotations.
2. **Gestion des Droits Numériques (DRM) et CDN :** Validation des jetons de session avant distribution sécurisée des flux de lecture.

## Cas Limites et Robustesse

1. **Contrôle des Limites :** Empêche tout dépassement d'indice sur les pages initiales et finales.
