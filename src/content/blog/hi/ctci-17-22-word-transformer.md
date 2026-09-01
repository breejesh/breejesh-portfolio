---
title: "वर्ड ट्रांसफॉर्मर (Word Transformer): अंतर्निहित शब्द ग्राफ पर BFS सबसे छोटा रूपांतरण अनुक्रम (सीटीसीआई १७.२२)"
description: "द्विदिशात्मक BFS और वाइल्डकार्ड पैटर्न मैप का उपयोग करके दो शब्दों के बीच O(N * L^2) समय में सबसे छोटा रूपांतरण अनुक्रम खोजना जहां प्रत्येक चरण एक अक्षर बदलता है।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-22-word-transformer.webp
previewImage: /assets/images/ctci-17-22-word-transformer.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक स्रोत शब्द, एक लक्ष्य शब्द और एक शब्दकोश दिया गया है। शब्द रूपांतरणों का सबसे छोटा अनुक्रम खोजें जहां प्रत्येक चरण बिल्कुल एक अक्षर बदलता है और हर मध्यवर्ती शब्द शब्दकोश में है।
> * **मुख्य समाधान:** **अंतर्निहित शब्द ग्राफ पर द्विदिशात्मक BFS**:
>   1. वाइल्डकार्ड समीपता मानचित्र बनाएं: प्रत्येक शब्द के लिए, एक `*` प्रतिस्थापित करके सभी पैटर्न उत्पन्न करें।
>   2. स्रोत और लक्ष्य दोनों से **एक साथ BFS** चलाएं। जब दोनों अग्रभाग प्रतिच्छेद हों तो समाप्त करें।
>   3. द्विदिशात्मक BFS खोजे गए अवस्था स्थान को $O(b^d)$ से घटाकर $O(2 \cdot b^{d/2})$ करता है।
>   4. समय: **$O(N \cdot L^2)$**, स्पेस: **$O(N \cdot L)$**।
> * **रियल-वर्ल्ड सिस्टम:** स्पेल-चेकर सुझाव इंजन और ज्ञान ग्राफ हॉप-पथ पुनःप्राप्ति।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १७.२२) में पूछा गया है:

*"स्रोत और लक्ष्य शब्द दिए गए हैं, सबसे छोटा रूपांतरण अनुक्रम खोजें जहां क्रमागत शब्द बिल्कुल एक अक्षर से भिन्न हों और सभी मध्यवर्ती शब्द शब्दकोश में हों।"*

## २. वाइल्डकार्ड पैटर्न मानचित्र और BFS

वाइल्डकार्ड पैटर्न मानचित्र (`"hit" → {"*it", "h*t", "hi*"}`) प्रत्येक नई अवस्था के लिए शब्दकोश ट्रैवर्स किए बिना ग्राफ का निर्माण करता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class WordTransformer {

    public static List<String> transform(String start, String stop, Set<String> dictionary) {
        if (!dictionary.contains(stop)) return null;
        Map<String, List<String>> wildcardMap = buildWildcardMap(dictionary);
        BFSData sourceData = new BFSData(start);
        BFSData destData   = new BFSData(stop);

        while (!sourceData.toVisit.isEmpty() && !destData.toVisit.isEmpty()) {
            String collision = extendBFS(sourceData, destData, wildcardMap);
            if (collision != null) return mergePaths(sourceData, destData, collision);
            collision = extendBFS(destData, sourceData, wildcardMap);
            if (collision != null) return mergePaths(sourceData, destData, collision);
        }
        return null;
    }

    private static Map<String, List<String>> buildWildcardMap(Set<String> dict) {
        Map<String, List<String>> map = new HashMap<>();
        for (String word : dict) {
            for (int i = 0; i < word.length(); i++) {
                String pattern = word.substring(0, i) + "*" + word.substring(i + 1);
                map.computeIfAbsent(pattern, k -> new ArrayList<>()).add(word);
            }
        }
        return map;
    }

    static class BFSData {
        Queue<String> toVisit = new LinkedList<>();
        Map<String, String> visited = new HashMap<>();
        BFSData(String start) { toVisit.add(start); visited.put(start, null); }
    }

    private static String extendBFS(BFSData primary, BFSData other, Map<String, List<String>> map) {
        int count = primary.toVisit.size();
        while (count-- > 0) {
            String word = primary.toVisit.poll();
            for (int i = 0; i < word.length(); i++) {
                String pattern = word.substring(0, i) + "*" + word.substring(i + 1);
                for (String neighbor : map.getOrDefault(pattern, Collections.emptyList())) {
                    if (!primary.visited.containsKey(neighbor)) {
                        primary.visited.put(neighbor, word);
                        primary.toVisit.add(neighbor);
                    }
                    if (other.visited.containsKey(neighbor)) return neighbor;
                }
            }
        }
        return null;
    }

    private static List<String> mergePaths(BFSData src, BFSData dst, String collision) {
        LinkedList<String> pathSrc = new LinkedList<>();
        String curr = collision;
        while (curr != null) { pathSrc.addFirst(curr); curr = src.visited.get(curr); }
        List<String> pathDst = new ArrayList<>();
        curr = dst.visited.get(collision);
        while (curr != null) { pathDst.add(curr); curr = dst.visited.get(curr); }
        pathSrc.addAll(pathDst);
        return pathSrc;
    }
}
```

## जटिलता विश्लेषण

| चरण | समय जटिलता | विवरण |
|---|---|---|
| वाइल्डकार्ड मानचित्र निर्माण | $O(N \cdot L)$ | N शब्द, प्रत्येक में L पैटर्न। |
| द्विदिशात्मक BFS | $O(N \cdot L^2)$ | प्रति विज़िट किए गए शब्द पैटर्न उत्पन्न करना। |
| **कुल** | **$O(N \cdot L^2)$** | **अंतर्निहित शब्द ग्राफ के लिए इष्टतम।** |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

१. **स्पेल-चेकर सुझाव इंजन:** Levenshtein दूरी-१ पड़ोस वाइल्डकार्ड पैटर्न ग्राफ है।
२. **ज्ञान ग्राफ हॉप पथ:** Wikidata में सिमेंटिक दूरी-१ परिवर्तनों पर BFS।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **लक्ष्य शब्दकोश में नहीं:** तुरंत `null` लौटाना।
२. **स्रोत = लक्ष्य:** एकल-तत्व सूची लौटाना।
