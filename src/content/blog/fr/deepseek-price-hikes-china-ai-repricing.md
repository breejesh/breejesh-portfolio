---
title: "DeepSeek a multiplié ses prix jusqu'à 4,5 et doublé ses revenus. L'ère de l'IA chinoise bon marché se termine au grand jour"
description: "DeepSeek a atteint un rythme annualisé de revenus d'un milliard de dollars après avoir relevé les prix de son API d'environ 2,3 à 4,5 fois. Les puces IA chinoises ont pris 20 à 50 %, Moonshot a déposé un dossier d'introduction en bourse, et la guerre des prix qui définissait l'IA chinoise devient un marché de pénurie."
date: "2026-09-25"
tags: [IA et Machine Learning, Économie Tech et Finance, Matériel et Semiconducteurs]
coverImage: /assets/images/deepseek-price-hikes-china-ai-repricing.webp
previewImage: /assets/images/deepseek-price-hikes-china-ai-repricing.webp
---

> **TL;DR**
> * **Le déclencheur :** DeepSeek a atteint un rythme annualisé de revenus d'un milliard de dollars, plus du double d'il y a quelques mois, selon The Information. Une partie du bond vient de hausses de prix de son API d'environ 2,3 à 4,5 fois. L'entreprise lève environ 50 milliards de yuans (près de 7,45 milliards de dollars) et a mandaté CITIC Securities pour une éventuelle cotation à Shanghai.
> * **Le mécanisme :** L'IA chinoise était bon marché parce que les laboratoires achetaient des parts de marché et que le calcul restait accessible. Ni l'un ni l'autre n'est plus vrai. Les contrôles américains sur la mémoire à haute bande passante ont fait grimper de 20 à 50 % en deux mois le dernier accélérateur Ascend de Huawei, et DeepSeek consacrerait plus de 70 % de son calcul à l'entraînement, laissant moins de 30 % pour servir ses clients.
> * **La perspective :** Les laboratoires qui ont lancé la guerre des prix de 2025 fixent désormais leurs tarifs en fonction de la pénurie et des investisseurs boursiers. Les développeurs qui ont bâti sur les prix plancher des API chinoises doivent s'attendre à des coûts beaucoup plus proches de ceux des autres, ou héberger eux-mêmes les poids ouverts.

En janvier 2025, le R1 de DeepSeek a effacé en une journée près de 500 milliards de dollars de capitalisation de Nvidia parce qu'il semblait bon marché. Bon marché à entraîner, à servir, à appeler. Pendant dix-huit mois, « les laboratoires chinois vont casser les prix » a été l'hypothèse la plus fiable de la tarification de l'IA.

Cette semaine, nous avons appris ce que DeepSeek a fait de cette réputation. Elle a relevé ses prix jusqu'à 4,5 fois, et ses revenus ont plus que doublé.

Ce n'est pas une contradiction. C'est un marché qui vous dit que le produit était sous-tarifé.

---

## Les chiffres de DeepSeek

| Indicateur | Chiffre rapporté |
| --- | --- |
| Rythme annualisé de revenus | ~1 Md$, plus du double d'il y a quelques mois |
| Hausses de prix de l'API | Environ 2,3 à 4,5 fois |
| Objectif de levée | ~50 Md de yuans (~7,45 Md$), bouclage visé fin octobre |
| Valorisation rapportée | ~500 Md de yuans |
| Préparation de l'introduction en bourse | CITIC Securities mandaté pour une éventuelle cotation au STAR Market (calendrier non fixé) |
| Répartition du calcul | Plus de 70 % à l'entraînement, moins de 30 % à l'inférence, selon les informations |
| Dernier modèle | DeepSeek-V4.1-Flash, sorti ce mois-ci |

Le PDG Liang Wenfeng aurait révélé ce rythme lors d'une réunion d'investisseurs. Il faut être précis sur ce qu'est un rythme annualisé : le rythme actuel projeté sur un an, pas le chiffre d'affaires comptabilisé sur l'année écoulée. Les revenus rapportés de janvier à juillet étaient bien plus faibles, autour de 475 millions de yuans. La courbe est raide, et récente.

La répartition du calcul est la ligne que je soulignerais. Un laboratoire qui envoie sept accélérateurs sur dix à l'entraînement n'a que très peu de marge pour servir le trafic. Quand la demande monte et que l'offre ne suit pas, le seul levier qui reste est le prix. DeepSeek l'a actionné.

---

## Côté offre : les puces ont aussi renchéri

DeepSeek n'augmente pas ses prix dans le vide. Il y a deux semaines, Reuters rapportait que les fabricants chinois de puces IA relevaient leurs prix sous l'effet d'une pénurie de mémoire à haute bande passante.

| Puce | Ancien prix (env.) | Nouveau prix (env.) | Évolution |
| --- | --- | --- | --- |
| Huawei Ascend 950DT (livrée au T4 2026) | n/d | Plus de 250 000 yuans (~37 000 $) | 20 à 50 % au-dessus des devis d'il y a deux mois |
| Huawei Ascend 950PR | ~60 000 yuans | Plus de 80 000 yuans | ~30 % |
| Huawei Ascend 910C | ~90 000 yuans | Plus de 110 000 yuans | ~22 % |
| Cambricon 690 (non sortie) | n/d | n/d | Retarifée de 20 à 30 % à la hausse |
| MetaX, Iluvatar CoreX | n/d | n/d | Hausses similaires rapportées |

La cause, c'est la mémoire, pas la logique. Les contrôles américains à l'exportation sur la HBM avancée se sont durcis en décembre 2024. Les fabricants chinois d'accélérateurs savent concevoir des puces de calcul compétitives et les faire fabriquer localement, mais il leur faut des piles de HBM à côté, et la HBM du marché gris coûterait plusieurs fois le prix payé hors de Chine. CXMT a commencé une production de HBM3E à petite échelle et prévoit de l'étendre en 2027. D'ici là, chaque carte Ascend porte un problème de mémoire coûteux.

La chaîne est simple. La mémoire est rare, les accélérateurs renchérissent, la capacité d'inférence reste tendue, et les prix des API montent.

---

## Côté capital : tout le monde veut être coté

Tarifer la pénurie, c'est aussi tarifer pour les investisseurs.

* **DeepSeek** lève environ 7,45 milliards de dollars et prépare une éventuelle cotation au STAR Market.
* **Moonshot AI**, éditeur de Kimi, a déposé confidentiellement un dossier d'introduction à Hong Kong début septembre, après un tour privé qui l'aurait valorisé autour de 50 milliards de dollars, contre 31,5 milliards au début de l'été. Les informations évoquent une levée de 3 à 5 milliards, avec une cotation dès le premier trimestre 2027.
* **Zhipu et MiniMax** sont déjà entrés en bourse à Hong Kong plus tôt cette année, ce qui donne aux investisseurs une référence publique pour les éditeurs de modèles chinois.

Les investisseurs boursiers veulent des courbes de revenus qui montent et des marges brutes qui ne sont pas négatives. Un laboratoire qui vend à perte pour gagner des parts de marché, c'est une belle histoire dans un tour privé. Dans un prospectus, c'est un facteur de risque. La hausse de 2,3 à 4,5 fois ressemble pour moi à une entreprise qui range ses comptes avant l'arrivée des auditeurs.

---

## Côté géopolitique

L'histoire des prix s'inscrit dans un débat plus bruyant. Washington accuse les laboratoires chinois d'une distillation « à l'échelle industrielle » des modèles de pointe américains. Ce mois-ci, le ministère chinois du Commerce a rejeté l'accusation, a rappelé que la technique est largement utilisée et a prévenu qu'il pourrait riposter si les États-Unis ajoutaient des restrictions.

L'ironie, c'est que les poids ouverts chinois font de plus en plus partie de la pile américaine. Harvey, l'entreprise d'IA juridique qui vient de lever 550 millions de dollars pour une valorisation de 15,5 milliards, a bâti son premier modèle maison, Harvey Tenet, sur Kimi K3, le modèle à poids ouverts de Moonshot. La querelle de la distillation porte sur qui a copié qui. La réalité du déploiement, c'est que tout le monde construit sur tout le monde.

---

## Ce que cela change si vous construisez sur des modèles chinois

| Si vous dépendez de... | Ce qui change | Que faire |
| --- | --- | --- |
| Des API hébergées de DeepSeek ou Kimi pour leur coût | Votre coût par token vient peut-être de doubler, voire plus | Refaites votre calcul d'économie unitaire avec la grille d'aujourd'hui, pas celle de l'an dernier |
| Des poids ouverts (DeepSeek, Qwen, Kimi) | Rien côté licence. Les poids restent les vôtres | Chiffrez l'auto-hébergement sur vos GPU ou chez un fournisseur d'inférence neutre |
| Un modèle chinois comme « solution de repli bon marché » dans un routeur | L'écart entre les gammes économiques et les gammes de pointe se resserre | Comparez ce repli aux modèles économiques américains (type Haiku, Flash, Luna) sur vos propres tâches |
| Des engagements de long terme | Les laboratoires vont bientôt avoir des actionnaires publics | Attendez-vous à des prix guidés par des objectifs de marge, pas de parts de marché |

La leçon de fond porte sur l'endroit où se trouve le fossé. Pendant un temps, on a cru que les laboratoires chinois avaient trouvé le moyen de rendre l'intelligence presque gratuite. Ce qu'ils avaient trouvé, en réalité, c'était le moyen de la faire paraître presque gratuite tant que le calcul était bon marché et les investisseurs patients. Les deux étaient temporaires.

---

## Ce qui reste

Je repense sans cesse à cette répartition du calcul. Soixante-dix pour cent pour l'entraînement. Trente pour servir.

Elle décrit une entreprise qui croit encore que le prochain modèle compte plus que les clients de ce mois-ci. C'est un bon instinct pour un laboratoire de recherche. C'en est un étrange pour une entreprise sur le point de présenter ses revenus à des investisseurs publics. Quelque part entre le 70 et le 30, c'est là que vit désormais la grille tarifaire de DeepSeek.

---

## Sources

* [DeepSeek hits $1 billion revenue run rate as Chinese AI startup targets $7.5 billion raise (TechStartups, citant The Information)](https://techstartups.com/2026/09/24/deepseek-hits-1-billion-revenue-run-rate-as-chinese-ai-startup-targets-7-5-billion-raise/)
* [China's AI chipmakers raise prices as high-bandwidth memory shortage bites (Kuwait Times / Reuters)](https://kuwaittimes.com/article/49537/business/chinas-ai-chipmakers-raise-prices-as-high-bandwidth-memory-shortage-bites/)
* [Prices of Chinese AI chips soar (TrendForce)](https://www.trendforce.com/news/?p=63912)
* [Moonshot AI files confidentially for Hong Kong IPO (Dealroom)](https://dealroom.co/news/info-kyt1c4-moonshot-ai-files-confidentially-for-hong-kong-ipo/)
* [Top Tech News Today, September 10, 2026 (TechStartups)](https://techstartups.com/2026/09/10/top-tech-news-today-september-10-2026-apple-anthropic-ibm-meta-openai-spacex-more/)
* [Top Tech News Today, September 24, 2026 (TechStartups)](https://techstartups.com/2026/09/24/top-tech-news-today-september-24-2026-amazon-anthropic-deepseek-google-meta-openai-oracle-more/)
* À lire aussi : [Les benchmarks de Kimi K3](/blog/fr/kimi-k3-benchmarks)
