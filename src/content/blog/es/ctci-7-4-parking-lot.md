---
title: "Parking Lot: Object-Oriented Multi-Level Parking System Design (CTCI 7.4)"
description: "Design a parking lot using object-oriented principles covering multiple vehicle sizes (Motorcycle, Car, Bus), multi-level spot allocation, and spot compaction."
date: "2026-05-06"
tags: [Algoritmos y Estructuras, Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/ctci-7-4-parking-lot.webp
previewImage: /assets/images/ctci-7-4-parking-lot.webp
---

> **TL;DR**
> * **The Book Problem:** Design a parking lot using object-oriented principles.
> * **The Core Breakthrough:** Vehicle Polymorphism: Abstract `Vehicle` with `VehicleSize` (Motorcycle, Compact, Large). Multi-level `ParkingLot` containing `Level` arrays and `ParkingSpot` objects supporting multi-spot vehicle reservations (Buses require 5 contiguous large spots).
> * **Production Reality:** Automated smart parking garage management systems and IoT parking space sensors.

## 1. The Book Problem Formulation

In *Cracking the Coding Interview* (Problem 7.4), we are asked to design an object-oriented model for a multi-level parking lot supporting motorcycles, compact cars, and large buses.

## 2. Object-Oriented Modeling & Spot Allocation

1. `VehicleSize`: `Motorcycle`, `Compact`, `Large`.
2. `abstract class Vehicle`: Contains license plate, spots needed, and `canFitInSpot(ParkingSpot spot)`.
   * Motorcycle fits in any spot.
   * Compact car fits in Compact or Large spots.
   * Bus fits only in Large spots and requires 5 contiguous spots.
3. `class ParkingSpot`: Tracks row, spot number, spot size, and current vehicle.
4. `class Level`: Manages a 1D array of spots and available spot counters.
5. `class ParkingLot`: Coordinates multiple levels and entry/exit gates.

## Implementación en producción

```java
import java.util.*;

public class ParkingLotDesign {
    public enum VehicleSize { Motorcycle, Compact, Large }

    public static abstract class Vehicle {
        protected String licensePlate;
        protected int spotsNeeded;
        protected VehicleSize size;
        protected List<ParkingSpot> parkingSpots = new ArrayList<>();

        public int getSpotsNeeded() { return spotsNeeded; }
        public VehicleSize getSize() { return size; }
        public void parkInSpot(ParkingSpot s) { parkingSpots.add(s); }
        public void clearSpots() {
            for (ParkingSpot s : parkingSpots) s.removeVehicle();
            parkingSpots.clear();
        }
        public abstract boolean canFitInSpot(ParkingSpot spot);
    }

    public static class Car extends Vehicle {
        public Car() { spotsNeeded = 1; size = VehicleSize.Compact; }
        public boolean canFitInSpot(ParkingSpot spot) {
            return spot.getSize() == VehicleSize.Compact || spot.getSize() == VehicleSize.Large;
        }
    }

    public static class ParkingSpot {
        private Vehicle vehicle;
        private final VehicleSize spotSize;
        private final int spotNumber;
        public ParkingSpot(int num, VehicleSize sz) { this.spotNumber = num; this.spotSize = sz; }
        public boolean isAvailable() { return vehicle == null; }
        public VehicleSize getSize() { return spotSize; }
        public boolean park(Vehicle v) {
            if (!v.canFitInSpot(this)) return false;
            this.vehicle = v;
            v.parkInSpot(this);
            return true;
        }
        public void removeVehicle() { this.vehicle = null; }
    }
}
```

## Análisis de complejidad y memoria

| Métrica | Complejidad | Detalle técnico |
|---|---|---|
| parkVehicle() Time | `O(Spots per Level)` | Linear scan for contiguous free spots. |
| freeVehicle() Time | `O(1)` | Direct spot clearance using vehicle reference. |
| Space Complexity | `O(Total Spots)` | Grid array memory allocation. |

## Discusión de ingeniería de sistemas en el mundo real

Commercial parking garage systems (Smart Parking / ParkWhiz) combine ultrasonic occupancy sensors with real-time reservation databases to guide drivers via digital signage.

## Casos límite y robustez en producción

1. Bus parking requires 5 consecutive contiguous spots on the same row.
2. Lot is completely full: Fails gracefully without throwing exceptions.
