---
title: "Buenas prácticas de logging estructurado en servicios de producción"
description: "Logs JSON, IDs de correlación, niveles, redacción de PII y control de cardinalidad. Lo que mantiene rápidos los incidentes sin inflar la factura de logs."
date: "2026-07-03"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/structured-logging-best-practices.webp
previewImage: /assets/images/structured-logging-best-practices.webp
---


Los logs en texto plano servían cuando una máquina corría una app. Con muchos servicios, muchas réplicas y un shipper que convierte cada línea en un evento consultable, las cadenas libres se vuelven ruido caro. El logging estructurado arregla la forma: cada línea es un documento pequeño con claves estables. Buscas por campo, no con regex sobre prosa.

Esta es la lista que quiero en cada servicio de producción: JSON (o equivalente), IDs de correlación, niveles honestos, sin PII en crudo y reglas estrictas sobre campos de alta cardinalidad. Sin catálogo teórico. Los hábitos que bajan el tiempo medio hasta entender qué pasó.

---

## Por qué la estructura gana a los eslóganes

Una línea como `Error processing payment for user 42` se lee bien en una terminal. A las 3 a.m., con cinco microservicios y una dependencia inestable, necesitas:

* todos los eventos de **una petición** a través de los servicios
* filtros por `status_code`, `error_code`, `service`, `env` sin hacer grep de poesía
* dashboards y alertas que no se rompan cuando alguien reescribe un mensaje

El logging estructurado te da campos. El mensaje humano se queda, pero ya no es la única interfaz.

Forma típica (los nombres de campo varían por equipo; elige una convención y mantenla):

```json
{
  "ts": "2026-01-31T14:22:01.234Z",
  "level": "error",
  "msg": "payment capture failed",
  "service": "billing-api",
  "env": "prod",
  "version": "1.8.3",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "request_id": "req_8f3c2a",
  "user_id": "usr_9k2m",
  "order_id": "ord_441",
  "error_code": "GATEWAY_TIMEOUT",
  "duration_ms": 3201,
  "http": {
    "method": "POST",
    "path": "/v1/payments/capture",
    "status": 504
  }
}
```

Mismas claves en éxito y fallo. Mismo estilo de anidación. Así las consultas y las reglas de alerta son aburridas, que es el objetivo.

---

## Emite JSON (o un formato estable clave-valor)

**Prefiere una línea de log = un objeto JSON** en stdout/stderr. Deja que la plataforma (Fluent Bit, Vector, agente de CloudWatch, agente de Datadog, etc.) envíe e indexe. No inventes un formato multilínea custom salvo que tengas un motivo duro.

Reglas prácticas:

1. **Un evento por línea.** Los stack traces multilínea van en un solo campo string JSON (`stack`) o los une el shipper. Las líneas rotas a mitad de JSON son peso muerto.
2. **Timestamps ISO-8601 en UTC** (`ts` o `@timestamp`). La hora local en logs es cómo pierdes una hora en cada cambio de horario.
3. **Esquema estable para campos core.** `level`, `msg`, `service`, `env`, `version`, IDs de correlación. Añade campos de dominio al lado, no con nombres top-level aleatorios cada sprint.
4. **Librerías, no `print`.** Usa `structlog`, `zap`, `slog`, `pino`, el encoder JSON de `logback`, o lo que sea estándar en el stack. Configura una vez al arrancar el proceso.

Boceto mínimo en Python con ideas de `structlog` (cualquier librería con la misma idea sirve):

```python
import logging
import structlog

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)

log = structlog.get_logger()
log.info("order_created", order_id=order.id, amount_cents=amount)
```

Node con `pino` es el mismo contrato: objetos dentro, JSON fuera, child loggers para el contexto de la petición.

**Evita** la interpolación de strings como registro principal:

```python
# Mal: solo un string; difícil de filtrar con seguridad
logger.info(f"order {order_id} created for {email}")

# Mejor: mensaje + campos
logger.info("order_created", order_id=order_id, user_id=user_id)
```

Mantén `msg` corto y estable (`order_created`, `payment_capture_failed`). Pon las variables en campos. Así la cardinalidad del *mensaje* se mantiene baja y sigues teniendo dimensiones para consultar.

---

## IDs de correlación: sigue una petición a través del mesh

Cuando el servicio A llama a B y B llama a C, los logs sueltos en cada host no cuentan una historia. Necesitas un ID que viaje con la petición.

Dos patrones habituales (a menudo ambos):

| ID | Rol |
| --- | --- |
| **`trace_id` / `span_id`** | OpenTelemetry / tracing distribuido. Mejor si ya tienes traces. |
| **`request_id` / `correlation_id`** | UUID a nivel app en el borde (API gateway o primer servicio) y se pasa en cada hop. |

Cómo funciona en la práctica:

1. El borde (o el primer servicio) lee `X-Request-Id` / `traceparent`. Si falta, genera un UUID.
2. Mete ese ID en el **contexto de logging** de la petición (context var, MDC, child logger del middleware).
3. Propaga el mismo header (y `traceparent` W3C si usas OTel) en HTTP/gRPC/colas de salida.
4. Cada línea de log en esa petición incluye los IDs sola. Los call sites no deberían pasarlos a mano cada vez.

```python
# Pseudo-código de middleware
request_id = request.headers.get("x-request-id") or str(uuid4())
structlog.contextvars.clear_contextvars()
structlog.contextvars.bind_contextvars(
    request_id=request_id,
    trace_id=extract_trace_id(request),
)
# Todos los logs de esta petición ya llevan request_id / trace_id
```

**Workers de colas y crons** necesitan la misma disciplina. En trabajo async, pon `request_id` / `trace_id` en el payload o headers al encolar. En crons, genera un `job_run_id` al empezar y bindealo para la ejecución.

Si solo haces una cosa este trimestre: **IDs de correlación de extremo a extremo**. El resto es agradable; esto cambia la respuesta a incidentes.

---

## Niveles de log que significan algo

Los niveles solo ayudan si el equipo acuerda qué significan. Un default útil para servicios:

| Nivel | Úsalo para |
| --- | --- |
| **ERROR** | La petición o el job falló de forma que necesita atención. Operador o on-call puede actuar. |
| **WARN** | Degradado pero recuperado o recuperable: reintento OK, fallback usado, cerca del límite. |
| **INFO** | Hitos de negocio: petición completada, job terminado, config cargada. |
| **DEBUG** | Detalle para local o diagnóstico temporal en prod. Apagado por defecto en prod (o muestreado). |

Reglas que evitan fatiga de alertas:

* **No loguees ERROR por errores de cliente esperados** (validación 400, auth 401 por tokens malos). Usa INFO o WARN con `status` y `error_code`. ERROR es para cuando *tu* sistema falla o un upstream rompe la petición cuando no debería.
* **Un ERROR por camino de fallo**, no uno por cada reintento más el final. Los reintentos pueden ser DEBUG/WARN; el fallo terminal es ERROR.
* **INFO no debe inundar.** Prefiere un log de completado por petición con `duration_ms` y `status` en lugar de ruido "start", "mid", "end". Servicios de alto QPS a menudo muestrean INFO o confían en métricas para el volumen y logs para fallos + muestra de éxitos.
* **DEBUG en prod** solo detrás de un flag, un header o un cambio de config de corta duración. Dejar DEBUG en un path charlatán es cómo quemas el presupuesto de logs en una tarde.

Mapea con cuidado los niveles de librerías. Algunos frameworks tratan "warn" por defecto para deprecaciones. Ajústalos para que los dashboards coincidan con la expectativa humana.

---

## PII y secretos: nunca el valor en crudo

Los logs sobreviven a la petición. Acaban en SaaS de terceros, cold storage, herramientas de soporte y exports al portátil. Trátalos como un **almacén de datos con control de acceso flojo** hasta demostrar lo contrario.

**Nunca loguees:**

* contraseñas, API keys, tokens, cookies de sesión, headers Authorization
* números de tarjeta completos, CVV, cuentas bancarias
* DNI/pasaporte, historiales de salud completos donde aplique la regulación
* bodies request/response en crudo que puedan contener lo anterior

**Suele redactarse o tokenizarse:**

* email, teléfono, nombre completo (prefiere `user_id` como clave de join)
* IP (según política; a menudo hash o truncada)
* dirección postal, geo precisa

Patrones que funcionan:

```python
# Prefiere IDs opacos estables
log.info("login_ok", user_id=user.id)

# Si debes incluir un email para soporte, hashea o enmascara en parte
log.info("invite_sent", email_domain=email.split("@")[-1])  # o hmac_sha256(email, pepper)
```

Defensa en profundidad:

1. **Allowlist de campos** en el límite del logger para bodies y headers HTTP. Deny por defecto.
2. **Middleware de redacción** en nombres de header habituales (`authorization`, `cookie`, `x-api-key`).
3. **Checklist de code review**: líneas nuevas con `payload`, `body`, `headers` o perfil de usuario merecen una segunda mirada.
4. **Retención y acceso**: retención más corta en índices muy de debug; roles restringidos para buscar en prod.

Una fuga en logs sigue siendo una fuga. "Solo guardamos logs 7 días" no arregla un secreto indexado y copiado.

---

## Cardinalidad: el coste silencioso

La cardinalidad es cuántos valores únicos puede tomar un campo. Las plataformas de logs suelen cobrar por volumen e indexar o facetar campos. Campos de alta cardinalidad explotan el coste y matan el rendimiento de las consultas.

| Campo | Cardinalidad | Notas |
| --- | --- | --- |
| `env`, `service`, `level`, `http.method` | Baja | Facetas seguras |
| `http.status`, `error_code`, `region` | Baja-media | Suele ir bien |
| `user_id`, `order_id`, `request_id` | Alta | Bien para búsqueda; evita como labels de métricas |
| `msg` con IDs interpolados | Extrema | `payment failed for order 123` × millones |
| URL completa con query string | Extrema | Plantilla de path: `/users/{id}` |

Reglas:

1. **Valores de `msg` estables.** Usa `payment_capture_failed`, no `payment capture failed for order {id}`. El id va en `order_id`.
2. **Plantillas de path, no URLs crudas.** El middleware debe normalizar `/users/42` a `/users/:id` (o el patrón de ruta del framework) en el campo que grafiques. Guarda el path crudo en otro campo solo si aceptas el coste.
3. **No conviertas cada campo de log en label de métrica.** Las métricas quieren dimensiones de baja cardinalidad. Los logs pueden llevar `user_id` para buscar por id; las labels de Prometheus no.
4. **Acota strings sin límite.** Trunca mensajes de excepción y bodies de error de terceros (p. ej. 2 KB). Una página HTML de error de 2 MB en un campo de log es un outage autoinfligido del shipper.
5. **Muestrea paths calientes.** Health checks cada segundo desde cada réplica: descarta o muestrea con agresividad. Igual con GET exitosos en un endpoint de mucha lectura si las métricas ya cubren el tráfico.

Los errores de cardinalidad aparecen como "la factura de logs se duplicó tras un logging mejor". Mejor logging no es más strings únicos. Son mejores campos.

---

## Qué poner en el log de fin de petición

Una línea sólida INFO (o DEBUG si muestreás) al final de la petición gana a cinco líneas a medias:

* `request_id` / `trace_id`
* `http.method`, plantilla de ruta, `http.status`
* `duration_ms`
* `user_id` o sujeto de auth si aplica (id opaco)
* `error_code` cuando status >= 400
* quizá `bytes_out`, `db_queries` o feature flags cuando sean hooks de debug habituales

Los errores llevan una segunda línea o la misma a ERROR con `error.type`, `error.message` (sanitizado) y `stack` opcional.

Llamadas de salida: loguea nombre del **client**, servicio destino, status, duración e IDs de correlación. Así ves qué dependencia se comió el presupuesto de latencia sin abrir tres repos.

---

## Binding de contexto gana a la sopa de parámetros

El contexto por hilo o por petición deja los call sites limpios:

```
inicio petición -> bind request_id, user_id, route
   código de servicio -> log.info("inventory_reserved", sku=sku, qty=qty)
   ...
fin petición -> log de completado; clear context
```

Sin binding, cada helper omite campos de correlación o arrastra un `log_ctx` para siempre. Limpia el contexto al final de la petición para que hilos de worker o tareas async no filtren IDs al siguiente job.

---

## Alinea logs con métricas y traces

Los logs responden "qué pasó para este id". Las métricas responden "con qué frecuencia / qué tan lento". Los traces responden "dónde se fue el tiempo entre servicios".

* Prefiere **métricas** para rate, latencia, saturación (RED/USE). No inventes una línea de log solo para contarla después.
* Prefiere **traces** para latencia multi-hop. Los logs deben llevar `trace_id` para saltar de un hit de log a la UI de traces.
* Prefiere **logs** para eventos raros, detalle de error y hechos tipo auditoría que necesitan contexto de payload (siempre redactado).

Si tu única señal son logs, cada pregunta se vuelve full-text search. Funciona hasta que deja de funcionar.

---

## Checklist corto de producción

Úsalo en code review o en la plantilla de un servicio nuevo:

1. **JSON (o equivalente) en stdout**, un evento por línea, timestamps UTC.
2. **Campos core** en cada línea: `service`, `env`, `version`, `level`, `msg`.
3. **Correlación**: `request_id` y/o contexto de trace W3C / OTel en cada hop, incluidas colas.
4. **Niveles**: ERROR para fallos de sistema accionables; no para 4xx rutinarios.
5. **Sin secretos ni PII en crudo**; prefiere ids opacos; redacta headers y bodies por defecto.
6. **Mensajes y rutas de baja cardinalidad**; alta cardinalidad solo como campos de búsqueda, no como labels de métricas.
7. **Log de completado** con status y duración; muestrea éxitos en paths calientes si el volumen duele.
8. **Librería configurada una vez**; sin `print` ad hoc ni logging solo-string en código nuevo.
9. **Retención y acceso** documentados; los índices de debug no son un data lake gratis.

---

## Modos de fallo habituales

| Síntoma | Causa probable |
| --- | --- |
| No se puede unir una queja de usuario entre servicios | Headers de correlación ausentes o caídos |
| La factura de logs sube tras un cambio "pequeño" | DEBUG dejado encendido, health checks logueados o `msg` interpolado |
| Las alertas disparan por typos de usuario | 4xx logueados como ERROR |
| Security encuentra tokens en ELK | Logging de body/header sin allowlist |
| Las queries timeout en facetas de `user_id` | Campo de alta cardinalidad como índice/faceta por defecto |
| Stack traces partidos en líneas rompen el JSON | Salida multilínea sin stack en un solo campo |

Ninguno de estos necesita un vendor nuevo. Necesitan convenciones y unas líneas de middleware.

---

## Cierre

El logging estructurado no es un debate de formato. Es un contrato de operaciones: cada servicio habla el mismo lenguaje de campos, lleva IDs a través de los límites, se niega a volcar secretos y mantiene la cardinalidad bajo control para que la búsqueda sea rápida y la factura aburrida.

Empieza con JSON + IDs de correlación + política de niveles + redacción. Añade sampling avanzado y schema registries cuando lo básico aguante bajo carga. En el próximo incidente quieres una query por `request_id`, no cinco greps y una esperanza.

