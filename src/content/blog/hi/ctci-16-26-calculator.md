---
title: "कैलकुलेटर (Calculator): O(N) समय में ऑपरेटर प्रेसिडेंस अंकगणितीय व्यंजक पार्सर (सीटीसीआई १६.२६)"
description: "स्टैक द्वारा +, -, *, / ऑपरेटरों के गणितीय समीकरणों को ऑपरेटर वरीयता (Precedence) के साथ O(N) समय में हल करना और कंपाइलर AST में इसका उपयोग।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-26-calculator.webp
previewImage: /assets/images/ctci-16-26-calculator.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** बिना कोष्ठक (Parentheses) वाले अंकगणितीय समीकरण (जैसे `"2*3+5/6*3+15"`) को मानक ऑपरेटर वरीयता (BODMAS/PEMDAS) के अनुसार हल करें।
> * **मुख्य समाधान:** **स्टैक-आधारित ऑपरेटर प्राथमिकता**:
>   1. जब `*` या `/` आए, तो स्टैक से पिछला नंबर निकालकर तुरंत गुणा/भाग करें और परिणाम को स्टैक में वापस पुश करें।
>   2. जब `+` या `-` आए, तो वर्तमान संख्या को `+curr` या `-curr` के रूप में स्टैक में पुश करें।
>   3. अंत में, स्टैक में बची सभी संख्याओं का योग निकालें।
>   4. यह **$O(N)$ समय** और **$O(N)$ स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** SQL एक्सप्रेशन मूल्यांकनकर्ता (DuckDB / ClickHouse) और एक्सेल फॉर्मूला पार्सर (Dijkstra का Shunting-Yard)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.२६) में पूछा गया है:

*"गैर-ऋणात्मक पूर्णांकों, +, -, *, / ऑपरेटरों और रिक्त स्थानों वाले स्ट्रिंग व्यंजक का गणितीय परिणाम O(N) समय में ज्ञात करें।"*

## २. स्टैक आधारित पार्सिंग एल्गोरिदम

प्रत्येक ऑपरेटर आने पर पिछले ऑपरेटर की प्राथमिकता के आधार पर स्टैक में मान जोड़े या संपीड़ित किए जाते हैं।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class BasicCalculator {

    public static double compute(String expression) {
        if (expression == null || expression.isEmpty()) return 0.0;

        Deque<Double> stack = new ArrayDeque<>();
        double currentNum = 0.0;
        char lastOp = '+';

        for (int i = 0; i < expression.length(); i++) {
            char c = expression.charAt(i);

            if (Character.isDigit(c)) {
                currentNum = currentNum * 10 + (c - '0');
            }

            // यदि ऑपरेटर है या स्ट्रिंग का अंतिम वर्ण है
            if ((!Character.isDigit(c) && c != ' ') || i == expression.length() - 1) {
                switch (lastOp) {
                    case '+': stack.push(currentNum); break;
                    case '-': stack.push(-currentNum); break;
                    case '*': stack.push(stack.pop() * currentNum); break;
                    case '/': 
                        if (currentNum == 0.0) throw new ArithmeticException("शून्य से विभाजन अमान्य है");
                        stack.push(stack.pop() / currentNum); 
                        break;
                }
                lastOp = c;
                currentNum = 0.0;
            }
        }

        double total = 0.0;
        while (!stack.isEmpty()) {
            total += stack.pop();
        }
        return total;
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N)` | लंबाई N वाले स्ट्रिंग का एकल रैखिक स्कैन। |
| सहायक स्पेस | `O(N)` | स्टैक में अधिकतम N संख्याएं। |
| पार्सर ओवरहेड | `O(1)` | रिकर्शन स्टैक या AST नोड आवंटन के बिना। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: SQL इंजन और स्प्रेडशीट पार्सर

१. **SQL क्वेरी कंपाइलर:** डेटाबेस इंजन अंकगणितीय व्यंजकों को LLVM JIT द्वारा निष्पादित होने वाले स्टैक बाइटकोड में बदलते हैं।
२. **शंटिंग-यार्ड एल्गोरिदम (Shunting-Yard):** एक्सेल और गूगल शीट्स ऑपरेटर वरीयता को स्टैक के माध्यम से हल करते हैं।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **शून्य से विभाजन:** `ArithmeticException` द्वारा सुरक्षित रूप से हैंडल।
२. **रिक्त स्थान:** रिक्त स्थानों को सुरक्षित रूप से अनदेखा किया जाता है।
