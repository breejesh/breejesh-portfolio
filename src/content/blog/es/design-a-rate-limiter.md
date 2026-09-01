---
title: "Diseñar un limitador de tasa: algoritmos, patrones Redis y la realidad del gateway"
description: "Rate limiting para principiantes absolutos: analogía del portero del club, por qué existen los límites, token bucket y sliding window en lenguaje claro, Redis como cuaderno compartido, y una petición de principio a fin."
date: "2026-04-10"
tags: [Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/design-a-rate-limiter.webp
previewImage: /assets/images/design-a-rate-limiter.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Rate limiting para principiantes absolutos: analogía del portero del club, por qué existen los límites, token bucket y sliding window en lenguaje claro, Redis como cuaderno compartido, y una petición de principio a fin.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Imagina un club lleno un sábado por la noche. Un portero en la puerta tiene un trabajo simple: dejar entrar gente al ritmo que el local aguanta. Demasiados a la vez y fallan la barra, los baños y las salidas. Demasiado estricto y los invitados honestos se van enfadados. Un **limitador de tasa** (rate limiter) es ese portero para tu API. Cada petición se acerca y pregunta: "¿puedo entrar ahora?" El limitador dice sí, espera, o no.

Este post enseña rate limiting como un profesor paciente: primero las razones humanas, luego los dos algoritmos que de verdad vas a ver, luego la trampa de varios servidores, y al final el recorrido completo de una sola petición. No necesitas experiencia en sistemas distribuidos. Necesitas curiosidad y ganas de pensar unos minutos en tickets y cubos de agua.

---

## Por qué existen los límites (en términos humanos)

Sin portero, aparecen tres dolores muy rápido.

**Justicia.** Una persona que martillea el botón de actualizar puede comerse toda la sala. El resto espera. Los límites dan a cada invitado (usuario, IP, API key) un presupuesto para que un vecino ruidoso no deje sin cupo a los demás.

**Coste.** Cada petición cuesta algo: CPU, tiempo de base de datos, dinero a un SMS o API de IA de terceros. Tráfico gratis ilimitado es factura gratis ilimitada. Los límites mantienen los planes free y hacen honestos los de pago.

**Abuso.** Los bots prueban contraseñas, raspan tu catálogo o spamean registros. Un límite no detiene para siempre a un atacante decidido, pero frena los ataques baratos lo bastante para que logs, CAPTCHA y el equipo de seguridad respiren.

Lenguaje de producto que ya conoces:

- Plan free: 100 llamadas a la API al día.
- Login: unos intentos y luego enfriamiento.
- API del tiempo: 60 peticiones por minuto por clave.

La misma idea en todas partes: **un presupuesto de acciones en el tiempo**.

---

## Qué estás contando

Antes de elegir algoritmo, decide **a quién** limitas y **qué** significa un "ticket".

| Cuentas por... | Significado en la vida real | Cuándo se tuerce |
| --- | --- | --- |
| Dirección IP | "Esta red del teléfono" | Mucha gente comparte una IP (oficina, operador móvil) |
| User id | "Esta persona con sesión" | Cuentas bot compartidas o usuarios de servicio olvidados |
| API key | "Esta app partner" | Una clave usada desde muchos sitios a la vez |
| Tenant + ruta | "Esta empresa en este endpoint caro" | Una función caliente quema el cupo de toda la empresa |
| Todos juntos | "Proteger la cocina compartida" | Un tenant ruidoso hace daño a la plataforma |

Un buen limitador responde tres cosas:

1. **Permitir o denegar** (sí o no ahora).
2. **Cuánto esperar** si se deniega (guía tipo `Retry-After`).
3. **Cuánto presupuesto queda** para que el cliente frene con educación.

El estado HTTP **429** significa "demasiadas peticiones". Piensa en el "aún no" educado del portero.

---

## Dos modelos mentales que te van a acompañar

Entrevistas y producción giran en torno a dos ideas. Apréndelas con imágenes en la cabeza, no solo con fórmulas.

### 1. Token bucket = una jarra de tickets

Imagina una jarra en el mostrador. Puede guardar **B** tickets (la capacidad). Cada segundo (o minuto), el club echa **R** tickets nuevos en la jarra (la tasa de relleno). Cuando llegas, necesitas un ticket. Si la jarra tiene uno, lo tomas y entras. Si está vacía, esperas.

Sensaciones importantes:

- Si el club está tranquilo, los tickets se acumulan hasta llenar la jarra. Entonces puedes dejar entrar una **ráfaga** corta (hasta B personas de golpe).
- Tras la ráfaga, la jarra está vacía. Los nuevos solo entran tan rápido como se rellenan los tickets (tasa R).
- Tamaño de ráfaga y velocidad a largo plazo son mandos distintos. A producto le encanta: "permitir un pico corto, nunca más de R para siempre."

Eso es el **token bucket**. Los tokens son tickets. La capacidad es cuántos tickets de reserva guardas. La tasa es lo rápido que fabricas nuevos.

### 2. Sliding window = una franja de tiempo que rueda

Imagina un mostrador de tickets que solo mira los **últimos 60 segundos**, no "este minuto del reloj." Una ventana de cristal rueda sobre la línea de tiempo. Cuentas cuánta gente entró bajo ese cristal. Si el conteo está bajo el límite, la siguiente persona recibe sello. Si no, espera hasta que sellos viejos salgan de la ventana.

Dos sabores habituales:

**Sliding window log (exacto, caro):** anotas cada marca de tiempo de entrada. Con cada persona nueva, borras sellos de más de 60 segundos y cuentas el resto. Perfectamente justo. Pesado si te golpean millones, porque cada petición escribe y limpia.

**Sliding window counter (suficiente, práctico):** en lugar de cada sello, dos cubos aproximados: "minuto anterior" y "minuto actual." Los mezclas según lo avanzado que estés en el minuto actual. Casi tan suave como el log, con dos números en vez de una lista larga.

**Fixed window** es el primo ingenuo: "solo 100 por minuto de calendario." A las 12:00:59 alguien usa 100. A las 12:01:00 el contador se reinicia y usa otros 100. En dos segundos usó 200. Los límites blandos lo toleran. Los SLA duros a menudo no.

| Idea | Imagen cotidiana | Sensación de ráfaga | Coste de memoria |
| --- | --- | --- | --- |
| Fixed window | Reiniciar el clicker cada minuto en punto | Picos en los bordes | Mínimo (un contador) |
| Sliding log | Lista exacta de invitados de los últimos 60s | Suave y justa | Grande |
| Sliding counter | Mezcla aproximada de dos minutos | Casi suave | Mínimo (dos contadores) |
| Token bucket | Jarra de tickets que se rellena despacio | Ráfagas controladas | Mínimo |
| Leaky bucket | Fregadero que drena a gotas fijas | Salida suave | Cola o contador |

**Leaky bucket** (imagen extra): la gente hace cola y la puerta deja pasar a uno cada tick fijo, como un fregadero que drena a ritmo constante. La salida es suave. Cuando la cola está llena, los nuevos se van. Útil cuando lo que proteges necesita llegada estable más que picos cortos.

Para la mayoría de APIs, el punto dulce es **token bucket** o **sliding window counter**.

---

## Token bucket en la forma de código más simple

Un proceso, un reloj, aún sin Redis. La jarra en código:

```python
import time

class TokenBucket:
    def __init__(self, rate: float, capacity: float):
        self.rate = rate          # tickets añadidos por segundo
        self.capacity = capacity  # máximo de tickets en la jarra
        self.tokens = capacity
        self.updated_at = time.monotonic()

    def allow(self, cost: float = 1.0) -> bool:
        now = time.monotonic()
        elapsed = now - self.updated_at
        # rellenar según el tiempo pasado, nunca por encima de capacity
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.updated_at = now
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False
```

Lo que un profesor cuidadoso subrayaría:

- Prefiere un **reloj estable** (monotónico) para el relleno, así un salto del reloj del portátil no inventa tickets gratis.
- **Cost** puede ser más de 1. Una ruta cara "exportar todos los datos" puede costar 10 tickets; un health check barato, 1 o incluso 0.
- Un proceso vale para demos. Muchos servidores necesitan una jarra **compartida**, o cada servidor es su propio portero con presupuesto completo.

---

## Muchos servidores: cuadernos privados vs un cuaderno compartido

La trampa multi-servidor en lenguaje claro.

Tienes **20** copias de tu API detrás de un balanceador. Cada copia guarda un cuaderno privado: "este usuario usó 5 de 100." El usuario puede golpear las 20. Si el tráfico se reparte, obtiene de hecho unos **20 × 100** antes de oír un no. Tu límite anunciado se volvió ficción.

| Enfoque | Imagen | Qué pasa de verdad |
| --- | --- | --- |
| Límite solo en memoria de la app | Cada portero con cuaderno privado | El presupuesto se multiplica por el número de servidores |
| Solo sticky sessions | "Siempre a la misma puerta" | Reintentos y redes móviles rompen la pegajosidad |
| Almacén compartido (suele ser Redis) | Un cuaderno que todos leen y escriben | El límite real es aproximadamente el límite real |

**Redis** es el cuaderno compartido favorito de muchos equipos: muy rápido, bueno con contadores y hashes pequeños, scripts que actualizan una clave sin que dos apps se pisen.

### Patrones que la gente llega a desplegar

**Página de fixed window en el cuaderno**

```
key = rl:{apiKey}:{yyyyMMddHHmm}
count = INCR key
if count == 1: EXPIRE key 120
if count > limit: DENY
```

Barato y simple. Acepta picos en el borde si el producto puede vivir con ellos.

**Token bucket en un hash compartido**

Guardas `tokens` y `last_refill_time` en una clave Redis. En cada petición, un pequeño **script Lua** (un paso atómico en Redis) rellena según el tiempo, gasta un token si puede, escribe el saldo y devuelve allow/deny y tickets restantes. Sin actualización atómica, dos servidores pueden leer "queda 1," ambos permiten, y sobrevender el último ticket.

**Sliding log como sorted set**

Guardas timestamps, borras los viejos, cuentas y añades el nuevo sello. Exacto, pero memoria y CPU crecen con el tráfico. Con alto QPS a menudo es el primer patrón del que te arrepientes.

**Sliding counter con dos páginas**

Claves para "esta ventana" y "la anterior," mezcladas con un peso. Casi toda la suavidad, poca del coste.

### Fail-open vs fail-closed (cuando falta el cuaderno)

Si Redis cae, aún necesitas una política:

- **Fail open:** deja pasar el tráfico (quizá con un tope local de emergencia). Muchas apps de consumo lo eligen para que el dolor de Redis no sea outage total.
- **Fail closed:** rechaza. Pagos y login suelen elegirlo para que el caos no signifique intentos ilimitados gratis.

Ninguno es gratis. Elige a propósito por superficie y alarma errores de Redis en ambos casos.

### Los relojes mienten si se lo permites

Si cada servidor de app usa su propio reloj de pared para "en qué minuto estoy," dos servidores pueden discrepar un momento. Patrón más seguro: **tiempo del servidor Redis** dentro del script para relleno e id de ventana. En demos locales, reloj monotónico. Nunca confíes en un timestamp que inventa el cliente.

---

## Recorre una petición de API por el limitador

Conoce a **Priya**. Tiene sesión. Su plan free permite **100 peticiones por minuto**, con una ráfaga corta de **20**. El sistema tiene muchos pods de API y un cuaderno Redis.

1. **El cliente envía la petición**  
   El navegador o la app móvil llama `GET /api/weather?city=Pune` con la cookie de sesión de Priya (o su API key).

2. **El balanceador elige un pod**  
   Cualquier servidor sano puede atenderla. Está bien, porque el conteo no vivirá solo en la memoria de ese pod.

3. **Auth primero (casi siempre)**  
   La app verifica que es Priya. La clave de rate pasa a ser algo como `rl:user:priya123`, no solo su IP. (Aún puedes tener un límite por IP para bots que no inician sesión.)

4. **Chequeo del limitador (el portero)**  
   La app (o un plugin del gateway) llama a Redis con la clave, la regla (token bucket: capacity 20, relleno unos 100/60 por segundo) y cost 1. El script Lua:
   - lee tokens actuales y último relleno,
   - suma tickets por el tiempo pasado (tope en capacity),
   - si tokens ≥ 1, resta 1 y permite,
   - si no, deniega y calcula un pequeño retraso de reintento.

5. **Camino de allow**  
   La petición sigue a la lógica de negocio, quizá al servicio del tiempo, y devuelve 200. Las cabeceras pueden decir cuántos tickets quedan para que su SDK frene antes del siguiente deny.

6. **Camino de deny**  
   La petición no quema trabajo caro. El cliente recibe **429**, una pista `Retry-After` y remaining = 0. Los clientes honestos esperan. Los abusivos siguen frenados por el cuaderno compartido en todos los pods.

7. **Observabilidad**  
   Las métricas cuentan allows y denys. Si los denys se disparan para una clave, on-call pregunta "¿es un outage real, un límite de producto demasiado tenso, o un cliente ruidoso?" antes de "arreglarlo" subiendo el número a ciegas.

Toda esa historia es el system design de un rate limiter: **política + algoritmo + almacén compartido + feedback claro al cliente**.

---

## Dónde se para el portero (realidad del gateway)

Puedes colocar límites en más de un sitio. Muchos equipos usan capas, como la seguridad del club en la calle, en la puerta y en la zona VIP.

| Ubicación | Fortaleza | Debilidad |
| --- | --- | --- |
| CDN / edge | Para basura pronto | Claves gruesas; poco contexto de negocio |
| API gateway | Planes por clave, 429 listo | "Este body cuesta 5" se complica |
| Service mesh (Envoy) | Límites locales por ruta | Solo local implica otra vez N × límite |
| Middleware de app | Sabe usuario y plan de producto | Fácil olvidarlo en un servicio nuevo |
| Librería por servicio | Rápido para un equipo | Drift entre lenguajes |

Regla práctica: **límites gruesos por IP en el edge**, **límites de usuario o plan tras el auth**, **extra en mutaciones caras** (reset de contraseña, export masivo). El gateway no elimina límites de app. Evita que cada servicio junior reinvente la matemática de tickets el día uno.

Pila jerárquica de ejemplo:

1. Por IP (abuso)
2. Por usuario (justicia)
3. Por ruta de tenant (producto)
4. Circuito global sobre una dependencia frágil

Deniega si **cualquier** capa dice no. Chequea primero las capas baratas cuando puedas.

---

## Un diseño que puedes defender en entrevista

**Aclara primero:**

- 100 peticiones por usuario por minuto, ráfaga 20.
- Funciona con 20 instancias de app.
- Preferir baja latencia; overshoot leve OK si Redis titubea.
- Devolver 429 con guía de reintento.

**Propón:**

1. Clave: `rl:user:{userId}` (hash-tagged si Redis Cluster).
2. Algoritmo: token bucket, capacity 20, relleno 100/60 tokens por segundo.
3. Storage: Redis primary, Lua atómico, tiempo de Redis para el relleno.
4. Ubicación: gateway para IP gruesa; app (o plugin del gateway hacia Redis) para cuotas de usuario tras auth.
5. Fallo: fail-open local corto con tope local duro; alarma en errores de Redis.
6. Observabilidad: contadores allow/deny, histograma de remaining, top de claves denegadas.

**Di los trade-offs en voz alta:**

- Fixed window es simple pero con ráfagas en el borde.
- Sliding log es exacto pero pesado.
- Token bucket encaja con el lenguaje de producto (ráfaga + sostenido).
- Exactitud global perfecta bajo split de red es cara; aproximar con un modo de fallo elegido es ingeniería normal.

---

## Checklist de producción

- [ ] Las claves incluyen usuario/tenant/ruta, no solo IP
- [ ] Camino de update atómico (Lua o equivalente), sin carreras read-then-write ingenuas
- [ ] Hash tags de Cluster si hay scripts multi-clave
- [ ] Fuente de reloj compartida o monotónica
- [ ] 429 + Retry-After + cabeceras remaining documentados
- [ ] Fail-open o fail-closed elegido por superficie
- [ ] Load test con N instancias y una hot key
- [ ] Dashboards de tasa de deny y errores de Redis
- [ ] Límites separados para login, reset de password y mutaciones caras
- [ ] Runbooks de "subir límite" vs "encontrar al cliente ruidoso"

---

## Recap para un amigo

Un rate limiter es un **portero para tu API**. Existe para que un invitado no se coma la sala (**justicia**), para que la factura de la nube no explote (**coste**), y para que los bots no te martilleen gratis (**abuso**).

Dos imágenes se quedan:

1. **Token bucket:** una jarra de tickets que se rellena despacio. Una fila corta puede entrar si hay tickets ahorrados. A largo plazo nunca vas más rápido que la tasa de relleno.
2. **Sliding window:** solo cuentas lo de la última franja de tiempo mientras la ventana rueda. Las listas exactas de invitados son justas pero pesadas; dos contadores mezclados suelen bastar.

Muchos servidores con **cuaderno privado** multiplican en silencio tu límite. Un **cuaderno compartido** (a menudo Redis) mantiene el presupuesto real. Recorre una petición: cliente → balanceador → auth → chequeo compartido → allow al trabajo real o 429 con "inténtalo luego."

Si te quedas con una lección de producción: **los contadores compartidos ganan a la matemática local ingeniosa**, y **los relojes mienten** si no obligas una sola fuente de tiempo. Empieza con token bucket o sliding window counter en Redis, pon límites gruesos en el edge, deja las cuotas de producto junto al auth, y mide los denys antes de "arreglarlos" subiendo el número.

