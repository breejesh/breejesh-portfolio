---
title: "Pairwise Swap: Intercambiar bits impares y pares con máscaras (Java)"
description: "Problema estilo CTCI 5.7 para principiantes: intercambia cada par de bits impar y par en un int. Máscaras 0xaaaaaaaa y 0x55555555, un shift a cada lado, OR de las mitades."
date: "2025-11-10"
tags: [Algoritmos]
coverImage: /assets/images/ctci-5-7-pairwise-swap.webp
previewImage: /assets/images/ctci-5-7-pairwise-swap.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 5.7 para principiantes: intercambia cada par de bits impar y par en un int. Máscaras 0xaaaaaaaa y 0x55555555, un shift a cada lado, OR de las mitades.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Alineas a 32 personas en los lugares numerados del 0 al 31. El lugar 0 y el 1 intercambian. El 2 y el 3 intercambian. El 4 y el 5, y así. Todos se mueven a la vez. Nadie salta su par. Eso es **pairwise swap** sobre los bits de un entero: cada bit par cambia de sitio con el bit impar de al lado.

Esta entrada es enseñanza original para principiantes en **Java**. Misma familia de problemas que las preguntas clásicas de bits en entrevistas, no una copia del libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 5, manipulación de bits, problema 5.7.

---

## 1. Analogía cotidiana

Piensa en una fila de interruptores. Van en pares: (0, 1), (2, 3), (4, 5), ... En cada par intercambias qué interruptor físico "tiene" el estado on/off de su compañero. Si el 0 estaba encendido y el 1 apagado, después el 0 queda apagado y el 1 encendido. Los demás pares hacen lo mismo en paralelo.

**No** inviertes toda la fila. **No** rotas todo el número un bit. Solo intercambias dentro de cada par adyacente.

En papel suena a un bucle de 16 pares. En bits lo haces con unas pocas instrucciones y máscaras.

---

## 2. Enunciado en palabras simples

**Entrada:** un `int` de 32 bits `x` (trata el ancho como fijo).

**Salida:** un `int` donde el bit `0` y el bit `1` se intercambiaron, el `2` y el `3`, el `4` y el `5`, y así hasta el `30` y el `31`.

**Nombres (LSB = bit 0):**

* **Bits pares:** posiciones `0, 2, 4, ..., 30`
* **Bits impares:** posiciones `1, 3, 5, ..., 31`

Pairwise swap: para cada `i` en `0, 2, 4, ...`, intercambia los bits en `i` e `i + 1`.

**Ejemplos (8 bits para verlo claro; la idea escala a 32):**

| Bits de entrada (MSB→LSB) | Tras pairwise swap | Por qué |
| --- | --- | --- |
| `0101 0110` | `1010 1001` | cada par `(b1 b0)` pasa a `(b0 b1)` |
| `0000 0001` (1) | `0000 0010` (2) | el bit 0 pasó al bit 1 |
| `0000 0010` (2) | `0000 0001` (1) | el bit 1 pasó al bit 0 |
| `1111 1111` | `1111 1111` | todo unos: el swap no cambia nada |
| `0000 0000` | `0000 0000` | cero sigue en cero |

Un par: entrada `... ab` (a = bit impar, b = bit par) se convierte en `... ba`.

**Aclara antes de codear:**

* El bit 0 es el menos significativo? (Sí en este post y en el `int` de Java habitual.)
* `int` con signo en Java? Sí. Prefiere el **shift derecho sin signo** `>>>` al mover la mitad impar hacia abajo, para que el bit de signo no rellene con unos.
* Quieren O(1) ops de bits, no un bucle de 16? Cuando dicen "la menor cantidad de instrucciones posible", buscan la forma con máscaras.

---

## 3. Piensa primero

### Bucle ingenuo

Para `i = 0; i < 32; i += 2`:

1. Lee el bit `i` y el bit `i + 1`.
2. Escribe el bit `i` en la posición `i + 1` y el bit `i + 1` en `i`.

Funciona. Unas 16 iteraciones, cada una con shifts y máscaras. Claro, pero no es la respuesta de "pocas instrucciones".

### Mejor idea: mover mitades enteras a la vez

Si pudieras:

1. Sacar **solo** los bits impares, desplazarlos **un lugar a la derecha** (caen en los slots pares).
2. Sacar **solo** los bits pares, desplazarlos **un lugar a la izquierda** (caen en los slots impares).
3. Hacer **OR** de los dos resultados.

Entonces cada par se intercambia en paralelo. Sin bucle.

Necesitas dos máscaras:

* **Máscara impar** `0xaaaaaaaa` = binario `1010 1010 ... 1010`. Unos solo en posiciones impares.
* **Máscara par** `0x55555555` = binario `0101 0101 ... 0101`. Unos solo en posiciones pares.

Recuerda: `0xA` es `1010`, `0x5` es `0101`. Ocho dígitos hex cubren 32 bits.

```
x          =  ... a b a b a b a b   (a = impar, b = par)
x & 0xAA.. =  ... a 0 a 0 a 0 a 0
>>> 1      =  ... 0 a 0 a 0 a 0 a   (impares a slots pares)

x & 0x55.. =  ... 0 b 0 b 0 b 0 b
<< 1       =  ... b 0 b 0 b 0 b 0   (pares a slots impares)

OR         =  ... b a b a b a b a   (pares intercambiados)
```

Ese es todo el algoritmo.

### Por qué no `>>` para la mitad impar?

En Java, `>>` extiende el signo. Si el bit 31 es 1, `x >> 1` rellena arriba con unos. Solo quieres que los bits impares elegidos bajen un lugar. Usa `>>>` (shift lógico) después de enmascarar.

---

## 4. Solución en Java

```java
/**
 * Swap odd and even bits of a 32-bit int.
 * Bit 0 <-> 1, bit 2 <-> 3, ..., bit 30 <-> 31.
 */
int swapOddEvenBits(int x) {
    int oddsMovedRight = (x & 0xaaaaaaaa) >>> 1;
    int evensMovedLeft = (x & 0x55555555) << 1;
    return oddsMovedRight | evensMovedLeft;
}
```

En una línea (mismas ops):

```java
int swapOddEvenBits(int x) {
    return ((x & 0xaaaaaaaa) >>> 1) | ((x & 0x55555555) << 1);
}
```

Los literales hex están bien. Si alguien prefiere nombres:

```java
private static final int ODD_BITS  = 0xaaaaaaaa; // 1010...
private static final int EVEN_BITS = 0x55555555; // 0101...

int swapOddEvenBits(int x) {
    return ((x & ODD_BITS) >>> 1) | ((x & EVEN_BITS) << 1);
}
```

### Opcional: recorrido con un valor chico

Toma `x = 0b_0000_0000_0000_0000_0000_0000_0010_0110`, que es `38` decimal.

Low 8 bits de 38, MSB→LSB como `00100110` (bit 0 a la derecha es 0):

| Paso | Low 8 bits | Nota |
| --- | --- | --- |
| `x` | `00100110` | bit0=0, bit1=1, bit2=1, bit3=0, bit4=0, bit5=1, bit6=0, bit7=0 |
| `x & 0xAA` | `00100010` | solo posiciones impares |
| `>>> 1` | `00010001` | impares en slots pares |
| `x & 0x55` | `00000100` | solo posiciones pares (bit2) |
| `<< 1` | `00001000` | pares en slots impares |
| OR | `00011001` | valor 25 |

Chequeo manual de pares:

* bits (1,0): `10` → `01`
* bits (3,2): `01` → `10`
* bits (5,4): `10` → `01`
* bits (7,6): `00` → `00`

Resultado low 8: `00011001`. Cuadra.

---

## 5. Complejidad y "pocas instrucciones"

| Enfoque | Tiempo | Espacio extra | Sensación de instrucciones |
| --- | --- | --- | --- |
| Bucle de 16 pares | O(1) (32 bits fijos), más ops | O(1) | muchos shifts/máscaras |
| Dos máscaras + shift + OR | O(1) | O(1) | unas 5 ops de bits |

En entrevistas importa la **forma con máscaras**, no el big-O. Treinta y dos es constante de cualquier modo. "La menor cantidad de instrucciones posible" significa: no camines bit a bit si una máscara a nivel de palabra alcanza.

En un `long` de 64 bits usarías `0xaaaaaaaaaaaaaaaaL` y `0x5555555555555555L` igual.

---

## 6. Casos borde y errores frecuentes

* **Todo ceros / todo unos** → identidad. El swap no cambia el valor.
* **Números negativos** → solo un patrón de bits. `>>>` en la mitad impar deja el resultado bien; no uses `>>` aritmético si dependes de ceros limpios en los huecos.
* **Solo `<< 1` sobre todo el número** → es multiplicar por 2 / desplazar todo, no pairwise swap.
* **Intercambiar bytes o nibbles vecinos** → otro problema. Pairwise swap es solo pares de **bits**.
* **Máscaras al revés** → `0xaaaaaaaa` para impares, `0x55555555` para pares con LSB = bit 0.
* **Olvidar el OR** → te quedas con una sola mitad de los bits.
* **Bucle que muta mientras lee** → fácil pisar un bit que aún necesitás; mejor armar un resultado nuevo.

Test mínimo:

```java
System.out.println(swapOddEvenBits(0));          // 0
System.out.println(swapOddEvenBits(1));          // 2
System.out.println(swapOddEvenBits(2));          // 1
System.out.println(swapOddEvenBits(38));         // 25
System.out.println(swapOddEvenBits(0xffffffff)); // -1 (todos los bits siguen en 1)
System.out.println(swapOddEvenBits(0xaaaaaaaa)); // 0x55555555
System.out.println(swapOddEvenBits(0x55555555)); // 0xaaaaaaaa
```

Si `swap(swap(x)) == x` para ints aleatorios, tu función es una involución, como debe ser pairwise swap. Chequeo barato en un unit test.

---

## 7. Resumen para contárselo a un amigo

Pairwise Swap pregunta: intercambia el bit 0 con el 1, el 2 con el 3, y así, con casi ninguna instrucción.

1. Enmascara impares con `0xaaaaaaaa`, shift derecho 1 (`>>>`).
2. Enmascara pares con `0x55555555`, shift izquierdo 1.
3. OR de las dos mitades.
4. Cada par se mueve en paralelo. Sin bucle de pares.
5. Usa `>>>` lógico para que un bit alto en 1 no rellene mal con unos.

Si dibujas un ejemplo de 8 bits, nombras ambas máscaras de memoria, y explicas por qué `>>>` gana a `>>` acá, dominas el 5.7. Lo que sigue en el capítulo es dibujar una línea horizontal en un buffer de pantalla empaquetado en bits.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Conversion](/blog/es/ctci-5-6-conversion)
* Siguiente: [Draw Line](/blog/es/ctci-5-8-draw-line)