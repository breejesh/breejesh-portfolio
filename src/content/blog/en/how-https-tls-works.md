---
title: "How HTTPS and TLS Work for Developers: Handshake, Certificates, SNI, Misconfigs"
description: "A practical map of TLS for people who ship web apps: what the handshake actually does, how certificates prove identity, why SNI matters on shared IPs, and the misconfigs that still break production."
date: "2026-06-24"
tags: [Security, Networking]
coverImage: /assets/images/how-https-tls-works.webp
previewImage: /assets/images/how-https-tls-works.webp
---

HTTPS is HTTP over TLS. The browser (or your service client) opens a TCP connection, then runs a **TLS handshake** so both sides agree on keys and the client can check that the server is who it claims to be. After that, application bytes (HTTP/1.1, HTTP/2, HTTP/3 over QUIC) ride encrypted on the record layer.

You do not need to implement crypto. You do need to know what fails when a cert expires, a SAN is wrong, SNI is missing behind a reverse proxy, or you "fixed" a mixed-content warning by turning off verification in a backend client. This post is that map: handshake intuition, certificates, SNI, and the misconfigs that show up in status pages and incident channels.

TLS 1.2 and TLS 1.3 are what you will meet in 2026. Older versions should be off. The mental model below focuses on **TLS 1.3** (simpler on the wire) and calls out where 1.2 still matters for debugging.

---

## What HTTPS actually protects

| Property | Rough meaning | TLS contribution |
| --- | --- | --- |
| **Confidentiality** | Eavesdroppers cannot read the payload | Symmetric encryption after key agreement |
| **Integrity** | Tampering is detected | AEAD ciphers (encrypt + authenticate) |
| **Server authentication** | Client talks to the right host | Certificate chain + hostname check |
| **Client authentication** | Server knows the client identity | Optional mutual TLS (mTLS) |

TLS does **not** make a bad app safe. XSS, CSRF, open redirects, and broken auth still work over a green padlock. TLS also does not hide **metadata** everyone can see on the path: IPs, ports, SNI hostname (in classic TLS), cert sizes, timing, and traffic volume. Encrypted Client Hello (ECH) and QUIC change some of that picture over time; most stacks you operate still expose SNI in cleartext today unless ECH is deployed end to end.

HTTP vs HTTPS is not a performance excuse anymore. Modern TLS is cheap compared to JSON parsing and database round trips. The cost you feel is usually connection setup (handshake + TCP/TLS session) under high churn, which is why keep-alive, HTTP/2 multiplexing, and session resumption matter.

---

## Layers you touch as a developer

```
Application:  HTTP request/response (or gRPC, etc.)
    |
TLS:          handshake, certs, keys, encrypted records
    |
Transport:    TCP (or UDP for QUIC / HTTP/3)
    |
Network:      IP
```

Common deployment shapes:

1. **Browser → CDN / load balancer** terminates TLS, then plain HTTP or re-encrypted TLS to origin.
2. **Service A → Service B** with mTLS inside a mesh or API gateway.
3. **CLI / SDK → public API** with system trust store + hostname verification.

Where TLS ends is a security decision. If the load balancer decrypts and talks HTTP to the pod network, anyone on that path can read traffic. Many teams re-encrypt to the app ("TLS everywhere") or use a mesh sidecar. Document the trust boundary; do not assume "we have HTTPS at the edge" means the whole path is private.

---

## Certificate basics (the part that fails at 2 a.m.)

A **certificate** is a signed statement: "public key P belongs to name N, until date D, under policy…" A **certificate authority (CA)** signs it. Your client has a **trust store** of root (and sometimes intermediate) CAs it believes.

### Chain of trust

Typical leaf cert chain:

```
Root CA (in trust store)
  → Intermediate CA
      → Leaf (your server: api.example.com)
```

The server must present the **leaf** and usually the **intermediate(s)**. The client already has the root. Missing intermediate is a classic "works on my laptop, fails in CI and on mobile" bug: desktop browsers cache intermediates; some clients do not.

### What the client checks (simplified)

1. **Chain builds** to a trusted root (signatures valid, no unknown gaps).
2. **Not expired / not before** (`notBefore` / `notAfter`).
3. **Hostname** matches: DNS SAN (Subject Alternative Name) includes the name you connected to (or a valid wildcard). CN-only is legacy; modern clients care about SAN.
4. **Key usage / extended key usage** allow server auth (and client auth for mTLS client certs).
5. **Revocation** (when enforced): CRL, OCSP, or short-lived certs. Enforcement is uneven across platforms; do not treat "no OCSP staple" as "cert is good forever," but also do not invent your own half-broken check.
6. **Name constraints and policy** in enterprise PKI (less common on the public web).

If any of these fail, the TLS library aborts. Your HTTP client never gets a 200 with a body. You get a handshake error: `CERTIFICATE_VERIFY_FAILED`, `hostname mismatch`, `unknown CA`, and friends.

### Public CA vs private CA vs self-signed

| Type | Use | Client trust |
| --- | --- | --- |
| **Public CA** (Let's Encrypt, commercial) | Internet-facing names | Default OS/browser trust stores |
| **Private CA** | Internal services, mTLS, corp apps | You distribute the root/intermediate to clients |
| **Self-signed leaf** | Local demos, break-glass | Must pin or disable verify (dangerous if you forget) |

For public sites, use a public CA and automate renewal (cert-manager, ACME clients, cloud-managed certs). For internal service identity, prefer a private CA with automation (SPIFFE/SPIRE, mesh CA, internal ACME) over copying a self-signed PEM into every repo.

### Wildcard and multi-name certs

- `*.example.com` matches `api.example.com`, not `example.com`, and not `a.b.example.com` (single label only).
- SANs can list many names: `www`, `api`, apex, preview hosts.
- One cert on a shared load balancer is fine when SNI and vhost config point the right cert at the right name.

---

## TLS handshake intuition (TLS 1.3)

You can debug without memorizing every flight. Hold this story:

1. **ClientHello**: "I speak TLS 1.3, here are cipher suites I like, here is my key share for key agreement, and the server name is `api.example.com` (SNI)."
2. **ServerHello** (+ encrypted extensions, cert, cert verify, finished): server picks parameters, sends its **certificate chain**, proves it holds the private key, and both sides derive handshake and application traffic secrets.
3. **Client Finished** (and then application data): client verifies the cert and server proof, confirms the handshake transcript, then both send application data under the new keys.

TLS 1.3 usually finishes in **1-RTT** (one round trip of crypto messages after TCP is up). With session tickets / PSK resumption you can get **0-RTT** data (with replay caveats: only for safe, idempotent requests unless you understand the risk).

TLS 1.2 had more messages (ServerKeyExchange, ChangeCipherSpec theater, optional client cert dance with different ordering). Wireshark still shows 1.2 on older appliances. Prefer 1.3 in config; keep 1.2 only if a real dependency requires it, and turn off 1.0/1.1.

### What "proves" the server

The cert binds a **public key** to a **name**. During the handshake the server uses the matching **private key** so the client knows it is not a random box presenting a copied cert file without the key. Stealing only the PEM certificate is not enough; stealing the private key is catastrophic until you revoke and rotate.

### Cipher suites (what to care about)

You almost never pick AES vs ChaCha by hand on modern stacks. Defaults on current OpenSSL, BoringSSL, Go, and browser engines prefer AEAD suites (AES-GCM, ChaCha20-Poly1305) and modern curves (X25519, P-256). Your job:

- Disable ancient suites and export-grade leftovers if a scanner finds them.
- Prefer server configs that follow a maintained profile (Mozilla SSL Configuration Generator, cloud provider "modern" TLS policy).
- Do not invent a custom cipher string from a blog post from 2014.

### Session resumption

Full handshakes cost CPU and latency. Resumption reuses prior secrets (tickets in 1.3). Good for mobile apps and high-QPS clients. Watch ticket key rotation on multi-node terminators: if every pod has a random ticket key and no sharing, resumption rates tank and you pay full handshake cost constantly.

---

## SNI: one IP, many certificates

**Server Name Indication (SNI)** is a ClientHello extension that says which hostname the client wants. Without SNI, a server with many certs on one IP cannot know which leaf to present.

Why you care:

1. **Shared load balancers / ingress**: route and pick cert by SNI name.
2. **CDN and multi-tenant platforms**: same anycast IP, different customer certs.
3. **Debugging**: `curl https://ip/` or connecting by IP without SNI often gets the **default** cert, which fails hostname verification for the name you meant.

### Practical SNI failures

| Symptom | Likely cause |
| --- | --- |
| Browser OK, some Java/old client fails | Client does not send SNI |
| Wrong cert (another tenant's name) | Default server block / wrong ingress TLS secret |
| Works with `curl --resolve` but not DNS | DNS points to different VIP than you tested |
| mTLS or API gateway "no certificate matches" | SNI name ≠ cert SAN ≠ route host |

Test with an explicit server name:

```bash
# Force connect to an IP but send SNI + Host for api.example.com
openssl s_client -connect 203.0.113.10:443 -servername api.example.com </dev/null

curl -v --resolve api.example.com:443:203.0.113.10 https://api.example.com/health
```

Omit `-servername` and you are not testing the same path users take.

### SNI and privacy

Classic SNI is cleartext on TLS 1.2/1.3 over TCP. Network observers learn the hostname even when the HTTP path is encrypted. ECH aims to encrypt that; adoption is growing but is not universal. For threat models that care about hostname privacy, know what your edge and clients actually deploy.

---

## HTTP/2, HTTP/3, and ALPN

**ALPN** (Application-Layer Protocol Negotiation) rides in the handshake so client and server agree on `h2`, `http/1.1`, or `h3` (for QUIC). If a middlebox strips ALPN or you misconfigure the proxy, you may fall back to HTTP/1.1 or fail the handshake depending on client policy.

- **HTTP/2** almost always requires TLS on the public web (browsers).
- **HTTP/3** uses **QUIC** (UDP). TLS 1.3 is built into QUIC; the cert story is the same idea, different wire packaging.

When "HTTPS works but HTTP/2 never negotiates," check ALPN on the terminator and whether an L7 proxy in the middle only speaks HTTP/1.1 to the client.

---

## Mutual TLS (mTLS) in one page

In normal HTTPS only the **server** presents a cert. In **mTLS** the client presents one too. The server verifies client cert chain + (often) SPIFFE ID, CN/SAN allowlist, or mesh identity.

Use cases: service-to-service inside a zero-trust network, partner APIs, device identity.

Hard parts are operational, not cryptographic:

- Issuing and rotating client certs
- Distributing trust bundles
- Handling expiry without a total outage
- Clear errors when the client cert is missing vs wrong vs expired

Do not bolt mTLS onto a public browser app as your only user login story. Browsers and human UX fight you; use it for services and controlled clients.

---

## Common misconfigs (the ones that ship)

### 1. Expired certificate

Symptom: sudden total failure for new clients; some long-lived connections keep working until reconnect. Fix: automate renewal, alert on `notAfter` with weeks of runway, monitor from outside your network (user-path monitoring). Staging certs expire too.

### 2. Incomplete chain (missing intermediate)

Symptom: works in Chrome, fails in Java, Python, mobile, or `curl` on a clean trust store. Fix: serve leaf + intermediate; verify with `openssl s_client` and an external SSL checker. Do not rely on AIA fetching everywhere.

### 3. Hostname / SAN mismatch

Symptom: cert is valid for `www.example.com` but users hit `example.com` or `api.example.com`. Fix: include all public names in SANs, or redirect apex/www before TLS terminates on the wrong name (redirects need a cert that matches the name you first hit).

### 4. Wrong clock

Symptom: intermittent verify failures, "cert not yet valid," or JWT-looking chaos nearby. TLS and cert validity are time-based. Fix NTP on servers and understand container hosts that boot with bad clocks.

### 5. Disabling verification in backend clients

```python
# Looks like a temporary local fix. Becomes production.
requests.get(url, verify=False)
```

```javascript
// Node: same footgun
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

Symptom: no errors, silent MITM risk on any network path you do not fully control. Fix: install the right CA bundle, use correct hostname, or pin with a deliberate library. Never leave `verify=False` in shared code.

### 6. Mixed content

HTTPS page loads scripts or XHR over `http://`. Browsers block active mixed content. Fix: all assets and APIs on HTTPS; use protocol-relative URLs only if you still must (prefer absolute `https://` or root-relative paths on the same host).

### 7. TLS only at the edge, cleartext inside with a hostile network assumption

Symptom: compliance review or lateral movement reads pod traffic. Fix: re-encrypt to origin, mesh mTLS, or treat the private network as hostile and design accordingly. At minimum, know which segments are cleartext.

### 8. Outdated protocols and ciphers

Symptom: scanner grade F; or old clients still connect with weak suites. Fix: TLS 1.2+ minimum (prefer 1.3), modern cipher policy, disable RC4/3DES/export. Test legacy POS/hardware before a hard cutover.

### 9. Certificate on the wrong device in a chain of proxies

Client → CDN → API gateway → ingress → pod. Each hop may terminate TLS. Symptom: you renewed the ingress secret but the CDN still has the old cert (or the reverse). Fix: inventory every terminator; alert on each public endpoint's presented cert.

### 10. HSTS mistakes

**HSTS** tells browsers to use HTTPS only for your domain (often including subdomains). Good when HTTPS is solid. Painful when you preload or set `includeSubDomains` and a forgotten HTTP-only subdomain breaks. Fix: enable HSTS after HTTPS works everywhere you need; treat preload as permanent for practical purposes.

### 11. Client using IP in URL while cert has only DNS SANs

`https://203.0.113.10/` fails unless the cert has that IP in SAN (rare for public sites). Use DNS names.

### 12. gRPC / HTTP/2 backends and incomplete TLS config

gRPC wants HTTP/2. Mis-set ALPN or a proxy that demotes to HTTP/1.1 produces opaque errors. Fix: end-to-end h2 support or explicit h2c only on trusted links you understand.

### 13. Private key committed to git or world-readable on disk

Symptom: key is public; assume compromise. Fix: rotate cert + key, purge from history if needed, use secret managers and short-lived certs where possible. Restrict filesystem permissions on key material.

### 14. OCSP stapling / revocation blind spots

Some clients soft-fail revocation checks. Attackers with a stolen key may still impersonate until expiry if you never revoke operationally. Prefer short-lived certs (ACME every 60 days or less) plus automation so revocation is not your only control.

### 15. "It works with curl -k"

`-k` / `--insecure` skips verify. Useful to separate "TCP and TLS speak" from "trust and name are correct." Never treat a green `-k` response as production readiness.

---

## Debugging toolkit

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

In app logs, log **error class** (handshake failed, cert verify failed, hostname mismatch) without logging secrets. On the server, access logs rarely show TLS verify failures from the client side; you need client metrics and synthetic probes.

Browser DevTools → Security panel shows the cert chain the browser accepted. That can differ from what `openssl` sees if you hit a different POP or middlebox.

---

## Config checklist for people who ship

**Public edge**

- [ ] TLS 1.2+ (prefer 1.3), modern ciphers
- [ ] Full chain served (leaf + intermediate)
- [ ] SANs cover every hostname users type
- [ ] Automated renewal + expiry alerts (external probe)
- [ ] SNI and routing aligned per hostname
- [ ] HSTS only after HTTPS is complete for that name space
- [ ] Redirect HTTP→HTTPS on the same names without loops

**Service clients (backend, mobile, batch)**

- [ ] Verification **on**; CA bundle correct for public or private PKI
- [ ] Hostname verification on; URL host matches cert
- [ ] Time sync on hosts
- [ ] No `verify=False` / `NODE_TLS_REJECT_UNAUTHORIZED=0` in deployable config
- [ ] Timeouts and retry policy that do not amplify outages on handshake failures

**mTLS / internal**

- [ ] Rotation runbook tested
- [ ] Trust bundle distribution defined
- [ ] Identity model documented (SPIFFE URI, SAN, etc.)
- [ ] Failure mode: reject by default when cert missing

---

## Closing

HTTPS is HTTP plus a TLS session that buys you **encryption, integrity, and server identity** (and optionally client identity). The handshake negotiates keys; **certificates** bind names to keys through a chain you trust; **SNI** tells multi-cert servers which identity to present. Most production TLS incidents are not novel cryptanalysis. They are **expiry**, **broken chains**, **name mismatch**, **verification turned off**, and **the wrong hop** presenting an old cert.

When something is red, ask in order: Can I TCP connect? Does the handshake complete? Which cert is presented for this SNI name? Does the chain and hostname verify on a clean client? Which device in the path terminated TLS? That sequence beats random config churn and gets you back to a boring green padlock faster.
