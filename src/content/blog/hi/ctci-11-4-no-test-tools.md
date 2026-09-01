---
title: "बिना परीक्षण उपकरण (No Test Tools): कस्टम उच्च-थ्रूपुट लोड जनरेटर का निर्माण (सीटीसीआई ११.४)"
description: "वेब सर्वर थ्रूपुट (RPS), लेटेंसी परसेंटाइल (P95/P99) और त्रुटि दरों का मूल्यांकन करने के लिए स्क्रैच से मल्टी-थ्रेडेड लोड टेस्टर का निर्माण।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-11-4-no-test-tools.webp
previewImage: /assets/images/ctci-11-4-no-test-tools.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** बिना किसी परीक्षण उपकरण (जैसे JMeter या Locust) का उपयोग किए आप किसी वेबपेज का लोड टेस्ट कैसे करेंगे?
> * **मुख्य समाधान:** **कस्टम मल्टी-थ्रेडेड लोड टेस्ट इंजन**: (१) एक निश्चित थ्रेड पूल (उदा. १०० समवर्ती थ्रेड्स) बनाएं जो एक निश्चित समय अंतराल तक निरंतर HTTP अनुरोध भेजता रहे; (२) **मेट्रिक्स संग्रह**: प्रति अनुरोध लेटेंसी ($T_{\text{end}} - T_{\text{start}}$), एचटीटीपी स्थिति कोड (2xx vs 5xx) और टाइमआउट त्रुटियों को रिकॉर्ड करना; (३) **सांख्यिकीय एकत्रीकरण**: थ्रूपुट (RPS), औसत लेटेंसी, P50/P95/P99 परसेंटाइल और विफलता प्रतिशत की गणना; (४) **सर्वर-साइड टेलीमेट्री**: सर्वर सीपीयू, मेमोरी और सॉकेट डिस्क्रिप्टर संतृप्ति की निगरानी।
> * **रियल-वर्ल्ड सिस्टम:** नेटफ्लिक्स और क्लाउडफ्लेयर में कस्टम बेंचमार्किंग हार्नेस और DDoS सिमुलेशन टूल्स।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ११.४) में पूछा गया है:

*"बिना किसी बाहरी सॉफ़्टवेयर टूल का उपयोग किए वेब सर्वर के लोड और प्रदर्शन का परीक्षण करने के लिए सिस्टम डिज़ाइन करें।"*

## २. लोड परीक्षण इंजन घटक

१. **लोड जनरेटर:** समवर्ती थ्रेड्स जो `HttpURLConnection` द्वारा निरंतर अनुरोध भेजते हैं।
२. **इन-मेमोरी मेट्रिक्स एग्रीगेटर:** प्रति अनुरोध लेटेंसी और त्रुटि कोड का संचय।
३. **रिपोर्टिंग इंजन:** लेटेंसी मानों को सॉर्ट करके P50, P95 और P99 परसेंटाइल की गणना।

## प्रोडक्शन कार्यान्वयन

```java
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

public class CustomLoadTester {
    private final String targetUrl;
    private final int concurrency;
    private final int totalRequests;
    private final List<Long> latencies = Collections.synchronizedList(new ArrayList<>());
    private final AtomicInteger successCount = new AtomicInteger(0);
    private final AtomicInteger errorCount = new AtomicInteger(0);

    public CustomLoadTester(String url, int concurrency, int totalRequests) {
        this.targetUrl = url;
        this.concurrency = concurrency;
        this.totalRequests = totalRequests;
    }

    public void runBenchmark() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(concurrency);
        CountDownLatch latch = new CountDownLatch(totalRequests);
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < totalRequests; i++) {
            executor.submit(() -> {
                long reqStart = System.currentTimeMillis();
                try {
                    URL url = new URL(targetUrl);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(5000);
                    conn.setReadTimeout(5000);

                    int code = conn.getResponseCode();
                    long reqEnd = System.currentTimeMillis();

                    latencies.add(reqEnd - reqStart);
                    if (code >= 200 && code < 300) {
                        successCount.incrementAndGet();
                    } else {
                        errorCount.incrementAndGet();
                    }
                    conn.disconnect();
                } catch (IOException e) {
                    errorCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        long totalDuration = System.currentTimeMillis() - startTime;
        executor.shutdown();

        printReport(totalDuration);
    }

    private void printReport(long totalDurationMs) {
        Collections.sort(latencies);
        double rps = (successCount.get() + errorCount.get()) / (totalDurationMs / 1000.0);
        long p50 = latencies.isEmpty() ? 0 : latencies.get((int) (latencies.size() * 0.50));
        long p95 = latencies.isEmpty() ? 0 : latencies.get((int) (latencies.size() * 0.95));
        long p99 = latencies.isEmpty() ? 0 : latencies.get((int) (latencies.size() * 0.99));

        System.out.printf("कुल अवधि: %d ms | कुल अनुरोध: %d%n", totalDurationMs, totalRequests);
        System.out.printf("थ्रूपुट: %.2f req/sec%n", rps);
        System.out.printf("सफल: %d | त्रुटियाँ: %d%n", successCount.get(), errorCount.get());
        System.out.printf("विलंबता: P50=%d ms, P95=%d ms, P99=%d ms%n", p50, p95, p99);
    }
}
```

## जटिलता और प्रदर्शन विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| समवर्ती भार जनरेशन | `O(N / C)` | $C$ समवर्ती थ्रेड्स में $N$ अनुरोधों का विभाजन। |
| परसेंटाइल गणना | `O(N log N)` | लेटेंसी नमूनों की इन-मेमोरी सॉर्टिंग। |
| सहायक मेमोरी | `O(N)` | रिकॉर्ड की गई लेटेंसी सूचियों का इन-मेमोरी संचय। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: टीसीपी पोर्ट संतृप्ति

१. **इफेमेरल पोर्ट संतृप्ति:** एकल मशीन से अत्यधिक समवर्ती अनुरोध ६५,५३५ टीसीपी पोर्ट्स को समाप्त कर सकते हैं। लिनक्स में `net.ipv4.tcp_tw_reuse = 1` ट्यून किया जाता है।
२. **कनेक्शन पूलिंग:** `Connection: keep-alive` और कोल्ड कनेक्शन दोनों की तुलना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **टाइमआउट नियंत्रण:** थ्रेड्स को ब्लॉक होने से बचाने के लिए ५,००० ms का सख्त टाइमआउट।
२. **मेमोरी सीमा:** करोड़ों अनुरोधों के लिए HdrHistogram का उपयोग करके मेमोरी को स्थिर रखना।
