---
title: "Build a Manifest V3 Chrome Extension from Scratch"
description: "Service workers, content scripts, permissions, and the pitfalls that waste an afternoon. A small word-count extension you can load unpacked today."
date: "2026-06-25"
tags: [Web Development]
coverImage: /assets/images/chrome-extension-manifest-v3.webp
previewImage: /assets/images/chrome-extension-manifest-v3.webp
---

Chrome Web Store only accepts Manifest V3 extensions now. If your last extension still used a persistent background page, `browserAction`, or blocking `webRequest`, that model is gone. The replacement is a short-lived **service worker**, tighter permissions, and a clearer split between page code and extension code.

This post builds a tiny extension end to end: click the toolbar icon, count words on the active tab, show a toast on the page, and put the count on the icon badge. No framework, no build step. You get the pieces that matter on almost every real extension: **manifest**, **service worker**, **content script**, **messaging**, and **permissions**.

---

## What you will build

**Word Count MV3** does four things:

1. Declares itself with a Manifest V3 `manifest.json`.
2. Runs a service worker that listens for the toolbar click.
3. Talks to a content script already injected on matching pages.
4. Updates the action badge with the word count.

You load it as an unpacked extension in `chrome://extensions`. That is enough to learn the architecture. Shipping to the Web Store is a packaging and review step on top of the same files.

---

## Project structure

Keep the first extension flat. Nested monorepos can wait.

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

| File | Role |
|---|---|
| `manifest.json` | Contract with Chrome: version, scripts, permissions, icons |
| `background.js` | Service worker: events, badge, orchestration |
| `content.js` | Runs in the page world (isolated): DOM, toast, word count |
| `styles.css` | Injected CSS for the toast |
| `icons/` | Toolbar and management page artwork |

You can add a `popup.html` later. Popups are fine in V3; they are not a substitute for the service worker when you need long-lived event handling.

---

## Manifest V3 sketch

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

A few fields that trip people up:

* **`manifest_version: 3`** is required. There is no half-migration.
* **`background.service_worker`** is a single file path (or a bundled entry). No `"persistent": true`. No array of background scripts like V2.
* **`action`** replaces `browser_action` / `page_action`. One toolbar entry.
* **`content_scripts`** still work for static injection at install time. For optional injection only after a user gesture, prefer `chrome.scripting` plus `activeTab`.
* **`permissions`** vs **`host_permissions`**: API capabilities go in `permissions`. Site access patterns (`https://api.example.com/*`) go in `host_permissions`.

This sample uses broad content-script matches so the script is already present when you click. A tighter product might drop static `content_scripts`, keep `activeTab` + `scripting`, and inject only on click. Both are valid V3 patterns.

---

## Service worker (`background.js`)

The service worker is the extension's event hub. It starts when an event fires and can stop when idle. Do not treat it like a Node process that stays up forever.

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

Notes that save debugging time:

* **`chrome.action.onClicked` does not fire if you set `default_popup`.** Popup and click handler are mutually exclusive for that user gesture.
* **`tabs.sendMessage` fails** on pages where your content script never ran: `chrome://`, the Web Store, PDF viewer, and some error pages. Catch it.
* **No DOM in the service worker.** `document`, `window`, and `localStorage` are not available. Use `chrome.storage` and offscreen documents only when you truly need DOM APIs (audio, canvas, etc.).

If the content script is not registered statically, inject on demand:

```javascript
await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  files: ["content.js"],
});
```

That path needs the `scripting` permission and either `activeTab` (after a user gesture) or matching `host_permissions`.

---

## Content script (`content.js`)

Content scripts share the page's DOM but not its JavaScript world by default. Your variables do not collide with the site's React bundle, and the site cannot call your functions unless you bridge on purpose.

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

Isolation details worth remembering:

* **`innerText` vs `textContent`:** `innerText` roughly matches visible text. Hidden UI still pollutes either approach on heavy apps.
* **Main world vs isolated world:** To call page-defined functions you need a script tag in the page (main world) plus careful messaging. Prefer staying isolated unless you must integrate with the page's own JS.
* **CSS wars:** Sites use aggressive global styles. Prefer a unique id/class prefix and high specificity. Shadow DOM is an option for larger UI.

---

## Permissions model (the part reviews care about)

Ask for the least power that still works.

| Need | Prefer |
|---|---|
| React to the current tab after a click | `activeTab` |
| Inject a file or function into a tab | `scripting` |
| Read/write extension settings | `storage` |
| Always access `https://api.example.com` | `host_permissions` |
| Open the side panel | `sidePanel` |
| Intercept/modify network rules | `declarativeNetRequest` (+ rules) |

**`activeTab`** grants temporary access to the tab the user invoked you on. It is the right default for "do something when I click the icon." Users see fewer scary install prompts.

**`host_permissions`** are permanent site access. Use them when you poll an API, rewrite responses, or inject on every visit without a gesture. Chrome may show them more prominently at install.

**`optional_permissions` / `optional_host_permissions`** let you request more later with `chrome.permissions.request`. Good for power features that most users never enable.

Network modification moved hard toward **declarativeNetRequest**. Blocking `webRequest` listeners for general content modification are not the V3 path. If your old extension rewrote headers in a big `onBeforeRequest` handler, plan a ruleset redesign, not a line-for-line port.

---

## Messaging patterns

Three channels cover most apps:

1. **`chrome.runtime.sendMessage` / `onMessage`** between extension pages, service worker, and content scripts.
2. **`chrome.tabs.sendMessage`** from extension context to a specific tab's content script.
3. **`chrome.runtime.connect`** for longer-lived ports (streaming logs, multi-step UI).

Rules of thumb:

* One clear `type` field on every message object.
* Validate message shape before acting.
* `sendResponse` is awkward with async work: either `return true` and call it later, or prefer returning a Promise from an `async` listener (supported in modern Chromium for extension messaging).
* Content scripts cannot call most privileged APIs directly; the service worker does privileged work and returns data.

Example of storage behind the worker:

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

## Load it unpacked

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. **Load unpacked** and select the `word-count-mv3` folder.
4. Open any normal `https://` page.
5. Click the puzzle icon, pin your extension, then click it.
6. Confirm the toast and the badge.

After every edit to the service worker, hit **Reload** on the extension card. Content script changes apply on the next full page load (or re-inject). Stale workers are a common "I fixed it but nothing changed" source.

Inspect logs:

* Service worker: `chrome://extensions` → your card → **Service worker** link (DevTools for the worker).
* Content script: normal page DevTools console (filter by context if needed).

---

## Common pitfalls

### 1. Treating the service worker as always on

Timers, open WebSockets, and in-memory caches die when the worker is suspended. Persist important state in `chrome.storage`. Use alarms (`chrome.alarms`) for wakeups instead of long `setInterval` chains. If you need a socket, design reconnect-on-wake behavior.

### 2. Remote code and strict CSP

V3 forbids executing remote scripts and largely forbids `eval` / `new Function` in extension contexts. Bundle your code. Host logic inside the package. The extension CSP is stricter than a random website.

### 3. `"matches"` that never fire

`file://` pages need `"allow_access_to_file_urls"` (user toggle) and explicit `file:///*` matches. `chrome://` and the Web Store are off limits. iframe injection needs `all_frames: true` when you care about subframes.

### 4. Permission denied at runtime

Declared permissions are not the same as granted optional permissions. `activeTab` only applies after a user gesture on that tab. Calling `fetch('https://...')` from the worker without host permission fails even if a content script on that page could load the same URL in other ways.

### 5. Broken messaging after navigation

You send a message while the tab is mid-navigation; the receiving content script is gone. Gate on `tabs.onUpdated` complete status, or retry once after inject.

### 6. Badge and action state leakage

Badge text is easy to set and easy to leave stale across tabs. Prefer `tabId`-scoped badge APIs when the number is page-specific.

### 7. Module workers without `"type": "module"`

If you write `import` in `background.js`, set:

```json
"background": {
  "service_worker": "background.js",
  "type": "module"
}
```

Otherwise the worker fails to start and the extension looks "dead."

### 8. Expecting `XMLHttpRequest` everywhere

Prefer `fetch` in service workers. Some older snippets still show XHR patterns from background pages.

### 9. Over-broad host permissions for a demo

`"<all_urls>"` works and also trains you into a review problem. Start narrow. Expand when a feature forces it.

### 10. Forgetting icons

Missing icons look unprofessional and make the toolbar hard to spot. Ship 16, 48, and 128 at minimum.

---

## Minimal checklist before you add features

* [ ] `manifest_version` is `3`
* [ ] Background is a service worker path
* [ ] Permissions match real API usage
* [ ] Content script matches (or dynamic inject) cover intended sites only
* [ ] Messages have a versioned or typed shape
* [ ] Worker code reloads cleanly; no reliance on forever-alive memory
* [ ] Failure paths for restricted pages are handled
* [ ] Icons and name are set for the toolbar

Once that checklist is boring, add a popup, options page, context menus (`contextMenus`), or a side panel. The spine stays the same: **manifest declares, worker orchestrates, content script touches the DOM, permissions stay minimal.**

---

## Closing

Manifest V3 is less about new JavaScript syntax and more about lifecycle and privilege. The service worker will go to sleep. Content scripts stay isolated. Permissions are split on purpose. If you design for those constraints from the first `manifest.json`, most "my extension randomly stops working" bugs never show up.

Clone the structure above, load it unpacked, break the message type on purpose, and watch the failure in the worker DevTools. That ten-minute loop teaches more than another abstract comparison of V2 and V3.

When you move past demos, read Chrome's current extension docs for `service_worker` registration, `activeTab`, and declarative net request. APIs evolve in small ways; the architecture above has been the stable shape of Chrome extensions for years and is what you should build on in 2026.
