---
title: "CTCI 1.3 URLify: reemplazar espacios con %20 desde el final"
description: "Codificación URL in-place sobre un char array con longitud real. Cuenta espacios, recorre hacia atrás y escribe %20 sin pisar caracteres que aún necesitas."
date: "2025-10-31"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-1-3-urlify.webp
previewImage: /assets/images/ctci-1-3-urlify.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Codificación URL in-place sobre un char array con longitud real. Cuenta espacios, recorre hacia atrás y escribe %20 sin pisar caracteres que aún necesitas.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Las URLs no pueden llevar espacios en crudo. Un espacio se convierte en el token de tres caracteres `%20`. Las versiones de entrevista de este problema no te piden llamar a un helper de biblioteca. Te dan un `char[]` que ya tiene espacio extra al final, más la **longitud real** de la cadena (cuántos caracteres importan antes del relleno). Tu trabajo es reescribir el array in place.

Este es el problema **1.3** del capítulo Arrays and Strings del set clásico estilo CTCI. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide).

---

## Analogía cotidiana

Imagina una fila de asientos de teatro. Los primeros trece asientos tienen a las personas reales. Al final de la fila hay asientos vacíos de sobra.

Cada persona de pie (un espacio) necesita tres asientos en lugar de uno: las letras `%`, `2` y `0`. Si empiezas a acomodar desde el **frente**, cada persona detrás de ti tiene que moverse a la derecha una y otra vez. Es lento y fácil de estropear.

Si empiezas desde el **fondo**, primero ocupas los asientos vacíos y colocas personas (o `%20`) en huecos libres. Nadie que aún debas mover se sobreescribe. Ese es todo el truco.

---

## El problema en palabras simples

**Entrada**

* `chars`: un array de caracteres. La cadena real vive en los índices `0 .. trueLength - 1`. El resto del array es buffer de sobra.
* `trueLength`: cuántos caracteres de contenido real existen (no la longitud total del array).

**Salida**

* El mismo array, editado para que cada espacio de la cadena real se reemplace por `%`, `2`, `0`.
* El tipo de retorno suele ser `void` (mutar in place) o el string final para probar con facilidad.

**Supuestos que conviene decir en voz alta**

1. El array tiene capacidad suficiente para la expansión. Cada espacio añade dos caracteres extra.
2. Solo importan los espacios dentro de la región de longitud real. Los caracteres de relleno del buffer no son "espacios de contenido."
3. En Java, usa `char[]` para poder escribir in place. Construir un `String` nuevo con `StringBuilder` resuelve otro problema (está bien mencionarlo como camino fácil, luego haz la versión in-place).

**Ejemplo clásico**

```
Input:  chars = ['M','r',' ','J','o','h','n',' ','S','m','i','t','h',' ',' ',' ',' ']
        trueLength = 13
Output: ['M','r','%','2','0','J','o','h','n','%','2','0','S','m','i','t','h']
```

La cadena `"Mr John Smith"` tiene longitud 13 y dos espacios. La longitud final es `13 + 2 * 2 = 17`.

---

## Cómo pensar antes de codear

### Idea fuerza bruta (y por qué duele)

Recorre de izquierda a derecha. Cuando ves un espacio, desplaza cada carácter posterior dos posiciones a la derecha y luego escribe `%20`. Cada desplazamiento es `O(n)` por espacio, así que muchos espacios acaban en algo cercano a `O(n²)`. El entrevistador pedirá algo mejor.

### Mejor idea: editar desde el final

1. Cuenta cuántos espacios hay en la región de longitud real.
2. Calcula el índice final de escritura: necesitas `trueLength + 2 * spaceCount` huecos (índices de `0` hasta ese número menos uno).
3. Recorre la cadena real de derecha a izquierda.
4. Si el carácter no es espacio, cópialo al siguiente hueco libre desde el final.
5. Si es espacio, escribe `'0'`, luego `'2'`, luego `'%'` (siguiendo hacia atrás, para que los tres caracteres queden en orden al leer de izquierda a derecha).

Por qué funciona hacia atrás: cada escritura cae en un hueco que era buffer o que ya tenía un carácter que terminaste de procesar. Nunca pisas entrada aún no leída.

---

## Solución en Java

```java
public final class Urlify {
    private Urlify() {}

    /**
     * Replaces spaces with %20 in place.
     * chars must have room for the expansion: trueLength + 2 * spaceCount.
     */
    public static void urlify(char[] chars, int trueLength) {
        if (chars == null || trueLength < 0 || trueLength > chars.length) {
            throw new IllegalArgumentException("bad length");
        }

        int spaces = 0;
        for (int i = 0; i < trueLength; i++) {
            if (chars[i] == ' ') {
                spaces++;
            }
        }

        // Index of the last slot we will write into.
        int write = trueLength + spaces * 2 - 1;

        if (write >= chars.length) {
            throw new IllegalArgumentException("array too small for %20 expansion");
        }

        for (int read = trueLength - 1; read >= 0; read--) {
            char c = chars[read];
            if (c == ' ') {
                chars[write] = '0';
                chars[write - 1] = '2';
                chars[write - 2] = '%';
                write -= 3;
            } else {
                chars[write] = c;
                write--;
            }
        }
    }

    /** Convenience for tests: build a padded char array from a string and true length. */
    public static String urlifyString(String s, int trueLength) {
        int spaces = 0;
        for (int i = 0; i < trueLength; i++) {
            if (s.charAt(i) == ' ') {
                spaces++;
            }
        }
        int finalLen = trueLength + spaces * 2;
        char[] chars = new char[finalLen];
        for (int i = 0; i < trueLength; i++) {
            chars[i] = s.charAt(i);
        }
        urlify(chars, trueLength);
        return new String(chars);
    }
}
```

### Recorrido del ejemplo

Inicio: contenido real `"Mr John Smith"`, dos espacios, `write` empieza en el índice `16`.

| Paso | char leído | Acción | write después |
| --- | --- | --- | --- |
| 1 | `h` | copiar a 16 | 15 |
| 2 | `t` | copiar a 15 | 14 |
| 3 | `i` | copiar a 14 | 13 |
| 4 | `m` | copiar a 13 | 12 |
| 5 | `S` | copiar a 12 | 11 |
| 6 | espacio | escribir `%20` en 9-11 | 8 |
| 7 | `n` | copiar a 8 | 7 |
| ... | ... | seguir | ... |
| últimos espacios / letras | ... | terminar al frente | listo |

Al terminar, el array contiene `"Mr%20John%20Smith"`.

---

## Complejidad

| Medida | Costo | Por qué |
| --- | --- | --- |
| Tiempo | `O(n)` | Un pase para contar espacios, uno para reescribir. `n` es `trueLength`. |
| Espacio extra | `O(1)` | Solo unos enteros. La salida reutiliza el array dado. |

Si el entrevistador permite un string nuevo, `StringBuilder` también es `O(n)` en tiempo y `O(n)` de espacio extra. La versión in-place es el punto de este enunciado.

---

## Casos borde que pican los entrevistadores

* **Cero espacios:** la longitud final es igual a `trueLength`. El bucle inverso solo copia cada carácter sobre sí mismo (o al mismo índice si no hay crecimiento). Sigue siendo correcto.
* **Todo espacios:** cada carácter se expande a `%20`. Necesitas capacidad `3 * trueLength`.
* **Espacios al inicio o al final del contenido real:** igual se codifican. `" hi "` con longitud real 4 se vuelve `"%20hi%20"`.
* **Longitud real vacía (`0`):** no hay nada que hacer. Protege longitudes negativas.
* **Array demasiado pequeño:** falla rápido. En pizarra, di la fórmula de capacidad: tamaño final = `trueLength + 2 * spaceCount`.
* **Tabs u otro whitespace:** el problema clásico solo reemplaza el carácter espacio `' '`. Pregunta si cuenta otro whitespace. Por lo general no.
* **Unicode / multi-byte:** `char` en Java es unidad de código UTF-16. Para codificación URL de texto ASCII en entrevista, quédate en espacios.

---

## Errores frecuentes

1. **Editar hacia adelante** y desplazar una y otra vez: cuadrático, y difícil de clavar bajo presión.
2. **Usar `chars.length` como longitud real.** Los espacios de relleno del buffer al final no son contenido. Por eso `trueLength` viene aparte.
3. **Escribir `%`, `2`, `0` en el orden incorrecto al ir hacia atrás.** Recuerda: el hueco más a la derecha de los tres recibe `'0'` primero cuando escribes desde el final.
4. **Off-by-one en `write`.** Empieza en `trueLength + 2 * spaces - 1`, no en `trueLength + 2 * spaces`.
5. **Mutar mientras lees por delante del write head en la dirección equivocada.** Hacia atrás evita esa colisión.

---

## Prueba rápida que puedes ejecutar

```java
public static void main(String[] args) {
    // 13 chars of content, room for two spaces -> +4
    char[] chars = "Mr John Smith    ".toCharArray(); // length 17
    Urlify.urlify(chars, 13);
    System.out.println(new String(chars)); // Mr%20John%20Smith

    System.out.println(Urlify.urlifyString("Mr John Smith", 13));
    System.out.println(Urlify.urlifyString("nospace", 7)); // nospace
    System.out.println(Urlify.urlifyString("  ", 2));      // %20%20
}
```

---

## Explícaselo a un amigo

Tienes un array de caracteres con la cadena real al frente y asientos vacíos al final. Los espacios deben volverse tres caracteres, `%20`. Cuentas los espacios, calculas cuánto crecerá la cadena y recorres desde el último carácter real hacia atrás. Copias letras normales a asientos libres desde el fondo. Cuando topas un espacio, dejas `%20` en tres asientos. Como llenas desde el final, nunca sobreescribes un carácter que aún debas leer. Un pase de conteo, un pase de escritura, tiempo lineal, memoria extra constante.

Siguiente en el Capítulo 1: [Palindrome Permutation](/blog/es/ctci-1-4-palindrome-permutation). Anterior: [Check Permutation](/blog/es/ctci-1-2-check-permutation).