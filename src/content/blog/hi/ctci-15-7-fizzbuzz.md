---
title: "मल्टी-थ्रेडेड फ़िज़बज़ (Multithreaded FizzBuzz): ४-थ्रेड सिंक्रोनाइज़ेशन और मॉनिटर कंडीशंस (सीटीसीआई १५.७)"
description: "जावा में ऑब्जेक्ट मॉनिटर्स, synchronized ब्लॉक्स और wait/notifyAll द्वारा ४ समन्वित थ्रेड्स के माध्यम से मल्टी-थ्रेडेड FizzBuzz को लागू करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-15-7-fizzbuzz.webp
previewImage: /assets/images/ctci-15-7-fizzbuzz.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** ४ थ्रेड्स का उपयोग करके FizzBuzz का मल्टी-थ्रेडेड संस्करण लागू करें: थ्रेड A "FizzBuzz" (३ और ५ से विभाज्य), थ्रेड B "Fizz" (केवल ३ से विभाज्य), थ्रेड C "Buzz" (केवल ५ से विभाज्य), और थ्रेड D सामान्य संख्या प्रिंट करता है। अनुक्रम को $१$ से $N$ तक सख्त आरोही क्रम में प्रिंट होना चाहिए।
> * **मुख्य समाधान:** **सिंक्रोनाइज़्ड मॉनिटर और `wait()`/`notifyAll()` के साथ स्टेट मशीन लूप**:
>   1. एक साझा पूर्णांक काउंटर `current = 1` बनाए रखें जो मॉनिटर लॉक द्वारा सुरक्षित हो।
>   2. प्रत्येक थ्रेड `current <= n` तक लूप चलाता है और अपनी विभाज्यता शर्त का परीक्षण करता है।
>   3. यदि शर्त गलत है, तो थ्रेड `lock.wait()` द्वारा लॉक छोड़कर सो जाता है।
>   4. यदि शर्त सही है, तो थ्रेड टोकन प्रिंट करता है, `current++` बढ़ाता है और अन्य थ्रेड्स को जगाने के लिए `lock.notifyAll()` कॉल करता है।
>   5. यह **$O(N)$ समय** में निष्पादित होता है।
> * **रियल-वर्ल्ड सिस्टम:** समवर्ती स्ट्रीम प्रोसेसर में राउंड-रॉबिन वर्कर पूल और इवेंट डिस्पैचिंग लूप्स।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १५.७) में पूछा गया है:

*"चार स्वतंत्र थ्रेड्स का समन्वय करके १ से n तक की संख्याओं के लिए मल्टी-थ्रेडेड FizzBuzz क्रमबद्ध रूप से प्रिंट करें।"*

## २. मल्टी-थ्रेडेड स्टेट मशीन

प्रत्येक संख्या परिवर्तन पर `notifyAll()` सभी प्रतीक्षारत थ्रेड्स को जगाता है ताकि वे अपनी शर्त का पुनः मूल्यांकन कर सकें।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.function.IntConsumer;
import java.util.function.Predicate;

public class FizzBuzzMultithreaded {
    private final int n;
    private int current = 1;
    private final Object lock = new Object();

    public FizzBuzzMultithreaded(int n) {
        this.n = n;
    }

    private void printLoop(Predicate<Integer> predicate, ConsumerTask printer) throws InterruptedException {
        synchronized (lock) {
            while (current <= n) {
                if (predicate.test(current)) {
                    printer.accept(current);
                    current++;
                    lock.notifyAll(); // सभी थ्रेड्स को पुनः जांचने के लिए जगाएं
                } else {
                    lock.wait(); // लॉक छोड़ें और सो जाएं
                }
            }
        }
    }

    public void fizz(Runnable printFizz) throws InterruptedException {
        printLoop(i -> i % 3 == 0 && i % 5 != 0, i -> printFizz.run());
    }

    public void buzz(Runnable printBuzz) throws InterruptedException {
        printLoop(i -> i % 5 == 0 && i % 3 != 0, i -> printBuzz.run());
    }

    public void fizzbuzz(Runnable printFizzBuzz) throws InterruptedException {
        printLoop(i -> i % 15 == 0, i -> printFizzBuzz.run());
    }

    public void number(IntConsumer printNumber) throws InterruptedException {
        printLoop(i -> i % 3 != 0 && i % 5 != 0, printNumber::accept);
    }

    @FunctionalInterface
    private interface ConsumerTask {
        void accept(int val);
    }
}
```

## जटिलता और सिंक्रोनाइज़ेशन विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N)` | ठीक $N$ सफल आउटपुट ट्रांज़िशन। |
| मेमोरी स्पेस | `O(1)` | एकल साझा काउंटर और मॉनिटर प्रतीक्षा कतार। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: कंडीशन वेरिएबल्स

१. **कंडीशन वेरिएबल्स:** `ReentrantLock` के साथ ४ अलग-अलग `Condition` वेरिएबल्स का उपयोग करके अनावश्यक थ्रेड वेकअप्स से बचना।
२. **एक्टर मॉडल (Akka / Erlang):** वितरित संदेश मेलबॉक्सों के माध्यम से बिना किसी स्पष्ट लॉक के अनुक्रम समन्वय।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **लूप समाप्ति सुरक्षा:** जब `current > n` हो जाता है, तो अंतिम `notifyAll()` सभी सोए हुए थ्रेड्स को जगाता है ताकि वे सुरक्षित रूप से लूप से बाहर निकल सकें।
