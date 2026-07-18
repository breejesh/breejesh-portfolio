---
title: "Reduciendo tus imágenes de Docker: El poder de las construcciones multi-etapa"
description: "Cómo reducir el tamaño de tu imagen de Docker en producción en un 90% y asegurar tus contenedores usando construcciones multi-etapa."
date: 2026-01-02
tags: [Docker, DevOps, Seguridad]
coverImage: /assets/images/docker-optimization.webp
previewImage: /assets/images/docker-optimization.webp
---

Las imágenes de contenedores de gran tamaño ralentizan los despliegues, consumen espacio innecesario en el registro y aumentan la superficie de ataque de seguridad. Si tu imagen de Docker en producción contiene compiladores, ejecutores de pruebas y dependencias de tiempo de compilación, estás cargando con un peso muerto que perjudica activamente tu infraestructura.

Aquí es donde entran las **construcciones multi-etapa** (Multi-Stage Builds), que te permiten construir tu aplicación en un entorno temporal y copiar solo los activos compilados de producción a una imagen final mínima y diminuta.

---

## El problema: Imágenes pesadas

Considera una aplicación estándar en Go. Para construirla, necesitas el compilador de Go, la biblioteca estándar, la caché de módulos y varias herramientas del sistema. Si utilizas un `Dockerfile` de etapa única como este:

```dockerfile
FROM golang:1.23
WORKDIR /app
COPY . .
RUN go build -o main .
CMD ["./main"]
```

Tu imagen final superará fácilmente los **800 MB** porque incluye todo el compilador de Go, las herramientas y la caché local de paquetes. En producción, ¡solo necesitas el binario compilado (`main`), que normalmente ocupa menos de **15 MB**!

El mismo problema se aplica a las aplicaciones de Node.js. Una imagen base estándar de `node:20` pesa más de **1 GB**, pero tu aplicación en producción probablemente solo necesite el entorno de ejecución, tus `node_modules` y tus activos compilados.

---

## La solución: Construcciones multi-etapa

Con las construcciones multi-etapa, defines múltiples instrucciones `FROM` en tu Dockerfile. Cada `FROM` comienza una nueva etapa con una imagen base limpia. Puedes nombrar estas etapas usando la palabra clave `AS` y copiar archivos selectivamente entre ellas usando `COPY --from`.

### Ejemplo en Go

```dockerfile
# Etapa 1: Construcción
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main .

# Etapa 2: Entorno de ejecución
FROM alpine:3.20
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/main .
CMD ["./main"]
```

**Detalles clave:**
- `go mod download` se separa de `COPY . .` para que las descargas de dependencias se almacenen en caché entre construcciones (solo se vuelven a ejecutar cuando cambian `go.mod` o `go.sum`).
- `-ldflags="-s -w"` elimina los símbolos de depuración e información DWARF, encogiendo aún más el binario.
- Se añade `ca-certificates` a la imagen de ejecución para que la aplicación pueda realizar llamadas HTTPS.

### Ejemplo en Node.js / TypeScript

Las construcciones multi-etapa en Node.js son ligeramente diferentes porque necesitas el entorno de ejecución de Node en producción (a diferencia de Go, que se compila en un binario independiente):

```dockerfile
# Etapa 1: Instalar todas las dependencias y construir
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: Entorno de ejecución en producción con solo dependencias de producción
FROM node:20-alpine AS production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

**Detalles clave:**
- `npm ci` en la etapa de construcción instala *todas* las dependencias (incluyendo devDependencies como TypeScript, ESLint, herramientas de pruebas).
- `npm ci --omit=dev` en la etapa de producción instala *solo* las dependencias de producción, eliminando todo lo que solo se necesitaba durante la compilación.
- Solo se copia el resultado compilado en `dist/` desde el constructor, dejando atrás los archivos fuente `.ts`, archivos de pruebas y archivos de configuración.

### Comparación del tamaño de las imágenes

| Entorno | Imagen de etapa única | Imagen multi-etapa | Reducción |
|---|---|---|---|
| Go (`golang:1.23` → `alpine`) | ~850 MB | ~15 MB | **98%** |
| Node.js (`node:20` → `node:20-alpine`, solo deps prod) | ~1.1 GB | ~180 MB | **84%** |
| Go (`golang:1.23` → `scratch`) | ~850 MB | ~8 MB | **99%** |

---

## No olvides `.dockerignore`

Las construcciones multi-etapa optimizan lo que termina en tu imagen final, pero `.dockerignore` optimiza lo que se envía al demonio de Docker en primer lugar. Sin él, Docker envía todo el directorio de tu proyecto —incluyendo `.git/`, `node_modules/`, archivos de pruebas y archivos de entorno local— como contexto de construcción, ralentizando cada compilación.

Crea un archivo `.dockerignore` en la raíz de tu proyecto:

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

Esto puede reducir el contexto de construcción de cientos de megabytes a solo unos pocos, haciendo que las compilaciones sean notablemente más rápidas, especialmente en pipelines de CI/CD donde el contexto se sube a través de la red.

---

## Endurecimiento de seguridad: Más allá de la reducción de tamaño

Las imágenes más pequeñas son inherentemente más seguras (menos paquetes = menos vectores de CVE), pero puedes ir más allá con algunas prácticas adicionales:

### Ejecutar como usuario no raíz (Non-Root User)

Por defecto, los contenedores se ejecutan como `root`. Si un atacante explota una vulnerabilidad en tu aplicación, tendrá acceso de superusuario dentro del contenedor. Crea y cambia siempre a un usuario sin privilegios:

```dockerfile
FROM alpine:3.20
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/main .
USER appuser
CMD ["./main"]
```

### Usar imágenes base `scratch` o Distroless

Para Go y otros lenguajes compilados estáticamente, puedes ir aún más lejos que Alpine utilizando `scratch` (un sistema de archivos vacío) o las imágenes **distroless** de Google:

```dockerfile
# scratch — mínimo absoluto, sin shell, sin gestor de paquetes
FROM scratch
COPY --from=builder /app/main /main
CMD ["/main"]
```

```dockerfile
# distroless — sin shell, pero incluye certificados CA, datos de zona horaria y glibc
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /main
CMD ["/main"]
```

**Compromisos:**
| Imagen base | Tamaño | Tiene Shell | Tiene gestor de paquetes | Ideal para |
|---|---|---|---|---|
| `alpine:3.20` | ~7 MB | ✅ | ✅ (`apk`) | Uso general, depuración |
| `distroless/static` | ~2 MB | ❌ | ❌ | Go, Rust, C++ en producción |
| `scratch` | 0 MB | ❌ | ❌ | Binarios estáticos, máxima seguridad |

> Sin una terminal (shell), los atacantes no pueden ejecutar comandos arbitrarios dentro del contenedor, lo que supone una gran victoria de seguridad para los despliegues de producción.

---

## Patrón de Dockerfile listo para producción

Aquí tienes un Dockerfile completo y de nivel de producción que combina todo lo comentado: construcciones multi-etapa, usuario no raíz, comprobaciones de salud, etiquetas adecuadas y manejo de señales:

```dockerfile
# Etapa 1: Construcción
FROM golang:1.23-alpine AS builder
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /app/server .

# Etapa 2: Producción
FROM alpine:3.20

LABEL org.opencontainers.image.source="https://github.com/tu-organizacion/tu-app"
LABEL org.opencontainers.image.description="Descripción de tu aplicación"

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
- Las **etiquetas OCI** permiten rastrear el origen de las imágenes en los registros de contenedores.
- **`tzdata`** asegura que las operaciones de zona horaria funcionen correctamente.
- **`HEALTHCHECK`** permite que Docker y los orquestadores (ECS, Kubernetes) detecten y reinicien contenedores defectuosos automáticamente.
- **`EXPOSE`** documenta el puerto previsto (es informativo, pero crítico para la configuración del orquestador).

---

## Bonus: Acelerar compilaciones con cachés BuildKit

Docker BuildKit admite montajes de caché que persisten las cachés de los gestores de paquetes entre construcciones. Esto puede acelerar drásticamente la instalación de dependencias:

```dockerfile
# Almacenar en caché las descargas de módulos de Go
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Almacenar en caché los paquetes npm  
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

A diferencia del almacenamiento en caché por capas, `--mount=type=cache` persiste la caché incluso cuando cambian las capas anteriores. Esto tiene un impacto enorme en entornos de CI.

---

## Conclusión

Las construcciones multi-etapa son una herramienta imprescindible para cualquier flujo de trabajo de DevOps moderno. Al aislar tus herramientas de construcción de la imagen final en producción, consigues tiempos de inicio más rápidos, descargas de imágenes más veloces y una superficie de ataque significativamente menor.

Combínalas con archivos `.dockerignore` para acelerar la transferencia de contexto, usuarios no raíz y bases distroless para mejorar la seguridad, comprobaciones de salud para la resiliencia operativa y cachés de BuildKit para agilizar tus pipelines de CI/CD. Juntas, estas prácticas producen contenedores pequeños, seguros, rápidos de construir y listos para producción.
