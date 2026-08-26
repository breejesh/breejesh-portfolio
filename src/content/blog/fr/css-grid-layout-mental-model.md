---
title: "Modèle mental CSS Grid: tracks, zones, fr et minmax"
description: "Un modèle mental concret de CSS Grid: tracks, zones, unités fr, minmax, auto-fit vs auto-fill, et les layouts que vous montez chaque semaine."
date: "2026-07-14"
tags: [Frontend et Développement Web]
coverImage: /assets/images/css-grid-layout-mental-model.webp
previewImage: /assets/images/css-grid-layout-mental-model.webp
---

Flexbox convient bien à une ligne ou une colonne. Grid est l'outil pour **deux axes à la fois**: des lignes et des colonnes qui s'alignent, se chevauchent de façon contrôlée et se réorganisent sans une forêt de wrappers imbriqués.

La plupart des bugs Grid viennent d'un modèle flou de ce qu'est un track, de la façon dont `fr` partage l'espace libre, et de ce que fait `auto-fit` quand les colonnes s'effondrent. Ce billet, c'est ce modèle, plus les motifs que je colle dans de vraies pages.

Le support navigateurs est solide depuis des années. Vous pouvez traiter Grid comme du CSS de base, pas comme une expérience de progressive enhancement.

---

## Le modèle mental en un paragraphe

Une grille est un **conteneur** qui définit des **tracks** (largeurs de colonnes et hauteurs de lignes). Les items vivent dans des **cellules**. Un item peut s'étendre sur plusieurs tracks. Vous placez les items par numéros de ligne, par lignes nommées, ou par **zones nommées**. L'espace libre se partage avec `fr`. L'espace libre borné se partage avec `minmax()`. Les colonnes responsives qui grossissent et passent à la ligne viennent de `repeat()` avec `auto-fit` ou `auto-fill`.

Si ce paragraphe tient, le reste de Grid est du vocabulaire et quelques arêtes vives.

---

## Tracks, lignes et cellules

Quand vous écrivez:

```css
.grid {
  display: grid;
  grid-template-columns: 200px 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
}
```

vous créez:

* **Tracks de colonnes:** trois bandes verticales, `200px`, puis deux parts égales de la largeur restante.
* **Tracks de lignes:** hauteur auto style en-tête, un milieu flexible, auto style pied.
* **Lignes:** avec trois colonnes vous avez quatre lignes verticales (numérotées `1` à `4` par défaut). Même idée pour les lignes.
* **Cellules:** intersection d'un track de colonne et d'un track de ligne.
* **Gap:** gouttières entre tracks. Les gaps ne sont pas des tracks. Les spans ne mangent pas le gap comme le margin le laisse parfois croire.

Les enfants remplissent les cellules dans l'**ordre du document** sauf placement explicite. Le placement est optionnel. Une simple grille de cartes n'a besoin d'aucune règle de placement.

### Placement par lignes (quand vous en avez besoin)

```css
.hero {
  grid-column: 1 / 3; /* ligne de depart 1, fin avant la 3 */
  grid-row: 1 / 2;
}

.sidebar {
  grid-column: 3 / 4;
  grid-row: 1 / 3;
}
```

`grid-column: 1 / -1` veut dire pleine largeur: premiere ligne a derniere. Les indices négatifs comptent depuis la fin. A lui seul, cela remplace beaucoup de hacks "full bleed dans un parent contraint".

---

## Zones nommées: la carte par laquelle commencer

Pour les coquilles de page et les dashboards, les **zones** se lisent mieux en revue que les numéros de ligne:

```css
.page {
  display: grid;
  min-height: 100dvh;
  grid-template-columns: 16rem 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "nav  header"
    "nav  main"
    "nav  footer";
}

.page__nav    { grid-area: nav; }
.page__header { grid-area: header; }
.page__main   { grid-area: main; }
.page__footer { grid-area: footer; }
```

```html
<div class="page">
  <nav class="page__nav">...</nav>
  <header class="page__header">...</header>
  <main class="page__main">...</main>
  <footer class="page__footer">...</footer>
</div>
```

Règles pour garder les zones saines:

* Chaque cellule de la carte ASCII doit être remplie. Utilisez `.` pour un trou vide si vous en avez vraiment besoin.
* Une region nommee doit former un **rectangle**. Les formes en L sont invalides.
* Sur petit écran, changez toute la carte dans une media query au lieu de se battre item par item.

```css
@media (max-width: 48rem) {
  .page {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto;
    grid-template-areas:
      "header"
      "nav"
      "main"
      "footer";
  }
}
```

L'ordre source peut rester logique pour l'accessibilité. L'ordre visuel change avec la carte de zones.

---

## `fr`: l'espace libre, pas "une fraction du conteneur"

`1fr` signifie **une part de l'espace libre après prise en compte des tailles fixes et des min/max de contenu**. Ce n'est pas toujours "une tranche égale de 100% de largeur".

```css
grid-template-columns: 200px 1fr 2fr;
```

Si le conteneur fait `1000px` de large et qu'il n'y a pas de gaps:

1. Réservez `200px` pour la colonne un.
2. L'espace libre est `800px`.
3. La colonne deux reçoit `1/3` du libre (`~266px`).
4. La colonne trois reçoit `2/3` du libre (`~533px`).

Le contenu peut pousser un track plus large que sa part de `fr` quand la taille min du contenu dépasse le calcul d'espace libre. C'est pourquoi un overflow apparaît parfois "de nulle part". Le correctif est souvent un minimum explicite:

```css
/* empeche un enfant large d'exploser le track */
.grid > * {
  min-width: 0;
}

/* ou borne le track lui-même */
grid-template-columns: 200px minmax(0, 1fr) minmax(0, 2fr);
```

`minmax(0, 1fr)` est une habitude de production pour des colonnes fluides qui doivent rétrécir sous la largeur intrinsèque du contenu (tableaux, longues URL, blocs de code).

---

## `minmax()`: planchers, plafonds et colonnes honnêtes

`minmax(min, max)` définit la plage autorisée d'un track. Grid résout ensuite la taille utilisée dans cette plage.

Motifs courants:

```css
/* barre laterale qui ne s'effondre pas sous le lisible et n'avale pas la page */
grid-template-columns: minmax(12rem, 18rem) minmax(0, 1fr);

/* lignes qui grossissent avec le contenu mais se bornent pour les zones à scroll */
grid-template-rows: auto minmax(0, 1fr) auto;

/* cartes fluides avec une taille preferee */
grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
```

Voyez `minmax` comme la table de négociation entre l'intention design ("cartes d'environ 16rem") et la réalité ("viewport de 340px" ou "viewport de 1600px").

---

## `auto-fit` vs `auto-fill`: le piège des colonnes responsives

Les deux marchent avec `repeat()` et une taille de track flexible, le plus souvent `minmax(...)`:

```css
.cards {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
}
```

La différence qui compte:

| Mot-clé | Tracks vides |
| --- | --- |
| `auto-fill` | Garde des colonnes vides comme espace en fin de ligne |
| `auto-fit` | Effondre les tracks vides pour que les items restants s'étirent |

Avec peu d'items sur un écran large:

* `auto-fill` laisse des colonnes blanches et les items restent vers `16rem` (ou leur max) avec des trous derrière.
* `auto-fit` effondre ces vides, donc la derniere rangée d'items **grossit** pour remplir la ligne.

La plupart des grilles marketing et des dashboards de cartes veulent **`auto-fit`**. Utilisez **`auto-fill`** quand vous avez besoin d'emplacements réservés ou d'un rythme de colonnes fixe même si certaines cellules sont vides.

Les deux ont besoin d'un **espace libre défini** pour compter combien de colonnes tiennent. La largeur du parent la fournit en général. Des grilles imbriquées dans des parents shrink-wrapped peuvent surprendre. Donnez une largeur a la grille (`width: 100%`, un track `minmax(0, 1fr)`, etc.).

---

## Tracks implicites et dense packing

Si vous placez un item hors du template explicite, Grid cree des tracks **implicites**. Par défaut:

```css
grid-auto-rows: auto;
grid-auto-columns: auto;
grid-auto-flow: row; /* ou column, ou variantes dense */
```

`grid-auto-flow: dense` rebouche les trous quand les items ont des spans différents. Utile pour des murs de cartes type masonry. Plus dur à prédire pour l'accessibilité et l'ordre clavier, donc a préférer pour des galeries visuelles, pas pour des formulaires.

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 8rem;
  grid-auto-flow: dense;
  gap: 0.5rem;
}

.gallery__wide { grid-column: span 2; }
.gallery__tall { grid-row: span 2; }
```

---

## Alignement: deux couches que les gens confondent

Grid aligne les **tracks dans le conteneur** et les **items dans leur zone**:

```css
.grid {
  justify-content: center; /* tracks en groupe sur l'axe inline */
  align-content: start;    /* tracks en groupe sur l'axe block */
  justify-items: stretch;  /* défaut: l'item remplit la largeur de cellule */
  align-items: stretch;    /* défaut: l'item remplit la hauteur de cellule */
}

.item {
  justify-self: end;
  align-self: center;
}
```

Par défaut les items s'étirent. C'est pourquoi un bouton dans une cellule de grille semble en pleine largeur jusqu'à ce que vous mettiez `justify-items: start` ou `justify-self: start` sur l'item.

`place-items`, `place-content` et `place-self` sont les raccourcis à deux axes.

---

## Layouts courants a livrer

### 1. Grille de cartes responsive

```css
.cards {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
}
```

`min(100%, 18rem)` évite l'overflow horizontal sur des viewports plus étroits que `18rem`.

### 2. Holy grail / coquille d'app

```css
.shell {
  display: grid;
  min-height: 100dvh;
  grid-template-columns: clamp(12rem, 20vw, 18rem) minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "side head"
    "side main"
    "side foot";
}
```

### 3. Formulaire avec labels en colonne propre

```css
.form {
  display: grid;
  gap: 0.75rem 1rem;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: center;
}

.form .full {
  grid-column: 1 / -1;
}
```

### 4. Media object sans gymnastique Flex

```css
.media {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}
```

### 5. Grille produit en douze colonnes (quand le design vous en donne une)

```css
.product {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
}

.product__hero   { grid-column: span 8; }
.product__aside  { grid-column: span 4; }
.product__full   { grid-column: 1 / -1; }
```

A un breakpoint, descendez a `repeat(6, ...)` ou une seule colonne et réinitialisez les spans. Les zones nommées battent souvent les douze colonnes pour les coquilles; les douze colonnes aident encore quand le design system parle en "span 8 / span 4".

---

## Grid vs Flex: une règle de decision simple

| Situation | Préférer |
| --- | --- |
| Rangée ou colonne unidimensionnelle de controles | Flex |
| Rangées de cartes de même hauteur a aligner en deux dimensions | Grid |
| Régions de page (nav, main, aside) | Zones Grid |
| Liste de chips avec wrap et nombre inconnu | Flex wrap ou Grid `auto-fit` |
| Centrer une boîte dans le viewport | Les deux; Grid `place-items: center` est court |
| Barres d'outils à un axe dans une page à deux axes | Coquille Grid + barres Flex |

Vous utiliserez les deux sur la même page. Grid pour la structure, Flex pour le micro-layout dans les cellules.

---

## Checklist de débogage

Quand un layout "refuse" de rétrécir ou de s'aligner:

1. L'item est-il un grid item, ou est-il imbriqué un niveau plus bas que vous ne croyez?
2. Un enfant a-t-il besoin de `min-width: 0` / `min-height: 0`?
3. Luttez-vous contre l'alignement `stretch` par défaut?
4. Un `1fr` a-t-il rencontré une taille min de contenu plus grande que l'espace libre?
5. La largeur du parent est-elle indéfinie, de sorte que `auto-fit` ne peut pas compter les colonnes?
6. Ouvrez l'overlay Grid des DevTools. Numéros de ligne et noms de zones s'y voient. Faites confiance a l'overlay plus qu'a l'intuition.

---

## Ce qu'il faut retenir

* Les tracks définissent le squelette. Les items remplissent cellules ou spans.
* Les zones sont la carte lisible du chrome de page.
* `fr` divise l'espace **libre** après tailles fixes et minimums.
* `minmax(0, 1fr)` est la colonne fluide qui rétrécit vraiment.
* `auto-fit` effondre les tracks vides; `auto-fill` les garde.
* Grid pour deux axes, Flex pour un. Imbriquez-les librement.

Quand ces six points deviennent de la mémoire musculaire, Grid cesse de ressembler a une syntaxe spéciale et commence a ressembler a dessiner un tableau capable de se réorganiser.
