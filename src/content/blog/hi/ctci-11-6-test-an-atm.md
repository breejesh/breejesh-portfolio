---
title: "Test an ATM: End-to-End System Testing for Banking Hardware (CTCI 11.6)"
description: "CTCI problem 11.6: test strategy for an automated teller machine (ATM) covering hardware, transaction processing, and failure recovery."
date: "2025-10-27"
tags: [एल्गोरिदम और डेटा संरचनाएं, डेवलपर टूल्स और नीतियां]
coverImage: /assets/images/ctci-11-6-test-an-atm.webp
previewImage: /assets/images/ctci-11-6-test-an-atm.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या ११.६ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem ११.६: test strategy for an automated teller machine (ATM) covering hardware, transaction processing, and failure recovery.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **११.६** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem ११.६: test strategy for an automated teller machine (ATM) covering hardware, transaction processing, and failure recovery.

## २. कोड और कार्यान्वयन

```java
// ATM Test Cases:
// 1. Card read failure and retention
// 2. Dispenser timeout during cash withdrawal
// 3. Network connection drop mid-transaction
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और शून्य इनपुट की जांच करें।