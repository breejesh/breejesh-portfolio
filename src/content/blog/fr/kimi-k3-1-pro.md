---
title: "Kimi K3.1 Pro : à trois points de la frontière, à douze jours des poids ouverts"
description: "Kimi K3.1 Pro de Moonshot est le même modèle de 2 800 milliards de paramètres que K3, avec beaucoup plus d'apprentissage par renforcement. Il obtient 55 à l'Intelligence Index d'Artificial Analysis, trois points derrière Claude Opus 5.5, pour 2 / 10 dollars le million de tokens, avec des poids promis pour le 4 novembre. Voici ce que valent vraiment la baisse de prix, les benchmarks et le filtrage cyber."
date: "2026-10-23"
tags: [IA et Machine Learning]
coverImage: /assets/images/kimi-k3-1-pro.webp
previewImage: /assets/images/kimi-k3-1-pro.webp
---

> **TL;DR**
> * **Le déclencheur :** Moonshot AI a lancé Kimi K3.1 Pro et une variante plus rapide, K3.1 Pro Highspeed, le 23 octobre 2026. Le modèle est disponible dans les applications Kimi, Kimi Work, Kimi Code et l'API, à 2 / 10 dollars le million de tokens en entrée / sortie. Moonshot annonce la publication des poids complets d'ici le 4 novembre.
> * **Le mécanisme :** Pas de nouvelle architecture. K3.1 Pro, c'est K3, le modèle mixture-of-experts de 2 800 milliards de paramètres sorti en juillet, passé par beaucoup plus de post-entraînement : de l'apprentissage par renforcement à grande échelle sur des centaines de domaines de tâches. À l'Intelligence Index d'Artificial Analysis, il passe de 44 à 55, quatrième au classement général et à trois points de Claude Opus 5.5.
> * **La perspective :** Le prix par token a baissé d'un tiers, mais le coût par tâche a à peine bougé parce que le modèle écrit davantage. La vraie nouvelle, c'est le calendrier. Si les poids sortent comme promis, l'écart entre le meilleur modèle ouvert et le meilleur modèle fermé tombe à trois points d'indice.

En juillet, j'écrivais que [Kimi K3 était un modèle ouvert solide, pas un tueur de Fable 5](/blog/fr/kimi-k3-benchmarks). Trois mois plus tard, Moonshot revient avec un modèle plus proche de la frontière, moins cher par token, et toujours pas tout à fait au sommet.

Ce qui est intéressant, c'est la manière d'y arriver. Moonshot n'a pas entraîné un modèle plus gros. Il a dépensé plus de calcul pour mieux former le même.

---

## Ce qui a été lancé

| Élément | Kimi K3 (juillet) | Kimi K3.1 Pro | K3.1 Pro Highspeed |
| --- | --- | --- | --- |
| Paramètres totaux / actifs | MoE de 2 800 milliards | Mêmes dimensions que K3 ; environ 104 milliards actifs selon la presse | Même modèle, service plus rapide |
| Fenêtre de contexte | 1 million de tokens | 1 million de tokens | 1 million de tokens |
| Modalités en entrée | Texte, image | Texte, image | Texte, image |
| Prix entrée / sortie (par million de tokens) | 3 / 15 $ | 2 / 10 $ | 4 / 20 $ |
| Entrée en cache (par million de tokens) | 0,30 $ | 0,20 $ | 0,20 $ |
| Vitesse | n/d | Référence | 2 à 3 fois plus rapide, selon Moonshot |
| Identifiant API | `kimi-k3` | `kimi-k3.1-pro` | `kimi-k3.1-pro-highspeed` |
| Poids | Publiés | Promis d'ici le 4 novembre | Les mêmes poids |

Moonshot décrit K3.1 Pro comme « une version post-entraînée de Kimi K3, avec un calcul de post-entraînement nettement plus important ». Le mérite revient à l'infrastructure, pas à l'architecture : son framework d'apprentissage par renforcement, l'inférence en contexte long, les environnements sandbox, l'ordonnancement des rollouts et le contrôle qualité des environnements.

Quelques détails pratiques comptent plus que le titre. L'API utilise par défaut l'effort de raisonnement maximal et fixe la température à 1,0. Le Zero Data Retention est proposé aux clients de l'API. Les entrées hébergées partent vers des serveurs que la politique de confidentialité de Moonshot situe à Singapour. L'accès entreprise est désactivé par défaut : un administrateur doit l'activer.

---

## Le même modèle, mieux formé

C'est le schéma de l'année. Pré-entraîner un modèle de base à l'échelle de la frontière coûte extrêmement cher et prend des mois. Le post-entraînement (apprentissage par renforcement sur des tâches au résultat vérifiable, comme passer des tests, résoudre des problèmes en terminal ou remplir correctement un tableur) coûte moins cher par point gagné et se répète beaucoup plus vite.

K3.1 Pro est l'exemple le plus net à ce jour de tout ce qu'il restait à tirer d'un modèle de base. Les chiffres internes de Moonshot montrent où est allé l'apprentissage par renforcement :

| Évaluation interne (Moonshot) | Kimi K3 | Kimi K3.1 Pro |
| --- | --- | --- |
| Kimi Code Bench 3.0, horizon long | 55,95 % | 61,2 % |
| Modélisation financière | 50,4 | 57,6 |
| Recherche financière | 58,8 | 70,4 |
| Opérations d'entreprise | 8,9 | 37,0 |
| Kimi Hallu Bench Hard, hallucination par affirmation (plus bas = mieux) | 23,4 % | 8,3 % |

Le bond sur les opérations d'entreprise, environ 4 fois, est typique d'un modèle entraîné sur une famille de tâches qu'il n'avait presque jamais vue. La baisse des hallucinations est celle que je voudrais voir vérifiée de manière indépendante, et elle l'est en partie : sur le test AA-Omniscience d'Artificial Analysis, le taux d'hallucination passe de 53 % à 44 %. C'est un vrai progrès, mais bien plus modeste que ce qu'affiche le benchmark interne de Moonshot.

---

## Les benchmarks, les indépendants d'abord

### Artificial Analysis

| Indicateur | Kimi K3 | Kimi K3.1 Pro | Pour comparer |
| --- | --- | --- | --- |
| Intelligence Index | 44 | **55** (4e au général) | Opus 5.5 : 58 ; Sonnet 5.5 et Muse Wonder Full : 56 |
| Terminal-Bench 4.0 | 13 % | 67 % | Sonnet 5.5 : 64 % |
| GDPval-AA (Elo) | 1 534 | 1 846 | Opus 5.5 : 1 866 ; Wonder Full : 1 857 |
| Humanity's Last Exam | 47 % | 52 % | Opus 5.5 : 61 % |
| CritPt | 23 % | 25 % | Opus 5.5 : 32 % |
| SciCode | 59 % | 61 % | |
| AutomationBench-AA | 58 % | 73 % | Opus 5.5 : 70 % |
| Cyber Index | 41 % | 64 % | Le plus élevé de tous les modèles disponibles en accès ouvert |

Le schéma est clair. Les plus gros gains portent sur les tâches agentiques et bureautiques : travail en terminal, automatisation et tâches à valeur économique. Les plus faibles portent sur le raisonnement scientifique difficile (CritPt, SciCode, Humanity's Last Exam), où Opus 5.5 garde une nette avance. L'apprentissage par renforcement sur des tâches vérifiables améliore ce sur quoi il s'entraîne. Il ne fait pas d'un modèle un meilleur physicien.

Un avertissement si vous comparez d'un article à l'autre. En juillet, Artificial Analysis donnait 57 à K3. Il l'affiche désormais à 44. Le modèle ne s'est pas dégradé. L'indice a été révisé, et les versions des benchmarks ont changé aussi : K3 obtenait 88,3 sur Terminal-Bench 2.1 et 13 % sur Terminal-Bench 4.0. Ne comparez que des chiffres issus de la même version du même classement.

### Le tableau de Moonshot

| Benchmark (déclaré par Moonshot, effort maximal) | K3.1 Pro | Claude Opus 5.5 | GPT-6 Astra | DeepSeek V4.1 Flash |
| --- | --- | --- | --- | --- |
| Terminal-Bench 4.0 | 65,7 | 66,4 | 58,2 | 42,3 |
| SWE Marathon v1.1 | 51,7 | 46,3 | 42,5 | 40,0 |
| DeepSWE v1.1 | 75,5 | 74,2 | 74,1 | 77,0 |
| HLE-Full (avec outils) | 70,0 | 67,7 | 57,2 | 58,8 |
| BrowseComp | 92,1 | 90,8 | 91,5 | n/d |
| OfficeQA Pro v2 | 64,4 | 62,2 | 54,4 | 40,4 |
| GPQA Diamond | 94,2 | 93,9 | 96,1 | 92,2 |
| BenchCAD (avec outils) | 92,7 | 96,2 | 95,9 | 81,6 |
| ExploitBench | 74,7 | 91,0 | 100 | n/d |

Deux choses ressortent. D'abord, le chiffre de Moonshot sur Terminal-Bench 4.0 (65,7) place K3.1 Pro légèrement *derrière* Opus 5.5, alors que le passage d'Artificial Analysis (67 %) le place légèrement devant. Compte tenu de l'influence du harnais de test, appelons ça une égalité. Ensuite, ces lignes proviennent de configurations d'évaluation différentes selon les modèles, pas d'une comparaison contrôlée unique. Prenez-les comme des indices sur le produit, pas comme un classement propre.

L'avance sur SWE Marathon, 51,7 contre 46,3 pour Opus, est le chiffre que Moonshot mettra le plus en avant. Le travail sur des projets de plusieurs heures est précisément ce qu'un apprentissage par renforcement intensif sur le code à horizon long devrait améliorer. Mais il est autodéclaré : j'attendrais le classement public avant de m'y fier.

---

## La baisse de prix qui n'en est presque pas une

La grille a baissé d'un tiers : de 3 / 15 à 2 / 10 dollars. K3.1 Pro se retrouve exactement au même prix catalogue que Claude Sonnet 5.5 et GPT-6 Sol, le [palier à 2 / 10 dollars sur lequel tout le monde a convergé](/blog/fr/frontier-model-price-convergence) ce mois-ci.

Regardez maintenant la facture par tâche :

| | Kimi K3 | Kimi K3.1 Pro | Variation |
| --- | --- | --- | --- |
| Prix entrée / sortie par million de tokens | 3 / 15 $ | 2 / 10 $ | -33 % |
| Tokens de sortie moyens par tâche de l'Intelligence Index | ~48 000 | ~55 000 | +14 % |
| Coût par tâche de l'Intelligence Index (rapport de lancement d'AA) | ~2,00 $ | ~1,98 $ | ~-1 % |

Le modèle est plus capable, et il écrit davantage pour y parvenir. Les tokens moins chers sont presque exactement compensés par les tokens supplémentaires. Artificial Analysis compte environ 150 millions de tokens de sortie pour faire tourner son indice complet sur K3.1 Pro, contre une médiane d'environ 81 millions pour les modèles comparables, et mesure sa vitesse de sortie parmi les plus lentes des modèles qu'il suit.

Cela ne le rend pas cher. À environ 2 dollars par tâche de l'indice, il coûte toujours à peu près un tiers de ce que coûte Opus 5.5 sur la même batterie. Mais le résumé honnête, c'est « le même prix pour un modèle bien meilleur », pas « une baisse de prix ». Et la variante Highspeed, à 4 / 20 dollars, coûte par token autant qu'Opus 5.5.

Le reste du marché, pour comparaison :

| Modèle | Entrée / sortie (par million de tokens) |
| --- | --- |
| Xiaomi MiMo-V2.6-Pro | 0,435 / 0,87 $ |
| DeepSeek V4.1 Flash 1017 (heures pleines) | 0,30 / 1,20 $ |
| Kimi K3.1 Pro | 2 / 10 $ |
| Claude Sonnet 5.5 / GPT-6 Sol | 2 / 10 $ |
| Kimi K3.1 Pro Highspeed | 4 / 20 $ |
| Claude Opus 5.5 / Meta Muse Wonder | 4 / 20 $ |
| GPT-6 Astra | 10 / 50 $ |

Moonshot ne se bat pas contre DeepSeek sur les prix. Il se positionne comme un modèle de travail occidental et parie que les poids ouverts et des scores proches d'Opus le justifient.

---

## La ligne cyber tracée par Moonshot

Le paragraphe le plus intéressant de l'annonce porte sur ce que Moonshot a retiré. L'entreprise dit avoir « identifié et supprimé les données liées à la cybersécurité des deux étapes d'entraînement » pour la version à poids ouverts, et énonce un principe : « nous visons à ne pas publier de poids ouverts qui repousseraient la frontière absolue des capacités cyber ».

Elle a publié le coût de ce choix sur son xdev-bench-hard interne (pass@3) :

| Checkpoint | xdev-bench-hard |
| --- | --- |
| K3.1 Pro avant réduction du risque cyber | 90,5 % |
| K3.1 Pro tel que publié | 81,0 % |
| DeepSeek V4.1 Flash | 85,7 % |
| GLM-5.3 | 57,1 % |
| Kimi K3 | 33,3 % |

Il est rare qu'un laboratoire publie un chiffre avant/après pour avoir volontairement bridé une capacité dans des poids ouverts. Cela suit la logique du [seuil cyber critique de GPT-6 Astra](/blog/fr/gpt-6-astra-critical-cyber-threshold) : une fois les poids publics, impossible de restreindre l'accès après coup, donc la restriction doit se faire pendant l'entraînement.

Il y a pourtant une tension. Même après filtrage, Artificial Analysis classe K3.1 Pro comme le modèle en accès ouvert le plus fort de son Cyber Index (64 %) et rapporte 95 % sur CyberGym-E2E-AA, sans aucun refus de sécurité lors de ses tests. Le modèle publié fait encore plus du double de K3 sur le propre benchmark d'exploits de Moonshot. Moonshot affirme que ses capacités cyber « restent en deçà de celles des modèles propriétaires de pointe », et c'est vrai. Mais en deçà de la frontière, c'est encore très au-delà de tout ce qui était téléchargeable librement il y a un an.

---

## Ce que valent vraiment 2 800 milliards de paramètres ouverts

À cette taille, « poids ouverts » ne veut pas dire que vous le ferez tourner sur votre portable. Pour K3, en juillet, Moonshot recommandait un supernœud de 64 accélérateurs ou plus pour l'auto-hébergement. K3.1 Pro a les mêmes dimensions : prévoyez la même échelle.

Ceux qui en profitent sont bien identifiés :

1. **Les fournisseurs d'inférence.** Quiconque dispose d'un gros cluster peut l'héberger et concurrencer l'API de Moonshot sur le prix et la vitesse. Attendez-vous à voir plusieurs hébergeurs sur OpenRouter quelques jours après la publication des poids.
2. **Les déploiements souverains et réglementés.** Les États, banques et hôpitaux qui ne peuvent pas envoyer de données à Singapour, ni à aucune API hébergée, obtiennent un modèle presque à la frontière qu'ils peuvent faire tourner sur leur propre matériel.
3. **Les adeptes du fine-tuning et les chercheurs.** Une base à 55 points à distiller, spécialiser ou étudier, aucune publication ouverte ne l'avait encore offerte.

Pour tous les autres, K3.1 Pro est une API hébergée qui se trouve avoir un checkpoint public. Cela compte quand même : cela plafonne ce que les laboratoires fermés peuvent facturer pour ce niveau de capacité.

---

## À surveiller avant le 4 novembre

1. **La licence.** Moonshot a parlé de « licence ouverte », sans plus. Kimi K2 était sorti sous une licence MIT modifiée qui n'ajoute qu'une obligation d'attribution pour les très grands déploiements commerciaux. Quoi que ce soit de plus strict ferait l'actualité.
2. **La correspondance entre les poids et l'API.** Le checkpoint filtré côté cyber est présenté comme le modèle publié. Vérifiez que les poids téléchargeables et `kimi-k3.1-pro` se comportent de la même manière lors de tests indépendants.
3. **Les résultats indépendants sur SWE Marathon et DeepSWE.** Ce sont les promesses en programmation qui justifient le prix. Les classements publics devraient les confirmer ou les dégonfler en quelques semaines.
4. **Les prix des hébergeurs tiers.** Si d'autres fournisseurs le servent bien en dessous de 2 / 10 dollars, la grille de Moonshot cesse d'être le prix de référence.

---

## Ce qui reste

La page recherche de Moonshot contient une phrase qui résume sa stratégie : « Notre recherche vise la conversion optimale de l'énergie en intelligence. »

K3.1 Pro montre ce que cela veut dire en pratique. Les mêmes paramètres, la même architecture, et onze points gagnés à l'indice par le seul post-entraînement. Si l'avance des laboratoires fermés repose désormais surtout sur le post-entraînement, et que le post-entraînement est la partie la moins chère à reproduire, un écart de trois points ne durera pas longtemps.

---

## Sources

* [Annonce de Kimi K3.1 Pro (Moonshot AI)](https://www.kimi.com/blog/kimi-k3-1-pro)
* [Kimi K3.1 Pro : analyse de l'intelligence, des performances et du prix (Artificial Analysis)](https://artificialanalysis.ai/models/kimi-k3-1-pro)
* [Moonshot's Kimi K3.1 Pro flirts with open weights leadership (VentureBeat)](https://venturebeat.com/technology/moonshots-kimi-k3-1-pro-flirts-with-open-weights-leadership-amid-paid-influencer-scandal-allegations)
* [Kimi K3.1 Pro: 1M Context, 3T Open Weights (Tech Insider)](https://tech-insider.org/kimi-k3-1-pro-moonshot-ai-1m-context-open-weight-2026/)
* [Kimi continues to challenge the frontier with K3.1 Pro (The Rundown AI)](https://www.therundown.ai/articles/kimi-continues-to-challenge-the-frontier-with-k3-1-pro)
* À lire aussi : [Kimi K3 au-delà du battage](/blog/fr/kimi-k3-benchmarks), [la convergence des prix à 2 / 10 dollars](/blog/fr/frontier-model-price-convergence) et [les hausses de prix de DeepSeek](/blog/fr/deepseek-price-hikes-china-ai-repricing)
