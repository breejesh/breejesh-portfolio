---
title: "Comment fonctionne le DNS pour les ingénieurs : chemin de résolution, enregistrements, TTL et dig"
description: "Le chemin de résolution DNS du stub au nameserver autoritaire, les enregistrements que vous éditez vraiment (A, AAAA, CNAME, MX, TXT), comment TTL et caches retardent chaque changement, et comment déboguer avec dig."
date: "2026-07-02"
tags: [Cybersécurité et Réseaux]
coverImage: /assets/images/how-dns-works-for-engineers.webp
previewImage: /assets/images/how-dns-works-for-engineers.webp
---


Le DNS est l'annuaire d'internet, et cette analogie ne suffit qu'à moitié. Un ingénieur n'a pas besoin d'un conte sur "la recherche de noms." Il vous faut le **chemin de résolution**, les **types d'enregistrements que vous publiez**, comment **TTL et caches** retardent chaque changement, et un réflexe **`dig`** quand la prod dit que l'hôte va bien et les utilisateurs disent le contraire.

Si vous déployez des apps, basculez des domaines, configurez le mail ou déboguez "ça marche sur ma machine" après un changement DNS, voici la carte.

---

## Ce à quoi le DNS répond vraiment

Vous tapez `api.example.com`. Votre machine a besoin d'une IP (ou d'un échec). Le DNS renvoie des **resource records** pour un nom et un type. La question courante est "quel est le A/AAAA de ce hostname ?" Le mail demande des MX. Certificats et anti-spam demandent des TXT. Load balancers et multi-cloud s'appuient souvent sur des CNAME.

Le DNS n'est **pas** le routage HTTP, ni le TLS, ni le load balancing. Ceux-ci commencent une fois que le client a une adresse de destination (ou qu'une chaîne CNAME se termine sur une). Le DNS est l'étape annuaire avant le handshake TCP.

---

## Le chemin de résolution

La plupart des lookups ne sont pas "un serveur répond à tout." C'est une courte chaîne de rôles.

### Rôles

| Rôle | Qui | Travail |
| --- | --- | --- |
| **Stub resolver** | OS / libc / runtime de votre langage | Interroge un recursive resolver ; a souvent un tout petit cache local |
| **Recursive resolver** | FAI, `1.1.1.1`, `8.8.8.8`, DNS d'entreprise, resolver VPC | Parcourt la hiérarchie, met en cache, renvoie le résultat final au stub |
| **Root nameservers** | Opérateurs de la zone racine (`.`) | Pointent vers les serveurs du bon TLD (`com.`, `org.`, `io.`, …) |
| **TLD nameservers** | Registre de ce TLD | Pointent vers les nameservers **autoritaires** du domaine |
| **Authoritative nameserver** | Votre hébergeur DNS (Route 53, Cloudflare, NS1, BIND/PowerDNS maison) | Détient les enregistrements que vous publiez pour `example.com` |

Le recursive fait le gros du travail. Votre laptop parle presque jamais aux root ou TLD directement. Les réseaux d'entreprise et les VPC cloud forcent souvent tous les stubs via un recursive d'entreprise ou de VPC. D'où la classe réelle de bugs "ça résout chez moi mais pas dans le cluster."

### Chemin heureux pour le A de `www.example.com`

1. L'app ou le navigateur demande au stub : "A pour `www.example.com` ?"
2. Le stub demande au recursive configuré (DHCP, `/etc/resolv.conf` ou défaut de la plateforme).
3. Si le recursive a un **cache frais** pour ce nom et ce type, il répond tout de suite. Fin.
4. Sinon le recursive part de la root (ou utilise des NS déjà en cache pour `com.` / `example.com`) :
   - Root : "pour `com.`, demande à ces NS de TLD."
   - TLD : "pour `example.com`, demande à ces NS autoritaires" (souvent avec glue A/AAAA pour les hôtes NS).
   - Autoritaire : "voici le A (ou CNAME, ou NXDOMAIN, ou NODATA)."
5. Le recursive cache selon le TTL (et les règles de cache négatif en cas d'échec), renvoie la réponse au stub.
6. Le client ouvre une connexion vers la ou les IP.

Les requêtes passent surtout en **UDP** port 53. Les grosses réponses ou les réponses tronquées basculent en **TCP** 53. DNS over HTTPS (DoH) et DNS over TLS (DoT) encapsulent les mêmes questions dans des transports chiffrés ; la hiérarchie ne change pas.

### Itération vs récursion

- **Requête récursive** : le stub dit "résous-moi ça complètement." Le recursive fait la marche.
- **Requête itérative** : un serveur répond par un referral ("demande à ces autres serveurs") au lieu de la réponse finale. Les resolvers utilisent des requêtes itératives contre root/TLD/autoritaire tout en servant des clients récursifs.

Si vous pointez `dig` vers un serveur autoritaire sans attendre de récursion, vous pouvez voir des referrals ou un refus de récursion. C'est normal.

---

## Types d'enregistrements que vous éditerez

Vous n'avez pas besoin de tous les RR. Ces cinq couvrent l'essentiel du travail produit.

### A et AAAA

| Type | Signification |
| --- | --- |
| **A** | Adresse IPv4 d'un nom |
| **AAAA** | Adresse IPv6 d'un nom |

Exemple :

```
api.example.com.    300    IN    A       203.0.113.10
api.example.com.    300    IN    AAAA    2001:db8::10
```

Plusieurs enregistrements A/AAAA signifient plusieurs réponses. Le client choisit (souvent la première, parfois round-robin ou happy-eyeballs entre familles). Dual-stack signifie A et AAAA ; un AAAA cassé avec de l'IPv6 mal en point est le classique "le site ne marche que pour certains utilisateurs."

### CNAME

**CNAME** mappe un nom vers **un autre nom**, pas une IP.

```
www.example.com.    300    IN    CNAME    lb.example.net.
```

Règles qui piquent :

1. Un nom avec un CNAME ne devrait pas porter d'autres données au même owner (pas de A + CNAME ensemble). Un CNAME à l'apex/`@` est souvent interdit ou remplacé par des ALIAS/ANAME du fournisseur.
2. Les resolvers suivent la chaîne jusqu'à A/AAAA (ou échouent). Les chaînes longues ajoutent latence et points de panne.
3. Le TTL des CNAME intermédiaires compte encore ; la durée de vie effective en cache est limitée par la chaîne.

Utilisez un CNAME quand le vendor possède le hostname cible (CDN, LB managé). Utilisez A/AAAA quand vous figez des IP que vous contrôlez.

### MX

**MX** dit aux systèmes de messagerie où livrer pour un domaine.

```
example.com.    3600    IN    MX    10 mail1.example.com.
example.com.    3600    IN    MX    20 mail2.example.com.
```

Le numéro de préférence le plus bas est essayé en premier (10 avant 20). La cible MX doit résoudre en A/AAAA ; évitez de pointer un MX sur un simple CNAME si vous pouvez (certains fournisseurs avertissent encore ou cassent).

### TXT

**TXT** est du texte libre. Usages courants :

- SPF, DKIM, DMARC pour l'auth mail
- Vérification de domaine cloud et SaaS (`google-site-verification=…`, challenges ACME DNS-01)
- Flags produit arbitraires (rare ; préférez un vrai config store)

```
example.com.    300    IN    TXT    "v=spf1 include:_spf.google.com ~all"
```

Les longs TXT peuvent être découpés en morceaux quotés. Au debug, concaténez les chaînes dans l'ordre.

### Carte rapide

| Type | Répond | Owner typique |
| --- | --- | --- |
| A / AAAA | Où se connecter (IP) | Hôtes d'API, apex (sans ALIAS) |
| CNAME | Nom canonique | `www`, sous-domaines hébergés vendor |
| MX | Échangeurs de mail | Apex / domaine mail |
| TXT | Chaînes de politique et de preuve | Apex, `_dmarc`, noms ACME |

NS et SOA comptent pour l'autorité de zone et le cache négatif. SRV apparaît dans la découverte de services et certains protocoles. Apprenez-les quand vous opérez vos propres zones ou une découverte style Kubernetes ; le quotidien des déploiements touche surtout les cinq ci-dessus.

---

## TTL et cache : pourquoi le DNS "prend une éternité"

Le **TTL** (time to live) est le temps pendant lequel un **resolver qui cache** peut réutiliser une réponse sans re-demander à l'autorité. Il est en secondes sur l'enregistrement.

```
api.example.com.    60    IN    A    203.0.113.10
```

Ici, les recursive peuvent cacher ce A jusqu'à 60 secondes. Votre navigateur, OS, runtime, JVM et sidecar peuvent cacher **en plus**. Donc "j'ai baissé le TTL il y a une heure" ne veut pas dire que tous les clients ont basculé à la même seconde.

### Habitudes TTL pratiques

| Situation | Plage courante | Notes |
| --- | --- | --- |
| Apex / site stable | 300s-3600s | OK quand les IP bougent rarement |
| Avant un cutover | Baisser tôt (60s-300s) | Baissez le TTL **avant** la fenêtre pour que les caches expirent |
| Après cutover | Remonter une fois stable | Évite de marteler l'autoritaire et absorbe les micro-coupures |
| Failover fréquent | TTL bas + DNS health-aware ou un chemin hors DNS | Le DNS seul est un failover grossier |

Les réponses négatives (NXDOMAIN, NODATA) sont aussi mises en cache, souvent via les champs SOA **MINIMUM** / negative-TTL. Un delete raté peut coller des minutes même si l'autorité est "déjà corrigée."

### Où se cachent les réponses

1. Cache DNS du navigateur
2. Cache du stub OS
3. Cache du recursive d'entreprise ou VPC
4. Cache des resolvers publics (partagé entre beaucoup d'utilisateurs)
5. Autoritaire (source de vérité, mais pas encore ce que voit chaque client)

Quand quelqu'un dit "le DNS est à jour," demandez **quelle couche il a vérifiée**. Autoritaire correct + recursive périmé, c'est l'histoire classique de cutover.

---

## Déboguer avec dig

`dig` est l'outil standard. Préférez-le à `nslookup` pour des flags clairs et des messages complets.

### Lookups de base

```bash
# A par défaut via les resolvers système
dig api.example.com

# Type précis
dig AAAA api.example.com
dig MX example.com
dig TXT example.com
dig CNAME www.example.com

# Réponse courte seulement
dig +short api.example.com
dig +short MX example.com
```

### Interroger un serveur précis

```bash
# Recursive public
dig @1.1.1.1 api.example.com
dig @8.8.8.8 api.example.com

# Autoritaire (NS du parent ou du panneau)
dig @ns-123.awsdns-45.com api.example.com
```

Comparez **autoritaire** et **recursive**. Si l'autorité est juste et que Google/Cloudflare montrent encore l'ancienne IP, vous attendez le TTL ou vous regardez un autre jeu d'enregistrements (mauvais nom, mauvais type, mauvaise zone de compte).

### Tracer la hiérarchie

```bash
dig +trace api.example.com
```

`+trace` parcourt root → TLD → autoritaire comme un recursive à froid. Idéal pour "la délégation est cassée ?" et les soucis de glue.

### Flags utiles

| Flag | Usage |
| --- | --- |
| `+short` | Réponses compactes pour scripts |
| `+norecurse` | Sans bit RD ; voir les referrals |
| `+trace` | Chemin itératif complet depuis la root |
| `+dnssec` | Données RRSIG/DNSKEY en validation |
| `+tcp` | Forcer TCP (troncature ou firewall) |
| `-p 53` | Port non default (lab / listeners alternatifs) |

### Lire la ligne de status

Dans la section `HEADER`, le **status** compte :

| Status | Signification |
| --- | --- |
| **NOERROR** | Requête OK (la section answer peut être vide en NODATA) |
| **NXDOMAIN** | Le nom n'existe pas |
| **SERVFAIL** | Échec du resolver (chaîne cassée, DNSSEC, timeout upstream) |
| **REFUSED** | Le serveur refuse de répondre à cette query |

Notez aussi les **flags** : `aa` signifie réponse autoritaire pour cette zone. `ra` signifie récursion disponible. `ad` concerne les données authentifiées quand la validation DNSSEC est en jeu.

### Exemple : checklist de cutover avec dig

```bash
# 1. Vers quels NS le parent délègue-t-il ?
dig NS example.com +short

# 2. Que dit l'autorité maintenant ?
dig @YOUR_AUTH_NS api.example.com A +noall +answer

# 3. Que disent les grands recursive publics ?
dig @1.1.1.1 api.example.com A +noall +answer
dig @8.8.8.8 api.example.com A +noall +answer

# 4. TTL restant sur la réponse en cache (depuis un recursive)
dig api.example.com A
# Regardez le nombre TTL sur la answer ; il décompte sur ce resolver
```

Si vous utilisez du split-horizon DNS (réponses internes ≠ publiques), testez toujours depuis un hôte de la même classe réseau que le client qui échoue.

---

## Modes de panne que les ingénieurs croisent vraiment

1. **TTL non baissé avant le cutover.** Les vieilles IP restent dans les caches recursive du monde. Planifiez la baisse du TTL des heures ou un jour à l'avance pour les enregistrements populaires.
2. **CNAME à l'apex.** Certaines UIs l'autorisent ; beaucoup de standards et de fournisseurs non. Utilisez ALIAS/ANAME ou A/AAAA simples.
3. **Mauvais type d'enregistrement.** Les clients demandent AAAA, vous n'avez publié que A (ou l'inverse). Ou le mail casse parce que le MX pointe encore l'ancien hôte alors que le A a bougé.
4. **Glue / NS désalignés.** Vous avez changé les nameservers chez le registrar mais la nouvelle zone est vide, ou les hôtes NS ne résolvent pas. `dig +trace` le montre.
5. **Override du recursive d'entreprise.** À la maison le laptop utilise 1.1.1.1 ; au bureau le trafic passe par un resolver filtrant avec son propre cache et ses politiques.
6. **Cache DNS au niveau app.** Java, pools Node, Envoy et OS mobiles ignorent votre modèle mental "dig est vert donc l'app est verte."
7. **Search domains et ndots.** Les listes de recherche de `/etc/resolv.conf` transforment `api` en `api.default.svc.cluster.local` dans Kubernetes. C'est du DNS, et ça surprend.

Le DNS est correct quand **le nom, le type, la vue (publique vs privée) et la couche de cache** correspondent au client qui vous intéresse. Corriger seulement le panneau autoritaire est nécessaire, pas suffisant.

---

## Modèle mental minimal

1. Le stub demande au recursive ; le recursive marche root → TLD → autoritaire (sauf hit de cache).
2. Vous publiez des **enregistrements** (A, AAAA, CNAME, MX, TXT, …) chez le serveur **autoritaire**.
3. Le **TTL** contrôle le retard possible des caches face à vos éditions.
4. **`dig @server name TYPE`** dit ce qu'une couche croit maintenant.
5. Les pannes après un changement DNS sont surtout du lag de cache, un mauvais nom/type, ou une délégation cassée, pas "internet est down."

Maîtrisez ce chemin et `dig` cesse d'être un sort obscur pour devenir le premier outil dès que le hostname est suspect.

