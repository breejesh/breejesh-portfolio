---
title: "Type hints Python qui paient vraiment en production"
description: "Quelles annotations Python attrapent de vrais bugs: Protocols, TypedDict, mypy et pyright progressifs. Que typer d'abord, que laisser de côté, et un CI utile."
date: "2026-06-30"
tags: [Python, Backend]
coverImage: /assets/images/python-type-hints-production.webp
previewImage: /assets/images/python-type-hints-production.webp
---

Les type hints Python sont gratuits au runtime et chers quand ils mentent. Les équipes qui en tirent de la valeur n'annotent pas chaque helper privé. Elles typent les **coutures**: APIs publiques, formats filaires, objets de domaine partagés, frontières de plugins. Le reste peut rester souple jusqu'à ce qu'un bug ou un refactor force la décision.

Ceci est un guide de terrain. Pas un catalogue de tout `typing`, ni un concours de pureté entre checkers. L'objectif: moins de surprises en production, avec un budget défendable en review.

---

## Ce que "ça paie" veut dire

Un hint paie quand il fait au moins une de ces choses:

1. **Arrête une vraie classe de bug** avant le merge (mauvaise clé sur un dict JSON, attribut manquant après un rename, `None` là où une string est requise).
2. **Rend les refactors sûrs** entre modules que vous ne tenez pas tous en tête.
3. **Documente des contrats** que les tests seuls ne disent pas (forme d'un body, méthodes qu'un backend de stockage doit exposer).
4. **Coûte peu à maintenir** quand le code bouge.

Si l'annotation ne fait que contenter le checker, ou exige un `cast` chaque semaine, c'est de la dette avec un badge CI vert.

---

## Commencez aux bords, pas au milieu

Sans aucun type, annoter des utilitaires au hasard est le chemin le plus lent. Ordre qui marche:

1. **Fonctions et méthodes publiques** qui croisent les frontières de package.
2. **Données qui croisent les processus**: bodies HTTP, messages de file, config, lignes ORM traitées comme dicts.
3. **Interfaces** entre composants que vous échangez ou mockez (storage, clients de paiement, feature flags).
4. **Seulement ensuite** l'intérieur, une fois les bords honnêtes.

Un service avec des types parfaits sur les helpers privés et `dict[str, Any]` sur chaque handler FastAPI est typé là où ça fait le moins mal.

```python
# Bord: request entre, domaine sort
def create_invoice(payload: CreateInvoiceRequest, user_id: str) -> Invoice:
    ...
```

Les types de retour comptent autant que les paramètres. Les callers se trompent plus souvent sur ce que vous renvoyez que sur ce que vous prenez.

---

## TypedDict: JSON et config sans toute une couche modèle

Pydantic et les dataclasses conviennent quand vous possédez le modèle. Beaucoup de code de production passe encore des dicts plats issus de `json.loads`, Redis ou d'un SDK. C'est là que **`TypedDict`** gagne son pain.

```python
from typing import TypedDict, NotRequired

class UserEvent(TypedDict):
    user_id: str
    event: str
    ts: int
    meta: NotRequired[dict[str, str]]

def handle_event(event: UserEvent) -> None:
    user_id = event["user_id"]  # le checker sait que la clé existe
    ...
```

Pourquoi ça paie:

* Renommer `user_id` en `account_id` casse chaque call site en CI, pas une ligne de log silencieuse à 3 h.
* Les champs optionnels restent explicites avec `NotRequired` (ou `total=False` en style ancien).
* Vous n'imposez pas une hiérarchie de classes à un adaptateur mince.

**Ignorez TypedDict** quand la forme est vraiment ouverte (webhooks vendeur que vous stockez seulement), ou quand vous validez déjà avec une lib de schémas qui génère des types. Double-modéliser le même payload est du remplissage.

Pour du JSON imbriqué, quelques petits TypedDict battent un méga-dict à dix clés optionnelles et une prière.

---

## Protocol: duck typing qui vérifie encore

La force de Python, c'est le typage structurel. **`Protocol`** (PEP 544) garde ce style sans classes de base utiles seulement au checker.

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

Tout objet avec un `close()` compatible convient. Pas d'enregistrement ABC, pas de dépendance partagée juste pour le typage.

Où les Protocols brillent en production:

* **Ports et adaptateurs**: vous définissez `UserStore`, injectez Postgres en prod et un fake en tests.
* **APIs amicales pour les libs**: accepter "tout ce qui est file-like" plutôt qu'une classe concrète.
* **Extraction progressive**: documenter les méthodes vraiment appelées avant d'extraire une interface.

**Ignorez les Protocols** pour une classe interne à une seule implémentation qui ne bouge pas. Une annotation de classe concrète est plus claire. Évitez les Protocols de vingt méthodes "pour être complet." Typez ce que les callers utilisent.

```python
# Bien: petit et réel
class Clock(Protocol):
    def now(self) -> datetime: ...

# Bruit: interface dieu que personne n'implémente vraiment
class EverythingService(Protocol):
    ...
```

---

## Unions, Optional et `| None` (les bugs que vous livrez vraiment)

La plupart des gains sont ennuyeux: une fonction renvoie `User | None`, l'appelant oublie le test, le checker crie.

```python
def find_user(user_id: str) -> User | None:
    ...

user = find_user(uid)
# name = user.name          # error: Item "None" has no attribute "name"
if user is None:
    raise LookupError(uid)
name = user.name            # narrowed; sûr
```

Préférez `X | None` explicite plutôt que des objets vides qui prétendent le succès. Préférez lever pour les erreurs de programmeur et `None` (ou `Result`) pour l'absence attendue. Un style par codebase.

Un `Union` de cinq types sans lien est souvent une odeur de conception. Si une fonction renvoie `User | Order | str | int`, découpez l'API.

---

## Génériques là où les conteneurs partagés le méritent

Les génériques paient sur les **conteneurs et dépôts réutilisables**, pas sur chaque variable locale.

```python
from typing import TypeVar, Generic

T = TypeVar("T")

class Repository(Generic[T]):
    def get(self, id: str) -> T | None: ...
    def add(self, item: T) -> None: ...

class UserRepository(Repository[User]):
    ...
```

Ou, avec une syntaxe moderne et un checker qui la supporte:

```python
def first[T](items: list[T]) -> T | None:
    return items[0] if items else None
```

**Ignorez les graphes génériques profonds** (`Repo[T, ID, Filter, Page]`) jusqu'à une vraie douleur. Les TypeVar à bornes complexes sont un endroit fréquent où une équipe brûle une semaine et livre les mêmes bugs avec de plus jolies signatures.

---

## mypy et pyright: que l'outil serve l'équipe

Pas besoin de guerre sainte. Il faut **un checker en CI** avec une config que l'équipe peut expliquer.

Mise en place pragmatique:

1. **Choisissez un checker principal** pour la CI (pyright/Pylance courant avec VS Code; mypy dans les monorepos Django/Flask anciens). L'éditeur local peut coller à la CI.
2. **Commencez progressivement**. `strict = true` sur un legacy d'un million de lignes tue l'initiative.
3. **Serrez par package**. Domaine et APIs publiques d'abord. Scripts et notebooks restent souples.
4. **Faites échouer le build sur les erreurs des modules typés**, pas sur tout l'univers des stubs tiers le jour un.

Forme de `pyrightconfig.json` pour un déploiement progressif:

```json
{
  "include": ["src"],
  "exclude": ["**/migrations", "**/scripts"],
  "typeCheckingMode": "basic",
  "reportMissingImports": true,
  "reportOptionalMemberAccess": true
}
```

Exemple mypy vers plus d'honnêteté sans big bang:

```ini
[mypy]
python_version = 3.12
warn_return_any = True
warn_unused_ignores = True
check_untyped_defs = True

[mypy-src.legacy.*]
ignore_errors = True
```

### Ce qu'il faut exiger du checker

* Attraper les erreurs d'**attribut et de None** dans votre code.
* Attraper les **mauvaises clés TypedDict** et les écarts de Protocol.
* Remonter les **ignores inutilisés** pour que `# type: ignore` ne devienne pas du papier peint.

### Ce qu'il ne faut pas vénérer

* Une couverture tierce parfaite. Utilisez des stubs quand ça aide; encapsulez les SDK sales derrière une fine façade typée.
* Zéro `Any`. Quelques `Any` honnêtes à la frontière battent cinquante types "précis" faux.
* Gagner le débat sur le checker "plus correct" pendant que la prod envoie encore des `dict` partout.

---

## `cast`, `Any` et `# type: ignore` (les trappes de sortie)

Ils existent pour une raison. Patterns d'abus:

```python
# Mauvais: faire taire au lieu de modéliser
user = cast(User, raw_json)          # développement par l'espoir
data: Any = fetch()                  # la contagion gagne les callers
result = thing.method()  # type: ignore[attr-defined]
```

Meilleurs patterns:

```python
def parse_user(raw: dict[str, object]) -> User:
    # valider une fois à la frontière
    return User(
        id=str(raw["id"]),
        email=str(raw["email"]),
    )
```

Règles solides:

* **`cast`**: rare, local, de préférence près d'un check runtime ou d'un commentaire sur ce que le checker ne voit pas.
* **`Any`**: autorisé aux frontières non typées; en quarantaine. Ne renvoyez pas `Any` depuis le domaine.
* **`# type: ignore`**: avec un code d'erreur, idéalement un ticket ou un commentaire. Activez `warn_unused_ignores`.

---

## Que laisser de côté (volontairement)

Toute feature de typing ne mérite pas un rollout prod:

| Feature / habitude | Quand ça paie | Quand ignorer |
| --- | --- | --- |
| Annoter chaque one-liner privé | Presque jamais | Ignorer par défaut |
| `strict` total le jour un sur du legacy | Greenfield ou petit noyau | Ignorer tant que les bords ne sont pas typés |
| Hiérarchies Generic sur-conçues | Libs et collections | Code d'app à un seul site d'usage |
| Abus runtime de `typing` | Rares helpers de validation | Chemins chauds; checks runtime simples |
| Dupliquer des modèles Pydantic en TypedDict | N/A | Une seule source de vérité |
| Protocols pour une seule impl | Ports multi-impl | La classe concrète suffit |
| Typer notebooks et migrations jetables | Rarement | Les laisser tranquilles |
| `ParamSpec` / callbacks avancés | Auteurs de frameworks et décorateurs | La plupart du code d'app |

Évitez aussi de combattre le langage. Python ne deviendra pas Rust. L'enjeu, ce sont des refactors moins chers et moins d'`AttributeError` en prod, pas un démonstrateur de théorèmes.

---

## Un rollout réaliste pour un service existant

1. **Activez le checker en CI** en mode non bloquant ou sur des chemins limités une semaine pour voir le bruit.
2. **Typez la frontière HTTP/file** avec TypedDict ou les types exportés de votre lib de schémas.
3. **Ajoutez des Protocols pour deux ou trois vrais ports** (db, cache, mailer) et utilisez-les dans les tests.
4. **Activez les checks de membres optionnels** et corrigez la retombée de `None`; cela paie souvent la migration à lui seul.
5. **Interdisez les nouvelles fonctions publiques non typées** en review sur le package cœur.
6. **Serrez un package par sprint**, supprimez les ignores morts.
7. **Mesurez**: bugs de formes incorrectes en prod, temps pour renommer un champ, fréquence de contournement du checker. Si ça ne bouge pas, vos annotations sont du théâtre.

---

## Patterns qui vieillissent bien

**Validation à la frontière, confiance à l'intérieur.** Parsez l'entrée non fiable une fois en forme typée. À l'intérieur, passez `User`, pas `dict`.

**Resserrez aux conditionnels.** Fiez-vous au narrowing après `if x is None`, `isinstance` et unions étiquetées.

**Préférez `list[str]` et `dict[str, int]`** (PEP 585) en Python moderne plutôt que `List` et `Dict` de `typing` dans le code neuf.

**Gardez les annotations proches de la vérité.** Si la prod peut envoyer un champ en plus, ne prétendez pas que le type l'interdit sauf nettoyage à la frontière.

**Documentez le non évident dans la signature.** `def price_cents(...) -> int` bat un commentaire "renvoie des centimes."

---

## Exemple minimal: une couture qui attrape de vraies erreurs

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

Un double de test n'a besoin que de `charge`. Une typo sur `amount_cents` échoue avant le déploiement. Remplacer Stripe par un fake n'exige pas de classe de base partagée. Voilà le typage de production: petits contrats, appliqués là où l'argent et les données croisent les lignes.

---

## En résumé

Les type hints paient quand ils protègent des **contrats**, pas quand ils décorent des **détails d'implémentation**. Préférez:

* Des annotations honnêtes sur les APIs publiques et les données filaires (`TypedDict` ou modèles de schéma)
* De petits **Protocols** aux frontières interchangeables
* La **sécurité face à None** et des unions simples alignées sur le flux réel
* **Un checker en CI**, strictness progressive, peu de trappes et encore moins de mensonges

Laissez de côté la cérémonie qui ne change pas le taux de bugs. Le typage Python est un outil pour des équipes qui livrent des services sous changement. Utilisez-le en ingénieur, pas en collectionneur de PEPs.
