---
title: "स्टैक द्वारा कतार (Queue via Stacks): दो स्टैक से कतार लागू करना (सीटीसीआई ३.४)"
description: "दो लीफो (LIFO) स्टैक का उपयोग करके सुस्त स्थानांतरण (Lazy Transfer) तकनीक द्वारा अमोर्टाइज्ड O(१) समय में फीफो (FIFO) कतार बनाना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-3-4-queue-via-stacks.webp
previewImage: /assets/images/ctci-3-4-queue-via-stacks.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक `MyQueue` वर्ग लागू करें जो दो स्टैक का उपयोग करके कतार बनाता है।
> * **मुख्य समाधान:** दो स्टैक रखें: `stackNewest` (नये जुड़े तत्वों को प्राप्त करता है) और `stackOldest` (फीफो क्रम में मान निकालता है)। `stackNewest` से `stackOldest` में तत्वों का स्थानांतरण केवल तभी करें जब `stackOldest` खाली हो, जिससे प्रति ऑपरेशन अमोर्टाइज्ड $O(१)$ समय प्राप्त होता है।
> * **रियल-वर्ल्ड सिस्टम:** समवर्ती प्रणालियों में एक्टर मेलबॉक्स (Erlang/Akka) और डबल बफरिंग।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ३.४) में पूछा गया है:

*"एक MyQueue क्लास लागू करें जो दो स्टैक का उपयोग करके एक कतार बनाती है।"*

**मौलिक नियम:**
स्टैक लीफो (LIFO - अंतिम आया, पहला निकला) पर काम करता है, जबकि कतार फीफो (FIFO - पहला आया, पहला निकला) पर काम करती है। एक स्टैक से तत्वों को निकालकर दूसरे स्टैक में डालने पर क्रम पूरी तरह उलट जाता है, जिससे LIFO स्वतः FIFO में बदल जाता है।

## २. सुस्त स्थानांतरण (Lazy Shifting) तकनीक

१. **`add(value)`:** हमेशा `stackNewest` पर नया मान डालें।
२. **`shiftStacks()`:** केवल तभी जब `stackOldest` खाली हो, `stackNewest` के सभी तत्वों को पॉप करके `stackOldest` में डालें।
३. **`remove()` / `peek()`:** `shiftStacks()` चलाएं, फिर `stackOldest` से मान निकालें या पढ़ें।

चूंकि प्रत्येक तत्व अपने पूरे जीवनकाल में ठीक एक बार `stackNewest` में जाता है, एक बार स्थानांतरित होता है और एक बार `stackOldest` से निकलता है, इसलिए अमोर्टाइज्ड लागत प्रति तत्व शुद्ध $O(१)$ होती है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.NoSuchElementException;
import java.util.Stack;

public class MyQueue<T> {
    private final Stack<T> stackNewest;
    private final Stack<T> stackOldest;

    public MyQueue() {
        stackNewest = new Stack<>();
        stackOldest = new Stack<>();
    }

    public int size() {
        return stackNewest.size() + stackOldest.size();
    }

    public boolean isEmpty() {
        return size() == 0;
    }

    /**
     * कतार के पीछे तत्व जोड़ता है।
     * समय जटिलता: O(1)
     */
    public void add(T value) {
        stackNewest.push(value);
    }

    private void shiftStacks() {
        if (stackOldest.isEmpty()) {
            while (!stackNewest.isEmpty()) {
                stackOldest.push(stackNewest.pop());
            }
        }
    }

    /**
     * कतार के सामने वाले तत्व को पढ़ता है।
     * समय जटिलता: अमोर्टाइज्ड O(1)
     */
    public T peek() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new NoSuchElementException();
        }
        return stackOldest.peek();
    }

    /**
     * कतार के सामने वाले तत्व को निकालता है।
     * समय जटिलता: अमोर्टाइज्ड O(1)
     */
    public T remove() {
        shiftStacks();
        if (stackOldest.isEmpty()) {
            throw new NoSuchElementException();
        }
        return stackOldest.pop();
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| add(T) | `O(१)` | stackNewest में सीधा पुश। |
| remove() / peek() | `O(१) अमोर्टाइज्ड` | शिफ्टिंग पर सबसे खराब स्थिति $O(N)$, लेकिन प्रत्येक नोड केवल एक बार स्थानांतरित होता है। |
| सहायक मेमोरी | `O(N)` | दोनों स्टैक्स में विभाजित कुल $N$ तत्व। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: एक्टर मेलबॉक्स और डबल बफरिंग

१. **एक्टर मेलबॉक्स (Erlang / Akka):** आने वाले संदेशों को सक्रिय प्रोसेसिंग थ्रेड को रोके बिना अपेंड-ओनली इनबॉक्स में दर्ज किया जाता है।
२. **डबल बफर ग्राफिक्स पाइपलाइन:** ड्राइंग बफर और डिस्प्ले रेंडरिंग के बीच कुशल बदलाव।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **खाली कतार से निकालना:** `NoSuchElementException` फेंकता है।
२. **बारी-बारी से जोड़ना और निकालना:** सुस्त स्थानांतरण तभी होता है जब `stackOldest` पूरी तरह खाली हो, जिससे फीफो क्रम बना रहता है।
