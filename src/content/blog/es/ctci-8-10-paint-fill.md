---
title: "Paint Fill: rellenar una region de color con DFS o BFS (Java)"
description: "Problema estilo CTCI 8.10 para principiantes: bote de pintura en una pantalla 2D de colores. Sustituye una region conexa con un color nuevo usando DFS recursivo o BFS iterativo en Java."
date: "2025-12-26"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-8-10-paint-fill.webp
previewImage: /assets/images/ctci-8-10-paint-fill.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 8.10 para principiantes: bote de pintura en una pantalla 2D de colores. Sustituye una region conexa con un color nuevo usando DFS recursivo o BFS iterativo en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Los editores de imagen tienen una herramienta de **bote de pintura**. Haces clic en un pixel, eliges un color nuevo, y todo el bloque conexo del color viejo cambia. La pantalla es un array 2D de valores de color. El clic es fila y columna. El trabajo es recolorear cada pixel al que puedas llegar moviendote arriba, abajo, izquierda y derecha sin salir del color original.

Este post es ensenanza original para principiantes en **Java**. Misma familia que las preguntas clasicas de flood fill en entrevistas, no una copia de un libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capitulo 8, recursion y DP: busqueda en grafo sobre una rejilla, no una tabla de memo esta vez.

---

## 1. Analogia cotidiana

Piensa en un suelo de baldosas pintado a manchas de color. Te paras en una baldosa azul y quieres que cada baldosa azul a la que puedas caminar (compartiendo un borde, no solo una esquina) se pinte de rojo.

* Empieza en la baldosa del clic. Recuerda que era azul.
* Pintala de rojo.
* Mira los cuatro vecinos: norte, sur, este, oeste.
* Por cada vecino que siga azul, camina alli y haz lo mismo.
* Para cuando un vecino esta fuera de limites, ya es rojo, o nunca fue azul (pared, mancha verde, lo que sea).

No saltas en diagonal salvo que el entrevistador pida conectividad de ocho. No repintas baldosas que no eran el color original. Eso es flood fill: crece una region conexa hasta el borde de color.

Si el clic ya es el color nuevo, no hagas nada. Pintar azul a azul para siempre es un bug real (recursion infinita o un BFS que no termina).

---

## 2. Enunciado en palabras claras

**Entrada:**

* `screen`: array 2D de colores (ints, enums o chars; en entrevistas suele ser `int[][]` o `Color[][]`)
* `r`, `c`: coordenadas del clic
* `newColor`: color de relleno

**Salida:** la misma pantalla, con la region conexa del color original en `(r, c)` sustituida por `newColor`. Mutar in place o devolver el array; dilo en voz alta.

**Conectividad (por defecto en este problema):** cuatro direcciones, solo vecinos por borde:

```
(-1, 0), (1, 0), (0, -1), (0, 1)
```

**Forma de la firma:**

```java
void paintFill(int[][] screen, int r, int c, int newColor);
// o con un enum / tipo Color
boolean paintFill(Color[][] screen, int r, int c, Color newColor);
```

Devolver `boolean` (hubo relleno?) es un detalle opcional de algunos esquemas de libro. Mutar con void basta.

**Aclara en la entrevista:**

* Vecinos de cuatro o de ocho?
* Reglas de limites y pantalla vacia?
* Que pasa si `(r, c)` esta fuera de rango?
* Clic del mismo color: no-op?
* Pueden ser null los colores (si el tipo es objeto)?
* Mutar la entrada o copiar?

**Ejemplo pequeno:**

```
Antes (clic en (1,1), color nuevo = 9):

  1 1 1 2
  1 1 0 2
  1 0 1 2

Despues (relleno de cuatro del bloque de 1 arriba-izquierda):

  9 9 9 2
  9 9 0 2
  9 0 1 2
```

El `1` solo del centro inferior se queda. Solo comparte esquina con la region rellenada, no un borde.

---

## 3. Piensa primero

### Esto es busqueda en un grafo

Cada celda es un nodo. Hay arista a un vecino si esta dentro de limites y sigue con el color **original**. Flood fill es "visitar cada nodo del componente conexo de la celda de inicio y recolorear."

DFS (recursion o pila explicita) y BFS (cola) valen. Los entrevistadores aceptan cualquiera. Di el marco de grafo en voz alta; demuestra que no solo repites la historia del bote de pintura.

### Captura el color original primero

```
oldColor = screen[r][c]
if oldColor == newColor: return
// luego inunda solo celdas iguales a oldColor
```

Si recoloras el inicio antes de leer `oldColor`, pierdes el objetivo. Si omites la salida temprana cuando los colores coinciden, el DFS reentra en celdas que acabas de pintar con `newColor` cuando `newColor` es lo que compruebas... en realidad compruebas `oldColor`, asi que si `oldColor == newColor` cada celda recolorada sigue "coincidiendo" y recursas para siempre. Protegelo.

### Esquema DFS recursivo

```
function fill(r, c):
  if out of bounds: return
  if screen[r][c] != oldColor: return
  screen[r][c] = newColor
  fill(r-1, c); fill(r+1, c); fill(r, c-1); fill(r, c+1)
```

Entrada:

```
oldColor = screen[r][c]
if oldColor == newColor: return
fill(r, c)
```

### Esquema BFS iterativo

```
queue.push(start)
screen[start] = newColor
while queue not empty:
  cell = queue.pop
  for each neighbor:
    if in bounds and screen[neighbor] == oldColor:
      screen[neighbor] = newColor
      queue.push(neighbor)
```

Pinta al encolar (o marca visitado) para no encolar la misma celda dos veces. En una rejilla, cambiar de `oldColor` es la marca de visitado. No hace falta un `boolean[][]` aparte.

### DFS vs BFS en la entrevista

| | DFS recursivo | BFS iterativo |
| --- | --- | --- |
| Longitud de codigo | Corta | Un poco mas (cola + dirs) |
| Riesgo de pila | Una region serpiente larga puede reventar la pila de llamadas | Cola en heap; mas segura en pantallas enormes |
| Orden | Profundidad primero | Por niveles; mismo resultado final |

Para tamanos de entrevista, cualquiera vale. Menciona la profundidad de pila del DFS en una pantalla `N x M` de un solo color: peor profundidad cerca de `N*M`.

### Por que esta en "Recursion and DP"

La escritura natural es recursiva. No hay tabla de memo elaborada. Los "subproblemas" son los vecinos. Sigue alineado con el capitulo: recursion sobre rejilla, misma familia que caminos de robot e inundacion de laberinto.

### Boceto en la pizarra

1. Dibuja una rejilla 3x4 con un bloque de color `1` y otros colores.
2. Marca el clic. Escribe `old = 1`, `new = 9`.
3. Recolorea el inicio y sigue las cuatro direcciones.
4. Muestra una celda que detiene el relleno (otro color o limite).
5. Nota la salida temprana si `old == new`.

---

## 4. Solucion en Java

### Ayudas compartidas

```java
static final int[][] DIRS = {
    {-1, 0}, {1, 0}, {0, -1}, {0, 1}
};

static boolean inBounds(int[][] screen, int r, int c) {
    return r >= 0 && r < screen.length
        && c >= 0 && c < screen[0].length;
}
```

Asume una pantalla rectangular no vacia en el codigo de ensenanza. Protege arrays vacios en produccion.

### DFS recursivo

```java
/**
 * Paint-bucket fill: recolor the 4-connected region of screen[r][c].
 * Mutates screen in place.
 */
void paintFillDfs(int[][] screen, int r, int c, int newColor) {
    if (screen == null || screen.length == 0 || screen[0].length == 0) {
        return;
    }
    if (!inBounds(screen, r, c)) {
        return;
    }
    int oldColor = screen[r][c];
    if (oldColor == newColor) {
        return;
    }
    fill(screen, r, c, oldColor, newColor);
}

void fill(int[][] screen, int r, int c, int oldColor, int newColor) {
    if (!inBounds(screen, r, c)) {
        return;
    }
    if (screen[r][c] != oldColor) {
        return;
    }
    screen[r][c] = newColor;
    for (int[] d : DIRS) {
        fill(screen, r + d[0], c + d[1], oldColor, newColor);
    }
}
```

### BFS iterativo

```java
void paintFillBfs(int[][] screen, int r, int c, int newColor) {
    if (screen == null || screen.length == 0 || screen[0].length == 0) {
        return;
    }
    if (!inBounds(screen, r, c)) {
        return;
    }
    int oldColor = screen[r][c];
    if (oldColor == newColor) {
        return;
    }

    java.util.ArrayDeque<int[]> q = new java.util.ArrayDeque<>();
    screen[r][c] = newColor;
    q.add(new int[] {r, c});

    while (!q.isEmpty()) {
        int[] cell = q.removeFirst();
        int cr = cell[0];
        int cc = cell[1];
        for (int[] d : DIRS) {
            int nr = cr + d[0];
            int nc = cc + d[1];
            if (inBounds(screen, nr, nc) && screen[nr][nc] == oldColor) {
                screen[nr][nc] = newColor;
                q.add(new int[] {nr, nc});
            }
        }
    }
}
```

`ArrayDeque` como cola es claro y rapido. Una cola enlazada manual vale en la pizarra.

### Estilo opcional con enum Color

Algunos esquemas usan un enum para parecer pixeles "reales":

```java
enum Color { RED, GREEN, BLUE, YELLOW }

boolean paintFill(Color[][] screen, int r, int c, Color newColor) {
    if (screen == null || screen.length == 0) {
        return false;
    }
    if (!inBoundsColor(screen, r, c)) {
        return false;
    }
    Color oldColor = screen[r][c];
    if (oldColor == newColor) {
        return false;
    }
    fillColor(screen, r, c, oldColor, newColor);
    return true;
}

void fillColor(Color[][] screen, int r, int c, Color oldColor, Color newColor) {
    if (!inBoundsColor(screen, r, c)) {
        return;
    }
    if (screen[r][c] != oldColor) {
        return;
    }
    screen[r][c] = newColor;
    fillColor(screen, r - 1, c, oldColor, newColor);
    fillColor(screen, r + 1, c, oldColor, newColor);
    fillColor(screen, r, c - 1, oldColor, newColor);
    fillColor(screen, r, c + 1, oldColor, newColor);
}

boolean inBoundsColor(Color[][] screen, int r, int c) {
    return r >= 0 && r < screen.length
        && c >= 0 && c < screen[0].length;
}
```

Mismo algoritmo. Los enums se leen bien cuando hablas de "colores" en vez de ints magicos.

### Comprobaciones minimas

```java
int[][] g = {
    {1, 1, 1, 2},
    {1, 1, 0, 2},
    {1, 0, 1, 2}
};
paintFillDfs(g, 1, 1, 9);
assert g[0][0] == 9 && g[0][1] == 9 && g[0][2] == 9;
assert g[1][0] == 9 && g[1][1] == 9;
assert g[2][0] == 9;
assert g[1][2] == 0; // not part of the 1-region via edges
assert g[2][1] == 0;
assert g[2][2] == 1; // diagonal only; four-way leaves it
assert g[0][3] == 2;

int[][] same = {{3, 3}, {3, 3}};
paintFillBfs(same, 0, 0, 3); // no-op, must not hang
assert same[1][1] == 3;

int[][] one = {{5}};
paintFillBfs(one, 0, 0, 7);
assert one[0][0] == 7;
```

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| DFS recursivo | O(R * C) | O(R * C) pila de llamadas en el peor caso | Visita cada celda de la region una vez; la peor region es toda la pantalla |
| BFS iterativo | O(R * C) | O(R * C) cola en el peor caso | Mismo limite de visitas; sin riesgo de pila de la JVM |
| Variante de ocho | O(R * C) | igual | Mas aristas por celda; sigue lineal en celdas |

Nunca necesitas mas de trabajo constante por celda. No digas O(1) de espacio para DFS recursivo en rellenos grandes; la pila es real.

---

## 6. Casos borde y errores frecuentes

Los entrevistadores tocan estos:

* **El color del clic ya es el nuevo:** return al momento. Si no, recursion / cola infinitas.
* **Clic fuera de limites:** return; no lances excepcion salvo que la API lo prometa.
* **Pantalla 1x1:** una sola asignacion si los colores difieren.
* **Toda la pantalla un color:** cada celda cambia; la profundidad del DFS puede ser enorme.
* **La region toca los bordes:** chequeos de limites en cada vecino, no solo en el inicio.
* **Filas irregulares:** el codigo de ensenanza asume rectangulo; dilo si las filas pueden diferir.
* **Ocho vs cuatro direcciones:** un sangrado diagonal incorrecto cambia la respuesta (ver celda `(2,2)` del ejemplo).
* **Recolorear antes de guardar `oldColor`:** no sabes que igualar.

Errores comunes:

1. **Olvidar el guard `oldColor == newColor`.**
2. **Comprobar `!= newColor` en vez de `== oldColor`** al expandir (recorreria toda celda no-nueva).
3. **Faltar una direccion** en la lista de cuatro.
4. **Usar ocho direcciones por accidente.**
5. **Encolar sin recolorear** (BFS revisita sin fin) o recolorear sin marca de visitado.
6. **Limites off-by-one** (`<= length` en vez de `< length`).
7. **Asumir pantalla cuadrada** cuando solo usas `screen[0].length` como ancho (vale si es rectangular; di la asuncion).

---

## 7. Resumen para contarselo a un amigo

Paint fill en una frase larga:

1. La pantalla es una rejilla de colores. Clic en una celda y un color nuevo.
2. Guarda `oldColor`. Si ya es igual a `newColor`, para.
3. Recolorea cada celda alcanzable con pasos arriba/abajo/izquierda/derecha que se queden en `oldColor`.
4. DFS recursivo o cola BFS: misma imagen final.
5. Recolorea (o marca visitado) al entrar en una celda para no procesarla dos veces.
6. Tiempo y espacio lineales en el tamano de la region rellenada (peor caso: toda la rejilla).

Si puedes recorrer el ejemplo 3x4 a mano, escribir el guard de salida temprana y explicar por que cuatro direcciones dejan sola una celda diagonal, dominas el problema 8.10. Lo siguiente del capitulo es conteo al estilo monedas con DP.

---

## Serie

* Guia: [Guia de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Parens](/blog/es/ctci-8-9-parens)
* Siguiente: [Coins](/blog/es/ctci-8-11-coins)