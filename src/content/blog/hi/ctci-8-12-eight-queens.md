---
title: "आठ रानियां (Eight Queens): N-Queens बैकट्रैकिंग और विकर्ण टकराव इनवेरिएंट (सीटीसीआई ८.१२)"
description: "१D कॉलम ऐरे बैकट्रैकिंग का उपयोग करके ८x८ शतरंज की बिसात पर बिना किसी पंक्ति, स्तंभ या विकर्ण टकराव के आठ रानियों को O(८!) समय में स्थापित करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-8-12-eight-queens.webp
previewImage: /assets/images/ctci-8-12-eight-queens.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** $८ \times ८$ शतरंज की बिसात पर आठ रानियों को इस तरह व्यवस्थित करने के सभी तरीकों को प्रिंट करने के लिए एक एल्गोरिदम लिखें कि उनमें से कोई भी समान पंक्ति, स्तंभ या विकर्ण साझा न करे।
> * **मुख्य समाधान:** **१D कॉलम-ऐरे बैकट्रैकिंग**: (१) चूंकि प्रत्येक पंक्ति में ठीक एक रानी होती है, इसलिए बोर्ड की स्थिति को `Integer[] columns` द्वारा दर्शाएं जहाँ `columns[row] = col`; (२) पंक्ति-दर-पंक्ति आगे बढ़ें; (३) कॉलम जांच `columns[r] == col` और विकर्ण ढलान जांच `Math.abs(columns[r] - col) == (row - r)` द्वारा टकराव की पुष्टि करें; (४) यह $O(८!)$ समय और $O(१)$ स्पेस में सभी **९२ अद्वितीय समाधान** ढूंढता है।
> * **रियल-वर्ल्ड सिस्टम:** सैट सॉल्वर्स (Z3) में बाधा संतुष्टि समस्याएं (CSP) और कुबेरनेट्स शेड्यूलर।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ८.१२) में पूछा गया है:

*"८x८ चेसबोर्ड पर ८ रानियों को बिना किसी पंक्ति, स्तंभ या विकर्ण टकराव के स्थापित करने के सभी ९२ समाधान उत्पन्न करें।"*

## २. विकर्ण टकराव इनवेरिएंट और १D सरणी अनुकूलन

### १D बोर्ड मॉडल
पंक्ति $r$ हमेशा रानी $r$ को धारण करती है। `columns[r] = c` सरणी यह दर्ज करती है कि पंक्ति $r$ की रानी किस स्तंभ में स्थित है।

### विकर्ण टकराव की शर्त
दो रानियां $(r_1, c_1)$ और $(r_2, c_2)$ विकर्ण रूप से टकराती हैं यदि और केवल यदि:
$$|c_2 - c_1| == |r_2 - r_1|$$

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.List;

public class EightQueens {
    private static final int GRID_SIZE = 8;

    /**
     * ८ रानियों के सभी ९२ समाधान ढूंढता है।
     * समय जटिलता: O(GRID_SIZE!)
     * स्पेस जटिलता: O(GRID_SIZE)
     */
    public static List<Integer[]> placeQueens() {
        List<Integer[]> results = new ArrayList<>();
        Integer[] columns = new Integer[GRID_SIZE];
        placeQueensHelper(0, columns, results);
        return results;
    }

    private static void placeQueensHelper(int row, Integer[] columns, List<Integer[]> results) {
        if (row == GRID_SIZE) {
            results.add(columns.clone());
            return;
        }

        for (int col = 0; col < GRID_SIZE; col++) {
            if (checkValid(columns, row, col)) {
                columns[row] = col;
                placeQueensHelper(row + 1, columns, results);
            }
        }
    }

    private static boolean checkValid(Integer[] columns, int row1, int col1) {
        for (int row2 = 0; row2 < row1; row2++) {
            int col2 = columns[row2];

            // स्तंभ टकराव
            if (col1 == col2) return false;

            // विकर्ण टकराव
            int columnDistance = Math.abs(col2 - col1);
            int rowDistance = row1 - row2;
            if (columnDistance == rowDistance) return false;
        }
        return true;
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N!)` | प्रारंभिक प्रूनिंग खोज वृक्ष को छोटा करती है, जिससे सभी ९२ समाधान प्राप्त होते हैं। |
| सहायक मेमोरी | `O(N)` | ८ पूर्णांकों की १D सरणी और ८ कॉल स्टैक स्तर। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: बाधा संतुष्टि समस्याएं (CSP)

१. **एसएमटी सॉल्वर्स (Microsoft Z3):** लॉजिक क्लॉज़ रिडक्शन द्वारा सुरक्षा सत्यापन और बग डिटेक्शन।
२. **कुबेरनेट्स पॉड शेड्यूलिंग:** नोड्स पर संसाधनों और एंटी-एफिनिटी बाधाओं का अनुकूलन।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **समाधानों की कुल संख्या:** $N = 8$ के लिए ठीक ९२ अद्वितीय विन्यास उत्पन्न होते हैं।
