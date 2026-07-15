---
title: "Patterns de cache Redis qui tiennent en production"
description: "Cache-aside, contrôle de stampede, jitter de TTL, invalidation et hot keys. Patterns pour que Redis reste utile sous trafic réel sans faire fondre la base."
date: "2026-07-15"
tags: [Bases de données, Backend]
coverImage: /assets/images/redis-caching-patterns.webp
previewImage: /assets/images/redis-caching-patterns.webp
---

Le cache a l'air simple jusqu'à ce que le trafic soit irrégulier, que les clés expirent en même temps, et qu'un id produit célèbre brûle un seul shard Redis. La plupart des incidents que j'ai vus n'étaient pas "Redis est lent". C'étaient un stampede, des données périmées pour toujours, ou une hot key que personne ne mesurait.

Voici la liste courte qui revient sur de vrais services : **cache-aside**, **contrôle de stampede**, **TTL avec jitter**, **invalidation** et **hot keys**. Pas un catalogue de chaque commande Redis. Juste les patterns à avoir avant de mettre un cache sur le chemin de lecture.

---

## Ce que fait vraiment le cache-aside

**Cache-aside** (chargement paresseux) est le défaut quand l'app possède le cache :

1. Lire Redis pour `key`.
2. En cas de hit, renvoyer la valeur.
3. En cas de miss, charger depuis la source de vérité (souvent Postgres), écrire Redis avec un TTL, renvoyer.
4. Les écritures vont d'abord en base. Ensuite vous supprimez la clé de cache ou vous l'écrasez.

```
value = GET cache:user:{id}
if value is nil:
  value = db.query("SELECT ... WHERE id = ?")
  if value is nil:
    SET cache:user:{id} "null" EX 60   # negative cache; see below
  else:
    SET cache:user:{id} value EX 300
return value
```

Pourquoi les équipes le choisissent :

* L'app possède le schéma de clés et la politique de TTL.
* La base reste la source de vérité.
* Vous pouvez commencer par un endpoint et grandir.

Coûts acceptés :

* La première requête après un miss paie la latence DB complète.
* Des misses concurrents sur la même clé peuvent stampede la DB (section suivante).
* Il faut penser à ce qui se passe après un write.

**Read-through** et **write-through** poussent plus de logique dans une couche ou lib de cache. Bien si vous en avez une. Beaucoup de code microservices fait encore le cache-aside à la main.

---

## Cache stampede (thundering herd)

Stampede : une clé populaire expire (ou est évincée), puis **des centaines de requêtes concurrentes** missent et frappent la base avec la même requête. La DB s'envole. La latence grimpe. Les timeouts créent des retries. Le troupeau grossit.

Déclencheurs classiques :

* Un TTL fixe sur une clé chaude pour que chaque instance voie l'expiry dans la même seconde.
* Un déploiement qui vide le cache.
* Un pic de trafic juste au moment où une clé meurt.
* Pas de negative cache : une ligne absente est re-queryée sans fin.

### Défense 1 : single-flight / coalescing de requêtes

Une seule requête reconstruit la valeur. Les autres attendent (ou servent des données un peu périmées).

```
value = GET key
if hit: return value

if SETNX lock:key "1" EX 10:
  value = load_from_db()
  SET key value EX ttl
  DEL lock:key
  return value
else:
  sleep briefly and retry GET
  # or return last-known if you keep a soft TTL copy
```

`SETNX` (ou `SET key NX EX`) est un verrou grossier. En multi-pod, c'est souvent suffisant contre le stampede. Pour plus de contrôle : verrou court + boucle d'attente avec timeout dur, puis bascule DB seulement si le détenteur du lock est mort.

Le single-flight in-process (une goroutine/promesse par clé par pod) aide **dans** le process. Il n'empêche pas N pods de faire chacun un rebuild. Combinez les deux pour les clés chaudes.

### Défense 2 : refresh anticipé probabiliste

Avant l'expiry dur, une fraction des requêtes rafraîchit tôt. Les clés populaires sont reconstruites avant la falaise. Les moins populaires attendent surtout le miss naturel.

Logique style XFetch : si le TTL restant est petit par rapport au total, et qu'un tirage aléatoire gagne, rebuild et réécriture. La formule compte moins que l'idée : **étaler le travail de refresh dans le temps** au lieu d'un miss synchronisé.

### Défense 3 : stale-while-revalidate

Stockez deux temps : soft TTL (servir mais rafraîchir) et hard TTL (recharger obligatoire). Ou stockez le payload avec un champ `stale_after` et un `EX` Redis plus long.

Sur soft miss : renvoyez tout de suite l'ancienne valeur, lancez un refresh async. Les utilisateurs restent rapides. Des workers de fond absorbent le rebuild. Vous échangez une fraîcheur stricte contre de la stabilité.

### Défense 4 : negative caching

Si la DB dit "introuvable", cachez ce fait avec un TTL court (30s-2m). Sans ça, bots et clients cassés martèlent des ids manquants pour toujours. TTL court pour qu'une ligne nouvellement créée ne soit pas invisible des heures.

---

## TTL : pas un seul chiffre pour tout

Le TTL est un **budget de staleness**, pas un défaut magique de 3600.

| Forme de données | TTL typique | Notes |
| --- | --- | --- |
| Session utilisateur / snapshot d'authz | minutes | Sensible sécu ; invalider au logout / changement de rôle |
| Ligne catalogue produit | 5-30 min | Invalider à l'édition admin |
| Ranking de feed / cards home | 30s-5 min | Peut être un peu stale |
| Feature flags | 10-60s | Préférer l'invalidation push si dispo |
| Compteurs de rate / idempotence | durée de la fenêtre | Souvent TTL exact, pas "pour toujours" |
| Negative cache ("not found") | 30s-2 min | Court exprès |

### Jitter pour que les clés n'expirent pas en file

Si 50 000 clés produit utilisent toutes `EX 300`, un cold start ou un insert massif peut créer des vagues d'expiry synchronisées. Ajoutez du jitter :

```
ttl = base_ttl + random(0, base_ttl * 0.1)
# e.g. 300 + random(0, 30) seconds
```

Le jitter ne remplace pas les locks de stampede. Il réduit la chance que **beaucoup de clés différentes** meurent ensemble et saturent Redis et la DB.

### Mémoire et eviction

Redis n'est pas infini. Quand `maxmemory` est atteint, la politique compte :

* `allkeys-lru` / `allkeys-lfu` : bien pour des caches purs où toute clé peut mourir.
* `volatile-lru` : seulement les clés avec TTL. Dangereux si certaines n'ont pas de TTL et pinent la mémoire.
* Ne faites jamais tourner un cache de prod sans **TTL sur presque chaque clé** et un `maxmemory-policy` clair.

Si une clé ne doit pas disparaître sous pression (locks, files), mettez-la sur un autre Redis avec une autre politique, ou acceptez qu'une instance de cache n'est pas le bon store pour la durabilité.

---

## Invalidation : la partie dure

Il n'y a que des problèmes durs en CS, et l'invalidation de cache est la blague pour une raison. Les modes de panne sont concrets :

* **Course delete-then-write :** A supprime le cache, B charge l'ancienne ligne DB dans le cache, C commit un nouveau write. Le cache reste stale jusqu'au TTL.
* **Write-then-forget :** l'app met à jour la DB et ne touche pas Redis. Stale jusqu'au TTL.
* **Objets multi-clés :** profil sous `user:42`, mais aussi embarqué dans `team:9:members`. Vous avez mis à jour une clé et laissé la copie dénormalisée.

### Patterns qui marchent

**1. Écrire la DB, puis supprimer le cache (rebuild paresseux)**

```
BEGIN; UPDATE users SET name = ? WHERE id = ?; COMMIT;
DEL cache:user:{id}
```

La lecture suivante reconstruit. Préférez **supprimer plutôt qu'écraser** quand le write n'a pas l'objet complet que vous cachez, ou quand des writers concurrents s'entrelacent.

**2. Écrire la DB, puis set du cache (si vous avez le payload complet)**

Utile quand la forme de la réponse matche le blob. Toujours sujet aux courses sous writers concurrents. Champs de version ou "écrire seulement si la version augmente" aident.

**3. Clés versionnées**

`cache:user:{id}:v{version}` ou incluez `updated_at` dans le hash de clé. Incrémentez la version au write ; les anciennes meurent par TTL. Les lecteurs demandent toujours la version courante depuis la DB ou une petite clé pointeur. Plus de pièces, moins de bugs "stale silencieux" sur objets complexes.

**4. Invalidation Pub/Sub ou stream**

Le writer publie `invalidate user:42`. Les instances dropent les L1 locaux. Le delete de la clé Redis reste nécessaire pour le L2 partagé. L1 local sans invalidation, c'est comment "c'est fixé sur mon pod" devient un incident.

**5. TTL comme filet, pas comme seul plan**

Même avec des deletes parfaits, un worker peut rater un message. Le TTL borne le pire cas de staleness. Choisissez cette borne avec le produit, pas par superstition.

### Ordre sous concurrence

Règle pratique de beaucoup d'équipes :

1. Mettre à jour la base (commit de la transaction).
2. Supprimer la clé de cache (ou bumper la version).
3. Laisser la lecture suivante remplir.

Si vous devez set le cache au write, faites-le **après** le commit avec la ligne commitée, et gardez un TTL. Sur des lignes très contestées, colonne de version et refus de cacher une version plus vieille par-dessus une plus récente.

---

## Hot keys : quand une clé est l'outage

Une hot key absorbe une part disproportionnée des ops : blob de config homepage, profil célébrité, document global de feature flags, produit flash sale.

Symptômes :

* Un cœur CPU Redis saturé (surtout en Cluster : un hash slot).
* La latence de clés **non liées** monte parce que ce nœud est occupé.
* Timeouts clients et tempêtes de reconnect.

### Mitigations

**L1 local dans l'app**

LRU in-process (Caffeine, Ristretto, Guava, etc.) avec TTL court (1s-30s) pour les hot keys connues. La plupart des lectures ne quittent pas le pod. Invalidez via Pub/Sub ou acceptez une courte staleness.

**Découpage de clé / shard de la valeur**

Si la valeur est un gros hash, découpez en `product:{id}:core`, `product:{id}:stats`, etc., seulement si les patterns d'accès diffèrent. Découper un compteur logique en `N` shards (lire la somme, écrire un shard aléatoire) aide plus les compteurs write-hot que les blobs read-hot.

**Réplicas en lecture**

Les réplicas Redis peuvent prendre du load de lecture cache-aside **si** vous acceptez le lag de réplication. Données critiques de session : primary. JSON homepage qui peut avoir 100ms de retard : les réplicas aident.

**Copier la hot key (cache edge)**

CDN ou edge pour des blobs publics, surtout statiques. Redis ne devrait pas être la seule défense du trafic anonyme qui n'a pas besoin de fraîcheur par utilisateur.

**Instance dédiée pour le namespace le plus chaud**

Parfois le vrai fix est l'isolation : un petit Redis seulement pour `config:*` et `flags:*`, pour qu'une tempête là ne starve pas les sessions panier.

---

## Assembler : un défaut ennuyeux et solide

Pour une API CRUD typique avec Postgres et Redis :

| Préoccupation | Choix par défaut |
| --- | --- |
| Chemin de lecture | Cache-aside |
| Tempête de miss | Lock (`SET NX`) + single-flight in-process optionnel |
| TTL | Base par domaine + 10% de jitter |
| Après write | Commit DB, puis `DEL` de la clé |
| Not found | Negative cache, TTL court |
| Clés ultra-chaudes | L1 in-process + TTL court + métriques |
| Redis down | Fail open vers DB avec timeout et circuit breaker ; alerter |

### Métriques minimales qui valent le coup

* Hit ratio par préfixe de clé (pas un seul chiffre global).
* Latence miss vs hit.
* Échecs d'acquire du lock stampede / temps d'attente.
* CPU Redis, clés évincées, connexions rejetées.
* Top keys par ops (`HOTKEYS` / métriques proxy / sampling).

Un hit ratio de 99% peut cacher un préfixe à 20% qui tue la DB. Séparez les chiffres.

### Mode de panne : Redis indisponible

Décidez par écrit :

* **Fail open vers la DB :** plus de latence, risque de surcharge DB. Courant pour les lectures produit.
* **Fail closed :** renvoyer des erreurs. Courant pour les stores de session auth (qui ne sont pas toujours un pur cache).
* **Servir stale depuis disque/L1 :** seulement s'il reste quelque chose à servir.

Associez fail-open à **timeouts, bulkheads et load shedding**. Un fallback DB infini pendant un outage Redis, c'est comment un incident cache devient un incident base.

---

## Petite forme de code (esquisse Python)

```python
import json
import random
import time
from typing import Any, Callable, Optional

def cache_aside(
    redis,
    key: str,
    loader: Callable[[], Optional[Any]],
    base_ttl: int = 300,
    neg_ttl: int = 60,
    lock_ttl: int = 10,
) -> Optional[Any]:
    raw = redis.get(key)
    if raw is not None:
        return json.loads(raw)

    lock_key = f"lock:{key}"
    if redis.set(lock_key, "1", nx=True, ex=lock_ttl):
        try:
            value = loader()
            ttl = base_ttl + random.randint(0, max(1, base_ttl // 10))
            if value is None:
                redis.set(key, json.dumps(None), ex=neg_ttl)
            else:
                redis.set(key, json.dumps(value), ex=ttl)
            return value
        finally:
            redis.delete(lock_key)

    # Someone else is loading; brief wait then one more get
    time.sleep(0.02)
    raw = redis.get(key)
    if raw is not None:
        return json.loads(raw)
    # Last resort: load without holding the lock (rare)
    return loader()
```

C'est volontairement plat. La prod ajoute métriques, circuit breakers, codecs typés, et souvent un wrapper soft-TTL. La structure compte : **get, lock, load, set avec jitter, unlock, retry**.

---

## Checklist avant de dire que le cache est "fini"

* [ ] Chaque clé de cache a un TTL (ou une raison documentée de ne pas en avoir).
* [ ] Les préfixes chauds ont du jitter et une protection stampede.
* [ ] Les writes commitent en DB avant delete/update du cache.
* [ ] Negative caching sur les lookups à fort trafic qui peuvent misser.
* [ ] Hit ratio et latence découpés par préfixe de clé.
* [ ] Comportement documenté quand Redis est down.
* [ ] Candidats hot key listés (config, homepage, SKU flash) avec plan L1 ou edge.
* [ ] `maxmemory` et politique d'eviction fixés exprès, pas par défaut d'image.

---

## Clôture

Le cache Redis n'est pas "mettre GET/SET autour de la requête". C'est un ensemble de contrats sur la **fraîcheur**, la **charge sous miss**, et **qui possède la clé après un write**. Le cache-aside couvre la plupart du code app. Le contrôle de stampede et le jitter de TTL gardent la base en vie quand des clés populaires meurent. L'invalidation garde la vérité produit honnête. Les plans hot key empêchent un blob célèbre de posséder le cluster.

Commencez par un chemin, mesurez hit ratio et QPS DB sur ce chemin, puis ajoutez locks et L1 là où les graphes l'exigent. Les patterns ci-dessus sont ennuyeux exprès. L'ennuyeux, c'est ce qui survit à l'on-call.
