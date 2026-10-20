---
title: "Trois millions de cartes pour stations de travail : la commande chinoise de 35 milliards chez Nvidia montre où fuient les contrôles à l'exportation"
description: "ByteDance, Alibaba et Tencent auraient commandé plus de 3 millions de cartes Nvidia RTX PRO 5500, soit plus de 35 milliards de dollars au prix catalogue, pour faire tourner de l'inférence IA. Nvidia a prévenu qu'elle n'en livrerait peut-être que 5 à 10 %. La commande en dit plus sur la demande d'inférence et la conception des contrôles à l'exportation que sur le prochain trimestre de Nvidia."
date: "2026-10-20"
tags: [Matériel et Semiconducteurs, Politiques Tech et Droit]
coverImage: /assets/images/china-nvidia-rtx-pro-5500-orders.webp
previewImage: /assets/images/china-nvidia-rtx-pro-5500-orders.webp
---

> **TL;DR**
> * **Le déclencheur :** Selon Reuters, ByteDance, Alibaba et Tencent ont commandé plus de 3 millions de cartes Nvidia RTX PRO 5500 à environ 11 400 dollars pièce, soit plus de 35 milliards au prix catalogue. Les commandes chinoises totales pour cette carte dépasseraient 6 millions d'unités.
> * **Le mécanisme :** La RTX PRO 5500 est une carte pour stations de travail de génération Blackwell, conforme aux règles américaines d'exportation, qui interdisent le B300 et examinent au cas par cas les ventes de H200. Les acheteurs chinois la veulent surtout pour l'inférence, la charge qui croît le plus vite et qui demande moins de calcul par puce que l'entraînement.
> * **La perspective :** Nvidia a prévenu qu'elle ne livrerait peut-être que 5 à 10 % des volumes demandés, qu'elle pourrait plafonner la production mondiale autour de 3 millions d'unités en 2027, et qu'elle réoriente des capacités TSMC vers Rubin. La commande est moins une vente qu'un signal : la demande chinoise d'inférence est énorme, les puces nationales sont chères et rares, et les contrôles tracés autour des produits « centre de données » laissent une brèche en forme de station de travail.

Le chiffre le plus intéressant de cette histoire n'est pas 35 milliards. C'est 5 à 10 %.

C'est la part de leurs commandes que certains acheteurs pourraient réellement recevoir, selon l'une des sources de Reuters. Nvidia a dit à ses clients et partenaires qu'elle ne pouvait pas garantir les livraisons. Une autre source indique que Nvidia ne pourrait pas fabriquer plus d'environ 3 millions de cartes RTX PRO 5500 dans le monde en 2027. Les seuls clients chinois en ont demandé plus de 6 millions.

Trois des plus grandes entreprises technologiques du monde ont donc passé des commandes qu'elles savent en grande partie impossibles à honorer. Cela dit à quel point la situation du calcul est devenue désespérée en Chine.

---

## Ce qui a été commandé, et pourquoi cette carte

| Élément | Détail |
| --- | --- |
| Acheteurs | ByteDance, Alibaba, Tencent (et d'autres clients chinois) |
| Carte | Nvidia RTX PRO 5500, GPU pour stations de travail de l'ère Blackwell |
| Volume | Plus de 3 M pour les trois ; plus de 6 M pour l'ensemble des clients chinois |
| Prix | Environ 11 400 $ la carte ; plus de 35 Md$ au prix catalogue pour les trois |
| Usage | Principalement l'inférence |
| Calendrier | Premiers échantillons en décembre 2026 ; livraisons commerciales à partir du T1 2027 |
| Risque d'approvisionnement | Certains acheteurs pourraient recevoir 5 à 10 % ; Nvidia réoriente des capacités TSMC vers Rubin à partir de 2027 |

La RTX PRO 5500 n'est pas une puce de centre de données. C'est tout l'enjeu. Les règles américaines interdisent la vente du B300 à la Chine et soumettent le H200 à un examen au cas par cas. Les cartes pour stations de travail relèvent d'une autre catégorie. Elles sont moins puissantes par puce, mais en inférence, la puissance par puce compte moins que la puissance par dollar et par watt sur des milliers de cartes.

Il y a un historique. L'an dernier, Nvidia a conçu la RTX 6000D, une carte bridée pour respecter les règles chinoises. Les entreprises chinoises l'ont largement ignorée, espérant que Washington autoriserait de meilleures puces. Quand cet espoir s'est éteint, la demande pour tout ce qui est légal est revenue avec les intérêts. Nvidia a depuis arrêté la 6000D, et une source affirme que son prix en Chine a doublé.

---

## L'inférence, la demande que personne n'avait prévue

Les contrôles à l'exportation ont été conçus autour de l'entraînement : les immenses clusters qui produisent les modèles de pointe. L'inférence a été traitée comme un problème secondaire.

Ce n'est plus le cas. Regardez ce que nous avons appris rien que ce mois-ci :

* DeepSeek consacrerait plus de 70 % de son calcul à l'entraînement et moins de 30 % au service des clients, et a relevé les prix de son API de 2,3 à 4,5 fois parce que la demande dépassait l'offre.
* ByteDance consommerait environ un cinquième de la capacité de centres de données livrée en Chine. SemiAnalysis estime que la Chine dispose de plus de 24 GW opérationnels et d'environ 20 GW en développement.
* Les derniers accélérateurs Ascend de Huawei ont pris 20 à 50 % en deux mois à cause de la pénurie de HBM.

Mis bout à bout, la logique de la commande est claire. Les accélérateurs nationaux sont chers et manquent de mémoire. Les laboratoires chinois ont besoin de plus de capacité de service, pas seulement d'entraînement. Une carte Nvidia légale pour stations de travail, autour de 11 400 dollars, qui fait tourner la pile CUDA déjà prise en charge par tous les moteurs d'inférence, est l'unité d'inférence la moins chère disponible.

---

## Où passent les lignes de la politique

| Produit | Statut d'exportation américain vers la Chine (selon les informations) | Rôle pratique |
| --- | --- | --- |
| B300 (centre de données Blackwell) | Interdit | Entraînement et inférence à grande échelle |
| H200 | Examen au cas par cas ; Nvidia a dit en août ne pas attendre de revenus centre de données des premières livraisons | Entraînement et inférence |
| RTX 6000D | Autorisée, abandonnée | Carte pour stations de travail bridée, spécifique à la Chine |
| RTX PRO 5500 | Conforme aux règles d'exportation | Carte pour stations de travail, utilisée ici pour l'inférence |
| Puces nationales (Huawei Ascend, Alibaba Zhenwu V900, Cambricon) | Sans objet | Part croissante, limitée par l'approvisionnement en HBM |

Deux autres fils comptent. Washington examine la façon dont les entreprises chinoises louent des puces Nvidia qu'elles ne peuvent pas acheter, l'autre fuite évidente. Et Pékin a aussi son mot à dire : The Information a rapporté le mois dernier que les autorités chinoises pourraient autoriser Alibaba et ByteDance à acheter la nouvelle carte, ce qui suppose que l'autorisation n'allait pas de soi. La Chine pousse depuis deux ans ses entreprises vers le silicium national.

La position de Nvidia est directe. Jensen Huang a déclaré que les restrictions américaines avaient fait passer la part de Nvidia sur le marché chinois des puces IA pour centres de données d'un quasi-monopole à pratiquement rien. Un porte-parole a dénoncé des « contrôles américains à l'exportation dépassés, qui couvrent des produits de jeu sortis il y a près d'une demi-décennie ».

---

## Pourquoi Nvidia pourrait de toute façon ne pas vouloir l'honorer

Il semble étrange qu'une entreprise refuse 35 milliards de dollars. Mais regardez les arbitrages :

1. **L'allocation des wafers.** Chaque wafer consacré à des cartes pour stations de travail destinées à la Chine est un wafer qui ne va pas à Rubin, la prochaine plateforme de centres de données, où les marges et la valeur stratégique sont plus élevées.
2. **Le risque politique.** Un afflux visible de silicium de génération Blackwell dans les clusters d'inférence chinois est exactement le genre de titre qui déclenche une nouvelle règle. Livrer lentement est une forme de gestion du risque.
3. **La concentration des clients.** Les hyperscalers américains se disputent déjà l'approvisionnement de Nvidia. Détourner des capacités vers la Chine en pleine pénurie crée des frictions avec les clients qui achètent des B300.

Le scénario le plus probable est donc une livraison partielle, étalée sur 2027, une bonne partie de la demande restante se reportant sur Huawei et l'écosystème national à des prix plus élevés.

---

## Ce que cela signifie hors de Chine

* **Pour les fournisseurs d'inférence partout dans le monde :** le silicium d'inférence exploitable le moins cher se raréfie à l'échelle mondiale, pas seulement en Chine. Les cartes Blackwell pour stations de travail servaient de soupape. Une commande de 6 millions d'unités l'absorbe.
* **Pour ceux qui suivent la politique :** les contrôles définis par catégorie de produit (centre de données, station de travail, jeu) continueront de fuir aux frontières. Des contrôles fondés sur la capacité agrégée ou l'usage final sont plus difficiles à rédiger et à faire respecter, mais cette commande est l'argument pour essayer.
* **Pour les modèles chinois à poids ouverts :** plus de capacité de service signifie moins de latence et plus de disponibilité pour des modèles comme DeepSeek, Qwen et Kimi, que le monde entier télécharge et fait tourner. La géopolitique du matériel d'inférence n'est pas qu'une histoire chinoise.

---

## Ce qui reste

Tansun Technology, cotée à Shenzhen, a indiqué dans un document du 13 octobre qu'elle achèterait 20 000 cartes RTX PRO 5500, sans nommer le vendeur, et a prévenu que les pénuries et les contrôles technologiques étrangers pourraient retarder les livraisons ou réduire les volumes.

Vingt mille cartes, d'une entreprise dont presque personne hors de Chine n'a entendu parler. Annoncées avec l'avertissement qu'elles pourraient ne jamais arriver. Voilà à quoi ressemble aujourd'hui le marché du calcul : des bons de commande rédigés comme des vœux.

---

## Sources

* [ByteDance, Alibaba and Tencent order $35bn of Nvidia chips, Reuters reports (The Next Web)](https://thenextweb.com/news/nvidia-rtx-pro-5500-china-orders-bytedance-alibaba-tencent)
* [ByteDance, Alibaba, Tencent place over US$35b worth of Nvidia chip orders (The Edge Malaysia / Reuters)](https://theedgemalaysia.com/node/822533)
* [China's tech giants drop $35 billion on export-compliant Nvidia RTX Pro 5500 orders (Tom's Hardware)](https://www.tomshardware.com/pc-components/gpus/chinas-tech-giants-drop-usd35-billion-on-export-compliant-nvidia-rtx-pro-5500-workstation-gpu-orders-to-power-ai-ambitions-according-to-reports-bytedance-alibaba-and-tencent-order-3-million-cards-despite-warnings-that-only-10-percent-of-orders-are-fulfillable)
* [Tech News Today, October 20, 2026 (TechStartups)](https://techstartups.com/2026/10/20/tech-news-today-october-20-2026-amazon-apple-bytedance-microsoft-nvidia-openai-salesforce-more/)
* [Top Tech News Today, September 29, 2026 (TechStartups)](https://techstartups.com/2026/09/29/top-tech-news-today-september-29-2026-anthropic-bytedance-google-meta-openai-samsung-more/)
* À lire aussi : [Les hausses de prix de DeepSeek et la revalorisation de l'IA chinoise](/blog/fr/deepseek-price-hikes-china-ai-repricing)
