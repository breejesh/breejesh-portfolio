---
title: "APIs REST avec FastAPI: routing, Pydantic, dépendances et tests"
description: "Parcours pratique FastAPI: routes path et query, modèles Pydantic, injection de dépendances, handlers async et bases TestClient à livrer cette semaine."
date: "2026-07-26"
tags: [Python, Backend, Développement Web]
coverImage: /assets/images/fastapi-rest-apis-guide.webp
previewImage: /assets/images/fastapi-rest-apis-guide.webp
---

FastAPI est la réponse par défaut quand une équipe Python a besoin d'une API HTTP typée avec OpenAPI gratuit. Le framework reste petit: déclarer des routes, valider les corps avec Pydantic, sortir le setup partagé via des dépendances, et préférer `async def` là où l'I/O attend. Ce billet est le chemin que j'utilise pour lever un service que d'autres équipes appelleront le mois prochain.

Vous repartez avec une petite API d'items: créer, lire, lister, supprimer, plus la validation, une dépendance de session DB partagée, des handlers async, et quelques tests qui cassent vraiment quand vous cassez le contrat.

---

## Installation et une app minimale

```bash
python -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]" httpx
```

`fastapi[standard]` tire Uvicorn et les extras habituels. `httpx` est ce que le `TestClient` de Starlette utilise en dessous.

```python
# main.py
from fastapi import FastAPI

app = FastAPI(title="Items API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

Lancez:

```bash
uvicorn main:app --reload
```

Ouvrez `http://127.0.0.1:8000/docs`. Ce schéma interactif n'est pas un jouet. Produit et mobile s'en servent comme contrat pendant que vous changez encore des noms de champs.

---

## Routing: path, query et codes de statut

Les path parameters deviennent des arguments typés. Les query parameters sont les optionnels qui ne sont pas dans le path.

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

Quelques habitudes qui gardent les APIs ennuyeuses dans le bon sens:

* **Utilisez des enums** pour les ensembles fermés (`order=asc|desc`). OpenAPI les affiche en listes.
* **Bornez les query params** (`ge`, `le`, `min_length`). Les mauvais clients échouent au bord.
* **Levez `HTTPException`** pour les erreurs client attendues. Les bugs inattendus doivent rester en 500 pour que vous les voyiez.
* Préférez des **codes de statut explicites** à la création (`201`) et à la suppression (`204`) plutôt que toujours renvoyer `200`.

```python
from fastapi import Response

@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int) -> Response:
    # delete from store...
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

Les routers gardent les modules sains une fois passée la douzaine d'endpoints:

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

## Pydantic: formes request et response

FastAPI lit les type hints. Les modèles Pydantic v2 définissent le format filaire et rejettent les déchets avant l'exécution du handler.

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

Branchez-les sur les routes:

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

Pourquoi ce motif tient:

* **`ItemCreate` vs `ItemOut`**: le client n'envoie jamais `id` ni `created_at`. Vous ne les acceptez pas par accident.
* **`response_model`**: enlève les attributs en trop et documente la forme de succès.
* **Les validators** capturent des règles produit que les types bruts ne peuvent pas (`strip`, nom non vide).

Un JSON invalide reçoit un `422` clair avec erreurs par champ. Vous ne codez pas ça à la main.

Pour les mises à jour partielles, utilisez un modèle séparé à champs optionnels (ou les motifs Pydantic pour PATCH). Ne réutilisez pas `ItemCreate` en prétendant qu'une clé absente veut dire "ne pas changer".

---

## Dépendances: setup partagé sans globals partout

Les dépendances sont des fonctions que FastAPI appelle avant le handler. Usages classiques: sessions DB, utilisateur courant, clés API, feature flags.

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

Notes d'usage en production:

* Préférez des **dépendances avec `yield`** pour tout ce qui doit se nettoyer (sessions, connexions).
* Composez de petites deps (`get_current_user` dépend de `get_token`) plutôt qu'une mega fonction.
* Les alias `Annotated[..., Depends(...)]` gardent les signatures de handlers courtes.
* En tests, **surchargez** les dépendances pour ne pas toucher Postgres réel ni l'auth réelle:

```python
app.dependency_overrides[get_db] = lambda: {"connected": True}
```

Effacez les overrides à la fin du module de tests, sinon vous ferez fuiter des fakes ailleurs.

---

## Async: quand `async def` aide (et quand non)

FastAPI exécute les handlers sync dans un thread pool et les async sur l'event loop. Utilisez `async def` quand le handler **attend** de vraies libs d'I/O (client async httpx, asyncpg, motor, aiobotocore). Une boucle CPU pure dans `async def` bloque encore la loop pour tout le monde.

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

Règles de pouce:

* **Async de bout en bout** sur un chemin déjà async (n'appelez pas `requests` bloquant dans `async def`).
* Gardez **SQLAlchemy sync** ou un SDK sync dans des handlers `def`, ou prenez un driver async correct.
* Les timeouts appartiennent aux clients. Un await sans borne est un incident de production avec de meilleurs stack traces.

Pas besoin que chaque route soit async le jour un. Convertissez les chemins lourds en I/O quand vous mesurez de la contention.

---

## Bases des tests avec TestClient

Commencez simple: frappez l'app en processus. Pas de port libre, pas de vrai réseau.

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

Lancez avec:

```bash
pip install pytest
pytest -q
```

Quelques motifs qui tiennent au-delà du premier fichier:

* **Helpers factory** pour les payloads, sans copier dix blobs JSON.
* **Override de `get_db`** avec un store mémoire par test.
* Assert sur le **code de statut et quelques champs**, pas tout le dump OpenAPI.
* Un comportement par nom de test (`test_create_rejects_blank_name`) plutôt qu'un "test_items_flow" de 40 lignes.

Quand il faut de vrais tests async contre des clients async-only, utilisez `httpx.AsyncClient` avec `ASGITransport` et `pytest-asyncio`. `TestClient` couvre la plupart des checks REST sans cette cérémonie.

---

## Une forme compacte qui se livre

Assemblez les pièces mentalement:

| Couche | Responsabilité |
| --- | --- |
| Router | Verbes HTTP, paths, codes de statut |
| Modèles Pydantic | Valider l'entrée, former la sortie |
| Dépendances | Auth, DB, config |
| Service / domaine | Règles métier (sortez-les du body de route quand ça grossit) |
| Tests | Contrat au bord HTTP |

Structure jour un qui vieillit bien:

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

N'inventez pas un hexagone de dossiers pour trois endpoints. Grossissez quand le handler commence à connaître SQL, auth et email en même temps.

---

## Erreurs fréquentes

1. **Renvoyer des objets ORM sans `response_model` ni DTO** et fuiter des colonnes que vous ne vouliez pas exposer.
2. **Un seul modèle Pydantic géant** pour create, update et response. Séparez-les.
3. **I/O bloquante dans `async def`** (`requests` sync, gros travail fichier) et se demander pourquoi la latence s'écroule sous charge.
4. **Auth seulement sur certaines routes** parce qu'un nouveau router a oublié la dépendance. Préférez `dependencies=[Depends(...)]` au niveau router pour des groupes entiers.
5. **Pas de tests sur les chemins 422**. La validation fait partie de votre API publique.

---

## Suite concrète

Si vous démarrez cette semaine: créez la route health, une ressource avec `ItemCreate` / `ItemOut`, une dépendance de clé API en header, et quatre tests (chemin heureux, 404, 422, 401). Ajoutez async seulement là où vous appelez du HTTP externe ou un client DB async.

La doc officielle reste la meilleure référence pour les bords (WebSockets, background tasks, middleware): [fastapi.tiangolo.com](https://fastapi.tiangolo.com/). Pour le reste, le code ci-dessus suffit pour livrer un premier service sans copier un starter que vous ne comprenez pas.
