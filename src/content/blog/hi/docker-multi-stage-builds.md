---
title: "अपने डॉकर इमेज का आकार घटाएं: मल्टी-स्टेज बिल्ड्स की शक्ति"
description: "मल्टी-स्टेज डॉकर बिल्ड्स प्रोडक्शन इमेज का आकार कैसे घटाते हैं, Go, Node, Java और Python पर असली benchmarks के साथ।"
date: 2026-01-02
tags: [डॉकर, डेवऑप्स, सुरक्षा]
coverImage: /assets/images/docker-optimization.webp
previewImage: /assets/images/docker-optimization.webp
---

बड़े कंटेनर इमेज डिप्लॉयमेंट धीमे करते हैं, रजिस्ट्री स्टोरेज खर्च करते हैं, और अटैक सरफेस बढ़ाते हैं। अगर प्रोडक्शन इमेज में अभी भी कंपाइलर, टेस्ट रनर्स और बिल्ड टूलिंग है, तो आप बेकार वजन शिप कर रहे हैं।

**मल्टी-स्टेज बिल्ड्स** पैकेजिंग वाली समस्या ठीक करते हैं। भारी builder stage में बिल्ड करें, फिर सिर्फ runtime आर्टिफैक्ट छोटी final image में कॉपी करें।

मैंने इसे दो आम विकल्पों (single-stage और pre-built deps base) के मुकाबले चार ecosystems पर मापा भी है। पूरा harness, Dockerfiles और कच्चे नंबर यहाँ हैं:

* **GitHub:** [github.com/breejesh/multi-stage-docker-benchmarking](https://github.com/breejesh/multi-stage-docker-benchmarking)

---

## समस्या: भारी इमेज

एक सामान्य Go ऐप को बिल्ड के लिए कंपाइलर, मॉड्यूल कैश और सिस्टम टूल्स चाहिए। ऐसा single-stage Dockerfile final image में सब कुछ छोड़ देता है:

```dockerfile
FROM golang:1.23
WORKDIR /app
COPY . .
RUN go build -o main .
CMD ["./main"]
```

Runtime पर सिर्फ binary चाहिए। Node, Java और Python में भी यही पैटर्न दिखता है: बिल्ड खत्म होने के बाद भी SDK इमेज में रहता है।

---

## तीन बिल्ड रणनीतियाँ

Benchmark हर भाषा में एक ही छोटे `/health` HTTP सर्विस पर तीन पैकेजिंग रणनीतियाँ तुलना करता है:

1. **Single-stage:** एक ही इमेज install, build और run करती है।
2. **Pre-built base:** deps (और अक्सर SDK) custom base में रहती हैं; ऐप बिल्ड ऊपर source कॉपी करता है। Final image मोटी रहती है।
3. **Multi-stage:** builder में SDK; final stage में सिर्फ आर्टिफैक्ट (binary, `dist/`, JAR, या conda env का हिस्सा)।

हर Dockerfile में layer क्रम फिक्स है (manifest → deps → source → build), ताकि तुलना strategy की हो, accidental cache wins की नहीं।

---

## Benchmark नतीजे

Repo में आखिरी run: **2026-07-21**, Darwin x86_64, wall-clock औसत, `docker image inspect` से uncompressed sizes। चार्ट:

![रणनीति के अनुसार final image size](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_size.png)

![Cold / uncached build समय](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_cold.png)

![Code-edit rebuild समय](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_incremental.png)

![Dependency-manifest change rebuild समय](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_dependency.png)

### Image size (multi-stage जीतता है)

| Stack | Single-stage | Pre-built | Multi-stage | Single के मुकाबले गिरावट |
|---|---:|---:|---:|---:|
| Go | 69.2 MB | 69.2 MB | **5.4 MB** | **~92%** |
| Node.js (TypeScript) | 64.3 MB | 64.3 MB | **47.4 MB** | **~26%** |
| Java (fat JAR) | 231.7 MB | 231.7 MB | **69.9 MB** | **~70%** |
| Python (Conda) | 355.1 MB | 355.1 MB | **85.7 MB** | **~76%** |

इन ऐप्स पर multi-stage ने final size लगभग **26% से 92%** घटाया। Pre-built size में single-stage जितना ही रहता है क्योंकि जानबूझकर पूरा toolchain जाता है।

Go सबसे चरम है: Alpine/`scratch` जैसे runner पर static binary छोड़ो, बाकी लगभग सब हट जाता है। Node कम घटता है क्योंकि prod में अभी भी Node runtime और prod `node_modules` चाहिए। Java और Conda बीच में बैठते हैं।

### Rebuild स्पीड (pure code edit पर pre-built जीतता है)

जब सिर्फ application source बदलता है:

| Stack | Single (s) | Pre-built (s) | Multi-stage (s) |
|---|---:|---:|---:|
| Go | 1.05 | **0.68** | 1.22 |
| Node | 1.55 | **1.09** | 2.08 |
| Java | 2.26 | **1.50** | 1.92 |
| Python (Conda) | 1.25 | **0.31** | 0.98 |

Pre-built **चारों ecosystems** में code-edit rebuild पर सबसे तेज़ रहा। Deps base में पहले से हैं; Docker मुख्यतः app code फिर से compile करता है।

Cold builds और dependency-manifest बदलाव **मिश्रित** रहे। Pre-built के cold और dep-change समय में custom base rebuild शामिल है (cold CI agent के लिए सही तुलना)। Multi-stage वहाँ हमेशा wall-clock नहीं जीतता; Conda cold इस run में धीमा था (~25s multi-stage vs ~16s single)।

### Smoke tests

हर strategy की हर image ने `/health` सही जवाब दिया। छोटा मतलब टूटा नहीं, अगर runtime stage सावधानी से बना हो।

### डेटा से व्यावहारिक नतीजा

* **प्रोडक्शन size और attack surface के लिए multi-stage शिप करें।**
* **जब pure code-edit rebuild स्पीड सबसे ज़रूरी हो** (dev images, कुछ CI paths) तो pre-built base उपयोग करें। इसे convenience image मानें, prod runtime नहीं।
* **Single-stage** साधारण baseline है। Size पर शायद ही सबसे अच्छा, स्पीड पर कभी-कभी ठीक।

नंबर दोहराने या बढ़ाने के लिए:

```bash
git clone https://github.com/breejesh/multi-stage-docker-benchmarking.git
cd multi-stage-docker-benchmarking
./benchmark.sh
# or: python3 benchmark.py --apps go node java conda --runs 3
```

---

## मल्टी-स्टेज Dockerfiles

### Go

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

**नोट्स:**
- `go mod download` को `COPY . .` से अलग रखें ताकि सिर्फ source बदलने पर deps cache रहे।
- `-ldflags="-s -w"` debug symbols हटाता है।
- `ca-certificates` slim image में HTTPS चालू रखता है।

### Node.js / TypeScript

Node को prod में runtime अभी भी चाहिए; multi-stage devDependencies और source हटाकर मदद करता है:

```dockerfile
# Stage 1: Install all dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime with only production dependencies
FROM node:20-alpine AS production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

इसीलिए Node का size फायदा (~26% bench में) Go (~92%) से कम है: आप अभी भी Node + prod modules का खर्च देते हैं।

---

## `.dockerignore` न भूलें

Multi-stage तय करता है final image में क्या जाएगा। `.dockerignore` तय करता है daemon को build context में क्या भेजा जाएगा। बिना इसके Docker हर build पर `.git/`, लोकल `node_modules/`, test fixtures और env files अपलोड कर सकता है।

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

Benchmark ऐप्स host artifacts को इसी तरह ignore करते हैं ताकि timings तुलना योग्य रहें।

---

## सुरक्षा सख्ती: size से आगे

कम पैकेज मतलब कम CVE रास्ते, लेकिन size पूरी कहानी नहीं।

### Non-root user से चलाएँ

```dockerfile
FROM alpine:3.20
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/main .
USER appuser
CMD ["./main"]
```

### `scratch` या Distroless base

Static binaries के लिए:

```dockerfile
# scratch: पूर्ण न्यूनतम, कोई shell नहीं, कोई package manager नहीं
FROM scratch
COPY --from=builder /app/main /main
CMD ["/main"]
```

```dockerfile
# distroless: कोई shell नहीं, लेकिन CA certs, timezone data और glibc
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /main
CMD ["/main"]
```

| Base Image | Size | Shell | Package Manager | सबसे अच्छा कब |
|---|---|---|---|---|
| `alpine:3.20` | ~7 MB | ✅ | ✅ (`apk`) | सामान्य उपयोग, debugging |
| `distroless/static` | ~2 MB | ❌ | ❌ | Production Go, Rust, C++ |
| `scratch` | 0 MB | ❌ | ❌ | अधिकतम सुरक्षा, static binaries |

Shell न होने पर attacker आसानी से container में `exec` करके मनमाने कमांड नहीं चला सकता।

---

## प्रोडक्शन-ready Dockerfile पैटर्न

अधिक पूरा Go-style पैटर्न: multi-stage, non-root, health check, labels, signal-friendly layout:

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

**हर हिस्सा क्यों:**
- **OCI Labels** registry में image को source से जोड़ते हैं।
- **`tzdata`** timezone-aware code के लिए (`time.LoadLocation` in Go)।
- **`HEALTHCHECK`** Docker/Kubernetes को unhealthy containers restart करने देता है।
- **`EXPOSE`** intended port लोगों और orchestrators के लिए document करता है।

---

## बोनस: BuildKit cache mounts से build तेज़ करें

BuildKit (Docker 23.0 से default) package caches को builds के बीच रख सकता है, भले पहले layers बदल जाएँ:

```dockerfile
# Cache Go module downloads across builds
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Cache npm packages across builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

सबसे ज़्यादा CI में मदद करता है, जहाँ layer cache अक्सर cold होती है। यह multi-stage packaging का साथी है; विकल्प नहीं।

---

## निष्कर्ष

प्रोडक्शन images के लिए multi-stage मेरा default है। Benchmark Go, Node, Java और Python पर size कहानी को corroborate करता है: जरूरत वाले runtime के हिसाब से लगभग एक चौथाई से 90%+ तक गिरावट।

हर अक्ष पर मुफ़्त नहीं। Pre-built bases pure code बदलाव तेज़ rebuild कर सकती हैं। Cold और dependency rebuilds ecosystem पर निर्भर। अगर rebuild latency bottleneck है तो अपने ऐप्स मापें।

बुनियादी साथ रखें: जो शिप करते हैं उसके लिए multi-stage, context के लिए `.dockerignore`, सुरक्षा के लिए non-root (और जहाँ फिट हो distroless/`scratch`), ops के लिए health checks, CI के लिए BuildKit caches। इस पोस्ट के harness और charts: [multi-stage-docker-benchmarking](https://github.com/breejesh/multi-stage-docker-benchmarking)।
