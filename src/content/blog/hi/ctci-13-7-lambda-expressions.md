---
title: "लैम्ब्डा एक्सप्रेशन्स (Lambda Expressions): जावा 8+ में फंक्शनल स्ट्रीम एग्रीगेशन पाइपलाइन (सीटीसीआई १३.७)"
description: "जावा 8 लैम्ब्डा एक्सप्रेशन्स, स्ट्रीम्स एपीआई (Streams API), प्रिमिटिव IntStream और समानांतर प्रोसेसिंग द्वारा डेटा एकत्रीकरण का गहन विश्लेषण।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-13-7-lambda-expressions.webp
previewImage: /assets/images/ctci-13-7-lambda-expressions.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** एक क्लास `Country` है जिसमें `getContinent()` और `getPopulation()` मेथड्स हैं। लैम्ब्डा एक्सप्रेशन्स का उपयोग करके एक फ़ंक्शन `int getPopulation(List<Country> countries, String continent)` लिखें जो किसी दिए गए महाद्वीप की कुल जनसंख्या की गणना करता है।
> * **मुख्य समाधान:** **प्रिमिटिव स्ट्रीम पाइपलाइन**: (१) इनपुट लिस्ट और महाद्वीप स्ट्रिंग की अमान्यता की जांच करें; (२) `countries.stream()` द्वारा स्ट्रीम बनाएं; (३) महाद्वीप का मिलान करने के लिए `filter(c -> continent.equals(c.getContinent()))` लगाएं; (४) ऑटो-बॉक्सिंग से बचने के लिए `mapToInt(Country::getPopulation)` का उपयोग करें; (५) अंतिम टर्मिनल ऑपरेशन `.sum()` चलाएं; (६) यह **$O(N)$ समय** और **$O(1)$ स्पेस** में पूरा होता है।
> * **रियल-वर्ल्ड सिस्टम:** अपाचे स्पार्क (Apache Spark) और काफ्का स्ट्रीम्स (Kafka Streams) में डेटा प्रोसेसिंग।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १३.७) में पूछा गया है:

*"जावा 8 लैम्ब्डा एक्सप्रेशन्स और स्ट्रीम्स एपीआई का उपयोग करके किसी विशिष्ट महाद्वीप के देशों की कुल जनसंख्या की गणना करने के लिए विधि लिखें।"*

```java
public class Country {
    private final String continent;
    private final int population;

    public Country(String continent, int population) {
        this.continent = continent;
        this.population = population;
    }

    public String getContinent() { return continent; }
    public int getPopulation() { return population; }
}
```

## २. स्ट्रीम पाइपलाइन आर्किटेक्चर

१. **सोर्स:** `countries.stream()`।
२. **इंटरमीडिएट ऑपरेशंस:** लेज़ी फ़िल्टरिंग और `IntStream` में रूपांतरण।
३. **टर्मिनल ऑपरेशन:** सिंगल-पास सम एग्रीगेशन।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.List;
import java.util.Objects;

public class CountryPopulationAggregator {

    public static int getPopulation(List<Country> countries, String continent) {
        if (countries == null || continent == null) {
            return 0;
        }

        return countries.stream()
            .filter(Objects::nonNull)
            .filter(c -> continent.equalsIgnoreCase(c.getContinent()))
            .mapToInt(Country::getPopulation)
            .sum();
    }

    public static long getPopulationParallel(List<Country> countries, String continent) {
        if (countries == null || continent == null) {
            return 0L;
        }

        return countries.parallelStream()
            .filter(Objects::nonNull)
            .filter(c -> continent.equalsIgnoreCase(c.getContinent()))
            .mapToLong(Country::getPopulation)
            .sum();
    }
}
```

## जटिलता विश्लेषण

| मापदंड | अनुक्रमिक स्ट्रीम | समानांतर स्ट्रीम (`parallelStream()`) |
|---|---|---|
| समय जटिलता | `O(N)` | $P$ सीपीयू कोर पर `O(N / P)` |
| सहायक मेमोरी | `O(1)` | `O(P)` थ्रेड स्टैक फ्रेम्स |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: लूप फ्यूज़न और JIT कंपाइलर

१. **लेज़ी इवैल्यूएशन:** स्ट्रीम्स एपीआई कोई मध्यवर्ती सूचियां नहीं बनाती है। JIT कंपाइलर फ़िल्टर और मैपिंग को एक एकल नेटिव `for` लूप में जोड़ देता है।
२. **प्रिमिटिव विशेषज्ञता (`mapToInt`):** हीप में लाखों `Integer` ऑब्जेक्ट्स बनने से बचाती है।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **पूर्णांक ओवरफ्लो:** यदि वैश्विक जनसंख्या २.१४ अरब ($2^{31}-1$) से अधिक हो जाती है, तो ६४-बिट `long` और `mapToLong()` का उपयोग करें।
