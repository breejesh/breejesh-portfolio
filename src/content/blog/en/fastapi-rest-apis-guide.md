---
title: "Build REST APIs with FastAPI: Routing, Pydantic, Dependencies, and Tests"
description: "A practical FastAPI path: path and query routing, Pydantic models, dependency injection, async handlers, and TestClient basics you can ship this week."
date: "2026-07-26"
tags: [Python, Backend, Web Development]
coverImage: /assets/images/fastapi-rest-apis-guide.webp
previewImage: /assets/images/fastapi-rest-apis-guide.webp
---

FastAPI is the default answer when a Python team needs a typed HTTP API with OpenAPI for free. The framework stays small: declare routes, validate bodies with Pydantic, pull shared setup through dependencies, and prefer `async def` where I/O waits. This post is the path I use when spinning up a service that other teams will call next month.

You will leave with a tiny item API: create, read, list, delete, plus validation, a shared DB session dependency, async handlers, and a couple of tests that actually fail when you break the contract.

---

## Install and a minimal app

```bash
python -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]" httpx
```

`fastapi[standard]` pulls Uvicorn and the usual extras. `httpx` is what Starlette's `TestClient` uses underneath.

```python
# main.py
from fastapi import FastAPI

app = FastAPI(title="Items API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

Run it:

```bash
uvicorn main:app --reload
```

Open `http://127.0.0.1:8000/docs`. That interactive schema is not a toy. Product and mobile teams use it as the contract while you still change field names.

---

## Routing: path, query, and status codes

Path parameters become typed function arguments. Query parameters are the optional ones that are not in the path.

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

A few habits that keep APIs boring in a good way:

* **Use enums** for closed sets (`order=asc|desc`). OpenAPI shows them as dropdowns.
* **Put bounds on query params** (`ge`, `le`, `min_length`). Bad clients fail at the edge.
* **Raise `HTTPException`** for expected client errors. Unexpected bugs should still 500 so you notice them.
* Prefer **explicit status codes** on create (`201`) and delete (`204`) instead of always returning `200`.

```python
from fastapi import Response

@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int) -> Response:
    # delete from store...
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

Routers keep modules sane once you pass a dozen endpoints:

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

## Pydantic: request and response shapes

FastAPI reads type hints. Pydantic v2 models define the wire format and reject junk before your handler runs.

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

Wire them to routes:

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

Why this pattern sticks:

* **`ItemCreate` vs `ItemOut`**: clients never send `id` or `created_at`. You never accidentally accept them.
* **`response_model`**: strips extra attributes and documents the success shape.
* **Validators** catch product rules that raw types cannot (`strip`, non-empty name).

Invalid JSON gets a clear `422` with field errors. You do not hand-roll that.

For partial updates, use a separate model with optional fields (or Pydantic's patterns for PATCH). Do not reuse `ItemCreate` and pretend missing keys mean "leave unchanged."

---

## Dependencies: shared setup without globals everywhere

Dependencies are functions FastAPI calls before the handler. Classic uses: DB sessions, current user, API keys, feature flags.

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

Notes from production use:

* Prefer **`yield` dependencies** for anything that must clean up (sessions, connections).
* Compose small deps (`get_current_user` depends on `get_token`) instead of one mega function.
* Type aliases with `Annotated[..., Depends(...)]` keep handler signatures short.
* In tests, **override** dependencies so you do not hit real Postgres or auth:

```python
app.dependency_overrides[get_db] = lambda: {"connected": True}
```

Clear overrides after the test module finishes or you will leak fakes into other cases.

---

## Async: when `async def` helps (and when it does not)

FastAPI runs sync handlers in a thread pool and async handlers on the event loop. Use `async def` when the handler **awaits** real I/O libraries (httpx async client, asyncpg, motor, aiobotocore). A pure CPU loop inside `async def` still blocks the loop for everyone.

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

Rules of thumb:

* **Async all the way** for a path that is already async (do not call blocking `requests` inside `async def`).
* Keep **sync SQLAlchemy** or sync SDK code in `def` handlers, or use a proper async driver.
* Timeouts belong on clients. An unbounded await is a production incident with better stack traces.

You do not need every route to be async on day one. Convert the I/O-heavy ones when you measure contention.

---

## Testing basics with TestClient

Start simple: hit the app in-process. No free port, no real network.

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

Run with:

```bash
pip install pytest
pytest -q
```

A few patterns that scale past the first file:

* **Factory helpers** for payloads so tests do not copy ten JSON blobs.
* **Override `get_db`** with an in-memory store per test.
* Assert **status code and a few fields**, not the entire OpenAPI dump.
* Prefer one behavior per test name (`test_create_rejects_blank_name`) over a 40-line "test_items_flow".

When you need true async tests against async-only clients, use `httpx.AsyncClient` with `ASGITransport` and `pytest-asyncio`. `TestClient` covers most REST checks without that ceremony.

---

## A compact shape that ships

Put the pieces together mentally:

| Layer | Responsibility |
| --- | --- |
| Router | HTTP verbs, paths, status codes |
| Pydantic models | Validate in, shape out |
| Dependencies | Auth, DB, config |
| Service / domain | Business rules (keep this out of route bodies when it grows) |
| Tests | Contract at the HTTP edge |

Day-one structure that ages well:

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

Do not invent a hexagon of folders for three endpoints. Grow when the handler starts knowing SQL, auth, and email at once.

---

## Common mistakes

1. **Returning ORM objects without `response_model` or a DTO** and leaking columns you never meant to expose.
2. **One giant Pydantic model** for create, update, and response. Split them.
3. **Blocking I/O in `async def`** (sync `requests`, heavy file work) and wondering why latency cliffs appear under load.
4. **Auth only on some routes** because a new router forgot the dependency. Prefer router-level `dependencies=[Depends(...)]` for whole groups.
5. **No tests on 422 paths**. Validation is part of your public API.

---

## What to do next

If you are starting this week: create the health route, one resource with `ItemCreate` / `ItemOut`, a header API key dependency, and four tests (happy path, 404, 422, 401). Add async only where you call an external HTTP or async DB client.

Official docs stay the best reference for edge features (WebSockets, background tasks, middleware): [fastapi.tiangolo.com](https://fastapi.tiangolo.com/). For the rest, the code above is enough to ship a first service without cargo-culting a starter template you do not understand.
