---
title: "The Apocalypse: niños, niñas y una regla que sigue en 50/50 (Java)"
description: "Problema estilo CTCI 6.7 para principiantes: las familias tienen hijos hasta un niño y paran. La proporción niños/niñas sigue cerca de 1:1. Serie infinita y una simulación corta en Java."
date: "2026-04-18"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-7-the-apocalypse.webp
previewImage: /assets/images/ctci-6-7-the-apocalypse.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 6.7 para principiantes: las familias tienen hijos hasta un niño y paran. La proporción niños/niñas sigue cerca de 1:1. Serie infinita y una simulación corta en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un gobierno distópico impone una regla: cada familia sigue teniendo hijos hasta que nace un niño, y entonces para. Nada más después del primer niño. La intuición grita que el mundo se llenará de niñas, largas cadenas GGG...B, más hijas que hijos.

No es así. Con nacimientos justos 50/50, la proporción global de niños a niñas sigue convergiendo a **1:1**.

Este post es enseñanza original para principiantes en **Java**. Misma familia de puzzles de matemáticas en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 6, matemáticas y lógica, problema 6.7.

---

## 1. Analogía cotidiana

Piensa en una moneda justa. Cara = niño, cruz = niña. Cada familia lanza hasta la primera cara y guarda la moneda.

* Algunas familias lanzan una vez: **H**. Un niño. Cero niñas.
* Algunas lanzan **TH**. Una niña y luego un niño.
* Algunas lanzan **TTH**. Dos niñas y luego un niño.
* Familias raras sacan una racha larga de cruces antes de la primera cara.

Toda familia termina con **exactamente un niño**. El número de niñas es aleatorio: 0, 1, 2, 3, ... con probabilidad cada vez menor.

Suma un pueblo entero. Muchas familias de un solo niño. Menos familias con muchas niñas. Las raras familias con montones de niñas son exactamente tan raras que, en el límite, el total de niñas iguala el de niños. La moneda no "conoce" la política. Cada lanzamiento sigue siendo mitad y mitad.

---

## 2. Problema en palabras simples

**Planteamiento (forma clásica):**

* Cada nacimiento es, de forma independiente, niño o niña con probabilidad `1/2`.
* Cada familia sigue teniendo hijos hasta un niño y entonces para.
* Familias independientes. Sin mellizos, sin selección de sexo, sin trucos de mortalidad. Solo la regla de parada.

**Pregunta:** ¿cuál es la proporción de niños a niñas en la población (muchas familias, sentido límite)?

**Lo que la gente suele adivinar:** más niñas que niños, porque algunas familias producen varias niñas antes del niño.

**Lo que demostraremos:** la esperanza de niños por familia iguala la de niñas, ambas 1. Proporción **1:1**. Una simulación con bastantes familias cae cerca del 50% niños.

**Aclara antes de codificar o escribir la prueba:**

* ¿Contamos solo hijos, no padres? (Sí. Niños y niñas entre los hijos.)
* ¿El orden de nacimientos lo fija la política? (Sí: cero o más niñas y luego un niño. Nunca una niña después de un niño en esa familia.)
* ¿Moneda justa? (Sí. Si `P(niño) = p` no es 1/2, la proporción cambia. Por defecto en entrevista es justa.)
* ¿Proporción poblacional o de tipos de familia? (Conteos de niños en la población.)

---

## 3. Piensa primero

### Intuición trampa

"Muchas familias se ven como GGGGB. Ese montón de G debe dominar."

Unidad equivocada. Esas familias son **raras**. La probabilidad de k niñas y luego un niño es `(1/2)^{k+1}`. Cuatro niñas y un niño es solo `1/32` de las familias. Estás sobreponderando las cadenas largas cuando miras un caso extremo.

### Unidad más limpia: una familia, esperanzas

Toda familia produce **exactamente un niño** (el último hijo). Así:

```
E[niños por familia] = 1
```

Niñas: con probabilidad `1/2` el primero es niño, 0 niñas. Con probabilidad `1/4`, patrón GB, 1 niña. Con probabilidad `1/8`, GGB, 2 niñas. Y así.

```
E[niñas] = 0*(1/2) + 1*(1/4) + 2*(1/8) + 3*(1/16) + ...
         = sum_{k=0}^{inf} k * (1/2)^{k+1}
```

Serie estándar: `sum_{k=1}^{inf} k x^k = x / (1-x)^2` para `|x| < 1`.

Aquí `x = 1/2`:

```
sum_{k=1}^{inf} k (1/2)^k = (1/2) / (1/2)^2 = (1/2)/(1/4) = 2
```

Nuestra suma es `sum k * (1/2)^{k+1} = (1/2) * sum k (1/2)^k = (1/2)*2 = 1`.

Así:

```
E[niñas por familia] = 1
E[niños por familia] = 1
proporción niños : niñas = 1 : 1
```

### Otra vista: serie de todos los nacimientos

Cuenta aportaciones esperadas por forma de familia:

| Patrón | Prob | Niños | Niñas | Aporte niños | Aporte niñas |
| --- | --- | --- | --- | --- | --- |
| B | 1/2 | 1 | 0 | 1/2 | 0 |
| GB | 1/4 | 1 | 1 | 1/4 | 1/4 |
| GGB | 1/8 | 1 | 2 | 1/8 | 2/8 |
| GGGB | 1/16 | 1 | 3 | 1/16 | 3/16 |
| ... | ... | 1 | k | ... | ... |

Suma de aportes de niños: `1/2 + 1/4 + 1/8 + ... = 1`.

Suma de aportes de niñas: `0 + 1/4 + 2/8 + 3/16 + ... = 1` (la misma serie de arriba).

### Argumento a nivel de nacimiento (línea corta de entrevista)

Cada hijo nace niño o niña con probabilidad 1/2, independiente de nacimientos previos. La política solo decide **si la familia tiene otro hijo**, no el sexo del siguiente. Sumar nacimientos justos independientes no inventa un sesgo global hacia niñas. La regla correlaciona el tamaño de la familia con niños tempranos, pero no el sexo de un nacimiento concreto.

---

## 4. Serie infinita, escrita limpia

Sea `G` el número de niñas en una familia. `G` es geométrica: fallos antes del primer éxito, probabilidad de éxito `1/2`.

```
P(G = k) = (1/2)^{k+1}   para k = 0, 1, 2, ...
E[G]     = (1 - p) / p   para geométrica fallos-antes-éxito con éxito p
         = (1/2) / (1/2) = 1
```

Niños `B = 1` siempre, así `E[B] = 1`.

Para n familias, total de niños `n`, total de niñas cerca de `n` en esperanza. La proporción de esperanzas es 1. Por la ley de los grandes números la proporción muestral va a 1 cuando n crece.

Si piden de nuevo la forma cerrada de niñas:

```
E[G] = sum_{k=0}^{inf} k (1/2)^{k+1}
     = (1/2) sum_{k=1}^{inf} k (1/2)^k
     = (1/2) * ( (1/2) / (1 - 1/2)^2 )
     = (1/2) * ( (1/2) / (1/4) )
     = (1/2) * 2
     = 1
```

---

## 5. Simulación en Java

La matemática es la prueba. La simulación es el chequeo de estómago en pizarra o en un demo estilo test.

```java
import java.util.Random;

public final class ApocalypseRatio {
    private ApocalypseRatio() {}

    /** Una familia: hijos hasta un niño. Devuelve {niños, niñas}. */
    static int[] oneFamily(Random rng) {
        int boys = 0;
        int girls = 0;
        while (true) {
            // true = boy
            if (rng.nextBoolean()) {
                boys++;
                break;
            } else {
                girls++;
            }
        }
        return new int[] {boys, girls};
    }

    /**
     * Simula n familias. Devuelve {totalBoys, totalGirls}.
     */
    static long[] simulate(int families, long seed) {
        Random rng = new Random(seed);
        long boys = 0;
        long girls = 0;
        for (int i = 0; i < families; i++) {
            int[] bg = oneFamily(rng);
            boys += bg[0];
            girls += bg[1];
        }
        return new long[] {boys, girls};
    }

    public static void main(String[] args) {
        int n = 1_000_000;
        long[] totals = simulate(n, 42L);
        long b = totals[0];
        long g = totals[1];
        double ratioBoys = b / (double) (b + g);
        System.out.printf("families=%d boys=%d girls=%d boyFraction=%.4f%n",
                n, b, g, ratioBoys);
        // expect boys == n, girls ~ n, boyFraction ~ 0.50
    }
}
```

Notas:

* Toda familia aporta exactamente un niño, así que `boys` debe igualar `families` siempre. Assert gratis.
* `girls` es aleatorio alrededor de `families`. Con un millón de familias, la fracción se sienta cerca de 0.5 (error típico del orden de milésimas).
* `Random.nextBoolean()` es una moneda justa para este fin.

Helpers opcionales para un apply de tests:

```java
static void assertInvariants(int families, long seed) {
    long[] t = simulate(families, seed);
    if (t[0] != families) {
        throw new AssertionError("every family has exactly one boy");
    }
    double frac = t[0] / (double) (t[0] + t[1]);
    if (Math.abs(frac - 0.5) > 0.01 && families >= 100_000) {
        throw new AssertionError("ratio drifted too far: " + frac);
    }
}
```

---

## 6. Casos límite y preguntas de seguimiento

Los entrevistadores tocan esto:

* **Moneda injusta:** si `P(niño) = p`, entonces `E[niños] = 1` sigue (paras en el primer niño), y `E[niñas] = (1-p)/p`. Proporción niños:niñas = `1 : (1-p)/p` = `p : (1-p)`. Solo con `p = 1/2` obtienes 1:1.
* **Parar tras dos niños u otras políticas:** cambia la regla de parada y cambia la esperanza. El eslogan "cada nacimiento es justo" sigue por nacimiento, pero los pesos de composición familiar cambian. Rehaz la serie.
* **Contar padres:** si alguien mete madres y padres en "población", ensució la pregunta. Quédate en hijos salvo que pregunten.
* **n pequeño:** con 10 familias la proporción es ruidosa. Explica límite frente a una sola corrida.
* **El último hijo siempre es niño:** cierto, y la gente lo usa para alegar sesgo. Recuerda que el **número** de niñas previas lo equilibra en esperanza.
* **Correlación vs sesgo:** el tamaño familiar se correlaciona con cuántas niñas salieron primero. No es lo mismo que probabilidad de nacimiento sesgada.

Errores comunes:

1. **Promediar proporciones por familia** (niños/niñas de cada una y luego media). Familias con cero niñas tienen proporción indefinida o infinita. Usa conteos totales, o esperanzas de conteos.
2. **Listar solo unos patrones** y no sumar la cola. La cola infinita de familias raras importa para la forma cerrada.
3. **Confundir "la mayoría de familias tienen más niñas"** con "la mayoría de hijos son niñas." De hecho la mayoría de familias tienen cero o una niña (B y GB cubren 3/4). La cola larga sube las niñas hasta igualar a los niños.
4. **Asumir que la política cambia las odds de cada nacimiento.** Solo decide si hay otro nacimiento.

Chequeo mental mínimo sin código:

```
1 familia esperada: 1 niño, 1 niña
1000 familias esperadas: 1000 niños, 1000 niñas
```

---

## 7. Explícaselo a un amigo

La política Apocalypse: hijos hasta un niño, luego parar.

1. Toda familia termina con exactamente un niño. Esperanza de niños = 1.
2. Las niñas siguen un conteo geométrico (fallos antes del primer niño). Esperanza de niñas = 1 con nacimientos justos.
3. Serie infinita: masa de niños `1/2 + 1/4 + 1/8 + ... = 1`. La masa de niñas también suma 1.
4. Cada nacimiento suelto sigue 50/50. La regla solo decide cuándo parar, no el sexo del siguiente.
5. Java: bucle de familias, bucle interno hasta niño, acumula. Assert boys == número de familias; fracción de niñas cerca de 0.5 para n grande.

Si puedes escribir `E[G] = sum k/2^{k+1} = 1` en la pizarra y decir por qué falla el "más niñas" de tripa, dominas el 6.7. Energía de capítulo de mates: la intuición es la trampa, la esperanza es el arreglo.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Blue-Eyed Island](/blog/es/ctci-6-6-blue-eyed-island)
* Siguiente: [The Egg Drop Problem](/blog/es/ctci-6-8-the-egg-drop-problem)