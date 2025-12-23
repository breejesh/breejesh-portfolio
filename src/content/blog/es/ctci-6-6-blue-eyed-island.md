---
title: "Isla de ojos azules: conocimiento común e inducción para principiantes"
description: "Problema estilo CTCI 6.6: n isleños de ojos azules se van la noche n después de que el gurú diga veo a alguien con ojos azules. Caso base, paso inductivo y conocimiento común sin jerga densa."
date: "2025-12-23"
tags: [Algoritmos]
coverImage: /assets/images/ctci-6-6-blue-eyed-island.webp
previewImage: /assets/images/ctci-6-6-blue-eyed-island.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 6.6: n isleños de ojos azules se van la noche n después de que el gurú diga veo a alguien con ojos azules. Caso base, paso inductivo y conocimiento común sin jerga densa.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un ferry sale cada noche a medianoche. Quien **haya deducido el color de sus propios ojos** debe subir y marcharse para siempre. Los isleños son lógicos perfectos. Ven los ojos de todos los demás. No hay espejos, ni fotos, ni charlas del tipo "tus ojos son azules". Durante años la vida es tranquila. Entonces un visitante dice en público: **"Veo a alguien con ojos azules."**

La primera noche no parece cambiar nada. Ni la segunda. Luego, si había `n` personas de ojos azules, **las `n` se van juntas la noche `n`**.

Este post es enseñanza original para principiantes. Misma familia que los clásicos de ojos azules / niños con barro, no una copia de un libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 6, matemáticas y lógica, problema 6.6. El producto es el razonamiento. El Java opcional solo modela el contador de noches para `n` pequeño.

---

## 1. Analogía cotidiana

Imagina un aula donde cada alumno tiene una pegatina azul o marrón en la frente. Nadie ve la suya. Todos ven las de los demás. La regla: si deduces que la tuya es azul, te levantas y te vas al final del día.

Durante mucho tiempo el profesor no menciona pegatinas. Los de azul ya ven otras azules (si las hay). Los de marrón ven las azules. Nadie se ve obligado a irse.

Entonces el profesor dice en voz alta, de modo que todos oyen y todos ven que todos oyeron:

> "Veo al menos una pegatina azul."

La frase suena vacía si ya viste una azul. El poder no es un dato nuevo de píxeles sobre el aula. El poder es la **certeza compartida**: ahora cada alumno sabe que cada alumno sabe que hay al menos una pegatina azul, y así sube la cadena. Eso se llama **conocimiento común**. Solo con observación privada, la pila infinita de "sé que sabes que sé..." estaba incompleta para quienes la necesitaban.

El resto del acertijo es **inducción**: prueba la afirmación para 1 pegatina azul, y luego muestra que si vale para `k` azules, vale para `k + 1`.

---

## 2. Enunciado en palabras simples

**Montaje (forma estándar):**

* Los isleños tienen ojos azules o marrones (solo estos dos en la historia).
* Hay `n` personas de ojos azules y un número positivo de marrones (los marrones son "los otros"; en la resolución clásica no se van).
* Todos ven los ojos de todos los demás. Nadie ve los suyos.
* No hay comunicación sobre el color de ojos. Memoria perfecta. Lógica perfecta. Confían en que los demás también son lógicos perfectos.
* Un ferry sale cada noche a medianoche. Si deduces que tus ojos son azules, te vas esa noche.
* Antes del visitante, todos han vivido con estas reglas mucho tiempo y **nadie se ha ido**.

**El anuncio público (día 0, de día):**

Un gurú / visitante anuncia al grupo entero:

> "Puedo ver a alguien que tiene ojos azules."

**Pregunta:** ¿qué ocurre, y cuándo?

**Respuesta a la que apuntar:**

* Si `n = 1`, esa única persona de ojos azules se va la **noche 1**.
* Si `n = 2`, las dos se van la **noche 2**.
* En general, las `n` personas de ojos azules se van la **noche `n`**.
* Las de ojos marrones se quedan.

**Aclara antes de "resolver":**

* ¿El anuncio es público y se sabe que todos lo oyeron? (Sí. Eso carga el peso.)
* ¿Se van solo al saber que son **azules**, o al saber cualquier color? (Forma clásica CTCI: te vas cuando sabes que tienes ojos azules. Los marrones no sacan esa deducción solo con este anuncio.)
* ¿Es posible cero ojos azules antes del gurú en los modelos mentales? (Sí. El gurú mata la rama "quizá cero" en la vista pública.)
* Ferry simultáneo: sí. Quien sepa se va la misma noche.

---

## 3. Piensa primero: inducción sin niebla

### Qué significa inducción aquí (versión principiante)

Quieres una afirmación `P(n)`:

> Si hay exactamente `n` personas de ojos azules, y el gurú ha hablado, entonces las `n` se van la noche `n`.

**Caso base:** prueba `P(1)`.

**Paso inductivo:** asume que `P(k)` es verdad para algún `k >= 1` fijo. Prueba `P(k + 1)`.

Entonces `P(n)` vale para todo entero positivo `n`.

No "esperas" que el patrón continúe. Encadenas una garantía: 1 funciona, y cada tamaño hereda del tamaño uno menor.

### Qué ve cada persona de ojos azules

La persona `B` con ojos azules (aún no lo sabe) mira alrededor:

* Ve **`n - 1`** otras personas de ojos azules.
* Ve algunas de ojos marrones.

Desde la vista privada de `B`, el mundo podría tener `n - 1` azules (si `B` es marrón) o `n` azules (si `B` es azul). La inducción trata de cómo esos dos mundos divergen noche a noche tras el anuncio del gurú.

### Por qué importa la frase del gurú (conocimiento común)

Antes del gurú:

* Si `n >= 1`, cada persona de ojos marrones ya ve al menos un azul.
* Si `n >= 2`, cada persona de ojos azules ya ve al menos un azul.

Así que para la mayoría, "existe alguien de ojos azules" es **noticia vieja** como hecho bruto. Faltaba un **pistoletazo público y sincronizado** que meta ese hecho en conocimiento común:

1. Todos saben que hay al menos un azul.
2. Todos saben que todos saben que hay al menos un azul.
3. Todos saben que todos saben que todos saben... y así.

Sin esa pila, el reloj de inducción no arranca. Con ella, la gente puede anidar expectativas: "Si yo no soy azul, las personas que veo se comportarán como una isla de tamaño `(n-1)` tras un anuncio de conocimiento común."

---

## 4. Solución: caso base y luego subir

### Caso base: `n = 1`

Llama **A** a la única persona de ojos azules.

* A mira y ve **cero** ojos azules.
* Antes del gurú, A podía pensar: "Quizá no hay ojos azules; quizá soy marrón."
* El gurú dice: "Veo a alguien con ojos azules."
* A es la única persona que ve cero azules. Ese alguien debe ser A.
* A deduce "tengo ojos azules" el día 0 tras el discurso, y se va la **noche 1**.

Los demás ya ven los ojos azules de A. Esperaban que A pudiera irse si es el único azul. Cuando A se va la noche 1, el mundo encaja. Los marrones siguen sin aprender que son marrones de un modo que fuerce una salida por azul; no son azules.

`P(1)` se cumple.

### Dos personas: `n = 2` (el paso que se siente)

Llámalas **A** y **B**, ambas azules. El gurú habla el día 0.

Lo que ve A: exactamente un azul (B). Así que A piensa:

> O soy marrón y hay 1 azul (B), o soy azul y hay 2 azules.

Si A es marrón, desde el punto de vista de B la isla es un mundo azul de **tamaño 1**. Por el caso base, B debería irse la **noche 1**.

Llega la noche 1. B sigue ahí. (B corre el argumento simétrico sobre A.)

A sabe que el mundo "soy marrón, solo B es azul" está muerto. Así que A tiene ojos azules. Igual para B.

Las dos se van la **noche 2**.

El movimiento clave no es telepatía. Es **expectativa fallida**:

> Esperaba que la persona que veo se fuera la noche 1 si yo no soy azul. No se fue. Por tanto soy azul.

### Tres personas: `n = 3`

A, B, C todas azules. Cada una ve **dos** azules.

Modelo privado de A:

* Si soy marrón, entonces B y C viven en un mundo de tamaño 2 con conocimiento común del gurú.
* Por el caso `n = 2`, B y C deberían irse ambas la **noche 2**.

Noche 1: nadie se va (como se espera incluso en el submundo de tamaño 2, porque el tamaño 2 se va la noche 2).
Noche 2: sigue sin irse nadie.

La hipótesis "soy marrón" de A muere. A deduce azul. Igual B y C. Las tres se van la **noche 3**.

### Paso inductivo: asume `P(k)`, prueba `P(k + 1)`

Asume: siempre que hay exactamente `k` azules y el gurú ha hablado, se van todas la noche `k`.

Ahora el mundo real tiene `k + 1` azules. Elige cualquier persona de ojos azules `X`.

* `X` ve exactamente `k` azules.
* `X` considera: "Si soy marrón, esas `k` personas forman una instancia de tamaño `k` con conocimiento común. Por la hipótesis inductiva se van la noche `k`."
* Pasan las noches `1` a `k`. Las `k` personas que `X` ve siguen en la isla (cada una espera el mismo reloj de expectativa fallida).
* Así que la rama "soy marrón" de `X` es falsa. `X` tiene ojos azules.
* Toda persona de ojos azules corre el mismo argumento. Las `k + 1` se van la noche `k + 1`.

Eso es `P(k + 1)`. Cierra la inducción. Para cualquier `n`, las `n` azules se van la noche `n`.

### ¿Y las personas de ojos marrones?

Una persona de ojos marrones `Y` ve las `n` azules. Tras el gurú, `Y` espera que esas `n` se vayan la noche `n` (por el teorema). Cuando lo hacen, el mundo encaja con "hay `n` azules y yo no soy una de ellas" en un sentido suave, pero la regla del ferry en este acertijo es descubrir **que tienes ojos azules**. Los marrones nunca tienen una noche en la que la única forma de explicar una partida que falta sea "debo ser azul". Su color es coherente con todo lo que ven. Se quedan.

### Por qué años de espera no hicieron nada, y el gurú lo cambió todo

Antes del gurú no había ancla pública en el día 0 ni cadena de conocimiento común de "al menos un azul". Cada persona podía inventar una isla más pequeña en su cabeza sin reloj compartido. El visitante no entrega un espejo. El visitante arranca el reloj de inducción que todos ven que todos corren.

---

## 5. Tabla noche a noche y simulación opcional

### Tabla noche a noche

| Azules reales `n` | Lo que ve cada azul | Primera noche en que esperaba que otros se fueran si "soy marrón" | Noche real de partida |
| --- | --- | --- | --- |
| 1 | 0 | (ningún otro azul; el gurú fuerza el yo) | Noche 1 |
| 2 | 1 | Noche 1 | Noche 2 |
| 3 | 2 | Noche 2 | Noche 3 |
| `n` | `n - 1` | Noche `n - 1` | Noche `n` |

Patrón que puedes decir en voz alta:

> Cada persona de ojos azules espera a que el grupo que ve se vaya la noche igual al conteo que ve. Cuando esa noche falla, sube al siguiente ferry.

### Java opcional: contador de noches para `n` pequeño

No puedes "simular toda la lógica epistémica" en veinte líneas. Sí puedes codificar la **forma cerrada** que prueba la inducción, y un bucle pequeño que imprime la historia para `n = 1..5`.

```java
/** Night when all n blue-eyed people leave after a day-0 common-knowledge announcement. */
static int departureNight(int n) {
    if (n < 1) {
        throw new IllegalArgumentException("n must be at least 1");
    }
    return n; // P(n): leave on night n
}

static void narrate(int n) {
    System.out.println("True blue count n = " + n);
    System.out.println("  Each blue sees " + (n - 1) + " blue(s).");
    if (n == 1) {
        System.out.println("  Sees zero blues; guru implies self. Leaves night 1.");
        return;
    }
    System.out.println("  If I were brown, the " + (n - 1)
            + " I see would leave on night " + (n - 1) + ".");
    System.out.println("  They stay. I deduce blue. All " + n
            + " leave on night " + departureNight(n) + ".");
}

public static void main(String[] args) {
    for (int n = 1; n <= 5; n++) {
        narrate(n);
    }
}
```

Salida mental de ejemplo:

```
True blue count n = 1
  Each blue sees 0 blue(s).
  Sees zero blues; guru implies self. Leaves night 1.
True blue count n = 2
  Each blue sees 1 blue(s).
  If I were brown, the 1 I see would leave on night 1.
  They stay. I deduce blue. All 2 leave on night 2.
...
```

Si el entrevistador quiere código, basta para mostrar que la respuesta es el `n` inductivo, no una búsqueda sobre grafos de islas. Si quiere la prueba, recorre `n = 1`, `n = 2` y el paso general. Esa es la entrevista de verdad.

### Desvíos habituales

1. **"Todos ya veían ojos azules, así que el gurú no dijo nada nuevo."** El conocimiento privado no es conocimiento común. La cadena anidada "ellos saben que yo sé" es la pieza que faltaba.
2. **"Se van la mañana del anuncio."** Solo la persona con `n = 1` puede actuar la noche 1. Con `n` mayor hacen falta expectativas fallidas en noches previas.
3. **"Los de ojos marrones también se van."** No en el enunciado clásico. Nunca deducen "tengo ojos azules."
4. **"La inducción es circular porque necesitan el teorema."** Los isleños no necesitan la palabra "inducción." Necesitan razonamiento por casos anidados que termina en 1. Los matemáticos empaquetan ese anidamiento como inducción.
5. **"Cualquier frase pública serviría."** Tiene que fijar el hecho base en conocimiento común. "Veo ojos azules" es exactamente el átomo base que necesita la persona de tamaño 1, y que todos saben que esa persona usaría.

---

## 6. Complejidad, bordes y tips de entrevista

| Tema | Respuesta |
| --- | --- |
| Técnica central | Inducción matemática + conocimiento común |
| Forma cerrada | `n` azules se van la noche `n` |
| "Tiempo" del proceso social | `n` noches tras el anuncio |
| Código | Opcional O(1) `return n`; narración O(1) por `n` |
| Acertijos relacionados | Niños con barro, suma y producto, variantes de isla de ojos azules |

**Bordes y seguimientos:**

* **`n = 0`:** un gurú veraz no diría que ve a alguien de ojos azules. Fuera del acertijo si el gurú siempre dice la verdad.
* **Gurú se equivoca / miente:** el modelo se rompe; los lógicos perfectos necesitan un hecho público de confianza.
* **Alguien se va pronto por error:** destruye la señal de expectativa fallida. El acertijo asume sin ruido.
* **Más de dos colores de ojos:** misma inducción sobre el color distinguido que mencionó el gurú, si la regla es "vete cuando sepas que tienes ese color."
* **Pueden irse con cualquier color al saberlo:** entonces los marrones también pueden deducir en algunas variantes. Quédate con la regla ferry solo-azul salvo que el entrevistador la cambie.
* **Tiempo continuo vs noches discretas:** el ferry discretiza ventanas de observación para que "no se fueron la noche k" sea un evento público nítido.

**Cómo contarlo (versión 45 segundos):**

1. El gurú hace común el conocimiento de "hay al menos un azul."
2. Si veo 0 azules, me voy la noche 1.
3. Si veo 1 azul, espero que se vaya la noche 1; si no, me voy la noche 2.
4. Por inducción, si veo `k` azules, espero que se vayan la noche `k`; si no, me voy la noche `k + 1`.
5. Con conteo real `n`, todos los azules se van la noche `n`.

**Dónde aparece fuera del acertijo:**

* Sistemas distribuidos: conocimiento común frente a "todos recibieron el mensaje."
* Diseño de protocolos: broadcasts públicos que sincronizan máquinas de estados.
* Señal de entrevista: ¿puedes correr un caso base limpio y un paso inductivo bajo presión sin mover las manos en el aire?

---

## 7. Recap para contárselo a un amigo

La isla de ojos azules es una historia de inducción con un ferry.

1. Lógicos perfectos. Ven los ojos ajenos, no los propios. Se van a medianoche solo cuando están seguros de tener ojos azules.
2. El gurú dice en público: veo a alguien con ojos azules. Eso arranca un reloj de conocimiento común.
3. Un azul: ve cero azules, entiende que es él, se va la noche 1.
4. Dos azules: cada uno espera que el otro se vaya la noche 1; ninguno lo hace; ambos se van la noche 2.
5. En general: cada azul ve `n - 1` otros, espera que se vayan la noche `n - 1` si "soy marrón"; cuando se quedan, las `n` se van la noche `n`.

Si puedes probar `P(1)`, enunciar el paso inductivo en un párrafo y explicar por qué el gurú no es "información inútil," dominas el problema 6.6. No hace falta Java pesado. El razonamiento cuidadoso es todo el punto.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Jarras de agua](/blog/es/ctci-6-5-jugs-of-water)
* Siguiente: [El apocalipsis](/blog/es/ctci-6-7-the-apocalypse)