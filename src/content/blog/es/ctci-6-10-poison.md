---
title: "Poison: encontrar la botella envenenada con 10 tiras en un mes (Java)"
description: "Problema estilo CTCI 6.10 para principiantes: 1000 botellas, una envenenada, 10 tiras de prueba, el resultado tarda un mes. Codifica cada botella como patrón de bits para que una ronda de sorbos la nombre."
date: "2026-03-22"
tags: [Algoritmos]
coverImage: /assets/images/ctci-6-10-poison.webp
previewImage: /assets/images/ctci-6-10-poison.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 6.10 para principiantes: 1000 botellas, una envenenada, 10 tiras de prueba, el resultado tarda un mes. Codifica cada botella como patrón de bits para que una ronda de sorbos la nombre.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Tienes **1000 botellas** de refresco. Exactamente **una** está envenenada. Tienes **10 tiras de prueba**. Una tira se queda limpia o se vuelve positiva tras probar veneno. Cada test necesita un **mes** completo antes de leer el resultado, y solo tienes un mes. ¿Cómo encuentras la botella envenenada?

Esto es un puzzle de razonamiento primero, código después. El truco es binario: trata cada botella como un número y deja que cada tira actúe como un bit. Este post es enseñanza original para principiantes, con **Java** opcional para codificar sorbos y decodificar resultados. Misma familia de puzzles de teoría de la información en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Aquí cierra el capítulo 6, matemáticas y lógica.

---

## 1. Analogía cotidiana

Imagina 1000 briks de zumo sellados. Uno está estropeado. Tienes diez papeles de tornasol y una noche antes de la fiesta. Cada papel solo se puede mirar por la mañana, así que tienes **un solo lote** de tests, no un árbol de búsquedas con seguimientos.

Si mojas la tira 1 en el brik 1, la 2 en el 2, y así, solo cubres diez briks. La búsqueda binaria necesita muchas rondas porque cada resultado debe llegar antes de elegir el siguiente grupo. No tienes muchas rondas.

Dale a cada brik un **ID binario**. El brik 13 es `0000001101` en diez bits. Por cada bit que es `1`, ese brik deja una gota en el papel correspondiente. Por la mañana, el patrón de papeles sucios es exactamente el ID binario del brik estropeado. Diez papeles, diez bits, hasta 1024 IDs. Solo necesitas 1000.

---

## 2. Problema en palabras simples

**Montaje:**

* 1000 botellas, etiquetadas `0` a `999` (o `1` a `1000`; elige una y manténla).
* Exactamente una botella está envenenada. El resto es seguro.
* 10 tiras de prueba. Cada tira puede usarse en la única ronda sorbiendo una mezcla de gotas de varias botellas.
* Si una tira prueba veneno (aunque esté mezclado con líquido seguro), se vuelve **positiva** tras un mes. Si no, se queda **negativa**.
* Lanzas **una** ronda de tests ahora, esperas un mes, lees todas las tiras a la vez.

**Objetivo:** nombrar la botella envenenada a partir de esa lectura.

**Supuestos a dejar claros en entrevista:**

* El veneno es lo bastante fuerte: cualquier cantidad positiva en una tira la dispara (sin líos de dilución).
* Las tiras no dan falsos positivos ni negativos.
* Exactamente una botella envenenada (ni cero ni dos).
* Mezclar gotas en una tira está permitido y es gratis.
* No puedes lanzar una segunda ronda tras ver resultados (el presupuesto de tiempo es un mes).

**Forma de la firma si codificas un simulador:**

```java
// bottle ids 0..999; strips 0..9
// returns which bottles strip s should sip
int[] bottlesForStrip(int stripIndex, int bottleCount);

// after one month: positive[s] is true if strip s turned positive
// recover the poisoned bottle id
int decodePoisonedBottle(boolean[] positive);
```

O, más honesto para el puzzle:

```java
// given the true poisoned bottle, simulate sips + one month, recover the id
int identifyPoisoned(int truePoisoned, int bottleCount, int stripCount);
```

**Vista numérica pequeña (8 botellas, 3 tiras):**

Botellas `0..7`, tiras para bits `0, 1, 2` (bit 0 = menos significativo):

| Botella | Binario | Sorbos en tiras |
| --- | --- | --- |
| 0 | 000 | ninguna |
| 1 | 001 | 0 |
| 2 | 010 | 1 |
| 3 | 011 | 0, 1 |
| 4 | 100 | 2 |
| 5 | 101 | 0, 2 |
| 6 | 110 | 1, 2 |
| 7 | 111 | 0, 1, 2 |

Si la botella **5** está envenenada, las tiras **0** y **2** salen positivas, la **1** limpia. Lectura en bits: `101` binario = **5**.

Con **10** tiras cubres `2^10 = 1024` patrones, suficiente para 1000 botellas con margen.

---

## 3. Piensa primero

### Por qué fallan el estilo secuencial o la búsqueda binaria

Una botella por tira: 10 botellas cubiertas, 990 sin tocar. Inútil.

Búsqueda binaria: mitad de las botellas en la tira 1, espera un mes, luego la mitad de la mitad restante, y así. Son unos `log2(1000) ≈ 10` **rondas**, o sea unos **10 meses**. El problema te congela en **un** mes.

### Presupuesto de información

Cada tira tiene 2 resultados: positiva o negativa. Diez tiras independientes dan `2^10 = 1024` patrones posibles. Necesitas distinguir 1000 posibilidades (qué botella es mala). **1024 ≥ 1000**, así que en teoría una ronda basta. La pregunta es cómo mapear botellas a patrones.

### Codifica el índice de la botella como patrón de tiras

Numera las botellas de `0` a `999`. Escribe cada índice en binario con hasta 10 bits:

```
bottle b -> bits b0 b1 ... b9
  where bi = 1 if (b & (1 << i)) != 0
```

**Codificación (lo que haces hoy):**

* Para cada tira `i` en `0..9`:
  * la tira `i` sorbe una gota de cada botella `b` donde el bit `i` de `b` está activo.

**Decodificación (lo que haces en un mes):**

* Sea `result = 0`.
* Para cada tira `i`, si la tira `i` es positiva, activa el bit `i` en `result`: `result |= (1 << i)`.
* `result` es el índice de la botella envenenada.

Por qué funciona: solo la botella envenenada aporta veneno. La tira `i` se vuelve positiva **si y solo si** la botella envenenada tiene el bit `i` activo. El vector de resultados de las tiras es exactamente la representación binaria de esa botella.

### Etiquetas 1..1000 vs 0..999

Ambas valen.

* **0..999:** los patrones son los propios números. La botella 0 no sorbe nada. Si todas las tiras quedan negativas, la botella 0 es la envenenada (solo si permites la botella 0).
* **1..1000:** usa el binario de la etiqueta, o de `label - 1`. Dilo en voz alta. `2^10 = 1024` sigue cubriendo 1..1000.

Al entrevistador le importa que **inventes el mapa de bits**, no que memorices "usa índices desde 0".

### Variantes que salen en la mesa

* **Varias botellas envenenadas:** un patrón puede colisionar. Hacen falta más tiras u otro código (corrección de errores / group testing).
* **Tiras reutilizables en varias rondas con tiempo:** otro problema; más información a lo largo del tiempo.
* **Solo k tiras, n botellas:** hace falta `2^k >= n` para una ronda, o más rondas si el tiempo lo permite.
* **Falsos positivos:** entonces hace falta codificación redundante. Fuera del 6.10 clásico.

---

## 4. Solución en Java (simulación)

El puzzle se resuelve razonando. El código muestra que puedes implementar encode y decode sin off-by-ones en los índices de bits.

### Decodificar resultados de tiras a id de botella

```java
/**
 * positive[i] == true means strip i turned positive after one month.
 * Returns bottle id in 0 .. (2^strips - 1).
 */
static int decodePoisonedBottle(boolean[] positive) {
    int id = 0;
    for (int i = 0; i < positive.length; i++) {
        if (positive[i]) {
            id |= (1 << i);
        }
    }
    return id;
}
```

### ¿De qué botellas sorbe la tira i?

```java
/**
 * Bottles are 0 .. bottleCount-1.
 * Strip i sips every bottle whose bit i is set.
 */
static boolean stripSipsBottle(int stripIndex, int bottleId) {
    return ((bottleId >> stripIndex) & 1) == 1;
}
```

### Simular una botella envenenada real

```java
/**
 * bottleCount typically 1000, stripCount typically 10.
 * truePoisoned is 0-based in [0, bottleCount).
 */
static int identifyPoisoned(int truePoisoned, int bottleCount, int stripCount) {
    if (truePoisoned < 0 || truePoisoned >= bottleCount) {
        throw new IllegalArgumentException("truePoisoned out of range");
    }
    if ((1 << stripCount) < bottleCount) {
        throw new IllegalArgumentException("not enough strips for one round");
    }

    boolean[] positive = new boolean[stripCount];
    for (int strip = 0; strip < stripCount; strip++) {
        // strip turns positive iff the poisoned bottle has this bit set
        // (equivalent to mixing all bottles with that bit and waiting)
        positive[strip] = stripSipsBottle(strip, truePoisoned);
    }
    int found = decodePoisonedBottle(positive);
    if (found >= bottleCount) {
        throw new IllegalStateException("decoded id outside bottle range: " + found);
    }
    return found;
}
```

El bucle de arriba es el atajo matemático: no necesitas recorrer cada botella si ya sabes cuál está envenenada. En una versión de "laboratorio real" construirías la mezcla de cada tira con todas las botellas que encajan, y solo el veneno verdadero volcaría las tiras del mismo modo.

### Construcción explícita de la mezcla (más clara para enseñar)

```java
static int identifyPoisonedByMixing(int truePoisoned, int bottleCount, int stripCount) {
    boolean[] positive = new boolean[stripCount];
    for (int strip = 0; strip < stripCount; strip++) {
        boolean gotPoison = false;
        for (int bottle = 0; bottle < bottleCount; bottle++) {
            if (!stripSipsBottle(strip, bottle)) {
                continue;
            }
            // drop from this bottle goes on the strip
            if (bottle == truePoisoned) {
                gotPoison = true;
            }
        }
        positive[strip] = gotPoison;
    }
    return decodePoisonedBottle(positive);
}
```

### Autocomprobación de los 1000 casos

```java
static void verifyAll() {
    int bottles = 1000;
    int strips = 10;
    for (int p = 0; p < bottles; p++) {
        int a = identifyPoisoned(p, bottles, strips);
        int b = identifyPoisonedByMixing(p, bottles, strips);
        if (a != p || b != p) {
            throw new AssertionError("failed for bottle " + p);
        }
    }
    System.out.println("ok: all " + bottles + " bottles identified");
}
```

### Números trabajados

Botella **326** envenenada, 10 tiras, ids desde 0:

```
326 in binary (bits 0 = LSB on the right when written normally):
  326 = 256 + 64 + 4 + 2
      = 2^8 + 2^6 + 2^2 + 2^1
  bits set: 1, 2, 6, 8

Strips that go positive: 1, 2, 6, 8
decode: (1<<1) | (1<<2) | (1<<6) | (1<<8) = 2 + 4 + 64 + 256 = 326
```

Caso pequeño de 3 tiras, botella 5:

```
positive = [true, false, true]  // strips 0 and 2
id = 1 | 4 = 5
```

### Opcional: listar botellas de una tira (día de preparación)

```java
static java.util.List<Integer> bottlesForStrip(int stripIndex, int bottleCount) {
    java.util.ArrayList<Integer> list = new java.util.ArrayList<>();
    for (int b = 0; b < bottleCount; b++) {
        if (stripSipsBottle(stripIndex, b)) {
            list.add(b);
        }
    }
    return list;
}
```

La tira 0 sorbe cada botella impar. La tira 9 sorbe botellas con el bit `2^9 = 512` activo (512..1023 en el espacio de 10 bits; solo importan las menores que 1000).

---

## 5. Tabla de complejidad

| Enfoque | Rondas de test | Tiras | Notas |
| --- | --- | --- | --- |
| Una botella por tira | 1 | 10 | solo 10 botellas cubiertas |
| Grupos de búsqueda binaria | ~10 | 1+ | hace falta un resultado antes del siguiente corte; ~10 meses |
| Codificación binaria por bits | **1** | 10 | cubre hasta 1024 botellas |
| Mezclas al azar sin plan | 1 | 10 | suelen colisionar o dejar huecos |

En código, construir todas las mezclas a lo largo es `O(botellas * tiras)`. Decodificar es `O(tiras)`. El coste interesante en la entrevista es **rondas de espera = 1**, no el big-O en la CPU.

---

## 6. Casos límite y errores habituales

Los entrevistadores tocan estos:

* **Botella 0 envenenada (desde 0):** todas las tiras negativas. Es un codeword válido. Si las etiquetas empiezan en 1, dilo y no digas "todo negativo = no hay veneno" salvo que el problema permita cero venenos.
* **Botella 999:** los bits de 999 caben en 10 bits (`999 < 1024`). Bien.
* **Botella 1000 con etiquetas 1-based:** también bien; 1000 sigue por debajo de 1024.
* **Pocas tiras:** 9 tiras cubren solo 512 botellas. Di el chequeo `2^k >= n`.
* **Numeración MSB vs LSB de tiras:** elige tira `i` = bit `i` y sé coherente en encode y decode.
* **Re-testear tras resultados:** prohibido por el límite de tiempo. No describas un algoritmo multi-ronda salvo que te lo pidan de seguimiento.
* **Dos botellas envenenadas:** el OR de dos patrones puede parecer una tercera botella. El clásico asume exactamente una.
* **Capacidad de la tira / número de gotas:** ignóralo salvo que el entrevistador añada restricciones.

Errores habituales:

1. **Describir búsqueda binaria** e ignorar el bloqueo de un mes por test.
2. **Usar tiras como "grupos de 100"** sin una firma única por botella.
3. **Off-by-one en etiquetas** (0 vs 1) y el decode queda desplazado.
4. **Confundir índice de bit e índice de tira** (encode con bit 0 en tira 0, decode con bit 0 en tira 9).
5. **Decir que hacen falta 1000 tiras** o una tira por botella.
6. **Olvidar que la botella 0 no sorbe nada** y entrar en pánico cuando todas las tiras están limpias.

Idea mínima de smoke:

```java
verifyAll();
System.out.println(identifyPoisoned(0, 1000, 10));   // 0
System.out.println(identifyPoisoned(5, 1000, 10));   // 5
System.out.println(identifyPoisoned(326, 1000, 10)); // 326
System.out.println(identifyPoisoned(999, 1000, 10)); // 999
System.out.println(bottlesForStrip(0, 8)); // odds: 1,3,5,7
```

---

## 7. Resumen para un amigo

Mil botellas, una envenenada, diez tiras, un mes.

1. Solo tienes **una** ronda de test. La búsqueda binaria es demasiado lenta en tiempo de calendario.
2. Diez tiras dan `2^10 = 1024` patrones de resultado. Basta para nombrar cualquiera de 1000 botellas.
3. Numera botellas `0..999`. Escribe cada número en binario.
4. La tira `i` sorbe cada botella cuyo bit `i` es `1`.
5. Tras un mes, las tiras positivas forman un número binario. Ese número **es** la botella envenenada.
6. En código, encode con `(bottle >> i) & 1`, decode con `id |= (1 << i)` por cada tira positiva.

Si puedes explicar por qué el vector de tiras es el id de la botella sin programar, dominas el 6.10. El capítulo 6 cierra con diseño puro de información: mides una vez, lees un patrón de bits, y listo.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [100 Lockers](/blog/es/ctci-6-9-100-lockers)
* Siguiente: [Deck of Cards](/blog/es/ctci-7-1-deck-of-cards)