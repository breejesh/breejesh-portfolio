---
title: "Centre d'Appels: Système de Routage Hiérarchique Orienté Objet (CTCI 7.2)"
description: "Concevez les classes et structures de données pour un centre d'appels à trois niveaux (opérateur, responsable, directeur) avec escalade en temps O(1)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-2-call-center.webp
previewImage: /assets/images/ctci-7-2-call-center.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Imaginez un centre d'appels avec trois niveaux d'employés : opérateur, responsable et directeur. Tout appel entrant est d'abord affecté à un opérateur libre. S'il ne peut pas traiter l'appel, il l'escalade à un responsable, puis à un directeur si nécessaire. Concevez les classes et la méthode `dispatchCall()`.
> * **La Solution Optimale:** Patron Dispatcher Central (`CallHandler`) : (1) Gérer les employés et les files d'attente par niveau hiérarchique (`List<List<Employee>>`, `List<List<Call>>`) ; (2) À l'arrivée d'un appel, trouver le premier employé disponible au rang requis ou supérieur ; (3) S'ils sont tous occupés, mettre l'appel en file d'attente ; (4) Lorsqu'un employé se libère, lui attribuer immédiatement l'appel le plus prioritaire en temps $O(1)$.
> * **Réalité en Production:** Distribution automatique d'appels (ACD), routage de tickets (Zendesk) et politiques d'escalade d'incidents (PagerDuty).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 7.2), l'énoncé est :

*"Concevez les classes et structures de donnees pour un centre d'appels a 3 niveaux d'employes (operateur, responsable, directeur). Implementez la methode dispatchCall() pour affecter l'appel au premier employe disponible."*

## 2. Architecture Orientée Objet

1. **`Rank` (Enum) :** `Respondent`, `Manager`, `Director`.
2. **`Call` :** Représente l'appel en cours, l'appelant, le niveau d'escalade et l'employé traitant l'appel.
3. **`Employee` (Classe Abstraite) :** Dérivée en `Respondent`, `Manager`, `Director`.
4. **`CallHandler` (Singleton) :** Gère la répartition des appels et l'attribution dès libération d'un poste.

## Implémentation de Production

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

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| dispatchCall() | `O(E)` | Parcours linéaire de la liste des employés du niveau. |
| assignCall() | `O(1)` | Dépilement FIFO immédiat. |
| Espace Auxiliaire | `O(C + E)` | Proportionnel aux appels actifs et employés. |

## Ingénierie des Systèmes en Production

### Architecture Système : Distribution Automatique d'Appels (ACD)

1. **Routage de Compétences (Twilio / Amazon Connect) :** Attribution dynamique des flux d'appels selon disponibilité et seuils SLA.
2. **Escalade d'Astreinte (PagerDuty) :** Basculement automatique des alertes non acquittées vers les ingénieurs d'astreinte supérieurs.

## Cas Limites et Robustesse

1. **Saturation complète :** Mise en file d'attente FIFO ordonnée par niveau.
2. **Escalade au niveau Directeur :** Plafond hiérarchique sécurisé.
