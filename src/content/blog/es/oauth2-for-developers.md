---
title: "OAuth 2.0 para desarrolladores: authorization code, PKCE, tokens y errores habituales"
description: "Cómo funciona de verdad el authorization code flow con PKCE, para qué sirven access y refresh tokens, y los fallos de implementación que filtran sesiones o rompen clientes móviles."
date: "2026-07-06"
tags: [Ciberseguridad y Redes]
coverImage: /assets/images/oauth2-for-developers.webp
previewImage: /assets/images/oauth2-for-developers.webp
---


OAuth 2.0 es el protocolo que usa la mayoría de las apps cuando un usuario dice "deja que esta app lea mi calendario" sin entregar la contraseña. Aun así se despliegan implementaciones rotas: SPA sin PKCE, tokens en query strings, `state` omitido "para el MVP", refresh tokens guardados como si fueran cookies de sesión, e implicit flow copiado de un sample de 2018.

Este post es un mapa práctico de **authorization code + PKCE**, los tipos de token que tocas cada día, y los bugs que aparecen en code review y en incidentes.

OAuth es **autorización** (acceso delegado). La **autenticación** ("quién es este usuario") suele ser OpenID Connect encima. Puedes implementar OAuth sin OIDC. No inventes tu propio protocolo de login cuando ya existe un stack estándar.

---

## Los cuatro roles (nombres claros)

| Rol | Quién | Trabajo |
| --- | --- | --- |
| **Resource owner** | El usuario (o una service account) | Concede acceso a datos protegidos |
| **Client** | Tu app (web, móvil, backend, CLI) | Pide tokens y llama APIs |
| **Authorization server** | Identity provider (Auth0, Okta, Cognito, Keycloak, tu IdP) | Autentica al usuario y emite tokens |
| **Resource server** | La API que guarda los datos | Acepta access tokens y aplica scopes |

La confusión empieza cuando el mismo producto es client y resource server, o cuando el BFF (backend-for-frontend) es el client y la SPA no lo es. Dibuja las cajas antes de copiar un tutorial de librería.

Los **clientes confidenciales** pueden guardar un client secret (apps web server-side, muchos BFF). Los **clientes públicos** no (apps nativas, SPA puras en el navegador). Un cliente público no debe confiar en un secret que viaja en un binario o en un bundle de JavaScript.

---

## Por qué no "enviar la contraseña y listo"

Compartir contraseñas falla en producto y en seguridad:

1. La app de terceros aprende la contraseña del usuario en tu servicio (o en Google, GitHub, etc.).
2. No puedes dar acceso **limitado** (leer calendario, no borrar correo).
3. No puedes **revocar** una app sin resetear la contraseña.
4. No puedes auditar qué apps tienen acceso.

OAuth emite **credenciales con scope y revocables** (tokens) que no son la contraseña.

---

## Authorization code flow (el valor por defecto)

El authorization code flow es el camino principal para apps con usuario en OAuth 2.0 y el único flujo interactivo que OAuth 2.1 quiere que mantengas.

A alto nivel:

1. El client manda al usuario al endpoint `/authorize` del authorization server con `client_id`, `redirect_uri`, `scope`, `response_type=code`, `state` y (con PKCE) `code_challenge` + `code_challenge_method`.
2. El usuario se autentica y da consentimiento.
3. El authorization server redirige a `redirect_uri` con un **`code`** de corta vida y el mismo `state`.
4. El client intercambia el `code` (más `code_verifier` con PKCE, más `client_secret` si es confidencial) en el **token endpoint** por un canal de back channel.
5. El token endpoint devuelve `access_token`, a menudo `refresh_token`, y (con OIDC) `id_token`.

El navegador ve el **code** en el redirect, no el access token. Ese es el punto: el token valioso se obtiene en una petición que no se queda en el historial, en cabeceras Referer ni en logs intermedios como un token en fragment o query.

### Forma mínima de la URL de authorize

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

### Forma del intercambio de token

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=THE_CODE
&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback
&client_id=YOUR_CLIENT_ID
&code_verifier=THE_ORIGINAL_VERIFIER
```

Los clientes confidenciales también se autentican (HTTP Basic con client id/secret, o `client_secret_post`, según el registro). El `redirect_uri` del token request debe coincidir con el usado para obtener el code.

---

## PKCE: cortar la intercepción del authorization code

**PKCE** (Proof Key for Code Exchange, RFC 7636) ata el token request al client que inició el authorize.

Cómo funciona:

1. El client genera un **`code_verifier`** de alta entropía (43-128 caracteres, charset URL unreserved).
2. Deriva **`code_challenge`** = `BASE64URL(SHA256(code_verifier))` con método `S256`.
3. El authorize envía solo el challenge (y el método).
4. El token request envía el verifier original.
5. El authorization server hashea el verifier y lo compara con el challenge guardado.

Si un atacante roba el redirect (esquemas URL custom en móvil, apps mal configuradas, logs filtrados), sigue sin el verifier, que nunca salió del client legítimo.

### ¿Quién necesita PKCE?

| Tipo de client | PKCE |
| --- | --- |
| Nativo / móvil | Obligatorio |
| SPA en navegador sin secret | Obligatorio |
| Server / BFF confidencial | Muy recomendado (OAuth 2.1 lo trata como estándar) |

No uses el método `plain` en producción. Usa **`S256`**.

### Esbozo de PKCE (browser o Node)

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

Guarda `codeVerifier` solo durante el intento de login (sessionStorage, memoria, o sesión de servidor en un BFF). Nunca lo registres en logs.

---

## Tokens: para qué sirve cada uno

| Token | Audiencia | Vida típica | Propósito |
| --- | --- | --- | --- |
| **Authorization code** | Solo el token endpoint | Segundos a pocos minutos, un solo uso | Puente del redirect del browser a la respuesta de tokens |
| **Access token** | Resource servers | Minutos (5-60 habitual) | Credencial Bearer en llamadas API |
| **Refresh token** | Token endpoint del authorization server | Horas a días/meses | Obtener nuevos access tokens sin interacción del usuario |
| **ID token** (OIDC) | El client | Corta, como el access o menos | Probar identidad al client; no es una API key |

### Access tokens

Suelen ser un **JWT** o un token **opaco** de referencia.

- JWT: el resource server valida firma y claims offline (issuer, audience, expiry, scopes). Más grande; revocación instantánea difícil sin TTL corto o denylist.
- Opaco: el resource server hace introspección en el authorization server (o en caché). Más pequeño en red, revocación central, más hop o complejidad de caché.

Envía access tokens en la cabecera **`Authorization: Bearer`**. No los pongas en query strings. No los pongas en URLs que acaben en analytics, logs de CDN o historial del browser.

### Refresh tokens

Los refresh tokens son más sensibles que los access porque duran más y fabrican access nuevos.

Reglas que evitan dolor:

1. Guárdalos solo donde puedas protegerlos (cookies httpOnly seguras en un BFF, keychain del SO en móvil, sesión cifrada en servidor). Evita `localStorage` en una SPA pública si puedes.
2. Prefiere **rotación de refresh token**: cada refresh devuelve uno nuevo e invalida el anterior. Reusar un refresh viejo es señal de robo; revoca la familia.
3. Ata el refresh al client id (y, si existe, a mecanismos sender-constrained).
4. Reduce el scope del refresh: el acceso offline debe ser explícito (`offline_access` o flags del proveedor), no el default de cada login.

### ID tokens

Un ID token dice a **tu client** quién inició sesión. No sustituye un access token al llamar tu API. Los resource servers deben validar access tokens (o cookies de sesión que tu BFF fijó tras un intercambio correcto), no ID tokens crudos del browser salvo un diseño muy cuidado que siga comprobando audience e issuer.

---

## Redirect URIs: el pie de cañón que no se cansa

Los authorization servers comparan `redirect_uri` de forma **exacta** (scheme, host, path, a menudo puerto y barra final). Los matches parciales y los wildcards son donde empiezan los account takeovers.

Reglas duras:

1. Registra redirect URIs **completos**. Sin wildcards abiertos en producción.
2. Prefiere solo `https`. En apps nativas, usa app links HTTPS reclamados o esquemas loopback / private-use recomendados por la plataforma, con cuidado.
3. Rechaza valores de `redirect_uri` que vengan solo del query del client sin allowlist en servidor (el AS debe aplicar el registro).
4. No añadas secretos a las redirect URIs.

Un open redirect en tu propio dominio después del login sigue siendo peligroso: el atacante pasa al usuario por OAuth, aterriza en tu callback y lo reenvía a una página de phishing que parece "sesión continuada."

---

## `state` y CSRF

El parámetro `state` es un valor opaco que el client crea antes de `/authorize` y verifica al volver. Ata el callback a la sesión del browser que inició el login.

Sin `state` (o un equivalente como la historia de `nonce` en OIDC más binding de sesión), hay CSRF de login: el atacante inicia un flujo, engaña a la víctima para completarlo y enlaza la cuenta del atacante a la sesión de la víctima (o al revés según el diseño).

Genera `state` con un CSPRNG, guárdalo en servidor o en cookie/sesión ligada al user agent, compara con igualdad en tiempo constante y bórralo. Un solo uso.

---

## Implicit flow y password grant: deja de usarlos

El **implicit flow** (`response_type=token`) devolvía access tokens en el fragment de la URL. Existía porque los browsers antiguos no podían hablar con el token endpoint sin un secret. Ese mundo se acabó. Usa authorization code + PKCE.

El grant de **resource owner password credentials** (`grant_type=password`) recoge la contraseña del usuario en tu app y la manda al token endpoint. Rompe el sentido de OAuth para clientes de terceros y se elimina en OAuth 2.1. Fuera de diseños nuevos. Para casos first-party muy controlados, prefiere authorization code o device flow, o un login de sesión propio contra tu IdP.

El **device authorization grant** es la herramienta correcta para CLI y dispositivos con poca entrada (TV, IoT): muestras un código, el usuario aprueba en el teléfono, el dispositivo hace poll de tokens.

---

## Bugs habituales (los que llegan a producción)

### 1. Saltar PKCE en SPA y móvil

Síntoma: "funciona en Chrome." Incidente: intercepción de custom URL scheme o logs de redirect filtrados emiten tokens para el atacante. Fix: PKCE siempre en clientes públicos; prefiere un BFF para que el browser no guarde refresh tokens.

### 2. Sin validar `state`

Síntoma: el callback confía en cualquier `code` que llega a `/callback`. Fix: ata `state` a la sesión; rechaza mismatch.

### 3. Access token en `localStorage`

XSS se convierte en takeover de cuenta durante la vida del token (y más si el refresh vive ahí). Prefiere cookies httpOnly vía BFF, o access de vida corta solo en memoria con un diseño de refresh cuidado. Si usas storage APIs, asume que XSS = robo de sesión e invierte en CSP, sanitización y TTL cortos.

### 4. Tokens en query strings

```http
GET /api/items?access_token=eyJhbGciOi...
```

Logs, proxies, historial y `Referer` los recolectan. Usa la cabecera Authorization.

### 5. Redirect URI mal o laxa en el registro

`https://app.example.com/*` o aceptar overrides de `redirect_uri` sin match estricto permite cosechar codes. Registra URIs exactas por entorno.

### 6. Tratar el ID token como credencial de API

APIs que solo miran "¿es un JWT firmado por nuestro IdP?" sin verificar **audience** de esa API aceptan tokens pensados para otro client. Valida `iss`, `aud`, `exp`, firma (y `nbf` si existe). En access tokens, aplica scopes o claims que tu producto necesite.

### 7. Access tokens de vida infinita

Sin `exp`, o access de 30 días "para reducir tráfico." Prefiere TTL corto de access + refresh. Haz que la revocación signifique algo.

### 8. Refresh sin rotación ni detección de reuso

Un refresh robado funciona hasta revocación manual. Rotación + detección de reuso acorta la ventana y delata el robo.

### 9. Mezclar entornos

`client_id` de dev contra authorize de prod, o redirect de prod solo registrado en staging. Los síntomas parecen `invalid_grant` y `redirect_uri_mismatch` al azar. Clientes separados por entorno.

### 10. Loguear la respuesta del token

Access logs que vuelcan body de request/response imprimen bearer tokens. Redacta `Authorization`, `code`, `code_verifier` y cuerpos del token endpoint.

### 11. Desfase de reloj

La validación JWT falla a ratos cuando los servidores no coinciden en la hora. Permite una ventana de skew pequeña (del orden de un minuto) y corre NTP. No lo "arregles" desactivando checks de `exp`.

### 12. Scope de más en el consentimiento

Pedir `admin` o buzón completo porque el sample lo hacía. El usuario niega el consentimiento, falla el security review y el impacto de un breach crece. Pide el mínimo scope que la pantalla necesita; sube de nivel cuando una feature pida más.

### 13. Creer que CORS es seguridad

CORS no protege tokens que viven en JavaScript. Solo limita qué orígenes pueden leer respuestas en un browser. Los callers server-side ignoran CORS por completo.

### 14. Criptografía "tipo OAuth" casera

Blobs cifrados caseros con secretos compartidos de larga vida, sin revoke estándar, sin audience. Usa un authorization server real o una librería mantenida contra uno.

---

## Patrón BFF (versión corta)

Para SPAs, una forma sólida habitual:

1. El browser solo habla con **tu** backend (cookies same-site).
2. El backend es el **client** OAuth (confidencial), ejecuta code + PKCE y guarda refresh tokens.
3. El backend emite su propia cookie de sesión al browser.
4. El browser no ve access/refresh del IdP.

Cambias un poco de complejidad de backend por un radio de impacto XSS mucho menor y un almacenamiento de tokens más limpio. Muchos IdP empresariales documentan esto de forma explícita para apps de browser.

---

## Checklist del resource server

Cuando tu API acepta bearer tokens:

- [ ] Validar firma con JWKS actual (cachear claves, manejar rotación)
- [ ] Comprobar `iss`, `aud`, `exp` (y `nbf` si se usa)
- [ ] Aplicar scopes o claims finos por ruta
- [ ] Rechazar tokens con tipo de uso incorrecto (si tu IdP lo distingue)
- [ ] Preferir access tokens con audience restringida por API
- [ ] Loguear `sub` / client id para auditoría, nunca el token en bruto
- [ ] Definir comportamiento ante tokens revocados (TTL corto, introspección o denylist)

---

## Checklist del client

- [ ] Authorization code + PKCE (`S256`), no implicit
- [ ] `state` criptográfico, validado una vez y luego borrado
- [ ] Redirect URI exacta registrada por entorno
- [ ] Tokens fuera de URLs y logs
- [ ] Rotación de refresh y modelo de amenazas de almacenamiento por escrito
- [ ] Clientes separados para dev / stage / prod
- [ ] Scopes mínimos; documentar por qué existe cada uno
- [ ] Path de logout / revoke probado (sesión IdP + sesión local)
- [ ] Manejo de errores para `invalid_grant`, denegación de consentimiento y clock skew

---

## Cómo encaja con el pensamiento OAuth 2.1

OAuth 2.1 consolida buenas prácticas; no es un protocolo totalmente nuevo. Dirección para implementadores:

* Authorization code es el caballo de batalla interactivo.
* PKCE para todos los clients del code flow.
* Implicit y password grants fuera.
* Redirect URIs con match exacto.
* Rotación de refresh recomendada; bearer tokens tratados como sensibles.

Si tu wiki interna aún dice "la SPA debe usar implicit," actualiza la wiki antes de tocar producción.

---

## Cierre

Despliega **authorization code + PKCE**, trata **redirect URIs y `state` como controles de seguridad**, mantén **access tokens cortos** y **refresh tokens aburridamente bien protegidos**, y valida tokens en el resource server con **issuer, audience, expiry y scope**. La mayoría de los incidentes de "OAuth es difícil" no son fallos de cripto exótica. Son checks saltados, tokens en el sitio equivocado y sample code de otro tipo de client.

Si mañana revisas un PR, empieza por: PKCE presente, `state` comprobado, allowlist de redirect exacta, almacenamiento de tokens escrito, y ningún bearer en query strings. Esa lista corta atrapa una gran parte de los bugs reales.

