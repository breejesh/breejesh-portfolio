---
title: "पशु आश्रय (Animal Shelter): फीफो बहु-श्रेणी गोद लेने की कतार (सीटीसीआई ३.६)"
description: "कुत्तों और बिल्लियों के लिए अलग-अलग कतारें रखकर आगमन समय के आधार पर O(१) समय और O(N) स्पेस में फीफो (FIFO) पशु गोद लेने की प्रणाली लागू करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-3-6-animal-shelter.webp
previewImage: /assets/images/ctci-3-6-animal-shelter.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक पशु आश्रय में केवल कुत्ते और बिल्लियां हैं और यह कड़ाई से फीफो (FIFO) आधार पर संचालित होता है। लोग या तो समग्र रूप से सबसे पुराने जानवर (`dequeueAny`) को गोद ले सकते हैं, या विशेष रूप से सबसे पुराने कुत्ते (`dequeueDog`) या बिल्ली (`dequeueCat`) को चुन सकते हैं।
> * **मुख्य समाधान:** दो अलग कतारें `LinkedList<Dog> dogs` और `LinkedList<Cat> cats` रखें। प्रत्येक जानवर के प्रवेश पर एक बढ़ता हुआ वैश्विक क्रम (`order`) असाइन करें। `dequeueAny` दोनों कतारों के सिरों की जांच करता है और छोटे `order` वाले को $O(१)$ समय में निकालता है।
> * **रियल-वर्ल्ड सिस्टम:** बहु-किरायेदार पृष्ठभूमि कार्य शेड्यूलर (Celery/BullMQ) और डेटाबेस लॉग अनुक्रम संख्या (LSN)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ३.६) में पूछा गया है:

*"एक पशु आश्रय केवल कुत्तों और बिल्लियों को रखता है और पूर्णतः फीफो आधार पर काम करता है। गोद लेने वाले या तो सबसे पुराने जानवर को ले सकते हैं, या कुत्ता या बिल्ली चुन सकते हैं। enqueue, dequeueAny, dequeueDog और dequeueCat ऑपरेशन लागू करें।"*

## २. मोनोटोनिक ऑर्डर टाइमस्टैम्प के साथ दोहरी कतार डिजाइन

सभी ऑपरेशनों में $O(१)$ समय प्राप्त करने के लिए:
१. कुत्तों और बिल्लियों के लिए अलग कतारें `LinkedList<Dog>` और `LinkedList<Cat>` रखें।
२. `Animal` वर्ग में एक पूर्णांक `order` (टाइमस्टैम्प) रखें।
३. **`enqueue(animal)`:** `animal.setOrder(order++)` सेट करें और संबंधित कतार के अंत में जोड़ें ($O(१)$)।
४. **`dequeueDog()` / `dequeueCat()`:** संबंधित कतार के हेड से सीधे निकालें ($O(१)$)।
५. **`dequeueAny()`:** दोनों कतारों के हेड का `order` देखें और सबसे पुराने जानवर को $O(१)$ में लौटाएं।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.LinkedList;

public class AnimalShelter {
    public static abstract class Animal {
        private int order;
        protected String name;

        public Animal(String n) { name = n; }
        public void setOrder(int ord) { order = ord; }
        public int getOrder() { return order; }
        public String getName() { return name; }

        public boolean isOlderThan(Animal a) {
            return this.order < a.getOrder();
        }
    }

    public static class Dog extends Animal {
        public Dog(String n) { super(n); }
    }

    public static class Cat extends Animal {
        public Cat(String n) { super(n); }
    }

    private final LinkedList<Dog> dogs = new LinkedList<>();
    private final LinkedList<Cat> cats = new LinkedList<>();
    private int order = 0;

    public void enqueue(Animal a) {
        a.setOrder(order++);
        if (a instanceof Dog) {
            dogs.addLast((Dog) a);
        } else if (a instanceof Cat) {
            cats.addLast((Cat) a);
        }
    }

    public Animal dequeueAny() {
        if (dogs.isEmpty()) {
            return dequeueCat();
        } else if (cats.isEmpty()) {
            return dequeueDog();
        }

        Dog dog = dogs.peek();
        Cat cat = cats.peek();

        if (dog.isOlderThan(cat)) {
            return dequeueDog();
        } else {
            return dequeueCat();
        }
    }

    public Dog dequeueDog() {
        return dogs.poll();
    }

    public Cat dequeueCat() {
        return cats.poll();
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| enqueue | `O(१)` | टाइमस्टैम्प असाइनमेंट और लिंक्ड लिस्ट टेल में जोड़ना। |
| dequeueAny | `O(१)` | दोनों कतारों के हेड टाइमस्टैम्प की सीधी तुलना। |
| dequeueDog / dequeueCat | `O(१)` | संबंधित लिंक्ड लिस्ट के हेड से सीधा निष्कासन। |
| सहायक मेमोरी | `O(N)` | आश्रय में मौजूद कुल जानवरों के अनुपात में मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: मल्टी-लेन डिस्पैच कतारें

१. **बैकग्राउंड जॉब शेड्यूलर (Celery, BullMQ):** ग्लोबल फीफो क्रम बनाए रखते हुए संसाधन-विशिष्ट वर्करों को कार्य सौंपना।
२. **डेटाबेस राइट-अहेड लॉगिंग (WAL):** लॉग अनुक्रम संख्या (LSN) द्वारा समवर्ती लेनदेन का क्रमबद्ध रीप्ले।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **केवल कुत्ते या केवल बिल्लियां बचना:** `dequeueAny()` स्वतः उपलब्ध कतार से निकालता है।
२. **खाली आश्रय:** बिना किसी अपवाद के सुरक्षित रूप से `null` लौटाता है।
