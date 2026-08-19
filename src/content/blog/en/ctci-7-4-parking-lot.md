---
title: "Parking Lot: Multi-Level Spots for Motorcycle, Car, and Bus (Java)"
description: "CTCI-style problem 7.4 for beginners: design a multi-level parking lot with motorcycle, compact, and large spots. Park motorcycles, cars, and buses under size rules, with clean Java classes."
date: "2025-12-11"
tags: [Algorithms]
coverImage: /assets/images/ctci-7-4-parking-lot.webp
previewImage: /assets/images/ctci-7-4-parking-lot.webp
---


> **TL;DR**
> * **The Problem:** Balance optimal time against memory boundaries without unnecessary data structure overhead.
> * **The Approach:** CTCI-style problem 7.4 for beginners: design a multi-level parking lot with motorcycle, compact, and large spots. Park motorcycles, cars, and buses under size rules, with clean Java classes.
> * **Complexity:** Optimal Time and Space bounds verified with edge-case handling.

A parking garage is not one big array of empty boxes. It has **floors**, **rows**, and **spots of different sizes**. A motorcycle fits almost anywhere. A car needs a compact or large bay. A bus needs **five large spots in a row**, not five random holes on different floors.

This post is original teaching for beginners in **Java**. Same problem family as classic interview object-oriented design, not a book copy. Part of the [CTCI Java series](/blog/en/ctci-series-guide). Chapter 7, object-oriented design: problem 7.4.

---

## 1. Everyday analogy

Think of a multi-storey garage at a mall:

* Level 1, level 2, level 3, each with painted bays.
* Some bays are motorcycle-only paint.
* Some are compact car paint.
* Some are large (van / bus) paint, often in a continuous strip along a row.

When a vehicle rolls in, the attendant does not invent a new rule set. They ask: **what size is this vehicle, how many spots does it need, and is there a free run that fits?**

That is the whole design: objects that know their size, spots that know their size and occupancy, levels that search for a free run, and a lot that asks each level in order.

---

## 2. Plain problem statement

**Goal:** design classes for a parking lot using object-oriented principles.

The interview prompt is vague on purpose. You must **state assumptions**. Here are the ones this post uses (say them out loud in an interview; different assumptions are fine if you are consistent).

**Structure:**

* Multiple **levels**.
* Each level has multiple **rows** of **parking spots**.
* Spot sizes: `Motorcycle`, `Compact`, `Large`.

**Vehicles:**

| Vehicle | Spots needed | Can use |
| --- | --- | --- |
| Motorcycle | 1 | any spot size |
| Car | 1 | Compact or Large |
| Bus | 5 | five **consecutive Large** spots in the **same row** |

**Core operations:**

| Method | Meaning |
| --- | --- |
| `parkVehicle(vehicle)` | find and occupy free spot(s); return success / fail |
| `unpark` / clear spots | free every bay the vehicle holds |
| `availableSpots()` (optional) | free bay count on a level or the lot |

**Clarify before coding:**

* Paid tickets, hours, and payment? Out of scope unless asked.
* Multiple entrances and concurrency? Single-threaded model first.
* Spot layout: fixed at construction time for the interview sketch.
* What if the lot is full? Return `false` (or throw; pick one contract).

**Signature shape:**

```java
boolean parkVehicle(Vehicle vehicle);
void clearSpots(); // on the vehicle: leave every bay it occupies
```

---

## 3. Think first

### Start with assumptions, not class diagrams

OOD interviews fail when people draw twenty boxes before saying what a bus needs. Write the fit rules first. Classes fall out of the rules.

### Separate "fits this one spot" from "has enough consecutive spots"

* **Size fit:** can this vehicle type legally use this bay's paint size?
* **Count / run fit:** does the vehicle need 1 bay or 5 consecutive Large bays in one row?

A bus must pass both. Checking only size on a single Large bay is not enough.

### Inheritance for vehicles, composition for the garage

* `Vehicle` abstract base with `spotsNeeded`, `size`, list of occupied spots, and `canFitInSpot(spot)`.
* `Motorcycle`, `Car`, `Bus` set those fields and implement the size check.
* `ParkingSpot` is one class with a `VehicleSize` field (subclassing LargeSpot / CompactSpot is usually overkill: behavior is the same, only size differs).
* `Level` owns an array of spots and the search logic.
* `ParkingLot` owns an array of levels and tries each level.

That split keeps "find five free Large spots on floor 2" out of the top-level lot class.

### How find works (one level)

1. Walk spots left to right (or by row).
2. For a vehicle that needs `k` spots, look for a starting index where the next `k` spots:
   * are all available,
   * are all in the **same row**,
   * each passes `vehicle.canFitInSpot(spot)`.
3. If found, park into all `k` spots and record them on the vehicle.
4. If not, return false for this level; the lot tries the next level.

Keep a free-spot counter on the level so you can skip a full floor quickly, and bump it on park / free.

### What not to overbuild

* No payment gateway.
* No GPS navigation to the bay.
* No "reserve for 15 minutes" hold.
* Prefer one `ParkingSpot` type over a deep hierarchy of spot subclasses.

Interviewers care that sizes and multi-spot buses are modeled cleanly, not that you shipped a real garage product.

---

## 4. Java solution

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

Walkthrough:

| Step | Action | Result |
| --- | --- | --- |
| 1 | `parkVehicle(new Motorcycle("M1"))` | takes first free bay that accepts any size |
| 2 | `parkVehicle(new Car("C1"))` | needs Compact or Large; skips pure motorcycle-only logic via `canFitInSpot` |
| 3 | `parkVehicle(new Bus("B1"))` | needs five consecutive Large spots, same row |
| 4 | Lot full for buses | `parkVehicle` returns `false` after every level fails |
| 5 | `vehicle.clearSpots()` | each bay clears, level free count rises |

The bus search resets the consecutive counter when the **row** changes. That is the easy bug to miss: five Large spots that wrap across two rows must not count as a valid bus slot.

---

## 5. Complexity table

| Operation | Time | Notes |
| --- | --- | --- |
| `parkVehicle` on one level | O(S) | S = spots on that level; scan for a run |
| `parkVehicle` on the lot | O(L * S) | L levels, worst case try all floors |
| `clearSpots` | O(k) | k = spots the vehicle holds (1 or 5) |
| Size check `canFitInSpot` | O(1) | enum compare |

Space is O(total spots) for the garage graph, plus O(k) references per parked vehicle. No fancy index is required for the interview version. If the lot were huge and you needed faster "find five Large," you could keep free-run metadata per row; say that as a follow-up, do not build it first.

---

## 6. Edge cases and common mistakes

Interviewers poke these:

* **Bus needs same row:** consecutive indices that cross a row boundary must fail.
* **Motorcycle in a Large spot:** allowed under these rules; do not refuse unless the interviewer changes the policy.
* **Car in Motorcycle spot:** not allowed; only Compact or Large.
* **Partial park then fail:** park all `k` spots or none. The sketch parks in a loop after `find` already verified the run; if you park as you search, roll back on failure.
* **Double park the same vehicle:** reject or clear first; define the contract.
* **Unpark missing vehicle:** `clearSpots` on empty list is a no-op.
* **availableSpots vs real free count:** keep the counter in sync on park and `removeVehicle`.
* **Full lot:** return `false`. Do not throw unless that is your stated contract.

Common mistakes:

1. **Skipping assumptions.** The prompt is intentionally vague. List vehicles, spot sizes, multi-level, and bus rules first.
2. **Deep spot inheritance** with no behavior difference. One `ParkingSpot` + size enum is enough.
3. **Putting all search logic in `ParkingLot`.** Levels own the bay arrays; the lot only delegates.
4. **Forgetting multi-spot occupation on the vehicle.** The vehicle should know which bays it holds so exit is one call.
5. **Allowing a bus to split across rows or levels.**
6. **Only checking size, not availability, or the reverse.**
7. **Hard-coding "bus = 5" in the level without `spotsNeeded`.** Put the number on the vehicle so a future van of 2 spots reuses the same find loop.

Minimal usage sketch:

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

## 7. Explain to a friend recap

Parking Lot is an OOD exercise about **size rules and composition**, not clever algorithms.

1. **State assumptions:** multi-level garage; motorcycle / compact / large spots; motorcycle, car, bus.
2. **Fit rules:** bike anywhere; car on compact or large; bus on five consecutive large spots in one row.
3. **Classes:** `Vehicle` hierarchy, `ParkingSpot` with a size enum, `Level` that searches runs, `ParkingLot` that tries levels.
4. **Park:** find a starting index for a valid run, occupy all needed spots, remember them on the vehicle.
5. **Leave:** `clearSpots` frees every bay and updates free counts.
6. **Interview move:** talk assumptions first, keep spot hierarchy flat, put multi-bay logic on the level.

If you can explain why a bus is "five Large in the same row" and point to which class enforces that, you own problem 7.4. The next OOD stop is an online book reader: users, library, and display split cleanly the same way levels and spots do here.

---

## Series

* Guide: [CTCI series guide](/blog/en/ctci-series-guide)
* Previous: [Jukebox](/blog/en/ctci-7-3-jukebox)
* Next: [Online Book Reader](/blog/en/ctci-7-5-online-book-reader)