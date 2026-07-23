---
title: "ज़्यूनिफाई: आधुनिक वेब के लिए प्रतिष्ठित ज़्यून प्लेयर की नई कल्पना"
description: "ज़्यूनिफाई पर एक नज़र: एक हल्का, ऑफ़लाइन-फर्स्ट म्यूज़िक प्लेयर जो एंगुलर 19, डेक्सी.जेएस और फ़ाइल सिस्टम एक्सेस एपीआई का उपयोग करके 2000 के दशक के उत्तरार्ध के टाइपोग्राफी-केंद्रित ज़्यून इंटरफ़ेस को वापस लाता है।"
date: 2026-07-09
tags: [एंगुलर, वेब विकास, डेटाबेस]
coverImage: /assets/images/zunify-music.webp
previewImage: /assets/images/zunify-music.webp
---

2000 के दशक के उत्तरार्ध में, माइक्रोसॉफ्ट ने ज़्यून पेश किया था, एक डिजिटल मीडिया प्लेयर, जिसने अपनी विशिष्ट डिज़ाइन शैली के लिए प्रशंसकों का एक समर्पित समूह बनाया। इसका "मेट्रो" इंटरफ़ेस टाइपोग्राफी-केंद्रित, न्यूनतम, उच्च-विपरीत था और साफ़-सुथरे डिजिटल लेआउट पर केंद्रित था।

**ज़्यूनिफाई** उस इंटरफ़ेस के लिए एक आधुनिक श्रद्धांजलि है। यह एक हल्का, ऑफ़लाइन-फर्स्ट प्रोग्रेसिव वेब ऐप (पीडब्ल्यूए) है जो आपके स्थानीय संगीत संग्रह को सीधे आपके ब्राउज़र में सिंक करता है, बिना किसी सर्वर अपलोड या ट्रैकर के।

* **गिटहब रिपॉजिटरी:** [ज़्यूनिफाई गिटहब](https://github.com/breejesh/zunify)
* **लाइव डेमो:** [ज़्यूनिफाई डेमो](https://zunify.breejeshrathod.com/)

---

## ऐप इंटरफ़ेस और स्क्रीन शोकेस

ज़्यूनिफाई कैसा दिखता है और कैसे काम करता है, आइए इसकी स्क्रीन और उपयोगकर्ता प्रवाह को देखें।

### 1. होम हब
स्टार्टअप स्क्रीन आपके प्लेबैक इतिहास, सबसे अधिक बार बजाए गए ट्रैक और पसंदीदा गानों तक त्वरित पहुंच प्रदान करती है।

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/home.png" width="600" alt="ज़्यूनिफाई होम स्क्रीन">
</p>

---

### 2. संगीत संग्रह और नेविगेशन
मूल माइक्रोसॉफ्ट ज़्यून क्लाइंट से सीधे प्रेरित एक स्वच्छ, टाइपोग्राफी-केंद्रित सूची लेआउट में एल्बम, कलाकारों और प्लेलिस्ट का पता लगाएं।

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/collection.png" width="600" alt="ज़्यूनिफाई संगीत संग्रह">
</p>

---

### 3. प्लेयर हब (अभी चल रहा)
दो अलग-अलग टाइपोग्राफी लेआउट जो एल्बम आर्ट रंगों के आधार पर पृष्ठभूमि के रंगों को गतिशील रूप से बदलते हैं।

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/now-playing-1.png" width="280" alt="अभी चल रहा लेआउट 1">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/now-playing-2.png" width="280" alt="अभी चल रहा लेआउट 2">
</p>

---

### 4. सेटिंग्स और निर्देशिका सिंक्रनाइज़ेशन
इंडेक्सडीडीबी सेटिंग्स और फ़ाइल सिस्टम अनुमति जाँच का उपयोग करके फ़ाइलें सिंक करें।

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/settings.png" width="600" alt="ज़्यूनिफाई सेटिंग्स">
</p>

---

## ज़्यूनिफाई का मूल आर्किटेक्चर

पारंपरिक संगीत प्लेटफ़ॉर्म या क्लाउड-आधारित प्लेयर के विपरीत, ज़्यूनिफाई को किसी बैकएंड सर्वर की आवश्यकता नहीं होती है। यह पूरी तरह से आपके ब्राउज़र में चलता है और आपके कंप्यूटर के फ़ाइल सिस्टम से सीधे संगीत पढ़ता है।

इसे संभव बनाने के लिए, ज़्यूनिफाई आधुनिक वेब तकनीकों पर निर्भर करता है:

### 1. फ़ाइल सिस्टम एक्सेस एपीआई
सामान्यतः, वेब ऐप्स केवल फ़ाइल पिकर इनपुट के माध्यम से फ़ाइलों के साथ इंटरैक्ट कर सकते हैं। ज़्यूनिफाई स्थानीय संगीत निर्देशिका तक पहुंच का अनुरोध करने के लिए आधुनिक **फ़ाइल सिस्टम एक्सेस एपीआई** (`showDirectoryPicker`) का उपयोग करता है।

एक बार अनुमति मिलने के बाद, ऐप को एक स्थायी `FileSystemDirectoryHandle` प्राप्त होता है। इस हैंडल को इंडेक्सडीडीबी में सहेजकर, ज़्यूनिफाई बाद में ऐप शुरू होने पर पुनः पढ़ने की अनुमति मांग सकता है।

### 2. डेक्सी.जेएस के माध्यम से इंडेक्सडीडीबी
सैकड़ों ऑडियो फ़ाइलों को स्कैन करना, मेटाडेटा निकालना और एल्बम आर्ट लोड करना काफी प्रक्रियात्मक कार्य है। अगली बार ऐप खोलने पर लोडिंग को त्वरित बनाने के लिए, ज़्यूनिफाई **डेक्सी.जेएस** का उपयोग करके **इंडेक्सडीडीबी** में लाइब्रेरी संरचना को सहेजता है।

डेक्सी ट्रैक के नाम, कलाकारों, एल्बमों, शैलियों और प्ले काउंट्स को इंडेक्स करता है, जिससे ब्राउज़र के स्थानीय डेटाबेस में सीधे तीव्र खोज, इतिहास ट्रैकिंग और कस्टम प्लेलिस्ट बनाने की सुविधा मिलती है।

### 3. वेब ऑडियो एपीआई और मेटाडेटा पार्सिंग
ज़्यूनिफाई ब्राउज़र के भीतर ऑडियो फ़ाइलों को स्कैन और पार्स करने के लिए `music-metadata-browser` का उपयोग करता है। यह आईडी3वी2 मेटाडेटा, नमूना दर, बिटरेट, गीत और एम्बेडेड एल्बम कवर निकालता है। पार्स होने के बाद, ऑडियो फ़ाइलों को सीधे एचटीएमएल5 `<audio>` संदर्भ में स्ट्रीम किया जाता है।

---

## तकनीकी उदाहरण: एंगुलर में फ़ाइल सिस्टम एक्सेस एपीआई लागू करना

ब्राउज़र रीस्टार्ट के बाद निर्देशिका अनुमतियों को बनाए रखने का कोड:

```typescript
import { Injectable } from '@angular/core';
import Dexie from 'dexie';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private db = new Dexie('ZunifyLibrary');

  constructor() {
    this.db.version(1).stores({
      settings: 'key',
      tracks: '++id, title, artist, album, genre, path',
    });
  }

  // Request directory access and save the handle
  async selectLibraryDirectory(): Promise<void> {
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'read'
      });
      
      // Store the directory handle in Dexie settings table
      await this.db.table('settings').put({ key: 'dirHandle', value: handle });
      await this.scanDirectory(handle);
    } catch (err) {
      console.error('Directory access rejected:', err);
    }
  }

  // Verify and request permission for the cached handle on app startup
  async verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
    const opts = { mode: 'read' };
    if ((await handle.queryPermission(opts)) === 'granted') {
      return true;
    }
    if ((await handle.requestPermission(opts)) === 'granted') {
      return true;
    }
    return false;
  }
}
```

### स्कैनिंग चरण

एक बार निर्देशिका पहुंच की अनुमति मिलने के बाद, ज़्यूनिफाई फ़ोल्डर संरचना को स्कैन करता है तथा ऑडियो फ़ाइल एक्सटेंशन (`.mp3`, `.m4a`, `.ogg`, `.flac`) की जांच करता है:

```typescript
async scanDirectory(directoryHandle: FileSystemDirectoryHandle): Promise<void> {
  const tracks: any[] = [];
  
  for await (const entry of (directoryHandle as any).values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      if (this.isAudioFile(file.name)) {
        const metadata = await this.parseAudioMetadata(file);
        tracks.push({
          title: metadata.title || file.name,
          artist: metadata.artist || 'Unknown Artist',
          album: metadata.album || 'Unknown Album',
          fileHandle: entry
        });
      }
    } else if (entry.kind === 'directory') {
      await this.scanDirectory(entry);
    }
  }
  
  await this.db.table('tracks').bulkPut(tracks);
}
```

---

## पीडब्ल्यूए ऑडियो प्लेयर बनाने की चुनौतियाँ

वेब ब्राउज़र के भीतर स्थानीय मीडिया प्लेयर बनाने में कुछ सीमाएँ आती हैं:

### 1. फ़ाइल अनुमति की स्थिति
सुरक्षा कारणों से, ब्राउज़र पृष्ठ के बंद होने पर फ़ाइल सिस्टम की अनुमतियों को रीसेट कर देता है। यद्यपि `FileSystemDirectoryHandle` इंडेक्सडीडीबी में सहेजा रहता है, उपयोगकर्ता को पुनः पढ़ने की अनुमति की पुष्टि करनी होती है।

### 2. स्थानीय हैंडल से ऑडियो स्ट्रीमिंग
ब्राउज़र सीधे स्थानीय फ़ाइल हैंडल को `<audio>` टैग से नहीं जोड़ सकते। ज़्यूनिफाई `URL.createObjectURL(file)` का उपयोग करके अस्थायी यूआरएल बनाकर इसे हल करता है और पुराना यूआरएल स्वतः निरस्त कर देता है।

### 3. मीडिया सत्र एकीकरण
ज़्यूनिफाई **मीडिया सेशन एपीआई** को एकीकृत करता है। यह वैश्विक मीडिया नियंत्रण (कीबोर्ड प्ले/पॉज़, हेडसेट बटन, ओएस नोटिफिकेशन विजेट) को ब्राउज़र के प्लेबैक इंजन से जोड़ता है:

```typescript
navigator.mediaSession.metadata = new MediaMetadata({
  title: currentTrack.title,
  artist: currentTrack.artist,
  album: currentTrack.album,
  artwork: [
    { src: currentTrack.coverUrl || 'assets/default-art.png', sizes: '512x512', type: 'image/png' }
  ]
});

navigator.mediaSession.setActionHandler('play', () => this.playbackService.play());
navigator.mediaSession.setActionHandler('pause', () => this.playbackService.pause());
navigator.mediaSession.setActionHandler('nexttrack', () => this.playbackService.next());
navigator.mediaSession.setActionHandler('previoustrack', () => this.playbackService.previous());
```

---

## ऑफ़लाइन-फर्स्ट वेब एप्लीकेशन का महत्व

ज़्यूनिफाई स्थानीय-पहले सॉफ़्टवेयर का एक उदाहरण है। आधुनिक वेब एपीआई के साथ आप समृद्ध ऐप्स बना सकते हैं जो:

* पूरी तरह से क्लाइंट-साइड पर चलते हैं, जिससे **सर्वर की कोई लागत नहीं** आती।
* बिना किसी इंटरनेट कनेक्शन के चलते हैं, जिससे उपयोगकर्ता का डेटा निजी रहता है।
* सुरक्षित ब्राउज़र वातावरण में नेटिव-ऐप जैसा अनुभव प्रदान करते हैं।

यदि आप स्थानीय सॉफ़्टवेयर के लिए फ़ाइल सिस्टम एक्सेस एपीआई का एक व्यावहारिक उदाहरण देखना चाहते हैं, तो ज़्यूनिफाई ओपन-सोर्स प्रोजेक्ट के रूप में उपलब्ध है। [ज़्यूनिफाई](https://zunify.breejeshrathod.com/) पर अपना स्थानीय संगीत फ़ोल्डर खोलकर इसे आज़मा सकते हैं।
