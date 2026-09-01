---
title: "Modelo mental de CSS Grid: tracks, áreas, fr y minmax"
description: "Un modelo mental práctico de CSS Grid: tracks, áreas, unidades fr, minmax, auto-fit vs auto-fill y los layouts que montas cada semana."
date: "2026-07-14"
tags: [Frontend y Desarrollo Web]
coverImage: /assets/images/css-grid-layout-mental-model.webp
previewImage: /assets/images/css-grid-layout-mental-model.webp
---


Flexbox va bien para una fila o una columna. Grid es la herramienta para **dos ejes a la vez**: filas y columnas que alinean, se solapan de forma controlada y reflowean sin un árbol de wrappers anidados.

La mayoría de bugs de Grid vienen de un modelo borroso de qué es un track, cómo reparte espacio libre `fr` y qué hace `auto-fit` cuando las columnas colapsan. Este post es ese modelo, más los patrones que pego en páginas reales.

El soporte en navegadores lleva años siendo sólido. Puedes tratar Grid como CSS base, no como un experimento de progressive enhancement.

---

## El modelo mental en un párrafo

Una grid es un **contenedor** que define **tracks** (anchos de columna y altos de fila). Los items viven en **celdas**. Un item puede abarcar varios tracks. Colocas items por números de línea, por líneas con nombre o por **áreas con nombre**. El espacio libre se reparte con `fr`. El espacio libre acotado se reparte con `minmax()`. Las columnas responsivas que crecen y envuelven salen de `repeat()` con `auto-fit` o `auto-fill`.

Si ese párrafo se queda, el resto de Grid es vocabulario y unos pocos bordes afilados.

---

## Tracks, líneas y celdas

Cuando escribes:

```css
.grid {
  display: grid;
  grid-template-columns: 200px 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
}
```

creas:

* **Tracks de columna:** tres franjas verticales, `200px`, luego dos partes iguales del ancho sobrante.
* **Tracks de fila:** alto auto tipo cabecera, un medio flexible, auto tipo pie.
* **Líneas:** con tres columnas tienes cuatro líneas verticales (numeradas `1` a `4` por defecto). Misma idea en filas.
* **Celdas:** intersección de un track de columna y uno de fila.
* **Gap:** gutters entre tracks. Los gaps no son tracks. Los spans no se comen el gap como a veces parece el margin.

Los hijos fluyen a las celdas en **orden del documento** salvo que los coloques. La colocación es opcional. Una grid de cards simple no necesita reglas de placement.

### Colocación por líneas (cuando la necesitas)

```css
.hero {
  grid-column: 1 / 3; /* linea de inicio 1, fin antes de la 3 */
  grid-row: 1 / 2;
}

.sidebar {
  grid-column: 3 / 4;
  grid-row: 1 / 3;
}
```

`grid-column: 1 / -1` es ancho completo: primera línea a última. Los índices negativos cuentan desde el final. Eso solo reemplaza muchos hacks de "full bleed dentro de un padre acotado".

---

## Áreas con nombre: el mapa con el que conviene empezar

Para shells de página y dashboards, las **áreas** se leen mejor en review que los números de línea:

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

Reglas para no liarla con áreas:

* Cada celda del mapa ASCII debe estar rellena. Usa `.` para un hueco vacio si de verdad lo necesitas.
* Una región con nombre debe ser un **rectángulo**. Las formas en L no valen.
* En pantallas pequeñas, cambia el mapa entero en una media query en vez de pelear placement item a item.

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

El orden del documento puede seguir siendo lógico para accesibilidad. El orden visual cambia con el mapa de áreas.

---

## `fr`: espacio libre, no "fracción del contenedor"

`1fr` significa **una parte del espacio libre después de fijar tamaños fijos y min/max de contenido**. No es siempre "un trozo igual del 100% del ancho".

```css
grid-template-columns: 200px 1fr 2fr;
```

Si el contenedor mide `1000px` de ancho y no hay gaps:

1. Reserva `200px` para la columna uno.
2. El espacio libre es `800px`.
3. La columna dos se lleva `1/3` del libre (`~266px`).
4. La columna tres se lleva `2/3` del libre (`~533px`).

El contenido puede empujar un track mas ancho que su parte de `fr` cuando el min size del contenido supera la cuenta del espacio libre. Por eso a veces aparece overflow "de la nada". El arreglo suele ser un minimo explícito:

```css
/* evita que un hijo ancho explote el track */
.grid > * {
  min-width: 0;
}

/* o acota el track */
grid-template-columns: 200px minmax(0, 1fr) minmax(0, 2fr);
```

`minmax(0, 1fr)` es un hábito de producción para columnas fluidas que deben encoger por debajo del ancho intrínseco del contenido (tablas, URLs largas, bloques de código).

---

## `minmax()`: suelos, techos y columnas honestas

`minmax(min, max)` define el rango permitido de un track. Grid resuelve el tamaño usado dentro de ese rango.

Patrones habituales:

```css
/* sidebar que no se colapsa por debajo de lo legible ni se come la pagina */
grid-template-columns: minmax(12rem, 18rem) minmax(0, 1fr);

/* filas que crecen con el contenido pero se acotan para zonas con scroll */
grid-template-rows: auto minmax(0, 1fr) auto;

/* cards fluidas con un tamano preferido */
grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
```

Piensa en `minmax` como la mesa de negociación entre la intención de diseño ("cards de unos 16rem") y la realidadd ("viewport de 340px" o "viewport de 1600px").

---

## `auto-fit` vs `auto-fill`: la trampa de columnas responsivas

Ambos van con `repeat()` y un tamaño de track flexible, casi siempre `minmax(...)`:

```css
.cards {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
}
```

La diferencia que importa:

| Keyword | Tracks vacíos |
| --- | --- |
| `auto-fill` | Mantiene columnas vacias como hueco al final |
| `auto-fit` | Colapsa tracks vacíos para que los items restantes estiren |

Con pocos items en una pantalla ancha:

* `auto-fill` deja columnas en blanco y los items se quedan cerca de `16rem` (o su max) con huecos detras.
* `auto-fit` colapsa esos vacíos, asi que la última fila de items **crece** para llenar la fila.

La mayoría de grids de marketing y dashboards de cards quieren **`auto-fit`**. Usa **`auto-fill`** cuando necesites huecos reservados o un ritmo fijo de columnas aunque algunas celdas esten vacias.

Ambos necesitan un **espacio libre definido** para contar cuántas columnas caben. El ancho del padre suele darlo. Grids anidadas dentro de padres shrink-wrapped pueden sorprenderte. Dale ancho a la grid (`width: 100%`, un track `minmax(0, 1fr)`, etc.).

---

## Tracks implícitos y empaquetado dense

Si colocas un item fuera de la plantilla explicita, Grid crea tracks **implícitos**. Por defecto:

```css
grid-auto-rows: auto;
grid-auto-columns: auto;
grid-auto-flow: row; /* o column, o variantes dense */
```

`grid-auto-flow: dense` rellena huecos cuando los items tienen spans distintos. Util para muros de cards tipo masonry. Mas difícil de predecir para accesibilidad y orden de teclado, asi que prefírelo para galerías visuales, no para formularios.

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

## Alineación: dos capas que la gente mezcla

Grid alinea **tracks dentro del contenedor** e **items dentro de su área**:

```css
.grid {
  justify-content: center; /* tracks como grupo en el eje inline */
  align-content: start;    /* tracks como grupo en el eje block */
  justify-items: stretch;  /* por defecto: el item llena el ancho de la celda */
  align-items: stretch;    /* por defecto: el item llena el alto de la celda */
}

.item {
  justify-self: end;
  align-self: center;
}
```

Por defecto los items se estiran. Por eso un botón dentro de una celda parece a ancho completo hasta que pones `justify-items: start` o `justify-self: start` en el item.

`place-items`, `place-content` y `place-self` son los atajos de dos ejes.

---

## Layouts comunes que puedes enviar a producción

### 1. Grid de cards responsiva

```css
.cards {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
}
```

`min(100%, 18rem)` evita overflow horizontal en viewports mas estrechos que `18rem`.

### 2. Holy grail / shell de app

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

### 3. Formulario con labels en columna limpia

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

### 4. Media object sin gimnasia de Flex

```css
.media {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}
```

### 5. Grid de producto de doce columnas (cuando diseño te la pasa)

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

En un breakpoint, baja a `repeat(6, ...)` o una sola columna y resetea los spans. Las áreas con nombre suelen ganar a doce columnas para shells; doce columnas siguen ayudando cuando el design system habla en "span 8 / span 4".

---

## Grid vs Flex: una regla de decision simple

| Situación | Prefiere |
| --- | --- |
| Fila o columna unidimensional de controles | Flex |
| Filas de cards de igual alto que deben alinear en dos dimensiones | Grid |
| Regiones de página (nav, main, aside) | Áreas de Grid |
| Lista de chips con wrap e indeterminada | Flex wrap o Grid `auto-fit` |
| Centrar una caja en el viewport | Cualquiera; Grid `place-items: center` es corto |
| Toolbars de un eje dentro de una página de dos ejes | Shell Grid + toolbars Flex |

Usarás ambos en la misma página. Grid para estructura, Flex para micro-layout dentro de las celdas.

---

## Checklist de depuración

Cuando un layout "se niega" a encoger o alinear:

1. El item es un grid item, o esta anidado un nivel más de lo que crees?
2. Un hijo necesita `min-width: 0` / `min-height: 0`?
3. Estas luchando contra el `stretch` por defecto?
4. Un `1fr` choco con un min content intrínseco mayor que el espacio libre?
5. El ancho del padre es indefinido y `auto-fit` no puede contar columnas?
6. Abre el overlay de Grid en DevTools. Ahi salen líneas y nombres de área. Fíate del overlay más que de la intuición.

---

## Que memorizar

* Los tracks definen el esqueleto. Los items llenan celdas o spans.
* Las áreas son el mapa legible del chrome de página.
* `fr` reparte el espacio **libre** tras tamaños fijos y mínimos.
* `minmax(0, 1fr)` es la columna fluida que de verdad se encoge.
* `auto-fit` colapsa tracks vacíos; `auto-fill` los mantiene.
* Grid para dos ejes, Flex para uno. Anídalos sin miedo.

Cuando esos seis puntos sean memoria muscular, Grid deja de sentirse como una sintaxis especial y empieza a sentirse como dibujar una tabla que sabe reflowear.

