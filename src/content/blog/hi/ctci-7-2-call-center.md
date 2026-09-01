---
title: "कॉल सेंटर (Call Center): ऑब्जेक्ट-ओरिएंटेड पदानुक्रमित कॉल रूटिंग सिस्टम (सीटीसीआई ७.२)"
description: "तीन स्तरों (प्रतिवादी, प्रबंधक और निदेशक) वाले कॉल सेंटर के लिए स्वचालित एस्केलेशन के साथ O(१) समय में ऑब्जेक्ट-ओरिएंटेड डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-2-call-center.webp
previewImage: /assets/images/ctci-7-2-call-center.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** कल्पना कीजिए कि आपके पास तीन स्तरों के कर्मचारियों वाला एक कॉल सेंटर है: प्रतिवादी (Respondent), प्रबंधक (Manager), और निदेशक (Director)। आने वाली कॉल पहले किसी खाली प्रतिवादी को दी जानी चाहिए। यदि वह हल नहीं कर सकता, तो प्रबंधक को, और यदि प्रबंधक व्यस्त है, तो निदेशक को एस्केलेट की जानी चाहिए। क्लास संरचना और `dispatchCall()` डिज़ाइन करें।
> * **मुख्य समाधान:** **सेंट्रल डिस्पैचर पैटर्न (`CallHandler`)**: (१) ३ कर्मचारी स्तरों और उनकी प्रतीक्षा कतारों का प्रबंधन (`List<List<Employee>>`, `List<List<Call>>`); (२) कॉल आने पर आवश्यक स्तर या उससे ऊपर पहले उपलब्ध कर्मचारी को आवंटित करें; (३) सभी व्यस्त होने पर कतार में डालें; (४) कर्मचारी के खाली होने पर $O(१)$ में उच्चतम प्राथमिकता वाली कॉल सौंपें।
> * **रियल-वर्ल्ड सिस्टम:** स्वचालित कॉल वितरण (ACD) और ग्राहक सहायता टिकट रूटिंग सिस्टम (Zendesk / PagerDuty)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ७.२) में पूछा गया है:

*"कर्मचारियों के ३ स्तरों वाले कॉल सेंटर के लिए डेटा संरचनाएं डिज़ाइन करें और कॉल आवंटित करने के लिए dispatchCall() विधि लागू करें।"*

## २. ऑब्जेक्ट-ओरिएंटेड आर्किटेक्चर

१. **`Rank` (Enum):** `Respondent`, `Manager`, `Director`।
२. **`Call`:** कॉल विवरण, कॉलर और वर्तमान कर्मचारी हैंडलर।
३. **`Employee` (Abstract Class):** सबक्लास `Respondent`, `Manager`, `Director`।
४. **`CallHandler` (Singleton):** कॉल डिस्पैचिंग और कर्मचारी उपलब्धता कतारों का प्रबंधन करता है।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class CallCenter {
    public enum Rank {
        Respondent(0), Manager(1), Director(2);
        private final int value;
        Rank(int v) { this.value = v; }
        public int getValue() { return value; }
    }

    public static class Caller {
        private final int userId;
        private final String name;
        public Caller(int id, String name) { this.userId = id; this.name = name; }
    }

    public static class Call {
        private Rank rank;
        private Caller caller;
        private Employee handler;

        public Call(Caller c) {
            this.rank = Rank.Respondent;
            this.caller = c;
        }

        public void setHandler(Employee e) { this.handler = e; }
        public Rank getRank() { return rank; }
        public void incrementRank() {
            if (rank == Rank.Respondent) rank = Rank.Manager;
            else if (rank == Rank.Manager) rank = Rank.Director;
        }
    }

    public static abstract class Employee {
        private Call currentCall = null;
        protected Rank rank;

        public Employee(Rank rank) { this.rank = rank; }

        public void receiveCall(Call call) { this.currentCall = call; }
        public void callCompleted() {
            if (currentCall != null) {
                currentCall = null;
                CallHandler.getInstance().assignCall(this);
            }
        }
        public void escalateAndReassign() {
            if (currentCall != null) {
                currentCall.incrementRank();
                CallHandler.getInstance().dispatchCall(currentCall);
                currentCall = null;
                CallHandler.getInstance().assignCall(this);
            }
        }
        public boolean isFree() { return currentCall == null; }
        public Rank getRank() { return rank; }
    }

    public static class Respondent extends Employee { public Respondent() { super(Rank.Respondent); } }
    public static class Manager extends Employee { public Manager() { super(Rank.Manager); } }
    public static class Director extends Employee { public Director() { super(Rank.Director); } }

    public static class CallHandler {
        private static CallHandler instance;
        private final int LEVELS = 3;
        private final List<List<Employee>> employeeLevels;
        private final List<List<Call>> callQueues;

        protected CallHandler() {
            employeeLevels = new ArrayList<>(LEVELS);
            callQueues = new ArrayList<>(LEVELS);
            for (int i = 0; i < LEVELS; i++) {
                employeeLevels.add(new ArrayList<>());
                callQueues.add(new LinkedList<>());
            }
        }

        public static synchronized CallHandler getInstance() {
            if (instance == null) instance = new CallHandler();
            return instance;
        }

        public Employee getHandlerForCall(Call call) {
            for (int level = call.getRank().getValue(); level < LEVELS; level++) {
                List<Employee> employees = employeeLevels.get(level);
                for (Employee emp : employees) {
                    if (emp.isFree()) return emp;
                }
            }
            return null;
        }

        public void dispatchCall(Caller caller) {
            dispatchCall(new Call(caller));
        }

        public void dispatchCall(Call call) {
            Employee emp = getHandlerForCall(call);
            if (emp != null) {
                emp.receiveCall(call);
                call.setHandler(emp);
            } else {
                callQueues.get(call.getRank().getValue()).add(call);
            }
        }

        public boolean assignCall(Employee emp) {
            for (int rank = emp.getRank().getValue(); rank >= 0; rank--) {
                List<Call> queue = callQueues.get(rank);
                if (!queue.isEmpty()) {
                    Call call = queue.remove(0);
                    if (call != null) {
                        emp.receiveCall(call);
                        call.setHandler(emp);
                        return true;
                    }
                }
            }
            return false;
        }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| dispatchCall() समय | `O(E)` | उपलब्ध कर्मचारियों की सूची में रैखिक खोज। |
| assignCall() समय | `O(१)` | फिफो (FIFO) कतार से त्वरित निकासी। |
| सहायक मेमोरी | `O(C + E)` | सक्रिय कॉल और कर्मचारियों के अनुपात में हीप मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: स्वचालित कॉल वितरण (ACD)

१. **ट्विलियो और अमेज़ॅन कनेक्ट:** कौशल-आधारित कॉल रूटिंग और एसएलए उल्लंघनों पर स्वचालित एस्केलेशन।
२. **पेजरड्यूटी ऑन-कॉल नीतियां:** स्तर-१ इंजीनियरों द्वारा पावती न मिलने पर स्वचालित रूप से स्तर-२ पर स्थानांतरण।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **सभी स्तरों पर व्यस्तता:** संबंधित स्तर की प्रतीक्षा कतार में कॉल का सुरक्षित भंडारण।
२. **निदेशक स्तर पर एस्केलेशन:** सुरक्षित सीमा नियंत्रण।
