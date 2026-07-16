---
title: "Presentando NomAI: El rastreador de calorías sin conexión impulsado por LLMs locales"
description: "Una mirada profunda a NomAI, la primera aplicación de seguimiento de calorías para Android gratuita, de código abierto y completamente sin conexión, construida con Google Gemma y Jetpack Compose."
date: 2026-07-10
tags: [Android, Gemma LLM, Innovación Móvil, Código Abierto, Privacidad]
coverImage: /assets/images/nom-ai-showcase.webp
previewImage: /assets/images/nom-ai-showcase.webp
---

El seguimiento de calorías se ha convertido en un elemento básico del fitness moderno. Sin embargo, casi todos los rastreadores de calorías populares en el mercado comparten una serie de frustraciones comunes: exigen suscripciones mensuales, muestran anuncios constantes, requieren conectividad a Internet y venden tus hábitos alimenticios a corredores de datos de terceros.

**NomAI es el antídoto.** Es el primer rastreador de calorías para Android gratuito, de código abierto y completamente sin conexión del mundo, basado en la privacidad absoluta y en una IA local de vanguardia.

* **Repositorio de GitHub:** [github.com/breejesh/nom.ai](https://github.com/breejesh/nom.ai)

---

## Los tres pilares de NomAI

NomAI fue diseñado desde cero para desafiar los patrones de diseño estándar en el desarrollo de aplicaciones móviles, centrándose en tres pilares fundamentales:

### 1. 100% Gratuito y de Código Abierto (FOSS)
No hay muros de pago premium, gráficos bloqueados ni pasarelas de pago. Toda la aplicación tiene licencia MIT y es completamente gratuita para usar, modificar y desarrollar.

### 2. Privacidad Primero (Sin servidor en la nube)
NomAI no tiene un servidor remoto. Literalmente no podemos recopilar, analizar ni compartir tus métricas físicas o historial de comidas porque no tenemos infraestructura de backend a la cual enviarlos. Tus datos permanecen exclusivamente en la base de datos local de tu dispositivo.

### 3. Inferencia de LLM local y sin conexión
Todos los análisis de comidas y estimaciones de macronutrientes se realizan en el dispositivo. Impulsada por **Google Gemma-2B** y el motor de ejecución **LiteRT** de Google, la aplicación analiza la entrada de texto en lenguaje natural directamente dentro de tu teléfono. Nunca se solicita conexión a Internet.

---

## Innovación en acción: Cómo funciona

Las aplicaciones tradicionales requieren motores de búsqueda para asignar los alimentos a bases de datos en línea. En contraste, NomAI te permite describir tus comidas en texto natural:

> *"Comí dos huevos revueltos, una rebanada de tostada integral y un café negro."*

Detrás de escena, NomAI envía esta entrada a un modelo local Gemma-2B. Usando ingeniería de instrucciones especializada, el modelo analiza los alimentos, calcula las porciones estimadas y genera estimaciones nutricionales estructuradas (calorías, proteínas, carbohidratos y grasas).

Debido a que la inferencia se ejecuta en el dispositivo, la respuesta es casi instantánea, consume cero datos móviles y se mantiene completamente privada.

---

## Stack técnico y arquitectura

Construido con estándares modernos de Android, NomAI representa una implementación de vanguardia del aprendizaje automático en el dispositivo:

* **Jetpack Compose:** Un kit de herramientas de interfaz de usuario declarativo moderno que mantiene la interfaz interactiva, fluida y atractiva.
* **LiteRT-LM SDK:** El motor de ejecución de IA generativa de alto rendimiento de Google, que utiliza aceleración de hardware (GPU/NPU) para ejecutar modelos Gemma con un consumo mínimo de batería.
* **Room Database:** Una capa de abstracción local de SQLite para el almacenamiento seguro y rápido de los registros de comidas y los objetivos del usuario.

---

## Conclusión

NomAI es más que un simple rastreador de calorías; es una prueba de concepto para el futuro del diseño de software móvil. Demuestra que podemos crear aplicaciones robustas y altamente inteligentes que respetan los límites del usuario, funcionan sin conexión y se ejecutan sin costos. ¡Echa un vistazo al código fuente abierto en GitHub para explorar la implementación o descarga la aplicación hoy mismo!
