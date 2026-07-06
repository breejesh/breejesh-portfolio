---
title: "OAuth 2.0 pour les développeurs : authorization code, PKCE, tokens et bugs courants"
description: "Comment fonctionne vraiment le authorization code flow avec PKCE, à quoi servent access et refresh tokens, et les erreurs d'implémentation qui fuient des sessions ou cassent les clients mobiles."
date: "2026-07-06"
tags: [Sécurité, Développement Web]
coverImage: /assets/images/oauth2-for-developers.webp
previewImage: /assets/images/oauth2-for-developers.webp
---

OAuth 2.0 est le protocole que la plupart des apps utilisent quand un utilisateur dit "laisse cette app lire mon calendrier" sans donner son mot de passe. Les équipes livrent encore des implémentations cassées : SPA sans PKCE, tokens dans les query strings, `state` sauté "pour le MVP", refresh tokens stockés comme des cookies de session, et implicit flow copié d'un sample de 2018.

Ce billet est une carte pratique pour **authorization code + PKCE**, les types de tokens que vous touchez tous les jours, et les bugs qui sortent en code review et en incident.

OAuth, c'est de l'**autorisation** (accès délégué). L'**authentification** ("qui est cet utilisateur ?") est en général OpenID Connect par-dessus. Vous pouvez faire de l'OAuth sans OIDC. N'inventez pas votre protocole de login quand une stack standard existe déjà.

---

## Les quatre rôles (gardez les noms droits)

| Rôle | Qui | Rôle concret |
| --- | --- | --- |
| **Resource owner** | L'utilisateur (ou un compte de service) | Accorde l'accès aux données protégées |
| **Client** | Votre app (web, mobile, backend, CLI) | Demande des tokens et appelle des APIs |
| **Authorization server** | Identity provider (Auth0, Okta, Cognito, Keycloak, votre IdP) | Authentifie l'utilisateur, émet les tokens |
| **Resource server** | L'API qui détient les données | Accepte les access tokens et applique les scopes |

La confusion commence quand le même produit est à la fois client et resource server, ou quand le BFF (backend-for-frontend) est le client et pas la SPA. Dessinez les boîtes avant de copier un tutoriel de librairie.

Les **clients confidentiels** peuvent garder un client secret (apps web côté serveur, beaucoup de BFF). Les **clients publics** ne le peuvent pas (apps natives, SPA pure navigateur). Un client public ne doit pas s'appuyer sur un secret livré dans un binaire ou un bundle JavaScript.

---

## Pourquoi pas "envoyer le mot de passe" ?

Partager le mot de passe casse le produit et la sécurité :

1. L'app tierce apprend le mot de passe de l'utilisateur pour votre service (ou Google, GitHub, etc.).
2. Vous ne pouvez pas donner un accès **limité** (lire le calendrier, pas supprimer le mail).
3. Vous ne pouvez pas **révoquer** une app sans reset du mot de passe.
4. Vous ne pouvez pas auditer quelles apps ont accès.

OAuth émet des **identifiants scopés et révocables** (tokens) qui ne sont pas le mot de passe.

---

## Authorization code flow (le défaut)

Le authorization code flow est le chemin principal pour les apps face utilisateur en OAuth 2.0, et le seul flux interactif qu'OAuth 2.1 veut que vous gardiez.

En haut niveau :

1. Le client envoie l'utilisateur vers l'endpoint `/authorize` de l'authorization server avec `client_id`, `redirect_uri`, `scope`, `response_type=code`, `state`, et (avec PKCE) `code_challenge` + `code_challenge_method`.
2. L'utilisateur s'authentifie et consent.
3. L'authorization server redirige vers `redirect_uri` avec un **`code`** de courte durée et le même `state`.
4. Le client échange le `code` (plus `code_verifier` pour PKCE, plus `client_secret` si confidentiel) sur le **token endpoint** en back channel.
5. Le token endpoint renvoie `access_token`, souvent `refresh_token`, et (avec OIDC) `id_token`.

Le navigateur voit le **code** dans le redirect, pas l'access token. C'est le but : le token de valeur s'obtient sur une requête qui ne reste pas dans l'historique, les en-têtes Referer ou les logs intermédiaires comme un token en fragment ou en query.

### Forme minimale de l'URL authorize

```
GET /authorize?
  response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback
  &scope=openid%20profile%20calendar.read
  &state=RANDOM_CSRF_OPAQUE
  &code_challenge=BASE64URL_SHA256_OF_VERIFIER
  &code_challenge_method=S256
```

### Forme de l'échange de token

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=THE_CODE
&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback
&client_id=YOUR_CLIENT_ID
&code_verifier=THE_ORIGINAL_VERIFIER
```

Les clients confidentiels s'authentifient aussi (HTTP Basic avec client id/secret, ou `client_secret_post`, selon l'enregistrement). Le `redirect_uri` de la requête token doit correspondre à celui utilisé pour obtenir le code.

---

## PKCE : stopper l'interception du authorization code

**PKCE** (Proof Key for Code Exchange, RFC 7636) lie la requête token au client qui a démarré l'authorize.

Comment ça marche :

1. Le client génère un **`code_verifier`** à haute entropie (43-128 caractères, charset URL unreserved).
2. Il dérive **`code_challenge`** = `BASE64URL(SHA256(code_verifier))` avec la méthode `S256`.
3. L'authorize n'envoie que le challenge (et la méthode).
4. La requête token envoie le verifier d'origine.
5. L'authorization server hashe le verifier et le compare au challenge stocké.

Si un attaquant vole le redirect (custom URL schemes sur mobile, apps mal configurées, logs qui fuient), il n'a toujours pas le verifier, qui n'a jamais quitté le client légitime.

### Qui a besoin de PKCE ?

| Type de client | PKCE |
| --- | --- |
| Natif / mobile | Obligatoire |
| SPA navigateur sans secret | Obligatoire |
| Serveur / BFF confidentiel | Fortement recommandé (OAuth 2.1 le traite comme standard) |

N'utilisez pas la méthode `plain` en production. Utilisez **`S256`**.

### Esquisse PKCE (browser ou Node)

```javascript
function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function createPkcePair() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = base64UrlEncode(verifierBytes);
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier)
  );
  const codeChallenge = base64UrlEncode(digest);
  return { codeVerifier, codeChallenge };
}
```

Stockez `codeVerifier` uniquement le temps de la tentative de login (sessionStorage, mémoire, ou session serveur pour un BFF). Ne le loggez jamais.

---

## Tokens : à quoi sert chacun

| Token | Audience | Durée typique | But |
| --- | --- | --- | --- |
| **Authorization code** | Token endpoint seulement | Secondes à quelques minutes, usage unique | Pont du redirect navigateur à la réponse tokens |
| **Access token** | Resource servers | Minutes (5-60 courant) | Identifiant Bearer sur les appels API |
| **Refresh token** | Token endpoint de l'authorization server | Heures à jours/mois | Obtenir de nouveaux access tokens sans interaction utilisateur |
| **ID token** (OIDC) | Le client | Courte, comme l'access ou moins | Prouver l'identité au client ; pas une clé API |

### Access tokens

Souvent un **JWT** ou un token de référence **opaque**.

- JWT : le resource server valide signature et claims hors ligne (issuer, audience, expiry, scopes). Plus gros ; révocation instantanée difficile sans TTL court ou denylist.
- Opaque : le resource server introspecte chez l'authorization server (ou un cache). Plus petit sur le fil, révocation centrale, hop ou complexité de cache en plus.

Envoyez les access tokens dans l'en-tête **`Authorization: Bearer`**. Pas dans les query strings. Pas dans des URLs qui finissent en analytics, logs CDN ou historique navigateur.

### Refresh tokens

Les refresh tokens sont plus sensibles que les access parce qu'ils durent plus longtemps et fabriquent de nouveaux access.

Règles qui évitent la douleur :

1. Stockez-les seulement où vous pouvez les protéger (cookies httpOnly sécurisés sur un BFF, keychain OS sur mobile, session chiffrée côté serveur). Évitez `localStorage` sur une SPA publique si possible.
2. Préférez la **rotation de refresh token** : chaque refresh renvoie un nouveau refresh et invalide le précédent. La réutilisation d'un ancien refresh est un signal de vol ; révoquez la famille.
3. Liez le refresh au client id (et, si disponible, à des mécanismes sender-constrained).
4. Réduisez le scope du refresh : l'accès offline doit être explicite (`offline_access` ou flags fournisseur), pas le défaut de chaque login.

### ID tokens

Un ID token dit à **votre client** qui s'est connecté. Ce n'est pas un substitut d'access token pour appeler votre API. Les resource servers doivent valider les access tokens (ou des cookies de session posés par votre BFF après un échange correct), pas des ID tokens bruts du navigateur sauf design soigné qui vérifie encore audience et issuer.

---

## Redirect URIs : le piège qui paie encore

Les authorization servers comparent `redirect_uri` de façon **exacte** (scheme, host, path, souvent port et slash final). Les matches partiels et les wildcards, c'est là que commencent les account takeovers.

Règles dures :

1. Enregistrez des redirect URIs **complètes**. Pas de wildcards ouverts en production.
2. Préférez `https` uniquement. Pour le natif, utilisez des app links HTTPS revendiqués ou les schémas loopback / private-use recommandés par la plateforme, avec prudence.
3. Rejetez les `redirect_uri` qui viennent seulement de la query client sans allowlist serveur (l'AS doit appliquer l'enregistrement).
4. N'ajoutez pas de secrets aux redirect URIs.

Un open redirect sur votre propre domaine après login reste dangereux : l'attaquant passe l'utilisateur par OAuth, atterrit sur votre callback, puis le renvoie vers une page de phishing qui ressemble à "session poursuivie."

---

## `state` et CSRF

Le paramètre `state` est une valeur opaque que le client crée avant `/authorize` et vérifie au retour. Il lie le callback à la session navigateur qui a démarré le login.

Sans `state` (ou un équivalent comme l'histoire `nonce` OIDC plus binding de session), un CSRF de login est possible : l'attaquant démarre un flux, trompe la victime pour le terminer, et attache le compte de l'attaquant à la session de la victime (ou l'inverse selon le design).

Générez `state` avec un CSPRNG, stockez-le côté serveur ou en cookie/session lié au user agent, comparez en égalité à temps constant, puis effacez-le. Usage unique.

---

## Implicit flow et password grant : arrêtez

L'**implicit flow** (`response_type=token`) renvoyait des access tokens dans le fragment d'URL. Il existait parce que les vieux navigateurs ne pouvaient pas parler au token endpoint sans secret. Ce monde est fini. Utilisez authorization code + PKCE.

Le grant **resource owner password credentials** (`grant_type=password`) collecte le mot de passe dans votre app et le poste au token endpoint. Ça casse le sens d'OAuth pour les clients tiers et c'est retiré d'OAuth 2.1. Hors des nouveaux designs. Pour des cas first-party très contrôlés, préférez authorization code ou device flow, ou un login de session propre vers votre IdP.

Le **device authorization grant** est l'outil juste pour CLI et appareils contraints (TV, IoT) : affichez un code, l'utilisateur approuve sur le téléphone, l'appareil poll pour les tokens.

---

## Bugs courants (ceux qui partent en prod)

### 1. Sauter PKCE sur SPA et mobile

Symptôme : "ça marche dans Chrome." Incident : interception de custom URL scheme ou logs de redirect qui fuient mintent des tokens pour l'attaquant. Fix : PKCE toujours pour clients publics ; préférez un BFF pour que le navigateur ne tienne pas les refresh tokens.

### 2. Pas de validation de `state`

Symptôme : le handler de callback fait confiance à tout `code` qui frappe `/callback`. Fix : lier `state` à la session ; rejeter le mismatch.

### 3. Access token dans `localStorage`

Le XSS devient un takeover de compte pour la durée de vie du token (et plus si le refresh vit là aussi). Préférez des cookies httpOnly via BFF, ou des access très courts en mémoire seule avec un design de refresh soigné. Si vous utilisez les storage APIs, supposez XSS = vol de session et investissez en CSP, sanitization et TTL courts.

### 4. Tokens dans les query strings

```http
GET /api/items?access_token=eyJhbGciOi...
```

Logs, proxies, historique et `Referer` les collectent. Utilisez l'en-tête Authorization.

### 5. Redirect URI mauvaise ou trop large à l'enregistrement

`https://app.example.com/*` ou accepter des overrides de `redirect_uri` sans match strict permet de récolter des codes. Enregistrez des URIs exactes par environnement.

### 6. Traiter l'ID token comme credential d'API

Les APIs qui vérifient seulement "est-ce un JWT signé par notre IdP ?" sans vérifier l'**audience** de cette API acceptent des tokens destinés à un autre client. Validez `iss`, `aud`, `exp`, signature (et `nbf` si présent). Pour les access tokens, appliquez les scopes ou claims dont votre produit a besoin.

### 7. Access tokens à durée de vie infinie

Pas d'`exp`, ou access de 30 jours "pour réduire le trafic." Préférez TTL access court + refresh. Rendez la révocation significative.

### 8. Refresh sans rotation ni détection de réutilisation

Un refresh volé marche jusqu'à révocation manuelle. Rotation + détection de réutilisation limite la fenêtre et signale le vol.

### 9. Mélanger les environnements

`client_id` dev contre authorize prod, ou redirect prod seulement enregistré en staging. Les symptômes ressemblent à des `invalid_grant` et `redirect_uri_mismatch` aléatoires. Clients séparés par environnement.

### 10. Logger la réponse token

Des access logs qui dumpent les bodies request/response impriment des bearer tokens. Redactez `Authorization`, `code`, `code_verifier` et les bodies du token endpoint.

### 11. Décalage d'horloge

La validation JWT échoue par intermittence quand les serveurs ne sont pas d'accord sur l'heure. Autorisez une petite fenêtre de skew (de l'ordre d'une minute) et lancez NTP. Ne "réparez" pas en désactivant les checks `exp`.

### 12. Scope trop large au consentement

Demander `admin` ou boîte mail complète parce que le sample le faisait. L'utilisateur refuse le consentement, le security review échoue, et l'impact d'une breach grossit. Demandez le scope minimum dont l'écran a besoin ; montez d'un cran quand une feature en demande plus.

### 13. Croire que CORS égale sécurité

CORS ne protège pas les tokens qui vivent dans JavaScript. Il contraint seulement quels origines peuvent lire les réponses dans un navigateur. Les callers côté serveur ignorent CORS entièrement.

### 14. Crypto "façon OAuth" maison

Blobs chiffrés maison avec secrets partagés longue durée, sans revoke standard, sans audience. Utilisez un vrai authorization server ou une librairie maintenue contre un.

---

## Pattern BFF (version courte)

Pour les SPA, une forme solide courante :

1. Le navigateur ne parle qu'à **votre** backend (cookies same-site).
2. Le backend est le **client** OAuth (confidentiel), exécute code + PKCE, détient les refresh tokens.
3. Le backend émet son propre cookie de session au navigateur.
4. Le navigateur ne voit jamais les access/refresh de l'IdP.

Vous échangez un peu de complexité backend contre un rayon d'impact XSS bien plus petit et un stockage de tokens plus propre. Beaucoup d'IdP entreprise documentent ça explicitement pour les apps navigateur.

---

## Checklist resource server

Quand votre API accepte des bearer tokens :

- [ ] Valider la signature avec le JWKS courant (cacher les clés, gérer la rotation)
- [ ] Vérifier `iss`, `aud`, `exp` (et `nbf` si utilisé)
- [ ] Appliquer scopes ou claims fins par route
- [ ] Rejeter les tokens de mauvais type d'usage (si votre IdP distingue)
- [ ] Préférer des access tokens à audience restreinte par API
- [ ] Logger `sub` / client id pour l'audit, jamais le token brut
- [ ] Définir le comportement pour tokens révoqués (TTL court, introspection ou denylist)

---

## Checklist client

- [ ] Authorization code + PKCE (`S256`), pas implicit
- [ ] `state` cryptographique, validé une fois puis effacé
- [ ] Redirect URI exacte enregistrée par environnement
- [ ] Tokens hors des URLs et des logs
- [ ] Rotation de refresh et modèle de menaces de stockage écrits
- [ ] Clients séparés pour dev / stage / prod
- [ ] Scopes minimum ; documenter pourquoi chaque scope existe
- [ ] Chemin logout / revoke testé (session IdP + session locale)
- [ ] Gestion d'erreurs pour `invalid_grant`, refus de consentement et clock skew

---

## Lien avec la pensée OAuth 2.1

OAuth 2.1 consolide les bonnes pratiques ; ce n'est pas un protocole totalement nouveau. Direction pour les implémenteurs :

* Authorization code est le cheval de bataille interactif.
* PKCE pour tous les clients du code flow.
* Implicit et password grants abandonnés.
* Redirect URIs en match exact.
* Rotation de refresh encouragée ; bearer tokens traités comme sensibles.

Si votre wiki interne dit encore "la SPA doit utiliser implicit," mettez à jour le wiki avant la prod.

---

## Clôture

Livrez **authorization code + PKCE**, traitez **redirect URIs et `state` comme des contrôles de sécurité**, gardez des **access tokens courts** et des **refresh tokens ennuyeusement bien protégés**, et validez les tokens sur le resource server avec **issuer, audience, expiry et scope**. La plupart des incidents "OAuth c'est dur" ne sont pas des échecs de crypto exotique. Ce sont des checks sautés, des tokens au mauvais endroit, et du sample code d'un autre type de client.

Si vous review un PR demain, commencez par : PKCE présent, `state` vérifié, allowlist de redirect exacte, stockage des tokens écrit, et aucun bearer en query strings. Cette courte liste attrape une grande part des vrais bugs.
