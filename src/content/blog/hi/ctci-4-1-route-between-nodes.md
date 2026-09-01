---
title: "नोड्स के बीच मार्ग (Route Between Nodes): निर्देशित ग्राफ में दो नोड्स के बीच रास्ता खोजना (सीटीसीआई ४.१)"
description: "चौड़ाई-प्रथम खोज (BFS) का उपयोग करके निर्देशित ग्राफ में दो नोड्स के बीच मार्ग की मौजूदगी की O(V + E) समय में जांच करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-4-1-route-between-nodes.webp
previewImage: /assets/images/ctci-4-1-route-between-nodes.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक निर्देशित ग्राफ दिए जाने पर, यह पता लगाने के लिए एक एल्गोरिदम डिजाइन करें कि क्या दो नोड्स के बीच कोई रास्ता है।
> * **मुख्य समाधान:** कतार (Queue) और नोड स्थिति ट्रैकिंग (`Unvisited`, `Visiting`, `Visited`) के साथ **चौड़ाई-प्रथम खोज (BFS)** का उपयोग करें। बीएफएस स्तर-दर-स्तर पड़ोसियों की खोज करता है और $O(V + E)$ समय व $O(V)$ स्पेस में चक्रों से बचते हुए सबसे छोटा रास्ता खोजता है।
> * **रियल-वर्ल्ड सिस्टम:** सोशल नेटवर्क में अलगाव की डिग्री (LinkedIn Degrees) और सर्विस मेश में राउटिंग पाथ चेकिंग।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ४.१) में पूछा गया है:

*"एक निर्देशित ग्राफ दिए जाने पर, यह पता लगाने के लिए एक एल्गोरिदम डिजाइन करें कि क्या दो नोड्स के बीच कोई मार्ग है।"*

**मुख्य बिंदु:**
१. **निर्देशित बनाम अनिर्देशित ग्राफ:** निर्देशित ग्राफ में $u \to v$ का मतलब यह नहीं है कि $v \to u$ भी मौजूद हो।
२. **BFS बनाम DFS:** बीएफएस (BFS) सबसे छोटा रास्ता खोजने और असीम चक्रों से बचने के लिए डीएफएस (DFS) से बेहतर है।

## २. एल्गोरिदम कार्यप्रणाली (इटरेटिव BFS)

१. ग्राफ के सभी नोड्स को `State.Unvisited` चिह्नित करें।
२. एक कतार `LinkedList<Node>` बनाएं।
३. प्रारंभिक नोड `start` को `State.Visiting` चिह्नित करें और कतार में डालें।
४. जब तक कतार खाली न हो:
   * `u = queue.removeFirst()` निकालें।
   * `u` के प्रत्येक पड़ोसी $v$ के लिए:
     * यदि $v$ `State.Unvisited` है:
       * यदि $v == end$, तो तुरंत `true` लौटाएं।
       * अन्यथा, $v$ को `State.Visiting` चिह्नित करें और कतार में डालें।
   * `u` को `State.Visited` चिह्नित करें।
५. यदि कतार समाप्त होने तक `end` नहीं मिलता, तो `false` लौटाएं।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.LinkedList;

public class RouteBetweenNodes {
    public enum State { Unvisited, Visited, Visiting; }

    public static class Node {
        private Node[] adjacent;
        public int adjacentCount;
        private final String vertex;
        public State state;

        public Node(String vertex, int adjacentLength) {
            this.vertex = vertex;
            this.adjacent = new Node[adjacentLength];
            this.adjacentCount = 0;
            this.state = State.Unvisited;
        }

        public void addAdjacent(Node x) {
            if (adjacentCount < adjacent.length) {
                this.adjacent[adjacentCount] = x;
                adjacentCount++;
            }
        }

        public Node[] getAdjacent() { return adjacent; }
        public String getVertex() { return vertex; }
    }

    public static class Graph {
        private final Node[] nodes;
        public Graph(Node[] nodes) { this.nodes = nodes; }
        public Node[] getNodes() { return nodes; }
    }

    /**
     * निर्धारित करता है कि क्या start और end के बीच निर्देशित मार्ग मौजूद है।
     * समय जटिलता: O(V + E)
     * स्पेस जटिलता: O(V)
     */
    public static boolean search(Graph g, Node start, Node end) {
        if (start == end) return true;

        for (Node u : g.getNodes()) {
            u.state = State.Unvisited;
        }

        LinkedList<Node> queue = new LinkedList<>();

        start.state = State.Visiting;
        queue.add(start);

        while (!queue.isEmpty()) {
            Node u = queue.removeFirst();
            if (u != null) {
                for (Node v : u.getAdjacent()) {
                    if (v != null && v.state == State.Unvisited) {
                        if (v == end) {
                            return true;
                        } else {
                            v.state = State.Visiting;
                            queue.add(v);
                        }
                    }
                }
                u.state = State.Visited;
            }
        }

        return false;
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(V + E)` | प्रत्येक सुलभ शीर्ष $V$ और निर्देशित किनारे $E$ को अधिकतम एक बार पार करता है। |
| सहायक मेमोरी | `O(V)` | कतार में अधिकतम $V$ नोड्स संग्रहीत होते हैं। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: वितरित प्रणालियों में ग्राफ पाथफाइंडिंग

१. **सर्विस मेश रूटिंग (इस्तियो / एनवॉय):** अपस्ट्रीम निर्भरता पहुंच की पुष्टि करना।
२. **आईएम सुरक्षा और एक्सेस कंट्रोल:** भूमिका पदानुक्रम में अनुमतियों की जांच।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **प्रारंभ और अंत समान होना (`start == end`):** तुरंत `true` लौटाता है।
२. **चक्रों वाला ग्राफ ($A \to B \to C \to A$):** विज़िट स्थिति अनंत लूप को रोकती है।
