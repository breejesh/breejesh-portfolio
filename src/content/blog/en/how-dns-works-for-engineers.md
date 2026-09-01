---
title: "How DNS Works for Engineers: Resolution Path, Records, TTL, and dig"
description: "The DNS resolution path from stub resolver to authoritative nameserver, the records you actually edit (A, AAAA, CNAME, MX, TXT), how TTL and caching shape outages, and how to debug with dig."
date: "2026-07-02"
tags: [Cybersecurity & Networking]
coverImage: /assets/images/how-dns-works-for-engineers.webp
previewImage: /assets/images/how-dns-works-for-engineers.webp
---


Comparing DNS to a phone book is only partially helpful. Real systems engineering requires understanding the full recursive resolution pipeline, record type caching, and TTL propagation delays. Engineers do not need a fairy tale about "looking up names." You need the **resolution path**, the **record types you ship**, how **TTL and caches** delay every change, and a muscle memory for **`dig`** when production says the host is fine and users say it is not.

If you deploy apps, cut over domains, set up mail, or debug "works on my machine" after a DNS change, this is the map.

---

## What DNS actually answers

You type `api.example.com`. Your machine needs an IP (or a failure). DNS returns **resource records** for a name and a type. The common question is "what is the A/AAAA for this hostname?" Mail asks for MX. Certificates and anti-spam ask for TXT. Load balancers and multi-cloud often lean on CNAME.

DNS is **not** HTTP routing, TLS, or load balancing. Those start after the client has a destination address (or after a CNAME chain ends in one). DNS is the directory step before the TCP handshake.

---

## The resolution path

Most lookups are not "one server answers everything." They are a short chain of roles.

### Roles

| Role | Who | Job |
| --- | --- | --- |
| **Stub resolver** | OS / libc / your language runtime | Asks a recursive resolver; often has a tiny local cache |
| **Recursive resolver** | ISP, `1.1.1.1`, `8.8.8.8`, corporate DNS, VPC resolver | Walks the hierarchy, caches answers, returns the final result to the stub |
| **Root nameservers** | The root zone (`.`) operators | Point at the right TLD servers (`com.`, `org.`, `io.`, …) |
| **TLD nameservers** | Registry for that TLD | Point at the domain's **authoritative** nameservers |
| **Authoritative nameserver** | Your DNS host (Route 53, Cloudflare, NS1, self-hosted BIND/PowerDNS) | Holds the records you publish for `example.com` |

The recursive resolver does the heavy lifting. Your laptop almost never talks to root or TLD servers directly. Corporate networks and cloud VPCs often force all stubs through a company or VPC recursive resolver. That is why "I can resolve it at home but not in the cluster" is a real class of bugs.

### Happy path for `www.example.com` A record

1. App or browser asks the stub: "A for `www.example.com`?"
2. Stub asks the configured recursive resolver (DHCP, `/etc/resolv.conf`, or platform default).
3. If the recursive has a **fresh cache** for that name and type, it answers immediately. Done.
4. Otherwise the recursive starts at the root (or uses cached NS for `com.` / `example.com`):
   - Root: "for `com.`, ask these TLD NS."
   - TLD: "for `example.com`, ask these authoritative NS" (often with glue A/AAAA for the NS hosts).
   - Authoritative: "here is the A (or CNAME, or NXDOMAIN, or NODATA)."
5. Recursive caches according to TTL (and negative-cache rules for failures), returns the answer to the stub.
6. Client opens a connection to the IP(s).

Queries are usually **UDP** on port 53. Large responses or truncated answers fall back to **TCP** 53. DNS over HTTPS (DoH) and DNS over TLS (DoT) wrap the same questions in encrypted transports; the hierarchy does not change.

### Iteration vs recursion

- **Recursive query**: stub says "please full-resolve this for me." The recursive resolver does the walk.
- **Iterative query**: a server replies with a referral ("ask these other servers") instead of the final answer. Resolvers use iterative queries against root/TLD/authoritative while serving recursive clients.

If you point `dig` at an authoritative server without `+recurse` expectations, you may get referrals or refuse recursion. That is normal.

---

## Record types you will edit

You do not need every RR type. These five cover most product work.

### A and AAAA

| Type | Meaning |
| --- | --- |
| **A** | IPv4 address for a name |
| **AAAA** | IPv6 address for a name |

Example:

```
api.example.com.    300    IN    A       203.0.113.10
api.example.com.    300    IN    AAAA    2001:db8::10
```

Multiple A/AAAA records mean multiple answers. Clients pick (often the first, sometimes round-robin or happy-eyeballs across families). Dual-stack means both A and AAAA exist; broken IPv6 with a live AAAA is a classic "site works for some users only" failure.

### CNAME

**CNAME** maps a name to another **name**, not an IP.

```
www.example.com.    300    IN    CNAME    lb.example.net.
```

Rules that bite people:

1. A name with a CNAME should not own other data at the same owner name (no A + CNAME together). Apex/`@` CNAME is often forbidden or replaced by ALIAS/ANAME vendor features.
2. Resolvers follow the chain until they hit A/AAAA (or fail). Long chains add latency and failure points.
3. TTL on intermediate CNAMEs still matters; the effective cache life is constrained by the chain.

Use CNAME when a vendor owns the target hostname (CDN, managed LB). Use A/AAAA when you pin IPs you control.

### MX

**MX** tells mail systems where to deliver for a domain.

```
example.com.    3600    IN    MX    10 mail1.example.com.
example.com.    3600    IN    MX    20 mail2.example.com.
```

Lower preference number is tried first (10 before 20). The MX target must resolve to A/AAAA; do not point MX at a bare CNAME if you can avoid it (some providers still warn or break).

### TXT

**TXT** is free-form text. Common uses:

- SPF, DKIM, DMARC for mail auth
- Domain verification for cloud and SaaS (`google-site-verification=…`, ACME DNS-01 challenges)
- Arbitrary product flags (rare; prefer real config stores)

```
example.com.    300    IN    TXT    "v=spf1 include:_spf.google.com ~all"
```

Long TXT values may be split into quoted chunks. When debugging, concatenate the strings in order.

### Quick map

| Type | Answers | Typical owner |
| --- | --- | --- |
| A / AAAA | Where to connect (IP) | API hosts, apex (if not ALIAS) |
| CNAME | Canonical name | `www`, vendor-hosted subdomains |
| MX | Mail exchangers | Apex / mail domain |
| TXT | Policy and proof strings | Apex, `_dmarc`, ACME names |

NS and SOA matter for zone authority and negative caching. SRV shows up in service discovery and some protocols. Learn those when you run your own zones or Kubernetes-style discovery; day-to-day app deploys mostly touch the five above.

---

## TTL and caching: why DNS "takes forever"

**TTL** (time to live) is how long a **caching resolver** may reuse an answer without re-asking the authority. It is in seconds on the record.

```
api.example.com.    60    IN    A    203.0.113.10
```

Here, recursive resolvers may cache that A for up to 60 seconds. Your browser, OS, language runtime, JVM, and sidecar may cache **on top** of that. So "I lowered TTL an hour ago" does not mean every client flipped at the same second.

### Practical TTL habits

| Situation | Common TTL range | Notes |
| --- | --- | --- |
| Stable apex / brand site | 300s-3600s | Fine when IPs rarely move |
| Before a cutover | Lower early (60s-300s) | Drop TTL **before** the change window so caches expire |
| After a cutover | Raise again when stable | Stops hammering authoritative and absorbs blips |
| Failover you expect often | Low TTL + health-aware DNS or shorter path outside DNS | DNS alone is a blunt failover tool |

Negative answers (NXDOMAIN, NODATA) are also cached, often using SOA **MINIMUM** / negative-TTL fields. A wrong delete can stick for minutes even if you "fixed it" at the authority.

### Where answers hide

1. Browser DNS cache
2. OS stub cache
3. Corporate or VPC recursive cache
4. Public resolver cache (shared across many users)
5. Authoritative (source of truth, but not what every client sees yet)

When someone says "DNS is updated," ask **which layer they checked**. Authoritative correct + recursive stale is the usual cutover story.

---

## Debugging with dig

`dig` is the standard tool. Prefer it over `nslookup` for clear flags and full messages.

### Basic lookups

```bash
# Default A lookup via your system resolvers
dig api.example.com

# Specific type
dig AAAA api.example.com
dig MX example.com
dig TXT example.com
dig CNAME www.example.com

# Short answer only
dig +short api.example.com
dig +short MX example.com
```

### Ask a specific server

```bash
# Public recursive
dig @1.1.1.1 api.example.com
dig @8.8.8.8 api.example.com

# Authoritative (use NS from the parent or your panel)
dig @ns-123.awsdns-45.com api.example.com
```

Compare **authoritative** vs **recursive**. If authority is right and Google/Cloudflare still show the old IP, you are waiting on TTL or looking at a different record set (wrong name, wrong type, wrong account zone).

### Trace the hierarchy

```bash
dig +trace api.example.com
```

`+trace` walks root → TLD → authoritative the way a cold recursive would. Great for "is the delegation broken?" and glue problems.

### Useful flags

| Flag | Use |
| --- | --- |
| `+short` | Compact answers for scripts |
| `+norecurse` | Ask without RD bit; see referrals |
| `+trace` | Full iterative path from root |
| `+dnssec` | Show RRSIG/DNSKEY-related data when validating |
| `+tcp` | Force TCP (truncated or firewall issues) |
| `-p 53` | Non-default port (lab / alternative listeners) |

### Read the status line

In the `HEADER` section, **status** matters:

| Status | Meaning |
| --- | --- |
| **NOERROR** | Query succeeded (answer section may still be empty for NODATA) |
| **NXDOMAIN** | Name does not exist |
| **SERVFAIL** | Resolver failed (broken chain, DNSSEC fail, upstream timeout) |
| **REFUSED** | Server will not answer that query |

Also note **flags**: `aa` means the answer is from an authoritative server for that zone. `ra` means recursion is available. `ad` relates to authenticated data when DNSSEC validation is in play.

### Example: cutover checklist with dig

```bash
# 1. What NS does the parent delegate to?
dig NS example.com +short

# 2. What does authority say right now?
dig @YOUR_AUTH_NS api.example.com A +noall +answer

# 3. What do big public resolvers say?
dig @1.1.1.1 api.example.com A +noall +answer
dig @8.8.8.8 api.example.com A +noall +answer

# 4. TTL left on the cached answer (from a recursive)
dig api.example.com A
# Watch the TTL number on the answer; it counts down on that resolver
```

If you use split-horizon DNS (internal answers differ from public), always test from a host in the same network class as the failing client.

---

## Failure modes engineers actually hit

1. **TTL not lowered before cutover.** Old IPs stick in recursive caches worldwide. Plan TTL drop hours or a day ahead for popular records.
2. **CNAME at apex.** Some UIs allow it; many DNS standards and providers do not. Use ALIAS/ANAME or plain A/AAAA.
3. **Wrong record type.** Clients look up AAAA, you only published A (or the reverse). Or mail breaks because MX still points at the old host while A was updated.
4. **Glue / NS mismatch.** You changed nameservers at the registrar but the new zone is empty, or NS hosts do not resolve. `dig +trace` surfaces this.
5. **Corporate recursive override.** Laptops use 1.1.1.1 at home; in-office traffic is forced through a filtering resolver with its own cache and policies.
6. **Application-level DNS cache.** Java, Node connection pools, Envoy, and mobile OS caches ignore your mental model of "dig is green so the app is green."
7. **Search domains and ndots.** `/etc/resolv.conf` search lists turn `api` into `api.default.svc.cluster.local` inside Kubernetes. That is DNS, and it surprises people.

DNS is correct when **the name, type, view (public vs private), and caching layer** all match the client you care about. Fixing only the authoritative panel is necessary but not sufficient.

---

## Minimal mental model to keep

1. Stub asks recursive; recursive walks root → TLD → authoritative (unless cache hits).
2. You publish **records** (A, AAAA, CNAME, MX, TXT, …) at the **authoritative** server.
3. **TTL** controls how long caches may lag your edits.
4. **`dig @server name TYPE`** tells you what a specific layer believes right now.
5. Outages after DNS changes are usually cache lag, wrong name/type, or broken delegation, not "the internet is down."

Master that path and `dig` stops being a mystery command and becomes the first tool you reach for when the hostname is the suspect.

