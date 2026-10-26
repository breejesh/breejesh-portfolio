---
title: "Un marco práctico para entrevistas de diseño de sistemas: qué se puntúa y cómo repartir 45 minutos"
description: "Un plan repetible para entrevistas de diseño de sistemas: qué puntúan de verdad los entrevistadores, un presupuesto minuto a minuto, las preguntas de aclaración que importan, cómo presentar un diseño de alto nivel y conseguir acuerdo, dónde profundizar según el tipo de problema, un diálogo de ejemplo y los hábitos que hunden a candidatos por lo demás sólidos."
date: "2026-01-22"
tags: [Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/design-interview-framework.webp
previewImage: /assets/images/design-interview-framework.webp
---

> **TL;DR**
> * **El problema:** Las entrevistas de diseño de sistemas son abiertas a propósito. Ingenieros fuertes las suspenden no por falta de conocimiento sino de estructura: se lanzan a los detalles, diseñan para requisitos que nadie ha planteado y se quedan sin tiempo antes de demostrar profundidad.
> * **El marco:** Aclarar (5 minutos), estimar (5), diseño de alto nivel con acuerdo (15), profundizar en dos o tres partes difíciles (15) y cerrar con compromisos y siguientes pasos (5). Narra las decisiones como compromisos, no como hechos.
> * **El resultado:** Una conversación que el entrevistador puede puntuar en todos los ejes que le importan: manejar la ambigüedad, un diseño sólido, profundidad técnica y comunicación, con tiempo para profundizar donde cuenta.

No hay respuesta correcta a "diseña Twitter" en 45 minutos. Los entrevistadores lo saben. Lo que puntúan es cómo pasas de un enunciado ambiguo a un diseño razonable y cómo piensas cuando te aprietan.

Este artículo es la estructura que uso y recomiendo. No es un guion. Es un presupuesto para tu atención.

---

## Qué puntúa de verdad el entrevistador

Las rúbricas cambian según la empresa, pero se agrupan en cuatro áreas:

| Área | Cómo se ve hacerlo bien |
| --- | --- |
| Navegar el problema | Hace las preguntas que cambian el diseño; acota el problema a propósito; enuncia los supuestos |
| Diseño de la solución | Produce un diseño coherente de extremo a extremo en el que cada componente tiene una razón de ser |
| Profundidad técnica | Profundiza en las partes más difíciles: modelo de datos, consistencia, cuellos de botella, modos de fallo |
| Comunicación | Piensa en voz alta, comprueba con el entrevistador, acepta pistas y explica los compromisos con claridad |

Fíjate en lo que falta: arquitecturas memorizadas, palabras de moda y la base de datos "correcta". Un candidato que elige la opción poco habitual y explica bien el compromiso puntúa mejor que uno que elige la esperada y no sabe decir por qué.

---

## El presupuesto de 45 minutos

![Cronología de la entrevista: aclarar los cinco primeros minutos, estimar del cinco al diez, diseño de alto nivel del diez al veinticinco, profundizar del veinticinco al cuarenta y cerrar en los últimos cinco, con el recordatorio de que la mayoría de entrevistas fallidas se saltan la aclaración y pasan cuarenta minutos profundizando](/assets/images/hld/design-interview-timeline.webp)

La nota roja describe el fallo más común: lanzarse directamente a las tripas de un componente sin establecer nunca para qué sirve el sistema.

---

## Paso 1: aclarar (0 a 5 minutos)

Tu objetivo es una lista corta y explícita de requisitos en la que estáis de acuerdo tú y el entrevistador.

**Preguntas funcionales (¿qué debe hacer?)**

* ¿Quiénes son los usuarios y cuáles son las dos o tres acciones principales?
* ¿Qué funcionalidades entran hoy y cuáles podemos dejar fuera de forma explícita?
* ¿Algún caso especial que cambie el diseño (cuentas privadas, ediciones, borrados, multimedia)?

**Preguntas no funcionales (¿qué tan bien debe hacerlo?)**

* ¿Cuántos usuarios y con qué actividad? ¿El tráfico es global o regional?
* ¿Qué latencia importa y en qué operación?
* ¿Es aceptable mostrar datos algo desactualizados? ¿Podemos perder alguna vez una escritura?
* ¿Predominan las lecturas o las escrituras?

Después escribe la lista donde ambos podáis verla. Ejemplo para "diseña un news feed": publicar texto e imágenes, seguir a usuarios, ver un feed principal de las cuentas seguidas, lo más nuevo primero; 300M de usuarios diarios; feed en menos de 200 ms; unos segundos de retraso antes de que aparezca una publicación están bien. Fuera de alcance: anuncios, mensajería, búsqueda.

Esa lista es tu contrato para los siguientes 40 minutos.

---

## Paso 2: estimar (5 a 10 minutos)

Haz solo las cuentas necesarias para encontrar la parte difícil: QPS de lectura y de escritura, crecimiento del almacenamiento y cualquier ancho de banda que pueda dominar. El [artículo de estimaciones](/blog/es/design-back-of-envelope-estimation) de esta serie tiene las recetas.

Di la conclusión, no solo las cifras: "Las lecturas superan a las escrituras unas 100 a 1, y el fan-out multiplica las escrituras por el número de seguidores, así que el almacenamiento de timelines y el fan-out son la parte difícil".

Algunos entrevistadores te dirán que te saltes la estimación. Hazla igualmente en una frase; la conclusión sigue dando forma a tu diseño.

---

## Paso 3: diseño de alto nivel y acuerdo (10 a 25 minutos)

Dibuja el flujo de extremo a extremo de cada acción principal antes de profundizar en nada.

1. **Primero las APIs.** Dos o tres endpoints con sus parámetros clave: `POST /posts`, `GET /feed?cursor=`. Te obligan a tener claro qué hace cada petición.
2. **Modelo de datos.** Las entidades principales y cómo se indexan y particionan. Aquí es donde muchos diseños triunfan o fracasan en silencio.
3. **Cajas y flechas.** Clientes, borde (balanceador, CDN), servicios, almacenes de datos y colas. Recorre una petición en cada acción principal.
4. **Comprueba.** "¿Esto cubre lo que quieres o ajustamos algo antes de profundizar?". Es el momento del acuerdo, y a menudo te gana una pista sobre dónde quiere profundidad el entrevistador.

**Piezas habituales y cuándo se ganan su sitio:**

| Pieza | Añádela cuando |
| --- | --- |
| Balanceador | Haya más de una instancia de cualquier cosa |
| Caché | Haya acceso de mucha lectura a datos que toleran algo de antigüedad |
| Réplicas de lectura | La carga de lectura supere a una base de datos |
| Cola de mensajes | El trabajo pueda hacerse después de la respuesta o deba reintentarse |
| CDN | Haya contenido estático o multimedia servido a muchos usuarios |
| Particionado | Los datos o la carga de escritura superen a una base de datos tras agotar opciones más baratas |
| Almacenamiento de objetos | Haya ficheros grandes: imágenes, vídeo, documentos, copias de seguridad |

Cada caja debe responder a "¿qué se rompe si la quito?". Si no sabes responder, quítala.

---

## Paso 4: profundizar (25 a 40 minutos)

Elige dos o tres partes realmente difíciles para este problema, o sigue al entrevistador. Buenos objetivos según el tipo de problema:

| Tipo de problema | Dónde está la profundidad |
| --- | --- |
| Feeds y timelines | Fan-out en escritura frente a lectura, el problema de las celebridades, ranking, paginación |
| Chat y tiempo real | Gestión de conexiones, orden, garantías de entrega, presencia |
| Sistemas de almacenamiento | Particionado, replicación, consistencia, resolución de conflictos |
| Acortador de URL, generador de IDs | Generación de claves, colisiones, claves calientes, caché |
| Limitador de tasa | Elección del algoritmo, atomicidad, contadores distribuidos, fallar abierto o cerrado |
| Plataformas multimedia | Pipeline de subida, transcodificación, CDN, coste |
| Búsqueda y autocompletado | Pipeline de indexación, ranking, presupuesto de latencia |

En cada profundización cubre: el enfoque ingenuo y por qué falla, el enfoque mejor, lo que cuesta y cómo falla. Esa estructura de cuatro partes demuestra profundidad de forma más fiable que cualquier cantidad de jerga.

---

## Paso 5: cerrar (40 a 45 minutos)

No declares perfecto el diseño. Resúmelo en dos frases y luego nombra:

* El cuello de botella actual y qué harías cuando se sature.
* El compromiso principal que hiciste y cuándo lo revisarías.
* Qué vigilarías en producción.

Eso muestra el criterio que buscan los entrevistadores en los perfiles sénior: sabes qué has construido, cuánto cuesta y dónde se romperá primero.

---

## Un diálogo de ejemplo breve

> **Entrevistador:** Diseña un acortador de URL.
>
> **Candidato:** Antes de dibujar nada, unas preguntas. ¿Necesitamos alias personalizados y caducidad, o solo códigos aleatorios? ¿Hace falta analítica de clics? ¿Cuántos enlaces al mes, aproximadamente, y qué relación entre lecturas y escrituras debo suponer?
>
> **Entrevistador:** Alias personalizados sí, analítica aproximada, 100 millones de enlaces al mes, sobre todo lecturas.
>
> **Candidato:** Entonces trataré las redirecciones como la ruta crítica y la analítica como algo de mejor esfuerzo. 100 millones al mes son unas 40 escrituras por segundo, y con 100 lecturas por escritura salen unas 4.000 redirecciones por segundo de media. Lo difícil es generar los códigos y mantener rápidas las redirecciones, así que diseñaré eso con cuidado y dejaré la analítica fuera de la ruta de redirección. Estas son las dos APIs...

Fíjate en que el candidato nunca afirmó tener la respuesta "correcta". Convirtió el enunciado en requisitos, dijo cuál era la parte difícil y se ganó el derecho a diseñarla.

---

## Qué hacer y qué no

| Haz | No hagas |
| --- | --- |
| Escribe los requisitos y vuelve a ellos | Empezar a dibujar cajas en el primer minuto |
| Di "supondré X; dime si me equivoco" | Suponer en silencio y esperar acertar |
| Explica cada decisión como un compromiso | Presentar tecnologías como obviamente correctas |
| Recorre una petición de extremo a extremo | Describir componentes por separado |
| Comprueba al terminar el diseño de alto nivel | Soltar un monólogo de 20 minutos |
| Admite lo que no sabes y razona desde los principios | Farolear sobre las tripas de una tecnología |
| Nombra los modos de fallo antes de que te pregunten | Suponer que todo sale bien |

---

## Lista reutilizable

- [ ] Requisitos funcionales listados y acordados; lo que queda fuera, dicho
- [ ] Requisitos no funcionales: escala, latencia, consistencia, disponibilidad
- [ ] Estimaciones con una conclusión explícita sobre la parte difícil
- [ ] APIs y modelo de datos principal
- [ ] Flujo de extremo a extremo de cada acción principal
- [ ] Comprobación de acuerdo antes de profundizar
- [ ] Dos o tres profundizaciones: enfoque ingenuo, enfoque mejor, coste, fallo
- [ ] Cierre: cuello de botella, compromiso principal, qué vigilar

---

## Lo que queda

Los candidatos que recuerdo no son los de los diseños más ingeniosos. Son los que hicieron al principio una pregunta en la que yo no había pensado y luego construyeron el resto de su respuesta alrededor de ella.

En eso consiste también el trabajo. La mayor parte del diseño real consiste en averiguar para qué sirve el sistema. Las cajas llegan después, y suelen ser la parte fácil.

---

## Fuentes

* [Alex Xu, "System Design Interview: An Insider's Guide"](https://www.amazon.com/System-Design-Interview-insiders-Second/dp/B08CMF2CQF)
* [Martin Kleppmann, "Designing Data-Intensive Applications"](https://dataintensive.net/)
* [Tech Interview Handbook: entrevistas de diseño de sistemas](https://www.techinterviewhandbook.org/system-design/)
* [Libro de SRE de Google: Introducción (la fiabilidad como objetivo de diseño)](https://sre.google/sre-book/introduction/)
* Relacionado en esta serie: [Estimaciones de servilleta](/blog/es/design-back-of-envelope-estimation), [Sigue aprendiendo diseño de sistemas](/blog/es/design-interview-learning-path), [Diseña un sistema de news feed](/blog/es/design-news-feed-system)
