---
title: "बड़ी फ़ाइल सॉर्ट करना (Sort Big File): टेराबाइट डेटा के लिए एक्सटर्नल मर्ज सॉर्ट (सीटीसीआई १०.६)"
description: "सीमित रैम (RAM) के तहत एक्सटर्नल मर्ज सॉर्ट (External Merge Sort) और K-Way Min-Heap का उपयोग करके २० GB फ़ाइल को O(N log N) समय में सॉर्ट करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-10-6-sort-big-file.webp
previewImage: /assets/images/ctci-10-6-sort-big-file.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** कल्पना कीजिए कि आपके पास प्रति पंक्ति एक स्ट्रिंग वाली २० जीबी (20 GB) की फ़ाइल है। बताएं कि आप फ़ाइल को कैसे सॉर्ट करेंगे।
> * **मुख्य समाधान:** **K-Way Min-Heap के साथ एक्सटर्नल मर्ज सॉर्ट**: (१) २० जीबी फ़ाइल को १ जीबी के $K = 20$ टुकड़ों में विभाजित करें (जो रैम में आसानी से आ जाएं); (२) प्रत्येक टुकड़े को मेमोरी में पढ़ें, Quicksort/TimSort से सॉर्ट करें और डिस्क पर क्रमबद्ध टेम्प फ़ाइलें (`chunk_0.txt` ... `chunk_19.txt`) लिखें; (३) सभी २० फ़ाइलों के लिए बफ़र्ड रीडर खोलें और पहली स्ट्रिंग्स को $K$ आकार के Min-Heap (`PriorityQueue`) में डालें; (४) सबसे छोटी स्ट्रिंग को निकालें, अंतिम फ़ाइल में लिखें और संबंधित फ़ाइल से अगली पंक्ति लोड करें; (५) यह **$O(N \log N)$ समय** और रैम में **$O(M)$ स्पेस** में पूरा होता है।
> * **रियल-वर्ल्ड सिस्टम:** पोस्टग्रेएसक्यूएल / मायएसक्यूएल एक्सटर्नल सॉर्ट और अपाचे हडूप मैप-रिड्यूस सॉर्ट चरण।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १०.६) में पूछा गया है:

*"सीमित रैम परिस्थितियों में प्रति पंक्ति एक स्ट्रिंग वाली २० जीबी की फ़ाइल को सॉर्ट करने के लिए स्केलेबल एक्सटर्नल मर्ज सॉर्ट आर्किटेक्चर डिज़ाइन करें।"*

## २. एक्सटर्नल मर्ज सॉर्ट आर्किटेक्चर

चूंकि २० जीबी डेटा उपलब्ध रैम (उदा. ४ जीबी हीप) से अधिक है, इसलिए दो-चरणीय प्रक्रिया अपनाई जाती है:

१. **टुकड़ों का सॉर्टिंग चरण:** १ जीबी के ब्लॉक्स को रैम में पढ़कर सॉर्ट किया जाता है और २० क्रमबद्ध टेम्प फाइलों में डिस्क पर लिखा जाता है।
२. **K-Way मर्ज चरण:** $K = 20$ आकार का मिन-हीप (`PriorityQueue`) फाइलों से सबसे छोटे तत्वों को स्ट्रीम में निकालकर केवल २ डिस्क पास में अंतिम फाइल बनाता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;
import java.util.PriorityQueue;

public class ExternalMergeSort {
    public static class HeapEntry implements Comparable<HeapEntry> {
        public final String value;
        public final int chunkIndex;

        public HeapEntry(String v, int idx) {
            this.value = v;
            this.chunkIndex = idx;
        }

        @Override
        public int compareTo(HeapEntry other) {
            return this.value.compareTo(other.value);
        }
    }

    public static void mergeSortedChunks(List<File> chunkFiles, File outputFile) throws IOException {
        int k = chunkFiles.size();
        BufferedReader[] readers = new BufferedReader[k];
        PriorityQueue<HeapEntry> minHeap = new PriorityQueue<>(k);

        try {
            for (int i = 0; i < k; i++) {
                readers[i] = new BufferedReader(new FileReader(chunkFiles.get(i)), 65536);
                String line = readers[i].readLine();
                if (line != null) {
                    minHeap.add(new HeapEntry(line, i));
                }
            }

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(outputFile), 65536)) {
                while (!minHeap.isEmpty()) {
                    HeapEntry entry = minHeap.poll();
                    writer.write(entry.value);
                    writer.newLine();

                    String nextLine = readers[entry.chunkIndex].readLine();
                    if (nextLine != null) {
                        minHeap.add(new HeapEntry(nextLine, entry.chunkIndex));
                    }
                }
            }
        } finally {
            for (BufferedReader r : readers) {
                if (r != null) r.close();
            }
            for (File f : chunkFiles) {
                f.delete();
            }
        }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| चरण | समय जटिलता | सहायक रैम मेमोरी | डिस्क I/O |
|---|---|---|---|
| विभाजन और सॉर्टिंग | `O(N log(N / K))` | `O(M)` (1 GB) | १ पूर्ण रीड + १ पूर्ण राइट। |
| K-Way मर्जिंग | `O(N log K)` | `O(K * 64KB)` ($\approx 1.3\text{ MB}$) | १ पूर्ण रीड + १ पूर्ण राइट। |
| **संपूर्ण पाइपलाइन** | **$O(N \log N)$** | **$O(M)$** | **ठीक २ क्रमिक पास** |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: डेटाबेस एक्सटर्नल सॉर्ट

१. **पोस्टग्रेएसक्यूएल `work_mem` स्पिलिंग:** जब `ORDER BY` क्वेरी आवंटित रैम से अधिक डेटा संसाधित करती है, तो डेटाबेस इंजन डिस्क पर टेम्प फाइलें बनाकर एक्सटर्नल मर्ज सॉर्ट चलाता है।
२. **हडूप मैप-रिड्यूस सॉर्ट:** मैपर्स स्थानीय डिस्क पर सॉर्टेड पार्टिशन लिखते हैं और रिड्यूसर्स नेटवर्क स्ट्रीम पर K-वे मर्ज करते हैं।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **फाइल डिस्क्रिप्टर सीमा:** यदि $K > 1024$ हो, तो पदानुक्रमित ट्री मर्जिंग (एक समय में ३२ फाइलें मर्ज करना) लागू की जाती है।
