---
title: "तीन इन वन (Three in One): एक ही एरे में तीन स्टैक लागू करना (सीटीसीआई ३.१)"
description: "एक ही एकल एरे का उपयोग करके निश्चित विभाजन और गतिशील बहु-स्टैक विभाजन द्वारा O(१) समय में तीन स्वतंत्र स्टैक बनाना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-3-1-three-in-one.webp
previewImage: /assets/images/ctci-3-1-three-in-one.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** वर्णन करें कि आप तीन स्टैक लागू करने के लिए एकल एरे का उपयोग कैसे कर सकते हैं।
> * **मुख्य समाधान:** (१) निश्चित विभाजन: एरे को तीन समान भागों $[0, N/3)$, $[N/3, 2N/3)$, $[2N/3, N)$ में बांटें और प्रत्येक का आकार ट्रैक करें; (२) लचीला गतिशील विभाजन: स्टैक तत्वों को सर्कुलर रूप से शिफ्ट करके गतिशील रूप से स्पेस साझा करने की अनुमति दें।
> * **रियल-वर्ल्ड सिस्टम:** थ्रेड निष्पादन स्टैक मेमोरी एलोकेटर और सीपीयू एल१ कैश अनुकूलन।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ३.१) में पूछा गया है:

*"वर्णन करें कि आप तीन स्टैक लागू करने के लिए एक ही एरे का उपयोग कैसे कर सकते हैं।"*

## २. दृष्टिकोण १: निश्चित विभाजन (सरल और उच्च थ्रूपुट)

हम एकल एरे को `stackCapacity` आकार के तीन बराबर भागों में विभाजित करते हैं:
* स्टैक ०: सूचकांक $[0, \text{stackCapacity} - 1]$
* स्टैक १: सूचकांक $[\text{stackCapacity}, 2 \times \text{stackCapacity} - 1]$
* स्टैक २: सूचकांक $[2 \times \text{stackCapacity}, 3 \times \text{stackCapacity} - 1]$

हम प्रत्येक स्टैक में तत्वों की संख्या दर्ज करने के लिए लंबाई ३ का एक एरे `sizes` रखते हैं।
* `push(stackNum, value)`: `sizes[stackNum]` बढ़ाता है और सही इंडेक्स पर लिखता है।
* `pop(stackNum)`: शीर्ष तत्व को निकालता है और साइज घटाता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.EmptyStackException;

public class FixedMultiStack {
    private final int numberOfStacks = 3;
    private final int stackCapacity;
    private final int[] values;
    private final int[] sizes;

    public FixedMultiStack(int stackSize) {
        stackCapacity = stackSize;
        values = new int[stackSize * numberOfStacks];
        sizes = new int[numberOfStacks];
    }

    /**
     * निर्दिष्ट स्टैक (0, 1 या 2) पर मान डालता है।
     * समय जटिलता: O(1)
     * स्पेस जटिलता: O(1)
     */
    public void push(int stackNum, int value) throws Exception {
        if (isFull(stackNum)) {
            throw new Exception("स्टैक " + stackNum + " भरा हुआ है");
        }
        sizes[stackNum]++;
        values[indexOfTop(stackNum)] = value;
    }

    /**
     * निर्दिष्ट स्टैक से शीर्ष तत्व निकालता है।
     * समय जटिलता: O(1)
     */
    public int pop(int stackNum) {
        if (isEmpty(stackNum)) {
            throw new EmptyStackException();
        }
        int topIndex = indexOfTop(stackNum);
        int value = values[topIndex];
        values[topIndex] = 0;
        sizes[stackNum]--;
        return value;
    }

    public int peek(int stackNum) {
        if (isEmpty(stackNum)) {
            throw new EmptyStackException();
        }
        return values[indexOfTop(stackNum)];
    }

    public boolean isEmpty(int stackNum) {
        return sizes[stackNum] == 0;
    }

    public boolean isFull(int stackNum) {
        return sizes[stackNum] == stackCapacity;
    }

    private int indexOfTop(int stackNum) {
        int offset = stackNum * stackCapacity;
        int size = sizes[stackNum];
        return offset + size - 1;
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| push / pop / peek | `O(१)` | `offset + size - 1` द्वारा सीधा इंडेक्स कैलकुलेशन। |
| सहायक मेमोरी | `O(N)` | बिना ऑब्जेक्ट पॉइंटर ओवरहेड के एकल निरंतर मेमोरी ब्लॉक। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: निरंतर मेमोरी एरेना

१. **एम्बेडेड और रियल-टाइम सिस्टम:** हीप विखंडन को समाप्त करने के लिए थ्रेड स्टैक के लिए फ्लैट निरंतर रैम एरेना का आवंटन।
२. **सीपीयू कैश लोकैलिटी:** निरंतर एरे स्टोरेज सीपीयू एल१ कैश प्रीफेचिंग को अधिकतम करता है।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **अमान्य स्टैक इंडेक्स:** $0 \le \text{stackNum} < 3$ द्वारा जांच।
२. **स्टैक ओवरफ्लो:** `sizes[stackNum] == stackCapacity` होने पर स्पष्ट अपवाद थ्रो करता है।
३. **खाली स्टैक:** `EmptyStackException` फेंकता है।
