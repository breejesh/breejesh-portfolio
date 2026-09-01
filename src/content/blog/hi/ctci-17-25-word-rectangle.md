---
title: "शब्द आयत (Word Rectangle): सबसे बड़े वैध शब्द ग्रिड के लिए ट्राई-प्रून्ड DFS (सीटीसीआई १७.२५)"
description: "पुनरावृत्ति निर्माण के दौरान स्तंभ उपसर्ग सत्यापन के लिए ट्राई प्रूनिंग और DFS का उपयोग करके सबसे बड़ा शब्द आयत खोजना जहां प्रत्येक पंक्ति और स्तंभ एक वैध शब्द हो।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-25-word-rectangle.webp
previewImage: /assets/images/ctci-17-25-word-rectangle.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** लाखों शब्दों की सूची को देखते हुए, अक्षरों का सबसे बड़ा संभावित आयत बनाने के लिए एक एल्गोरिदम डिज़ाइन करें जहाँ प्रत्येक पंक्ति बाएँ से दाएँ एक शब्द बनाती है और प्रत्येक स्तंभ ऊपर से नीचे एक शब्द बनाता है।
> * **मुख्य समाधान:** **ट्राई-प्रून्ड DFS शब्द आयत खोज**:
>   1. **शब्दों को लंबाई के अनुसार समूहीकृत करें** और प्रत्येक समूह के लिए एक ट्राई बनाएं।
>   2. **आयत आयामों की गणना करें** (चौड़ाई x ऊँचाई) बड़े क्षेत्रफल से छोटे क्षेत्रफल की ओर।
>   3. **पंक्ति-दर-पंक्ति DFS**: अगली पंक्ति के रूप में एक शब्द रखें। प्रत्येक शब्द रखने के बाद, ऊँचाई लंबाई वाले ट्राई का उपयोग करके **स्तंभों की प्रूनिंग** करें। यदि कोई स्तंभ उपसर्ग अमान्य है, तो तुरंत बैकट्रैक करें।
> * **रियल-वर्ल्ड सिस्टम:** क्रॉसवर्ड पहेली जनरेटर और एनएलपी (NLP) जाली पार्सिंग।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १७.२५) में पूछा गया है:

*"लाखों शब्दों की सूची दी गई है, अक्षरों का सबसे बड़ा संभव आयत बनाएं ताकि प्रत्येक पंक्ति और प्रत्येक स्तंभ एक वैध शब्द बनाए।"*

## २. ट्राई आधारित स्तंभ प्रूनिंग रणनीति

स्तंभ उपसर्गों को संबंधित ऊँचाई वाले ट्राई में सत्यापित करने से अमान्य शाखाएं प्रारंभिक स्तर पर ही कट जाती हैं।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class WordRectangle {

    public static String[] findLargestRectangle(String[] words) {
        Map<Integer, List<String>> byLen = new HashMap<>();
        int maxLen = 0;
        for (String w : words) {
            byLen.computeIfAbsent(w.length(), k -> new ArrayList<>()).add(w);
            maxLen = Math.max(maxLen, w.length());
        }

        for (int area = maxLen * maxLen; area > 0; area--) {
            for (int width = maxLen; width >= 1; width--) {
                if (area % width != 0) continue;
                int height = area / width;
                if (height > maxLen) continue;
                List<String> widthWords  = byLen.getOrDefault(width, Collections.emptyList());
                List<String> heightWords = byLen.getOrDefault(height, Collections.emptyList());
                if (widthWords.isEmpty() || heightWords.isEmpty()) continue;

                Trie colTrie = new Trie();
                for (String w : heightWords) colTrie.insert(w);

                String[] result = dfs(new String[height], widthWords, colTrie, width, height, 0);
                if (result != null) return result;
            }
        }
        return null;
    }

    static String[] dfs(String[] rect, List<String> words, Trie colTrie, int width, int height, int row) {
        if (row == height) return rect;
        for (String word : words) {
            rect[row] = word;
            if (columnsValid(rect, colTrie, width, row + 1, height)) {
                String[] res = dfs(rect, words, colTrie, width, height, row + 1);
                if (res != null) return res;
            }
        }
        rect[row] = null;
        return null;
    }

    static boolean columnsValid(String[] rect, Trie colTrie, int width, int rowsFilled, int height) {
        for (int c = 0; c < width; c++) {
            StringBuilder col = new StringBuilder();
            for (int r = 0; r < rowsFilled; r++) col.append(rect[r].charAt(c));
            if (rowsFilled == height) {
                if (!colTrie.contains(col.toString())) return false;
            } else {
                if (!colTrie.startsWith(col.toString())) return false;
            }
        }
        return true;
    }

    static class Trie {
        Map<Character, Trie> children = new HashMap<>();
        boolean isEnd;
        void insert(String word) {
            Trie node = this;
            for (char c : word.toCharArray()) node = node.children.computeIfAbsent(c, k -> new Trie());
            node.isEnd = true;
        }
        boolean startsWith(String prefix) {
            Trie node = this;
            for (char c : prefix.toCharArray()) {
                node = node.children.get(c);
                if (node == null) return false;
            }
            return true;
        }
        boolean contains(String word) {
            Trie node = this;
            for (char c : word.toCharArray()) {
                node = node.children.get(c);
                if (node == null) return false;
            }
            return node.isEnd;
        }
    }
}
```

## जटिलता विश्लेषण

| चरण | जटिलता | विवरण |
|---|---|---|
| शब्द समूहीकरण | $O(W)$ | W = कुल शब्द। |
| ट्राई निर्माण | $O(W \cdot L)$ | L = अधिकतम शब्द लंबाई। |
| ट्राई प्रूनिंग के साथ DFS | सबसे खराब स्थिति में घातीय, अत्यधिक प्रून्ड | अमान्य उपसर्ग शाखाओं को जल्दी काटते हैं। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

१. **क्रॉसवर्ड पहेली निर्माण:** शब्दकोश कॉर्पस से वैध ग्रिड भरने के लिए स्वचालित पहेली इंजन बैकट्रैकिंग और ट्राई सत्यापन का उपयोग करते हैं।
२. **एनएलपी लैटिस पार्सिंग:** टोकन ग्रिड पर बाधा प्रसार इसी तरह की ट्राई प्रूनिंग रणनीति लागू करता है।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **कोई वैध आयत नहीं:** सुरक्षित रूप से `null` लौटाना।
२. **एकल वर्ण शब्द:** आकार १ वाले आयत सीधे पाए जाते हैं।
