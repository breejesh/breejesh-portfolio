---
title: "Call Center: rangos, escalado y dispatchCall (Java)"
description: "Problema estilo CTCI 7.2 para principiantes: respondents, managers y directors. Enruta cada llamada al rango libre más bajo que pueda atenderla, escala cuando haga falta e implementa dispatchCall."
date: "2025-09-26"
tags: [Algoritmos]
coverImage: /assets/images/ctci-7-2-call-center.webp
previewImage: /assets/images/ctci-7-2-call-center.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 7.2 para principiantes: respondents, managers y directors. Enruta cada llamada al rango libre más bajo que pueda atenderla, escala cuando haga falta e implementa dispatchCall.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Llega una llamada a recepción. Debe ir primero a un **respondent** libre. Si esa persona no puede cerrarla, la llamada sube a un **manager**. Si los managers tampoco pueden, va a un **director**. La gente ocupada no roba trabajo a gente libre de rango más bajo. Ese es todo el diseño: rangos, listas de libres y un método que asigna trabajo.

Este post es enseñanza original para principiantes en **Java**. Misma familia de diseño orientado a objetos en entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 7, object-oriented design, problema 7.2.

---

## 1. Analogía cotidiana

Piensa en un help desk de tres pisos:

* Piso 1: muchos respondents con auriculares. La mayoría de restablecimientos de contraseña y "cómo inicio sesión" mueren aquí.
* Piso 2: unos pocos managers. Disputas de facturación, excepciones de política, clientes enfadados que ya probaron el piso 1.
* Piso 3: uno o dos directors. Llamadas raras legales o de caídas del servicio.

Una llamada empieza en el piso 1 salvo que ya sepas que necesita un rango más alto. Si el piso 1 está lleno, la llamada espera o subes de piso solo cuando el problema de verdad lo exige. Escalar no es "saltar al jefe." Es "este piso no puede terminar, prueba el de arriba."

Tu trabajo en la entrevista no es simular audio de teléfono. Es nombrar tipos, guardar empleados libres por rango y escribir `dispatchCall` para que la persona libre correcta tome la siguiente llamada.

---

## 2. Problema en palabras simples

**Objetivo:** diseño de clases para un call center con tres rangos de empleado y enrutado de llamadas con escalado.

**Rangos (de menor a mayor):**

| Rango | Rol típico |
| --- | --- |
| Respondent | primera línea; resuelve la mayoría |
| Manager | segunda línea; casos difíciles |
| Director | línea superior; escalados raros |

**Comportamientos clave:**

* Una llamada entrante se asigna a un empleado libre que pueda manejar su rango (empieza en respondent salvo que ya pida más alto).
* Si el asignado no puede resolverla, la llamada **escala** un rango y se reasigna.
* Si nadie libre puede tomarla, va a una cola de espera de ese rango (o se retiene hasta que alguien se libere).
* Cuando un empleado termina una llamada, queda libre y puede sacar la siguiente en espera.

**Método principal a implementar:**

```java
void dispatchCall(Call call);
```

También útil:

```java
void callCompleted(Employee emp);  // liberar empleado, asignar siguiente en espera si hay
void escalate(Call call);          // subir rango y despachar otra vez
```

**Aclara antes de codificar:**

* ¿Cuánta gente por rango? (Listas fijas valen en la entrevista.)
* ¿Puede un director atender una llamada de respondent si todos los respondents están ocupados? (A menudo sí: un rango más alto cubre trabajo inferior cuando está libre.)
* ¿Y si todos están ocupados? (Encola por rango; no la tires en silencio.)
* ¿Seguridad entre hilos? (Modelo monohilo primero; habla de locks solo si te lo piden.)

---

## 3. Piensa primero

### Tipos que casi siempre necesitas

1. **`Rank`** enum: `RESPONDENT`, `MANAGER`, `DIRECTOR` con un entero de nivel para comparar y escalar.
2. **`Call`**: quién llamó (string opcional), rango actual requerido, empleado que la atiende (o null).
3. **`Employee`**: base abstracta con nombre, rango, flag libre/ocupado, llamada actual. Métodos: `receiveCall`, `callCompleted`, `escalateAndReassign` (o similar).
4. **`Respondent` / `Manager` / `Director`**: subclases finas que fijan el rango en el constructor.
5. **`CallCenter`** (o `CallHandler`): posee las listas de empleados y colas de espera; implementa `dispatchCall`.

### ¿Por qué no una sola lista plana de empleados?

Puedes recorrer a todos buscando "libre y rango suficiente." Sirve para demos pequeñas y como primer boceto. En entrevista suele gustar más **empleados agrupados por rango** para despachar "mira rango R, luego R+1, luego R+2" sin barrer a gente demasiado junior para esa llamada.

### Política de despacho (el núcleo)

Para una llamada que ahora necesita rango `r`:

1. Busca un empleado libre en rango `r`.
2. Si no hay, prueba libres en `r+1`, luego `r+2` (rangos más altos pueden cubrir trabajo inferior).
3. Si aún no hay nadie, encola la llamada en su rango actual y déjala esperar.
4. Si encontraste a alguien, márcalo ocupado, enlaza la llamada con él y a él con la llamada.

### Política de escalado

Cuando un empleado no puede terminar:

1. Desconecta al empleado de la llamada (queda libre; elige una historia y cúmplela).
2. Sube el rango requerido de la llamada en uno (respondent → manager → director).
3. Si ya es director y sigue atascada, déjala con el director o falla de forma explícita. Di la regla.
4. Llama otra vez a `dispatchCall` para que alguien libre de rango más alto la tome (o se encole).

### Herencia vs composición

`Employee` como base con tres subclases es la respuesta clásica. Las subclases casi no difieren: solo el valor de rango. Está bien. El punto de la jerarquía es:

* `CallCenter` puede guardar `List<Employee>` por rango.
* Polimorfismo: todo empleado tiene `receiveCall` y `getRank`.

Si odias subclases vacías, una sola clase `Employee` con un campo `Rank` también es honesta. Dilo en voz alta. A muchos entrevistadores aún les gustan los tres tipos con nombre porque el enunciado los nombró.

---

## 4. Solución en Java

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

enum Rank {
    RESPONDENT(0),
    MANAGER(1),
    DIRECTOR(2);

    private final int value;

    Rank(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    public Rank next() {
        if (this == DIRECTOR) {
            return DIRECTOR; // already top
        }
        return Rank.values()[value + 1];
    }
}

class Call {
    private Rank rank;
    private final String callerId;
    private Employee handler;

    public Call(String callerId) {
        this.callerId = callerId;
        this.rank = Rank.RESPONDENT; // start at first line
    }

    public Call(String callerId, Rank minRank) {
        this.callerId = callerId;
        this.rank = minRank;
    }

    public Rank getRank() {
        return rank;
    }

    public void setRank(Rank rank) {
        this.rank = rank;
    }

    public void escalateRank() {
        this.rank = rank.next();
    }

    public String getCallerId() {
        return callerId;
    }

    public Employee getHandler() {
        return handler;
    }

    public void setHandler(Employee handler) {
        this.handler = handler;
    }
}

abstract class Employee {
    private final String name;
    private final Rank rank;
    private boolean free = true;
    private Call currentCall;
    protected CallCenter center;

    protected Employee(String name, Rank rank) {
        this.name = name;
        this.rank = rank;
    }

    public void setCallCenter(CallCenter center) {
        this.center = center;
    }

    public String getName() {
        return name;
    }

    public Rank getRank() {
        return rank;
    }

    public boolean isFree() {
        return free;
    }

    public void receiveCall(Call call) {
        free = false;
        currentCall = call;
        call.setHandler(this);
    }

    /** Employee finished work on this call successfully. */
    public void callCompleted() {
        if (currentCall != null) {
            currentCall.setHandler(null);
            currentCall = null;
        }
        free = true;
        // ask center to give me the next waiting call I can take
        if (center != null) {
            center.assignCall(this);
        }
    }

    /**
     * Cannot finish. Free self, raise call rank, redispatch.
     * Returns true if escalation happened.
     */
    public boolean escalateAndReassign() {
        if (currentCall == null) {
            return false;
        }
        Call call = currentCall;
        currentCall = null;
        free = true;
        call.setHandler(null);

        if (call.getRank() == Rank.DIRECTOR) {
            // nowhere higher; put back in director wait queue
            center.enqueueCall(call);
            center.assignCall(this);
            return false;
        }

        call.escalateRank();
        center.dispatchCall(call);
        center.assignCall(this); // this person may take another waiting call
        return true;
    }
}

class Respondent extends Employee {
    public Respondent(String name) {
        super(name, Rank.RESPONDENT);
    }
}

class Manager extends Employee {
    public Manager(String name) {
        super(name, Rank.MANAGER);
    }
}

class Director extends Employee {
    public Director(String name) {
        super(name, Rank.DIRECTOR);
    }
}

class CallCenter {
    // employees[0] = respondents, [1] = managers, [2] = directors
    private final List<List<Employee>> employees = new ArrayList<>();
    // wait queues per rank
    private final List<Queue<Call>> callQueues = new ArrayList<>();

    public CallCenter(int numRespondents, int numManagers, int numDirectors) {
        employees.add(new ArrayList<>());
        employees.add(new ArrayList<>());
        employees.add(new ArrayList<>());
        callQueues.add(new LinkedList<>());
        callQueues.add(new LinkedList<>());
        callQueues.add(new LinkedList<>());

        for (int i = 0; i < numRespondents; i++) {
            addEmployee(new Respondent("R" + i));
        }
        for (int i = 0; i < numManagers; i++) {
            addEmployee(new Manager("M" + i));
        }
        for (int i = 0; i < numDirectors; i++) {
            addEmployee(new Director("D" + i));
        }
    }

    private void addEmployee(Employee e) {
        e.setCallCenter(this);
        employees.get(e.getRank().getValue()).add(e);
    }

    /** Assign call to first free employee at call.rank or higher. */
    public void dispatchCall(Call call) {
        Employee emp = getCallHandler(call);
        if (emp != null) {
            emp.receiveCall(call);
        } else {
            enqueueCall(call);
        }
    }

    void enqueueCall(Call call) {
        callQueues.get(call.getRank().getValue()).offer(call);
    }

    /**
     * Free employee looks for a waiting call they can handle:
     * any queue at their rank or lower (they can cover junior work).
     */
    public void assignCall(Employee emp) {
        for (int r = emp.getRank().getValue(); r >= 0; r--) {
            Queue<Call> q = callQueues.get(r);
            if (!q.isEmpty()) {
                Call call = q.poll();
                emp.receiveCall(call);
                return;
            }
        }
    }

    /** First free employee with rank >= call.getRank(). */
    private Employee getCallHandler(Call call) {
        for (int r = call.getRank().getValue(); r <= Rank.DIRECTOR.getValue(); r++) {
            for (Employee e : employees.get(r)) {
                if (e.isFree()) {
                    return e;
                }
            }
        }
        return null;
    }
}
```

Recorrido:

| Paso | Acción | Resultado |
| --- | --- | --- |
| 1 | Centro con 2 respondents, 1 manager, 1 director | todos libres |
| 2 | `dispatchCall(Call("A"))` | R0 toma A (rango respondent) |
| 3 | `dispatchCall(Call("B"))` | R1 toma B |
| 4 | `dispatchCall(Call("C"))` | no hay respondent libre; el manager toma C (el superior cubre lo inferior) |
| 5 | R0 no puede terminar A → escala | A pasa a rango manager; si el manager está ocupado, A espera o la toma el director |
| 6 | R0 hace `callCompleted` tras otra llamada | R0 libre; puede sacar una llamada en espera de nivel respondent |

Puedes cambiar el paso 4 para que rangos bajos ocupados nunca suban solos a managers, y solo escalar cuando un empleado falla. Ambas políticas valen si las **nombras**. El código de arriba prefiere "rangos libres más altos cubren trabajo inferior cuando la primera línea está llena," lo que encaja con muchos centros reales y evita la cola de espera si un manager está ocioso.

---

## 5. Tabla de complejidad

| Operación | Tiempo | Notas |
| --- | --- | --- |
| `dispatchCall` | O(E) peor caso | recorre libres desde el rango requerido hacia arriba; E = plantilla (pequeña en entrevista) |
| `getCallHandler` | O(E) | bucles anidados por rangos y personas |
| `enqueueCall` | O(1) | offer en una cola |
| `assignCall` | O(R + 1) | R es el índice de rango; mira colas desde el rango del emp hacia abajo |
| `escalateAndReassign` | O(E) | escala y luego `dispatchCall` |

Espacio O(E + W) por empleados más llamadas en espera. En la entrevista la charla de complejidad es secundaria frente a tipos claros y propiedad: quién tiene el flag free, quién las colas de espera, quién muta el rango de la llamada.

---

## 6. Casos límite y errores frecuentes

Los entrevistadores pinchan esto:

* **Todos ocupados:** la llamada debe entrar en cola de espera, no desaparecer.
* **La llamada ya pide manager:** no empieces en respondent; respeta el rango de `Call`.
* **Escalar en director:** no hay rango superior; reencola o marca fallo. No hagas bucle infinito en `next()`.
* **Empleado termina con colas de trabajo inferior:** el libre debe sacar trabajo que pueda manejar.
* **Doble free / doble assign:** tras `receiveCall`, `free` es false; tras completar o escalar, limpia `currentCall` antes de quedar free.
* **Center null en el empleado:** hace falta una referencia de vuelta (o pasar `CallCenter` a los métodos) para que el escalado pueda redespachar.

Errores comunes:

1. **Sin rango en la llamada.** Entonces no puedes escalar; solo sabes quién está libre.
2. **Una lista global de libres sin filtro de rango.** Un director siempre roba trabajo de respondent aunque haya respondents libres (malo para coste y para la historia de diseño). Prefiere "el rango libre más bajo suficiente primero."
3. **Olvidar colas de espera.** Un `dispatchCall` que solo devuelve cuando hay alguien libre falla bajo carga.
4. **Escalado que mantiene al mismo empleado ocupado.** Escalar debe liberar al handler actual y buscar a otra persona (o encolar).
5. **Árboles de herencia enormes.** Tres rangos y un center bastan. No inventes `TeamLead`, `ShiftSupervisor` y `RegionVP` si no te lo piden.
6. **Hablar de hilos antes de la estructura.** Los locks importan en producción; la entrevista primero quiere propiedad correcta monohilo.

Idea mínima de prueba:

```java
CallCenter center = new CallCenter(2, 1, 1);
Call a = new Call("alice");
Call b = new Call("bob");
Call c = new Call("cara");
center.dispatchCall(a);
center.dispatchCall(b);
center.dispatchCall(c); // may land on manager if both respondents busy
// simulate first-line cannot finish
Employee handler = a.getHandler();
if (handler != null) {
    handler.escalateAndReassign();
}
```

---

## 7. Resumen para contárselo a un amigo

Call Center es un problema de diseño de objetos sobre **quién puede tomar qué llamada**:

1. Tres rangos: respondent, manager, director. Codifícalos como enum con orden.
2. Un `Call` empieza en respondent (o un min rank dado) y puede subir un peldaño cada vez.
3. `Employee` sabe free/busy, rango y la llamada actual. Las subclases solo fijan el rango.
4. `CallCenter.dispatchCall` encuentra la primera persona libre en el rango de la llamada o superior; si no, encola.
5. Escalar libera al handler actual, sube el rango de la llamada y despacha otra vez.
6. Cuando alguien termina, queda libre y puede sacar una llamada en espera que pueda cubrir.

Si puedes dibujar los tres pisos, señalar listas de libres y colas de espera, y recorrer una llamada de respondent a manager sin perderla, dominas el 7.2. Lo siguiente del capítulo 7 es un jukebox: otro diseño con "nombres" más claros y menos escalados en vivo.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Deck of Cards](/blog/es/ctci-7-1-deck-of-cards)
* Siguiente: [Jukebox](/blog/es/ctci-7-3-jukebox)