---
title: "Presentando NomAI: El contador de calorías offline impulsado por LLMs locales"
description: "Un análisis detallado de NomAI, el primer contador de calorías para Android de código abierto, gratuito y completamente offline, construido con Google Gemma y Jetpack Compose."
date: 2026-07-10
tags: [IA, Android, LLM, Desarrollo Móvil]
coverImage: /assets/images/nom-ai-showcase.webp
previewImage: /assets/images/nom-ai-showcase.webp
---

El seguimiento de calorías se ha convertido en un elemento básico de los viajes de acondicionamiento físico modernos. Sin embargo, casi todos los contadores de calorías populares del mercado comparten un conjunto común de frustraciones: exigen suscripciones mensuales, muestran anuncios constantes, requieren conectividad a Internet continua y venden tus hábitos alimenticios personales a intermediarios de datos externos.

**NomAI adopta un enfoque diferente.** Es una aplicación de seguimiento de calorías para Android gratuita, de código abierto y completamente offline, construida sobre la privacidad absoluta y la inteligencia artificial en el dispositivo.

* **Repositorio de GitHub:** [github.com/breejesh/nom.ai](https://github.com/breejesh/nom.ai)

---

## Los tres pilares de NomAI

NomAI fue diseñada desde cero para desafiar los patrones de diseño estándar en el desarrollo de aplicaciones móviles, centrándose en tres pilares principales:

### 1. 100% gratuita y de código abierto (FOSS)
No hay muros de pago premium, ni gráficos bloqueados, ni pasarelas de pago. Toda la aplicación tiene licencia MIT y es completamente gratuita para usar, modificar y construir sobre ella. El código fuente completo, incluyendo las plantillas de ingeniería de prompts y la configuración del modelo, está disponible para que cualquiera pueda auditarlo, hacer un fork o contribuir.

### 2. Privacidad primero (sin servidor de backend)
NomAI no tiene un servidor remoto. Literalmente, no existe infraestructura de backend a la que enviar datos. Tus métricas físicas, el historial de comidas y tus objetivos nutricionales permanecen exclusivamente en la base de datos local Room de tu dispositivo. Esto no es privacidad por política, es privacidad por arquitectura.

### 3. Inferencia de LLM local y sin conexión primero
Todos los análisis de comidas y estimaciones de macronutrientes se realizan en el dispositivo. Impulsado por **Google Gemma-2B** y el entorno de ejecución **LiteRT** de Google, la aplicación analiza la entrada de texto en lenguaje natural directamente dentro de tu teléfono. No se requiere conexión a Internet para las funciones principales.

---

## Interfaz de la aplicación y muestras de pantalla

Para ver cómo luce y se comporta NomAI, exploremos las pantallas y los flujos de usuario.

### Adaptabilidad del tema
Así es como cambia el diseño limpio y minimalista entre el tema claro off-white cálido y el tema oscuro medianoche:

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/home-light.png" width="260" alt="Light Dashboard">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/home-dark.png" width="260" alt="Dark Dashboard">
</p>

---

### El viaje de añadir de forma inteligente
El seguimiento de una comida es totalmente local: descríbela con naturalidad o toma una foto, revisa los elementos extraídos y regístralos.

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

### Gráficos, historial y configuración
Accede a gráficos semanales, navega por tu historial o personaliza tu experiencia sin conexión.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/dashboard.png" width="240" alt="Dashboard Analytics">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/journal.png" width="240" alt="Meal Journal">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/settings.png" width="240" alt="App Settings">
</p>

---

## Ingeniería de prompts: Obtención de estimaciones nutricionales confiables

El desafío técnico más interesante en NomAI es extraer **datos nutricionales estructurados y confiables** de un modelo de 2 mil millones de parámetros que no fue entrenado específicamente para el análisis nutricional.

La solución es una plantilla de prompt cuidadosamente diseñada que restringe la salida del modelo:

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

**Por qué funciona esta estructura:**
- **Especificación explícita del formato:** Evita que el modelo genere respuestas conversacionales o explicaciones adicionales.
- **Instrucciones negativas** ("no other text"): Reducen la posibilidad de preámbulos que romperían el parseo de JSON.
- **Referencia a los valores de la USDA:** Ancla las estimaciones del modelo a un estándar conocido en lugar de permitir suposiciones arbitrarias.
- **El campo `serving`:** Proporciona transparencia; el usuario puede ver qué tamaño de porción asumió el modelo y corregirlo si es necesario.

### Manejo de fallas del modelo

Los modelos pequeños no son perfectamente confiables. NomAI implementa una estrategia de fallback de múltiples capas:

1. **Validación de JSON:** Cada respuesta se analiza con un deserializador estricto de JSON. Si falla, el prompt se vuelve a intentar con un formato aún más restringido (análisis de un solo elemento).
2. **Comprobaciones de coherencia:** Las calorías estimadas se validan frente a límites razonables (por ejemplo, se rechaza un solo alimento que afirme tener 10,000 calorías). Los totales de macros se comprueban contra el conteo calórico total (calorías ≈ proteínas×4 + carbohidratos×4 + grasas×9).
3. **Corrección del usuario:** Si la estimación del modelo parece incorrecta, el usuario puede tocar cualquier campo para anularla manualmente. Los valores corregidos se almacenan junto con la estimación original, lo que eventualmente podría usarse para ajuste fino (fine-tuning) o evaluación.

---

## Pila tecnológica y arquitectura

Construido con estándares modernos de Android, NomAI representa una implementación de vanguardia del aprendizaje automático en el dispositivo:

* **Jetpack Compose:** Un kit de herramientas de interfaz de usuario declarativo y moderno que mantiene la interfaz reactiva, fluida y hermosa. El modelo de estado reactivo se acopla de forma natural con la inferencia asíncrona de LLM; los resultados parciales pueden transmitirse directamente a la interfaz.
* **LiteRT-LM SDK:** El entorno de ejecución de IA generativa de alto rendimiento de Google, que utiliza aceleración de hardware (GPU/NPU) para ejecutar modelos Gemma con un consumo mínimo de batería. El modelo se ejecuta en `Dispatchers.IO` para mantener libre el hilo de la interfaz.
* **Room Database:** Una capa de abstracción local de SQLite para el almacenamiento rápido y seguro de los registros de comidas y los objetivos del usuario. Las consultas basadas en Flow de Room permiten actualizaciones de la interfaz en tiempo real cuando se registran nuevas comidas.
* **Hilt (Inyección de dependencias):** El motor de LLM se proporciona como un singleton con alcance al ciclo de vida de la aplicación, asegurando que el modelo se cargue una vez y se comparta entre todas las funciones que lo necesitan.
* **Corrutinas y Flow de Kotlin:** Todas las operaciones de LLM están envueltas en concurrencia estructurada. StateFlow impulsa la interfaz, mientras que SharedFlow maneja eventos únicos como toasts de error y navegación.

---

## Desafíos y lecciones aprendidas

El desarrollo de una aplicación con LLM sin conexión primero reveló varios desafíos de ingeniería no evidentes:

### Precisión del modelo en comidas poco comunes
Gemma 2B funciona bien con comidas occidentales comunes (huevos, tostadas, pechuga de pollo) pero tiene dificultades con platos regionales, cocinas étnicas y productos de marcas específicas. Un prompt como *"Comí un plato de dal makhani con dos rotis"* puede producir estimaciones de calorías razonables pero fallar por un 20-30% en macros individuales. La brecha de precisión se amplía aún más con platos complejos que tienen métodos de preparación muy variables.

**Mitigación:** NomAI siempre presenta las estimaciones con una etiqueta sutil de "estimado" y fomenta el ajuste manual para comidas complejas.

### Porciones ambiguas
Cuando un usuario dice *"Comí algo de arroz"*, ¿cuánto arroz es "algo"? El modelo utiliza por defecto los tamaños de porción estándar de la USDA (1 taza cocida, ~200g), pero la intención del usuario varía enormemente. El "algo de arroz" de un fisicoculturista podría ser de 3 tazas.

**Mitigación:** El campo `serving` en la respuesta JSON hace visible la suposición del modelo. Los usuarios pueden tocar para ajustar.

### Presión de memoria
Ejecutar un modelo de 2B parámetros junto con una interfaz completa de Compose, la base de datos Room y potencialmente otras aplicaciones ejerce una presión real sobre la memoria del dispositivo. En dispositivos con 6 GB de RAM, la aplicación debe ser agresiva a la hora de liberar recursos: limpiar cachés de imágenes, usar carga diferida (lazy loading) para los datos históricos de comidas y monitorear callbacks de presión de memoria.

**Mitigación:** NomAI registra un escuchador `ComponentCallbacks2` y, cuando la memoria es crítica (`TRIM_MEMORY_RUNNING_LOW`), libera el motor de LLM y muestra un botón de "recargar" en lugar de mantenerlo residente.

### Descarga inicial
El archivo del modelo pesa ~1.4 GB, demasiado grande para incluirlo en un APK. NomAI lo descarga en el primer inicio, lo que crea un momento crítico de experiencia de usuario (UX) en la incorporación. Los usuarios con conexiones lentas pueden esperar de 5 a 10 minutos.

**Mitigación:** Una barra de progreso con el tiempo estimado restante, soporte para pausar/reanudar la descarga y la capacidad de usar el modo de entrada manual de la aplicación mientras el modelo se descarga en segundo plano.

---

## Conclusión

NomAI es más que un simple contador de calorías; es una prueba de concepto para una nueva generación de aplicaciones móviles. Demuestra que podemos construir aplicaciones robustas e inteligentes que respetan la privacidad del usuario, funcionan completamente offline y se ejecutan a un costo continuo de cero tanto para el desarrollador como para el usuario.

El código fuente está completamente abierto en [GitHub](https://github.com/breejesh/nom.ai). Si estás interesado en la IA en el dispositivo, la arquitectura sin conexión primero o simplemente deseas un contador de calorías que no venda tus datos, echa un vistazo y considera contribuir.
