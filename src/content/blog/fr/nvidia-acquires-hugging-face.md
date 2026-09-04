---
title: "Nvidia rachète Hugging Face : le terrain neutre de l'IA ouverte a désormais un propriétaire"
description: "Nvidia a accepté de payer 12,93 milliards de dollars pour Hugging Face, la plus grosse opération de son histoire. La promesse : le hub reste ouvert. Les incitations : il devient le canal de distribution de CUDA le moins cher jamais construit."
date: "2026-09-04"
tags: [Économie Tech et Finance, IA et Machine Learning]
coverImage: /assets/images/nvidia-acquires-hugging-face.webp
previewImage: /assets/images/nvidia-acquires-hugging-face.webp
---

> **TL;DR**
> * **Le déclencheur :** Le 3 septembre, Nvidia a accepté d'acquérir Hugging Face pour 12 930 300 000 dollars, presque le double de son précédent record (Mellanox, 6,9 milliards en 2020) et près de trois fois la valorisation de Hugging Face en 2023, soit 4,5 milliards.
> * **Le mécanisme :** Nvidia n'achète pas du chiffre d'affaires. Elle achète l'endroit par défaut où 18 millions de développeurs téléchargent des poids, lancent des évaluations et choisissent un fournisseur d'inférence. Celui qui possède cette page décide quel matériel est le chemin de moindre résistance.
> * **La perspective :** Jensen Huang a promis que la plateforme resterait ouverte et que le calcul Nvidia ne serait pas obligatoire. C'est sans doute vrai le premier jour. La pression arrive ensuite : dans les réglages par défaut, dans le bouton « Deploy » affiché en premier, dans le checkpoint optimisé qui reçoit le badge.

Tous les ingénieurs ML que je connais ont le même réflexe. Un papier sort. On ouvre Hugging Face. On lit la model card, on vérifie la licence, on regarde les téléchargements, et on fait `from_pretrained` dans un notebook avant le déjeuner.

Le 3 septembre, cette page a trouvé un propriétaire qui a 5 000 milliards de dollars en jeu dans la suite.

Nvidia a accepté de racheter Hugging Face pour 12,93 milliards de dollars. Huang l'a annoncé avec le chiffre complet, étrangement précis (« $12,930,300,000 »), puis a prononcé les deux phrases qui comptent plus que le prix : « Hugging Face restera une plateforme ouverte pour tout l'écosystème de l'IA » et « le calcul NVIDIA ne sera pas requis pour construire ou déployer via Hugging Face ».

Je le crois. Je pense aussi que la phrase répond à la mauvaise question.

---

## Ce que Nvidia a vraiment acheté

Hugging Face n'est pas une grosse entreprise à l'échelle de Nvidia. C'est une grosse *position*.

| Actif | Échelle (chiffres de l'entreprise) | Pourquoi c'est important pour Nvidia |
| --- | --- | --- |
| Hub de modèles | Plus de 3M de modèles | La source canonique des poids ouverts, y compris la plupart des sorties chinoises |
| Datasets | ~500 000 | Données d'entraînement et d'évaluation que les pipelines référencent par leur nom |
| Spaces (apps) | Plus de 1M | Des démos en direct, qui sont aussi des charges d'inférence |
| Communauté | Plus de 18M d'utilisateurs, 200 000 entreprises | Le plus grand entonnoir de développeurs IA hors des laboratoires eux-mêmes |
| Bibliothèques | `transformers`, `diffusers`, `datasets`, TGI, `accelerate` | Le chemin de code entre un checkpoint et un GPU |

C'est la dernière ligne que je surveillerais. `transformers` est la couche qui transforme « un dossier de safetensors » en « un modèle qui tourne sur une machine ». Les kernels, les backends d'attention, les formats de quantification et les types de données par défaut s'y décident, dans des pull requests, par des mainteneurs. À partir de septembre, beaucoup de ces mainteneurs détiendront des actions Nvidia. Selon les informations sur l'accord, jusqu'à 1 milliard est réservé à la rétention des employés, sur environ 11,9 milliards versés aux actionnaires.

Rien de tout cela n'exige de fermer quoi que ce soit. Il suffit d'être l'équipe qui livre le chemin rapide en premier.

---

## Le prix, en contexte

| Opération | Année | Prix | Ce que Nvidia a obtenu |
| --- | --- | --- | --- |
| Mellanox | 2020 | 6,9 Md$ | InfiniBand et le réseau qui a rendu possibles les clusters DGX |
| Arm (abandonnée) | 2020 à 2022 | 40 Md$ (proposés) | L'ISA de CPU que tout le monde licencie. Les régulateurs l'ont bloquée |
| Groq (licence et recrutements) | Déc. 2025 | ~17 à 20 Md$ (selon la presse) | La propriété intellectuelle d'inférence et sa direction, sans fusion formelle |
| Obligations convertibles MediaTek | 31 août 2026 | 3,5 Md$ | Un partenaire de silicium sur mesure amené sur NVLink Fusion |
| Hugging Face | 3 sept. 2026 | 12,93 Md$ | La couche de distribution des modèles ouverts |

Lu de haut en bas, le tableau est limpide. Nvidia continue d'acheter ce qui se trouve *à côté* du GPU et qui décide si le GPU est choisi : le réseau, l'interconnexion, la startup d'inférence, l'ASIC du partenaire, et désormais le registre de modèles.

La ligne Arm est celle que les avocats de Nvidia garderont sur un post-it. Une plateforme neutre sur laquelle tout le monde construit, rachetée par l'entreprise qui vend la chose la plus chère construite dessus : c'est exactement l'histoire qui a coulé Arm. La différence, c'est que Hugging Face n'a pas de revenus de licence à retenir. Son levier est plus doux : l'attention, les réglages par défaut et la confiance.

---

## « Ouvert » ne veut pas dire « neutre »

La promesse de Huang porte sur l'accès. Personne ne sera obligé d'utiliser du matériel Nvidia pour utiliser le hub. C'est la partie facile, parce que l'imposer détruirait l'actif en une semaine.

La neutralité est une autre propriété, et elle se loge dans de petites décisions produit :

1. **Le bouton Deploy.** Aujourd'hui, une page de modèle propose plusieurs fournisseurs d'inférence et clouds. L'ordre de cette liste, et l'option présélectionnée, valent plus que n'importe quel communiqué de partenariat.
2. **Les checkpoints optimisés.** Si les versions NVFP4 ou TensorRT-LLM des modèles populaires apparaissent d'abord comme variantes « officielles », les builds ROCm d'AMD et les chemins TPU de Google deviennent le téléchargement de second rang, même s'ils fonctionnent.
3. **Classements et évaluations.** Qui finance le calcul derrière les classements ouverts compte. « Le plus de tokens par seconde » est une métrique qui a la forme d'un matériel.
4. **Les kernels par défaut dans `transformers`.** Un backend d'attention par défaut optimisé pour Hopper et Blackwell est un choix d'ingénierie parfaitement raisonnable. C'est aussi ainsi que les écosystèmes penchent sans que personne n'écrive de politique.

Chacune de ces décisions se défend isolément. Ensemble, elles forment un fossé. C'est la lecture honnête : Nvidia n'a pas besoin de fermer Hugging Face pour profiter de sa propriété. Il lui suffit d'être le chemin le mieux pris en charge sur une plateforme qu'elle contrôle.

---

## Qui perd du pouvoir de fixation des prix

**AMD et le camp du silicium sur mesure.** AMD a passé deux ans à faire de ROCm une cible crédible pour les modèles ouverts. Google, Amazon, Meta et Microsoft poussent tous leurs propres accélérateurs. Tous comptaient sur Hugging Face comme rampe d'accès commune où un modèle est publié une fois et tourne partout. Cette rampe a maintenant une partie intéressée.

**Les clouds d'inférence.** Together, Fireworks, Replicate, Baseten et les autres se disputent le clic « Deploy » sur les pages de modèles. Ils se battent désormais dans une vitrine possédée par leur principal fournisseur.

**Les laboratoires chinois à poids ouverts.** Une large part des modèles ouverts les plus téléchargés en 2026 venait de laboratoires chinois (Qwen, DeepSeek, Kimi). Leur canal de distribution par défaut appartient désormais à une entreprise américaine située au cœur de la politique de contrôle des exportations. Je ne serais pas surpris de voir plus de miroirs, et plus de publications de poids qui arrivent d'abord sur ModelScope.

**Qui gagne :** Hugging Face elle-même, à court terme. Clem Delangue a présenté l'accord en termes de calcul, de soutien, de collaboration et de visibilité. Un hub qui sert des pétaoctets de poids par jour a de vrais coûts d'infrastructure, et ses investisseurs de 2023 (Salesforce Ventures menait ce tour, avec Nvidia, Google, Amazon, IBM, Intel, AMD et Qualcomm) obtiennent une sortie propre à près de 3 fois la mise.

Il y a une ironie dans cette liste d'investisseurs. Presque toutes ces entreprises sont des concurrents du nouveau propriétaire.

---

## La question réglementaire

L'accord doit encore passer un examen réglementaire, et une source prévoit une finalisation en 2027. L'argument pour un examen poussé s'écrit tout seul : Nvidia contrôle l'accélérateur IA dominant, la pile logicielle dominante (CUDA), le réseau de mise à l'échelle dominant (hérité de Mellanox), et posséderait désormais le registre de modèles ouverts dominant.

L'argument contraire est tout aussi simple. Hugging Face n'a pas de fossé de revenus significatif, le coût de changement pour télécharger un modèle est proche de zéro, et n'importe qui peut héberger des safetensors sur S3. Les régulateurs qui ont eu du mal à définir un marché pour la licence Groq auront du mal à en définir un pour « les endroits où l'on télécharge des poids ».

Mon pari : l'accord sera finalisé avec des engagements comportementaux. Neutralité dans les listes de fournisseurs d'inférence, contributions publiques de kernels pour d'autres matériels, et une forme de gouvernance sur les bibliothèques open source. Ces engagements seront rédigés par des avocats et appliqués par des mainteneurs, c'est-à-dire par la culture.

---

## Ce que les développeurs devraient faire maintenant

* **Épinglez vos dépendances sur des révisions, pas sur `main`.** Si les model cards, les configs ou les kernels par défaut changent sous vos pieds, vous voulez le voir dans un diff, pas en production.
* **Faites un miroir de ce dont vous dépendez.** Les équipes qui gèrent des charges réglementées ou de longue durée devraient déjà garder des copies internes des poids et des datasets. C'est la bonne semaine pour le faire pour de vrai.
* **Testez de temps en temps le chemin sans Nvidia.** Si votre pile ne fonctionne aujourd'hui que sur CUDA, c'est un fait. Si elle ne fonctionne que sur CUDA en 2028 parce que personne n'a essayé autre chose, c'est une décision que vous ne saviez pas avoir prise.
* **Lisez la licence, pas le logo.** Le changement de propriétaire du hub ne change rien à la licence d'un modèle donné. Des poids Apache 2.0 restent Apache 2.0.

---

## Ce qui reste

Hugging Face est née en 2016 comme une app de chatbot pour adolescents. Elle est devenue le bien commun de l'IA ouverte presque par accident, parce qu'elle était utile et parce qu'elle n'avait aucun matériel à vendre.

La seconde moitié de cette phrase a cessé d'être vraie le 3 septembre.

Le hub restera ouvert. La question est de savoir s'il restera ennuyeux, une étagère neutre où les poids attendent. Le mieux qui puisse arriver, c'est que dans deux ans plus personne ne remarque à qui il appartient. Quelqu'un surveillera quand même l'ordre des boutons Deploy. Moi, en tout cas.

---

## Sources

* [Nvidia buys Hugging Face for $12.93 billion in its biggest acquisition ever (TechStartups, citant le Financial Times)](https://techstartups.com/2026/09/03/nvidia-buys-hugging-face-for-12-93-billion-in-its-biggest-acquisition-ever/)
* [NVIDIA Acquiring Hugging Face For $12.93 Billion (Phoronix)](https://www.phoronix.com/news/NVIDIA-Hugging-Face)
* [Nvidia buying artificial intelligence platform Hugging Face for $13 billion (La Nación / AP)](https://www.lanacion.com.ar/usa/nvidia-buying-artificial-intelligence-platform-hugging-face-for-13-billion-nid03092026/)
* [Nvidia invests $3.5B in MediaTek to extend its grip on AI (Network World)](https://www.networkworld.com/article/4220808/nvidia-invests-3-5b-in-mediatek-to-extend-its-grip-on-ai.html)
* [Top Tech News Today, September 3, 2026 (TechStartups)](https://techstartups.com/2026/09/03/top-tech-news-today-september-3-2026-google-hugging-face-meta-moonshot-ai-nvidia-more/)
* À lire aussi : [Comment un agent OpenAI a piraté Hugging Face](/blog/fr/openai-agent-hacks-huggingface)
