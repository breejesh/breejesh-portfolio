---
title: "Zunify: आधुनिक वेब के लिए प्रतिष्ठित Zune प्लेयर की नई कल्पना"
description: "Zunify का एक गहरा विश्लेषण—एक हल्का, ऑफलाइन-फर्स्ट म्यूजिक प्लेयर जो Angular 19, Dexie.js और File System Access API का उपयोग करके 2000 के दशक के उत्तरार्ध के टाइपोग्राफी-केंद्रित Zune इंटरफ़ेस को वापस लाता है।"
date: 2026-07-09
tags: [Angular, PWA, IndexedDB, Dexie, Web Audio, File System Access API]
coverImage: /assets/images/zunify-music.webp
previewImage: /assets/images/zunify-music.webp
---

2000 के दशक के उत्तरार्ध में, Microsoft ने Zune पेश किया था—एक डिजिटल मीडिया प्लेयर, जिसने iPod से बाजार हिस्सेदारी छीनने के संघर्ष के बावजूद, अपनी क्रांतिकारी डिजाइन भाषा के लिए प्रशंसकों का एक समर्पित समूह अर्जित किया था। इसका "Metro" इंटरफ़ेस टाइपोग्राफी-केंद्रित, न्यूनतम (minimalist), उच्च-विपरीत (high-contrast) था और भौतिक वस्तुओं की नकल करने (skeuomorphism) के बजाय साफ-सुथरे डिजिटल लेआउट पर केंद्रित था।

**Zunify** उस महान इंटरफ़ेस के लिए एक आधुनिक श्रद्धांजलि है। यह एक हल्का, ऑफलाइन-फर्स्ट प्रोग्रेसिव वेब ऐप (PWA) है जो आपके स्थानीय संगीत संग्रह (local music library) को सीधे आपके ब्राउज़र में सिंक करता है—शून्य सर्वर अपलोड, शून्य ट्रैकर्स और 100% गोपनीयता के साथ।

* **GitHub रिपॉजिटरी:** [github.com/breejesh/zunify](https://github.com/breejesh/zunify)
* **लाइव डेमो:** [zunify.breejeshrathod.com](https://zunify.breejeshrathod.com/)

---

## ऐप इंटरफ़ेस और स्क्रीन शोकेस

Zunify कैसा दिखता है और कैसे काम करता है, आइए इसकी स्क्रीन और यूजर फ्लो को देखें।

### 1. होम / क्विकप्ले हब
स्टार्टअप स्क्रीन आपके प्लेबैक इतिहास, सबसे अधिक बार बजाए गए ट्रैक और पसंदीदा गानों तक त्वरित पहुंच प्रदान करती है।

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/home.png" width="600" alt="Zunify Home Screen">
</p>

---

### 2. संगीत संग्रह और नेविगेशन
मूल Microsoft Zune क्लाइंट से सीधे प्रेरित एक स्वच्छ, टाइपोग्राफी-केंद्रित सूची लेआउट में एल्बम, कलाकारों और प्लेलिस्ट का पता लगाएं।

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/collection.png" width="600" alt="Zunify Music Collection">
</p>

---

### 3. नाउ प्लेइंग हब (Now Playing Hub)
दो अलग-अलग टाइपोग्राफी लेआउट जो एल्बम आर्ट रंगों के आधार पर पृष्ठभूमि के रंगों को गतिशील रूप से बदलते हैं।

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/now-playing-1.png" width="280" alt="Now Playing Layout 1">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/now-playing-2.png" width="280" alt="Now Playing Layout 2">
</p>

---

### 4. सेटिंग्स और निर्देशिका सिंक्रनाइज़ेशन
IndexedDB सेटिंग्स और फ़ाइल सिस्टम अनुमति सत्यापन वर्कफ़्लो का उपयोग करके फ़ाइलों को आसानी से सिंक करें।

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/zunify/main/doc-images/settings.png" width="600" alt="Zunify Settings">
</p>

---

## Zunify का मूल आर्किटेक्चर (Core Architecture)

पारंपरिक संगीत स्ट्रीमिंग साइटों या क्लाउड-आधारित प्लेयर के विपरीत, Zunify को किसी बैकएंड सर्वर की आवश्यकता नहीं होती है। यह पूरी तरह से आपके ब्राउज़र में चलता है और आपके कंप्यूटर के फाइल सिस्टम से सीधे संगीत पढ़ता है।

इसे संभव बनाने के लिए, Zunify आधुनिक वेब तकनीकों पर निर्भर करता है:

### 1. File System Access API
आमतौर पर, वेब ऐप्स केवल फाइल पिकर इनपुट के माध्यम से फाइलों के साथ इंटरैक्ट कर सकते हैं, जिससे उपयोगकर्ता को हर बार फाइल को फिर से चुनना पड़ता है। Zunify स्थानीय संगीत निर्देशिका (local music directory) तक पहुंच का अनुरोध करने के लिए आधुनिक **File System Access API** (`showDirectoryPicker`) का उपयोग करता है।

एक बार अनुमति मिलने के बाद, ऐप को एक स्थायी `FileSystemDirectoryHandle` प्राप्त होता है। इस हैंडल को IndexedDB में सहेजकर, Zunify बाद में ऐप शुरू होने पर पुनः पढ़ने की अनुमति मांग सकता है, जिससे उपयोगकर्ता केवल एक क्लिक में अपने स्थानीय संगीत संग्रह को लोड और प्ले कर सकते हैं।

### 2. Dexie.js के माध्यम से IndexedDB
सैकड़ों ऑडियो फाइलों को स्कैन करना, मेटाडेटा निकालना और एल्बम आर्ट लोड करना सीपीयू-गहन (CPU-intensive) कार्य है। अगली बार ऐप खोलने पर लोडिंग को त्वरित बनाने के लिए, Zunify **Dexie.js** (IndexedDB के लिए एक सरल रैपर) का उपयोग करके **IndexedDB** में लाइब्रेरी संरचना को कैश करता है।

Dexie ट्रैक के नाम, कलाकारों, एल्बमों, शैलियों और प्ले काउंट्स को इंडेक्स करता है, जिससे ब्राउज़र के स्थानीय डेटाबेस में सीधे उप-मिलीसेकंड खोज (sub-millisecond search), इतिहास ट्रैकिंग और कस्टम प्लेलिस्ट बनाने की सुविधा मिलती है।

### 3. Web Audio API और मेटाडेटा पार्सिंग (Metadata Parsing)
Zunify ब्राउज़र के भीतर ऑडियो फाइलों को स्कैन और पार्स करने के लिए `music-metadata-browser` का उपयोग करता है। यह ID3v2 मेटाडेटा, नमूना दर (sample rate), बिटरेट, गीत (lyrics) और एम्बेडेड एल्बम कवर निकालता है। पार्स होने के बाद, ऑडियो फाइलों को सीधे HTML5 `<audio>` संदर्भ में स्ट्रीम किया जाता है, जिससे मेमोरी का उपयोग बेहद कम रहता है।

---

## तकनीकी स्पॉटलाइट: Angular में File System Access API लागू करना

यहाँ बताया गया है कि Zunify ब्राउज़र रीस्टार्ट के बाद निर्देशिका अनुमतियों को कैसे याद रखता है। जब कोई उपयोगकर्ता एक फ़ोल्डर चुनता है, तो निर्देशिका हैंडल को IndexedDB में संग्रहीत किया जाता है:

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

### स्कैनिंग चरण (Scanning Phase)

एक बार निर्देशिका पहुंच की अनुमति मिलने के बाद, Zunify पुनरावर्ती रूप से (recursively) फ़ोल्डर संरचना को स्कैन करता है। यह ऑडियो फाइल एक्सटेंशन (`.mp3`, `.m4a`, `.ogg`, `.flac`) की जांच करता है:

```typescript
async scanDirectory(directoryHandle: FileSystemDirectoryHandle): Promise<void> {
  const tracks: any[] = [];
  
  for await (const entry of (directoryHandle as any).values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      if (this.isAudioFile(file.name)) {
        // Parse metadata on-device
        const metadata = await this.parseAudioMetadata(file);
        tracks.push({
          title: metadata.title || file.name,
          artist: metadata.artist || 'Unknown Artist',
          album: metadata.album || 'Unknown Album',
          fileHandle: entry // Save file handle to stream later
        });
      }
    } else if (entry.kind === 'directory') {
      // Recursively scan subfolders
      await this.scanDirectory(entry);
    }
  }
  
  await this.db.table('tracks').bulkPut(tracks);
}
```

---

## एक आधुनिक PWA ऑडियो प्लेयर बनाने की चुनौतियाँ

वेब ब्राउज़र के भीतर पूरी तरह से स्थानीय मीडिया प्लेयर बनाने में कई सीमाएँ होती हैं:

### 1. फ़ाइल अनुमति दृढ़ता (File Permission Persistence)
सुरक्षा कारणों से, ब्राउज़र पृष्ठ के बंद होने या फिर से लोड होने पर फ़ाइल सिस्टम की अनुमतियों को रीसेट कर देता है। हालाँकि `FileSystemDirectoryHandle` IndexedDB में संग्रहीत रहता है, लेकिन उपयोगकर्ता को ऐप शुरू होने पर पुनः "पढ़ने की अनुमति" देने के लिए स्पष्ट रूप से एक प्रॉम्प्ट को स्वीकार करना होगा।

**समाधान:** Zunify एक साफ-सुथरा स्टार्टअप स्क्रीन प्रदान करता है जो उपयोगकर्ता को निर्देशिका हैंडल को फिर से अधिकृत करने के लिए "Sync Library" का विकल्प देता है।

### 2. स्थानीय हैंडल से ऑडियो स्ट्रीमिंग
ब्राउज़र सीधे स्थानीय फ़ाइल हैंडल को `<audio>` टैग के `src` एट्रिब्यूट से नहीं जोड़ सकते हैं।

**समाधान:** Zunify `URL.createObjectURL(file)` का उपयोग करके अस्थायी ऑब्जेक्ट यूआरएल बनाकर इसे हल करता है। जब ट्रैक बदलता है, तो Zunify मेमोरी लीक को रोकने के लिए पुराने ऑब्जेक्ट यूआरएल को रद्द (revoke) कर देता है, जिससे मेमोरी का उपयोग इष्टतम रहता है।

### 3. मूल मीडिया सत्र एकीकरण (Native Media Session Integration)
Zunify को एक स्थानीय डेस्कटॉप ऐप जैसा महसूस कराने के लिए, यह **Media Session API** को एकीकृत करता है। यह वैश्विक मीडिया नियंत्रण (कीबोर्ड प्ले/पॉज़ कीज़, हेडसेट बटन, ओएस मीडिया अधिसूचना विजेट) को सीधे ब्राउज़र के प्लेबैक इंजन से जोड़ता है:

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

## ऑफ़लाइन-फर्स्ट वेब एप्लीकेशन क्यों महत्वपूर्ण हैं

Zunify केवल एक यादों को ताज़ा करने वाला प्रयास नहीं है; यह स्थानीय-प्रथम (local-first) सॉफ्टवेयर की ओर एक बढ़ते बदलाव का प्रतिनिधित्व करता है। आधुनिक वेब एपीआई का उपयोग करके, हम समृद्ध, अत्यधिक इंटरैक्टिव एप्लिकेशन बना सकते हैं जो:

* पूरी तरह से क्लाइंट-साइड पर चलते हैं, जिससे **सर्वर की कोई लागत नहीं** आती है।
* बिना किसी इंटरनेट कनेक्शन के चलते हैं, जिससे उपयोगकर्ता की व्यक्तिगत जानकारी ट्रैक होने से बचती है।
* ब्राउज़र के सुरक्षित सैंडबॉक्स के भीतर रहते हुए भी नेटिव-ऐप जैसा प्रदर्शन प्रदान करते हैं।

चाहे आप Zune प्लेयर के भव्य मेट्रो स्टाइल को वापस लाना चाहते हों या यह देखना चाहते हों कि ऑफ़लाइन-फर्स्ट ऐप बनाने के लिए File System Access API का उपयोग कैसे किया जा सकता है, Zunify पूरी तरह से ओपन-सोर्स है और योगदानकर्ताओं का स्वागत करता है। अपना स्थानीय संगीत फ़ोल्डर चुनें, [Zunify](https://zunify.breejeshrathod.com/) लॉन्च करें, और टाइपोग्राफी-केंद्रित लेआउट में संगीत सुनने का आनंद लें।
