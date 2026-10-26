---
title: "Un cadre pratique pour les entretiens de conception de systèmes : ce qui est noté et comment répartir 45 minutes"
description: "Un plan reproductible pour les entretiens de conception de systèmes : ce que les recruteurs notent vraiment, un budget minute par minute, les questions de clarification qui comptent, comment présenter une conception de haut niveau et obtenir l'adhésion, où approfondir selon le type de problème, un exemple de dialogue et les habitudes qui font échouer des candidats par ailleurs solides."
date: "2026-01-22"
tags: [Design Système et Architecture]
coverImage: /assets/images/design-interview-framework.webp
previewImage: /assets/images/design-interview-framework.webp
---

> **TL;DR**
> * **Le problème :** Les entretiens de conception de systèmes sont ouverts à dessein. Des ingénieurs solides les ratent non par manque de connaissances mais par manque de structure : ils plongent dans les détails, conçoivent pour des exigences que personne n'a formulées et manquent de temps avant d'avoir montré leur profondeur.
> * **Le cadre :** Clarifier (5 minutes), estimer (5), conception de haut niveau avec adhésion (15), approfondissements sur deux ou trois parties difficiles (15), conclusion avec compromis et prochaines étapes (5). Présentez vos décisions comme des compromis, pas comme des faits.
> * **Le résultat :** Une conversation que le recruteur peut noter sur tous les axes qui l'intéressent : gestion de l'ambiguïté, conception cohérente, profondeur technique et communication, avec du temps pour approfondir là où cela compte.

Il n'existe pas de bonne réponse à « concevez Twitter » en 45 minutes. Les recruteurs le savent. Ce qu'ils notent, c'est la manière dont vous passez d'un énoncé ambigu à une conception raisonnable, et votre façon de raisonner quand ils vous poussent dans vos retranchements.

Cet article présente la structure que j'utilise et que je recommande. Ce n'est pas un script. C'est un budget pour votre attention.

---

## Ce que le recruteur note vraiment

Les grilles varient selon les entreprises, mais elles se regroupent en quatre domaines :

| Domaine | À quoi ressemble un bon candidat |
| --- | --- |
| Navigation du problème | Pose les questions qui changent la conception ; délimite le problème délibérément ; énonce ses hypothèses |
| Conception de la solution | Produit une conception cohérente de bout en bout où chaque composant a une raison d'exister |
| Profondeur technique | Approfondit les parties les plus difficiles : modèle de données, cohérence, goulots d'étranglement, modes de défaillance |
| Communication | Réfléchit à voix haute, vérifie auprès du recruteur, saisit les indices, explique les compromis simplement |

Remarquez ce qui manque : les architectures apprises par cœur, les mots à la mode et la « bonne » base de données. Un candidat qui choisit l'option inhabituelle et explique clairement le compromis obtient une meilleure note que celui qui choisit l'option attendue sans savoir dire pourquoi.

---

## Le budget de 45 minutes

![Chronologie de l'entretien : clarifier pendant les cinq premières minutes, estimer de cinq à dix, conception de haut niveau de dix à vingt-cinq, approfondissements de vingt-cinq à quarante et conclusion dans les cinq dernières, avec le rappel que la plupart des entretiens ratés sautent la clarification et passent quarante minutes à approfondir](/assets/images/hld/design-interview-timeline.webp)

La note rouge décrit l'échec le plus courant : plonger directement dans les entrailles d'un composant sans jamais établir à quoi sert le système.

---

## Étape 1 : clarifier (0 à 5 minutes)

Votre objectif est une liste courte et explicite d'exigences sur lesquelles le recruteur et vous êtes d'accord.

**Questions fonctionnelles (que doit faire le système ?)**

* Qui sont les utilisateurs, et quelles sont les deux ou trois actions principales ?
* Quelles fonctionnalités sont dans le périmètre aujourd'hui, et lesquelles peut-on explicitement écarter ?
* Des cas particuliers qui changent la conception (comptes privés, modifications, suppressions, médias) ?

**Questions non fonctionnelles (à quel niveau de qualité ?)**

* Combien d'utilisateurs, et quelle activité ? Le trafic est-il mondial ou régional ?
* Quelle latence compte, et pour quelle opération ?
* Est-il acceptable d'afficher des données légèrement périmées ? Peut-on perdre une écriture ?
* Charge dominée par les lectures ou par les écritures ?

Écrivez ensuite la liste là où vous la voyez tous les deux. Exemple pour « concevez un fil d'actualité » : publier du texte et des images, suivre des utilisateurs, voir un fil d'accueil des comptes suivis, du plus récent au plus ancien ; 300 M d'utilisateurs actifs par jour ; fil chargé en moins de 200 ms ; quelques secondes de délai avant qu'une publication apparaisse, c'est acceptable. Hors périmètre : publicité, messagerie, recherche.

Cette liste est votre contrat pour les 40 minutes suivantes.

---

## Étape 2 : estimer (5 à 10 minutes)

Faites juste assez de calculs pour trouver la partie difficile : QPS en lecture et en écriture, croissance du stockage et toute bande passante susceptible de dominer. L'[article sur les estimations](/blog/fr/design-back-of-envelope-estimation) de cette série donne les recettes.

Énoncez la conclusion, pas seulement les chiffres : « Les lectures dépassent les écritures d'environ 100 contre 1, et la diffusion multiplie les écritures par le nombre d'abonnés, donc le stockage des fils et la diffusion sont la partie difficile. »

Certains recruteurs vous diront de sauter l'estimation. Faites-la quand même en une phrase ; la conclusion oriente toujours votre conception.

---

## Étape 3 : conception de haut niveau et adhésion (10 à 25 minutes)

Dessinez le flux de bout en bout de chaque action principale avant d'entrer dans le détail.

1. **D'abord les API.** Deux ou trois points d'accès avec leurs paramètres clés : `POST /posts`, `GET /feed?cursor=`. Ils obligent à clarifier ce que fait chaque requête.
2. **Le modèle de données.** Les entités principales, leurs clés et leur partitionnement. C'est là que beaucoup de conceptions réussissent ou échouent en silence.
3. **Des boîtes et des flèches.** Clients, périphérie (répartiteur de charge, CDN), services, stockages, files de messages. Suivez une requête à travers chaque action principale.
4. **Vérifiez.** « Est-ce que cela couvre ce que vous attendez, ou faut-il ajuster avant d'aller plus loin ? » C'est le moment de l'adhésion, et il vous vaut souvent un indice sur l'endroit où le recruteur veut de la profondeur.

**Les briques courantes et quand elles méritent leur place :**

| Brique | Ajoutez-la quand |
| --- | --- |
| Répartiteur de charge | Il y a plus d'une instance de quoi que ce soit |
| Cache | L'accès est dominé par les lectures sur des données qui tolèrent un peu de retard |
| Réplicas de lecture | La charge de lecture dépasse une base de données |
| File de messages | Le travail peut se faire après la réponse, ou doit être relancé |
| CDN | Du contenu statique ou multimédia est servi à beaucoup d'utilisateurs |
| Partitionnement | Les données ou les écritures dépassent une base de données après les options moins chères |
| Stockage objet | Il y a de gros fichiers : images, vidéos, documents, sauvegardes |

Chaque boîte doit répondre à la question « qu'est-ce qui casse si je l'enlève ? ». Si vous ne savez pas répondre, enlevez-la.

---

## Étape 4 : approfondir (25 à 40 minutes)

Choisissez deux ou trois parties vraiment difficiles pour ce problème, ou suivez le recruteur. De bonnes cibles selon le type de problème :

| Type de problème | Où se trouve la profondeur |
| --- | --- |
| Fils et timelines | Diffusion à l'écriture ou à la lecture, le problème des célébrités, classement, pagination |
| Messagerie et temps réel | Gestion des connexions, ordre, garanties de livraison, présence |
| Systèmes de stockage | Partitionnement, réplication, cohérence, résolution des conflits |
| Raccourcisseur d'URL, générateur d'identifiants | Génération des clés, collisions, clés chaudes, cache |
| Limiteur de débit | Choix de l'algorithme, atomicité, compteurs distribués, échec ouvert ou fermé |
| Plateformes multimédias | Chaîne d'envoi, transcodage, CDN, coût |
| Recherche et autocomplétion | Chaîne d'indexation, classement, budget de latence |

Pour chaque approfondissement, couvrez : l'approche naïve et pourquoi elle échoue, la meilleure approche, ce qu'elle coûte et comment elle échoue. Cette structure en quatre temps démontre la profondeur plus sûrement que n'importe quelle quantité de jargon.

---

## Étape 5 : conclure (40 à 45 minutes)

Ne déclarez pas la conception parfaite. Résumez-la en deux phrases, puis nommez :

* Le goulot d'étranglement actuel et ce que vous feriez quand il saturera.
* Le principal compromis que vous avez fait et quand vous le reverriez.
* Ce que vous surveilleriez en production.

Cela montre le jugement que les recruteurs attendent des profils seniors : vous savez ce que vous avez construit, ce que cela coûte et où cela cassera en premier.

---

## Un court exemple de dialogue

> **Recruteur :** Concevez un raccourcisseur d'URL.
>
> **Candidat :** Avant de dessiner quoi que ce soit, quelques questions. Faut-il des alias personnalisés et une expiration, ou seulement des codes aléatoires ? Faut-il des statistiques de clics ? Combien de liens par mois environ, et quel rapport entre lectures et écritures dois-je supposer ?
>
> **Recruteur :** Alias personnalisés oui, statistiques approximatives, 100 millions de liens par mois, surtout des lectures.
>
> **Candidat :** Alors je traite les redirections comme le chemin critique et les statistiques comme un effort au mieux. 100 millions par mois, c'est environ 40 écritures par seconde, et avec 100 lectures par écriture, environ 4 000 redirections par seconde en moyenne. Les parties difficiles sont la génération des codes et la rapidité des redirections, donc je vais les concevoir avec soin et garder les statistiques hors du chemin de redirection. Voici les deux API...

Remarquez que le candidat n'a jamais prétendu détenir la « bonne » réponse. Il a transformé l'énoncé en exigences, nommé la partie difficile et gagné le droit de la concevoir.

---

## À faire et à éviter

| À faire | À éviter |
| --- | --- |
| Écrire les exigences et y revenir | Dessiner des boîtes dès la première minute |
| Dire « je suppose X ; dites-moi si c'est faux » | Supposer en silence et espérer |
| Présenter chaque choix comme un compromis | Présenter des technologies comme évidentes |
| Suivre une requête de bout en bout | Décrire les composants isolément |
| Vérifier à la fin de la conception de haut niveau | Faire un monologue de 20 minutes |
| Admettre ce que vous ignorez et raisonner à partir des principes | Bluffer sur les entrailles d'une technologie |
| Nommer les modes de défaillance avant qu'on vous les demande | Supposer que tout se passe bien |

---

## Liste de contrôle réutilisable

- [ ] Exigences fonctionnelles listées et validées ; hors périmètre énoncé
- [ ] Exigences non fonctionnelles : échelle, latence, cohérence, disponibilité
- [ ] Estimations avec une conclusion explicite sur la partie difficile
- [ ] API et modèle de données principal
- [ ] Flux de bout en bout pour chaque action principale
- [ ] Vérification de l'adhésion avant les approfondissements
- [ ] Deux ou trois approfondissements : approche naïve, meilleure approche, coût, défaillance
- [ ] Conclusion : goulot d'étranglement, compromis principal, quoi surveiller

---

## Ce qui reste

Les candidats dont je me souviens ne sont pas ceux qui avaient les conceptions les plus astucieuses. Ce sont ceux qui ont posé au début une question à laquelle je n'avais pas pensé, puis construit tout le reste de leur réponse autour.

C'est aussi le métier. L'essentiel du vrai travail de conception consiste à comprendre à quoi sert le système. Les boîtes viennent après, et ce sont généralement la partie facile.

---

## Sources

* [Alex Xu, « System Design Interview: An Insider's Guide »](https://www.amazon.com/System-Design-Interview-insiders-Second/dp/B08CMF2CQF)
* [Martin Kleppmann, « Designing Data-Intensive Applications »](https://dataintensive.net/)
* [Tech Interview Handbook : entretiens de conception de systèmes](https://www.techinterviewhandbook.org/system-design/)
* [Livre SRE de Google : Introduction (la fiabilité comme objectif de conception)](https://sre.google/sre-book/introduction/)
* Dans la même série : [Estimations au dos de l'enveloppe](/blog/fr/design-back-of-envelope-estimation), [Continuer à apprendre la conception de systèmes](/blog/fr/design-interview-learning-path), [Concevoir un fil d'actualité](/blog/fr/design-news-feed-system)
