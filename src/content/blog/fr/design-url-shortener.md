---
title: "Concevoir un raccourcisseur d'URL : encodage, stockage, cache, redirections et scale"
description: "System design d'un raccourcisseur d'URL expliqué aux débutants : tickets de vestiaire, parcours création et redirection, Base62, stockage, cache, et scale étape par étape."
date: "2026-04-02"
tags: [Design Système et Architecture]
coverImage: /assets/images/design-url-shortener.webp
previewImage: /assets/images/design-url-shortener.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** System design d'un raccourcisseur d'URL expliqué aux débutants : tickets de vestiaire, parcours création et redirection, Base62, stockage, cache, et scale étape par étape.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Un raccourcisseur d'URL transforme une longue adresse web en une courte et, quand quelqu'un clique, envoie le navigateur vers la page d'origine. Des produits comme TinyURL et bit.ly font cela. Les liens courts de presque toutes les apps aussi.

Pensez à un vestiaire. Vous confiez un long manteau lourd. Le préposé vous donne un petit numéro sur un ticket. Plus tard vous montrez le numéro et récupérez le même manteau. Le numéro n'est pas le manteau. C'est un ticket qui pointe vers l'endroit où le manteau est rangé.

Une URL courte, c'est la même idée sur internet :

- L'URL longue est le manteau (l'adresse complète).
- Le code court est le numéro de vestiaire (ou un surnom pour cette longue adresse).
- Le raccourcisseur est le préposé qui tient la liste : numéro → manteau.

Ce billet enseigne le design comme une première leçon. Sans jargon présumé. On parcourt une création, un clic, puis l'encodage, le stockage, le cache et le scale.

---

## Quel problème résout-on ?

Les URL longues sont laides et difficiles à partager :

```
https://shop.example.com/products/category/electronics/laptops/2026/model-x?utm_source=newsletter&ref=homepage
```

Un raccourcisseur les transforme en quelque chose comme :

```
https://sho.rt/aB3xY9q
```

Deux jobs comptent :

1. **Créer :** accepter une URL longue, inventer un code court, mémoriser le mapping, renvoyer le lien court.
2. **Rediriger :** quand quelqu'un ouvre le lien court, retrouver l'URL longue et y envoyer le navigateur.

Tout le reste (stats de clics, noms personnalisés, expiration) est en plus. D'abord réussir create et redirect.

---

## Le vestiaire en un schéma

```
Chemin de création (remettre le manteau)
  Vous → API du raccourcisseur → choisir un code → sauver "code → URL longue" → renvoyer le lien court

Chemin de redirection (réclamer le manteau)
  Un ami clique → le raccourcisseur cherche le code → répond "va vers l'URL longue"
  → le navigateur ouvre la vraie page
```

Le domaine court (`sho.rt`) est le comptoir du vestiaire. La partie après le slash (`aB3xY9q`) est le numéro sur votre ticket.

---

## Parcours : créer un lien court

Imaginez que vous voulez partager une page produit. Vous appelez l'API de création.

**Requête (simplifiée)**

```http
POST /api/v1/links
Content-Type: application/json

{
  "url": "https://shop.example.com/products/laptops/model-x"
}
```

**Ce que fait le serveur, étape par étape**

1. **Vérifier l'URL.** N'autoriser que les liens web normaux (`http` ou `https`). Rejeter les schémas bizarres potentiellement dangereux. Limiter la longueur pour que personne ne colle un roman.
2. **Fabriquer un code court.** Par exemple `aB3xY9q`. Comment on l'invente est dans la section encodage. Pour l'instant, traitez-le comme un numéro de ticket unique.
3. **Enregistrer le mapping** en base :

| code | long_url |
| --- | --- |
| aB3xY9q | https://shop.example.com/products/laptops/model-x |

4. **Vous renvoyer l'URL courte :**

```http
201 Created
{
  "code": "aB3xY9q",
  "short_url": "https://sho.rt/aB3xY9q",
  "long_url": "https://shop.example.com/products/laptops/model-x"
}
```

Vous collez `https://sho.rt/aB3xY9q` dans un chat. Terminé. Créer est le chemin rare. La plupart du trafic, ce sont des clics, pas des créations.

Extras optionnels à la création :

- **Alias personnalisé :** vous demandez `launch` au lieu d'un code aléatoire. Le système vérifie que le nom est libre et non réservé (`api`, `health`, etc.).
- **TTL (durée de vie) :** le lien meurt après un temps, comme un ticket de vestiaire temporaire.

---

## Parcours : un clic utilisateur (redirection)

Votre ami tape sur le lien court. Suivez le trajet complet.

```
1. Le navigateur demande : GET https://sho.rt/aB3xY9q
2. La requête arrive sur un load balancer, puis un service de redirection.
3. Le service demande au cache : « Tu connais aB3xY9q ? »
   - Hit : utilise tout de suite l'URL longue stockée.
   - Miss : demande à la base, puis remplit le cache pour la prochaine fois.
4. Le service répond avec une redirection HTTP :
   statut 302 (ou 301)
   en-tête Location : https://shop.example.com/products/laptops/model-x
5. Le navigateur suit Location et charge la vraie page.
6. Optionnellement, le service dépose un événement « quelqu'un a cliqué » sur une file latérale pour l'analytics.
   Ce travail ne doit pas ralentir la redirection.
```

Si le code est inconnu, expiré ou désactivé, renvoyez **404**, pas une devinette.

### 301 vs 302 en mots simples

| Statut | Signification | Pourquoi ça compte |
| --- | --- | --- |
| **301** | « Ce déménagement est permanent. » | Navigateurs et CDN peuvent mémoriser fort. Moins de hits sur vos serveurs. Les compteurs de clics peuvent sous-compter les vrais clics humains. |
| **302** | « Ce déménagement est temporaire. » | Les clients re-interrogent plus souvent votre service. Mieux si vous voulez des analytics de clics plus justes. |

Défaut d'entretien quand l'analytics compte : **302**. Si vous voulez surtout des redirections peu chères et des comptes approximatifs, **301** convient. Les vrais produits choisissent selon le besoin, pas la mode.

---

## Encodage : comment on invente les codes courts

Il faut un petit alphabet sûr dans les URL. Le choix habituel est **Base62** :

```
0-9  a-z  A-Z
```

Ce sont 62 symboles. Sans `+` ni `/` que Base64 force à échapper.

### Combien de codes obtient-on ?

| Longueur du code | Capacité approximative |
| --- | --- |
| 6 caractères | environ 57 milliards |
| 7 caractères | environ 3,5 billions |
| 8 caractères | environ 218 billions |

Sept caractères est le choix d'entretien courant : assez court pour partager, assez grand pour croître énormément.

### Trois façons de fabriquer un code

**A. Compteur, puis encode (machine de vestiaire)**

1. Prenez le prochain numéro global : 1, 2, 3, … (séquence DB, Redis `INCR`, ou ID distribué).
2. Convertissez ce nombre en caractères Base62.
3. Cette chaîne est votre code.

Avantages : pas de collision accidentelle si le compteur est unique. Histoire simple.

Inconvénients : les codes peuvent être devinables s'ils avancent `…9`, `…a`, `…b` dans l'ordre. Mitigations : partir haut, brouiller les bits avant encode, ou permuter l'alphabet. Traitez quand même les codes comme des tickets publics, pas des secrets.

Image mentale minimale de l'encode Base62 :

```
Nombre 125 → diviser par 62, garder les restes → mapper les restes sur l'alphabet → "21" (forme d'exemple)
```

**B. Hash de l'URL longue**

Hachez l'URL (SHA-256 ou similaire), prenez un préfixe, passez en Base62, vérifiez qu'il est libre. En collision, prenez plus de bits ou ajoutez un sel et réessayez.

Avantages : la même URL longue peut toujours mapper vers le même code court si vous voulez cette règle produit.

Inconvénients : les collisions demandent une boucle de retry. Deux utilisateurs différents peuvent ne pas vouloir partager un code pour la même destination (propriété et analytics se compliquent).

**C. Codes aléatoires**

Tirez 7 caractères Base62 au hasard. Insérez avec contrainte d'unicité. Si pris, tirez encore.

Avantages : durs à deviner. Code simple.

Inconvénients : retries quand l'espace se remplit (à 7 caractères vous êtes tranquilles longtemps). Utilisez un bon générateur aléatoire si la résistance aux devinettes compte.

**Défaut pratique pour entretiens et beaucoup de produits :** ID unique (compteur ou style Snowflake) → brouillage optionnel → Base62. Les alias custom vivent dans la même colonne unique `code` (ou une colonne d'alias unique dédiée).

---

## Stockage : où vit la liste des manteaux

Au fond c'est une **map clé-valeur** : code court → URL longue, plus un peu de métadonnées.

### Table SQL simple

| Colonne | Rôle |
| --- | --- |
| `code` | Clé primaire. Le numéro du ticket. |
| `long_url` | La vraie destination. |
| `user_id` | Qui possède le lien (optionnel). |
| `created_at` | Date de création. |
| `expires_at` | Date de mort (null = pour toujours). |
| `is_active` | Soft delete ou coupure d'urgence. |

Les lookups en redirection sont toujours « trouver par code ». Ce pattern d'accès est parfait pour une clé primaire ou un store clé-valeur.

### Option NoSQL / clé-valeur

Des stores comme DynamoDB ou Cassandra brillent ici :

- Clé de partition : `code`
- Attributs : URL longue et métadonnées
- TTL natif pour l'expiration quand le produit en a besoin

La redirection devient une seule lecture par clé. « Lister tous les liens de l'utilisateur X » demande un index secondaire ou une autre table.

### Ne mettez pas les compteurs de clics sur la ligne chaude

Mettre à jour `clicks = clicks + 1` à chaque redirection transforme un chemin de lecture en bagarre d'écriture. Un lien viral martèle une seule ligne.

Mieux :

1. La redirection ne fait que **lire** le mapping.
2. Émettez un événement de clic vers une file (async).
3. Des workers agrègent les comptes hors ligne.

Pour un petit MVP : Redis `INCR` pour un compteur live est OK si vous acceptez une certaine perte et snapshottez ensuite vers un stockage durable.

---

## Cache : le post-it du préposé

La plupart des clics touchent un petit ensemble de codes populaires. Lire la base à chaque fois est plus lent et plus cher que nécessaire.

**Trois couches dont on parle :**

1. **CDN** devant le domaine court (bonne latence mondiale ; peut compliquer l'analytics exacte).
2. **Redis (ou Memcached)** près de l'app : `code → long_url` avec un TTL.
3. **Base de données** comme source de vérité.

**Redirection avec cache, flux simple :**

```
demander Redis pour le code
si trouvé et encore valide → rediriger
sinon
  demander la DB
  si manquant / inactif / expiré → 404 (et peut-être retenir « introuvable » un moment)
  sinon écrire Redis avec TTL → rediriger
aussi enfiler l'analytics (best effort)
```

**Pourquoi le cache aide :** les lectures mémoire sont rapides. Les tickets populaires restent sur le post-it. Les tickets rares vont encore à la réserve des manteaux (la DB).

**Points de vigilance :**

- **Cache stampede :** beaucoup de requêtes miss en même temps pour un code populaire froid. Coalescer le travail (un fetch, plusieurs attendent) ou un court verrou.
- **Cache négatif :** retenir brièvement « ce code n'existe pas » pour que les scanners ne battent pas la DB.
- **Takedown :** quand vous désactivez un lien, supprimez ou écrasez l'entrée de cache pour que l'ancien Location ne traîne pas.

---

## Chemin de scale, étape par étape

Ne commencez pas par un schéma à 40 boîtes. Grandissez avec la douleur.

### Étape 1 : Une app, une base

Assez pour un side project ou un produit tôt.

```
Client → App (create + redirect) → DB
```

### Étape 2 : Séparer un peu create et redirect, ajouter le cache

Les redirections dominent. Mettez Redis devant les lookups. Gardez create sur la DB primaire.

```
Create   → API → DB
Redirect → API → Redis → (miss) DB
```

### Étape 3 : Beaucoup de serveurs de redirection derrière un load balancer

Les handlers de redirection restent **stateless**. Scalez-les horizontalement. Cache et DB tiennent l'état.

```
Client → LB → Pod de redirection 1..N → Redis → DB
```

### Étape 4 : Astuces base de données orientées lecture

- Réplicas de lecture pour les miss de cache si besoin.
- Gardez l'analytics hors de la table de mappings.
- Partitionnez (shard) la table de mappings par hash du code quand un primary ne tient plus données + index.

### Étape 5 : Chemin d'écriture pour un fort volume de create

Les créations sont en général bien moins nombreuses que les redirections. Quand elles croissent :

- Utilisez un générateur d'ID solide (allocation de blocs, IDs style Snowflake).
- Gardez une contrainte d'unicité sur `code`.
- En multi-région, pilotez les creates pour que deux régions ne mintent jamais le même code.

### Étape 6 : Règles de fiabilité qui comptent

| Règle | Pourquoi |
| --- | --- |
| Redirect est plus important que create | Les clics doivent gagner face aux nouvelles créations. |
| Ne perdez jamais un mapping après un 201 | Le client a déjà partagé le lien court. |
| L'analytics peut perdre sous charge extrême | Mieux un événement de clic manqué qu'une redirection lente. |
| Si Redis est down, retomber sur la DB | Latence plus haute, toujours correct. |
| Fail open sur les métriques, fail closed sur les codes inconnus | Code inconnu → 404, pas une mauvaise page. |

**Intuition de capacité (dites-le à voix haute en entretien) :**

- Les creates peuvent être des milliers par seconde en pic.
- Les redirects peuvent être 100x ou plus.
- Chaque ligne de mapping fait souvent moins de 1 Ko avec métadonnées.
- 100 millions de lignes, ce sont des dizaines de Go, pas des pétaoctets. Le sharding, c'est pour la croissance et le QPS, pas la panique le jour un.

---

## Sécurité et abus (liste courte)

Les codes courts sont des tickets publics. Attendez-vous à :

1. **Deviner des codes** en parcourant l'espace. Rate limit. Préférez des codes plus longs ou brouillés.
2. **Phishing** via votre domaine court de confiance. Scannez ou bloquez les mauvaises destinations. Offrez signalement et takedown.
3. **Spam de creates** qui remplit le stockage. Auth, quotas, CAPTCHA, offres payantes.
4. **Open redirects** seulement si vous laissez un jour l'URL longue contrôlée par l'utilisateur au moment du clic (normalement vous la figez à la création et ne servez que cette valeur stockée).

Ne mettez jamais de secrets dans une URL courte en espérant que personne ne les trouve.

---

## Design de bout en bout que vous pouvez défendre

**Exemple de requirements :** codes Base62 de 7 caractères, alias et TTL optionnels, clics à peu près justes, fort QPS de redirect, multi-AZ.

**Pièces :**

1. Service API pour create / list / delete (avec auth).
2. Service de redirection mince (le hot path reste léger).
3. Générateur d'ID pour des numéros uniques.
4. Store primaire des mappings (SQL ou style DynamoDB).
5. Redis pour `code → url`.
6. File + workers pour les événements de clic et les agrégats.

**Create :** valider → mint le code → insert → renvoyer l'URL courte.

**Redirect :** cache → DB → 302 + Location → événement de clic async.

**Trade-offs à dire à voix haute :**

- L'encodage par compteur est simple et sans collision ; random et hash ont besoin de contrôles d'unicité.
- 301 soulage l'origine ; 302 garde l'analytics plus honnête.
- Des compteurs de clics sur la ligne de mapping fondent sous trafic viral.
- La justesse de la redirection bat l'analytics globale parfaite.

---

## Récap à raconter à un ami

Un raccourcisseur d'URL, c'est un vestiaire pour adresses web.

Vous confiez un long manteau (URL longue). Le préposé vous donne un petit numéro (code court) et l'écrit dans un carnet (base de données). Quand quelqu'un montre le numéro, le préposé cherche et le pointe vers le porte-manteau (redirection avec en-tête `Location`). Pour les numéros populaires, il garde un post-it (cache) pour ne pas courir à la réserve à chaque fois.

L'encodage, c'est comment on imprime les numéros de ticket à partir de compteurs, de hashs ou de dés. Le stockage est la liste durable. Le cache est la vitesse. Scaler, c'est beaucoup de préposés au comptoir, un plus gros carnet si besoin, et ne jamais laisser le compteur de clics geler la file.

Si vous retenez une leçon de production : **protégez le chemin de redirection comme un service d'edge**, et traitez l'analytics comme une conversation de côté, pas comme une étape qui doit finir avant de laisser l'utilisateur passer la porte.

---

## Checklist production

- [ ] Alphabet et longueur de code choisis avec une math de croissance
- [ ] Codes uniques (compteur ou contrainte d'unicité)
- [ ] Validation d'URL et allowlist de schémas
- [ ] Mots réservés pour les alias custom
- [ ] Cache Redis avec TTL et cache négatif
- [ ] Décision 301 vs 302 écrite pour produit et analytics
- [ ] Analytics hors du hot path
- [ ] Expiration et takedown vident le cache
- [ ] Rate limits sur create et sur un volume de redirect suspect
- [ ] Load test clé chaude, clé froide, panne de cache, failover DB
- [ ] Dashboards : QPS create, QPS redirect, ratio de hit cache, latence p99 redirect, taux de 404

