---
title: "Shrinking Your Docker Images: The Power of Multi-Stage Builds"
description: "How to reduce your production Docker image size by 90% and secure your containers using multi-stage builds."
date: 2026-01-02
tags: [Docker, DevOps, Containerization, Optimization]
coverImage: /assets/images/docker-optimization.webp
previewImage: /assets/images/docker-optimization.webp
---

Large container images slow down deployments, consume unnecessary registry storage, and increase your security attack surface. If your production Docker image contains compilers, test runners, and build-time dependencies, you are carrying around dead weight.

This is where **Multi-Stage Builds** come in, allowing you to build your application in a temporary environment and copy only the compiled production assets to a tiny, minimal final image.

---

## The Problem: Fat Images

Consider a standard Go, Node.js, or Java application. To build the application, you need SDKs, build tools, package managers, and header files. 

If you use a single-stage `Dockerfile` like this:
```dockerfile
FROM golang:1.21
WORKDIR /app
COPY . .
RUN go build -o main .
CMD ["./main"]
```
Your final image will easily exceed **800 MB** because it includes the entire Go compiler, tooling, and local package cache. In production, you only need the compiled binary (`main`), which is usually less than **30 MB**!

---

## The Solution: Multi-Stage Builds

With multi-stage builds, you define multiple `FROM` instructions in your Dockerfile. Each `FROM` starts a new stage with a clean base image. You can name these stages using the `AS` keyword and copy files between them using `COPY --from`.

Here is the optimized multi-stage version:
```dockerfile
# Stage 1: Build stage
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Stage 2: Minimal final runtime image
FROM alpine:3.18
WORKDIR /app
COPY --from=builder /app/main .
CMD ["./main"]
```

### Why this works:
1. **Separation of Concerns:** The compiler and source files stay in the first stage.
2. **Tiny Final Size:** The final image is built on `alpine`, resulting in a final image size of about **35 MB** instead of 800 MB.
3. **Improved Security:** The final container doesn't contain build tools, reducing the shell capabilities for potential attackers.

---

## Conclusion

Multi-stage builds are a must-have tool for any modern DevOps workflow. By isolating your build toolchain from the final runtime image, you get faster startup times, quicker pull speeds, and a significantly smaller attack surface.
