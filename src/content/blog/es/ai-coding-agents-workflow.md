---
title: "Cómo usar agentes de código con IA sin enviar basura a producción"
description: "Hábitos prácticos al estilo Cursor y Copilot: ventanas de contexto, bucles de revisión, tests primero con agentes y cuándo rechazar código de IA."
date: "2026-08-05"
tags: [IA, Productividad]
coverImage: /assets/images/ai-coding-agents-workflow.webp
previewImage: /assets/images/ai-coding-agents-workflow.webp
---

Los agentes de código con IA son excelentes generando código plausible a gran velocidad. También son excelentes generando bugs plausibles, abstracciones incorrectas y "arreglos" que rompen tres archivos vecinos. La distancia entre las demos y producción no es el IQ del modelo. Es el proceso.

Trato a los agentes al estilo Cursor y a las completaciones al estilo Copilot como a un junior muy rápido: útiles, incansables y totalmente dispuestos a inventar algo que parece correcto. Tu trabajo no es escribir menos. Tu trabajo es controlar el contexto, exigir pruebas y rechazar con convicción.

Esta guía es un manual de trabajo. Sin guerras de herramientas. Solo hábitos que mantienen la velocidad sin llenar el repositorio de basura.

---

## 1. El contexto es la interfaz real

Los agentes no "entienden tu codebase". Hacen pattern matching sobre lo que les pones delante. Mal contexto produce código incorrecto con seguridad. Buen contexto produce diffs aburridos y listos para merge.

**Dale al agente el paquete honesto más pequeño:**

1. **El objetivo en una frase.** "Añade reintentos idempotentes al handler del webhook de pagos ante 5xx de Stripe." No "mejorar el manejo de errores."
2. **Los archivos que poseen el comportamiento.** Handler, servicio, utilidad de reintentos existente y el archivo de tests. No todo el árbol del módulo.
3. **Convenciones locales.** Cómo nombráis paquetes, cómo logueáis, cómo estructuráis errores, qué cliente HTTP usáis.
4. **Restricciones.** "Sin nuevas dependencias." "Respeta la política de reintentos actual." "No cambies la API pública."
5. **Definición de hecho.** "Los unit tests cubren IDs de evento duplicados y timeouts de red. Los tests del webhook existentes siguen pasando."

Si el prompt es vago, el agente inventará arquitectura. Esa invención es donde empieza la mayor parte de la basura.

**Las instrucciones a nivel de repo ayudan**, ya sean reglas de Cursor, un archivo de instrucciones del proyecto o un fragmento corto de `CONTRIBUTING` que el agente siempre ve. Mantén esas reglas cortas y operativas:

- Prefiere helpers existentes a utilidades nuevas
- No reescribas archivos no relacionados
- Sigue el estilo actual de errores y logs
- Nunca silencies tests fallidos borrándolos

Las reglas tipo manifiesto largo se ignoran. Las reglas duras y cortas se respetan.

---

## 2. Gestiona la ventana de contexto como un recurso escaso

Las ventanas de contexto parecen enormes hasta que pegas media monorepo. Cuando la ventana se llena de ruido, el modelo pierde las líneas importantes: tu invariante, tu caso límite, la función que ya resolvía esto.

**Higiene práctica de la ventana:**

- **Abre un chat nuevo por cada tarea nueva.** El historial del refactor de ayer sesgará el bugfix de hoy.
- **Prefiere referencias a archivos frente a pegados enormes.** Apunta al archivo real para que vea el contenido actual, no un snippet obsoleto.
- **Resume decisiones, no transcripciones.** Cuando el chat se alarga, escribe una nota breve de "hasta aquí" y abre una sesión limpia con esa nota y los archivos activos.
- **Corta callejones sin salida.** Si el agente se equivocó tres turnos, no apiles más correcciones. Reinicia con una restricción más clara.
- **No vuelques logs enteros.** Pega la aserción fallida, el frame de pila que importa y un payload representativo.

Modelo mental útil: cada token que incluyes compite con los tokens que explican el bug. Protéjelos.

---

## 3. Escribe el contrato antes de dejar que el agente codee

El movimiento de mayor apalancamiento con agentes sigue siendo clásico: define el comportamiento primero.

**Test-first con un agente se ve así:**

1. Escribes o esbozas el test que falla (o el tipo/interfaz) que captura el comportamiento deseado.
2. Pides al agente que haga pasar el test con el cambio más pequeño posible.
3. Ejecutas la suite tú. No confíes en el "todo verde" del agente hasta verlo.
4. Revisas el diff por scope creep y luego haces commit.

Por qué funciona: tests y tipos reducen el espacio de búsqueda. El agente no inventa requisitos de producto a mitad del diff. Resuelve un problema cerrado.

**Buenas tareas para el agente:**

- Implementar una función que ya tiene tests table-driven
- Migrar un call site a una API nueva manteniendo los tests en verde
- Añadir un camino de null check cubierto por un fixture existente
- Generar boilerplate del que el proyecto ya tiene tres ejemplos

**Malas tareas (hasta que las acotes):**

- "Construye auth"
- "Limpia este módulo"
- "Hazlo más escalable"
- "Arregla el test flaky de alguna forma"

Si no puedes enunciar entradas, salidas y modos de fallo esperados, el agente tampoco. Aun así producirá código. Ese es el problema.

---

## 4. Usa un bucle de revisión, no un "me parece bien"

Leer la salida de la IA como un PR de un desconocido es el trabajo completo. La velocidad viene de bucles cortos, no de saltarse la revisión.

**Un bucle de revisión que aguanta en repos reales:**

1. **Primero el alcance del diff.** ¿Tocó archivos fuera de la tarea? Revierte eso al momento. La "limpieza" no relacionada es donde se esconden regresiones sutiles.
2. **Lee por intención, no por estilo.** El formato lo arreglan las herramientas. El control de flujo incorrecto no.
3. **Traza el happy path a mano.** Sigue una petición de entrada a retorno. ¿La forma de los datos coincide con lo que esperan los callers?
4. **Fuerza el camino de fallo.** Timeouts, listas vacías, escrituras parciales, eventos duplicados, callers no autorizados. Los agentes generan poco de esto.
5. **Ejecuta el conjunto de tests más estrecho pero honesto**, y luego una suite más amplia si el cambio cruza límites.
6. **Solo entonces** pide una segunda pasada: "Esto falló. Arregla solo eso. No refactorices."

Nunca aceptes reescrituras multiarchivo porque el primer intento casi funcionó. Prefiere parches quirúrgicos.

**Olores que te ahorran dolor:**

- Nueva abstracción con un solo call site
- Utilidad copiada que ya existe dos carpetas más allá
- `try/catch` amplios que devuelven null o éxito vacío
- Flags "temporales" sin plan de retirada
- Comentarios que narran el código en lugar de explicar una restricción no obvia
- Cambios de config sin explicación en la descripción del PR

Si aparecen dos de estos, el agente está improvisando. Baja la velocidad.

---

## 5. Cuándo rechazar el código de IA de plano

Rechazar es una habilidad. Aceptar a medias una mala estructura y "solo pulirla" suele costar más que reescribir.

**Rechaza y reinicia cuando:**

- El agente no puede explicar *por qué* el cambio es correcto en lenguaje claro
- El arreglo depende de una librería o API que no existe en tu proyecto (o en la realidad)
- Resuelve un problema distinto al del ticket
- Se editaron tests para encajar un comportamiento roto en lugar de arreglar el código
- Cambiaron rutas sensibles de seguridad (auth, crypto, pagos, tenancy) sin un diseño humano cuidadoso
- El diff es grande y no puedes retener el cambio de comportamiento completo en la cabeza

**Reescribe tú cuando:**

- La lógica de dominio es sutil y ya conoces el diseño
- El cambio son diez líneas y el agente insiste en un framework
- Estás aprendiendo el área y necesitas el modelo mental más que la velocidad

**Mantén al agente cuando:**

- El patrón se repite (endpoints CRUD, mappers, tablas de tests)
- Migraciones mecánicas con compilador o suite de tests como red de seguridad
- Borradores de docs, mensajes de commit o checklists de review a partir de un diff conocido
- Explorar dos opciones de implementación en un spike pequeño y bien acotado

Los agentes aceleran formas conocidas. Son malos sustitutos de la propiedad del diseño.

---

## 6. Un flujo diario que no envía basura

Este es el bucle que uso en trabajo no trivial:

1. **Aclara el cambio en una nota corta.** Objetivo, no-objetivos, archivos, riesgos.
2. **Cierra el contrato.** Test que falla, tipo o boceto de API primero.
3. **Abre una sesión limpia del agente** solo con los archivos relevantes y la nota.
4. **Pide el parche más pequeño**, no un rediseño.
5. **Ejecuta tests y linters tú.**
6. **Revisa como una code review hostil.** Alcance, edge cases, seguridad, rendimiento.
7. **Acepta, pide un arreglo puntual o descarta.** Sin lealtad al costo hundido de un hilo malo.
8. **Haz commit con un mensaje escrito por un humano** que diga qué y por qué. Si no puedes escribir ese mensaje con claridad, aún no entiendes el cambio.

Para completaciones minúsculas (rename, null guard obvio, nombre de test), las sugerencias inline al estilo Copilot valen. Cuando el cambio cruza un límite de módulo, pasa al bucle completo de arriba.

---

## 7. Los hábitos de equipo importan más que los trucos personales

La habilidad individual ayuda. Los defaults compartidos mantienen el codebase sano cuando cinco personas usan agentes de formas distintas.

Merece estandarizar:

- **Tests obligatorios en PRs asistidos por IA** en las mismas áreas que ya exigís a PRs humanos
- **Prohibidos los refactors de pasada** en ramas de feature, humanos o IA
- **Nunca pegar secretos ni acceso a prod en prompts**
- **Un archivo corto de reglas del proyecto** versionado en el repo
- **Ítem en el checklist del reviewer:** "¿Fue asistido por IA y se ejercitaron los caminos de fallo?"

No necesitáis una novela de políticas. Necesitáis acuerdo en que la velocidad no excusa diffs sin revisar.

---

## Conclusión

Los agentes de código con IA suben el techo de lo rápido que puedes producir código candidato. No suben el techo de cuánto código sin revisar puede absorber tu sistema.

Domina el contexto. Escribe el contrato primero. Revisa como si el autor fuera listo e indigno de confianza. Rechaza sin culpa. Deja al agente el trabajo mecánico y bien acotado, y mantén las decisiones de diseño en manos humanas.

Haz eso y los agentes dejan de ser una fuente de deuda silenciosa en producción. Se convierten en lo que prometían las demos: una herramienta afilada con un operador responsable.
