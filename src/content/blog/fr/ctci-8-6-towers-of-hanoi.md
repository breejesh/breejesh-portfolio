---
title: "Tours de Hanoï: Déplacer n disques avec trois piquets (Java)"
description: "Problème 8.6 style CTCI pour débutants: Tours de Hanoï classiques avec trois piquets et n disques. Déplacement récursif de la tour du dessus, stacks Java pour chaque piquet."
date: "2025-08-02"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
previewImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème 8.6 style CTCI pour débutants: Tours de Hanoï classiques avec trois piquets et n disques. Déplacement récursif de la tour du dessus, stacks Java pour chaque piquet.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Tu as trois tiges et une pile de disques. Les disques démarrent sur la première tige, le plus grand en bas, le plus petit en haut. Tu dois déplacer toute la pile vers la dernière tige. Un seul disque bouge à la fois. Tu ne peux jamais poser un disque plus grand sur un plus petit. La tige du milieu est ton seul parking. Ce puzzle, ce sont les **Tours de Hanoï**, et la solution d'entretien propre est la récursion plus une stack par piquet.

Ce billet est un enseignement original pour débutants absolus en **Java**. Même famille de problèmes que les questions récursives classiques de Hanoï, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 8, récursion et programmation dynamique. Problème 8.6.

---

## 1. Analogie du quotidien

Imagine trois poteaux dans un parc et un tas d'anneaux emboîtés:

* **Piquet source:** là où la tour complète commence.
* **Piquet destination:** là où la tour complète doit finir.
* **Piquet tampon:** parking temporaire pour ne jamais casser la règle "plus grand sous plus petit".

Pour déplacer une tour de cinq anneaux, tu n'inventes pas cinq règles spéciales. Tu dégages les quatre du dessus du plus grand anneau (en les garent sur le tampon, en utilisant la destination comme *leur* tampon), tu glisses le grand anneau vers la destination, puis tu déplaces la tour de quatre par-dessus. La même idée marche pour quatre, trois, deux et un.

La récursion, c'est cette habitude "même idée, pile plus petite" transformée en code.

---

## 2. Énoncé en mots simples

**Mise en place:**

* Trois piquets: souvent A (source), B (tampon), C (destination).
* `n` disques de tailles distinctes. Le disque `1` est le plus petit, le disque `n` le plus grand (ou l'inverse; choisis et tiens-toi-y).
* Départ: tous les disques sur la source, du plus grand en bas au plus petit en haut.
* But: tous les disques sur la destination, dans un ordre légal.

**Règles:**

1. Ne déplace qu'un disque à la fois.
2. Un coup prend le disque du dessus d'un piquet et le pose sur un autre.
3. Ne pose jamais un disque plus grand sur un plus petit.

**Sortie:** une séquence de coups légaux qui résout le puzzle, ou un programme qui exécute ces coups sur des piquets adossés à des stacks.

**Exemples (n = 1, 2, 3):**

| n | Coups minimum | Idée |
| --- | --- | --- |
| 1 | 1 | Source → destination |
| 2 | 3 | Petit vers tampon, grand vers dest, petit vers dest |
| 3 | 7 | Déplace 2 vers tampon, grand vers dest, déplace 2 vers dest |
| n | 2^n - 1 | Récurrence T(n) = 2 T(n-1) + 1 |

**Clarifie avant de coder:**

* Chaque piquet comme `Stack` de tailles? (Oui. Le sommet est le disque déplaçable.)
* Étiquettes: plus grand int = plus grand disque, ou l'inverse? Ici: **int plus grand = disque plus grand**.
* Imprimer les coups, ou muter les stacks? Préfère les deux: un `moveDisks` qui mute et un log optionnel.
* Coups illégaux? Lève ou assert si un plus grand tomberait sur un plus petit.

---

## 3. Réfléchis d'abord (déplacement récursif)

### Cas de base

Pour déplacer **1** disque de source vers destination: pop de la source, push sur la destination. Fini.

### Cas récursif

Pour déplacer **n** disques de source vers destination en utilisant le tampon:

1. Déplace `n - 1` disques de **source → tampon**, en utilisant **destination** comme piquet temporaire.
2. Déplace le disque restant (le plus grand de ce sous-problème) de **source → destination**.
3. Déplace `n - 1` disques de **tampon → destination**, en utilisant **source** comme piquet temporaire.

Les rôles des trois piquets s'échangent à chaque appel récursif. Cet échange de rôles est toute l'astuce. Tu ne codes pas en dur "toujours garer sur B".

### Pourquoi la règle de taille tient

Par induction: une tour légale de `n - 1` peut se déplacer comme une unité. Après l'étape 1, le plus grand disque de ce sous-problème reste seul sur la source (ou sous des disques plus grands hors de cet appel). L'étape 2 le place sur un piquet dont le sommet est vide ou plus grand que lui (les plus petits sont tous sur le tampon). L'étape 3 reconstruit la petite tour par-dessus.

### Parcours: n = 3, A → C via B

Disques: `3` (bas), `2`, `1` (haut) sur A.

| Étape | Action | A (bas → haut) | B | C |
| --- | --- | --- | --- | --- |
| départ | | 3, 2, 1 | vide | vide |
| 1 | déplace 2: A → B via C | 3 | 2, 1 | vide |
| 2 | déplace disque 3: A → C | vide | 2, 1 | 3 |
| 3 | déplace 2: B → C via A | vide | vide | 3, 2, 1 |

En développant "déplace 2: A → B via C":

1. Déplace 1: A → C
2. Déplace 2: A → B
3. Déplace 1: C → B

Total de coups pour n = 3: 7. Le motif tient pour tout n.

### Ce qu'il ne faut pas faire

* Des boucles imbriquées qui ne marchent que pour n = 3. On veut la structure récursive générale.
* Des tableaux sans discipline de pile si le problème demande des piquets en stacks.
* Déplacer toute une sous-tour en un "truc" non récursif sans montrer le plan en trois étapes.

---

## 4. Solution Java

Modélise chaque piquet comme une petite classe autour d'un `Stack<Integer>`. Les valeurs de disque croissent avec la taille: le sommet doit être plus petit que ce que tu pousses, ou le piquet est vide.

```java
import java.util.Stack;

/**
 * One peg in Towers of Hanoi. Top of stack is the movable disk.
 * Larger int means larger disk.
 */
class Tower {
    private final Stack<Integer> disks = new Stack<Integer>();
    private final int index; // 0, 1, or 2 for logging

    Tower(int index) {
        this.index = index;
    }

    int index() {
        return index;
    }

    void add(int disk) {
        if (!disks.isEmpty() && disks.peek() <= disk) {
            throw new IllegalStateException(
                "Cannot place disk " + disk + " on " + disks.peek());
        }
        disks.push(disk);
    }

    void moveTopTo(Tower destination) {
        int top = disks.pop();
        destination.add(top);
        System.out.println(
            "Move disk " + top + " from " + index + " to " + destination.index());
    }

    /**
     * Move the top n disks from this tower to destination,
     * using buffer as temporary storage.
     */
    void moveDisks(int n, Tower destination, Tower buffer) {
        if (n <= 0) {
            return;
        }
        if (n == 1) {
            moveTopTo(destination);
            return;
        }
        // n-1 off this peg onto buffer (destination is their buffer)
        moveDisks(n - 1, buffer, destination);
        // largest of this subproblem to destination
        moveTopTo(destination);
        // n-1 from buffer onto destination (this peg is their buffer)
        buffer.moveDisks(n - 1, destination, this);
    }
}
```

Driver qui construit trois piquets et résout pour `n`:

```java
void solveHanoi(int n) {
    Tower[] towers = new Tower[3];
    for (int i = 0; i < 3; i++) {
        towers[i] = new Tower(i);
    }

    // Source = towers[0]. Load largest first so it sits at the bottom.
    for (int disk = n; disk >= 1; disk--) {
        towers[0].add(disk);
    }

    towers[0].moveDisks(n, towers[2], towers[1]);
    // towers[2] now holds  n, n-1, ..., 1  (bottom → top)
}
```

Vérification minimale pour n = 2 (trois coups imprimés):

```java
// solveHanoi(2) prints something like:
// Move disk 1 from 0 to 1
// Move disk 2 from 0 to 2
// Move disk 1 from 1 to 2
```

Si tu préfères des fonctions libres plutôt que des méthodes sur `Tower`, garde les trois mêmes étapes et passe source, destination et tampon en arguments. La forme de la récursion ne change pas.

---

## 5. Tableau de complexité

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Récursion classique | O(2^n) coups | O(n) pile d'appels | Exactement 2^n - 1 coups; chaque coup est O(1) sur la stack |
| Itératif avec pile explicite | O(2^n) coups | O(n) | Même borne; simule la récursion |
| Forme fermée seule | O(1) pour compter | O(1) | Le compte est 2^n - 1; encore O(2^n) si tu émets les coups |

Tu ne peux pas battre 2^n - 1 coups légaux avec les règles classiques à trois piquets. Le coût exponentiel est le problème, pas un bug de ton code. L'espace extra de la solution récursive est la profondeur d'appels O(n), plus O(n) de stockage des disques sur les piquets.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers testent ça:

* **n = 0** → aucun coup. Garde avec `n <= 0`.
* **n = 1** → un seul `moveTopTo`. Le cas de base doit marcher seul.
* **n = 2, n = 3** → parcours à la main; le compte doit être 3 et 7.
* **Mauvais rôle de tampon** → échanger destination et tampon dans les appels corrompt la tour.
* **Charger les disques du plus petit d'abord** → le plus grand finit en haut; `add` lève ou le puzzle démarre illégal.
* **Comparer les tailles à l'envers** → si tu inverses "int plus grand = disque plus grand", inverse aussi le contrôle de sécurité.

Erreurs fréquentes:

1. **Ne coder que le coup du milieu.** Oublier les deux appels récursifs `n - 1` laisse des disques bloqués.
2. **Coder en dur les indices de piquet** dans la méthode récursive au lieu de passer les rôles. Ça casse quand les rôles tournent.
3. **Autoriser des stacks illégales.** Sans le contrôle dans `add`, les bugs restent silencieux jusqu'au layout final faux.
4. **Off-by-one sur n.** Déplacer `n` disques alors qu'il n'en reste que `n - 1` sur la source après un mauvais appel.
5. **Croire que le mémo DP aide.** Chaque sous-problème doit vraiment déplacer des disques; il n'y a pas de chevauchement "économie de travail" comme en comptage de chemins. La structure récursive compte plus que des tables mémo ici.

Entrée robuste:

```java
void solveHanoiSafe(int n) {
    if (n < 0) {
        throw new IllegalArgumentException("n must be >= 0");
    }
    solveHanoi(n);
}
```

---

## 7. Recap à raconter à un ami

Les Tours de Hanoï demandent: déplace n disques du piquet A vers le piquet C en utilisant le piquet B, sans jamais poser un disque plus grand sur un plus petit.

1. Représente chaque piquet comme une stack. Le sommet est le seul disque que tu peux bouger.
2. Base: déplace un disque source → destination.
3. Général: déplace n-1 source → tampon (dest en temp), déplace un source → dest, déplace n-1 tampon → dest (source en temp).
4. Coups totaux: 2^n - 1. Temps O(2^n), profondeur de récursion O(n).
5. Enforce les règles de taille à chaque push pour que les états illégaux échouent vite.

Si tu peux dire le plan en trois étapes, charger les disques du plus grand d'abord, et ne pas mélanger le rôle du tampon, tu maîtrises le problème 8.6.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Recursive Multiply](/blog/fr/ctci-8-5-recursive-multiply)
* Suivant: [Permutations without Dups](/blog/fr/ctci-8-7-permutations-without-dups)