---
title: "Type hints de Python que de verdad rinden en producción"
description: "Qué tipado de Python atrapa bugs reales: Protocols, TypedDict, mypy y pyright graduales. Qué tipar primero, qué omitir y cómo mantener el CI útil."
date: "2026-06-30"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/python-type-hints-production.webp
previewImage: /assets/images/python-type-hints-production.webp
---

Los type hints de Python son gratis en runtime y caros cuando mienten. Los equipos que sacan valor no anotan cada helper privado. Tipan las **costuras**: APIs públicas, formatos de red, objetos de dominio compartidos y límites de plugins. El resto puede seguir suelto hasta que un bug o un refactor obligue a decidir.

Esta es una guía de campo. No un catálogo de todo `typing`, ni un concurso de pureza entre checkers. El objetivo es menos sorpresas en producción con un presupuesto que puedas defender en code review.

---

## Qué significa que "renda"

Un hint rinde cuando hace al menos una de estas cosas:

1. **Detiene una clase real de bug** antes del merge (clave mala en un dict de JSON, atributo ausente tras un rename, `None` donde hace falta un string).
2. **Hace seguros los refactors** entre módulos que no caben en la cabeza.
3. **Documenta contratos** que los tests solos no dejan claros (forma del body, métodos que un backend de almacenamiento debe implementar).
4. **Cuesta poco mantener** cuando el código cambia.

Si la anotación solo contenta al checker, o necesita un `cast` cada semana, es deuda con badge verde en CI.

---

## Empieza en los bordes, no en el centro

Con cero tipos, anotar utilidades al azar es el camino más lento. Orden que funciona:

1. **Funciones y métodos públicos** que cruzan límites de paquete.
2. **Datos que cruzan procesos**: bodies HTTP, mensajes de cola, config, filas ORM tratadas como dicts.
3. **Interfaces** entre componentes que intercambias o mockeas (storage, clientes de pago, feature flags).
4. **Solo después** el interior, cuando los bordes sean honestos.

Un servicio con tipos perfectos en helpers privados y `dict[str, Any]` en cada handler de FastAPI está tipado donde menos duele.

```python
# Borde: request entra, dominio sale
def create_invoice(payload: CreateInvoiceRequest, user_id: str) -> Invoice:
    ...
```

Los tipos de retorno importan tanto como los parámetros. Los callers se equivocan más con lo que devuelves que con lo que pasas.

---

## TypedDict: JSON y config sin una capa de modelos completa

Pydantic y dataclasses van bien cuando controlas el modelo. Mucho código de producción sigue pasando dicts planos de `json.loads`, Redis o un SDK. Ahí **`TypedDict`** se gana el sueldo.

```python
from typing import TypedDict, NotRequired

class UserEvent(TypedDict):
    user_id: str
    event: str
    ts: int
    meta: NotRequired[dict[str, str]]

def handle_event(event: UserEvent) -> None:
    user_id = event["user_id"]  # el checker sabe que la clave existe
    ...
```

Por qué rinde:

* Renombrar `user_id` a `account_id` falla en cada call site en CI, no en un log silencioso a las 3 a.m.
* Los campos opcionales quedan explícitos con `NotRequired` (o `total=False` en estilos viejos).
* No obligas una jerarquía de clases a un adaptador fino.

**Omite TypedDict** cuando la forma es realmente abierta (webhooks de vendor que solo guardas), o cuando ya validas con una librería de esquemas que genera tipos. Modelar dos veces el mismo payload es relleno.

Para JSON anidado, varios TypedDict pequeños superan un mega-dict con diez claves opcionales y un rezo.

---

## Protocol: duck typing que aún comprueba

La fuerza de Python es el tipado estructural. **`Protocol`** (PEP 544) mantiene ese estilo sin clases base que solo importan al checker.

```python
from typing import Protocol

class SupportsClose(Protocol):
    def close(self) -> None: ...

class UserStore(Protocol):
    def get(self, user_id: str) -> User | None: ...
    def save(self, user: User) -> None: ...

def shutdown(resource: SupportsClose) -> None:
    resource.close()
```

Cualquier objeto con un `close()` compatible sirve. Sin registro de ABC, sin dependencia compartida solo por tipos.

Dónde brillan en producción:

* **Puertos y adaptadores**: defines `UserStore`, inyectas Postgres en prod y un fake en tests.
* **APIs amables con librerías**: aceptas "cualquier cosa file-like" en lugar de una clase concreta.
* **Extracción incremental**: documentas los métodos que de verdad llamas antes de sacar una interfaz.

**Omite Protocols** para clases internas de un solo uso con una sola implementación. Una clase concreta es más clara. Evita Protocols de veinte métodos "por completitud." Tipa lo que los callers usan.

```python
# Bien: pequeño y real
class Clock(Protocol):
    def now(self) -> datetime: ...

# Ruido: interfaz dios que nadie implementa del todo
class EverythingService(Protocol):
    ...
```

---

## Unions, Optional y `| None` (los bugs que de verdad envías)

La mayoría de victorias son aburridas: una función devuelve `User | None`, el caller olvida el check, el checker grita.

```python
def find_user(user_id: str) -> User | None:
    ...

user = find_user(uid)
# name = user.name          # error: Item "None" has no attribute "name"
if user is None:
    raise LookupError(uid)
name = user.name            # narrowed; seguro
```

Prefiere `X | None` explícito a devolver objetos vacíos que fingen éxito. Prefiere lanzar en errores de programador y `None` (o `Result`) para ausencia esperada. Un estilo por codebase.

Un `Union` de cinco tipos no relacionados suele ser un olor de diseño. Si una función devuelve `User | Order | str | int`, parte la API.

---

## Genéricos donde los contenedores compartidos lo merecen

Los genéricos rinden en **contenedores y repositorios reutilizables**, no en cada variable local.

```python
from typing import TypeVar, Generic

T = TypeVar("T")

class Repository(Generic[T]):
    def get(self, id: str) -> T | None: ...
    def add(self, item: T) -> None: ...

class UserRepository(Repository[User]):
    ...
```

O, con sintaxis moderna y un checker que la soporte:

```python
def first[T](items: list[T]) -> T | None:
    return items[0] if items else None
```

**Omite grafos genéricos profundos** (`Repo[T, ID, Filter, Page]`) hasta sentir dolor real. Los TypeVar con bounds complejos son un sitio habitual donde un equipo quema una semana y sigue enviando los mismos bugs con firmas más bonitas.

---

## mypy y pyright: que la herramienta sirva al equipo

No necesitas una guerra santa. Necesitas **un checker en CI** con una config que el equipo pueda explicar.

Setup práctico:

1. **Elige un checker principal** para CI (pyright/Pylance es común con VS Code; mypy en monorepos Django/Flask viejos). El editor local puede alinearse con CI.
2. **Empieza gradual**. `strict = true` en un legado de un millón de líneas mata la iniciativa.
3. **Aprieta por paquete**. Dominio y APIs públicas primero. Scripts y notebooks sueltos.
4. **Falla el build en errores de módulos tipados**, no en todo el universo de stubs de terceros el día uno.

Forma de `pyrightconfig.json` para un despliegue gradual:

```json
{
  "include": ["src"],
  "exclude": ["**/migrations", "**/scripts"],
  "typeCheckingMode": "basic",
  "reportMissingImports": true,
  "reportOptionalMemberAccess": true
}
```

Ejemplo de mypy hacia honestidad sin big bang:

```ini
[mypy]
python_version = 3.12
warn_return_any = True
warn_unused_ignores = True
check_untyped_defs = True

[mypy-src.legacy.*]
ignore_errors = True
```

### Qué exigir del checker

* Atrapar errores de **atributo y None** en tu código.
* Atrapar **claves TypedDict incorrectas** y desajustes de Protocol.
* Mostrar **ignores sin uso** para que `# type: ignore` no sea papel tapiz permanente.

### Qué no idolatrar

* Cobertura perfecta de terceros. Usa stubs cuando ayuden; envuelve SDKs ruidosos detrás de una fachada tipada fina.
* Cero `Any`. Unos `Any` honestos en el borde del sistema superan cincuenta tipos "precisos" falsos.
* Ganar el debate de qué checker es "más correcto" mientras producción sigue enviando `dict` por todas partes.

---

## `cast`, `Any` y `# type: ignore` (las salidas de emergencia)

Existen por una razón. Patrones de abuso:

```python
# Mal: silenciar en lugar de modelar
user = cast(User, raw_json)          # desarrollo basado en esperanza
data: Any = fetch()                  # el contagio llega a los callers
result = thing.method()  # type: ignore[attr-defined]
```

Mejores patrones:

```python
def parse_user(raw: dict[str, object]) -> User:
    # validar una vez en el borde
    return User(
        id=str(raw["id"]),
        email=str(raw["email"]),
    )
```

Reglas que se sostienen:

* **`cast`**: raro, local, y preferible junto a un check en runtime o un comentario de por qué el checker no ve la verdad.
* **`Any`**: permitido en bordes sin tipar; en cuarentena. No devuelvas `Any` desde el dominio.
* **`# type: ignore`**: con código de error, idealmente ticket o comentario. `warn_unused_ignores` debe estar on.

---

## Qué omitir (a propósito)

No toda feature de typing merece un rollout en producción:

| Feature / hábito | Cuándo rinde | Cuándo omitir |
| --- | --- | --- |
| Anotar cada one-liner privado | Casi nunca | Omitir por defecto |
| `strict` total el día uno en legado | Greenfield o núcleo pequeño | Omitir hasta tipar bordes |
| Jerarquías Generic sobrediseñadas | Librerías y colecciones | Código de app con un solo uso |
| Abuso runtime de `typing` | Helpers raros de validación | Hot paths; checks runtime simples |
| Duplicar modelos Pydantic como TypedDict | N/A | Una sola fuente de verdad |
| Protocols para una sola implementación | Puertos multi-impl | Basta la clase concreta |
| Tipar notebooks y migraciones de un uso | Rara vez | Déjalos en paz |
| `ParamSpec` / callbacks avanzados | Autores de frameworks y decoradores | La mayoría del código de app |

También omite pelearte con el lenguaje. Python no será Rust. El punto es refactors más baratos y menos `AttributeError` en prod, no un demostrador de teoremas.

---

## Un rollout realista para un servicio existente

1. **Activa el checker en CI** en modo no bloqueante o por rutas limitadas una semana para ver el ruido.
2. **Tipa el borde HTTP/cola** con TypedDict o los tipos exportados de tu librería de esquemas.
3. **Añade Protocols para dos o tres puertos reales** (db, cache, mailer) y úsalos en tests.
4. **Activa checks de miembros opcionales** y arregla el rastro de `None`; eso solo suele pagar la migración.
5. **Prohíbe nuevas funciones públicas sin tipos** en review del paquete core.
6. **Aprieta un paquete por sprint**, borra ignores muertos.
7. **Mide**: bugs de formas malas en prod, tiempo para renombrar un campo, cuántas veces se bypasea el checker. Si eso no se mueve, tus anotaciones son teatro.

---

## Patrones que envejecen bien

**Validación en el borde, confianza dentro.** Parsea input no confiable una vez a una forma tipada. Dentro, pasa `User`, no `dict`.

**Estrecha en los condicionales.** Confía en el narrowing tras `if x is None`, `isinstance` y uniones etiquetadas.

**Prefiere `list[str]` y `dict[str, int]`** (PEP 585) en Python moderno frente a `List` y `Dict` de `typing` en código nuevo.

**Mantén las anotaciones cerca de la verdad.** Si producción puede mandar un campo extra, no finjas que el tipo lo prohíbe salvo que lo limpies en el borde.

**Documenta lo no obvio en la firma.** `def price_cents(...) -> int` gana a un comentario que dice "devuelve céntimos."

---

## Ejemplo mínimo: una costura que atrapa errores reales

```python
from typing import Protocol, TypedDict, NotRequired

class ChargeRequest(TypedDict):
    customer_id: str
    amount_cents: int
    currency: str
    idempotency_key: NotRequired[str]

class PaymentGateway(Protocol):
    def charge(self, req: ChargeRequest) -> str: ...

def place_order(
    gateway: PaymentGateway,
    customer_id: str,
    amount_cents: int,
) -> str:
    req: ChargeRequest = {
        "customer_id": customer_id,
        "amount_cents": amount_cents,
        "currency": "USD",
    }
    return gateway.charge(req)
```

Un test double solo necesita `charge`. Un typo en `amount_cents` falla antes del deploy. Cambiar Stripe por un fake no pide una clase base compartida. Eso es tipado de producción: contratos pequeños, aplicados donde cruzan el dinero y los datos.

---

## Conclusión

Los type hints rinden cuando protegen **contratos**, no cuando decoran **detalles de implementación**. Prefiere:

* Anotaciones honestas en APIs públicas y datos de red (`TypedDict` o modelos de esquema)
* **Protocols** pequeños en límites intercambiables
* **Seguridad ante None** y uniones simples que siguen el flujo real
* **Un checker en CI**, strictness gradual, pocas salidas de emergencia y menos mentiras

Omite la ceremonia que no mueve la tasa de bugs. El tipado de Python es una herramienta para equipos que envían servicios bajo cambio. Úsalo como ingeniero, no como coleccionista de PEPs.
