---
title: "चैट सर्वर: उपयोगकर्ता, बातचीत, संदेश और स्थिति (जावा वस्तु-उन्मुख डिज़ाइन)"
description: "शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.७: जावा में चैट सर्वर डिज़ाइन करें उपयोगकर्ता, निजी और समूह बातचीत, संदेश, उपस्थिति स्थिति और मित्र अनुरोधों के साथ। पहले दायरा, फिर वर्ग।"
date: "2026-03-04"
tags: [एल्गोरिदम और डेटा संरचनाएं, सिस्टम डिजाइन और आर्किटेक्चर]
coverImage: /assets/images/ctci-7-7-chat-server.webp
previewImage: /assets/images/ctci-7-7-chat-server.webp
---


> **टीएल;डीआर**
> * **समस्या:** डेटा संरचनाओं और एल्गोरिदम के लिए समय और स्थान जटिलता (टाइम एंड स्पेस कॉम्प्लेक्सिटी) का अनुकूलन।
> * **दृष्टिकोण:** शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.७: जावा में चैट सर्वर डिज़ाइन करें उपयोगकर्ता, निजी और समूह बातचीत, संदेश, उपस्थिति स्थिति और मित्र अनुरोधों के साथ। पहले दायरा, फिर वर्ग।
> * **जटिलता:** सीमांत मामलों (एज केसेस) के प्रबंधन के साथ इष्टतम समय और मेमोरी संतुलन।

चैट सर्वर एक उत्पाद है, एक अकेला मेथड नहीं। साक्षात्कारकर्ता यह जानते हैं। वे चाहते हैं कि तुम काम का **दायरा** बाँधो, वस्तुओं के नाम लो, और दिखाओ कि मित्र, निजी चैट, समूह चैट, संदेश और ऑनलाइन स्थिति कैसे जुड़ते हैं। नेटवर्किंग, पुश डिलीवरी और पूरा बहु-क्षेत्र स्केल अक्सर पहले स्केच से बाहर रहता है, जब तक वे न पूछें।

यह पोस्ट शुरुआती लोगों के लिए **जावा** में मूल **वस्तु-उन्मुख डिज़ाइन** शिक्षण है। क्लासिक इंटरव्यू वस्तु-डिज़ाइन परिवार, किताब की नकल नहीं। [सीटीसीआई जावा सीरीज़](/blog/hi/ctci-series-guide) का हिस्सा। अध्याय ७ [जिग्सॉ](/blog/hi/ctci-7-6-jigsaw) के बाद आगे बढ़ता है।

---

## १. रोज़मर्रा की उपमा

छोटे दफ़्तर की दीवार पर कंपनी चैट बोर्ड सोचो।

* हर व्यक्ति के पास **नाम का टैग** और मूड का चिपचिपा नोट: उपलब्ध, व्यस्त, दूर, ऑफ़लाइन।
* **मित्र** तुम्हारी संपर्क सूची वाले लोग हैं। अजनबियों पर स्पैम नहीं; किसी को जोड़ने का अनुरोध स्वीकार करना पड़ता है।
* **निजी चैट** सील लिफ़ाफ़ा है जिसे सिर्फ दो लोग खोलते हैं।
* **समूह चैट** साझा फ़ोल्डर है। लोग जुड़ते या निकलते हैं। संदेश क्रम से जमा होते हैं।
* जब तुम नोट लिखते हो, वह सही फ़ोल्डर में जाता है, समयचिह्न के साथ, और उस फ़ोल्डर वाले लोग उसे देखें।

सर्वर वह क्लर्क है जो संपर्क सूची, फ़ोल्डर और चिपचिपे नोट एक जैसे रखता है। साक्षात्कार में तुम्हारा काम क्लर्क की फ़ाइल प्रणाली को वर्गों के रूप में डिज़ाइन करना है, हर टीसीपी सॉकेट बाँधना नहीं।

---

## २. समस्या सादे शब्दों में

**लक्ष्य:** उपयोगकर्ताओं और बातचीत पर केंद्रित चैट सर्वर के लिए बैकएंड वर्ग और मेथड का स्केच।

**दायरे में (इस पोस्ट का डिफ़ॉल्ट):**

* ऑनलाइन और ऑफ़लाइन साइन (उपस्थिति)।
* स्थिति प्रकार और वैकल्पिक स्थिति संदेश (उपलब्ध, व्यस्त, दूर, निष्क्रिय, ऑफ़लाइन)।
* आपसी मित्रता: अनुरोध भेजना, स्वीकार, अस्वीकार।
* निजी (१:१) चैट और समूह चैट।
* बातचीत में टेक्स्ट संदेश जोड़ना।
* पहचान या खाता नाम से उपयोगकर्ता खोजना।

**दायरे से बाहर जब तक न पूछा जाए:**

* आवाज़, वीडियो, फ़ाइल स्थानांतरण।
* सिरे-से-सिरे एन्क्रिप्शन।
* वेबसॉकेट फ़्रेमिंग और क्लाइंट इंटरफ़ेस।
* पूरा शार्डेड प्रोडक्शन स्केल (कठिन फॉलो-अप के रूप में चर्चा, पहला कोड नहीं)।

**ज़ोर से कहने वाले अनुमान:**

* मित्रता आपसी है। अगर अ की सूची में ब है, तो ब की सूची में अ है।
* निजी चैट हमेशा ठीक दो प्रतिभागी।
* समूह प्रतिभागी जोड़/हटा सकता है।
* पहले मेमोरी में डोमेन ऑब्जेक्ट। बाद में डेटाबेस उन्हीं इंटरफ़ेस के पीछे उपयोगकर्ता और इतिहास सहेज सकता है।

**मुख्य प्रकार:**

| प्रकार | भूमिका |
| --- | --- |
| `User` | पहचान, संपर्क, चैट, स्थिति, भेजने के रास्ते |
| `Conversation` | प्रतिभागी + संदेश सूची (अमूर्त) |
| `PrivateChat` / `GroupChat` | बातचीत के दो ठोस रूप |
| `Message` | सामग्री + समयचिह्न |
| `UserStatus` / `UserStatusType` | उपस्थिति + वैकल्पिक पाठ |
| `AddRequest` / `RequestStatus` | लंबित मित्र अनुरोध |
| `UserManager` | उपयोगकर्ता रजिस्ट्री, ऑनलाइन समूह, स्वीकार/अस्वीकार |

---

## ३. पहले सोचो

### दायरा "व्हाट्सऐप क्लोन" से जीतता है

अगर तुम काफ़्का, रेडिस और मल्टी-डीसी फ़ेलओवर से शुरू करो, वर्ग तक कभी नहीं पहुँचते। खोलो:

१. कौन-सी क्रियाएँ काम करें?
२. उन क्रियाओं का मालिक कौन-सी वस्तुएँ हैं?
३. जानबूझकर क्या छोड़ा गया?

यही साक्षात्कार है। कोड सबूत है कि मॉडल असली है।

### बातचीत अमूर्त क्यों

निजी और समूह दोनों के पास प्रतिभागी और संदेश हैं। सदस्यता नियम अलग:

* निजी: तय जोड़ी; "दूसरा व्यक्ति" निकालने का सहायक।
* समूह: गतिशील सदस्यता (`addParticipant` / `removeParticipant`)।

संदेश सूची और पहचान अमूर्त `Conversation` पर साझा करो। सदस्यता नियम उपवर्गों पर। इससे `User.sendMessageToGroupChat` और इतिहास पढ़ना सरल रहते हैं।

### संदेश कहाँ जाते हैं

निजी चैट का साफ़ प्रवाह:

१. भेजने वाला दूसरे उपयोगकर्ता के साथ `PrivateChat` ढूँढे या बनाए।
२. सामग्री और समय वाला `Message` बनाए।
३. बातचीत में जोड़े।
४. (असली सिस्टम) नेटवर्क पर प्राप्तकर्ताओं को सूचित करे। वस्तु-डिज़ाइन स्केच में जोड़ने के बाद `true` लौटाना काफ़ी है।

समूह: पहचान से चैट हल करो, भेजने वाला प्रतिभागी है जाँचो, जोड़ो।

### मित्रता प्रवाह

१. अ `requestAddUser(ब का खाता नाम)` बुलाए।
२. `UserManager` एक `AddRequest` बनाए, दोनों उपयोगकर्ताओं पर दर्ज करे (भेजे और प्राप्त मैप)।
३. ब स्वीकारे: मैनेजर दोनों को एक-दूसरे के संपर्कों में जोड़े और अनुरोध साफ़ करे।
४. ब अस्वीकारे: स्थिति अस्वीकृत; कोई संपर्क लिंक नहीं।

अगर उत्पाद नियम कहे तो स्वीकार पूरा होने तक अ को ब को संपर्क की तरह संदेश न लिखने दो। नियम बोलो।

### स्थिति "चैट में होना" नहीं है

`UserStatusType` पूछता है "क्या मैं इस व्यक्ति को तंग कर सकता हूँ?" (उपलब्ध, व्यस्त, दूर, निष्क्रिय, ऑफ़लाइन)। बातचीत में होना उपस्थिति की जगह नहीं लेता। `UserManager` के ऑनलाइन मैप बाद के रूटिंग के लिए बताते हैं कौन साइन-ऑन है।

### सिंगलटन उपयोगकर्ता-मैनेजर?

साक्षात्कार स्केच में एक रजिस्ट्री ठीक है ताकि हर रास्ता एक ही उपयोगकर्ता मैप देखे। प्रोडक्शन में सेवा और डेटास्टोर से बदल दोगे। बोलो: "व्हाइटबोर्ड के लिए सिंगलटन, प्रोडक्शन का हुक्म नहीं।"

---

## ४. जावा समाधान

मूल शिक्षण मॉडल: मित्र अनुरोध और निजी संदेश चलाने लायक मेथड बॉडी। पूरा सर्वर नहीं।

### एनम और छोटे मान प्रकार

```java
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

enum UserStatusType {
    Offline, Away, Idle, Available, Busy
}

enum RequestStatus {
    Unread, Read, Accepted, Rejected
}

class UserStatus {
    private final UserStatusType type;
    private final String message; // optional free text, may be null

    UserStatus(UserStatusType type, String message) {
        this.type = type;
        this.message = message;
    }

    UserStatusType getStatusType() {
        return type;
    }

    String getMessage() {
        return message;
    }
}

class Message {
    private final String content;
    private final Date date;
    private final int senderId;

    Message(String content, Date date, int senderId) {
        this.content = content;
        this.date = date;
        this.senderId = senderId;
    }

    String getContent() {
        return content;
    }

    Date getDate() {
        return date;
    }

    int getSenderId() {
        return senderId;
    }
}

class AddRequest {
    private final User fromUser;
    private final User toUser;
    private final Date date;
    private RequestStatus status;

    AddRequest(User from, User to, Date date) {
        this.fromUser = from;
        this.toUser = to;
        this.date = date;
        this.status = RequestStatus.Unread;
    }

    RequestStatus getStatus() {
        return status;
    }

    void setStatus(RequestStatus status) {
        this.status = status;
    }

    User getFromUser() {
        return fromUser;
    }

    User getToUser() {
        return toUser;
    }

    Date getDate() {
        return date;
    }
}
```

### बातचीत पदानुक्रम

```java
abstract class Conversation {
    protected final int id;
    protected final ArrayList<User> participants = new ArrayList<>();
    protected final ArrayList<Message> messages = new ArrayList<>();

    Conversation(int id) {
        this.id = id;
    }

    int getId() {
        return id;
    }

    ArrayList<Message> getMessages() {
        return messages;
    }

    boolean addMessage(Message m) {
        if (m == null || m.getContent() == null) {
            return false;
        }
        messages.add(m);
        return true;
    }

    boolean hasParticipant(User u) {
        return participants.contains(u);
    }
}

class PrivateChat extends Conversation {
    PrivateChat(int id, User user1, User user2) {
        super(id);
        participants.add(user1);
        participants.add(user2);
    }

    User getOtherParticipant(User primary) {
        if (participants.get(0).equals(primary)) {
            return participants.get(1);
        }
        if (participants.get(1).equals(primary)) {
            return participants.get(0);
        }
        return null;
    }
}

class GroupChat extends Conversation {
    GroupChat(int id) {
        super(id);
    }

    void addParticipant(User user) {
        if (user != null && !participants.contains(user)) {
            participants.add(user);
        }
    }

    void removeParticipant(User user) {
        participants.remove(user);
    }
}
```

### उपयोगकर्ता

```java
class User {
    private final int id;
    private final String accountName;
    private final String fullName;
    private UserStatus status = new UserStatus(UserStatusType.Offline, null);

    // other user id -> private chat
    private final Map<Integer, PrivateChat> privateChats = new HashMap<>();
    private final ArrayList<GroupChat> groupChats = new ArrayList<>();

    private final Map<Integer, AddRequest> receivedAddRequests = new HashMap<>();
    private final Map<Integer, AddRequest> sentAddRequests = new HashMap<>();
    private final Map<Integer, User> contacts = new HashMap<>();

    User(int id, String accountName, String fullName) {
        this.id = id;
        this.accountName = accountName;
        this.fullName = fullName;
    }

    int getId() {
        return id;
    }

    String getAccountName() {
        return accountName;
    }

    String getFullName() {
        return fullName;
    }

    UserStatus getStatus() {
        return status;
    }

    void setStatus(UserStatus status) {
        this.status = status;
    }

    boolean addContact(User user) {
        if (user == null || user.getId() == id) {
            return false;
        }
        contacts.put(user.getId(), user);
        return true;
    }

    boolean isContact(User other) {
        return other != null && contacts.containsKey(other.getId());
    }

    void receivedAddRequest(AddRequest req) {
        receivedAddRequests.put(req.getFromUser().getId(), req);
    }

    void sentAddRequest(AddRequest req) {
        sentAddRequests.put(req.getToUser().getId(), req);
    }

    void removeAddRequest(AddRequest req) {
        receivedAddRequests.remove(req.getFromUser().getId());
        sentAddRequests.remove(req.getToUser().getId());
    }

    void requestAddUser(String accountName) {
        UserManager.getInstance().addUser(this, accountName);
    }

    void addConversation(PrivateChat conversation) {
        User other = conversation.getOtherParticipant(this);
        if (other != null) {
            privateChats.put(other.getId(), conversation);
        }
    }

    void addConversation(GroupChat conversation) {
        if (!groupChats.contains(conversation)) {
            groupChats.add(conversation);
        }
    }

    boolean sendMessageToUser(User to, String content) {
        if (to == null || content == null || content.isEmpty()) {
            return false;
        }
        // product rule: only message contacts (state if you allow open messaging)
        if (!isContact(to)) {
            return false;
        }

        PrivateChat chat = privateChats.get(to.getId());
        if (chat == null) {
            chat = UserManager.getInstance()
                    .createPrivateChat(this, to);
        }

        Message msg = new Message(content, new Date(), id);
        return chat.addMessage(msg);
    }

    boolean sendMessageToGroupChat(int groupId, String content) {
        GroupChat chat = null;
        for (GroupChat g : groupChats) {
            if (g.getId() == groupId) {
                chat = g;
                break;
            }
        }
        if (chat == null || !chat.hasParticipant(this)) {
            return false;
        }
        return chat.addMessage(new Message(content, new Date(), id));
    }
}
```

### उपयोगकर्ता-मैनेजर

```java
class UserManager {
    private static UserManager instance;

    private final Map<Integer, User> usersById = new HashMap<>();
    private final Map<String, User> usersByAccountName = new HashMap<>();
    private final Map<Integer, User> onlineUsers = new HashMap<>();
    private int nextConversationId = 1;

    private UserManager() {
    }

    static UserManager getInstance() {
        if (instance == null) {
            instance = new UserManager();
        }
        return instance;
    }

    /** Register a brand-new account in the system. */
    User register(int id, String accountName, String fullName) {
        if (usersByAccountName.containsKey(accountName)) {
            return null;
        }
        User u = new User(id, accountName, fullName);
        usersById.put(id, u);
        usersByAccountName.put(accountName, u);
        return u;
    }

    /** A asks to add B by account name. */
    void addUser(User fromUser, String toAccountName) {
        User toUser = usersByAccountName.get(toAccountName);
        if (fromUser == null || toUser == null || fromUser.getId() == toUser.getId()) {
            return;
        }
        if (fromUser.isContact(toUser)) {
            return;
        }

        AddRequest req = new AddRequest(fromUser, toUser, new Date());
        fromUser.sentAddRequest(req);
        toUser.receivedAddRequest(req);
    }

    void approveAddRequest(AddRequest req) {
        if (req == null) {
            return;
        }
        User from = req.getFromUser();
        User to = req.getToUser();
        from.addContact(to);
        to.addContact(from);
        req.setStatus(RequestStatus.Accepted);
        from.removeAddRequest(req);
        to.removeAddRequest(req);
    }

    void rejectAddRequest(AddRequest req) {
        if (req == null) {
            return;
        }
        req.setStatus(RequestStatus.Rejected);
        req.getFromUser().removeAddRequest(req);
        req.getToUser().removeAddRequest(req);
    }

    void userSignedOn(String accountName) {
        User u = usersByAccountName.get(accountName);
        if (u == null) {
            return;
        }
        onlineUsers.put(u.getId(), u);
        u.setStatus(new UserStatus(UserStatusType.Available, null));
    }

    void userSignedOff(String accountName) {
        User u = usersByAccountName.get(accountName);
        if (u == null) {
            return;
        }
        onlineUsers.remove(u.getId());
        u.setStatus(new UserStatus(UserStatusType.Offline, null));
    }

    PrivateChat createPrivateChat(User a, User b) {
        PrivateChat chat = new PrivateChat(nextConversationId++, a, b);
        a.addConversation(chat);
        b.addConversation(chat);
        return chat;
    }

    GroupChat createGroupChat(User creator, String ignoredTitleForSketch) {
        GroupChat chat = new GroupChat(nextConversationId++);
        chat.addParticipant(creator);
        creator.addConversation(chat);
        return chat;
    }

    boolean isOnline(int userId) {
        return onlineUsers.containsKey(userId);
    }
}
```

### चलकर देखो

```java
UserManager um = UserManager.getInstance();
User ana = um.register(1, "ana", "Ana Rao");
User ben = um.register(2, "ben", "Ben Cole");

um.userSignedOn("ana");
um.userSignedOn("ben");

ana.requestAddUser("ben");
// ben accepts the pending request from ana (in a real API, pull from received map)
AddRequest pending = /* ben's received request from ana */;
um.approveAddRequest(pending);

ana.sendMessageToUser(ben, "lunch at 1?");
// private chat now has one Message; both users share the same PrivateChat object
```

साक्षात्कार में जो मायने रखता है वह **वस्तु ग्राफ़** है: मैनेजर निर्देशिका का मालिक, उपयोगकर्ता संपर्कों और चैट हैंडल के, बातचीत इतिहास की, स्थिति उपयोगकर्ता पर।

---

## ५. कठिन समस्याएँ (समय हो तो बोलो)

वर्ग आरेख के बाद क्लासिक "क्या दुखेगा?" सवाल।

### सच में कोई ऑनलाइन कैसे जानें?

क्लाइंट साफ़ साइन-ऑफ़ बिना गायब हो सकते हैं (लैपटॉप स्लीप, मारा गया प्रोसेस, डगमगाता नेटवर्क)। उपस्थिति को **पट्टा** मानो:

* क्लाइंट टाइमर पर हार्टबीट भेजे।
* छूटी हार्टबीट पर उपयोगकर्ता ऑफ़लाइन (या पहले दूर, फिर ऑफ़लाइन)।
* सिर्फ़ "उपयोगकर्ता ने लॉग आउट दबाया" पर भरोसा न करो।

### मेमोरी बनाम डेटाबेस टकराव

गर्म डेटा (कौन ऑनलाइन, खुले सॉकेट) प्रोसेस मेमोरी में। टिकाऊ डेटा (खाते, संग्रह) डेटाबेस में। असहमति पर **इतिहास के लिए अक्सर टिकाऊ जीते**, और **उपस्थिति के लिए आखिरी हार्टबीट**। स्पष्ट मालिकाना डिज़ाइन करो ताकि बिना नियम के दो बार न लिखो।

### स्केल

एक `UserManager` सिंगलटन लाखों समवर्ती उपयोगकर्ताओं को नहीं चलाता। उपयोगकर्ता पहचान या चैट पहचान की श्रेणियों से बाँटो, सावधानी से दोहराओ, और मानो कि मशीनों के बीच मित्र अनुरोध को समन्वय चाहिए। दर्द नाम दो: संपर्क सूचियों और संदेश क्रम की मशीनों के आर-पार संगति।

### दुरुपयोग और सेवा-इनकार

कोई भी एपीआई जो क्लाइंट ट्रैफ़िक लेता है भर सकता है: स्पैम अनुरोध, विशाल संदेश, जुड़/छोड़ थ्रैश। प्रति उपयोगकर्ता और प्रति आईपी दर सीमा, संदेश आकार सीमा, अतिरिक्त काम गिराओ या कतार में डालो। व्हाइटबोर्ड पर भी सीमाएँ कहो।

### डिलीवरी गारंटी (अतिरिक्त)

एट-मोस्ट-वन्स आसान है और संदेश खो देता है। एट-लीस्ट-वन्स को पहचान और क्लाइंट डी-ड्यूप चाहिए। एग्जैक्टली-वन्स महँगा है। चैट साक्षात्कार के लिए "पहले सहेजो फिर फैलाओ; क्लाइंट संदेश पहचान से फिर कोशिश करे" मज़बूत डिफ़ॉल्ट वाक्य है। उसी विचार के उत्पाद-स्तर आर्किटेक्चर के लिए देखो [चैट सिस्टम डिज़ाइन](/blog/hi/design-chat-system)।

---

## ६. किनारे के मामले और आम गलतियाँ

साक्षात्कारकर्ता ये छेड़ते हैं:

* **खुद को जोड़ना** या **गायब खाता** → कोई-कार्य नहीं या साफ़ त्रुटि।
* **उसी अनुरोध का दोहरा स्वीकार** → संपर्क सही; डुप्लिकेट निजी चैट नहीं।
* **गैर-संपर्क को संदेश** → अगर नियम हो तो अस्वीकार; नियम बोलो।
* **खाली संदेश शरीर** → अस्वीकार।
* **गैर-सदस्य से समूह संदेश** → अस्वीकार।
* **साइन-ऑन बिना साइन-ऑफ़** → हटाना सुरक्षित कोई-कार्य नहीं।
* **एक ही जोड़ी के दो निजी चैट** → एक बार बनाओ, दोनों उपयोगकर्ताओं के मैप में वही प्रविष्टि।

आम गलतियाँ:

१. **`User` और `Conversation` नाम लेने से पहले** काफ़्का और लोड बैलेंसर पर कूदना।
२. **एक विशाल चैट वर्ग** निजी बनाम समूह फ़्लैग के साथ, छोटी पदानुक्रम की जगह।
३. **स्वीकार पर आपसी संपर्क भूलना** (सिर्फ़ अ को ब मिलता है)।
४. **सभी संदेश उपयोगकर्ता पर** रखना, साझा बातचीत पर नहीं।
५. **उपस्थिति और संदेश डिलीवरी मिलाना** ताकि ऑफ़लाइन मॉडल तोड़ दें।
६. **जब पूछें ब कैसे अ का संदेश देखे** तो नेटवर्किंग पर चुप रहना: कम से कम बोलो "ऑनलाइन सत्र सूचित करो; ऑफ़लाइन बाद में स्टोर से पकड़े।"

कम से कम धुआँ जाँच:

```java
// after register + mutual accept
assert ana.isContact(ben);
assert ben.isContact(ana);
assert ana.sendMessageToUser(ben, "hi");
assert !ana.sendMessageToUser(ben, ""); // empty rejected
```

---

## ७. दोस्त को समझाने वाला सार

चैट सर्वर वस्तु-डिज़ाइन दायरे में बँधा फ़ाइल सिस्टम है:

१. **उपयोगकर्ता** खाता पहचान, स्थिति, संपर्क, निजी चैट मैप, समूह सूची और अनुरोध मैप रखता है।
२. **बातचीत** अमूर्त: पहचान, प्रतिभागी, संदेश। **निजी चैट** तय जोड़ी। **समूह चैट** लोग जोड़/हटा सकता है।
३. **संदेश** सामग्री, समय और भेजने वाला।
४. **जोड़-अनुरोध** और **अनुरोध-स्थिति** लंबित मित्रता। स्वीकार संपर्क आपसी बनाता है।
५. **उपयोगकर्ता-मैनेजर** निर्देशिका: पंजीकरण, ऑनलाइन समूह, स्वीकार/अस्वीकार, चैट बनाना।
६. कठिन फॉलो-अप: सच्ची उपस्थिति (हार्टबीट), मेमोरी बनाम डेटाबेस सच, स्केल, दुरुपयोग सुरक्षा।

अगर व्हाइटबोर्ड पर उपयोगकर्ता, बातचीत, संदेश और मित्र-अनुरोध पथ खींच सको, फिर एक निजी भेजना चला सको, तो साक्षात्कार गहराई में समस्या ७.७ तुम्हारी है। पूरा वितरित चैट लंबी सिस्टम डिज़ाइन बात है; यह पोस्ट वस्तु मॉडल ईमानदार रखता है।

---

## सीरीज़

* गाइड: [सीटीसीआई सीरीज़ गाइड](/blog/hi/ctci-series-guide)
* पिछला: [जिग्सॉ](/blog/hi/ctci-7-6-jigsaw)
* अगला: [ओथेलो](/blog/hi/ctci-7-8-othello)