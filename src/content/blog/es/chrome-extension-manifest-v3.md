---
title: "Crea una extensión Chrome Manifest V3 desde cero"
description: "Service workers, content scripts, permisos y los fallos que te queman una tarde. Una extensión pequeña de conteo de palabras para cargar unpacked hoy."
date: "2026-06-25"
tags: [Frontend y Desarrollo Web]
coverImage: /assets/images/chrome-extension-manifest-v3.webp
previewImage: /assets/images/chrome-extension-manifest-v3.webp
---

Chrome Web Store solo acepta extensiones Manifest V3. Si tu última extensión aún usaba una página de fondo persistente, `browserAction` o `webRequest` bloqueante, ese modelo ya no existe. El reemplazo es un **service worker** de vida corta, permisos más estrictos y una separación clara entre código de la página y código de la extensión.

Este post monta una extensión pequeña de punta a punta: clic en el icono de la barra, contar palabras en la pestaña activa, mostrar un toast en la página y poner el número en el badge del icono. Sin framework ni build step. Tienes las piezas que importan en casi cualquier extensión real: **manifest**, **service worker**, **content script**, **mensajería** y **permisos**.

---

## Qué vas a construir

**Word Count MV3** hace cuatro cosas:

1. Se declara con un `manifest.json` de Manifest V3.
2. Ejecuta un service worker que escucha el clic de la barra.
3. Habla con un content script ya inyectado en las páginas que coinciden.
4. Actualiza el badge de la action con el conteo de palabras.

La cargas como extensión unpacked en `chrome://extensions`. Eso basta para aprender la arquitectura. Publicar en la Web Store es empaquetado y revisión encima de los mismos archivos.

---

## Estructura del proyecto

Mantén la primera extensión plana. Los monorepos anidados pueden esperar.

```
word-count-mv3/
  manifest.json
  background.js
  content.js
  styles.css
  icons/
    icon16.png
    icon48.png
    icon128.png
```

| Archivo | Rol |
|---|---|
| `manifest.json` | Contrato con Chrome: versión, scripts, permisos, iconos |
| `background.js` | Service worker: eventos, badge, orquestación |
| `content.js` | Corre en el mundo de la página (aislado): DOM, toast, conteo |
| `styles.css` | CSS inyectado para el toast |
| `icons/` | Arte de la barra y de la página de administración |

Puedes añadir un `popup.html` después. Los popups están bien en V3; no sustituyen al service worker cuando necesitas manejar eventos de forma continua.

---

## Esquema de Manifest V3

```json
{
  "manifest_version": 3,
  "name": "Word Count MV3",
  "version": "1.0.0",
  "description": "Count words on the current page from the toolbar.",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_title": "Count words on this page",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["http://*/*", "https://*/*"],
      "js": ["content.js"],
      "css": ["styles.css"],
      "run_at": "document_idle"
    }
  ],
  "permissions": ["activeTab", "scripting"],
  "host_permissions": []
}
```

Campos que suelen confundir:

* **`manifest_version: 3`** es obligatorio. No hay media migración.
* **`background.service_worker`** es una sola ruta de archivo (o un entry empaquetado). No hay `"persistent": true`. No hay array de scripts de fondo como en V2.
* **`action`** reemplaza `browser_action` / `page_action`. Una sola entrada en la barra.
* **`content_scripts`** siguen sirviendo para inyección estática en el install. Para inyectar solo tras un gesto del usuario, prefiere `chrome.scripting` más `activeTab`.
* **`permissions`** vs **`host_permissions`**: las capacidades de API van en `permissions`. Los patrones de acceso a sitios (`https://api.example.com/*`) van en `host_permissions`.

Este ejemplo usa matches amplios de content script para que el script ya esté presente al hacer clic. Un producto más estricto puede quitar `content_scripts` estáticos, quedarse con `activeTab` + `scripting` e inyectar solo al clic. Ambos son patrones V3 válidos.

---

## Service worker (`background.js`)

El service worker es el hub de eventos de la extensión. Arranca cuando dispara un evento y puede detenerse en reposo. No lo trates como un proceso Node que vive para siempre.

```javascript
// background.js
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "COUNT_WORDS",
    });

    const count = response?.count ?? 0;
    const text = count > 999 ? "999+" : String(count);

    await chrome.action.setBadgeText({ tabId: tab.id, text });
    await chrome.action.setBadgeBackgroundColor({
      tabId: tab.id,
      color: "#2563eb",
    });
  } catch (err) {
    // Content script missing (chrome:// pages, Web Store, not injected yet)
    await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    console.warn("Word count failed:", err);
  }
});

// Optional: clear badge when the user navigates the tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    chrome.action.setBadgeText({ tabId, text: "" });
  }
});
```

Notas que ahorran tiempo de debug:

* **`chrome.action.onClicked` no dispara si defines `default_popup`.** Popup y handler de clic son excluyentes para ese gesto.
* **`tabs.sendMessage` falla** en páginas donde el content script nunca corrió: `chrome://`, la Web Store, el visor PDF y algunas páginas de error. Captura el error.
* **No hay DOM en el service worker.** `document`, `window` y `localStorage` no existen. Usa `chrome.storage` y documentos offscreen solo cuando de verdad necesites APIs de DOM (audio, canvas, etc.).

Si el content script no está registrado de forma estática, inyecta bajo demanda:

```javascript
await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  files: ["content.js"],
});
```

Esa ruta necesita el permiso `scripting` y o bien `activeTab` (tras un gesto del usuario) o `host_permissions` que coincidan.

---

## Content script (`content.js`)

Los content scripts comparten el DOM de la página pero no su mundo JavaScript por defecto. Tus variables no chocan con el bundle React del sitio, y el sitio no puede llamar a tus funciones salvo que crees un puente a propósito.

```javascript
// content.js
function countWords(root = document.body) {
  const text = root?.innerText || "";
  const parts = text.trim().split(/\s+/).filter(Boolean);
  return parts.length;
}

function showToast(message) {
  const existing = document.getElementById("wc-mv3-toast");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.id = "wc-mv3-toast";
  el.className = "wc-mv3-toast";
  el.textContent = message;
  document.documentElement.appendChild(el);

  setTimeout(() => el.remove(), 2500);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "COUNT_WORDS") return;

  const count = countWords();
  showToast(`Words on this page: ${count}`);
  sendResponse({ count });
  // Return false: response is sync. Use return true only for async sendResponse.
});
```

```css
/* styles.css */
.wc-mv3-toast {
  position: fixed;
  z-index: 2147483647;
  right: 16px;
  bottom: 16px;
  max-width: min(360px, 90vw);
  padding: 12px 16px;
  border-radius: 10px;
  background: #0f172a;
  color: #f8fafc;
  font: 14px/1.4 system-ui, sans-serif;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}
```

Detalles de aislamiento que conviene recordar:

* **`innerText` vs `textContent`:** `innerText` se acerca más al texto visible. La UI oculta ensucia ambos enfoques en apps pesadas.
* **Main world vs isolated world:** Para llamar funciones definidas por la página necesitas un script en el main world y mensajería cuidadosa. Quédate aislado salvo que debas integrarte con el JS del sitio.
* **Guerras de CSS:** los sitios usan estilos globales agresivos. Prefiere un prefijo de id/clase único y buena especificidad. Shadow DOM es una opción para UI más grande.

---

## Modelo de permisos (lo que mira la revisión)

Pide el menor poder que aún funcione.

| Necesidad | Preferir |
|---|---|
| Reaccionar a la pestaña actual tras un clic | `activeTab` |
| Inyectar un archivo o función en una pestaña | `scripting` |
| Leer/escribir ajustes de la extensión | `storage` |
| Acceso fijo a `https://api.example.com` | `host_permissions` |
| Abrir el side panel | `sidePanel` |
| Interceptar o modificar reglas de red | `declarativeNetRequest` (+ rules) |

**`activeTab`** da acceso temporal a la pestaña desde la que te invocaron. Es el valor por defecto sensato para "haz algo cuando hago clic en el icono." El usuario ve menos avisos alarmantes en el install.

**`host_permissions`** son acceso permanente a sitios. Úsalos cuando haces poll a una API, reescribes respuestas o inyectas en cada visita sin gesto. Chrome puede mostrarlos con más peso en el install.

**`optional_permissions` / `optional_host_permissions`** permiten pedir más después con `chrome.permissions.request`. Bien para funciones avanzadas que la mayoría nunca activa.

La modificación de red se movió con fuerza hacia **declarativeNetRequest**. Los listeners bloqueantes de `webRequest` para reescribir contenido no son el camino V3. Si tu extensión antigua reescribía cabeceras en un gran `onBeforeRequest`, planifica un rediseño de ruleset, no un port línea a línea.

---

## Patrones de mensajería

Tres canales cubren la mayoría de apps:

1. **`chrome.runtime.sendMessage` / `onMessage`** entre páginas de la extensión, service worker y content scripts.
2. **`chrome.tabs.sendMessage`** desde el contexto de la extensión a un content script de una pestaña concreta.
3. **`chrome.runtime.connect`** para puertos de vida más larga (logs en streaming, UI en varios pasos).

Reglas prácticas:

* Un campo `type` claro en cada mensaje.
* Valida la forma del mensaje antes de actuar.
* `sendResponse` se complica con trabajo async: o bien `return true` y lo llamas después, o prefieres devolver una Promise desde un listener `async` (soportado en Chromium moderno para mensajería de extensiones).
* Los content scripts no pueden llamar la mayoría de APIs privilegiadas; el service worker hace el trabajo privilegiado y devuelve datos.

Ejemplo de storage detrás del worker:

```javascript
// content -> worker
chrome.runtime.sendMessage({ type: "SAVE_COUNT", count: 42 });

// worker
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SAVE_COUNT") {
    chrome.storage.local.set({ lastCount: msg.count }).then(() => {
      sendResponse({ ok: true });
    });
    return true; // keep channel open for async response
  }
});
```

---

## Cargarla unpacked

1. Abre `chrome://extensions`.
2. Activa **Developer mode**.
3. **Load unpacked** y elige la carpeta `word-count-mv3`.
4. Abre cualquier página normal `https://`.
5. Clic en el icono del puzzle, fija la extensión y haz clic en ella.
6. Confirma el toast y el badge.

Tras cada cambio en el service worker, pulsa **Reload** en la tarjeta de la extensión. Los cambios del content script aplican en la siguiente carga completa (o al reinyectar). Los workers viejos son una fuente habitual de "lo arreglé y no cambia nada."

Inspecciona logs:

* Service worker: `chrome://extensions` → tu tarjeta → enlace **Service worker** (DevTools del worker).
* Content script: consola DevTools normal de la página (filtra por contexto si hace falta).

---

## Fallos habituales

### 1. Tratar el service worker como siempre encendido

Timers, WebSockets abiertos y caches en memoria mueren cuando el worker se suspende. Persiste el estado importante en `chrome.storage`. Usa alarms (`chrome.alarms`) para despertar en lugar de cadenas largas de `setInterval`. Si necesitas un socket, diseña reconexión al despertar.

### 2. Código remoto y CSP estricto

V3 prohíbe ejecutar scripts remotos y en la práctica prohíbe `eval` / `new Function` en contextos de extensión. Empaqueta tu código. La lógica vive dentro del paquete. El CSP de la extensión es más estricto que el de un sitio cualquiera.

### 3. `"matches"` que nunca disparan

Las páginas `file://` necesitan `"allow_access_to_file_urls"` (toggle del usuario) y matches explícitos `file:///*`. `chrome://` y la Web Store están fuera de límites. La inyección en iframes necesita `all_frames: true` si te importan los subframes.

### 4. Permiso denegado en runtime

Los permisos declarados no son lo mismo que los opcionales concedidos. `activeTab` solo aplica tras un gesto del usuario en esa pestaña. Un `fetch('https://...')` desde el worker sin host permission falla aunque un content script en esa página pudiera cargar la misma URL de otras formas.

### 5. Mensajería rota tras navegación

Envías un mensaje mientras la pestaña navega; el content script receptor ya no está. Espera al estado complete de `tabs.onUpdated`, o reintenta una vez tras inyectar.

### 6. Estado de badge y action que se filtra

El texto del badge es fácil de poner y fácil de dejar obsoleto entre pestañas. Prefiere las APIs de badge con `tabId` cuando el número es específico de la página.

### 7. Module workers sin `"type": "module"`

Si usas `import` en `background.js`, define:

```json
"background": {
  "service_worker": "background.js",
  "type": "module"
}
```

Si no, el worker no arranca y la extensión parece "muerta."

### 8. Esperar `XMLHttpRequest` en todas partes

Prefiere `fetch` en service workers. Muchos snippets viejos aún muestran patrones XHR de las background pages.

### 9. Host permissions demasiado amplios para un demo

`"<all_urls>"` funciona y también te entrena para un problema de revisión. Empieza estrecho. Amplía cuando una función lo exija.

### 10. Olvidar los iconos

Sin iconos se ve poco profesional y cuesta encontrar la extensión en la barra. Incluye al menos 16, 48 y 128.

---

## Checklist mínima antes de sumar features

* [ ] `manifest_version` es `3`
* [ ] El background es una ruta de service worker
* [ ] Los permisos coinciden con el uso real de APIs
* [ ] Los matches del content script (o la inyección dinámica) cubren solo los sitios previstos
* [ ] Los mensajes tienen una forma tipada o versionada
* [ ] El código del worker recarga limpio; no depende de memoria eterna
* [ ] Hay manejo de fallo en páginas restringidas
* [ ] Iconos y nombre están listos para la barra

Cuando esa lista sea aburrida, añade un popup, options page, menús contextuales (`contextMenus`) o un side panel. La columna vertebral no cambia: **el manifest declara, el worker orquesta, el content script toca el DOM, los permisos se quedan mínimos.**

---

## Cierre

Manifest V3 no va tanto de sintaxis JavaScript nueva como de ciclo de vida y privilegio. El service worker se dormirá. Los content scripts siguen aislados. Los permisos se parten a propósito. Si diseñas con esas restricciones desde el primer `manifest.json`, la mayoría de bugs de "mi extensión deja de funcionar al azar" no aparecen.

Copia la estructura de arriba, cárgala unpacked, rompe el `type` del mensaje a propósito y mira el fallo en el DevTools del worker. Ese bucle de diez minutos enseña más que otra comparación abstracta de V2 y V3.

Cuando pases de demos, lee la documentación actual de extensiones de Chrome sobre registro de `service_worker`, `activeTab` y declarative net request. Las APIs cambian en detalles pequeños; la arquitectura de arriba es la forma estable de las extensiones Chrome desde hace años y es sobre lo que conviene construir en 2026.
