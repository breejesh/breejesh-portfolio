---
title: "पोस्टग्रेस इंडेक्स जो वाकई मायने रखते हैं: बी-ट्री, आंशिक, मिश्रित, कवरिंग"
description: "कौन से पोस्टग्रेस इंडेक्स विलंब घटाते हैं: बी-ट्री डिफ़ॉल्ट, आंशिक फ़िल्टर, मिश्रित स्तंभ क्रम, कवरिंग इंक्लूड, और कब इंडेक्स नुकसान करते हैं।"
date: "2026-07-16"
tags: [बैकएंड और डेटाबेस]
coverImage: /assets/images/postgres-indexes-that-matter.webp
previewImage: /assets/images/postgres-indexes-that-matter.webp
---


इंडेक्स सबसे सस्ता प्रदर्शन औजार हैं जिन्हें टीमें अब भी गलत इस्तेमाल करती हैं। दस जोड़ दो तो लेखन रेंगता है। सही वाला छोड़ दो तो साप्ताहिक रिपोर्ट प्राथमिक सर्वर को मिनटों लॉक कर देती है। पोस्टग्रेस खराब आकार से नहीं बचाता। अच्छा आकार इनाम देता है।

यह पोस्ट वही छोटी सूची है जो असल ऐप पर काम आती है: डिफ़ॉल्ट बी-ट्री, गरम प्रेडिकेट के लिए आंशिक इंडेक्स, मिश्रित स्तंभ क्रम, `INCLUDE` वाला कवरिंग, और वे मामले जहाँ इंडेक्स चीज़ें बिगाड़ देता है। हर एक्सेस विधि की सूची नहीं। सिर्फ वे जो `EXPLAIN (ANALYZE, BUFFERS)` में बार-बार दिखते हैं।

---

## मानसिक मॉडल: हीप के कम पेज छुओ

अनुक्रमिक स्कैन पूरी तालिका पढ़ता है। इंडेक्स स्कैन छोटी संरचना पर चलता है, फिर (अक्सर) मेल खाती हीप पंक्तियाँ लाता है। फायदा है **वे पंक्तियाँ जिन्हें तुम छूते ही नहीं, उन पर आई/ओ और सीपीयू**।

उत्पादन में काम आने वाले मोटे नियम:

* चयनात्मक स्तंभ पर समानता और सीमा: बी-ट्री डिफ़ॉल्ट है, और अच्छा है।
* कम चयनात्मकता (`status = 'active'` नब्बे प्रतिशत पंक्तियों पर): प्लानर इंडेक्स छोड़कर हीप स्कैन कर सकता है। अक्सर सही होता है।
* इंडेक्स की कीमत हर उस `INSERT`, `UPDATE`, `DELETE` पर लगती है जो इंडेक्स किए स्तंभ छूए।
* फूले या बेकार इंडेक्स भी वाल, वैक्यूम और कैश खाते हैं।

एक वाक्य याद रखना हो: *उस क्वेरी आकार के लिए इंडेक्स बनाओ जो अक्सर चलती है, हर `WHERE` स्तंभ के लिए नहीं।*

---

## नमूना स्कीमा

```sql
CREATE TABLE orders (
  id           bigserial PRIMARY KEY,
  customer_id  bigint NOT NULL,
  status       text NOT NULL,          -- 'pending', 'paid', 'shipped', 'cancelled'
  region       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  total_cents  integer NOT NULL,
  metadata     jsonb
);

-- Assume millions of rows, heavy reads on recent paid orders by customer.
```

प्राथमिक कुंजी और यूनिक बाधाएँ पहले से बी-ट्री बनाती हैं। और गढ़ने से पहले वहीं से शुरू करो।

---

## बी-ट्री: डिफ़ॉल्ट जो अक्सर जीतता है

बिना `USING` के `CREATE INDEX` **बी-ट्री** बनाता है। अग्रणी स्तंभ(ों) पर `=`, `<`, `<=`, `>`, `>=`, `BETWEEN`, और `IN` चलते हैं। इंडेक्स क्रम से मेल खाता `ORDER BY` भी चलता है, जिससे सॉर्ट बचता है।

```sql
CREATE INDEX orders_customer_created_idx
  ON orders (customer_id, created_at DESC);
```

साफ़ इस्तेमाल वाली क्वेरी:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total_cents, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

चाहिए `Index Scan using orders_customer_created_idx` जैसा कुछ (बड़े सेट पर बिटमैप इंडेक्स स्कैन भी), अनुक्रमिक स्कैन प्लस सॉर्ट नहीं।

**जाल:**

* अग्रणी स्तंभ पहले। सिर्फ `created_at` वाला फ़िल्टर इस इंडेक्स का अच्छा उपयोग नहीं करेगा (या बिल्कुल नहीं)।
* स्तंभ पर फंक्शन मैच तोड़ देते हैं, जब तक तुम व्यंजक पर इंडेक्स न बनाओ:

```sql
-- Bad for a plain index on email
WHERE lower(email) = 'a@b.com'

-- Index the expression you filter on
CREATE INDEX users_email_lower_idx ON users (lower(email));
```

* `LIKE 'foo%'` पाठ बी-ट्री इस्तेमाल कर सकता है। `LIKE '%foo%'` नहीं। उप-स्ट्रिंग खोज के लिए `pg_trgm` (या अलग डिज़ाइन) चाहिए।

बी-ट्री अजीब नहीं। यही मुख्य घोड़ा है। जिन या ब्रिन के पीछे भागने से पहले स्तंभ क्रम और चयनात्मकता ठीक करो।

---

## आंशिक इंडेक्स: सिर्फ वे पंक्तियाँ जो क्वेरी होती हैं

आंशिक इंडेक्स सिर्फ `WHERE` से मेल खाती पंक्तियों की प्रविष्टियाँ रखता है। छोटा इंडेक्स, बाकी तालिका पर सस्ते अपडेट, और "गरम उपसमुच्चय" क्वेरी के लिए सटीक फिट।

```sql
-- Only open work needs fast lookup
CREATE INDEX orders_pending_region_idx
  ON orders (region, created_at)
  WHERE status = 'pending';
```

```sql
SELECT id, customer_id, created_at
FROM orders
WHERE status = 'pending'
  AND region = 'eu-west'
ORDER BY created_at
LIMIT 50;
```

पोस्टग्रेस आंशिक इंडेक्स तब इस्तेमाल कर सकता है जब क्वेरी का प्रेडिकेट इंडेक्स प्रेडिकेट को **निहित** करे। क्वेरी से `status = 'pending'` हटाओ तो यह इंडेक्स बाहर।

**अच्छे आंशिक उम्मीदवार:**

* सॉफ्ट-डिलीट तालिकाएँ: `WHERE deleted_at IS NULL`
* कतार / आउटबॉक्स पंक्तियाँ: `WHERE processed_at IS NULL`
* बहु-किरायेदार सक्रिय झंडे, वे गैर-नल विदेशी कुंजी जिन पर हमेशा फ़िल्टर है
* दुर्लभ स्थिति मान जो ऑपरेशनल डैशबोर्ड चलाते हैं

**खराब आंशिक उम्मीदवार:**

* हर क्वेरी बदलने वाले प्रेडिकेट (`created_at > now() - interval '1 day'` स्थिर आंशिक के रूप में अजीब है जब तक डिज़ाइन न बदलो)
* लगभग पूरी तालिका से मेल फ़िल्टर (इंडेक्स सिकुड़ता ही नहीं)

आंशिक इंडेक्स उपसमुच्चय पर अनोखापन भी देते हैं:

```sql
CREATE UNIQUE INDEX users_active_email_uidx
  ON users (email)
  WHERE deleted_at IS NULL;
```

कई सॉफ्ट-डिलीट पंक्तियाँ एक ईमेल साझा कर सकती हैं। जीवित सिर्फ एक।

---

## मिश्रित इंडेक्स: स्तंभ क्रम ही उत्पाद है

`(a, b, c)` और `(b, a, c)` एक नहीं। बी-ट्री मिश्रित बाएँ से दाएँ क्रमबद्ध है। इसे नेस्टेड सॉर्ट कुंजियाँ समझो।

**बायाँ-उपसर्ग नियम (व्यावहारिक रूप):**

| क्वेरी फ़िल्टर | इंडेक्स `(customer_id, status, created_at)` |
| --- | --- |
| `customer_id = ?` | हाँ |
| `customer_id = ? AND status = ?` | हाँ |
| `customer_id = ? AND status = ? ORDER BY created_at` | हाँ |
| सिर्फ `status = ?` | नहीं (गलत अग्रणी स्तंभ) |
| सिर्फ `created_at > ?` | नहीं |

पहले समानता, फिर सीमा, फिर सॉर्ट कुंजी, आम पैटर्न है:

```sql
-- Filter equality, then range on time
CREATE INDEX orders_status_created_idx
  ON orders (status, created_at);
```

```sql
SELECT id, customer_id
FROM orders
WHERE status = 'paid'
  AND created_at >= '2026-01-01'
  AND created_at <  '2026-02-01';
```

`created_at` पहले रखोगे तो अकेले `status` की समानता कमजोर। अगर लगभग हर क्वेरी "ग्राहक, फिर समय" है तो `customer_id` पहले।

**बहु-स्तंभ अनोखापन** वही संरचना:

```sql
CREATE UNIQUE INDEX orders_idempotency_uidx
  ON orders (customer_id, idempotency_key);
```

दोनों `(a, b)` और `(a)` मत बनाओ जब तक मापकर जरूरत न दिखे। लंबा इंडेक्स अक्सर छोटा उपसर्ग भी चलाता है। अतिरिक्त इंडेक्स शुद्ध लेखन लागत हैं।

---

## कवरिंग इंडेक्स: जवाब सिर्फ इंडेक्स से

सामान्य इंडेक्स खोज गैर-इंडेक्स स्तंभों के लिए हीप पर जाती है। **कवरिंग** (या इंडेक्स-ओनली) स्कैन तब इंडेक्स से पंक्ति लौटाता है जब जरूरी हर स्तंभ मौजूद हो और विजिबिलिटी मैप कहे पेज पूरी तरह दृश्य है।

पोस्टग्रेस ११+ गैर-कुंजी स्तंभ `INCLUDE` से जोड़ने देता है। वे पत्ती में रहते हैं, सॉर्ट क्रम या यूनिक जाँच का हिस्सा नहीं:

```sql
CREATE INDEX orders_customer_covering_idx
  ON orders (customer_id, created_at DESC)
  INCLUDE (total_cents, status);
```

```sql
SELECT total_cents, status, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

गरम कैश और अच्छी वैक्यूम वाली तालिका पर `EXPLAIN` में `Index Only Scan` दिख सकता है। यही इनाम: कम हीप हिट।

**कवरिंग कब मदद करता है:**

* गरम पठन पथ जो हमेशा वही कुछ स्तंभ चुनते हैं
* सूची एंडपॉइंट (`id`, `status`, `created_at`) प्रति मिनट हजारों बार

**कब छोड़ो:**

* चौड़ी `INCLUDE` सूची जो हीप जीत से ज्यादा इंडेक्स फुला दे
* लगातार अपडेट होने वाले स्तंभ (`status` हर सेकंड पलटे) कुंजी न बदले तब भी इंडेक्स अपडेट थोपते हैं
* `EXPLAIN (ANALYZE, BUFFERS)` से पुष्टि नहीं कि हीप फ़ेच अड़चन है

`INCLUDE` जादू नहीं। वैक्यूम विजिबिलिटी मैप ईमानदार रखे नहीं तो फिर हीप जाँच पर गिरोगे।

---

## कब इंडेक्स नुकसान करते हैं

इंडेक्स मुफ़्त नहीं। नुकसान अनुमानित तरीकों से होता है।

### १. लेखन विस्तार

हर इंडेक्स किए स्तंभ का बदलाव हर मेल खाते इंडेक्स को अपडेट करता है। दस द्वितीयक इंडेक्स के साथ बल्क लोड, लोड-फिर-इंडेक्स से कई गुना धीमा हो सकता है:

```sql
-- Load path for big migrations
ALTER TABLE orders DROP CONSTRAINT ...;  -- if needed
-- or: DROP INDEX concurrently on standbys carefully in prod

COPY orders FROM '...';

CREATE INDEX CONCURRENTLY orders_customer_created_idx
  ON orders (customer_id, created_at DESC);
```

उत्पादन में `CREATE INDEX CONCURRENTLY` (और `DROP INDEX CONCURRENTLY`) चुनो ताकि पूरी बिल्ड लेखन लॉक न करे। ज्यादा समय और संसाधन लगते हैं, पर साधारण `CREATE INDEX` जैसा डीएमएल ब्लॉक नहीं।

### २. कम चयनात्मकता वाले इंडेक्स जिन्हें प्लानर नज़रअंदाज़ करता है

```sql
CREATE INDEX orders_status_idx ON orders (status);
-- if 80% of rows are 'paid', this rarely helps WHERE status = 'paid'
```

रखरखाव की कीमत फिर भी लगती है। देखो:

```sql
SELECT indexrelid::regclass AS index,
       idx_scan,
       idx_tup_read,
       idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relid = 'orders'::regclass
ORDER BY idx_scan;
```

हफ्तों असल ट्रैफ़िक के बाद लगभग शून्य `idx_scan` छोड़ने का उम्मीदवार है (पहले पुष्टि करो कि रेप्लिका और एकमुश्त जॉब को जरूरत नहीं)।

### ३. गलत क्रम और अतिरिक्त ढेर

ओवरलैप उपसर्गों पर तीन इंडेक्स:

```sql
-- Often redundant
CREATE INDEX ON orders (customer_id);
CREATE INDEX ON orders (customer_id, status);
CREATE INDEX ON orders (customer_id, status, created_at);
```

असली क्वेरी से मेल वाला रखो। हटाने से पहले मापो; कुछ ओआरएम अजीब आकार बनाते हैं।

### ४. यादृच्छिक लेखन और कैश दबाव

विशाल इंडेक्स `shared_buffers` के लिए हीप से मुकाबला करते हैं। वर्किंग सेट फिट न रहे तो अनुक्रमिक हीप पठन की जगह यादृच्छिक इंडेक्स+हीप आई/ओ मिलता है। ठंडी मध्यम तालिका पर अनुक्रमिक स्कैन, नेस्टेड लूप यादृच्छिक लुकअप से जीत सकता है।

### ५. जेएसओएनबी और व्यंजक पर ज्यादा इंडेक्स

हर `jsonb` स्तंभ पर "बस केस में" जिन लेखन मारक क्लासिक है। फ़िल्टर वाले पथ पर इंडेक्स लगाओ:

```sql
CREATE INDEX orders_meta_provider_idx
  ON orders ((metadata->>'provider'));
```

या जब सिर्फ कुछ पंक्तियाँ मायने रखें तो आंशिक + व्यंजक।

---

## इंडेक्स जोड़ने से पहले व्यावहारिक जाँच सूची

१. धीमी क्वेरी `EXPLAIN (ANALYZE, BUFFERS)` से पकड़ो (स्टेजिंग में `auto_explain` संभव हो तो)।  
२. फ़िल्टर स्तंभ, जॉइन कुंजी, और `ORDER BY` / `LIMIT` आकार नाम लिखो।  
३. कई एकल-स्तंभ इंडेक्स की जगह एक मिश्रित (और वैकल्पिक `INCLUDE`) चुनो।  
४. स्थिर प्रेडिकेट छोटा गरम सेट परिभाषित करे तो आंशिक इंडेक्स।  
५. लाइव सिस्टम पर `CONCURRENTLY` से बनाओ।  
६. डिप्लॉय के बाद प्लान फिर देखो। कुछ दिन `pg_stat_user_indexes` और लेखन विलंब देखो।  
७. जो कभी स्कैन न हो उसे हटाओ। जो रखे, माइग्रेशन में एक पंक्ति टिप्पणी से क्यों रखे लिखो।

```sql
-- Migration comment example:
-- Serves GET /v1/customers/:id/orders?limit=20 (customer_id + created_at DESC)
CREATE INDEX CONCURRENTLY orders_customer_created_idx
  ON orders (customer_id, created_at DESC);
```

---

## आगे क्या सीखें (यहाँ नहीं)

* **ब्रिन** विशाल ऐपेंड-ओनली समय श्रृंखला और सहसंबद्ध भौतिक क्रम के लिए  
* **जिन** पूर्ण-पाठ, ऐरे, और जेएसओएनबी कंटेनमेंट के लिए  
* **हैश** इंडेक्स (सिर्फ समानता पर बी-ट्री के मुकाबले सीमित उपयोग)  
* **एक्सटेंशन इंडेक्स** (`pg_trgm`, पोस्टजिस)

जब बी-ट्री और आंशिक/कवरिंग फिट न हों तब ये सही औजार हैं। ज्यादातर ओएलटीपी दर्द ऊपर के पैटर्न से खत्म होता है।

---

## निचली पंक्ति

फ़िल्टर और सॉर्ट वाली कुंजियों पर बी-ट्री से शुरू करो। समानता बाएँ, सीमा और सॉर्ट बाद में। जब सिर्फ उपसमुच्चय चाहिए तो आंशिक से सिकोड़ो। गरम सूची पठन पर बफ़र में हीप फ़ेच दिखें तो `INCLUDE` से कवर करो। कभी स्कैन न होने वाले हटाओ, और जब एक मिश्रित क्वेरी से मेल खाए तो पाँच एकल-स्तंभ मत जोड़ो।

अगर बदलाव यथार्थ डेटा पर `EXPLAIN (ANALYZE, BUFFERS)` में न दिखे, वह अभी इंडेक्स जीत नहीं। अनुमान है।

