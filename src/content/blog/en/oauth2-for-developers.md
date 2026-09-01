---
title: "OAuth 2.0 for Developers: Authorization Code, PKCE, Tokens, and Common Bugs"
description: "How the authorization code flow with PKCE actually works, what access and refresh tokens are for, and the implementation mistakes that leak sessions or break mobile clients."
date: "2026-07-06"
tags: [Cybersecurity & Networking]
coverImage: /assets/images/oauth2-for-developers.webp
previewImage: /assets/images/oauth2-for-developers.webp
---


OAuth 2.0 and OpenID Connect form the security backbone of modern web authentication. PKCE is now standard across all public and confidential client flows.

This post is a practical map for **authorization code + PKCE**, the token types you will touch every day, and the bugs that show up in code review and incident channels.

OAuth is **authorization** (delegated access). **Authentication** ("who is this user?") is usually OpenID Connect layered on top. You can implement OAuth without OIDC. You should not invent your own login protocol when a standards stack already exists.

---

## The four roles (keep the names straight)

| Role | Who | Job |
| --- | --- | --- |
| **Resource owner** | The user (or a service account) | Grants access to protected data |
| **Client** | Your app (web, mobile, backend, CLI) | Requests tokens and calls APIs |
| **Authorization server** | Identity provider (Auth0, Okta, Cognito, Keycloak, your IdP) | Authenticates the user, issues tokens |
| **Resource server** | The API that holds the data | Accepts access tokens and enforces scopes |

Confusion starts when the same product is both client and resource server, or when your BFF (backend-for-frontend) is the client and the SPA is not. Draw the boxes before you copy a library tutorial.

**Confidential clients** can keep a client secret (server-side web apps, many BFFs). **Public clients** cannot (native apps, pure browser SPAs). Public clients must not rely on a secret that ships in a binary or JavaScript bundle.

---

## Why not "just send the password"?

Password sharing fails product and security requirements:

1. The third-party app learns the user's password for your service (or for Google, GitHub, etc.).
2. You cannot grant **limited** access (read calendar, not delete mail).
3. You cannot **revoke** one app without resetting the password.
4. You cannot audit which apps hold access.

OAuth issues **scoped, revocable credentials** (tokens) that are not the password.

---

## Authorization code flow (the default)

The authorization code flow is the main path for user-facing apps in OAuth 2.0 and the only interactive flow OAuth 2.1 wants you to keep.

High level:

1. Client sends the user to the authorization server's `/authorize` endpoint with `client_id`, `redirect_uri`, `scope`, `response_type=code`, `state`, and (with PKCE) `code_challenge` + `code_challenge_method`.
2. User authenticates and consents.
3. Authorization server redirects back to `redirect_uri` with a short-lived **`code`** and the same `state`.
4. Client exchanges `code` (plus `code_verifier` for PKCE, plus `client_secret` if confidential) at the **token endpoint** over a back channel.
5. Token endpoint returns `access_token`, often `refresh_token`, and (with OIDC) `id_token`.

The browser sees the **code**, not the access token, in the redirect. That is the point: the valuable token is obtained on a request that does not sit in browser history, Referer headers, or intermediary logs the way a fragment or query token would.

### Minimal authorize URL shape

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

### Token exchange shape

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=THE_CODE
&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback
&client_id=YOUR_CLIENT_ID
&code_verifier=THE_ORIGINAL_VERIFIER
```

Confidential clients also send authentication (HTTP Basic with client id/secret, or `client_secret_post`, depending on registration). The `redirect_uri` on the token request must match the one used to get the code.

---

## PKCE: stop authorization code interception

**PKCE** (Proof Key for Code Exchange, RFC 7636) binds the token request to the client that started the authorize request.

How it works:

1. Client generates a high-entropy **`code_verifier`** (43-128 characters, unreserved URL charset).
2. Client derives **`code_challenge`** = `BASE64URL(SHA256(code_verifier))` when method is `S256`.
3. Authorize request sends only the challenge (and method).
4. Token request sends the original verifier.
5. Authorization server hashes the verifier and compares it to the stored challenge.

If an attacker steals the redirect (custom URL schemes on mobile, misconfigured apps, leaked logs), they still lack the verifier that never left the legitimate client.

### Who needs PKCE?

| Client type | PKCE |
| --- | --- |
| Native / mobile | Required |
| Browser SPA without a secret | Required |
| Confidential server / BFF | Strongly recommended (OAuth 2.1 treats it as standard) |

Do not use `plain` challenge method in production. Use **`S256`**.

### PKCE sketch (browser or Node)

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

Store `codeVerifier` only for the duration of the login attempt (sessionStorage, memory, or server session for a BFF). Never log it.

---

## Tokens: what each one is for

| Token | Audience | Lifetime (typical) | Purpose |
| --- | --- | --- | --- |
| **Authorization code** | Token endpoint only | Seconds to a few minutes, one-time use | Bridge from browser redirect to token response |
| **Access token** | Resource servers | Minutes (5-60 common) | Bearer credential on API calls |
| **Refresh token** | Authorization server token endpoint | Hours to days/months | Obtain new access tokens without user interaction |
| **ID token** (OIDC) | The client | Short, like access or shorter | Prove identity to the client; not an API key |

### Access tokens

Usually a **JWT** or an **opaque** reference token.

- JWT: resource server can validate signature and claims offline (issuer, audience, expiry, scopes). Larger, harder to revoke instantly without short TTL or denylist.
- Opaque: resource server introspects at the authorization server (or a cache). Smaller on the wire, central revocation, extra hop or cache complexity.

Send access tokens in the **`Authorization: Bearer`** header. Do not put them in query strings. Do not put them in URLs that end up in analytics, CDN logs, or browser history.

### Refresh tokens

Refresh tokens are more sensitive than access tokens because they last longer and mint new access.

Rules that prevent pain:

1. Store them only where you can protect them (httpOnly secure cookies on a BFF, OS keychain on mobile, encrypted server-side session). Never `localStorage` on a public SPA if you can avoid it.
2. Prefer **refresh token rotation**: each refresh returns a new refresh token and invalidates the previous one. Reuse of an old refresh token is a theft signal; revoke the family.
3. Bind refresh tokens to client id (and, when available, sender-constrained mechanisms).
4. Scope refresh down: offline access should be explicit (`offline_access` or provider-specific flags), not the default for every login.

### ID tokens

An ID token tells **your client** who logged in. It is not a substitute for an access token when calling your API. Resource servers should validate access tokens (or session cookies your BFF set after a proper exchange), not raw ID tokens from the browser unless you designed that carefully and still check audience and issuer.

---

## Redirect URIs: the footgun that keeps paying

Authorization servers match `redirect_uri` **exactly** (scheme, host, path, often port and trailing slash). Partial matches and wildcards are where account takeovers start.

Hard rules:

1. Register **full** redirect URIs. No open wildcards in production.
2. Prefer `https` only. For native apps, use claimed HTTPS app links or platform-recommended loopback / private-use URI schemes with care.
3. Reject `redirect_uri` values that come only from the client query string without server-side allowlist checks (the AS must enforce registration).
4. Do not append secrets to redirect URIs.

Open redirect on your own domain after login is still dangerous: attacker sends user through OAuth, lands on your callback, then bounces them to a phishing page that looks like "session continued."

---

## `state` and CSRF

The `state` parameter is an opaque value the client creates before `/authorize` and verifies on return. It ties the callback to the browser session that started login.

Without `state` (or an equivalent like the OIDC `nonce` story plus session binding), a login CSRF is possible: attacker starts an authorization flow, tricks the victim into completing it, and attaches the attacker's account to the victim's session (or vice versa depending on app design).

Generate `state` with a CSPRNG, store it server-side or in a cookie/session bound to the user agent, compare with constant-time equality, then clear it. One-time use.

---

## Implicit flow and password grant: stop using them

**Implicit flow** (`response_type=token`) returned access tokens in the URL fragment. It existed because old browsers could not talk to a token endpoint without a secret. That world is gone. Use authorization code + PKCE.

**Resource owner password credentials** grant (`grant_type=password`) collects the user's password in your app and posts it to the token endpoint. It breaks the point of OAuth for third-party clients and is removed from OAuth 2.1. Keep it out of new designs. For first-party highly controlled cases, prefer authorization code or device flows, or a proper session login to your own IdP.

**Device authorization grant** is the right tool for CLIs and input-constrained devices (TV, IoT): show a code, user approves on a phone, device polls for tokens.

---

## Common bugs (the ones that ship)

### 1. Skipping PKCE on SPAs and mobile

Symptom: "It works in Chrome." Incident: custom URL scheme interception or leaked redirect logs mint tokens for the attacker. Fix: PKCE always for public clients; prefer a BFF so the browser never holds refresh tokens.

### 2. No `state` validation

Symptom: callback handler trusts any `code` that hits `/callback`. Fix: bind `state` to session; reject mismatch.

### 3. Access token in `localStorage`

XSS becomes full account takeover for the token lifetime (and longer if refresh lives there too). Prefer httpOnly cookies via BFF, or short-lived memory-only access tokens with careful refresh design. If you must use storage APIs, assume XSS equals session theft and invest in CSP, sanitization, and short TTLs.

### 4. Putting tokens in query strings

```http
GET /api/items?access_token=eyJhbGciOi...
```

Logs, proxies, browser history, and `Referer` will collect them. Use the Authorization header.

### 5. Wrong or loose redirect URI registration

`https://app.example.com/*` or accepting `redirect_uri` overrides without strict match lets an attacker harvest codes. Register exact URIs per environment.

### 6. Treating the ID token as an API credential

APIs that only check "is this a JWT signed by our IdP?" without verifying **audience** for that API accept tokens meant for another client. Validate `iss`, `aud`, `exp`, signature (and `nbf` if present). For access tokens, enforce required scopes or claims your product needs.

### 7. Infinite-lived access tokens

No `exp`, or 30-day access tokens "to reduce traffic." Prefer short access TTL + refresh. Make revocation meaningful.

### 8. Refresh without rotation or reuse detection

Stolen refresh token works until manual revoke. Rotation + reuse detection limits the window and surfaces theft.

### 9. Mixing environments

Dev `client_id` against prod authorize URL, or prod redirect registered only on staging. Symptoms look like random `invalid_grant` and `redirect_uri_mismatch`. Separate clients per environment.

### 10. Logging the token response

Access logs that dump request/response bodies print bearer tokens. Redact `Authorization`, `code`, `code_verifier`, and token endpoint bodies.

### 11. Clock skew

JWT validation fails intermittently when servers disagree on time. Allow a small skew window (on the order of a minute) and run NTP. Do not "fix" it by disabling `exp` checks.

### 12. Scope creep at consent time

Requesting `admin` or full mailbox scopes because the sample app did. Users deny consent, security review fails, and breach impact multiplies. Request the minimum scope the screen needs; step-up when a feature needs more.

### 13. Assuming CORS equals security

CORS does not protect tokens sitting in JavaScript. It only constrains which origins can read responses in a browser. Server-side callers ignore CORS entirely.

### 14. Custom "OAuth-like" crypto

Homegrown encrypted blobs with long-lived shared secrets, no standard revoke, no audience. Use a real authorization server or a maintained library against one.

---

## BFF pattern (short version)

For SPAs, a common solid shape:

1. Browser talks only to **your** backend (same site cookies).
2. Backend is the OAuth **client** (confidential), runs code + PKCE, holds refresh tokens.
3. Backend issues its own session cookie to the browser.
4. Browser never sees the IdP access/refresh tokens.

You trade a bit of backend complexity for a much smaller XSS blast radius and cleaner token storage. Many enterprise IdPs document this explicitly for browser apps.

---

## Resource server checklist

When your API accepts bearer tokens:

- [ ] Validate signature with current JWKS (cache keys, handle rotation)
- [ ] Check `iss`, `aud`, `exp` (and `nbf` if used)
- [ ] Enforce scopes or fine-grained claims per route
- [ ] Reject tokens with wrong token type / use (if your IdP distinguishes)
- [ ] Prefer audience-restricted access tokens per API
- [ ] Log `sub` / client id for audit, never the raw token
- [ ] Define behavior for revoked tokens (short TTL, introspection, or denylist)

---

## Client checklist

- [ ] Authorization code + PKCE (`S256`), not implicit
- [ ] Cryptographic `state`, validated once, then cleared
- [ ] Exact redirect URI registration per environment
- [ ] Tokens not in URLs or logs
- [ ] Refresh rotation and storage threat model written down
- [ ] Separate clients for dev / stage / prod
- [ ] Minimum scopes; document why each scope exists
- [ ] Logout / revoke path tested (IdP session + local session)
- [ ] Error handling for `invalid_grant`, consent denial, and clock skew

---

## How this maps to OAuth 2.1 thinking

OAuth 2.1 is a consolidation of best practices, not a brand new protocol. Direction of travel for implementers:

* Authorization code is the interactive workhorse.
* PKCE for all clients that use the code flow.
* Implicit and password grants dropped.
* Redirect URIs exact-match.
* Refresh rotation encouraged; bearer tokens treated as sensitive.

If your internal wiki still says "SPA must use implicit," update the wiki before you update production.

---

## Closing

Ship **authorization code + PKCE**, treat **redirect URIs and `state` as security controls**, keep **access tokens short** and **refresh tokens boringly well protected**, and validate tokens on the resource server with **issuer, audience, expiry, and scope**. Most "OAuth is hard" incidents are not exotic crypto failures. They are skipped checks, tokens in the wrong place, and sample code from a different client type.

If you are reviewing a PR tomorrow, start with: PKCE present, `state` checked, redirect allowlist exact, token storage written down, and no bearer tokens in query strings. That short list catches a large share of real bugs.

