---
title: "Shrinking Your Docker Images: The Power of Multi-Stage Builds"
description: "How multi-stage Docker builds cut production image size, with real benchmarks across Go, Node, Java, and Python."
date: 2026-01-02
tags: [Docker, DevOps, Security]
coverImage: /assets/images/docker-optimization.webp
previewImage: /assets/images/docker-optimization.webp
---

Large container images slow down deployments, burn registry storage, and widen your attack surface. If the production image still contains compilers, test runners, and build-time tooling, you are shipping dead weight.

**Multi-stage builds** fix the packaging side of that problem. You compile in a heavy builder stage, then copy only the runtime artifact into a small final image.

I also measured this against two common alternatives (single-stage and a pre-built deps base) across four ecosystems. The full harness, Dockerfiles, and raw numbers live in:

* **GitHub:** [github.com/breejesh/multi-stage-docker-benchmarking](https://github.com/breejesh/multi-stage-docker-benchmarking)

---

## The Problem: Fat Images

A typical Go app needs the compiler, module cache, and system tools to build. A single-stage Dockerfile like this leaves all of that in the final image:

```dockerfile
FROM golang:1.23
WORKDIR /app
COPY . .
RUN go build -o main .
CMD ["./main"]
```

You only need the binary at runtime. The same pattern shows up in Node, Java, and Python: the SDK stays in the image long after the build is done.

---

## Three Build Strategies

The benchmark compares three packaging strategies on the same tiny `/health` HTTP service per language:

1. **Single-stage:** one image does install, build, and run.
2. **Pre-built base:** deps (and often the SDK) live in a custom base; app builds copy source on top. Final image stays fat.
3. **Multi-stage:** builder stage has the SDK; final stage gets only the artifact (binary, `dist/`, JAR, or conda env slice).

Layer order is fixed in every Dockerfile (manifest → deps → source → build) so the comparison is about strategy, not accidental cache wins.

---

## Benchmark Results

Last run in the repo: **2026-07-21**, Darwin x86_64, wall-clock averages, uncompressed sizes from `docker image inspect`. Charts:

![Final image size by strategy](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_size.png)

![Cold / uncached build time](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_cold.png)

![Code-edit rebuild time](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_incremental.png)

![Dependency-manifest change rebuild time](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_dependency.png)

### Image size (multi-stage wins)

| Stack | Single-stage | Pre-built | Multi-stage | Drop vs single |
|---|---:|---:|---:|---:|
| Go | 69.2 MB | 69.2 MB | **5.4 MB** | **~92%** |
| Node.js (TypeScript) | 64.3 MB | 64.3 MB | **47.4 MB** | **~26%** |
| Java (fat JAR) | 231.7 MB | 231.7 MB | **69.9 MB** | **~70%** |
| Python (Conda) | 355.1 MB | 355.1 MB | **85.7 MB** | **~76%** |

Across these apps, multi-stage cut final size by about **26% to 92%**. Pre-built matches single-stage on size because it still ships the full toolchain on purpose.

Go is the extreme case: you leave a static binary on Alpine/`scratch`-style runners and drop almost everything else. Node shrinks less because production still needs a Node runtime and prod `node_modules`. Java and Conda land in the middle: multi-stage drops the JDK/build env or trims the env, but you still ship a real runtime.

### Rebuild speed (pre-built wins on pure code edits)

When only application source changes:

| Stack | Single (s) | Pre-built (s) | Multi-stage (s) |
|---|---:|---:|---:|
| Go | 1.05 | **0.68** | 1.22 |
| Node | 1.55 | **1.09** | 2.08 |
| Java | 2.26 | **1.50** | 1.92 |
| Python (Conda) | 1.25 | **0.31** | 0.98 |

Pre-built was fastest on **code-edit rebuilds in all four** ecosystems. Deps are already in the base, so Docker mostly recompiles app code.

Cold builds and dependency-manifest changes were **mixed**. Pre-built cold and dep-change times include rebuilding the custom base (fair for a cold CI agent). Multi-stage does not always win wall-clock there, and for Conda cold builds it was slower in this run (~25s multi-stage vs ~16s single).

### Smoke tests

Every image for every strategy answered `/health` successfully. Smaller does not mean broken if the runtime stage is assembled carefully.

### Practical takeaway from the data

* **Ship multi-stage** for production size and attack surface.
* **Use a pre-built base** when pure code-edit rebuild speed matters most (dev images, some CI paths). Treat it as a convenience image, not the prod runtime.
* **Single-stage** is a simple baseline. It is rarely best on size, and only sometimes competitive on speed.

Reproduce or extend the numbers:

```bash
git clone https://github.com/breejesh/multi-stage-docker-benchmarking.git
cd multi-stage-docker-benchmarking
./benchmark.sh
# or: python3 benchmark.py --apps go node java conda --runs 3
```

---

## Multi-Stage Dockerfiles

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

**Notes:**
- Separate `go mod download` from `COPY . .` so dependency layers cache when only source changes.
- `-ldflags="-s -w"` strips debug symbols.
- `ca-certificates` keeps HTTPS working in the slim image.

### Node.js / TypeScript

Node still needs a runtime in production, so multi-stage helps by dropping devDependencies and source:

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

That is why Node's size win (~26% in the bench) is smaller than Go's (~92%): you still pay for Node + prod modules.

---

## Don't Forget `.dockerignore`

Multi-stage builds control what ends up in the final image. `.dockerignore` controls what gets sent to the daemon as build context. Without it, Docker may upload `.git/`, local `node_modules/`, test fixtures, and env files on every build.

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

The benchmark apps ignore host artifacts the same way so timings stay comparable.

---

## Security Hardening: Beyond Size Reduction

Fewer packages means fewer CVE paths, but size is not the whole story.

### Run as a Non-Root User

```dockerfile
FROM alpine:3.20
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/main .
USER appuser
CMD ["./main"]
```

### Use `scratch` or Distroless Base Images

For static binaries:

```dockerfile
# scratch: absolute minimum, no shell, no package manager
FROM scratch
COPY --from=builder /app/main /main
CMD ["/main"]
```

```dockerfile
# distroless: no shell, but includes CA certs, timezone data, and glibc
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /main
CMD ["/main"]
```

| Base Image | Size | Has Shell | Has Package Manager | Best For |
|---|---|---|---|---|
| `alpine:3.20` | ~7 MB | ✅ | ✅ (`apk`) | General-purpose, debugging |
| `distroless/static` | ~2 MB | ❌ | ❌ | Production Go, Rust, C++ |
| `scratch` | 0 MB | ❌ | ❌ | Maximum security, static binaries |

No shell means attackers cannot casually `exec` into the container and run arbitrary commands.

---

## Production-Ready Dockerfile Pattern

A fuller Go-style pattern: multi-stage build, non-root user, health check, labels, and signal-friendly layout:

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

**Why each piece matters:**
- **OCI Labels** tie the image back to source in registries.
- **`tzdata`** supports timezone-aware code (`time.LoadLocation` in Go).
- **`HEALTHCHECK`** lets Docker/Kubernetes restart unhealthy containers.
- **`EXPOSE`** documents the intended port for humans and orchestrators.

---

## Bonus: Speed Up Builds with BuildKit Cache Mounts

BuildKit (default since Docker 23.0) can keep package caches across builds even when earlier layers change:

```dockerfile
# Cache Go module downloads across builds
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Cache npm packages across builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

This helps most in CI, where classic layer caches are often cold. It complements multi-stage packaging; it does not replace it.

---

## Conclusion

Multi-stage builds are the default I want for production images. The benchmark backs the size story across Go, Node, Java, and Python, with drops from about a quarter to over 90% depending on how much runtime you still need.

They are not free on every axis. Pre-built bases can rebuild pure code changes faster. Cold and dependency rebuilds depend on the ecosystem. Measure your own apps if rebuild latency is the bottleneck.

Stack the basics together: multi-stage for what you ship, `.dockerignore` for context, non-root (and distroless/`scratch` when it fits) for security, health checks for ops, BuildKit caches for CI. For the harness and charts behind this post, see [multi-stage-docker-benchmarking](https://github.com/breejesh/multi-stage-docker-benchmarking).
