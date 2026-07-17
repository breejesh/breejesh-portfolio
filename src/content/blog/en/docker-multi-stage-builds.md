---
title: "Shrinking Your Docker Images: The Power of Multi-Stage Builds"
description: "How to reduce your production Docker image size by 90% and secure your containers using multi-stage builds."
date: 2026-01-02
tags: [Docker, DevOps, Containerization, Optimization]
coverImage: /assets/images/docker-optimization.webp
previewImage: /assets/images/docker-optimization.webp
---

Large container images slow down deployments, consume unnecessary registry storage, and increase your security attack surface. If your production Docker image contains compilers, test runners, and build-time dependencies, you are carrying around dead weight that actively hurts your infrastructure.

This is where **Multi-Stage Builds** come in — allowing you to build your application in a temporary environment and copy only the compiled production assets to a tiny, minimal final image.

---

## The Problem: Fat Images

Consider a standard Go application. To build it, you need the Go compiler, standard library, module cache, and various system tools. If you use a single-stage `Dockerfile` like this:

```dockerfile
FROM golang:1.23
WORKDIR /app
COPY . .
RUN go build -o main .
CMD ["./main"]
```

Your final image will easily exceed **800 MB** because it includes the entire Go compiler, tooling, and local package cache. In production, you only need the compiled binary (`main`), which is usually less than **15 MB**.

The same problem applies to Node.js applications. A typical `node:20` base image weighs in at over **1 GB**, yet your production app probably needs just the runtime, your `node_modules`, and your built assets.

---

## The Solution: Multi-Stage Builds

With multi-stage builds, you define multiple `FROM` instructions in your Dockerfile. Each `FROM` starts a new stage with a clean base image. You can name stages using the `AS` keyword and selectively copy files between them using `COPY --from`.

### Go Example

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

**Key details:**
- `go mod download` is separated from `COPY . .` so that dependency downloads are cached across builds (they only re-run when `go.mod` or `go.sum` change).
- `-ldflags="-s -w"` strips debug symbols and DWARF info, further shrinking the binary.
- `ca-certificates` is added to the runtime image so the app can make HTTPS calls.

### Node.js / TypeScript Example

Node.js multi-stage builds are slightly different because you need the Node runtime in production (unlike Go, which compiles to a standalone binary):

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

**Key details:**
- `npm ci` in the build stage installs *all* dependencies (including devDependencies like TypeScript, ESLint, testing tools).
- `npm ci --omit=dev` in the production stage installs *only* production dependencies, stripping out everything that was only needed at build time.
- Only the compiled `dist/` output is copied from the builder, leaving source `.ts` files, test fixtures, and config files behind.

### Image Size Comparison

| Stack | Single-Stage Image | Multi-Stage Image | Reduction |
|---|---|---|---|
| Go (`golang:1.23` → `alpine`) | ~850 MB | ~15 MB | **98%** |
| Node.js (`node:20` → `node:20-alpine`, prod deps only) | ~1.1 GB | ~180 MB | **84%** |
| Go (`golang:1.23` → `scratch`) | ~850 MB | ~8 MB | **99%** |

---

## Don't Forget `.dockerignore`

Multi-stage builds optimize what ends up in your final image, but `.dockerignore` optimizes what gets sent to the Docker daemon in the first place. Without it, Docker sends your entire project directory — including `.git/`, `node_modules/`, test fixtures, and local environment files — as build context, slowing down every build.

Create a `.dockerignore` file in your project root:

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

This can reduce your build context from hundreds of megabytes to just a few megabytes, making builds noticeably faster — especially in CI/CD pipelines where build context is uploaded over the network.

---

## Security Hardening: Beyond Size Reduction

Smaller images are inherently more secure (fewer packages = fewer CVE vectors), but you can go further with a few additional practices:

### Run as a Non-Root User

By default, containers run as `root`. If an attacker exploits a vulnerability in your application, they have root access inside the container. Always create and switch to a non-privileged user:

```dockerfile
FROM alpine:3.20
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/main .
USER appuser
CMD ["./main"]
```

### Use `scratch` or Distroless Base Images

For Go and other statically compiled languages, you can go even further than Alpine by using `scratch` (an empty filesystem) or Google's **distroless** images:

```dockerfile
# scratch — absolute minimum, no shell, no package manager
FROM scratch
COPY --from=builder /app/main /main
CMD ["/main"]
```

```dockerfile
# distroless — no shell, but includes CA certs, timezone data, and glibc
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /main
CMD ["/main"]
```

**Trade-offs:**
| Base Image | Size | Has Shell | Has Package Manager | Best For |
|---|---|---|---|---|
| `alpine:3.20` | ~7 MB | ✅ | ✅ (`apk`) | General-purpose, debugging |
| `distroless/static` | ~2 MB | ❌ | ❌ | Production Go, Rust, C++ |
| `scratch` | 0 MB | ❌ | ❌ | Maximum security, static binaries |

> Without a shell, attackers cannot exec into the container or run arbitrary commands — a significant security win for production deployments.

---

## Production-Ready Dockerfile Pattern

Here is a complete, production-grade Dockerfile combining everything discussed above — multi-stage builds, non-root user, health checks, proper labels, and signal handling:

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
- **OCI Labels** make images traceable back to their source repository in registries.
- **`tzdata`** ensures time zone operations work correctly (Go's `time.LoadLocation` needs it).
- **`HEALTHCHECK`** enables Docker and orchestrators (ECS, Kubernetes) to detect and restart unhealthy containers automatically.
- **`EXPOSE`** documents the intended port (informational, but critical for team communication and orchestrator configuration).

---

## Bonus: Speed Up Builds with BuildKit Cache Mounts

Docker BuildKit (enabled by default since Docker 23.0) supports cache mounts that persist package manager caches across builds. This can dramatically speed up dependency installation:

```dockerfile
# Cache Go module downloads across builds
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Cache npm packages across builds  
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

Unlike layer caching, `--mount=type=cache` persists the cache even when the preceding layers change. This is especially impactful in CI environments where layer caches are often cold.

---

## Conclusion

Multi-stage builds are a must-have tool for any modern DevOps workflow. By isolating your build toolchain from the final runtime image, you get faster startup times, quicker pull speeds, and a significantly smaller attack surface.

But don't stop at multi-stage builds alone. Combine them with `.dockerignore` files to speed up build context transfers, non-root users and distroless bases for security hardening, health checks for operational resilience, and BuildKit cache mounts for faster CI/CD pipelines. Together, these practices produce containers that are small, secure, fast to build, and ready for production.
