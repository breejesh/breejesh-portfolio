---
title: "एक्सएमएल एन्कोडिंग (XML Encoding): रिकर्सिव AST टोकनाइज़ेशन और सीरियलाइज़ेशन (सीटीसीआई १६.१२)"
description: "पूर्वनिर्धारित पूर्णांक मैपिंग और प्री-ऑर्डर रिकर्सिव AST ट्रैवर्सल का उपयोग करके विस्तृत XML दस्तावेज़ों को कॉम्पैक्ट बाइट टोकन स्ट्रीम में बदलना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-12-xml-encoding.webp
previewImage: /assets/images/ctci-16-12-xml-encoding.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** चूंकि XML बहुत विस्तृत होता है, इसलिए इसे एन्कोड करने का एक तरीका डिज़ाइन करें जहां प्रत्येक टैग को एक पूर्वनिर्धारित पूर्णांक मान पर मैप किया जाता है। व्याकरण है: `Element -> Tag Attributes END (Value | Children) END`, `Attribute -> Tag Value`, `END -> 0`।
> * **मुख्य समाधान:** **प्री-ऑर्डर रिकर्सिव AST सीरियलाइज़ेशन**:
>   1. **टैग मैपिंग**: टैग नामों को पूर्णांक कोड पर मैप करें (उदा. `family` $\to$ 1, `person` $\to$ 2)।
>   2. **एन्कोडिंग नियम**:
>      * `TagCode` जोड़ें।
>      * प्रत्येक विशेषता के लिए: `AttrTagCode` और `AttrValue` जोड़ें।
>      * `0` (विशेषताओं की समाप्ति) जोड़ें।
>      * यदि टेक्स्ट नोड है, तो `Value` जोड़ें; अन्यथा बच्चों को रिकर्सिव रूप से एन्कोड करें।
>      * `0` (एलिमेंट की समाप्ति) जोड़ें।
>   3. यह **$O(N)$ समय** और **$O(N)$ सहायक स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** प्रोटोकॉल बफ़र्स (Protobuf Wire Format) और बाइनरी XML (BSON / Fast Infoset)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.१२) में पूछा गया है:

*"निर्दिष्ट व्याकरण के अनुसार XML एलिमेंट ट्री को कॉम्पैक्ट इंटीजर टोकन स्ट्रीम में बदलने के लिए सीरियलाइज़ेशन कोड लिखें।"*

## २. सीरियलाइज़ेशन पाइपलाइन

प्रत्येक नोड का प्री-ऑर्डर ट्रैवर्सल करके टैग और विशेषताओं को पहले संसाधित किया जाता है, जिसके बाद चाइल्ड एलिमेंट्स का रिकर्शन होता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.*;

public class XmlEncoder {

    public static class Attribute {
        public final String tag;
        public final String value;

        public Attribute(String tag, String value) {
            this.tag = tag;
            this.value = value;
        }
    }

    public static class Element {
        public final String name;
        public final List<Attribute> attributes = new ArrayList<>();
        public final List<Element> children = new ArrayList<>();
        public String value;

        public Element(String name) {
            this.name = name;
        }

        public Element(String name, String value) {
            this.name = name;
            this.value = value;
        }
    }

    public static String encode(Element root, Map<String, String> tagMap) {
        StringBuilder sb = new StringBuilder();
        encodeHelper(root, tagMap, sb);
        return sb.toString().trim();
    }

    private static void encodeHelper(Element root, Map<String, String> tagMap, StringBuilder sb) {
        if (root == null) return;

        sb.append(tagMap.getOrDefault(root.name, root.name)).append(" ");

        for (Attribute attr : root.attributes) {
            sb.append(tagMap.getOrDefault(attr.tag, attr.tag)).append(" ");
            sb.append(attr.value).append(" ");
        }

        sb.append("0 "); // विशेषताओं का अंत

        if (root.value != null && !root.value.isEmpty()) {
            sb.append(root.value).append(" ");
        } else {
            for (Element child : root.children) {
                encodeHelper(child, tagMap, sb);
            }
        }

        sb.append("0 "); // एलिमेंट का अंत
    }
}
```

## जटिलता विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N)` | प्रत्येक नोड और विशेषता का एकल प्री-ऑर्डर दौरा। |
| सहायक स्पेस | `O(N)` | स्ट्रिंग बिल्डर और रिकर्शन स्टैक। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: प्रोटोकॉल बफ़र्स बनाम बाइनरी XML

१. **प्रोटोबफ़ (Protobuf):** गूगल का प्रोटोबफ़ पेलोड लंबाई एन्कोड करके क्लोज़िंग टैग को पूरी तरह समाप्त कर देता है।
२. **फास्ट इन्फोसेट (Fast Infoset):** मोबाइल नेटवर्क पर बैंडविड्थ बचाने के लिए टेक्स्ट को बाइट इंडेक्स से बदलना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **अज्ञात टैग:** मैप में न होने पर मूल स्ट्रिंग लौटाना ताकि नल-पॉइंटर अपवाद न आए।
