---
title: "Call Center: rangs, escalade et dispatchCall (Java)"
description: "Problème style CTCI 7.2 pour débutants: respondents, managers et directors. Achemine chaque appel vers le rang libre le plus bas qui peut le traiter, escalade au besoin et implémente dispatchCall."
date: "2025-09-26"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-2-call-center.webp
previewImage: /assets/images/ctci-7-2-call-center.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 7.2 pour débutants: respondents, managers et directors. Achemine chaque appel vers le rang libre le plus bas qui peut le traiter, escalade au besoin et implémente dispatchCall.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un appel arrive à l'accueil. Il doit d'abord aller à un **respondent** libre. Si cette personne ne peut pas le terminer, l'appel monte vers un **manager**. Si les managers ne peuvent pas non plus, il va à un **director**. Les gens occupés ne volent pas le travail des libres de rang inférieur. C'est tout le design: rangs, listes de libres, et une méthode qui assigne le travail.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de conception orientée objet en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 7, object-oriented design, problème 7.2.

---

## 1. Analogie du quotidien

Imagine un help desk sur trois étages:

* Étage 1: beaucoup de respondents avec casque. La plupart des réinitialisations de mot de passe et des "comment je me connecte" s'arrêtent ici.
* Étage 2: quelques managers. Litiges de facturation, exceptions de politique, clients en colère qui ont déjà essayé l'étage 1.
* Étage 3: un ou deux directors. Appels rares juridiques ou d'incident majeur.

Un appel commence à l'étage 1 sauf si tu sais déjà qu'il faut un rang plus haut. Si l'étage 1 est plein, l'appel attend ou tu montes seulement quand le problème l'exige vraiment. Escalader n'est pas "sauter chez le patron." C'est "cet étage ne peut pas finir, essaie celui du dessus."

Ton job en entretien n'est pas de simuler l'audio téléphone. C'est de nommer les types, tenir les employés libres par rang, et écrire `dispatchCall` pour que la bonne personne libre prenne le prochain appel.

---

## 2. Problème en mots simples

**But:** conception de classes pour un call center avec trois rangs d'employés et routage d'appels avec escalade.

**Rangs (du plus bas au plus haut):**

| Rang | Rôle typique |
| --- | --- |
| Respondent | première ligne; traite la plupart des appels |
| Manager | deuxième ligne; cas plus durs |
| Director | ligne haute; escalades rares |

**Comportements centraux:**

* Un appel entrant est assigné à un employé libre capable de gérer son rang (départ respondent sauf si l'appel exige déjà plus haut).
* Si l'employé assigné ne peut pas résoudre, l'appel **escalade** d'un rang et est réassigné.
* Si personne de libre ne peut le prendre, mets-le en file d'attente pour ce rang (ou retiens-le jusqu'à ce que quelqu'un se libère).
* Quand un employé termine un appel, il redevient libre et peut tirer le prochain appel en attente.

**Méthode principale à implémenter:**

```java
void dispatchCall(Call call);
```

Aussi utile:

```java
void callCompleted(Employee emp);  // libérer l'employé, assigner le suivant en attente s'il y en a
void escalate(Call call);          // monter le rang et redistribuer
```

**À clarifier avant de coder:**

* Combien de personnes par rang? (Listes fixes suffisent en entretien.)
* Un director peut-il prendre un appel de niveau respondent si tous les respondents sont occupés? (Souvent oui: un rang plus haut peut couvrir le travail inférieur quand il est libre.)
* Et si tout le monde est occupé? (File d'attente par rang; ne le jette pas en silence.)
* Thread-safety? (Modèle monothread d'abord; parle de locks seulement si on te le demande.)

---

## 3. Réfléchir d'abord

### Types dont tu as presque toujours besoin

1. **`Rank`** enum: `RESPONDENT`, `MANAGER`, `DIRECTOR` avec un niveau entier pour comparer et escalader.
2. **`Call`**: qui a appelé (string optionnel), rang actuellement requis, employé qui traite (ou null).
3. **`Employee`**: base abstraite avec nom, rang, flag free/busy, appel courant. Méthodes: `receiveCall`, `callCompleted`, `escalateAndReassign` (ou proche).
4. **`Respondent` / `Manager` / `Director`**: sous-classes fines qui fixent le rang dans le constructeur.
5. **`CallCenter`** (ou `CallHandler`): possède les listes d'employés et les files d'attente; implémente `dispatchCall`.

### Pourquoi pas une seule liste plate d'employés?

Tu peux parcourir tout le monde pour "libre et rang suffisant." Ça marche pour de petites démos et comme premier jet. En entretien on préfère souvent des **employés groupés par rang** pour dispatcher "regarde le rang R, puis R+1, puis R+2" sans balayer des gens trop juniors pour cet appel.

### Politique de dispatch (le cœur)

Pour un appel qui nécessite actuellement le rang `r`:

1. Trouve un employé libre au rang `r`.
2. Sinon, essaie les libres au rang `r+1`, puis `r+2` (les rangs plus hauts peuvent couvrir le travail inférieur).
3. Si toujours personne, enfile l'appel à son rang actuel et laisse-le attendre.
4. Si tu as trouvé quelqu'un, marque-le occupé, attache l'appel à lui et lui à l'appel.

### Politique d'escalade

Quand un employé ne peut pas finir:

1. Déconnecte l'employé de l'appel (il redevient libre; choisis une histoire et tiens-la).
2. Augmente d'un cran le rang requis de l'appel (respondent → manager → director).
3. Si déjà director et toujours bloqué, laisse-le au director ou échoue clairement. Énonce la règle.
4. Rappelle `dispatchCall` pour qu'une personne libre de rang plus haut le prenne (ou l'enfile).

### Héritage vs composition

`Employee` en base avec trois sous-classes est la réponse classique. Les sous-classes diffèrent à peine: seulement la valeur de rang. C'est correct. L'intérêt de la hiérarchie:

* `CallCenter` peut tenir `List<Employee>` par rang.
* Polymorphisme: chaque employé a `receiveCall` et `getRank`.

Si tu détestes les sous-classes vides, une seule classe `Employee` avec un champ `Rank` est aussi honnête. Dis-le à voix haute. Beaucoup d'intervieweurs aiment encore les trois types nommés parce que l'énoncé les a nommés.

---

## 4. Solution Java

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

Parcours:

| Étape | Action | Résultat |
| --- | --- | --- |
| 1 | Centre avec 2 respondents, 1 manager, 1 director | tous libres |
| 2 | `dispatchCall(Call("A"))` | R0 prend A (rang respondent) |
| 3 | `dispatchCall(Call("B"))` | R1 prend B |
| 4 | `dispatchCall(Call("C"))` | aucun respondent libre; le manager prend C (le supérieur couvre l'inférieur) |
| 5 | R0 ne peut pas finir A → escalade | A passe au rang manager; si le manager est occupé, A attend ou le director le prend |
| 6 | R0 fait `callCompleted` après un autre appel | R0 libre; peut tirer un appel en attente de niveau respondent |

Tu peux changer l'étape 4 pour que les rangs bas occupés ne montent jamais seuls chez les managers, et n'escalader qu'après un échec employé. Les deux politiques sont valides si tu les **nommes**. Le code ci-dessus préfère "les rangs libres plus hauts couvrent le travail inférieur quand la première ligne est pleine," ce qui colle à beaucoup de centres réels et évite la file d'attente si un manager est oisif.

---

## 5. Table de complexité

| Opération | Temps | Notes |
| --- | --- | --- |
| `dispatchCall` | O(E) pire cas | parcourt les libres du rang requis vers le haut; E = effectif (petit en entretien) |
| `getCallHandler` | O(E) | boucles imbriquées sur rangs et personnes |
| `enqueueCall` | O(1) | offer sur une file |
| `assignCall` | O(R + 1) | R est l'indice de rang; regarde les files du rang de l'emp vers le bas |
| `escalateAndReassign` | O(E) | escalade puis `dispatchCall` |

Espace O(E + W) pour employés plus appels en attente. En entretien, le discours complexité est secondaire face à des types clairs et la propriété: qui possède le flag free, qui les files d'attente, qui mute le rang de l'appel.

---

## 6. Cas limites et erreurs fréquentes

Les intervieweurs piquent ici:

* **Tous occupés:** l'appel doit entrer en file d'attente, pas disparaître.
* **L'appel exige déjà manager:** ne commence pas en respondent; honore le rang de `Call`.
* **Escalade au director:** pas de rang plus haut; ré-enfile ou marque l'échec. Pas de boucle infinie dans `next()`.
* **Employé termine alors que des files tiennent du travail inférieur:** le libre doit tirer un travail qu'il a le droit de traiter.
* **Double free / double assign:** après `receiveCall`, `free` est false; après complete ou escalate, vide `currentCall` avant de redevenir free.
* **Center null sur l'employé:** il faut une référence retour (ou passer `CallCenter` aux méthodes) pour que l'escalade puisse redistribuer.

Erreurs courantes:

1. **Pas de rang sur l'appel.** Alors tu ne peux pas escalader; tu sais seulement qui est libre.
2. **Une liste globale de libres sans filtre de rang.** Un director vole toujours le travail respondent même s'il reste des respondents libres (mauvais pour le coût et pour l'histoire de design). Préfère "le rang libre le plus bas suffisant d'abord."
3. **Oublier les files d'attente.** Un `dispatchCall` qui ne renvoie que si quelqu'un est libre casse sous charge.
4. **Escalade qui garde le même employé occupé.** Escalader doit libérer le handler actuel et trouver quelqu'un d'autre (ou enfiler).
5. **Arbres d'héritage énormes.** Trois rangs et un center suffisent. N'invente pas `TeamLead`, `ShiftSupervisor` et `RegionVP` sauf demande.
6. **Parler threads avant la structure.** Les locks comptent en production; l'entretien veut d'abord une propriété monothread correcte.

Idée de smoke minimale:

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

## 7. À expliquer à un ami

Call Center est un problème de conception d'objets sur **qui peut prendre quel appel**:

1. Trois rangs: respondent, manager, director. Encode-les en enum avec un ordre.
2. Un `Call` commence en respondent (ou un min rank donné) et peut monter d'un cran à la fois.
3. `Employee` connaît free/busy, le rang et l'appel courant. Les sous-classes ne fixent que le rang.
4. `CallCenter.dispatchCall` trouve la première personne libre au rang de l'appel ou plus haut; sinon enfile.
5. Escalader libère le handler actuel, monte le rang de l'appel, et dispatch encore.
6. Quand quelqu'un termine, il redevient libre et peut tirer un appel en attente qu'il peut couvrir.

Si tu peux dessiner les trois étages, pointer les listes de libres et les files d'attente, et marcher un appel de respondent à manager sans le perdre, tu possèdes le 7.2. Ensuite dans le chapitre 7: un jukebox, un autre design avec des "noms" plus clairs et moins d'escalades en direct.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Deck of Cards](/blog/fr/ctci-7-1-deck-of-cards)
* Suivant: [Jukebox](/blog/fr/ctci-7-3-jukebox)