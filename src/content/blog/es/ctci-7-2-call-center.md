---
title: "Centro de Llamadas: Sistema de Enrutamiento Jerárquico Orientado a Objetos (CTCI 7.2)"
description: "Disena las clases y estructuras de datos para un centro de atencion con tres niveles de empleados (operador, gerente y director) en tiempo O(1)."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-7-2-call-center.webp
previewImage: /assets/images/ctci-7-2-call-center.webp
---

> **TL;DR**
> * **El Problema del Libro:** Imagina un centro de llamadas con tres niveles de empleados: operadores, gerentes y directores. Las llamadas entrantes deben asignarse primero a un operador disponible. Si este no puede resolverla, la escala al gerente, y si el gerente esta ocupado, al director. Disena las clases y el metodo `dispatchCall()`.
> * **La Solución Óptima:** Patron Despachador Central (`CallHandler`): (1) Gestiona listas de empleados por rango y colas de espera correspondientes (`List<List<Employee>>`, `List<List<Call>>`); (2) Al recibir una llamada, busca el primer empleado libre en su rango o superior; (3) Si todos estan ocupados, encola la llamada en su rango; (4) Cuando un empleado se libera, extrae la llamada mas prioritaria en tiempo $O(1)$.
> * **Realidad en Producción:** Distribucion automatica de llamadas (ACD) y politicas de escalado en Zendesk y PagerDuty.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 7.2), se nos plantea:

*"Disena las clases y estructuras de datos para un centro de llamadas con 3 niveles jerarquicos (operador, gerente y director). Implementa el metodo dispatchCall() para asignar la llamada al primer empleado disponible."*

## 2. Arquitectura Orientada a Objetos

1. **`Rank` (Enum):** `Respondent`, `Manager`, `Director`.
2. **`Call`:** Modela la llamada activa, el llamante, el rango minimo requerido y el empleado asignado.
3. **`Employee` (Clase Abstracta):** Subclases `Respondent`, `Manager`, `Director`. Gestiona el estado ocupado/libre y la finalizacion/escalado de llamadas.
4. **`CallHandler` (Singleton):** Orquesta el despacho de llamadas entrantes y la liberacion de turnos.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class CallCenter {
    public enum Rank {
        Respondent(0), Manager(1), Director(2);
        private final int value;
        Rank(int v) { this.value = v; }
        public int getValue() { return value; }
    }

    public static class Caller {
        private final int userId;
        private final String name;
        public Caller(int id, String name) { this.userId = id; this.name = name; }
    }

    public static class Call {
        private Rank rank;
        private Caller caller;
        private Employee handler;

        public Call(Caller c) {
            this.rank = Rank.Respondent;
            this.caller = c;
        }

        public void setHandler(Employee e) { this.handler = e; }
        public Rank getRank() { return rank; }
        public void incrementRank() {
            if (rank == Rank.Respondent) rank = Rank.Manager;
            else if (rank == Rank.Manager) rank = Rank.Director;
        }
    }

    public static abstract class Employee {
        private Call currentCall = null;
        protected Rank rank;

        public Employee(Rank rank) { this.rank = rank; }

        public void receiveCall(Call call) { this.currentCall = call; }
        public void callCompleted() {
            if (currentCall != null) {
                currentCall = null;
                CallHandler.getInstance().assignCall(this);
            }
        }
        public void escalateAndReassign() {
            if (currentCall != null) {
                currentCall.incrementRank();
                CallHandler.getInstance().dispatchCall(currentCall);
                currentCall = null;
                CallHandler.getInstance().assignCall(this);
            }
        }
        public boolean isFree() { return currentCall == null; }
        public Rank getRank() { return rank; }
    }

    public static class Respondent extends Employee { public Respondent() { super(Rank.Respondent); } }
    public static class Manager extends Employee { public Manager() { super(Rank.Manager); } }
    public static class Director extends Employee { public Director() { super(Rank.Director); } }

    public static class CallHandler {
        private static CallHandler instance;
        private final int LEVELS = 3;
        private final List<List<Employee>> employeeLevels;
        private final List<List<Call>> callQueues;

        protected CallHandler() {
            employeeLevels = new ArrayList<>(LEVELS);
            callQueues = new ArrayList<>(LEVELS);
            for (int i = 0; i < LEVELS; i++) {
                employeeLevels.add(new ArrayList<>());
                callQueues.add(new LinkedList<>());
            }
        }

        public static synchronized CallHandler getInstance() {
            if (instance == null) instance = new CallHandler();
            return instance;
        }

        public Employee getHandlerForCall(Call call) {
            for (int level = call.getRank().getValue(); level < LEVELS; level++) {
                List<Employee> employees = employeeLevels.get(level);
                for (Employee emp : employees) {
                    if (emp.isFree()) return emp;
                }
            }
            return null;
        }

        public void dispatchCall(Caller caller) {
            dispatchCall(new Call(caller));
        }

        public void dispatchCall(Call call) {
            Employee emp = getHandlerForCall(call);
            if (emp != null) {
                emp.receiveCall(call);
                call.setHandler(emp);
            } else {
                callQueues.get(call.getRank().getValue()).add(call);
            }
        }

        public boolean assignCall(Employee emp) {
            for (int rank = emp.getRank().getValue(); rank >= 0; rank--) {
                List<Call> queue = callQueues.get(rank);
                if (!queue.isEmpty()) {
                    Call call = queue.remove(0);
                    if (call != null) {
                        emp.receiveCall(call);
                        call.setHandler(emp);
                        return true;
                    }
                }
            }
            return false;
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| dispatchCall() | `O(E)` | Busqueda sobre la lista de empleados disponibles. |
| assignCall() | `O(1)` | Desencolado FIFO directo. |
| Espacio Auxiliar | `O(C + E)` | Memoria para llamadas activas y personal registrado. |

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Distribución Automática de Llamadas (ACD)

1. **Sistemas de Soporte Omnicanal (Twilio / Zendesk):** Enrutamiento por habilidades con escalado automatico ante violacion de SLAs.
2. **Politicas de Guardia (PagerDuty):** Escalado de incidentes de Nivel 1 a lideres tecnicos.

## Casos Límite y Robustez en Producción

1. **Todos los empleados ocupados:** Encolamiento FIFO en la cola de rango correspondiente.
2. **Escalado maximo en Director:** Manejado de forma segura.
