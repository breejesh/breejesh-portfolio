---
title: "री-स्पेस (Re-Space): डायनामिक प्रोग्रामिंग और ट्राई वर्ड सेगमेंटेशन (सीटीसीआई १७.१३)"
description: "मेमोइज़्ड डायनामिक प्रोग्रामिंग और ट्राई (Trie) ट्री का उपयोग करके बिना स्पेस वाले टेक्स्ट दस्तावेज़ में न्यूनतम अमान्य वर्णों के साथ स्पेस पुनः सम्मिलित करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-13-re-space.webp
previewImage: /assets/images/ctci-17-13-re-space.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** आपने गलती से किसी लंबे दस्तावेज़ से सभी रिक्त स्थान (Spaces) और विराम चिह्न हटा दिए हैं (उदा. `"iresetthecomputeritstilldidntboot"`)। दिए गए शब्दकोश के आधार पर, रिक्त स्थान इस प्रकार पुनः लगाएं कि अज्ञात/अमान्य वर्णों की संख्या न्यूनतम हो।
> * **मुख्य समाधान:** **मेमोइज़्ड डायनामिक प्रोग्रामिंग और ट्राई (Trie)**:
>   1. **DP अवस्था**: $DP[i]$ सूचकांक $i$ से शुरू होने वाले सबसे अच्छे पार्सिंग परिणाम `(अमान्यसंख्या, पार्सकियागयावाक्य)` को लौटाता है।
>   2. **प्रत्येक वर्ण पर विकल्प**:
>      * **विकल्प १ (अज्ञात वर्ण मानना)**: वर्तमान वर्ण को छोड़ना $\implies 1 + DP[i+1]$।
>      * **विकल्प २ (शब्दकोश मिलान)**: ट्राई ट्री द्वारा $i$ से शुरू होने वाले सभी मान्य शब्दों की खोज $\implies 0 + DP[j+1]$।
>   3. न्यूनतम अमान्य वर्ण देने वाले पथ का चयन करें।
>   4. यह **$O(N \cdot L)$ समय** और **$O(N + \text{Trie})$ स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** चीनी/जापानी एनएलपी (NLP) टेक्स्ट सेगमेंटेशन (Jieba / MeCab) और एलएलएम बाइट-पेयर एन्कोडिंग (BPE)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १७.१३) में पूछा गया है:

*"बिना स्पेस वाले स्ट्रिंग में शब्दकोश के आधार पर स्पेस जोड़कर अज्ञात वर्णों की संख्या को न्यूनतम करें।"*

## २. ट्राई (Trie) ट्री द्वारा ब्रांच प्रूनिंग

ट्राई ट्री द्वारा किसी भी अमान्य अक्षर अनुक्रम पर तुरंत खोज रोक दी जाती है, जिससे अनावश्यक गणना से बचा जा सके।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class ReSpace {

    public static class TrieNode {
        public boolean isWord = false;
        public final Map<Character, TrieNode> children = new HashMap<>();

        public void insert(String word) {
            TrieNode curr = this;
            for (char c : word.toCharArray()) {
                curr = curr.children.computeIfAbsent(c, k -> new TrieNode());
            }
            curr.isWord = true;
        }
    }

    public static class ParseResult {
        public int invalid;
        public String parsed;

        public ParseResult(int invalid, String parsed) {
            this.invalid = invalid;
            this.parsed = parsed;
        }
    }

    public static String reSpace(String document, HashSet<String> dictionary) {
        TrieNode root = new TrieNode();
        for (String word : dictionary) {
            root.insert(word);
        }

        ParseResult[] memo = new ParseResult[document.length()];
        ParseResult result = split(document, 0, root, memo);
        return result.parsed;
    }

    private static ParseResult split(String doc, int start, TrieNode root, ParseResult[] memo) {
        if (start >= doc.length()) return new ParseResult(0, "");
        if (memo[start] != null) return memo[start];

        ParseResult best = split(doc, start + 1, root, memo);
        int minInvalid = best.invalid + 1;
        String bestParsed = doc.charAt(start) + (best.parsed.isEmpty() ? "" : " " + best.parsed);

        TrieNode curr = root;
        for (int i = start; i < doc.length(); i++) {
            char c = doc.charAt(i);
            curr = curr.children.get(c);
            if (curr == null) break;

            if (curr.isWord) {
                ParseResult next = split(doc, i + 1, root, memo);
                if (next.invalid < minInvalid) {
                    minInvalid = next.invalid;
                    String word = doc.substring(start, i + 1);
                    bestParsed = word + (next.parsed.isEmpty() ? "" : " " + next.parsed);
                }
            }
        }

        memo[start] = new ParseResult(minInvalid, bestParsed);
        return memo[start];
    }
}
```

## जटिलता विश्लेषण

| रणनीति | समय जटिलता | सहायक स्पेस | प्रूनिंग दक्षता |
|---|---|---|---|
| **DP + ट्राई ट्री** | **$O(N \cdot L)$** | **$O(N + |\text{Trie}|)$** | **तुरंत शाखा समापन** |
| **DP + हैशसेट** | $O(N^2 \cdot L)$ | $O(N)$ | धीमी सब-स्ट्रिंग कॉपी |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: प्राकृतिक भाषा प्रसंस्करण (NLP)

१. **एशियाई भाषा टोकनाइज़ेशन:** चीनी और जापानी में शब्दों के बीच स्पेस नहीं होता, जहाँ विटरबी (Viterbi) और ट्राई पार्सर द्वारा शब्दों का विभाजन किया जाता है।
२. **एलएलएम बीपीई (BPE) टोकनाइज़र:** सबवर्ड शब्दावली में वाक्यों को विभाजित करना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **कोई मान्य शब्द न मिलना:** सभी वर्णों को स्पेस के साथ अलग करके लौटाना।
२. **अतिव्यापी शब्द (Overlapping Words):** सभी संभावनाओं का मूल्यांकन करके वैश्विक न्यूनतम खोजना।
