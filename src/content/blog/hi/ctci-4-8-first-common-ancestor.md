---
title: "पहला सामान्य पूर्वज (First Common Ancestor): बाइनरी ट्री में निकटतम सामान्य पूर्वज (सीटीसीआई ४.८)"
description: "अतिरिक्त डेटा संरचनाओं के बिना बाइनरी ट्री में दो नोड्स का पहला सामान्य पूर्वज (LCA) O(N) समय और O(H) स्पेस में खोजने वाला एल्गोरिदम।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-4-8-first-common-ancestor.webp
previewImage: /assets/images/ctci-4-8-first-common-ancestor.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** बाइनरी ट्री (आवश्यक नहीं कि BST हो) में दो नोड्स का पहला सामान्य पूर्वज (LCA) खोजने के लिए एक एल्गोरिदम डिजाइन करें। अतिरिक्त नोड्स को स्टोर करने से बचें।
> * **मुख्य समाधान:** **पोस्ट-ऑर्डर ट्री सर्च**: एक नोड $r$ सामान्य पूर्वज होता है यदि $p$ एक सबट्री में और $q$ दूसरे सबट्री में स्थित हो। यदि बाएं और दाएं रिकर्सिव कॉल गैर-शून्य नोड्स लौटाते हैं, तो वर्तमान नोड ही एलसीए (LCA) है ($O(N)$ समय और $O(H)$ स्टैक स्पेस)।
> * **रियल-वर्ल्ड सिस्टम:** ब्राउज़र डीओएम इवेंट बबलिंग और गिट मर्ज बेस गणना।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ४.८) में पूछा गया है:

*"बाइनरी ट्री में दो नोड्स का पहला सामान्य पूर्वज खोजने के लिए एक एल्गोरिदम डिजाइन करें।"*

## २. पोस्ट-ऑर्डर रिकर्शन कार्यप्रणाली

१. आधार स्थिति: यदि `root == null`, तो `null` लौटाएं।
२. यदि `root == p || root == q`, तो `root` लौटाएं।
३. बाएं और दाएं सबट्री में रिकर्सिव खोज करें।
४. परिणामों का मूल्यांकन करें:
   * यदि दोनों दिशाओं से गैर-शून्य नोड लौटते हैं, तो $p$ और $q$ अलग-अलग सबट्री में हैं और `root` निकटतम सामान्य पूर्वज है।
   * यदि केवल एक तरफ से नोड लौटता है, तो दोनों नोड उसी सबट्री में हैं।
   * यदि दोनों `null` हैं, तो कोई नोड नहीं मिला।

## प्रोडक्शन कार्यान्वयन

```java
public class FirstCommonAncestor {
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;

        public TreeNode(int x) {
            this.val = x;
        }
    }

    /**
     * नोड्स p और q का पहला सामान्य पूर्वज खोजता है।
     * समय जटिलता: O(N)
     * स्पेस जटिलता: O(H) जहां H पेड़ की ऊंचाई है।
     */
    public static TreeNode commonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (!covers(root, p) || !covers(root, q)) {
            return null;
        }
        return ancestorHelper(root, p, q);
    }

    private static TreeNode ancestorHelper(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) {
            return root;
        }

        boolean pIsOnLeft = covers(root.left, p);
        boolean qIsOnLeft = covers(root.left, q);

        if (pIsOnLeft != qIsOnLeft) {
            return root;
        }

        TreeNode childSide = pIsOnLeft ? root.left : root.right;
        return ancestorHelper(childSide, p, q);
    }

    private static boolean covers(TreeNode root, TreeNode p) {
        if (root == null) return false;
        if (root == p) return true;
        return covers(root.left, p) || covers(root.right, p);
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समय जटिलता | `O(N)` | $p$ और $q$ को खोजने के लिए पेड़ के नोड्स को स्कैन करता है। |
| सहायक मेमोरी | `O(H)` | पेड़ की ऊंचाई $H$ तक सीमित रिकर्सिव स्टैक मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: पदानुक्रम समाधान

१. **ब्राउज़र डीओएम इवेंट बबलिंग:** इवेंट ट्रांसमिशन चेन बनाने के लिए निकटतम सामान्य पूर्वज की पहचान।
२. **एक्सेस कंट्रोल ट्री (RBAC):** सुरक्षा नीतियों के इनहेरिटेंस के लिए पूर्वज नोड का पता लगाना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **पेड़ में नोड का न होना:** प्रारंभिक `covers` जांच `null` लौटाती है।
२. **$p$ ही $q$ का पूर्वज होना:** सही रूप से $p$ लौटाता है।
