---
title: "ग्रेड डेटाबेस डिज़ाइन (Design Grade Database): SQL में छात्र जीपीए और पर्सेंटाइल रैंकिंग (सीटीसीआई १४.७)"
description: "स्कूल ग्रेडिंग सिस्टम के लिए 3NF रिलेशनल स्कीमा डिज़ाइन और SQL विंडो फ़ंक्शंस (PERCENT_RANK) द्वारा शीर्ष 10% मेधावी छात्रों की गणना करने के लिए क्वेरी।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-14-7-design-grade-database.webp
previewImage: /assets/images/ctci-14-7-design-grade-database.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** छात्रों, पाठ्यक्रमों, शिक्षकों और ग्रेडों को ट्रैक करने के लिए एक स्कूल सिस्टम के लिए एक डेटाबेस डिज़ाइन करें। जीपीए (GPA) के आधार पर शीर्ष 10% छात्रों को खोजने के लिए एक SQL क्वेरी लिखें।
> * **मुख्य समाधान:** **3NF सामान्यीकृत स्कीमा और विंडो रैंकिंग फ़ंक्शन**:
>   1. **स्कीमा डिज़ाइन**: `Students`, `Courses`, `Teachers` तालिकाएँ और ग्रेड व क्रेडिट संग्रहीत करने वाली जंक्शन तालिका `CourseEnrollment`।
>   2. **जीपीए गणना**: भारित जीपीए: $\text{GPA} = \frac{\sum (\text{Grade} \times \text{Credits})}{\sum \text{Credits}}$।
>   3. **शीर्ष १०% रैंकिंग**: आधुनिक विंडो फ़ंक्शन `PERCENT_RANK() OVER (ORDER BY GPA DESC)` का उपयोग करके `WHERE PctRank <= 0.10` द्वारा फ़िल्टर करें।
>   4. यह **$O(N \log N)$ समय** में निष्पादित होता है।
> * **रियल-वर्ल्ड सिस्टम:** विश्वविद्यालय छात्र सूचना प्रणाली (SIS) और छात्रवृत्ति चयन पाइपलाइन।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १४.७) में पूछा गया है:

*"छात्र ग्रेडिंग सिस्टम के लिए रिलेशनल स्कीमा डिज़ाइन करें और GPA के आधार पर शीर्ष १०% छात्रों की पहचान करने के लिए SQL क्वेरी लिखें।"*

## २. 3NF DDL स्कीमा

```sql
CREATE TABLE Students (
    StudentID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    StudentName VARCHAR(100) NOT NULL
);

CREATE TABLE Courses (
    CourseID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    CourseName VARCHAR(100) NOT NULL,
    Credits INT NOT NULL CHECK (Credits > 0)
);

CREATE TABLE Teachers (
    TeacherID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    TeacherName VARCHAR(100) NOT NULL
);

CREATE TABLE CourseEnrollment (
    EnrollmentID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    StudentID BIGINT NOT NULL REFERENCES Students(StudentID) ON DELETE CASCADE,
    CourseID BIGINT NOT NULL REFERENCES Courses(CourseID) ON DELETE RESTRICT,
    TeacherID BIGINT NOT NULL REFERENCES Teachers(TeacherID) ON DELETE RESTRICT,
    Term VARCHAR(20) NOT NULL,
    Grade NUMERIC(3, 2) NOT NULL CHECK (Grade >= 0.00 AND Grade <= 4.00),
    CONSTRAINT uq_student_course_term UNIQUE (StudentID, CourseID, Term)
);
```

## ३. शीर्ष १०% छात्रों की SQL क्वेरी

```sql
WITH StudentGPA AS (
    SELECT 
        e.StudentID,
        SUM(e.Grade * c.Credits) / SUM(c.Credits) AS GPA
    FROM CourseEnrollment e
    INNER JOIN Courses c ON e.CourseID = c.CourseID
    GROUP BY e.StudentID
    HAVING SUM(c.Credits) > 0
),
RankedCohort AS (
    SELECT 
        StudentID,
        GPA,
        PERCENT_RANK() OVER (ORDER BY GPA DESC) AS PctRank
    FROM StudentGPA
)
SELECT 
    s.StudentID,
    s.StudentName,
    ROUND(r.GPA, 2) AS FinalGPA
FROM RankedCohort r
INNER JOIN Students s ON r.StudentID = s.StudentID
WHERE r.PctRank <= 0.10
ORDER BY r.GPA DESC;
```

## निष्पादन योजना और जटिलता

| चरण | ऑपरेशन | जटिलता |
|---|---|---|
| १. जीपीए एग्रीगेशन | `CourseEnrollment` पर ग्रुप बाई | $O(E)$ |
| २. विंडो सॉर्टिंग | पर्सेंटाइल रैंकिंग के लिए सॉर्ट | $O(S \log S)$ |
| ३. पर्सेंटाइल फ़िल्टर | रैखिक फ़िल्टरिंग `PctRank <= 0.10` | $O(S)$ |
| ४. नाम फेचिंग | प्राइमरी की लुकअप | $O(K)$ |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: प्री-कैलकुलेटेड GPA कैशिंग

१. **मटीरियलाइज्ड व्यूज:** हजारों छात्रों के लिए वास्तविक समय में जीपीए की गणना करने से बचने के लिए सेमेस्टर के अंत में संचयी जीपीए को प्री-कैलकुलेट किया जाता है।
२. **बराबर अंक (Ties):** `PERCENT_RANK()` का उपयोग कटऑफ सीमा पर समान अंक पाने वाले सभी छात्रों को निष्पक्ष रूप से शामिल करता है।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **शून्य क्रेडिट:** `HAVING SUM(Credits) > 0` द्वारा शून्य से विभाजन की रोकथाम।
