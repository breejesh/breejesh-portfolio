---
title: "Créer une extension Chrome Manifest V3 depuis zéro"
description: "Service workers, content scripts, permissions et les pièges qui gaspillent un après-midi. Une petite extension de comptage de mots à charger en unpacked aujourd'hui."
date: "2026-06-25"
tags: [Outils Développeur]
coverImage: /assets/images/chrome-extension-manifest-v3.webp
previewImage: /assets/images/chrome-extension-manifest-v3.webp
---

Le Chrome Web Store n'accepte plus que les extensions Manifest V3. Si votre dernière extension utilisait encore une page d'arrière-plan persistante, `browserAction` ou un `webRequest` bloquant, ce modèle a disparu. Le remplacement est un **service worker** à durée de vie courte, des permissions plus strictes, et une séparation claire entre le code de la page et le code de l'extension.

Ce billet construit une petite extension de bout en bout: clic sur l'icône de la barre d'outils, comptage des mots sur l'onglet actif, toast sur la page, et badge sur l'icône. Pas de framework, pas d'étape de build. Vous obtenez les pièces utiles sur presque toute extension réelle: **manifest**, **service worker**, **content script**, **messagerie** et **permissions**.

---

## Ce que vous allez construire

**Word Count MV3** fait quatre choses:

1. Se déclare avec un `manifest.json` Manifest V3.
2. Exécute un service worker qui écoute le clic de la barre d'outils.
3. Parle à un content script déjà injecté sur les pages correspondantes.
4. Met à jour le badge de l'action avec le nombre de mots.

Vous la chargez en extension unpacked dans `chrome://extensions`. Cela suffit pour apprendre l'architecture. La publication sur le Web Store est une étape d'empaquetage et de revue au-dessus des mêmes fichiers.

---

## Structure du projet

Gardez la première extension plate. Les monorepos imbriqués peuvent attendre.

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

| Fichier | Rôle |
|---|---|
| `manifest.json` | Contrat avec Chrome: version, scripts, permissions, icônes |
| `background.js` | Service worker: événements, badge, orchestration |
| `content.js` | Tourne dans le monde de la page (isolé): DOM, toast, comptage |
| `styles.css` | CSS injecté pour le toast |
| `icons/` | Visuels de la barre d'outils et de la page de gestion |

Vous pourrez ajouter un `popup.html` plus tard. Les popups sont valides en V3; ils ne remplacent pas le service worker quand vous devez gérer des événements sur la durée.

---

## Esquisse du Manifest V3

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

Quelques champs qui piègent souvent:

* **`manifest_version: 3`** est obligatoire. Il n'y a pas de demi-migration.
* **`background.service_worker`** est un seul chemin de fichier (ou une entrée bundlée). Pas de `"persistent": true`. Pas de tableau de scripts d'arrière-plan comme en V2.
* **`action`** remplace `browser_action` / `page_action`. Une seule entrée de barre d'outils.
* **`content_scripts`** fonctionnent encore pour l'injection statique à l'installation. Pour une injection optionnelle seulement après un geste utilisateur, préférez `chrome.scripting` plus `activeTab`.
* **`permissions`** vs **`host_permissions`**: les capacités d'API vont dans `permissions`. Les motifs d'accès aux sites (`https://api.example.com/*`) vont dans `host_permissions`.

Cet exemple utilise des matches larges de content script pour que le script soit déjà présent au clic. Un produit plus strict peut retirer les `content_scripts` statiques, garder `activeTab` + `scripting`, et injecter seulement au clic. Les deux sont des motifs V3 valides.

---

## Service worker (`background.js`)

Le service worker est le hub d'événements de l'extension. Il démarre quand un événement se déclenche et peut s'arrêter au repos. Ne le traitez pas comme un processus Node toujours vivant.

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

Notes qui font gagner du temps de debug:

* **`chrome.action.onClicked` ne se déclenche pas si vous définissez `default_popup`.** Popup et handler de clic s'excluent pour ce geste.
* **`tabs.sendMessage` échoue** sur les pages où le content script n'a jamais tourné: `chrome://`, le Web Store, le visionneur PDF, certaines pages d'erreur. Interceptez l'erreur.
* **Pas de DOM dans le service worker.** `document`, `window` et `localStorage` n'existent pas. Utilisez `chrome.storage` et des documents offscreen seulement quand vous avez vraiment besoin d'APIs DOM (audio, canvas, etc.).

Si le content script n'est pas enregistré en statique, injectez à la demande:

```javascript
await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  files: ["content.js"],
});
```

Ce chemin exige la permission `scripting` et soit `activeTab` (après un geste utilisateur), soit des `host_permissions` correspondants.

---

## Content script (`content.js`)

Les content scripts partagent le DOM de la page mais pas son monde JavaScript par défaut. Vos variables n'entrent pas en collision avec le bundle React du site, et le site ne peut pas appeler vos fonctions sauf si vous créez un pont exprès.

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

Détails d'isolation à garder en tête:

* **`innerText` vs `textContent`:** `innerText` se rapproche du texte visible. L'UI cachée pollue les deux approches sur les apps lourdes.
* **Main world vs isolated world:** Pour appeler des fonctions définies par la page, il faut un script dans le main world et une messagerie soignée. Restez isolé sauf intégration forcée avec le JS du site.
* **Guerres de CSS:** les sites utilisent des styles globaux agressifs. Préférez un préfixe d'id/classe unique et une bonne spécificité. Le Shadow DOM reste une option pour une UI plus large.

---

## Modèle de permissions (ce que regarde la revue)

Demandez le moindre pouvoir qui fonctionne encore.

| Besoin | Préférer |
|---|---|
| Réagir à l'onglet courant après un clic | `activeTab` |
| Injecter un fichier ou une fonction dans un onglet | `scripting` |
| Lire/écrire les réglages de l'extension | `storage` |
| Accès permanent à `https://api.example.com` | `host_permissions` |
| Ouvrir le side panel | `sidePanel` |
| Intercepter ou modifier des règles réseau | `declarativeNetRequest` (+ rules) |

**`activeTab`** accorde un accès temporaire à l'onglet depuis lequel l'utilisateur vous a invoqué. C'est le bon défaut pour "fais quelque chose quand je clique sur l'icône." L'utilisateur voit moins d'avertissements alarmants à l'installation.

**`host_permissions`** sont un accès permanent aux sites. Utilisez-les pour interroger une API, réécrire des réponses, ou injecter à chaque visite sans geste. Chrome peut les afficher plus nettement à l'install.

**`optional_permissions` / `optional_host_permissions`** permettent de demander plus tard via `chrome.permissions.request`. Utile pour des fonctions avancées que la plupart des gens n'activent jamais.

La modification réseau s'est déplacée nettement vers **declarativeNetRequest**. Les listeners bloquants `webRequest` pour réécrire le contenu ne sont pas le chemin V3. Si votre ancienne extension réécrivait des en-têtes dans un gros `onBeforeRequest`, prévoyez un redesign de ruleset, pas un port ligne à ligne.

---

## Motifs de messagerie

Trois canaux couvrent la plupart des apps:

1. **`chrome.runtime.sendMessage` / `onMessage`** entre pages d'extension, service worker et content scripts.
2. **`chrome.tabs.sendMessage`** depuis le contexte d'extension vers le content script d'un onglet précis.
3. **`chrome.runtime.connect`** pour des ports plus longs (logs en flux, UI multi-étapes).

Règles simples:

* Un champ `type` clair sur chaque message.
* Validez la forme du message avant d'agir.
* `sendResponse` devient gênant avec du travail async: soit `return true` puis appel plus tard, soit renvoyer une Promise depuis un listener `async` (supporté dans Chromium moderne pour la messagerie d'extensions).
* Les content scripts n'appellent pas la plupart des APIs privilégiées; le service worker fait le travail privilégié et renvoie les données.

Exemple de storage derrière le worker:

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

## Charger en unpacked

1. Ouvrez `chrome://extensions`.
2. Activez **Developer mode**.
3. **Load unpacked** et sélectionnez le dossier `word-count-mv3`.
4. Ouvrez une page `https://` normale.
5. Cliquez sur l'icône puzzle, épinglez l'extension, puis cliquez dessus.
6. Vérifiez le toast et le badge.

Après chaque modification du service worker, cliquez **Reload** sur la carte de l'extension. Les changements de content script s'appliquent au prochain chargement complet (ou à la réinjection). Les workers périmés sont une source classique de "j'ai corrigé et rien ne change."

Inspectez les logs:

* Service worker: `chrome://extensions` → votre carte → lien **Service worker** (DevTools du worker).
* Content script: console DevTools normale de la page (filtrez par contexte si besoin).

---

## Pièges fréquents

### 1. Traiter le service worker comme toujours actif

Les timers, WebSockets ouverts et caches en mémoire meurent quand le worker est suspendu. Persistez l'état important dans `chrome.storage`. Utilisez les alarms (`chrome.alarms`) pour les réveils plutôt que de longues chaînes de `setInterval`. Si vous avez besoin d'un socket, prévoyez la reconnexion au réveil.

### 2. Code distant et CSP strict

V3 interdit l'exécution de scripts distants et interdit en pratique `eval` / `new Function` dans les contextes d'extension. Bundlez votre code. La logique vit dans le paquet. Le CSP de l'extension est plus strict que celui d'un site lambda.

### 3. `"matches"` qui ne se déclenchent jamais

Les pages `file://` exigent `"allow_access_to_file_urls"` (bascule utilisateur) et des matches explicites `file:///*`. `chrome://` et le Web Store sont hors limites. L'injection dans les iframes demande `all_frames: true` si vous vous souciez des sous-frames.

### 4. Permission refusée à l'exécution

Les permissions déclarées ne sont pas les permissions optionnelles accordées. `activeTab` ne s'applique qu'après un geste utilisateur sur cet onglet. Un `fetch('https://...')` depuis le worker sans host permission échoue même si un content script sur cette page pourrait charger la même URL autrement.

### 5. Messagerie cassée après navigation

Vous envoyez un message pendant la navigation; le content script destinataire a disparu. Attendez le statut complete de `tabs.onUpdated`, ou réessayez une fois après injection.

### 6. Fuite d'état badge / action

Le texte du badge est facile à poser et facile à laisser périmé entre onglets. Préférez les APIs de badge scopées par `tabId` quand le nombre est propre à la page.

### 7. Module workers sans `"type": "module"`

Si vous écrivez `import` dans `background.js`, définissez:

```json
"background": {
  "service_worker": "background.js",
  "type": "module"
}
```

Sinon le worker ne démarre pas et l'extension semble "morte."

### 8. Attendre `XMLHttpRequest` partout

Préférez `fetch` dans les service workers. Beaucoup d'anciens extraits montrent encore des motifs XHR des background pages.

### 9. Host permissions trop larges pour une démo

`"<all_urls>"` fonctionne et vous entraîne aussi vers un problème de revue. Commencez étroit. Élargissez quand une fonction l'impose.

### 10. Oublier les icônes

Sans icônes, l'extension paraît amateur et se trouve mal dans la barre. Fournissez au minimum 16, 48 et 128.

---

## Checklist minimale avant d'ajouter des fonctions

* [ ] `manifest_version` vaut `3`
* [ ] Le background est un chemin de service worker
* [ ] Les permissions correspondent à l'usage réel des APIs
* [ ] Les matches de content script (ou l'injection dynamique) ne couvrent que les sites visés
* [ ] Les messages ont une forme typée ou versionnée
* [ ] Le code du worker se recharge proprement; pas de dépendance à une mémoire éternelle
* [ ] Les pages restreintes ont un chemin d'échec géré
* [ ] Icônes et nom sont prêts pour la barre d'outils

Quand cette liste devient ennuyeuse, ajoutez un popup, une page d'options, des menus contextuels (`contextMenus`) ou un side panel. L'ossature reste la même: **le manifest déclare, le worker orchestre, le content script touche le DOM, les permissions restent minimales.**

---

## Conclusion

Manifest V3 porte moins sur une nouvelle syntaxe JavaScript que sur le cycle de vie et les privilèges. Le service worker s'endormira. Les content scripts restent isolés. Les permissions sont découpées exprès. Si vous concevez avec ces contraintes dès le premier `manifest.json`, la plupart des bugs du type "mon extension s'arrête au hasard" n'apparaissent jamais.

Reprenez la structure ci-dessus, chargez-la en unpacked, cassez volontairement le `type` du message, et regardez l'échec dans les DevTools du worker. Cette boucle de dix minutes enseigne plus qu'une autre comparaison abstraite de V2 et V3.

Quand vous dépassez les démos, lisez la documentation actuelle des extensions Chrome sur l'enregistrement `service_worker`, `activeTab` et declarative net request. Les APIs évoluent par petits détails; l'architecture ci-dessus est la forme stable des extensions Chrome depuis des années, et c'est celle sur laquelle construire en 2026.
