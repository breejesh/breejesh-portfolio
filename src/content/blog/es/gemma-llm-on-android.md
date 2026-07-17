---
title: "Ejecutando LLMs localmente en Android: Gemma 2B con LiteRT"
description: "Cómo ejecutar los modelos Gemma de Google sin conexión en Android usando LiteRT, con una mirada al mundo real de NomAI, el contador de calorías offline de código abierto."
date: 2026-07-17
tags: [Android, LiteRT, Gemma LLM, IA en el Dispositivo, Desarrollo Móvil]
coverImage: /assets/images/gemma-android.webp
previewImage: /assets/images/gemma-android.webp
---

La ejecución de modelos de lenguaje grandes (LLM) solía ser dominio exclusivo de clústeres en la nube con múltiples GPUs. Hoy en día, el hardware de consumo ha progresado hasta el punto en que podemos ejecutar modelos de 2 mil millones de parámetros directamente dentro de nuestros bolsillos.

Con **LiteRT** de Google (anteriormente TensorFlow Lite) y la familia de modelos abiertos **Gemma**, los desarrolladores de Android pueden integrar IA generativa local que es rápida, 100% privada y funciona completamente sin conexión.

---

## ¿Por qué ejecutar LLMs en el dispositivo?

Durante mucho tiempo, el patrón estándar para la IA móvil ha sido basado en APIs: enviar una solicitud a un servidor remoto, esperar a que el modelo se ejecute en la nube y analizar la respuesta. Aunque es fácil, este patrón conlleva importantes inconvenientes:

* **Riesgos de privacidad:** Los datos del usuario, el historial de chat y las entradas personales salen del teléfono y aterrizan en servidores externos. Para datos de salud, financieros o personales, esto suele ser un factor decisivo.
* **Dependencias de red:** Si el usuario tiene una mala conexión o está en modo avión, la IA deja de funcionar. En muchas partes del mundo, simplemente no se puede asumir una conexión móvil a Internet confiable.
* **Costos recurrentes de servidor:** Cada llamada a la API genera tarifas de ejecución que escalan linealmente con tu base de usuarios. Una aplicación viral puede pasar de $50 al mes a $50,000 de la noche a la mañana.
* **Latencia:** Incluso en conexiones rápidas, un viaje de ida y vuelta a un LLM en la nube añade entre 500 ms y 2 s de latencia. La inferencia en el dispositivo puede responder en menos de 300 ms para instrucciones cortas.

**La IA en el dispositivo resuelve todo esto.** Al usar LiteRT y un modelo Gemma comprimido, tu aplicación puede realizar inferencias localmente. Tus usuarios obtienen respuestas instantáneas, total privacidad y cero consumo de datos.

---

## Eligiendo el modelo adecuado

No todas las variantes de Gemma son adecuadas para móviles. Elegir el modelo y el nivel de cuantificación adecuados es fundamental para una experiencia de usuario fluida:

| Modelo | Parámetros | Cuantificación | Tamaño de archivo | RAM requerida | Ideal para |
|---|---|---|---|---|---|
| Gemma 2B | 2B | INT4 | ~1.4 GB | ~2.5 GB | Dispositivos de gama baja, inferencia rápida |
| Gemma 2B | 2B | INT8 | ~2.5 GB | ~4 GB | Mejor calidad, gama media |
| Gemma 2B | 2B | FP16 | ~5 GB | ~6 GB | Mejor calidad, gama alta únicamente |
| Gemma 7B | 7B | INT4 | ~4.5 GB | ~8 GB | Gama alta con más de 12 GB de RAM |

**Recomendación práctica:** Para la mayoría de las aplicaciones de producción, **Gemma 2B con cuantificación INT4** es el punto dulce. Ofrece respuestas sorprendentemente coherentes a la vez que cabe cómodamente en dispositivos con más de 6 GB de RAM, lo que cubre la gran mayoría de los teléfonos Android vendidos desde 2021.

> La cuantificación INT4 comprime cada peso del modelo de 16 bits a 4 bits, reduciendo el tamaño del archivo en aproximadamente un 75% con una degradación de calidad mínima para la mayoría de las tareas.

---

## Ejemplo del mundo real: NomAI Calorie Tracker

Un fantástico ejemplo del mundo real de esto es **NomAI**, una aplicación de seguimiento de calorías de código abierto y basada principalmente en el funcionamiento sin conexión para Android.

La mayoría de los contadores de calorías exigen cuentas, muestran anuncios y envían los datos de tus comidas a redes publicitarias. NomAI cambia las reglas del juego ejecutando **Gemma-2B** localmente en tu dispositivo Android para analizar descripciones de comidas y estimar valores nutricionales.

* **Repositorio de GitHub:** [github.com/breejesh/nom.ai](https://github.com/breejesh/nom.ai)

En NomAI, cuando un usuario escribe *"Comí dos huevos revueltos y una rebanada de pan tostado"*, el modelo local Gemma analiza la consulta, estima los macronutrientes (proteínas, carbohidratos, grasas) y devuelve una respuesta estructurada, completamente en el dispositivo, con cero APIs de backend.

---

## Configuración de Gemma en Android con LiteRT-LM

Para comenzar con la inferencia local en tu propia aplicación Android, puedes utilizar el SDK **LiteRT-LM** de Google:

### 1. Añadir dependencias

Incluye la dependencia del entorno de ejecución de LiteRT-LM en tu archivo `build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.google.ai.edge.litertlm:litertlm-android:latest.release")
}
```

### 2. Obtener el modelo

Para dispositivos móviles, utiliza archivos de modelos cuantificados. Puedes encontrar modelos preconvertidos a través de:
- **Kaggle:** Busca modelos de Gemma para LiteRT en [kaggle.com/models/google/gemma](https://kaggle.com/models/google/gemma)
- **Hugging Face:** Busca modelos convertidos por la comunidad en formato `.task` en la página de la comunidad de LiteRT

Coloca el archivo del modelo en el almacenamiento interno de tu aplicación (no en `assets/`, el archivo es demasiado grande para empaquetarlo en el APK). Normalmente lo descargarás en el primer inicio o lo incluirás como un paquete de activos (asset pack) de Android App Bundle.

### 3. Inicializar el motor

Debido a que cargar un modelo de ~1.4 GB en memoria toma varios segundos, inicializa siempre el motor de inferencia en un hilo de fondo. Aquí tienes una configuración básica usando corrutinas de Kotlin:

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
            ?: throw IllegalStateException("Motor no inicializado")
    }

    // Transmitir resultados parciales para actualizaciones de UI en tiempo real
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

### 4. Integrar con tu interfaz de usuario

Conecta el motor a tu interfaz de usuario basada en Compose o Views:

```kotlin
// En tu ViewModel
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
        engine.close()  // Crítico: liberar la memoria del modelo
    }
}
```

> **Importante:** Llama siempre a `close()` cuando el motor ya no sea necesario. Un modelo de 2B parámetros ocupa más de 2 GB de RAM; no liberarlo provocará cierres agresivos por falta de memoria por parte del sistema operativo.

---

## Ingeniería de prompts para salida estructurada

Una de las partes más complejas de la integración de LLMs en el dispositivo es obtener una **salida estructurada y confiable**. Los modelos en la nube como GPT-4 o Gemini Pro tienen capacidades robustas para seguir instrucciones, pero los modelos más pequeños de 2B necesitan prompts más cuidadosos.

Para el análisis nutricional de NomAI, un prompt del sistema bien diseñado marca la diferencia entre resultados útiles y basura:

```
Eres un asistente de análisis nutricional. Dada la descripción de una comida, 
estima el contenido nutricional y responde ÚNICAMENTE con JSON válido.

Formato:
{"items": [{"name": "alimento", "calories": número, "protein_g": número, 
"carbs_g": número, "fat_g": número}], "total": {"calories": número, 
"protein_g": número, "carbs_g": número, "fat_g": número}}

Reglas:
- Usa tamaños de porción estándar cuando no se especifiquen las porciones
- Redondea todos los números a enteros
- No incluyas ningún texto fuera del bloque JSON

Comida: {user_input}
```

**Consejos para obtener salidas estructuradas fiables de modelos pequeños:**
- **Sé extremadamente explícito** sobre el formato de salida. Incluye un ejemplo completo en el prompt si es necesario.
- **Usa instrucciones negativas** ("No incluyas ningún texto fuera del JSON") — los modelos pequeños tienden a añadir texto explicativo a menos que se les prohíba.
- **Valida y reintenta** — envuelve el análisis del JSON en un bloque try/catch y reintenta con un prompt reformulado si falla. Espera una tasa de fallo del ~5-10% en el primer intento con modelos INT4.
- **Mantén los prompts cortos** — los modelos 2B tienen ventanas de contexto limitadas (normalmente entre 2048 y 8192 tokens). Los prompts del sistema largos consumen tu presupuesto de respuesta.

---

## Optimizaciones esenciales

Para mantener tu aplicación móvil fluida y evitar cierres inesperados:

* **Ejecución en segundo plano:** Ejecuta siempre la inicialización y los bucles de generación en corrutinas en `Dispatchers.IO` para evitar bloquear el hilo principal de la interfaz de usuario. Cargar el modelo puede tomar entre 3 y 8 segundos en dispositivos de gama media.
* **Aceleración por hardware:** LiteRT delega automáticamente en el **GPU delegate** o el **NNAPI delegate** cuando están disponibles. En dispositivos con una NPU dedicada (como los chips Google Tensor o Qualcomm Hexagon), esto puede duplicar la velocidad de inferencia.
* **Gestión de memoria:** Los sistemas operativos móviles terminan activamente las aplicaciones que exceden los límites de memoria. Antes de inicializar un modelo 2B, verifica la RAM disponible con `ActivityManager.getMemoryInfo()` y muestra una alternativa elegante para dispositivos con poca memoria (menos de 4 GB de RAM total).
* **Precarga del modelo:** Al iniciar la aplicación, comienza a cargar el modelo inmediatamente en segundo plano, incluso antes de que el usuario navegue a la función de IA. Esto oculta la latencia de inicialización detrás del uso normal de la app.
* **Estrangulamiento térmico (Thermal Throttling):** Las sesiones de inferencia prolongadas generan un calor significativo. Monitorea el estado térmico con `PowerManager.getThermalStatus()` y reduce la velocidad de generación o el tamaño del lote cuando el dispositivo tenga restricciones térmicas.

---

## Expectativas de rendimiento

Aquí tienes los puntos de referencia (benchmarks) aproximados para establecer expectativas realistas (medidos en Gemma 2B INT4):

| Gama del dispositivo | Dispositivo de ejemplo | Tokens/Segundo | Tiempo de carga | Uso de RAM |
|---|---|---|---|---|
| Baja (Budget) | Pixel 6a | ~8-12 tok/s | ~6-8s | ~2.5 GB |
| Media (Mid-Range) | Pixel 8 | ~15-20 tok/s | ~3-5s | ~2.5 GB |
| Alta (Flagship) | Pixel 9 Pro | ~25-35 tok/s | ~2-3s | ~2.5 GB |
| Alta con NPU | Samsung S24 Ultra | ~30-40 tok/s | ~2-3s | ~2.5 GB |

*Estas cifras son aproximadas: el rendimiento real varía según la longitud del prompt, la actividad concurrente de otras aplicaciones, el estado térmico y la versión del sistema operativo.*

Como referencia, una velocidad de lectura cómoda es de unos 4 tokens/segundo, por lo que incluso los dispositivos económicos pueden generar texto más rápido de lo que un usuario puede leer, haciendo que la experiencia se sienta fluida.

---

## Limitaciones y desafíos

Antes de comprometerte con LLMs en el dispositivo, ten en cuenta estos desafíos del mundo real:

* **Precisión del modelo:** Un modelo de 2B parámetros alucinará con más frecuencia que los modelos de más de 70B basados en la nube. Para aplicaciones críticas (médicas, financieras), incluye siempre descargos de responsabilidad y capas de validación.
* **Tamaño de descarga:** Incluso comprimido, el modelo pesa ~1.4 GB. Esto requiere un paso de descarga dedicado en el flujo de incorporación de tu aplicación; los usuarios con conexiones medidas lo notarán.
* **Compatibilidad de dispositivos:** Siendo realistas, los LLMs en el dispositivo funcionan bien en dispositivos con 6+ GB de RAM (lanzados en 2020 o posteriormente). Para dispositivos más antiguos, necesitarás una estrategia de fallback (un modelo más simple, APIs en la nube o desactivar la función).
* **Límites de la ventana de contexto:** Gemma 2B admite 8192 tokens por defecto, pero los contextos más largos ralentizan la inferencia y aumentan el uso de memoria. Para aplicaciones de chat, implementa el recorte de conversaciones para mantenerte dentro de los límites.
* **Experiencia del primer inicio:** La pantalla de carga del modelo es el momento de experiencia de usuario (UX) más crítico. Muestra indicadores de progreso claros, el tiempo estimado restante y permite al usuario usar otras funciones mientras el modelo se carga en segundo plano.

---

## Conclusión

Ejecutar Gemma localmente a través de LiteRT representa un cambio genuino en el diseño de aplicaciones móviles. Permite a los desarrolladores crear sistemas profundamente interactivos e inteligentes que respetan la privacidad del usuario, funcionan sin conexión y generan cero costos de alojamiento en la nube.

La tecnología no está exenta de compromisos — la precisión del modelo, la compatibilidad de dispositivos y el tamaño de descarga son restricciones reales —, pero para casos de uso como el registro de alimentos, diarios personales, traducción de idiomas y asistentes personales, los LLMs en el dispositivo ya son un patrón de diseño viable y listo para producción. Proyectos como **NomAI** demuestran que el futuro de la IA móvil no está en la nube: está en tu bolsillo.
