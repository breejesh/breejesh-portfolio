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
* **Privacy Risks:** User data, chat history, and personal inputs leave the phone and land on external servers.
* **Network Dependencies:** If the user has a poor connection or is in airplane mode, the AI breaks.
* **Recurring Server Costs:** Every API call incurs serverless execution fees that scale linearly with your user base.

**On-device AI solves all three.** By using LiteRT and a compressed Gemma model, your application can run inference locally. Your users get instant responses, complete privacy, and zero internet overhead.

---

## Real-World Example: NomAI Calorie Tracker

A fantastic real-world demonstration of this is **NomAI**, an open-source, offline-first calorie tracking app for Android. 

Most calorie trackers demand accounts, show ads, and send your food log data to ad networks. NomAI changes the game by running **Gemma-2B** locally on your Android device to analyze meal descriptions and estimate nutritional values.

* **GitHub Repository:** [github.com/breejesh/nom.ai](https://github.com/breejesh/nom.ai)

In NomAI, when a user types *"I had two scrambled eggs and a piece of toast"*, the local Gemma model parses the query, estimates the macros (proteins, carbs, fats), and returns a structured response—fully on-device, with zero backend APIs.

---

## Setting Up Gemma on Android with LiteRT-LM

To get started with local inference in your own Android app, you can use the official **LiteRT-LM** SDK:

### 1. Add Dependencies
Include the LiteRT-LM runtime dependency in your `build.gradle.kts` file:
```kotlin
dependencies {
    implementation("com.google.ai.edge.litertlm:litertlm-android:latest.release")
}
```

### 2. Download and Quantize the Model
For mobile devices, you should use quantized versions of the model (like `Gemma-2B` in a 4-bit integer format). You can find pre-converted `.litertlm` models in the Hugging Face LiteRT Community space.

### 3. Initialize the Engine
Since loading a 1.5 GB model into memory takes a few seconds, initialize the inference engine on a background thread:

```kotlin
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig

// Configure and initialize the engine
val config = EngineConfig(modelPath = "/data/local/tmp/gemma-2b.litertlm")
val engine = Engine(config)
engine.initialize()

// Create a conversation session
val session = engine.createConversation()

// Send prompt and stream the response
session.sendMessageAsync("Translate to Spanish: Hello, how are you?").collect { chunk ->
    print(chunk)
}
```

---

## Essential Optimizations

To keep your mobile app smooth and prevent crashes:
* **Background Execution:** Always run initialization and generation loops in coroutines or background threads to avoid blocking the main UI thread.
* **Hardware Acceleration:** Ensure your configuration delegates workloads to the GPU/NPU via delegates (like XNNPack or ML Drift) for hardware acceleration.
* **Memory Limits:** Mobile operating systems actively terminate apps that exceed memory limits. Always check available RAM before initializing a 2B model on lower-end devices.

---

## Conclusion

Running Gemma locally via LiteRT-LM represents a massive shift in mobile application design. It empowers developers to build deeply interactive, intelligent systems that respect user privacy, run offline, and incur zero cloud hosting costs. Projects like **NomAI** prove that on-device LLMs are not just a futuristic idea, but a viable, production-ready design pattern for today's Android ecosystems.
