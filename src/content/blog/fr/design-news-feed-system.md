---
title: "Concevoir un système de news feed (guide débutant): fan-out, ranking et cache"
description: "Guide en langage simple du news feed social: fan-out à l'écriture vs à la lecture comme remplir les boîtes aux lettres vs consulter le tableau d'affichage, ranking, cache et le problème des célébrités."
date: "2025-10-05"
tags: [Design Système et Architecture, Backend et Bases de Données]
coverImage: /assets/images/design-news-feed-system.webp
previewImage: /assets/images/design-news-feed-system.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Guide en langage simple du news feed social: fan-out à l'écriture vs à la lecture comme remplir les boîtes aux lettres vs consulter le tableau d'affichage, ranking, cache et le problème des célébrités.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Vous ouvrez Instagram, X ou Facebook. On ne vous donne pas une page blanche et un devoir de recherche. On vous donne une liste: amis, photos, blagues, actualités. Cette liste est le **news feed** (parfois **home timeline**).

En entretien de system design, l'énoncé sonne énorme: "Concevez le feed Facebook" ou "Concevez le timeline Twitter." Ce n'est pas énorme si vous partez de la vie de tous les jours. Un feed ressemble plus à un **tableau d'affichage de quartier** et à une **tournée de livraison de journaux** qu'à de la magie.

Ce texte enseigne ce design depuis zéro. Sans jargon préalable. Quand un terme apparaît, on le définit d'abord.

---

## L'image du quotidien

Imaginez un tableau en liège au coin de votre rue.

- Les voisins épinglent des notes: "Vide-grenier samedi," "Chat perdu," "Nouvelle boulangerie."
- Vous vous approchez, lisez ce qui compte, rentrez chez vous.

Maintenant, multipliez ça par des millions de personnes, chacune avec son propre tableau, chacune suivant des centaines de "voisins." Deux questions dures apparaissent:

1. **Quand** met-on une nouvelle note sur le tableau de chacun?
2. Comment garder l'ouverture de l'app **rapide** quand le quartier est énorme?

Ces deux questions sont tout l'entretien, habillées en ingénierie.

---

## Ce dont le produit a vraiment besoin

Avant l'architecture, fixez le produit. Les entretiens récompensent ceux qui clarifient, pas ceux qui inventent Kafka en premier.

**Doit fonctionner**

1. Un utilisateur peut **publier** un post (texte; photos et vidéo sont souvent stockés ailleurs et liés par URL).
2. Un utilisateur peut **suivre** des personnes (ou être ami) et voir leurs posts dans le feed d'accueil.
3. Le home feed montre des histoires récentes, en général les plus récentes d'abord en première version.
4. Options plus tard: likes, commentaires, mute, proches, ranking plus intelligent.

**Chiffres d'exemple à valider à voix haute** (exemples, pas une loi)

| Objectif | Cible d'exemple |
| --- | --- |
| Utilisateurs actifs quotidiens | Environ 10 millions |
| Follows d'une personne normale | Jusqu'à quelques milliers |
| Follows de célébrité | Des millions de followers |
| Trafic de publication | Des milliers de posts par seconde en pic |
| Ouvrir le feed | Bien plus élevé que publier; c'est le chemin chargé |
| Sensation du feed | Première page en quelques centaines de millisecondes |
| Fraîcheur | Nouveaux posts visibles en quelques secondes pour les comptes normaux |

**En général hors périmètre sauf demande:** enchère publicitaire complète, live video, Stories, Explore de "gens que vous ne suivez pas," chiffrement de bout en bout. Dites ce que vous *ne* construisez pas pour que l'heure reste sur l'assemblage du feed.

Deux flux comptent plus que tout le reste:

1. **Publish (chemin d'écriture):** quelqu'un poste; le système stocke et achemine vers les feeds des followers.
2. **Home feed (chemin de lecture):** quelqu'un ouvre l'app; le système renvoie une page d'histoires prête à afficher.

---

## Fan-out: l'idée qui décide de tout

**Fan-out** signifie: "ce post unique doit devenir visible pour beaucoup de personnes."

Un auteur. Beaucoup de followers. Comment répartir la nouvelle?

Il y a deux stratégies classiques. Retenez-les avec le journal et le tableau d'affichage.

### Fan-out à l'écriture: pré-remplir la boîte aux lettres de chacun

Pensez à un livreur de journaux à 5 heures du matin.

Quand vous publiez, des workers cherchent vos followers et **déposent une copie de la nouvelle dans la boîte de chaque follower** (en logiciel: dans la liste de feed préconstruite de chacun). Quand un follower ouvre l'app, son feed attend déjà. Ouvrir la boîte est bon marché.

En jargon, c'est le **fan-out on write**, aussi appelé **modèle push**.

**Pourquoi c'est agréable**

- Les lectures du home feed sont simples: "donne-moi la page suivante de ma liste."
- Pour les comptes normaux (centaines ou quelques milliers de followers), ça se sent presque en direct.

**Pourquoi ça fait mal**

- Le coût croît avec le nombre de followers. Un post de quelqu'un à 10 millions de followers essaie de mettre à jour 10 millions de boîtes.
- Les gens qui n'ouvrent jamais l'app reçoivent quand même du courrier. Travail gaspillé.
- Les comptes super populaires créent une **tempête d'écritures**.

### Fan-out à la lecture: parcourir le quartier quand vous ouvrez l'app

Inversez maintenant le design.

Quand vous publiez, vous n'épinglez votre note que sur **votre** tableau (un seul post stocké). Quand un follower ouvre l'app, le système parcourt toutes les personnes qu'il suit, ramasse les notes récentes et les fusionne en une liste temporaire pour cette visite.

En jargon, c'est le **fan-out on read**, aussi appelé **modèle pull**.

**Pourquoi c'est agréable à la publication**

- Publier est bon marché: écrire un post et s'arrêter.
- Pas de travail gaspillé pour les utilisateurs inactifs.

**Pourquoi ça fait mal à la lecture**

- Ouvrir l'app fait un travail lourd: beaucoup de sources à récupérer et fusionner.
- Si vous suivez des centaines de personnes actives, le coût de fusion et la latence montent.
- Tenir un budget "ça se sent instantané" demande un cache soigné.

### Comparaison en une phrase

| Style | Image du quotidien | Moment dur |
| --- | --- | --- |
| Fan-out à l'écriture | Pré-remplir chaque boîte à la publication | Une célébrité publie |
| Fan-out à la lecture | Parcourir le tableau de chaque voisin à l'ouverture | L'utilisateur suit beaucoup de comptes actifs |

La plupart des systèmes réels aboutissent à un **hybride**. On le voit après le problème des célébrités, car l'hybride existe surtout pour le résoudre.

---

## Le problème des célébrités (avec douceur)

Un **compte célébrité** n'est pas "quelqu'un de célèbre." Dans ce design, cela signifie **un compte avec un nombre énorme de followers**: une pop star, une équipe, une marque d'info, une page de mèmes viraux.

Reprenez le livreur de journaux.

- Votre cousine poste une photo. Elle a 80 followers. Remplir 80 boîtes, c'est correct.
- Une célébrité poste une photo. Elle a 20 millions de followers. Remplir 20 millions de boîtes pour une photo, c'est demander à un seul livreur de livrer le journal de la ville porte à porte **tout de suite**, chaque fois que cette personne éternue en ligne.

Que se passe-t-il si vous n'utilisez que le fan-out à l'écriture pour les célébrités?

1. **Publier se sent lent ou la file explose.** Des millions de petites mises à jour s'accumulent.
2. **Les machines de cache fondent.** Clés chaudes et amplification d'écriture concentrent la douleur.
3. **Les utilisateurs silencieux reçoivent quand même du courrier.** La plupart de ces 20 millions ne sont pas en ligne à cette seconde.

Les systèmes de production traitent donc les célébrités autrement. Ils ne pré-remplissent **pas** chaque boîte pour les mega-comptes. Ils stockent le post de la célébrité une fois (ou dans une liste "posts de cet auteur") et le **tirent à la lecture** quand un follower ouvre le feed.

Ce n'est pas de l'impolitesse envers les gens célèbres. C'est de la physique: le coût d'écriture ne doit pas croître sans borne pour une seule action.

Une règle simple que les intervieweurs aiment:

- Followers sous un seuil (disons 10 000): push dans les timelines des followers.
- Followers au-dessus du seuil: écrire le post, marquer l'auteur comme **source pull**, fusionner à la lecture.

Vous pouvez déplacer le seuil après avoir mesuré le lag de fan-out et la latence du home feed. L'idée compte plus que le chiffre exact.

---

## Hybride: le design que la plupart des équipes livrent

| Type de compte | À la publication | Quand un follower ouvre le feed |
| --- | --- | --- |
| Normal | Fan-out à l'écriture dans les listes-boîtes des followers | Lire la liste préconstruite |
| Célébrité / mega | Stocker le post; pas de push de masse | Fusionner la liste préconstruite **avec** les posts récents des célébrités suivies |

Esquisse d'une fusion en lecture (conceptuel):

```
normal_ids   = derniers éléments de ma timeline préconstruite
celeb_ids    = posts récents de chaque célébrité que je suis
merged       = trier les deux par temps (plus récent d'abord)
page         = prendre les N premiers, retenir un curseur pour "page suivante"
```

Cet hybride garde le travail quotidien de publication borné et l'ouverture de l'app légère, tout en montrant les posts de célébrités sans remplir la planète entière.

---

## Qui suit qui: le graphe

Vous avez besoin d'une liste fiable de relations:

- Qui me suit? (nécessaire pour le fan-out à l'écriture)
- Qui est-ce que je suis? (nécessaire pour le fan-out à la lecture / fusion célébrité)
- Ai-je mis en sourdine ou bloqué quelqu'un? (filtre écriture et lecture)

Appelez cela le **graphe de follows** ou graphe social. Il peut vivre dans une base relationnelle bien indexée, une base de graphes, ou un store en colonnes larges. Détail d'entretien qui compte:

- Mettre en cache les listes chaudes de followers et de followees.
- Appliquer mute, block et confidentialité (par exemple proches seulement) **avant** le fan-out, pour ne pas écrire des posts dans des timelines qui ne doivent jamais les voir.

Pensez au graphe comme au **carnet d'adresses de la livraison de journaux**. De mauvaises adresses signifient de mauvaises boîtes.

---

## Ce que vous stockez dans une "boîte" (timeline)

Ne copiez **pas** le corps complet du post dans la liste de chaque follower. Copiez un **pointeur**: en général l'id du post et un score (souvent le temps).

Pourquoi?

- Une légende drôle n'a pas besoin de vivre en 50 000 copies de texte.
- Les corps vivent une fois dans le store de posts (et le cache de posts). Les timelines ne tiennent que des ids.

Modèle mental style Redis pour une timeline poussée:

```
timeline de l'utilisateur U = liste ordonnée de post_ids (le plus récent en haut)
garder seulement les quelques centaines ou milliers d'ids les plus récents
l'historique plus vieux peut basculer vers un store durable ou être reconstruit si besoin
```

La timeline est une **vue dérivée**, comme une table des matières personnalisée. La table des posts est la source de vérité du contenu.

---

## Le cache en langage simple

Un **cache** est une étagère rapide de réponses que vous pensez revoir bientôt. Le disque et les jointures lourdes sont l'entrepôt du fond. Le chemin du feed veut l'étagère.

Étagères utiles pour un feed:

| Étagère | Contenu | Pourquoi |
| --- | --- | --- |
| Cache de timeline | Ids de posts ordonnés par utilisateur | Ouvrir home ne doit pas tout reconstruire |
| Cache de posts | Texte, liens média, id d'auteur | Beaucoup d'utilisateurs voient le même post viral |
| Cache utilisateurs | Nom, avatar | Le même auteur apparaît sur beaucoup de cartes |
| Cache de graphe | Followers / followees / mutes | Fan-out et fusion en ont besoin vite |
| Compteurs | Likes et commentaires | Petits nombres mis à jour souvent |

Le **CDN** (réseau de diffusion de contenu) est hors de ces étagères pour les **octets** réels des photos et vidéos. Votre API feed doit renvoyer des URLs, pas streamer des mégaoctets de vidéo via les serveurs d'app.

Astuce mémoire: des timelines d'ids seulement gardent la RAM vers `utilisateurs × longueur_timeline`, pas `utilisateurs × taille_corps_post`. Les corps sont partagés.

Pour un kit de cache plus profond après ce post, voir [motifs de cache Redis](/blog/fr/redis-caching-patterns).

---

## Ranking: d'abord chronologique, plus malin ensuite

**Ranking** veut dire choisir l'ordre. Les débutants peuvent commencer honnêtement:

### Version 1: reverse chronological

Le plus récent d'abord. Facile à expliquer. Facile à stocker (score = temps). Bon v1 d'entretien.

### Version 2: ranking noté

Les apps de production réordonnent souvent avec des signaux:

- Quelle fraîcheur?
- Quelle proximité entre le spectateur et l'auteur? (affinité)
- Le post reçoit-il de l'engagement?
- Est-ce un type que le spectateur aime (photo vs lien)?
- Pénalités: déjà vu, sujets en sourdine, motifs de spam

Forme de formule miniature (pas du ML de production):

```
score = récence + affinité + engagement - pénalités
```

Où tourne souvent le ranking:

- **Pas** entièrement à la publication pour chaque spectateur (vous ne connaissez pas encore le contexte de chacun).
- **Souvent** à la lecture: prendre une fenêtre candidate d'ids récents, re-noter, appliquer une légère diversité (pas cinq posts de la même personne d'affilée), renvoyer une page.

Pour l'entretien: dites récupération chronologique d'abord, puis re-rank optionnel sur un petit ensemble de candidats. Le ranking machine learning complet est une autre carrière; nommez-le, ne vous y noyez pas.

---

## Chemin publish, étape par étape

1. Vérifier auth et rate limits (un utilisateur ne doit pas inonder le réseau).
2. Valider le texte et les ids média.
3. Créer un post id et **sauver le post de façon durable** (base de données). C'est la ligne de fiabilité.
4. Mettre l'objet post dans le cache de posts.
5. Enfiler le travail de fan-out (async). Répondre succès au client **après la sauvegarde durable**, pas après chaque boîte remplie.
6. Les workers chargent les followers éligibles du graphe (filtres de confidentialité appliqués).
7. Pour les followers normaux, ajouter le post id dans chaque cache de timeline.
8. Pour les auteurs célébrité, sauter le push de masse; garder une liste "posts par auteur" pour le pull.
9. Optionnel: enfiler des notifications ("Asha a posté") sur un chemin séparé.

Pourquoi un fan-out async? Les utilisateurs acceptent "votre post est sauvé, les amis le verront dans une seconde." Ils n'acceptent pas un spinner de 30 secondes parce qu'un graphe à l'échelle célébrité se met à jour.

Ce passage de relais async est la même famille de pensée que [l'architecture event-driven](/blog/fr/event-driven-architecture-intro).

---

## Chemin home feed, étape par étape

1. Auth, puis service de feed.
2. Charger les ids candidats depuis `timeline:{me}`.
3. Si l'utilisateur suit des célébrités, fusionner les posts récents de célébrités.
4. Paginer avec un curseur (jeton opaque: "continue après ce score").
5. **Hydrater**: charger en lot les corps de posts et profils d'auteurs (multi-get, pas une requête par carte).
6. Attacher les compteurs si besoin.
7. Passage de ranking optionnel.
8. Renvoyer du JSON. Le client charge les médias depuis le CDN via les URLs du JSON.

L'hydratation est là où les implémentations débutantes meurent en silence: une boucle "récupère ce post, puis celui-là" crée une tempête N+1. Toujours en lot.

---

## Esquisse simple du modèle de données

**Posts**

| Champ | Rôle |
| --- | --- |
| post_id | Clé primaire |
| author_id | Qui a écrit |
| text | Taille plafonnée |
| media_ids | Liens vers le service média / CDN |
| visibility | public / followers / close friends |
| created_at | Ordre temporel et pagination |
| deleted_at | Soft delete |

**Edges (follows)**

| Champ | Rôle |
| --- | --- |
| follower_id | Qui suit |
| followee_id | Qui est suivi |
| state | active / muted / flags de blocage |

Paire unique `(follower_id, followee_id)`. Index dans les deux sens pour répondre "followers de A" et "followees de B" sans scanner toute la table.

---

## Ce qui casse (et des correctifs calmes)

| Problème | Correctif calme |
| --- | --- |
| Publication célébrité fond le fan-out | Pull hybride; jamais de push vers des millions de timelines dans le thread de la requête |
| Post supprimé encore présent en id | Flag soft-delete; l'hydratation le jette; scrub de fond optionnel |
| Unfollow mais vieux posts restent | Accepter jusqu'au scroll, ou retirer en arrière-plan cet auteur de la timeline |
| Mute / block ignorés | Filtrer au choix des destinations et à la lecture |
| Ruée de cache sur un post viral | Chargement single-flight de l'objet post; chauffer le cache à la publication |
| Lag de fan-out | Surveiller la profondeur de file et le temps jusqu'à livraison; ajouter des workers |
| Complexité multi-région | Posts durables répliqués; timelines souvent régionales avec bascule soignée |

La cohérence des feeds est en général **éventuelle** pour la livraison: la ligne du post est solide; les timelines rattrapent. Vous ne promettez pas le même milliseconde pour chaque follower dans le monde.

---

## Petite intuition de capacité (dites-la à voix haute)

Avec environ 10 millions d'utilisateurs actifs quotidiens:

- Si les gens ouvrent souvent l'app et chaque ouverture montre beaucoup de cartes, le **chemin de lecture domine**.
- Le pull pur pour tous ceux qui suivent des centaines d'auteurs actifs coûte vite cher. Le push aide le cas courant.
- La mémoire des timelines est grande même avec des ids seulement: beaucoup d'utilisateurs × des centaines d'ids × octets par entrée. Plafonnez la longueur. Shardez le cache.

Ce sont des chiffres de discussion, pas un plan financier. Ajustez avec l'intervieweur.

---

## Que surveiller en production

- Succès de publish et temps jusqu'à écriture durable.
- Lag de la file de fan-out, surtout par tranches de taille de followers.
- Latence du home feed (médiane et queue lente) et taux de hit de cache.
- Misses d'hydratation qui frappent la base.
- Part des pages pure-push vs fusion hybride.
- Taux d'ids manquants ou supprimés dans le feed (doit rester bas).

Protégez le publish avec des limites pour qu'un spammeur ne brûle pas la flotte de fan-out. Voir [concevoir un rate limiter](/blog/fr/design-a-rate-limiter).

---

## Récap pour un ami

Si vous aviez trente secondes au café:

Un news feed est la liste personnalisée d'histoires de chaque personne, venant des gens qu'elle suit. Le choix dur est **quand** construire cette liste.

**Fan-out à l'écriture**, c'est pré-remplir la boîte de chaque follower quand quelqu'un poste. Ouvrir l'app est facile; les posts de célébrité peuvent faire exploser la poste.

**Fan-out à la lecture**, c'est stocker le post une seule fois, puis ramasser chez tous ceux que vous suivez à l'ouverture. Publier est facile; des listes de follows très actives rendent l'ouverture lente.

**Hybride** pousse pour les comptes normaux et tire pour les célébrités pour qu'aucun chemin ne fonde.

Le **cache** garde les timelines, posts et profils chauds sur une étagère rapide. Le **ranking** peut commencer par le plus récent d'abord puis re-noter un petit ensemble de candidats. Les timelines stockent des **ids**, pas des copies complètes de chaque légende. Publier doit réussir quand le post est sauvé, pendant que le remplissage des boîtes continue en arrière-plan.

C'est tout le design, sans brouillard de buzzwords.

---

## Clôture d'entretien

Une bonne réponse a:

1. Un périmètre produit clair.
2. Deux flux: publish et home.
3. Un choix net **push vs pull vs hybride**, avec le problème des célébrités nommé calmement.
4. Un graphe de follows.
5. Des timelines d'ids seulement, une hydratation multi-get et une carte de cache.
6. Ranking chronologique d'abord, ranking noté en extension.

S'il reste du temps: scale horizontal du web tier, sharding des posts, réplicas de lecture multi-région, et pourquoi le feed est un index dérivé plutôt qu'un énorme join SQL de "tout ce que mes amis ont jamais écrit."

Liés sur ce blog: [motifs de cache Redis](/blog/fr/redis-caching-patterns), [architecture event-driven](/blog/fr/event-driven-architecture-intro), [concevoir un rate limiter](/blog/fr/design-a-rate-limiter).