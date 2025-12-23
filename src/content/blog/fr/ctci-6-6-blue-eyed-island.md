---
title: "Île aux yeux bleus: connaissance commune et induction pour débutants"
description: "Problème style CTCI 6.6: n insulaires aux yeux bleus partent la nuit n après que le gourou dise je vois quelqu'un aux yeux bleus. Cas de base, étape inductive et connaissance commune sans jargon opaque."
date: "2025-12-23"
tags: [Algorithmes]
coverImage: /assets/images/ctci-6-6-blue-eyed-island.webp
previewImage: /assets/images/ctci-6-6-blue-eyed-island.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 6.6: n insulaires aux yeux bleus partent la nuit n après que le gourou dise je vois quelqu'un aux yeux bleus. Cas de base, étape inductive et connaissance commune sans jargon opaque.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un ferry part chaque nuit à minuit. Quiconque a **déduit la couleur de ses propres yeux** doit embarquer et partir pour toujours. Les insulaires sont des logiciens parfaits. Ils voient les yeux de tout le monde. Pas de miroirs, pas de photos, pas de "tes yeux sont bleus". Pendant des années, la vie est calme. Puis un visiteur dit en public: **"Je vois quelqu'un aux yeux bleus."**

Rien ne semble changer la première nuit. Ni la deuxième. Ensuite, s'il y avait `n` personnes aux yeux bleus, **les `n` partent ensemble la nuit `n`**.

Ce billet est un enseignement original pour débutants. Même famille que les classiques yeux bleus / enfants boueux, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 6, maths et logique, problème 6.6. Le produit, c'est le raisonnement. Le Java optionnel ne fait que modeler le compteur de nuits pour un petit `n`.

---

## 1. Analogie du quotidien

Imagine une classe où chaque élève a un autocollant bleu ou marron sur le front. Personne ne voit le sien. Tout le monde voit ceux des autres. La règle: si tu déduis que le tien est bleu, tu te lèves et tu pars en fin de journée.

Longtemps, le professeur ne parle pas d'autocollants. Les bleus voient déjà d'autres bleus (s'il y en a). Les marrons voient les bleus. Rien n'oblige personne à partir.

Puis le professeur dit à voix haute, de sorte que tout le monde entend et voit que tout le monde a entendu:

> "Je vois au moins un autocollant bleu."

La phrase semble vide si tu voyais déjà un bleu. La force n'est pas une nouvelle donnée pixel sur la salle. La force est la **certitude partagée**: maintenant chaque élève sait que chaque élève sait qu'il y a au moins un autocollant bleu, et ainsi de suite dans la chaîne. On appelle cela la **connaissance commune**. Avec seulement l'observation privée, la pile infinie de "je sais que tu sais que je sais..." était incomplète pour ceux qui en avaient besoin.

Le reste de l'énigme est l'**induction**: prouve l'affirmation pour 1 autocollant bleu, puis montre que si elle tient pour `k` bleus, elle tient pour `k + 1`.

---

## 2. Énoncé en mots simples

**Mise en place (forme standard):**

* Les insulaires ont des yeux bleus ou marrons (seulement ces deux dans l'histoire).
* Il y a `n` personnes aux yeux bleus et un nombre positif de marrons (les marrons sont "les autres"; dans la résolution classique ils ne partent pas).
* Chacun voit les yeux de tous les autres. Personne ne voit les siens.
* Pas de communication sur la couleur des yeux. Mémoire parfaite. Logique parfaite. Ils font confiance au fait que les autres sont aussi des logiciens parfaits.
* Un ferry part chaque nuit à minuit. Si tu déduis que tes yeux sont bleus, tu pars cette nuit-là.
* Avant le visiteur, tout le monde a vécu sous ces règles longtemps et **personne n'est parti**.

**L'annonce publique (jour 0, en journée):**

Un gourou / visiteur annonce au groupe entier:

> "Je peux voir quelqu'un qui a les yeux bleus."

**Question:** que se passe-t-il, et quand?

**Réponse à viser:**

* Si `n = 1`, cette unique personne aux yeux bleus part la **nuit 1**.
* Si `n = 2`, les deux partent la **nuit 2**.
* En général, les `n` personnes aux yeux bleus partent la **nuit `n`**.
* Les marrons restent.

**Clarifie avant de "résoudre":**

* L'annonce est-elle publique et connue pour avoir été entendue par tous? (Oui. C'est central.)
* Part-on seulement en étant sûr d'avoir les yeux **bleus**, ou pour n'importe quelle couleur? (Forme classique CTCI: tu pars quand tu sais que tu as les yeux bleus. Les marrons ne tirent pas cette déduction de cette seule annonce.)
* Zéro yeux bleus est-il possible avant le gourou dans les modèles mentaux? (Oui. Le gourou tue la branche "peut-être zéro" dans la vue publique.)
* Ferry simultané: oui. Tous ceux qui savent partent la même nuit.

---

## 3. Réfléchis d'abord: l'induction sans le brouillard

### Ce que l'induction veut dire ici (version débutant)

Tu veux une affirmation `P(n)`:

> S'il y a exactement `n` personnes aux yeux bleus, et que le gourou a parlé, alors les `n` partent la nuit `n`.

**Cas de base:** prouve `P(1)`.

**Étape inductive:** suppose que `P(k)` est vrai pour un `k >= 1` fixé. Prouve `P(k + 1)`.

Alors `P(n)` tient pour tout entier positif `n`.

Tu n'"espères" pas que le motif continue. Tu enchaînes une garantie: 1 marche, et chaque taille hérite de la taille juste en dessous.

### Ce que voit chaque personne aux yeux bleus

La personne `B` aux yeux bleus (elle ne le sait pas encore) regarde autour:

* Elle voit **`n - 1`** autres personnes aux yeux bleus.
* Elle voit des personnes aux yeux marrons.

Donc du point de vue privé de `B`, le monde peut avoir `n - 1` bleus (si `B` est marron) ou `n` bleus (si `B` est bleu). L'induction porte sur la façon dont ces deux mondes divergent nuit après nuit après la parole du gourou.

### Pourquoi la phrase du gourou compte (connaissance commune)

Avant le gourou:

* Si `n >= 1`, chaque personne aux yeux marrons voit déjà au moins un bleu.
* Si `n >= 2`, chaque personne aux yeux bleus voit déjà au moins un bleu.

Donc pour la plupart, "il existe une personne aux yeux bleus" est une **vieille nouvelle** comme fait brut. Ce qui manquait, c'est un **coup de départ public et synchronisé** qui place ce fait en connaissance commune:

1. Tout le monde sait qu'il y a au moins un bleu.
2. Tout le monde sait que tout le monde sait qu'il y a au moins un bleu.
3. Tout le monde sait que tout le monde sait que tout le monde sait... et ainsi de suite.

Sans cette pile, l'horloge d'induction ne démarre pas. Avec elle, les gens peuvent emboîter des attentes: "Si je ne suis pas bleu, les personnes que je vois se comporteront comme une île de taille `(n-1)` après une annonce de connaissance commune."

---

## 4. Solution: cas de base, puis on monte

### Cas de base: `n = 1`

Appelle **A** la seule personne aux yeux bleus.

* A regarde et voit **zéro** yeux bleus.
* Avant le gourou, A pouvait penser: "Peut-être qu'il n'y a aucun œil bleu; peut-être que je suis marron."
* Le gourou dit: "Je vois quelqu'un aux yeux bleus."
* A est la seule personne qui voit zéro bleu. Ce quelqu'un doit être A.
* A déduit "j'ai les yeux bleus" le jour 0 après le discours, et part la **nuit 1**.

Les autres voient déjà les yeux bleus de A. Ils s'attendaient à ce qu'A parte si A est le seul bleu. Quand A part la nuit 1, le monde colle. Les marrons n'apprennent toujours pas qu'ils sont marrons d'une façon qui force une sortie bleue; ils ne sont pas bleus.

`P(1)` tient.

### Deux personnes: `n = 2` (l'étape qu'on sent)

Appelle-les **A** et **B**, toutes deux bleues. Le gourou parle le jour 0.

Ce que voit A: exactement un bleu (B). Donc A pense:

> Soit je suis marron et il y a 1 bleu (B), soit je suis bleu et il y a 2 bleus.

Si A est marron, alors du point de vue de B l'île est un monde bleu de **taille 1**. Par le cas de base, B devrait partir la **nuit 1**.

La nuit 1 arrive. B est encore là. (B déroule l'argument symétrique sur A.)

A sait maintenant que le monde "je suis marron, seul B est bleu" est mort. Donc A a les yeux bleus. Pareil pour B.

Les deux partent la **nuit 2**.

Le coup clé n'est pas la télépathie. C'est l'**attente déçue**:

> J'attendais que la personne que je vois parte la nuit 1 si je ne suis pas bleu. Elle n'est pas partie. Donc je suis bleu.

### Trois personnes: `n = 3`

A, B, C toutes bleues. Chacune voit **deux** bleus.

Modèle privé de A:

* Si je suis marron, alors B et C vivent dans un monde de taille 2 avec connaissance commune du gourou.
* Par le cas `n = 2`, B et C devraient toutes deux partir la **nuit 2**.

Nuit 1: personne ne part (comme prévu même dans le sous-monde de taille 2, car la taille 2 part la nuit 2).
Nuit 2: toujours personne.

L'hypothèse "je suis marron" de A meurt. A déduit bleu. Pareil pour B et C. Les trois partent la **nuit 3**.

### Étape inductive: suppose `P(k)`, prouve `P(k + 1)`

Suppose: dès qu'il y a exactement `k` bleus et que le gourou a parlé, ils partent tous la nuit `k`.

Maintenant le vrai monde a `k + 1` bleus. Prends n'importe quelle personne aux yeux bleus `X`.

* `X` voit exactement `k` bleus.
* `X` se dit: "Si je suis marron, ces `k` personnes forment une instance de taille `k` avec connaissance commune. Par l'hypothèse inductive elles partent la nuit `k`."
* Les nuits `1` à `k` passent. Les `k` personnes que `X` voit sont encore sur l'île (chacune attend la même horloge d'attente déçue).
* Donc la branche "je suis marron" de `X` est fausse. `X` a les yeux bleus.
* Chaque personne aux yeux bleus fait le même raisonnement. Les `k + 1` partent la nuit `k + 1`.

C'est `P(k + 1)`. L'induction se ferme. Pour tout `n`, les `n` bleus partent la nuit `n`.

### Et les personnes aux yeux marrons?

Une personne aux yeux marrons `Y` voit les `n` bleus. Après le gourou, `Y` s'attend à ce que ces `n` partent la nuit `n` (par le théorème). Quand c'est le cas, le monde colle à "il y a `n` bleus et je n'en suis pas" au sens faible, mais la règle du ferry dans cette énigme, c'est de découvrir **que tu as les yeux bleus**. Les marrons n'ont jamais une nuit où la seule façon d'expliquer un départ manquant est "je dois être bleu." Leur couleur est cohérente avec tout ce qu'ils voient. Ils restent.

### Pourquoi des années d'attente n'ont rien fait, puis le gourou a tout changé

Avant le gourou, il n'y avait pas d'ancre publique au jour 0 ni de chaîne de connaissance commune "au moins un bleu." Chacun pouvait inventer une île plus petite dans sa tête sans horloge partagée. Le visiteur ne donne pas de miroir. Le visiteur démarre l'horloge d'induction que tout le monde voit tout le monde faire tourner.

---

## 5. Tableau nuit par nuit et petite simulation optionnelle

### Tableau nuit par nuit

| Vrais bleus `n` | Ce que voit chaque bleu | Première nuit où il attendait le départ des autres si "je suis marron" | Nuit réelle de départ |
| --- | --- | --- | --- |
| 1 | 0 | (aucun autre bleu; le gourou force le soi) | Nuit 1 |
| 2 | 1 | Nuit 1 | Nuit 2 |
| 3 | 2 | Nuit 2 | Nuit 3 |
| `n` | `n - 1` | Nuit `n - 1` | Nuit `n` |

Motif à dire à voix haute:

> Chaque personne aux yeux bleus attend que le groupe qu'elle voit parte la nuit égale au compte qu'elle voit. Quand cette nuit échoue, elle monte dans le ferry suivant.

### Java optionnel: compteur de nuits pour petit `n`

Tu ne peux pas "simuler toute la logique épistémique" en vingt lignes. Tu peux quand même coder la **forme fermée** que prouve l'induction, et une petite boucle qui imprime l'histoire pour `n = 1..5`.

```java
/** Night when all n blue-eyed people leave after a day-0 common-knowledge announcement. */
static int departureNight(int n) {
    if (n < 1) {
        throw new IllegalArgumentException("n must be at least 1");
    }
    return n; // P(n): leave on night n
}

static void narrate(int n) {
    System.out.println("True blue count n = " + n);
    System.out.println("  Each blue sees " + (n - 1) + " blue(s).");
    if (n == 1) {
        System.out.println("  Sees zero blues; guru implies self. Leaves night 1.");
        return;
    }
    System.out.println("  If I were brown, the " + (n - 1)
            + " I see would leave on night " + (n - 1) + ".");
    System.out.println("  They stay. I deduce blue. All " + n
            + " leave on night " + departureNight(n) + ".");
}

public static void main(String[] args) {
    for (int n = 1; n <= 5; n++) {
        narrate(n);
    }
}
```

Sortie mentale d'exemple:

```
True blue count n = 1
  Each blue sees 0 blue(s).
  Sees zero blues; guru implies self. Leaves night 1.
True blue count n = 2
  Each blue sees 1 blue(s).
  If I were brown, the 1 I see would leave on night 1.
  They stay. I deduce blue. All 2 leave on night 2.
...
```

Si l'intervieweur veut du code, cela suffit pour montrer que la réponse est le `n` inductif, pas une recherche sur des graphes d'îles. S'il veut la preuve, parcours `n = 1`, `n = 2`, puis l'étape générale. C'est le vrai entretien.

### Fausses pistes fréquentes

1. **"Tout le monde voyait déjà des yeux bleus, donc le gourou n'a rien dit de neuf."** La connaissance privée n'est pas la connaissance commune. La chaîne emboîtée "ils savent que je sais" est la pièce manquante.
2. **"Ils partent le matin de l'annonce."** Seule la personne avec `n = 1` peut agir la nuit 1. Pour un `n` plus grand, il faut des attentes déçues sur les nuits précédentes.
3. **"Les marrons partent aussi."** Pas dans l'énoncé classique. Ils ne déduisent jamais "j'ai les yeux bleus."
4. **"L'induction est circulaire parce qu'ils ont besoin du théorème."** Les insulaires n'ont pas besoin du mot "induction." Ils ont besoin d'un raisonnement par cas emboîtés qui s'arrête à 1. Les mathématiciens emballent cet emboîtement sous le nom d'induction.
5. **"N'importe quelle phrase publique suffirait."** Il faut établir le fait de base en connaissance commune. "Je vois des yeux bleus" est exactement l'atome de base dont a besoin la personne de taille 1, et que tout le monde sait que cette personne utiliserait.

---

## 6. Complexité, bords et conseils d'entretien

| Sujet | Réponse |
| --- | --- |
| Technique centrale | Induction mathématique + connaissance commune |
| Forme fermée | `n` bleus partent la nuit `n` |
| "Durée" du processus social | `n` nuits après l'annonce |
| Code | Optionnel O(1) `return n`; narration O(1) par `n` |
| Énigmes liées | Enfants boueux, somme et produit, variantes île aux yeux bleus |

**Bords et suites:**

* **`n = 0`:** un gourou véridique ne dirait pas qu'il voit quelqu'un aux yeux bleus. Hors énigme si le gourou dit toujours la vérité.
* **Gourou se trompe / ment:** le modèle casse; les logiciens parfaits ont besoin d'un fait public de confiance.
* **Quelqu'un part trop tôt par erreur:** détruit le signal d'attente déçue. L'énigme suppose pas de bruit.
* **Plus de deux couleurs d'yeux:** même induction sur la couleur distinguée mentionnée par le gourou, si la règle est "pars quand tu sais que tu as cette couleur."
* **On peut partir pour n'importe quelle couleur une fois connue:** alors les marrons peuvent aussi déduire dans certaines variantes. Reste sur la règle ferry bleu-seulement sauf si l'intervieweur change.
* **Temps continu vs nuits discrètes:** le ferry discretise les fenêtres d'observation pour que "ils ne sont pas partis la nuit k" soit un événement public net.

**Comment le dire (version 45 secondes):**

1. Le gourou rend commune la connaissance "il y a au moins un bleu."
2. Si je vois 0 bleus, je pars la nuit 1.
3. Si je vois 1 bleu, j'attends qu'il parte la nuit 1; sinon je pars la nuit 2.
4. Par induction, si je vois `k` bleus, j'attends qu'ils partent la nuit `k`; sinon je pars la nuit `k + 1`.
5. Avec le vrai compte `n`, tous les bleus partent la nuit `n`.

**Où ça apparaît hors de l'énigme:**

* Systèmes distribués: connaissance commune contre "tout le monde a reçu le message."
* Conception de protocoles: broadcasts publics qui synchronisent des machines à états.
* Signal d'entretien: peux-tu dérouler un cas de base propre et une étape inductive sous pression sans gesticuler?

---

## 7. Récap à raconter à un ami

L'île aux yeux bleus est une histoire d'induction avec un ferry.

1. Logiciens parfaits. Voient les yeux des autres, pas les leurs. Partent à minuit seulement quand ils sont sûrs d'avoir les yeux bleus.
2. Le gourou dit en public: je vois quelqu'un aux yeux bleus. Cela démarre une horloge de connaissance commune.
3. Un bleu: voit zéro bleu, comprend que c'est lui, part la nuit 1.
4. Deux bleus: chacun attend que l'autre parte la nuit 1; personne ne part; les deux partent la nuit 2.
5. En général: chaque bleu voit `n - 1` autres, attend qu'ils partent la nuit `n - 1` si "je suis marron"; quand ils restent, les `n` partent la nuit `n`.

Si tu peux prouver `P(1)`, énoncer l'étape inductive en un paragraphe et expliquer pourquoi le gourou n'est pas une "info inutile," tu maîtrises le problème 6.6. Pas besoin de Java lourd. Le raisonnement soigné est tout le point.

---

## Série

* Guide: [Guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Cruches d'eau](/blog/fr/ctci-6-5-jugs-of-water)
* Suivant: [L'apocalypse](/blog/fr/ctci-6-7-the-apocalypse)