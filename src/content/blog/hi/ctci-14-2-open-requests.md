---
title: "Open Requests: SQL Left Join for Open Maintenance Requests (CTCI 14.2)"
description: "CTCI problem 14.2: SQL query returning open maintenance requests per building using LEFT JOIN and GROUP BY."
date: "2026-06-05"
tags: [Algorithms]
coverImage: /assets/images/ctci-14-2-open-requests.webp
previewImage: /assets/images/ctci-14-2-open-requests.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १४.२ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १४.२: एसक्यूएल query returning open maintenance requests per building using LEFT JOIN and GROUP BY.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१४.२** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १४.२: एसक्यूएल query returning open maintenance requests per building using LEFT JOIN and GROUP BY.

## २. कोड और कार्यान्वयन

```java
SELECT Buildings.BuildingName, COUNT(Requests.RequestID) AS OpenRequests
FROM Buildings
LEFT JOIN Apartments ON Buildings.BuildingID = Apartments.BuildingID
LEFT JOIN Requests ON Apartments.AptID = Requests.AptID AND Requests.Status = 'Open'
GROUP BY Buildings.BuildingID, Buildings.BuildingName;
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।