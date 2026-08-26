---
title: "Is Unique: comprobar si un string tiene todos los caracteres distintos (Java)"
description: "Problema estilo CTCI 1.1 para principiantes: decidir si cada caracter de un string aparece solo una vez. Analogia, fuerza bruta, array booleano, HashSet, ordenacion y complejidad."
date: "2025-09-11"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-1-1-is-unique.webp
previewImage: /assets/images/ctci-1-1-is-unique.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 1.1 para principiantes: decidir si cada caracter de un string aparece solo una vez. Analogia, fuerza bruta, array booleano, HashSet, ordenacion y complejidad.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Estás en la entrada de una fiesta pequeña. Cada persona solo puede firmar una vez. Si alguien ya está en la lista, lo detienes. Esa es la idea de "is unique": recorrer caracteres y notar la primera repetición.

Este artículo es enseñanza original para principiantes en **Java**. Misma familia de problemas que los calentamientos clásicos de arrays y strings en entrevistas, no una copia de un libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide).

---

## 1. Analogía cotidiana

Imagina un rollo de pegatinas. Cada pegatina tiene una letra. Las pegas una a una sobre la mesa.

* Si sacas una letra que no has visto, la dejas y sigues.
* Si sacas una letra que ya está en la mesa, el rollo **no es único**.

Un string es ese rollo. Tu trabajo es decir sí (todo distinto) o no (al menos una letra se repite).

---

## 2. Enunciado en palabras claras

**Entrada:** un string `s` (por ejemplo `"abc"`, `"hello"` o `""`).

**Salida:** `true` si cada caracter aparece como mucho una vez; si no, `false`.

**Ejemplos:**

| Entrada | Resultado | Por qué |
| --- | --- | --- |
| `"abc"` | `true` | a, b, c una sola vez cada uno |
| `"hello"` | `false` | `l` aparece dos veces |
| `"Aa"` | `true` si importan mayúsculas (por defecto) | en Java `A` y `a` son distintos |
| `""` | `true` | vacío no tiene duplicados |
| `"a"` | `true` | un solo caracter |

**Aclara antes de codificar** (dilo en voz alta en la entrevista):

* ¿El alfabeto es ASCII (0 a 127), ASCII extendido (0 a 255) o Unicode completo?
* ¿Importan mayúsculas? (`"AbA"` tiene dos `A` si ignoras el caso.)
* ¿Puede ser vacío o null?
* ¿Necesitamos el índice del primer duplicado, o solo sí/no?

En este artículo asumimos: `String` de Java no nulo, sensible a mayúsculas, y a menudo optimizamos para ASCII primero porque las entrevistas adoran ese camino.

---

## 3. Piensa primero (fuerza bruta, luego mejor)

### Fuerza bruta

Para cada índice `i`, mira todos los caracteres posteriores y pregunta si `s.charAt(j)` es igual a `s.charAt(i)`.

* Tiempo: del orden de O(n²) comparaciones para longitud n.
* Espacio: O(1) de memoria extra.
* Vale para strings diminutos. Duele cuando n crece.

```java
boolean isUniqueBrute(String s) {
    int n = s.length();
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (s.charAt(i) == s.charAt(j)) {
                return false;
            }
        }
    }
    return true;
}
```

### Mejor idea: recordar lo ya visto

No hace falta reescanear todo el string por cada caracter. Mantén un **conjunto de caracteres vistos**. Cuando llega uno que ya está, respondes false. Un solo pase.

Es el mismo movimiento mental que la mesa de pegatinas.

### Aún más justo para ASCII: banderas de tamaño fijo

Si solo hay 128 (o 256) códigos posibles, no necesitas un conjunto que crece. Usa un array booleano de ese tamaño. Indexas por el código del caracter. Mismo tiempo O(n), espacio O(1) respecto al alfabeto (no respecto a n).

Atajo útil: si la longitud es mayor que el tamaño del alfabeto, **tiene** que haber duplicado (principio del palomar). Devuelve false al momento.

---

## 4. Soluciones en Java

### (a) Array booleano (ASCII)

Respuesta clásica de entrevista cuando aceptan "asume ASCII".

```java
boolean isUniqueAscii(String s) {
    // Mas caracteres que codigos? Duplicado forzado.
    if (s.length() > 128) {
        return false;
    }

    boolean[] seen = new boolean[128];
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (c >= 128) {
            // Fuera del alfabeto asumido; manejar o rechazar.
            throw new IllegalArgumentException("Non-ASCII char");
        }
        if (seen[c]) {
            return false; // este codigo ya se uso
        }
        seen[c] = true;
    }
    return true;
}
```

**Versión con bits** (misma idea, menos memoria solo para a-z):

Si el string es solo letras inglesas minúsculas (`a` a `z`), 26 banderas caben en un `int` (32 bits). El bit `k` significa "la letra con código `a + k` ya apareció".

```java
boolean isUniqueLowercaseBits(String s) {
    if (s.length() > 26) {
        return false;
    }
    int mask = 0;
    for (int i = 0; i < s.length(); i++) {
        int bit = s.charAt(i) - 'a';
        if (bit < 0 || bit > 25) {
            throw new IllegalArgumentException("Expected a-z only");
        }
        int flag = 1 << bit;
        if ((mask & flag) != 0) {
            return false;
        }
        mask |= flag;
    }
    return true;
}
```

Los bits son adorno opcional. Domina primero el array booleano. Usa bits solo si el alfabeto es diminuto y preguntan por espacio.

### (b) HashSet (sirve para caracteres generales)

```java
import java.util.HashSet;
import java.util.Set;

boolean isUniqueHashSet(String s) {
    Set<Character> seen = new HashSet<>();
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (!seen.add(c)) {
            // add devuelve false si el valor ya estaba
            return false;
        }
    }
    return true;
}
```

Maneja Unicode sin un array fijo de 128 huecos. El espacio crece con los caracteres distintos (hasta n). Claro, fácil de explicar, buen valor por defecto en producción cuando el alfabeto es abierto.

### (c) Ordenar y mirar vecinos (opcional)

Si puedes reordenar una copia de los caracteres, ordénalos. Cualquier duplicado queda al lado.

```java
import java.util.Arrays;

boolean isUniqueSort(String s) {
    char[] chars = s.toCharArray();
    Arrays.sort(chars);
    for (int i = 1; i < chars.length; i++) {
        if (chars[i] == chars[i - 1]) {
            return false;
        }
    }
    return true;
}
```

* Tiempo: O(n log n) por la ordenación.
* Espacio: O(n) por la copia `char[]` (`String` en Java es inmutable).
* Útil cuando no puedes usar estructuras hash pero sí ordenar.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Bucles anidados | O(n²) | O(1) | Sin estructuras extra |
| Array booleano (ASCII) | O(n) | O(1) alfabeto | Asume 128 o 256 códigos |
| Máscara de bits (a-z) | O(n) | O(1) | Solo minúsculas inglesas |
| HashSet | O(n) promedio | O(k) | k = caracteres distintos |
| Ordenar + escanear | O(n log n) | O(n) | Copiar y ordenar |

Prefiere el **array booleano** cuando el alfabeto es fijo y pequeño. Prefiere **HashSet** cuando no puedes asumir ASCII. Prefiere **ordenar** solo si prohíben hash.

---

## 6. Casos límite

Los entrevistadores pican aquí:

* **String vacío** → suele ser `true` (no hay par de caracteres iguales).
* **Un solo caracter** → `true`.
* **Todos iguales** (`"aaaa"`) → `false`.
* **Longitud mayor que el alfabeto** → `false` inmediato en alfabetos fijos.
* **Null** → decide: lanzar excepción o devolver false. No falles en silencio.
* **Espacios y puntuación** → cuentan como caracteres.
* **Unicode / surrogates** → `char` es UTF-16. Un emoji puede usar dos unidades `char`. Para code points estrictos, recorre con `codePoints()`.
* **Mayúsculas** → `"God"` vs `"god"`: distintos si el caso importa.

Envoltorio mínimo seguro ante null:

```java
boolean isUniqueSafe(String s) {
    if (s == null) {
        throw new IllegalArgumentException("string is null");
    }
    return isUniqueHashSet(s);
}
```

---

## 7. Resumen para explicárselo a un amigo

"Is unique" pregunta: ¿este string reutiliza algún caracter?

1. La fuerza bruta compara cada par. Lenta pero correcta.
2. Recuerda lo visto: un conjunto (o banderas booleanas si el alfabeto es fijo).
3. En cada caracter, si ya se vio, devuelve false; si no, márcalo.
4. Si el string es más largo que el alfabeto, el duplicado es inevitable.
5. Ordenar es el plan B cuando puedes copiar, ordenar y mirar vecinos.

Si puedes decir eso en treinta segundos y escribir la versión HashSet o array booleano sin quedarte en blanco, dominas el problema 1.1.

Siguiente en la serie: [Check Permutation](/blog/es/ctci-1-2-check-permutation) (¿dos strings son reordenaciones el uno del otro?).