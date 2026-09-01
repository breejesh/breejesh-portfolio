---
title: "ऑनलाइन बुक रीडर (Online Book Reader): ऑब्जेक्ट-ओरिएंटेड सिस्टम आर्किटेक्चर (सीटीसीआई ७.५)"
description: "सक्रिय उपयोगकर्ता सत्र अवस्था और लाइब्रेरी कैटलॉग को अलग करने वाले ऑनलाइन बुक रीडर के लिए O(१) समय में ऑब्जेक्ट-ओरिएंटेड क्लास मॉडल और डेटा संरचनाएं।"
date: "2026-05-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-5-online-book-reader.webp
previewImage: /assets/images/ctci-7-5-online-book-reader.webp
---

> **टीएल;डीआर**
> * **किताब का सवाल:** ऑनलाइन बुक रीडर सिस्टम के लिए डेटा संरचनाएं डिज़ाइन करें।
> * **मुख्य समाधान:** **डिकपल्ड स्टेट और रिपॉजिटरी आर्किटेक्चर**: (१) मुख्य डोमेन मॉडल `Book` और `User`; (२) रिपॉजिटरी परत `Library` (`bookId` द्वारा अनुक्रमित) और `UserManager` (`userId` द्वारा अनुक्रमित); (३) प्रेजेंटेशन इंजन `Display` जो सक्रिय पुस्तक, सक्रिय उपयोगकर्ता और वर्तमान पृष्ठ संख्या को ट्रैक करता है; (४) मास्टर फ़ैसाड (Facade) `OnlineReaderSystem` जो $O(१)$ समय में संचालन का समन्वय करता है।
> * **रियल-वर्ल्ड सिस्टम:** ई-रीडर क्लाउड प्लेटफॉर्म (Amazon Kindle Cloud Reader / Apple Books)।

## १. किताब का सवाल और संदर्भ

*क्रैकिंग द कोडिंग इंटरव्यू* (समस्या ७.५) में पूछा गया है:

*"ऑनलाइन बुक रीडर सिस्टम के लिए डेटा संरचनाएं और ऑब्जेक्ट-ओरिएंटेड मॉडल डिज़ाइन करें।"*

## २. कंपोनेंट क्लास आर्किटेक्चर

१. **`Book`:** पुस्तक आईडी, शीर्षक, लेखक और पृष्ठों की सूची (`List<String>`)।
२. **`User`:** उपयोगकर्ता आईडी, नाम और सदस्यता विवरण।
३. **`Library` & `UserManager`:** तेज़ खोज और प्रबंधन के लिए हैश मैप।
४. **`Display`:** सक्रिय पठन अवस्था (वर्तमान पुस्तक और पृष्ठ नेविगेशन) बनाए रखता है।
५. **`OnlineReaderSystem`:** सभी घटकों का समन्वय करने वाला केंद्रीय फ़ैसाड।

## प्रोडक्शन कार्यान्वयन

```java
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class OnlineBookReader {
    public static class Book {
        private final int bookId;
        private String title;
        private String author;
        private List<String> pages;

        public Book(int id, String title, String author, List<String> pages) {
            this.bookId = id;
            this.title = title;
            this.author = author;
            this.pages = pages;
        }

        public int getID() { return bookId; }
        public String getTitle() { return title; }
        public String getPage(int pageNumber) {
            if (pageNumber >= 0 && pageNumber < pages.size()) {
                return pages.get(pageNumber);
            }
            return null;
        }
        public int getTotalPages() { return pages.size(); }
    }

    public static class User {
        private final int userId;
        private String username;

        public User(int id, String name) {
            this.userId = id;
            this.username = name;
        }

        public int getID() { return userId; }
        public String getUsername() { return username; }
    }

    public static class Library {
        private final Map<Integer, Book> books = new HashMap<>();

        public void addBook(Book b) { books.put(b.getID(), b); }
        public Book find(int id) { return books.get(id); }
    }

    public static class UserManager {
        private final Map<Integer, User> users = new HashMap<>();

        public void addUser(User u) { users.put(u.getID(), u); }
        public User find(int id) { return users.get(id); }
    }

    public static class Display {
        private Book activeBook;
        private User activeUser;
        private int pageNumber = 0;

        public void displayBook(Book book) {
            this.activeBook = book;
            this.pageNumber = 0;
        }

        public void nextPage() {
            if (activeBook != null && pageNumber < activeBook.getTotalPages() - 1) {
                pageNumber++;
            }
        }

        public void previousPage() {
            if (activeBook != null && pageNumber > 0) {
                pageNumber--;
            }
        }

        public int getPageNumber() { return pageNumber; }
    }

    public static class OnlineReaderSystem {
        private final Library library = new Library();
        private final UserManager userManager = new UserManager();
        private final Display display = new Display();

        public Library getLibrary() { return library; }
        public UserManager getUserManager() { return userManager; }
        public Display getDisplay() { return display; }
    }
}
```

## जटिलता और मेमोरी विश्लेषण

| मापदंड | जटिलता | तकनीकी विवरण |
|---|---|---|
| पुस्तक/उपयोगकर्ता खोज | `O(१)` | हैश टेबल कुंजी लुकअप। |
| पृष्ठ नेविगेशन | `O(१)` | सीमा जांच के साथ सीधा इंडेक्स इंक्रीमेंट। |
| सहायक मेमोरी | `O(B * P + U)` | पुस्तकों, पृष्ठों और उपयोगकर्ताओं के अनुपात में मेमोरी। |

## वास्तविक दुनिया में सिस्टम इंजीनियरिंग उपयोग

### प्रोडक्शन सिस्टम आर्किटेक्चर: ई-रीडर सबसिस्टम

१. **किंडल व्हिस्परसिंक प्रोटोकॉल:** कई मोबाइल और ई-इंक उपकरणों में पढ़ने की प्रगति और नोट्स का वास्तविक समय तुल्यकालन।
२. **डीआरएम और सीडीएन वितरण:** एन्क्रिप्टेड सामग्री देने से पहले सक्रिय सत्र लाइसेंस की पुष्टि।

## सीमा स्थितियां और प्रोडक्शन सुरक्षा

१. **पृष्ठ सीमा सुरक्षा:** `nextPage()` और `previousPage()` इंडेक्स सीमाओं से बाहर जाने से रोकते हैं।
