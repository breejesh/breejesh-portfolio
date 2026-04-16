---
title: "Binary to String: imprime una fraccion en bits o ERROR (Java)"
description: "Problema estilo CTCI 5.2 para principiantes: toma un double en (0, 1), imprime su cadena de fraccion binaria, o ERROR si necesita mas de 32 bits tras el punto. Metodo multiplicar por 2 en Java claro."
date: "2026-04-16"
tags: [Algoritmos]
coverImage: /assets/images/ctci-5-2-binary-to-string.webp
previewImage: /assets/images/ctci-5-2-binary-to-string.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 5.2 para principiantes: toma un double en (0, 1), imprime su cadena de fraccion binaria, o ERROR si necesita mas de 32 bits tras el punto. Metodo multiplicar por 2 en Java claro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes una taza medidora marcada solo en mitades, cuartos, octavos, y asi. Alguien echa un poco de agua: mas que vacia, menos que llena. Quieres escribir que tan llena esta usando solo 0 y 1 despues de un punto binario: `0.101` significa mitad mas un octavo. Algunas cantidades caben en una cadena binaria corta. Otras piden marcas cada vez mas pequenas sin fin. Si te quedas sin espacio tras 32 marcas, paras y dices ERROR. Eso es **binary to string** para un numero real entre 0 y 1.

Este articulo es ensenanza original para principiantes en **Java**. Misma familia de problemas que las preguntas clasicas de bits sobre doubles fraccionarios, no una copia de un libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capitulo 5, manipulacion de bits, problema 5.2.

---

## 1. Analogia cotidiana

Piensa las fracciones binarias igual que las decimales, solo que en base 2.

En decimal, `0.75` significa:

```
7 * (1/10) + 5 * (1/100)
```

En binario, `0.11` significa:

```
1 * (1/2) + 1 * (1/4) = 0.75
```

Asi, cada lugar despues del punto binario pesa la mitad del anterior: 1/2, 1/4, 1/8, 1/16, ...

Como descubres esos bits sin adivinar? Un truco escolar en decimal es multiplicar por 10 y sacar el siguiente digito. Aqui **multiplicas por 2** y sacas el siguiente bit:

1. Empieza con `num` en (0, 1).
2. `num = num * 2`.
3. Si el resultado es al menos 1, el siguiente bit es `1`, y restas 1 para quedarte solo con la parte fraccionaria.
4. Si el resultado sigue siendo menor que 1, el siguiente bit es `0`.
5. Repite hasta que la fraccion sea exactamente 0 (listo) o ya escribiste 32 bits y aun queda resto (ERROR).

Por que funciona: multiplicar por 2 desplaza el punto binario un lugar a la izquierda. El bit entero que sale es exactamente el siguiente digito binario tras el punto.

---

## 2. Enunciado en palabras claras

**Entrada:** un `double num` con `0 < num < 1` (estrictamente entre 0 y 1).

**Salida:** un `String` con forma `"0."` seguido de digitos binarios, por ejemplo `"0.101"`. Si el valor no se puede representar **exactamente** con como maximo **32** bits tras el punto binario, devuelve `"ERROR"`.

**Ejemplos:**

| Entrada (decimal) | Cadena binaria | Por que |
| --- | --- | --- |
| `0.5` | `"0.1"` | una mitad |
| `0.25` | `"0.01"` | un cuarto |
| `0.75` | `"0.11"` | mitad + cuarto |
| `0.625` | `"0.101"` | mitad + octavo |
| `0.1` | `"ERROR"` | 0.1 es periodico en binario; no llega a 0 exacto en 32 bits |
| `0.0` o `1.0` | fuera de rango | el problema asume estrictamente entre 0 y 1 |

**Aclara antes de codear:**

* Se permiten 0 o 1? (Enunciado clasico: entre 0 y 1, sin los extremos.)
* Devolvemos el string o lo imprimimos? (Cualquiera; devolver es mas facil de testear.)
* El limite es 32 bits tras el punto, o 32 caracteres en total con `"0."`? (Di las dos opciones en voz alta. Este articulo usa **32 bits tras el punto**, la intencion habitual al codear.)
* Ruido de punto flotante: un `double` real ya es binario. Aun asi quieren el bucle multiplicar-por-2 y el camino ERROR para casos que no terminan.

Para este articulo: `double` en (0, 1), devolver `"0." + bits` o `"ERROR"`, maximo 32 bits tras el punto.

---

## 3. Piensa primero

### Que no hacer

* Llamar `Integer.toBinaryString` sobre el double entero. Eso es para enteros, no para la parte fraccionaria.
* Imprimir `Double.toHexString` o notacion cientifica. Formato incorrecto.
* Asumir que toda fraccion decimal tiene forma binaria corta. Muchas no. `0.1` en decimal es el contraejemplo clasico, como `1/3 = 0.333...` en decimal.

### Bucle central: multiplicar por 2

```
builder = "0."
while num > 0:
    if builder length (bits tras el punto) ya es 32:
        return ERROR
    num = num * 2
    if num >= 1:
        append '1'
        num = num - 1
    else:
        append '0'
return builder
```

Para cuando `num` llega a 0: lo representaste exacto.

Si necesitarias un bit 33, devuelve ERROR.

### Por que algunos numeros no terminan nunca

Cualquier fraccion cuyo denominador (en terminos minimos) tiene un factor primo distinto de 2 no puede ser expansion binaria finita. Decimal `0.1` es `1/10`. Diez tiene factor 5, asi que la expansion binaria de 0.1 se repite. El bucle sigue produciendo bits y nunca cae en 0 exacto. Tras 32 pasos, abandonas con razon.

### Aviso de punto flotante (dil o una vez y sigue)

Un `double` de Java ya se guarda en forma binaria IEEE-754. Asi que "imprime el binario de este double" tambien puede significar "lee los bits de la mantisa." La entrevista 5.2 suele ser la version **algoritmica**: expande el numero real con multiplicar-por-2, y ERROR si no termina en 32 bits. Compara con 0 con cuidado; para ensenar usamos el bucle simple. En produccion a veces acotas con epsilon, pero en entrevista quieren la regla limpia de ERROR.

---

## 4. Solucion en Java

```java
/**
 * Binary representation of a real number strictly between 0 and 1.
 * Returns "0." followed by bits, or "ERROR" if more than 32 bits are needed.
 */
String binaryToString(double num) {
    if (num <= 0 || num >= 1) {
        return "ERROR";
    }

    StringBuilder bits = new StringBuilder("0.");
    int maxBits = 32;

    while (num > 0) {
        if (bits.length() - 2 >= maxBits) {
            // Already used 32 places after the point and still not zero.
            return "ERROR";
        }

        num = num * 2;
        if (num >= 1) {
            bits.append('1');
            num = num - 1;
        } else {
            bits.append('0');
        }
    }

    return bits.toString();
}
```

### Recorrido: `0.625`

| Paso | `num` antes | tras `* 2` | bit | `num` despues |
| --- | --- | --- | --- | --- |
| 1 | 0.625 | 1.25 | `1` | 0.25 |
| 2 | 0.25 | 0.5 | `0` | 0.5 |
| 3 | 0.5 | 1.0 | `1` | 0.0 |

Resultado: `"0.101"`. El bucle termina porque `num` es 0.

### Recorrido: `0.1` (dara ERROR)

| Paso | idea |
| --- | --- |
| 1 | `0.1 * 2 = 0.2` → bit `0` |
| 2 | `0.2 * 2 = 0.4` → bit `0` |
| 3 | `0.4 * 2 = 0.8` → bit `0` |
| 4 | `0.8 * 2 = 1.6` → bit `1`, resto `0.6` |
| ... | siguen saliendo bits; el resto no cae en 0 exacto en 32 pasos |

Tras 32 bits despues del punto, devuelve `"ERROR"`.

### Pruebas minimas

```java
public static void main(String[] args) {
    System.out.println(binaryToString(0.5));    // 0.1
    System.out.println(binaryToString(0.25));   // 0.01
    System.out.println(binaryToString(0.75));   // 0.11
    System.out.println(binaryToString(0.625));  // 0.101
    System.out.println(binaryToString(0.1));    // ERROR
    System.out.println(binaryToString(0.0));    // ERROR (out of range here)
    System.out.println(binaryToString(1.0));    // ERROR
}
```

Nota: en algunas JVM, un literal como `0.1` ya trae redondeo de punto flotante. El bucle igual no limpia a 0 exacto en 32 bits para valores tipicos que no son racionales diadicos (fracciones con denominador potencia de 2). Eso es lo que quieres para el camino ERROR.

---

## 5. Tabla de complejidad

| Enfoque | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| Bucle multiplicar por 2 | O(1) | O(1) | Como maximo 32 iteraciones; string de longitud ≤ 34 (`"0."` + 32 bits) |
| Precalcular todas las fracciones diadicas | O(1) o peor | mayor | Exceso; quieren el bucle |
| Bit-twiddle de la mantisa IEEE | O(1) | O(1) | Otro problema: volcar bits guardados, no "ERROR si no es exacto en 32" |

Acotado a 32 pasos, tiempo y espacio son constantes para la entrevista.

---

## 6. Casos borde y errores comunes

Los entrevistadores tocan estos:

* **Exactamente 0 o 1** → invalido para este problema, ERROR o rechazo al inicio.
* **Exactamente 0.5, 0.25, 0.125, ...** → binario finito; debe imprimirse limpio y parar.
* **Aun falta resto en el bit 32** → ERROR. El off-by-one en el chequeo de longitud es comun.
* **Comparar con `== 0` para siempre** → en fracciones no diadicas reales confias en el tope de longitud. No gires infinito.
* **Olvidar el prefijo `"0."`** → el formato importa en entrevistas.
* **Usar cast a int en vez de `>= 1`** → `(int) num` tras multiplicar funciona si num esta en [0, 2), pero `>= 1` es mas claro.
* **Meter bits en un char[32] sin contar** → facil saltarte el limite mental.

Errores comunes:

1. **Chequear longitud despues de append, no antes.** Puedes emitir 33 bits una vez. Chequea antes de cada bit nuevo (o despues con `> 32`, de forma coherente).
2. **`num *= 2` y siempre restar 1.** Solo restas cuando el bit es 1.
3. **Bucle infinito sin maximo de longitud.** Todo el punto de ERROR es el presupuesto de 32 bits.
4. **Confundir presupuesto de caracteres con presupuesto de bits.** Acuerda la regla antes de codear.
5. **Creer que ERROR solo es "entrada mala".** ERROR tambien significa "no se puede representar exacto en 32 bits."

---

## 7. Resumen para contarselo a un amigo

Binary to String pide: escribe un double entre 0 y 1 como `"0."` mas digitos binarios, o ERROR si no cabe en 32 bits tras el punto.

1. Cada bit es el siguiente valor de lugar: 1/2, 1/4, 1/8, ...
2. Multiplica la fraccion por 2. La parte entera (0 o 1) es el siguiente bit. Conserva el resto fraccionario.
3. Para cuando el resto es 0: representacion exacta.
4. Si necesitas mas de 32 bits, devuelve `"ERROR"`.
5. Muchos decimales cotidianos (como 0.1) nunca terminan en binario. El tope no es opcional.

Si puedes recorrer `0.625 → 0.101` en la pizarra y explicar por que `0.1` da ERROR, dominas el 5.2.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Insertion](/blog/es/ctci-5-1-insertion)
* Siguiente: [Flip Bit to Win](/blog/es/ctci-5-3-flip-bit-to-win)