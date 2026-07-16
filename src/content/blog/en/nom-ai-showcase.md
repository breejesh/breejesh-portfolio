---
title: "Showcasing NomAI: The Offline Calorie Tracker Powered by Local LLMs"
description: "An in-depth look at NomAI—the world's first free, open-source, and entirely offline calorie tracking app for Android built with Google Gemma and Jetpack Compose."
date: 2026-07-10
tags: [Android, Gemma LLM, Mobile Innovation, Open Source, Privacy]
coverImage: /assets/images/nom-ai-showcase.webp
previewImage: /assets/images/nom-ai-showcase.webp
---

Calorie tracking has become a staple of modern fitness journeys. However, almost every popular calorie tracker on the market share a common set of frustrations: they demand monthly subscriptions, show constant ads, require continuous internet connectivity, and sell your personal eating habits to third-party data brokers.

**NomAI is the antidote.** It is the world's first free, open-source, and entirely offline calorie tracking app for Android, built on absolute privacy and cutting-edge local AI.

* **GitHub Repository:** [github.com/breejesh/nom.ai](https://github.com/breejesh/nom.ai)

---

## The Three Pillars of NomAI

NomAI was designed from the ground up to challenge standard design patterns in mobile application development, focusing on three core pillars:

### 1. 100% Free & Open-Source (FOSS)
There are no premium paywalls, no locked charts, and no payment gateways. The entire application is MIT licensed and completely free to use, modify, and build upon.

### 2. Privacy-First (No Server Backend)
NomAI does not have a remote server. We literally cannot collect, analyze, or share your physical metrics or meal history because we have no backend infrastructure to send it to. Your data remains exclusively in your device's local database.

### 3. Local & Offline-First LLM Inference
All meal analysis and macro estimations are performed on-device. Powered by **Google Gemma-2B** and Google's **LiteRT** runtime, the app parses natural language text input directly inside your phone. No internet connection is ever requested.

---

## Innovation in Action: How It Works

Traditional apps require search engines to map food items to online databases. In contrast, NomAI lets you describe your meals in natural text:

> *"I had two scrambled eggs, a slice of whole wheat toast, and a black coffee."*

Behind the scenes, NomAI feeds this prompt to a local Gemma-2B model. Using specialized prompt engineering, the model parses the food items, calculates portion estimates, and outputs structured nutritional estimates (calories, protein, carbs, and fats). 

Because the inference runs on-device, the response is near-instant, consumes zero mobile data, and stays entirely private.

---

## Technical Stack & Architecture

Built with modern Android standards, NomAI represents a state-of-the-art implementation of on-device machine learning:

* **Jetpack Compose:** A modern declarative UI toolkit that keeps the interface responsive, fluid, and beautiful.
* **LiteRT-LM SDK:** Google’s high-performance generative AI runtime, utilizing hardware acceleration (GPU/NPU) to run Gemma models with minimal battery drain.
* **Room Database:** A local SQLite abstraction layer for secure, fast storage of meal logs and user goals.

---

## Conclusion

NomAI is more than just a fitness tracker; it is a proof-of-concept for the future of mobile software design. It proves that we can build robust, highly intelligent applications that respect user boundaries, work offline, and run cost-free. Check out the open-source codebase on GitHub to explore the implementation or download the app today!
