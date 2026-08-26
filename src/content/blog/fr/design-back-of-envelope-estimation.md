---
title: "Estimation back-of-the-envelope pour les entretiens system design"
description: "Apprenez le calcul de capacité à la louche pour les entretiens : QPS, stockage, bande passante et latence avec des analogies du quotidien, un exemple détaillé pas à pas, et un récap à expliquer à un ami."
date: "2026-02-13"
tags: [Design Système et Architecture]
coverImage: /assets/images/design-back-of-envelope-estimation.webp
previewImage: /assets/images/design-back-of-envelope-estimation.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Apprenez le calcul de capacité à la louche pour les entretiens : QPS, stockage, bande passante et latence avec des analogies du quotidien, un exemple détaillé pas à pas, et un récap à expliquer à un ami.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Vous organisez une fête pour une trentaine d'amis. Vous n'avez pas besoin d'un tableur de traiteur. Vous demandez : Combien de personnes vont vraiment venir ? Combien de parts mange chacune ? Boivent-elles plutôt du soda ou de l'eau ? Avec ça, vous achetez pizzas et boissons. Vous pouvez vous tromper d'une ou deux pizzas. Ce n'est pas grave. Acheter 3 pizzas pour 30 adultes affamés, c'est une catastrophe. En acheter 40, c'est du gaspillage, mais on s'en sort.

Ou pensez aux courses de la semaine. Vous regardez le frigo, estimez combien de repas vous allez cuisiner, ajoutez une petite marge, et partez. Vous ne pesez pas chaque tomate. Vous faites de la planification d'**ordres de grandeur** pour ne pas tomber à sec en milieu de semaine ni remplir le caddie d'aliments qui pourriront.

L'**estimation back-of-the-envelope**, c'est le même réflexe appliqué au logiciel. Avant de dessiner vingt boîtes au tableau, vous demandez : Combien de requêtes par seconde ? Combien de données à stocker ? Quelle est la taille des réponses qui sortent sur le réseau ? Les réponses approximatives façonnent le design. Se tromper d'un facteur 2 est souvent acceptable. Se tromper d'un facteur 100 (oublier les pics, ou confondre mégaoctets et gigaoctets) est ce qui fait grimacer l'interviewer.

Ce billet enseigne cette compétence depuis zéro. Sans supposer que vous maîtrisez déjà les entretiens. On commence par le *pourquoi*, puis on nomme les quatre chiffres avec des analogies de cuisine et de trafic, puis on déroule un exemple d'app photo lentement, arithmétique écrite, et on termine par un récap du type "explique-le à un ami".

---

## Pourquoi le calcul grossier compte avant toute formule

Dans un entretien system design, la salle ne note pas la division longue. Elle vérifie :

1. **Laissez-vous l'échelle façonner l'architecture ?** Un feed à 50 requêtes par seconde et un feed à 50 000 sont des produits différents, même si les deux sont "un timeline".
2. **Séparez-vous moyenne et pic ?** L'heure du déjeuner et le jour de lancement ne sont pas la moyenne journalière.
3. **Gardez-vous les unités honnêtes ?** "Environ 5" ne dit rien. "Environ 5 To par an de photos" dit quelque chose.
4. **Pouvez-vous parler en calculant ?** L'entretien, c'est narration plus chiffres, pas du calcul silencieux.

Si vous sautez l'estimation, vous sur-concevez souvent (microservices et multi-région pour un outil à 200 utilisateurs) ou sous-concevez (une seule base pour chaque vue photo du monde). Cinq minutes de calcul grossier évitent les deux.

Vous ne produisez **pas** un plan de capacité digne d'une direction financière. Énoncez les hypothèses à voix haute. Arrondissez sans pitié. Passez à la suite quand l'ordre de grandeur suffit pour choisir une direction d'architecture.

---

## Les quatre chiffres, en langage simple

Mémorisez les noms. Les formules viennent après que vous puissiez les *sentir*.

### QPS (queries per second) : le trafic à la porte

Le **QPS**, c'est combien de requêtes votre système traite en une seconde.

Image cuisine : un food truck. Si 3 600 clients commandent en une heure et arrivent de façon régulière, c'est environ 1 client par seconde. Si un concert se termine et que 30 personnes se mettent en file d'un coup, votre débit de *pic* est bien plus élevé que la *moyenne*.

Image trafic : voitures à un péage. La moyenne de voitures par seconde sur une journée est calme. Le pic du vendredi soir, c'est ce qui dimensionne les voies.

En entretien :

- **QPS moyen** = charge de base pour serveurs, bases et rate limits.
- **QPS de pic** = ce pour quoi vous dimensionnez (souvent 2x à 5x la moyenne ; dites votre facteur à voix haute).
- **QPS lecture vs écriture** = souvent différents. Les apps sociales sont souvent read-heavy (beaucoup de vues, moins de posts).

Petit exemple, écrit :

- 1 000 000 de personnes utilisent l'app chaque jour (1M DAU).
- Chacune fait 1 requête par jour.
- Un jour fait environ 100 000 secondes (on arrondit 86 400 ; plus bas).
- QPS moyen ≈ 1 000 000 ÷ 100 000 = **10 QPS**.

C'est un petit système. Vous n'avez pas besoin d'un énorme cluster pour 10 QPS de requêtes simples.

### Stockage : le placard et l'entrepôt

Le **stockage**, c'est combien de disque (ou d'object storage) il faut pour garder les données aussi longtemps que le produit l'exige.

Image cuisine : la taille du placard dépend de la taille du paquet × le nombre de paquets × la durée de conservation des restes. Un pot d'épices est minuscule. Un congélateur plein de glaces ne l'est pas.

En logiciel :

- Une ligne de metadata de chat peut faire quelques centaines d'octets.
- Une photo peut faire 0,5 Mo après compression.
- Une vidéo peut faire des centaines de Mo.

Séparez toujours la **metadata** (petites lignes : qui, quand, titre) des **blobs** (photos, vidéos, fichiers). Ils vivent dans des systèmes différents et dominent le coût de façons différentes.

### Bande passante : la largeur du tuyau

La **bande passante**, c'est combien de données bougent par seconde (ou par jour) en entrée ou en sortie d'un service.

Image cuisine : la largeur de l'évacuation de l'évier. Un filet d'eau, ça passe. Vider un seau d'un coup inonde le plan de travail.

Image trafic : une route à 2 voies face à 8 voies. Les mêmes "voitures", capacité différente si chaque voiture est un camion plein de vidéo.

En entretien, un check classique est :

`QPS lecture de pic × taille moyenne de réponse ≈ bande passante de pic`

Si ce chiffre est énorme, il faut souvent un CDN (cache en edge près des utilisateurs) ou des payloads plus petits, pas un serveur d'app plus gros.

### Latence : le temps d'une commande

La **latence**, c'est combien de temps une requête attend du début à la fin (ou combien de temps prend une étape dans le système).

Image cuisine : le temps entre "j'ai commandé" et "l'assiette dans les mains". Une étape lente (four froid, livreur bloqué) gâche l'expérience même si la cuisine est immense.

Image trafic : le temps d'une voiture de la maison au travail. Ajouter plus de voitures (plus de QPS) ne répare pas un pont qui prend toujours 2 heures à traverser.

Intuition grossière à garder (ordres de grandeur, pas une fiche hardware 2026) :

| Type de travail | Sensation approximative |
| --- | --- |
| Lecture mémoire / cache | très rapide |
| Lecture SSD local | encore rapide en entretien |
| Seek aléatoire disque mécanique | nettement plus lent |
| Réseau dans un datacenter | souvent sous 1 ms d'ordre |
| Réseau entre continents | dizaines à centaines de ms |

Ce que ça vous apporte : ne mettez pas "écrire chaque événement sur disque mécanique avant de répondre" sur le hot path sans raison. Ne dites pas "on réplique partout" sans admettre que la latence multi-région est réelle.

---

## Unités à ne pas inventer sous pression

Tout commence en **octets**. Les gens se figent en mélangeant Ko, Mo, Go, To.

Tableau utile (puissances de deux, approximatives) :

| Puissance de 2 | Environ | Nom | Sensation quotidienne |
| --- | --- | --- | --- |
| 10 | ~1 millier | 1 Ko | texte court, ids, headers |
| 20 | ~1 million | 1 Mo | petite photo, court clip |
| 30 | ~1 milliard | 1 Go | RAM de laptop, gros logs journaliers |
| 40 | ~1 billion (US) | 1 To | gros morceau de DB ou de média |
| 50 | ~1 billiard | 1 Po | archives média multi-années à grande échelle |

Raccourcis pour le calcul d'entretien :

- 1 jour = 86 400 secondes ≈ **100 000** secondes (10^5). Suffisant.
- 1 mois ≈ 2,5 millions de secondes.
- Un million d'utilisateurs × 1 action par jour ≈ **10 QPS** moyen (1 000 000 ÷ 100 000).

En doute, arrondissez vers des puissances de dix faciles. 86 400 devient 100 000. 365 jours peut devenir 400 si vous devez estimer vite un stockage multi-années et ne vous souciez que de l'ordre de grandeur.

---

## Disponibilité en une minute (les "nines")

Parfois on demande combien le système peut être down. Les "nines" sont des pourcentages d'uptime :

| Disponibilité | Downtime approximatif par an |
| --- | --- |
| 99 % (deux nines) | environ 3,65 jours |
| 99,9 % (trois nines) | environ 8,8 heures |
| 99,99 % (quatre nines) | environ 53 minutes |
| 99,999 % (cinq nines) | environ 5 minutes |

Image cuisine : un café "ouvert 99 % de l'année" reste fermé plusieurs jours. Un système de paiements vise souvent plus haut qu'un wiki interne.

N'inventez pas un SLA dramatique pour paraître senior. Choisissez une cible cohérente avec le produit et concevez pour ça.

---

## Recette QPS (écrivez-la au tableau)

1. Obtenez le **DAU** (utilisateurs actifs quotidiens), ou estimez-le depuis le MAU (mensuels).
2. Obtenez les **actions par utilisateur et par jour** sur l'endpoint chaud (uploads, vues, posts).
3. QPS moyen ≈ `(DAU × actions par jour) / 100 000`.
4. QPS de pic ≈ moyenne × facteur de pic (souvent **2x à 5x** ; demandez ou dites 3x).
5. Séparez **lectures** et **écritures**. Un seul chiffre de "trafic" cache le vrai goulot.

Du QPS aux serveurs (sanity check très grossier seulement) :

Si une instance d'app tient environ 1 000 QPS simples avec une latence acceptable (dépend énormément du travail par requête) :

`serveurs ≈ QPS de pic / QPS par instance`

Ajoutez de la marge (disons 2x) pour les deploys et les pannes. Ce n'est pas un bon de commande. C'est un check que "une machine" ou "une petite flotte" est plausible.

---

## Recette stockage

Stockage ≈ **taille d'objet × écritures par jour × jours retenus**, puis multipliez pour réplicas, index et gaspillage.

1. **Taille moyenne de payload** (texte, metadata, media). Cap et moyenne séparés s'il y a du media.
2. **Écritures par jour** depuis DAU et taux de create.
3. **Rétention** (30 jours ? 5 ans ? pour toujours ?).
4. Multiplicateurs : réplication (3x est un défaut courant en entretien), index (peut-être 20 % à 50 % en plus sur certaines tables), logs, versions.

Le media domine quand il existe. Une photo moyenne de 1 Mo à 1 000 000 uploads/jour, c'est **1 To/jour** avant thumbnails et caches CDN. Séparez toujours la taille de la base metadata de celle de l'object store.

---

## Recette bande passante

1. **Taille de réponse × QPS** sur le hot path de lecture.
2. Ou **octets écrits par jour / 100 000** pour l'ingress d'écriture soutenu.
3. Bande passante de pic ≈ QPS de pic × octets par réponse.

Fragment d'exemple :

- 50 000 QPS lecture
- 2 Ko de réponse moyenne

`50 000 × 2 Ko = 100 000 Ko/s = 100 Mo/s`

100 Mo/s, c'est environ **0,8 Gbit/s**. Ce seul chiffre dit si la carte réseau d'une machine est absurde, s'il faut un edge CDN, et si des réponses plus petites (pagination, moins de champs) font partie du design.

---

## Exemple travaillé : app de partage de photos (marche lente)

Utilisez des chiffres fictifs mais cohérents. Dites que ce sont des hypothèses. Écrivez-les.

**Hypothèses :**

- 200 millions d'utilisateurs actifs mensuels (MAU)
- La moitié utilise l'app un jour donné → **100 millions de DAU**
- Chaque utilisateur quotidien upload **0,2** photo par jour en moyenne (environ 1 photo tous les 5 jours)
- Chaque utilisateur quotidien regarde **20** photos par jour
- Photo moyenne stockée : **0,5 Mo** après compression
- Thumbnail du feed : **20 Ko**
- Metadata par photo : **200 octets**
- Garder les originaux **5 ans**
- Facteur de pic sur les vues : **3x**

### Étape 1 : QPS écriture (uploads)

Uploads quotidiens :

`100 000 000 DAU × 0,2 photos = 20 000 000 photos par jour`

QPS écriture moyen (en utilisant 100 000 secondes par jour) :

`20 000 000 ÷ 100 000 = 200 QPS`

QPS écriture de pic (si on peake aussi les uploads à 3x, ou au moins on mentionne le burst) :

`200 × 3 = 600 QPS`

**Sens en mots simples :** environ 200 requêtes d'upload par seconde sur une seconde normale. C'est du vrai travail, mais ce n'est pas le chiffre effrayant de ce produit.

### Étape 2 : QPS lecture (vues)

Vues quotidiennes :

`100 000 000 × 20 = 2 000 000 000 vues par jour`

QPS vue moyen :

`2 000 000 000 ÷ 100 000 = 20 000 QPS`

QPS vue de pic :

`20 000 × 3 = 60 000 QPS`

**Sens :** les lectures sont environ 100× les écritures (20 000 vs 200 en moyenne). Le problème d'échelle, c'est **regarder**, pas uploader.

### Étape 3 : Stockage objets (les photos elles-mêmes)

Volume média quotidien :

`20 000 000 photos × 0,5 Mo = 10 000 000 Mo par jour`

10 000 000 Mo = **10 000 Go** = **10 To par jour**

Cinq ans (utilisez 365 jours par an) :

`10 To/jour × 365 jours/an × 5 ans`

D'abord : `10 × 365 = 3 650 To par an`

Puis : `3 650 × 5 = 18 250 To`

1 000 To ≈ 1 Po, donc 18 250 To ≈ **18 Po** raw pour une copie.

Si vous gardez 3 copies pour la durabilité (modèle simple d'entretien), planifiez de l'ordre de **dizaines de pétaoctets**. Thumbnails et transcodes s'ajoutent ; mentionnez-les même sans calculer chaque variante.

### Étape 4 : Stockage metadata (petites lignes sur chaque photo)

Metadata quotidienne :

`20 000 000 × 200 octets = 4 000 000 000 octets`

4 000 000 000 octets = **4 Go par jour** (car 1 Go fait environ 1 milliard d'octets pour ce calcul grossier)

Cinq ans :

`4 Go/jour × 365 × 5`

`4 × 365 = 1 460 Go par an`

`1 460 × 5 = 7 300 Go` ≈ **7,3 To** raw

**Sens :** la metadata, c'est quelques téraoctets sur des années. Ça peut vivre dans un tier de base de données normal. Les **photos** sont le problème multi-pétaoctets. Des systèmes de stockage différents pour des jobs différents.

### Étape 5 : Bande passante si l'origin servait chaque thumbnail

Supposons que chaque vue tire un thumbnail de 20 Ko depuis votre origin (sans CDN) :

Pic :

`60 000 QPS × 20 Ko = 1 200 000 Ko/s`

1 200 000 Ko/s = **1 200 Mo/s** = **1,2 Go/s**

1,2 Go/s × 8 bits/octet ≈ **9,6 Gbit/s**, souvent dit environ **10 Gbit/s**.

**Sens :** servir chaque image chaude depuis le tier app ou le path origin fait mal. C'est un argument fort pour **CDN + cache edge** sur les images populaires.

### Ce que vous dites à l'interviewer (le but du calcul)

"Les écritures sont modestes, environ 200 QPS en moyenne. Les lectures sont le problème d'échelle, environ 20 000 en moyenne et 60 000 en pic. La metadata sur cinq ans, ce n'est que quelques téraoctets. Les photos originales sont multi-pétaoctets. Donc le design s'articule autour de l'object storage, d'un CDN pour le média chaud, et d'un chemin metadata qui reste simple."

Ce paragraphe est la raison pour laquelle on a fait le calcul sur l'enveloppe. Les chiffres vous ont dit *où* passer du temps de design.

---

## Taille de cache (passage rapide)

Règle grossière en entretien : cachez le **working set** (données chaudes), pas tout l'entrepôt.

Image cuisine : vous gardez les ingrédients de ce soir sur le plan de travail, pas le supermarché entier dans la cuisine.

Si 20 % des clés portent 80 % du trafic :

- 10 millions d'objets actifs
- 20 % chauds = 2 millions d'objets
- 2 Ko chacun

`2 000 000 × 2 Ko = 4 000 000 Ko = 4 Go` de cache utile avant overhead et réplicas.

Énoncez l'hypothèse 80/20. Si l'interviewer donne un autre hit rate, recalculez.

---

## Astuces pour un tableau propre

1. **Arrondissez et approximez.** 99 987 ÷ 9,1, c'est "environ 100 000 ÷ 10". Personne ne note la division longue.
2. **Écrivez les hypothèses.** DAU, actions par jour, taille d'objet, rétention, facteur de pic. Revenez-y si le design change.
3. **Étiquetez les unités à chaque fois.** "5" ne sert à rien. "5 Mo/s" ou "5 To/an" oui.
4. **Séparez chemins lecture et écriture.** Un seul chiffre de trafic cache le goulot.
5. **Séparez metadata et media.** Les octets dans un store de lignes et ceux dans l'object storage répondent à des questions différentes.
6. **Dites quand la précision est gaspillée.** Si le design a de toute façon besoin de sharding, ne brûlez pas cinq minutes à affiner 12 400 vs 15 000 QPS.
7. **Proposez le calcul, ne l'imposez pas.** Certains veulent l'architecture d'abord. Demandez : "On fait un check capacité rapide avant d'aller plus loin ?"

---

## Comment s'entraîner

Les dry runs battent la relecture de tables.

1. Flashez la table d'unités jusqu'à ce que Ko → Mo → Go → To → Po soit automatique.
2. Choisissez un produit (chat, raccourcisseur d'URL, news feed, drive) et estimez QPS + stockage en 10 minutes chrono.
3. Changez une hypothèse (10× DAU, ajout de vidéo, rétention 30 jours) et ne recalculez que ce qui casse.
4. Expliquez à voix haute. L'entretien, c'est de la parole plus des chiffres.
5. Gardez une cheatsheet d'une page le temps d'apprendre, puis retirez-la.
6. Recalez contre des blogs d'ingénierie publics quand vous le pouvez. Le même ordre de grandeur bat le chiffre exact.

Travaillez un système **read-heavy** (news feed) et un chemin **write-heavy** (ingest de métriques, messages de chat) pour ne pas toujours coller le même template.

---

## Où ça s'insère dans l'entretien

Le calcul d'enveloppe est souvent un court segment :

1. Clarifier les exigences et les hypothèses d'échelle.
2. Design de haut niveau.
3. **Check de capacité** (ce billet) si l'échelle n'est pas triviale.
4. Focus ciblé (API, modèle de données, goulots, modes de panne).

Si vos chiffres disent qu'une primary de base tient la metadata et que l'object storage tient les blobs, dites-le et avancez. Si le QPS lecture de pic est à six chiffres et que chaque lecture tape le disque, corrigez le design avant de dessiner de jolies boîtes pour des features que personne n'a demandées.

Billets liés : [Concevoir un rate limiter](/blog/design-a-rate-limiter), [Concevoir un raccourcisseur d'URL](/blog/design-url-shortener), [Patterns de cache Redis](/blog/redis-caching-patterns).

---

## Explique-le à un ami

Si un ami demande "c'est quoi l'estimation back-of-the-envelope en system design ?", dites ceci :

"C'est planifier une fête, mais pour des serveurs. Tu estimes combien de gens viennent, combien chacun mange, et quelle taille font les restes. En logiciel, ces estimations s'appellent **QPS** (requêtes par seconde), **stockage** (combien de données tu gardes), **bande passante** (quelle largeur de tuyau il faut) et **latence** (combien de temps une requête attend). Tu arrondis fort, tu dis tes hypothèses, et tu utilises les réponses approximatives pour choisir une architecture : une base, un cache, un CDN, du sharding, ce que poussent les chiffres. Se tromper d'un facteur 2 est normal. Mélanger les unités ou oublier les pics, c'est la vraie erreur."

Puis donnez-leur les formules en une ligne :

| Besoin | Formule approximative |
| --- | --- |
| Secondes par jour | environ 100 000 (10^5) |
| QPS moyen | DAU × actions par jour ÷ 100 000 |
| QPS de pic | moyenne × 2 à 5 (dites votre facteur) |
| Stockage | taille × écritures/jour × jours gardés × réplicas |
| Bande passante | QPS × octets par réponse |
| Cache | working set chaud, pas le dataset complet |

L'estimation back-of-the-envelope est un outil de communication. Vous montrez que les contraintes d'échelle façonnent l'architecture, et que vous savez faire un calcul grossier honnête sans fausse précision. Entraînez les recettes jusqu'à ce qu'elles deviennent ennuyeuses. L'ennui, c'est ce que vous voulez quand l'horloge tourne.