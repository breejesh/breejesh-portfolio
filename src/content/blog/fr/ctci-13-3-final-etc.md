---
title: "Final, Finally et Finalize: Modificateurs et Cycle de Vie en Java (CTCI 13.3)"
description: "Distinguez final, finally et finalize en Java : immutabilité, blocs de nettoyage garantis et dépréciation de finalize dans la machine virtuelle Java moderne."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-13-3-final-etc.webp
previewImage: /assets/images/ctci-13-3-final-etc.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Quelle est la différence entre `final`, `finally` et `finalize` en Java ?
> * **Différences Fondamentales :** (1) **`final` (Modificateur)** : S'applique aux variables (référence/valeur immuable), aux méthodes (interdit la surcharge pour permettre l'inlining JIT) et aux classes (interdit l'héritage, ex. `String`) ; (2) **`finally` (Bloc de Contrôle)** : Bloc rattaché à `try-catch` dont l'exécution est garantie pour libérer les ressources ; (3) **`finalize()` (Méthode du Ramasse-Miettes)** : Méthode de `java.lang.Object` appelée avant destruction de l'objet (**dépréciée en Java 9 et supprimée en Java 18+** en raison des blocages, ralentissements du GC et risques de sécurité ; remplacée par `AutoCloseable` et `java.lang.ref.Cleaner`).
> * **Réalité en Production:** Enregistrements Java immuables (`records`) et désallocation déterministe de mémoire native.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 13.3), l'énoncé est :

*"Exposez les distinctions fondamentales entre les mots-cles final, finally et la methode finalize en Java."*

## 2. Tableau Comparatif Synthétique

| Critère | `final` | `finally` | `finalize()` |
|---|---|---|---|
| **Nature** | Modificateur d'accès | Mot-clé de flux de contrôle | Méthode de `java.lang.Object` |
| **Cible** | Variables, Méthodes, Classes | Blocs `try-catch` | Objets détruits par le GC |
| **Garantie** | Immutabilité et non-héritage | Nettoyage mémoire déterministe | **Aucune garantie temporelle** |
| **Statut Actuel** | Omniprésent en production | Standard absolu | **Obsolète et supprimé** |

## Implémentation de Production

```java
import java.lang.ref.Cleaner;

public final class SecurityToken {
    private final String token;

    public SecurityToken(String token) {
        this.token = token;
    }

    public final String getToken() {
        return token;
    }
}

public class NativeBufferWrapper implements AutoCloseable {
    private static final Cleaner CLEANER = Cleaner.create();

    private static class CleanAction implements Runnable {
        private long address;
        CleanAction(long addr) { this.address = addr; }
        @Override
        public void run() {
            if (address != 0) {
                System.out.println("Libération mémoire native: " + address);
                address = 0;
            }
        }
    }

    private final Cleaner.Cleanable cleanable;

    public NativeBufferWrapper(long address) {
        this.cleanable = CLEANER.register(this, new CleanAction(address));
    }

    @Override
    public void close() {
        cleanable.clean();
    }
}
```

## Causes de l'Abandon de `finalize()`

1. **Absence de Déterminisme :** Aucune certitude sur l'instant d'exécution de `finalize()`.
2. **Impact Majeur sur le GC :** Les objets subissant la finalisation saturent les files d'attente du ramasse-miettes.
3. **Résurrection d'Objets Corrompus :** Réassigner `this` à une variable statique dans `finalize()` permettait de réanimer des objets non valides.

## Ingénierie des Systèmes en Production

### Architecture Système : Optimisations du Compilateur JIT

1. **Inlining Monomorphique :** Marquer une méthode comme `final` autorise le compilateur HotSpot JIT à intégrer directement le bytecode en instructions machine sans traverser la `vtable`.
2. **Modèle Mémoire Java (JMM) :** Les champs `final` sont garantis visibles sans ambiguïté dès la fin du constructeur.

## Cas Limites et Robustesse

1. **Référence Finale vs Immutabilité d'Objet :** `final List<String> list` interdit de réaffecter la référence, mais autorise l'ajout d'éléments. Utiliser `List.of()` pour une réelle immutabilité.
