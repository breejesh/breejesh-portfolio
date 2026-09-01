---
title: "हनोई के टॉवर (Towers of Hanoi): पुनरावर्ती डिस्क गति और स्टैक मॉडल (सीटीसीआई ८.६)"
description: "विभाजन और विजय (Divide-and-Conquer) पुनरावृत्ति और ऑब्जेक्ट-ओरिएंटेड स्टैक संरचना का उपयोग करके O(2^N) समय में हनोई के टॉवर पहेली का समाधान।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
previewImage: /assets/images/ctci-8-6-towers-of-hanoi.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** हनोई के टॉवर की क्लासिक समस्या में, आपके पास ३ टॉवर और अलग-अलग आकारों के $N$ डिस्क हैं। आप एक समय में केवल एक डिस्क स्थानांतरित कर सकते हैं, और कोई बड़ा डिस्क कभी भी छोटे डिस्क के ऊपर नहीं रखा जा सकता है। पहले टॉवर से अंतिम टॉवर तक सभी डिस्क ले जाएं।
> * **मुख्य समाधान:** **विभाजन और विजय टॉवर पुनरावृत्ति**: (१) शीर्ष $n - 1$ डिस्कों को `Origin` से `Buffer` में स्थानांतरित करें; (२) सबसे बड़े $n$-वें डिस्क को सीधे `Destination` में ले जाएं; (३) $n - 1$ डिस्कों को `Buffer` से `Destination` में ले जाएं। यह ठीक $2^N - 1$ डिस्क चालों में **$O(2^N)$ समय** और **$O(N)$ स्पेस** में पूरा होता है।
> * **रियल-वर्ल्ड सिस्टम:** ग्रैंडफादर-फादर-सन (GFS) बैकअप टेप रोटेशन योजनाएं।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ८.६) में पूछा गया है:

*"ऑब्जेक्ट-ओरिएंटेड स्टैक का उपयोग करके हनोई के टॉवर के सभी N डिस्कों को पहली छड़ से तीसरी छड़ तक ले जाने का एल्गोरिदम लिखें।"*

## २. पुनरावर्ती अपघटन

टॉवर १ से टॉवर ३ तक $n$ डिस्क ले जाने के लिए:
१. शीर्ष $n - 1$ डिस्कों को टॉवर २ में ले जाएं।
२. $n$-वें डिस्क को टॉवर ३ में ले जाएं।
३. टॉवर २ से $n - 1$ डिस्कों को टॉवर ३ में ले जाएं।

पुनरावृत्ति: $T(n) = 2T(n - 1) + 1 = 2^n - 1$।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.Stack;

public class TowersOfHanoi {
    public static class Tower {
        private final Stack<Integer> disks = new Stack<>();
        private final int index;

        public Tower(int i) { this.index = i; }

        public void add(int d) {
            if (!disks.isEmpty() && disks.peek() <= d) {
                throw new IllegalStateException("डिस्क " + d + " को छोटे डिस्क " + disks.peek() + " पर नहीं रखा जा सकता");
            }
            disks.push(d);
        }

        public void moveTopTo(Tower t) {
            int top = disks.pop();
            t.add(top);
        }

        public void moveDisks(int quantity, Tower destination, Tower buffer) {
            if (quantity <= 0) return;

            moveDisks(quantity - 1, buffer, destination);
            moveTopTo(destination);
            buffer.moveDisks(quantity - 1, destination, this);
        }

        public Stack<Integer> getDisks() { return disks; }
    }

    public static void solveHanoi(int n) {
        Tower[] towers = new Tower[3];
        for (int i = 0; i < 3; i++) {
            towers[i] = new Tower(i);
        }

        for (int i = n - 1; i >= 0; i--) {
            towers[0].add(i);
        }

        towers[0].moveDisks(n, towers[2], towers[1]);
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(2^N)` | ठीक $2^N - 1$ असतत डिस्क चालें निष्पादित करता है। |
| सहायक मेमोरी | `O(N)` | $N$ स्तरों तक सीमित कॉल स्टैक गहराई और स्टैक तत्व। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: बैकअप रोटेशन

१. **ग्रैंडफादर-फादर-सन (GFS) बैकअप:** टेप री-राइटिंग को न्यूनतम करने के लिए हनोई के अंतराल का पालन।
२. **सीपीयू रजिस्टर स्पिलिंग:** कंपाइलर में कॉल फ्रेम स्टैक प्रबंधन।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **इनवेरिएंट सत्यापन:** `Tower.add()` छोटे डिस्क पर बड़े डिस्क के रखे जाने पर अपवाद फेंकता है।
