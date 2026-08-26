---
title: "Student Attendance: SQL Query for Student Course Grades (CTCI 14.3)"
description: "CTCI problem 14.3: SQL update query to update student attendance status and compute GPA averages."
date: "2026-02-15"
tags: [एल्गोरिदम और डेटा संरचनाएं, बैकएंड और डेटाबेस]
coverImage: /assets/images/ctci-14-3-student-attendance.webp
previewImage: /assets/images/ctci-14-3-student-attendance.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १४.३ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १४.३: एसक्यूएल update query to update student attendance status and compute GPA averages.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१४.३** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १४.३: एसक्यूएल update query to update student attendance status and compute GPA averages.

## २. कोड और कार्यान्वयन

```sql
UPDATE StudentCourses
SET Status = 'Passed'
WHERE Grade >= 60;
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।