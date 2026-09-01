---
title: "फ़ाइल सिस्टम (File System): इन-मेमोरी पदानुक्रमित फ़ाइल और निर्देशिका आर्किटेक्चर (सीटीसीआई ७.११)"
description: "कंपोजिट डिज़ाइन पैटर्न (Composite Design Pattern) का उपयोग करके O(D) पाथ ट्रैवर्सल समय में इन-मेमोरी पदानुक्रमित फ़ाइल सिस्टम का ऑब्जेक्ट-ओरिएंटेड डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-11-file-system.webp
previewImage: /assets/images/ctci-7-11-file-system.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** उन डेटा संरचनाओं और एल्गोरिदम को समझाएं जिनका उपयोग आप इन-मेमोरी फ़ाइल सिस्टम को डिज़ाइन करने के लिए करेंगे।
> * **मुख्य समाधान:** **कंपोजिट डिज़ाइन पैटर्न (Composite Design Pattern)**: (१) अमूर्त आधार क्लास `Entry` जिसमें नाम, पैरेंट डायरेक्टरी संदर्भ, टाइमस्टैम्प और अमूर्त विधियां `size()` और `getFullPath()` हैं; (२) `File` सबक्लास जो कच्चा डेटा `byte[] content` संग्रहीत करता है; (३) `Directory` सबक्लास जो बाल प्रविष्टियों की सूची `List<Entry> contents` को प्रबंधित करता है और पुनरावर्ती आकार की गणना करता है; (४) $O(D)$ समय में पदानुक्रमित पाथ रिज़ॉल्यूशन (जहाँ $D$ वृक्ष की गहराई है)।
> * **रियल-वर्ल्ड सिस्टम:** लिनक्स वर्चुअल फाइल सिस्टम (`tmpfs` / `procfs`) और अमेज़न S3 प्रीफिक्स ट्री।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ७.११) में पूछा गया है:

*"नेस्टेड डायरेक्टरी और बाइनरी फ़ाइलों के समर्थन के साथ इन-मेमोरी फ़ाइल सिस्टम के लिए ऑब्जेक्ट-ओरिएंटेड संरचना डिज़ाइन करें।"*

## २. कंपोजिट ऑब्जेक्ट-ओरिएंटेड आर्किटेक्चर

१. **`Entry` (Abstract Base Class):** फ़ाइल सिस्टम नोड के सामान्य गुण (नाम, पैरेंट डायरेक्टरी, निर्माण तिथि) और अमूर्त `size()`।
२. **`File` (Extends `Entry`):** लीफ नोड जो बाइनरी डेटा (`byte[] content`) संग्रहीत करता है।
३. **`Directory` (Extends `Entry`):** आंतरिक कंपोजिट नोड जिसमें चाइल्ड नोड्स की सूची (`List<Entry> contents`) होती है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.List;

public class FileSystemDesign {
    public static abstract class Entry {
        protected Directory parent;
        protected long created;
        protected long lastUpdated;
        protected String name;

        public Entry(String n, Directory p) {
            this.name = n;
            this.parent = p;
            this.created = System.currentTimeMillis();
            this.lastUpdated = System.currentTimeMillis();
        }

        public boolean delete() {
            if (parent == null) return false;
            return parent.deleteEntry(this);
        }

        public abstract int size();

        public String getFullPath() {
            if (parent == null) return name;
            return parent.getFullPath() + "/" + name;
        }

        public String getName() { return name; }
    }

    public static class File extends Entry {
        private byte[] content;
        private int size;

        public File(String n, Directory p, int sz) {
            super(n, p);
            this.size = sz;
        }

        public int size() { return size; }
        public byte[] getContent() { return content; }
        public void setContent(byte[] c) {
            this.content = c;
            this.size = c == null ? 0 : c.length;
        }
    }

    public static class Directory extends Entry {
        protected List<Entry> contents = new ArrayList<>();

        public Directory(String n, Directory p) {
            super(n, p);
        }

        public int size() {
            int size = 0;
            for (Entry e : contents) {
                size += e.size();
            }
            return size;
        }

        public boolean deleteEntry(Entry entry) {
            return contents.remove(entry);
        }

        public void addEntry(Entry entry) {
            contents.add(entry);
        }

        public List<Entry> getContents() { return contents; }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| getFullPath() समय | `O(D)` | रूट नोड तक $D$ गहराई तक ऊपर जाना। |
| Directory size() समय | `O(N)` | डायरेक्टरी सबट्री के सभी चाइल्ड नोड्स का योग। |
| सहायक मेमोरी | `O(N)` | फ़ाइलों और फ़ोल्डरों के अनुपात में हीप मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: लिनक्स वर्चुअल फाइल सिस्टम (VFS)

१. **लिनक्स `tmpfs` और `procfs`:** मेमोरी-आधारित पदानुक्रमित संरचनाएं जो कर्नेल और प्रक्रिया स्थिति को वर्चुअल फाइलों के रूप में प्रस्तुत करती हैं।
२. **अमेज़न S3 प्रीफिक्स डायरेक्टरी:** फ्लैट की-वैल्यू स्टोर पर पदानुक्रमित फोल्डर संरचना का अनुकरण।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **रूट डायरेक्टरी डिलीशन:** `parent == null` जांच द्वारा सुरक्षित प्रबंधन।
