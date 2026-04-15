---
title: "Escalar de cero a millones de usuarios: crece una capa a la vez"
description: "Camino para principiantes desde un solo ordenador hasta millones de usuarios: separar capas, balanceadores, réplicas de lectura, caché, CDN, servidores sin estado, colas, multi-región y sharding de base de datos, con analogías claras y trade-offs en cada paso."
date: "2026-04-15"
tags: [Diseño de sistemas]
coverImage: /assets/images/design-scale-zero-to-millions.webp
previewImage: /assets/images/design-scale-zero-to-millions.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Camino para principiantes desde un solo ordenador hasta millones de usuarios: separar capas, balanceadores, réplicas de lectura, caché, CDN, servidores sin estado, colas, multi-región y sharding de base de datos, con analogías claras y trade-offs en cada paso.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Imagina un restaurante pequeño con un solo cocinero que también toma pedidos, lava platos y cobra. Con diez clientes al día funciona. Cuando llegan doscientos a la hora de comer, el cocinero no da abasto. No reconstruyes la ciudad. Contratas un anfitrión, más cocineros, un lavaplatos y, más tarde, quizás una segunda cocina.

Los sistemas web crecen igual. Empiezas con una máquina. Añades ayuda solo cuando aparece un dolor real. Este post es ese camino de crecimiento, escrito para que un estudiante de primer año o alguien autodidacta pueda seguir cada paso. Las ideas también son las que esperan en entrevistas de diseño de sistemas: balanceadores, cachés, CDN, réplicas de base de datos, colas y multi-región, cada una explicada cuando la necesitas.

---

## ¿Qué problema resolvemos?

Tu app se hace popular. Más gente la abre a la vez. Las páginas van lentas. A veces el sitio cae del todo. Se pierden dinero y confianza.

El problema no es "dibujar un diagrama bonito". El problema es:

1. Mantener el sitio en pie cuando mucha gente lo usa.
2. Responder lo bastante rápido para que la gente no se vaya.
3. Guardar datos con seguridad sin perder lo que el usuario acaba de guardar.
4. Gastar dinero y complejidad solo donde el usuario nota el dolor.

"Millones de usuarios" es un eslogan hasta que fijas números aproximados. Si el entrevistador no los da, elige unos razonables en voz alta y diseña contra ellos.

| Pregunta | Por qué importa |
| --- | --- |
| ¿Más lecturas o más escrituras? | Cachés y réplicas ayudan más a las lecturas |
| ¿Pico frente a media? | Dimensionas para horas punta, no para la noche |
| ¿Qué tan rápido crecen los datos? | Disco, copias de seguridad y cómo partes los datos se vuelven reales |
| ¿Qué es "demasiado lento"? | De ahí salen las decisiones de caché y CDN |
| ¿Cada lectura debe ver la última escritura? | Réplicas y multi-región cambian frescura por escala |

---

## ¿Qué pasa cuando un usuario abre la app?

Antes de cualquier arquitectura grande, sigue un solo clic.

1. El usuario escribe el nombre del sitio o toca tu app.
2. El **DNS** (la guía telefónica de internet) convierte el nombre en la dirección de un ordenador.
3. La petición viaja por la red hasta esa máquina.
4. Corre tu código de **aplicación**: comprobar login, cargar un feed, hacer un pedido.
5. La app lee o escribe en una **base de datos** (un lugar estructurado donde los datos viven a largo plazo).
6. Vuelve una respuesta: HTML, JSON, una imagen, lo que el cliente necesite.

Todo ese camino debe seguir siendo rápido y fiable cuando llegan más usuarios. Lo crecemos por etapas.

---

## Etapa 0: Un solo ordenador hace de todo

Al principio, una máquina ejecuta el código del sitio y la base de datos. Barato. Simple. Fácil de depurar.

```
Usuario → DNS → [ Web + App + Base de datos en una caja ]
```

**Por qué funciona:** prototipos, proyectos personales, cientos de usuarios. Envías funciones en lugar de gestionar máquinas.

**Qué se rompe:**

- Un fallo o reinicio tumba todo el producto.
- El trabajo de la app y el de la base pelean por la misma CPU y el mismo disco.
- No puedes crecer el sitio y el almacén de datos por separado.
- Comprar una caja más grande (**escalado vertical**: más CPU y RAM en una máquina) choca con un techo de precio y de tamaño.

Cuando la máquina va siempre al límite, crecen las esperas de disco o cada despliegue da miedo, avanza.

---

## Etapa 1: Separar el sitio y la base de datos

Pon el código de aplicación en una máquina. Pon la base de datos en otra.

```
Usuario → DNS → [ Web / App ] → [ Base de datos ]
```

Piensa en la cocina y el almacén como habitaciones distintas. Los cocineros cocinan. El almacén guarda los ingredientes con seguridad.

**Ganancias:**

- Dimensionas cada máquina para su trabajo.
- El disco de la base ya no se comparte con logs ruidosos de la app.
- Puedes dejar la base en una red privada para que internet no hable con ella directamente.

**Trade-offs:**

- Un pequeño salto de red entre app y base (suele ir bien en la misma región de la nube).
- Dos máquinas que vigilar, parchear y respaldar.
- Sigue habiendo una caja de app y una base: dos **puntos únicos de fallo** (si esa pieza muere, el producto cae).

Esta es la primera arquitectura de verdad. No la saltes para saltar a un clúster enorme el día uno.

---

## Etapa 2: Un balanceador delante de varios servidores web

Un **balanceador de carga** es un policía de tráfico para servidores. Los usuarios hablan con el policía. El policía envía cada petición a un servidor web sano.

```
Usuario → DNS → [ Balanceador ] → Web1, Web2, WebN → [ Base de datos ]
```

**Ganancias:**

- Añades más servidores web cuando crece el tráfico (**escalado horizontal**: más máquinas de tamaño similar, no una gigante).
- Despliegas código vaciando un servidor, actualizándolo y devolviéndolo mientras otros atienden.
- Las **comprobaciones de salud** (sondas simples de "¿estás bien?") sacan de la lista a los servidores enfermos.

**Trade-offs:**

- El propio balanceador es crítico. Usa un balanceador gestionado en la nube o un par con conmutación por error.
- Las **sesiones pegajosas** (enviar siempre al mismo usuario al mismo servidor porque el login vive en la memoria de ese servidor) ocultan un mal olor de diseño. Prefiere un almacén de sesión compartido más adelante.
- TLS (cifrado HTTPS), timeouts y límites de conexión pasan a ser tu trabajo o el del proveedor.

Las comprobaciones de salud deben golpear una ruta real de la app como `/health`, no solo "el puerto de red está abierto".

---

## Etapa 3: Escalar la capa web con más servidores

Cuando el balanceador existe, añadir servidores web suele ser la victoria más barata para peticiones que queman CPU.

**Cuida estos detalles:**

- Cada servidor web abre conexiones a la base. Muchos servidores por un pool grande pueden agotar el límite de conexiones de la base.
- Configuración, secretos y feature flags deben venir de un solo lugar, no diferir por accidente en cada host.
- Autoescala con señales reales (CPU, latencia de petición, profundidad de cola), no con métricas de vanidad.

**Trade-off:** escalar la web es fácil. La **base de datos y el estado compartido** son el siguiente muro. La mayoría de productos chocan con la base mucho antes de quedarse sin CPU web.

---

## Etapa 4: Base primaria más réplicas de lectura

Una **primaria** (a veces llamada master) acepta escrituras: usuarios nuevos, posts, pagos. Las **réplicas** (copias de la base que siguen a la primaria) sirven muchas lecturas: inicio, perfiles, listados de producto.

```
Capa web → escrituras → BD primaria
         → lecturas   → Réplica1, Réplica2
```

Los cambios fluyen de la primaria a las réplicas. Ese flujo es la **replicación**.

**Ganancias:**

- Productos con muchas lecturas ganan un gran multiplicador.
- Informes pesados pueden correr en una réplica para no aplastar la primaria.
- Una réplica puede ser un repuesto en caliente si cae la primaria (con práctica y herramientas).

**Trade-offs:**

- **Retraso de replicación:** el usuario guarda datos, luego lee de una réplica y aún ve el valor viejo. En rutas que deben estar frescas, lee la primaria un rato, o acepta que algunas páginas pueden estar un poco desfasadas.
- Todas las escrituras siguen yendo a una primaria. Aún no resolviste la escala de escritura.
- El failover (promover una réplica a primaria) es trabajo operativo real: detectar fallo, promover, apuntar las apps a la nueva primaria, manejar escrituras en vuelo.

En una entrevista, nombra la historia de consistencia. "Usamos réplicas asíncronas; el retraso puede ser cientos de milisegundos con carga" es mejor que fingir que toda lectura es instantáneamente fresca.

---

## Etapa 5: Una caché para datos calientes

Una **caché** es una memoria rápida a corto plazo, a menudo Redis o Memcached. La pones entre la app y la base para datos que mucha gente pide una y otra vez.

| Patrón | Idea | Riesgo |
| --- | --- | --- |
| Cache-aside | La app mira la caché; si falla, carga la BD y rellena la caché | Muchos clientes fallan a la vez al caducar |
| Read-through | La librería de caché carga al fallar | Menos control en tu código |
| Write-through | Escribe caché y BD juntos | Más latencia de escritura |
| Write-behind | Escribe primero la caché, guarda la BD después | Si la caché muere antes del volcado, se pueden perder datos |

**Ganancias:** menos carga en la base, respuestas más rápidas en claves populares, a menudo más barato que agrandar la primaria para siempre.

**Trade-offs:**

- Un TTL mal puesto o invalidación incompleta sirve datos "fantasma" viejos.
- La memoria cuesta dinero. Debes elegir reglas de desalojo (por ejemplo, quitar lo menos usado recientemente).
- La caché suele no ser la fuente de verdad. Planifica reinicios en frío cuando la caché está vacía.

Protege la base cuando caducan muchas claves a la vez: añade jitter aleatorio a los TTL, combina peticiones duplicadas, o sirve datos un poco viejos mientras un worker refresca.

---

## Etapa 6: CDN para imágenes, scripts y otros archivos estáticos

Una **CDN** (red de entrega de contenido) guarda copias de archivos en muchas ciudades cerca de los usuarios: imágenes, JavaScript, CSS, fuentes, descargas. Algunas CDN también pueden cachear HTML público o APIs GET públicas si defines bien las reglas.

```
Usuario → borde CDN cerca → (fallo) → Origen (balanceador + web) → ...
```

**Ganancias:**

- Usuarios lejos de tu centro de datos principal cargan más rápido.
- Tus máquinas de origen gastan menos ancho de banda en estáticos pesados.
- Picos de medios pegan primero en el borde, no solo en el núcleo.

**Trade-offs:**

- Debes purgar o versionar archivos (`app.a1b2c3.js`) para que nadie ejecute scripts viejos rotos.
- Respuestas privadas o personalizadas no deben vivir en una caché de borde pública compartida.
- Hay coste y dependencia del proveedor, pero suele ganar frente a sobredimensionar el origen para tráfico estático global.

Por defecto en entrevista: estáticos en CDN primero. Solo después habla de cachear GET de API públicas con claves claras y `Cache-Control`.

---

## Etapa 7: Servidores web sin estado (stateless)

**Sin estado** significa que cualquier servidor web puede atender cualquier petición de usuario. Las sesiones de login, contadores globales de límite de tasa y subidas a medias viven en almacenes compartidos (Redis, base de datos, object storage), no solo en la RAM de un servidor.

**Ganancias:**

- El balanceador puede usar reglas simples (round-robin o menos conexiones).
- Puedes añadir o quitar servidores sin "este usuario debe quedarse en el servidor 3".
- Si muere un servidor, las sesiones siguen vivas si el almacén compartido está lo bastante sano.

**Trade-offs:**

- Un salto de red extra al almacén de sesión en peticiones autenticadas.
- Ese almacén compartido se vuelve crítico. Replícalo y monitorízalo.
- Conexiones largas como WebSockets necesitan otro plan (pegajosidad o fanout pub/sub).

Si aún necesitas pegajosidad por legado, dilo y trátalo como deuda, no como diseño objetivo.

---

## Etapa 8: Más de un centro de datos (multi-región)

Un **centro de datos** (o región en la nube) es un edificio lleno de máquinas en una geografía. Servir desde más de una región baja la latencia y ayuda cuando falla toda una región.

Patrones comunes:

1. **Activo-pasivo:** una región atiende; otra se mantiene caliente de respaldo.
2. **Activo-activo:** ambas atienden tráfico. Más duro. Los datos deben replicarse con cuidado en ambos sentidos o por partición.

**Ganancias:** mejor recuperación si muere una región, páginas más rápidas para usuarios globales, opciones de residencia de datos.

**Trade-offs:**

- Diseños de base muy charlatanes duelen cuando cada consulta cruza continentes.
- Escrituras multi-master traen dolor de resolución de conflictos.
- DNS geo, health checks y simulacros de failover son coste operativo continuo.
- Algunos datos deben quedarse en-región por ley o política de producto.

En entrevistas, empieza con activo-pasivo salvo que el producto sea claramente global y sensible a latencia como para pagar la complejidad activo-activo.

---

## Etapa 9: Colas de mensajes y trabajo en segundo plano

No toda acción del usuario debe terminar dentro de la petición HTTP. Una **cola de mensajes** es una fila de espera para trabajo: enviar email, redimensionar imágenes, indexar búsqueda, disparar webhooks.

```
Web → poner trabajo en cola → [ Cola ] → Workers → BD / email / object storage ...
```

**Ganancias:**

- Suaviza picos: los workers drenan a un ritmo que el sistema aguanta.
- Aísla fallos: un proveedor de correo inestable no convierte el registro en un error 500.
- Escalas productores (web) y consumidores (workers) por separado.

**Trade-offs:**

- La UI puede mostrar "procesando" porque el trabajo termina después (**consistencia eventual**: el sistema se vuelve correcto pronto, no siempre en el mismo instante).
- La entrega suele ser **al menos una vez**. Los workers deben ser **idempotentes** (hacer el mismo trabajo dos veces no cobra dos veces ni manda dos emails).
- Mensajes venenosos, colas de letras muertas y buenos logs son obligatorios, no opcionales.
- Un orden estricto necesita diseño extra (claves de partición, particiones de un solo consumidor).

Las colas no quitan trabajo. Lo mueven a un lugar donde puedes dimensionar, reintentar y observar a propósito.

---

## Etapa 10: Cuando una base primaria aún no basta

Cuando la carga de escritura o el tamaño de datos superan una primaria:

### Máquina más grande otra vez

Más CPU, RAM, discos más rápidos. Simple hasta que el coste o el hardware te paren.

### Partir por dominio (federación)

Base de usuarios, base de pedidos, base de inventario. Dueños claros. Los joins entre dominios pasan al código de la app. Las transacciones multi-base se vuelven difíciles.

### Sharding (partir filas en muchas bases)

Un **shard** es una rebanada de los datos, a menudo por id de usuario o de tenant. Cada shard tiene su propia primaria (y suele tener sus réplicas).

**Ganancias:** el volumen de escritura y el almacenamiento pueden crecer más o menos con el número de shards.

**Trade-offs:**

- Una mala clave de shard crea puntos calientes (un shard hace casi todo el trabajo).
- Consultas que tocan muchos shards duelen.
- Rehacer shards con datos en vivo es un proyecto, no un cambio de config.
- Restricciones únicas e índices secundarios suelen ser locales al shard salvo que construyas índices globales.

### NoSQL cuando encaja el patrón de acceso

Almacenes de documentos, de columnas anchas o clave-valor ayudan en algunas cargas (muchas escrituras simples, documentos flexibles, búsquedas por clave). No son una mejora gratis si aún necesitas joins complejos y transacciones fuertes multi-fila.

Elige el almacén por cómo consultas los datos, no por moda.

---

## Juntando las capas

Un camino maduro suele verse así. Aun así, añades capas solo cuando un cuello de botella real lo pide.

```
Usuarios
  → DNS / enrutado geo
  → CDN (estáticos, algunos GET públicos)
  → Balanceador
  → Web / API sin estado
  → Caché
  → BD primaria + réplicas de lectura (luego shards)
  → Cola de mensajes → workers
  → Object storage para archivos grandes
```

Hábito de entrevista: **nombra el cuello de botella, propone la siguiente capa, di el trade-off, sigue.** No vuelques el diagrama final completo salvo que te lo pidan.

---

## Qué escuchan los entrevistadores

1. Escalas **lecturas y escrituras** de forma distinta.
2. Separás **cómputo y datos** lo bastante pronto.
3. Tratás **caché y CDN** como de primera clase, con invalidación y privacidad.
4. Haces la capa web **sin estado** antes del teatro multi-región.
5. Usas **colas asíncronas** para trabajo que puede esperar, con workers idempotentes.
6. Escalas la base de réplicas a partición por dominio a shards con los ojos abiertos sobre la consistencia.
7. Puedes decir **qué se rompe** en cada paso.

---

## Un orden práctico en producción

1. Mide: latencia, tasa de error, CPU de la base, conexiones, I/O de disco.
2. Arregla bugs obvios de app e índices faltantes antes de comprar arquitectura.
3. Separa capas, añade balanceador, crece web, añade réplicas de lectura.
4. Añade caché y CDN para rutas calientes y estáticas.
5. Externaliza sesiones y haz los despliegues aburridos.
6. Encola el trabajo pesado.
7. Multi-región y sharding cuando las métricas y el riesgo de negocio justifiquen la complejidad.

La arquitectura es un presupuesto. Gástalo donde el usuario siente el dolor.

---

## Explícaselo a un amigo

- Empieza como un restaurante de una sola persona: un ordenador corre el sitio y la base hasta que no da abasto.
- Separa cocina y almacén (app frente a base), luego contrata un policía de tráfico (balanceador) y más cocineros (servidores web).
- Deja que copias de la base respondan la mayoría de "muéstrame" (réplicas), y guarda un bloc de notas rápido (caché) más copisterías de barrio (CDN) para lo popular y lo estático.
- Haz que los servidores no recuerden el login solo en su memoria local (sin estado), y empuja tareas lentas (email, imágenes) a una fila de espera (cola).
- Solo cuando una base principal aún no puede escribir ni guardar lo bastante partes por dominio o por shard, y solo cuando los usuarios están en todo el mundo añades más regiones, siempre nombrando qué frescura o simplicidad cedes.