---
title: "Design Grade Database: Relational Database Schema for School Grades (CTCI 14.7)"
description: "CTCI problem 14.7: complete relational database schema design for tracking students, courses, professors, and grade histories."
date: "2025-10-14"
tags: [एल्गोरिदम और डेटा संरचनाएं, बैकएंड और डेटाबेस]
coverImage: /assets/images/ctci-14-7-design-grade-database.webp
previewImage: /assets/images/ctci-14-7-design-grade-database.webp
---


> **टीएल;डीआर**
> * **समस्या:** सीटीसीआई समस्या १४.७ का तकनीकी विवरण।
> * **दृष्टिकोण:** सीटीसीआई problem १४.७: complete relational database schema design for tracking students, courses, professors, and grade histories.
> * **जटिलता:** इष्टतम समय और मेमोरी संतुलन।

तकनीकी साक्षात्कार में आपसे समस्या **१४.७** पूछी जाती है। प्रारंभिक समाधान सीधा दिखता है, लेकिन वास्तविक सिस्टम में समय और मेमोरी की दक्षता अनिवार्य होती है। यहाँ इसका स्पष्ट मानसिक मॉडल, संपूर्ण कोड और मुख्य सावधानियाँ दी गई हैं।

## १. संदर्भ और समस्या कथन
सीटीसीआई problem १४.७: complete relational database schema design for tracking students, courses, professors, and grade histories.

## २. कोड और कार्यान्वयन

```sql
CREATE TABLE Students (StudentID INT PRIMARY KEY, Name VARCHAR(100));
CREATE TABLE Courses (CourseID INT PRIMARY KEY, Name VARCHAR(100));
CREATE TABLE Grades (StudentID INT, CourseID INT, Grade FLOAT, PRIMARY KEY(StudentID, CourseID));
```

## ३. सारांश और एज केसेस
हमेशा सीमांत स्थितियों और इनपुट की जांच करें।