---
title: "एसक्यूएल विंडो फंक्शन जो याद रहें: रो_नंबर, रैंक, लैग और चल योग"
description: "एसक्यूएल विंडो फंक्शन की व्यावहारिक गाइड: पार्टीशन, रो_नंबर बनाम रैंक, लैग/लीड से अवधि अंतर, चल योग, और हर हफ्ते चाहिए वाला सीटीई फिल्टर पैटर्न।"
date: "2026-07-12"
tags: [बैकएंड और डेटाबेस]
coverImage: /assets/images/sql-window-functions-guide.webp
previewImage: /assets/images/sql-window-functions-guide.webp
---


आप जो ज्यादातर एनालिटिक्स एसक्यूएल लिखते हैं, वे वही पांच आकार हैं: हर कुंजी की आखिरी पंक्ति, हर समूह में शीर्ष एन, बराबरी वाला रैंक, पिछली अवधि से तुलना, और संचयी योग। विंडो फंक्शन ये आकार बिना ऐसे सेल्फ-जॉइन के हल करते हैं जो प्लानर को घुटनों पर ला दें।

यह पोस्ट वही मानसिक मॉडल है जो मैं रखता हूं, और वे क्वेरी जो असल काम में पेस्ट करता हूं। पोस्टग्रेस, बिगक्वेरी, स्नोफ्लेक और आधुनिक माईएसक्यूएल एक ही मूल सिंटैक्स चलाते हैं। बोलियां छोटी चीजों पर अलग हैं, विचार पर नहीं।

---

## एक विचार: विंडो उन पंक्तियों पर एक फ्रेम है जो पहले से हैं

सामान्य एग्रीगेट पंक्तियां गिरा देता है:

```sql
SELECT region, SUM(amount) AS total
FROM sales
GROUP BY region;
```

पंक्ति-स्तर का ब्यौरा चला जाता है। **विंडो फंक्शन** प्रति पंक्ति एग्रीगेट या रैंकिंग गिनता है, और हर पंक्ति लौटाता भी है:

```sql
SELECT
  region,
  order_id,
  amount,
  SUM(amount) OVER (PARTITION BY region) AS region_total
FROM sales;
```

हर ऑर्डर रहता है। साथ में क्षेत्र का कुल भी मिलता है। पूरा जादू यही है।

विंडो तय करने वाला खंड `OVER (...)` है। अंदर आमतौर पर तीन हिस्से मायने रखते हैं:

१. **`PARTITION BY`** - जब यह कुंजी बदले तो गणना फिर शुरू (नरम `GROUP BY` जैसा)।  
२. **`ORDER BY`** - हर पार्टीशन के अंदर पंक्ति क्रम (रैंक, लैग, चल योग के लिए जरूरी)।  
३. **फ्रेम** - मौजूदा पंक्ति के लिए कौन-सी पड़ोसी पंक्तियां गिनी जाएं (`ROWS BETWEEN ...`)। डिफ़ॉल्ट मायने रखते हैं; नीचे।

अगर एक वाक्य याद रखना हो: *पार्टीशन कहता है आप किससे मुकाबला कर रहे हैं, क्रम कहता है किस अनुक्रम में, फ्रेम कहता है कैलकुलेटर कितनी दूर देखे।*

---

## बाकी पोस्ट के लिए नमूना डेटा

```sql
CREATE TABLE orders (
  order_id   int PRIMARY KEY,
  customer_id int,
  region     text,
  order_date date,
  amount     numeric
);

INSERT INTO orders VALUES
  (1, 101, 'west',  '2025-11-01', 120),
  (2, 101, 'west',  '2025-11-15',  80),
  (3, 101, 'west',  '2025-12-01', 200),
  (4, 202, 'east',  '2025-11-03',  50),
  (5, 202, 'east',  '2025-11-20',  50),
  (6, 202, 'east',  '2025-12-10', 300),
  (7, 303, 'west',  '2025-11-08',  90),
  (8, 303, 'west',  '2025-12-05', 110);
```

जानबूझकर छोटा। परिणाम एक बार जोर से पढ़ो, फंक्शन जादुई लगना बंद हो जाते हैं।

---

## रो_नंबर: बराबरी होने पर एक पंक्ति चुनो

`ROW_NUMBER()` पार्टीशन के अंदर अनोखा क्रम देता है। `ORDER BY` में बराबरी पर भी अलग संख्याएं मिलती हैं। "बिल्कुल एक विजेता" के लिए यही चाहिए।

**पैटर्न: हर ग्राहक का नवीनतम ऑर्डर**

```sql
WITH ranked AS (
  SELECT
    order_id,
    customer_id,
    order_date,
    amount,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id
      ORDER BY order_date DESC, order_id DESC
    ) AS rn
  FROM orders
)
SELECT order_id, customer_id, order_date, amount
FROM ranked
WHERE rn = 1;
```

| ऑर्डर_आईडी | ग्राहक_आईडी | ऑर्डर_तारीख | राशि |
| ---: | ---: | --- | ---: |
| ३ | १०१ | २०२५-१२-०१ | २०० |
| ६ | २०२ | २०२५-१२-१० | ३०० |
| ८ | ३०३ | २०२५-१२-०५ | ११० |

बाद में दर्द बचाने वाले नोट:

* हमेशा **टाई-ब्रेकर** डालो (यहां `order_id DESC`)। बिना इसके दो तारीखें मिलें तो `rn = १` कौन-सी पंक्ति है, तय नहीं।  
* विंडो परिणाम पर फिल्टर **सीटीई या सबक्वेरी** में लगाओ। `WHERE ROW_NUMBER() ...` मानक एसक्यूएल में अवैध है क्योंकि `WHERE` विंडो से पहले चलता है।  
* वही पैटर्न "हर उपयोगकर्ता की पहली घटना," "वर्तमान सदस्यता पंक्ति," "हर सेवा का आखिरी डिप्लॉय" के लिए।

---

## रैंक और डेंस_रैंक: जब बराबरी एक जगह साझा करे

`ROW_NUMBER` अनोखा है। `RANK` और `DENSE_RANK` बराबरी देते हैं।

```sql
SELECT
  region,
  order_id,
  amount,
  RANK()       OVER (PARTITION BY region ORDER BY amount DESC) AS rnk,
  DENSE_RANK() OVER (PARTITION BY region ORDER BY amount DESC) AS dense_rnk,
  ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC, order_id) AS rn
FROM orders
ORDER BY region, amount DESC, order_id;
```

`east` के लिए राशियां ३००, ५०, ५०:

| राशि | रैंक | डेंस_रैंक | रो_नंबर |
| ---: | ---: | ---: | ---: |
| ३०० | १ | १ | १ |
| ५० | २ | २ | २ |
| ५० | २ | २ | ३ |

फिर अगला अलग मान:

* **रैंक**: ४ पर कूदता है (२ पर दोहरी बराबरी के बाद जगह छोड़ता है)  
* **डेंस_रैंक**: ३ पर जाता है (खाली जगह नहीं)  
* **रो_नंबर**: बराबरी देखे बिना पहले ही १, २, ३ इस्तेमाल कर चुका

कब क्या:

| जरूरत | फंक्शन |
| --- | --- |
| हर समूह एक पंक्ति, परिणाम में बराबरी नहीं | `ROW_NUMBER` + फिल्टर `rn = 1` |
| लीडरबोर्ड जहां बराबरी के बाद जगह छूटे | `RANK` |
| लीडरबोर्ड बिना जगह खाली | `DENSE_RANK` |
| शीर्ष ३ *राशियां*, भले तीन से ज्यादा पंक्तियां बराबर हों | फिल्टर `DENSE_RANK() <= 3` |

**पैटर्न: हर क्षेत्र में राशि के अनुसार शीर्ष २ ऑर्डर**

```sql
WITH ranked AS (
  SELECT
    *,
    DENSE_RANK() OVER (
      PARTITION BY region
      ORDER BY amount DESC
    ) AS place
  FROM orders
)
SELECT region, order_id, amount, place
FROM ranked
WHERE place <= 2
ORDER BY region, place, order_id;
```

---

## लैग और लीड: बिना सेल्फ-जॉइन पिछला और अगला

`LAG(expr, n)` पार्टीशन में (`ORDER BY` के बाद) **n पंक्तियां पीछे** देखता है। `LEAD` आगे देखता है। डिफ़ॉल्ट `n` १ है।

**पैटर्न: हर ग्राहक के लिए अवधि-दर-अवधि बदलाव**

```sql
SELECT
  customer_id,
  order_date,
  amount,
  LAG(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
  ) AS prev_amount,
  amount - LAG(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
  ) AS delta,
  ROUND(
    100.0 * (amount - LAG(amount) OVER (
      PARTITION BY customer_id
      ORDER BY order_date
    ))
    / NULLIF(LAG(amount) OVER (
      PARTITION BY customer_id
      ORDER BY order_date
    ), 0),
    1
  ) AS pct_change
FROM orders
ORDER BY customer_id, order_date;
```

ग्राहक १०१ के लिए:

| ऑर्डर_तारीख | राशि | पिछली_राशि | अंतर | प्रतिशत_बदलाव |
| --- | ---: | ---: | ---: | ---: |
| २०२५-११-०१ | १२० | रिक्त | रिक्त | रिक्त |
| २०२५-११-१५ | ८० | १२० | -४० | -३३.३ |
| २०२५-१२-०१ | २०० | ८० | १२० | १५०.० |

पहली पंक्ति का पिछला मान नहीं, इसलिए `LAG` `NULL` देता है। यह अपेक्षित है। अगर `NULL` की जगह डिफ़ॉल्ट चाहिए तो `LAG(amount, 1, 0)` (पोस्टग्रेस और कई इंजन तीसरा आर्ग्युमेंट देते हैं)।

**पैटर्न: पिछले ऑर्डर से कितने दिन**

```sql
SELECT
  customer_id,
  order_date,
  order_date - LAG(order_date) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
  ) AS days_since_prev
FROM orders;
```

पोस्टग्रेस पर तारीख घटाने से पूर्णांक दिन मिलते हैं। और जगह `DATEDIFF` या `DATE_DIFF` लग सकता है।

---

## चल योग: क्रम वाले फ्रेम के साथ सम

क्लासिक "बैंक बैलेंस" या "वर्ष-से-आज राजस्व" क्वेरी।

```sql
SELECT
  customer_id,
  order_date,
  amount,
  SUM(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date, order_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM orders
ORDER BY customer_id, order_date;
```

ग्राहक १०१:

| ऑर्डर_तारीख | राशि | चल_योग |
| --- | ---: | ---: |
| २०२५-११-०१ | १२० | १२० |
| २०२५-११-१५ | ८० | २०० |
| २०२५-१२-०१ | २०० | ४०० |

### फ्रेम क्यों लिखें

`ORDER BY` के साथ `SUM` / `AVG` / `COUNT` पर इंजन अक्सर **रेंज** फ्रेम डिफ़ॉल्ट रखते हैं: पार्टीशन की शुरुआत से मौजूदा पीयर समूह (एक ही क्रम कुंजी) तक। अगर दो पंक्तियों की `order_date` एक हो, दोनों एक-दूसरे की राशि "चल" योग में जोड़ सकती हैं। लोग हैरान होते हैं।

`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` भौतिक पंक्ति क्रम है: हर पंक्ति अपने को एक बार जोड़ती है, उसी क्रम में जो आपने दिया। सच्चे चल योग के लिए `ROWS` चुनो। क्रम स्थिर रखने के लिए अनोखा `ORDER BY` रखो (`order_id` जोड़ो)।

**चल औसत (आखिरी ३ ऑर्डर):**

```sql
SELECT
  customer_id,
  order_date,
  amount,
  AVG(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date, order_id
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS avg_last_3
FROM orders
ORDER BY customer_id, order_date;
```

शुरुआती पंक्तियों में तीन से कम अवलोकन होते हैं। ठीक है; औसत फ्रेम में जो है उसी पर।

---

## सिर्फ पार्टीशन: बिना जॉइन कुल में हिस्सा

हर बार `ORDER BY` जरूरी नहीं।

```sql
SELECT
  region,
  order_id,
  amount,
  SUM(amount) OVER (PARTITION BY region) AS region_total,
  ROUND(
    100.0 * amount / SUM(amount) OVER (PARTITION BY region),
    1
  ) AS pct_of_region
FROM orders
ORDER BY region, order_id;
```

जब हरू पूरे परिणाम सेट का हो तो `amount / SUM(amount) OVER ()` (खाली `OVER()`)।

---

## फर्स्ट_वैल्यू और एनथ_वैल्यू: आधार रेखा बांधना

**पैटर्न: हर पंक्ति बनाम ग्राहक के पहले ऑर्डर की राशि**

```sql
SELECT
  customer_id,
  order_date,
  amount,
  FIRST_VALUE(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date, order_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS first_order_amount,
  amount - FIRST_VALUE(amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date, order_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS vs_first
FROM orders
ORDER BY customer_id, order_date;
```

कुछ इंजनों में चौड़ा फ्रेम चाहिए ताकि `FIRST_VALUE` पार्टीशन की असली पहली पंक्ति पर टिका रहे। अगर मान गलत पंक्ति से "चिपक" जाए तो अपनी बोली का दस्तावेज देखें।

---

## निष्पादन क्रम: सीटीई फिल्टर पैटर्न क्यों है

`SELECT` का मोटा तार्किक क्रम:

१. `FROM` / `JOIN`  
२. `WHERE`  
३. `GROUP BY` / एग्रीगेट  
४. `HAVING`  
५. **विंडो फंक्शन**  
६. `SELECT` सूची  
७. `DISTINCT`  
८. `ORDER BY`  
९. `LIMIT` / `OFFSET`

विंडो **`WHERE` और `GROUP BY` के बाद** चलती हैं। इसलिए यह नहीं लिख सकते:

```sql
-- invalid
SELECT *
FROM orders
WHERE ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) = 1;
```

पहले लपेटो, फिर फिल्टर। अगर वेयरहाउस `QUALIFY` देता हो (बिगक्वेरी, स्नोफ्लेक) तो वही चीज:

```sql
-- BigQuery / Snowflake style
SELECT *
FROM orders
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY customer_id
  ORDER BY order_date DESC, order_id DESC
) = 1;
```

`QUALIFY` सीटीई पैटर्न पर चीनी है। इंजन दे तो इस्तेमाल करो; बाकी जगह सीटीई।

---

## आम गलतियां (और ठीक)

**१. रैंकिंग फंक्शन पर `ORDER BY` गायब**  
`ROW_NUMBER() OVER (PARTITION BY customer_id)` का क्रम परिभाषित नहीं। हमेशा साफ क्रम दो।

**२. विंडो वाली ही परत में शीर्ष एन फिल्टर**  
सीटीई / सबक्वेरी / `QUALIFY`।

**३. चल योग पर रेंज डिफ़ॉल्ट**  
`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` और अनोखा क्रम पसंद करो।

**४. गलत पार्टीशन अनाज**  
"हर ग्राहक का नवीनतम" है `PARTITION BY customer_id`। "हर ग्राहक हर क्षेत्र" दोनों कुंजी मांगता है। गलत अनाज "लगभग सही" डैशबोर्ड बनाता है जो ऑडिट में टूटते हैं।

**५. जहां सादा एग्रीगेट काफी हो वहां विंडो**  
अगर सिर्फ क्षेत्र का एक कुल चाहिए और पंक्ति ब्यौरा नहीं, `GROUP BY` सरल और अक्सर सस्ता। विंडो तब चमकती है जब **पंक्ति ब्यौरा साथ** समूह संदर्भ चाहिए।

**६. इंडेक्स और सॉर्ट लागत**  
विंडो अक्सर हर पार्टीशन पर सॉर्ट मजबूर करती हैं। बड़ी तालिकाओं पर `PARTITION BY` + `ORDER BY` से मेल खाते इंडेक्स प्लानर की मदद करते हैं, और भारी फिल्टर विंडो से पहले वाले सीटीई में धकेलो ताकि पार्टीशन छोटे रहें।

---

## छोटी चीटशीट

```sql
-- हर कुंजी की आखिरी पंक्ति
ROW_NUMBER() OVER (PARTITION BY key ORDER BY ts DESC, id DESC)

-- बराबरी वाला लीडरबोर्ड (बिना खाली जगह)
DENSE_RANK() OVER (PARTITION BY key ORDER BY score DESC)

-- पिछला मान
LAG(col)  OVER (PARTITION BY key ORDER BY ts)
LEAD(col) OVER (PARTITION BY key ORDER BY ts)

-- चल योग
SUM(col) OVER (
  PARTITION BY key
  ORDER BY ts, id
  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
)

-- समूह में हिस्सा
col * 1.0 / SUM(col) OVER (PARTITION BY key)

-- हर पंक्ति पर पूरे सेट का कुल
SUM(col) OVER ()
```

---

## एक पूरा "एनालिटिक्स एक-पेज" क्वेरी

ग्राहक गतिविधि दृश्य के लिए कई टुकड़े एक साथ:

```sql
WITH base AS (
  SELECT
    customer_id,
    order_id,
    order_date,
    amount,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id
      ORDER BY order_date DESC, order_id DESC
    ) AS recency_rn,
    LAG(order_date) OVER (
      PARTITION BY customer_id
      ORDER BY order_date, order_id
    ) AS prev_order_date,
    SUM(amount) OVER (
      PARTITION BY customer_id
      ORDER BY order_date, order_id
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS lifetime_to_date,
    SUM(amount) OVER (PARTITION BY customer_id) AS lifetime_total
  FROM orders
)
SELECT
  customer_id,
  order_id,
  order_date,
  amount,
  prev_order_date,
  order_date - prev_order_date AS days_since_prev,
  lifetime_to_date,
  lifetime_total,
  recency_rn = 1 AS is_latest_order
FROM base
ORDER BY customer_id, order_date;
```

एक पास ढेर सारी सहसंबंधित सबक्वेरी बदल देता है। ऊपर से नीचे पढ़ो: विंडो एक बार परिभाषित, फ्लैग और अंतर प्रोजेक्ट, काम खत्म।

---

## आगे क्या अभ्यास करें

१. तीन रिपोर्ट जो पहले से भेजते हो, सिर्फ विंडो से फिर बनाओ (आखिरी पंक्ति, शीर्ष एन, महीने-दर-महीना अंतर)।  
२. जानबूझकर बराबरी बनाओ और `ROW_NUMBER`, `RANK`, `DENSE_RANK` साथ छापो जब तक जगह छोड़ने का व्यवहार उबाऊ न लगे।  
३. एक ही दिन की पंक्तियों से चल योग तोड़ो, फिर `ROWS` और अनोखे `ORDER BY` से ठीक करो।

जब ये तीन अपने आप लगें, बाकी कैटलॉग (`NTILE`, `CUME_DIST`, नामित `WINDOW` खंड) उसी मॉडल पर शब्दावली है: पार्टीशन, क्रम, फ्रेम।

