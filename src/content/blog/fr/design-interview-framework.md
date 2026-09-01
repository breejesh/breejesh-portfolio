---
title: "Un cadre pratique pour les entretiens de system design"
description: "Une checklist pour candidats stressés en entretien de system design: d'abord les questions, puis le plan des boîtes, ensuite le détail. Étapes en langage simple, dialogue d'exemple et budget temps réutilisable de 45-60 minutes."
date: "2026-01-22"
tags: [Design Système et Architecture]
coverImage: /assets/images/design-interview-framework.webp
previewImage: /assets/images/design-interview-framework.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Une checklist pour candidats stressés en entretien de system design: d'abord les questions, puis le plan des boîtes, ensuite le détail. Étapes en langage simple, dialogue d'exemple et budget temps réutilisable de 45-60 minutes.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Personne n'attend que vous reconstruisiez Google Search en 45 minutes. L'interviewer ne cherche pas un diagramme parfait. Il veut voir comment vous transformez un énoncé flou en problème clair, comment vous planifiez avant de peaufiner les détails, et si vous le traitez comme un coéquipier.

Si cela fait encore peur, prenez une image que vous connaissez déjà.

**Visite chez le médecin:** le médecin demande ce qui fait mal, depuis quand, et ce que vous avez déjà essayé. Ensuite seulement viennent les examens ou l'ordonnance. Sauter droit à la chirurgie sans questions, c'est de la faute professionnelle.

**Rénovation de maison:** un bon artisan mesure la pièce, demande combien de personnes y vivent et regarde le budget avant de choisir le carrelage. Dessiner une cuisine de luxe à la minute une, puis découvrir qu'il n'y a pas de plomberie pour l'évier, fait perdre le temps de tout le monde.

Un **entretien de system design** fonctionne pareil. "System design" veut simplement dire: planifier comment les pièces d'un produit se parlent pour encaisser de vrais utilisateurs. D'abord les questions. Ensuite la grande forme. Ensuite le détail dur. Ce billet est ce processus écrit pour qu'un candidat nerveux puisse le suivre étape par étape.

---

## Ce que la salle note vraiment

Voyez-le comme une courte réunion de travail sur un problème ouvert, pas comme un quiz avec un seul tableau correct.

| Signal | À quoi ça ressemble en langage simple |
| --- | --- |
| Gérer le flou | Vous posez des questions bornées avant de dessiner |
| Collaborer | Vous dites vos hypothèses à voix haute et changez de cap si on vous corrige |
| Choisir ce qui compte | Vous passez du temps sur le chemin critique, pas sur chaque feature optionnelle |
| Parler des trade-offs | Vous nommez coût, vitesse, sûreté et la difficulté d'exploiter le système |
| Éviter les drapeaux rouges | Pas de monologue silencieux, pas de "système parfait", pas de microservices à la minute une |

**Trade-off** signifie un choix où vous gagnez une chose et en perdez une autre. Exemple: copier les données sur beaucoup de machines peut accélérer les lectures, mais ces copies ne se mettent pas forcément à jour au même instant.

Drapeaux rouges remarqués vite:

- Dessiner dix boîtes avant de savoir pour qui est le produit
- Peaufiner un micro-détail alors que le parcours principal utilisateur est encore vide
- Refuser des ordres de grandeur quand la taille changerait le plan
- Déclarer le design "terminé" sans parler de ce qui casse

---

## Horloge souple pour une boucle de 45 minutes

C'est un guide, pas une loi. Si l'interviewer veut rester haut niveau, restez haut niveau. S'il vous tire dans un coin difficile, ce coin est le job du jour.

| Phase | Minutes | Objectif |
| --- | --- | --- |
| 1. Clarifier et figer le scope | 3-10 | Features, utilisateurs, contraintes, ce que vous ne construirez pas |
| 2. Taille approximative (si utile) | 2-5 | Ordre de grandeur de charge et de stockage |
| 3. Plan haut niveau et accord | 10-15 | Grosses boîtes, flux principaux, accords simples |
| 4. Détail sur les parties dures | 10-25 | Forme des données, vitesse, pannes, le vrai goulot |
| 5. Clôture | 3-5 | Risques, monitoring, ce qui casse à 10x, questions ouvertes |

**Haut niveau** signifie la carte des grandes pièces (client, serveurs, base de données, cache), pas chaque ligne de code. **Goulot** signifie le premier endroit qui s'étouffe quand le trafic croît.

---

## Étape 1: Clarifier les requirements (les questions du médecin)

Ne soyez pas le candidat qui crache une architecture complète avant de savoir qui utilise le produit. Ralentissez. Quand l'interviewer dit "à vous de décider", écrivez vos hypothèses là où vous deux pouvez les voir.

### Questions produit (commencez ici)

1. Que doit marcher en version un? Que peut attendre?
2. Qui l'utilise: app grand public, outil interne, ou API publique?
3. Plus de lectures, plus d'écritures, ou mixte? (Une **lecture** charge des données. Une **écriture** crée ou modifie des données.)
4. Les mises à jour doivent-elles apparaître tout de suite, ou un petit délai est OK?
5. Mobile, web, ou les deux? Login requis?
6. Texte seulement, ou aussi images et vidéo?
7. Une région pour l'entretien, ou mondial dès le jour un?

### Questions qualité et échelle

1. Environ combien d'utilisateurs actifs par jour, et à quelle vitesse ça croît?
2. Charge moyenne vs pic d'heure de pointe?
3. Quelle rapidité doit avoir l'action principale (un objectif approximatif suffit)?
4. Quand vitesse et cohérence parfaite s'opposent, laquelle gagne pour ce produit?
5. Combien de temps on garde les données? Règles de vie privée (style supprimer mon compte)?
6. Doit-on réutiliser des outils déjà en place (base courante, cache, file de messages)?

**API** désigne l'ensemble des requêtes que le client envoie au backend (par exemple: créer un post, lister un feed). **Cache** désigne un stockage temporaire rapide pour ne pas frapper la base à chaque requête. **File (queue)** désigne une file d'attente pour un travail qui peut se faire un instant plus tard (envoyer un email, redimensionner une image).

### Discipline de scope

Dites à voix haute ce que vous **ne** concevrez **pas** aujourd'hui. Un ranking machine learning complet pour un feed, des bases multi-écrivains mondiales, ou un long cours de théorie brûlent souvent du temps sans signal. Nommez-les, garez-les, avancez, sauf si l'interviewer les rouvre.

### Mini exemple: "Concevez un news feed"

- App: mobile et web
- Version un: publier un post, lire les posts d'amis en ordre chronologique inverse
- Algorithmes de ranking: plus tard, sauf s'ils demandent
- Amis par utilisateur: environ 5 000
- Trafic: environ 10 millions d'utilisateurs actifs par jour
- Média: images et courte vidéo autorisés

Cette conversation seule empêche de construire le mauvais produit.

---

## Étape 2: Capacité approximative (taille au dos d'une enveloppe)

Vous n'avez pas besoin de maths parfaites. Vous avez besoin d'ordres de grandeur crédibles pour que le design ne soit pas un jouet.

**QPS** signifie requêtes par seconde: combien de requêtes frappent le système chaque seconde. **Ordre de grandeur** signifie "environ 100, pas environ 100 000", pas une feuille Excel financière.

Gardez ces outils grossiers en tête:

| Quantité | Règle pratique |
| --- | --- |
| Secondes dans une journée | environ 100 000 (assez pour l'entretien) |
| Requêtes par jour vers QPS moyen | diviser par environ 100 000; le pic est souvent 2x-5x la moyenne |
| Stockage | nombre d'items × taille moyenne, plus de la marge pour copies et index |
| Bande passante | QPS × taille d'une réponse typique |

Dites la forme à voix haute:

```
10M utilisateurs actifs par jour
Supposez 5 lectures de feed par utilisateur et par jour → 50M lectures / jour
50 millions / 100 000 ≈ 500 QPS moyens en lecture
Pic peut-être 2 000-3 000 QPS en lecture (choisissez un facteur et tenez-vous-y)

Supposez 1 post par utilisateur et par jour → 10M écritures / jour ≈ 100 QPS moyens en écriture
```

Si les chiffres changent le plan (une seule base ne suffit plus, un cache devient obligatoire, la vidéo a besoin d'un object store), dites-le. S'ils ne changent rien, gardez les maths courtes et avancez. Demandez s'ils veulent les chiffres avant d'y passer cinq minutes.

Pour une boîte à outils plus complète, voir [estimation back-of-the-envelope](/blog/fr/design-back-of-envelope-estimation).

---

## Étape 3: Design haut niveau et accord (le plan de rénovation)

Dessinez des boîtes. Parcourez un chemin heureux de bout en bout. Traitez l'interviewer comme un co-concepteur: marquez une pause pour feedback avant d'inventer six services séparés.

### Blocs habituels (ce que signifient les boîtes)

| Pièce | Pourquoi elle apparaît |
| --- | --- |
| Client (web ou mobile) | Là où l'utilisateur tape ou touche |
| Load balancer / API gateway | Porte d'entrée: répartit le trafic, souvent login et limites |
| Services app / API | Les règles métier vivent ici |
| Base principale | Source de vérité des données durables |
| Cache | Lectures chaudes sans marteler la base |
| CDN / object store | Fichiers statiques et média (photos, vidéo) près de l'utilisateur |
| File / stream | Travail async: fan-out, emails, miniatures |
| Index de recherche | Motifs de requête que la base principale déteste |
| Workers | Jobs en arrière-plan qui traitent la file |

**Load balancer** répartit les requêtes entre serveurs sains. **CDN** est un réseau de caches en bordure qui sert le contenu statique près de l'utilisateur. **Async** signifie "fais-le bientôt, pas forcément dans cette même requête".

### Comment le présenter

1. Esquissez clients → porte → services → stocks de données.
2. Tracez les deux ou trois cas d'usage critiques (créer, chemin de lecture principal, peut-être supprimer).
3. Dites si les lectures ou les écritures dominent.
4. Proposez des APIs seulement si le problème est assez petit (raccourcisseur d'URL, rate limiter). Pour "concevez Google Search", restez plus grossier.
5. Demandez: "Est-ce que ça colle à l'échelle et aux features qu'on a fixées?" Corrigez avant le détail.

### Forme du news feed (haut niveau seulement)

- **Chemin publier:** client → API → sauver les métadonnées du post → job qui met à jour les feeds d'amis (ou les marque sales).
- **Chemin lire:** client → API → charger un feed préparé (ou l'assembler à la lecture) → hydrater le contenu des posts depuis cache ou base → renvoyer une page.

Deux flux gardent le tableau honnête. Une boîte géante "Feed Service" non.

---

## Étape 4: Détail sur les parties qui rapportent du signal

Vous partagez déjà objectifs, esquisse haut niveau et feedback de l'interviewer. Choisissez maintenant les arêtes vives.

### Bons cibles selon le type de problème

| Problème | Vaut le coup d'approfondir | Pièges à temps facile |
| --- | --- | --- |
| Raccourcisseur d'URL | Fabrication des IDs, codes courts, type de redirect, clés de cache | UI fancy d'aperçu de lien |
| Rate limiter | Choix d'algorithme, vie des clés dans Redis, équité multi-serveur | Maths globales parfaites sur chaque cas limite |
| Chat | Garanties de livraison, présence en ligne, ordre des messages | Design produit complet de chiffrement de bout en bout |
| News feed | Push vs pull pour les posts d'amis, signaux de ranking, pipeline média | Recréer un modèle de ranking social complet |
| Drive / stockage | Morceaux de fichier, cohérence d'upload, conflit si deux appareils éditent | Client web pixel-perfect |

### Checklist de détail (choisissez 2-4)

1. **Modèle de données:** entités principales, clés, index, comment découper les données entre machines si besoin.
2. **Contrats d'API:** retries sûrs (**idempotence** signifie qu'une requête répétée ne crée pas en double), pagination, erreurs claires sur le chemin chaud.
3. **Cohérence:** forte là où il y a de l'argent ou du login; éventuelle OK là où feeds et compteurs peuvent retarder un instant.
4. **Cache:** quoi est mis en cache, durée de vie, invalidation, comment éviter une ruée quand il se vide.
5. **Chemins async:** files, retries, dead letters (jobs ratés qui demandent un traitement spécial), langage honnête de livraison "au moins une fois".
6. **Goulots:** QPS le plus chaud, plus gros objets, limites d'un seul leader.
7. **Modes de panne:** mort d'un serveur, partition réseau, cache vide, file qui s'accumule.
8. **Sécurité (bref sauf demande):** login, limites d'abus, frontières des données privées.

Règle de temps: si un détail ne change ni la correction ni l'échelle pour ce prompt, garez-le. Dites qu'il existe, proposez d'aller plus loin, attendez un signe d'accord.

---

## Étape 5: Clôturer sans déclarer la perfection

Ne terminez jamais par "et voilà le design complet". Laissez de la place à la critique.

1. **Récapitulez** l'architecture en environ 30 secondes (surtout si vous avez exploré des alternatives).
2. **Ce qui casse en premier à 10x de trafic**, et ce que vous changeriez.
3. **Opérations:** métriques (latence, taux d'erreur, profondeur de file, hit rate cache), logs, alertes, déploiement prudent (feature flags, petits canaris).
4. **Playbook de panne:** bascule de la base principale, mode lecture seule, messages empoisonnés dans une file.
5. **Ouverts** si vous aviez encore une heure: multi-région, meilleur ranking, réduction de coût, jobs de suppression pour la vie privée.

Les interviewers se souviennent des candidats qui peuvent critiquer leur propre design sans le faire s'écrouler.

---

## Dialogue d'exemple (langage simple)

**Interviewer:** Concevez un news feed.

**Vous:** Avant les boîtes, je veux le scope. Mobile seul ou les deux? Ranking en version un, ou l'ordre chrono inverse suffit?

**Interviewer:** Les deux clients. Chrono inverse pour la v1, ça va.

**Vous:** Je suppose environ 10 millions d'utilisateurs actifs par jour, environ 5 000 amis par utilisateur, et des posts avec images. Corrigez-moi si c'est faux.

**Interviewer:** Ça marche.

**Vous:** Taille approximative: si chaque utilisateur lit le feed cinq fois par jour, on est autour de 500 QPS moyens en lecture, peut-être quelques milliers au pic. Les écritures sont bien plus basses si on poste une fois par jour. Ça oriente un design lourd en lecture avec un cache sur le chemin chaud.

**Interviewer:** OK.

**Vous:** Haut niveau: le chemin publier écrit le post, puis un job d'arrière-plan aide à construire les feeds d'amis. Le chemin lire charge une page de feed préparée et remplit les corps depuis cache ou base. Est-ce que ça colle à ce qu'on a fixé?

**Interviewer:** Oui. Comment gérez-vous les célébrités avec des millions d'abonnés?

**Vous:** C'est le coin dur. Pour les utilisateurs normaux je peux pousser des entrées de feed à l'écriture. Pour les très gros comptes je tire à la lecture pour qu'un post n'explose pas en millions d'écritures. Trade-off: les feeds célébrité coûtent plus de travail à la lecture.

**Interviewer:** Qu'est-ce qui casse en premier à 10x?

**Vous:** Le cache de feed et les workers de fan-out. Je découperais le stockage de feed, j'ajouterais de la backpressure sur la file, et je surveillerais profondeur de file et hit rate cache. Avec plus de temps, multi-région et ranking plus fort.

Cette conversation, c'est le cadre. Vous n'aviez pas besoin d'un diagramme parfait pour sonner comme un ingénieur calme.

---

## Liste à faire / à éviter

**À faire**

- Posez des questions de clarification tôt et souvent.
- Écrivez les hypothèses là où vous deux les voyez.
- Commencez haut niveau; ajoutez du détail seulement après accord.
- Concevez d'abord le chemin critique.
- Proposez deux options quand un vrai trade-off existe (par exemple push vs pull de fan-out).
- Pensez à voix haute. Le silence est dur à noter.
- Demandez un indice si vous bloquez. Collaborer bat la fierté figée.
- Continuez jusqu'à ce que l'interviewer clôture.

**À éviter**

- Sprinter vers une solution avec des requirements non définis.
- Transformer un petit produit en système multi-écrivain mondial le jour un.
- Enfoncer 15 minutes dans une micro-optimisation alors que le modèle de données est vide.
- Ignorer des chiffres de taille qui contredisent votre diagramme.
- Faire semblant que le design n'a pas de modes de panne.
- Contredire une guidance claire de l'interviewer.

---

## Checklist d'entretien réutilisable

Copiez-la dans vos notes. Parcourez-la de haut en bas quand vous êtes nerveux.

```
[ ] Reformuler le problème en une phrase
[ ] Features version un seulement
[ ] Cibles non fonctionnelles (utilisateurs, QPS, latence, cohérence)
[ ] Liste explicite hors scope
[ ] Hypothèses écrites et confirmées
[ ] Capacité approximative (QPS, stockage, bande passante) si ça change le design
[ ] Diagramme haut niveau: clients, porte, services, données, async
[ ] Tracer les chemins heureux des cas d'usage principaux
[ ] API ou schéma seulement si la taille du problème le justifie
[ ] Obtenir un accord explicite avant le détail
[ ] Détail 1: modèle de données / IDs / stockage
[ ] Détail 2: perf du chemin chaud (cache, fan-out, sharding)
[ ] Détail 3: cohérence, pannes ou ops (choisir ce qui compte pour eux)
[ ] Nommer goulots et changements à 10x
[ ] Monitoring, déploiement, risques connus
[ ] Recap + inviter le feedback
```

---

## Expliquez-le à un ami

Un entretien de system design n'est pas "dessine tous les serveurs de l'entreprise". C'est une courte réunion de planification avec un minuteur.

1. **Demandez d'abord**, comme un médecin: qui l'utilise, que doit faire la version un, quelle taille, ce que vous sautez.
2. **Mesurez grossièrement** pour savoir si une base est un jouet ou un vrai risque.
3. **Dessinez le plan de rénovation**: quelques grosses boîtes et les parcours principaux utilisateur. Obtenez un oui.
4. **Zoomez sur les coins durs** qui intéressent l'interviewer: données, vitesse, pannes.
5. **Fermez avec honnêteté**: ce qui casse en premier, comment vous le surveilleriez, ce que vous feriez avec plus de temps.

Entraînez ce squelette sur trois problèmes différents (stockage, chat temps réel, feed lourd en lecture) jusqu'à ce que les transitions deviennent automatiques. Le but n'est pas un joli diagramme. Le but est une conversation de design qui ne vous ferait pas honte avec un ingénieur senior dès la première semaine.

Si vous voulez le chemin de croissance complet avant d'autres prompts d'entretien, commencez par [passer de zéro à des millions](/blog/fr/design-scale-zero-to-millions). Pour un ordre de pratique de cette série, voir le [parcours d'apprentissage](/blog/fr/design-interview-learning-path).

