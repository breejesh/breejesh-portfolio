---
title: "Bonnes pratiques de logging structuré pour les services en production"
description: "Logs JSON, IDs de corrélation, niveaux, rédaction du PII et contrôle de cardinalité. Ce qui accélère les incidents sans faire exploser la facture de logs."
date: "2026-07-03"
tags: [Algorithmes et Structures]
coverImage: /assets/images/structured-logging-best-practices.webp
previewImage: /assets/images/structured-logging-best-practices.webp
---


Les logs en texte brut suffisaient quand une machine faisait tourner une appli. Avec beaucoup de services, beaucoup de réplicas et un shipper qui transforme chaque ligne en événement interrogeable, les chaînes libres deviennent du bruit coûteux. Le logging structuré corrige la forme: chaque ligne est un petit document avec des clés stables. Tu cherches par champ, pas par regex sur de la prose.

Voici la checklist que je veux sur chaque service de prod: JSON (ou équivalent), IDs de corrélation, niveaux honnêtes, pas de PII brut, et règles strictes sur les champs à forte cardinalité. Pas de catalogue théorique. Les habitudes qui réduisent le temps moyen pour comprendre.

---

## Pourquoi la structure bat les slogans

Une ligne comme `Error processing payment for user 42` se lit bien dans un terminal. À 3 h du matin, avec cinq microservices et une dépendance instable, il te faut:

* tous les événements d'**une requête** à travers les services
* des filtres sur `status_code`, `error_code`, `service`, `env` sans greper de la poésie
* des dashboards et alertes qui ne cassent pas quand quelqu'un reformule un message

Le logging structuré te donne des champs. Le message humain reste, mais ce n'est plus la seule interface.

Forme typique (les noms de champs varient selon l'équipe; choisis une convention et garde-la):

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

Mêmes clés en succès et en échec. Même style d'imbrication. C'est ce qui rend les requêtes et les règles d'alerte ennuyeuses, et c'est le but.

---

## Émets du JSON (ou un format clé-valeur stable)

**Préfère une ligne de log = un objet JSON** sur stdout/stderr. Laisse la plateforme (Fluent Bit, Vector, agent CloudWatch, agent Datadog, etc.) shipper et indexer. N'invente pas un format multi-lignes custom sauf raison dure.

Règles pratiques:

1. **Un événement par ligne.** Les stack traces multi-lignes vont dans un seul champ string JSON (`stack`) ou sont rattachées par le shipper. Les lignes coupées au milieu du JSON sont du poids mort.
2. **Timestamps ISO-8601 en UTC** (`ts` ou `@timestamp`). L'heure locale dans les logs, c'est comment tu perds une heure à chaque changement d'heure.
3. **Schéma stable pour les champs cœur.** `level`, `msg`, `service`, `env`, `version`, IDs de corrélation. Ajoute les champs métier à côté, pas sous des noms top-level aléatoires chaque sprint.
4. **Des libs, pas `print`.** Utilise `structlog`, `zap`, `slog`, `pino`, l'encodeur JSON de `logback`, ou le standard de la stack. Configure une fois au démarrage du process.

Esquisse Python minimale dans l'esprit de `structlog` (toute lib avec la même idée convient):

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

Node avec `pino`, même contrat: objets en entrée, JSON en sortie, child loggers pour le contexte de requête.

**Évite** l'interpolation de chaînes comme enregistrement principal:

```python
# Mauvais: seulement une string; difficile à filtrer proprement
logger.info(f"order {order_id} created for {email}")

# Mieux: message + champs
logger.info("order_created", order_id=order_id, user_id=user_id)
```

Garde `msg` court et stable (`order_created`, `payment_capture_failed`). Mets les variables dans les champs. La cardinalité du *message* reste basse, et tu as des dimensions pour requêter.

---

## IDs de corrélation: suis une requête à travers le mesh

Quand le service A appelle B et B appelle C, les logs isolés sur chaque hôte ne racontent pas d'histoire. Il te faut un ID qui voyage avec la requête.

Deux motifs courants (souvent les deux):

| ID | Rôle |
| --- | --- |
| **`trace_id` / `span_id`** | OpenTelemetry / tracing distribué. Idéal si tu as déjà des traces. |
| **`request_id` / `correlation_id`** | UUID applicatif posé en bordure (API gateway ou premier service) et passé à chaque hop. |

En pratique:

1. La bordure (ou le premier service) lit `X-Request-Id` / `traceparent`. Si absent, génère un UUID.
2. Mets cet ID dans le **contexte de logging** de la requête (context var, MDC, child logger du middleware).
3. Propage le même header (et `traceparent` W3C si tu utilises OTel) sur HTTP/gRPC/messages de file sortants.
4. Chaque ligne de log sur ce chemin de requête porte les IDs automatiquement. Les call sites ne doivent pas les passer à la main à chaque fois.

```python
# Pseudo-code middleware
request_id = request.headers.get("x-request-id") or str(uuid4())
structlog.contextvars.clear_contextvars()
structlog.contextvars.bind_contextvars(
    request_id=request_id,
    trace_id=extract_trace_id(request),
)
# Tous les logs de cette requête portent déjà request_id / trace_id
```

**Workers de files et crons** ont besoin de la même discipline. Pour le travail async, mets `request_id` / `trace_id` sur le payload ou les headers à l'enqueue. Pour les crons, génère un `job_run_id` au démarrage et binde-le pour la run.

Si tu ne fais qu'une chose ce trimestre: **des IDs de corrélation de bout en bout**. Le reste est agréable; celui-ci change la réponse aux incidents.

---

## Des niveaux de log qui veulent dire quelque chose

Les niveaux n'aident que si l'équipe s'accorde sur leur sens. Un défaut utile pour les services:

| Niveau | Utilise pour |
| --- | --- |
| **ERROR** | Requête ou job en échec d'une façon qui demande de l'attention. L'opérateur ou l'on-call peut agir. |
| **WARN** | Dégradé mais récupéré ou récupérable: retry OK, fallback utilisé, près de la limite. |
| **INFO** | Jalons métier: requête terminée, job fini, config chargée. |
| **DEBUG** | Détail pour le local ou un diagnostic prod temporaire. Éteint par défaut en prod (ou échantillonné). |

Règles anti fatigue d'alertes:

* **Ne logue pas ERROR pour les erreurs client attendues** (validation 400, auth 401 pour mauvais tokens). Utilise INFO ou WARN avec `status` et `error_code`. ERROR, c'est quand *ton* système échoue ou qu'un upstream casse la requête alors qu'il ne devrait pas.
* **Un ERROR par chemin d'échec**, pas un ERROR par tentative de retry plus un final. Les retries peuvent être DEBUG/WARN; l'échec terminal est ERROR.
* **INFO ne doit pas inonder.** Préfère un log de fin de requête avec `duration_ms` et `status` plutôt que le bruit "start", "mid", "end". Les services à fort QPS échantillonnent souvent INFO ou s'appuient sur les métriques pour le volume et sur les logs pour les échecs + un échantillon de succès.
* **DEBUG en prod** seulement derrière un flag, un header ou un changement de config de courte durée. Laisser DEBUG sur un chemin bavard, c'est brûler le budget logs en un après-midi.

Mappe soigneusement les niveaux des libs. Certains frameworks mettent "warn" par défaut pour les deprecations. Ajuste pour que les dashboards collent à l'attente humaine.

---

## PII et secrets: jamais la valeur brute

Les logs survivent à la requête. Ils atterrissent dans des SaaS tiers, du cold storage, des outils support et des exports laptop. Traite-les comme un **magasin de données au contrôle d'accès faible** jusqu'à preuve du contraire.

**Ne logue jamais:**

* mots de passe, API keys, tokens, cookies de session, headers Authorization
* numéros de carte complets, CVV, comptes bancaires
* numéros d'identité nationale, passeports, dossiers santé complets là où la régulation s'applique
* bodies request/response bruts qui peuvent contenir tout ça

**Souvent rédigé ou tokenisé:**

* email, téléphone, nom complet (préfère `user_id` comme clé de jointure)
* adresse IP (selon politique; souvent hashée ou tronquée)
* adresse postale, géo précise

Motifs qui marchent:

```python
# Préfère des IDs opaques stables
log.info("login_ok", user_id=user.id)

# Si tu dois inclure un email pour le support, hash ou masque partiel
log.info("invite_sent", email_domain=email.split("@")[-1])  # ou hmac_sha256(email, pepper)
```

Défense en profondeur:

1. **Allowlist de champs** à la frontière du logger pour bodies et headers HTTP. Deny par défaut.
2. **Middleware de rédaction** sur les noms de headers courants (`authorization`, `cookie`, `x-api-key`).
3. **Checklist de code review**: nouvelles lignes avec `payload`, `body`, `headers` ou profil utilisateur méritent un second regard.
4. **Rétention et accès**: rétention plus courte pour les index très debug; rôles restreints pour la recherche prod.

Une fuite dans les logs reste une fuite. "On ne garde les logs que 7 jours" ne répare pas un secret indexé et copié.

---

## Cardinalité: le coût silencieux

La cardinalité, c'est le nombre de valeurs uniques qu'un champ peut prendre. Les plateformes de logs facturent souvent au volume et indexent ou facettent les champs. Les champs à forte cardinalité explosent le coût et tuent la perf des requêtes.

| Champ | Cardinalité | Notes |
| --- | --- | --- |
| `env`, `service`, `level`, `http.method` | Basse | Facettes sûres |
| `http.status`, `error_code`, `region` | Basse-moyenne | En général OK |
| `user_id`, `order_id`, `request_id` | Haute | OK pour la recherche; évite comme labels de métriques |
| `msg` avec IDs interpolés | Extrême | `payment failed for order 123` × millions |
| URL complète avec query string | Extrême | Template de path: `/users/{id}` |

Règles:

1. **Valeurs de `msg` stables.** Utilise `payment_capture_failed`, pas `payment capture failed for order {id}`. Mets l'id dans `order_id`.
2. **Templates de path, pas d'URLs brutes.** Le middleware doit normaliser `/users/42` en `/users/:id` (ou le pattern de route du framework) pour le champ que tu graphes. Garde le path brut dans un autre champ seulement si tu acceptes le coût.
3. **Ne transforme pas chaque champ de log en label de métrique.** Les métriques veulent des dimensions à basse cardinalité. Les logs peuvent porter `user_id` pour du find-by-id; les labels Prometheus non.
4. **Borne les strings non bornées.** Tronque messages d'exception et bodies d'erreur tiers (ex. 2 KB). Une page HTML d'erreur de 2 MB dans un champ de log, c'est une panne auto-infligée pour le shipper.
5. **Échantillonne les chemins chauds.** Health checks chaque seconde depuis chaque réplica: drop ou sample agressif. Pareil pour les GET réussis sur un endpoint très lu si les métriques couvrent déjà le trafic.

Les erreurs de cardinalité se voient comme "notre facture logs a doublé après un meilleur logging". Meilleur logging, ce n'est pas plus de strings uniques. Ce sont de meilleurs champs.

---

## Que mettre sur un log de fin de requête

Une ligne INFO solide (ou DEBUG si échantillonné) en fin de requête bat cinq demi-lignes:

* `request_id` / `trace_id`
* `http.method`, template de route, `http.status`
* `duration_ms`
* `user_id` ou sujet d'auth le cas échéant (id opaque)
* `error_code` quand status >= 400
* éventuellement `bytes_out`, `db_queries` ou feature flags quand ce sont des hooks de debug courants

Les erreurs: une seconde ligne ou la même en ERROR avec `error.type`, `error.message` (sanitisé) et `stack` optionnel.

Appels sortants: logue le nom du **client**, le service cible, le status, la durée et les IDs de corrélation. C'est comme ça que tu vois quelle dépendance a mangé le budget latence sans ouvrir trois repos.

---

## Le binding de contexte bat la soupe de paramètres

Un contexte par thread ou par requête garde les call sites propres:

```
début requête -> bind request_id, user_id, route
   code service -> log.info("inventory_reserved", sku=sku, qty=qty)
   ...
fin requête -> log de fin; clear context
```

Sans binding, chaque helper omet les champs de corrélation ou traîne un `log_ctx` pour toujours. Vide le contexte en fin de requête pour que les threads worker ou tâches async ne fuient pas d'IDs vers le job suivant.

---

## Aligne logs, métriques et traces

Les logs répondent "que s'est-il passé pour cet id". Les métriques répondent "à quelle fréquence / à quelle lenteur". Les traces répondent "où le temps est allé entre services".

* Préfère les **métriques** pour rate, latence, saturation (RED/USE). N'invente pas une ligne de log juste pour la compter plus tard.
* Préfère les **traces** pour la latence multi-hop. Les logs doivent porter `trace_id` pour passer d'un hit de log à l'UI de traces.
* Préfère les **logs** pour les événements rares, le détail d'erreur et les faits type audit qui ont besoin de contexte payload (toujours rédigé).

Si ton seul signal, ce sont les logs, chaque question devient du full-text search. Ça marche jusqu'à ce que ça ne marche plus.

---

## Checklist production courte

À utiliser en code review ou dans le template d'un nouveau service:

1. **JSON (ou équivalent) sur stdout**, un événement par ligne, timestamps UTC.
2. **Champs cœur** sur chaque ligne: `service`, `env`, `version`, `level`, `msg`.
3. **Corrélation**: `request_id` et/ou contexte de trace W3C / OTel à chaque hop, y compris les files.
4. **Niveaux**: ERROR pour les pannes système actionnables; pas pour les 4xx de routine.
5. **Pas de secrets ni de PII brut**; préfère les ids opaques; rédige headers et bodies par défaut.
6. **Messages et routes à basse cardinalité**; haute cardinalité seulement comme champs de recherche, pas comme labels de métriques.
7. **Log de fin** avec status et durée; échantillonne les succès sur les chemins chauds si le volume fait mal.
8. **Lib configurée une fois**; pas de `print` ad hoc ni de logging string-only dans le nouveau code.
9. **Rétention et accès** documentés; les index debug ne sont pas un data lake gratuit.

---

## Modes de panne courants

| Symptôme | Cause probable |
| --- | --- |
| Impossible de relier une plainte user entre services | Headers de corrélation absents ou perdus |
| Facture logs qui double après un "petit" changement | DEBUG laissé allumé, health checks logués, ou `msg` interpolé |
| Alertes qui partent sur des typos utilisateur | 4xx logués en ERROR |
| Security trouve des tokens dans ELK | Logging body/header sans allowlist |
| Requêtes timeout sur facettes `user_id` | Champ haute cardinalité en index/facette par défaut |
| Stack traces coupées en lignes cassent le JSON | Sortie multi-lignes sans stack dans un seul champ |

Aucun de ces cas n'a besoin d'un nouveau vendor. Ils ont besoin de conventions et de quelques lignes de middleware.

---

## Pour finir

Le logging structuré n'est pas un débat de format. C'est un contrat d'exploitation: chaque service parle le même langage de champs, porte des IDs à travers les frontières, refuse de dumper des secrets, et garde la cardinalité sous contrôle pour que la recherche reste rapide et la facture ennuyeuse.

Commence par JSON + IDs de corrélation + politique de niveaux + rédaction. Ajoute le sampling avancé et les schema registries quand le basique tient sous charge. Au prochain incident, tu veux une requête sur `request_id`, pas cinq greps et un espoir.

