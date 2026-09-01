---
title: "मास्टर माइंड (Master Mind): टू-पास आवृत्ति हिस्टोग्राम मिलान (सीटीसीआई १६.१५)"
description: "मास्टर माइंड खेल में सटीक हिट्स (Hits) और छद्म हिट्स (Pseudo-Hits) की गणना के लिए वर्ण आवृत्ति हिस्टोग्राम और टू-पास मिलान का O(1) एल्गोरिदम।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-15-master-mind.webp
previewImage: /assets/images/ctci-16-15-master-mind.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** मास्टर माइंड खेल में, कंप्यूटर के पास ४ स्लॉट होते हैं जिनमें रंगीन गेंदें होती हैं: लाल (`R`), पीला (`Y`), हरा (`G`) या नीला (`B`)। सही रंग और सही स्लॉट का मिलान "हिट" कहलाता है। समाधान में मौजूद लेकिन गलत स्लॉट वाला रंग "स्यूडो-हिट" कहलाता है। हिट्स और स्यूडो-हिट्स की गणना करें।
> * **मुख्य समाधान:** **टू-पास फ़्रीक्वेंसी हिस्टोग्राम मिलान**:
>   1. **पास १ (हिट्स)**: ४ स्लॉट्स का विश्लेषण करें। यदि `guess[i] == solution[i]`, तो `hits++` बढ़ाएं। बेमेल स्लॉट्स के रंगों की आवृत्ति सरणी में जोड़ें।
>   2. **पास २ (स्यूडो-हिट्स)**: प्रत्येक रंग $c$ के लिए, $\min(\text{solutionFreq}[c], \text{guessFreq}[c])$ जोड़ें।
>   3. यह **$O(1)$ समय** और **$O(1)$ सहायक स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** वर्डल (Wordle) गेम इंजन और बायोइन्फॉर्मेटिक्स डीएनए अनुक्रमण।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.१५) में पूछा गया है:

*"मास्टर माइंड खेल में किसी भी अनुमान के लिए सटीक हिट्स और स्यूडो-हिट्स की संख्या की गणना करने के लिए एल्गोरिदम लिखें।"*

## २. टू-पास हिस्टोग्राम मिलान

पहले पास में सटीक मिलान वाले स्लॉट्स को अलग कर दिया जाता है ताकि वे दूसरे पास में स्यूडो-हिट्स के रूप में दोबारा न गिने जाएं।

## प्रोडक्शन कार्यान्वयन

```java
public class MasterMind {

    public static class Result {
        public final int hits;
        public final int pseudoHits;

        public Result(int hits, int pseudoHits) {
            this.hits = hits;
            this.pseudoHits = pseudoHits;
        }
    }

    private static int code(char c) {
        switch (c) {
            case 'R': case 'r': return 0;
            case 'G': case 'g': return 1;
            case 'B': case 'b': return 2;
            case 'Y': case 'y': return 3;
            default: return -1;
        }
    }

    public static Result estimate(String guess, String solution) {
        if (guess == null || solution == null || guess.length() != solution.length()) {
            return new Result(0, 0);
        }

        int hits = 0;
        int[] solFreq = new int[4];
        int[] guessFreq = new int[4];

        for (int i = 0; i < guess.length(); i++) {
            char g = guess.charAt(i);
            char s = solution.charAt(i);

            if (g == s) {
                hits++;
            } else {
                int cg = code(g);
                int cs = code(s);
                if (cg >= 0) guessFreq[cg]++;
                if (cs >= 0) solFreq[cs]++;
            }
        }

        int pseudoHits = 0;
        for (int c = 0; c < 4; c++) {
            pseudoHits += Math.min(guessFreq[c], solFreq[c]);
        }

        return new Result(hits, pseudoHits);
    }
}
```

## जटिलता विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(1)` | ४ स्लॉट्स का निश्चित चक्र। |
| सहायक स्पेस | `O(1)` | ४ तत्वों की हिस्टोग्राम सरणियाँ। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: वर्डल (Wordle) इंजन

१. **वर्डल स्कोरिंग:** वर्डल में हरे अक्षरों (सटीक हिट्स) की जांच पहले की जाती है ताकि पीले अक्षरों (स्यूडो-हिट्स) की गणना सटीक रहे।
२. **डीएनए अलाइनमेंट:** न्यूक्लियोटाइड अनुक्रमों में मिलान की गणना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **अनुमान में दोहराए गए अक्षर:** यदि समाधान `"RGBY"` है और अनुमान `"RRRR"` है, तो आउटपुट बिना किसी त्रुटि के `1 Hit, 0 Pseudo-Hits` आता है।
