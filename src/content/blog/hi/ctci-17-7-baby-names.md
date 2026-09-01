---
title: "शिशु नाम (Baby Names): ग्राफ़ कनेक्टेड कंपोनेंट्स द्वारा पर्यायवाची क्लस्टरिंग (सीटीसीआई १७.७)"
description: "ग्राफ़ कनेक्टेड कंपोनेंट्स डीएफएस (DFS) और यूनियन-फाइंड का उपयोग करके पर्यायवाची नामों की कुल आवृत्तियों को O(V + E) लीनियर समय में समेकित करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-17-7-baby-names.webp
previewImage: /assets/images/ctci-17-7-baby-names.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** आपको दो सूचियां दी गई हैं: एक नामों और उनकी पंजीकरण आवृत्तियों की, और दूसरी पर्यायवाची नामों के जोड़ों की (उदा. `(John, Jon)`, `(Jon, Johnny)`। सभी पर्यायवाची नामों की कुल आवृत्तियों को जोड़कर वास्तविक लोकप्रिय नामों की एक समेकित सूची प्रिंट करें।
> * **मुख्य समाधान:** **ग्राफ़ कनेक्टेड कंपोनेंट्स DFS / यूनियन-फाइंड (DSU)**:
>   1. **ग्राफ़ निर्माण**: प्रत्येक नाम को एक शीर्ष $V$ के रूप में और प्रत्येक पर्यायवाची जोड़े को एक अप्रत्यक्ष किनारे $E$ के रूप में जोड़ें।
>   2. **कंपोनेंट ट्रैवर्सल**: प्रत्येक अनविज़िटेड नोड के लिए, उसके पूरे जुड़े हुए क्लस्टर में डीएफएस चलाएं और सभी उप-नामों की आवृत्तियों का योग निकालें।
>   3. कुल आवृत्ति को एक मुख्य रूट नाम पर मैप करें।
>   4. यह **$O(V + E)$ समय** और **$O(V + E)$ सहायक स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** मास्टर डेटा मैनेजमेंट (MDM) में ग्राहक पहचान समाधान और खोज इंजनों में पर्यायवाची विस्तार।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १७.७) में पूछा गया है:

*"समानार्थी नामों के जोड़ों के आधार पर सभी वर्तनी भिन्नताओं को एक समूह में जोड़ें और उनकी कुल आवृत्तियों का योग निकालें।"*

## २. ग्राफ़ कनेक्टिविटी का सिद्धांत

समानार्थी जोड़ों को अप्रत्यक्ष किनारों के रूप में जोड़कर, अप्रत्यक्ष संबंधों ($A \sim B$ और $B \sim C \implies A \sim C$) को एक ही डीएफएस पास में खोजा जाता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class BabyNames {

    public static class GraphNode {
        public final String name;
        public int frequency = 0;
        public final List<GraphNode> neighbors = new ArrayList<>();
        public boolean visited = false;

        public GraphNode(String name, int frequency) {
            this.name = name;
            this.frequency = frequency;
        }
    }

    public static Map<String, Integer> trulyPopularNames(
            Map<String, Integer> names,
            String[][] synonyms) {

        Map<String, GraphNode> graph = new HashMap<>();

        // 1. शीर्ष और आवृत्तियों को जोड़ें
        for (Map.Entry<String, Integer> entry : names.entrySet()) {
            graph.put(entry.getKey(), new GraphNode(entry.getKey(), entry.getValue()));
        }

        // 2. अप्रत्यक्ष किनारे जोड़ें
        for (String[] pair : synonyms) {
            String name1 = pair[0];
            String name2 = pair[1];

            GraphNode node1 = graph.computeIfAbsent(name1, k -> new GraphNode(k, 0));
            GraphNode node2 = graph.computeIfAbsent(name2, k -> new GraphNode(k, 0));

            node1.neighbors.add(node2);
            node2.neighbors.add(node1);
        }

        // 3. कनेक्टेड कंपोनेंट्स का अन्वेषण और योग
        Map<String, Integer> rootFrequencies = new HashMap<>();

        for (GraphNode node : graph.values()) {
            if (!node.visited) {
                int totalFrequency = getComponentFrequency(node);
                rootFrequencies.put(node.name, totalFrequency);
            }
        }

        return rootFrequencies;
    }

    private static int getComponentFrequency(GraphNode node) {
        if (node.visited) return 0;
        node.visited = true;

        int sum = node.frequency;
        for (GraphNode neighbor : node.neighbors) {
            sum += getComponentFrequency(neighbor);
        }
        return sum;
    }
}
```

## जटिलता विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(V + E)` | ग्राफ़ के प्रत्येक शीर्ष और किनारे का एकल दौरा। |
| सहायक स्पेस | `O(V + E)` | एडजसेंसी लिस्ट और डीएफएस रिकर्शन स्टैक। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: मास्टर डेटा मैनेजमेंट (MDM)

१. **पहचान समाधान (Salesforce MDM):** विभिन्न चैनलों से आने वाले डुप्लिकेट ग्राहक खातों को एक मास्टर कस्टमर आईडी में जोड़ना।
२. **सर्च इंजन सिनोनिम एक्सपेंशन:** इलास्टिकसर्च में कीवर्ड सर्च को पर्यायवाची शब्दों तक विस्तारित करना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **चक्रीय संबंध (Cycles):** `visited = true` फ़्लैग चक्रीय समानार्थी लूपों में अनंत रिकर्शन को रोकता है।
