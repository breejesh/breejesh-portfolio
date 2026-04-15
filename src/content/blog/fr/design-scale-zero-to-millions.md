---
title: "Passer de zéro à des millions d'utilisateurs : une couche à la fois"
description: "Chemin pour débutants d'un seul ordinateur à des millions d'utilisateurs : séparer les couches, load balancers, réplicas de lecture, cache, CDN, serveurs sans état, files, multi-région et sharding de base de données, avec des analogies simples et les trade-offs à chaque étape."
date: "2026-04-15"
tags: [Conception de systèmes]
coverImage: /assets/images/design-scale-zero-to-millions.webp
previewImage: /assets/images/design-scale-zero-to-millions.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Chemin pour débutants d'un seul ordinateur à des millions d'utilisateurs : séparer les couches, load balancers, réplicas de lecture, cache, CDN, serveurs sans état, files, multi-région et sharding de base de données, avec des analogies simples et les trade-offs à chaque étape.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Imagine un petit restaurant avec un seul cuisinier qui prend aussi les commandes, lave la vaisselle et tient la caisse. Pour dix clients par jour, ça marche. Quand deux cents personnes arrivent à midi, le cuisinier n'y arrive plus. Tu ne reconstruis pas la ville. Tu embauches un hôte, plus de cuisiniers, un plongeur, et plus tard peut-être une deuxième cuisine.

Les systèmes web grandissent de la même façon. Tu commences avec une machine. Tu ajoutes de l'aide seulement quand une vraie douleur apparaît. Ce billet suit ce chemin de croissance, écrit pour qu'un étudiant de première année ou un autodidacte puisse suivre chaque étape. Les idées collent aussi à ce qu'on attend en entretien de conception système : load balancers, caches, CDN, réplicas de base, files de messages et multi-région, chacun expliqué au moment où tu en as besoin.

---

## Quel problème résout-on ?

Ton app devient populaire. Plus de gens l'ouvrent en même temps. Les pages ralentissent. Parfois le site tombe. Argent et confiance partent.

Le problème n'est pas "dessiner un joli schéma". Le problème est :

1. Garder le site debout quand beaucoup de gens l'utilisent.
2. Répondre assez vite pour que les gens ne partent pas.
3. Stocker les données sans perdre ce que l'utilisateur vient de sauver.
4. Dépenser argent et complexité seulement là où l'utilisateur sent la douleur.

"Des millions d'utilisateurs" est un slogan tant que tu n'as pas posé des chiffres approximatifs. Si l'interviewer ne les donne pas, choisis-en de raisonnables à voix haute et conçois contre ceux-là.

| Question | Pourquoi ça compte |
| --- | --- |
| Plus de lectures ou d'écritures ? | Caches et réplicas aident surtout les lectures |
| Pic contre moyenne ? | Tu dimensionnes pour les heures de pointe, pas la nuit |
| À quelle vitesse les données grandissent-elles ? | Disque, sauvegardes et découpage des données deviennent concrets |
| Qu'est-ce que "trop lent" ? | Les choix de cache et de CDN en découlent |
| Chaque lecture doit-elle voir la dernière écriture ? | Réplicas et multi-région échangent fraîcheur contre échelle |

---

## Que se passe-t-il quand un utilisateur ouvre l'app ?

Avant toute grande architecture, suis un seul clic.

1. L'utilisateur tape le nom du site ou ouvre ton app.
2. Le **DNS** (l'annuaire téléphonique d'internet) transforme le nom en adresse d'un ordinateur.
3. La requête voyage sur le réseau jusqu'à cette machine.
4. Ton code d'**application** s'exécute : vérifier la connexion, charger un fil, passer une commande.
5. L'app lit ou écrit une **base de données** (un endroit structuré où les données vivent durablement).
6. Une réponse revient : HTML, JSON, une image, ce dont le client a besoin.

Tout ce chemin doit rester rapide et fiable quand plus d'utilisateurs arrivent. On le fait grandir par étapes.

---

## Étape 0 : Un seul ordinateur fait tout

Au début, une machine exécute le code du site et la base de données. Pas cher. Simple. Facile à déboguer.

```
Utilisateur → DNS → [ Web + App + Base sur une seule boîte ]
```

**Pourquoi ça marche :** prototypes, projets perso, des centaines d'utilisateurs. Tu livres des fonctionnalités au lieu de gérer des machines.

**Ce qui casse :**

- Un crash ou un redémarrage coupe tout le produit.
- Le travail de l'app et celui de la base se battent pour le même CPU et le même disque.
- Tu ne peux pas faire grandir le site et le stockage de données séparément.
- Acheter une plus grosse machine (**scale vertical** : plus de CPU et de RAM sur une machine) bute sur un plafond de prix et de taille.

Quand la machine est toujours saturée, les files disque grandissent, ou chaque déploiement fait peur, passe à l'étape suivante.

---

## Étape 1 : Séparer le site et la base de données

Mets le code d'application sur une machine. Mets la base sur une autre.

```
Utilisateur → DNS → [ Web / App ] → [ Base de données ]
```

Pense à la cuisine et au réservoir d'ingrédients comme à des pièces distinctes. Les cuisiniers cuisinent. Le réservoir garde les ingrédients en sécurité.

**Gains :**

- Dimensionne chaque machine pour son travail.
- Le disque de la base n'est plus partagé avec les logs bruyants de l'app.
- Tu peux enfermer la base sur un réseau privé pour qu'internet ne lui parle pas directement.

**Trade-offs :**

- Un petit saut réseau entre app et base (souvent acceptable dans la même région cloud).
- Deux machines à surveiller, patcher et sauvegarder.
- Toujours une boîte app et une base : deux **points uniques de défaillance** (si cette pièce meurt, le produit tombe).

C'est la première vraie architecture. Ne la saute pas pour un énorme cluster le jour un.

---

## Étape 2 : Un load balancer devant plusieurs serveurs web

Un **load balancer** (répartiteur de charge) est un agent de circulation pour les serveurs. Les utilisateurs parlent à l'agent. L'agent envoie chaque requête à un serveur web en bonne santé.

```
Utilisateur → DNS → [ Load balancer ] → Web1, Web2, WebN → [ Base de données ]
```

**Gains :**

- Ajoute des serveurs web quand le trafic grandit (**scale horizontal** : plus de machines de taille similaire, pas une géante).
- Déploie le code en vidant un serveur, en le mettant à jour, puis en le remettant en service pendant que les autres servent.
- Les **health checks** (sondes simples "ça va ?") retirent les serveurs malades de la rotation.

**Trade-offs :**

- Le load balancer lui-même est critique. Utilise un load balancer managé cloud ou une paire avec bascule.
- Les **sessions collantes** (toujours envoyer un utilisateur vers le même serveur parce que l'état de login vit dans la mémoire de ce serveur) cachent une mauvaise odeur de conception. Préfère un magasin de session partagé plus tard.
- TLS (chiffrement HTTPS), timeouts et limites de connexions deviennent ton problème ou celui du fournisseur cloud.

Les health checks doivent frapper un vrai chemin d'app comme `/health`, pas seulement "le port réseau est ouvert".

---

## Étape 3 : Faire grandir la couche web avec plus de serveurs

Une fois le load balancer en place, ajouter des serveurs web est souvent le gain le moins cher pour le traitement de requêtes qui brûlent du CPU.

**Surveille ces détails :**

- Chaque serveur web ouvre des connexions vers la base. Beaucoup de serveurs fois un gros pool peuvent épuiser la limite de connexions de la base.
- Config, secrets et feature flags doivent venir d'un seul endroit, pas différer par accident sur chaque hôte.
- Autoscaling sur de vrais signaux (CPU, latence de requête, profondeur de file), pas des métriques de vanité.

**Trade-off :** scaler le web est facile. La **base de données et l'état partagé** deviennent le mur suivant. La plupart des produits heurtent le mur base bien avant de manquer de CPU web.

---

## Étape 4 : Base primaire plus réplicas de lecture

Une **primaire** (parfois appelée master) accepte les écritures : nouveaux utilisateurs, posts, paiements. Les **réplicas** (copies de la base qui suivent la primaire) servent beaucoup de lectures : page d'accueil, profils, listes de produits.

```
Couche web → écritures → BD primaire
           → lectures  → Réplica1, Réplica2
```

Les changements coulent de la primaire vers les réplicas. Ce flux est la **réplication**.

**Gains :**

- Les produits très lus gagnent un gros multiplicateur.
- Les rapports lourds peuvent tourner sur une réplica pour ne pas écraser la primaire.
- Une réplica peut être une pièce de rechange tiède si la primaire tombe (avec pratique et outillage).

**Trade-offs :**

- **Lag de réplication :** un utilisateur enregistre des données, lit tout de suite sur une réplica et voit encore l'ancienne valeur. Sur les chemins qui doivent être frais, lis la primaire un moment, ou accepte que certaines pages soient un peu en retard.
- Toutes les écritures frappent encore une seule primaire. Tu n'as pas encore résolu l'échelle d'écriture.
- Le basculement (promouvoir une réplica en primaire) est un vrai travail d'exploitation : détecter, promouvoir, pointer les apps vers la nouvelle primaire, gérer les écritures en vol.

En entretien, nomme l'histoire de cohérence. "On utilise des réplicas async ; le lag peut être de centaines de millisecondes sous charge" vaut mieux que prétendre que chaque lecture est instantanément fraîche.

---

## Étape 5 : Un cache pour les données chaudes

Un **cache** est une mémoire rapide à court terme, souvent Redis ou Memcached. Tu le places entre l'app et la base pour les données que beaucoup de gens redemandent sans cesse.

| Motif | Idée | Risque |
| --- | --- | --- |
| Cache-aside | L'app regarde le cache ; en cas d'échec, charge la BD et remplit le cache | Beaucoup de clients manquent en même temps après expiration |
| Read-through | La lib de cache charge en cas d'échec | Moins de contrôle dans ton code |
| Write-through | Écrit cache et BD ensemble | Latence d'écriture plus haute |
| Write-behind | Écrit d'abord le cache, sauve la BD plus tard | Si le cache meurt avant le flush, données perdues possibles |

**Gains :** moins de charge sur la base, réponses plus rapides pour les clés populaires, souvent moins cher qu'agrandir la primaire pour toujours.

**Trade-offs :**

- Un TTL mal choisi ou une invalidation manquante sert des données "fantômes" anciennes.
- La mémoire coûte de l'argent. Tu dois choisir des règles d'éviction (par exemple retirer le moins récemment utilisé).
- Le cache n'est en général pas la source de vérité. Prévois les redémarrages à froid quand le cache est vide.

Protège la base quand beaucoup de clés expirent ensemble : jitter aléatoire sur les TTL, fusion des requêtes en double, ou servir un peu de stale pendant qu'un worker rafraîchit.

---

## Étape 6 : CDN pour images, scripts et autres fichiers statiques

Un **CDN** (réseau de diffusion de contenu) stocke des copies de fichiers dans beaucoup de villes près des utilisateurs : images, JavaScript, CSS, polices, téléchargements. Certains CDN peuvent aussi cacher du HTML public ou des API GET publiques si tu règles soigneusement le cache.

```
Utilisateur → bord CDN proche → (miss) → Origine (load balancer + web) → ...
```

**Gains :**

- Les utilisateurs loin de ton centre de données principal chargent plus vite.
- Tes machines d'origine dépensent moins de bande passante sur le statique lourd.
- Les pics média frappent d'abord le bord, pas seulement le cœur.

**Trade-offs :**

- Tu dois purger ou versionner les fichiers (`app.a1b2c3.js`) pour que personne n'exécute d'anciens scripts cassés.
- Les réponses privées ou personnalisées ne doivent pas vivre dans un cache de bord public partagé.
- Coût et dépendance fournisseur existent, mais battent souvent le surdimensionnement d'origine pour le statique mondial.

Par défaut en entretien : statique sur CDN d'abord. Ensuite seulement, parler de cacher des GET d'API publics avec des clés claires et `Cache-Control`.

---

## Étape 7 : Serveurs web sans état (stateless)

**Sans état** signifie que n'importe quel serveur web peut traiter n'importe quelle requête utilisateur. Sessions de login, compteurs globaux de rate limit et uploads en cours vivent dans des magasins partagés (Redis, base, object storage), pas seulement dans la RAM d'un serveur.

**Gains :**

- Le load balancer peut utiliser des règles simples (round-robin ou moins de connexions).
- Tu peux ajouter ou retirer des serveurs sans "cet utilisateur doit rester sur le serveur 3".
- Si un serveur meurt, les sessions survivent si le magasin partagé est assez sain pour tes besoins.

**Trade-offs :**

- Un saut réseau en plus vers le magasin de session sur les requêtes authentifiées.
- Ce magasin partagé devient critique. Réplique-le et surveille-le.
- Les connexions longues comme les WebSockets demandent un plan à part (stickiness ou fanout pub/sub).

Si tu as encore besoin de stickiness pour un héritage, dis-le et traite-le comme une dette, pas comme le design cible.

---

## Étape 8 : Plus d'un centre de données (multi-région)

Un **centre de données** (ou région cloud) est un bâtiment plein de machines dans une géographie. Servir depuis plus d'une région coupe la latence et aide quand toute une région tombe.

Motifs courants :

1. **Actif-passif :** une région sert le trafic ; une autre reste chaude en secours.
2. **Actif-actif :** les deux régions servent. Plus dur. Les données doivent se répliquer avec soin dans les deux sens ou par partition.

**Gains :** meilleure reprise si une région meurt, pages plus rapides pour les utilisateurs mondiaux, options de résidence des données.

**Trade-offs :**

- Les designs de base bavards souffrent quand chaque requête traverse des continents.
- Les écritures multi-master amènent la douleur de résolution de conflits.
- DNS géo, health checks et exercices de bascule sont un coût d'ops permanent.
- Certaines données doivent rester in-région par loi ou politique produit.

En entretien, commence par actif-passif sauf si le produit est clairement mondial et assez sensible à la latence pour payer la complexité actif-actif.

---

## Étape 9 : Files de messages et travail en arrière-plan

Toute action utilisateur n'a pas besoin de finir dans la requête HTTP. Une **file de messages** est une file d'attente pour du travail : envoyer un email, redimensionner des images, indexer la recherche, déclencher des webhooks.

```
Web → mettre un job en file → [ File ] → Workers → BD / email / object storage ...
```

**Gains :**

- Lisse les pics : les workers vident à un rythme que le système tient.
- Isole les pannes : un fournisseur mail capricieux ne transforme pas l'inscription en erreur 500.
- Scale producteurs (web) et consommateurs (workers) séparément.

**Trade-offs :**

- L'UI peut afficher "en cours" car le travail finit plus tard (**cohérence à terme** : le système devient correct bientôt, pas toujours au même instant).
- La livraison est souvent **au moins une fois**. Les workers doivent être **idempotents** (refaire le même job ne double pas la facture ni l'email).
- Messages toxiques, dead-letter queues et bons logs sont obligatoires, pas optionnels.
- Un ordre strict demande un design en plus (clés de partition, partitions mono-consommateur).

Les files n'enlèvent pas le travail. Elles le déplacent vers un endroit que tu peux dimensionner, réessayer et observer exprès.

---

## Étape 10 : Quand une seule primaire ne suffit plus

Quand la charge d'écriture ou la taille des données dépasse une primaire :

### Plus grosse machine encore

Plus de CPU, de RAM, des disques plus rapides. Simple jusqu'à ce que le coût ou le matériel t'arrêtent.

### Découper par domaine (fédération)

Base utilisateurs, base commandes, base inventaire. Propriétaires clairs. Les jointures inter-domaines passent dans le code app. Les transactions multi-bases deviennent dures.

### Sharding (découper les lignes sur plusieurs bases)

Un **shard** est une tranche des données, souvent par id utilisateur ou tenant. Chaque shard a sa propre primaire (et en général ses réplicas).

**Gains :** volume d'écriture et stockage peuvent grandir à peu près avec le nombre de shards.

**Trade-offs :**

- Une mauvaise clé de shard crée des points chauds (un shard fait presque tout le travail).
- Les requêtes qui touchent beaucoup de shards font mal.
- Resharder des données en live est un projet, pas un flip de config.
- Contraintes uniques et index secondaires sont souvent locaux au shard sauf si tu construis des index globaux.

### NoSQL quand le motif d'accès colle

Stores de documents, wide-column ou clé-valeur aident certains workloads (énormes écritures simples, documents flexibles, lookups par clé). Ce n'est pas une promotion gratuite si tu as encore besoin de jointures complexes et de transactions multi-lignes fortes.

Choisis le store pour la façon dont tu interroges les données, pas pour la mode.

---

## Assembler les couches

Un chemin mature ressemble souvent à ceci. Tu ajoutes encore les couches seulement quand un vrai goulot le demande.

```
Utilisateurs
  → DNS / routage géo
  → CDN (statique, quelques GET publics)
  → Load balancer
  → Web / API sans état
  → Cache
  → BD primaire + réplicas de lecture (plus tard shards)
  → File de messages → workers
  → Object storage pour les gros fichiers
```

Habitude d'entretien : **nomme le goulot, propose la couche suivante, dis le trade-off, avance.** Ne déverse pas tout le schéma final sauf si on te le demande.

---

## Ce que les interviewers écoutent

1. Tu scales **lectures et écritures** différemment.
2. Tu sépares **calcul et données** assez tôt.
3. Tu traites **cache et CDN** comme de première classe, avec invalidation et vie privée.
4. Tu rends la couche web **sans état** avant le théâtre multi-région.
5. Tu utilises des **files async** pour le travail qui peut attendre, avec des workers idempotents.
6. Tu fais monter l'échelle base de réplicas à découpage par domaine à shards les yeux ouverts sur la cohérence.
7. Tu peux dire **ce qui casse** à chaque étape.

---

## Un ordre pratique en production

1. Mesure : latence, taux d'erreur, CPU base, connexions, I/O disque.
2. Corrige les bugs app évidents et les index manquants avant d'acheter de l'architecture.
3. Sépare les couches, ajoute un load balancer, grandis le web, ajoute des réplicas de lecture.
4. Ajoute cache et CDN pour les chemins chauds et statiques.
5. Externalise les sessions et rends les déploiements ennuyeux.
6. Mets le travail lourd en file.
7. Multi-région et sharding quand métriques et risque métier justifient la complexité.

L'architecture est un budget. Dépense-le là où les utilisateurs sentent la douleur.

---

## Explique ça à un ami

- Commence comme un restaurant d'une seule personne : un ordinateur fait tourner le site et la base jusqu'à ne plus suivre.
- Sépare cuisine et réserve (app contre base), puis embauche un agent de circulation (load balancer) et plus de cuisiniers (serveurs web).
- Laisse des copies de la base répondre à la plupart des "montre-moi" (réplicas), et garde un carnet rapide (cache) plus des copisteries de quartier (CDN) pour le populaire et le statique.
- Fais en sorte que les serveurs n'aient pas le login seulement en mémoire locale (sans état), et pousse les corvées lentes (email, images) dans une file d'attente (queue).
- Seulement quand une base principale ne peut plus écrire ni stocker assez tu découpes par domaine ou par shard, et seulement quand les utilisateurs sont dans le monde entier tu ajoutes des régions, en nommant toujours quelle fraîcheur ou simplicité tu abandonnes.