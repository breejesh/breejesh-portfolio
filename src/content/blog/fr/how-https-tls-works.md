---
title: "Comment HTTPS et TLS fonctionnent pour les développeurs : handshake, certificats, SNI, erreurs"
description: "Carte pratique du TLS pour ceux qui livrent des apps web : ce que fait vraiment le handshake, comment les certificats prouvent l'identité, pourquoi le SNI compte sur les IP partagées, et les erreurs de config qui cassent encore la prod."
date: "2026-06-24"
tags: [Sécurité, Réseaux]
coverImage: /assets/images/how-https-tls-works.webp
previewImage: /assets/images/how-https-tls-works.webp
---

HTTPS, c'est HTTP sur TLS. Le navigateur (ou votre client de service) ouvre une connexion TCP, puis enchaîne un **handshake TLS** pour que les deux côtés s'accordent sur des clés et que le client vérifie que le serveur est bien celui qu'il prétend. Ensuite, les octets applicatifs (HTTP/1.1, HTTP/2, HTTP/3 sur QUIC) circulent chiffrés dans la couche d'enregistrements.

Vous n'avez pas à implémenter la crypto. Vous devez savoir ce qui casse quand un cert expire, qu'un SAN est faux, que le SNI manque derrière un reverse proxy, ou que vous avez "corrigé" un avertissement mixed content en désactivant la vérification côté client backend. Ce billet est cette carte : intuition du handshake, certificats, SNI, et les erreurs qui sortent sur les status pages et dans les canaux d'incident.

TLS 1.2 et TLS 1.3 sont ce que vous rencontrerez en 2026. Les anciennes versions devraient être coupées. Le modèle mental ci-dessous se concentre sur **TLS 1.3** (plus simple sur le fil) et signale où le 1.2 compte encore au debug.

---

## Ce que HTTPS protège vraiment

| Propriété | Sens approximatif | Apport du TLS |
| --- | --- | --- |
| **Confidentialité** | Un écouteur ne lit pas le payload | Chiffrement symétrique après accord de clés |
| **Intégrité** | La falsification est détectée | Suites AEAD (chiffrer + authentifier) |
| **Authentification serveur** | Le client parle au bon hôte | Chaîne de certificats + contrôle du hostname |
| **Authentification client** | Le serveur connaît l'identité du client | mTLS optionnel |

Le TLS **ne** rend pas une mauvaise app sûre. XSS, CSRF, open redirects et auth cassée marchent encore avec le cadenas vert. Le TLS ne cache pas non plus les **métadonnées** visibles sur le chemin : IP, ports, hostname SNI (TLS classique), tailles de cert, timing et volume de trafic. Encrypted Client Hello (ECH) et QUIC changent une partie de ce tableau ; la plupart des stacks que vous opérez exposent encore le SNI en clair tant que l'ECH n'est pas déployé de bout en bout.

HTTP vs HTTPS n'est plus une excuse de perf. Le TLS moderne est bon marché face au parsing JSON et aux allers-retours base de données. Le coût que vous sentez est souvent le setup de connexion (handshake + session TCP/TLS) sous fort churn ; d'où l'intérêt du keep-alive, du multiplexage HTTP/2 et de la reprise de session.

---

## Couches que vous touchez en tant que développeur

```
Application:  HTTP request/response (or gRPC, etc.)
    |
TLS:          handshake, certs, keys, encrypted records
    |
Transport:    TCP (or UDP for QUIC / HTTP/3)
    |
Network:      IP
```

Formes de déploiement courantes :

1. **Navigateur → CDN / load balancer** termine le TLS, puis HTTP en clair ou TLS re-chiffré vers l'origin.
2. **Service A → Service B** avec mTLS dans un mesh ou une API gateway.
3. **CLI / SDK → API publique** avec trust store système + vérification du hostname.

Où le TLS s'arrête est une décision de sécurité. Si le load balancer déchiffre et parle HTTP au réseau de pods, quiconque sur ce chemin peut lire le trafic. Beaucoup d'équipes re-chiffrent jusqu'à l'app ("TLS everywhere") ou utilisent un sidecar de mesh. Documentez la frontière de confiance ; n'assumez pas que "on a HTTPS en edge" rend tout le chemin privé.

---

## Bases des certificats (la partie qui casse à 2 h du matin)

Un **certificat** est une affirmation signée : "la clé publique P appartient au nom N, jusqu'à la date D, sous telle politique…" Une **autorité de certification (CA)** le signe. Votre client a un **trust store** de racines (et parfois d'intermédiaires) qu'il croit.

### Chaîne de confiance

Chaîne typique d'un leaf :

```
Root CA (in trust store)
  → Intermediate CA
      → Leaf (your server: api.example.com)
```

Le serveur doit présenter le **leaf** et en général le ou les **intermédiaires**. Le client a déjà la racine. Un intermédiaire manquant est le classique "ça marche sur mon laptop, ça casse en CI et sur mobile" : les navigateurs desktop mettent en cache les intermédiaires ; certains clients non.

### Ce que le client vérifie (simplifié)

1. La **chaîne remonte** jusqu'à une racine de confiance (signatures valides, sans trou).
2. **Pas expiré / pas avant** (`notBefore` / `notAfter`).
3. Le **hostname** correspond : le SAN DNS (Subject Alternative Name) inclut le nom auquel vous vous êtes connecté (ou un wildcard valide). Le CN seul est legacy ; les clients modernes regardent le SAN.
4. **Key usage / extended key usage** autorisent le server auth (et le client auth pour les certs client mTLS).
5. **Révocation** (quand elle est appliquée) : CRL, OCSP, ou certs à courte durée. L'application est inégale selon les plateformes ; ne traitez pas "pas d'OCSP staple" comme "cert bon pour toujours", mais n'inventez pas non plus un demi-contrôle maison.
6. **Name constraints et politiques** en PKI d'entreprise (moins courant sur le web public).

Si l'un de ces points échoue, la bibliothèque TLS abandonne. Votre client HTTP n'obtient pas un 200 avec un corps. Vous avez une erreur de handshake : `CERTIFICATE_VERIFY_FAILED`, `hostname mismatch`, `unknown CA`, et la suite.

### CA publique vs CA privée vs auto-signé

| Type | Usage | Confiance client |
| --- | --- | --- |
| **CA publique** (Let's Encrypt, commerciale) | Noms exposés sur Internet | Trust stores par défaut OS/navigateur |
| **CA privée** | Services internes, mTLS, apps d'entreprise | Vous distribuez la racine/intermédiaire aux clients |
| **Leaf auto-signé** | Démos locales, break-glass | Il faut pinner ou désactiver verify (dangereux si on oublie) |

Pour les sites publics, utilisez une CA publique et automatisez le renouvellement (cert-manager, clients ACME, certs gérés cloud). Pour l'identité de services internes, préférez une CA privée automatisée (SPIFFE/SPIRE, CA de mesh, ACME interne) plutôt que de copier un PEM auto-signé dans chaque repo.

### Wildcards et certs multi-noms

- `*.example.com` matche `api.example.com`, pas `example.com`, et pas `a.b.example.com` (un seul label).
- Les SAN peuvent lister beaucoup de noms : `www`, `api`, apex, hosts de preview.
- Un seul cert sur un load balancer partagé va bien quand le SNI et la config vhost pointent le bon cert vers le bon nom.

---

## Intuition du handshake TLS (TLS 1.3)

Vous pouvez débugger sans mémoriser chaque vol. Gardez cette histoire :

1. **ClientHello** : "Je parle TLS 1.3, voici les cipher suites que j'aime, voici mon key share pour l'accord de clés, et le nom du serveur est `api.example.com` (SNI)."
2. **ServerHello** (+ extensions chiffrées, cert, cert verify, finished) : le serveur choisit les paramètres, envoie sa **chaîne de certificats**, prouve qu'il détient la clé privée, et les deux côtés dérivent les secrets de handshake et de trafic applicatif.
3. **Client Finished** (puis application data) : le client vérifie le cert et la preuve serveur, confirme le transcript du handshake, puis les deux envoient des données applicatives sous les nouvelles clés.

TLS 1.3 finit en général en **1-RTT** (un aller-retour de messages crypto une fois le TCP en place). Avec session tickets / reprise PSK vous pouvez obtenir des données en **0-RTT** (avec des risques de replay : seulement pour des requêtes sûres et idempotentes, sauf si vous maîtrisez le risque).

TLS 1.2 avait plus de messages (ServerKeyExchange, théâtre ChangeCipherSpec, danse optionnelle de cert client dans un autre ordre). Wireshark montre encore du 1.2 sur de vieux appliances. Préférez 1.3 en config ; gardez 1.2 seulement si une dépendance réelle l'exige, et coupez 1.0/1.1.

### Ce qui "prouve" le serveur

Le cert lie une **clé publique** à un **nom**. Pendant le handshake le serveur utilise la **clé privée** correspondante pour que le client sache que ce n'est pas une boîte au hasard qui présente un PEM copié sans la clé. Voler seulement le certificat PEM ne suffit pas ; voler la clé privée est catastrophique jusqu'à révocation et rotation.

### Cipher suites (ce qui vous regarde)

Vous ne choisissez presque jamais AES vs ChaCha à la main sur des stacks modernes. Les défauts d'OpenSSL, BoringSSL, Go et des moteurs de navigateur actuels préfèrent les suites AEAD (AES-GCM, ChaCha20-Poly1305) et des courbes modernes (X25519, P-256). Votre job :

- Désactiver les suites antiques et restes export-grade si un scanner les trouve.
- Préférer des configs serveur qui suivent un profil maintenu (Mozilla SSL Configuration Generator, politique TLS "modern" du cloud provider).
- Ne pas inventer une cipher string custom d'un billet de 2014.

### Reprise de session

Les handshakes complets coûtent CPU et latence. La reprise réutilise des secrets antérieurs (tickets en 1.3). Utile pour apps mobiles et clients à fort QPS. Surveillez la rotation des ticket keys sur des terminateurs multi-nœuds : si chaque pod a une ticket key aléatoire non partagée, le taux de reprise s'effondre et vous payez le handshake complet en permanence.

---

## SNI : une IP, beaucoup de certificats

**Server Name Indication (SNI)** est une extension du ClientHello qui indique le hostname voulu par le client. Sans SNI, un serveur avec beaucoup de certs sur une IP ne sait pas quel leaf présenter.

Pourquoi ça compte :

1. **Load balancers / ingress partagés** : routage et choix de cert par nom SNI.
2. **CDN et plateformes multi-tenant** : même IP anycast, certs clients différents.
3. **Debug** : `curl https://ip/` ou une connexion par IP sans SNI obtient souvent le cert **par défaut**, qui échoue la vérification de hostname pour le nom voulu.

### Échecs SNI concrets

| Symptôme | Cause probable |
| --- | --- |
| Navigateur OK, client Java/ancien qui échoue | Le client n'envoie pas de SNI |
| Mauvais cert (nom d'un autre tenant) | Server block par défaut / mauvais secret TLS d'ingress |
| Marche avec `curl --resolve` mais pas le DNS | Le DNS pointe un autre VIP que celui testé |
| mTLS ou API gateway "no certificate matches" | Nom SNI ≠ SAN du cert ≠ host de la route |

Testez avec un server name explicite :

```bash
# Force connect to an IP but send SNI + Host for api.example.com
openssl s_client -connect 203.0.113.10:443 -servername api.example.com </dev/null

curl -v --resolve api.example.com:443:203.0.113.10 https://api.example.com/health
```

Sans `-servername` vous ne testez pas le même chemin que les utilisateurs.

### SNI et confidentialité

Le SNI classique est en clair sur TLS 1.2/1.3 au-dessus de TCP. Un observateur réseau apprend le hostname même si le path HTTP est chiffré. ECH vise à chiffrer cela ; l'adoption grandit mais n'est pas universelle. Si votre modèle de menace inclut la confidentialité du hostname, sachez ce que déploient réellement votre edge et vos clients.

---

## HTTP/2, HTTP/3 et ALPN

**ALPN** (Application-Layer Protocol Negotiation) voyage dans le handshake pour que client et serveur s'accordent sur `h2`, `http/1.1` ou `h3` (pour QUIC). Si un middlebox retire l'ALPN ou si le proxy est mal configuré, vous pouvez retomber sur HTTP/1.1 ou faire échouer le handshake selon la politique du client.

- **HTTP/2** exige presque toujours le TLS sur le web public (navigateurs).
- **HTTP/3** utilise **QUIC** (UDP). TLS 1.3 est intégré à QUIC ; l'histoire du cert est la même idée, un autre empaquetage sur le fil.

Quand "HTTPS marche mais HTTP/2 ne négocie jamais", regardez l'ALPN sur le terminateur et si un proxy L7 au milieu ne parle qu'HTTP/1.1 au client.

---

## Mutual TLS (mTLS) en une page

En HTTPS normal, seul le **serveur** présente un cert. En **mTLS**, le client en présente un aussi. Le serveur vérifie la chaîne du cert client et (souvent) un SPIFFE ID, une allowlist CN/SAN, ou l'identité mesh.

Cas d'usage : service à service dans un réseau zero-trust, APIs partenaires, identité d'appareils.

Le dur est opérationnel, pas cryptographique :

- Émettre et faire tourner les certs client
- Distribuer les trust bundles
- Gérer l'expiration sans panne totale
- Erreurs claires quand le cert client manque, est faux ou expiré

N'ajoutez pas le mTLS à une app navigateur publique comme seule histoire de login utilisateur. Navigateurs et UX vous combattent ; gardez-le pour services et clients contrôlés.

---

## Erreurs de config courantes (celles qui partent en prod)

### 1. Certificat expiré

Symptôme : panne totale soudaine pour les nouveaux clients ; certaines connexions longues tiennent jusqu'à reconnexion. Correctif : renouvellement automatisé, alerte sur `notAfter` avec des semaines de marge, monitoring hors de votre réseau (chemin utilisateur). Les certs de staging expirent aussi.

### 2. Chaîne incomplète (intermédiaire manquant)

Symptôme : marche dans Chrome, échoue en Java, Python, mobile, ou `curl` avec un trust store propre. Correctif : servir leaf + intermédiaire ; vérifier avec `openssl s_client` et un checker SSL externe. Ne comptez pas sur le fetch AIA partout.

### 3. Hostname / SAN qui ne matchent pas

Symptôme : le cert est valide pour `www.example.com` mais les users tapent `example.com` ou `api.example.com`. Correctif : inclure tous les noms publics dans les SAN, ou rediriger apex/www avant de terminer le TLS sur le mauvais nom (les redirections ont besoin d'un cert qui matche le premier nom touché).

### 4. Horloge fausse

Symptôme : échecs de verify intermittents, "cert not yet valid", ou chaos voisin type JWT. TLS et validité des certs sont basés sur le temps. Corrigez le NTP des serveurs et comprenez les hôtes de conteneurs qui bootent avec une mauvaise horloge.

### 5. Désactiver la vérification dans les clients backend

```python
# Looks like a temporary local fix. Becomes production.
requests.get(url, verify=False)
```

```javascript
// Node: same footgun
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

Symptôme : pas d'erreurs, risque MITM silencieux sur tout chemin réseau que vous ne contrôlez pas entièrement. Correctif : installer le bon CA bundle, utiliser le bon hostname, ou pinner avec une librairie volontaire. Ne laissez jamais `verify=False` dans du code partagé.

### 6. Mixed content

Une page HTTPS charge des scripts ou du XHR en `http://`. Les navigateurs bloquent le mixed content actif. Correctif : tous les assets et APIs en HTTPS ; URLs protocol-relative seulement si encore nécessaire (préférez `https://` absolu ou des chemins root-relative sur le même hôte).

### 7. TLS seulement en edge, cleartext à l'intérieur avec réseau hostile assumé

Symptôme : review compliance ou mouvement latéral lit le trafic des pods. Correctif : re-chiffrer jusqu'à l'origin, mTLS de mesh, ou traiter le réseau privé comme hostile et concevoir en conséquence. Au minimum, sachez quels segments sont en clair.

### 8. Protocoles et ciphers obsolètes

Symptôme : scanner note F ; ou d'anciens clients se connectent encore avec des suites faibles. Correctif : minimum TLS 1.2+ (préférer 1.3), politique de ciphers moderne, désactiver RC4/3DES/export. Testez le matériel/POS legacy avant un cutover dur.

### 9. Certificat sur le mauvais équipement d'une chaîne de proxies

Client → CDN → API gateway → ingress → pod. Chaque hop peut terminer le TLS. Symptôme : vous avez renouvelé le secret d'ingress mais le CDN a encore l'ancien cert (ou l'inverse). Correctif : inventaire de chaque terminateur ; alerte sur le cert présenté de chaque endpoint public.

### 10. Erreurs HSTS

**HSTS** dit aux navigateurs d'utiliser uniquement HTTPS pour votre domaine (souvent avec sous-domaines). Bien quand le HTTPS est solide. Douloureux si vous preload ou mettez `includeSubDomains` et qu'un sous-domaine oublié en HTTP-only casse. Correctif : activez HSTS quand le HTTPS marche partout où vous en avez besoin ; traitez le preload comme pratiquement permanent.

### 11. Client avec IP dans l'URL alors que le cert n'a que des SAN DNS

`https://203.0.113.10/` échoue sauf si le cert a cette IP en SAN (rare pour les sites publics). Utilisez des noms DNS.

### 12. Backends gRPC / HTTP/2 et config TLS incomplète

gRPC veut HTTP/2. ALPN mal réglé ou un proxy qui rétrograde en HTTP/1.1 produit des erreurs opaques. Correctif : support h2 de bout en bout ou h2c explicite seulement sur des liens de confiance que vous comprenez.

### 13. Clé privée commitée dans git ou lisible par tous sur disque

Symptôme : la clé est publique ; assumez le compromis. Correctif : tourner cert + clé, purger l'historique si besoin, secret managers et certs courts quand c'est possible. Restreignez les permissions filesystem du matériel de clé.

### 14. OCSP stapling / angles morts de révocation

Certains clients font un soft-fail sur les checks de révocation. Un attaquant avec une clé volée peut se faire passer pour vous jusqu'à l'expiration si vous n'opérez pas la révocation. Préférez des certs courts (ACME tous les 60 jours ou moins) plus l'automation pour que la révocation ne soit pas votre seul contrôle.

### 15. "Ça marche avec curl -k"

`-k` / `--insecure` saute la vérification. Utile pour séparer "TCP et TLS parlent" de "confiance et nom sont corrects". Ne traitez jamais une réponse verte avec `-k` comme prête pour la prod.

---

## Boîte à outils de debug

```bash
# What cert is presented? What protocol and cipher?
openssl s_client -connect api.example.com:443 -servername api.example.com </dev/null 2>/dev/null | openssl x509 -noout -dates -subject -ext subjectAltName

# Full handshake chatter (TLS 1.3)
openssl s_client -connect api.example.com:443 -servername api.example.com -tls1_3

# curl details: verify result, HTTP version
curl -vI https://api.example.com/

# From another network path (user-like)
# Use an external checker or a probe in a different cloud region
```

Dans les logs applicatifs, journalisez la **classe d'erreur** (handshake failed, cert verify failed, hostname mismatch) sans logger de secrets. Côté serveur, les access logs montrent rarement les échecs de verify TLS côté client ; il faut des métriques client et des probes synthétiques.

DevTools navigateur → panneau Security montre la chaîne de cert acceptée par le navigateur. Elle peut différer de ce que voit `openssl` si vous touchez un autre POP ou middlebox.

---

## Checklist de config pour ceux qui livrent

**Edge public**

- [ ] TLS 1.2+ (préférer 1.3), ciphers modernes
- [ ] Chaîne complète servie (leaf + intermédiaire)
- [ ] SAN qui couvrent chaque hostname tapé par les users
- [ ] Renouvellement auto + alertes d'expiration (probe externe)
- [ ] SNI et routage alignés par hostname
- [ ] HSTS seulement quand le HTTPS est complet pour cet espace de noms
- [ ] Redirect HTTP→HTTPS sur les mêmes noms sans boucles

**Clients de service (backend, mobile, batch)**

- [ ] Vérification **activée** ; bon CA bundle pour PKI publique ou privée
- [ ] Vérification du hostname activée ; host de l'URL = cert
- [ ] Sync d'horloge sur les hôtes
- [ ] Pas de `verify=False` / `NODE_TLS_REJECT_UNAUTHORIZED=0` en config déployable
- [ ] Timeouts et retries qui n'amplifient pas les pannes sur échecs de handshake

**mTLS / interne**

- [ ] Runbook de rotation testé
- [ ] Distribution du trust bundle définie
- [ ] Modèle d'identité documenté (URI SPIFFE, SAN, etc.)
- [ ] Mode d'échec : rejeter par défaut si le cert manque

---

## Clôture

HTTPS, c'est HTTP plus une session TLS qui vous achète le **chiffrement, l'intégrité et l'identité serveur** (et optionnellement l'identité client). Le handshake négocie les clés ; les **certificats** lient des noms à des clés via une chaîne de confiance ; le **SNI** dit aux serveurs multi-cert quelle identité présenter. La plupart des incidents TLS en prod ne sont pas de la cryptanalyse exotique. Ce sont **l'expiration**, les **chaînes cassées**, le **nom qui ne match pas**, la **vérification coupée**, et le **mauvais hop** qui présente un vieux cert.

Quand c'est rouge, demandez dans l'ordre : Est-ce que le TCP connecte ? Est-ce que le handshake finit ? Quel cert est présenté pour ce nom SNI ? La chaîne et le hostname vérifient-ils sur un client propre ? Quel équipement du chemin a terminé le TLS ? Cette séquence bat le bricolage de config au hasard et vous ramène plus vite à un cadenas vert ennuyeux.
