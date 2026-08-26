---
title: "फास्टएपीआई से रेस्ट एपीआई बनाएँ: राउटिंग, पाइडेंटिक, डिपेंडेंसी और टेस्ट"
description: "व्यावहारिक फास्टएपीआई रास्ता: पाथ और क्वेरी राउटिंग, पाइडेंटिक मॉडल, डिपेंडेंसी इंजेक्शन, असिंक हैंडलर, और टेस्टक्लाइंट की बुनियाद जो इस हफ्ते शिप हो।"
date: "2026-07-26"
tags: [बैकएंड और डेटाबेस]
coverImage: /assets/images/fastapi-rest-apis-guide.webp
previewImage: /assets/images/fastapi-rest-apis-guide.webp
---

जब पायथन टीम को टाइप वाला एचटीटीपी एपीआई चाहिए और ओपनएपीआई मुफ्त मिले, तो फास्टएपीआई अक्सर डिफ़ॉल्ट जवाब होता है। फ्रेमवर्क छोटा रहता है: राउट घोषित करो, पाइडेंटिक से बॉडी वैलिडेट करो, साझा सेटअप डिपेंडेंसी से लो, और जहाँ आई/ओ इंतज़ार करता हो वहाँ `async def` पसंद करो। यह पोस्ट वही रास्ता है जो मैं तब चलता हूँ जब अगले महीने दूसरी टीमें कॉल करने वाली सेवा खड़ी करनी हो।

आपके पास एक छोटी आइटम एपीआई रहती है: बनाना, पढ़ना, सूची, हटाना, साथ में वैलिडेशन, साझा डीबी सेशन डिपेंडेंसी, असिंक हैंडलर, और कुछ टेस्ट जो कॉन्ट्रैक्ट टूटने पर सच में फेल हों।

---

## इंस्टॉल और न्यूनतम ऐप

```bash
python -m venv .venv
source .venv/bin/activate
pip install "fastapi[standard]" httpx
```

`fastapi[standard]` यूविकॉर्न और आम एक्स्ट्रा लाता है। `httpx` वही है जो स्टारलेट का `TestClient` अंदर इस्तेमाल करता है।

```python
# main.py
from fastapi import FastAPI

app = FastAPI(title="Items API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

चलाएँ:

```bash
uvicorn main:app --reload
```

`http://127.0.0.1:8000/docs` खोलें। वह इंटरैक्टिव स्कीमा खिलौना नहीं है। प्रॉडक्ट और मोबाइल टीमें उसे कॉन्ट्रैक्ट मानती हैं जबकि आप अभी फ़ील्ड नाम बदल रहे होते हैं।

---

## राउटिंग: पाथ, क्वेरी और स्टेटस कोड

पाथ पैरामीटर टाइप वाले फ़ंक्शन आर्ग्युमेंट बन जाते हैं। क्वेरी पैरामीटर वे वैकल्पिक हैं जो पाथ में नहीं हैं।

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

कुछ आदतें जो एपीआई को अच्छे मतलब से उबाऊ रखती हैं:

* बंद सेट के लिए **एनम** (`order=asc|desc`)। ओपनएपीआई उन्हें ड्रॉपडाउन दिखाता है।
* क्वेरी पैरा पर **सीमा** लगाएँ (`ge`, `le`, `min_length`)। खराब क्लाइंट किनारे पर फेल हों।
* अपेक्षित क्लाइंट त्रुटियों पर **`HTTPException`** उठाएँ। अनपेक्षित बग अभी भी ५०० रहें ताकि नज़र आएँ।
* हमेशा `200` के बजाय क्रिएट पर **स्पष्ट स्टेटस** (`201`) और डिलीट पर (`204`)।

```python
from fastapi import Response

@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int) -> Response:
    # delete from store...
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

दर्जन भर एंडपॉइंट के बाद राउटर मॉड्यूल को स्वस्थ रखते हैं:

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

## पाइडेंटिक: रिक्वेस्ट और रिस्पॉन्स आकार

फास्टएपीआई टाइप हिंट पढ़ता है। पाइडेंटिक वी२ मॉडल वायर फॉर्मेट तय करते हैं और हैंडलर चलने से पहले कचरा रोकते हैं।

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

राउट से जोड़ें:

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

यह पैटर्न क्यों टिकता है:

* **`ItemCreate` बनाम `ItemOut`**: क्लाइंट कभी `id` या `created_at` नहीं भेजता। आप गलती से स्वीकार भी नहीं करते।
* **`response_model`**: अतिरिक्त एट्रिब्यूट काटता है और सफल आकार दस्तावेज़ करता है।
* **वैलिडेटर** उत्पाद नियम पकड़ते हैं जो कच्चे टाइप नहीं कर पाते (`strip`, खाली नाम नहीं)।

अमान्य जेएसओएन पर साफ़ `422` मिलता है, फ़ील्ड त्रुटियों के साथ। वह हाथ से नहीं लिखना पड़ता।

आंशिक अपडेट के लिए वैकल्पिक फ़ील्ड वाला अलग मॉडल रखें (या पैच के पाइडेंटिक पैटर्न)। `ItemCreate` दोबारा इस्तेमाल कर यह न मानें कि गायब की का मतलब "जैसा है वैसा छोड़ो"।

---

## डिपेंडेंसी: हर जगह ग्लोबल के बिना साझा सेटअप

डिपेंडेंसी वे फ़ंक्शन हैं जिन्हें फास्टएपीआई हैंडलर से पहले बुलाता है। क्लासिक उपयोग: डीबी सेशन, वर्तमान यूज़र, एपीआई की, फ़ीचर फ़्लैग।

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

प्रोडक्शन से नोट्स:

* जो साफ़ करना हो (सेशन, कनेक्शन) उसके लिए **`yield` डिपेंडेंसी**।
* छोटी डिप जोड़ें (`get_current_user` → `get_token` पर निर्भर) एक विशाल फ़ंक्शन के बजाय।
* `Annotated[..., Depends(...)]` वाले टाइप एलियास हैंडलर सिग्नेचर छोटे रखते हैं।
* टेस्ट में डिपेंडेंसी **ओवरराइड** करें ताकि असली पोस्टग्रेस या ऑथ न छुए:

```python
app.dependency_overrides[get_db] = lambda: {"connected": True}
```

टेस्ट मॉड्यूल खत्म होने पर ओवरराइड साफ़ करें, वरना फेक दूसरे केस में रिसेंगे।

---

## असिंक: कब `async def` मदद करता है (और कब नहीं)

फास्टएपीआई सिंक हैंडलर थ्रेड पूल में चलाता है, असिंक इवेंट लूप पर। `async def` तब जब हैंडलर **असली आई/ओ लाइब्रेरी** का इंतज़ार करे (एचटीटीपीएक्स असिंक क्लाइंट, असिंकपीजी, मोटर, एआईओबोटोकॉर)। `async def` के अंदर शुद्ध सीपीयू लूप फिर भी सबके लिए लूप ब्लॉक करता है।

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

अंगूठे के नियम:

* जो रास्ता पहले से असिंक है उस पर **पूरा असिंक** ( `async def` में ब्लॉकिंग `requests` न बुलाएँ)।
* **सिंक एसक्यूएलएल्केमी** या सिंक एसडीके को `def` हैंडलर में रखें, या सही असिंक ड्राइवर लें।
* टाइमआउट क्लाइंट पर। बिना सीमा का `await` बेहतर स्टैक ट्रेस वाला प्रोडक्शन हादसा है।

दिन एक पर हर राउट असिंक होना ज़रूरी नहीं। जहाँ आई/ओ भारी हो और कंटेंशन दिखे, वहाँ बदलें।

---

## टेस्टक्लाइंट से बुनियादी टेस्ट

सरल शुरू करें: ऐप को इन-प्रोसेस हिट करें। न फ्री पोर्ट, न असली नेटवर्क।

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

चलाएँ:

```bash
pip install pytest
pytest -q
```

पहले फ़ाइल के बाद जो पैटर्न स्केल करते हैं:

* पेलोड के लिए **फैक्टरी हेल्पर**, दस जेएसओएन ब्लॉब कॉपी न करें।
* हर टेस्ट पर **`get_db` ओवरराइड** इन-मेमोरी स्टोर से।
* **स्टेटस कोड और कुछ फ़ील्ड** पर असर्ट करें, पूरा ओपनएपीआई डंप नहीं।
* एक टेस्ट नाम पर एक व्यवहार (`test_create_rejects_blank_name`), ४० लाइन का "test_items_flow" नहीं।

जब सिर्फ असिंक क्लाइंट के लिए सच असिंक टेस्ट हों, तब `httpx.AsyncClient` + `ASGITransport` और `pytest-asyncio`। ज़्यादातर रेस्ट जाँच `TestClient` से बिना उस रस्म के हो जाती है।

---

## वह कॉम्पैक्ट आकार जो शिप होता है

टुकड़ों को दिमाग में जोड़ें:

| परत | ज़िम्मेदारी |
| --- | --- |
| राउटर | एचटीटीपी वर्ब, पाथ, स्टेटस कोड |
| पाइडेंटिक मॉडल | अंदर वैलिडेट, बाहर आकार |
| डिपेंडेंसी | ऑथ, डीबी, कॉन्फ़िग |
| सर्विस / डोमेन | बिज़नेस नियम (जब बढ़ें तो राउट बॉडी से बाहर) |
| टेस्ट | एचटीटीपी किनारे पर कॉन्ट्रैक्ट |

दिन-एक संरचना जो उम्रदराज़ अच्छी तरह सहती है:

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

तीन एंडपॉइंट के लिए फ़ोल्डरों का षट्कोण न गढ़ें। जब हैंडलर एक साथ एसक्यूएल, ऑथ और ईमेल जानने लगे, तब बढ़ाएँ।

---

## आम गलतियाँ

१. **`response_model` या डीटीओ के बिना ओआरएम ऑब्जेक्ट लौटाना** और वे कॉलम लीक करना जो दिखाने का इरादा नहीं था।
२. **क्रिएट, अपडेट और रिस्पॉन्स के लिए एक ही विशाल पाइडेंटिक मॉडल**। अलग करें।
३. **`async def` में ब्लॉकिंग आई/ओ** (सिंक `requests`, भारी फ़ाइल काम) और लोड पर लैटेंसी गिरने पर हैरानी।
४. **कुछ राउट पर ही ऑथ** क्योंकि नए राउटर ने डिप भूल दी। पूरे समूह पर राउटर-स्तरीय `dependencies=[Depends(...)]` बेहतर।
५. **४२२ रास्तों पर कोई टेस्ट नहीं**। वैलिडेशन आपकी सार्वजनिक एपीआई का हिस्सा है।

---

## आगे क्या करें

अगर इस हफ्ते शुरू कर रहे हैं: हेल्थ राउट बनाएँ, `ItemCreate` / `ItemOut` वाला एक रिसोर्स, हेडर एपीआई की डिपेंडेंसी, और चार टेस्ट (हैप्पी पाथ, ४०४, ४२२, ४०१)। असिंक तभी जोड़ें जहाँ बाहरी एचटीटीपी या असिंक डीबी क्लाइंट हो।

किनारे की सुविधाओं (वेबसॉकेट, बैकग्राउंड टास्क, मिडलवेयर) के लिए आधिकारिक दस्तावेज़ अभी भी सबसे अच्छी संदर्भ हैं: [फास्टएपीआई आधिकारिक दस्तावेज़](https://fastapi.tiangolo.com/)। बाकी के लिए ऊपर का कोड पहली सेवा शिप करने के लिए काफी है, बिना उस स्टार्टर टेम्पलेट की नकल के जिसे आप समझते भी नहीं।
