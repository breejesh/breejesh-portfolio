---
title: "Student Attendance: SQL Query for Student Course Grades (CTCI 14.3)"
description: "CTCI problem 14.3: SQL update query to update student attendance status and compute GPA averages."
date: "2026-02-15"
tags: [Algorithms]
coverImage: /assets/images/ctci-14-3-student-attendance.webp
previewImage: /assets/images/ctci-14-3-student-attendance.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १४.३ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १४.३: एसक्यूएल update query to update student attendance status and compute GPA averages.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

यह लेख सीटीसीआई समस्या **१४.३** का एक स्पष्ट विवरण प्रदान करता है।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १४.३: एसक्यूएल update query to update student attendance status and compute GPA averages.

## २. कोड और कार्यान्वयन

```java
UPDATE StudentCourses
SET Status = 'Passed'
WHERE Grade >= 60;
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।