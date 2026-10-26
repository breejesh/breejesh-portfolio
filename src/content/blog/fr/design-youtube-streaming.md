---
title: "Concevoir une plateforme vidéo à l'échelle de YouTube : envois reprenables, transcodage parallèle, ABR et CDN"
description: "Comment fonctionnent les plateformes vidéo de bout en bout : calcul de capacité, envois par morceaux reprenables, un DAG de transcodage qui découpe les vidéos en segments et encode une échelle de débits en parallèle, empaquetage HLS et DASH, lecture à débit adaptatif, cache CDN à plusieurs niveaux au plus près des spectateurs, et où part vraiment l'argent."
date: "2025-09-29"
tags: [Design Système et Architecture, Backend et Bases de Données]
coverImage: /assets/images/design-youtube-streaming.webp
previewImage: /assets/images/design-youtube-streaming.webp
---

> **TL;DR**
> * **Le problème :** Accepter des fichiers énormes envoyés par des créateurs sur des connexions instables, transformer rapidement chacun en dizaines de formats et de qualités, et les diffuser sur tous les types d'appareils et de réseaux sans mise en mémoire tampon, à une échelle où la bande passante est le premier coût de l'entreprise.
> * **La conception :** Des envois par morceaux reprenables vers un stockage objet ; un DAG de transcodage piloté par événements qui découpe chaque vidéo en courts segments et encode une échelle de débits en parallèle sur de nombreux workers ; un empaquetage HLS et DASH ; une lecture via des manifestes signés, un CDN à plusieurs niveaux avec des caches dans ou près des fournisseurs d'accès, et un lecteur qui choisit le débit de chaque segment.
> * **Le résultat :** Une vidéo 4K de dix minutes devient visible en quelques minutes plutôt qu'en heures, l'immense majorité des octets est servie depuis des caches à quelques sauts réseau du spectateur, et la qualité s'adapte en continu au lieu de se figer.

YouTube a indiqué que plus de 500 heures de vidéo sont mises en ligne chaque minute, et dès 2017 que l'on y regardait plus d'un milliard d'heures par jour. Ces deux chiffres définissent le système. Le côté écriture est un gigantesque pipeline de traitement par lots. Le côté lecture est l'un des plus grands problèmes de diffusion de contenu d'internet. Ils ne partagent presque rien, hormis le stockage entre les deux.

Cet article conçoit les deux côtés.

---

## Exigences et chiffres

**Fonctionnelles :** mettre en ligne des vidéos ; les traiter dans des formats diffusables ; les lire sur téléphones, navigateurs et téléviseurs ; adapter la qualité au réseau ; afficher miniatures et métadonnées.

**Non fonctionnelles :** les envois survivent aux coupures de connexion ; les nouvelles vidéos sont lisibles en quelques minutes ; la lecture démarre en une seconde environ et se bloque rarement ; disponibilité mondiale.

| Grandeur | Valeur | Conséquence |
| --- | --- | --- |
| Mises en ligne | ~500 heures par minute | ~720 000 heures de vidéo nouvelle par jour |
| Rendus par vidéo | ~6 résolutions x 2 ou 3 codecs | Chaque heure envoyée devient de nombreuses heures encodées |
| Stockage encodé | De l'ordre de plusieurs Go par heure sur toute l'échelle | Des pétaoctets de stockage neuf par jour |
| Temps de visionnage | Plus d'un milliard d'heures par jour (chiffre de 2017) | À ~2,5 Mbit/s en moyenne, de l'ordre d'un exaoctet de sortie par jour |

La dernière ligne explique pourquoi le CDN, et non le transcodeur, domine le coût et l'architecture. Gagner 10 % de débit grâce à un meilleur encodage, c'est économiser 10 % de votre plus grosse facture.

---

## Le pipeline de mise en ligne et de traitement

![Pipeline de mise en ligne : le créateur envoie des morceaux via une API d'envoi reprenable vers un stockage objet brut, un événement VideoUploaded déclenche un orchestrateur de transcodage en DAG qui découpe la vidéo en morceaux de quatre secondes, les répartit sur une flotte d'encodeurs produisant une échelle de débits pour plusieurs codecs, un empaqueteur écrit segments et manifestes HLS et DASH, tandis que miniatures et contrôles de sécurité tournent en parallèle et marquent les métadonnées comme prêtes](/assets/images/hld/design-video-upload-pipeline.webp)

* **Creator.** Envoie depuis un téléphone dans le train ou depuis la connexion d'un studio. Le fichier peut peser des gigaoctets.
* **Upload API (reprenable).** Découpe l'envoi en morceaux (de 8 à 16 Mo par exemple) avec un identifiant de session, pour qu'une connexion coupée reprenne au dernier morceau confirmé au lieu de tout recommencer. Les clients envoient souvent directement vers le stockage objet avec des URL présignées ; l'API ne fait que gérer la session.
* **Envois bruts (stockage objet).** Le fichier original est conservé. De meilleurs encodeurs apparaissent tous les quelques ans, et réencoder les vidéos populaires depuis l'original est la manière dont les plateformes réduisent ensuite leur débit.
* **Événement VideoUploaded.** Découple l'envoi du traitement. Un pic de mises en ligne met du travail en file au lieu de faire échouer des requêtes.
* **Orchestrateur de transcodage en DAG.** Le traitement est un graphe orienté acyclique de tâches : analyser, découper, encoder chaque segment dans chaque rendu, fusionner, empaqueter, miniatures, contrôles de sécurité. L'orchestrateur suit l'état de chaque tâche et réessaie les échecs individuellement.
* **Découpage en morceaux.** Couper la vidéo sur les images clés en segments de quelques secondes est la clé de la vitesse. Chaque segment s'encode indépendamment, donc une vidéo de 10 minutes devient des centaines de petites tâches parallèles.
* **Flotte d'encodeurs (échelle x codecs).** Produit chaque rendu, en général H.264 pour la compatibilité plus VP9 ou AV1 pour l'efficacité. L'encodage consomme tellement de CPU que Google a conçu une puce de transcodage vidéo dédiée (le VCU Argos, décrit en 2021) pour YouTube.
* **Packager (HLS / DASH).** Enveloppe les segments encodés dans les formats attendus par les lecteurs et écrit des manifestes listant tous les rendus. CMAF permet à HLS et DASH de partager les mêmes segments médias, ce qui divise par deux le stockage de la sortie empaquetée.
* **Segments encodés + manifestes.** La source de vérité du côté lecture, généralement dans un stockage objet derrière le CDN.
* **Miniatures + contrôles de sécurité.** Tournent en parallèle : extraction des miniatures, détection des droits d'auteur et classifieurs de politique. Une vidéo peut être lisible par la personne qui l'a envoyée tout en restant en examen avant publication.
* **Base de métadonnées vidéo.** Titre, propriétaire, statut, rendus disponibles et état du traitement.

La note verte en est la récompense : le découpage fait passer le temps d'encodage de « proportionnel à la durée de la vidéo » à « proportionnel à la durée de la vidéo divisée par la taille de la flotte ».

**Une échelle de débits (indicative, H.264) :**

| Rendu | Résolution | Débit typique |
| --- | --- | --- |
| 240p | 426 x 240 | ~0,4 Mbit/s |
| 360p | 640 x 360 | ~0,8 Mbit/s |
| 480p | 854 x 480 | ~1,4 Mbit/s |
| 720p | 1280 x 720 | ~2,8 Mbit/s |
| 1080p | 1920 x 1080 | ~5 Mbit/s |
| 2160p (4K) | 3840 x 2160 | ~15 à 20 Mbit/s |

Les plateformes modernes n'utilisent pas une échelle unique. Netflix a popularisé en 2015 l'**encodage par titre** : un dessin animé aux couleurs franches demande bien moins de bits qu'un film d'action granuleux pour la même qualité perçue, donc chaque titre reçoit sa propre échelle.

---

## La lecture et le CDN

![Chemin de lecture vidéo : le lecteur obtient d'abord une URL de manifeste signée auprès de l'API de lecture, qui vérifie droits et région auprès des métadonnées et des autorisations, puis demande les segments à un cache de périphérie situé près ou à l'intérieur du fournisseur d'accès, qui se rabat sur un cache régional intermédiaire et un bouclier d'origine devant les segments encodés ; le lecteur mesure débit et tampon pour choisir le débit de chaque segment](/assets/images/hld/design-video-playback-cdn.webp)

1. **D'abord le manifeste.** Le lecteur appelle la Playback API, qui vérifie autorisations et règles régionales, puis renvoie une URL signée à courte durée de vie vers le manifeste.
2. **Les segments depuis la périphérie.** Le lecteur demande les segments un par un au cache de périphérie le plus proche. Les vidéos populaires s'y trouvent presque toujours.
3. **Des échecs par niveaux.** En cas d'échec, la périphérie interroge un cache régional intermédiaire, qui interroge un bouclier d'origine placé devant le stockage. Chaque niveau regroupe de nombreux échecs en une seule requête vers l'amont, si bien que l'origine ne voit qu'une infime fraction du trafic.
4. **Le débit adaptatif.** Après chaque segment, le lecteur met à jour son estimation du débit et vérifie son tampon, puis choisit le rendu du segment suivant. Un court tunnel vous fait passer en 480p quelques secondes au lieu de figer la vidéo.

**Des caches chez les fournisseurs d'accès.** Les plus grandes plateformes installent des serveurs de cache directement dans les réseaux des fournisseurs d'accès : les appliances Open Connect de Netflix et le Global Cache de Google en sont les exemples connus. Les octets ne traversent alors jamais la partie coûteuse d'internet. Le fournisseur économise du transit, la plateforme économise de la sortie, et le spectateur gagne en latence.

La note verte fixe l'objectif opérationnel : le niveau de périphérie doit servir l'écrasante majorité des octets.

---

## Où part l'argent

| Coût | Moteur | Levier |
| --- | --- | --- |
| Diffusion (sortie du CDN) | Temps de visionnage x débit | Meilleurs codecs (AV1), échelles par titre, caches chez les fournisseurs d'accès |
| Calcul d'encodage | Heures envoyées x rendus | Encoder la longue traîne à la demande ; ne dépenser plus de calcul que pour les vidéos populaires |
| Stockage | Rendus x rétention | Supprimer les rendus hauts rarement vus ; garder les originaux en stockage froid |
| Modération | Volume de mises en ligne | D'abord des classifieurs automatiques, examen humain là où c'est nécessaire |

La longue traîne compte ici. La plupart des vidéos mises en ligne sont peu regardées. Une stratégie courante consiste à encoder une échelle minimale à l'envoi et à ne générer les rendus premium (4K, AV1) qu'une fois la vidéo devenue populaire, car le coût d'encodage ne vaut la peine que si les économies de diffusion suivent.

---

## Modes de défaillance

| Défaillance | Comportement attendu |
| --- | --- |
| La connexion d'envoi coupe à 80 % | Reprise au dernier morceau confirmé |
| Une tâche d'encodage échoue | L'orchestrateur ne réessaie que ce segment ; le reste du DAG continue |
| Encodeurs engorgés pendant un pic | La file grossit ; priorité aux envois courts et populaires ; publication des rendus bas d'abord |
| Un nœud de cache de périphérie tombe | Le trafic bascule vers les voisins ; le niveau intermédiaire absorbe les échecs supplémentaires |
| Vidéo virale, caches froids | Le regroupement des requêtes à chaque niveau évite une ruée sur l'origine |
| Le réseau du spectateur se dégrade | L'ABR baisse la qualité au lieu de mettre en mémoire tampon |

---

## Liste de contrôle pour la production

- [ ] Envois par morceaux reprenables, avec URL présignées directes vers le stockage
- [ ] Originaux conservés pour de futurs réencodages
- [ ] DAG piloté par événements avec réessais par tâche et sorties idempotentes
- [ ] Découpage aligné sur les images clés pour encoder en parallèle
- [ ] Échelles par titre ou selon le contenu ; codecs modernes pour le contenu populaire
- [ ] HLS et DASH produits à partir de segments CMAF partagés
- [ ] URL de manifeste signées et de courte durée ; contrôle des autorisations et de la région
- [ ] CDN à plusieurs niveaux avec regroupement des requêtes et bouclier d'origine
- [ ] Métriques du lecteur : temps de démarrage, taux de remise en mémoire tampon, débit moyen, changements de qualité
- [ ] Tableaux de bord de coût : sortie par niveau, heures d'encodage par rendu, stockage par ancienneté

---

## Ce qui reste

Chaque vidéo de ces plateformes existe en dizaines de copies, de tailles et de qualités différentes, réparties sur des milliers de machines, la plupart dans des bâtiments qui appartiennent au fournisseur d'accès de quelqu'un d'autre.

Le spectateur ne voit rien de tout cela. Il voit une vidéo qui démarre, et un badge de qualité qui passe de 1080p à 720p quand le train entre dans un tunnel, puis revient à la sortie. Ce clignotement, c'est tout le système qui fonctionne.

---

## Sources

* [Blog officiel de YouTube : statistiques de la plateforme (heures mises en ligne par minute)](https://blog.youtube/press/)
* [Netflix Tech Blog : Per-Title Encode Optimization](https://netflixtechblog.com/per-title-encode-optimization-7e99442b62a2)
* [Présentation de Netflix Open Connect](https://openconnect.netflix.com/en/)
* [Ranganathan et al., « Warehouse-Scale Video Acceleration: Co-design and Deployment in the Wild » (ASPLOS 2021)](https://dl.acm.org/doi/10.1145/3445814.3446723)
* [RFC 8216 : HTTP Live Streaming](https://www.rfc-editor.org/rfc/rfc8216)
* [Alliance for Open Media : AV1](https://aomedia.org/av1-features/)
* Dans la même série : [Concevoir Google Drive](/blog/fr/design-google-drive), [Passer de zéro à des millions d'utilisateurs](/blog/fr/design-scale-zero-to-millions), [Estimations au dos de l'enveloppe](/blog/fr/design-back-of-envelope-estimation)
