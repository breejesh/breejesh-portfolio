---
title: "पार्किंग स्थल (Parking Lot): बहु-स्तरीय पार्किंग सिस्टम डिज़ाइन (सीटीसीआई ७.४)"
description: "मोटरसाइकिल, कार और बस जैसे विभिन्न वाहनों, बहु-स्तरीय स्थान आवंटन और सन्निहित स्पॉट आरक्षण के साथ पार्किंग स्थल का ऑब्जेक्ट-ओरिएंटेड डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-4-parking-lot.webp
previewImage: /assets/images/ctci-7-4-parking-lot.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** ऑब्जेक्ट-ओरिएंटेड सिद्धांतों का उपयोग करके एक पार्किंग स्थल डिज़ाइन करें।
> * **मुख्य समाधान:** **वाहन पॉलीमॉर्फिज्म**: अमूर्त `Vehicle` और आकार एनम `VehicleSize` (मोटरसाइकिल, कॉम्पैक्ट, लार्ज)। बहु-स्तरीय `ParkingLot` जिसमें `Level` सरणियाँ और `ParkingSpot` ऑब्जेक्ट शामिल हैं जो बहु-स्थान आरक्षण का समर्थन करते हैं (बसों को ५ लगातार बड़े स्थानों की आवश्यकता होती है)।
> * **रियल-वर्ल्ड सिस्टम:** स्मार्ट स्वचालित पार्किंग गैराज सिस्टम और आईओटी (IoT) अधिभोग सेंसर।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ७.४) में, मोटरसाइकिल, कॉम्पैक्ट कारों और बड़ी बसों का समर्थन करने वाले बहु-स्तरीय पार्किंग स्थल के लिए एक स्वच्छ ऑब्जेक्ट-ओरिएंटेड मॉडल डिज़ाइन करने के लिए कहा गया है।

## २. ऑब्जेक्ट-ओरिएंटेड मॉडलिंग और स्पॉट आवंटन

१. `VehicleSize`: `Motorcycle`, `Compact`, `Large`।
२. `abstract class Vehicle`: लाइसेंस प्लेट, आवश्यक स्थान और `canFitInSpot()` विधि शामिल हैं:
   * मोटरसाइकिल किसी भी स्थान पर फिट होती है।
   * कॉम्पैक्ट कार कॉम्पैक्ट या लार्ज स्पॉट में फिट होती है।
   * बस केवल लार्ज स्पॉट में फिट होती है और उसे ५ लगातार सन्निहित स्थानों की आवश्यकता होती है।
३. `class ParkingSpot`: पंक्ति, स्थान संख्या, आकार और वर्तमान वाहन को ट्रैक करता है।
४. `class Level`: स्थानों और उपलब्ध काउंटरों का प्रबंधन करता है।
५. `class ParkingLot`: कई मंजिलों और प्रवेश द्वारों का समन्वय करता है।

## प्रोडक्शन कार्यान्वयन

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

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| parkVehicle() समय | `O(स्पॉट प्रति तल)` | लगातार खाली स्थानों की रैखिक खोज। |
| freeVehicle() समय | `O(१)` | वाहन संदर्भ का उपयोग करके सीधे स्पॉट खाली करना। |
| मेमोरी जटिलता | `O(कुल स्पॉट)` | ग्रिड सरणी मेमोरी आवंटन। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: स्मार्ट पार्किंग गैराज

वाणिज्यिक पार्किंग गैराज सिस्टम (Smart Parking / ParkWhiz) चालकों का मार्गदर्शन करने के लिए वास्तविक समय आरक्षण डेटाबेस के साथ अल्ट्रासोनिक अधिभोग सेंसर का उपयोग करते हैं।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **बस पार्किंग:** एक ही पंक्ति में ५ लगातार सन्निहित स्थानों की आवश्यकता।
२. **पूरी तरह भरा हुआ पार्किंग स्थल:** बिना अपवाद फेंके सुरक्षित रूप से `false` लौटाना।
