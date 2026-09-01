---
title: "Call Center: Object-Oriented Hierarchical Call Routing System (CTCI 7.2)"
description: "Design the classes and data structures for a call center with three levels of employees: respondent, manager, and director with automated escalation in O(1) time."
date: "2026-05-06"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-7-2-call-center.webp
previewImage: /assets/images/ctci-7-2-call-center.webp
---

> **TL;DR**
> * **The Book Problem:** Imagine you have a call center with three levels of employees: respondent, manager, and director. An incoming telephone call must be first allocated to a respondent who is free. If the respondent cannot handle the call, they escalate it to a manager. If the manager is not free or cannot handle it, the call escalates to a director. Design the classes and data structures and implement `dispatchCall()`.
> * **The Optimal Solution:** Central Dispatcher Pattern (`CallHandler`): (1) Maintain 3 distinct employee levels in lists and 3 corresponding waiting call queues (`List<List<Employee>> employeeLevels`, `List<List<Call>> callQueues`); (2) When `dispatchCall(Call)` arrives, check for the first available employee at rank $R=0$ (Respondent). If none free, push call to `callQueues.get(0)`; (3) When an employee finishes, invoke `assignCall()` to immediately pop the highest-priority waiting call from their rank queue in $O(1)$ time.
> * **Production Reality:** Customer support ticket routing (Zendesk / Salesforce Service Cloud), Twilio IVR contact center dispatchers, and telecom ACD (Automatic Call Distribution) systems.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 7.2), we are asked:

*"Imagine you have a call center with three levels of employees: respondent, manager, and director. An incoming telephone call must be first allocated to a respondent who is free. If the respondent cannot handle the call, he or she must escalate the call to a manager. If the manager is not free or not able to handle it, then the call should be escalated to a director. Design the classes and data structures for this problem. Implement a method dispatchCall() which assigns a call to the first available employee."*

## 2. Object-Oriented Architecture

1. **`Rank` (Enum):** `Respondent (0)`, `Manager (1)`, `Director (2)`.
2. **`Call`:** Represents an active voice call with `Caller`, `minRank`, and `handler` employee reference. Includes `escalate()` method.
3. **`Employee` (Abstract):** Subclassed by `Respondent`, `Manager`, `Director`. Tracks `currentCall`, `rank`, and availability methods (`isFree()`, `receiveCall()`, `callCompleted()`).
4. **`CallHandler` (Singleton):** Manages:
   * 3 levels of employees: `List<List<Employee>> employeeLevels`.
   * 3 queues of waiting callers: `List<List<Call>> callQueues`.
   * `getHandlerForCall(Call call)` and `dispatchCall(Caller caller)`.

## Production Implementation

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
        private final String name;
        private final int userId;
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
        public void setRank(Rank r) { this.rank = r; }
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
                // Check if new call is waiting in queue
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
            Call call = new Call(caller);
            dispatchCall(call);
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

## Complexity & Memory Analysis

| Metric | Complexity | Technical Detail |
|---|---|---|
| dispatchCall() Time | `O(E)` | Searches available employee lists across 3 tiers (bounded $O(1)$ in practical staff pools). |
| assignCall() Time | `O(1)` | Direct poll from head of priority queue. |
| Auxiliary Space | `O(C + E)` | Memory proportional to active calls $C$ and registered staff $E$. |

## Real-World Systems Engineering Discussion

### Production Systems Architecture: Automatic Call Distribution (ACD)

1. **Twilio TaskRouter / Amazon Connect:** Distributes omnichannel incoming voice, SMS, and chat requests across tiered skill groups with escalation timers.
2. **PagerDuty Escalation Policies:** Tier-1 on-call engineer notifications automatically escalate to Tier-2 team leads and engineering managers upon unacknowledged SLA breaches.

## Edge Cases & Production Hardening

1. **All employees busy across all 3 tiers:** Call is placed into `callQueues.get(rank)` FIFO waiting line.
2. **Director escalates:** Handled by guard clause (no higher rank exists).
3. **Staff member frees up:** Immediately inspects waiting queues from their rank downward.
