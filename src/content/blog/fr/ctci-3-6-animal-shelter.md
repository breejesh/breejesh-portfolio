---
title: "Refuge Animalier: File d'Attente d'Adoption FIFO Multi-Catégories (CTCI 3.6)"
description: "Implémentez une file d'adoption FIFO pour un refuge maintenant des listes distinctes pour Chiens et Chats avec horodatage d'arrivée en temps O(1) et espace O(N)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-3-6-animal-shelter.webp
previewImage: /assets/images/ctci-3-6-animal-shelter.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Un refuge animalier accueille uniquement des chiens et des chats et fonctionne selon le principe strict FIFO. Les adoptants peuvent choisir l'animal le plus ancien tous types confondus (`dequeueAny`), ou spécifiquement le plus ancien chien (`dequeueDog`) ou chat (`dequeueCat`).
> * **La Solution Optimale:** Maintenez deux files distinctes `LinkedList<Dog>` et `LinkedList<Cat>`. Attribuez un numéro d'ordre incrémental (`order`) à chaque animal lors de son arrivée (`enqueue`). `dequeueAny` inspecte les têtes des deux files et retire l'animal ayant le plus petit `order` en temps $O(1)$.
> * **Réalité en Production:** Ordonnanceurs de tâches distribuées (Celery/BullMQ) et séquençage LSN dans les journaux de bases de données.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 3.6), l'énoncé est :

*"Un refuge pour animaux ne recueille que des chiens et des chats et fonctionne strictement selon le principe FIFO. Les adoptants doivent adopter soit l'animal le plus ancien au refuge, soit préciser s'ils souhaitent un chien ou un chat. Implémentez les opérations enqueue, dequeueAny, dequeueDog et dequeueCat."*

## 2. Conception par Double File et Horodatage Monotone

Pour garantir un temps d'exécution en $O(1)$ sur toutes les méthodes :
1. Maintenir deux files distinctes `LinkedList<Dog> dogs` et `LinkedList<Cat> cats`.
2. Encapsuler les animaux dans une classe `Animal` dotée d'un champ entier `order`.
3. **`enqueue(animal)` :** Assigner `order++` et insérer en queue de la liste adéquate en $O(1)$.
4. **`dequeueDog()` / `dequeueCat()` :** Extraire directement la tête de la file respective en $O(1)$.
5. **`dequeueAny()` :** Comparer l'`order` des deux têtes et extraire le plus ancien en $O(1)$.

## Implémentation de Production

```java
import java.util.LinkedList;

public class AnimalShelter {
    public static abstract class Animal {
        private int order;
        protected String name;

        public Animal(String n) { name = n; }
        public void setOrder(int ord) { order = ord; }
        public int getOrder() { return order; }
        public String getName() { return name; }

        public boolean isOlderThan(Animal a) {
            return this.order < a.getOrder();
        }
    }

    public static class Dog extends Animal {
        public Dog(String n) { super(n); }
    }

    public static class Cat extends Animal {
        public Cat(String n) { super(n); }
    }

    private final LinkedList<Dog> dogs = new LinkedList<>();
    private final LinkedList<Cat> cats = new LinkedList<>();
    private int order = 0;

    public void enqueue(Animal a) {
        a.setOrder(order++);
        if (a instanceof Dog) {
            dogs.addLast((Dog) a);
        } else if (a instanceof Cat) {
            cats.addLast((Cat) a);
        }
    }

    public Animal dequeueAny() {
        if (dogs.isEmpty()) {
            return dequeueCat();
        } else if (cats.isEmpty()) {
            return dequeueDog();
        }

        Dog dog = dogs.peek();
        Cat cat = cats.peek();

        if (dog.isOlderThan(cat)) {
            return dequeueDog();
        } else {
            return dequeueCat();
        }
    }

    public Dog dequeueDog() {
        return dogs.poll();
    }

    public Cat dequeueCat() {
        return cats.poll();
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| enqueue | `O(1)` | Assignation d'horodatage et insertion en queue de liste. |
| dequeueAny | `O(1)` | Comparaison directe des deux têtes de liste. |
| dequeueDog / dequeueCat | `O(1)` | Extraction directe de la tête de file spécifique. |
| Espace Auxiliaire | `O(N)` | Mémoire proportionnelle au nombre total d'animaux présents. |

## Ingénierie des Systèmes en Production

### Architecture Système : Ordonnancement Multi-Files

1. **Gestionnaires de Tâches d'Arrière-Plan (Celery, BullMQ) :** Traitement de files à vocations distinctes tout en conservant un ordre d'arrivée global grâce à des identifiants de séquence.
2. **Journaux de Transactions (WAL) :** Numérotation monotone (LSN) garantissant l'ordre de rejeu des flux de transactions.

## Cas Limites et Robustesse

1. **Ne reste que des chiens ou que des chats :** `dequeueAny()` bascule sur la file non vide.
2. **Refuge vide :** Renvoie `null` sans lever d'exception.
