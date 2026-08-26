---
title: "फ़ाइल सिस्टम: एंट्री, फ़ाइल और डायरेक्टरी वाला स्मृति-वृक्ष (जावा)"
description: "शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.११: स्मृति में फ़ाइल सिस्टम डिज़ाइन करो। साझा एंट्री आधार, फ़ाइल पत्तियाँ, डायरेक्टरी नोड, पुनरावर्ती आकार और पथ सहायक जावा में।"
date: "2025-11-09"
tags: [एल्गोरिदम और डेटा संरचनाएं, डेवलपर टूल्स, सिस्टम डिजाइन और आर्किटेक्चर]
coverImage: /assets/images/ctci-7-11-file-system.webp
previewImage: /assets/images/ctci-7-11-file-system.webp
---


> **टीएल;डीआर**
> * **समस्या:** डेटा संरचनाओं और एल्गोरिदम के लिए समय और स्थान जटिलता (टाइम एंड स्पेस कॉम्प्लेक्सिटी) का अनुकूलन।
> * **दृष्टिकोण:** शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.११: स्मृति में फ़ाइल सिस्टम डिज़ाइन करो। साझा एंट्री आधार, फ़ाइल पत्तियाँ, डायरेक्टरी नोड, पुनरावर्ती आकार और पथ सहायक जावा में।
> * **जटिलता:** सीमांत मामलों (एज केसेस) के प्रबंधन के साथ इष्टतम समय और मेमोरी संतुलन।

इंटरव्यू कहता है: एक **स्मृति में रहने वाला फ़ाइल सिस्टम** डिज़ाइन करो। डिस्क ड्राइवर नहीं। ब्लॉक आवंटन नहीं। सिर्फ वे वस्तुएँ और एल्गोरिदम जो रैम में फ़ोल्डर और फ़ाइल के लिए चाहिए, छोटे कोड स्केच के साथ।

यह ऑब्जेक्ट-ओरिएंटेड डिज़ाइन है, कर्नेल ट्यूटोरियल नहीं। क्लासिक आकार एक **वृक्ष** है: साझा `Entry` आधार, `File` पत्तियाँ, और `Directory` नोड जो और एंट्री रखते हैं। यह पोस्ट शुरुआती लोगों के लिए **जावा** में मूल शिक्षण है। क्लासिक ओओडी इंटरव्यू सवालों का परिवार, किताब की नकल नहीं। [सीटीसीआई जावा सीरीज़](/blog/hi/ctci-series-guide) का हिस्सा। अध्याय ७, ऑब्जेक्ट-ओरिएंटेड डिज़ाइन।

---

## १. रोज़मर्रा की उपमा

एक भौतिक फाइलिंग कैबिनेट सोचो।

* एक **फ़ोल्डर** कागज़ और दूसरे फ़ोल्डर रख सकता है।
* एक **कागज़** पाठ रखता है। उसमें दूसरे फ़ोल्डर नहीं जाते।
* हर चीज़ का **नाम** है, किसी अभिभावक फ़ोल्डर के अंदर बैठती है (जड़ दराज को छोड़कर), और कभी बनाई या छुई गई।
* कागज़ का **आकार** पाठ की लंबाई है। फ़ोल्डर का आकार अंदर की हर चीज़ का योग है, नेस्टेड फ़ोल्डर समेत।

वह कैबिनेट एक वृक्ष है। जड़ ऊपर वाला दराज है। `docs/notes/todo.txt` जैसे पथ नाम वाले बच्चों पर चलना है। कागज़ मिटाने का मतलब उसके अभिभावक से हटवाना। नाम बदलना सिर्फ नाम फ़ील्ड (और शायद बच्चे के मैप को फिर से कुंजी देना)।

तुम हार्ड डिस्क नहीं डिज़ाइन कर रहे। उस कैबिनेट को कक्षाओं से मॉडल कर रहे हो।

---

## २. समस्या सादे शब्दों में

**लक्ष्य:** साधारण **स्मृति-स्थित** फ़ाइल सिस्टम के लिए डेटा संरचनाएँ और एल्गोरिदम समझाओ, जहाँ मदद हो वहाँ कोड से दिखाओ।

**मुख्य धारणाएँ:**

* **फ़ाइल:** नाम वाला सामग्री ब्लॉब (स्केच के लिए `String` काफी) और आकार।
* **डायरेक्टरी:** नाम वाला कंटेनर जो बच्चे एंट्री रखे (फ़ाइलें और उप-डायरेक्टरी)।
* **साझा मेटाडेटा:** नाम, अभिभावक, बनाई / अंतिम अपडेट / अंतिम पहुँच के समय।
* **लोग जो ऑपरेशन चाहते हैं:** बनाना, मिटाना, नाम बदलना, पूरा पथ, आकार निकालना, बच्चे सूची, शायद फ़ाइलें गिनना।

**इंटरव्यू में साफ करो:**

* सिर्फ स्मृति में? इस समस्या के लिए हाँ। स्थायी संग्रह तब तक बाहर जब तक न पूछें।
* सॉफ्ट लिंक, हार्ड लिंक, अनुमतियाँ, उपयोगकर्ता? अच्छे फॉलो-अप। बिना इनके शुरू करो।
* केस संवेदनशीलता, अवैध अक्षर, अधिकतम पथ लंबाई? बताओ और साधारण नियम चुनो।
* प्रति डायरेक्टरी अद्वितीय नाम? हाँ: एक ही अभिभावक के दो बच्चों का नाम एक न हो।
* जड़ का अभिभावक नहीं। जड़ मिटाना या तो मना या खास मामला।

**प्रकार पदानुक्रम का आकार:**

```
Entry (abstract)
  ├── File
  └── Directory  (holds List or Map of Entry)
```

`size()` `Entry` पर अमूर्त है। फ़ाइलें अपना आकार लौटाती हैं। डायरेक्टरी बच्चों का योग करती हैं।

---

## ३. पहले सोचो

### साझा आधार कक्षा क्यों

फ़ाइल और डायरेक्टरी दोनों में नाम, अभिभावक और समय चिह्न हैं। दोनों को मिटाना और पूरा पथ चाहिए। दो अलग कक्षाओं में नकल शोर है। साझा स्थिति और व्यवहार `Entry` पर रखो। `size()` अमूर्त बनाओ ताकि हर प्रकार अलग जवाब दे।

सिर्फ संयोजन (एक नोड वस्तु और प्रकार का झंडा) भी चलता है। विरासत शिक्षण का आम रूप है क्योंकि बच्चों पर चलते समय `instanceof` और बहुरूपता स्वाभाविक दिखती है।

### वृक्ष कड़ियाँ

* हर एंट्री पर **अभिभावक सूचक** (जड़ पर नल): `getFullPath()` और `delete()` आसान।
* **बच्चों का संग्रह** सिर्फ `Directory` पर।
* प्रविष्टि क्रम और सादा कोड चाहिए तो `ArrayList<Entry>`।
* नाम से खोज ओ(१) चाहिए तो `HashMap<String, Entry>` (पथ हल करने के लिए बेहतर)।

इंटरव्यू का अच्छा डिफ़ॉल्ट: बच्चों के लिए `Map<String, Entry>`, और नोट कि स्थिर क्रम चाहिए तो सूची भी रख सकते हो।

### पथ हल करना

पथ को `/` पर काटो। जड़ (या वर्तमान कार्य डायरेक्टरी) से शुरू करो। हर खंड के लिए बच्चा ढूँढो। खंड गायब हो या फ़ाइल में डायरेक्टरी की तरह घुसने की कोशिश हो तो असफल।

पूर्ण पथ: जड़ से। सापेक्ष पथ: दी गई डायरेक्टरी से। जो भी कहो, साफ बोलो।

### आकार और फ़ाइलों की संख्या

डायरेक्टरी का `size()` उपवृक्ष घूमकर जोड़ता है। यह ओ(उपवृक्ष) है जब तक आकार **कैश** न करो और बदलाव पर अपडेट न करो (अनुकूलन फॉलो-अप)।

`numberOfFiles()` सिर्फ फ़ाइलें गिन सकता है, या फ़ाइलें प्लस डायरेक्टरी। बताओ कौन सा। स्केच के लिए पुनरावर्ती घूमना काफी।

### विकल्प: डायरेक्टरी में दो सूचियाँ

अलग `List<File>` और `List<Directory>` रख सकते हो। गिनना साफ (`instanceof` नहीं), पर नाम या तारीख से मिला-जुला क्रम मुश्किल। “सब सूची” के लिए एक `Entry` सूची आसान।

### तुम क्या नहीं बना रहे

ब्लॉक मैप, इनोड टेबल, जर्नलिंग, माउंट पर संगामिति ताले। अगर ओएस गहराई चाहिए तो पूछो कौन सी परत। ७.११ के लिए वृक्ष का ऑब्जेक्ट मॉडल जीत है।

### व्हाइटबोर्ड पर डिज़ाइन स्केच

१. `Entry` बनाओ: `name`, `parent`, समय, अमूर्त `size()`, `delete()`, `getFullPath()`।
२. `File` बनाओ: `content` और स्थिर या संग्रहीत आकार।
३. `Directory` बनाओ: बच्चों का मैप, `addEntry`, `deleteEntry`, पुनरावर्ती `size`।
४. उदाहरण वृक्ष चलाओ: `/home/notes.txt` और पथ व आकार गणित दिखाओ।

---

## ४. जावा समाधान

साफ शिक्षण संस्करण। बच्चे `LinkedHashMap` में हैं ताकि खोज तेज़ रहे और प्रविष्टि क्रम स्थिर।

```java
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Shared node in the in-memory file system tree. */
abstract class Entry {
    protected Directory parent;
    protected String name;
    protected final long created;
    protected long lastUpdated;
    protected long lastAccessed;

    Entry(String name, Directory parent) {
        this.name = name;
        this.parent = parent;
        long now = System.currentTimeMillis();
        this.created = now;
        this.lastUpdated = now;
        this.lastAccessed = now;
    }

    abstract int size();

    /** Ask the parent to drop this entry. Root cannot delete itself this way. */
    boolean delete() {
        if (parent == null) {
            return false;
        }
        return parent.deleteEntry(this);
    }

    String getFullPath() {
        if (parent == null) {
            return name == null ? "" : name;
        }
        String parentPath = parent.getFullPath();
        if (parentPath.isEmpty() || parentPath.equals("/")) {
            return "/" + name;
        }
        return parentPath + "/" + name;
    }

    void changeName(String newName) {
        if (parent != null) {
            parent.renameChild(this, newName);
        } else {
            this.name = newName;
            touch();
        }
    }

    String getName() {
        return name;
    }

    Directory getParent() {
        return parent;
    }

    long getCreated() {
        return created;
    }

    long getLastUpdated() {
        return lastUpdated;
    }

    long getLastAccessed() {
        return lastAccessed;
    }

    protected void touch() {
        long now = System.currentTimeMillis();
        lastUpdated = now;
        lastAccessed = now;
    }
}

class File extends Entry {
    private String content;
    private int size;

    File(String name, Directory parent, int size) {
        super(name, parent);
        this.size = Math.max(0, size);
        this.content = "";
    }

    @Override
    int size() {
        return size;
    }

    String getContents() {
        lastAccessed = System.currentTimeMillis();
        return content;
    }

    void setContents(String content) {
        this.content = content == null ? "" : content;
        this.size = this.content.length();
        touch();
    }
}

class Directory extends Entry {
    private final Map<String, Entry> children = new LinkedHashMap<>();

    Directory(String name, Directory parent) {
        super(name, parent);
    }

    @Override
    int size() {
        int total = 0;
        for (Entry e : children.values()) {
            total += e.size();
        }
        return total;
    }

    void addEntry(Entry entry) {
        if (entry == null || entry.getName() == null) {
            throw new IllegalArgumentException("entry and name required");
        }
        if (children.containsKey(entry.getName())) {
            throw new IllegalStateException("name already exists: " + entry.getName());
        }
        children.put(entry.getName(), entry);
        entry.parent = this;
        touch();
    }

    boolean deleteEntry(Entry entry) {
        if (entry == null) {
            return false;
        }
        Entry removed = children.remove(entry.getName());
        if (removed == entry) {
            entry.parent = null;
            touch();
            return true;
        }
        // name collision or already gone: try identity scan
        return false;
    }

    void renameChild(Entry entry, String newName) {
        if (!children.containsKey(entry.getName()) || children.get(entry.getName()) != entry) {
            throw new IllegalStateException("entry is not a child of this directory");
        }
        if (children.containsKey(newName)) {
            throw new IllegalStateException("name already exists: " + newName);
        }
        children.remove(entry.getName());
        entry.name = newName;
        children.put(newName, entry);
        entry.touch();
        touch();
    }

    Entry getChild(String name) {
        return children.get(name);
    }

    Collection<Entry> getContents() {
        return Collections.unmodifiableCollection(children.values());
    }

    /** Count files and directories in this subtree (including nested). */
    int numberOfEntries() {
        int count = 0;
        for (Entry e : children.values()) {
            count++;
            if (e instanceof Directory) {
                count += ((Directory) e).numberOfEntries();
            }
        }
        return count;
    }

    int numberOfFilesOnly() {
        int count = 0;
        for (Entry e : children.values()) {
            if (e instanceof File) {
                count++;
            } else if (e instanceof Directory) {
                count += ((Directory) e).numberOfFilesOnly();
            }
        }
        return count;
    }

    /**
     * Resolve a simple absolute path from this directory if this is root-like,
     * or treat path as relative segments joined by '/'.
     * Empty segments from leading/trailing slashes are skipped.
     */
    Entry resolve(String path) {
        if (path == null || path.isEmpty()) {
            return this;
        }
        Entry current = this;
        String[] parts = path.split("/");
        for (String part : parts) {
            if (part.isEmpty() || part.equals(".")) {
                continue;
            }
            if (part.equals("..")) {
                if (current.parent != null) {
                    current = current.parent;
                }
                continue;
            }
            if (!(current instanceof Directory)) {
                return null;
            }
            current = ((Directory) current).getChild(part);
            if (current == null) {
                return null;
            }
        }
        return current;
    }
}

/** Tiny demo of building a tree and querying it. */
class FileSystemDemo {
    public static void main(String[] args) {
        Directory root = new Directory("", null); // root path pieces show as /name

        Directory home = new Directory("home", null);
        Directory docs = new Directory("docs", null);
        File notes = new File("notes.txt", null, 0);
        File readme = new File("README.md", null, 0);

        root.addEntry(home);
        home.addEntry(docs);
        home.addEntry(readme);
        docs.addEntry(notes);

        notes.setContents("buy milk");
        readme.setContents("hello");

        System.out.println(notes.getFullPath());   // /home/docs/notes.txt
        System.out.println(docs.size());           // length of "buy milk"
        System.out.println(home.size());           // notes + readme
        System.out.println(home.numberOfFilesOnly()); // 2

        Entry found = root.resolve("/home/docs/notes.txt");
        System.out.println(found != null && found.getName().equals("notes.txt"));

        notes.delete();
        System.out.println(docs.getChild("notes.txt") == null);
    }
}
```

डेमो वृक्ष का चलना:

| चरण | संरचना | नोट |
| --- | --- | --- |
| शुरू | `root` | अभिभावक नल |
| जोड़ | `root/home` | डायरेक्टरी |
| जोड़ | `home/docs`, `home/README.md` | मिले-जुले बच्चे |
| जोड़ | `docs/notes.txt` | फ़ाइल पत्ती |
| लिख | नोट्स सामग्री `"buy milk"` | आकार ८ हो जाता है |
| पथ | `notes.getFullPath()` | अभिभावकों पर `/` के साथ चढ़ना |
| आकार | `home.size()` | नीचे फ़ाइलों का पुनरावर्ती योग |
| हल | `/home/docs/notes.txt` | हर खंड पर मैप खोज |
| मिटा | `notes.delete()` | अभिभावक नाम से हटाता है |

---

## ५. जटिलता तालिका

| ऑपरेशन | समय | अतिरिक्त स्थान | नोट |
| --- | --- | --- | --- |
| `addEntry` / `deleteEntry` / `getChild` | औसत ओ(१) | ओ(१) | नाम पर `HashMap` / `LinkedHashMap` से |
| `getFullPath` | ओ(गहराई) | स्ट्रिंग बनाने में ओ(गहराई) | अभिभावक पर चलना |
| डायरेक्टरी पर `size()` | ओ(उपवृक्ष आकार) | पुनरावृत्ति ओ(गहराई) | गर्म हो तो कैश कर सकते हो |
| `numberOfFilesOnly` | ओ(उपवृक्ष आकार) | ओ(गहराई) | वैसी ही घूमने की शैली |
| `resolve(path)` | ओ(खंड) मैप खोज | पथ काट के अलावा ओ(१) | बच्चा गायब हो तो जल्दी फेल |
| पूरा वृक्ष भंडारण | - | ओ(न) एंट्री | न = फ़ाइलें + डायरेक्टरी |

इंटरव्यूअर चाहते हैं कि तुमने वृक्ष चुना, मेटाडेटा साझा किया, आकार पुनरावर्ती रखा; पथ कैश का सूक्ष्म अनुकूलन नहीं।

---

## ६. किनारे के मामले और आम गलतियाँ

ये छूते हैं:

* **जड़ मिटाना:** `parent == null`, इसलिए `delete()` झूठा लौटाता है। नल संकेतक अपवाद नहीं।
* **एक डायरेक्टरी में डुप्लिकेट नाम:** जोड़ पर मना करो, या शुरू में अधिलेखन नीति तय करो।
* **बच्चे घूमते समय मिटाना:** मैप से नाम से हटाओ; सिर्फ सूची पहचान पर भरोसा मत करो।
* **खाली जड़ नाम:** पथ प्रारूप `/` + बच्चे का नाम से शुरू हो सकता है। एक नियम पर टिके रहो।
* **फ़ाइल में घुसना:** अगर कोई गैर-डायरेक्टरी खंड आखिरी नहीं है तो `resolve` रुके या फेल हो।
* **चक्र:** सामान्य बनाओ एपीआई कभी डायरेक्टरी को अपना पूर्वज नहीं बनाती। अगर `move` जोड़ो तो चक्र जाँचो।
* **नल सामग्री:** खाली स्ट्रिंग मानो; आकार ०।
* **गहरे वृक्ष:** पुनरावर्ती `size()` स्टैक उड़ा सकता है; मजबूती के लिए पुनरावृत्तीय घूमना बताओ।

आम गलतियाँ:

१. **साझा आधार नहीं।** फ़ाइल और डायरेक्टरी में समय चिह्न कॉपी-पेस्ट, फिर एक विधि भूल जाना।
२. **डायरेक्टरी आकार = सिर्फ सीधे बच्चे।** अक्सर पुनरावर्ती कुल बाइट चाहिए।
३. **अद्वितीय नाम के बिना सूची।** एक फ़ोल्डर में दो `notes.txt`, खोज अस्पष्ट।
४. **मिटाने पर अभिभावक साफ न करना।** अनाथ अभी भी उस डायरेक्टरी की ओर इशारा करता है जो उसे सूची में नहीं रखती।
५. **पूरा ओएस बनाना।** काम का वृक्ष आने से पहले ब्लॉक, अनुमतियाँ, माउंट।
६. **सिर्फ सपाट फ़ाइल मैप।** वह कुंजी-मान भंडार है, पदानुक्रमित फ़ाइल सिस्टम नहीं।

न्यूनतम धुआँ परीक्षण विचार:

```java
Directory root = new Directory("", null);
Directory a = new Directory("a", null);
File f = new File("f.txt", null, 0);
root.addEntry(a);
a.addEntry(f);
f.setContents("hi"); // size 2
assert a.size() == 2;
assert root.resolve("a/f.txt") == f;
assert f.delete();
assert a.getChild("f.txt") == null;
```

---

## ७. दोस्त को समझाओ सार

स्मृति में फ़ाइल सिस्टम डिज़ाइन, इंटरव्यू संस्करण:

१. **वृक्ष** मॉडल करो, डिस्क नहीं।
२. साझा फ़ील्ड अमूर्त **`Entry`** पर: नाम, अभिभावक, समय, `delete`, `getFullPath`, अमूर्त `size()`।
३. **`File`** सामग्री रखे और अपना आकार लौटाए।
४. **`Directory`** बच्चों का मैप रखे, आकार पुनरावृत्ति से जोड़े, एंट्री जोड़े और हटाए।
५. पथ घूमना है: `/` पर काटो, हर नाम ढूँढो, गायब पर साफ फेल।
६. साधारण शुरू करो। लिंक, अनुमतियाँ, कैश आकार तब फॉलो-अप जब वृक्ष मजबूत हो।

अगर पदानुक्रम बना सकते हो, बता सकते हो `size()` बहुरूपी क्यों है, और छोटे उदाहरण पर जोड़/मिटा/पथ दिखा सकते हो, तो समस्या ७.११ तुम्हारी है।

---

## श्रृंखला

* गाइड: [सीटीसीआई श्रृंखला गाइड](/blog/hi/ctci-series-guide)
* पिछला: [माइंसवीपर](/blog/hi/ctci-7-10-minesweeper)
* अगला: [हैश टेबल](/blog/hi/ctci-7-12-hash-table)