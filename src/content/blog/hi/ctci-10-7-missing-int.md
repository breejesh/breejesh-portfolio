---
title: "लापता पूर्णांक (Missing Int): बिट वेक्टर और टू-पास ब्लॉक काउंटिंग एल्गोरिदम (सीटीसीआई १०.७)"
description: "बिट वेक्टर और पिजनहोल सिद्धांत (Pigeonhole Principle) का उपयोग करके १ जीबी और १० एमबी मेमोरी सीमाओं के तहत चार अरब पूर्णांकों में से लापता संख्या की खोज।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-10-7-missing-int.webp
previewImage: /assets/images/ctci-10-7-missing-int.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** चार अरब गैर-ऋणात्मक पूर्णांकों वाली एक फ़ाइल दी गई है। एक ऐसा पूर्णांक उत्पन्न करने के लिए एक एल्गोरिदम प्रदान करें जो फ़ाइल में नहीं है। मान लें कि आपके पास १ जीबी मेमोरी उपलब्ध है। फॉलो-अप: यदि आपके पास केवल १० एमबी मेमोरी हो?
> * **मुख्य समाधान:** **बिट वेक्टर और टू-पास ब्लॉक काउंटिंग**: (१) **१ जीबी मेमोरी**: $2^{32}\text{ bits} = 512\text{ MB}$ का बिट वेक्टर एकल पास में सभी उपस्थित संख्याओं को ट्रैक करता है; (२) **१० एमबी मेमोरी**: पहला पास $2^{16} = 65,536$ आकारों के ब्लॉक्स में संख्याओं की गणना करता है ($256\text{ KB}$ रैम)। पिजनहोल सिद्धांत द्वारा, कम से कम एक ब्लॉक में गिनती $65,536$ से कम होगी; (३) दूसरा पास उस ब्लॉक के लिए $8\text{ KB}$ का बिट वेक्टर बनाकर लापता संख्या की पहचान $O(N)$ समय में करता है।
> * **रियल-वर्ल्ड सिस्टम:** IPv4 पता आवंटन और अपाचे ल्यूसीन में रोअरिंग बिटमैप्स (Roaring Bitmaps)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १०.७) में पूछा गया है:

*"चार अरब गैर-ऋणात्मक पूर्णांकों की फ़ाइल में से १ जीबी और १० एमबी मेमोरी बाधाओं के तहत लापता संख्या खोजें।"*

## २. मेमोरी गणना और पिजनहोल सिद्धांत

३२-बिट अहस्ताक्षरित पूर्णांकों में $2^{32} \approx 4.29$ अरब मान होते हैं।

### स्थिति १: १ जीबी मेमोरी (एकल पास)
३२-बिट बिट वेक्टर:
$$2^{32}\text{ bits} = 512\text{ MB}$$
यह १ जीबी रैम में आसानी से आ जाता है।

---

### स्थिति २: १० एमबी मेमोरी (दो पास)
१. **पास १ (ब्लॉक आवृत्ति गणना):** $2^{16} = 65,536$ ब्लॉक्स में आवृत्ति गिनें। `blocks[B] < 65536` वाला ब्लॉक $B$ खोजें।
२. **पास २ (लक्षित बिट वेक्टर):** ब्लॉक $B$ के लिए $8\text{ KB}$ का बिट वेक्टर बनाएं और पहला ० बिट खोजें।

## प्रोडक्शन कार्यान्वयन

```java
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class MissingIntFinder {
    /**
     * 1 GB RAM समाधान: 512MB सिंगल-पास बिट वेक्टर।
     */
    public static int findMissingInt1GB(String filename) throws IOException {
        byte[] bitfield = new byte[1 << 26]; // 512MB
        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int n = Integer.parseInt(line.trim());
                bitfield[n / 8] |= (1 << (n % 8));
            }
        }

        for (int i = 0; i < bitfield.length; i++) {
            for (int b = 0; b < 8; b++) {
                if ((bitfield[i] & (1 << b)) == 0) {
                    return i * 8 + b;
                }
            }
        }
        return -1;
    }

    /**
     * 10 MB RAM समाधान: दो-पास ब्लॉक काउंटिंग।
     */
    public static int findMissingInt10MB(String filename) throws IOException {
        int rangeSize = 1 << 16;
        int[] blocks = new int[rangeSize]; // 256KB RAM

        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int n = Integer.parseInt(line.trim());
                blocks[n / rangeSize]++;
            }
        }

        int selectedBlock = -1;
        for (int i = 0; i < blocks.length; i++) {
            if (blocks[i] < rangeSize) {
                selectedBlock = i;
                break;
            }
        }
        if (selectedBlock == -1) return -1;

        byte[] bitVector = new byte[rangeSize / 8]; // 8KB RAM
        int startingInt = selectedBlock * rangeSize;
        int endingInt = startingInt + rangeSize;

        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int n = Integer.parseInt(line.trim());
                if (n >= startingInt && n < endingInt) {
                    int offset = n - startingInt;
                    bitVector[offset / 8] |= (1 << (offset % 8));
                }
            }
        }

        for (int i = 0; i < bitVector.length; i++) {
            for (int b = 0; b < 8; b++) {
                if ((bitVector[i] & (1 << b)) == 0) {
                    return startingInt + i * 8 + b;
                }
            }
        }

        return -1;
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मोड | समय जटिलता | सहायक रैम | डिस्क पास |
|---|---|---|---|
| 1 GB समाधान | `O(N)` | `512 MB` | 1 पास |
| 10 MB समाधान | `O(N)` | `264 KB` | 2 पास |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: आईपी एड्रेस आवंटन

१. **इंटरनेट रजिस्ट्री रूटिंग:** ३२-बिट IPv4 पतों के खाली स्लॉट्स को $O(1)$ समय में खोजने के लिए ५१२ एमबी बिट वेक्टर का उपयोग।
२. **रोअरिंग बिटमैप्स:** डेटाबेस में सघन और विरल इंडेक्स के बीच स्वचालित मेमोरी अनुकूलन।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **कोई संख्या अनुपस्थित न होना:** ब्रह्मांड पूरा होने पर `-1` लौटाना।
२. **$n = 0$ अनुपस्थित होना:** ब्लॉक ० के पहले बिट पर तुरंत पहचान।
