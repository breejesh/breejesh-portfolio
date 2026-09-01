---
title: "APIs REST con FastAPI: routing, Pydantic, dependencias y tests"
description: "Camino práctico de FastAPI: rutas path y query, modelos Pydantic, inyección de dependencias, handlers async y TestClient para publicar esta semana."
date: "2026-07-26"
tags: [Backend y Bases de Datos]
coverImage: /assets/images/fastapi-rest-apis-guide.webp
previewImage: /assets/images/fastapi-rest-apis-guide.webp
---


FastAPI es la respuesta por defecto cuando un equipo Python necesita una API HTTP tipada con OpenAPI gratis. El framework se queda pequeño: declara rutas, valida cuerpos con Pydantic, saca el setup compartido por dependencias y prefiere `async def` donde hay espera de I/O. Este post es el camino que uso al levantar un servicio que otros equipos llamarán el mes que viene.

Te vas con una API mínima de items: crear, leer, listar, borrar, más validación, una dependencia de sesión DB compartida, handlers async y un par de tests que fallan de verdad cuando rompes el contrato.

---

## Instalación y una app mínima

```bash
python -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]" httpx
```

`fastapi[standard]` trae Uvicorn y los extras habituales. `httpx` es lo que usa el `TestClient` de Starlette por debajo.

```python
# main.py
from fastapi import FastAPI

app = FastAPI(title="Items API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

Ejecuta:

```bash
uvicorn main:app --reload
```

Abre `http://127.0.0.1:8000/docs`. Ese esquema interactivo no es un juguete. Producto y móvil lo usan como contrato mientras tú aún cambias nombres de campos.

---

## Routing: path, query y códigos de estado

Los path parameters se convierten en argumentos tipados. Los query parameters son los opcionales que no van en el path.

```python
from enum import Enum
from fastapi import FastAPI, HTTPException, Query, status

app = FastAPI()


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"


@app.get("/items/{item_id}")
def get_item(item_id: int) -> dict:
    if item_id < 1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    return {"id": item_id, "name": f"item-{item_id}"}


@app.get("/items")
def list_items(
    q: str | None = Query(default=None, min_length=1, max_length=50),
    limit: int = Query(default=20, ge=1, le=100),
    order: SortOrder = SortOrder.asc,
) -> dict:
    return {"q": q, "limit": limit, "order": order}
```

Hábitos que mantienen las APIs aburridas en el buen sentido:

* **Usa enums** para conjuntos cerrados (`order=asc|desc`). OpenAPI los muestra como desplegables.
* **Pon límites a los query params** (`ge`, `le`, `min_length`). Los clientes malos fallan en el borde.
* **Lanza `HTTPException`** para errores de cliente esperados. Los bugs inesperados deben seguir en 500 para que los veas.
* Prefiere **códigos de estado explícitos** al crear (`201`) y borrar (`204`) en lugar de devolver siempre `200`.

```python
from fastapi import Response

@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int) -> Response:
    # delete from store...
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

Los routers mantienen los módulos sanos cuando pasas de una docena de endpoints:

```python
# routers/items.py
from fastapi import APIRouter

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/{item_id}")
def get_item(item_id: int) -> dict:
    return {"id": item_id}


# main.py
from routers import items

app.include_router(items.router)
```

---

## Pydantic: formas de request y response

FastAPI lee las type hints. Los modelos de Pydantic v2 definen el formato del cable y rechazan basura antes de que corra tu handler.

```python
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    price: float = Field(gt=0, description="Price in USD")
    tags: list[str] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("name cannot be blank")
        return cleaned


class ItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price: float
    tags: list[str]
    created_at: datetime
```

Enlázalos a las rutas:

```python
from fastapi import FastAPI, status

app = FastAPI()
_store: dict[int, ItemOut] = {}
_next_id = 1


@app.post("/items", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
def create_item(body: ItemCreate) -> ItemOut:
    global _next_id
    item = ItemOut(
        id=_next_id,
        name=body.name,
        price=body.price,
        tags=body.tags,
        created_at=datetime.utcnow(),
    )
    _store[_next_id] = item
    _next_id += 1
    return item


@app.get("/items/{item_id}", response_model=ItemOut)
def get_item(item_id: int) -> ItemOut:
    item = _store.get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```

Por qué este patrón se queda:

* **`ItemCreate` vs `ItemOut`**: el cliente nunca envía `id` ni `created_at`. Tú no los aceptas por accidente.
* **`response_model`**: recorta atributos de más y documenta la forma de éxito.
* **Los validators** atrapan reglas de producto que los tipos crudos no pueden (`strip`, nombre no vacío).

Un JSON inválido recibe un `422` claro con errores por campo. No implementas eso a mano.

Para actualizaciones parciales, usa un modelo aparte con campos opcionales (o los patrones de Pydantic para PATCH). No reutilices `ItemCreate` fingiendo que una clave ausente significa "dejar igual".

---

## Dependencias: setup compartido sin globals por todas partes

Las dependencias son funciones que FastAPI llama antes del handler. Usos clásicos: sesiones de DB, usuario actual, API keys, feature flags.

```python
from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status


def get_db() -> Generator[dict, None, None]:
    # stand-in for a real session
    db: dict = {"connected": True}
    try:
        yield db
    finally:
        db["connected"] = False


def require_api_key(x_api_key: Annotated[str | None, Header()] = None) -> str:
    if x_api_key != "secret-dev-key":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return x_api_key


DbDep = Annotated[dict, Depends(get_db)]
AuthDep = Annotated[str, Depends(require_api_key)]


@app.get("/private/items")
def private_list(db: DbDep, _: AuthDep) -> dict:
    return {"db": db["connected"], "items": list(_store.values())}
```

Notas de uso en producción:

* Prefiere **dependencias con `yield`** para lo que debe limpiarse (sesiones, conexiones).
* Compón deps pequeñas (`get_current_user` depende de `get_token`) en lugar de una función gigante.
* Los alias con `Annotated[..., Depends(...)]` acortan las firmas de los handlers.
* En tests, **sobrescribe** dependencias para no pegarle a Postgres real ni a auth real:

```python
app.dependency_overrides[get_db] = lambda: {"connected": True}
```

Limpia los overrides al terminar el módulo de tests o filtrarás fakes a otros casos.

---

## Async: cuándo ayuda `async def` (y cuándo no)

FastAPI ejecuta handlers sync en un thread pool y los async en el event loop. Usa `async def` cuando el handler **espera** librerías de I/O de verdad (cliente async de httpx, asyncpg, motor, aiobotocore). Un bucle de CPU puro dentro de `async def` sigue bloqueando el loop para todos.

```python
import httpx
from fastapi import FastAPI

app = FastAPI()


@app.get("/proxy/todos/{todo_id}")
async def proxy_todo(todo_id: int) -> dict:
    async with httpx.AsyncClient(timeout=5.0) as client:
        r = await client.get(
            f"https://jsonplaceholder.typicode.com/todos/{todo_id}"
        )
        r.raise_for_status()
        return r.json()
```

Reglas prácticas:

* **Async de punta a punta** en un camino que ya es async (no llames `requests` bloqueante dentro de `async def`).
* Deja **SQLAlchemy sync** o SDKs sync en handlers `def`, o usa un driver async de verdad.
* Los timeouts van en los clientes. Un await sin tope es un incidente de producción con mejores stack traces.

No hace falta que toda ruta sea async el día uno. Convierte las pesadas de I/O cuando midas contención.

---

## Tests básicos con TestClient

Empieza simple: golpea la app en proceso. Sin puerto libre, sin red real.

```python
# test_items.py
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_create_and_get_item():
    payload = {"name": "Widget", "price": 9.5, "tags": ["hw"]}
    created = client.post("/items", json=payload)
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Widget"
    assert "id" in body

    got = client.get(f"/items/{body['id']}")
    assert got.status_code == 200
    assert got.json()["price"] == 9.5


def test_create_rejects_blank_name():
    r = client.post("/items", json={"name": "   ", "price": 1.0})
    assert r.status_code == 422


def test_private_requires_key():
    r = client.get("/private/items")
    assert r.status_code == 401

    ok = client.get(
        "/private/items",
        headers={"X-API-Key": "secret-dev-key"},
    )
    assert ok.status_code == 200
```

Ejecuta con:

```bash
pip install pytest
pytest -q
```

Patrones que escalan más allá del primer archivo:

* **Helpers factory** para payloads y no copiar diez blobs JSON.
* **Override de `get_db`** con un store en memoria por test.
* Afirma **código de estado y unos pocos campos**, no todo el dump de OpenAPI.
* Prefiere un comportamiento por nombre de test (`test_create_rejects_blank_name`) frente a un "test_items_flow" de 40 líneas.

Cuando necesites tests async de verdad contra clientes solo async, usa `httpx.AsyncClient` con `ASGITransport` y `pytest-asyncio`. `TestClient` cubre la mayoría de checks REST sin esa ceremonia.

---

## Una forma compacta que se publica

Junta las piezas mentalmente:

| Capa | Responsabilidad |
| --- | --- |
| Router | Verbos HTTP, paths, códigos de estado |
| Modelos Pydantic | Validar entrada, dar forma a la salida |
| Dependencias | Auth, DB, config |
| Service / dominio | Reglas de negocio (sácalas del body de la ruta cuando crezcan) |
| Tests | Contrato en el borde HTTP |

Estructura del día uno que envejece bien:

```
app/
  main.py          # FastAPI(), include routers
  deps.py          # get_db, get_current_user
  models/
    item.py        # ItemCreate, ItemOut
  routers/
    items.py
  services/
    items.py       # optional once logic spreads
tests/
  test_items.py
```

No inventes un hexágono de carpetas para tres endpoints. Crece cuando el handler empiece a conocer SQL, auth y email a la vez.

---

## Errores comunes

1. **Devolver objetos ORM sin `response_model` ni DTO** y filtrar columnas que no querías exponer.
2. **Un solo modelo Pydantic gigante** para create, update y response. Sepáralos.
3. **I/O bloqueante en `async def`** (`requests` sync, trabajo pesado de archivos) y preguntarte por qué la latencia se cae bajo carga.
4. **Auth solo en algunas rutas** porque un router nuevo olvidó la dependencia. Prefiere `dependencies=[Depends(...)]` a nivel de router para grupos enteros.
5. **Sin tests en caminos 422**. La validación es parte de tu API pública.

---

## Qué hacer después

Si empiezas esta semana: crea la ruta health, un recurso con `ItemCreate` / `ItemOut`, una dependencia de API key por header y cuatro tests (camino feliz, 404, 422, 401). Añade async solo donde llames HTTP externo o un cliente de DB async.

La documentación oficial sigue siendo la mejor referencia para bordes (WebSockets, background tasks, middleware): [fastapi.tiangolo.com](https://fastapi.tiangolo.com/). Para el resto, el código de arriba basta para publicar un primer servicio sin copiar un starter que no entiendes.

