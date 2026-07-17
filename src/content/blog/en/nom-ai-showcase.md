---
title: "NomAI: The Offline Calorie Tracker Powered by Local LLMs"
description: "An in-depth look at NomAI—the world's first free, open-source, and entirely offline calorie tracking app for Android built with Google Gemma and Jetpack Compose."
date: 2026-07-10
tags: [Android, Gemma LLM, Mobile Innovation, Open Source, Privacy]
coverImage: /assets/images/nom-ai-showcase.webp
previewImage: /assets/images/nom-ai-showcase.webp
---

Calorie tracking has become a staple of modern fitness journeys. However, almost every popular calorie tracker on the market shares a common set of frustrations: they demand monthly subscriptions, show constant ads, require continuous internet connectivity, and send your personal eating habits to third-party data brokers.

**NomAI takes a different approach.** It is a free, open-source, and entirely offline calorie tracking app for Android — built on absolute privacy and on-device AI.

* **GitHub Repository:** [github.com/breejesh/nom.ai](https://github.com/breejesh/nom.ai)

---

## The Three Pillars of NomAI

NomAI was designed from the ground up to challenge standard design patterns in mobile application development, focusing on three core pillars:

### 1. 100% Free & Open-Source (FOSS)
There are no premium paywalls, no locked charts, and no payment gateways. The entire application is MIT licensed and completely free to use, modify, and build upon. The full source code — including the prompt engineering templates and model configuration — is available for anyone to audit, fork, or contribute to.

### 2. Privacy-First (No Server Backend)
NomAI does not have a remote server. There is literally no backend infrastructure to send data to. Your physical metrics, meal history, and nutritional goals remain exclusively in your device's local Room database. This is not privacy by policy — it is privacy by architecture.

### 3. Local & Offline-First LLM Inference
All meal analysis and macro estimations are performed on-device. Powered by **Google Gemma-2B** and Google's **LiteRT** runtime, the app parses natural language text input directly inside your phone. No internet connection is ever required for core functionality.

---

## App Interface & Screen Showcases

To see how NomAI looks and behaves, let's explore the screens and user flows.

### Theme Adaptability
Here is how the clean, minimalist layout shifts between the warm off-white light theme and the midnight-espresso dark theme:

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/home-light.png" width="260" alt="Light Dashboard">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/home-dark.png" width="260" alt="Dark Dashboard">
</p>

---

### The Smart Adding Journey
Tracking a meal is fully local: describe it naturally or snap a photo, review the extracted elements, and log.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/input-methods.png" width="180" alt="Select Input Method">
  &nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/pompt-add.png" width="180" alt="Describe with AI">
  &nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/image-add.png" width="180" alt="Snap with Vision">
  &nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/meal-breakdown.png" width="180" alt="Meal Breakdown">
</p>

---

### Insights, Journal & Settings
Dive into weekly charts, browse your history, or customize your experience offline.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/dashboard.png" width="240" alt="Dashboard Analytics">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/journal.png" width="240" alt="Meal Journal">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/settings.png" width="240" alt="App Settings">
</p>


---

## Prompt Engineering: Getting Reliable Nutrition Estimates

The most technically interesting challenge in NomAI is extracting **structured, reliable nutritional data** from a 2-billion parameter model that was not specifically trained for nutritional analysis.

The solution is a carefully crafted prompt template that constrains the model's output:

```kotlin
fun buildNutritionPrompt(userInput: String): String = """
You are a nutritional analysis assistant. Analyze the following meal 
and estimate its nutritional content.

RULES:
- Use USDA standard reference values for common foods
- Use standard serving sizes when portions are not specified
- Round all values to the nearest integer
- Respond ONLY with the JSON below, no other text

OUTPUT FORMAT:
{"items": [{"name": "string", "calories": int, "protein_g": int, 
"carbs_g": int, "fat_g": int, "serving": "string"}], 
"total": {"calories": int, "protein_g": int, "carbs_g": int, "fat_g": int}}

MEAL: $userInput
""".trimIndent()
```

**Why this structure works:**
- **Explicit format specification** prevents the model from generating conversational responses or explanations alongside the data.
- **Negative instructions** ("no other text") reduce the chance of preamble text that would break JSON parsing.
- **Reference to USDA values** anchors the model's estimates to a known standard rather than allowing arbitrary guesses.
- **The `serving` field** provides transparency — the user can see what portion size the model assumed and correct it if needed.

### Handling Model Failures

Small models are not perfectly reliable. NomAI implements a multi-layer fallback strategy:

1. **JSON Validation:** Every response is parsed with a strict JSON deserializer. If parsing fails, the prompt is retried with an even more constrained format (single-item analysis).
2. **Sanity Checks:** Estimated calories are validated against reasonable bounds (e.g., a single food item claiming 10,000 calories is rejected). Per-macro totals are checked against the total calorie count (calories ≈ protein×4 + carbs×4 + fat×9).
3. **User Correction:** If the model's estimate looks off, the user can tap any field to manually override it. The corrected values are stored alongside the original estimate, which could eventually be used for fine-tuning or evaluation.

---

## Technical Stack & Architecture

Built with modern Android standards, NomAI represents a state-of-the-art implementation of on-device machine learning:

* **Jetpack Compose:** A modern declarative UI toolkit that keeps the interface responsive, fluid, and beautiful. The reactive state model pairs naturally with asynchronous LLM inference — partial results can stream directly into the UI.
* **LiteRT-LM SDK:** Google's high-performance generative AI runtime, utilizing hardware acceleration (GPU/NPU) to run Gemma models with minimal battery drain. The model runs on `Dispatchers.IO` to keep the UI thread free.
* **Room Database:** A local SQLite abstraction layer for secure, fast storage of meal logs and user goals. Room's Flow-based queries enable real-time UI updates when new meals are logged — daily totals, weekly trends, and macro breakdowns all update instantly.
* **Hilt (Dependency Injection):** The LLM engine is provided as a singleton scoped to the application lifecycle, ensuring the model is loaded once and shared across all features that need it.
* **Kotlin Coroutines & Flow:** All LLM operations are wrapped in structured concurrency. StateFlow drives the UI, while SharedFlow handles one-off events like error toasts and navigation.

---

## Challenges & Lessons Learned

Building an offline-first LLM app surfaced several non-obvious engineering challenges:

### Model Accuracy on Uncommon Foods
Gemma 2B performs well on common Western foods (eggs, toast, chicken breast) but struggles with regional dishes, ethnic cuisines, and brand-name products. A prompt like *"I had a plate of dal makhani with two rotis"* may produce reasonable calorie estimates but can be off by 20-30% on individual macros. The accuracy gap widens further with complex dishes that have highly variable preparation methods.

**Mitigation:** NomAI always presents estimates with a subtle "estimated" label and encourages manual adjustment for complex meals.

### Ambiguous Portions
When a user says *"I had some rice"*, how much rice is "some"? The model defaults to USDA standard serving sizes (1 cup cooked, ~200g), but user intent varies wildly. A bodybuilder's "some rice" could be 3 cups.

**Mitigation:** The `serving` field in the JSON response makes the model's assumption visible. Users can tap to adjust.

### Memory Pressure
Running a 2B parameter model alongside a full Compose UI, Room database, and potentially other apps puts real strain on device memory. On devices with 6 GB of RAM, the app needs to be aggressive about releasing resources — clearing bitmap caches, using lazy loading for historical meal data, and monitoring memory pressure callbacks.

**Mitigation:** NomAI registers a `ComponentCallbacks2` listener and, when memory gets critical (`TRIM_MEMORY_RUNNING_LOW`), releases the LLM engine and shows a "reload" button instead of keeping it resident.

### First-Launch Download
The model file is ~1.4 GB — far too large to bundle in an APK. NomAI downloads it on first launch, which creates a critical onboarding UX moment. Users on slow connections may wait 5-10 minutes.

**Mitigation:** A progress bar with estimated time remaining, download pause/resume support, and the ability to use the app's manual entry mode while the model downloads in the background.

---

## Conclusion

NomAI is more than a fitness tracker — it is a proof-of-concept for a new generation of mobile applications. It demonstrates that we can build robust, intelligent apps that respect user privacy, work fully offline, and run at zero ongoing cost to either the developer or the user. 

The source code is fully open on [GitHub](https://github.com/breejesh/nom.ai). Whether you are interested in on-device AI, privacy-first architecture, or just want a calorie tracker that does not sell your data, take a look and consider contributing.
