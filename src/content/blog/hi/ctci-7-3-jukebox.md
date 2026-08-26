---
title: "जूकबॉक्स: गाने, प्लेलिस्ट, कैटलॉग, यूज़र और भुगतान (जावा ओओडी)"
description: "शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.३: ऑब्जेक्ट-ओरिएंटेड क्लासों से म्यूज़िकल जूकबॉक्स डिज़ाइन करो। सॉन्ग, प्लेलिस्ट, सीडी कैटलॉग, यूज़र और सिक्का भुगतान मॉडल करो, फिर प्ले कतार के चारों ओर केंद्रित जावा स्केच जोड़ो।"
date: "2025-08-06"
tags: [एल्गोरिदम और डेटा संरचनाएं]
coverImage: /assets/images/ctci-7-3-jukebox.webp
previewImage: /assets/images/ctci-7-3-jukebox.webp
---


> **टीएल;डीआर**
> * **समस्या:** डेटा संरचनाओं और एल्गोरिदम के लिए समय और स्थान जटिलता (टाइम एंड स्पेस कॉम्प्लेक्सिटी) का अनुकूलन।
> * **दृष्टिकोण:** शुरुआती लोगों के लिए सीटीसीआई शैली की समस्या ७.३: ऑब्जेक्ट-ओरिएंटेड क्लासों से म्यूज़िकल जूकबॉक्स डिज़ाइन करो। सॉन्ग, प्लेलिस्ट, सीडी कैटलॉग, यूज़र और सिक्का भुगतान मॉडल करो, फिर प्ले कतार के चारों ओर केंद्रित जावा स्केच जोड़ो।
> * **जटिलता:** सीमांत मामलों (एज केसेस) के प्रबंधन के साथ इष्टतम समय और मेमोरी संतुलन।

**जूकबॉक्स** एक संगीत मशीन है जहाँ लोग पास आकर गाने चुनते हैं और क्रम से सुनते हैं। इंटरव्यू में यह एमपी३ कोडेक की बात नहीं। बात **ऑब्जेक्ट** की है, **कौन क्या रखता है** की है, और **कौन सी मेथड सिक्के से स्पीकर तक अनुरोध ले जाती है** की है।

यह पोस्ट शुरुआती लोगों के लिए **जावा** में मूल शिक्षण है। क्लासिक ऑब्जेक्ट-ओरिएंटेड डिज़ाइन प्रॉम्प्ट का परिवार, किताब की नकल नहीं। [सीटीसीआई जावा सीरीज़](/blog/hi/ctci-series-guide) का हिस्सा। अध्याय ७, ऑब्जेक्ट-ओरिएंटेड डिज़ाइन, समस्या ७.३।

---

## १. रोज़मर्रा की उपमा

डाइनर की बूथ मशीन सोचो: काँच का अगला हिस्सा, सिक्कों की स्लॉट।

* अंदर **कैटलॉग** है सीडी का। हर सीडी में कई **गाने**।
* पैसे डालो। मशीन **क्रेडिट** जोड़ती है।
* सीडी चुनो, फिर ट्रैक। क्रेडिट काफी हो तो ट्रैक **प्लेलिस्ट** (कतार) में जाता है।
* मौजूदा गाना खत्म होने पर कतार का अगला शुरू।
* बाद में कोई और आ सकता है, अपने सिक्के डाले, और और गाने कतार में डाले।

कोड को क्रोम बॉक्स नहीं खींचना। वही काम करने हैं: कैटलॉग, भुगतान, चयन, कतार, प्ले।

---

## २. डिज़ाइन से पहले साफ करो

ओओडी प्रॉम्प्ट जानबूझकर धुँधले रहते हैं। पूछो, फिर **मान्यताएँ ज़ोर से बोलो**।

काम के सवाल:

* भौतिक सीडी, रिकॉर्ड, या सिर्फ डिजिटल फ़ाइलें?
* मुफ़्त या भुगतान? नकद, सिक्के, कार्ड, या खाता क्रेडिट?
* एक समय एक यूज़र, या एक साथ कई सेशन?
* क्या वही गाना कतार में दो बार आ सकता है?
* वॉल्यूम, स्किप, स्टॉप कौन चलाता है: सिर्फ मशीन, या मौजूदा यूज़र?

**इस पोस्ट की मान्यताएँ:**

* **भौतिक शैली** जूकबॉक्स सिमुलेशन, **सीडी कैटलॉग** के साथ।
* **सिक्का भुगतान**: पैसे डालो, हर गाने पर क्रेडिट खर्च।
* **एक सक्रिय यूज़र सेशन** (बार मशीन जैसी)।
* गाने आईडी से चुनो (या सीडी + ट्रैक इंडेक्स)।
* प्लेलिस्ट **एफआईएफओ कतार** है। वही गाना एक से ज़्यादा बार कतार में जा सकता है।
* एक समय एक ट्रैक। स्किप/स्टॉप जूकबॉक्स पर वैकल्पिक मेथड।

अगर इंटरव्यूअर मुफ़्त अनलिमिटेड प्ले या मल्टी-यूज़र खाते चाहे, भुगतान और `User` की मिल्कियत बदलो। बाकी आकार अक्सर वही काम करता है।

---

## ३. समस्या सादे शब्दों में

**लक्ष्य:** ऑब्जेक्ट-ओरिएंटेड सिद्धांतों से म्यूज़िकल जूकबॉक्स की क्लासें डिज़ाइन करो।

**मुख्य काम:**

| काम | मालिक का विचार |
| --- | --- |
| गाने जानना और वे किस सीडी पर हैं | `Song`, `CD`, `Catalog` |
| आने वाले ट्रैक रखना | `Playlist` (कतार) |
| मशीन कौन चला रहा है और क्रेडिट कितना | `User` |
| पैसे लेना और चयन पर चार्ज | `Jukebox` पर भुगतान मेथड / `User` पर क्रेडिट |
| चुनो, भुगतान, कतार, प्ले समन्वय | `Jukebox` मुखौटा |

**लोग सच में जो करते हैं:**

१. सिक्के डालो → क्रेडिट पाओ।
२. कैटलॉग देखो → गाना चुनो।
३. क्रेडिट काफी हो तो कीमत काटो और कतार में डालो।
४. मौजूदा गाना चलाओ; खत्म हो तो अगला निकालो।
५. वैकल्पिक: स्किप, कतार साफ, यूज़र बदलो।

**सिग्नेचर का आकार (केंद्रित एपीआई):**

```java
void insertCoin(int cents);
boolean selectSong(String songId); // false if unknown or not enough credit
Song nowPlaying();
Song nextUp();
void skip(); // end current, start next if any
```

बाद में बढ़ा सकते हो। इंटरव्यू पहले **छोटा, साफ सतह** पुरस्कृत करते हैं।

---

## ४. पहले सोचो: ऑब्जेक्ट और ज़िम्मेदारियाँ

### डेटा ऑब्जेक्ट

* **`Song`**: आईडी, शीर्षक, कलाकार, अवधि सेकंड में, कीमत सेंट में। वैकल्पिक पैरेंट सीडी आईडी।
* **`CD`**: आईडी, शीर्षक, कलाकार, गानों की क्रमबद्ध सूची।
* **`Catalog`**: सीडी का मैप या सेट; पूरे संग्रह में आईडी से गाना खोज।

ये ज़्यादातर डेटा और सरल गेटर्स रहें। कैटलॉग खोज का मालिक हो ताकि `Jukebox` दस जगह हर सीडी पर हाथ से लूप न लगाए।

### व्यवहार ऑब्जेक्ट

* **`Playlist`**: `Song` की कतार। मेथड: `queue(Song)`, `peek()`, `poll()`, `isEmpty()`, शायद `size()`।
* **`User`**: आईडी, नाम, मौजूदा क्रेडिट सेंट में। मेथड: `addCredit`, `charge` (या जाँच + काटना)।
* **`Jukebox`**: कैटलॉग, प्लेलिस्ट, मौजूदा यूज़र, चल रहा गाना। यूज़र-मुखर क्रियाएँ यहीं।

### भुगतान बिना ज़्यादा निर्माण

इंटरव्यू में बैंक एसडीके नहीं चाहिए। साफ मॉडल:

* `insertCoin(cents)` मौजूदा यूज़र के क्रेडिट में जोड़ता है।
* हर `Song` की कीमत (या जूकबॉक्स पर एक समान कीमत)।
* क्रेडिट < कीमत हो तो `selectSong` फेल।
* सफल होने पर कीमत काटो, कतार में डालो, और अगर कुछ नहीं चल रहा तो गाना शुरू करो।

अगर छुट्टे पैसे मायने रखते हैं, `dispenseChange()` जोड़ो जो जाने पर बचा क्रेडिट लौटाए। तब तक क्रेडिट यूज़र पर रहने दो।

### कौन किससे बात करता है

```
User --inserts coins / picks--> Jukebox
Jukebox --looks up--> Catalog --has--> CD --has--> Song
Jukebox --charges--> User
Jukebox --queues--> Playlist
Jukebox --plays--> current Song (from Playlist)
```

`Song` को सिक्कों का ज्ञान नहीं होना चाहिए। `Playlist` को सीडी का नहीं। यही अलगाव अभ्यास का मतलब है।

---

## ५. केंद्रित जावा स्केच

इंटरव्यू आकार, प्रोडक्ट नहीं। नाम छोटे; असली हार्डवेयर और ऑडियो थ्रेड बाहर।

```java
import java.util.*;

final class Song {
    final String id;
    final String title;
    final String artist;
    final int durationSec;
    final int priceCents;

    Song(String id, String title, String artist, int durationSec, int priceCents) {
        this.id = id;
        this.title = title;
        this.artist = artist;
        this.durationSec = durationSec;
        this.priceCents = priceCents;
    }
}

final class CD {
    final String id;
    final String title;
    final List<Song> tracks;

    CD(String id, String title, List<Song> tracks) {
        this.id = id;
        this.title = title;
        this.tracks = List.copyOf(tracks);
    }
}

final class Catalog {
    private final Map<String, Song> songsById = new HashMap<>();
    private final Map<String, CD> cdsById = new HashMap<>();

    void addCD(CD cd) {
        cdsById.put(cd.id, cd);
        for (Song s : cd.tracks) {
            songsById.put(s.id, s);
        }
    }

    Song findSong(String songId) {
        return songsById.get(songId);
    }

    Collection<CD> allCDs() {
        return Collections.unmodifiableCollection(cdsById.values());
    }
}

final class Playlist {
    private final Deque<Song> queue = new ArrayDeque<>();

    void queue(Song s) { queue.addLast(s); }
    Song peek() { return queue.peekFirst(); }
    Song poll() { return queue.pollFirst(); }
    boolean isEmpty() { return queue.isEmpty(); }
    int size() { return queue.size(); }
}

final class User {
    final String id;
    final String name;
    private int creditCents;

    User(String id, String name) {
        this.id = id;
        this.name = name;
    }

    int credit() { return creditCents; }

    void addCredit(int cents) {
        if (cents < 0) throw new IllegalArgumentException("cents");
        creditCents += cents;
    }

    boolean charge(int cents) {
        if (cents < 0 || creditCents < cents) return false;
        creditCents -= cents;
        return true;
    }
}

final class Jukebox {
    private final Catalog catalog;
    private final Playlist playlist = new Playlist();
    private User currentUser;
    private Song playing; // null if idle

    Jukebox(Catalog catalog, User user) {
        this.catalog = catalog;
        this.currentUser = user;
    }

    void setUser(User user) {
        this.currentUser = Objects.requireNonNull(user);
    }

    void insertCoin(int cents) {
        currentUser.addCredit(cents);
    }

    /** Returns true if the song was paid for and queued (or started). */
    boolean selectSong(String songId) {
        Song song = catalog.findSong(songId);
        if (song == null) return false;
        if (!currentUser.charge(song.priceCents)) return false;

        if (playing == null) {
            playing = song;
        } else {
            playlist.queue(song);
        }
        return true;
    }

    Song nowPlaying() { return playing; }

    Song nextUp() { return playlist.peek(); }

    /** Finish current track and start the next queued song, if any. */
    void onTrackFinished() {
        playing = playlist.poll();
    }

    void skip() {
        onTrackFinished();
    }
}
```

### छोटा वॉक-थ्रू

```
catalog has CD "Hits" with song S1 ($1.00) and S2 ($1.00)
user credit = 0
insertCoin(200)           -> credit 200
selectSong("S1")          -> charge 100, playing = S1
selectSong("S2")          -> charge 100, queue = [S2]
nowPlaying()              -> S1
nextUp()                  -> S2
onTrackFinished()         -> playing = S2, queue empty
selectSong("S1")          -> false (credit 0)
```

यह रास्ता डिज़ाइन बचाने के लिए काफी है: पैसे अंदर, खोज, चार्ज, कतार, आगे बढ़ना।

---

## ६. इंटरव्यूअर क्या सुनता है

| संकेत | क्यों मायने रखता है |
| --- | --- |
| मुफ़्त बनाम भुगतान, सीडी बनाम डिजिटल पूछा | गलत प्रोडक्ट नहीं गढ़ते |
| साफ मिल्कियत (कैटलॉग बनाम प्लेलिस्ट बनाम यूज़र) | बेमेल फ़ील्ड वाली गॉड क्लास से बचाव |
| प्लेलिस्ट कतार के रूप में | असली प्ले क्रम से मेल |
| भुगतान फेल पथ | `selectSong` नकारात्मक जाने के बजाय `false` |
| छोटा मुखौटा एपीआई | फ्रेमवर्क लिखे बिना २० मिनट बात |
| "यह एक डिज़ाइन है" | ओओडी के कई वैध आकार |

अगर वे धक्का दें तो वैकल्पिक विस्तार:

* सीडी से **शफल / रैंडम** बिना प्रति ट्रैक भुगतान (रेडियो मोड)।
* **डिस्प्ले** ऑब्जेक्ट: शीर्षक, बचा समय, क्रेडिट।
* **सॉन्गसेलेक्टर** सहायक जो आखिरी ब्राउज़ की सीडी याद रखे।
* **थ्रेड या टाइमर** जो `durationSec` बाद `onTrackFinished` बुलाए (ज़िक्र करो, लागू मत करो)।

जब तक प्रॉम्प्ट नेटवर्क संगीत सेवा न बने, डेटाबेस, रेस्ट एपीआई, माइक्रोसर्विस मत घसीटो।

---

## ७. किनारे के मामले और आम गलतियाँ

इंटरव्यूअर यहाँ चुभोते हैं:

* **अज्ञात गाना आईडी:** `false` या साफ डोमेन त्रुटि। `null` कतार में मत डालो।
* **कम क्रेडिट:** कतार और प्ले वैसी रहें; आधा चार्ज नहीं।
* **खाली कैटलॉग:** हर चयन फेल; बोलो।
* **खाली मशीन:** `playing == null` और खाली कतार। पहला सफल चयन प्ले शुरू करे, सिर्फ कतार में न डाले।
* **खाली पर स्किप:** `playing` `null` हो जाए; ठीक।
* **कतार बीच में यूज़र बदलना:** तय करो कतार मशीन की है (रहती है) या सेशन की (साफ)। नियम बोलो।
* **नकारात्मक सिक्के:** `insertCoin` / `addCredit` में अस्वीकार।
* **सीडी के बीच डुप्लिकेट गाना आईडी:** कैटलॉग `put` नीति तय करो (आखिरी जीते कहना ठीक)।

आम गलतियाँ:

१. **एक विशाल `Jukebox` क्लास** स्ट्रिंग ऐरे के साथ, बिना `Song` टाइप।
२. **प्लेलिस्ट को `List` बनाकर रैंडम इंडेक्स** जब समस्या जूकबॉक्स कतार है।
३. **कतार के बाद चार्ज** ताकि फेल होने पर मुफ़्त गाना कतार में रह जाए।
४. **`Song` को `User` या भुगतान टाइप पर निर्भर** करना।
५. **पूरा रिकॉर्ड उद्योग** (एल्बम, रॉयल्टी, डीआरएम) मॉडल करना जब डाइनर बॉक्स माँगा था।
६. **खाली → पहला गाना** रास्ता भूलना ताकि दूसरा चयन तक कुछ शुरू ही न हो।

न्यूनतम धुआँ विचार:

```java
// build catalog with two songs at 100 cents each
Jukebox box = new Jukebox(catalog, new User("u1", "Alex"));
box.insertCoin(150);
assert box.selectSong("S1");
assert box.nowPlaying().id.equals("S1");
assert !box.selectSong("S2"); // only 50 cents left
box.insertCoin(50);
assert box.selectSong("S2");
assert box.nextUp().id.equals("S2");
box.skip();
assert box.nowPlaying().id.equals("S2");
```

---

## ८. दोस्त को समझाओ सार

डाइनर जूकबॉक्स को नेटवर्क चित्रों में नहीं, ऑब्जेक्ट में डिज़ाइन करो।

१. **सीमाएँ पूछो:** मीडिया प्रकार, पैसे, एक यूज़र बनाम कई।
२. **`Song` / `CD` / `Catalog`** चलाए जा सकने वाला सामग्री रखते हैं।
३. **`Playlist`** भुगतान किए चयनों की एफआईएफओ कतार है।
४. **`User`** क्रेडिट रखता है; सिक्के बढ़ाते हैं; हर चयन चार्ज करने की कोशिश करता है।
५. **`Jukebox`** मुखौटा है: सिक्का डालो, गाना चुनो, अब चल रहा, स्किप / ट्रैक खत्म।
६. भुगतान सरल: पूर्णांक सेंट, कंगाल होने पर बंद फेल।
७. पहला भुगतान किया गाना तुरंत शुरू; बाद वाले कतार में प्रतीक्षा।

अगर सिक्के से कैटलॉग खोज, चार्ज, कतार तक तीर खींच सको बिना एक क्लास के सब कुछ करने के, समस्या ७.३ तुम्हारी है। अध्याय ७ यही आदत पुरस्कृत करता है: संज्ञाएँ नाम दो, हर एक को एक काम दो, सार्वजनिक एपीआई छोटी रखो।

---

## श्रृंखला

* गाइड: [सीटीसीआई श्रृंखला गाइड](/blog/hi/ctci-series-guide)
* पिछला: [कॉल सेंटर](/blog/hi/ctci-7-2-call-center)
* अगला: [पार्किंग लॉट](/blog/hi/ctci-7-4-parking-lot)