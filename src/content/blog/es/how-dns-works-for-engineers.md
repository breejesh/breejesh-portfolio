---
title: "Cómo funciona DNS para ingenieros: ruta de resolución, registros, TTL y dig"
description: "La ruta de resolución DNS del stub al nameserver autoritativo, los registros que sí editas (A, AAAA, CNAME, MX, TXT), cómo TTL y cachés retrasan cada cambio, y cómo depurar con dig."
date: "2026-07-02"
tags: [Ciberseguridad y Redes]
coverImage: /assets/images/how-dns-works-for-engineers.webp
previewImage: /assets/images/how-dns-works-for-engineers.webp
---

DNS es la guía telefónica de internet, y esa analogía solo sirve a medias. Un ingeniero no necesita un cuento sobre "buscar nombres." Necesitas la **ruta de resolución**, los **tipos de registro que publicas**, cómo **TTL y cachés** retrasan cada cambio, y memoria muscular con **`dig`** cuando producción dice que el host está bien y los usuarios dicen que no.

Si despliegas apps, migras dominios, montas correo o depuras "en mi máquina funciona" tras un cambio de DNS, este es el mapa.

---

## Qué responde DNS de verdad

Escribes `api.example.com`. Tu máquina necesita una IP (o un fallo). DNS devuelve **resource records** para un nombre y un tipo. La pregunta habitual es "cuál es el A/AAAA de este hostname?" El correo pide MX. Certificados y anti-spam piden TXT. Balanceadores y multi-cloud suelen apoyarse en CNAME.

DNS **no** es enrutado HTTP, ni TLS, ni load balancing. Eso empieza cuando el cliente ya tiene una dirección de destino (o cuando la cadena CNAME termina en una). DNS es el paso de directorio antes del handshake TCP.

---

## La ruta de resolución

La mayoría de las consultas no son "un servidor responde todo." Son una cadena corta de roles.

### Roles

| Rol | Quién | Trabajo |
| --- | --- | --- |
| **Stub resolver** | OS / libc / runtime de tu lenguaje | Pregunta a un recursive resolver; a menudo tiene una caché local minúscula |
| **Recursive resolver** | ISP, `1.1.1.1`, `8.8.8.8`, DNS corporativo, resolver de VPC | Recorre la jerarquía, cachea respuestas, devuelve el resultado final al stub |
| **Root nameservers** | Operadores de la zona raíz (`.`) | Señalan los servidores del TLD correcto (`com.`, `org.`, `io.`, …) |
| **TLD nameservers** | Registro de ese TLD | Señalan los nameservers **autoritativos** del dominio |
| **Authoritative nameserver** | Tu proveedor DNS (Route 53, Cloudflare, NS1, BIND/PowerDNS propio) | Guarda los registros que publicas para `example.com` |

El recursive hace el trabajo pesado. Tu portátil casi nunca habla con root o TLD. Redes corporativas y VPC en la nube suelen forzar todos los stubs por un recursive de empresa o de VPC. Por eso "en casa resuelve y en el cluster no" es una clase real de bugs.

### Camino feliz para el A de `www.example.com`

1. La app o el navegador pregunta al stub: "A de `www.example.com`?"
2. El stub pregunta al recursive configurado (DHCP, `/etc/resolv.conf` o el default de la plataforma).
3. Si el recursive tiene **caché fresca** para ese nombre y tipo, responde al momento. Fin.
4. Si no, el recursive arranca en root (o usa NS cacheados de `com.` / `example.com`):
   - Root: "para `com.`, pregunta a estos NS de TLD."
   - TLD: "para `example.com`, pregunta a estos NS autoritativos" (a menudo con glue A/AAAA de los hosts NS).
   - Autoritativo: "aquí va el A (o CNAME, o NXDOMAIN, o NODATA)."
5. El recursive cachea según TTL (y reglas de caché negativa ante fallos) y devuelve la respuesta al stub.
6. El cliente abre conexión hacia la(s) IP(s).

Las consultas suelen ir por **UDP** puerto 53. Respuestas grandes o truncadas caen a **TCP** 53. DNS over HTTPS (DoH) y DNS over TLS (DoT) envuelven las mismas preguntas en transportes cifrados; la jerarquía no cambia.

### Iteración vs recursión

- **Consulta recursiva**: el stub dice "resuelve esto por completo por mí." El recursive hace el recorrido.
- **Consulta iterativa**: un servidor responde con un referral ("pregunta a estos otros servidores") en lugar de la respuesta final. Los resolvers usan consultas iterativas contra root/TLD/autoritativo mientras sirven a clientes recursivos.

Si apuntas `dig` a un servidor autoritativo sin esperar recursión, puedes ver referrals o rechazo de recursión. Es normal.

---

## Tipos de registro que sí editas

No necesitas todos los RR. Estos cinco cubren casi todo el trabajo de producto.

### A y AAAA

| Tipo | Significado |
| --- | --- |
| **A** | Dirección IPv4 de un nombre |
| **AAAA** | Dirección IPv6 de un nombre |

Ejemplo:

```
api.example.com.    300    IN    A       203.0.113.10
api.example.com.    300    IN    AAAA    2001:db8::10
```

Varios registros A/AAAA significan varias respuestas. El cliente elige (a menudo la primera, a veces round-robin o happy-eyeballs entre familias). Dual-stack significa A y AAAA; un AAAA roto con IPv6 mal configurado es el clásico "solo a algunos usuarios les falla el sitio."

### CNAME

**CNAME** mapea un nombre a **otro nombre**, no a una IP.

```
www.example.com.    300    IN    CNAME    lb.example.net.
```

Reglas que pican:

1. Un nombre con CNAME no debería tener otros datos en el mismo owner (no A + CNAME juntos). CNAME en apex/`@` suele estar prohibido o se sustituye por ALIAS/ANAME del proveedor.
2. Los resolvers siguen la cadena hasta A/AAAA (o fallan). Cadenas largas suman latencia y puntos de fallo.
3. El TTL de los CNAME intermedios importa; la vida efectiva en caché la limita la cadena.

Usa CNAME cuando el vendor posee el hostname destino (CDN, LB gestionado). Usa A/AAAA cuando fijas IPs que controlas.

### MX

**MX** dice a los sistemas de correo dónde entregar para un dominio.

```
example.com.    3600    IN    MX    10 mail1.example.com.
example.com.    3600    IN    MX    20 mail2.example.com.
```

El número de preferencia más bajo se prueba primero (10 antes que 20). El destino MX debe resolver a A/AAAA; evita apuntar MX a un CNAME suelto si puedes (algunos proveedores aún avisan o rompen).

### TXT

**TXT** es texto libre. Usos habituales:

- SPF, DKIM, DMARC para autenticación de correo
- Verificación de dominio en cloud y SaaS (`google-site-verification=…`, desafíos ACME DNS-01)
- Flags de producto arbitrarios (raro; mejor un config store de verdad)

```
example.com.    300    IN    TXT    "v=spf1 include:_spf.google.com ~all"
```

Valores TXT largos pueden partirse en trozos entre comillas. Al depurar, concatena las cadenas en orden.

### Mapa rápido

| Tipo | Responde | Owner típico |
| --- | --- | --- |
| A / AAAA | Dónde conectar (IP) | Hosts de API, apex (si no hay ALIAS) |
| CNAME | Nombre canónico | `www`, subdominios alojados por vendor |
| MX | Intercambiadores de correo | Apex / dominio de mail |
| TXT | Cadenas de política y prueba | Apex, `_dmarc`, nombres ACME |

NS y SOA importan para la autoridad de la zona y la caché negativa. SRV aparece en service discovery y algunos protocolos. Apréndelos cuando operes tus propias zonas o discovery estilo Kubernetes; el día a día de deploys toca sobre todo los cinco de arriba.

---

## TTL y caché: por qué DNS "tarda una eternidad"

**TTL** (time to live) es cuánto tiempo un **resolver con caché** puede reutilizar una respuesta sin volver a preguntar a la autoridad. Va en segundos en el registro.

```
api.example.com.    60    IN    A    203.0.113.10
```

Aquí, los recursive pueden cachear ese A hasta 60 segundos. Tu navegador, OS, runtime, JVM y sidecar pueden cachear **encima**. Así que "bajé el TTL hace una hora" no significa que todos los clientes giraron en el mismo segundo.

### Hábitos prácticos de TTL

| Situación | Rango habitual | Notas |
| --- | --- | --- |
| Apex / sitio estable | 300s-3600s | Bien cuando las IP casi no se mueven |
| Antes de un cutover | Bajar pronto (60s-300s) | Baja el TTL **antes** de la ventana para que las cachés caduquen |
| Después del cutover | Subir otra vez al estabilizar | Evita martillar el autoritativo y absorbe microcortes |
| Failover frecuente | TTL bajo + DNS con health o un camino más corto fuera de DNS | DNS solo es un failover tosco |

Las respuestas negativas (NXDOMAIN, NODATA) también se cachean, a menudo con los campos SOA **MINIMUM** / negative-TTL. Un delete equivocado puede pegarse minutos aunque en la autoridad "ya esté arreglado."

### Dónde se esconden las respuestas

1. Caché DNS del navegador
2. Caché del stub del OS
3. Caché del recursive corporativo o de VPC
4. Caché de resolvers públicos (compartida entre muchos usuarios)
5. Autoritativo (fuente de verdad, pero no es lo que ve cada cliente aún)

Cuando alguien dice "DNS ya está actualizado," pregunta **qué capa miró**. Autoritativo bien + recursive viejo es la historia típica de cutover.

---

## Depurar con dig

`dig` es la herramienta estándar. Prefiérelo a `nslookup` por flags claros y mensajes completos.

### Lookups básicos

```bash
# A por defecto vía resolvers del sistema
dig api.example.com

# Tipo concreto
dig AAAA api.example.com
dig MX example.com
dig TXT example.com
dig CNAME www.example.com

# Solo respuesta corta
dig +short api.example.com
dig +short MX example.com
```

### Preguntar a un servidor concreto

```bash
# Recursive público
dig @1.1.1.1 api.example.com
dig @8.8.8.8 api.example.com

# Autoritativo (usa NS del padre o del panel)
dig @ns-123.awsdns-45.com api.example.com
```

Compara **autoritativo** vs **recursive**. Si la autoridad está bien y Google/Cloudflare aún muestran la IP vieja, esperas TTL o miras otro conjunto de registros (nombre mal, tipo mal, zona de otra cuenta).

### Trazar la jerarquía

```bash
dig +trace api.example.com
```

`+trace` recorre root → TLD → autoritativo como un recursive en frío. Ideal para "¿está rota la delegación?" y problemas de glue.

### Flags útiles

| Flag | Uso |
| --- | --- |
| `+short` | Respuestas compactas para scripts |
| `+norecurse` | Pregunta sin bit RD; ver referrals |
| `+trace` | Camino iterativo completo desde root |
| `+dnssec` | Datos RRSIG/DNSKEY al validar |
| `+tcp` | Forzar TCP (truncado o firewall) |
| `-p 53` | Puerto no default (lab / listeners alternativos) |

### Leer la línea de status

En la sección `HEADER`, el **status** importa:

| Status | Significado |
| --- | --- |
| **NOERROR** | La consulta ok (la answer puede ir vacía en NODATA) |
| **NXDOMAIN** | El nombre no existe |
| **SERVFAIL** | El resolver falló (cadena rota, DNSSEC, timeout upstream) |
| **REFUSED** | El servidor no contesta esa query |

Mira también los **flags**: `aa` significa respuesta autoritativa de esa zona. `ra` significa que hay recursión disponible. `ad` se relaciona con datos autenticados cuando entra DNSSEC.

### Ejemplo: checklist de cutover con dig

```bash
# 1. ¿A qué NS delega el padre?
dig NS example.com +short

# 2. ¿Qué dice la autoridad ahora?
dig @YOUR_AUTH_NS api.example.com A +noall +answer

# 3. ¿Qué dicen grandes recursive públicos?
dig @1.1.1.1 api.example.com A +noall +answer
dig @8.8.8.8 api.example.com A +noall +answer

# 4. TTL restante en la respuesta cacheada (desde un recursive)
dig api.example.com A
# Mira el número TTL en la answer; en ese resolver va bajando
```

Si usas split-horizon DNS (respuestas internas distintas de las públicas), prueba siempre desde un host de la misma clase de red que el cliente que falla.

---

## Fallos que de verdad pegan a ingenieros

1. **No bajaste el TTL antes del cutover.** IPs viejas se quedan en cachés recursive del mundo. Planifica bajar el TTL horas o un día antes en registros populares.
2. **CNAME en apex.** Algunas UIs lo permiten; muchos estándares y proveedores no. Usa ALIAS/ANAME o A/AAAA plano.
3. **Tipo de registro equivocado.** Los clientes piden AAAA y solo publicaste A (o al revés). O el mail se rompe porque el MX sigue en el host viejo mientras actualizaste el A.
4. **Glue / NS desalineados.** Cambiaste nameservers en el registrar pero la zona nueva está vacía, o los hosts NS no resuelven. `dig +trace` lo saca.
5. **Override del recursive corporativo.** En casa el portátil usa 1.1.1.1; en la oficina el tráfico va a un resolver filtrante con su propia caché y políticas.
6. **Caché DNS a nivel de app.** Java, pools de Node, Envoy y OS móviles ignoran tu modelo mental de "dig está verde, la app está verde."
7. **Search domains y ndots.** Las search lists de `/etc/resolv.conf` convierten `api` en `api.default.svc.cluster.local` dentro de Kubernetes. Eso es DNS, y sorprende.

DNS está bien cuando **el nombre, el tipo, la vista (pública vs privada) y la capa de caché** coinciden con el cliente que te importa. Arreglar solo el panel autoritativo es necesario, no suficiente.

---

## Modelo mental mínimo

1. El stub pregunta al recursive; el recursive recorre root → TLD → autoritativo (salvo hit de caché).
2. Publicas **registros** (A, AAAA, CNAME, MX, TXT, …) en el servidor **autoritativo**.
3. El **TTL** controla cuánto pueden retrasarse las cachés respecto a tus ediciones.
4. **`dig @server name TYPE`** te dice qué cree una capa concreta ahora mismo.
5. Los incidentes tras cambios de DNS suelen ser lag de caché, nombre/tipo mal, o delegación rota, no "internet caído."

Domina esa ruta y `dig` deja de ser un comando misterioso y pasa a ser la primera herramienta cuando el hostname es el sospechoso.
