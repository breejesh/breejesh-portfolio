---
title: "Torres de Hanoi: Mover n discos con tres postes (Java)"
description: "Problema 8.6 estilo CTCI para principiantes: Torres de Hanoi clásicas con tres postes y n discos. Movimiento recursivo de la torre superior, stacks de Java en cada poste."
date: "2025-08-02"
tags: [Algoritmos]
coverImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
previewImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema 8.6 estilo CTCI para principiantes: Torres de Hanoi clásicas con tres postes y n discos. Movimiento recursivo de la torre superior, stacks de Java en cada poste.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes tres varillas y una pila de discos. Los discos empiezan en la primera varilla, el más grande abajo y el más pequeño arriba. Debes mover toda la pila a la última varilla. Se mueve un disco a la vez. Nunca puedes poner un disco más grande sobre uno más pequeño. La varilla del medio es tu único aparcamiento. Ese puzzle es **Torres de Hanoi**, y la solución limpia de entrevista es recursión más un stack por poste.

Este post es enseñanza original para principiantes absolutos en **Java**. Misma familia de problemas que las clásicas preguntas recursivas de Hanoi, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 8, recursión y programación dinámica. Problema 8.6.

---

## 1. Analogía cotidiana

Piensa en tres postes de un parque y un montón de anillos anidados:

* **Poste origen:** donde arranca la torre completa.
* **Poste destino:** donde debe terminar la torre completa.
* **Poste auxiliar:** aparcamiento temporal para no romper la regla "más grande debajo del más pequeño".

Para mover una torre de cinco anillos no inventas cinco reglas especiales. Quitas los cuatro de arriba del anillo más grande (aparcándolos en el auxiliar, usando el destino como *su* auxiliar), deslizas el anillo grande al destino y luego mueves la torre de cuatro encima. La misma idea vale para cuatro, tres, dos y uno.

La recursión es ese hábito de "misma idea, pila más pequeña" convertido en código.

---

## 2. Enunciado en palabras llanas

**Montaje:**

* Tres postes: a menudo A (origen), B (auxiliar), C (destino).
* `n` discos de tamaños distintos. El disco `1` es el más pequeño, el disco `n` el más grande (o al revés; elige y mantén la convención).
* Inicio: todos los discos en el origen, del más grande abajo al más pequeño arriba.
* Meta: todos los discos en el destino, en orden legal.

**Reglas:**

1. Mueve solo un disco a la vez.
2. Un movimiento toma el disco superior de un poste y lo coloca en otro.
3. Nunca pongas un disco más grande sobre uno más pequeño.

**Salida:** una secuencia de movimientos legales que resuelve el puzzle, o un programa que ejecuta esos movimientos en postes respaldados por stacks.

**Ejemplos (n = 1, 2, 3):**

| n | Movimientos mínimos | Idea |
| --- | --- | --- |
| 1 | 1 | Origen → destino |
| 2 | 3 | Pequeño al auxiliar, grande al dest, pequeño al dest |
| 3 | 7 | Mueve 2 al auxiliar, grande al dest, mueve 2 al dest |
| n | 2^n - 1 | Recurrencia T(n) = 2 T(n-1) + 1 |

**Aclara antes de codificar:**

* ¿Cada poste como `Stack` de tamaños? (Sí. La cima es el disco movible.)
* Etiquetas: ¿número mayor = disco mayor, o al revés? Aquí: **int mayor = disco mayor**.
* ¿Imprimir movimientos o mutar stacks? Mejor ambos: un `moveDisks` que mute y logging opcional.
* ¿Movimientos ilegales? Lanza o aserta si un disco grande caería sobre uno más pequeño.

---

## 3. Piensa primero (movimiento recursivo)

### Caso base

Mover **1** disco de origen a destino: pop del origen, push en el destino. Listo.

### Caso recursivo

Para mover **n** discos de origen a destino usando auxiliar:

1. Mueve `n - 1` discos de **origen → auxiliar**, usando **destino** como poste temporal.
2. Mueve el disco restante (el más grande de este subproblema) de **origen → destino**.
3. Mueve `n - 1` discos de **auxiliar → destino**, usando **origen** como poste temporal.

Los roles de los tres postes se intercambian en cada llamada recursiva. Ese intercambio es el truco. No hardcodeas "siempre aparca en B".

### Por qué no rompe la regla de tamaño

Por inducción: una torre legal de `n - 1` se puede mover como unidad. Tras el paso 1, el disco más grande de este subproblema queda solo en el origen (o bajo discos más grandes ajenos a esta subllamada). El paso 2 lo pone en un poste cuya cima está vacía o es mayor que él (los más pequeños están todos en el auxiliar). El paso 3 reconstruye la torre pequeña encima.

### Recorrido: n = 3, A → C vía B

Discos: `3` (abajo), `2`, `1` (arriba) en A.

| Paso | Acción | A (abajo → arriba) | B | C |
| --- | --- | --- | --- | --- |
| inicio | | 3, 2, 1 | vacío | vacío |
| 1 | mueve 2: A → B vía C | 3 | 2, 1 | vacío |
| 2 | mueve disco 3: A → C | vacío | 2, 1 | 3 |
| 3 | mueve 2: B → C vía A | vacío | vacío | 3, 2, 1 |

Expandiendo "mueve 2: A → B vía C":

1. Mueve 1: A → C
2. Mueve 2: A → B
3. Mueve 1: C → B

Total de movimientos para n = 3: 7. El patrón vale para cualquier n.

### Qué no hacer

* Bucles anidados que solo sirven para n = 3. Quieren la estructura recursiva general.
* Arrays sin disciplina de pila si el problema pide postes como stacks.
* Mover toda una subtower en un "truco" no recursivo sin mostrar el plan de tres pasos.

---

## 4. Solución en Java

Modela cada poste como una clase pequeña que envuelve un `Stack<Integer>`. Los valores de disco crecen con el tamaño: la cima debe ser más pequeña que lo que empujas, o el poste vacío.

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

Driver que construye tres postes y resuelve para `n`:

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

Comprobación mínima para n = 2 (tres movimientos impresos):

```java
// solveHanoi(2) prints something like:
// Move disk 1 from 0 to 1
// Move disk 2 from 0 to 2
// Move disk 1 from 1 to 2
```

Si prefieres funciones libres en lugar de métodos en `Tower`, mantén los mismos tres pasos y pasa origen, destino y auxiliar como argumentos. La forma de la recursión no cambia.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Recursión clásica | O(2^n) movimientos | O(n) pila de llamadas | Exactamente 2^n - 1 movimientos; cada uno es O(1) en el stack |
| Iterativo con pila explícita | O(2^n) movimientos | O(n) | Misma cota; simula la recursión |
| Solo forma cerrada | O(1) para contar | O(1) | El conteo es 2^n - 1; aún O(2^n) si emites movimientos |

No puedes bajar de 2^n - 1 movimientos legales con las reglas clásicas de tres postes. El coste exponencial es el problema, no un bug de tu código. El espacio extra de la solución recursiva es la profundidad de llamadas O(n), más O(n) de almacenamiento de discos en los postes.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan estos:

* **n = 0** → sin movimientos. Protege con `n <= 0`.
* **n = 1** → un solo `moveTopTo`. El caso base debe funcionar solo.
* **n = 2, n = 3** → recórrelos a mano; el conteo debe ser 3 y 7.
* **Rol de auxiliar mal** → intercambiar destino y auxiliar en las llamadas corrompe la torre.
* **Cargar discos del más pequeño primero** → el más grande queda arriba; `add` lanza o el puzzle arranca ilegal.
* **Comparar tamaños al revés** → si inviertes "int mayor = disco mayor", invierte también el chequeo de seguridad.

Errores comunes:

1. **Solo codificar el movimiento del medio.** Olvidar las dos llamadas recursivas `n - 1` deja discos a medias.
2. **Hardcodear índices de poste** dentro del método recursivo en lugar de pasar roles. Se rompe al rotar roles.
3. **Permitir stacks ilegales.** Sin el chequeo en `add`, los bugs se ocultan hasta que el layout final se ve mal.
4. **Off-by-one en n.** Mover `n` discos cuando solo quedan `n - 1` en el origen tras una mala llamada previa.
5. **Creer que memo DP ayuda.** Cada subproblema debe mover discos de verdad; no hay solapamiento tipo conteo de caminos. Aquí importa la estructura recursiva más que tablas memo.

Entrada a prueba de n inválido:

```java
void solveHanoiSafe(int n) {
    if (n < 0) {
        throw new IllegalArgumentException("n must be >= 0");
    }
    solveHanoi(n);
}
```

---

## 7. Recap para contárselo a un amigo

Torres de Hanoi pide: mueve n discos del poste A al poste C usando el poste B, sin poner nunca un disco más grande sobre uno más pequeño.

1. Representa cada poste como un stack. La cima es el único disco que puedes mover.
2. Base: mueve un disco origen → destino.
3. General: mueve n-1 origen → auxiliar (dest como temp), mueve uno origen → dest, mueve n-1 auxiliar → dest (origen como temp).
4. Movimientos totales: 2^n - 1. Tiempo O(2^n), profundidad de recursión O(n).
5. Enforce reglas de tamaño en cada push para que los estados ilegales fallen rápido.

Si puedes decir el plan de tres pasos, cargar discos del más grande primero y no mezclar el rol del auxiliar, dominas el problema 8.6.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Recursive Multiply](/blog/es/ctci-8-5-recursive-multiply)
* Siguiente: [Permutations without Dups](/blog/es/ctci-8-7-permutations-without-dups)