---
title: "Multiple Apartments: Query Tenants with Multiple Apartments in SQL (CTCI 14.1)"
description: "CTCI problem 14.1: SQL query using GROUP BY and HAVING to find tenants renting more than one apartment."
date: "2026-04-03"
tags: [एल्गोरिदम और डेटा संरचनाएं, बैकएंड और डेटाबेस]
coverImage: /assets/images/ctci-14-1-multiple-apartments.webp
previewImage: /assets/images/ctci-14-1-multiple-apartments.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १४.१ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १४.१: एसक्यूएल query using GROUP BY and HAVING to find tenants renting more than one apartment.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१४.१** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १४.१: एसक्यूएल query using GROUP BY and HAVING to find tenants renting more than one apartment.

## २. कोड और कार्यान्वयन

```sql
SELECT TenantID, COUNT(*) AS ApartmentCount
FROM AptTenants
GROUP BY TenantID
HAVING COUNT(*) > 1;
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।