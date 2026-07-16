---
title: "Reduciendo tus imágenes de Docker: El poder de las compilaciones multi-etapa"
description: "Cómo reducir el tamaño de tu imagen de Docker en producción en un 90% y asegurar tus contenedores usando compilaciones multi-etapa."
date: 2026-01-02
tags: [Docker, DevOps, Contenedores, Optimización]
coverImage: /assets/images/docker-optimization.webp
previewImage: /assets/images/docker-optimization.webp
---

Las imágenes de contenedor grandes ralentizan las implementaciones, consumen almacenamiento innecesario en el registro y aumentan la superficie de ataque de seguridad. Si tu imagen de Docker de producción contiene compiladores, herramientas de prueba y dependencias en tiempo de compilación, estás cargando con peso muerto.

Aquí es donde entran las **compilaciones multi-etapa (Multi-Stage Builds)**, que te permiten compilar tu aplicación en un entorno temporal y copiar solo los archivos de producción compilados a una imagen final mínima.

---

## El problema: Imágenes pesadas

Considera una aplicación estándar en Go, Node.js o Java. Para compilar la aplicación, necesitas SDKs, herramientas de compilación, gestores de paquetes y archivos de cabecera.

Si utilizas un `Dockerfile` de una sola etapa como este:
```dockerfile
FROM golang:1.21
WORKDIR /app
COPY . .
RUN go build -o main .
CMD ["./main"]
```
Tu imagen final superará fácilmente los **800 MB** porque incluye todo el compilador de Go, las herramientas y la caché de paquetes local. En producción, solo necesitas el binario compilado (`main`), ¡que suele pesar menos de **30 MB**!

---

## La solución: Compilaciones multi-etapa

Con las compilaciones multi-etapa, defines varias instrucciones `FROM` en tu Dockerfile. Cada `FROM` comienza una nueva etapa con una imagen base limpia. Puedes nombrar estas etapas con la palabra clave `AS` y copiar archivos entre ellas usando `COPY --from`.

Aquí está la versión multi-etapa optimizada:
```dockerfile
# Etapa 1: Compilación
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Etapa 2: Imagen mínima de ejecución
FROM alpine:3.18
WORKDIR /app
COPY --from=builder /app/main .
CMD ["./main"]
```

### Por qué funciona esto:
1. **Separación de responsabilidades:** El compilador y los archivos fuente permanecen en la primera etapa.
2. **Tamaño final mínimo:** La imagen final se basa en `alpine`, lo que da como resultado un tamaño final de aproximadamente **35 MB** en lugar de 800 MB.
3. **Seguridad mejorada:** El contenedor final no contiene herramientas de compilación, lo que reduce las capacidades de consola para posibles atacantes.

---

## Conclusión

Las compilaciones de varias etapas son una herramienta imprescindible para cualquier flujo de trabajo de DevOps moderno. Al aislar las herramientas de compilación de la imagen de ejecución final, obtienes tiempos de inicio más rápidos, descargas más veloces y una superficie de ataque significativamente menor.
