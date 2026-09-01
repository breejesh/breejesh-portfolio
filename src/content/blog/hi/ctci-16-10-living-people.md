---
title: "जीवित लोग (Living People): स्वीप-लाइन डेल्टा सरणी और अधिकतम जनसंख्या (सीटीसीआई १६.१०)"
description: "स्वीप-लाइन डिफरेंस एरे (Delta Array) और प्रीफिक्स सम का उपयोग करके १९०० से २००० के बीच अधिकतम जीवित लोगों वाले वर्ष को O(P + Y) समय में ज्ञात करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-16-10-living-people.webp
previewImage: /assets/images/ctci-16-10-living-people.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** लोगों की एक सूची दी गई है जिसमें उनके जन्म और मृत्यु के वर्ष हैं (१९०० से २००० के बीच), सबसे अधिक जीवित लोगों वाले वर्ष की गणना करें।
> * **मुख्य समाधान:** **स्वीप-लाइन डेल्टा सरणी (Difference Array)**:
>   1. **इवेंट रिकॉर्डिंग**: वर्ष १९०० से २००० के लिए १०२ आकार की एक डेल्टा सरणी बनाएं।
>   2. प्रत्येक व्यक्ति $(B, D)$ के लिए:
>      * जन्म वर्ष पर जोड़ें: `deltas[B - 1900] += 1;`
>      * मृत्यु के ठीक अगले वर्ष घटाएं: `deltas[D - 1900 + 1] -= 1;`
>   3. **रनिंग प्रीफिक्स सम**: डेल्टा सरणी में संचयी योग `currentlyAlive += deltas[i]` निकालते हुए अधिकतम जनसंख्या वाले वर्ष को ट्रैक करें।
>   4. यह **$O(P + Y)$ समय** और **$O(Y) = O(1)$ स्पेस** में चलता है।
> * **रियल-वर्ल्ड सिस्टम:** लोड बैलेंसरों में समवर्ती कनेक्शन क्षमता ट्रैकिंग।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १६.१०) में पूछा गया है:

*"जन्म और मृत्यु वर्षों की सूची के आधार पर अधिकतम जीवित जनसंख्या वाले वर्ष की पहचान करने के लिए एल्गोरिदम लिखें।"*

## २. डिफरेंस एरे की कार्यप्रणाली

स्वीप-लाइन दृष्टिकोण प्रत्येक व्यक्ति के जीवनकाल को दो घटनाओं ($+१$ और $-१$) में बदल देता है, जिससे एक ही पास में जनसंख्या की गणना हो जाती है।

## प्रोडक्शन कार्यान्वयन

```java
public class LivingPeople {

    public static class Person {
        public final int birth;
        public final int death;

        public Person(int birth, int death) {
            this.birth = birth;
            this.death = death;
        }
    }

    public static int maxAliveYear(Person[] people, int minYear, int maxYear) {
        if (people == null || people.length == 0) return minYear;

        int yearRange = maxYear - minYear + 1;
        int[] deltas = new int[yearRange + 2];

        for (Person person : people) {
            deltas[person.birth - minYear]++;
            deltas[person.death - minYear + 1]--;
        }

        int maxAlive = 0;
        int maxYear = minYear;
        int currentlyAlive = 0;

        for (int i = 0; i < yearRange; i++) {
            currentlyAlive += deltas[i];
            if (currentlyAlive > maxAlive) {
                maxAlive = currentlyAlive;
                maxYear = minYear + i;
            }
        }

        return maxYear;
    }
}
```

## जटिलता विश्लेषण

| रणनीति | समय जटिलता | सहायक स्पेस |
|---|---|---|
| **डेल्टा सरणी (Sweep-Line)** | **$O(P + Y)$** | **$O(Y)$** (१०१ वर्षों के लिए स्थिर) |
| **दोहरी सॉर्टिंग** | $O(P \log P)$ | $O(P)$ |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: लोड बैलेंसर में समवर्ती सत्र

१. **सक्रिय सत्र क्षमता:** Envoy और Nginx कनेक्शन खुलने (`SYN`) और बंद होने (`FIN`) पर डेल्टा मान जोड़कर पीक लोड की गणना करते हैं।
२. **टाइम सीरीज़ मेट्रिक्स:** प्रोमेथियस (Prometheus) में समवर्ती दरों की गणना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **समान वर्ष में जन्म और मृत्यु ($B = D$):** $B$ पर $+१$ और $B+१$ पर $-१$ जोड़कर उस वर्ष में सही गणना सुनिश्चित करना।
