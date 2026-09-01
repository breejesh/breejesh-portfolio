---
title: "संरेखित मैलॉक (Aligned Malloc): C में बाइट-संरेखित मेमोरी एलोकेटर (सीटीसीआई १२.१०)"
description: "हार्डवेयर कैश-लाइन और SIMD बाधाओं को पूरा करने के लिए C में aligned_malloc और aligned_free का O(1) समय में कुशल कार्यान्वयन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-12-10-malloc.webp
previewImage: /assets/images/ctci-12-10-malloc.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक `aligned_malloc` और `aligned_free` फ़ंक्शन लिखें जो बाइट्स की संख्या और एक संरेखण (जो २ की घात होगी) लेता है और मेमोरी के लिए एक पॉइंटर लौटाता है जो मेमोरी में संरेखित (Aligned) है (उदा. पता संरेखण का गुणज है)।
> * **मुख्य समाधान:** **छिपे हुए पॉइंटर हेडर के साथ पैडेड आवंटन**: (१) मानक `malloc()` द्वारा `total = bytes + alignment - 1 + sizeof(void*)` मेमोरी आवंटित करें; (२) संरेखित पते की गणना बिटमास्क द्वारा करें: `aligned = (raw + sizeof(void*) + alignment - 1) & ~(alignment - 1)`; (३) संरेखित पते के ठीक पिछले स्लॉट में मूल `raw` पता संग्रहीत करें: `((void**)aligned)[-1] = raw`; (४) `aligned` लौटाएं; (५) `aligned_free(p)`: हेडर से `raw = ((void**)p)[-1]` प्राप्त करें और `free(raw)` कॉल करें; (६) यह **$O(1)$ समय** में निष्पादित होता है।
> * **रियल-वर्ल्ड सिस्टम:** POSIX `posix_memalign()`, C11 `aligned_alloc()` और AVX-512 वेक्टर प्रोसेसिंग।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १२.१०) में पूछा गया है:

*"C में aligned_malloc और aligned_free फ़ंक्शन लिखें जो २ की घात वाले सीमा पर संरेखित मेमोरी आवंटित और मुक्त करते हैं।"*

## २. मेमोरी लेआउट और बिटमास्किंग

फ़ाइल/मेमोरी को बाद में `free()` करने के लिए मूल पॉइंटर को संरेखित पते के ठीक पहले संग्रहीत किया जाता है:

$$\text{aligned} = (\text{raw} + \text{sizeof(void*)} + A - 1) \ \& \ \sim(A - 1)$$

## प्रोडक्शन कार्यान्वयन

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

/**
 * बाइट-संरेखित मेमोरी आवंटित करता है।
 * समय जटिलता: O(1)
 * स्पेस ओवरहेड: O(alignment + sizeof(void*))
 */
void* aligned_malloc(size_t bytes, size_t alignment) {
    // संरेखण 2 की घात होना चाहिए
    if (alignment == 0 || (alignment & (alignment - 1)) != 0) {
        return NULL;
    }

    size_t header_size = sizeof(void*);
    size_t total_bytes = bytes + alignment - 1 + header_size;

    void* raw = malloc(total_bytes);
    if (!raw) return NULL;

    uintptr_t raw_addr = (uintptr_t)raw + header_size;
    uintptr_t aligned_addr = (raw_addr + alignment - 1) & ~(alignment - 1);
    void* aligned_ptr = (void*)aligned_addr;

    // संरेखित पॉइंटर से ठीक पहले मूल रॉ पॉइंटर स्टोर करें
    ((void**)aligned_ptr)[-1] = raw;

    return aligned_ptr;
}

/**
 * संरेखित मेमोरी को मुक्त करता है।
 */
void aligned_free(void* p) {
    if (!p) return;
    void* raw = ((void**)p)[-1];
    free(raw);
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| आवंटन समय | `O(1)` | स्थिर समय में बिटमास्क अंकगणित और पॉइंटर असाइनमेंट। |
| विमुक्ति समय | `O(1)` | हेडर से कच्चा पॉइंटर पढ़ना और मानक `free()` कॉल। |
| मेमोरी पैडिंग | $\le A + 7\text{ Bytes}$ | ६४-बिट आर्किटेक्चर पर संरेखण $A$ तक सीमित। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: SIMD और हार्डवेयर कैश लाइन

१. **AVX-512 वेक्टर निर्देश:** ६४-बाइट संरेखण अनिवार्य होता है; असंरेखित डेटा मेमोरी बस को धीमा करता है या सीपीयू ट्रैप फॉल्ट उत्पन्न करता है।
२. **लिनक्स डायरेक्ट I/O (`O_DIRECT`):** पेज कैश को बायपास करने के लिए ४,०९६-बाइट सेक्टर सीमाओं पर संरेखित बफर।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **अमान्य संरेखण:** `(alignment & (alignment - 1)) != 0` द्वारा तुरंत सुरक्षित।
२. **नल पॉइंटर:** बिना किसी क्रैश के तुरंत वापस लौटना।
