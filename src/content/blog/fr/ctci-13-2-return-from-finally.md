---
title: "Retour depuis Finally: Flux de Contrôle et Bytecode dans la JVM (CTCI 13.2)"
description: "Analysez les garanties d'exécution du bloc finally face aux instructions return en Java, la mise en tampon des valeurs et les cas limites d'arrêt de la JVM."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-13-2-return-from-finally.webp
previewImage: /assets/images/ctci-13-2-return-from-finally.webp
---

> **TL;DR**
> * **Le Problème du Livre:** En Java, le bloc `finally` est-il exécuté si nous insérons une instruction `return` à l'intérieur du bloc `try` ?
> * **La Solution Optimale:** **Exécution Garantie et Mise en Tampon de la Valeur de Retour** : (1) **Oui, systématiquement** : Le bloc `finally` s'exécute *toujours* avant que le contrôle ne soit rendu à l'appelant, même en présence d'instructions `return`, `break` ou `continue` ; (2) **Ordre d'Évaluation** : L'expression de retour du `try` est évaluée et mémorisée dans un registre de pile de la JVM, après quoi le flux bascule vers le bloc `finally` ; (3) **Écrasement de la Valeur** : Si `finally` comporte sa propre instruction `return`, il écrase et annule définitivement la valeur calculée (ou toute exception en vol) ; (4) **Cas d'Exclusion** : Le bloc `finally` n'est ignoré que lors d'un appel à `System.exit(0)`, d'un crash de la JVM (`SIGKILL`) ou d'une boucle infinie dans le `try`.
> * **Réalité en Production:** Libération de verrous concurrents (`ReentrantLock`) et blocs `try-with-resources`.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 13.2), l'énoncé est :

*"Exposez le comportement et l'ordre d'execution du bloc finally en Java lorsqu'une instruction return figure dans le bloc try."*

## 2. Ordonnancement du Bytecode dans la JVM

À la rencontre d'un `return` dans le `try` :
1. La valeur est calculée et placée dans un registre temporaire de pile.
2. Le flux bifurque vers le bloc `finally`.
3. Une fois `finally` terminé, la valeur stockée est transmise à l'instruction de retour de méthode.

## Implémentation de Production

```java
public class FinallyExecutionProof {

    public static int testPrimitiveBuffering() {
        int x = 1;
        try {
            return x; // Mémorise la valeur 1
        } finally {
            x = 2; // N'affecte pas la valeur déjà mise en tampon
            System.out.println("Finally exécuté, x vaut: " + x);
        }
    }

    public static StringBuilder testReferenceBuffering() {
        StringBuilder sb = new StringBuilder("Bonjour");
        try {
            return sb; // Mémorise l'adresse de référence de l'objet
        } finally {
            sb.append(" Monde"); // Modifie l'objet sur le tas
        }
    }

    public static int antipatternFinallyReturn() {
        try {
            throw new RuntimeException("Erreur critique");
        } finally {
            return 100; // ANTIPATRON: Masque et supprime l'exception
        }
    }
}
```

## Synthèse des Résultats d'Exécution

| Scénario | Déroulement | Résultat Renvoyé |
|---|---|---|
| `try` renvoie primitive `x = 1`, `finally` fixe `x = 2` | `try` $\to$ `finally` $\to$ retour | Renvoie **1** (valeur scalaire figée). |
| `try` renvoie objet, `finally` modifie son état | `try` $\to$ `finally` $\to$ retour | Renvoie l'objet muté ("Bonjour Monde"). |
| `try` lève exception, `finally` exécute un `return` | `try` $\to$ `finally` $\to$ retour | Renvoie la valeur (**Exception masquée**). |
| `try` appelle `System.exit(0)` | Arrêt immédiat de la machine virtuelle | `finally` **n'est jamais exécuté**. |

## Ingénierie des Systèmes en Production

### Architecture Système : Libération de Ressources

1. **Garantie de Libération de Verrous :**
   ```java
   lock.lock();
   try {
       effectuerTraitement();
   } finally {
       lock.unlock(); // Exécuté même sur OutOfMemoryError inattendu
   }
   ```
2. **Try-With-Resources (Java 7+) :** Automatise la fermeture des flux implémentant `AutoCloseable`.

## Cas Limites et Robustesse

1. **Bannir `return` dans `finally` :** Considéré comme une anomalie majeure par les analyseurs statiques car cela étouffe silencieusement les pannes.
