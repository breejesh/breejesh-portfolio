---
title: "The Egg Drop Problem: 100 pisos, 2 huevos, minimizar el peor caso (Java)"
description: "Problema estilo CTCI 6.8 para principiantes: halla el piso critico con dos huevos y 100 pisos minimizando el numero de caidas en el peor caso. Usa intervalos decrecientes para igualar cada camino y resuelve x(x+1)/2 >= 100."
date: "2026-03-29"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-6-8-the-egg-drop-problem.webp
previewImage: /assets/images/ctci-6-8-the-egg-drop-problem.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 6.8 para principiantes: halla el piso critico con dos huevos y 100 pisos minimizando el numero de caidas en el peor caso. Usa intervalos decrecientes para igualar cada camino y resuelve x(x+1)/2 >= 100.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un edificio tiene **100 pisos**. Tienes **dos huevos**. Hay un piso critico `F` tal que un huevo lanzado desde `F` o mas arriba se rompe, y desde cualquier piso por debajo de `F` sobrevive. Los huevos que sobreviven se reutilizan. Los rotos se acaban. No conoces `F` (puede ser del 1 al 100, o incluso "nunca se rompe", segun como modeles el techo). Objetivo: hallar `F` **minimizando el numero de caidas en el peor caso**.

Es un puzzle de estrategia con una forma cerrada limpia para dos huevos. El truco no es busqueda binaria. Eliges pisos de caida para que cada camino de resultado gaste el mismo presupuesto restante. Este post es ensenanza original para principiantes, con **Java** para calcular el numero optimo de caidas y el calendario de pisos. Misma familia que las preguntas clasicas de egg drop en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capitulo 6, matematicas y logica, problema 6.8.

---

## 1. Analogia cotidiana

Estas probando fundas de cristal de movil tirandolas por una escalera. Dos muestras. Si una funda se rompe, esa muestra muere. Aun necesitas el escalon exacto mas bajo donde empieza a romperse.

Si subes un escalon cada vez desde abajo, nunca desperdicias una funda, pero el peor dia son cien subidas.

Si saltas a la mitad y otra vez a la mitad, una rotura temprana te obliga a rastrear cada escalon entre el ultimo aterrizaje seguro y la rotura, con una sola funda. Ese rastreo puede ser largo. La busqueda binaria brilla cuando las muestras son gratis. Aqui escasean.

Asi que planificas como un entrenador con un tiempo fijo. "Permitire como mucho `x` caidas en el peor camino." Cada primer salto deja bastantes escalones abajo para terminar con la segunda funda, y bastantes saltos arriba si la funda sobrevive. Los saltos se acortan a medida que el tiempo restante se reduce. Esa es toda la idea.

---

## 2. Problema en palabras simples

**Montaje:**

* Edificio con `n` pisos (clasico: `n = 100`).
* `k` huevos (clasico: `k = 2`).
* Piso critico `F`: se rompe desde `F` y por encima, sobrevive por debajo de `F`.
* Una caida es un experimento desde un piso con un huevo.
* Los huevos que sobreviven se pueden lanzar otra vez. Los rotos no.
* Debes identificar `F` (o demostrar que no se rompe en ningun piso).

**Objetivo:** elegir una estrategia que **minimice el numero de caidas en el peor caso**. No el caso medio. No "ojala el huevo no se rompa."

**Aclara en una entrevista:**

* Puede el piso 1 ser critico? (Si. A veces se modela `F` de 0 a `n`, donde 0 significa que se rompe incluso desde el 1, y `n+1` que nunca se rompe.)
* Incluye "hallar F" el caso de que nunca se rompe? (Di tu modelo. Cubrir 100 pisos suele significar distinguir el umbral entre 100 posibilidades en el enunciado clasico.)
* Optimizas peor caso o caso esperado con `F` uniforme? (Peor caso en este problema.)
* Cuantos huevos? Quedate en 2 salvo que abran el DP general.

**Formas de firma si codificas helpers:**

```java
// smallest max drops D such that 2 eggs can cover n floors
int minDropsTwoEggs(int floors);

// first-drop floors for a plan with D drops (1-based floor numbers)
int[] dropSchedule(int floors, int drops);
```

**Vista numerica corta (la respuesta que quieres lista):**

Necesitas el menor `x` con:

```
x(x + 1) / 2 >= 100
```

```
13 * 14 / 2 = 91   < 100
14 * 15 / 2 = 105  >= 100
```

Asi que el minimo de caidas en el peor caso para 100 pisos y 2 huevos es **14**.

---

## 3. Piensa primero

### Barrido lineal con un huevo (o tras romperse el primero)

Con un huevo, no hay eleccion: sube de uno en uno desde el ultimo piso seguro. Si saltas, una rotura deja un hueco que no puedes resolver.

Peor caso del lineal puro desde el piso 1: **100** caidas. Correcto, aburrido, y a lo que vuelves cuando se rompe el huevo 1.

### Por que la busqueda binaria simple no es optima

La busqueda binaria parte el rango a la mitad. Con huevos ilimitados va bien. Con dos:

* Primera caida en el piso 50. Si se rompe, el huevo 2 debe barrer 1..49 en lineal. Peor camino: `1 + 49 = 50`.
* Si sobrevive, sigues con dos huevos arriba, pero cada rotura temprana en un corte binario posterior deja un segmento lineal grande.

El peor caso con cortes estilo binario ronda **50**, mucho mejor que 100, lejos del optimo. El problema es el **coste asimetrico**: una rotura te cuesta un huevo y obliga a lineal abajo; una supervivencia solo cuesta una caida. Intervalos de igual tamano ignoran eso.

### Iguala el peor caso restante

Elige un presupuesto `D`: "ningun camino puede usar mas de `D` caidas."

Con 2 huevos y `D` caidas restantes, la primera caida debe ser desde un piso tal que:

1. **Si se rompe:** te quedan `D - 1` caidas y 1 huevo. Puedes comprobar como mucho `D - 1` pisos abajo (lineal). Asi que puedes poner la primera caida en el piso `(D - 1) + 1 = D`.
2. **Si sobrevive:** te quedan `D - 1` caidas y 2 huevos. Repite la misma logica por encima de ese piso.

Asi los intervalos entre intentos sucesivos (mientras quedan ambos huevos) son:

```
D, then D-1, then D-2, ..., then 1
```

Pisos totales que cubres con presupuesto `D`:

```
sum = D + (D - 1) + ... + 1 = D(D + 1) / 2
```

Busca el menor `D` con `D(D + 1) / 2 >= n`.

Para `n = 100`:

| D | D(D+1)/2 | Suficiente? |
| --- | --- | --- |
| 12 | 78 | no |
| 13 | 91 | no |
| 14 | 105 | si |
| 15 | 120 | si, pero peor caso mayor |

**Respuesta: 14.**

### Ejemplo de calendario (pisos, base 1)

Con `D = 14`, primeros pisos de intento mientras viven ambos huevos (acumulado):

```
14,
14 + 13 = 27,
27 + 12 = 39,
39 + 11 = 50,
50 + 10 = 60,
60 + 9  = 69,
69 + 8  = 77,
77 + 7  = 84,
84 + 6  = 90,
90 + 5  = 95,
95 + 4  = 99,
99 + 3  = 102  (clamp to 100; you only need 100 floors)
```

Solo necesitas cobertura de 100, y hay 105 huecos teoricos, asi que los ultimos intervalos pueden encogerse o parar en 100. El peor camino sigue sin pasar de 14 caidas.

### Camino trabajado

Supon `F = 32` (se rompe a partir de 32).

1. Caida en 14: sobrevive.
2. Caida en 27: sobrevive.
3. Caida en 39: se rompe. Queda un huevo. Ultimo seguro = 27.
4. Lineal: 28, 29, 30, 31, 32 (se rompe en 32).

Caidas usadas: intentos con dos huevos mas pasos lineales de 28 a 32. Cuentalo con cuidado en la pizarra; el punto es que cada rama estaba dimensionada para no pasar de 14.

### Generalizacion (si preguntan)

Con `k` huevos y `D` caidas, la recurrencia clasica es:

```
floors(D, k) = 1 + floors(D - 1, k - 1)  // break
             + floors(D - 1, k)          // survive
```

Base: `floors(0, *) = 0`, `floors(*, 1) = D` (lineal), `floors(D, 0) = 0`. Para `k = 2` colapsa a los numeros triangulares de arriba. La entrevista 6.8 quiere la forma cerrada de 2 huevos; el DP es extra.

---

## 4. Solucion en Java (calcular caidas optimas)

El razonamiento resuelve el puzzle. El codigo muestra que puedes calcular `D`, listar el calendario y, si quieres, buscar `D` por binaria para un `n` arbitrario.

### Menor D con cobertura triangular

```java
/** Sum 1+2+...+d. Careful with overflow for huge d. */
static long triangular(int d) {
    return (long) d * (d + 1) / 2;
}

/**
 * Minimal worst-case drops for 2 eggs and {@code floors} floors.
 * Smallest d with d*(d+1)/2 >= floors.
 */
static int minDropsTwoEggs(int floors) {
    if (floors <= 0) {
        return 0;
    }
    int d = 1;
    while (triangular(d) < floors) {
        d++;
        // optional guard for absurd inputs
        if (d > floors) {
            return floors; // linear is always enough
        }
    }
    return d;
}
```

Para 100 pisos devuelve **14**.

### Forma cerrada (opcional, mas rapida)

Resuelve `d(d+1)/2 >= n` con la formula cuadratica:

```
d ≈ ceil( (-1 + sqrt(1 + 8n)) / 2 )
```

```java
static int minDropsTwoEggsClosed(int floors) {
    if (floors <= 0) {
        return 0;
    }
    // ceil( (-1 + sqrt(1+8n)) / 2 )
    double d = Math.ceil((-1.0 + Math.sqrt(1.0 + 8.0 * floors)) / 2.0);
    int ans = (int) d;
    // float safety: bump until coverage holds
    while (triangular(ans) < floors) {
        ans++;
    }
    while (ans > 1 && triangular(ans - 1) >= floors) {
        ans--;
    }
    return ans;
}
```

En la pizarra, el bucle o la tabla "prueba 13 y luego 14" basta. Menciona la forma cerrada si quieres puntos de estilo.

### Construir un calendario de primeras caidas

```java
/**
 * Floors (1-based) where you attempt while both eggs remain,
 * for a plan with {@code drops} budget covering {@code floors}.
 * Stops at or before {@code floors}.
 */
static int[] dropSchedule(int floors, int drops) {
    if (floors <= 0 || drops <= 0) {
        return new int[0];
    }
    java.util.ArrayList<Integer> list = new java.util.ArrayList<>();
    int floor = 0;
    int step = drops;
    while (floor < floors && step >= 1) {
        floor = Math.min(floors, floor + step);
        list.add(floor);
        if (floor >= floors) {
            break;
        }
        step--;
    }
    int[] out = new int[list.size()];
    for (int i = 0; i < list.size(); i++) {
        out[i] = list.get(i);
    }
    return out;
}
```

### Verificacion rapida

```java
static void demo() {
    int n = 100;
    int d = minDropsTwoEggs(n);
    System.out.println("min worst-case drops = " + d); // 14
    System.out.println("coverage = " + triangular(d)); // 105

    System.out.println(minDropsTwoEggs(91));  // 13
    System.out.println(minDropsTwoEggs(92));  // 14
    System.out.println(minDropsTwoEggs(1));   // 1
    System.out.println(minDropsTwoEggs(0));   // 0

    int[] plan = dropSchedule(n, d);
    System.out.println(java.util.Arrays.toString(plan));
    // [14, 27, 39, 50, 60, 69, 77, 84, 90, 95, 99, 100] style sequence
}
```

### Extremos de un huevo y huevos infinitos (guion de entrevista)

```java
// 1 egg: must linear scan
static int minDropsOneEgg(int floors) {
    return Math.max(floors, 0);
}

// unlimited eggs: binary search worst case
static int minDropsUnlimitedEggs(int floors) {
    if (floors <= 0) {
        return 0;
    }
    return (int) Math.ceil(Math.log(floors + 1) / Math.log(2)); // rough model; state your floor numbering
}
```

Con 2 huevos estas entre esos extremos: mejor que lineal, peor que binario puro, y la matematica es triangular.

---

## 5. Tabla de complejidad

| Enfoque | Caidas en peor caso (n=100, 2 huevos) | Notas |
| --- | --- | --- |
| Lineal desde el piso 1 | 100 | Optimo si solo hay 1 huevo |
| Primer corte binario, luego lineal al romperse | ~50 | Ignora el coste asimetrico |
| Intervalos iguales de tamano s | unos n/s + s | Ajustable, suele ser peor que pasos decrecientes |
| Intervalos decrecientes D, D-1, ... | **14** | Optimo para 2 huevos |
| DP general k huevos | depende de k | Exceso para el 6.8 clasico |

Tiempo para **calcular** `D` con el while: O(sqrt(n)) iteraciones porque `D ~ O(sqrt(n))`. Forma cerrada: aritmetica O(1) mas un ajuste minimo. Construir el calendario es O(D).

La metrica de entrevista que importa es **caidas en el peor caso**, no el CPU del planificador.

---

## 6. Casos limite y errores comunes

Los entrevistadores tocan estos:

* **n = 1:** respuesta 1. Un piso, una caida te dice si se rompe o no.
* **n = 0:** respuesta 0.
* **Exactamente triangular:** `n = 91` necesita 13, no 14. El off-by-one en la desigualdad es comun.
* **n = 100:** debe ser 14. Si alguien dice 13, la cobertura es solo 91 pisos.
* **Tras romperse el primer huevo:** fuerza barrido lineal. Saltar pisos con un huevo es fallo duro.
* **Optimizar el caso medio** con `F` uniforme: otro objetivo. Este problema es peor caso.
* **Modelar F = 0 .. n vs 1 .. n:** di cuantos resultados distintos necesitas. El argumento triangular cubre "cuantos pisos de informacion" compras con presupuesto D.
* **Tres huevos:** pueden pedir la recurrencia. No finjas que la respuesta sigue siendo 14 sin recalcular.

Errores comunes:

1. **Declarar la busqueda binaria optima** porque "log 100 es unos 7." Eso asume huevos gratis.
2. **Usar hueco fijo 10** (caida en 10, 20, 30, ...): el peor caso es 10 + 9 = 19 cuando se rompe en 10 y barres 1..9 despues, o similar. Peor que 14.
3. **Resolver x^2 = 100 → x = 10** y parar. Necesitas `x(x+1)/2`, no `x^2`.
4. **Olvidar que los intervalos se encogen.** Paso constante deja los caminos tardios mas baratos que los de rotura temprana; puedes reequilibrar.
5. **Contar solo las caidas del primer huevo** e ignorar el tramo lineal del segundo en el peor caso.
6. **Desbordamiento entero** en `d * (d + 1)` para n enormes si usas `int` a la ligera. Usa `long` en el producto.

Humo minimo:

```java
assert minDropsTwoEggs(100) == 14;
assert minDropsTwoEggs(91) == 13;
assert minDropsTwoEggs(92) == 14;
assert triangular(14) == 105;
assert minDropsTwoEggsClosed(100) == 14;
```

---

## 7. Resumen para un amigo

Dos huevos, 100 pisos, minimizar el peor dia.

1. Con un huevo, subes de uno en uno. Nunca saltes.
2. La busqueda binaria gasta peor caso porque una rotura en una mitad grande fuerza un rastreo largo.
3. Fija un presupuesto de caidas `D`. Separa intentos para que rotura y supervivencia terminen en `D` caidas totales.
4. Eso hace huecos `D, D-1, ..., 1`. La cobertura es el numero triangular `D(D+1)/2`.
5. El menor `D` con `D(D+1)/2 >= 100` es **14** (91 se queda corto, 105 basta).
6. En Java, sube `d` hasta que el triangulo cubra `n`, o usa la forma cuadratica con un ajuste de seguridad.

Si puedes derivar "por que 14" en una servilleta sin memorizar el numero, dominas el problema 6.8. Siguiente en la serie: un puzzle de conteo puro con taquillas.

---

## Serie

* Guia: [Guia de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [The Apocalypse](/blog/es/ctci-6-7-the-apocalypse)
* Siguiente: [100 Lockers](/blog/es/ctci-6-9-100-lockers)