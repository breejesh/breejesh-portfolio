---
title: "Le boom XPU de Broadcom : les laboratoires d'IA deviennent des fabricants de puces, et Wall Street paie les usines"
description: "Le chiffre d'affaires de Broadcom en puces IA a bondi de 221 %, à 16,7 milliards de dollars, et Anthropic est en passe de devenir son premier client d'accélérateurs sur mesure. Derrière la croissance : une machine de financement, un carnet de commandes de 10 gigawatts et la riposte discrète de Nvidia."
date: "2026-09-18"
tags: [Matériel et Semiconducteurs, Économie Tech et Finance]
coverImage: /assets/images/broadcom-custom-ai-accelerators-xpu.webp
previewImage: /assets/images/broadcom-custom-ai-accelerators-xpu.webp
---

> **TL;DR**
> * **Le déclencheur :** Broadcom a publié un chiffre d'affaires semi-conducteurs IA de 16,7 milliards de dollars au troisième trimestre fiscal 2026 (+221 % sur un an), a prévu 21,7 milliards pour le quatrième trimestre, et a présenté une perspective d'environ 115 milliards de revenus IA pour l'exercice 2027 et 230 milliards pour 2028.
> * **Le mécanisme :** Six clients conçoivent désormais leurs propres accélérateurs (XPU) avec Broadcom. Anthropic à lui seul déploie 1 GW de TPU cette année, prévoit 5 GW en 2027 et 10 GW supplémentaires en ligne de mire pour 2028. Les deux laboratoires incapables de financer cela sur leurs flux de trésorerie, Anthropic et OpenAI, passent par un véhicule monté avec Apollo et Blackstone.
> * **La perspective :** Le monopole du GPU ne se brise pas. On le contourne, gigawatt par gigawatt. La réponse de Nvidia, un investissement de 3,5 milliards dans MediaTek et NVLink Fusion, vise à ce que les puces sur mesure continuent de se brancher dans ses racks.

Pendant trois ans, l'histoire du matériel IA n'a eu qu'un seul héros. On achetait Nvidia, ou on attendait Nvidia.

La conférence de résultats du troisième trimestre de Broadcom a été la preuve la plus nette à ce jour que les plus gros acheteurs ont cessé d'attendre. Ils conçoivent leur propre silicium, et Broadcom est l'entreprise qui transforme ces conceptions en wafers, en boîtiers, en réseaux et en racks.

Le chiffre qui a fait les gros titres, c'est 221 %. Celui que je n'arrête pas de regarder, c'est 10 gigawatts. C'est la capacité supplémentaire que Hock Tan dit avoir en ligne de mire pour 2028, avant d'ajouter : « 10 gigawatts, c'est rien que pour Anthropic. »

---

## Le trimestre en un tableau

| Indicateur (T3 fiscal 2026, clos le 2 août) | Valeur |
| --- | --- |
| Chiffre d'affaires total | 29,6 Md$, +86 % sur un an |
| Chiffre d'affaires semi-conducteurs IA | 16,7 Md$, +221 % sur un an et +54 % sur un trimestre |
| Solutions semi-conducteurs | 20,8 Md$ (70 % du chiffre d'affaires) |
| Logiciels d'infrastructure (VMware) | 8,8 Md$ (30 % du chiffre d'affaires) |
| Flux de trésorerie disponible | 13,7 Md$ (46 % du chiffre d'affaires) |
| Prévision de CA T4 | ~34,8 Md$, +93 % sur un an |
| Prévision semi-conducteurs IA T4 | 21,7 Md$, +236 % sur un an |
| Prévision de revenus IA exercice 2026 | Relevée à 58 Md$ contre 56 Md$ |
| Perspective de revenus IA | ~115 Md$ pour l'exercice 2027, ~230 Md$ pour 2028 |
| Marge brute | 75 % au T3, prévue à ~73 % au T4 |

La ligne de marge est la plus honnête. Broadcom s'attend à un recul de la marge brute à cause de la mémoire plus abondante dans les livraisons de XPU. L'entreprise achète beaucoup de HBM pour le compte de ses clients et la refacture. C'est ce qui arrive quand on passe de la vente de puces à la vente de quelque chose de plus proche d'un accélérateur complet.

---

## Qui construit quoi

Broadcom ne nomme généralement pas ses clients. Cette fois, elle l'a fait, en détail :

| Client | Programme | Trajectoire de déploiement |
| --- | --- | --- |
| Anthropic | TPU de Google (Ironwood, puis TPU v8i) | 1 GW en 2026, 5 GW en 2027, 10 GW supplémentaires en 2028. Attendu comme premier client XPU de Broadcom en 2027 et 2028 |
| OpenAI | Jalapeno, plus un successeur proche du tape-out | 1,3 GW en 2027, plus de 5 GW en 2028. Attendu comme deuxième client |
| Google | TPU (accord de développement et d'approvisionnement à long terme) | « Plusieurs dizaines de milliards de dollars » de TPU par an pendant plusieurs années |
| Meta | MTIA, trois générations jusqu'en 2027 | Environ 3 GW jusqu'en 2028 ; livraisons de production à partir du T4 |
| Deux autres | Non divulgués | Autofinancés, selon la direction |

Deux choses dans ce tableau auraient semblé absurdes il y a dix-huit mois.

D'abord, un laboratoire de modèles qui ne possède aucun centre de données est en passe de devenir le premier client de silicium sur mesure du premier fabricant de silicium sur mesure. Anthropic ne conçoit pas les TPU, c'est Google, mais il les achète à une échelle qui revient à réserver une ligne de production.

Ensuite, la puce d'OpenAI a un nom de code, un calendrier de tape-out et une troisième génération en développement. « Concevoir notre propre puce » était autrefois une posture de négociation face à Nvidia. C'est désormais une feuille de route.

---

## Suivre l'argent : le véhicule XPV

La question évidente : comment une entreprise qui affiche les pertes d'Anthropic paie-t-elle 15 gigawatts d'accélérateurs ?

La réponse : pour l'essentiel, elle ne paie pas d'avance. En juin, Broadcom a monté une plateforme avec Apollo et Blackstone (la direction l'appelle XPV) pour financer plus de 20 GW de calcul pour OpenAI et Anthropic d'ici fin 2028. Des investisseurs tiers souscrivent et détiennent les actifs. La première tranche, 35 milliards de dollars, a été bouclée en juin pour le premier gigawatt d'Anthropic.

| Élément | Qui le porte |
| --- | --- |
| Conception et fourniture des puces | Broadcom (et Google pour les TPU) |
| Capital pour le matériel | Apollo, Blackstone et co-investisseurs |
| Risque d'usage et de revenus | Anthropic et OpenAI |
| Valeur résiduelle du matériel | Les investisseurs, avec des garanties de valeur résiduelle « modestes » de Broadcom |

La direction a donné deux ordres de grandeur à noter. Le contenu Broadcom représente environ 20 à 30 milliards de dollars par gigawatt. Et, selon l'estimation de la direction, Anthropic pourrait générer environ 30 milliards de revenus annuels par gigawatt déployé.

Si le second chiffre tient, les calculs fonctionnent et la dette est bon marché. Sinon, le crédit privé se retrouve avec beaucoup de silicium très spécifique à durée de vie courte. La garantie de valeur résiduelle est la ligne que je surveillerais dans les prochains rapports. « Modeste » et « faible risque », c'est ce que tout le monde dit avant qu'un cycle d'amortissement ne se retourne.

---

## Nvidia ne reste pas immobile

Deux jours avant les résultats de Broadcom, Nvidia a investi 3,5 milliards de dollars dans des obligations convertibles de MediaTek, l'essentiel de l'émission internationale record de MediaTek. En retour, MediaTek a adopté NVLink Fusion et proposera des services de conception autour du chiplet de Nvidia, de NVLink-C2C et de son architecture mémoire.

Lu en parallèle de la conférence de Broadcom, la stratégie est claire. Nvidia ne peut pas empêcher les plus gros acheteurs de construire des XPU. Elle peut essayer de faire en sorte que ces XPU vivent dans des racks Nvidia, sur l'interconnexion Nvidia, à côté de GPU Nvidia et de CPU Grace ou Vera. Si l'on ne peut pas posséder l'accélérateur, on possède le fond de panier.

Jensen Huang a rejeté l'étiquette de « financement circulaire » : « Ce n'est pas circulaire, parce qu'évidemment ils font leurs affaires et nous faisons les nôtres. » Peut-être. Cela reste Nvidia qui utilise son bilan pour attirer les clients d'un concurrent potentiel sur son interconnexion.

Pendant ce temps, selon le New York Times, le ministère américain de la Justice examinerait si l'accord de licence et de recrutement conclu par Nvidia avec Groq en décembre a été structuré pour éviter un contrôle des concentrations. Nvidia y voit « un parfait exemple du système américain qui fonctionne comme prévu ». Dans tous les cas, les régulateurs regardent désormais les marges de l'empire Nvidia, pas seulement son centre.

Et le capital continue d'affluer vers le prochain challenger. Positron, une startup de puces d'inférence basée à Reno, vient de lever 875 millions de dollars pour une valorisation de 5 milliards, environ cinq fois celle d'il y a six mois, avec la promesse de jusqu'à 2,3 To de mémoire par puce.

---

## Ethernet a gagné le réseau sans bruit

L'autre moitié de l'activité IA de Broadcom, c'est le réseau, et il croît aussi vite que les accélérateurs. Le chiffre d'affaires réseau IA a été multiplié par plus de 2,5 sur un an.

* **Tomahawk 6** (classe 100 Tbit/s) est déployé chez les hyperscalers qui construisent des XPU.
* **Tomahawk 7** a été finalisé comme commutateur Ethernet de 200 Tbit/s.
* **Tomahawk Ultra** amène Ethernet dans le scale-up, ce domaine étroit de GPU à GPU où NVLink de Nvidia régnait sans partage.

C'est important, car le camp du silicium sur mesure a besoin d'un réseau qui n'appartient pas à Nvidia. InfiniBand est arrivé avec Mellanox. Ethernet est l'alternative ouverte, et Broadcom vend l'essentiel du silicium de commutation sur lequel il tourne.

---

## Ce qui pourrait mal tourner

1. **La concentration.** Si Anthropic devient le premier client XPU, l'année 2028 de Broadcom dépend fortement de la croissance d'une seule entreprise et de son accès au capital.
2. **La dilution de la marge.** Plus de mémoire et plus de contenu système réduisent la marge en pourcentage même si les dollars augmentent. Les investisseurs qui valorisaient Broadcom comme un fabricant de puces à 75 % de marge brute devront recalibrer.
3. **L'énergie et les bâtiments.** La direction elle-même a souligné que le foncier, l'électricité et les bâtiments de centres de données limitent le déploiement. Un gigawatt sur une diapositive n'est pas un gigawatt sous tension.
4. **L'efficacité des modèles.** Si l'inférence devient moins chère par token plus vite que la demande ne croît, les plans en gigawatts d'aujourd'hui ressembleront à la fibre optique de l'an 2000.

---

## Ce qui reste

L'expression qui m'est restée, c'est « en ligne de mire ». C'est ce qu'on dit d'une chose qu'on voit mais qu'on n'a pas encore atteinte.

Dix gigawatts, pour un seul client, dans deux ans, financés par du capital privé, avec une garantie modeste. Tout le monde avait l'air calme pendant la conférence. Le carnet de commandes est réel. La distance entre voir une chose et l'atteindre l'est aussi.

---

## Sources

* [Broadcom Q3 FY2026 results, Form 8-K exhibit (SEC)](https://www.sec.gov/Archives/edgar/data/0001730168/000173016826000076/avgo-08022026x8kxex99.htm)
* [Broadcom (AVGO) Q3 2026 earnings call transcript (The Motley Fool)](https://www.fool.com/earnings/call-transcripts/2026/09/09/broadcom-avgo-q3-2026-earnings-call-transcript/)
* [Broadcom Q3 revenue jumps 86 pct on strong AI demand (The Star / Reuters)](https://www.thestar.com.my/news/world/2026/09/03/broadcom-q3-revenue-jumps-86-pct-on-strong-ai-demand)
* [Nvidia invests $3.5B in MediaTek to extend its grip on AI (Network World)](https://www.networkworld.com/article/4220808/nvidia-invests-3-5b-in-mediatek-to-extend-its-grip-on-ai.html)
* [US DOJ probes Nvidia's licensing deal with AI startup Groq, NYT reports (The Star / Reuters)](https://www.thestar.com.my/tech/tech-news/2026/09/10/us-doj-probes-nvidia039s-licensing-deal-with-ai-startup-groq-nyt-reports)
* [Top Tech News Today, September 10, 2026 (TechStartups)](https://techstartups.com/2026/09/10/top-tech-news-today-september-10-2026-apple-anthropic-ibm-meta-openai-spacex-more/)
