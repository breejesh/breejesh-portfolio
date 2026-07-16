---
title: "Ejecución local de LLM en Android: Gemma 2B con LiteRT"
description: "Cómo ejecutar los modelos Gemma de Google sin conexión en Android usando LiteRT, con un vistazo real a NomAI, el rastreador de calorías de código abierto."
date: 2026-07-17
tags: [Android, LiteRT, Gemma LLM, IA en el Dispositivo, Desarrollo Móvil]
coverImage: /assets/images/gemma-android.webp
previewImage: /assets/images/gemma-android.webp
---

La ejecución de modelos de lenguaje grandes (LLMs) solía ser el dominio exclusivo de los clústeres en la nube multi-GPU. Hoy en día, el hardware en el dispositivo ha progresado hasta el punto en que podemos ejecutar modelos de 2 mil millones de parámetros directamente en nuestros bolsillos.

Con **LiteRT de Google** (anteriormente TensorFlow Lite) y la familia de modelos abiertos **Gemma**, los desarrolladores de Android pueden integrar una IA generativa local que sea rápida, 100% privada y que funcione completamente sin conexión.

---

## ¿Por qué ejecutar LLMs en el dispositivo?

Durante mucho tiempo, el patrón estándar para la IA móvil ha sido basado en APIs: enviar una solicitud a un servidor remoto, esperar a que el modelo se ejecute en la nube y analizar la respuesta. Aunque es fácil, este patrón tiene grandes inconvenientes:
* **Riesgos de privacidad:** Los datos del usuario, el historial de chat y las entradas personales salen del teléfono y terminan en servidores externos.
* **Dependencia de la red:** Si el usuario tiene una mala conexión o está en modo avión, la IA deja de funcionar.
* **Costos recurrentes del servidor:** Cada llamada a la API incurre en tarifas de ejecución serverless que escalan linealmente con tu base de usuarios.

**La IA en el dispositivo resuelve los tres.** Al usar LiteRT y un modelo Gemma comprimido, tu aplicación puede ejecutar inferencias de manera local. Tus usuarios obtienen respuestas instantáneas, privacidad total y cero costos de red.

---

## Ejemplo del mundo real: Rastreador de calorías NomAI

Una fantástica demostración de esto en el mundo real es **NomAI**, una aplicación de seguimiento de calorías de código abierto y sin conexión para Android.

La mayoría de los rastreadores de calorías exigen cuentas, muestran anuncios y envían los datos de registro de tus comidas a redes publicitarias. NomAI cambia las reglas del juego al ejecutar **Gemma-2B** localmente en tu dispositivo Android para analizar descripciones de comidas y estimar valores nutricionales.

* **Repositorio de GitHub:** [github.com/breejesh/nom.ai](https://github.com/breejesh/nom.ai)

En NomAI, cuando un usuario escribe *\"Comí dos huevos revueltos y una tostada\"*, el modelo local Gemma analiza la consulta, estima los macronutrientes (proteínas, carbohidratos, grasas) y devuelve una respuesta estructurada, completamente en el dispositivo, sin APIs en el servidor.

---

## Configuración de Gemma en Android con LiteRT-LM

Para comenzar con la inferencia local en tu propia aplicación de Android, puedes usar el SDK oficial de **LiteRT-LM**:

### 1. Agregar dependencias
Incluye la dependencia de ejecución de LiteRT-LM en tu archivo `build.gradle.kts`:
```kotlin
dependencies {
    implementation("com.google.ai.edge.litertlm:litertlm-android:latest.release")
}
```

### 2. Descargar y cuantificar el modelo
Para dispositivos móviles, debes usar versiones cuantificadas del modelo (como `Gemma-2B` en formato de enteros de 4 bits). Puedes encontrar modelos `.litertlm` pre-convertidos en el espacio de la comunidad LiteRT de Hugging Face.

### 3. Inicializar el motor
Dado que cargar un modelo de 1.5 GB en memoria toma unos segundos, inicializa el motor de inferencia en un hilo de fondo:

```kotlin
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig

// Configurar e inicializar el motor
val config = EngineConfig(modelPath = "/data/local/tmp/gemma-2b.litertlm")
val engine = Engine(config)
engine.initialize()

// Crear una sesión de conversación
val session = engine.createConversation()

// Enviar prompt y transmitir la respuesta
session.sendMessageAsync("Translate to Spanish: Hello, how are you?").collect { chunk ->
    print(chunk)
}
```

---

## Optimizaciones esenciales

Para mantener tu aplicación móvil fluida y evitar fallos:
* **Ejecución en segundo plano:** Ejecuta siempre los bucles de inicialización y generación en corrutinas o hilos de fondo para evitar bloquear el hilo principal de la interfaz de usuario.
* **Aceleración de hardware:** Asegúrate de que tu configuración delegue las cargas de trabajo a la GPU/NPU mediante delegados (como XNNPack o ML Drift) para la aceleración de hardware.
* **Límites de memoria:** Los sistemas operativos móviles finalizan activamente las aplicaciones que exceden los límites de memoria. Comprueba siempre la RAM disponible antes de inicializar un modelo de 2B en dispositivos de gama baja.

---

## Conclusión

Ejecutar Gemma localmente a través de LiteRT-LM representa un cambio masivo en el diseño de aplicaciones móviles. Permite a los desarrolladores crear sistemas inteligentes y profundamente interactivos que respetan la privacidad del usuario, funcionan sin conexión y tienen cero costos de alojamiento en la nube. Proyectos como **NomAI** demuestran que los LLMs en el dispositivo no son solo una idea futurista, sino un patrón de diseño viable y listo para producción en los ecosistemas de Android actuales.
