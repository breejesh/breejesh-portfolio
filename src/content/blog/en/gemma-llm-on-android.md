---
title: "Running LLMs Locally on Android: Gemma 2B with LiteRT"
description: "How to run Google's Gemma models offline on Android using LiteRT, with a real-world look at NomAI—the open-source offline calorie tracker."
date: 2026-07-17
tags: [Android, LiteRT, Gemma LLM, On-Device AI, Mobile Development]
coverImage: /assets/images/gemma-android.webp
previewImage: /assets/images/gemma-android.webp
---

Running large language models (LLMs) used to be the exclusive domain of multi-GPU cloud clusters. Today, edge hardware has progressed to a point where we can execute 2-billion parameter models directly inside our pockets. 

With **Google's LiteRT** (formerly TensorFlow Lite) and the **Gemma** open-model family, Android developers can integrate local generative AI that is fast, 100% private, and works completely offline.

---

## Why Run LLMs On-Device?

For a long time, the standard pattern for mobile AI has been API-based: send a request to a remote server, wait for a model to run in the cloud, and parse the response. While easy, this pattern carries major drawbacks:

* **Privacy Risks:** User data, chat history, and personal inputs leave the phone and land on external servers. For health, financial, or personal data, this is often a dealbreaker.
* **Network Dependencies:** If the user has a poor connection or is in airplane mode, the AI breaks. In many parts of the world, reliable mobile internet simply cannot be assumed.
* **Recurring Server Costs:** Every API call incurs execution fees that scale linearly with your user base. A viral app can go from $50/month to $50,000/month overnight.
* **Latency:** Even on fast connections, a round trip to a cloud LLM adds 500ms–2s of latency per request. On-device inference can respond in under 300ms for short prompts.

**On-device AI solves all of these.** By using LiteRT and a compressed Gemma model, your application can run inference locally. Your users get instant responses, complete privacy, and zero internet overhead.

---

## Choosing the Right Model

Not all Gemma variants are suitable for mobile. Choosing the right model and quantization level is critical for a smooth user experience:

| Model | Parameters | Quantization | File Size | RAM Required | Best For |
|---|---|---|---|---|---|
| Gemma 2B | 2B | INT4 | ~1.4 GB | ~2.5 GB | Low-end devices, fast inference |
| Gemma 2B | 2B | INT8 | ~2.5 GB | ~4 GB | Better quality, mid-range devices |
| Gemma 2B | 2B | FP16 | ~5 GB | ~6 GB | Best quality, flagship only |
| Gemma 7B | 7B | INT4 | ~4.5 GB | ~8 GB | High-end flagships with 12+ GB RAM |

**Practical recommendation:** For most production apps, **Gemma 2B with INT4 quantization** is the sweet spot. It delivers surprisingly coherent outputs while fitting comfortably on devices with 6 GB+ of RAM — which covers the vast majority of Android phones sold since 2021.

> INT4 quantization compresses each model weight from 16 bits to 4 bits, reducing the file size by roughly 75% with minimal quality degradation for most tasks.

---

## Real-World Example: NomAI Calorie Tracker

A great real-world demonstration of this is **NomAI**, an open-source, offline-first calorie tracking app for Android. 

Most calorie trackers demand accounts, show ads, and send your food log data to ad networks. NomAI changes the game by running **Gemma-2B** locally on your Android device to analyze meal descriptions and estimate nutritional values.

* **GitHub Repository:** [github.com/breejesh/nom.ai](https://github.com/breejesh/nom.ai)

In NomAI, when a user types *"I had two scrambled eggs and a piece of toast"*, the local Gemma model parses the query, estimates the macros (proteins, carbs, fats), and returns a structured response — fully on-device, with zero backend APIs.

---

## Setting Up Gemma on Android with LiteRT-LM

To get started with local inference in your own Android app, you can use Google's **LiteRT-LM** SDK:

### 1. Add Dependencies

Include the LiteRT-LM runtime dependency in your `build.gradle.kts` file:

```kotlin
dependencies {
    implementation("com.google.ai.edge.litertlm:litertlm-android:latest.release")
}
```

### 2. Obtain the Model

For mobile devices, use quantized model files. You can find pre-converted models through:
- **Kaggle:** Search for Gemma LiteRT models on [kaggle.com/models/google/gemma](https://kaggle.com/models/google/gemma)
- **Hugging Face:** Look for community-converted models in `.task` format on the LiteRT community page

Place the model file in your app's internal storage (not `assets/` — the file is too large for APK bundling). You will typically download it on first launch or bundle it as an Android App Bundle asset pack.

### 3. Initialize the Engine

Since loading a ~1.4 GB model into memory takes several seconds, always initialize the inference engine on a background thread. Here is a basic setup using Kotlin coroutines:

```kotlin
import com.google.ai.edge.litert.lm.LlmInference
import com.google.ai.edge.litert.lm.LlmInferenceOptions

class GemmaEngine(private val context: Context) {
    private var inference: LlmInference? = null

    suspend fun initialize(modelPath: String) = withContext(Dispatchers.IO) {
        val options = LlmInferenceOptions.builder()
            .setModelPath(modelPath)
            .setMaxTokens(1024)
            .build()

        inference = LlmInference.createInstance(options)
    }

    suspend fun generate(prompt: String): String = withContext(Dispatchers.IO) {
        inference?.generateResponse(prompt)
            ?: throw IllegalStateException("Engine not initialized")
    }

    // Stream partial results for real-time UI updates
    fun generateAsync(
        prompt: String,
        onPartialResult: (String) -> Unit,
        onComplete: (String) -> Unit,
        onError: (Exception) -> Unit
    ) {
        inference?.generateResponseAsync(prompt)?.let { task ->
            task.addOnSuccessListener { result -> onComplete(result) }
            task.addOnFailureListener { e -> onError(e) }
        }
    }

    fun close() {
        inference?.close()
        inference = null
    }
}
```

### 4. Integrate with Your UI

Connect the engine to your Compose or View-based UI:

```kotlin
// In your ViewModel
class ChatViewModel(application: Application) : AndroidViewModel(application) {
    private val engine = GemmaEngine(application)
    private val _response = MutableStateFlow("")
    val response: StateFlow<String> = _response

    init {
        viewModelScope.launch {
            val modelPath = "${application.filesDir}/gemma-2b-it-int4.bin"
            engine.initialize(modelPath)
        }
    }

    fun sendMessage(prompt: String) {
        viewModelScope.launch {
            _response.value = engine.generate(prompt)
        }
    }

    override fun onCleared() {
        super.onCleared()
        engine.close()  // Critical: release model memory
    }
}
```

> **Important:** Always call `close()` when the engine is no longer needed. A 2B parameter model occupies 2+ GB of RAM — failing to release it will trigger aggressive OS memory kills on other apps or your own.

---

## Prompt Engineering for Structured Output

One of the trickiest parts of on-device LLM integration is getting **reliable, structured output**. Cloud models like GPT-4 or Gemini Pro have robust instruction-following capabilities, but smaller 2B models need more careful prompting.

For NomAI's nutritional analysis, a well-crafted system prompt makes the difference between usable results and garbage:

```
You are a nutritional analysis assistant. Given a meal description, 
estimate the nutritional content and respond ONLY with valid JSON.

Format:
{"items": [{"name": "food item", "calories": number, "protein_g": number, 
"carbs_g": number, "fat_g": number}], "total": {"calories": number, 
"protein_g": number, "carbs_g": number, "fat_g": number}}

Rules:
- Use standard serving sizes when portions are not specified
- Round all numbers to integers
- Do not include any text outside the JSON block

Meal: {user_input}
```

**Tips for reliable structured output from small models:**
- **Be extremely explicit** about the output format. Include a complete example in the prompt if needed.
- **Use negative instructions** ("Do not include any text outside the JSON") — small models tend to add explanatory text unless told not to.
- **Validate and retry** — wrap your JSON parsing in a try/catch and retry with a rephrased prompt if parsing fails. Expect ~5-10% failure rate on first attempt with INT4 models.
- **Keep prompts short** — 2B models have limited context windows (typically 2048–8192 tokens). Long system prompts eat into your response budget.

---

## Essential Optimizations

To keep your mobile app smooth and prevent crashes:

* **Background Execution:** Always run initialization and generation in coroutines on `Dispatchers.IO` to avoid blocking the main UI thread. Model loading alone can take 3-8 seconds on mid-range devices.
* **Hardware Acceleration:** LiteRT automatically delegates to the **GPU delegate** or **NNAPI delegate** when available. On devices with a dedicated NPU (like Google Tensor or Qualcomm Hexagon chips), this can double inference speed.
* **Memory Management:** Mobile operating systems actively terminate apps that exceed memory limits. Before initializing a 2B model, check available RAM with `ActivityManager.getMemoryInfo()` and show a graceful fallback for low-memory devices (under 4 GB total RAM).
* **Model Preloading:** On app launch, start loading the model immediately in the background — even before the user navigates to the AI feature. This hides the initialization latency behind normal app usage.
* **Thermal Throttling:** Extended inference sessions generate significant heat. Monitor thermal state with `PowerManager.getThermalStatus()` and reduce generation speed or batch size when the device is thermally constrained.

---

## Performance Expectations

Here are approximate benchmarks to set realistic expectations (measured on Gemma 2B INT4):

| Device Class | Example Device | Tokens/Second | Model Load Time | RAM Usage |
|---|---|---|---|---|
| Budget | Pixel 6a | ~8-12 tok/s | ~6-8s | ~2.5 GB |
| Mid-Range | Pixel 8 | ~15-20 tok/s | ~3-5s | ~2.5 GB |
| Flagship | Pixel 9 Pro | ~25-35 tok/s | ~2-3s | ~2.5 GB |
| Flagship (NPU) | Samsung S24 Ultra | ~30-40 tok/s | ~2-3s | ~2.5 GB |

*These are approximate figures — actual performance varies based on prompt length, concurrent app activity, thermal state, and OS version.*

For context, comfortable reading speed is about 4 tokens/second, so even budget devices can generate faster than a user can read — making the experience feel responsive.

---

## Limitations and Gotchas

Before committing to on-device LLMs, be aware of these real-world challenges:

* **Model Accuracy:** A 2B parameter model will hallucinate more frequently than cloud-based 70B+ models. For safety-critical applications (medical, financial), always include disclaimers and validation layers.
* **Download Size:** Even compressed, the model is ~1.4 GB. This requires a dedicated download step in your app's onboarding flow — users on metered connections will notice.
* **Device Compatibility:** Realistically, on-device LLMs work well on devices with 6+ GB of RAM (released 2020 or later). For older devices, you will need a fallback strategy (simpler model, cloud API, or feature gating).
* **Context Window Limits:** Gemma 2B supports 8192 tokens by default, but longer contexts slow inference and increase memory usage. For chat applications, implement conversation pruning to stay within limits.
* **First-Launch Experience:** The model loading screen is the most critical UX moment. Show clear progress indicators, estimated time remaining, and allow the user to use other features while the model loads in the background.

---

## Conclusion

Running Gemma locally via LiteRT represents a genuine shift in mobile application design. It empowers developers to build deeply interactive, intelligent systems that respect user privacy, run offline, and incur zero cloud hosting costs. 

The technology is not without trade-offs — model accuracy, device compatibility, and download size are real constraints — but for use cases like food logging, journaling, language translation, and personal assistants, on-device LLMs are already a viable, production-ready design pattern. Projects like **NomAI** prove that the future of mobile AI is not in the cloud — it is in your pocket.
