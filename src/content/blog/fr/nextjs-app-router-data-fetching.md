---
title: "Data fetching Next.js App Router : Server Components, cache et revalidate"
description: "Patterns concrets pour charger des données dans l'App Router : Server Components async, options de cache fetch, revalidate et tags, unstable_cache pour la base, et quand le fetch client reste pertinent."
date: "2026-07-24"
tags: [Frontend et Développement Web]
coverImage: /assets/images/nextjs-app-router-data-fetching.webp
previewImage: /assets/images/nextjs-app-router-data-fetching.webp
---

Le data fetching de l'App Router devient simple quand on lâche le modèle mental de `getServerSideProps`. On fetch là où vit le composant. Par défaut, c'est côté serveur. Le cache est opt-in (depuis Next.js 15). Les libs client servent à l'interaction et aux APIs navigateur, pas à chaque liste de la page.

Ce billet est la carte que j'utilise en prod : Server Components d'abord, politique de cache explicite, revalidation par temps ou par tags, et une courte liste de cas où le fetch client reste le bon choix.

---

## Les Server Components sont le chemin de données par défaut

Dans l'App Router, `page.tsx` et la plupart des composants sont des Server Components sauf si vous marquez `'use client'`. Ils peuvent donc être `async`, appeler `fetch`, parler à une base, et garder les secrets sur le serveur.

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

Ce que vous gagnez :

* **Pas d'aller-retour API pour le premier paint** de ces données (le serveur les a déjà quand HTML/RSC partent).
* **Les secrets restent côté serveur** (URLs de DB, tokens privés).
* **Moins de JS client** pour les arbres purement d'affichage.

Vous n'avez pas besoin d'un Route Handler juste pour charger des données de page. Les Route Handlers servent aux APIs HTTP appelées par d'autres clients, aux webhooks, ou aux cibles de `fetch` navigateur. Préférez charger dans le Server Component qui rend.

Les appels `GET` `fetch` identiques (même URL et options) sont **mémoïsés pour un seul passage de render**. Layout et page peuvent appeler `getUser()` sans doubler le réseau dans cette requête.

---

## Les defaults de cache ont changé. Choisissez-les exprès.

En **Next.js 14**, beaucoup d'appels `fetch` étaient mis en cache par défaut (style `force-cache`). En **Next.js 15+**, le défaut se rapproche de **ne pas cacher** (`auto` / non mis en cache à la requête pour les routes dynamiques). Si après une montée de version vos pages "statiques" frappent l'API à chaque requête, c'est pour ça.

Choisissez une politique par requête :

| Intention | Option |
| --- | --- |
| Toujours frais | `cache: 'no-store'` ou `next: { revalidate: 0 }` |
| Cache jusqu'à invalidation | `cache: 'force-cache'` (tags optionnels) |
| Cache N secondes (style ISR) | `next: { revalidate: 3600 }` |
| Cache + invalidation par nom | `next: { tags: ['posts'] }` avec `revalidateTag` |

```tsx
// Toujours frapper l'origine (dashboard user, prix live, etc.)
const live = await fetch(url, { cache: "no-store" });

// Cache une heure (catalogue marketing, index docs)
const catalog = await fetch(url, {
  next: { revalidate: 3600 },
});

// Cache dur jusqu'à revalidation de tag ou de path
const product = await fetch(url, {
  cache: "force-cache",
  next: { tags: ["product", `product-${id}`] },
});
```

Ne mélangez pas des options contradictoires. `{ cache: 'no-store', next: { revalidate: 3600 } }` est invalide et Next ignore le couple (avec un warning en dev).

### Config de segment de route (quand toute la page doit se comporter pareil)

```tsx
// Forcer le rendu dynamique pour ce segment
export const dynamic = "force-dynamic";

// Ou fenêtre de revalidation par défaut du segment
export const revalidate = 300;
```

Utilisez-la avec parcimonie. Préférez les options par `fetch` pour qu'un widget live ne rende pas toute la page marketing dynamique. Quand un layout lit `cookies()` ou `headers()`, ce segment (et souvent les enfants) devient dynamique même si vous ne le vouliez pas. Gardez les données liées à l'auth dans de petites feuilles, pas dans le root layout.

---

## Revalidate temporel vs tags à la demande

### Temporel (`revalidate: N`)

Utile quand un léger décalage est acceptable et que vous ne contrôlez pas chaque écriture : liste de blog publique, docs, grille produit mise à jour quelques fois par heure.

```tsx
const res = await fetch("https://api.example.com/posts", {
  next: { revalidate: 60 },
});
```

Après 60 secondes, la requête suivante peut déclencher une revalidation (style stale-while-revalidate selon le déploiement). Le lecteur garde une réponse rapide pendant que le cache se rafraîchit en arrière-plan.

### À la demande (`tags` + `revalidateTag` / `revalidatePath`)

Utile quand une écriture connue doit purger le cache : publish CMS, édition admin, formulaire via Server Action.

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
  await savePost(formData); // votre écriture DB/API
  revalidateTag("posts");
  revalidatePath("/blog");
}
```

* **`revalidateTag`** : chirurgical. Taggez `product-42` et laissez le reste du catalogue.
* **`revalidatePath`** : plus grossier. Vide les données liées à un path. Utile si vous pensez en routes, pas en domaines de données.

Nommage de tags qui scale : ressource au pluriel (`posts`, `inventory`) plus tags d'instance optionnels (`post-${id}`). Invalidez les deux à l'écriture quand le détail et la liste changent.

---

## Base et ORM : `unstable_cache` et `React.cache`

Le cache de `fetch` ne couvre que `fetch`. Prisma, Drizzle et le SQL brut ont besoin d'autre chose.

### Dédupliquer dans une requête : `React.cache`

```tsx
import { cache } from "react";
import { db } from "@/lib/db";

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});
```

Même requête, plusieurs composants : une query. Ce n'est **pas** un cache inter-requêtes. Le prochain passage de render repart à zéro.

### Cache inter-requêtes : `unstable_cache`

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

À utiliser pour des lectures chères partagées par beaucoup d'utilisateurs. Appelez encore `revalidateTag("posts")` après les mutations. Le nom est maladroit ; l'API est celle que la plupart des apps de production ont utilisée en 2025 pour le cache hors `fetch`. Traitez le tableau de clés comme l'identité stable de cette fonction.

---

## Fetch parallèle vs séquentiel

Le séquentiel par accident est le piège classique :

```tsx
// Mauvais : le second attend le premier même s'ils sont indépendants
const user = await getUser(id);
const feed = await getFeed(id);
```

Lancez les deux, puis attendez :

```tsx
const userPromise = getUser(id);
const feedPromise = getFeed(id);
const [user, feed] = await Promise.all([userPromise, feedPromise]);
```

Quand B a besoin de l'id de A, gardez le séquentiel sur ce bord, mais streamez le reste avec Suspense pour que le shell de page n'attende pas la branche lente.

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

`loading.tsx` dans un segment enveloppe la page dans Suspense gratuitement. Préférez des frontières plus serrées autour des parties lentes pour que le chrome statique peigne tôt.

---

## Quand le fetch client reste pertinent

Les Server Components sont le défaut. Le fetch client n'est pas interdit. Utilisez-le quand le **navigateur** doit posséder le cycle de vie de la requête.

| Fetch client quand... | Préférez le serveur quand... |
| --- | --- |
| Les données dépendent d'événements utilisateur après le mount (search-as-you-type, infinite scroll) | Le premier paint a besoin des données |
| Polling ou UI pilotée par WebSocket | Secrets ou APIs privées |
| APIs navigateur seulement (géoloc, tokens locaux que vous refusez d'envoyer au serveur) | SEO et contenu visible aux crawlers |
| Caches très interactifs (SWR / React Query pour UX optimiste) | Données publiques partagées avec une fenêtre de revalidate connue |

### Pattern : le serveur sème, le client rafraîchit

```tsx
// Server page
import { ProductClient } from "./product-client";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id); // serveur, peut-être force-cache + tags
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

Le Route Handler ou l'API publique derrière `/api/products/...` doit toujours appliquer l'auth. Passer une Promise du serveur à un client component et la résoudre avec `use()` de React est une autre option de streaming propre quand vous n'avez pas besoin de revalidation côté client ensuite.

### Ce qu'il ne faut pas faire

* Marquer toute la page `'use client'` et re-fetcher la home depuis le navigateur "parce que c'était comme ça en SPA".
* Mettre des credentials DB dans le bundle client via une fuite d'env "temporaire".
* Appeler `revalidateTag` depuis le client. Ça va dans les Server Actions ou les Route Handlers.

---

## Arbre de décision pratique

1. **Le premier HTML a-t-il besoin de ces données ?** Fetch dans un Server Component.
2. **Est-ce personnel ou secret ?** Serveur seulement. Lisez cookies/session côté serveur.
3. **Peut-on le partager entre utilisateurs N secondes ?** `revalidate: N` ou `force-cache` + tags.
4. **Une mutation connue le rend-elle périmé ?** Taggez et appelez `revalidateTag` dans le Server Action.
5. **Ce n'est pas `fetch` ?** `React.cache` pour la dédup dans la requête ; `unstable_cache` pour le cache inter-requêtes.
6. **La prochaine mise à jour est pilotée par le navigateur après le load ?** Fetch client / SWR / React Query, éventuellement semé depuis le serveur.
7. **Une branche est lente ?** Découpez avec Suspense / `loading.tsx` au lieu de bloquer toute la route.

---

## Erreurs fréquentes que je vois encore

1. **Garder les defaults de cache de Next 14 après upgrade.** Des `cache` / `revalidate` explicites dans les helpers partagés évitent des heures de "pourquoi c'est toujours dynamique".
2. **Mettre `cookies()` dans le root layout** et se demander pourquoi tous les enfants sont dynamiques.
3. **Cacher des réponses personnalisées** sous une clé partagée (un user voit le panier d'un autre). Données personnelles : pas de cache multi-utilisateur, ou clé par session id avec soin.
4. **Oublier de revalider après écriture.** L'ISR seul ne suffit pas si les éditeurs attendent un publish instantané.
5. **Awaits séquentiels** de sources indépendantes (waterfall de layout).
6. **Fetch client pour du contenu SEO critique** qui aurait dû être serveur.

---

## Checklist minimale avant de shipper une route riche en données

* [ ] Chaque `fetch` a une politique de cache intentionnelle.
* [ ] Les mutations appellent `revalidateTag` / `revalidatePath` pour les tags/paths concernés.
* [ ] Les helpers DB utilisent `React.cache` quand plusieurs composants veulent la même ligne dans une requête.
* [ ] Les queries publiques coûteuses utilisent `unstable_cache` (ou équivalent) avec tags.
* [ ] Les sections lentes sont derrière Suspense avec un vrai skeleton, pas une page blanche.
* [ ] Les client components gèrent l'interaction et le refresh live, pas le premier load du contenu public.
* [ ] Pas de secrets dans les bundles client ; checks d'auth sur chaque Route Handler joignable par le navigateur.

Le data fetching de l'App Router récompense les choix ennuyeux : charger sur le serveur, dire combien de temps le résultat peut vivre, invalider à l'écriture, et n'ouvrir une requête client que quand le navigateur doit vraiment tenir l'horloge. Une fois ce partage en habitude, les options de cache cessent de paraître magiques et ressemblent à des boutons d'infra classiques.
