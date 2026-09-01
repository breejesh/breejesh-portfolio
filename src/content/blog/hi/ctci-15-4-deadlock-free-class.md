---
title: "डेडलॉक-मुक्त क्लास (Deadlock-Free Class): लॉक निर्भरता ग्राफ और चक्र पहचान (सीटीसीआई १५.४)"
description: "जावा में डायरेक्टेड एसाइक्लिक ग्राफ (DAG) और DFS निर्भरता विश्लेषण द्वारा संभावित सर्कुलर वेट डेडलॉक को रोकने के लिए डेडलॉक-मुक्त लॉक मैनेजर डिज़ाइन करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-15-4-deadlock-free-class.webp
previewImage: /assets/images/ctci-15-4-deadlock-free-class.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक ऐसी क्लास डिज़ाइन करें जो केवल तभी लॉक प्रदान करती है जब कोई संभावित डेडलॉक न हो।
> * **मुख्य समाधान:** **अधिग्रहण-पूर्व चक्र पहचान के साथ गतिशील लॉक निर्भरता ग्राफ (DAG)**:
>   1. **ग्राफ़ निरूपण**: सभी लॉक्स को एक निर्देशित निर्भरता ग्राफ़ $G = (V, E)$ में नोड्स के रूप में दर्शाएं। एक निर्देशित किनारा $A \to B$ दर्शाता है कि किसी थ्रेड ने लॉक $A$ प्राप्त किया और बाद में लॉक $B$ का अनुरोध किया।
>   2. **अधिग्रहण-पूर्व सत्यापन**: जब लॉक्स $\{L_1, \dots, L_k\}$ रखने वाला थ्रेड $L_{\text{new}}$ प्राप्त करने का प्रयास करता है, तो जांचें कि क्या किनारे $L_i \to L_{\text{new}}$ जोड़ने से निर्देशित चक्र बनता है।
>   3. **चक्र पहचान (DFS)**: $L_{\text{new}}$ से DFS चलाकर जांचें कि क्या वर्तमान में रखे गए किसी लॉक तक पहुंचा जा सकता है।
>   4. **अस्वीकृति या स्वीकृति**: यदि चक्र का पता चलता है, तो लॉक देने से मना करें; अन्यथा किनारा जोड़ें और लॉक प्रदान करें।
>   5. यह **$O(V + E)$ समय** में निष्पादित होता है।
> * **रियल-वर्ल्ड सिस्टम:** थ्रेड सैनिटाइज़र (ThreadSanitizer) और डेटाबेस लॉक मैनेजर।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १५.४) में पूछा गया है:

*"एक थ्रेड-सुरक्षित लॉक मैनेजर डिज़ाइन करें जो संभावित सर्कुलर वेट डेडलॉक का पता लगाने के लिए ग्राफ चक्र विश्लेषण का उपयोग करता है।"*

## २. लॉक निर्भरता ग्राफ सिद्धांत

यदि कोई थ्रेड $A$ रखते हुए $B$ का अनुरोध करता है और दूसरा $B$ रखते हुए $A$ का अनुरोध करता है, तो चक्र $A \to B \to A$ बनता है। एल्गोरिदम इस चक्र को पहचानकर लॉक अस्वीकार करता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

public class LockManager {
    private static final LockManager INSTANCE = new LockManager();
    private final Map<Integer, LockNode> locks = new ConcurrentHashMap<>();
    private final ThreadLocal<List<LockNode>> threadLocks = ThreadLocal.withInitial(ArrayList::new);

    public static LockManager getInstance() { return INSTANCE; }

    public static class LockNode {
        private final int id;
        private final ReentrantLock lock = new ReentrantLock();
        private final List<LockNode> children = new ArrayList<>();

        public LockNode(int id) { this.id = id; }
        public int getId() { return id; }
        public ReentrantLock getLock() { return lock; }
        public List<LockNode> getChildren() { return children; }

        public synchronized void addEdge(LockNode target) {
            if (!children.contains(target)) children.add(target);
        }
    }

    public synchronized boolean acquireLock(int lockId) {
        LockNode target = locks.computeIfAbsent(lockId, LockNode::new);
        List<LockNode> currentHeldLocks = threadLocks.get();

        if (!currentHeldLocks.isEmpty()) {
            for (LockNode held : currentHeldLocks) {
                if (hasCycle(target, held)) {
                    System.err.println("डेडलॉक रोका गया: लॉक " + lockId);
                    return false;
                }
            }
            for (LockNode held : currentHeldLocks) held.addEdge(target);
        }

        target.getLock().lock();
        currentHeldLocks.add(target);
        return true;
    }

    public synchronized void releaseLock(int lockId) {
        LockNode node = locks.get(lockId);
        if (node != null) {
            node.getLock().unlock();
            threadLocks.get().remove(node);
        }
    }

    private boolean hasCycle(LockNode from, LockNode to) {
        Set<Integer> visited = new HashSet<>();
        return dfs(from, to, visited);
    }

    private boolean dfs(LockNode current, LockNode target, Set<Integer> visited) {
        if (current == target) return true;
        if (!visited.add(current.getId())) return false;
        for (LockNode next : current.getChildren()) {
            if (dfs(next, target, visited)) return true;
        }
        return false;
    }
}
```

## जटिलता विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| चक्र पहचान समय | `O(V + E)` | लॉक नोड्स और किनारों पर मानक DFS ट्रैवर्सल। |
| मेमोरी उपयोग | `O(V + E)` | वैश्विक आसन्नता सूची (Adjacency List)। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: थ्रेड सैनिटाइज़र

१. **डायनामिक विश्लेषण:** ThreadSanitizer (TSan) रनटाइम पर लॉक ऑर्डर ग्राफ बनाकर संभावित डेडलॉक की पूर्व चेतावनी देता है।
२. **डेटाबेस वेट-फॉर ग्राफ्स:** डेटाबेस में चक्र मिलने पर सबसे नए ट्रांजैक्शन को स्वतः रोलबैक करना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **रीएन्ट्रेंट लॉक्स:** बिना स्व-चक्र ($A \to A$) बनाए समान थ्रेड द्वारा दोबारा लॉक प्राप्त करने का समर्थन।
