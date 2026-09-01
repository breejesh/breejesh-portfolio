---
title: "वृत्ताकार सारणी (Circular Array): इटरेटर समर्थन के साथ जेनेरिक घूर्णन डेटा संरचना (सीटीसीआई ७.९)"
description: "इंडेक्स मॉड्यूलो ऑफसेट मैपिंग का उपयोग करके O(१) समय में जावा में जेनेरिक CircularArray क्लास और Iterable इंटरफ़ेस का कार्यान्वयन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-9-circular-array.webp
previewImage: /assets/images/ctci-7-9-circular-array.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक `CircularArray` क्लास लागू करें जो एक ऐसी ऐरे जैसी डेटा संरचना का समर्थन करती है जिसे कुशलतापूर्वक घुमाया जा सकता है। जेनेरिक्स और मानक `for-each` लूप का समर्थन करें।
> * **मुख्य समाधान:** **मॉड्यूलो हेड ऑफसेट मैपिंग**: प्रत्येक घूर्णन पर तत्वों को $O(N)$ में स्थानांतरित करने के बजाय, केवल एक पूर्णांक पॉइंटर `head = (head + shift) % size` बनाए रखें और इंडेक्स को `(head + i) % size` द्वारा $O(१)$ समय में मैप करें।
> * **रियल-वर्ल्ड सिस्टम:** रिंग बफ़र्स (Ring Buffers), नेटवर्क सॉकेट बफर और एलमैक्स डिसरप्टर (LMAX Disruptor)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ७.९) में, एक जेनेरिक `CircularArray<T>` लागू करने के लिए कहा गया है जो $O(१)$ में रोटेशन, इंडेक्स एक्सेस और मानक इटरेटर का समर्थन करता है।

## २. शून्य-कॉपी मॉड्यूलो पॉइंटर विधि

घूर्णन के दौरान तत्वों को स्थानांतरित करने में $O(N)$ समय लगता है।

*इष्टतम डिज़ाइन:* आंतरिक रूप से एक निश्चित आकार की सरणी `T[] items` रखें और तार्किक इंडेक्स ० की ओर इशारा करने वाला एक `head` पॉइंटर बनाए रखें। रोटेशन के समय केवल `head` को अपडेट किया जाता है, जिससे रोटेशन $O(१)$ समय में पूरा होता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.Iterator;

public class CircularArray<T> implements Iterable<T> {
    private T[] items;
    private int head = 0;

    @SuppressWarnings("unchecked")
    public CircularArray(int size) {
        items = (T[]) new Object[size];
    }

    private int convert(int index) {
        if (index < 0) index += items.length;
        return (head + index) % items.length;
    }

    public void rotate(int shiftRight) {
        head = convert(shiftRight);
    }

    public T get(int i) {
        if (i < 0 || i >= items.length) throw new IndexOutOfBoundsException();
        return items[convert(i)];
    }

    public void set(int i, T item) {
        items[convert(i)] = item;
    }

    @Override
    public Iterator<T> iterator() {
        return new CircularArrayIterator();
    }

    private class CircularArrayIterator implements Iterator<T> {
        private int current = -1;

        @Override
        public boolean hasNext() { return current < items.length - 1; }

        @Override
        public T next() {
            current++;
            return items[convert(current)];
        }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| rotate(shift) समय | `O(१)` | केवल अंकगणितीय पॉइंटर अपडेट। |
| get(i) / set(i) समय | `O(१)` | सीधा मॉड्यूलो इंडेक्स अनुवाद। |
| इटरेशन समय | `O(N)` | मानक रैखिक स्कैन। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: रिंग बफ़र्स

उच्च-प्रदर्शन मैसेजिंग कतारें (LMAX Disruptor) और लिनक्स नेटवर्क सॉकेट बफर बिना किसी मेमोरी कॉपी के थ्रेड्स के बीच पैकेट पास करने के लिए मॉड्यूलो रिंग इंडेक्सिंग का उपयोग करते हैं।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **नकारात्मक घूर्णन (`rotate(-5)`):** `index += items.length` द्वारा सुरक्षित प्रबंधन।
२. **सीमा से बाहर एक्सेस:** मानक `IndexOutOfBoundsException` फेंकना।
