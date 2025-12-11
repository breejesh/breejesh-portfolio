---
title: "Parking Lot: plazas multiplanta para moto, coche y autobús (Java)"
description: "Problema estilo CTCI 7.4 para principiantes: diseña un parking multiplanta con plazas de moto, compactas y grandes. Aparca motos, coches y autobuses con reglas de tamaño y clases Java claras."
date: "2025-12-11"
tags: [Algoritmos]
coverImage: /assets/images/ctci-7-4-parking-lot.webp
previewImage: /assets/images/ctci-7-4-parking-lot.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 7.4 para principiantes: diseña un parking multiplanta con plazas de moto, compactas y grandes. Aparca motos, coches y autobuses con reglas de tamaño y clases Java claras.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un garaje no es un gran array de cajas vacías. Tiene **plantas**, **filas** y **plazas de distintos tamaños**. Una moto cabe casi en cualquier sitio. Un coche necesita una plaza compacta o grande. Un autobús necesita **cinco plazas grandes seguidas en la misma fila**, no cinco agujeros al azar en plantas distintas.

Este post es enseñanza original para principiantes en **Java**. Misma familia de problemas de diseño orientado a objetos en entrevistas, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 7, diseño orientado a objetos: problema 7.4.

---

## 1. Analogía cotidiana

Piensa en el parking de un centro comercial:

* Planta 1, planta 2, planta 3, cada una con plazas pintadas.
* Algunas plazas son solo moto.
* Algunas son compactas.
* Algunas son grandes (furgoneta / autobús), a menudo en una franja continua en una fila.

Cuando entra un vehículo, el encargado no inventa reglas nuevas. Pregunta: **qué tamaño es este vehículo, cuántas plazas necesita y hay un tramo libre que encaje?**

Ese es todo el diseño: objetos que conocen su tamaño, plazas que conocen tamaño y ocupación, niveles que buscan un tramo libre, y un parking que pregunta a cada nivel en orden.

---

## 2. Enunciado en palabras simples

**Objetivo:** diseñar clases para un parking con principios orientados a objetos.

El enunciado de entrevista es vago a propósito. Debes **dejar claras las suposiciones**. Estas son las de este post (dilo en voz alta en la entrevista; otras suposiciones valen si eres coherente).

**Estructura:**

* Varias **plantas** (levels).
* Cada planta tiene varias **filas** de **plazas**.
* Tamaños de plaza: `Motorcycle`, `Compact`, `Large`.

**Vehículos:**

| Vehículo | Plazas | Puede usar |
| --- | --- | --- |
| Motorcycle | 1 | cualquier tamaño de plaza |
| Car | 1 | Compact o Large |
| Bus | 5 | cinco plazas **Large consecutivas** en la **misma fila** |

**Operaciones principales:**

| Método | Significado |
| --- | --- |
| `parkVehicle(vehicle)` | busca y ocupa plaza(s) libre(s); devuelve éxito / fallo |
| `unpark` / liberar plazas | libera cada bay que ocupa el vehículo |
| `availableSpots()` (opcional) | plazas libres en un nivel o en el parking |

**Aclara antes de codificar:**

* Tickets de pago, horarios y cobro? Fuera de alcance salvo que lo pidan.
* Varias entradas y concurrencia? Modelo monohilo primero.
* Distribución de plazas: fija al construir, en el boceto de entrevista.
* Si el parking está lleno? Devuelve `false` (o lanza; elige un contrato).

**Forma de las firmas:**

```java
boolean parkVehicle(Vehicle vehicle);
void clearSpots(); // en el vehículo: deja cada plaza que ocupa
```

---

## 3. Pensar primero

### Empieza por suposiciones, no por diagramas de clases

Las entrevistas de OOD fallan cuando alguien dibuja veinte cajas antes de decir qué necesita un autobús. Escribe primero las reglas de encaje. Las clases salen de las reglas.

### Separa "cabe en esta plaza" de "hay suficientes plazas seguidas"

* **Encaje por tamaño:** este tipo de vehículo puede usar legalmente el tamaño de esta plaza?
* **Encaje por cantidad / tramo:** necesita 1 plaza o 5 Large consecutivas en una fila?

Un autobús debe cumplir ambas. Comprobar solo el tamaño de una sola plaza Large no basta.

### Herencia para vehículos, composición para el garaje

* Base abstracta `Vehicle` con `spotsNeeded`, `size`, lista de plazas ocupadas y `canFitInSpot(spot)`.
* `Motorcycle`, `Car`, `Bus` rellenan esos campos e implementan el chequeo de tamaño.
* `ParkingSpot` es una sola clase con un campo `VehicleSize` (subclases LargeSpot / CompactSpot suelen ser excesivas: el comportamiento es el mismo, solo cambia el tamaño).
* `Level` posee un array de plazas y la lógica de búsqueda.
* `ParkingLot` posee un array de niveles e intenta cada uno.

Esa división saca "busca cinco Large libres en la planta 2" de la clase superior del parking.

### Cómo busca un nivel

1. Recorre plazas de izquierda a derecha (o por fila).
2. Si el vehículo necesita `k` plazas, busca un índice de inicio donde las siguientes `k`:
   * estén todas libres,
   * estén en la **misma fila**,
   * cada una pase `vehicle.canFitInSpot(spot)`.
3. Si se encuentra, aparca en las `k` plazas y las registra en el vehículo.
4. Si no, este nivel devuelve false; el parking prueba el siguiente.

Mantén un contador de plazas libres en el nivel para saltar un piso lleno, e incrementa o decrementa al aparcar y liberar.

### Qué no sobreconstruir

* Sin pasarela de pago.
* Sin navegación GPS hasta la plaza.
* Sin reserva de "15 minutos en hold".
* Prefiere un solo tipo `ParkingSpot` frente a una jerarquía profunda de plazas.

Al entrevistador le importa que tamaños y autobuses multiplaza se modelen limpios, no que envíes un producto real de garaje.

---

## 4. Solución en Java

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

Recorrido:

| Paso | Acción | Resultado |
| --- | --- | --- |
| 1 | `parkVehicle(new Motorcycle("M1"))` | toma la primera plaza libre que acepte cualquier tamaño |
| 2 | `parkVehicle(new Car("C1"))` | necesita Compact o Large; el filtro va en `canFitInSpot` |
| 3 | `parkVehicle(new Bus("B1"))` | necesita cinco Large consecutivas, misma fila |
| 4 | Parking lleno para autobuses | `parkVehicle` devuelve `false` tras fallar todos los niveles |
| 5 | `vehicle.clearSpots()` | cada plaza se libera y sube el contador del nivel |

La búsqueda del autobús reinicia el contador consecutivo cuando cambia la **fila**. Ese es el bug fácil de pasar: cinco Large que cruzan dos filas no son un hueco válido de autobús.

---

## 5. Tabla de complejidad

| Operación | Tiempo | Notas |
| --- | --- | --- |
| `parkVehicle` en un nivel | O(S) | S = plazas del nivel; escaneo de un tramo |
| `parkVehicle` en el parking | O(L * S) | L niveles, peor caso todos los pisos |
| `clearSpots` | O(k) | k = plazas del vehículo (1 o 5) |
| Chequeo `canFitInSpot` | O(1) | comparación de enum |

El espacio es O(plazas totales) para el grafo del garaje, más O(k) referencias por vehículo aparcado. No hace falta un índice fancy en la versión de entrevista. Si el parking fuera enorme y quisieras un "encuentra cinco Large" más rápido, podrías guardar metadatos de tramos libres por fila; dilo como follow-up, no lo construyas primero.

---

## 6. Casos límite y errores habituales

Los entrevistadores empujan aquí:

* **Autobús, misma fila:** índices consecutivos que cruzan el límite de fila deben fallar.
* **Moto en plaza Large:** permitido con estas reglas; no lo niegues salvo que el entrevistador cambie la política.
* **Coche en plaza Motorcycle:** no permitido; solo Compact o Large.
* **Aparque parcial y luego fallo:** aparca las `k` plazas o ninguna. El boceto aparca en bucle después de que `find` ya verificó el tramo; si aparcas mientras buscas, haz rollback al fallar.
* **Doble aparque del mismo vehículo:** rechaza o libera primero; define el contrato.
* **Salida sin vehículo:** `clearSpots` con lista vacía es no-op.
* **availableSpots vs libres reales:** mantén el contador al día en park y `removeVehicle`.
* **Parking lleno:** devuelve `false`. No lances excepción si no lo dijiste.

Errores habituales:

1. **Saltar las suposiciones.** El enunciado es vago a propósito. Lista vehículos, tamaños, multiplanta y reglas del bus primero.
2. **Herencia profunda de plazas** sin diferencia de comportamiento. Un `ParkingSpot` + enum de tamaño basta.
3. **Meter toda la búsqueda en `ParkingLot`.** Los niveles poseen los arrays; el parking solo delega.
4. **Olvidar la ocupación multiplaza en el vehículo.** El vehículo debe saber qué plazas tiene para salir en una llamada.
5. **Permitir que un bus se parta entre filas o plantas.**
6. **Comprobar solo tamaño o solo disponibilidad, no ambos.**
7. **Hardcodear "bus = 5" en el nivel sin `spotsNeeded`.** Pon el número en el vehículo para que un futuro furgón de 2 plazas reutilice el mismo bucle de búsqueda.

Uso mínimo:

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

## 7. Recap para contárselo a un amigo

Parking Lot es un ejercicio de OOD sobre **reglas de tamaño y composición**, no sobre algoritmos ingeniosos.

1. **Di las suposiciones:** garaje multiplanta; plazas moto / compacta / grande; moto, coche, autobús.
2. **Reglas de encaje:** moto en cualquier sitio; coche en compacta o grande; bus en cinco large seguidas en una fila.
3. **Clases:** jerarquía `Vehicle`, `ParkingSpot` con enum de tamaño, `Level` que busca tramos, `ParkingLot` que prueba niveles.
4. **Aparcar:** encuentra un índice de inicio válido, ocupa todas las plazas necesarias, guárdalas en el vehículo.
5. **Salir:** `clearSpots` libera cada plaza y actualiza contadores.
6. **Movimiento de entrevista:** habla de suposiciones primero, mantén plana la jerarquía de plazas, pon la lógica multiplaza en el nivel.

Si puedes explicar por qué un bus es "cinco Large en la misma fila" y señalar qué clase lo impone, dominas el 7.4. El siguiente paso OOD es un lector de libros en línea: usuarios, biblioteca y pantalla se separan con la misma idea que niveles y plazas aquí.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Jukebox](/blog/es/ctci-7-3-jukebox)
* Siguiente: [Online Book Reader](/blog/es/ctci-7-5-online-book-reader)