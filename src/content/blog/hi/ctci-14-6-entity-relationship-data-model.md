---
title: "ई-आर डेटा मॉडल (Entity-Relationship Data Model): SQL में करियर नेटवर्क स्कीमा डिज़ाइन (सीटीसीआई १४.६)"
description: "पेशेवर करियर नेटवर्क (कंपनियां, लोग, नौकरियां) के लिए सामान्यीकृत इकाई-संबंध (ER) डेटा मॉडल, DDL स्कीमा और M:N संबंधों का विस्तृत विश्लेषण।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-14-6-entity-relationship-data-model.webp
previewImage: /assets/images/ctci-14-6-entity-relationship-data-model.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** कंपनियों (Companies), लोगों (People) और पेशेवरों (Professionals - वे लोग जिन्होंने कंपनियों में काम किया है) के साथ एक डेटाबेस के लिए एक इकाई-संबंध (ER) आरेख बनाएं।
> * **मुख्य समाधान:** **सामान्यीकृत रिलेशनल इकाई मॉडलिंग**:
>   1. **`People` इकाई**: मानवीय पहचान (`PersonID (PK)`, `FirstName`, `LastName`, `Email`);
>   2. **`Companies` इकाई**: कॉर्पोरेट संगठन (`CompanyID (PK)`, `CompanyName`, `Industry`);
>   3. **`Professionals` उपप्रकार**: `People` का एक तार्किक दृश्य (View) या उपप्रकार जिसके पास कम से कम एक नौकरी का रिकॉर्ड है;
>   4. **`JobHistory` (M:N जंक्शन)**: लोगों और कंपनियों को जोड़ती है (`PositionID (PK)`, `PersonID (FK)`, `CompanyID (FK)`, `Title`, `StartDate`, `EndDate`);
> * **रियल-वर्ल्ड सिस्टम:** लिंक्डइन (LinkedIn) ग्राफ डेटाबेस और वर्कडे (Workday) मानव संसाधन प्रणाली।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १४.६) में पूछा गया है:

*"कंपनियों, व्यक्तियों और पेशेवर कार्य इतिहास को ट्रैक करने वाले सिस्टम के लिए ई-आर (ER) आरेख और DDL स्कीमा डिज़ाइन करें।"*

## २. इकाई-संबंध (ER) आर्किटेक्चर

* **व्यक्ति से कार्य इतिहास:** एक व्यक्ति अपने करियर में कई पदों पर कार्य कर सकता है ($1:N$)।
* **कंपनी से कार्य इतिहास:** एक कंपनी में कई व्यक्ति कार्य कर सकते हैं ($1:N$)।

## प्रोडक्शन DDL कार्यान्वयन

```sql
-- 1. व्यक्तियों की तालिका
CREATE TABLE People (
    PersonID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PhoneNumber VARCHAR(30),
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. कंपनियों की तालिका
CREATE TABLE Companies (
    CompanyID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    CompanyName VARCHAR(255) NOT NULL,
    Industry VARCHAR(100),
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. नौकरी का इतिहास (M:N संबंध)
CREATE TABLE JobHistory (
    PositionID BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PersonID BIGINT NOT NULL REFERENCES People(PersonID) ON DELETE CASCADE,
    CompanyID BIGINT NOT NULL REFERENCES Companies(CompanyID) ON DELETE RESTRICT,
    Title VARCHAR(150) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE, -- NULL वर्तमान पद को दर्शाता है
    CONSTRAINT chk_dates CHECK (EndDate IS NULL OR EndDate >= StartDate)
);

-- 4. प्रोफेशनल्स व्यू
CREATE VIEW Professionals AS
SELECT DISTINCT p.*
FROM People p
INNER JOIN JobHistory j ON p.PersonID = j.PersonID;
```

## इंडेक्सिंग रणनीति

| तालिका | इंडेक्स | उद्देश्य |
|---|---|---|
| `JobHistory` | `(PersonID, StartDate DESC)` | किसी व्यक्ति के रिज्यूमे और कार्य इतिहास की तत्काल लोडिंग। |
| `JobHistory` | `(CompanyID, StartDate DESC)` | किसी कंपनी के कर्मचारियों की त्वरित खोज। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: बाइटेम्पोरल डेटा मॉडलिंग

१. **समयबद्ध इतिहास (SCD Type 2):** संगठनात्मक बदलावों और वेतन इतिहास को सटीक समय सीमाओं (`ValidFrom`, `ValidTo`) के साथ रिकॉर्ड करना।
२. **ग्राफ डेटाबेस प्रोजेक्शन:** इन रिलेशनल तालिकाओं को Neo4j जैसे ग्राफ डेटाबेस में प्रोजेक्ट करके 2nd और 3rd डिग्री कनेक्शन खोजना।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **रेफरेंशियल इंटीग्रिटी:** कंपनियों पर `ON DELETE RESTRICT` लगाकर यह सुनिश्चित करना कि किसी कंपनी को डिलीट करने पर पुराना कर्मचारी इतिहास न मिटे।
