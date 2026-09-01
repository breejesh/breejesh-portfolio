---
title: "चैट सर्वर (Chat Server): ऑब्जेक्ट-ओरिएंटेड आर्किटेक्चर और स्केलेबल मैसेजिंग (सीटीसीआई ७.७)"
description: "निजी वन-ऑन-वन और समूह वार्तालापों के लिए वास्तविक समय चैट सर्वर के बैकएंड घटकों, क्लास संरचना और डेटा मॉडल का डिज़ाइन।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-7-chat-server.webp
previewImage: /assets/images/ctci-7-7-chat-server.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** बताएं कि आप एक चैट सर्वर कैसे डिज़ाइन करेंगे। विभिन्न बैकएंड घटकों, क्लासों और विधियों का विवरण दें। हल करने के लिए सबसे कठिन इंजीनियरिंग समस्याएं कौन सी होंगी?
> * **मुख्य समाधान:** **पॉलीमॉर्फिक वार्तालाप मॉडल**: (१) अमूर्त आधार क्लास `Conversation` जिसे `PrivateChat` (२ प्रतिभागी) और `GroupChat` (एकाधिक प्रतिभागी) में विभाजित किया गया है; (२) टाइमस्टैम्प और प्रेषक के साथ `Message` मॉडल; (३) उपयोगकर्ता निर्देशिका, मित्र अनुरोधों और ऑनलाइन उपस्थिति को प्रबंधित करने वाला `UserManager` (सिंगलटन); (४) सबसे कठिन चुनौतियाँ: बड़े पैमाने पर उपस्थिति सिंक्रोनाइज़ेशन और ऑफ़लाइन संदेश कतार।
> * **रियल-वर्ल्ड सिस्टम:** एंटरप्राइज चैट गेटवे (Slack / Discord) और वितरित संदेश भंडारण (Cassandra / Kafka)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ७.७) में पूछा गया है:

*"एक चैट सर्वर के लिए बैकएंड आर्किटेक्चर और डेटा संरचनाएं डिज़ाइन करें और बड़े पैमाने पर स्केलेबिलिटी की सबसे कठिन समस्याओं की पहचान करें।"*

## २. ऑब्जेक्ट-ओरिएंटेड बैकएंड संरचना

१. **`User`:** उपयोगकर्ता प्रोफ़ाइल, ऑनलाइन स्थिति, निजी चैट और समूह चैट सूचियां।
२. **`Conversation`:** संदेश इतिहास और प्रतिभागियों के प्रबंधन के लिए आधार क्लास।
३. **`Message`:** संदेश सामग्री, समय और प्रेषक आईडी।
४. **`UserManager`:** प्रमाणीकरण, उपस्थिति और सॉकेट कनेक्शन का केंद्रीय नियंत्रक।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ChatServerDesign {
    public enum UserStatusType { Offline, Away, Idle, Available, Busy }

    public static class Message {
        private final String content;
        private final Date date;
        private final int senderId;

        public Message(String content, Date date, int senderId) {
            this.content = content;
            this.date = date;
            this.senderId = senderId;
        }

        public String getContent() { return content; }
        public Date getDate() { return date; }
        public int getSenderId() { return senderId; }
    }

    public static abstract class Conversation {
        protected List<User> participants = new ArrayList<>();
        protected List<Message> messages = new ArrayList<>();

        public List<Message> getMessages() { return messages; }
        public boolean addMessage(Message m) {
            messages.add(m);
            return true;
        }
    }

    public static class PrivateChat extends Conversation {
        public PrivateChat(User user1, User user2) {
            participants.add(user1);
            participants.add(user2);
        }
    }

    public static class GroupChat extends Conversation {
        public void addParticipant(User user) { participants.add(user); }
        public void removeParticipant(User user) { participants.remove(user); }
    }

    public static class User {
        private final int id;
        private final String accountName;
        private UserStatusType status = UserStatusType.Offline;
        private final Map<Integer, PrivateChat> privateChats = new HashMap<>();

        public User(int id, String accountName) {
            this.id = id;
            this.accountName = accountName;
        }

        public int getId() { return id; }
        public void setStatus(UserStatusType type) { this.status = type; }

        public boolean sendMessageToUser(User toUser, String content) {
            PrivateChat chat = privateChats.get(toUser.getId());
            if (chat == null) {
                chat = new PrivateChat(this, toUser);
                privateChats.put(toUser.getId(), chat);
                toUser.privateChats.put(this.id, chat);
            }
            return chat.addMessage(new Message(content, new Date(), this.id));
        }
    }

    public static class UserManager {
        private static UserManager instance;
        private final Map<Integer, User> usersById = new HashMap<>();
        private final Map<Integer, User> onlineUsers = new HashMap<>();

        public static synchronized UserManager getInstance() {
            if (instance == null) instance = new UserManager();
            return instance;
        }

        public void userSignedOn(int userId) {
            User user = usersById.get(userId);
            if (user != null) {
                user.setStatus(UserStatusType.Available);
                onlineUsers.put(userId, user);
            }
        }

        public void userSignedOff(int userId) {
            User user = usersById.get(userId);
            if (user != null) {
                user.setStatus(UserStatusType.Offline);
                onlineUsers.remove(userId);
            }
        }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| संदेश भेजना | `O(१)` | हैश मैप लुकअप और सूची में प्रविष्टि। |
| उपस्थिति अपडेट | `O(१)` | ऑनलाइन उपयोगकर्ता मैप में प्रविष्टि/निष्कासन। |
| सहायक मेमोरी | `O(M + U)` | संग्रहीत संदेशों और पंजीकृत उपयोगकर्ताओं के अनुपात में मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: उपस्थिति और ऑफ़लाइन कतार

१. **उपस्थिति फैनआउट (Presence Fanout):** हजारों संपर्कों वाले उपयोगकर्ता के ऑनलाइन आने पर सॉकेट ओवरलोड से बचने के लिए रेडिस पब/सब (Redis Pub/Sub) का उपयोग।
२. **ऑफ़लाइन संदेश संग्रहण:** प्राप्तकर्ता आईडी के आधार पर अपाचे काफ्का (Kafka) या कैसेंड्रा (Cassandra) में संदेशों का विभाजन।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **ऑफ़लाइन प्राप्तकर्ता:** बिना कॉलिंग थ्रेड को ब्लॉक किए बातचीत इतिहास में संदेश का सुरक्षित भंडारण।
