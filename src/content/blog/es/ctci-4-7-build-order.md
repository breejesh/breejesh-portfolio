---
title: "Build Order: dependencias de proyectos con orden topológico (Java)"
description: "Problema estilo CTCI 4.7 para principiantes: proyectos y pares de dependencias, encuentra un orden de compilación válido o falla si hay un ciclo. Cola de indegree de Kahn y DFS en Java claro."
date: "2026-04-28"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-4-7-build-order.webp
previewImage: /assets/images/ctci-4-7-build-order.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 4.7 para principiantes: proyectos y pares de dependencias, encuentra un orden de compilación válido o falla si hay un ciclo. Cola de indegree de Kahn y DFS en Java claro.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Montas un monorepo pequeño. El paquete `d` necesita `a` y `b` primero. El paquete `c` necesita `d`. El paquete `b` necesita `f`. Si compilas en el orden incorrecto, el build muere. Si dos paquetes se necesitan entre sí, ningún orden funciona y debes parar con error. Eso es **build order**: una lista de proyectos más aristas de dependencia, y una secuencia segura que respeta cada arista.

Este post es enseñanza original para principiantes en **Java**. Misma familia de grafos de dependencias en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 4, árboles y grafos.

---

## 1. Analogía cotidiana

Piensa en cocinar un menú de varios platos donde algunos deben terminar antes de que otros empiecen:

* Los **proyectos** son platos: sopa, pan, principal, postre.
* Una **dependencia** `(A, B)` significa "B necesita A listo primero." No emplates B hasta que A esté hecho.
* Un **orden de build** válido es cualquier secuencia que respeta cada regla de "necesita primero". Puede haber más de una secuencia válida.
* Un **ciclo** es "la sopa necesita pan y el pan necesita sopa." Ninguna cocina termina eso. Reporta error.

Dibuja cada plato como un nodo. Dibuja una flecha de A a B cuando B depende de A (`A → B` significa construir A antes que B). El grafo es dirigido. Lo que necesitas es un **orden topológico** de ese grafo: cada arista va de más temprano en la lista a más tarde.

Si el grafo tiene un ciclo, no existe orden topológico. Ese es el golpe de la entrevista.

---

## 2. Problema en palabras simples

**Entrada:**

* `projects`: lista de nombres de proyectos (strings, o cualquier id comparable).
* `dependencies`: lista de pares `(before, after)` donde `after` depende de `before`. Construye `before` primero.

**Salida:**

* Una lista ordenada de todos los proyectos que respeta cada dependencia, o
* Una señal de error si no existe tal orden (ciclo, o el manejo de proyectos faltantes que definas).

**Ejemplo clásico:**

| Elemento | Valor |
| --- | --- |
| projects | `a, b, c, d, e, f` |
| dependencies | `(a, d), (f, b), (b, d), (f, a), (d, c)` |
| un orden válido | `f, e, a, b, d, c` (u otras permutaciones legales) |

Lee los pares con cuidado. `(a, d)` significa que **d depende de a**, así que a va antes que d. Arista `a → d`.

**Aclara antes de codear:**

* ¿Nombres únicos? (Sí. Trátalos como ids de nodo.)
* ¿Un proyecto puede aparecer en dependencies y no en `projects`? (Normalmente no. Valida o añádelo. Elige un contrato.)
* ¿Autodependencia `(x, x)`? (Ciclo de longitud 1. Falla.)
* Varios órdenes válidos: cualquiera sirve salvo que pidan todos (otro problema).
* Tipo de retorno en fallo: `null`, lista vacía o throw. Dilo en voz alta.

---

## 3. Piensa primero

### Modelo de grafo

Construye un grafo dirigido:

* Un nodo por proyecto.
* Por cada dependencia `(before, after)`, añade arista `before → after`.
* Lleva el **indegree**: cuántos proyectos deben terminar antes de que este pueda empezar.

Los proyectos con indegree 0 no tienen bloqueadores pendientes. Pueden entrar al build a continuación.

### Enfoque A: Kahn (indegree + cola)

Es el default limpio en entrevista.

1. Construye la lista de adyacencia: mapa de cada proyecto a la lista de proyectos que dependen de él.
2. Calcula el indegree de cada proyecto.
3. Mete en una cola (o cualquier FIFO / lista de la que saques) todo proyecto con indegree 0.
4. Mientras la cola no esté vacía:
   * Saca `p`, añádelo al orden resultado.
   * Por cada vecino `n` de `p`, decrementa `indegree[n]`. Si llega a 0, encola `n`.
5. Si `result.size() == projects.length`, devuelve el orden. Si no, un ciclo (o un lío que no drenó) bloqueó algunos nodos: error.

Por qué funciona: solo emites un proyecto cuando todos sus predecesores ya se emitieron. Si hay ciclo, esos nodos nunca llegan a indegree 0 y la cola se vacía antes de tiempo.

### Enfoque B: DFS con colores

1. Estados: `0` no visitado, `1` visitando (en la pila de recursión actual), `2` hecho.
2. DFS desde cada nodo no visitado. Al salir de un nodo de verdad (post-orden), empújalo a una pila (o antepón a una lista).
3. Si alguna vez sigues una arista hacia un nodo en `1`, encontraste una arista de vuelta: ciclo → error.
4. Al final, invierte la lista en post-orden (o saca de la pila) para el orden de build.

Mismo coste asintótico. Kahn suele ser más fácil de contar con la historia de la "cola de listos". DFS encaja si ya vives en recursión con árboles.

### Qué no hacer

* Probar todas las permutaciones al azar: N! no es respuesta de entrevista.
* BFS sin indegrees: pierdes la señal de "todos los padres listos".
* Solo ordenar nombres alfabéticamente: ignora las aristas.

---

## 4. Solución en Java (Kahn)

```java
import java.util.*;

public class BuildOrder {

    /**
     * @param projects list of project names
     * @param dependencies each pair [before, after]: after depends on before
     * @return a valid build order, or null if a cycle (or incomplete graph) blocks one
     */
    public static String[] findBuildOrder(String[] projects, String[][] dependencies) {
        Map<String, List<String>> graph = new HashMap<>();
        Map<String, Integer> indegree = new HashMap<>();

        for (String p : projects) {
            graph.put(p, new ArrayList<>());
            indegree.put(p, 0);
        }

        for (String[] dep : dependencies) {
            String before = dep[0];
            String after = dep[1];
            if (!graph.containsKey(before) || !graph.containsKey(after)) {
                // dependency names a project we do not know: treat as error
                return null;
            }
            graph.get(before).add(after);
            indegree.put(after, indegree.get(after) + 1);
        }

        Queue<String> ready = new ArrayDeque<>();
        for (String p : projects) {
            if (indegree.get(p) == 0) {
                ready.add(p);
            }
        }

        List<String> order = new ArrayList<>();
        while (!ready.isEmpty()) {
            String p = ready.poll();
            order.add(p);
            for (String next : graph.get(p)) {
                int d = indegree.get(next) - 1;
                indegree.put(next, d);
                if (d == 0) {
                    ready.add(next);
                }
            }
        }

        if (order.size() != projects.length) {
            return null; // cycle: some projects never became ready
        }
        return order.toArray(new String[0]);
    }
}
```

Recorrido del ejemplo:

| Paso | Cola ready (ejemplo) | Build hasta ahora | Notas |
| --- | --- | --- | --- |
| inicio | `f, e` (indegree 0) | - | `a` espera a `f`; `b` a `f`; otros también esperan |
| toma `f` | `e, a, b` | `f` | terminar `f` desbloquea `a` y `b` |
| toma `e` | `a, b` | `f, e` | `e` no tiene dependientes en este ejemplo |
| toma `a` | `b` | `f, e, a` | `d` aún necesita también `b` |
| toma `b` | `d` | `f, e, a, b` | ambos padres de `d` listos → indegree 0 |
| toma `d` | `c` | `f, e, a, b, d` | desbloquea `c` |
| toma `c` | vacía | `f, e, a, b, d, c` | el tamaño coincide → éxito |

El orden de la cola entre nodos con indegree 0 no es único. Sacar `e` más tarde también vale: `f, a, b, d, c, e` funciona igual.

### Esbozo opcional de DFS

```java
// 0 = unvisited, 1 = visiting, 2 = done
// return false from dfs if cycle detected
boolean dfs(String node, Map<String, List<String>> graph,
            Map<String, Integer> state, Deque<String> stack) {
    state.put(node, 1);
    for (String next : graph.get(node)) {
        int s = state.get(next);
        if (s == 1) {
            return false; // back edge
        }
        if (s == 0 && !dfs(next, graph, state, stack)) {
            return false;
        }
    }
    state.put(node, 2);
    stack.push(node); // post-order: dependents already pushed under us
    return true;
}
```

Llama a `dfs` para cada proyecto no visitado. Si todos tienen éxito, saca la pila al array resultado. Misma regla de ciclo: arista de gris a gris falla.

---

## 5. Tabla de complejidad

| Pieza | Tiempo | Espacio |
| --- | --- | --- |
| Construir grafo + indegrees | O(V + E) | O(V + E) |
| Proceso Kahn | O(V + E) | O(V) para cola y orden |
| Proceso DFS | O(V + E) | O(V) recursión + pila en el peor caso |
| Total | O(V + E) | O(V + E) |

`V` es el número de proyectos, `E` el de pares de dependencia. Ambos enfoques son lineales en el tamaño del grafo. Es óptimo: hay que leer cada arista al menos una vez.

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan estos:

* **Lista de proyectos vacía** → orden vacío está bien.
* **Proyectos sin dependencias** → todos entran al conjunto ready de inmediato; cualquier permutación es válida.
* **Un solo proyecto, sin aristas** → `[ese proyecto]`.
* **Auto-arista `(x, x)`** → el indegree de x nunca se limpia, o el DFS ve una arista de vuelta. Error.
* **Ciclo simple** `a → b → a` → error cuando la cola se vacía con nodos sobrantes.
* **Dependencia nombra un proyecto que falta** → decide: error vs crear. El código de arriba devuelve error.
* **Pares de dependencia duplicados** → cuentas indegree dos veces si añades sin mirar. Deduplica aristas o acepta solo si la entrada garantiza pares únicos.

Errores comunes:

1. **Invertir la arista.** `(a, d)` significa que d depende de a. La arista es `a → d`, no `d → a`. Si la das la vuelta, el orden sale mal aunque no haya ciclo.
2. **Olvidar proyectos con indegree 0 y sin aristas.** Los aislados también van en el orden.
3. **Parar cuando la cola se vacía sin comparar tamaños.** Así es exactamente como te saltas un ciclo.
4. **Mutar la lista original de dependencias como única estructura.** Construye un mapa de adyacencia; no destroces la entrada.
5. **Asumir un orden único.** Muchos DAG tienen muchos órdenes topológicos. Devuelve cualquiera válido salvo que pidan otra cosa.
6. **Pensar en no dirigido.** Este grafo es dirigido. Una arista solo fuerza una dirección.

Uso mínimo:

```java
String[] projects = {"a", "b", "c", "d", "e", "f"};
String[][] deps = {
    {"a", "d"}, {"f", "b"}, {"b", "d"}, {"f", "a"}, {"d", "c"}
};
String[] order = BuildOrder.findBuildOrder(projects, deps);
// non-null example: [f, e, a, b, d, c]
```

---

## 7. Explícaselo a un amigo

Build Order es orden topológico sobre un grafo de dependencias de proyectos:

1. Un nodo por proyecto. Arista `before → after` cuando after necesita before.
2. **Kahn:** empieza con indegree 0, emite un proyecto, desbloquea vecinos, repite. Si no puedes emitir todos, hay un ciclo.
3. **DFS:** recursión, falla en aristas de vuelta (visitar de nuevo en gris), emite en post-orden invertido.
4. Tiempo O(V + E). Espacio O(V + E) para el grafo.
5. Varias respuestas pueden ser correctas. Solo los ciclos (o entrada inválida) fuerzan error.

Si dibujas las flechas bien, llenas una cola de listos y explicas por qué los nodos sobrantes son un ciclo, dominas el 4.7. La misma habilidad aparece en gestores de paquetes, pipelines de CI y planificadores de prerrequisitos de cursos.

---

## Serie

* Guía: [Guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Successor](/blog/es/ctci-4-6-successor)
* Siguiente: [First Common Ancestor](/blog/es/ctci-4-8-first-common-ancestor)