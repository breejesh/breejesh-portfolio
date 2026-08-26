---
title: "Web Utils: Suite de Herramientas para Desarrolladores 100% Client-Side en Angular 19"
description: "Un análisis técnico de Web Utils, una suite web enfocada en la privacidad con 28 herramientas para desarrolladores que se ejecutan completamente en tu navegador con Angular 19, Signals y Web Workers."
date: "2026-08-09"
tags: [Frontend y Desarrollo Web]
coverImage: /assets/images/web-utils-showcase.webp
previewImage: /assets/images/web-utils-showcase.webp
---

> **TL;DR**
> * **El Problema:** Las herramientas en línea para decodificación Base64, inspección de JWT y análisis de registros frecuentemente envían cadenas sensibles, credenciales de API y registros a servidores externos.
> * **La Solución:** Procesar datos exclusivamente en el lado del cliente utilizando Signals de Angular 19, APIs nativas de Web Cryptography y hilos de Web Workers secundarios.
> * **El Resultado:** 28 herramientas de nivel de producción que funcionan con 0 bytes de salida de red, ejecución local en submilisegundos y aislamiento total de datos.

Las herramientas para desarrolladores en la web comparten un problema común de privacidad: pegar texto confidencial, tokens de autorización JWT o registros internos en sitios populares a menudo transmite tus datos a sistemas de registros remotos y análisis de terceros.

**Web Utils está diseñado como una alternativa centrada en la privacidad.** Es una suite de aplicaciones 100% client-side, sin servidor backend, que ejecuta cada transformación, cálculo de hash y análisis de registros directamente dentro de la pestaña de tu navegador.

* **Repositorio en GitHub:** [github.com/breejesh/web-utils](https://github.com/breejesh/web-utils)
* **Demostración en Vivo:** [utils.breejeshrathod.com](https://utils.breejeshrathod.com/)

---

## Los Cuatro Pilares de la Arquitectura

Web Utils se basa en cuatro decisiones de diseño para garantizar un alto rendimiento y privacidad:

### 1. Aislamiento de Datos 100% en el Cliente
Cada herramienta de la suite se ejecuta localmente. Los datos ingresados, pegados desde el portapapeles o cargados desde el disco se procesan mediante JavaScript en el navegador, la API Web Cryptography y Web Workers. La telemetría de red es estrictamente cero para las cargas de trabajo.

### 2. Arquitectura de Signals Autónomos en Angular 19
Construido con componentes autónomos de Angular 19, las actualizaciones de estado son impulsadas por primitivas de grano fino `signal()` y `computed()`. Esto evita renderizados innecesarios de componentes durante la escritura continua en comparaciones de texto o evaluaciones de expresiones regulares.

### 3. Renderizado Estático SSR para SEO y Carga Inicial Rápida
Cada herramienta vive en su propia ruta dedicada (como `/tools/jwt-debugger` o `/tools/evtx-viewer`). El prerenderizado estático mediante `@angular/ssr` genera HTML estático durante el procesamiento de construcción, ofreciendo tiempos de carga inmediatos e indexación completa en buscadores.

### 4. Cero Infraestructura de Servidor y Cero Seguimiento Publicitario
No hay conexiones a bases de datos, ni servidores proxy de API, ni solicitudes de inicio de sesión, ni scripts publicitarios. La aplicación funciona como un paquete de distribución estática capaz de funcionar sin conexión.

---

## Muestra de la Interfaz y Pantallas

Para observar la presentación visual de Web Utils, exploremos sus pantallas principales.

### 1. Panel de Categorías y Buscador
La página principal organiza las herramientas en 8 categorías claras junto con búsqueda difusa en vivo y cambio de tema claro u oscuro.

<p align="center">
  <img src="https://raw.githubusercontent.com/breejesh/web-utils/main/doc-images/homepage-dark.png" alt="Página de inicio de Web Utils Tema Oscuro" width="100%" />
</p>

---

### 2. Codificador y Decodificador Base64
Admite codificaciones de juegos de caracteres personalizados, conversiones Base64 seguras para URL, procesamiento línea por línea y opciones de descarga directa de archivos.

<p align="center">
  <img src="https://raw.githubusercontent.com/breejesh/web-utils/main/doc-images/base64-light.png" alt="Herramienta Base64 Tema Claro" width="100%" />
</p>

---

### 3. Entorno de Pruebas de Expresiones Regulares
Evaluación interactiva de expresiones regulares con resaltado de coincidencias en tiempo real, desglose de grupos de captura y vista previa de sustituciones.

<p align="center">
  <img src="https://raw.githubusercontent.com/breejesh/web-utils/main/doc-images/regex-dark.png" alt="Probador de Regex Tema Oscuro" width="100%" />
</p>

---

## Mecánica Técnica: Seguridad en el Cliente y Hilos Secundarios

Ejecutar tareas complejas de seguridad y análisis de registros en el navegador presenta dos exigencias de ingeniería: evitar la confianza en servidores de terceros y prevenir el bloqueo de la interfaz de usuario en el hilo principal.

### 1. Generación de Hashes de Alto Rendimiento con Web Cryptography API
En lugar de importar bibliotecas de criptografía pesadas en JavaScript, Web Utils utiliza la interfaz acelerada por hardware `window.crypto.subtle` del navegador para cálculos SHA-1, SHA-256 y SHA-512.

```typescript
export async function computeHash(
  text: string,
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512'
): Promise<{ hex: string; durationMs: number }> {
  const startTime = performance.now();
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const durationMs = performance.now() - startTime;

  return { hex, durationMs };
}
```

### 2. Análisis de Registros Binarios EVTX mediante Web Workers
Analizar archivos de registro binarios de Windows (`.evtx`) requiere recorrer bloques, registros de eventos y tablas de cadenas. Hacer esto en el hilo principal para un archivo de 50 MB bloquearía la interfaz del navegador. Web Utils delega el análisis de archivos a un Web Worker dedicado usando la propiedad transferible de `ArrayBuffer`:

```typescript
// evtx.worker.ts
import { EvtxParser } from './evtx-parser';

self.addEventListener('message', async (event: MessageEvent<{ fileBuffer: ArrayBuffer }>) => {
  const { fileBuffer } = event.data;
  const parser = new EvtxParser(fileBuffer);
  
  const records = [];
  while (parser.hasNext()) {
    records.push(parser.nextRecord());
    if (records.length % 500 === 0) {
      self.postMessage({ type: 'PROGRESS', parsedCount: records.length });
    }
  }

  self.postMessage({ type: 'COMPLETE', records }, [fileBuffer]);
});
```

---

## Tamaño de Lote en Web Workers vs Capacidad de Respuesta de la Interfaz

Delegar tareas a hilos secundarios requiere ajustar los tamaños de lote para evitar saturar el bucle de eventos del hilo principal:

| Tamaño de Lote (Registros) | Latencia Hilo Principal (p99) | Sobrecarga de PostMessage | Tiempo Total de Análisis (50 MB EVTX) | Caídas de Fotogramas |
| :--- | :--- | :--- | :--- | :--- |
| `10` | `42 ms` | `18.4 ms` | `3.24 s` | Alta (Lags visibles) |
| `100` | `12 ms` | `4.1 ms` | `2.61 s` | Mínima |
| `500` (Óptimo) | `2 ms` | `0.8 ms` | `2.15 s` | `0` (Fluididez 60 FPS) |
| `2500` | `1 ms` | `0.2 ms` | `2.08 s` | `0` (Actualizaciones espaciadas) |
| `10000` | `1 ms` | `0.1 ms` | `2.04 s` | Saltos en la barra de progreso |

---

## Comparativa Cuantitativa de Arquitectura

Comparación entre el procesamiento en el navegador local y las plataformas tradicionales basadas en servidor:

| Métrica de Arquitectura | Web Utils en el Cliente | API de Utilidades en Servidor |
| :--- | :--- | :--- |
| **Salida de Datos por Red** | `0 bytes` | `100% del contenido ingresado` |
| **Riesgo de Filtración** | `Sin riesgo (Sin BD ni registros)` | Moderado a Alto (Registros de servidor) |
| **Latencia de Procesamiento** | `< 1 ms (JS local / WebCrypto)` | `50 ms - 400 ms (RTT + Servidor)` |
| **Disponibilidad Offline** | `100% (PWA / Paquete estático)` | `0% (Requiere Internet)` |
| **Costo de Ejecución** | `$0.00 (Hardware del cliente)` | Costos de Servidores en la Nube |

---

## Casos Límite y Restricciones en Producción

1. **Límites de Memoria Heap V8 en el Navegador:** Archivos grandes (como archivos `.evtx` de más de 250 MB) pueden agotar la memoria asignada en V8 si se mantienen completamente en objetos del DOM. Web Utils mitiga esto transmitiendo registros analizados en señales de visualización paginadas.
2. **Requisito de Contexto Seguro para Web Crypto:** La API Web Cryptography (`crypto.subtle`) está restringida por los navegadores a orígenes HTTPS o `localhost`. Las implementaciones en HTTP no seguro recurren a funciones WebAssembly.
3. **Restricciones CORS en Inspectores de Certificados:** Las inspecciones de certificados SSL no pueden abrir sockets TCP directos a puertos de dominio arbitrarios debido al sandbox del navegador. La decodificación del certificado se realiza analizando cadenas PEM o DER locales.

---

## Resumen y Configuración Local

Web Utils demuestra cómo las señales modernas de Angular y las APIs del navegador permiten ofrecer una suite rápida y privada de herramientas sin mantener infraestructura de servidor.

Para ejecutar la aplicación localmente:

```bash
# Clonar el repositorio
git clone https://github.com/breejesh/web-utils.git
cd web-utils

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo local
npm start
```
