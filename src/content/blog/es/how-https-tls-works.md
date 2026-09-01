---
title: "Cómo funcionan HTTPS y TLS para desarrolladores: handshake, certificados, SNI y fallos"
description: "Mapa práctico de TLS para quien publica apps web: qué hace de verdad el handshake, cómo los certificados prueban identidad, por qué importa SNI en IPs compartidas y los fallos de config que siguen rompiendo producción."
date: "2026-06-24"
tags: [Ciberseguridad y Redes]
coverImage: /assets/images/how-https-tls-works.webp
previewImage: /assets/images/how-https-tls-works.webp
---


HTTPS es HTTP sobre TLS. El navegador (o tu cliente de servicio) abre una conexión TCP y luego ejecuta un **handshake TLS** para que ambos lados acuerden claves y el cliente pueda comprobar que el servidor es quien dice ser. Después, los bytes de la aplicación (HTTP/1.1, HTTP/2, HTTP/3 sobre QUIC) viajan cifrados en la capa de registros.

No necesitas implementar crypto. Sí necesitas saber qué falla cuando un cert expira, un SAN está mal, falta SNI detrás de un reverse proxy, o "arreglaste" mixed content desactivando la verificación en un cliente de backend. Este post es ese mapa: intuición del handshake, certificados, SNI y los fallos que salen en status pages y canales de incidentes.

TLS 1.2 y TLS 1.3 son lo que verás en 2026. Las versiones viejas deberían estar apagadas. El modelo mental de abajo se centra en **TLS 1.3** (más simple en el cable) y señala dónde 1.2 sigue importando al depurar.

---

## Qué protege HTTPS de verdad

| Propiedad | Significado aproximado | Aporte de TLS |
| --- | --- | --- |
| **Confidencialidad** | Quien escucha no lee el payload | Cifrado simétrico tras el acuerdo de claves |
| **Integridad** | Se detecta la manipulación | Cifrados AEAD (cifrar + autenticar) |
| **Autenticación del servidor** | El cliente habla con el host correcto | Cadena de certificados + chequeo de hostname |
| **Autenticación del cliente** | El servidor conoce la identidad del cliente | mTLS opcional |

TLS **no** hace segura una app mala. XSS, CSRF, open redirects y auth rota siguen funcionando con el candado verde. TLS tampoco oculta **metadatos** visibles en la ruta: IPs, puertos, hostname SNI (en TLS clásico), tamaños de cert, timing y volumen de tráfico. Encrypted Client Hello (ECH) y QUIC cambian parte de ese cuadro; la mayoría de stacks que operas aún exponen SNI en claro salvo que ECH esté desplegado de punta a punta.

HTTP vs HTTPS ya no es excusa de rendimiento. TLS moderno es barato frente a parsear JSON y round trips a base de datos. El coste que notas suele ser el setup de conexión (handshake + sesión TCP/TLS) con mucho churn; por eso importan keep-alive, multiplexado HTTP/2 y reanudación de sesión.

---

## Capas que tocas como desarrollador

```
Application:  HTTP request/response (or gRPC, etc.)
    |
TLS:          handshake, certs, keys, encrypted records
    |
Transport:    TCP (or UDP for QUIC / HTTP/3)
    |
Network:      IP
```

Formas habituales de despliegue:

1. **Navegador → CDN / load balancer** termina TLS, luego HTTP en claro o TLS re-cifrado hacia el origin.
2. **Servicio A → Servicio B** con mTLS dentro de un mesh o API gateway.
3. **CLI / SDK → API pública** con trust store del sistema + verificación de hostname.

Dónde termina TLS es una decisión de seguridad. Si el load balancer descifra y habla HTTP hacia la red de pods, quien esté en esa ruta puede leer el tráfico. Muchos equipos re-cifran hacia la app ("TLS everywhere") o usan un sidecar de mesh. Documenta el límite de confianza; no asumas que "tenemos HTTPS en el edge" implica que todo el camino es privado.

---

## Certificados (la parte que falla a las 2 a.m.)

Un **certificado** es una afirmación firmada: "la clave pública P pertenece al nombre N, hasta la fecha D, bajo política…" Una **autoridad de certificación (CA)** lo firma. Tu cliente tiene un **trust store** de raíces (y a veces intermedias) en las que confía.

### Cadena de confianza

Cadena típica de un leaf:

```
Root CA (in trust store)
  → Intermediate CA
      → Leaf (your server: api.example.com)
```

El servidor debe presentar el **leaf** y normalmente el/los **intermedio(s)**. El cliente ya tiene la raíz. Un intermedio que falta es el clásico "en mi laptop va, en CI y en móvil no": los navegadores de escritorio cachean intermedios; algunos clientes no.

### Qué comprueba el cliente (simplificado)

1. La **cadena llega** a una raíz de confianza (firmas válidas, sin huecos).
2. **No expirado / no antes de** (`notBefore` / `notAfter`).
3. El **hostname** coincide: el SAN DNS (Subject Alternative Name) incluye el nombre al que te conectaste (o un wildcard válido). Solo CN es legado; los clientes modernos miran SAN.
4. **Key usage / extended key usage** permiten server auth (y client auth en certs de cliente mTLS).
5. **Revocación** (cuando se aplica): CRL, OCSP o certs de corta vida. La aplicación es irregular entre plataformas; no trates "sin OCSP staple" como "cert bueno para siempre", pero tampoco inventes un chequeo a medias.
6. **Name constraints y políticas** en PKI corporativa (menos común en la web pública).

Si algo falla, la librería TLS aborta. Tu cliente HTTP no recibe un 200 con body. Obtienes error de handshake: `CERTIFICATE_VERIFY_FAILED`, `hostname mismatch`, `unknown CA`, y compañía.

### CA pública vs CA privada vs auto-firmado

| Tipo | Uso | Confianza del cliente |
| --- | --- | --- |
| **CA pública** (Let's Encrypt, comercial) | Nombres en Internet | Trust stores por defecto de OS/navegador |
| **CA privada** | Servicios internos, mTLS, apps de empresa | Tú distribuyes la raíz/intermedia a los clientes |
| **Leaf auto-firmado** | Demos locales, break-glass | Hay que pinnear o desactivar verify (peligroso si se olvida) |

Para sitios públicos, usa una CA pública y automatiza la renovación (cert-manager, clientes ACME, certs gestionados en la nube). Para identidad de servicios internos, prefiere una CA privada con automatización (SPIFFE/SPIRE, CA del mesh, ACME interno) antes de copiar un PEM auto-firmado en cada repo.

### Wildcards y certs multi-nombre

- `*.example.com` coincide con `api.example.com`, no con `example.com`, y no con `a.b.example.com` (solo una etiqueta).
- Los SAN pueden listar muchos nombres: `www`, `api`, apex, hosts de preview.
- Un solo cert en un load balancer compartido está bien cuando SNI y la config de vhost apuntan el cert correcto al nombre correcto.

---

## Intuición del handshake TLS (TLS 1.3)

Puedes depurar sin memorizar cada vuelo. Quédate con esta historia:

1. **ClientHello**: "Hablo TLS 1.3, estas cipher suites me gustan, aquí va mi key share para el acuerdo de claves, y el nombre del servidor es `api.example.com` (SNI)."
2. **ServerHello** (+ extensiones cifradas, cert, cert verify, finished): el servidor elige parámetros, envía su **cadena de certificados**, demuestra que tiene la clave privada, y ambos derivan secretos de handshake y de tráfico de aplicación.
3. **Client Finished** (y luego application data): el cliente verifica el cert y la prueba del servidor, confirma el transcript del handshake, y ambos envían datos de aplicación bajo las nuevas claves.

TLS 1.3 suele terminar en **1-RTT** (un round trip de mensajes crypto tras el TCP). Con session tickets / reanudación PSK puedes lograr datos en **0-RTT** (con riesgos de replay: solo para requests seguras e idempotentes salvo que entiendas el riesgo).

TLS 1.2 tenía más mensajes (ServerKeyExchange, teatro de ChangeCipherSpec, baile opcional de cert de cliente con otro orden). Wireshark aún muestra 1.2 en appliances viejos. Prefiere 1.3 en la config; mantén 1.2 solo si una dependencia real lo exige, y apaga 1.0/1.1.

### Qué "prueba" al servidor

El cert une una **clave pública** a un **nombre**. En el handshake el servidor usa la **clave privada** correspondiente para que el cliente sepa que no es una caja cualquiera presentando un PEM copiado sin la clave. Robar solo el certificado PEM no basta; robar la clave privada es catastrófico hasta que revocas y rotas.

### Cipher suites (qué te importa)

Casi nunca eliges AES vs ChaCha a mano en stacks modernos. Los defaults de OpenSSL, BoringSSL, Go y motores de navegador actuales prefieren suites AEAD (AES-GCM, ChaCha20-Poly1305) y curvas modernas (X25519, P-256). Tu trabajo:

- Desactivar suites antiguas y restos export-grade si un scanner las encuentra.
- Preferir configs de servidor que sigan un perfil mantenido (Mozilla SSL Configuration Generator, política TLS "modern" del proveedor cloud).
- No inventar un cipher string a medida de un blog de 2014.

### Reanudación de sesión

Los handshakes completos cuestan CPU y latencia. La reanudación reutiliza secretos previos (tickets en 1.3). Bien para apps móviles y clientes de alto QPS. Vigila la rotación de ticket keys en terminadores multi-nodo: si cada pod tiene una ticket key aleatoria y no se comparten, la tasa de reanudación se hunde y pagas handshake completo todo el rato.

---

## SNI: una IP, muchos certificados

**Server Name Indication (SNI)** es una extensión del ClientHello que dice qué hostname quiere el cliente. Sin SNI, un servidor con muchos certs en una IP no sabe qué leaf presentar.

Por qué te importa:

1. **Load balancers / ingress compartidos**: enrutan y eligen cert por nombre SNI.
2. **CDN y plataformas multi-tenant**: misma IP anycast, distintos certs de cliente.
3. **Depuración**: `curl https://ip/` o conectar por IP sin SNI suele obtener el cert **por defecto**, que falla la verificación de hostname del nombre que pretendías.

### Fallos prácticos de SNI

| Síntoma | Causa probable |
| --- | --- |
| Navegador OK, algún cliente Java/viejo falla | El cliente no envía SNI |
| Cert equivocado (nombre de otro tenant) | Server block por defecto / TLS secret de ingress incorrecto |
| Va con `curl --resolve` pero no con DNS | DNS apunta a otro VIP del que probaste |
| mTLS o API gateway "no certificate matches" | Nombre SNI ≠ SAN del cert ≠ host de la ruta |

Prueba con un server name explícito:

```bash
# Force connect to an IP but send SNI + Host for api.example.com
openssl s_client -connect 203.0.113.10:443 -servername api.example.com </dev/null

curl -v --resolve api.example.com:443:203.0.113.10 https://api.example.com/health
```

Si omites `-servername` no estás probando el mismo camino que los usuarios.

### SNI y privacidad

El SNI clásico va en claro en TLS 1.2/1.3 sobre TCP. Quien observa la red aprende el hostname aunque el path HTTP esté cifrado. ECH busca cifrar eso; la adopción crece pero no es universal. Si tu modelo de amenaza cuida la privacidad del hostname, sabe qué despliegan de verdad tu edge y tus clientes.

---

## HTTP/2, HTTP/3 y ALPN

**ALPN** (Application-Layer Protocol Negotiation) va en el handshake para que cliente y servidor acuerden `h2`, `http/1.1` o `h3` (para QUIC). Si un middlebox quita ALPN o malconfiguras el proxy, puedes caer a HTTP/1.1 o fallar el handshake según la política del cliente.

- **HTTP/2** casi siempre exige TLS en la web pública (navegadores).
- **HTTP/3** usa **QUIC** (UDP). TLS 1.3 va dentro de QUIC; la historia del cert es la misma idea, otro empaquetado en el cable.

Cuando "HTTPS funciona pero HTTP/2 nunca negocia", revisa ALPN en el terminador y si un proxy L7 en medio solo habla HTTP/1.1 con el cliente.

---

## Mutual TLS (mTLS) en una página

En HTTPS normal solo el **servidor** presenta un cert. En **mTLS** el cliente también presenta uno. El servidor verifica la cadena del cert de cliente y (a menudo) SPIFFE ID, allowlist de CN/SAN o identidad del mesh.

Casos de uso: servicio a servicio en red zero-trust, APIs de partners, identidad de dispositivos.

Lo difícil es operativo, no criptográfico:

- Emitir y rotar certs de cliente
- Distribuir trust bundles
- Gestionar la caducidad sin un outage total
- Errores claros cuando falta el cert de cliente, está mal o expiró

No uses mTLS en una app de navegador pública como única historia de login de usuario. Los navegadores y la UX pelean contigo; úsalo para servicios y clientes controlados.

---

## Fallos de config habituales (los que llegan a prod)

### 1. Certificado expirado

Síntoma: fallo total repentino para clientes nuevos; algunas conexiones largas siguen hasta reconectar. Arreglo: renovación automática, alerta de `notAfter` con semanas de margen, monitorización desde fuera de tu red (camino del usuario). Los certs de staging también expiran.

### 2. Cadena incompleta (falta intermedio)

Síntoma: va en Chrome, falla en Java, Python, móvil o `curl` con trust store limpio. Arreglo: servir leaf + intermedio; verifica con `openssl s_client` y un checker SSL externo. No dependas de que todo el mundo haga AIA fetch.

### 3. Hostname / SAN no coincide

Síntoma: el cert es válido para `www.example.com` pero los usuarios van a `example.com` o `api.example.com`. Arreglo: incluye todos los nombres públicos en SAN, o redirige apex/www antes de terminar TLS en el nombre equivocado (las redirecciones necesitan un cert que coincida con el nombre que se golpea primero).

### 4. Reloj incorrecto

Síntoma: fallos intermitentes de verify, "cert not yet valid", o caos parecido a JWT cerca. TLS y la validez del cert dependen del tiempo. Arregla NTP en servidores y entiende hosts de contenedores que arrancan con reloj malo.

### 5. Desactivar verificación en clientes de backend

```python
# Looks like a temporary local fix. Becomes production.
requests.get(url, verify=False)
```

```javascript
// Node: same footgun
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

Síntoma: sin errores, riesgo silencioso de MITM en cualquier ruta de red que no controles del todo. Arreglo: instala el CA bundle correcto, usa el hostname correcto, o haz pin con una librería deliberada. Nunca dejes `verify=False` en código compartido.

### 6. Mixed content

Una página HTTPS carga scripts o XHR por `http://`. Los navegadores bloquean mixed content activo. Arreglo: todos los assets y APIs en HTTPS; URLs protocol-relative solo si aún hace falta (prefiere `https://` absoluto o paths root-relative en el mismo host).

### 7. TLS solo en el edge, cleartext dentro con red hostil asumida

Síntoma: la review de compliance o un movimiento lateral lee tráfico de pods. Arreglo: re-cifrar al origin, mTLS de mesh, o tratar la red privada como hostil y diseñar en consecuencia. Como mínimo, sabe qué segmentos van en claro.

### 8. Protocolos y ciphers obsoletos

Síntoma: scanner nota F; o clientes viejos aún conectan con suites débiles. Arreglo: mínimo TLS 1.2+ (preferir 1.3), política de ciphers moderna, desactivar RC4/3DES/export. Prueba hardware/POS legado antes de un corte duro.

### 9. Certificado en el dispositivo equivocado de una cadena de proxies

Cliente → CDN → API gateway → ingress → pod. Cada hop puede terminar TLS. Síntoma: renovaste el secret del ingress pero el CDN sigue con el cert viejo (o al revés). Arreglo: inventario de cada terminador; alerta en el cert presentado de cada endpoint público.

### 10. Errores con HSTS

**HSTS** dice a los navegadores que usen solo HTTPS para tu dominio (a menudo con subdominios). Bien cuando HTTPS está sólido. Doloroso si haces preload o pones `includeSubDomains` y un subdominio olvidado solo-HTTP se rompe. Arreglo: activa HSTS cuando HTTPS funcione en todo el espacio de nombres que necesitas; trata el preload como prácticamente permanente.

### 11. Cliente usa IP en la URL y el cert solo tiene SAN DNS

`https://203.0.113.10/` falla salvo que el cert tenga esa IP en SAN (raro en sitios públicos). Usa nombres DNS.

### 12. Backends gRPC / HTTP/2 y config TLS incompleta

gRPC quiere HTTP/2. ALPN mal puesto o un proxy que degrada a HTTP/1.1 produce errores opacos. Arreglo: soporte h2 de punta a punta o h2c explícito solo en enlaces de confianza que entiendas.

### 13. Clave privada en git o legible para todos en disco

Síntoma: la clave es pública; asume compromiso. Arreglo: rota cert + clave, limpia historial si hace falta, usa secret managers y certs de corta vida cuando puedas. Restringe permisos de filesystem del material de clave.

### 14. OCSP stapling / puntos ciegos de revocación

Algunos clientes hacen soft-fail en checks de revocación. Un atacante con clave robada puede impersonar hasta la caducidad si no operas revocación. Prefiere certs de corta vida (ACME cada 60 días o menos) más automatización para que la revocación no sea tu único control.

### 15. "Funciona con curl -k"

`-k` / `--insecure` salta la verificación. Útil para separar "TCP y TLS hablan" de "confianza y nombre son correctos". Nunca trates una respuesta verde con `-k` como listo para producción.

---

## Caja de herramientas de depuración

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

En logs de app, registra la **clase de error** (handshake fallido, cert verify fallido, hostname mismatch) sin loguear secretos. En el servidor, los access logs rara vez muestran fallos de verify TLS del lado del cliente; necesitas métricas de cliente y probes sintéticos.

DevTools del navegador → panel Security muestra la cadena de cert que aceptó el navegador. Puede diferir de lo que ve `openssl` si golpeas otro POP o middlebox.

---

## Checklist de config para quien publica

**Edge público**

- [ ] TLS 1.2+ (preferir 1.3), ciphers modernos
- [ ] Cadena completa servida (leaf + intermedio)
- [ ] SANs cubren cada hostname que escribe el usuario
- [ ] Renovación automática + alertas de caducidad (probe externo)
- [ ] SNI y routing alineados por hostname
- [ ] HSTS solo cuando HTTPS esté completo en ese espacio de nombres
- [ ] Redirect HTTP→HTTPS en los mismos nombres sin bucles

**Clientes de servicio (backend, móvil, batch)**

- [ ] Verificación **activa**; CA bundle correcto para PKI pública o privada
- [ ] Verificación de hostname activa; host de la URL coincide con el cert
- [ ] Sincronización de hora en hosts
- [ ] Nada de `verify=False` / `NODE_TLS_REJECT_UNAUTHORIZED=0` en config desplegable
- [ ] Timeouts y reintentos que no amplifiquen outages en fallos de handshake

**mTLS / interno**

- [ ] Runbook de rotación probado
- [ ] Distribución del trust bundle definida
- [ ] Modelo de identidad documentado (URI SPIFFE, SAN, etc.)
- [ ] Modo de fallo: rechazar por defecto si falta el cert

---

## Cierre

HTTPS es HTTP más una sesión TLS que te da **cifrado, integridad e identidad del servidor** (y opcionalmente del cliente). El handshake negocia claves; los **certificados** unen nombres a claves mediante una cadena en la que confías; **SNI** dice a servidores multi-cert qué identidad presentar. La mayoría de incidentes TLS en producción no son criptoanálisis novedoso. Son **caducidad**, **cadenas rotas**, **nombre que no coincide**, **verificación apagada** y **el hop equivocado** presentando un cert viejo.

Cuando algo está en rojo, pregunta en orden: ¿Puedo conectar por TCP? ¿Completa el handshake? ¿Qué cert se presenta para este nombre SNI? ¿Verifican la cadena y el hostname en un cliente limpio? ¿Qué dispositivo del camino terminó TLS? Esa secuencia gana a tocar config al azar y te devuelve antes a un candado verde aburrido.

