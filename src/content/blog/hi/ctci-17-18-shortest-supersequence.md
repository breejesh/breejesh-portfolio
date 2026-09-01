---
title: "सबसे छोटा सुपरसीक्वेंस (Shortest Supersequence): न्यूनतम कवर स्लाइडिंग विंडो (सीटीसीआई १७.१८)"
description: "Min-Heap आधारित स्लाइडिंग विंडो से O(N log S) समय में एक बड़े सरणी का सबसे छोटा सन्निहित उपसरणी खोजना जो एक छोटे सरणी के सभी तत्वों को शामिल करे।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-18-shortest-supersequence.webp
previewImage: /assets/images/ctci-17-18-shortest-supersequence.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** दो सरणियां `big` और `small` को देखते हुए, `big` का सबसे छोटा सन्निहित उपसरणी खोजें जिसमें `small` के सभी तत्व शामिल हों।
> * **मुख्य समाधान:** **अगली-घटना सूचकांक ट्रैकिंग के साथ स्लाइडिंग विंडो**:
>   1. `small` के प्रत्येक तत्व के लिए `big` में स्थिति सूचियां पहले से गणना करें।
>   2. Min-Heap का उपयोग करके प्रत्येक तत्व के वर्तमान अग्रिम पॉइंटर को बनाए रखें।
>   3. न्यूनतम सूचकांक वाले तत्व को निकालें, विंडो आकार की गणना करें, फिर आगे बढ़ें।
>   4. जब किसी तत्व की भविष्य की घटनाएं समाप्त हो जाएं तो रुकें।
>   5. यह **$O(N \log S)$ समय** और **$O(N)$ स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** BM25 वाक्यांश निकटता स्कोरिंग और IoT मल्टी-सेंसर डेटा फ्यूजन।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १७.१८) में पूछा गया है:

*"'big' के सबसे छोटे उपसरणी के प्रारंभ और अंत इंडेक्स लौटाएं जो 'small' के सभी तत्वों को कवर करे।"*

## २. Min-Heap स्वीप की कार्यप्रणाली

प्रत्येक `small` तत्व के लिए एक सक्रिय पॉइंटर रखकर, विंडो शुरू से पुनः स्कैन किए बिना सिकुड़ जाती है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class ShortestSupersequence {

    public static int[] shortestSupersequence(int[] big, int[] small) {
        List<List<Integer>> lists = new ArrayList<>();
        Map<Integer, Integer> map = new HashMap<>();

        for (int s : small) {
            if (!map.containsKey(s)) {
                map.put(s, lists.size());
                lists.add(new ArrayList<>());
            }
        }

        for (int i = 0; i < big.length; i++) {
            Integer idx = map.get(big[i]);
            if (idx != null) lists.get(idx).add(i);
        }

        PriorityQueue<int[]> minHeap = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
        int maxIndex = Integer.MIN_VALUE;

        for (int i = 0; i < lists.size(); i++) {
            if (lists.get(i).isEmpty()) return new int[]{-1, -1};
            int firstOcc = lists.get(i).get(0);
            minHeap.add(new int[]{firstOcc, i, 0});
            maxIndex = Math.max(maxIndex, firstOcc);
        }

        int[] best = {-1, -1};
        while (!minHeap.isEmpty()) {
            int[] curr = minHeap.poll();
            int minIndex = curr[0];
            int listIdx = curr[1];
            int posIdx = curr[2];

            if (best[0] == -1 || maxIndex - minIndex < best[1] - best[0]) {
                best[0] = minIndex;
                best[1] = maxIndex;
            }

            if (posIdx + 1 >= lists.get(listIdx).size()) break;
            int nextOcc = lists.get(listIdx).get(posIdx + 1);
            minHeap.add(new int[]{nextOcc, listIdx, posIdx + 1});
            maxIndex = Math.max(maxIndex, nextOcc);
        }

        return best;
    }
}
```

## जटिलता विश्लेषण

| मेट्रिक | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N log S)` | N स्थान स्कैन, S तत्वों के साथ Heap ऑपरेशन। |
| सहायक स्पेस | `O(N)` | घटना सूचियां सभी N स्थिति संग्रहीत करती हैं। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: खोज प्रासंगिकता

१. **BM25 Minimum Span Scoring:** वेब खोज इंजन सभी क्वेरी शब्दों की न्यूनतम विंडो की गणना करके प्रासंगिकता बढ़ाते हैं।
२. **IoT सेंसर फ्यूजन:** प्रत्येक सेंसर चैनल से कम से कम एक रीडिंग की गारंटी के साथ न्यूनतम समय विंडो परिभाषा।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **`small` का तत्व `big` में अनुपस्थित:** सुरक्षित रूप से `{-1, -1}` लौटाना।
