---
title: "CTCI 2.6 Palindrome en liste chaînée en Java: inverser la seconde moitié"
description: "Vérifier si une liste chaînée simple est un palindrome. Trouver le milieu avec lente et rapide, inverser la seconde moitié, comparer, restaurer si besoin. O(n) temps, O(1) espace."
date: "2026-04-01"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-2-6-palindrome.webp
previewImage: /assets/images/ctci-2-6-palindrome.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Vérifier si une liste chaînée simple est un palindrome. Trouver le milieu avec lente et rapide, inverser la seconde moitié, comparer, restaurer si besoin. O(n) temps, O(1) espace.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un **palindrome** se lit pareil dans les deux sens. Sur une chaîne, c'est simple: deux pointeurs aux extrémités, on marche vers le centre. Une **liste chaînée simple** ne marche que vers l'avant. Pas de `prev`, et l'accès aléatoire coûte un parcours complet. Donc la version entretien de "cette liste est-elle un palindrome?" vous force à inventer une structure qu'on ne vous offre pas.

C'est le problème **2.6** du style *Cracking the Coding Interview* (listes chaînées). Enseignement original, pas un collage de livre.

---

## Image du quotidien

Imaginez une rangée de post-its sur un long ruban: `1 → 2 → 3 → 2 → 1`. Vous voulez savoir si en pliant le ruban en deux chaque note s'alignerait avec son miroir.

Vous ne pouvez pas retourner tout le ruban sans perdre l'ordre de la première moitié. Geste pratique:

1. Trouver le pli (le milieu de la liste).
2. Retourner seulement la seconde moitié pour qu'elle pointe vers le milieu.
3. Parcourir les deux moitiés depuis la tête et depuis le nouveau début de la moitié retournée. Chaque paire de valeurs doit correspondre.
4. Si la liste doit ressembler à l'état d'origine, retourner encore la seconde moitié pour la restaurer.

Tout le plan: **trouver le milieu, inverser la seconde moitié, comparer, restaurer au besoin**.

---

## Problème en mots simples

**Entrée:** tête d'une liste chaînée simple de nœuds à valeurs entières (ou toute donnée comparable).

**Sortie:** `true` si la suite de valeurs est un palindrome; sinon `false`.

**Exemples**

| Liste | Réponse | Pourquoi |
| --- | --- | --- |
| `1 → 2 → 2 → 1` | `true` | Longueur paire; les deux moitiés collent |
| `1 → 2 → 3 → 2 → 1` | `true` | Longueur impaire; le centre `3` est seul |
| `1 → 2 → 3` | `false` | Les extrémités ne collent pas |
| `7` | `true` | Un seul nœud |
| vide / `null` | `true` (choix pédagogique habituel) | La suite vide est un palindrome |

**À clarifier en entretien**

* Peut-on muter la liste temporairement? (Cette solution le fait, puis restaure.)
* Null et vide: `true` ou exception?
* Valeurs: chiffres seuls, ou entiers généraux?

Vous renvoyez un booléen. On ne vous demande pas d'imprimer le reverse ni de reconstruire une nouvelle liste comme réponse finale.

---

## Comment réfléchir avant de coder

### Pile ou copie (correct, pas la vedette)

Empilez chaque valeur, ou copiez dans un tableau, puis comparez en un second passage depuis la tête. Temps O(n), espace extra O(n). Mentionnez-le. On demande souvent un meilleur espace ensuite.

La comparaison récursive marche aussi et reste élégante, mais la pile d'appels reste O(n) sur une longue liste. Même classe d'espace que la pile explicite.

### Approche principale: inverser la seconde moitié (O(1) espace extra)

1. **Trouver le milieu** avec deux pointeurs: `slow` avance d'un nœud, `fast` de deux. Quand `fast` ne peut plus faire deux pas, `slow` est sur le dernier nœud de la première moitié (longueur paire) ou sur le centre (longueur impaire).
2. **Inverser** la liste qui commence à `slow.next`. Reverse classique à trois pointeurs: `prev`, `curr`, `next`.
3. **Comparer** depuis `head` et depuis la seconde moitié inversée, nœud par nœud, jusqu'à la fin de la seconde moitié. En longueur impaire, le centre n'est jamais comparé à une paire, ce qui est correct.
4. **Restaurer** (optionnel mais propre): inverser encore la seconde moitié et la rattacher à `slow.next` pour que l'appelant voie l'ordre d'origine.

Pourquoi cela suffit: un palindrome se définit par des paires qui collent autour du centre. Après inversion de la moitié arrière, ces paires sont alignées sur deux parcours vers l'avant.

---

## Solution Java: milieu, reverse, compare, restore

```java
public class LinkedListPalindrome {

    public static class ListNode {
        int val;
        ListNode next;

        ListNode(int val) {
            this.val = val;
        }
    }

    /**
     * Returns true if the list values form a palindrome.
     * Temporarily reverses the second half, then restores it.
     */
    public static boolean isPalindrome(ListNode head) {
        if (head == null || head.next == null) {
            return true;
        }

        // 1. Middle: slow ends at end of first half (even) or at center (odd)
        ListNode slow = head;
        ListNode fast = head;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }

        // 2. Reverse second half
        ListNode secondHalf = reverse(slow.next);

        // 3. Compare first half with reversed second half
        ListNode p1 = head;
        ListNode p2 = secondHalf;
        boolean ok = true;
        while (p2 != null) {
            if (p1.val != p2.val) {
                ok = false;
                break;
            }
            p1 = p1.next;
            p2 = p2.next;
        }

        // 4. Restore list
        slow.next = reverse(secondHalf);
        return ok;
    }

    private static ListNode reverse(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome(list(1, 2, 2, 1)));       // true
        System.out.println(isPalindrome(list(1, 2, 3, 2, 1)));    // true
        System.out.println(isPalindrome(list(1, 2, 3)));          // false
        System.out.println(isPalindrome(list(7)));                // true
        System.out.println(isPalindrome(null));                   // true
    }

    private static ListNode list(int... vals) {
        ListNode dummy = new ListNode(0);
        ListNode t = dummy;
        for (int v : vals) {
            t.next = new ListNode(v);
            t = t.next;
        }
        return dummy.next;
    }
}
```

### Parcours: `1 → 2 → 3 → 2 → 1`

| Étape | Ce qui se passe |
| --- | --- |
| Milieu | `slow` arrive sur `3` (centre). `fast` ne peut plus faire deux pas. |
| Inverse | La seconde moitié `2 → 1` devient `1 → 2`. Forme: première moitié encore `1 → 2 → 3`, puis queue inversée. |
| Compare | `1` vs `1`, `2` vs `2`. Fin de la seconde moitié. Ça colle. |
| Restore | Inverse `1 → 2` en `2 → 1` et le raccroche après `3`. Liste d'origine. |

### Parcours: `1 → 2 → 2 → 1` (paire)

| Étape | Ce qui se passe |
| --- | --- |
| Milieu | La condition s'arrête avec `slow` sur le premier `2` (fin de la première moitié). |
| Inverse | La seconde moitié `2 → 1` devient `1 → 2`. |
| Compare | `1` vs `1`, `2` vs `2`. Ça colle. |
| Restore | Remettre la seconde moitié. |

Longueur impaire: le centre est sauté à la comparaison. Longueur paire: deux moitiés de même taille. Le même chemin de code gère les deux.

---

## Temps et espace

| Approche | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| Inverser seconde moitié | O(n) | O(1) | Réponse principale; mute puis restaure |
| Pile de valeurs | O(n) | O(n) | Simple; bon premier jet |
| Copie en tableau + deux pointeurs | O(n) | O(n) | Même idée que la pile |
| Récursion (pile implicite) | O(n) | O(n) frames d'appel | Code propre, pas d'espace constant |

Trouver le milieu: un passage. Inverse: proportionnel à la moitié. Compare: encore une demi-passe. Restore: un autre reverse. Globalement linéaire, seulement des pointeurs extra constants.

---

## Cas limites que l'on pousse en entretien

* **Longueur impaire:** le nœud central n'a pas de paire. Ne le comparez à rien. La logique du milieu le laisse dans la première moitié et démarre le reverse à `slow.next`.
* **Longueur paire:** deux moitiés égales. Même boucle; pas de centre orphelin.
* **Un seul nœud:** retour anticipé `true`.
* **Deux nœuds:** `1 → 1` est true; `1 → 2` est false. Le milieu met `slow` sur le premier; on inverse et on compare une paire.
* **Tête null:** traiter comme `true` (ou définir et s'y tenir).
* **Ne pas muter de façon permanente:** restaurer après la comparaison. Si toute mutation est interdite, pile/copie et le dire.
* **Structure partagée / lecteurs concurrents:** muter même un instant n'est pas sûr. Dites-le si la liste est partagée.

La moitié des bugs ici: un off-by-one sur le milieu (démarrer le reverse un nœud trop tôt ou trop tard) et oublier de restaurer quand l'énoncé exige la liste d'origine.

---

## Erreurs fréquentes

1. **Penser comme pour un string à deux pointeurs** sans moyen d'aller en arrière sur une liste simple.
2. **Mauvais milieu:** inverser depuis le centre en longueur paire et comparer des longueurs décalées.
3. **Oublier le restore** après un reverse destructif.
4. **Comparer au-delà de la seconde moitié** ou traiter le centre comme s'il avait un jumeau.
5. **Affirmer O(1) d'espace** avec de la récursion sans reconnaître la pile d'appels.

---

## Explique à un ami

On vous donne une chaîne de valeurs à sens unique. Peut-elle se lire pareil dans les deux sens?

Pliez au milieu. Retournez seulement la moitié arrière pour qu'elle pointe l'autre sens. Marchez depuis l'avant et depuis la moitié retournée: chaque paire doit coller. Retournez encore la moitié arrière si vous devez restaurer la chaîne.

En Java: lente/rapide pour le milieu, inversez la seconde moitié, comparez, reverse encore pour nettoyer. C'est O(n) en temps et O(1) en espace extra. Une pile marche aussi si la mémoire extra est acceptable.

Précédent dans la série: [Sum Lists](/blog/fr/ctci-2-5-sum-lists). Suivant: [Intersection](/blog/fr/ctci-2-7-intersection). Carte de la série: [CTCI en Java](/blog/fr/ctci-series-guide).