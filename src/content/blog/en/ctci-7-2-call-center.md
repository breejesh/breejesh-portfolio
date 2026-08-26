---
title: "Call Center: Ranks, Escalation, and dispatchCall (Java)"
description: "CTCI-style problem 7.2 for beginners: respondents, managers, and directors. Route every call to the lowest free rank that can handle it, escalate when needed, and implement dispatchCall."
date: "2025-09-26"
tags: [Algorithms & Data Structures]
coverImage: /assets/images/ctci-7-2-call-center.webp
previewImage: /assets/images/ctci-7-2-call-center.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 7.2 for beginners: respondents, managers, and directors. Route every call to the lowest free rank that can handle it, escalate when needed, and implement dispatchCall.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

A call lands at the front desk. It should go to a free **respondent** first. If that person cannot finish it, the call climbs to a **manager**. If managers cannot take it either, it goes to a **director**. Busy people do not steal work from free people at a lower rank. That is the whole design: ranks, free lists, and one method that assigns work.

This post is original teaching for beginners in **Java**. Same family as classic interview object-oriented design, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 7, object-oriented design, problem 7.2.

---

## 1. Everyday analogy

Think of a three-floor help desk:

* Floor 1: many respondents with headsets. Most password resets and "how do I log in" questions die here.
* Floor 2: a few managers. Billing disputes, policy exceptions, angry customers who already tried floor 1.
* Floor 3: one or two directors. Rare legal or outage calls.

A call starts on floor 1 unless you already know it needs a higher rank. If floor 1 is fully busy, the call waits or you try the next floor only when the problem truly needs that rank. Escalation is not "jump straight to the boss." It is "this floor cannot finish, try the floor above."

Your job in the interview is not to simulate phone audio. It is to name the types, hold free employees by rank, and write `dispatchCall` so the right free person gets the next call.

---

## 2. Plain problem statement

**Goal:** class design for a call center with three employee ranks and call routing with escalation.

**Ranks (lowest to highest):**

| Rank | Typical role |
| --- | --- |
| Respondent | first line; handles most calls |
| Manager | second line; harder issues |
| Director | top line; rare escalations |

**Core behaviors:**

* An incoming call is assigned to a free employee who can handle its rank (start at respondent unless the call already requires higher).
* If the assigned employee cannot resolve it, the call **escalates** one rank and is reassigned.
* If nobody free can take the call, put it in a wait queue for that rank (or hold it until someone frees up).
* When an employee finishes a call, they become free and may pull the next waiting call.

**Main method to implement:**

```java
void dispatchCall(Call call);
```

Also useful:

```java
void callCompleted(Employee emp);  // free the employee, assign next waiting call if any
void escalate(Call call);          // raise rank and dispatch again
```

**Clarify before coding:**

* How many people at each rank? (Fixed lists are fine for the interview.)
* Can a director handle a respondent-level call if all respondents are busy? (Common yes: any higher rank can cover lower work when free.)
* What if everyone is busy? (Queue the call by rank; do not drop it silently.)
* Thread safety? (Usually single-threaded model first; mention locks only if asked.)

---

## 3. Think first

### Types you almost always need

1. **`Rank`** enum: `RESPONDENT`, `MANAGER`, `DIRECTOR` with an integer level so you can compare and escalate.
2. **`Call`**: who called (optional string), current rank required, employee currently handling it (or null).
3. **`Employee`**: abstract base with name, rank, free/busy flag, current call. Methods: `receiveCall`, `callCompleted`, `escalateAndReassign` (or similar).
4. **`Respondent` / `Manager` / `Director`**: thin subclasses that fix their rank in the constructor.
5. **`CallCenter`** (or `CallHandler`): owns the employee lists and wait queues; implements `dispatchCall`.

### Why not one flat list of employees?

You can scan every employee for "free and rank high enough." That works for tiny demos and is fine as a first sketch. Interviewers usually prefer **employees grouped by rank** so dispatch is "look at rank R, then R+1, then R+2" without scanning people who are too junior for this call.

### Dispatch policy (the heart)

For a call that currently needs rank `r`:

1. Find a free employee at rank `r`.
2. If none, try free employees at rank `r+1`, then `r+2` (higher ranks can cover lower work).
3. If still none, enqueue the call at its current rank and leave it waiting.
4. If you found someone, mark them busy, attach the call to them, attach them to the call.

### Escalation policy

When an employee cannot finish:

1. Disconnect the employee from the call (they become free, or they stay free after completing their part; pick a story and stick to it).
2. Increase the call's required rank by one (respondent → manager → director).
3. If already at director and still stuck, either leave it with the director or fail loudly. State the rule.
4. Call `dispatchCall` again so a free higher-rank person picks it up (or queue it).

### Inheritance vs composition

`Employee` as a base with three subclasses is the classic answer. The subclasses barely differ: only the rank value. That is okay. The point of the hierarchy is:

* `CallCenter` can hold `List<Employee>` per rank.
* Polymorphism: every employee has `receiveCall` and `getRank`.

If you hate empty subclasses, one `Employee` class with a `Rank` field is also honest. Say that out loud. Many interviewers still like the three named types because the problem statement named them.

---

## 4. Java solution

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

Walkthrough:

| Step | Action | Result |
| --- | --- | --- |
| 1 | Center with 2 respondents, 1 manager, 1 director | all free |
| 2 | `dispatchCall(Call("A"))` | R0 takes A (respondent rank) |
| 3 | `dispatchCall(Call("B"))` | R1 takes B |
| 4 | `dispatchCall(Call("C"))` | no free respondent; manager takes C (higher covers lower) |
| 5 | R0 cannot finish A → escalate | A becomes manager rank; if manager busy, A waits or director takes it |
| 6 | R0 `callCompleted` after a different call | R0 free; may pull waiting respondent-level call |

You can change step 4 so busy lower ranks never auto-bump to managers, and only escalate after an employee fails. Both policies are valid if you **name** them. The code above prefers "higher free ranks cover lower work when first-line is full," which matches many real centers and keeps callers off the wait queue when a manager is idle.

---

## 5. Complexity table

| Operation | Time | Notes |
| --- | --- | --- |
| `dispatchCall` | O(E) worst | scan free employees from required rank up; E = staff count (tiny in interviews) |
| `getCallHandler` | O(E) | nested loops over ranks and people |
| `enqueueCall` | O(1) | offer on a queue |
| `assignCall` | O(R + 1) | R is rank index; peek queues from emp rank down |
| `escalateAndReassign` | O(E) | escalate then `dispatchCall` |

Space is O(E + W) for employees plus waiting calls. Interview complexity talk is secondary to clear types and ownership: who owns the free flag, who owns the wait queues, who mutates call rank.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **All employees busy:** call must enter a wait queue, not vanish.
* **Call already needs manager:** do not start at respondent; honor `Call`'s rank.
* **Escalate at director:** no higher rank; re-queue or mark failed. Do not infinite-loop `next()`.
* **Employee completes while queues hold lower-rank work:** free employee should pull work they are allowed to handle.
* **Double free / double assign:** after `receiveCall`, `free` is false; after complete or escalate, clear `currentCall` before becoming free.
* **Null center on employee:** employees need a back-reference (or you pass `CallCenter` into methods) so escalate can redispatch.

Common mistakes:

1. **No rank on the call.** Then you cannot escalate; you only know who is free.
2. **One global free list with no rank filter.** A director always steals respondent work even when respondents are free (bad for cost and design story). Prefer "lowest sufficient free rank first."
3. **Forgetting wait queues.** `dispatchCall` that only returns when someone is free fails under load.
4. **Escalation that keeps the same busy employee.** Escalate must free the current handler and find someone else (or queue).
5. **Huge inheritance trees.** Three ranks and a center is enough. Do not invent `TeamLead`, `ShiftSupervisor`, and `RegionVP` unless asked.
6. **Thread talk before structure.** Locks matter in production; the interview first wants correct single-threaded ownership.

Minimal smoke idea:

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

## 7. Explain to a friend recap

Call Center is an object design problem about **who can take which call**:

1. Three ranks: respondent, manager, director. Encode them as an enum with order.
2. A `Call` starts at respondent (or a given min rank) and can climb one step at a time.
3. `Employee` knows free/busy, rank, and the current call. Subclasses only fix the rank.
4. `CallCenter.dispatchCall` finds the first free person at the call's rank or higher; else enqueues.
5. Escalate frees the current handler, raises the call rank, and dispatches again.
6. When someone finishes, they become free and may pull a waiting call they can cover.

If you can draw the three floors, point at free lists and wait queues, and walk one call from respondent to manager without losing it, you own problem 7.2. Next up in chapter 7 is a jukebox: another design with clearer "nouns" and fewer live escalations.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Deck of Cards](/blog/en/ctci-7-1-deck-of-cards)
* Next: [Jukebox](/blog/en/ctci-7-3-jukebox)