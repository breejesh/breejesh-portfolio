---
title: "Web Utils: Suite d'Outils Développeurs 100% Côté Client avec Angular 19"
description: "Un examen technique de Web Utils, une suite d'outils web axée sur la confidentialité comprenant 28 outils développeurs exécutés dans le navigateur via Angular 19, Signals et Web Workers."
date: "2026-08-09"
tags: [Frontend et Développement Web, Cybersécurité et Réseaux]
coverImage: /assets/images/web-utils-showcase.webp
previewImage: /assets/images/web-utils-showcase.webp
---

> **TL;DR**
> * **Le Problème:** Les outils en ligne pour le décodage Base64, l'inspection JWT et l'analyse de journaux envoient fréquemment des données sensibles et des clés d'API à des serveurs tiers.
> * **La Solution:** Traiter les données entièrement côté client en associant les Signals d'Angular 19, l'API Web Cryptography et des threads Web Workers secondaires.
> * **Le Résultat:** 28 outils développeurs prêts pour la production fonctionnant avec 0 octet de sortie réseau, une exécution locale sous la milliseconde et un isolement total des données.

Les outils développeurs sur le web partagent un problème courant de confidentialité: coller du texte confidentiel, des jetons d'autorisation JWT ou des journaux internes sur des sites tiers transmet souvent vos données à des systèmes d'enregistrement et d'analyse distants.

**Web Utils est conçu comme une alternative axée sur la confidentialité.** Il s'agit d'une suite d'applications 100% côté client, sans serveur backend, qui exécute chaque transformation, calcul de hachage et analyse de journaux directement dans l'onglet de votre navigateur.

* **Dépôt GitHub:** [github.com/breejesh/web-utils](https://github.com/breejesh/web-utils)
* **Démonstration en Ligne:** [utils.breejeshrathod.com](https://utils.breejeshrathod.com/)

---

## Les Quatre Piliers de l'Architecture

Web Utils s'appuie sur quatre choix de conception pour garantir des performances élevées et une confidentialité totale:

### 1. Isolement des Données 100% Côté Client
Chaque outil de la suite s'exécute localement. Les données saisies, collées depuis le presse-papiers ou chargées depuis le disque sont traitées avec du code JavaScript, l'API Web Cryptography et des Web Workers. La télémétrie réseau est strictement nulle pour le contenu des outils.

### 2. Architecture avec Signals Autonomes Angular 19
Construit avec des composants autonomes Angular 19, les mises à jour d'état sont gérées par des primitives `signal()` et `computed()`. Cela évite les rendus inutiles lors de la saisie dans des outils comme la comparaison de texte ou l'évaluation d'expressions régulières.

### 3. Pré-rendu Esthétique SSR pour le Référencement et la Rapidité
Chaque outil dispose de sa propre URL dédiée (telle que `/tools/jwt-debugger` ou `/tools/evtx-viewer`). Le pré-rendu statique via `@angular/ssr` génère du HTML statique lors de la compilation, offrant des temps de chargement immédiats et un référencement complet.

### 4. Zéro Infrastructure Serveur et Zéro Suivi Publicitaire
Aucune connexion à des bases de données, aucun proxy API, aucune demande de connexion et aucun script publicitaire. L'application fonctionne comme une distribution statique utilisable hors ligne.

---

## Présentation de l'Interface et des Écrans

Pour découvrir l'ergonomie de Web Utils, examinons les interfaces principales.

### 1. Tableau de Bord des Catégories et Recherche
La page d'accueil regroupe les outils en 8 catégories distinctes avec une recherche floue en direct et un sélecteur de thème sombre ou clair.

<p align="center">
  <img src="https://raw.githubusercontent.com/breejesh/web-utils/main/doc-images/homepage-dark.png" alt="Accueil Web Utils Thème Sombre" width="100%" />
</p>

---

### 2. Encodeur et Décodeur Base64
Prend en charge les jeux de caractères personnalisés, la conversion Base64 compatible URL, le traitement ligne par ligne et le téléchargement direct de fichiers.

<p align="center">
  <img src="https://raw.githubusercontent.com/breejesh/web-utils/main/doc-images/base64-light.png" alt="Outil Base64 Thème Clair" width="100%" />
</p>

---

### 3. Testeur d'Expressions Régulières
Évaluation interactive d'expressions régulières avec mise en évidence des correspondances en temps réel, détails des groupes de capture et aperçu des substitutions.

<p align="center">
  <img src="https://raw.githubusercontent.com/breejesh/web-utils/main/doc-images/regex-dark.png" alt="Testeur Regex Thème Sombre" width="100%" />
</p>

---

## Fonctionnement Technique: Sécurité Client et Web Workers

Exécuter des opérations complexes de sécurité et d'analyse de journaux dans le navigateur implique deux exigences techniques: éliminer la dépendance aux serveurs tiers et éviter le blocage de l'interface utilisateur.

### 1. Calcul de Hachage Optimisé via l'API Web Cryptography
Plutôt que d'intégrer des bibliothèques JavaScript lourdes, Web Utils utilise l'interface matérielle `window.crypto.subtle` du navigateur pour les calculs SHA-1, SHA-256 et SHA-512.

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

### 2. Déport de l'Analyse des Fichiers EVTX vers un Web Worker
L'analyse des fichiers de journaux binaires Windows (`.evtx`) nécessite le parcours de blocs, d'enregistrements d'événements et de tables de chaînes. Réaliser cela sur le thread principal pour un fichier de 50 Mo bloquerait l'interface. Web Utils délègue l'analyse à un Web Worker dédié grâce aux objets transférables `ArrayBuffer`:

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

## Taille de Lot du Web Worker et Réactivité de l'Interface

Le traitement en arrière-plan nécessite d'ajuster la taille des lots pour éviter de surcharger la boucle d'événements du thread principal:

| Taille de Lot (Enregistrements) | Latence Thread Principal (p99) | Surcharge PostMessage | Temps Total d'Analyse (50 Mo EVTX) | Saccades d'Affichage |
| :--- | :--- | :--- | :--- | :--- |
| `10` | `42 ms` | `18.4 ms` | `3.24 s` | Élevées (Saccades) |
| `100` | `12 ms` | `4.1 ms` | `2.61 s` | Minimale |
| `500` (Optimal) | `2 ms` | `0.8 ms` | `2.15 s` | `0` (Fluidité 60 FPS) |
| `2500` | `1 ms` | `0.2 ms` | `2.08 s` | `0` (Mises à jour espacées) |
| `10000` | `1 ms` | `0.1 ms` | `2.04 s` | Sautes de la barre de progression |

---

## Comparaison Quantitative d'Architecture

Comparatif entre le traitement local dans le navigateur et les plateformes avec serveur distant:

| Critère Architectural | Web Utils Côté Client | API Utilitaire sur Serveur |
| :--- | :--- | :--- |
| **Sortie de Données Réseau** | `0 octet` | `100% des données transmises` |
| **Risque de Fuite de Données** | `Aucun risque (Sans BD ni journal)` | Modéré à Élevé (Journaux serveurs) |
| **Latence de Traitement** | `< 1 ms (JS local / WebCrypto)` | `50 ms - 400 ms (RTT + Serveur)` |
| **Disponible Hors Ligne** | `100% (PWA / Paquet statique)` | `0% (Internet requis)` |
| **Coût d'Exécution** | `0,00 $ (Matériel client)` | Coûts d'Infrastructure Cloud |

---

## Cas Limites et Contraintes de Production

1. **Limites de Mémoire V8 pour les Fichiers Volumineux:** Les fichiers volumineux (comme les fichiers `.evtx` de plus de 250 Mo) dépassent la mémoire V8 s'ils sont conservés sous forme de nœuds DOM. Web Utils évite ce problème en transmettant les données sous forme de signals paginés.
2. **Exigence de Contexte Sécurisé pour Web Crypto:** L'API Web Cryptography (`crypto.subtle`) est restreinte par les navigateurs aux origines HTTPS ou `localhost`. Les déploiements en HTTP non sécurisé basculent sur des fonctions WebAssembly.
3. **Restrictions CORS sur l'Inspection de Certificats:** L'inspection de certificats SSL dans le navigateur ne peut pas ouvrir de sockets TCP directs vers des ports arbitraires en raison du bac à sable du navigateur. Le décodage s'effectue par analyse de chaînes PEM ou DER locales.

---

## Résumé et Lancement Local

Web Utils démontre comment les signals d'Angular et les APIs web permettent d'offrir une suite d'outils rapide et privée sans gérer d'infrastructure serveur.

Pour lancer l'application en local:

```bash
# Cloner le dépôt
git clone https://github.com/breejesh/web-utils.git
cd web-utils

# Installer les dépendances
npm install

# Démarrer le serveur local
npm start
```
