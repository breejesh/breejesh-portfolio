---
title: "Data fetching en Next.js App Router: Server Components, caché y revalidate"
description: "Patrones prácticos para cargar datos en el App Router: Server Components async, opciones de caché en fetch, revalidate y tags, unstable_cache para la base de datos, y cuándo sigue valiendo el fetch en el cliente."
date: "2026-07-24"
tags: [Desarrollo Web, Frontend]
coverImage: /assets/images/nextjs-app-router-data-fetching.webp
previewImage: /assets/images/nextjs-app-router-data-fetching.webp
---

Cargar datos en el App Router deja de ser confuso cuando sueltas el modelo mental de `getServerSideProps`. Fetcheas donde vive el componente. Por defecto es del lado del servidor. La caché es opt-in (desde Next.js 15). Las librerías de cliente son para interacción y APIs solo de navegador, no para cada lista de la página.

Este post es el mapa que uso en proyectos reales: Server Components primero, política de caché explícita, revalidación por tiempo o por tags, y una lista corta de casos donde el fetch en cliente sigue siendo la decisión correcta.

---

## Los Server Components son el camino por defecto

En el App Router, `page.tsx` y la mayoría de componentes son Server Components salvo que pongas `'use client'`. Eso implica que pueden ser `async`, llamar a `fetch`, hablar con una base de datos y dejar los secretos en el servidor.

```tsx
// app/blog/page.tsx
export default async function BlogPage() {
  const res = await fetch("https://api.example.com/posts");
  const posts = await res.json();

  return (
    <ul>
      {posts.map((post: { id: string; title: string }) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

Lo que ganas:

* **Sin ida y vuelta de API para el primer pintado** de esos datos (el servidor ya los tiene cuando salen el HTML/RSC).
* **Los secretos se quedan en el servidor** (URLs de DB, tokens privados).
* **Menos JS en el cliente** en árboles que solo muestran datos.

No necesitas un Route Handler solo para cargar datos de una página. Los Route Handlers son para APIs HTTP que llaman otros clientes, webhooks o destinos de `fetch` del navegador. Prefiere cargar en el Server Component que renderiza.

Las llamadas `GET` de `fetch` idénticas (misma URL y opciones) se **memoizan en un solo pase de render**. Layout y page pueden llamar a `getUser()` sin duplicar la red en esa petición.

---

## El default de caché cambió. Decídelo a propósito.

En **Next.js 14**, muchas llamadas a `fetch` se cacheaban por defecto (estilo `force-cache`). En **Next.js 15+**, el default se acerca a **no cachear** (`auto` / sin caché en request para rutas dinámicas). Si actualizaste y las páginas "estáticas" empiezan a pegarle a la API en cada request, esa es la razón.

Elige una política por petición:

| Intención | Opción |
| --- | --- |
| Siempre fresco | `cache: 'no-store'` o `next: { revalidate: 0 }` |
| Caché hasta invalidar | `cache: 'force-cache'` (opcionalmente con tags) |
| Caché N segundos (estilo ISR) | `next: { revalidate: 3600 }` |
| Caché + invalidar por nombre | `next: { tags: ['posts'] }` con `revalidateTag` |

```tsx
// Siempre ir al origen (dashboard de usuario, precio en vivo, etc.)
const live = await fetch(url, { cache: "no-store" });

// Caché una hora (catálogo de marketing, índice de docs)
const catalog = await fetch(url, {
  next: { revalidate: 3600 },
});

// Caché dura hasta revalidar tag o path
const product = await fetch(url, {
  cache: "force-cache",
  next: { tags: ["product", `product-${id}`] },
});
```

No mezcles knobs en conflicto. `{ cache: 'no-store', next: { revalidate: 3600 } }` es inválido y Next ignora el par (y avisa en dev).

### Config de segmento de ruta (cuando toda la página debe comportarse igual)

```tsx
// Forzar render dinámico en este segmento
export const dynamic = "force-dynamic";

// O ventana de revalidación por defecto del segmento
export const revalidate = 300;
```

Úsala con mesura. Prefiere opciones por `fetch` para que un widget vivo no vuelva dinámica toda la landing. Cuando un layout lee `cookies()` o `headers()`, ese segmento (y a menudo los hijos) se vuelve dinámico aunque no lo quieras. Deja los datos con auth en hojas pequeñas, no en el root layout.

---

## Revalidate por tiempo frente a tags bajo demanda

### Por tiempo (`revalidate: N`)

Sirve cuando los datos pueden ir un poco retrasados y no controlas cada escritura: lista de blog pública, docs, grid de producto que cambia unas veces por hora.

```tsx
const res = await fetch("https://api.example.com/posts", {
  next: { revalidate: 60 },
});
```

Tras 60 segundos, la siguiente petición puede disparar revalidación (estilo stale-while-revalidate según el despliegue). El lector sigue con respuesta rápida mientras la caché se actualiza en segundo plano.

### Bajo demanda (`tags` + `revalidateTag` / `revalidatePath`)

Sirve cuando una escritura conocida debe limpiar la caché: publish en el CMS, edición de admin, form via Server Action.

```tsx
// app/lib/posts.ts
export async function getPosts() {
  const res = await fetch("https://api.example.com/posts", {
    next: { tags: ["posts"], revalidate: 3600 },
  });
  return res.json();
}
```

```tsx
// app/actions.ts
"use server";

import { revalidateTag, revalidatePath } from "next/cache";

export async function publishPost(formData: FormData) {
  await savePost(formData); // tu escritura a DB/API
  revalidateTag("posts");
  revalidatePath("/blog");
}
```

* **`revalidateTag`**: quirúrgico. Etiqueta `product-42` y deja el resto del catálogo.
* **`revalidatePath`**: más grueso. Limpia datos asociados a un path. Útil si piensas en rutas, no en dominios de datos.

Nombres de tag que escalan: recurso en plural (`posts`, `inventory`) más tags de instancia opcionales (`post-${id}`). Invalida ambos al escribir cuando cambian el detalle y la lista.

---

## Base de datos y ORM: `unstable_cache` y `React.cache`

La caché de `fetch` solo cubre `fetch`. Prisma, Drizzle y SQL crudo necesitan otra cosa.

### Deduplicar en una petición: `React.cache`

```tsx
import { cache } from "react";
import { db } from "@/lib/db";

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});
```

Misma petición, muchos componentes: una query. **No** es caché entre requests. El siguiente pase de render empieza limpio.

### Caché entre requests: `unstable_cache`

```tsx
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const getCachedPosts = unstable_cache(
  async () => {
    return db.post.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  },
  ["posts-list"],
  { revalidate: 120, tags: ["posts"] }
);
```

Úsalo para lecturas caras que comparten muchos usuarios. Sigue llamando a `revalidateTag("posts")` tras mutaciones. El nombre es raro; la API es la que usaron la mayoría de apps en producción durante 2025 para caché que no es `fetch`. Trata el array de keys como identidad estable de esa función.

---

## Fetch paralelo frente a secuencial

El secuencial por accidente es el pie de foto habitual:

```tsx
// Mal: el segundo espera al primero aunque sean independientes
const user = await getUser(id);
const feed = await getFeed(id);
```

Arranca ambos y luego await:

```tsx
const userPromise = getUser(id);
const feedPromise = getFeed(id);
const [user, feed] = await Promise.all([userPromise, feedPromise]);
```

Cuando B necesita el id de A, mantén el secuencial en ese borde, pero stream del resto con Suspense para que el shell de la página no espere la rama lenta.

```tsx
import { Suspense } from "react";

export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const artist = await getArtist(username);

  return (
    <>
      <h1>{artist.name}</h1>
      <Suspense fallback={<p>Loading playlists...</p>}>
        <Playlists artistId={artist.id} />
      </Suspense>
    </>
  );
}

async function Playlists({ artistId }: { artistId: string }) {
  const playlists = await getPlaylists(artistId);
  return (
    <ul>
      {playlists.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

`loading.tsx` en un segmento envuelve la page en Suspense gratis. Prefiere límites más estrechos alrededor de lo lento para que el chrome estático pinte pronto.

---

## Cuándo el fetch en cliente sigue teniendo sentido

Los Server Components son el default. El fetch en cliente no está prohibido. Úsalo cuando el **navegador** debe dueñarse del ciclo de la petición.

| Usa fetch en cliente cuando... | Prefiere servidor cuando... |
| --- | --- |
| Los datos dependen de eventos del usuario tras el mount (búsqueda al tipear, infinite scroll) | El primer paint necesita los datos |
| Polling o UI impulsada por WebSocket | Secretos o APIs privadas |
| APIs solo de navegador (geolocalización, tokens locales que no quieres mandar al server) | SEO y contenido visible al crawler |
| Cachés muy interactivas (SWR / React Query con UX optimista) | Datos públicos compartidos con ventana de revalidate conocida |

### Patrón: el servidor siembra, el cliente lo mantiene fresco

```tsx
// Server page
import { ProductClient } from "./product-client";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id); // server, quizá force-cache + tags
  return <ProductClient initial={product} id={id} />;
}
```

```tsx
// product-client.tsx
"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ProductClient({
  initial,
  id,
}: {
  initial: Product;
  id: string;
}) {
  const { data } = useSWR(`/api/products/${id}`, fetcher, {
    fallbackData: initial,
    revalidateOnFocus: true,
  });

  return <h1>{data.title}</h1>;
}
```

El Route Handler o API pública detrás de `/api/products/...` debe seguir aplicando auth. Pasar una Promise del servidor a un client component y resolverla con `use()` de React es otra opción limpia de streaming cuando no necesitas revalidar luego en el cliente.

### Qué no hacer

* Marcar toda la page `'use client'` y volver a fetchear la home desde el navegador "porque así era la SPA".
* Meter credenciales de DB en el bundle del cliente con un leak de env "temporal".
* Llamar a `revalidateTag` desde el cliente. Eso va en Server Actions o Route Handlers.

---

## Árbol de decisión práctico

1. **¿El primer HTML necesita estos datos?** Fetch en un Server Component.
2. **¿Es de un usuario o secreto?** Solo servidor. Lee cookies/sesión en el servidor.
3. **¿Se puede compartir entre usuarios N segundos?** `revalidate: N` o `force-cache` + tags.
4. **¿Una mutación conocida lo deja viejo?** Etiquétalo y llama a `revalidateTag` en el Server Action.
5. **¿No es `fetch`?** `React.cache` para dedupe en la request; `unstable_cache` para caché entre requests.
6. **¿La siguiente actualización la mueve el navegador tras la carga?** Fetch en cliente / SWR / React Query, opcionalmente sembrado desde el servidor.
7. **¿Una rama es lenta?** Partela con Suspense / `loading.tsx` en lugar de bloquear toda la ruta.

---

## Errores comunes que sigo viendo

1. **Asumir los defaults de caché de Next 14 tras actualizar.** `cache` / `revalidate` explícitos en helpers compartidos ahorran horas de "por qué esto siempre es dinámico".
2. **Meter `cookies()` en el root layout** y preguntarse por qué todos los hijos son dinámicos.
3. **Cachear respuestas personalizadas** con una clave compartida (un usuario ve el carrito de otro). Datos personales: sin caché entre usuarios, o clave por session id con cuidado.
4. **Olvidar revalidar tras escrituras.** Solo ISR no basta si los editores esperan publish al instante.
5. **Awaits secuenciales** de fuentes independientes (waterfall de layout).
6. **Usar fetch en cliente para contenido crítico de SEO** que debió ir en el servidor.

---

## Checklist mínima antes de publicar una ruta con mucha data

* [ ] Cada `fetch` tiene una política de caché intencional.
* [ ] Las mutaciones llaman a `revalidateTag` / `revalidatePath` de los tags/paths que tocan.
* [ ] Los helpers de DB usan `React.cache` cuando varios componentes piden la misma fila en una request.
* [ ] Las queries públicas caras usan `unstable_cache` (o equivalente) con tags.
* [ ] Las secciones lentas van detrás de Suspense con un skeleton real, no una página en blanco.
* [ ] Los client components son dueños de la interacción y el refresh en vivo, no de la primera carga de contenido público.
* [ ] Sin secretos en bundles de cliente; checks de auth en cada Route Handler que el navegador pueda pegar.

El data fetching del App Router premia decisiones aburridas: carga en el servidor, di cuánto puede vivir el resultado, invalida cuando escribes, y solo abre una petición de cliente cuando el navegador de verdad tiene que llevar el reloj. Cuando ese reparto es hábito, las opciones de caché dejan de parecer magia y se sienten como perillas normales de infraestructura.
