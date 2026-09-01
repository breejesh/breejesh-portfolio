---
title: "प्लेटों का स्टैक (Stack of Plates): क्षमता सीमा के साथ SetOfStacks लागू करना (सीटीसीआई ३.३)"
description: "क्षमता सीमा समाप्त होने पर नया उप-स्टैक बनाने वाले SetOfStacks और popAt(index) ऑपरेशन को O(१) समय में लागू करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-3-3-stack-of-plates.webp
previewImage: /assets/images/ctci-3-3-stack-of-plates.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** प्लेटों के स्टैक की कल्पना करें जो बहुत ऊंचा होने पर गिर सकता है। `SetOfStacks` डेटा संरचना लागू करें जो पिछला स्टैक भर जाने पर एक नया उप-स्टैक बनाती है। `push()` और `pop()` एकल स्टैक की तरह व्यवहार करने चाहिए। *फॉलो-अप:* किसी विशिष्ट उप-स्टैक से पॉप करने के लिए `popAt(int index)` लागू करें।
> * **मुख्य समाधान:** उप-स्टैक्स की एक गतिशील सूची `ArrayList<Stack>` प्रबंधित करें। सक्रिय उप-स्टैक भरने पर नया स्टैक बनाएं। `popAt` के लिए सीधे निर्दिष्ट इंडेक्स से पॉप करें और खाली होने पर उप-स्टैक हटाएं।
> * **रियल-वर्ल्ड सिस्टम:** पेज्ड वर्चुअल मेमोरी स्टैक सेगमेंट और खंडित बफर (`std::deque`)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ३.३) में पूछा गया है:

*"प्लेटों के एक स्टैक की कल्पना करें। यदि स्टैक बहुत ऊंचा हो जाए, तो वह गिर सकता है। इसलिए, जब पिछला स्टैक क्षमता सीमा पार कर जाए, तो नया स्टैक शुरू करने वाला SetOfStacks बनाएं। push() और pop() एकल स्टैक की तरह ही काम करने चाहिए।"*

**फॉलो-अप:**
*"एक फ़ंक्शन popAt(int index) लागू करें जो किसी विशिष्ट उप-स्टैक पर पॉप ऑपरेशन करता है।"*

## २. संरचनात्मक डिजाइन

हम अलग-अलग स्टैक ऑब्जेक्ट्स की एक सूची रखते हैं: `ArrayList<Stack> stacks = new ArrayList<>()`।
१. **`push(v)`:** अंतिम सक्रिय उप-स्टैक देखें। यदि वह पूरा भरा है या मौजूद नहीं है, तो नया उप-स्टैक बनाकर उसमें तत्व जोड़ें।
२. **`pop()`:** अंतिम उप-स्टैक से तत्व निकालें। यदि वह खाली हो जाता है, तो उसे सूची से हटा दें।
३. **`popAt(int index)`:** सीधे `stacks.get(index)` से पॉप करें और खाली होने पर उसे सूची से निकालें।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.EmptyStackException;
import java.util.Stack;

public class SetOfStacks {
    private final ArrayList<Stack<Integer>> stacks = new ArrayList<>();
    private final int capacity;

    public SetOfStacks(int capacity) {
        this.capacity = capacity;
    }

    public Stack<Integer> getLastStack() {
        if (stacks.isEmpty()) return null;
        return stacks.get(stacks.size() - 1);
    }

    /**
     * सक्रिय उप-स्टैक में मान डालता है।
     * समय जटिलता: O(1)
     */
    public void push(int v) {
        Stack<Integer> last = getLastStack();
        if (last != null && last.size() < capacity) {
            last.push(v);
        } else {
            Stack<Integer> stack = new Stack<>();
            stack.push(v);
            stacks.add(stack);
        }
    }

    /**
     * अंतिम उप-स्टैक से मान निकालता है।
     * समय जटिलता: O(1)
     */
    public int pop() {
        Stack<Integer> last = getLastStack();
        if (last == null) throw new EmptyStackException();
        int v = last.pop();
        if (last.isEmpty()) {
            stacks.remove(stacks.size() - 1);
        }
        return v;
    }

    /**
     * किसी विशिष्ट उप-स्टैक से मान निकालता है।
     * समय जटिलता: O(1)
     */
    public int popAt(int index) {
        if (index < 0 || index >= stacks.size()) {
            throw new IndexOutOfBoundsException();
        }
        Stack<Integer> stack = stacks.get(index);
        int v = stack.pop();
        if (stack.isEmpty()) {
            stacks.remove(index);
        }
        return v;
    }

    public boolean isEmpty() {
        Stack<Integer> last = getLastStack();
        return last == null || last.isEmpty();
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| push / pop | `O(१)` | सूची के अंतिम उप-स्टैक का सीधा एक्सेस। |
| popAt(index) | `O(१)` | सीधा इंडेक्स एक्सेस। |
| सहायक मेमोरी | `O(N)` | कुल तत्वों के अनुपात में मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: खंडित डेटा संरचनाएं

१. **वर्चुअल मेमोरी पेजिंग:** ऑपरेटिंग सिस्टम भारी निरंतर मेमोरी आरक्षित करने के बजाय ४केबी पेज चंक्स में स्टैक आवंटित करते हैं।
२. **खंडित एरे कतारें (`std::deque`):** संग्रह के विस्तार पर महंगे री-एलोकेशन से बचते हैं।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **खाली SetOfStacks से पॉप करना:** `EmptyStackException` फेंकता है।
२. **उप-स्टैक का खाली होना:** मेमोरी लीक से बचने के लिए सूची से सुरक्षित रूप से हटाया जाता है।
