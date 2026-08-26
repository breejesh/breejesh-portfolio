---
title: "पार्किंग लॉट: मोटरसाइकिल, कार और बस के लिए बहु-मंज़िला जगहें (जावा)"
description: "शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.४: मोटरसाइकिल, कॉम्पैक्ट और बड़ी जगहों वाला बहु-मंज़िला पार्किंग लॉट डिज़ाइन करो। आकार नियमों के साथ मोटरसाइकिल, कार और बस पार्क करो, साफ़ जावा क्लासों में।"
date: "2025-12-11"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-4-parking-lot.webp
previewImage: /assets/images/ctci-7-4-parking-lot.webp
---


> **टीएल;डीआर**
> * **समस्या:** डेटा संरचनाओं और एल्गोरिदम के लिए समय और स्थान जटिलता (टाइम एंड स्पेस कॉम्प्लेक्सिटी) का अनुकूलन।
> * **दृष्टिकोण:** शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.४: मोटरसाइकिल, कॉम्पैक्ट और बड़ी जगहों वाला बहु-मंज़िला पार्किंग लॉट डिज़ाइन करो। आकार नियमों के साथ मोटरसाइकिल, कार और बस पार्क करो, साफ़ जावा क्लासों में।
> * **जटिलता:** सीमांत मामलों (एज केसेस) के प्रबंधन के साथ इष्टतम समय और मेमोरी संतुलन।

पार्किंग गैरेज खाली बक्सों का एक बड़ा ऐरे नहीं है। इसमें **मंज़िलें**, **पंक्तियाँ** और **अलग-अलग आकार की जगहें** होती हैं। मोटरसाइकिल लगभग कहीं भी फिट हो जाती है। कार को कॉम्पैक्ट या बड़ी जगह चाहिए। बस को **एक ही पंक्ति में पाँच बड़ी जगहें लगातार** चाहिए, अलग-अलग मंज़िलों पर पाँच यादृच्छिक छेद नहीं।

यह पोस्ट शुरुआती लोगों के लिए **जावा** में मूल शिक्षण है। इंटरव्यू वाले ऑब्जेक्ट-ओरिएंटेड डिज़ाइन परिवार की समस्या, किताब की नकल नहीं। [सीटीसीआई जावा सीरीज़](/blog/hi/ctci-series-guide) का हिस्सा। अध्याय ७, ऑब्जेक्ट-ओरिएंटेड डिज़ाइन: समस्या ७.४।

---

## १. रोज़मर्रा की उपमा

मॉल का बहु-मंज़िला गैरेज सोचो:

* मंज़िल १, मंज़िल २, मंज़िल ३, हर एक पर पेंट की जगहें।
* कुछ जगहें सिर्फ मोटरसाइकिल के लिए।
* कुछ कॉम्पैक्ट कार के लिए।
* कुछ बड़ी (वैन / बस) के लिए, अक्सर एक पंक्ति में लगातार पट्टी।

जब वाहन आता है, अटेंडेंट नया नियम नहीं गढ़ता। पूछता है: **यह वाहन किस आकार का है, कितनी जगहें चाहिए, और कोई खाली क्रम फिट बैठता है?**

पूरा डिज़ाइन यही है: आकार जानने वाले ऑब्जेक्ट, आकार और कब्ज़ा जानने वाली जगहें, खाली क्रम खोजने वाले स्तर, और क्रम से हर स्तर से पूछने वाला लॉट।

---

## २. समस्या सादे शब्दों में

**लक्ष्य:** ऑब्जेक्ट-ओरिएंटेड सिद्धांतों से पार्किंग लॉट की क्लासें डिज़ाइन करो।

इंटरव्यू का प्रॉम्प्ट जानबूझकर अस्पष्ट है। तुम्हें **अनुमान साफ़ कहने** होंगे। इस पोस्ट के अनुमान ये हैं (इंटरव्यू में ज़ोर से बोलो; दूसरे अनुमान भी ठीक हैं अगर तुम सुसंगत रहो)।

**संरचना:**

* कई **स्तर** (मंज़िलें)।
* हर स्तर पर जगहों की कई **पंक्तियाँ**।
* जगह के आकार: `Motorcycle`, `Compact`, `Large`।

**वाहन:**

| वाहन | जगहें | इस्तेमाल कर सकता है |
| --- | --- | --- |
| मोटरसाइकिल | १ | किसी भी आकार की जगह |
| कार | १ | कॉम्पैक्ट या बड़ी |
| बस | ५ | **एक ही पंक्ति** में पाँच **लगातार बड़ी** जगहें |

**मुख्य ऑपरेशन:**

| मेथड | मतलब |
| --- | --- |
| `parkVehicle(vehicle)` | खाली जगह(ें) ढूँढो और घेरो; सफलता / असफलता लौटाओ |
| अनपार्क / जगहें साफ़ | वाहन की हर जगह खाली करो |
| `availableSpots()` (वैकल्पिक) | स्तर या लॉट पर खाली जगहों की गिनती |

**कोड से पहले साफ़ करो:**

* पेड टिकट, घंटे, भुगतान? जब तक न पूछा जाए, दायरे से बाहर।
* कई प्रवेश द्वार और संगामिति? पहले सिंगल-थ्रेड मॉडल।
* जगह लेआउट: इंटरव्यू स्केच में निर्माण पर तय।
* लॉट भरा हो तो? `false` लौटाओ (या थ्रो; एक कॉन्ट्रैक्ट चुनो)।

**सिग्नेचर का आकार:**

```java
boolean parkVehicle(Vehicle vehicle);
void clearSpots(); // on the vehicle: leave every bay it occupies
```

---

## ३. पहले सोचो

### क्लास डायग्राम से नहीं, अनुमान से शुरू करो

ऑब्जेक्ट-ओरिएंटेड डिज़ाइन इंटरव्यू तब बिगड़ते हैं जब लोग बस को क्या चाहिए कहने से पहले बीस बक्से खींच लेते हैं। पहले फिट नियम लिखो। क्लासें नियमों से निकलती हैं।

### "इस एक जगह में फिट" और "काफ़ी लगातार जगहें" अलग रखो

* **आकार फिट:** क्या यह वाहन प्रकार कानूनी तौर पर इस जगह के पेंट आकार का उपयोग कर सकता है?
* **गिनती / क्रम फिट:** वाहन को १ जगह चाहिए या एक पंक्ति में ५ लगातार बड़ी?

बस दोनों पास करे। सिर्फ एक बड़ी जगह पर आकार जाँचना काफ़ी नहीं।

### वाहनों के लिए इनहेरिटेंस, गैरेज के लिए कंपोज़िशन

* `Vehicle` ऐब्स्ट्रैक्ट बेस: `spotsNeeded`, `size`, कब्ज़े वाली जगहों की सूची, और `canFitInSpot(spot)`।
* `Motorcycle`, `Car`, `Bus` वे फ़ील्ड सेट करें और आकार जाँच लागू करें।
* `ParkingSpot` एक क्लास, `VehicleSize` फ़ील्ड के साथ (बड़ी/कॉम्पैक्ट सबक्लास अक्सर ज़्यादा: व्यवहार एक, सिर्फ़ आकार अलग)।
* `Level` जगहों का ऐरे और खोज तर्क रखे।
* `ParkingLot` स्तरों का ऐरे रखे और हर स्तर आज़माए।

यह बँटवारा "मंज़िल २ पर पाँच खाली बड़ी जगहें ढूँढो" को ऊपर वाले लॉट क्लास से बाहर रखता है।

### एक स्तर कैसे खोजता है

१. जगहें बाएँ से दाएँ (या पंक्ति अनुसार) चलो।
२. अगर वाहन को `k` जगहें चाहिए, ऐसा शुरुआती इंडेक्स ढूँढो जहाँ अगली `k`:
   * सभी खाली हों,
   * **एक ही पंक्ति** में हों,
   * हर एक `vehicle.canFitInSpot(spot)` पास करे।
३. मिले तो सभी `k` जगहों पर पार्क करो और वाहन पर लिखो।
४. न मिले तो इस स्तर के लिए `false`; लॉट अगला स्तर आज़माए।

स्तर पर खाली जगहों का काउंटर रखो ताकि भरी मंज़िल जल्दी छूटे, और पार्क / खाली पर बढ़ाओ-घटाओ।

### क्या न बनाओ

* भुगतान गेटवे नहीं।
* जगह तक जीपीएस नेविगेशन नहीं।
* "१५ मिनट रिज़र्व" नहीं।
* गहरी जगह सबक्लास पदानुक्रम के बजाय एक `ParkingSpot`।

इंटरव्यूअर को साफ़ आकार नियम और बहु-जगह बस मॉडल चाहिए, पूरा प्रोडक्ट गैरेज नहीं।

---

## ४. जावा समाधान

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

चलकर देखो:

| कदम | क्रिया | नतीजा |
| --- | --- | --- |
| १ | `parkVehicle(new Motorcycle("M1"))` | पहली खाली जगह लेता है जो कोई भी आकार स्वीकारे |
| २ | `parkVehicle(new Car("C1"))` | कॉम्पैक्ट या बड़ी चाहिए; फ़िल्टर `canFitInSpot` में |
| ३ | `parkVehicle(new Bus("B1"))` | पाँच लगातार बड़ी, एक पंक्ति |
| ४ | बसों के लिए लॉट भरा | हर स्तर फेल होने पर `parkVehicle` → `false` |
| ५ | `vehicle.clearSpots()` | हर जगह खाली, स्तर का काउंटर ऊपर |

बस खोज **पंक्ति** बदलते ही लगातार काउंटर रीसेट करती है। आसान बग: दो पंक्तियों में फैली पाँच बड़ी जगहें वैध बस स्लॉट नहीं।

---

## ५. जटिलता तालिका

| ऑपरेशन | समय | नोट |
| --- | --- | --- |
| एक स्तर पर `parkVehicle` | ओ(एस) | एस = उस स्तर की जगहें; क्रम स्कैन |
| लॉट पर `parkVehicle` | ओ(एल × एस) | एल स्तर, सबसे खराब सभी मंज़िलें |
| `clearSpots` | ओ(क) | क = वाहन की जगहें (१ या ५) |
| `canFitInSpot` आकार जाँच | ओ(१) | एनम तुलना |

जगह ओ(कुल जगहें) गैरेज ग्राफ़ के लिए, प्लस हर पार्क वाहन पर ओ(क) रेफ़रेंस। इंटरव्यू संस्करण में फैंसी इंडेक्स ज़रूरी नहीं। अगर लॉट बहुत बड़ा हो और "पाँच बड़ी ढूँढो" तेज़ चाहिए, पंक्ति अनुसार खाली-क्रम मेटाडेटा रख सकते हो; फॉलो-अप में बोलो, पहले मत बनाओ।

---

## ६. किनारे के मामले और आम गलतियाँ

इंटरव्यूअर ये छेड़ते हैं:

* **बस, एक ही पंक्ति:** पंक्ति सीमा पार करते लगातार इंडेक्स फेल होने चाहिए।
* **बड़ी जगह पर मोटरसाइकिल:** इन नियमों में अनुमति; नीति बदले बिना मना मत करो।
* **मोटरसाइकिल जगह पर कार:** मना; सिर्फ़ कॉम्पैक्ट या बड़ी।
* **आधा पार्क फिर फेल:** `k` जगहें सब या कोई नहीं। स्केच `find` के बाद लूप में पार्क करता है; खोजते-खोजते पार्क करो तो फेल पर रोलबैक।
* **एक ही वाहन दो बार पार्क:** अस्वीकार या पहले साफ़; कॉन्ट्रैक्ट तय करो।
* **बिना वाहन के अनपार्क:** खाली सूची पर `clearSpots` कोई-ऑप।
* **खाली-जगह काउंटर बनाम असली खाली:** पार्क और `removeVehicle` पर काउंटर मेल रखो।
* **भरा लॉट:** `false` लौटाओ। जब तक कॉन्ट्रैक्ट न कहा हो, थ्रो मत करो।

आम गलतियाँ:

१. **अनुमान छोड़ना।** प्रॉम्प्ट जानबूझकर अस्पष्ट है। पहले वाहन, आकार, बहु-मंज़िल, बस नियम लिखो।
२. **बिना व्यवहार भेद के गहरी जगह इनहेरिटेंस।** एक `ParkingSpot` + आकार एनम काफ़ी।
३. **सारी खोज `ParkingLot` में डालना।** स्तर ऐरे रखते हैं; लॉट सिर्फ़ सौंपता है।
४. **वाहन पर बहु-जगह कब्ज़ा भूलना।** निकलने के लिए वाहन को अपनी जगहें पता होनी चाहिए।
५. **बस को पंक्तियों या मंज़िलों में बाँटना।**
६. **सिर्फ़ आकार या सिर्फ़ उपलब्धता जाँचना, दोनों नहीं।**
७. **स्तर में बिना `spotsNeeded` के "बस = ५" हार्डकोड।** संख्या वाहन पर रखो ताकि २ जगह की भविष्य वैन वही खोज लूप इस्तेमाल करे।

न्यूनतम उपयोग:

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

## ७. दोस्त को समझाने वाला सार

पार्किंग लॉट **आकार नियमों और कंपोज़िशन** का ऑब्जेक्ट-ओरिएंटेड डिज़ाइन अभ्यास है, चालाक एल्गोरिदम का नहीं।

१. **अनुमान बोलो:** बहु-मंज़िला गैरेज; मोटरसाइकिल / कॉम्पैक्ट / बड़ी जगहें; मोटरसाइकिल, कार, बस।
२. **फिट नियम:** बाइक कहीं भी; कार कॉम्पैक्ट या बड़ी पर; बस एक पंक्ति में पाँच बड़ी लगातार।
३. **क्लासें:** `Vehicle` पदानुक्रम, आकार एनम वाला `ParkingSpot`, क्रम खोजने वाला `Level`, स्तर आज़माने वाला `ParkingLot`।
४. **पार्क:** वैध शुरुआती इंडेक्स ढूँढो, ज़रूरी जगहें घेरो, वाहन पर याद रखो।
५. **निकलना:** `clearSpots` हर जगह खाली करे और गिनती अपडेट करे।
६. **इंटरव्यू चाल:** पहले अनुमान, जगह पदानुक्रम सपाट, बहु-जगह तर्क स्तर पर।

अगर समझा सको कि बस "एक पंक्ति में पाँच बड़ी" क्यों है और कौन-सी क्लास इसे लागू करती है, समस्या ७.४ तुम्हारी है। अगला ऑब्जेक्ट-ओरिएंटेड डिज़ाइन पड़ाव ऑनलाइन बुक रीडर है: उपयोगकर्ता, लाइब्रेरी और डिस्प्ले उसी तरह अलग होते हैं जैसे यहाँ स्तर और जगहें।

---

## सीरीज़

* गाइड: [सीटीसीआई सीरीज़ गाइड](/blog/hi/ctci-series-guide)
* पिछला: [ज्यूकबॉक्स](/blog/hi/ctci-7-3-jukebox)
* अगला: [ऑनलाइन बुक रीडर](/blog/hi/ctci-7-5-online-book-reader)