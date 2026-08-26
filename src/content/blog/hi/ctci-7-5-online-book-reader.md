---
title: "ऑनलाइन पुस्तक पाठक: उपयोगकर्ता, पुस्तकालय, प्रदर्शन और पठन सत्र (जावा वस्तु उन्मुख डिज़ाइन)"
description: "शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.५: उपयोगकर्ता, पुस्तक, पुस्तकालय, प्रदर्शन और एक सक्रिय पठन सत्र वाला ऑनलाइन पुस्तक पाठक डिज़ाइन करो। मूल जावा खाका, पूरा उत्पाद नहीं।"
date: "2026-04-24"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-5-online-book-reader.webp
previewImage: /assets/images/ctci-7-5-online-book-reader.webp
---


> **टीएल;डीआर**
> * **समस्या:** डेटा संरचनाओं और एल्गोरिदम के लिए समय और स्थान जटिलता (टाइम एंड स्पेस कॉम्प्लेक्सिटी) का अनुकूलन।
> * **दृष्टिकोण:** शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.५: उपयोगकर्ता, पुस्तक, पुस्तकालय, प्रदर्शन और एक सक्रिय पठन सत्र वाला ऑनलाइन पुस्तक पाठक डिज़ाइन करो। मूल जावा खाका, पूरा उत्पाद नहीं।
> * **जटिलता:** सीमांत मामलों (एज केसेस) के प्रबंधन के साथ इष्टतम समय और मेमोरी संतुलन।

एक **ऑनलाइन पुस्तक पाठक** के लिए **डेटा संरचनाएँ** डिज़ाइन करो। पूरा किंडल क्लोन नहीं। वितरित सामग्री वाला बड़ा नेटवर्क नहीं। इंटरव्यू जितना वस्तु मॉडल: उपयोगकर्ता सदस्यता बनाते और बढ़ाते हैं, पुस्तकें पुस्तकालय में रहती हैं, एक सक्रिय पाठक के पास एक खुली पुस्तक होती है, और प्रदर्शन वर्तमान पृष्ठ दिखाता है।

यह पोस्ट शुरुआती लोगों के लिए मूल शिक्षण है, छोटे वर्गों में ज़िम्मेदारियाँ बाँटने वाले **जावा** खाके के साथ। सीटीसीआई जैसी क्लासिक वस्तु-उन्मुख डिज़ाइन प्रॉम्प्ट का परिवार, किताब की नकल नहीं। [सीटीसीआई जावा सीरीज़](/blog/hi/ctci-series-guide) का हिस्सा। अध्याय ७, वस्तु-उन्मुख डिज़ाइन, समस्या ७.५।

---

## १. रोज़मर्रा की उपमा

एक छोटी मोहल्ले की लाइब्रेरी सोचो जिसमें सिर्फ **एक पढ़ने की कुर्सी** और **एक डेस्क लैंप** है।

सदस्यों के पास कार्ड हैं। अलमारियों में किताबें हैं। जब तुम बैठते हो, एक किताब चुनते हो, कोई पृष्ठ खोलते हो, और लैंप उसी पृष्ठ को रोशन करता है। इस सरल कहानी में उसी कुर्सी पर एक साथ कोई और नहीं बैठता। जब तुम जाते हो, अगला सदस्य बैठता है, किताब चुनता है, और पृष्ठ फिर से शुरू होता है।

सीधा नक्शा:

* **उपयोगकर्ता** = कार्ड और सदस्यता स्थिति वाला सदस्य
* **पुस्तक** = पहचान और विवरण वाली अलमारी की वस्तु
* **पुस्तकालय** = अलमारियाँ और खोज
* **प्रदर्शन** = लैंप और खुला पृष्ठ (स्क्रीन पर क्या है)
* **सत्र** = कुर्सी पर कौन है, कौन सी किताब खुली है, कौन सा पृष्ठ
* **ऑनलाइन पाठक तंत्र** = काउंटर जो टुकड़ों को जोड़ता है

इंटरव्यू कई लोगों की एक साथ पढ़ाई भेजने के बारे में नहीं है। यह है कि **किस ज़िम्मेदारी का मालिक कौन** है, ताकि मुख्य वर्ग दो हज़ार पंक्तियों का कबाड़ न बन जाए।

---

## २. समस्या सादे शब्दों में

**प्रॉम्प्ट:** ऑनलाइन पुस्तक पाठक तंत्र के लिए डेटा संरचनाएँ डिज़ाइन करो।

क्लासिक प्रॉम्प्ट में ज़रूरतें कम हैं। तुम्हें **अनुमान साफ लिखने** होंगे। शुरुआती के लिए उचित दायरा:

**समर्थित:**

* उपयोगकर्ता सदस्यता बनाओ और बाद में बढ़ाओ
* पुस्तकालय में पुस्तक जोड़ो, हटाओ, ढूँढो
* पहचान से उपयोगकर्ता ढूँढो
* सक्रिय उपयोगकर्ता के लिए पुस्तक खोलो (पठन सत्र शुरू)
* प्रदर्शन पर उपयोगकर्ता जानकारी, पुस्तक शीर्षक/विवरण, वर्तमान पृष्ठ दिखाओ
* पृष्ठ आगे-पीछे पलटो
* एक समय पर अधिकतम **एक सक्रिय उपयोगकर्ता** और **एक सक्रिय पुस्तक** (एकल सत्र)

**इस खाके के बाहर (ज़ोर से कहो):**

* एक साथ कई पाठक, कई उपकरणों का सिंक, डिजिटल अधिकार, भुगतान, सिफारिशें
* पूरे पाठ की खोज रैंकिंग, लाखों शीर्षकों का कैटलॉग
* नेटवर्क प्रोटोकॉल, ऑफलाइन डाउनलोड, टिप्पणियाँ, हाइलाइट
* साधारण `accountType` पूर्णांक से आगे की अनुमतियाँ

**इंटरव्यू का लक्ष्य:** वर्ग, फ़ील्ड और मुख्य विधियाँ नाम दो। दिखाओ कि सक्रिय उपयोगकर्ता या सक्रिय पुस्तक सेट करने पर प्रदर्शन कैसे अपडेट होता है। समन्वयक पतला रखो।

**सिग्नेचर का आकार (मानसिक मॉडल):**

```java
// wire everything
OnlineReaderSystem system = new OnlineReaderSystem();

// catalog + membership
system.getLibrary().addBook(42, "Clean Code notes");
system.getUserManager().addUser(7, "Alex", /*accountType*/ 1);

// start a session: one user, one book
system.login(7);
system.openBook(42);
system.getDisplay().turnPageForward();
```

---

## ३. पहले सोचो

### बक्से खींचने से पहले साफ करो

पूछो:

१. एक उपकरण / एक सत्र, या एक साथ कई उपयोगकर्ता?
२. हर उपयोगकर्ता-पुस्तक के लिए पृष्ठ प्रगति रखेंगे, या सिर्फ "अभी खुला पृष्ठ"?
३. सिर्फ पहचान से खोज, या शीर्षक से भी?
४. सदस्यता प्रकार सुविधा झंडों के लिए मायने रखते हैं?

४५ मिनट की सफेद बोर्ड पर चुनो: **एक सक्रिय सत्र**, **पृष्ठ प्रदर्शन/सत्र पर**, **पहचान से खोज**, और `renewMembership()` की खाली विधि। ये अनुमान बोर्ड के ऊपर लिखो।

### ज़िम्मेदारी से बाँटो (स्क्रीन से नहीं)

बुरा डिफ़ॉल्ट: उपयोगकर्ता, पुस्तकें, पृष्ठ और यूआई रिफ्रेश सब एक `OnlineReaderSystem` देव वर्ग में ठूँसना।

बेहतर बाँट:

| वर्ग | मालिकाना |
| --- | --- |
| `Book` | पहचान, विवरण (खाके में शीर्षक/मेटाडेटा) |
| `User` | पहचान, विवरण, खाता प्रकार, सदस्यता नवीनीकरण |
| `Library` | पुस्तक पहचान से `Book` का नक्शा; जोड़ / हटा / ढूँढ |
| `UserManager` | उपयोगकर्ता पहचान से `User` का नक्शा; जोड़ / हटा / ढूँढ |
| `Display` | यूआई क्या दिखाती है: सक्रिय उपयोगकर्ता, सक्रिय पुस्तक, पृष्ठ; रिफ्रेश सहायक |
| `ReadingSession` | कौन लॉगिन है, कौन सी पुस्तक खुली है, वर्तमान पृष्ठ सूचकांक |
| `OnlineReaderSystem` | टुकड़े बनाता है, लॉगिन/पुस्तक खोल, प्रतिनिधि |

`Library`, `UserManager` और `Display` मुख्य तंत्र से क्यों अलग? खिलौना ऐप में अतिरिक्त फ़ाइलें लगती हैं। तंत्र बढ़े (खोज, उधार, बुकमार्क) तो मुख्य वर्ग छोटा समन्वयक रहता है, हर सुविधा निगलता नहीं।

### सत्र बनाम प्रदर्शन

"सक्रिय उपयोगकर्ता" और "सक्रिय पुस्तक" सिर्फ `OnlineReaderSystem` पर, और `pageNumber` सिर्फ `Display` पर रखना भी सही है।

**`ReadingSession`** को साफ बनाना इंटरव्यू में अक्सर साफ रहता है:

* सत्र जवाब देता है: *कौन क्या पढ़ रहा है, किस पृष्ठ पर?*
* प्रदर्शन जवाब देता है: *उस स्थिति को स्क्रीन पर कैसे रंगें?*

`openBook` चलते ही सत्र अपडेट, फिर प्रदर्शन सत्र की स्थिति से ताज़ा।

### एक सक्रिय उपयोगकर्ता, एक सक्रिय पुस्तक

यह **दायरे की काट** है, असली उत्पादों का दावा नहीं। लॉकिंग, कई टैब सिंक, और "फ़ोन पर अ, टैबलेट पर ब" हट जाते हैं। बोल दो। बाद में कई सत्र चाहें तो `userId -> ReadingSession` नक्शा जोड़ो, `Book` और `Library` फिर से डिज़ाइन करने की ज़रूरत नहीं।

### डेटा संरचनाएँ

* `Library` में `HashMap<Integer, Book>`: पहचान से O(१) खोज
* `UserManager` में `HashMap<Integer, User>`: पहचान से O(१) खोज
* बाद में वैकल्पिक: शीर्षक सूचकांक, पूरा पाठ खोज, या कैटलॉग सेवा (बिना पूछे मत गढ़ो)

---

## ४. जावा समाधान (खाका)

इंटरव्यू जैसा कोड: निर्माता, नक्शे, और वे विधियाँ जिन पर तुम बात करोगे। ग्राफिकल ढाँचा नहीं।

### पुस्तक और उपयोगकर्ता

```java
public class Book {
    private int bookId;
    private String details;

    public Book(int id, String details) {
        this.bookId = id;
        this.details = details;
    }

    public int getId() { return bookId; }
    public void setId(int id) { this.bookId = id; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}

public class User {
    private int userId;
    private String details;
    private int accountType;

    public User(int id, String details, int accountType) {
        this.userId = id;
        this.details = details;
        this.accountType = accountType;
    }

    public void renewMembership() {
        // stub: extend expiry, reset flags, etc.
    }

    public int getId() { return userId; }
    public void setId(int id) { this.userId = id; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public int getAccountType() { return accountType; }
    public void setAccountType(int accountType) { this.accountType = accountType; }
}
```

`Book` और `User` ज़्यादातर डेटा हैं। ठीक है। व्यवहार प्रबंधकों और सत्र में रहता है।

### पुस्तकालय और उपयोगकर्ता प्रबंधक

```java
import java.util.HashMap;
import java.util.Map;

public class Library {
    private final Map<Integer, Book> books = new HashMap<>();

    public Book addBook(int id, String details) {
        if (books.containsKey(id)) {
            return null; // already catalogued
        }
        Book book = new Book(id, details);
        books.put(id, book);
        return book;
    }

    public boolean remove(Book book) {
        return book != null && remove(book.getId());
    }

    public boolean remove(int id) {
        if (!books.containsKey(id)) {
            return false;
        }
        books.remove(id);
        return true;
    }

    public Book find(int id) {
        return books.get(id);
    }
}

public class UserManager {
    private final Map<Integer, User> users = new HashMap<>();

    public User addUser(int id, String details, int accountType) {
        if (users.containsKey(id)) {
            return null;
        }
        User user = new User(id, details, accountType);
        users.put(id, user);
        return user;
    }

    public User find(int id) {
        return users.get(id);
    }

    public boolean remove(User user) {
        return user != null && remove(user.getId());
    }

    public boolean remove(int id) {
        if (!users.containsKey(id)) {
            return false;
        }
        users.remove(id);
        return true;
    }
}
```

दोहरी पहचान पर `null` लौटाओ (या अपवाद फेंको; एक शैली चुनो और उसी पर रहो)। इंटरव्यूअर चाहते हैं कि **डालने से पहले जाँच** हो।

### पठन सत्र और प्रदर्शन

```java
public class ReadingSession {
    private User activeUser;
    private Book activeBook;
    private int pageNumber; // 0-based for the sketch

    public User getActiveUser() { return activeUser; }
    public Book getActiveBook() { return activeBook; }
    public int getPageNumber() { return pageNumber; }

    public void setActiveUser(User user) {
        this.activeUser = user;
        // new reader: clear book/page unless you want to restore saved progress
        this.activeBook = null;
        this.pageNumber = 0;
    }

    public void openBook(Book book) {
        this.activeBook = book;
        this.pageNumber = 0;
    }

    public void turnPageForward() {
        if (activeBook == null) {
            return;
        }
        pageNumber++;
    }

    public void turnPageBackward() {
        if (activeBook == null || pageNumber <= 0) {
            return;
        }
        pageNumber--;
    }

    public void clear() {
        activeUser = null;
        activeBook = null;
        pageNumber = 0;
    }
}

public class Display {
    private User activeUser;
    private Book activeBook;
    private int pageNumber;

    public void displayUser(User user) {
        activeUser = user;
        refreshUsername();
    }

    public void displayBook(Book book, int page) {
        activeBook = book;
        pageNumber = page;
        refreshTitle();
        refreshDetails();
        refreshPage();
    }

    public void refreshFromSession(ReadingSession session) {
        displayUser(session.getActiveUser());
        if (session.getActiveBook() != null) {
            displayBook(session.getActiveBook(), session.getPageNumber());
        } else {
            activeBook = null;
            pageNumber = 0;
            // clear book UI in a real app
        }
    }

    public void turnPageForward(ReadingSession session) {
        session.turnPageForward();
        pageNumber = session.getPageNumber();
        refreshPage();
    }

    public void turnPageBackward(ReadingSession session) {
        session.turnPageBackward();
        pageNumber = session.getPageNumber();
        refreshPage();
    }

    private void refreshUsername() { /* paint username */ }
    private void refreshTitle() { /* paint title */ }
    private void refreshDetails() { /* paint details */ }
    private void refreshPage() { /* paint page body */ }
}
```

यहाँ पृष्ठ सीमाएँ नरम हैं (`Book` पर कुल पृष्ठ नहीं)। सख्त सीमा चाहिए तो `Book` पर `int pageCount` जोड़ो और `turnPageForward` में बाँधो।

### ऑनलाइन पाठक तंत्र

```java
public class OnlineReaderSystem {
    private final Library library;
    private final UserManager userManager;
    private final Display display;
    private final ReadingSession session;

    public OnlineReaderSystem() {
        library = new Library();
        userManager = new UserManager();
        display = new Display();
        session = new ReadingSession();
    }

    public Library getLibrary() { return library; }
    public UserManager getUserManager() { return userManager; }
    public Display getDisplay() { return display; }
    public ReadingSession getSession() { return session; }

    /** Put this member in the single reading chair. */
    public boolean login(int userId) {
        User user = userManager.find(userId);
        if (user == null) {
            return false;
        }
        session.setActiveUser(user);
        display.refreshFromSession(session);
        return true;
    }

    /** Open a catalogued book for the active user. */
    public boolean openBook(int bookId) {
        if (session.getActiveUser() == null) {
            return false;
        }
        Book book = library.find(bookId);
        if (book == null) {
            return false;
        }
        session.openBook(book);
        display.refreshFromSession(session);
        return true;
    }

    public void logout() {
        session.clear();
        display.refreshFromSession(session);
    }
}
```

प्रवाह:

१. `Library` / `UserManager` से पुस्तकें और उपयोगकर्ता कैटलॉग करो
२. `login` सत्र उपयोगकर्ता बाँधता है और पहचान रंगता है
३. `openBook` पुस्तक बाँधता है, पृष्ठ शून्य, शीर्षक और पृष्ठ ० रंगता है
४. पृष्ठ पलटने पर सत्र अपडेट, फिर सिर्फ पृष्ठ क्षेत्र ताज़ा

---

## ५. चलकर देखो

बीज डेटा:

```java
OnlineReaderSystem app = new OnlineReaderSystem();
app.getUserManager().addUser(1, "Sam", 1);
app.getLibrary().addBook(100, "Algorithms notes");
app.getLibrary().addBook(200, "System design notes");
```

**सैम लॉगिन, पुस्तक १०० खोलो:**

१. `login(1)` उपयोगकर्ता १ ढूँढता है, सत्र का सक्रिय उपयोगकर्ता = सैम, पुस्तक/पृष्ठ साफ, प्रदर्शन सैम दिखाता है
२. `openBook(100)` पुस्तक १०० ढूँढता है, सक्रिय पुस्तक सेट, पृष्ठ संख्या = ०, प्रदर्शन शीर्षक और पृष्ठ ०
३. `display.turnPageForward(session)` दो बार: पृष्ठ संख्या २, सिर्फ पृष्ठ रंग

**लॉगआउट के बिना पुस्तक बदलो:**

* `openBook(200)` सक्रिय पुस्तक बदलता है, पृष्ठ ०। पुरानी प्रगति इस खाके में नहीं रखी (बोल दो)।

**लॉगआउट:**

* `logout()` सत्र साफ; प्रदर्शन ताज़ा होने पर पाठक खाली।

**असफल रास्ते:**

* बिना लॉगिन `openBook`: गलत, कोई पुस्तक नहीं
* उपयोगकर्ता न हो तो `login(99)`: गलत
* दो बार `addBook(100, ...)`: दूसरी बार कुछ नहीं लौटता

छोटी जाँच तालिका:

| कदम | सक्रिय उपयोगकर्ता | सक्रिय पुस्तक | पृष्ठ |
| --- | --- | --- | --- |
| शुरू | कोई नहीं | कोई नहीं | ० |
| `login(1)` | सैम | कोई नहीं | ० |
| `openBook(100)` | सैम | एल्गोरिदम नोट्स | ० |
| आगे दो बार | सैम | एल्गोरिदम नोट्स | २ |
| `openBook(200)` | सैम | सिस्टम डिज़ाइन नोट्स | ० |
| `logout` | कोई नहीं | कोई नहीं | ० |

---

## ६. किनारे के मामले और इंटरव्यू नोट

* **बिना सक्रिय उपयोगकर्ता पुस्तक खोलना:** अस्वीकार। मेहमान डिज़ाइन नहीं किया तो प्रदर्शन मेहमान न गढ़े।
* **खुली पुस्तक हटाई जाए:** सत्र उसी पहचान पर हो तो हटा रोकें, या `library.remove` सक्रिय पुस्तक पर लगे तो सत्र साफ।
* **पृष्ठ कम/ज़्यादा:** `pageCount` जोड़ो तो `[0, pageCount-1]` में बाँधो।
* **दोहरी उपयोगकर्ता/पुस्तक पहचान:** जोड़ पर अस्वीकार; चुपचाप न लिखो जब तक उत्पाद जोड़-अपडेट न चाहे।
* **सदस्यता नवीनीकरण:** `User` (या `Membership` वस्तु) पर रखो, बिलिंग `Display` में न मिलाओ।
* **हर उपयोगकर्ता-पुस्तक सहेजी प्रगति:** `Map<UserBookKey, Integer> lastPage` या `ReadingProgress` भंडार। सत्र अब भी *वर्तमान* खुली स्थिति रखता है।
* **शीर्षक खोज:** `Library` दूसरा सूचकांक रख सकता है; स्ट्रिंग स्कैन `OnlineReaderSystem` में मत ठूसो।
* **कई सत्र:** उपयोगकर्ता पहचान (या उपकरण पहचान) पर `Map<Integer, ReadingSession>`। प्रदर्शन प्रति क्लाइंट।

आम गलतियाँ:

१. **एक विशाल वर्ग** जिसमें उपयोगकर्ता, पुस्तकें, पृष्ठ और यूआई सब फ़ील्ड-विधियाँ।
२. **एकल सत्र और एक पुस्तक** की सीमा न बोलना।
३. **प्रदर्शन का कैटलॉग पर कब्ज़ा** (यूआई डेटाबेस नहीं)।
४. **जोड़ से पहले जाँच न** करना, नक्शा चुपचाप ओवरराइट।
५. **बिना खुली पुस्तक पृष्ठ पलटना**, भूत पृष्ठ संख्या बदलना।
६. **माइक्रोसर्विस / काफ्का** पर कूदना जब प्रॉम्प्ट बोर्ड पर डेटा संरचना माँगता हो।

न्यूनतम धुआँ जाँच:

```java
OnlineReaderSystem app = new OnlineReaderSystem();
assert app.getUserManager().addUser(1, "Sam", 1) != null;
assert app.getLibrary().addBook(10, "Demo") != null;
assert app.login(1);
assert app.openBook(10);
app.getDisplay().turnPageForward(app.getSession());
assert app.getSession().getPageNumber() == 1;
assert !app.openBook(999); // missing book
app.logout();
assert app.getSession().getActiveUser() == null;
```

---

## ७. दोस्त को समझाने वाला सार

ऑनलाइन पुस्तक पाठक वस्तु-उन्मुख डिज़ाइन, इंटरव्यू आकार:

१. **अनुमान साफ करो:** सदस्यता, पुस्तकालय खोज, एक सक्रिय उपयोगकर्ता और एक सक्रिय पुस्तक के साथ पढ़ना।
२. **वर्ग बाँटो:** `User`, `Book`, `Library`, `UserManager`, `Display`, `ReadingSession`, पतला `OnlineReaderSystem`।
३. **नक्शे** उपयोगकर्ता और पुस्तक पहचान से। जोड़ / हटा / ढूँढ प्रबंधकों पर, यूआई पर नहीं।
४. **सत्र** रखता है कौन पढ़ रहा है, कौन सी पुस्तक खुली है, कौन सा पृष्ठ।
५. **प्रदर्शन** सत्र से रंगता है (नाम, शीर्षक, विवरण, पृष्ठ) और पृष्ठ पलटते समय सत्र अपडेट फिर ताज़ा।
६. **तंत्र** टुकड़े जोड़ता है: लॉगिन, पुस्तक खोल, लॉगआउट। खुद पुस्तकालय नहीं बनता।
७. पैमाने की बात वैकल्पिक: कई-सत्र नक्शा, सहेजी प्रगति, खोज सूचकांक। सिर्फ पूछे तो।

अगर बक्से खींचकर `login`, फिर `openBook`, फिर `turnPageForward` बिना कैटलॉग तर्क प्रदर्शन में मिलाए चला सको, समस्या ७.५ तुम्हारी है।

---

## सीरीज़

* मार्गदर्शिका: [सीटीसीआई सीरीज़ मार्गदर्शिका](/blog/hi/ctci-series-guide)
* पिछला: [पार्किंग लॉट](/blog/hi/ctci-7-4-parking-lot)
* अगला: [जिगसॉ](/blog/hi/ctci-7-6-jigsaw)