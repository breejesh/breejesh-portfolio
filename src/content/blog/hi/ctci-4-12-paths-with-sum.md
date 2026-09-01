---
title: "योग के साथ रास्ते (Paths with Sum): दिए गए योग वाले नीचे की ओर रास्तों की गणना (सीटीसीआई ४.१२)"
description: "प्रीफिक्स योग (Prefix Sums) और हैश टेबल बैकट्रैकिंग का उपयोग करके बाइनरी ट्री में लक्षित योग वाले रास्तों की O(N) समय में सटीक गणना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-4-12-paths-with-sum.webp
previewImage: /assets/images/ctci-4-12-paths-with-sum.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** आपको एक बाइनरी ट्री दिया गया है जिसमें प्रत्येक नोड में एक पूर्णांक मान (सकारात्मक या नकारात्मक) होता है। एक दिए गए मान के बराबर योग करने वाले रास्तों की संख्या गिनने के लिए एक एल्गोरिदम डिजाइन करें। रास्ता जरूरी नहीं कि रूट से शुरू हो या पत्ती पर खत्म हो, लेकिन यह नीचे की ओर होना चाहिए।
> * **मुख्य समाधान:** **हैश मैप के साथ प्रीफिक्स सम**: रूट से वर्तमान नोड तक संचयी योग `runningSum` रखें। वर्तमान नोड पर समाप्त होने वाले और `targetSum` योग वाले सब-पाथ की संख्या `runningSum - targetSum` वाले पूर्वजों की संख्या के बराबर होती है। इसे एक `HashMap` में बैकट्रैकिंग के साथ ट्रैक करें ($O(N)$ समय और $O(H)$ स्पेस)।
> * **रियल-वर्ल्ड सिस्टम:** नेटवर्क पैकेट डेटा विंडो विश्लेषण और वित्तीय लेनदेन लाभ अंतराल ट्रैकिंग।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ४.१२) में पूछा गया है:

*"आपको एक बाइनरी ट्री दिया गया है जिसमें प्रत्येक नोड में पूर्णांक मान है। एक लक्षित मान का योग करने वाले रास्तों की संख्या गिनें। रास्ते केवल नीचे की दिशा में जाने चाहिए।"*

## २. प्रीफिक्स योग और बैकट्रैकिंग कार्यप्रणाली

पूर्वज $A$ से नोड $B$ तक के रास्ते का योग:
$$\text{PathSum}(A \to B) = \text{RunningSum}(B) - \text{RunningSum}(\text{पैरेंट}(A))$$

लक्षित स्थिति $\text{PathSum} = \text{targetSum}$ के लिए:
$$\text{RunningSum}(\text{पैरेंट}(A)) = \text{RunningSum}(B) - \text{targetSum}$$

**एल्गोरिदम:**
१. `runningSum` को अपडेट करते हुए पेड़ में नीचे जाएं।
२. `HashMap<Integer, Integer> pathCount` में `runningSum - targetSum` खोजें।
३. मिलने वाली आवृत्तियों को कुल रास्तों में जोड़ें।
४. वर्तमान `runningSum` को मैप में दर्ज करें।
५. बाएं और दाएं सबट्री में रिकर्सिव खोज करें।
६. **बैकट्रैकिंग:** पैरेंट पर लौटने से पहले मैप से वर्तमान `runningSum` की गिनती घटाएं।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.HashMap;

public class PathsWithSum {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;
        public TreeNode(int x) { this.val = x; }
    }

    /**
     * लक्षित योग वाले रास्तों की गणना करता है।
     * समय जटिलता: O(N)
     * स्पेस जटिलता: O(log N) संतुलित पेड़ में, O(N) सबसे खराब स्थिति में।
     */
    public static int countPathsWithSum(TreeNode root, int targetSum) {
        return countPathsWithSum(root, targetSum, 0, new HashMap<Integer, Integer>());
    }

    private static int countPathsWithSum(TreeNode node, int targetSum, int runningSum,
                                         HashMap<Integer, Integer> pathCount) {
        if (node == null) return 0;

        runningSum += node.val;
        int sum = runningSum - targetSum;
        int totalPaths = pathCount.getOrDefault(sum, 0);

        if (runningSum == targetSum) {
            totalPaths++;
        }

        incrementHashTable(pathCount, runningSum, 1);

        totalPaths += countPathsWithSum(node.left, targetSum, runningSum, pathCount);
        totalPaths += countPathsWithSum(node.right, targetSum, runningSum, pathCount);

        incrementHashTable(pathCount, runningSum, -1); // बैकट्रैकिंग

        return totalPaths;
    }

    private static void incrementHashTable(HashMap<Integer, Integer> hashTable, int key, int delta) {
        int newCount = hashTable.getOrDefault(key, 0) + delta;
        if (newCount == 0) {
            hashTable.remove(key);
        } else {
            hashTable.put(key, newCount);
        }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N)` | प्रत्येक नोड ठीक एक बार देखा जाता है और हैश टेबल पर $O(१)$ ऑपरेशन करता है। |
| सहायक मेमोरी | `O(\log N \text{ से } N)` | हैश मैप और रिकर्शन स्टैक में केवल वर्तमान पथ के पूर्वज संग्रहीत होते हैं। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: निरंतर रेंज योग मूल्यांकन

१. **वित्तीय ट्रेडिंग स्ट्रीम:** जोखिम या लक्ष्य सीमा को पूरा करने वाले निरंतर व्यापारिक अंतरालों की पहचान।
२. **नेटवर्क बैंडविड्थ मॉनिटरिंग:** लक्षित डेटा कोटा का उपभोग करने वाले पैकेट अनुक्रमों का पता लगाना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **ऋणात्मक और शून्य मान:** हैश टेबल में आवृत्तियों के कारण सटीक रूप से प्रबंधित।
२. **खाली पेड़:** 0 लौटाता है।
