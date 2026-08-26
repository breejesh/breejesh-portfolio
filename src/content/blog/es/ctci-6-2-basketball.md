---
title: "Baloncesto: Un tiro frente a encestar 2 de 3 (probabilidad)"
description: "Problema estilo CTCI 6.2 para principiantes: con probabilidad p de acierto, elige Juego 1 (un enceste) o Juego 2 (al menos dos de tres). Álgebra: p frente a 3p^2(1-p)+p^3, y cuándo gana cada uno."
date: "2026-01-12"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-2-basketball.webp
previewImage: /assets/images/ctci-6-2-basketball.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 6.2 para principiantes: con probabilidad p de acierto, elige Juego 1 (un enceste) o Juego 2 (al menos dos de tres). Álgebra: p frente a 3p^2(1-p)+p^3, y cuándo gana cada uno.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Estás bajo el aro. Alguien te ofrece dos juegos de feria. **Juego 1:** un solo tiro; ganas si entra. **Juego 2:** tres tiros; ganas si entran al menos dos. Mismo tirador cada vez. Misma probabilidad `p` de acierto en cada intento. Tiros independientes. ¿Cuál eliges?

La intuición es confusa. Si estás frío, un solo intento puede sentirse más seguro que necesitar dos aciertos. Si estás caliente, tres intentos con barra de dos puede sentirse más seguro que un todo o nada. La entrevista quiere el álgebra que convierte esa sensación en una regla limpia en términos de `p`.

Este post es enseñanza original para principiantes en **Java** (código ligero para comparar las curvas). Misma familia de problemas que los clásicos de matemáticas y lógica en entrevistas, no una copia de un libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 6, puzzles de matemáticas y lógica, problema 6.2.

---

## 1. Analogía cotidiana

Piensa en tiros libres en el parque.

* **Juego 1** es la "bola de dinero": un intento. Si entra, te llevas el premio. La probabilidad de ganar es solo con qué frecuencia sueles encestar: `p`.
* **Juego 2** es un "mini series": tres intentos, necesitas **dos o más** aciertos. Fallas los dos primeros y el tercero no te salva. Encestas los dos primeros y puedes fallar el tercero.

Si tiras muy mal (`p` cerca de 0), necesitar dos aciertos es brutal. Un solo tiro afortunado es la mejor apuesta. Si tiras muy bien (`p` cerca de 1), fallar dos veces es raro, así que el Juego 2 te favorece. En algún punto intermedio los dos juegos empatan. Ese punto es lo que resolvemos.

---

## 2. Enunciado en palabras simples

**Dado:**

* Encestas cada tiro con probabilidad `p`, de forma independiente, `0 <= p <= 1`.
* Juego 1: ganas si haces **1** de **1**.
* Juego 2: ganas si haces **al menos 2** de **3**.

**Hallar:**

* Probabilidad de ganar cada juego en función de `p`.
* Para qué valores de `p` prefieres el Juego 1, el Juego 2, o te da igual.

**Supuestos a decir en voz alta:**

* Los tiros son ensayos de Bernoulli i.i.d. con probabilidad de éxito `p`.
* En el Juego 2 solo importa el recuento de aciertos, no el orden.
* "Preferir" significa mayor probabilidad de ganar (no más diversión esperada ni otra utilidad).

**Forma de firma si piden código:**

```java
// positive: prefer game1; negative: prefer game2; zero: equal
int compareGames(double p)

double probGame1(double p)
double probGame2(double p)
```

**Aclara antes del álgebra:**

* ¿`p` es conocido, o dejamos rangos de `p`? (Rangos de `p`.)
* ¿Tiros independientes? (Sí, enunciado clásico.)
* ¿Exactamente dos, o al menos dos? (**Al menos dos**: MMF, MFM, FMM y MMM.)
* ¿Y `p = 0` y `p = 1`? (Ambos juegos pagan igual: nunca ganas, o siempre ganas.)

---

## 3. Piensa primero

### Probabilidad de ganar el Juego 1

Un tiro. Un acierto.

```
P(Juego1) = p
```

Nada que expandir.

### Probabilidad de ganar el Juego 2

Tres tiros independientes. Ganas con exactamente 2 aciertos o exactamente 3.

Coeficientes binomiales:

* Exactamente 2 aciertos: `C(3, 2) = 3` secuencias: MMF, MFM, FMM. Cada una con probabilidad `p^2 (1-p)`.
* Exactamente 3 aciertos: `C(3, 3) = 1` secuencia: MMM. Probabilidad `p^3`.

```
P(Juego2) = 3 * p^2 * (1 - p) + p^3
          = 3p^2 - 3p^3 + p^3
          = 3p^2 - 2p^3
```

También: "1 menos P(0 aciertos) menos P(1 acierto)":

```
P(0) = (1-p)^3
P(1) = 3 p (1-p)^2
P(Juego2) = 1 - (1-p)^3 - 3p(1-p)^2
```

Mismo polinomio al expandir. La forma "exactamente 2 más exactamente 3" es más corta para comparar con `p`.

### Comprobaciones de cordura antes de comparar

| `p` | Juego1 | Juego2 | Comentario |
| --- | --- | --- | --- |
| 0 | 0 | 0 | ambos imposibles |
| 0.5 | 0.5 | `3*(0.25)-2*(0.125)=0.5` | iguales |
| 1 | 1 | 1 | ambos seguros |
| 0.25 | 0.25 | `3*(0.0625)-2*(0.015625)=0.15625` | mejor Juego1 |
| 0.75 | 0.75 | `3*(0.5625)-2*(0.421875)=0.84375` | mejor Juego2 |

Si tu forma cerrada falla estos cinco puntos, corrige la fórmula antes de las desigualdades.

---

## 4. Álgebra: ¿cuándo es mejor el Juego 1?

Prefieres el Juego 1 cuando `P(Juego1) > P(Juego2)`:

```
p > 3p^2 - 2p^3
p - 3p^2 + 2p^3 > 0
p (1 - 3p + 2p^2) > 0
p (2p^2 - 3p + 1) > 0
```

Factoriza el cuadrático:

```
2p^2 - 3p + 1 = (2p - 1)(p - 1)
```

Comprueba: `(2p - 1)(p - 1) = 2p^2 - 2p - p + 1 = 2p^2 - 3p + 1`. Bien.

Así:

```
p (2p - 1)(p - 1) > 0
```

Tabla de signos de `f(p) = p(2p-1)(p-1)` en `(0, 1)`:

* Puntos críticos: `p = 0`, `p = 1/2`, `p = 1`.
* En `(0, 1/2)`: `p > 0`, `(2p-1) < 0`, `(p-1) < 0` → positivo × negativo × negativo = **positivo** → mejor Juego1.
* En `(1/2, 1)`: `p > 0`, `(2p-1) > 0`, `(p-1) < 0` → positivo × positivo × negativo = **negativo** → mejor Juego2.
* En `p = 1/2`: `f = 0` → iguales.
* En los extremos `0` y `1`: misma probabilidad de ganar (ambos 0, o ambos 1).

### La respuesta (memoriza esta forma)

| Rango de `p` | Prefiere |
| --- | --- |
| `0 < p < 1/2` | **Juego 1** (un tiro) |
| `p = 0`, `p = 1/2`, o `p = 1` | **Indiferente** |
| `1/2 < p < 1` | **Juego 2** (al menos 2 de 3) |

En palabras: **si aciertas menos de la mitad de tus tiros, elige el tiro único. Si aciertas más de la mitad, elige el de tres. En exactamente la mitad (o en los extremos triviales), da igual.**

Encaja con la intuición del parque. Los malos tiradores odian necesitar dos aciertos. Los buenos convierten tres intentos en red de seguridad.

---

## 5. Ayudas en Java (calcular y comparar)

No necesitas código en una pizarra de matemáticas puras, pero un helper pequeño hace comprobables las curvas.

```java
public final class BasketballGames {

    /** P(win Game 1) = p. */
    public static double probGame1(double p) {
        return p;
    }

    /**
     * P(win Game 2) = C(3,2) p^2 (1-p) + C(3,3) p^3
     *               = 3p^2(1-p) + p^3
     *               = 3p^2 - 2p^3
     */
    public static double probGame2(double p) {
        return 3 * p * p * (1 - p) + p * p * p;
    }

    /**
     * +1 prefer Game1, -1 prefer Game2, 0 equal (within epsilon).
     */
    public static int compareGames(double p) {
        if (p < 0.0 || p > 1.0) {
            throw new IllegalArgumentException("p must be in [0, 1], got " + p);
        }
        double d = probGame1(p) - probGame2(p);
        final double eps = 1e-12;
        if (Math.abs(d) <= eps) {
            return 0;
        }
        return d > 0 ? 1 : -1;
    }

    /** Closed-form preference without floating noise near known roots. */
    public static String preferClosedForm(double p) {
        if (p < 0.0 || p > 1.0) {
            throw new IllegalArgumentException("p must be in [0, 1]");
        }
        if (p == 0.0 || p == 0.5 || p == 1.0) {
            return "indifferent";
        }
        return p < 0.5 ? "game1" : "game2";
    }
}
```

### Opcional: barrer el intervalo e imprimir el cambio

```java
public static void main(String[] args) {
    for (int i = 0; i <= 20; i++) {
        double p = i / 20.0;
        double g1 = BasketballGames.probGame1(p);
        double g2 = BasketballGames.probGame2(p);
        String who = BasketballGames.preferClosedForm(p);
        System.out.printf("p=%.2f  g1=%.5f  g2=%.5f  -> %s%n", p, g1, g2, who);
    }
    // p=0.00 ... indifferent
    // p=0.25 ... game1
    // p=0.50 ... indifferent
    // p=0.75 ... game2
    // p=1.00 ... indifferent
}
```

La comparación en coma flotante cerca de `0.5` puede temblar; en la entrevista usa la forma cerrada `p ? 1/2`. Usa los helpers numéricos para **verificar**, no para **descubrir** el umbral solo barriendo.

---

## 6. Recorrido numérico y un error frecuente

### Caso A: tirador frío, `p = 0.2`

```
P1 = 0.2
P2 = 3*(0.04)*(0.8) + 0.008 = 0.096 + 0.008 = 0.104
```

Gana el Juego 1 (`0.2 > 0.104`). Necesitar dos aciertos al 20% duele.

### Caso B: moneda justa, `p = 0.5`

```
P1 = 0.5
P2 = 3*(0.25)*(0.5) + 0.125 = 0.375 + 0.125 = 0.5
```

Iguales. Buen punto de control del álgebra.

### Caso C: tirador caliente, `p = 0.8`

```
P1 = 0.8
P2 = 3*(0.64)*(0.2) + 0.512 = 0.384 + 0.512 = 0.896
```

Gana el Juego 2. Fallar dos de tres es poco probable.

### Errores que la gente comete

1. **Contar solo exactamente dos aciertos** y olvidar tres: subestima el Juego 2 en `p^3`.
2. **Tratar el Juego 2 como "dos seguidos"** en vez de cualquiera dos de tres: evento distinto.
3. **Comparar el número esperado de aciertos** en vez de P(ganar): el Juego 1 espera `p` aciertos, el Juego 2 espera `3p`. Eso responde otra pregunta. Importa la **regla de victoria**.
4. **Asumir tiros dependientes** (cansancio, presión) sin que te lo pidan. Di independencia salvo que el entrevistador añada más.
5. **Resolver `p = 3p^2 - 2p^3` y parar** sin tabla de signos. Las raíces solas no dicen qué lado prefiere qué juego.

---

## 7. Complejidad, bordes, tips de entrevista

| Tema | Respuesta |
| --- | --- |
| Modelo | Tiros Bernoulli independientes con éxito `p` |
| P(Juego1) | `p` |
| P(Juego2) | `3p^2(1-p) + p^3 = 3p^2 - 2p^3` |
| Prefiere Juego1 | `0 < p < 1/2` |
| Prefiere Juego2 | `1/2 < p < 1` |
| Indiferente | `p ∈ {0, 1/2, 1}` |
| Tiempo (forma cerrada) | Aritmética O(1) |
| Espacio extra | O(1) |

**Cómo contarlo (versión de 45 segundos):**

1. El Juego 1 es solo `p`.
2. El Juego 2 es binomial: tres formas de exactamente dos aciertos, una de tres: `3p^2(1-p)+p^3`.
3. Pon `p > 3p^2-2p^3`, factoriza `p(2p-1)(p-1) > 0`.
4. En `(0,1)`, eso vale para `p < 1/2`.
5. Comprueba extremos y `p = 1/2` como empates.

**Seguimientos que puede lanzar el entrevistador:**

* Generalizar a "hacer `k` de `n`" frente a un tiro: misma idea, polinomios más feos.
* ¿Y si la probabilidad cambia tras un fallo? Muere la independencia; hace falta un árbol de casos.
* Riesgo: si el premio es enorme y eres amante del riesgo, la utilidad puede no ser P(ganar). La respuesta clásica CTCI se queda en P(ganar).

**Vecinos de la serie:**

* Puzzle anterior: [La pastilla pesada](/blog/es/ctci-6-1-the-heavy-pill).
* Siguiente estilo embaldosado / color: [Dominós](/blog/es/ctci-6-3-dominos).

---

## 8. Resumen para contárselo a un amigo

Baloncesto (problema 6.2) es una **comparación de probabilidades**, no un grind de código.

1. La chance del Juego 1 es `p`.
2. La del Juego 2 es al menos dos de tres tiros independientes: `3p^2(1-p) + p^3`.
3. Simplifica a `3p^2 - 2p^3`.
4. Prefieres Juego 1 cuando `p > 3p^2 - 2p^3`, que factoriza a `p(2p-1)(p-1) > 0`.
5. Entre 0 y 1, fuera de las raíces: **elige un tiro si `p < 1/2`, elige dos-de-tres si `p > 1/2`.** En `0`, `1/2` y `1` empatan.

Si escribes ambas probabilidades, factorizas la desigualdad y nombras el cambio en un medio sin mirar apuntes, dominas el 6.2.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [La pastilla pesada](/blog/es/ctci-6-1-the-heavy-pill)
* Siguiente: [Dominós](/blog/es/ctci-6-3-dominos)