---
title: "The Egg Drop Problem: 100 etages, 2 oeufs, minimiser le pire cas (Java)"
description: "Probleme style CTCI 6.8 pour debutants: trouver l'etage critique avec deux oeufs et 100 etages en minimisant le nombre de chutes dans le pire cas. Utilise des intervalles decroissants pour egaliser chaque chemin et resous x(x+1)/2 >= 100."
date: "2026-03-29"
tags: [Algorithmes]
coverImage: /assets/images/ctci-6-8-the-egg-drop-problem.webp
previewImage: /assets/images/ctci-6-8-the-egg-drop-problem.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Probleme style CTCI 6.8 pour debutants: trouver l'etage critique avec deux oeufs et 100 etages en minimisant le nombre de chutes dans le pire cas. Utilise des intervalles decroissants pour egaliser chaque chemin et resous x(x+1)/2 >= 100.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un immeuble a **100 etages**. Tu as **deux oeufs**. Il existe un etage critique `F` tel qu'un oeuf lache depuis `F` ou plus haut se casse, et depuis tout etage sous `F` survit. Les oeufs qui survivent se reutilisent. Les casses sont perdus. Tu ne connais pas `F` (il peut aller de 1 a 100, ou meme "ne casse jamais", selon comment tu modelises le sommet). But: trouver `F` en **minimisant le nombre de chutes dans le pire cas**.

C'est un puzzle de strategie avec une forme fermee propre pour deux oeufs. L'astuce n'est pas la recherche binaire. Tu choisis les etages de chute pour que chaque chemin de resultat consomme le meme budget restant. Ce billet est un enseignement original pour debutants, avec du **Java** pour calculer le nombre optimal de chutes et le calendrier d'etages. Meme famille que les questions classiques d'egg drop en entretien, pas une copie de livre. Fait partie de la [serie CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 6, maths et logique, probleme 6.8.

---

## 1. Analogie du quotidien

Tu testes des coques de telephone en verre en les lachant dans un escalier. Deux echantillons. Une coque fendue, cet echantillon est mort. Il te faut encore la marche exacte la plus basse ou ca commence a casser.

Si tu montes une marche a la fois depuis le bas, tu ne gaspilles jamais une coque, mais le pire jour fait cent montees.

Si tu sautes a mi-hauteur, puis encore a mi-chemin, une casse tot te force a ramper chaque marche entre le dernier atterrissage sur et la casse, avec une seule coque. Ce ramper peut etre long. La recherche binaire brille quand les echantillons sont gratuits. Ici ils sont rares.

Tu planifies donc comme un coach avec un timeout fixe. "Je m'autorise au plus `x` chutes sur le pire chemin." Chaque premier saut laisse assez de marches en bas pour finir avec la seconde coque, et assez de sauts au-dessus si la coque survit. Les sauts raccourcissent a mesure que le timeout restant fond. C'est toute l'idee.

---

## 2. Enonce en mots simples

**Mise en place:**

* Immeuble de `n` etages (classique: `n = 100`).
* `k` oeufs (classique: `k = 2`).
* Etage critique `F`: casse depuis `F` et au-dessus, survit sous `F`.
* Une chute est une experience depuis un etage avec un oeuf.
* Les oeufs qui survivent peuvent etre laches a nouveau. Les casses non.
* Tu dois identifier `F` (ou prouver qu'il ne casse a aucun etage).

**But:** choisir une strategie qui **minimise le nombre de chutes dans le pire cas**. Pas le cas moyen. Pas "j'espere que l'oeuf ne casse pas."

**A clarifier en entretien:**

* L'etage 1 peut-il etre critique? (Oui. Parfois on modelise `F` de 0 a `n`, ou 0 signifie casse meme depuis 1, et `n+1` ne casse jamais.)
* "Trouver F" inclut-il le cas sans casse? (Dis ton modele. Couvrir 100 etages veut souvent dire distinguer le seuil parmi 100 possibilites dans l'enonce classique.)
* Optimises-tu le pire cas ou l'esperance sous `F` uniforme? (Pire cas pour ce probleme.)
* Combien d'oeufs? Reste a 2 sauf s'ils ouvrent le DP general.

**Formes de signature si tu codes des helpers:**

```java
// smallest max drops D such that 2 eggs can cover n floors
int minDropsTwoEggs(int floors);

// first-drop floors for a plan with D drops (1-based floor numbers)
int[] dropSchedule(int floors, int drops);
```

**Apercu numerique court (la reponse a avoir prete):**

Tu veux le plus petit `x` tel que:

```
x(x + 1) / 2 >= 100
```

```
13 * 14 / 2 = 91   < 100
14 * 15 / 2 = 105  >= 100
```

Donc le nombre minimal de chutes dans le pire cas pour 100 etages et 2 oeufs est **14**.

---

## 3. Reflechis d'abord

### Balayage lineaire avec un oeuf (ou apres la premiere casse)

Avec un oeuf, pas le choix: monte etage par etage depuis le dernier etage sur. Si tu sautes, une casse laisse un trou insoluble.

Pire cas du lineaire pur depuis l'etage 1: **100** chutes. Correct, ennuyeux, et ce a quoi tu reviens quand l'oeuf 1 casse.

### Pourquoi la recherche binaire simple n'est pas optimale

La recherche binaire coupe l'intervalle en deux. Avec des oeufs illimites, c'est bien. Avec deux:

* Premiere chute a l'etage 50. Si ca casse, l'oeuf 2 doit balayer 1..49 en lineaire. Pire chemin: `1 + 49 = 50`.
* Si ca survit, tu as encore deux oeufs au-dessus, mais chaque casse tot sur une coupe binaire plus tard laisse un grand segment lineaire.

Le pire cas sous des coupes style binaire tourne autour de **50**, bien mieux que 100, loin de l'optimum. Le probleme est le **cout asymetrique**: une casse te coute un oeuf et force le lineaire en bas; une survie ne coute qu'une chute. Des intervalles de meme taille ignorent ca.

### Egalise le pire cas restant

Choisis un budget `D`: "aucun chemin ne peut utiliser plus de `D` chutes."

Avec 2 oeufs et `D` chutes restantes, ta premiere chute doit partir d'un etage tel que:

1. **Si ca casse:** il te reste `D - 1` chutes et 1 oeuf. Tu peux verifier au plus `D - 1` etages en bas (lineaire). Donc tu peux placer la premiere chute a l'etage `(D - 1) + 1 = D`.
2. **Si ca survit:** il te reste `D - 1` chutes et 2 oeufs. Reprends la meme logique au-dessus de cet etage.

Les intervalles entre tentatives successives (tant que les deux oeufs restent) sont donc:

```
D, then D-1, then D-2, ..., then 1
```

Etages couverts avec budget `D`:

```
sum = D + (D - 1) + ... + 1 = D(D + 1) / 2
```

Trouve le plus petit `D` avec `D(D + 1) / 2 >= n`.

Pour `n = 100`:

| D | D(D+1)/2 | Assez? |
| --- | --- | --- |
| 12 | 78 | non |
| 13 | 91 | non |
| 14 | 105 | oui |
| 15 | 120 | oui, mais pire cas plus grand |

**Reponse: 14.**

### Exemple de calendrier (etages, base 1)

Avec `D = 14`, premiers etages de tentative tant que les deux oeufs vivent (cumul):

```
14,
14 + 13 = 27,
27 + 12 = 39,
39 + 11 = 50,
50 + 10 = 60,
60 + 9  = 69,
69 + 8  = 77,
77 + 7  = 84,
84 + 6  = 90,
90 + 5  = 95,
95 + 4  = 99,
99 + 3  = 102  (clamp to 100; you only need 100 floors)
```

Tu n'as besoin que de 100, et il existe 105 creneaux theoriques, donc les derniers intervalles peuvent retrecir ou s'arreter a 100. Le pire chemin ne depasse toujours pas 14 chutes.

### Chemin travaille

Supposons `F = 32` (casse a partir de 32).

1. Chute a 14: survit.
2. Chute a 27: survit.
3. Chute a 39: casse. Un oeuf restant. Dernier sur = 27.
4. Lineaire: 28, 29, 30, 31, 32 (casse a 32).

Chutes utilisees: tentatives a deux oeufs plus les pas lineaires de 28 a 32. Compte soigneusement au tableau; le point est que chaque branche etait dimensionnee pour ne jamais depasser 14.

### Generalisation (s'ils demandent)

Avec `k` oeufs et `D` chutes, la recurrence classique est:

```
floors(D, k) = 1 + floors(D - 1, k - 1)  // break
             + floors(D - 1, k)          // survive
```

Base: `floors(0, *) = 0`, `floors(*, 1) = D` (lineaire), `floors(D, 0) = 0`. Pour `k = 2` ca se replie sur les nombres triangulaires ci-dessus. L'entretien 6.8 veut la forme fermee a 2 oeufs; le DP est un bonus.

---

## 4. Solution Java (calculer les chutes optimales)

Le raisonnement resout le puzzle. Le code montre que tu peux calculer `D`, lister le calendrier, et eventuellement chercher `D` pour un `n` arbitraire.

### Plus petit D avec couverture triangulaire

```java
/** Sum 1+2+...+d. Careful with overflow for huge d. */
static long triangular(int d) {
    return (long) d * (d + 1) / 2;
}

/**
 * Minimal worst-case drops for 2 eggs and {@code floors} floors.
 * Smallest d with d*(d+1)/2 >= floors.
 */
static int minDropsTwoEggs(int floors) {
    if (floors <= 0) {
        return 0;
    }
    int d = 1;
    while (triangular(d) < floors) {
        d++;
        // optional guard for absurd inputs
        if (d > floors) {
            return floors; // linear is always enough
        }
    }
    return d;
}
```

Pour 100 etages cela renvoie **14**.

### Forme fermee (optionnelle, plus rapide)

Resous `d(d+1)/2 >= n` avec la formule quadratique:

```
d ≈ ceil( (-1 + sqrt(1 + 8n)) / 2 )
```

```java
static int minDropsTwoEggsClosed(int floors) {
    if (floors <= 0) {
        return 0;
    }
    // ceil( (-1 + sqrt(1+8n)) / 2 )
    double d = Math.ceil((-1.0 + Math.sqrt(1.0 + 8.0 * floors)) / 2.0);
    int ans = (int) d;
    // float safety: bump until coverage holds
    while (triangular(ans) < floors) {
        ans++;
    }
    while (ans > 1 && triangular(ans - 1) >= floors) {
        ans--;
    }
    return ans;
}
```

Au tableau, la boucle ou la table "essaie 13 puis 14" suffit. Mentionne la forme fermee si tu veux des points de style.

### Construire un calendrier de premieres chutes

```java
/**
 * Floors (1-based) where you attempt while both eggs remain,
 * for a plan with {@code drops} budget covering {@code floors}.
 * Stops at or before {@code floors}.
 */
static int[] dropSchedule(int floors, int drops) {
    if (floors <= 0 || drops <= 0) {
        return new int[0];
    }
    java.util.ArrayList<Integer> list = new java.util.ArrayList<>();
    int floor = 0;
    int step = drops;
    while (floor < floors && step >= 1) {
        floor = Math.min(floors, floor + step);
        list.add(floor);
        if (floor >= floors) {
            break;
        }
        step--;
    }
    int[] out = new int[list.size()];
    for (int i = 0; i < list.size(); i++) {
        out[i] = list.get(i);
    }
    return out;
}
```

### Verification rapide

```java
static void demo() {
    int n = 100;
    int d = minDropsTwoEggs(n);
    System.out.println("min worst-case drops = " + d); // 14
    System.out.println("coverage = " + triangular(d)); // 105

    System.out.println(minDropsTwoEggs(91));  // 13
    System.out.println(minDropsTwoEggs(92));  // 14
    System.out.println(minDropsTwoEggs(1));   // 1
    System.out.println(minDropsTwoEggs(0));   // 0

    int[] plan = dropSchedule(n, d);
    System.out.println(java.util.Arrays.toString(plan));
    // [14, 27, 39, 50, 60, 69, 77, 84, 90, 95, 99, 100] style sequence
}
```

### Extremes un oeuf et oeufs illimites (fil d'entretien)

```java
// 1 egg: must linear scan
static int minDropsOneEgg(int floors) {
    return Math.max(floors, 0);
}

// unlimited eggs: binary search worst case
static int minDropsUnlimitedEggs(int floors) {
    if (floors <= 0) {
        return 0;
    }
    return (int) Math.ceil(Math.log(floors + 1) / Math.log(2)); // rough model; state your floor numbering
}
```

Avec 2 oeufs tu es entre ces extremes: mieux que le lineaire, moins bien que le binaire pur, et les maths sont triangulaires.

---

## 5. Tableau de complexite

| Approche | Chutes pire cas (n=100, 2 oeufs) | Notes |
| --- | --- | --- |
| Lineaire depuis l'etage 1 | 100 | Optimal s'il n'y a qu'1 oeuf |
| Premiere coupe binaire, puis lineaire a la casse | ~50 | Ignore le cout asymetrique |
| Intervalles egaux de taille s | environ n/s + s | Reglable, souvent pire que des pas decroissants |
| Intervalles decroissants D, D-1, ... | **14** | Optimal pour 2 oeufs |
| DP general k oeufs | depend de k | Trop pour le 6.8 classique |

Temps pour **calculer** `D` avec le while: O(sqrt(n)) iterations car `D ~ O(sqrt(n))`. Forme fermee: arithmetique O(1) plus un petit correctif. Construire le calendrier: O(D).

La metrique d'entretien qui compte est **les chutes dans le pire cas**, pas le CPU du planificateur.

---

## 6. Cas limites et erreurs courantes

Les interviewers touchent a:

* **n = 1:** reponse 1. Un etage, une chute te dit casse ou non.
* **n = 0:** reponse 0.
* **Exactement triangulaire:** `n = 91` demande 13, pas 14. L'off-by-one sur l'inegalite est courant.
* **n = 100:** doit etre 14. Si quelqu'un dit 13, la couverture n'est que 91 etages.
* **Apres la casse du premier oeuf:** force le balayage lineaire. Sauter des etages avec un oeuf est un echec dur.
* **Optimiser le cas moyen** sous `F` uniforme: autre objectif. Ce probleme est le pire cas.
* **Modeliser F = 0 .. n vs 1 .. n:** dis combien de resultats distincts tu dois distinguer. L'argument triangulaire couvre "combien d'etages d'information" tu achetes avec le budget D.
* **Trois oeufs:** ils peuvent demander la recurrence. Ne pretend pas que la reponse reste 14 sans recalcul.

Erreurs courantes:

1. **Declarer la recherche binaire optimale** parce que "log 100 vaut environ 7." Ca suppose des oeufs gratuits.
2. **Utiliser un pas fixe 10** (chute a 10, 20, 30, ...): le pire cas est 10 + 9 = 19 quand ca casse a 10 et tu balayes 1..9 apres, ou similaire. Pire que 14.
3. **Resoudre x^2 = 100 → x = 10** et s'arreter. Il faut `x(x+1)/2`, pas `x^2`.
4. **Oublier que les intervalles retrecissent.** Un pas constant laisse les chemins tardifs moins chers que les casses tot; tu peux reequilibrer.
5. **Compter seulement les chutes du premier oeuf** et ignorer le segment lineaire du second dans le pire cas.
6. **Debordement entier** sur `d * (d + 1)` pour de grands n si tu utilises `int` a la legere. Utilise `long` pour le produit.

Fumee minimale:

```java
assert minDropsTwoEggs(100) == 14;
assert minDropsTwoEggs(91) == 13;
assert minDropsTwoEggs(92) == 14;
assert triangular(14) == 105;
assert minDropsTwoEggsClosed(100) == 14;
```

---

## 7. Recap a un ami

Deux oeufs, 100 etages, minimiser le pire jour.

1. Un oeuf restant: monte etage par etage. Ne saute jamais.
2. La recherche binaire gache le pire cas parce qu'une casse dans une grande moitie force un long ramper.
3. Fixe un budget de chutes `D`. Espace les tentatives pour que casse et survie finissent en `D` chutes au total.
4. Ca donne des ecarts `D, D-1, ..., 1`. La couverture est le nombre triangulaire `D(D+1)/2`.
5. Le plus petit `D` avec `D(D+1)/2 >= 100` est **14** (91 est trop court, 105 suffit).
6. En Java, monte `d` jusqu'a ce que le triangle couvre `n`, ou utilise la forme quadratique avec un ajustement de securite.

Si tu peux deriver "pourquoi 14" sur une serviette sans memoriser le chiffre, tu maitrises le probleme 6.8. Ensuite dans la serie: un puzzle de comptage pur avec des casiers.

---

## Serie

* Guide: [Guide de la serie CTCI](/blog/fr/ctci-series-guide)
* Precedent: [The Apocalypse](/blog/fr/ctci-6-7-the-apocalypse)
* Suivant: [100 Lockers](/blog/fr/ctci-6-9-100-lockers)