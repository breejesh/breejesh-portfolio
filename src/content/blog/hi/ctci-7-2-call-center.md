---
title: "कॉल सेंटर: रैंक, एस्केलेशन, और डिस्पैचकॉल (जावा)"
description: "शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.२: रेस्पॉन्डेंट, मैनेजर, और डायरेक्टर। हर कॉल को सबसे निचले मुक्त रैंक पर भेजो जो संभाल सके, ज़रूरत पर ऊपर बढ़ाओ, और डिस्पैचकॉल लागू करो।"
date: "2025-09-26"
tags: [एल्गोरिदम]
coverImage: /assets/images/ctci-7-2-call-center.webp
previewImage: /assets/images/ctci-7-2-call-center.webp
---


> **टीएल;डीआर**
> * **समस्या:** डेटा संरचनाओं और एल्गोरिदम के लिए समय और स्थान जटिलता (टाइम एंड स्पेस कॉम्प्लेक्सिटी) का अनुकूलन।
> * **दृष्टिकोण:** शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.२: रेस्पॉन्डेंट, मैनेजर, और डायरेक्टर। हर कॉल को सबसे निचले मुक्त रैंक पर भेजो जो संभाल सके, ज़रूरत पर ऊपर बढ़ाओ, और डिस्पैचकॉल लागू करो।
> * **जटिलता:** सीमांत मामलों (एज केसेस) के प्रबंधन के साथ इष्टतम समय और मेमोरी संतुलन।

कॉल सामने डेस्क पर आती है। पहले किसी मुक्त **रेस्पॉन्डेंट** के पास जानी चाहिए। अगर वह व्यक्ति खत्म नहीं कर पाए, कॉल **मैनेजर** तक चढ़े। अगर मैनेजर भी न ले सकें, **डायरेक्टर** तक जाए। व्यस्त लोग निचले रैंक के मुक्त लोगों का काम न छीनें। पूरा डिज़ाइन यही है: रैंक, मुक्त सूचियाँ, और एक विधि जो काम बाँटे।

यह पोस्ट **जावा** में बिल्कुल शुरुआती लोगों के लिए मूल शिक्षण है। इंटरव्यू वाली ऑब्जेक्ट-ओरिएंटेड डिज़ाइन का परिवार, किताब की नकल नहीं। [सीटीसीआई जावा सीरीज़](/blog/hi/ctci-series-guide) का हिस्सा। अध्याय ७, ऑब्जेक्ट-ओरिएंटेड डिज़ाइन, समस्या ७.२।

---

## १. रोज़मर्रा की उपमा

तीन मंज़िल का हेल्प डेस्क सोचो:

* मंज़िल १: कई रेस्पॉन्डेंट हेडसेट के साथ। ज़्यादातर पासवर्ड रीसेट और "लॉग इन कैसे करें" यहीं खत्म।
* मंज़िल २: कुछ मैनेजर। बिलिंग विवाद, नीति अपवाद, वे गुस्सैल ग्राहक जिन्होंने मंज़िल १ आज़मा ली।
* मंज़िल ३: एक-दो डायरेक्टर। दुर्लभ कानूनी या आउटेज वाली कॉल।

कॉल मंज़िल १ से शुरू होती है, जब तक तुम्हें पहले से पता न हो कि ऊँचा रैंक चाहिए। अगर मंज़िल १ भरी है, कॉल इंतज़ार करे या तभी ऊपर जाओ जब समस्या सच में मांग करे। एस्केलेशन "सीधे बॉस के पास कूदना" नहीं। "यह मंज़िल खत्म नहीं कर सकती, ऊपर वाली आज़माओ" है।

इंटरव्यू में काम फोन ऑडियो सिमुलेट करना नहीं। प्रकार नाम देना, रैंक के हिसाब से मुक्त कर्मचारी रखना, और `dispatchCall` लिखना है ताकि सही मुक्त व्यक्ति अगली कॉल ले।

---

## २. समस्या सादे शब्दों में

**लक्ष्य:** तीन कर्मचारी रैंक वाले कॉल सेंटर का क्लास डिज़ाइन, एस्केलेशन सहित कॉल रूटिंग।

**रैंक (निचला से ऊँचा):**

| रैंक | आम भूमिका |
| --- | --- |
| रेस्पॉन्डेंट | पहली पंक्ति; ज़्यादातर कॉल |
| मैनेजर | दूसरी पंक्ति; कठिन मुद्दे |
| डायरेक्टर | ऊपरी पंक्ति; दुर्लभ एस्केलेशन |

**मुख्य व्यवहार:**

* आने वाली कॉल उसके रैंक संभालने वाले मुक्त कर्मचारी को मिले (शुरुआत रेस्पॉन्डेंट, जब तक कॉल पहले से ऊँचा न माँगे)।
* अगर असाइन कर्मचारी हल न कर पाए, कॉल एक रैंक **ऊपर** जाए और फिर असाइन हो।
* अगर कोई मुक्त न ले सके, उस रैंक की प्रतीक्षा कतार में रखो (या कोई मुक्त होने तक रोकें)।
* कर्मचारी कॉल खत्म करे तो मुक्त हो और अगली प्रतीक्षा कॉल खींच सकता है।

**लागू करने की मुख्य विधि:**

```java
void dispatchCall(Call call);
```

उपयोगी और:

```java
void callCompleted(Employee emp);  // free the employee, assign next waiting call if any
void escalate(Call call);          // raise rank and dispatch again
```

**कोड से पहले स्पष्ट करो:**

* हर रैंक पर कितने लोग? (इंटरव्यू में स्थिर सूचियाँ ठीक।)
* क्या डायरेक्टर रेस्पॉन्डेंट-स्तर की कॉल ले सकता है अगर सभी रेस्पॉन्डेंट व्यस्त हों? (अक्सर हाँ: ऊँचा रैंक मुक्त हो तो निचला काम कवर कर सकता है।)
* सब व्यस्त हों तो? (रैंक के हिसाब से कतार; चुपचाप न गिराओ।)
* थ्रेड सुरक्षा? (पहले सिंगल-थ्रेड मॉडल; लॉक तभी जब पूछें।)

---

## ३. पहले सोचो

### लगभग हमेशा चाहिए प्रकार

१. **`Rank`** इनम: `RESPONDENT`, `MANAGER`, `DIRECTOR` तुलना और एस्केलेट के लिए पूर्णांक स्तर के साथ।
२. **`Call`**: किसने कॉल किया (वैकल्पिक स्ट्रिंग), अभी ज़रूरी रैंक, संभाल रहा कर्मचारी (या नल)।
३. **`Employee`**: अमूर्त आधार: नाम, रैंक, मुक्त/व्यस्त झंडा, वर्तमान कॉल। विधियाँ: `receiveCall`, `callCompleted`, `escalateAndReassign` (या समान)।
४. **`Respondent` / `Manager` / `Director`**: पतली उप-क्लास जो कन्स्ट्रक्टर में रैंक बाँधें।
५. **`CallCenter`** (या `CallHandler`): कर्मचारी सूचियाँ और प्रतीक्षा कतारें; `dispatchCall` लागू करे।

### एक सपाट कर्मचारी सूची क्यों नहीं?

सब पर स्कैन कर सकते हो: "मुक्त और रैंक काफी।" छोटे डेमो और पहले स्केच के लिए ठीक। इंटरव्यू अक्सर **रैंक के समूह में कर्मचारी** पसंद करते हैं ताकि डिस्पैच "रैंक आर, फिर आर+१, फिर आर+२" हो, बिना उन लोगों के जो इस कॉल के लिए बहुत जूनियर हैं।

### डिस्पैच नीति (हृदय)

कॉल को अभी रैंक `r` चाहिए:

१. रैंक `r` पर मुक्त कर्मचारी ढूँढो।
२. न मिले तो `r+1`, फिर `r+2` (ऊँचा रैंक निचला काम कवर कर सकता है)।
३. फिर भी न मिले तो वर्तमान रैंक पर कतार में डालो।
४. मिला तो व्यस्त करो, कॉल से जोड़ो, कर्मचारी से जोड़ो।

### एस्केलेशन नीति

कर्मचारी खत्म न कर पाए:

१. कर्मचारी को कॉल से काटो (मुक्त हो; एक कहानी चुनकर निभाओ)।
२. कॉल का ज़रूरी रैंक एक बढ़ाओ (रेस्पॉन्डेंट → मैनेजर → डायरेक्टर)।
३. पहले से डायरेक्टर और फिर भी अटकी हो तो डायरेक्टर पर छोड़ो या साफ़ फेल करो। नियम बोलो।
४. फिर `dispatchCall` बुलाओ ताकि ऊँचे रैंक का मुक्त व्यक्ति ले (या कतार में जाए)।

### इनहेरिटेंस बनाम कंपोज़िशन

`Employee` आधार और तीन उप-क्लास क्लासिक जवाब है। उप-क्लास लगभग नहीं बदलतीं: सिर्फ रैंक मान। ठीक है। पदानुक्रम का मतलब:

* `CallCenter` हर रैंक पर `List<Employee>` रख सकता है।
* बहुरूपता: हर कर्मचारी में `receiveCall` और `getRank`।

खाली उप-क्लास नापसंद हों तो एक `Employee` क्लास और `Rank` फ़ील्ड भी ईमानदार है। ज़ोर से बोलो। कई इंटरव्यूअर तीन नामित प्रकार अभी भी पसंद करते हैं क्योंकि समस्या ने उन्हें नाम दिया।

---

## ४. जावा समाधान

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

enum Rank {
    RESPONDENT(0),
    MANAGER(1),
    DIRECTOR(2);

    private final int value;

    Rank(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    public Rank next() {
        if (this == DIRECTOR) {
            return DIRECTOR; // already top
        }
        return Rank.values()[value + 1];
    }
}

class Call {
    private Rank rank;
    private final String callerId;
    private Employee handler;

    public Call(String callerId) {
        this.callerId = callerId;
        this.rank = Rank.RESPONDENT; // start at first line
    }

    public Call(String callerId, Rank minRank) {
        this.callerId = callerId;
        this.rank = minRank;
    }

    public Rank getRank() {
        return rank;
    }

    public void setRank(Rank rank) {
        this.rank = rank;
    }

    public void escalateRank() {
        this.rank = rank.next();
    }

    public String getCallerId() {
        return callerId;
    }

    public Employee getHandler() {
        return handler;
    }

    public void setHandler(Employee handler) {
        this.handler = handler;
    }
}

abstract class Employee {
    private final String name;
    private final Rank rank;
    private boolean free = true;
    private Call currentCall;
    protected CallCenter center;

    protected Employee(String name, Rank rank) {
        this.name = name;
        this.rank = rank;
    }

    public void setCallCenter(CallCenter center) {
        this.center = center;
    }

    public String getName() {
        return name;
    }

    public Rank getRank() {
        return rank;
    }

    public boolean isFree() {
        return free;
    }

    public void receiveCall(Call call) {
        free = false;
        currentCall = call;
        call.setHandler(this);
    }

    /** Employee finished work on this call successfully. */
    public void callCompleted() {
        if (currentCall != null) {
            currentCall.setHandler(null);
            currentCall = null;
        }
        free = true;
        // ask center to give me the next waiting call I can take
        if (center != null) {
            center.assignCall(this);
        }
    }

    /**
     * Cannot finish. Free self, raise call rank, redispatch.
     * Returns true if escalation happened.
     */
    public boolean escalateAndReassign() {
        if (currentCall == null) {
            return false;
        }
        Call call = currentCall;
        currentCall = null;
        free = true;
        call.setHandler(null);

        if (call.getRank() == Rank.DIRECTOR) {
            // nowhere higher; put back in director wait queue
            center.enqueueCall(call);
            center.assignCall(this);
            return false;
        }

        call.escalateRank();
        center.dispatchCall(call);
        center.assignCall(this); // this person may take another waiting call
        return true;
    }
}

class Respondent extends Employee {
    public Respondent(String name) {
        super(name, Rank.RESPONDENT);
    }
}

class Manager extends Employee {
    public Manager(String name) {
        super(name, Rank.MANAGER);
    }
}

class Director extends Employee {
    public Director(String name) {
        super(name, Rank.DIRECTOR);
    }
}

class CallCenter {
    // employees[0] = respondents, [1] = managers, [2] = directors
    private final List<List<Employee>> employees = new ArrayList<>();
    // wait queues per rank
    private final List<Queue<Call>> callQueues = new ArrayList<>();

    public CallCenter(int numRespondents, int numManagers, int numDirectors) {
        employees.add(new ArrayList<>());
        employees.add(new ArrayList<>());
        employees.add(new ArrayList<>());
        callQueues.add(new LinkedList<>());
        callQueues.add(new LinkedList<>());
        callQueues.add(new LinkedList<>());

        for (int i = 0; i < numRespondents; i++) {
            addEmployee(new Respondent("R" + i));
        }
        for (int i = 0; i < numManagers; i++) {
            addEmployee(new Manager("M" + i));
        }
        for (int i = 0; i < numDirectors; i++) {
            addEmployee(new Director("D" + i));
        }
    }

    private void addEmployee(Employee e) {
        e.setCallCenter(this);
        employees.get(e.getRank().getValue()).add(e);
    }

    /** Assign call to first free employee at call.rank or higher. */
    public void dispatchCall(Call call) {
        Employee emp = getCallHandler(call);
        if (emp != null) {
            emp.receiveCall(call);
        } else {
            enqueueCall(call);
        }
    }

    void enqueueCall(Call call) {
        callQueues.get(call.getRank().getValue()).offer(call);
    }

    /**
     * Free employee looks for a waiting call they can handle:
     * any queue at their rank or lower (they can cover junior work).
     */
    public void assignCall(Employee emp) {
        for (int r = emp.getRank().getValue(); r >= 0; r--) {
            Queue<Call> q = callQueues.get(r);
            if (!q.isEmpty()) {
                Call call = q.poll();
                emp.receiveCall(call);
                return;
            }
        }
    }

    /** First free employee with rank >= call.getRank(). */
    private Employee getCallHandler(Call call) {
        for (int r = call.getRank().getValue(); r <= Rank.DIRECTOR.getValue(); r++) {
            for (Employee e : employees.get(r)) {
                if (e.isFree()) {
                    return e;
                }
            }
        }
        return null;
    }
}
```

चलन:

| चरण | क्रिया | नतीजा |
| --- | --- | --- |
| १ | केंद्र: २ रेस्पॉन्डेंट, १ मैनेजर, १ डायरेक्टर | सब मुक्त |
| २ | `dispatchCall(Call("A"))` | आर० लेता है ए (रेस्पॉन्डेंट रैंक) |
| ३ | `dispatchCall(Call("B"))` | आर१ लेता है बी |
| ४ | `dispatchCall(Call("C"))` | मुक्त रेस्पॉन्डेंट नहीं; मैनेजर लेता है सी (ऊँचा निचला कवर) |
| ५ | आर० ए खत्म न कर पाए → एस्केलेट | ए मैनेजर रैंक; मैनेजर व्यस्त तो ए इंतज़ार या डायरेक्टर |
| ६ | आर० दूसरी कॉल के बाद `callCompleted` | आर० मुक्त; प्रतीक्षा रेस्पॉन्डेंट-स्तर कॉल खींच सकता है |

चरण ४ बदल सकते हो ताकि व्यस्त निचला रैंक कभी खुद मैनेजर पर न चढ़े, और सिर्फ कर्मचारी फेल होने पर एस्केलेट हो। दोनों नीतियाँ मान्य हैं अगर **नाम** दो। ऊपर वाला कोड "पहली पंक्ति भरी हो तो ऊँचे मुक्त रैंक निचला काम कवर करें" पसंद करता है: कई असली केंद्रों जैसा, और अगर मैनेजर खाली हो तो प्रतीक्षा कतार से बचाता है।

---

## ५. जटिलता तालिका

| ऑपरेशन | समय | नोट |
| --- | --- | --- |
| `dispatchCall` | ओ(ई) सबसे खराब | ज़रूरी रैंक से ऊपर मुक्त स्कैन; ई = स्टाफ़ (इंटरव्यू में छोटा) |
| `getCallHandler` | ओ(ई) | रैंक और लोगों पर नेस्टेड लूप |
| `enqueueCall` | ओ(१) | कतार पर ऑफ़र |
| `assignCall` | ओ(आर + १) | आर रैंक इंडेक्स; कर्मचारी रैंक से नीचे कतारें |
| `escalateAndReassign` | ओ(ई) | एस्केलेट फिर `dispatchCall` |

स्थान ओ(ई + डब्ल्यू) कर्मचारी प्लस प्रतीक्षा कॉल। इंटरव्यू में जटिलता बात प्रकार और स्वामित्व से पीछे: मुक्त झंडा किसका, प्रतीक्षा कतार किसकी, कॉल रैंक कौन बदलता है।

---

## ६. किनारे के मामले और आम गलतियाँ

इंटरव्यूअर ये छेड़ते हैं:

* **सब व्यस्त:** कॉल प्रतीक्षा कतार में जाए, गायब न हो।
* **कॉल पहले से मैनेजर माँगे:** रेस्पॉन्डेंट से शुरू न करो; `Call` का रैंक मानो।
* **डायरेक्टर पर एस्केलेट:** ऊपर और रैंक नहीं; फिर कतार या साफ़ फेल। `next()` में अनंत लूप न हो।
* **कर्मचारी खत्म, कतार में निचला काम:** मुक्त कर्मचारी वह काम खींचे जो संभाल सके।
* **दोहरी मुक्त / दोहरी असाइन:** `receiveCall` के बाद `free` झूठा; पूरा या एस्केलेट के बाद मुक्त होने से पहले `currentCall` साफ़।
* **कर्मचारी पर नल सेंटर:** वापस संदर्भ चाहिए (या विधियों में `CallCenter` दो) ताकि एस्केलेट फिर डिस्पैच कर सके।

आम गलतियाँ:

१. **कॉल पर रैंक नहीं।** फिर एस्केलेट नहीं; सिर्फ पता कौन मुक्त।
२. **बिना रैंक फ़िल्टर की एक वैश्विक मुक्त सूची।** डायरेक्टर हमेशा रेस्पॉन्डेंट काम छीन ले भले रेस्पॉन्डेंट मुक्त हों (लागत और डिज़ाइन कहानी खराब)। "सबसे निचला पर्याप्त मुक्त रैंक पहले" बेहतर।
३. **प्रतीक्षा कतार भूलना।** `dispatchCall` जो सिर्फ मुक्त होने पर लौटे, लोड पर टूटे।
४. **एस्केलेशन जो उसी व्यस्त कर्मचारी को रखे।** एस्केलेट को वर्तमान हैंडलर मुक्त कर दूसरे को ढूँढना (या कतार) चाहिए।
५. **विशाल इनहेरिटेंस पेड़।** तीन रैंक और एक सेंटर काफी। बिना पूछे `TeamLead`, `ShiftSupervisor`, `RegionVP` न गढ़ो।
६. **संरचना से पहले थ्रेड बात।** प्रोडक्शन में लॉक मायने रखते हैं; इंटरव्यू पहले सही सिंगल-थ्रेड स्वामित्व चाहता है।

न्यूनतम स्मोक विचार:

```java
CallCenter center = new CallCenter(2, 1, 1);
Call a = new Call("alice");
Call b = new Call("bob");
Call c = new Call("cara");
center.dispatchCall(a);
center.dispatchCall(b);
center.dispatchCall(c); // may land on manager if both respondents busy
// simulate first-line cannot finish
Employee handler = a.getHandler();
if (handler != null) {
    handler.escalateAndReassign();
}
```

---

## ७. दोस्त को समझाने वाला सार

कॉल सेंटर ऑब्जेक्ट डिज़ाइन समस्या है: **कौन कौन-सी कॉल ले सकता है**:

१. तीन रैंक: रेस्पॉन्डेंट, मैनेजर, डायरेक्टर। क्रम वाला इनम।
२. `Call` रेस्पॉन्डेंट (या दिए मिन रैंक) से शुरू, एक-एक सीढ़ी चढ़ सकता है।
३. `Employee` मुक्त/व्यस्त, रैंक, वर्तमान कॉल जानता है। उप-क्लास सिर्फ रैंक बाँधती हैं।
४. `CallCenter.dispatchCall` कॉल के रैंक या उससे ऊँचे पहले मुक्त व्यक्ति को ढूँढे; वरना कतार।
५. एस्केलेट वर्तमान हैंडलर मुक्त करे, कॉल रैंक बढ़ाए, फिर डिस्पैच।
६. कोई खत्म करे तो मुक्त होकर प्रतीक्षा कॉल खींच सकता है जो कवर कर सके।

तीन मंज़िल खींच सको, मुक्त सूचियाँ और प्रतीक्षा कतारें दिखा सको, और एक कॉल रेस्पॉन्डेंट से मैनेजर तक बिना खोए चला सको, तो समस्या ७.२ तुम्हारी। अध्याय ७ में अगला ज्यूकबॉक्स: साफ़ "संज्ञाओं" वाला और लाइव एस्केलेशन कम वाला दूसरा डिज़ाइन।

---

## सीरीज़

* गाइड: [सीटीसीआई सीरीज़ गाइड](/blog/hi/ctci-series-guide)
* पिछला: [डेक ऑफ कार्ड्स](/blog/hi/ctci-7-1-deck-of-cards)
* अगला: [ज्यूकबॉक्स](/blog/hi/ctci-7-3-jukebox)