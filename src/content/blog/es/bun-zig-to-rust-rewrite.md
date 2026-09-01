---
title: "Bun reescribió 535.000 líneas de Zig a Rust en 11 días usando 64 agentes Claude"
description: "Bun, respaldado por Anthropic, migró su codebase completo de Zig a Rust con 64 agentes de IA en paralelo, corrigiendo 128 bugs y reduciendo binarios un 20%, pero el movimiento desató una disputa pública con el creador de Zig."
date: "2026-08-13"
tags: [Backend y Bases de Datos]
coverImage: /assets/images/bun-zig-to-rust-rewrite.webp
previewImage: /assets/images/bun-zig-to-rust-rewrite.webp
---


> **TL;DR**
> * **El problema:** El codebase de Bun en Zig sufría errores crónicos de memoria por mezclar asignadores manuales con el recolector de basura de JavaScriptCore. Las políticas anti-IA de Zig y su inestabilidad pre-1.0 bloqueaban el mantenimiento automatizado tras la adquisición por Anthropic.
> * **La solución:** En lugar de una migración humana de varios años, Bun ejecutó 64 agentes Claude en paralelo con revisores adversarios para portar 535.000 líneas en 1.448 archivos durante 11 días.
> * **El resultado:** 128 bugs históricos corregidos, binarios un 20% más pequeños, fuga de memoria del servidor de desarrollo eliminada. Coste estimado de cómputo: 165.000 dólares. El creador de Zig, Andrew Kelley, calificó públicamente los benchmarks como engañosos.

En el año 2000, Joel Spolsky escribió uno de los ensayos más citados en ingeniería de software, argumentando que reescribir un codebase de producción desde cero es el peor error estratégico que una empresa puede cometer. Citaba a Netscape, que pasó tres años reconstruyendo su navegador mientras Microsoft devoraba su cuota de mercado.

Durante 26 años, esa regla se mantuvo prácticamente indiscutida. En mayo de 2026, Bun la rompió.

---

## Por qué Bun estaba atascado

Bun integra el motor JavaScriptCore (JSC) de Apple en lugar del V8 de Google. JSC utiliza un recolector de basura preciso para gestionar objetos JavaScript. El problema: el código nativo del runtime de Bun estaba escrito en Zig, un lenguaje donde la memoria se gestiona manualmente.

La mitad de los objetos de Bun vivía en el heap gestionado por el recolector de basura de JSC. La otra mitad vivía en búferes de memoria Zig con asignadores manuales. Ambas mitades mantenían punteros crudos entre sí, y mantener esos punteros sincronizados requería una disciplina cuidadosa que el codebase frecuentemente no respetaba.

Los registros de cambios de Bun estaban llenos de errores derivados de este desajuste: código leyendo memoria ya liberada, liberando la misma memoria dos veces, o no liberándola en absoluto. El servidor de desarrollo fugaba 3 MB en cada recarga en caliente porque una sola ruta de error en el empaquetador olvidaba limpiar tras de sí. No eran casos extremos exóticos. Eran consecuencias estructurales de mezclar dos modelos de gestión de memoria incompatibles en un codebase de un millón de líneas.

Tras la adquisición de Bun por parte de Anthropic a finales de 2025, surgió un segundo problema. La mayor parte del desarrollo futuro iba a ser escrito por Claude. Zig es hostil al código generado por IA: el proyecto rechaza pull requests de LLM y cierra informes de seguridad si la IA encontró el bug. Además, Zig no ha alcanzado la versión 1.0, sigue introduciendo cambios incompatibles, y representa una fracción minúscula de los repositorios públicos de código, por lo que los modelos producen Zig mediocre comparado con lenguajes más establecidos.

Rust solucionó ambos problemas. Su borrow checker traslada la gestión de memoria al sistema de tipos, convirtiendo la mayoría de errores de punteros en fallos de compilación en lugar de crashes en ejecución. Y modelos como Claude escriben Rust idiomático de alta calidad gracias a décadas de datos de entrenamiento en código abierto.

---

## Cómo lo hicieron

Jared Sumner, fundador de Bun, decidió a principios de mayo portar las 535.000 líneas de Zig a Rust. La migración no fue realizada por un equipo de programadores de sistemas humanos. Fue hecha por 64 agentes de código Claude en paralelo.

El proceso se ejecutó en tres fases:

**Fase 1: Mapeo del codebase.** Claude pasó horas estudiando el código fuente de Bun para producir una guía de migración. Un flujo de trabajo separado trazó el ciclo de vida de cada campo de estructura en una hoja de cálculo, documentando años de conocimiento tribal sobre quién posee qué memoria y cuándo se libera.

**Fase 2: Traducción en paralelo.** 64 agentes Claude trabajaron en cuatro Git worktrees, convirtiendo subsistemas independientes simultáneamente: el parser HTTP, el motor de empaquetado, la capa WebSocket, el gestor de paquetes. En el pico de producción, el enjambre generaba 1.300 líneas de Rust por minuto.

**Fase 3: Revisión adversaria.** Cada agente implementador fue emparejado con dos agentes revisores ejecutándose en ventanas de contexto aisladas. El único trabajo de los revisores era asumir que el código estaba mal y descubrir por qué. Los pull requests se bloqueaban hasta que ambos revisores aprobaban los cambios.

Once días, 6.052 commits y aproximadamente 165.000 dólares en cómputo después, toda la suite de pruebas de Bun pasaba en cada plataforma.

---

## Los números

| Métrica | Zig (Bun v1.1) | Rust (Bun v1.2) | Cambio |
|---|---|---|---|
| Líneas de código de sistemas | 535.000 | 498.000 | -6,9% |
| Tamaño del binario de release | 92,4 MB | 73,9 MB | -20% |
| Fuga de memoria del dev server | 3,2 MB por rebuild | 0,0 MB | Eliminada |
| Bugs históricos corregidos | Base | 128 cerrados | Corregidos durante el port |
| Rendimiento HTTP hello world | 142.000 req/s | 145.200 req/s | +2,2% |
| Tiempo de compilación limpia | 42 segundos | 3 min 18 seg | ~4,7x más lento |

Según el anuncio de Bun, el port en Rust ya alimenta Claude Code desde junio sin que nadie lo notara.

---

## La respuesta de Andrew Kelley

No todos celebraron. Andrew Kelley, el creador de Zig, publicó una respuesta que dejó claro que este divorcio llevaba años gestándose.

Kelley dijo que el equipo de Zig pasó años viendo cómo Bun avergonzaba a su lenguaje con código que internamente usaban como el ejemplo de libro de texto de cómo no escribir Zig. Acusó a Jared Sumner de "producir basura mucho antes de que existieran los LLM", señaló que Sumner dejó la universidad a los 18 para tomar el dinero de Peter Thiel, y transmitió informes de segunda mano de que Sumner no era exactamente un buen jefe.

Debajo de los ataques personales había objeciones técnicas legítimas:

1. **Las ganancias de rendimiento están infladas.** Kelley argumenta que las mejoras de velocidad provienen principalmente de habilitar Link-Time Optimization (LTO), que Zig ha soportado todo el tiempo. Las builds de Bun en Zig nunca lo activaron.

2. **La reducción de tamaño del binario no es un mérito de Rust.** La reducción del 20% vino de LTO y eliminación de código muerto, no de propiedades únicas de Rust.

3. **Los tiempos de compilación empeoraron dramáticamente.** La compilación limpia de Bun pasó de 42 segundos a más de 3 minutos. Kelley señala que el anuncio de Bun omitió convenientemente cualquier mención de tiempos de compilación, una métrica donde Zig gana decisivamente.

4. **El equipo de Zig está "aliviado."** Kelley dijo que tener a Bun como el usuario más visible de Zig era un lastre porque el codebase daba a los outsiders una imagen distorsionada de lo que es buen Zig.

---

## Quién se queda con la opinión pública

Probablemente nadie. Zig perdió a su usuario más famoso. Kelley perdió la compostura con ataques personales que eclipsaron sus puntos técnicos válidos. Y Sumner fue públicamente diagnosticado con "energía de principiante" por un ingeniero de compiladores.

La reescritura en sí, sin embargo, es difícil de rebatir en términos prácticos. 128 bugs corregidos, una fuga de memoria crónica eliminada, binarios un 20% más pequeños, y un codebase que los agentes de IA ahora pueden mantener de forma autónoma. La regresión en tiempos de compilación es real y significativa para el desarrollo local, pero para un proyecto cuya fuerza laboral futura son principalmente agentes Claude ejecutándose en CI, ese trade-off puede ser aceptable.

La pregunta más grande es qué significa esto para las reescrituras impulsadas por IA en general. Bun tenía ventajas inusuales: Anthropic poseía tanto la IA como el proyecto, eliminando preocupaciones sobre el coste de cómputo. El codebase tenía una suite de pruebas exhaustiva. Y el lenguaje destino (Rust) es uno donde los modelos rinden bien. La mayoría de equipos que intenten esto sin esas ventajas lo tendrán mucho más difícil.

---

## Referencias

* [The most controversial rewrite in history just shipped, Fireship / The Code Report](https://www.youtube.com/watch?v=CXSvKcLovAk)
* [Things You Should Never Do, Part I, Joel Spolsky (2000)](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/)
* [Bun Official Documentation](https://bun.sh/docs)
* [The Zig Programming Language](https://ziglang.org/documentation/master/)

