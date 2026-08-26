---
title: "Un marco práctico para entrevistas de diseño de sistemas"
description: "Una checklist para candidatos nerviosos en entrevistas de diseño de sistemas: primero preguntas, luego el plan de cajas, después el detalle. Pasos en lenguaje claro, diálogo de ejemplo y presupuesto de tiempo reutilizable de 45-60 minutos."
date: "2026-01-22"
tags: [Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/design-interview-framework.webp
previewImage: /assets/images/design-interview-framework.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Una checklist para candidatos nerviosos en entrevistas de diseño de sistemas: primero preguntas, luego el plan de cajas, después el detalle. Pasos en lenguaje claro, diálogo de ejemplo y presupuesto de tiempo reutilizable de 45-60 minutos.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Nadie espera que reconstruyas Google Search en 45 minutos. El entrevistador no busca un diagrama perfecto. Quiere ver cómo conviertes un enunciado vago en un problema claro, cómo planificas antes de pulir detalles y si le tratas como compañero.

Si aún suena intimidante, usa una imagen que ya conoces.

**Visita al médico:** el médico pregunta qué duele, desde cuándo y qué probaste. Solo después pide pruebas o receta. Saltar directo a la cirugía sin preguntas es mala práctica.

**Reforma de casa:** un buen contratista mide la habitación, pregunta cuánta gente vive ahí y revisa el presupuesto antes de elegir el azulejo. Dibujar una cocina de lujo en el minuto uno y luego descubrir que no hay fontanería para el fregadero pierde el tiempo de todos.

Una **entrevista de diseño de sistemas** funciona igual. "Diseño de sistemas" solo significa: planear cómo se hablan las piezas de un producto para aguantar usuarios reales. Primero preguntas. Segundo, la forma grande. Tercero, el detalle difícil. Este post es ese proceso escrito para que un candidato nervioso lo pueda seguir paso a paso.

---

## Qué se puntúa de verdad

Piénsalo como una reunión de trabajo corta sobre un problema abierto, no como un examen con un único diagrama correcto.

| Señal | Cómo se ve en lenguaje claro |
| --- | --- |
| Manejar lo difuso | Haces preguntas acotadas antes de dibujar |
| Colaborar | Dices tus supuestos en voz alta y cambias de rumbo si te corrigen |
| Elegir lo importante | Gastas tiempo en el camino crítico, no en cada feature opcional |
| Hablar de trade-offs | Nombras coste, velocidad, seguridad y lo difícil que es operar el sistema |
| Evitar banderas rojas | Sin monólogo silencioso, sin "sistema perfecto", sin microservicios en el minuto uno |

**Trade-off** es una elección donde ganas una cosa y renuncias a otra. Ejemplo: copiar datos en muchas máquinas puede acelerar lecturas, pero esas copias pueden no actualizarse todas en el mismo instante.

Banderas rojas que se notan rápido:

- Dibujar diez cajas antes de saber para quién es el producto
- Pulir un detalle mínimo mientras el flujo principal del usuario está en blanco
- Negarte a números aproximados cuando el tamaño cambiaría el plan
- Declarar el diseño "terminado" sin hablar de lo que se rompe

---

## Reloj blando para un bucle de 45 minutos

Esto es una guía, no una ley. Si el entrevistador quiere quedarse en alto nivel, quédate en alto nivel. Si te mete en un rincón difícil, ese rincón es el trabajo de ese día.

| Fase | Minutos | Objetivo |
| --- | --- | --- |
| 1. Aclarar y congelar el alcance | 3-10 | Features, usuarios, límites, lo que no vas a construir |
| 2. Tamaño aproximado (si ayuda) | 2-5 | Orden de magnitud de carga y almacenamiento |
| 3. Plan de alto nivel y acuerdo | 10-15 | Cajas grandes, flujos principales, acuerdos simples |
| 4. Detalle en las partes difíciles | 10-25 | Forma de los datos, velocidad, fallos, el cuello de botella real |
| 5. Cierre | 3-5 | Riesgos, monitorización, qué se rompe a 10x, preguntas abiertas |

**Alto nivel** es el mapa de piezas mayores (cliente, servidores, base de datos, caché), no cada línea de código. **Cuello de botella** es el primer sitio que se ahoga cuando crece el tráfico.

---

## Paso 1: Aclarar requisitos (las preguntas del médico)

No seas el candidato que suelta una arquitectura completa antes de saber quién usa el producto. Baja la velocidad. Cuando el entrevistador diga "tú decides", escribe tus supuestos donde ambos los veáis.

### Preguntas de producto (empieza aquí)

1. ¿Qué debe funcionar en la versión uno? ¿Qué puede esperar?
2. ¿Quién lo usa: app de consumidor, herramienta interna o API pública?
3. ¿Más lecturas, más escrituras o mixto? (Una **lectura** carga datos. Una **escritura** crea o cambia datos.)
4. ¿Las actualizaciones deben verse al instante o vale un pequeño retraso?
5. ¿Móvil, web o ambos? ¿Hace falta login?
6. ¿Solo texto, o también imágenes y vídeo?
7. ¿Una región para la entrevista, o mundial desde el día uno?

### Preguntas de calidad y escala

1. ¿Cuántos usuarios activos diarios aproximadamente, y a qué ritmo crecen?
2. ¿Carga media frente a pico de hora punta?
3. ¿Qué tan rápida debe sentirse la acción principal (un objetivo aproximado vale)?
4. Si velocidad y consistencia perfecta pelean, ¿cuál gana en este producto?
5. ¿Cuánto tiempo guardamos datos? ¿Reglas de privacidad (estilo borrar mi cuenta)?
6. ¿Asumimos herramientas que la empresa ya usa (base de datos habitual, caché, cola de mensajes)?

**API** es el conjunto de peticiones que el cliente manda al backend (por ejemplo: crear un post, listar un feed). **Caché** es un almacén temporal rápido para no golpear la base de datos en cada petición. **Cola** es una fila de espera para trabajo que puede ocurrir un momento después (enviar email, redimensionar imagen).

### Disciplina de alcance

Di en voz alta lo que **no** vas a diseñar hoy. Un ranking completo con machine learning para un feed, bases de datos multi-escritor globales o una larga clase de teoría suelen quemar tiempo sin sumar señal. Nómbralos, aparcalos y sigue, salvo que el entrevistador los reabra.

### Mini ejemplo: "Diseña un news feed"

- App: móvil y web
- Versión uno: publicar un post, leer posts de amigos en orden inverso de tiempo
- Algoritmos de ranking: más tarde, salvo que pregunten
- Amigos por usuario: unos 5.000
- Tráfico: unos 10 millones de usuarios activos diarios
- Media: imágenes y vídeo corto permitidos

Esa conversación sola te impide construir el producto equivocado.

---

## Paso 2: Capacidad aproximada (tamaño en el reverso del sobre)

No necesitas matemáticas perfectas. Necesitas órdenes de magnitud creíbles para que el diseño no sea un juguete.

**QPS** son consultas por segundo: cuántas peticiones llegan cada segundo. **Orden de magnitud** significa "unos 100, no unos 100.000", no una hoja de cálculo financiera.

Ten estas herramientas burdas en la cabeza:

| Cantidad | Regla práctica |
| --- | --- |
| Segundos en un día | unos 100.000 (bastante para la entrevista) |
| Peticiones al día a QPS medio | divide entre unos 100.000; el pico suele ser 2x-5x la media |
| Almacenamiento | número de ítems × tamaño medio, más margen por copias e índices |
| Ancho de banda | QPS × tamaño de una respuesta típica |

Di la forma en voz alta:

```
10M usuarios activos diarios
Asume 5 lecturas de feed por usuario y día → 50M lecturas / día
50 millones / 100.000 ≈ 500 QPS medios de lectura
Pico quizá 2.000-3.000 QPS de lectura (elige un factor y manténlo)

Asume 1 post por usuario y día → 10M escrituras / día ≈ 100 QPS medios de escritura
```

Si los números cambian el plan (una sola base de datos no basta, hace falta caché, el vídeo necesita object storage), dilo. Si no cambian nada, acorta las matemáticas y sigue. Pregunta si quieren los números antes de gastar cinco minutos.

Para un kit más completo, ver [estimación back-of-the-envelope](/blog/es/design-back-of-envelope-estimation).

---

## Paso 3: Diseño de alto nivel y acuerdo (el plano de la reforma)

Dibuja cajas. Recorre un camino feliz de punta a punta. Trata al entrevistador como co-diseñador: pausa para feedback antes de inventar seis servicios separados.

### Bloques habituales (qué significan las cajas)

| Pieza | Por qué aparece |
| --- | --- |
| Cliente (web o móvil) | Donde el usuario toca o escribe |
| Load balancer / API gateway | Puerta de entrada: reparte tráfico, a menudo login y límites |
| Servicios de app / API | Aquí viven las reglas de negocio |
| Base de datos principal | Fuente de verdad de los datos duraderos |
| Caché | Lecturas calientes sin martillar la base de datos |
| CDN / object store | Ficheros estáticos y media (fotos, vídeo) cerca del usuario |
| Cola / stream | Trabajo async: fan-out, emails, miniaturas |
| Índice de búsqueda | Patrones de consulta que la base principal odia |
| Workers | Jobs en segundo plano que procesan la cola |

**Load balancer** reparte peticiones entre servidores sanos. **CDN** es una red de cachés en el borde que sirve contenido estático cerca del usuario. **Async** significa "hazlo pronto, no necesariamente en esta misma petición".

### Cómo presentarlo

1. Esboza clientes → puerta → servicios → almacenes de datos.
2. Traza los dos o tres casos de uso críticos (crear, camino de lectura principal, quizá borrar).
3. Di si dominan lecturas o escrituras.
4. Propón APIs solo si el problema es lo bastante pequeño (acortador de URL, rate limiter). Para "diseña Google Search", quédate más grueso.
5. Pregunta: "¿Esto encaja con la escala y las features que acordamos?" Arréglalo antes del detalle.

### Forma del news feed (solo alto nivel)

- **Camino de publicar:** cliente → API → guardar metadatos del post → job que actualiza feeds de amigos (o los marca sucios).
- **Camino de leer:** cliente → API → cargar un feed preparado (o armarlo al leer) → rellenar cuerpos del post desde caché o base de datos → devolver una página.

Dos flujos mantienen honesta la pizarra. Una caja gigante llamada "Feed Service" no.

---

## Paso 4: Detalle en las partes que dan señal

Ya compartes objetivos, un esbozo de alto nivel y feedback del entrevistador. Ahora elige los bordes afilados.

### Buenos objetivos según el tipo de problema

| Problema | Vale la pena profundizar | Fáciles sumideros de tiempo |
| --- | --- | --- |
| Acortador de URL | Cómo se hacen los IDs, códigos cortos, tipo de redirect, claves de caché | UI fancy de vista previa del enlace |
| Rate limiter | Elección de algoritmo, cómo viven las claves en Redis, justicia multi-servidor | Matemática global perfecta en cada caso límite |
| Chat | Garantías de entrega, estado online, orden de mensajes | Diseño completo de cifrado de extremo a extremo |
| News feed | Push vs pull para posts de amigos, señales de ranking, pipeline de media | Recrear un modelo social de ranking completo |
| Drive / almacenamiento | Trozos de fichero, consistencia de subida, conflicto si dos dispositivos editan | Cliente web pixel-perfect |

### Checklist de detalle (elige 2-4)

1. **Modelo de datos:** entidades principales, claves, índices, cómo partes datos entre máquinas si hace falta.
2. **Contratos de API:** reintentos seguros (**idempotencia** significa que repetir una petición no crea el doble), paginación, errores claros en el camino caliente.
3. **Consistencia:** fuerte donde hay dinero o login; eventual vale donde feeds y contadores pueden retrasarse un momento.
4. **Caché:** qué se cachea, cuánto vive, cómo se invalida, cómo evitas una estampida cuando se vacía.
5. **Caminos async:** colas, reintentos, dead letters (jobs fallidos que necesitan atención especial), lenguaje honesto de entrega "al menos una vez".
6. **Cuellos de botella:** QPS más caliente, objetos más grandes, límites de un solo líder.
7. **Modos de fallo:** muere un servidor, se parte la red, caché vacía, se acumula la cola.
8. **Seguridad (breve salvo que pregunten):** login, límites de abuso, fronteras de datos privados.

Regla de tiempo: si un detalle no cambia corrección ni escala para este prompt, aparcalo. Di que existe, ofrece ir más lejos, espera un gesto de sí.

---

## Paso 5: Cerrar sin declarar perfección

Nunca termines con "y ese es el diseño completo". Deja espacio a la crítica.

1. **Recapitula** la arquitectura en unos 30 segundos (sobre todo si exploraste alternativas).
2. **Qué se rompe primero a 10x de tráfico**, y qué cambiarías.
3. **Operaciones:** métricas (latencia, tasa de error, profundidad de cola, aciertos de caché), logs, alertas, despliegue cuidadoso (feature flags, canarios pequeños).
4. **Playbook de fallos:** failover de la base principal, modo solo lectura, mensajes envenenados en una cola.
5. **Temas abiertos** si tuvieras otra hora: multi-región, mejor ranking, recortes de coste, jobs de borrado por privacidad.

Los entrevistadores recuerdan a quien puede criticar su propio diseño sin derrumbarlo.

---

## Diálogo de ejemplo (lenguaje claro)

**Entrevistador:** Diseña un news feed.

**Tú:** Antes de cajas, quiero alcance. ¿Solo móvil o ambos? ¿Hay ranking en la versión uno, o basta el orden inverso de tiempo?

**Entrevistador:** Ambos clientes. Cronológico inverso para v1 está bien.

**Tú:** Asumo unos 10 millones de usuarios activos diarios, unos 5.000 amigos por usuario y posts con imágenes. Corrígeme si no.

**Entrevistador:** Suena bien.

**Tú:** Tamaño aproximado: si cada usuario lee el feed cinco veces al día, son unos 500 QPS medios de lectura, quizá unos pocos miles en pico. Las escrituras son mucho menores si se publica una vez al día. Eso apunta a un diseño pesado en lecturas con caché en el camino caliente.

**Entrevistador:** OK.

**Tú:** Alto nivel: el camino de publicar escribe el post y un job en segundo plano ayuda a construir los feeds de amigos. El camino de lectura carga una página de feed preparada y rellena cuerpos desde caché o base de datos. ¿Encaja con lo acordado?

**Entrevistador:** Sí. ¿Cómo tratas a las celebridades con millones de seguidores?

**Tú:** Ese es el rincón difícil. Para usuarios normales puedo empujar entradas de feed al escribir. Para cuentas enormes hago pull al leer para que un post no explote en millones de escrituras. Trade-off: los feeds de celebridad cuestan más trabajo en lectura.

**Entrevistador:** ¿Qué falla primero a 10x?

**Tú:** La caché de feed y los workers de fan-out. Partiría el almacenamiento de feeds, añadiría backpressure en la cola y miraría profundidad de cola y tasa de acierto de caché. Con más tiempo hablaría multi-región y ranking más fuerte.

Esa conversación es el marco. No necesitabas un diagrama perfecto para sonar a un ingeniero calmado.

---

## Lista haz / no hagas

**Haz**

- Haz preguntas aclaratorias pronto y a menudo.
- Escribe supuestos donde ambos los veáis.
- Empieza en alto nivel; añade detalle solo tras el acuerdo.
- Diseña primero el camino crítico.
- Ofrece dos opciones cuando hay un trade-off real (por ejemplo push vs pull de fan-out).
- Piensa en voz alta. El silencio es difícil de evaluar.
- Pide una pista si te atascas. Colaborar gana a el orgullo congelado.
- Sigue hasta que el entrevistador cierre la sesión.

**No hagas**

- Corras a una solución con requisitos indefinidos.
- Conviertas un producto pequeño en un sistema multi-escritor mundial el día uno.
- Hundas 15 minutos en una micro-optimización con el modelo de datos en blanco.
- Ignores números de tamaño que contradicen tu diagrama.
- Finjas que el diseño no tiene modos de fallo.
- Discutas en contra de una guía clara del entrevistador.

---

## Checklist reutilizable de entrevista

Cópiala en tus notas. Recórrela de arriba abajo cuando estés nervioso.

```
[ ] Replantea el problema en una frase
[ ] Solo features de versión uno
[ ] Objetivos no funcionales (usuarios, QPS, latencia, consistencia)
[ ] Lista explícita de fuera de alcance
[ ] Supuestos escritos y confirmados
[ ] Capacidad aproximada (QPS, almacenamiento, ancho de banda) si afecta al diseño
[ ] Diagrama de alto nivel: clientes, puerta, servicios, datos, async
[ ] Traza caminos felices de los casos de uso principales
[ ] API o esquema solo si el tamaño del problema lo justifica
[ ] Consigue acuerdo explícito antes del detalle
[ ] Detalle 1: modelo de datos / IDs / almacenamiento
[ ] Detalle 2: rendimiento del camino caliente (caché, fan-out, sharding)
[ ] Detalle 3: consistencia, fallos u ops (elige lo que les importe)
[ ] Señala cuellos de botella y cambios a 10x
[ ] Monitorización, despliegue, riesgos conocidos
[ ] Recap + invita feedback
```

---

## Explícaselo a un amigo

Una entrevista de diseño de sistemas no es "dibuja todos los servidores de la empresa". Es una reunión de planificación corta con reloj.

1. **Pregunta primero**, como un médico: quién lo usa, qué debe hacer la versión uno, qué tan grande es, qué te saltas.
2. **Mídelo a grosso modo** para saber si una base de datos es un juguete o un riesgo real.
3. **Dibuja el plano de la reforma**: unas pocas cajas grandes y los caminos principales del usuario. Consigue un sí.
4. **Acércate a los rincones difíciles** que le importan al entrevistador: datos, velocidad, fallos.
5. **Cierra con honestidad**: qué se rompe primero, cómo lo vigilarías, qué harías con más tiempo.

Practica ese esqueleto en tres problemas distintos (almacenamiento, chat en tiempo real, feed pesado en lecturas) hasta que los cambios de fase se sientan automáticos. El objetivo no es un diagrama bonito. El objetivo es una conversación de diseño que no te avergonzaría con un ingeniero senior en tu primera semana.

Si quieres el camino de crecimiento completo antes de más prompts de entrevista, empieza por [escalar de cero a millones](/blog/es/design-scale-zero-to-millions). Para un orden de práctica de esta serie, ver la [ruta de aprendizaje](/blog/es/design-interview-learning-path).