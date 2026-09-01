---
title: "Déclaration d'Objet: Allocation et Passage par Valeur Strict en Java (CTCI 13.6)"
description: "Distinguez la déclaration de l'instanciation en Java et démontrez la sémantique stricte du passage par valeur pour primitives et références d'objets."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-13-6-object-declaration.webp
previewImage: /assets/images/ctci-13-6-object-declaration.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Expliquez ce qu'est la déclaration d'un objet et la différence entre passage par valeur et passage par référence en Java.
> * **La Solution Optimale:** **Liaison de Référence sur la Pile et Passage par Valeur Strict** :
>   1. **Déclaration vs Instanciation** : `Personne p;` (Déclaration) réserve un emplacement de variable sur la pile initialisé à `null` sans aucun octet sur le tas ; `p = new Personne();` (Instanciation) alloue la mémoire sur le tas, exécute le constructeur et assigne la référence obtenue à `p`.
>   2. **Java est Strictement Passé par Valeur (100% du Temps)** :
>      * **Primitives** : La valeur binaire littérale est copiée directement dans le cadre de pile de la méthode appelée.
>      * **Références d'Objets** : L'*adresse mémoire* (la référence) est elle-même copiée par valeur.
>      * **Mutation vs Réaffectation** : Modifier l'état d'un objet via la référence transmise (`p.setNom("Bob")`) altère l'instance partagée sur le tas ; en revanche, réaffecter la référence (`p = new Personne("Ève")`) ne modifie que la variable locale sur la pile, laissant la variable de l'appelant intacte.
> * **Réalité en Production:** Analyse d'échappement du compilateur HotSpot C2 et objets valeurs du Projet Valhalla.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 13.6), l'énoncé est :

*"Distinguez la declaration d'un objet de son instanciation et expliquez le mecanisme strict de passage de parametres en Java."*

## 2. Organisation Mémoire : Pile vs Tas

* **Déclaration (`Personne p;`) :** Alloue un pointeur de 4 ou 8 octets sur la pile du thread avec la valeur `null`.
* **Instanciation (`new Personne()`) :** Alloue l'espace sur le tas et renvoie l'adresse mémoire correspondante.

## Démonstration Pratique du Passage par Valeur

```java
public class PassByValueProof {

    public static class Utilisateur {
        public String nom;
        public Utilisateur(String n) { this.nom = n; }
    }

    public static void tenterReaffectation(Utilisateur u) {
        u = new Utilisateur("Charles Réassigné"); // Modifie uniquement la copie locale
    }

    public static void muterEtat(Utilisateur u) {
        u.nom = "Bob Modifié"; // Altère l'objet partagé sur le tas
    }

    public static void tenterModifPrimitive(int val) {
        val = 999;
    }

    public static void main(String[] args) {
        Utilisateur utilisateur = new Utilisateur("Alice");

        tenterReaffectation(utilisateur);
        System.out.println("Après réaffectation: " + utilisateur.nom); // Reste "Alice"

        muterEtat(utilisateur);
        System.out.println("Après mutation: " + utilisateur.nom);       // Devient "Bob Modifié"

        int nombre = 42;
        tenterModifPrimitive(nombre);
        System.out.println("Primitive: " + nombre);                    // Reste 42
    }
}
```

## Comparatif Inter-Langages

| Langage | Mécanisme de Transmission | La fonction peut-elle réaffecter le pointeur appelant ? |
|---|---|---|
| **Java** | **Strictement par Valeur** | **Non** (Affecte uniquement la pile locale). |
| **C** | **Strictement par Valeur** | **Non** (Nécessite des pointeurs doubles `Type**`). |
| **C++** | **Par Valeur OU par Référence** (`Type&`) | **Oui** (Si syntaxe de référence `&` utilisée). |

## Ingénierie des Systèmes en Production

### Architecture Système : Analyse d'Échappement (Escape Analysis)

1. **Remplacement Scalaire (HotSpot C2) :** Si un objet n'échappe pas à la méthode englobante, le compilateur JIT démantèle l'objet directement dans les registres CPU de la pile, éliminant l'allocation sur le tas.
2. **Copie Défensive :** Les getters de classes possédant des structures mutables doivent renvoyer des copies isolées pour interdire la corruption externe via les références partagées.

## Cas Limites et Robustesse

1. **Paramètres `final` :** Marquer les arguments comme `final` (`void traiter(final User u)`) empêche toute réaffectation accidentelle de la variable locale dans le corps de la méthode.
