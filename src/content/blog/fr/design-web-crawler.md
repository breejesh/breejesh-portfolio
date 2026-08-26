---
title: "Concevoir un crawler web : frontier, politesse, fetch, dedup et scale"
description: "Comment fonctionne un crawler web en langage simple : seeds, file frontier, politesse, fetch, parse, store et dedup. Une page suivie dans le pipeline, plus un récap pour un ami."
date: "2025-10-30"
tags: [Design Système et Architecture]
coverImage: /assets/images/design-web-crawler.webp
previewImage: /assets/images/design-web-crawler.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Comment fonctionne un crawler web en langage simple : seeds, file frontier, politesse, fetch, parse, store et dedup. Une page suivie dans le pipeline, plus un récap pour un ami.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Imaginez un bibliothécaire qui veut une fiche pour chaque livre public sur Terre, sauf que les "livres" sont des pages web et que de nouvelles apparaissent chaque seconde. Ou imaginez un robot aspirateur qui doit visiter chaque pièce d'un immeuble de la taille d'une ville : il lui faut une liste de pièces à nettoyer, il ne doit pas frapper la même porte cent fois, et il doit se souvenir des pièces déjà nettoyées pour ne pas tourner en boucle pour toujours.

Un **crawler web** est ce bibliothécaire et ce robot réunis en logiciel. Les moteurs de recherche, les archives, les moniteurs de prix et les outils de recherche utilisent tous une forme de ce système. Le crawler de Google est célèbre, mais l'idée est la même à toute taille : commencer quelque part, télécharger une page, trouver des liens, les visiter ensuite, stocker ce qu'on a trouvé, et éviter de refaire le même travail.

Ce billet s'adresse aux débutants absolus. Nous nommerons chaque pièce en mots simples, suivrons une page dans tout le pipeline, et terminerons par un récap que vous pourriez raconter à un ami autour d'un café.

---

## Quel problème résout-on ?

Le web public est un graphe géant. Chaque page est un nœud. Chaque hyperlien est une arête dirigée d'une page vers une autre. Personne ne vous remet une carte complète. Vous n'avez que quelques adresses de départ et les liens écrits sur chaque page visitée.

Le crawler doit donc :

1. Partir d'une courte liste d'adresses connues et fiables.
2. Tenir une liste de tâches des pages encore à visiter.
3. Télécharger chaque page avec soin pour ne pas écraser un site.
4. Lire le HTML, en extraire le texte utile et les liens.
5. Sauver la page quelque part de durable.
6. Repérer les doublons pour ne pas gaspiller disque et temps.
7. Répéter jusqu'à épuisement du budget ou de la file.

Si vous ne retenez que la boucle : **découvrir → télécharger → comprendre → sauver → découvrir encore.**

---

## La distribution des rôles (en mots simples)

| Nom | Ce que cela veut dire dans la vraie vie |
| --- | --- |
| **Seed URLs** | Les premières portes que vous ouvrez exprès |
| **Frontier (file)** | La liste de post-it "à visiter ensuite" |
| **Politesse (politeness)** | Ne pas marteler un seul site ; attendre son tour par hôte |
| **Fetch** | Télécharger vraiment la page en HTTP |
| **Parse** | Lire le HTML, trouver liens et contenu |
| **Store** | Garder le corps de page et les métadonnées sur disque ou object storage |
| **Dedup** | Ignorer les adresses et les corps déjà traités |

En entretien on dit "URL frontier", "fetcher", "content store" et "URL seen". Ce ne sont que les noms professionnels du même casting.

---

## Seed URLs : où commence le crawl

Une **seed** est une URL que vous mettez dans le système à la main (ou depuis une liste de confiance) avant que la découverte ne commence. Le crawler ne peut pas inventer la première page à partir de rien. Les seeds sont les portes d'entrée.

De bonnes seeds ressemblent à :

- Des homepages connues (sites d'actualité, portails gouvernementaux, racines d'universités).
- Des hubs thématiques si vous ne vous intéressez qu'au shopping, au sport ou à la doc.
- Des sitemaps ou les "meilleurs hôtes du crawl du mois dernier" quand vous redémarrez.

De mauvaises seeds vous piègent. Si chaque seed est un minuscule blog qui ne se lie qu'à lui-même, le robot aspirateur ne quitte jamais un couloir. Pour un crawl large, vous voulez **beaucoup de quartiers différents**, pas une seule clique dense.

Les seeds entrent d'abord dans la frontier. Ensuite, presque chaque nouvelle URL vient des liens trouvés sur des pages déjà téléchargées.

---

## La frontier : la liste de tâches d'internet

La **URL frontier** est la file des pages qui attendent d'être téléchargées. Voyez-la comme la liste du robot des pièces encore sales, ou la pile du bibliothécaire des livres encore non vérifiés.

Habitudes importantes pour cette liste :

1. **Premier entré, premier sorti est l'histoire simple.** Le parcours en largeur (BFS) signifie : visiter d'abord le voisinage des seeds, puis élargir. Cela correspond à "nettoyer toutes les pièces de cet étage avant de plonger dans un sous-sol sans fin."
2. **Le parcours en profondeur est un mauvais défaut.** Suivre une seule chaîne de liens pour toujours peut vous piéger dans des calendriers, des ids de session ou des chemins infinis.
3. **La priorité aide.** La homepage d'un grand journal mérite souvent l'attention avant un fil de commentaires au hasard. Les systèmes de production gardent plusieurs files frontales (haute, moyenne, basse priorité) et y piochent avec un biais vers le travail important sans affamer complètement le reste.
4. **La liste est énorme.** Des centaines de millions d'URL en attente ne tiennent pas confortablement dans la RAM d'un portable. Les frontiers réelles vivent dans des files persistées sur disque, souvent découpées entre machines par nom d'hôte.

Une astuce de structure de plus : beaucoup de designs utilisent des **front queues** pour la priorité et des **back queues** par hôte de site. La priorité décide *quel type* de travail est prêt ; la file par hôte décide *quand* cet hôte peut être recontacté. C'est ainsi que politesse et ordre utile cohabitent dans le même système.

```
nouvelle URL → scorer la priorité → front queues → router par hôte → back queue par hôte → worker
```

---

## Politesse : ne pas marteler un seul site

Si votre robot trouve 500 liens sur `example.com` et ouvre 500 connexions d'un coup, vous ne crawlz pas. Vous attaquez. Les sites ralentissent, renvoient des erreurs ou bannissent votre IP. Un bon crawler traite chaque hôte comme le bureau d'une bibliothèque partagée : une requête soignée à la fois (ou une petite limite documentée), puis une courte pause.

La **politesse** signifie en général :

- Au plus un téléchargement actif par hôte (parfois par IP, car beaucoup de sites partagent une machine).
- Un délai entre deux visites du même hôte (par exemple une ou deux secondes, ou ce que demande le site).
- Lire d'abord **`robots.txt`**. C'est un petit fichier que les propriétaires publient à `https://host/robots.txt` pour dire "vous pouvez crawler ici" et "restez hors de `/admin`."
- Un **User-Agent** clair avec une page de contact, pour que les humains sachent qui vous êtes.
- Reculer plus fort quand le site renvoie `429` (trop de requêtes) ou `503` (indisponible).

Si vous ne gardez qu'une règle de production de ce billet : **ne laissez jamais le crawl parallèle devenir un déni de service contre un seul hôte.** Le débit sur tout le web compte. La politesse par hôte n'est pas négociable.

---

## Fetch : télécharger la page

**Fetch** est le moment où le worker dit vraiment "donne-moi cette URL" sur le réseau.

Un chemin de fetch soigné ressemble à :

1. Prendre la prochaine URL autorisée dans la frontier (en respectant le délai de l'hôte).
2. La normaliser (hôte en minuscules, enlever les fragments inutiles comme `#section` ; les formes relatives se corrigent au parse).
3. Vérifier les règles robots de cet hôte (depuis un cache si vous les avez déjà chargées).
4. Résoudre le DNS (avec un cache local pour ne pas attendre la résolution de nom à chaque fois).
5. HTTP GET avec des timeouts courts, une taille max de corps et un budget limité de redirections.
6. Passer le corps de la réponse au parser, ou enregistrer l'échec et continuer.

Détails pratiques qu'un débutant devrait encore entendre :

| Préoccupation | Règle simple |
| --- | --- |
| Timeouts | Échouer en secondes, pas en minutes |
| Gros fichiers | Plafonner la taille pour qu'un téléchargement monstre ne bloque pas le worker |
| Redirections | Limiter les sauts ; traiter un saut vers un nouvel hôte sous la politesse de cet hôte |
| Compression | Accepter gzip ; économiser la bande passante |
| Recrawl | Utiliser `If-None-Match` / `If-Modified-Since` quand vous avez déjà une copie |

À l'échelle vous lancez beaucoup de fetchers sur beaucoup de machines, en général **shardés par hôte** pour que le verrou de politesse de `example.com` vive à côté des workers qui parlent à `example.com`.

---

## Parse : lire le HTML et trouver les prochaines portes

**Parse** signifie : regarder dans les octets téléchargés et les comprendre assez pour stocker le contenu et extraire les liens.

Pour le HTML cela veut souvent dire :

1. Confirmer que c'est à peu près du HTML (pas un binaire au hasard que vous ne vouliez pas).
2. Extraire le texte principal et des métadonnées utiles (titre, indices de langue, URL canonique si présente).
3. Trouver chaque lien `a href="..."`.
4. Transformer les liens relatifs (`/about`) en absolus (`https://example.com/about`) avec l'URL finale après redirections.
5. Nettoyer l'URL : enlever les `#fragments`, parfois jeter le tracking si le produit le permet.

Ensuite un **filtre d'URL** jette le travail que vous refusez de faire :

- Schémas `mailto:`, `javascript:`, `data:`.
- Types de fichiers indésirables (`.zip`, `.mp4`) sauf si le produit dit le contraire.
- URLs absurdement longues qui ressemblent à des pièges à araignées.
- Hôtes en liste noire.

Ce qui survit passe par le **dedup d'URL** (ci-dessous) et, si c'est nouveau, revient dans la frontier.

À petite échelle, le parse peut vivre sur la même machine que le fetch. À grande échelle, workers de téléchargement et de parse sont des étapes séparées pour qu'un parser lent ne bloque pas le réseau.

---

## Store : garder ce que vous avez payé pour télécharger

**Store** est la mémoire durable du crawl : le corps de la page plus assez de métadonnées pour l'utiliser plus tard (l'indexer, l'archiver, la comparer la semaine prochaine).

Découpage typique :

- **Blob / object storage** pour le HTML (ou HTML compressé). Gros volume, écritures lourdes, tiers bon marché dans le temps.
- **Base de métadonnées** pour de petits faits : URL, heure de fetch, code de statut, content-type, hash de contenu, taille.

Vous gardez les métadonnées pour répondre sans relire chaque blob : "Quand l'avons-nous téléchargée la dernière fois ?" "Était-ce un 404 ?" "Ce hash est-il déjà connu ?"

La politique de recrawl vit à côté. Les pages importantes changent souvent ; la longue traîne peut attendre plus longtemps. Un recrawl aveugle de tout le web est cher, donc les systèmes apprennent les rythmes de changement et dépensent le budget là où la fraîcheur compte.

---

## Dedup : sauter le travail déjà fait

Le web adore les copies. Le même article peut apparaître sur `www` et sur le domaine nu. Les miroirs réimpriment le même corps sous de nouvelles URLs. Sans **déduplication**, vous brûlez disque et CPU en déjà-vu.

Il y a deux couches, et un débutant doit garder les deux :

| Couche | Question | Analogie du quotidien |
| --- | --- | --- |
| **URL seen** | Avons-nous déjà planifié ou téléchargé cette adresse ? | Avons-nous déjà écrit ce numéro de pièce sur la liste de nettoyage ? |
| **Content seen** | Avons-nous déjà stocké ce corps de page (ou un jumeau exact) ? | Avons-nous déjà classé ce texte de livre exact sous une autre cote ? |

Le **dedup d'URL** empêche la frontier d'exploser avec le même lien trouvé sur mille pages. Les implémentations vont d'un simple ensemble en base à un filtre de Bloom devant un store durable. Les filtres de Bloom économisent la mémoire mais peuvent parfois dire "vu" alors que l'URL était nouvelle (vous perdez un peu de couverture). Les stores exacts coûtent plus de mémoire ou de disque.

Le **dedup de contenu** hache le corps (copies exactes). Si le hash existe déjà, vous évitez d'écrire un autre blob complet, ou vous ne stockez qu'un pointeur vers la première copie. La détection de quasi-doublons (le même article avec d'autres pubs) est un système plus lourd, pour plus tard. Le hash exact est le défaut d'entretien.

Les deux couches comptent pour des bugs différents :

- Deux URLs, un corps → le dedup de contenu économise le stockage.
- URLs uniques infinies avec de la query bidon → filtres d'URL, limites de chemin et budgets par hôte sauvent la frontier.

---

## Vue d'ensemble

```
Seed URLs
    │
    ▼
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│ URL Frontier│────►│ Fetcher      │────►│ Parser         │
│ (priorité + │     │ DNS, robots, │     │ liens + body   │
│  politesse) │     │ HTTP GET     │     └────────┬───────┘
└──────▲──────┘     └──────────────┘              │
       │                                          ▼
       │                                 hash de contenu nouveau ?
       │                                    │         │
       │                                   oui        non → jeter ou lien seulement
       │                                    ▼
       │                                 content store
       │                                    ▼
       │                                 extraire les liens
       │                                    ▼
       │                                 filtrer + URL seen ?
       │                                    │
       └────────────── seulement les nouvelles URLs ──┘
```

---

## Suivre une page dans le pipeline

Suivons une seule page pour que les pièces cessent de sembler abstraites.

**Mise en place.** Les seeds incluent `https://news.example/`. La frontier est vide sauf cette seed. La politesse dit : un fetch à la fois par hôte, avec un court délai.

1. **Chargement de seed.** `https://news.example/` entre dans la frontier avec une haute priorité car c'est une homepage.

2. **Dequeue sous politesse.** Un worker tire cette URL. Aucun autre fetch vers `news.example` n'est en cours. Les règles robots sont chargées depuis `https://news.example/robots.txt` et mises en cache. Le chemin `/` est autorisé.

3. **Fetch.** Le DNS résout `news.example`. Le worker envoie un HTTP GET avec un User-Agent clair et un timeout de 10 secondes. Statut 200. Le corps fait environ 80 Ko de HTML.

4. **Parse.** Le parser lit le titre "Example News," le texte principal de l'article et trouve des liens :
   - `https://news.example/politics/bill-42`
   - `https://news.example/sports/final`
   - `https://other-site.org/op-ed`
   - `mailto:tips@news.example` (filtré)
   - `/local/weather` (devient `https://news.example/local/weather`)

5. **Dedup de contenu.** Le hash du HTML est nouveau. Écrire le corps en object storage. Écrire les métadonnées : URL, heure, 200, hash, taille.

6. **Filtre d'URL et URL seen.**  
   - `mailto:` jeté.  
   - Les trois liens http(s) sont normalisés.  
   - Aucun n'était dans l'ensemble URL-seen, donc les trois sont marqués vus et enfilés.  
   - `other-site.org` va dans une back queue différente de `news.example`.

7. **Cycles suivants.**  
   - Le worker doit attendre le délai de politesse avant la prochaine URL `news.example`.  
   - Un autre worker peut télécharger `https://other-site.org/op-ed` tout de suite si cet hôte est libre.  
   - Quand `politics/bill-42` est téléchargé plus tard, son corps peut être unique, ou correspondre à un miroir déjà stocké (dedup de contenu).  
   - Les liens trouvés là-bas remplissent à nouveau la frontier.

8. **Chemin d'échec (même idée de page).** Si le fetch expire, le système enregistre l'échec, peut réessayer avec backoff, et ne prétend pas que la page a été stockée. Si robots interdit `/admin`, cette URL ne quitte jamais l'étape "vérifier robots."

Après une page vous avez déjà pratiqué chaque idée majeure : seed, frontier, politesse, fetch, parse, store, double dedup et planification multi-hôte.

---

## Quelques notes d'échelle (toujours en langage simple)

Quand on dit "concevez un crawler pour un milliard de pages par mois," la forme reste la même. Les meubles grossissent.

- **Débit approximatif :** 1 milliard de pages / 30 jours / 86 400 secondes ≈ 400 pages par seconde en moyenne. Le pic peut être plus haut.
- **Stockage :** Si le HTML moyen fait des centaines de kilo-octets, les données brutes mensuelles font des centaines de téraoctets. Compression et rétention multi-années en font un vrai design de stockage, pas un dossier latéral.
- **Shard par hôte :** Gardez des tranches de frontier, l'état de politesse et souvent les workers de fetch regroupés par hash d'hôte pour qu'une machine possède un ensemble de sites.
- **Pièges à araignées :** Calendriers infinis, ids de session et chemins récursifs essayent de garder le robot dans un couloir pour toujours. Plafonnez la longueur d'URL, la profondeur de chemin et les pages par hôte et par jour. Prévoyez un coupe-circuit humain.
- **Sites lourds en JS :** Certains liens n'apparaissent qu'après qu'un navigateur exécute du JavaScript. Le rendu complet est cher. Utilisez-le pour les hôtes à forte valeur, pas pour chaque page au hasard le premier jour.

Vous n'avez pas besoin de construire le crawler de Google en entretien. Vous devez montrer que vous comprenez la boucle, la politesse et les deux types de dedup.

---

## Récap pour un ami

Un crawler web est un logiciel qui catalogue le web public comme un bibliothécaire catalogue des livres et un robot aspirateur visite des pièces.

Vous commencez avec quelques **seed URLs**, les portes choisies exprès. Elles entrent dans une **frontier**, une grande file de tâches des pages encore à visiter. Les workers tirent de cette file, mais restent **polis** : une requête soignée à la fois par site web, avec des délais, et ils honorent `robots.txt` pour que les propriétaires puissent dire "restez hors de ce couloir."

**Fetch** télécharge la page. **Parse** lit le HTML, garde le texte utile et trouve de nouveaux liens. **Store** conserve la page et ses métadonnées. **Dedup** travaille deux fois : une pour ne pas enfiler la même URL pour toujours, et une pour ne pas stocker le même corps d'article sous dix adresses.

Puis les nouveaux liens rejoignent la frontier, et le robot continue de marcher. Tout le design est cette boucle, rendue sûre pour les sites visités et assez bon marché pour tourner à l'échelle d'internet.

---

## Conclusion

Si vous ne dessinez qu'un diagramme en entretien, dessinez la boucle : frontier → fetch poli → parse → content store → extraction de liens → filtre d'URL et seen → retour à la frontier. Étiquetez les seeds à l'entrée. Dites à voix haute que priorité et politesse vivent dans la frontier, pas comme une idée de dernière minute.

Le web sera toujours désordonné : HTML cassé, pièges, doublons, hôtes lents. Un bon design de crawler s'attend à ce désordre. Il est patient par hôte, agressif pour ne pas se répéter, et honnête sur la part d'internet qu'il peut vraiment nettoyer aujourd'hui.