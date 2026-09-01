---
title: "Constructeur Privé: Interdiction de l'Héritage et Patrons de Création en Java (CTCI 13.1)"
description: "Analysez les effets des constructeurs privés sur l'héritage en Java : résolution de super(), patron Singleton et classes utilitaires non instanciables."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-13-1-private-constructor.webp
previewImage: /assets/images/ctci-13-1-private-constructor.webp
---

> **TL;DR**
> * **Le Problème du Livre:** En termes d'héritage, quel est l'effet de déclarer un constructeur privé en Java ?
> * **La Solution Optimale:** **Interdiction de Sous-Classement par Inaccessibilité de Super()** : (1) En Java, tout constructeur d'une classe fille doit exécuter un constructeur de sa classe mère (explicitement via `super(...)` ou implicitement via `super()`) ; (2) Si tous les constructeurs de la classe mère sont `private`, aucune classe externe ne peut invoquer `super()`, rendant l'héritage impossible (erreur de compilation) ; (3) **Exception des Classes Internes** : Les classes imbriquées statiques au sein de la même classe englobante peuvent accéder aux constructeurs privés et hériter de la classe mère ; (4) **Cas d'Usage** : Utilisé pour garantir le patron Singleton, les classes utilitaires purement statiques (`Math`, `Arrays`) et les fabriques statiques.
> * **Réalité en Production:** Fabriques de beans dans Spring Framework et construction d'objets immuables.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 13.1), l'énoncé est :

*"Expliquez les consequences d'un constructeur prive sur l'heritage et les patrons de conception en Java."*

## 2. Héritage en Java et Résolution de `super()`

Lorsqu'une classe fille est instanciée :
* La chaîne d'initialisation impose l'exécution de `super()`.
* Si le constructeur parent est privé, le compilateur bloque la compilation pour violation d'accès.

## Implémentation de Production

```java
public class DatabaseConnectionPool {
    private DatabaseConnectionPool() {
        System.out.println("Initialisation du singleton...");
    }

    private static class InstanceHolder {
        private static final DatabaseConnectionPool INSTANCE = new DatabaseConnectionPool();
    }

    public static DatabaseConnectionPool getInstance() {
        return InstanceHolder.INSTANCE;
    }

    // Les classes internes imbriquees peuvent heriter
    public static class TestablePool extends DatabaseConnectionPool {
        public TestablePool() {
            super(); // Autorise car classe interne
        }
    }
}

public final class MathUtils {
    private MathUtils() {
        throw new AssertionError("Classe utilitaire non instanciable");
    }

    public static int clamp(int val, int min, int max) {
        return Math.max(min, Math.min(max, val));
    }
}
```

## Patrons de Conception Associés

| Patron | Rôle | Nécessité du Constructeur Privé |
|---|---|---|
| **Singleton** | Garantit 1 unique instance globale. | Empêche les clients d'exécuter `new MyClass()`. |
| **Classe Utilitaire** | Regroupe des fonctions pures statiques. | Évite les allocations d'instances inutiles sur le tas. |
| **Fabrique Statique** | Instanciation contrôlée (`Optional.of()`). | Permet la mise en cache et le polymorphisme. |
| **Monteur (Builder)** | Construction d'objets immuables. | Force le passage exclusif par le Builder. |

## Ingénierie des Systèmes en Production

### Architecture Système : Classes Scellées en Java 17+

1. **Classes Scellées (`sealed classes`) :** Java 17 formalise la restriction d'héritage via `sealed ... permits`, offrant un contrôle granulaire au niveau du langage.
2. **Protection contre la Réflexion :** Lever une exception `AssertionError` dans le constructeur privé neutralise les attaques par contournement via `setAccessible(true)`.

## Cas Limites et Robustesse

1. **Sérialisation :** Protéger contre la création de doublons lors de la désérialisation en implémentant la méthode `readResolve()`.
