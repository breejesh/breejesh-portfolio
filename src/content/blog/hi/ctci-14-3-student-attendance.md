---
title: "सभी अनुरोध बंद करें (Close All Requests): SQL में मल्टी-टेबल बैच अपडेट्स (सीटीसीआई १४.३)"
description: "SQL में सबक्वेरी और विदेशी कुंजी इंडेक्सिंग का उपयोग करके किसी विशिष्ट इमारत के सभी मेंटेनेंस अनुरोधों को सुरक्षित और परमाणु (Atomic) रूप से बंद करना।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-14-3-student-attendance.webp
previewImage: /assets/images/ctci-14-3-student-attendance.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** इमारत संख्या ११ (BuildingID = 11) के सभी अपार्टमेंटों के मेंटेनेंस अनुरोधों को बंद ('Closed') करें।
> * **मुख्य समाधान:** **सबक्वेरी या JOIN के साथ परमाणु बैच UPDATE**:
>   1. **सबक्वेरी दृष्टिकोण**: `UPDATE Requests SET Status = 'Closed' WHERE AptID IN (SELECT AptID FROM Apartments WHERE BuildingID = 11)`;
>   2. **प्रत्यक्ष JOIN दृष्टिकोण**: `UPDATE Requests r SET Status = 'Closed' FROM Apartments a WHERE r.AptID = a.AptID AND a.BuildingID = 11`;
>   3. **लेनदेन सुरक्षा**: डेडलॉक से बचने के लिए इसे एक स्पष्ट डेटाबेस लेनदेन (`BEGIN TRANSACTION ... COMMIT`) में लपेटें।
> * **रियल-वर्ल्ड सिस्टम:** एंटरप्राइज ईआरपी और इंसिडेंट मैनेजमेंट सिस्टम में बल्क स्टेटस क्लोज़र।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या १४.३) में पूछा गया है:

*"इमारत संख्या ११ में स्थित सभी अपार्टमेंटों के रखरखाव अनुरोधों की स्थिति को 'Closed' पर अपडेट करने के लिए SQL क्वेरी लिखें।"*

```sql
-- रिलेशनल पदानुक्रम
Buildings (BuildingID=11) ──> Apartments (AptID) ──> Requests (RequestID, Status)
```

## २. विदेशी कुंजियों का पदानुक्रम

ग्रैंडपेरेंट टेबल (`Buildings`) के आधार पर चाइल्ड टेबल (`Requests`) को अपडेट करने के लिए मध्यवर्ती टेबल (`Apartments`) के माध्यम से फ़िल्टर किया जाता है।

## प्रोडक्शन कार्यान्वयन

```sql
-- मानक ANSI SQL दृष्टिकोण (लेनदेन के साथ)
BEGIN TRANSACTION;

UPDATE Requests
SET Status = 'Closed'
WHERE AptID IN (
    SELECT AptID
    FROM Apartments
    WHERE BuildingID = 11
)
AND Status <> 'Closed'; -- पहले से बंद अनुरोधों को छोड़ें

COMMIT;
```

```sql
-- PostgreSQL सिंटैक्स
UPDATE Requests r
SET Status = 'Closed'
FROM Apartments a
WHERE r.AptID = a.AptID
  AND a.BuildingID = 11
  AND r.Status <> 'Closed';
```

## निष्पादन योजना और लॉकिंग

| चरण | क्रिया | प्रयुक्त इंडेक्स | लॉक प्रकार |
|---|---|---|---|
| १. अपार्टमेंट खोजना | `BuildingID = 11` सीक | `IX_Apartments_BuildingID` | शेयर्ड लॉक (`S`) |
| २. अनुरोध लक्षित करना | `AptID` सीक | `IX_Requests_AptID` | इंटेंट एक्सक्लूसिव (`IX`) |
| ३. स्टेटस बदलना | रो म्यूटेशन और WAL राइट | क्लस्टर्ड प्राइमरी की | एक्सक्लूसिव रो लॉक (`X`) |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: बैच चंकिंग

१. **टेबल लॉक से बचाव:** लाखों पंक्तियों को एक साथ अपडेट करने से टेबल-स्तरीय लॉक लग सकता है। इसे १,००० पंक्तियों के छोटे बैचों में निष्पादित करें।
२. **WAL ओवरहेड नियंत्रण:** पहले से 'Closed' पंक्तियों को छोड़ना अनावश्यक डिस्क I/O को रोकता है।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **खुले अनुरोध न होना:** शून्य पंक्तियों के संशोधन के साथ सुरक्षित रूप से समाप्त।
