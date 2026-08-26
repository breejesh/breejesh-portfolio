---
title: "Parking Lot: places multi-niveaux pour moto, voiture et bus (Java)"
description: "Problème style CTCI 7.4 pour débutants: concevoir un parking multi-niveaux avec places moto, compactes et grandes. Stationner motos, voitures et bus sous des règles de taille, avec des classes Java claires."
date: "2025-12-11"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-4-parking-lot.webp
previewImage: /assets/images/ctci-7-4-parking-lot.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 7.4 pour débutants: concevoir un parking multi-niveaux avec places moto, compactes et grandes. Stationner motos, voitures et bus sous des règles de taille, avec des classes Java claires.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

Un parking n'est pas un grand tableau de cases vides. Il a des **étages**, des **rangées** et des **places de tailles différentes**. Une moto entre presque partout. Une voiture a besoin d'une place compacte ou large. Un bus a besoin de **cinq places Large d'affilée dans la même rangée**, pas de cinq trous au hasard sur des étages différents.

Ce billet est un enseignement original pour débutants en **Java**. Même famille de problèmes de conception orientée objet en entretien, pas une copie de livre. Fait partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 7, conception orientée objet: problème 7.4.

---

## 1. Analogie du quotidien

Pense à un parking multi-étages de centre commercial:

* Niveau 1, niveau 2, niveau 3, chacun avec des places peintes.
* Certaines places sont réservées moto.
* Certaines sont compactes.
* Certaines sont larges (utilitaire / bus), souvent en bande continue sur une rangée.

Quand un véhicule arrive, le préposé n'invente pas un nouveau règlement. Il demande: **quelle taille a ce véhicule, de combien de places a-t-il besoin, et existe-t-il une suite libre qui convient?**

C'est tout le design: des objets qui connaissent leur taille, des places qui connaissent taille et occupation, des niveaux qui cherchent une suite libre, et un parking qui interroge chaque niveau dans l'ordre.

---

## 2. Énoncé en mots simples

**Objectif:** concevoir des classes pour un parking avec des principes orientés objet.

L'énoncé d'entretien est volontairement vague. Tu dois **énoncer tes hypothèses**. Voici celles de ce billet (dis-les à voix haute en entretien; d'autres hypothèses vont bien si tu restes cohérent).

**Structure:**

* Plusieurs **niveaux**.
* Chaque niveau a plusieurs **rangées** de **places**.
* Tailles de place: `Motorcycle`, `Compact`, `Large`.

**Véhicules:**

| Véhicule | Places | Peut utiliser |
| --- | --- | --- |
| Motorcycle | 1 | n'importe quelle taille de place |
| Car | 1 | Compact ou Large |
| Bus | 5 | cinq places **Large consécutives** dans la **même rangée** |

**Opérations principales:**

| Méthode | Sens |
| --- | --- |
| `parkVehicle(vehicle)` | trouve et occupe la ou les places libres; retourne succès / échec |
| `unpark` / libérer les places | libère chaque place tenue par le véhicule |
| `availableSpots()` (optionnel) | places libres sur un niveau ou le parking |

**Clarifie avant de coder:**

* Tickets payants, horaires et paiement? Hors périmètre sauf demande.
* Plusieurs entrées et concurrence? Modèle monothread d'abord.
* Disposition des places: fixée à la construction pour le croquis d'entretien.
* Si le parking est plein? Retourne `false` (ou lève une exception; choisis un contrat).

**Forme des signatures:**

```java
boolean parkVehicle(Vehicle vehicle);
void clearSpots(); // sur le véhicule: quitte chaque place qu'il occupe
```

---

## 3. Réfléchir d'abord

### Commence par les hypothèses, pas par les diagrammes de classes

Les entretiens OOD ratent quand on dessine vingt boîtes avant de dire de quoi un bus a besoin. Écris d'abord les règles d'emboîtement. Les classes en découlent.

### Sépare "tient dans cette place" de "assez de places consécutives"

* **Adéquation taille:** ce type de véhicule a-t-il le droit d'utiliser la peinture de cette place?
* **Adéquation nombre / suite:** le véhicule a-t-il besoin de 1 place ou de 5 Large d'affilée dans une rangée?

Un bus doit passer les deux. Vérifier seulement la taille d'une seule place Large ne suffit pas.

### Héritage pour les véhicules, composition pour le garage

* Base abstraite `Vehicle` avec `spotsNeeded`, `size`, liste des places occupées et `canFitInSpot(spot)`.
* `Motorcycle`, `Car`, `Bus` remplissent ces champs et implémentent le test de taille.
* `ParkingSpot` est une seule classe avec un champ `VehicleSize` (sous-classes LargeSpot / CompactSpot sont souvent excessives: le comportement est le même, seule la taille change).
* `Level` possède un tableau de places et la logique de recherche.
* `ParkingLot` possède un tableau de niveaux et essaie chacun.

Cette découpe sort "trouve cinq Large libres au niveau 2" de la classe racine du parking.

### Comment un niveau cherche

1. Parcours les places de gauche à droite (ou par rangée).
2. Si le véhicule a besoin de `k` places, cherche un index de départ où les `k` suivantes:
   * sont toutes libres,
   * sont dans la **même rangée**,
   * passent chacune `vehicle.canFitInSpot(spot)`.
3. Si trouvé, gare dans les `k` places et enregistre-les sur le véhicule.
4. Sinon, ce niveau renvoie false; le parking tente le suivant.

Garde un compteur de places libres sur le niveau pour sauter un étage plein, et mets-le à jour au stationnement et à la libération.

### Ce qu'il ne faut pas sur-construire

* Pas de passerelle de paiement.
* Pas de navigation GPS jusqu'à la place.
* Pas de "réserve 15 minutes".
* Préfère un seul type `ParkingSpot` plutôt qu'une hiérarchie profonde de places.

Les interviewers veulent des tailles et des bus multi-places modélisés proprement, pas un produit garage complet.

---

## 4. Solution Java

```java
import java.util.ArrayList;

enum VehicleSize {
    Motorcycle,
    Compact,
    Large
}

abstract class Vehicle {
    protected ArrayList<ParkingSpot> parkingSpots = new ArrayList<>();
    protected String licensePlate;
    protected int spotsNeeded;
    protected VehicleSize size;

    public int getSpotsNeeded() {
        return spotsNeeded;
    }

    public VehicleSize getSize() {
        return size;
    }

    public void parkInSpot(ParkingSpot s) {
        parkingSpots.add(s);
    }

    /** Leave every occupied bay and clear local list. */
    public void clearSpots() {
        for (ParkingSpot spot : parkingSpots) {
            spot.removeVehicle();
        }
        parkingSpots.clear();
    }

    /** Size check only: does this bay's type accept this vehicle? */
    public abstract boolean canFitInSpot(ParkingSpot spot);
}

class Motorcycle extends Vehicle {
    public Motorcycle(String plate) {
        licensePlate = plate;
        spotsNeeded = 1;
        size = VehicleSize.Motorcycle;
    }

    @Override
    public boolean canFitInSpot(ParkingSpot spot) {
        // motorcycle fits any painted bay
        return true;
    }
}

class Car extends Vehicle {
    public Car(String plate) {
        licensePlate = plate;
        spotsNeeded = 1;
        size = VehicleSize.Compact;
    }

    @Override
    public boolean canFitInSpot(ParkingSpot spot) {
        VehicleSize s = spot.getSize();
        return s == VehicleSize.Compact || s == VehicleSize.Large;
    }
}

class Bus extends Vehicle {
    public Bus(String plate) {
        licensePlate = plate;
        spotsNeeded = 5;
        size = VehicleSize.Large;
    }

    @Override
    public boolean canFitInSpot(ParkingSpot spot) {
        return spot.getSize() == VehicleSize.Large;
    }
}

class ParkingSpot {
    private Vehicle vehicle;
    private VehicleSize spotSize;
    private int row;
    private int spotNumber;
    private Level level;

    public ParkingSpot(Level level, int row, int spotNumber, VehicleSize size) {
        this.level = level;
        this.row = row;
        this.spotNumber = spotNumber;
        this.spotSize = size;
    }

    public boolean isAvailable() {
        return vehicle == null;
    }

    public VehicleSize getSize() {
        return spotSize;
    }

    public int getRow() {
        return row;
    }

    public int getSpotNumber() {
        return spotNumber;
    }

    /** Available and large enough for this vehicle type (one bay). */
    public boolean canFitVehicle(Vehicle v) {
        return isAvailable() && v.canFitInSpot(this);
    }

    public boolean park(Vehicle v) {
        if (!canFitVehicle(v)) {
            return false;
        }
        vehicle = v;
        v.parkInSpot(this);
        return true;
    }

    public void removeVehicle() {
        vehicle = null;
        level.spotFreed();
    }
}

class Level {
    private int floor;
    private ParkingSpot[] spots;
    private int availableSpots;
    private static final int SPOTS_PER_ROW = 10;

    public Level(int floor, int numberSpots) {
        this.floor = floor;
        spots = new ParkingSpot[numberSpots];
        availableSpots = numberSpots;

        // Simple layout: each row of 10 is Motorcycle, Compact..., Large strip at end.
        // Interviewers care about the model, not the paint pattern.
        for (int i = 0; i < numberSpots; i++) {
            int row = i / SPOTS_PER_ROW;
            VehicleSize size;
            int offsetInRow = i % SPOTS_PER_ROW;
            if (offsetInRow < 2) {
                size = VehicleSize.Motorcycle;
            } else if (offsetInRow < 6) {
                size = VehicleSize.Compact;
            } else {
                size = VehicleSize.Large; // last 4 are Large in this toy map
            }
            // Prefer enough Large spots per row for a bus demo: force last 5 Large.
            if (offsetInRow >= 5) {
                size = VehicleSize.Large;
            }
            spots[i] = new ParkingSpot(this, row, i, size);
        }
    }

    public int availableSpots() {
        return availableSpots;
    }

    public void spotFreed() {
        availableSpots++;
    }

    public boolean parkVehicle(Vehicle vehicle) {
        if (availableSpots() < vehicle.getSpotsNeeded()) {
            return false;
        }
        int spotNumber = findAvailableSpots(vehicle);
        if (spotNumber < 0) {
            return false;
        }
        return parkStartingAtSpot(spotNumber, vehicle);
    }

    private boolean parkStartingAtSpot(int spotNumber, Vehicle vehicle) {
        boolean success = true;
        for (int i = spotNumber; i < spotNumber + vehicle.getSpotsNeeded(); i++) {
            success &= spots[i].park(vehicle);
        }
        availableSpots -= vehicle.getSpotsNeeded();
        return success;
    }

    /**
     * First index where vehicle.spotsNeeded consecutive spots
     * are free, same row, and each passes canFitVehicle.
     */
    private int findAvailableSpots(Vehicle vehicle) {
        int spotsNeeded = vehicle.getSpotsNeeded();
        int lastRow = -1;
        int spotsFound = 0;

        for (int i = 0; i < spots.length; i++) {
            ParkingSpot spot = spots[i];
            if (lastRow != spot.getRow()) {
                spotsFound = 0;
                lastRow = spot.getRow();
            }
            if (spot.canFitVehicle(vehicle)) {
                spotsFound++;
            } else {
                spotsFound = 0;
            }
            if (spotsFound == spotsNeeded) {
                return i - (spotsNeeded - 1);
            }
        }
        return -1;
    }
}

class ParkingLot {
    private Level[] levels;

    public ParkingLot(int numLevels, int spotsPerLevel) {
        levels = new Level[numLevels];
        for (int i = 0; i < numLevels; i++) {
            levels[i] = new Level(i, spotsPerLevel);
        }
    }

    /** Try each floor until one accepts the vehicle. */
    public boolean parkVehicle(Vehicle vehicle) {
        for (Level level : levels) {
            if (level.parkVehicle(vehicle)) {
                return true;
            }
        }
        return false;
    }
}
```

Parcours:

| Étape | Action | Résultat |
| --- | --- | --- |
| 1 | `parkVehicle(new Motorcycle("M1"))` | prend la première place libre qui accepte toute taille |
| 2 | `parkVehicle(new Car("C1"))` | besoin de Compact ou Large; le filtre est dans `canFitInSpot` |
| 3 | `parkVehicle(new Bus("B1"))` | besoin de cinq Large d'affilée, même rangée |
| 4 | Parking plein pour les bus | `parkVehicle` renvoie `false` après l'échec de tous les niveaux |
| 5 | `vehicle.clearSpots()` | chaque place se libère et le compteur du niveau monte |

La recherche bus réinitialise le compteur consécutif quand la **rangée** change. C'est le bug facile à rater: cinq Large qui enjambent deux rangées ne forment pas un emplacement bus valide.

---

## 5. Tableau de complexité

| Opération | Temps | Notes |
| --- | --- | --- |
| `parkVehicle` sur un niveau | O(S) | S = places du niveau; parcours d'une suite |
| `parkVehicle` sur le parking | O(L * S) | L niveaux, pire cas tous les étages |
| `clearSpots` | O(k) | k = places du véhicule (1 ou 5) |
| Test `canFitInSpot` | O(1) | comparaison d'enum |

L'espace est O(places totales) pour le graphe du garage, plus O(k) références par véhicule garé. Pas besoin d'index sophistiqué pour la version entretien. Si le parking était énorme et qu'il fallait un "trouve cinq Large" plus rapide, tu pourrais garder des métadonnées de suites libres par rangée; dis-le en follow-up, ne le construis pas d'abord.

---

## 6. Cas limites et erreurs fréquentes

Les interviewers poussent ici:

* **Bus, même rangée:** des indices consécutifs qui franchissent une limite de rangée doivent échouer.
* **Moto sur place Large:** autorisé avec ces règles; ne refuse pas sauf changement de politique.
* **Voiture sur place Motorcycle:** interdit; seulement Compact ou Large.
* **Stationnement partiel puis échec:** gare les `k` places ou aucune. Le croquis gare en boucle après que `find` a déjà validé la suite; si tu gares en cherchant, fais un rollback en cas d'échec.
* **Double stationnement du même véhicule:** refuse ou libère d'abord; définis le contrat.
* **Sortie sans véhicule:** `clearSpots` sur liste vide est un no-op.
* **availableSpots vs libres réels:** tiens le compteur à jour au park et `removeVehicle`.
* **Parking plein:** renvoie `false`. Ne lève pas d'exception si ce n'est pas ton contrat.

Erreurs fréquentes:

1. **Sauter les hypothèses.** L'énoncé est vague exprès. Liste véhicules, tailles, multi-niveaux et règles bus d'abord.
2. **Héritage profond de places** sans différence de comportement. Un `ParkingSpot` + enum de taille suffit.
3. **Mettre toute la recherche dans `ParkingLot`.** Les niveaux possèdent les tableaux; le parking délègue seulement.
4. **Oublier l'occupation multi-places sur le véhicule.** Le véhicule doit connaître ses places pour sortir en un appel.
5. **Laisser un bus se découper entre rangées ou niveaux.**
6. **Vérifier seulement la taille ou seulement la dispo, pas les deux.**
7. **Coder en dur "bus = 5" dans le niveau sans `spotsNeeded`.** Mets le nombre sur le véhicule pour qu'un futur van de 2 places réutilise la même boucle de recherche.

Usage minimal:

```java
ParkingLot lot = new ParkingLot(3, 30);
Vehicle bike = new Motorcycle("M-11");
Vehicle car = new Car("C-22");
Vehicle bus = new Bus("B-33");

System.out.println(lot.parkVehicle(bike)); // true if any free bay
System.out.println(lot.parkVehicle(car));  // true if Compact/Large free
System.out.println(lot.parkVehicle(bus));  // true if 5 Large same row
bus.clearSpots();                          // frees those five bays
```

---

## 7. Récap à raconter à un ami

Parking Lot est un exercice OOD sur les **règles de taille et la composition**, pas sur des algorithmes malins.

1. **Énonce les hypothèses:** garage multi-niveaux; places moto / compacte / large; moto, voiture, bus.
2. **Règles d'emboîtement:** moto partout; voiture sur compacte ou large; bus sur cinq large d'affilée dans une rangée.
3. **Classes:** hiérarchie `Vehicle`, `ParkingSpot` avec enum de taille, `Level` qui cherche des suites, `ParkingLot` qui essaie les niveaux.
4. **Garer:** trouve un index de départ valide, occupe toutes les places nécessaires, mémorise-les sur le véhicule.
5. **Partir:** `clearSpots` libère chaque place et met à jour les compteurs.
6. **Geste d'entretien:** parle des hypothèses d'abord, garde la hiérarchie des places plate, mets la logique multi-places sur le niveau.

Si tu peux expliquer pourquoi un bus est "cinq Large dans la même rangée" et montrer quelle classe l'impose, tu maîtrises le 7.4. La prochaine étape OOD est un lecteur de livres en ligne: utilisateurs, bibliothèque et affichage se séparent de la même façon que niveaux et places ici.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Jukebox](/blog/fr/ctci-7-3-jukebox)
* Suivant: [Online Book Reader](/blog/fr/ctci-7-5-online-book-reader)