---
title: "Reduciendo tus imágenes de Docker: El poder de las construcciones multi-etapa"
description: "Cómo las builds multi-etapa de Docker reducen el tamaño en producción, con benchmarks reales en Go, Node, Java y Python."
date: 2026-01-02
tags: [Docker, DevOps, Seguridad]
coverImage: /assets/images/docker-optimization.webp
previewImage: /assets/images/docker-optimization.webp
---

Las imágenes grandes ralentizan los despliegues, ocupan registro y amplían la superficie de ataque. Si la imagen de producción aún incluye compiladores, runners de tests y tooling de build, estás enviando peso muerto.

Las **construcciones multi-etapa** atacan el empaquetado: compilas en un stage pesado y copias solo el artefacto de runtime a una imagen final pequeña.

También medí esto frente a dos alternativas habituales (single-stage y base preconstruida con deps) en cuatro ecosistemas. El harness, los Dockerfiles y los números están en:

* **GitHub:** [github.com/breejesh/multi-stage-docker-benchmarking](https://github.com/breejesh/multi-stage-docker-benchmarking)

---

## El problema: imágenes pesadas

Una app Go típica necesita el compilador, la caché de módulos y herramientas del sistema para compilar. Un Dockerfile de una sola etapa deja todo eso en la imagen final:

```dockerfile
FROM golang:1.23
WORKDIR /app
COPY . .
RUN go build -o main .
CMD ["./main"]
```

En runtime solo necesitas el binario. El mismo patrón aparece en Node, Java y Python: el SDK se queda en la imagen cuando el build ya terminó.

---

## Tres estrategias de build

El benchmark compara tres estrategias de empaquetado sobre el mismo servicio HTTP mínimo `/health` por lenguaje:

1. **Single-stage:** una imagen instala, construye y ejecuta.
2. **Base preconstruida:** las deps (y a menudo el SDK) viven en una base custom; el build de la app copia el código encima. La imagen final sigue gorda.
3. **Multi-stage:** el builder tiene el SDK; el stage final solo recibe el artefacto (binario, `dist/`, JAR o recorte de entorno conda).

El orden de capas es fijo en todos los Dockerfiles (manifest → deps → source → build) para comparar estrategias, no aciertos de caché accidentales.

---

## Resultados del benchmark

Última ejecución en el repo: **2026-07-21**, Darwin x86_64, promedios de wall-clock, tamaños sin comprimir de `docker image inspect`. Gráficas:

![Tamaño final de imagen por estrategia](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_size.png)

![Tiempo de build en frío / sin caché](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_cold.png)

![Tiempo de rebuild por cambio de código](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_incremental.png)

![Tiempo de rebuild por cambio de dependencias](https://raw.githubusercontent.com/breejesh/multi-stage-docker-benchmarking/refs/heads/main/assets/chart_dependency.png)

### Tamaño de imagen (gana multi-stage)

| Stack | Single-stage | Pre-built | Multi-stage | Bajada vs single |
|---|---:|---:|---:|---:|
| Go | 69.2 MB | 69.2 MB | **5.4 MB** | **~92%** |
| Node.js (TypeScript) | 64.3 MB | 64.3 MB | **47.4 MB** | **~26%** |
| Java (fat JAR) | 231.7 MB | 231.7 MB | **69.9 MB** | **~70%** |
| Python (Conda) | 355.1 MB | 355.1 MB | **85.7 MB** | **~76%** |

En estas apps, multi-stage recortó el tamaño final entre **~26% y ~92%**. Pre-built iguala a single-stage en tamaño porque, a propósito, sigue enviando el toolchain completo.

Go es el extremo: dejas un binario estático en un runner tipo Alpine/`scratch` y casi todo lo demás desaparece. Node baja menos porque producción aún necesita runtime de Node y `node_modules` de prod. Java y Conda quedan en el medio.

### Velocidad de rebuild (pre-built gana en cambios de código)

Cuando solo cambia el código de la aplicación:

| Stack | Single (s) | Pre-built (s) | Multi-stage (s) |
|---|---:|---:|---:|
| Go | 1.05 | **0.68** | 1.22 |
| Node | 1.55 | **1.09** | 2.08 |
| Java | 2.26 | **1.50** | 1.92 |
| Python (Conda) | 1.25 | **0.31** | 0.98 |

Pre-built fue el más rápido en **rebuilds por edición de código en los cuatro** ecosistemas. Las deps ya están en la base; Docker recompila sobre todo código de app.

Builds en frío y cambios de manifest de dependencias fueron **mixtos**. Los tiempos cold y dep-change de pre-built incluyen reconstruir la base custom (justo para un agente de CI en frío). Multi-stage no siempre gana en wall-clock ahí; en Conda el cold fue más lento en esta corrida (~25s multi-stage vs ~16s single).

### Smoke tests

Todas las imágenes de todas las estrategias respondieron `/health`. Más pequeño no implica roto si el stage de runtime está bien armado.

### Conclusión práctica de los datos

* **Usa multi-stage** para tamaño y superficie de ataque en producción.
* **Usa una base preconstruida** cuando domine la velocidad de rebuild de solo código (imágenes de dev, algunos caminos de CI). Trátala como imagen de conveniencia, no como runtime de prod.
* **Single-stage** es una baseline simple. Rara vez es la mejor en tamaño, y solo a veces compite en velocidad.

Para reproducir o ampliar los números:

```bash
git clone https://github.com/breejesh/multi-stage-docker-benchmarking.git
cd multi-stage-docker-benchmarking
./benchmark.sh
# or: python3 benchmark.py --apps go node java conda --runs 3
```

---

## Dockerfiles multi-etapa

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

**Notas:**
- Separa `go mod download` de `COPY . .` para cachear deps cuando solo cambia el source.
- `-ldflags="-s -w"` quita símbolos de debug.
- `ca-certificates` mantiene HTTPS en la imagen slim.

### Node.js / TypeScript

Node sigue necesitando runtime en producción; multi-stage ayuda al quitar devDependencies y el source:

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

Por eso el ahorro de Node (~26% en el bench) es menor que el de Go (~92%): sigues pagando Node + módulos de prod.

---

## No olvides `.dockerignore`

Multi-stage controla qué acaba en la imagen final. `.dockerignore` controla qué se envía al demonio como contexto de build. Sin él, Docker puede subir `.git/`, `node_modules/` locales, fixtures de test y archivos de entorno en cada build.

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

Las apps del benchmark ignoran artefactos del host del mismo modo para que los tiempos sean comparables.

---

## Endurecimiento de seguridad: más allá del tamaño

Menos paquetes implica menos rutas de CVE, pero el tamaño no lo es todo.

### Ejecutar como usuario no root

```dockerfile
FROM alpine:3.20
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/main .
USER appuser
CMD ["./main"]
```

### Usar bases `scratch` o Distroless

Para binarios estáticos:

```dockerfile
# scratch: mínimo absoluto, sin shell, sin gestor de paquetes
FROM scratch
COPY --from=builder /app/main /main
CMD ["/main"]
```

```dockerfile
# distroless: sin shell, pero con CA certs, datos de zona horaria y glibc
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /main
CMD ["/main"]
```

| Imagen base | Tamaño | Shell | Gestor de paquetes | Mejor para |
|---|---|---|---|---|
| `alpine:3.20` | ~7 MB | ✅ | ✅ (`apk`) | Uso general, debug |
| `distroless/static` | ~2 MB | ❌ | ❌ | Producción Go, Rust, C++ |
| `scratch` | 0 MB | ❌ | ❌ | Máxima seguridad, binarios estáticos |

Sin shell, un atacante no puede hacer `exec` en el contenedor y lanzar comandos arbitrarios con la misma facilidad.

---

## Patrón de Dockerfile listo para producción

Un patrón más completo estilo Go: multi-stage, usuario no root, health check, labels y layout amable con señales:

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

**Por qué importa cada pieza:**
- **OCI Labels** enlazan la imagen con el repo en los registries.
- **`tzdata`** soporta código con zonas horarias (`time.LoadLocation` en Go).
- **`HEALTHCHECK`** permite a Docker/Kubernetes reiniciar contenedores no sanos.
- **`EXPOSE`** documenta el puerto para personas y orquestadores.

---

## Extra: acelerar builds con cache mounts de BuildKit

BuildKit (por defecto desde Docker 23.0) puede mantener cachés de paquetes entre builds aunque cambien capas anteriores:

```dockerfile
# Cache Go module downloads across builds
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Cache npm packages across builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

Ayuda sobre todo en CI, donde la caché de capas suele estar fría. Complementa el empaquetado multi-stage; no lo sustituye.

---

## Conclusión

Multi-stage es el default que quiero para imágenes de producción. El benchmark respalda el ahorro de tamaño en Go, Node, Java y Python, con bajadas desde un cuarto hasta más del 90% según cuánto runtime sigas necesitando.

No gana en todos los ejes. Las bases preconstruidas pueden reconstruir cambios de código puro más rápido. Cold y dep rebuilds dependen del ecosistema. Mide tus propias apps si la latencia de rebuild es el cuello de botella.

Combina lo básico: multi-stage para lo que envías, `.dockerignore` para el contexto, no-root (y distroless/`scratch` cuando encaje) para seguridad, health checks para ops, cachés BuildKit para CI. Harness y gráficas de este post: [multi-stage-docker-benchmarking](https://github.com/breejesh/multi-stage-docker-benchmarking).
