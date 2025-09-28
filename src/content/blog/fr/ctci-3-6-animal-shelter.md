---
title: "Animal Shelter: adoption FIFO chiens et chats (Java)"
description: "Problème style CTCI 3.6 pour débutants: un refuge n'accueille que chiens et chats en file FIFO stricte. Implémente enqueue, dequeueAny, dequeueDog et dequeueCat avec deux files et un ordre d'arrivée."
date: "2025-09-28"
tags: [Algorithmes]
coverImage: /assets/images/ctci-3-6-animal-shelter.webp
previewImage: /assets/images/ctci-3-6-animal-shelter.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 3.6 pour débutants: un refuge n'accueille que chiens et chats en file FIFO stricte. Implémente enqueue, dequeueAny, dequeueDog et dequeueCat avec deux files et un ordre d'arrivée.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un refuge tient une file équitable. Les animaux arrivent un par un. Les adoptants peuvent prendre l'animal qui attend le plus longtemps tous types confondus, ou demander seulement un chien ou seulement un chat et recevoir le plus ancien de ce type. Personne ne désigne un animal précis par son nom. C'est du **FIFO** pur, avec un filtre de type par-dessus.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de conception de files en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Le chapitre 3 se termine ici.

---

## 1. Analogie du refuge

Imagine deux salles d'attente derrière le guichet:

* Salle D: chiens seulement, alignés par heure d'arrivée.
* Salle C: chats seulement, alignés par heure d'arrivée.

Chaque animal reçoit un numéro de ticket à l'arrivée: 0, 1, 2, 3, ... Un ticket plus petit signifie arrivé plus tôt. Ce n'est pas une horloge murale. C'est un compteur entier géré par le refuge.

Quand quelqu'un dit **"n'importe quel animal"**, le préposé regarde le devant des deux salles et prend l'animal au plus petit ticket. S'il dit **"un chien"**, il ne regarde que la salle D. Même idée pour les chats.

Une seule file mixte rendrait le "n'importe lequel" simple, mais "chien seulement" forcerait à sauter les chats jusqu'au premier chien. Deux files typées gardent chaque opération sur le devant d'une liste.

---

## 2. Problème en mots simples

**But:** structures et méthodes pour un refuge qui ne garde que chiens et chats en FIFO strict.

**Opérations:**

| Méthode | Sens |
| --- | --- |
| `enqueue(animal)` | l'animal arrive; il va en queue de la file de son type |
| `dequeueAny()` | adopter l'animal le plus ancien, tous types |
| `dequeueDog()` | adopter le chien le plus ancien |
| `dequeueCat()` | adopter le chat le plus ancien |

**Règles:**

* Seulement chiens et chats.
* "Plus ancien" veut dire arrivée la plus tôt, pas l'âge biologique.
* On ne choisit pas un animal précis par identité, seulement par type (ou n'importe lequel).
* Tu peux utiliser une linked list ou une file intégrée.

**À clarifier avant de coder:**

* Refuge vide? (Renvoyer `null` ou lever une exception; choisis un contrat et tiens-toi y.)
* Demande d'un chien alors qu'il n'y en a plus? (Même contrat.)
* Même nom deux fois? (Oui. L'identité est l'objet plus l'ordre, pas la chaîne du nom.)

---

## 3. Réfléchir d'abord

### Une file mixte

Range tous les animaux dans un seul `LinkedList<Animal>`.

* `dequeueAny` est `removeFirst`: O(1).
* `dequeueDog` parcourt depuis le devant jusqu'au premier chien: O(N) au pire.
* Même coût pour les chats.

Ça marche, et parfois ça passe en entretien. Ce n'est pas la réponse propre si on te laisse deux listes.

### Deux files plus un ordre (préféré)

Garde:

* `dogs`: file des chiens
* `cats`: file des chats
* `order`: entier qui s'incrémente à chaque enqueue (horodatage logique)

À l'enqueue:

1. Estampille l'animal avec le `order` courant, puis `order++`.
2. Pousse dans la file chiens ou chats selon le type.

Sur `dequeueAny`:

1. Si un côté est vide, défile l'autre.
2. Si les deux ont des animaux, regarde les deux têtes et défile celui au plus petit order (arrivé plus tôt).
3. Si les deux sont vides, renvoie `null` (ou ton contrat de vide).

Sur `dequeueDog` / `dequeueCat`: poll uniquement cette file.

Pourquoi l'héritage? `dequeueAny` renvoie un chien ou un chat, donc les deux types partagent une base `Animal`. La comparaison d'ordre vit sur cette base pour que le préposé ne dépende pas de la classe concrète au-delà de "quelle salle".

---

## 4. Solution Java

```java
import java.util.LinkedList;

abstract class Animal {
    private int order;
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void setOrder(int order) {
        this.order = order;
    }

    public int getOrder() {
        return order;
    }

    /** True if this animal arrived before the other. */
    public boolean isOlderThan(Animal other) {
        return this.order < other.getOrder();
    }

    public String getName() {
        return name;
    }
}

class Dog extends Animal {
    public Dog(String name) {
        super(name);
    }
}

class Cat extends Animal {
    public Cat(String name) {
        super(name);
    }
}

class AnimalQueue {
    private LinkedList<Dog> dogs = new LinkedList<>();
    private LinkedList<Cat> cats = new LinkedList<>();
    private int order = 0; // arrival counter, not wall-clock time

    public void enqueue(Animal a) {
        a.setOrder(order);
        order++;

        if (a instanceof Dog) {
            dogs.addLast((Dog) a);
        } else if (a instanceof Cat) {
            cats.addLast((Cat) a);
        } else {
            throw new IllegalArgumentException("Only dogs and cats");
        }
    }

    public Animal dequeueAny() {
        if (dogs.isEmpty() && cats.isEmpty()) {
            return null;
        }
        if (dogs.isEmpty()) {
            return dequeueCat();
        }
        if (cats.isEmpty()) {
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
        return dogs.isEmpty() ? null : dogs.poll();
    }

    public Cat dequeueCat() {
        return cats.isEmpty() ? null : cats.poll();
    }
}
```

Déroulement:

| Étape | Action | tête dogs | tête cats | notes |
| --- | --- | --- | --- | --- |
| 1 | enqueue Dog("Rex") order 0 | Rex | - | |
| 2 | enqueue Cat("Mimi") order 1 | Rex | Mimi | |
| 3 | enqueue Dog("Buddy") order 2 | Rex | Mimi | Buddy derrière Rex |
| 4 | dequeueAny | Buddy | Mimi | Rex part (order 0 bat 1) |
| 5 | dequeueCat | Buddy | - | Mimi part; seul chat |
| 6 | dequeueAny | - | - | Buddy part |

Des orders égaux ne devraient pas arriver si tu n'assignes que via `enqueue`. Avec de vrais timestamps et une égalité, l'un ou l'autre convient selon l'énoncé.

Tu pourrais stocker l'order en millis d'horloge plutôt qu'en compteur int. Le compteur est plus simple en entretien: pas de décalage d'horloge, pas de débat du "même milliseconde", et la comparaison est un simple entier plus-petit-que.

---

## 5. Table de complexité

| Opération | Temps | Notes d'espace extra |
| --- | --- | --- |
| `enqueue` | O(1) | un tampon + addLast sur linked list |
| `dequeueDog` / `dequeueCat` | O(1) | poll du devant de cette file |
| `dequeueAny` | O(1) | deux peeks + un poll |
| Une file mixte + parcours par type | O(N) à l'adoption typée | structure plus simple, adoption typée plus chère |

L'espace est O(N) pour N animaux encore au refuge. Le champ order est O(1) par animal.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers testent surtout:

* **Refuge vide** sur n'importe quel dequeue → `null` (ou exception). Ne pas faire de peek sans vérifier.
* **Seulement des chiens** (ou seulement des chats) sur `dequeueAny` → prendre le côté non vide sans comparer.
* **Un chien, beaucoup de chats** → les dequeues typés ne volent pas la mauvaise file; l'order décide encore `dequeueAny`.
* **Sous-classe Animal inconnue** → refuse à l'enqueue si tu ne gères que chien et chat.
* **Noms en double** → le chien "Max" et le chat "Max" sont des objets distincts avec des orders distincts.

Erreurs fréquentes:

1. **Une liste et un parcours linéaire à chaque adoption typée.** Correct comme premier jet. Annonce le coût O(N) et passe à deux files.
2. **Oublier l'estampille order.** Tu ne peux plus comparer les têtes des deux files équitablement.
3. **Comparer des noms ou des hash au lieu de l'ordre d'arrivée.** L'ordre d'arrivée est la seule clé juste.
4. **Utiliser `remove` sur un index au hasard.** Toujours prendre le devant de la file du type.
5. **Muter l'order après l'enqueue.** Le ticket est fixé à l'arrivée.
6. **Défiler la mauvaise file quand les orders sont proches.** Si les deux côtés ont des animaux, toujours peek des deux; n'alterne pas chien/chat par habitude.

Usage minimal:

```java
AnimalQueue shelter = new AnimalQueue();
shelter.enqueue(new Dog("Rex"));
shelter.enqueue(new Cat("Mimi"));
Animal any = shelter.dequeueAny(); // Rex
Dog dog = shelter.dequeueDog();    // null if no dogs left
Cat cat = shelter.dequeueCat();    // Mimi if still present
```

---

## 7. Récap pour un ami

Animal Shelter, c'est une file avec filtre de type:

1. Chiens dans une file, chats dans une autre. Les deux restent FIFO.
2. Chaque arrivée reçoit un numéro d'order croissant.
3. `dequeueDog` / `dequeueCat` pollent uniquement cette file.
4. `dequeueAny` regarde les deux têtes et prend le plus petit order (plus ancien). Si un côté est vide, prends l'autre.
5. Chiens et chats partagent la base `Animal` pour que `dequeueAny` puisse renvoyer l'un ou l'autre.

Si tu dessines deux files, expliques le ticket et joues `dequeueAny` avec un animal en tête de chaque salle, tu maîtrises le 3.6. Le chapitre 3 se ferme sur une structure qui est surtout deux files et une comparaison.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Sort Stack](/blog/fr/ctci-3-5-sort-stack)
* Suivant: [Route Between Nodes](/blog/fr/ctci-4-1-route-between-nodes)