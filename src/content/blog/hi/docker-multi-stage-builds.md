---
title: "अपने डॉकर इमेज का आकार घटाएं: मल्टी-स्टेज बिल्ड्स की शक्ति"
description: "मल्टी-स्टेज डॉकर बिल्ड्स प्रोडक्शन इमेज का आकार कैसे घटाते हैं, गो, नोड, जावा और पायथन पर असली benchmarks के साथ।"
date: 2026-01-02
tags: [डॉकर, डेवऑप्स, सुरक्षा]
coverImage: /assets/images/docker-optimization.webp
previewImage: /assets/images/docker-optimization.webp
---

बडे़ कंटेनर इमेज के कारण परिनियोजन (deployment) धीमा हो जाता है, रजिस्ट्री स्टोरेज का व्यय बढ़ता है और सुरक्षा जोखिम (attack surface) में वृद्धि होती है। यदि आपकी प्रोडक्शन इमेज में अब भी कंपाइलर, परीक्षण टूल और बिल्ड टूलिंग शामिल हैं, तो आप अनावश्यक भार बढ़ा रहे हैं।

**मल्टी-स्टेज बिल्ड्स** पैकेजिंग से जुड़ी इस समस्या का समाधान करते हैं। पहले एक निर्माण चरण (builder stage) में निर्माण करें, फिर केवल रनटाइम आर्टिफैक्ट को एक छोटी अंतिम इमेज में कॉपी करें।

मैंने इस प्रक्रिया को दो अन्य विकल्पों (सिंगल-स्टेज और प्री-बिल्ट बेस) की तुलना में चार अलग-अलग प्रौद्योगिकियों पर मापा है। संपूर्ण परीक्षण कोड, डॉकरफाइल्स और मूल आंकड़े यहां उपलब्ध हैं:

* **गिटहब repository:** [github.com/breejesh/multi-stage-docker-benchmarking](https://github.com/breejesh/multi-stage-docker-benchmarking)

---

## समस्या: अत्यधिक भारी इमेज

एक सामान्य गो एप्लिकेशन को निर्माण के समय कंपाइलर, मॉड्यूल कैश और सिस्टम टूल की आवश्यकता होती है। एक सामान्य सिंगल-स्टेज डॉकरफाइल अंतिम इमेज में यह सब कुछ छोड़ देता है:

```dockerfile
FROM golang:1.23
WORKDIR /app
COPY . .
RUN go build -o main .
CMD ["./main"]
```

लेकिन निष्पादन (runtime) के समय केवल बाइनरी फ़ाइल की आवश्यकता होती है। नोड, जावा और पायथन में भी यही पैटर्न दिखाई देता है: निर्माण समाप्त होने के बाद भी पूरी एसडीके तकनीक इमेज में बनी रहती है।

---

## तीन निर्माण रणनीतियाँ

परीक्षण में प्रत्येक भाषा के एक छोटे `/health` एचटीटीपी सेवा पर तीन पैकेजिंग रणनीतियों की तुलना की गई है:

1. **सिंगल-स्टेज:** एक ही इमेज इंस्टॉल, बिल्ड और रन का कार्य करती है।
2. **प्री-बिल्ट बेस:** निर्भरताएँ (dependencies) एक कस्टम बेस में रहती हैं। एप्लिकेशन बिल्ड इसके ऊपर स्रोत कोड कॉपी करता है। अंतिम इमेज भारी बनी रहती है।
3. **मल्टी-स्टेज:** बिल्डर में एसडीके रहता है; अंतिम चरण में केवल आवश्यक आर्टिफैक्ट (बाइनरी, `dist/`, JAR फ़ाइल या वातावरण का आवश्यक भाग) जाता है।

प्रत्येक डॉकरफाइल में लेयर क्रम निश्चित है (manifest → deps → source → build), ताकि निष्पक्ष तुलना रणनीतियों की हो सके।

---

## परीक्षण के परिणाम

अंतिम परीक्षण आंकड़े: **21 जुलाई 2026**, `docker image inspect` द्वारा प्राप्त अनकंप्रेस्ड आकार।

![रणनीति के अनुसार final image size](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_size.png)

![Cold / uncached build समय](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_cold.png)

![Code-edit rebuild समय](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_incremental.png)

![Dependency-manifest change rebuild समय](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_dependency.png)

### इमेज का आकार (मल्टी-स्टेज की जीत)

| Stack | Single-stage | Pre-built | Multi-stage | Single के मुकाबले गिरावट |
|---|---:|---:|---:|---:|
| गो | 69.2 MB | 69.2 MB | **5.4 MB** | **~92%** |
| नोड.जेएस (टाइपस्क्रिप्ट) | 64.3 MB | 64.3 MB | **47.4 MB** | **~26%** |
| जावा (fat JAR) | 231.7 MB | 231.7 MB | **69.9 MB** | **~70%** |
| पायथन (कॉन्डा) | 355.1 MB | 355.1 MB | **85.7 MB** | **~76%** |

इन एप्लिकेशन्स पर मल्टी-स्टेज तकनीक ने अंतिम आकार में **26% से 92%** तक की कमी की। प्री-बिल्ट का आकार सिंगल-स्टेज जितना ही रहता है क्योंकि उसमें संपूर्ण टूलचेन शामिल होती है।

गो में सबसे बड़ा अंतर दिखा: अल्पाइन अथवा `scratch` जैसे न्यूनतम रनर पर केवल स्टेटिक बाइनरी रखने से बाकी सब हट जाता है। नोड में कमी थोड़ी कम होती है क्योंकि प्रोडक्शन में नोड रनटाइम और `node_modules` की आवश्यकता बनी रहती है।

### पुनर्निर्माण गति (केवल कोड बदलने पर प्री-बिल्ट की गति)

जब केवल एप्लिकेशन स्रोत कोड बदलता है:

| Stack | Single (s) | Pre-built (s) | Multi-stage (s) |
|---|---:|---:|---:|
| गो | 1.05 | **0.68** | 1.22 |
| नोड | 1.55 | **1.09** | 2.08 |
| जावा | 2.26 | **1.50** | 1.92 |
| पायथन (कॉन्डा) | 1.25 | **0.31** | 0.98 |

प्री-बिल्ट विधि कोड में बदलाव के पुनर्निर्माण पर सबसे तेज़ रही क्योंकि निर्भरताएँ बेस में पहले से मौजूद रहती हैं।

### व्यावहारिक निष्कर्ष

* **उत्पादन (Production) आकार और सुरक्षा जोखिम कम करने के लिए मल्टी-स्टेज का उपयोग करें।**
* **जब केवल कोड संशोधन की पुनर्निर्माण गति प्राथमिकता हो** (विकास पर्यावरण या कुछ CI पथ), तब प्री-बिल्ट बेस का उपयोग करें।
* **सिंगल-स्टेज** केवल एक सामान्य आधार रेखा प्रदान करता है।

परीक्षण दोहराने के लिए:

```bash
git clone https://github.com/breejesh/multi-stage-docker-benchmarking.git
cd multi-stage-docker-benchmarking
./benchmark.sh
```

---

## मल्टी-स्टेज डॉकरफाइल्स के उदाहरण

### गो

```dockerfile
# Stage 1: Build
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main .

# Stage 2: Runtime
FROM alpine:3.20
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/main .
CMD ["./main"]
```

**मुख्य बिंदु:**
* `go mod download` को `COPY . .` से अलग रखा गया है ताकि स्रोत कोड बदलने पर निर्भरताएँ पुनः डाउनलोड न हों।
* `-ldflags="-s -w"` डिबग प्रतीकों को हटाता है।
* `ca-certificates` न्यूनतम इमेज में एचटीटीपीएस समर्थन बनाए रखता है।

### नोड.जेएस / टाइपस्क्रिप्ट

नोड को प्रोडक्शन रनटाइम की आवश्यकता रहती है; मल्टी-स्टेज devDependencies और अनपेक्षित फ़ाइलों को हटाकर सहायता करता है:

```dockerfile
# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

---

## `.dockerignore` फ़ाइल का उपयोग

मल्टी-स्टेज यह निर्धारित करता है कि अंतिम इमेज में क्या जाएगा, जबकि `.dockerignore` यह तय करता है कि डॉकर डेमन को क्या नहीं भेजा जाना चाहिए। इसके बिना डॉकर `.git/`, स्थानीय `node_modules/` और वातावरण फ़ाइलों को अपलोड कर सकता है।

```
.git
.gitignore
node_modules
dist
*.md
.env*
.vscode
coverage
__tests__
Dockerfile
docker-compose*.yml
```

---

## सुरक्षा सुदृढ़ीकरण

केवल छोटा आकार ही सब कुछ नहीं है, सुरक्षा भी महत्वपूर्ण है।

### अ-रूट (Non-root) उपयोगकर्ता से चलाएँ

```dockerfile
FROM alpine:3.20
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/main .
USER appuser
CMD ["./main"]
```

### `scratch` अथवा Distroless का उपयोग

स्टेटिक बाइनरी के लिए:

```dockerfile
FROM scratch
COPY --from=builder /app/main /main
CMD ["/main"]
```

| Base Image | Size | Shell | Package Manager | उपयोग का सर्वोत्तम समय |
|---|---|---|---|---|
| `alpine:3.20` | ~7 MB | ✅ | ✅ (`apk`) | सामान्य उपयोग, डिबगिंग |
| `distroless/static` | ~2 MB | ❌ | ❌ | प्रोडक्शन गो, रस्ट, C++ |
| `scratch` | 0 MB | ❌ | ❌ | अधिकतम सुरक्षा, स्टेटिक बाइनरी |

---

## उत्पादन हेतु डॉकरफाइल का मानक प्रारूप

मल्टी-स्टेज, नॉन-रूट, हेल्थ चेक तथा लेवल का संपूर्ण उदाहरण:

```dockerfile
# Stage 1: Build
FROM golang:1.23-alpine AS builder
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /app/server .

# Stage 2: Production
FROM alpine:3.20

LABEL org.opencontainers.image.source="https://github.com/your-org/your-app"
LABEL org.opencontainers.image.description="Your application description"

RUN apk --no-cache add ca-certificates tzdata \
    && addgroup -S appgroup \
    && adduser -S appuser -G appgroup

WORKDIR /app
COPY --from=builder /app/server .

USER appuser

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD ["./server", "health"]

EXPOSE 8080
CMD ["./server"]
```

---

## निष्कर्ष

उत्पादन इमेजों के लिए मल्टी-स्टेज निर्माण सर्वोत्तम अभ्यास है। आंकड़े यह स्पष्ट करते हैं कि प्रौद्योगिकी के अनुसार इमेज का आकार 26% से लेकर 92% तक घट जाता है।

सुरक्षा, गति और दक्षता के लिए मल्टी-स्टेज, `.dockerignore`, अ-रूट उपयोगकर्ता तथा उचित स्वास्थ्य जाँच का प्रयोग करें।
