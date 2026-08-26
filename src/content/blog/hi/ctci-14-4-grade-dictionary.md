---
title: "Grade Dictionary: Outer Joins and Aggregations (CTCI 14.4)"
description: "CTCI problem 14.4: writing SQL queries to join Students, Courses, and Teachers with aggregate functions."
date: "2025-10-21"
tags: [एल्गोरिदम और डेटा संरचनाएं, बैकएंड और डेटाबेस]
coverImage: /assets/images/ctci-14-4-grade-dictionary.webp
previewImage: /assets/images/ctci-14-4-grade-dictionary.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १४.४ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १४.४: writing एसक्यूएल queries to join Students, Courses, and Teachers with aggregate functions.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१४.४** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १४.४: writing एसक्यूएल queries to join Students, Courses, and Teachers with aggregate functions.

## २. कोड और कार्यान्वयन

```sql
SELECT Students.StudentName, Courses.CourseName, StudentCourses.Grade
FROM Students
INNER JOIN StudentCourses ON Students.StudentID = StudentCourses.StudentID
INNER JOIN Courses ON StudentCourses.CourseID = Courses.CourseID;
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।