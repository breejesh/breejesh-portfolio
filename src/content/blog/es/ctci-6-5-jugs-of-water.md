---
title: "Jarras de agua: medir exactamente 4 litros con 3 y 5 (Java)"
description: "Problema estilo CTCI 6.5 para principiantes: dos jarras de capacidad 3 y 5 litros, medir exactamente 4. Pasos manuales de llenado, identidad de Bézout y BFS opcional en Java sobre estados."
date: "2025-08-19"
tags: [Algoritmos]
coverImage: /assets/images/ctci-6-5-jugs-of-water.webp
previewImage: /assets/images/ctci-6-5-jugs-of-water.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 6.5 para principiantes: dos jarras de capacidad 3 y 5 litros, medir exactamente 4. Pasos manuales de llenado, identidad de Bézout y BFS opcional en Java sobre estados.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes una jarra de 3 litros y otra de 5 litros. Sin otras marcas. Un lago (o grifo) ilimitado para llenar, y puedes vaciar cualquiera de las dos. ¿Puedes acabar con exactamente **4 litros** en una de ellas?

Este es el puzzle clásico de las jarras de agua. También es teoría de números en la cocina: las cantidades que puedes medir son múltiplos de `gcd(3, 5)`, que es 1, así que 4 es posible. En entrevista quieren los pasos, el porqué y a veces un programa de búsqueda que los encuentre.

Este post es enseñanza original para principiantes en **Java**. Misma familia que los puzzles clásicos de jarras y acertijos al estilo Die Hard, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 6, puzzles de matemáticas y lógica.

---

## 1. Analogía cotidiana

Piensa en dos vasos medidores sin rayas de medio litro. Uno cabe tres vasos de agua, el otro cinco. Puedes:

* Llenar un vaso del todo desde el grifo.
* Vaciar un vaso del todo.
* Verter de uno al otro hasta que el origen se vacíe o el destino se llene.

Nunca llenas "a ojo" a medias. Cada cantidad que creas sale de llenados completos, vaciados completos y trasvases que paran en la capacidad. El puzzle es si 4 litros aparecen como contenido de una jarra tras una secuencia corta de esos movimientos.

---

## 2. Problema en palabras simples

**Dados:**

* Capacidad de la jarra A: 3 litros.
* Capacidad de la jarra B: 5 litros.
* Fuente de agua ilimitada y espacio para vaciar (puedes vaciar cualquiera por completo).

**Operaciones permitidas:**

1. Llenar A del todo desde la fuente.
2. Llenar B del todo desde la fuente.
3. Vaciar A por completo.
4. Vaciar B por completo.
5. Verter A en B hasta que A quede vacía o B llena.
6. Verter B en A hasta que B quede vacía o A llena.

**Objetivo:** llegar a cualquier estado donde A o B (o ambas) tenga exactamente 4 litros. En el enunciado habitual, los 4 quedan en la jarra de 5 litros.

**Aclara antes de codificar o escribir pasos:**

* ¿Los 4 deben estar en una sola jarra? (Sí en esta versión clásica.)
* ¿Hay un tercer recipiente? (No.)
* ¿Empiezan vacías? (Sí.)
* ¿Solo litros enteros? (Sí: cantidades enteras.)
* Caso general después: capacidades `m`, `n`, objetivo `d`. Mismas ideas.

---

## 3. Piensa primero

### Qué puedes medir de verdad

Cada operación:

* Añade una capacidad completa (`+3` o `+5` desde la fuente, al llenar),
* Resta una capacidad completa (al vaciar),
* O mueve agua entre jarras sin cambiar el **total** de agua que hay ahora.

Si solo te importan cantidades que aparecen en una jarra, son combinaciones lineales enteras de 3 y 5:

```
a*3 + b*5   para algunos enteros a, b (positivos o negativos)
```

Negativo significa "vaciar tantas veces" en la contabilidad clásica. **Identidad de Bézout:** el conjunto de todas esas combinaciones es exactamente los múltiplos de `gcd(3, 5) = 1`. Así puedes medir 1, 2, 3, 4 o 5 litros en una de las jarras (respetando la capacidad). No puedes medir 4 con jarras de 6 y 9, porque `gcd(6, 9) = 3` y 3 no divide a 4.

Regla del puzzle general: **el objetivo `d` es resoluble si y solo si `d` es múltiplo de `gcd(m, n)` y `0 < d <= max(m, n)`** (para "exactamente `d` en una jarra").

### Estados, no magia

Un estado es un par `(a, b)`: litros en la jarra de 3 y litros en la de 5.

* Inicio: `(0, 0)`.
* Meta: cualquier estado con `a == 4` o `b == 4`. Aquí solo B puede contener 4, así que `b == 4`.

Desde cualquier estado hay como mucho seis movimientos. El grafo es minúsculo: 4 valores posibles para A (0..3) por 6 para B (0..5) = 24 estados. Búsqueda en anchura encuentra una secuencia más corta si quieres código. En la pizarra, un camino manual corto basta.

### Un camino manual limpio (6 operaciones)

Sigue `(jarra-3, jarra-5)`:

```
(0, 0)  inicio
(0, 5)  llena la de 5
(3, 2)  vierte la de 5 en la de 3 hasta llenar la de 3; quedan 2 en la de 5
(0, 2)  vacía la de 3
(2, 0)  vierte los 2 restantes en la de 3
(2, 5)  llena otra vez la de 5
(3, 4)  vierte la de 5 en la de 3 hasta llenarla (le falta 1); quedan 4 en la de 5
```

Listo. La jarra de 5 litros tiene exactamente 4 litros.

### Otro camino (empezar con la de 3)

```
(0, 0)
(3, 0)  llena 3
(0, 3)  vierte en 5
(3, 3)  llena 3
(1, 5)  vierte en 5 hasta llenar; queda 1 en la de 3
(1, 0)  vacía 5
(0, 1)  vierte el 1 en 5
(3, 1)  llena 3
(0, 4)  vierte en 5; la de 5 tiene 1+3 = 4
```

Más largo, misma idea: construyes residuos de 3 módulo 5 (o al revés).

---

## 4. Soluciones en Java

### (a) Documentar la receta manual (lo que suele querer la entrevista primero)

```java
// Manual sequence for (3, 5) -> 4 in the five-liter jug.
// States written as (small, large).
//
// (0,0) fill large  -> (0,5)
// pour large->small -> (3,2)
// empty small       -> (0,2)
// pour large->small -> (2,0)
// fill large        -> (2,5)
// pour large->small -> (3,4)  // large has 4
```

Dilo en voz alta y luego escribe la comprobación de Bézout para que vean que no adivinas.

### (b) Ayuda de resolubilidad (general m, n, d)

```java
static int gcd(int x, int y) {
    x = Math.abs(x);
    y = Math.abs(y);
    while (y != 0) {
        int t = x % y;
        x = y;
        y = t;
    }
    return x;
}

/** True if you can obtain exactly d liters in one jug of capacities m and n. */
static boolean canMeasure(int m, int n, int d) {
    if (d == 0) {
        return true; // both empty
    }
    if (m + n < d) {
        return false;
    }
    // Exactly d in one jug: d must fit in at least one jug
    if (d > m && d > n) {
        return false;
    }
    return d % gcd(m, n) == 0;
}
```

Para `m = 3`, `n = 5`, `d = 4`: `gcd` es 1, 4 cabe en la de 5, así que true.

### (c) Opcional: BFS sobre estados (lista de pasos más corta)

Útil cuando las capacidades son mayores o piden un programa. El espacio de estados es `(m+1)*(n+1)`.

```java
import java.util.*;

public class WaterJugs {
    record State(int a, int b) {}

    static List<String> measure(int m, int n, int d) {
        if (!canMeasure(m, n, d) && d != 0) {
            return List.of(); // impossible
        }
        if (d == 0) {
            return List.of("start (0,0)");
        }

        Queue<State> q = new ArrayDeque<>();
        Map<State, String> how = new HashMap<>(); // state -> last move label
        Map<State, State> prev = new HashMap<>();

        State start = new State(0, 0);
        q.add(start);
        how.put(start, "start");
        prev.put(start, null);

        while (!q.isEmpty()) {
            State cur = q.poll();
            if (cur.a == d || cur.b == d || cur.a + cur.b == d) {
                // classic "in one jug": prefer a==d or b==d
                if (cur.a == d || cur.b == d) {
                    return reconstruct(cur, prev, how);
                }
            }

            for (Object[] step : neighbors(cur, m, n)) {
                State nxt = (State) step[0];
                String label = (String) step[1];
                if (how.containsKey(nxt)) {
                    continue;
                }
                how.put(nxt, label);
                prev.put(nxt, cur);
                q.add(nxt);
            }
        }
        return List.of(); // unreachable (should not happen if canMeasure)
    }

    static List<Object[]> neighbors(State s, int m, int n) {
        int a = s.a, b = s.b;
        List<Object[]> out = new ArrayList<>();
        out.add(new Object[]{new State(m, b), "fill A"});
        out.add(new Object[]{new State(a, n), "fill B"});
        out.add(new Object[]{new State(0, b), "empty A"});
        out.add(new Object[]{new State(a, 0), "empty B"});

        // pour A -> B
        int pourAB = Math.min(a, n - b);
        out.add(new Object[]{new State(a - pourAB, b + pourAB), "pour A->B"});

        // pour B -> A
        int pourBA = Math.min(b, m - a);
        out.add(new Object[]{new State(a + pourBA, b - pourBA), "pour B->A"});
        return out;
    }

    static List<String> reconstruct(State end, Map<State, State> prev, Map<State, String> how) {
        LinkedList<String> path = new LinkedList<>();
        State cur = end;
        while (cur != null) {
            path.addFirst(how.get(cur) + " -> (" + cur.a + "," + cur.b + ")");
            cur = prev.get(cur);
        }
        return path;
    }

    static boolean canMeasure(int m, int n, int d) {
        if (d == 0) return true;
        if (d > m && d > n) return false;
        if (m + n < d) return false;
        return d % gcd(m, n) == 0;
    }

    static int gcd(int x, int y) {
        x = Math.abs(x);
        y = Math.abs(y);
        while (y != 0) {
            int t = x % y;
            x = y;
            y = t;
        }
        return x;
    }

    public static void main(String[] args) {
        System.out.println(canMeasure(3, 5, 4)); // true
        for (String step : measure(3, 5, 4)) {
            System.out.println(step);
        }
    }
}
```

BFS devuelve un camino más corto. El de seis pasos de arriba es longitud mínima para 4 litros; el más largo "empezar con 3" es válido pero no mínimo.

### Recorrido de la matemática del trasvase

Cuando viertes A en B:

```
spaceInB = n - b
moved = min(a, spaceInB)
newA = a - moved
newB = b + moved
```

Misma idea al revés. Eso es toda la simulación. Sin floats.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Receta manual de 6 pasos | O(1) | O(1) | Vale para 3 y 5 fijos |
| Comprobación Bézout / gcd | O(log min(m,n)) | O(1) | Solo resolubilidad, no los pasos |
| BFS sobre estados | O(m * n) | O(m * n) | Secuencia más corta de operaciones |
| DFS / recursión | mismo orden | pila peores casos | Prefiere BFS para camino más corto |

Para tamaños de entrevista como 3 y 5, dominan las constantes. El test de gcd es la herramienta teórica limpia.

---

## 6. Casos límite

* **Objetivo 0** → ya resuelto: ambas vacías.
* **Objetivo igual a una capacidad** → un solo llenado. Ejemplo: objetivo 3 con jarra de 3.
* **Objetivo mayor que ambas jarras** → imposible si necesitas `d` en una sola jarra.
* **`gcd` no divide a `d`** → imposible. Ejemplo: 4 con jarras 6 y 9.
* **Una capacidad 0** → solo múltiplos de la otra (normalmente 0 y esa capacidad).
* **Misma capacidad** → solo mides 0 o esa capacidad (para una jarra).
* **Preferir 4 en la grande** → comprueba solo `b == 4`, o acepta cualquiera.
* **No inventes medios litros** → todo se queda en enteros.
* **Estilo LeetCode 365** → "puedes medir" solo necesita gcd; "imprime pasos" necesita BFS o una construcción explícita.

Comprobaciones mínimas:

```java
assert canMeasure(3, 5, 4);
assert canMeasure(3, 5, 1);
assert !canMeasure(2, 6, 5);
assert canMeasure(3, 5, 0);
```

---

## 7. Explícaselo a un amigo

Jarras de agua pregunta: con solo llenados completos, vaciados completos y trasvases entre una de 3 y una de 5, ¿puedes obtener exactamente 4 litros?

1. Los movimientos solo producen combinaciones enteras de 3 y 5.
2. Esas combinaciones son múltiplos de `gcd(3, 5) = 1`, así que 4 es posible y cabe en la jarra de 5.
3. Una receta corta: llena 5, vierte en 3, vacía 3, vierte los 2 restantes en 3, llena 5, vierte en 3 hasta llenar. En la de 5 quedan **4**.
4. En código, modela estados `(a, b)` y haz BFS de las seis operaciones si necesitas el camino en automático.
5. En general: resoluble cuando `d % gcd(m, n) == 0` y `d` cabe en al menos una jarra.

Si puedes recorrer la tabla `(0,0) ... (3,4)` en la pizarra, decir "Bézout" sin bloquearte y esbozar un BFS de 24 estados, dominas el problema 6.5.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Hormigas en un triángulo](/blog/es/ctci-6-4-ants-on-a-triangle)
* Siguiente: [Isla de ojos azules](/blog/es/ctci-6-6-blue-eyed-island)