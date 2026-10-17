---
title: "Le goulet d'étranglement des puces IA a encore bougé : le trimestre record d'ASML, les 21 milliards du Japon pour des usines à New York et l'interposeur dont personne ne parle"
description: "En une semaine, ASML a publié des ventes record, GlobalFoundries a signé un accord de 2 milliards de dollars pour fabriquer à New York les interposeurs CoWoS de TSMC, et le Japon a accepté de financer jusqu'à 21 milliards de nouvelles usines GlobalFoundries. La contrainte du matériel IA passe des wafers au packaging, et de l'ingénierie à la politique industrielle."
date: "2026-10-17"
tags: [Matériel et Semiconducteurs, Politiques Tech et Droit]
coverImage: /assets/images/asml-globalfoundries-packaging-reshoring.webp
previewImage: /assets/images/asml-globalfoundries-packaging-reshoring.webp
---

> **TL;DR**
> * **Le déclencheur :** ASML a annoncé des ventes record de 11,7 milliards d'euros au troisième trimestre et indiqué que ses clients discutent déjà de leurs besoins en outils pour 2029 et 2030. Le 8 octobre, GlobalFoundries a signé un accord de 2 milliards de dollars sur cinq ans pour fabriquer des interposeurs en silicium destinés au packaging CoWoS de TSMC à Malta, dans l'État de New York. Le 14 octobre, le Japon a accepté de financer jusqu'à 21 milliards pour deux nouvelles usines GlobalFoundries sur le même site.
> * **Le mécanisme :** Tous les accélérateurs IA qui comptent (GPU Nvidia, TPU Google, XPU fabriqués par Broadcom) reposent sur un packaging avancé qui relie les puces logiques à la HBM via un interposeur en silicium. La lithographie fait les gros titres. La capacité de packaging décide combien d'accélérateurs sont réellement livrés.
> * **La perspective :** Les premiers interposeurs CoWoS fabriqués aux États-Unis arrivent au premier semestre 2028, la première usine financée par le Japon en 2029. Ni l'un ni l'autre ne règle 2026 ou 2027. Les deux montrent que l'approvisionnement en matériel IA se négocie désormais entre gouvernements autant qu'entre entreprises.

Quand on parle de « pénurie de puces » en 2026, on pense généralement aux GPU. Quand ce sont les ingénieurs de la chaîne d'approvisionnement qui le disent, ils pensent de plus en plus à quelque chose de moins glamour : le carré de silicium sur lequel repose le GPU.

Ce carré s'appelle un interposeur. C'est une plaque de silicium passive couverte d'un câblage extrêmement fin, qui permet à une puce de calcul de dialoguer avec des piles de mémoire à haute bande passante situées à quelques millimètres, à des débits qu'une carte classique ne peut pas supporter. La version de TSMC de ce packaging s'appelle CoWoS. Presque tous les accélérateurs de pointe l'utilisent, ou quelque chose d'approchant. Et pendant l'essentiel du boom de l'IA, c'est l'une des contraintes les plus serrées de toute la chaîne.

Cette semaine, trois annonces ont touché toutes les couches de cette chaîne en même temps.

---

## Trois annonces, une chaîne d'approvisionnement

| Date | Annonce | Couche de la pile |
| --- | --- | --- |
| 8 oct. | GlobalFoundries signe un accord de 2 Md$ sur cinq ans pour fabriquer des interposeurs pour le CoWoS de TSMC à Malta, New York ; montée en volume au S1 2028 | Packaging avancé |
| 8 oct. | TSMC publie un chiffre d'affaires de septembre de 511,86 Md de dollars taïwanais, +54,6 % sur un an ; 3 900 Md sur neuf mois, +41,1 % | Wafers de pointe |
| 14 oct. | ASML publie des ventes T3 de 11,7 Md€, un résultat net de 5,0 Md€, une marge brute de 57,5 % et 113 systèmes de lithographie vendus (contre 86) | Outils de lithographie |
| 14 oct. | Le Japon accepte de financer jusqu'à 21 Md$ pour deux usines GlobalFoundries à Malta, New York ; la participation américaine dans GF monte à environ 7 % | Wafers matures et spécialisés, politique industrielle |

Lu de haut en bas, c'est toute la pile physique d'un accélérateur IA : les machines qui impriment les transistors, les usines qui font tourner ces machines, le packaging qui assemble les puces, et les gouvernements qui financent le tout.

---

## ASML : le carnet de commandes est déjà en 2030

Les chiffres d'ASML étaient solides à tous égards. Des ventes T3 de 11,7 milliards d'euros, un résultat net de 5,0 milliards et une marge brute de 57,5 %. L'entreprise a livré 113 systèmes de lithographie, contre 86 le trimestre précédent. Elle prévoit entre 14,2 et 15,2 milliards d'euros au T4, et entre 44 et 45 milliards de ventes sur l'ensemble de 2026.

La phrase la plus parlante n'était pas un chiffre. ASML a indiqué que ses clients discutent déjà de leurs besoins en équipements pour 2029 et 2030.

Les délais de livraison des outils de lithographie se comptent en années, donc les discussions sont toujours précoces. Mais parler de capacité pour 2030 en octobre 2026 signifie que les fabricants jugent la courbe de demande actuelle de l'IA assez durable pour justifier des usines qui ne produiront pas un wafer avant trois ou quatre ans. Cette conviction est le véritable actif derrière chaque plan d'investissement IA du secteur, et le carnet de commandes d'ASML est l'endroit où elle se paie en premier.

---

## L'accord sur les interposeurs : peu d'argent, un signal fort

Avec 2 milliards de dollars sur cinq ans, l'accord entre GlobalFoundries et TSMC est modeste à l'échelle de l'IA. Il compte pour trois raisons.

1. **C'est la première source américaine d'interposeurs CoWoS.** Aujourd'hui, un accélérateur conçu aux États-Unis et gravé sur les wafers de pointe de TSMC en Arizona doit encore repartir à Taïwan pour être assemblé. L'accord de Malta commence à boucler la boucle, au moins pour l'interposeur.
2. **Il utilise un procédé mature.** Les interposeurs n'ont pas besoin d'un nœud de pointe. Il leur faut de grandes pièces de silicium sans défaut avec un câblage fin. GlobalFoundries, qui s'est retirée de la course à la pointe il y a des années, dispose précisément de ce type de capacité. C'est une réutilisation habile d'une usine existante pour la partie la plus contrainte de la chaîne IA.
3. **Il ne termine pas le travail.** Les analystes ont vite souligné que les interposeurs seuls ne créent pas une ligne CoWoS américaine. L'assemblage final, les tests et l'approvisionnement en HBM sont des opérations distinctes, chez des fournisseurs distincts. Aucune des deux entreprises n'a nommé de client final ni détaillé les 2 milliards.

La production en volume démarre au premier semestre 2028. Autrement dit, les accélérateurs que Broadcom, Nvidia et les hyperscalers prévoient de déployer en 2028 pourraient être les premiers à porter un interposeur « fabriqué à New York ».

---

## Les 21 milliards du Japon : la politique industrielle par accord douanier

Le financement japonais relève d'une autre logique. GlobalFoundries a indiqué que le Japon apportera jusqu'à 21 milliards de dollars pour deux usines 300 mm à Malta. Environ 10 milliards accélèrent la première, prévue pour 2029. Une dizaine de milliards supplémentaires pourraient financer une seconde, avec une décision attendue avant fin 2028.

L'argent provient de l'engagement plus large du Japon d'investir 550 milliards de dollars aux États-Unis, conclu dans le cadre de l'accord douanier avec l'administration Trump. Le gouvernement américain prendra aussi une participation supplémentaire, portant sa part dans GlobalFoundries à environ 7 %, selon son PDG Tim Breen. Renesas et Apple sont cités comme premiers clients attendus.

| Caractéristique | Ce qu'elle révèle |
| --- | --- |
| Le Japon apporte tout le capital | Les gouvernements alliés paient désormais directement des capacités de fabrication américaines |
| Les États-Unis prennent des actions, pas seulement des subventions | Washington passe du subventionnement des fabricants à la détention d'une partie d'entre eux |
| Les aides fédérales antérieures sont redirigées ailleurs | Le modèle de financement de l'ère CHIPS est remplacé, pas complété |
| Parmi les clients, un fabricant de puces automobiles et Apple | Ces usines produisent des puces matures et spécialisées, celles qui ont provoqué la pénurie automobile de 2021 |

Ce ne sont pas des usines d'accélérateurs IA. Ce sont les usines qui produisent les puces de gestion d'énergie, les microcontrôleurs et les composants radio dont chaque serveur, voiture et téléphone a aussi besoin. La leçon de 2021, c'est qu'une puce à 5 dollars peut immobiliser une voiture à 50 000. La leçon de 2026, c'est qu'elle peut aussi immobiliser un rack IA à 3 millions.

---

## Où se trouve désormais le goulet d'étranglement

| Couche | Contrainte en 2024 et 2025 | Contrainte fin 2026 |
| --- | --- | --- |
| Lithographie | Disponibilité des outils EUV | Outils disponibles, mais les commandes s'étendent jusqu'en 2030 |
| Wafers de pointe | Capacité N3 et N2 de TSMC | Toujours tendue ; chiffre d'affaires de TSMC en hausse de plus de 50 % sur un an |
| Packaging avancé | Capacité CoWoS à Taïwan | Toujours tendue ; premiers interposeurs américains seulement en 2028 |
| Mémoire | Approvisionnement en HBM | Tendue partout ; critique en Chine sous contrôles à l'exportation |
| Puces matures | Globalement correct | Nouvelles usines financées, mais pas opérationnelles avant 2029 |
| Électricité et bâtiments | Préoccupation émergente | Souvent la contrainte qui bloque réellement le déploiement |

Si vous construisez des produits IA, rien de tout cela ne change votre sprint. Cela change en revanche vos hypothèses de planification. L'approvisionnement matériel pour 2027 est en grande partie déjà réservé. Les nouvelles capacités, en packaging et en usines matures, arrivent en 2028 et 2029. Le prix du calcul a plus de chances de rester ferme que de s'effondrer, ce qui concorde avec ce que nous avons vu ce trimestre dans les prix des modèles et sur le marché chinois des puces.

---

## Ce qui reste

Quelque part à Malta, dans l'État de New York, il y a une usine qui commencera à fabriquer des interposeurs en 2028, à côté d'un terrain où deux autres usines pourraient exister en 2029, en partie détenues par le gouvernement américain et payées par le Japon.

C'est un drôle d'endroit pour que l'histoire de l'IA arrive. Pas de modèles, pas d'agents, pas de benchmarks. Juste une pièce plate de silicium couverte de fils très fins, qui se révèle être l'une des choses que toute l'industrie attendait.

---

## Sources

* [Top Tech News Today, October 14, 2026 (TechStartups, avec lien vers les relations investisseurs d'ASML)](https://techstartups.com/2026/10/14/top-tech-news-today-october-14-2026-apple-asml-google-openai-microsoft-nvidia-more/)
* [Top Tech News Today, October 8, 2026 (TechStartups, avec lien vers le chiffre d'affaires de TSMC)](https://techstartups.com/2026/10/08/top-tech-news-today-october-8-2026-globalfoundries-google-manus-microsoft-nvidia-openai-tencent-more/)
* [GlobalFoundries signs $2bn five-year deal with TSMC for advanced packaging components (DatacenterDynamics)](https://datacenterdynamics.com/en/news/globalfoundries-signs-2bn-five-year-deal-with-tsmc-for-production-of-advanced-packaging-components)
* [GlobalFoundries and TSMC sign U.S. manufacturing deal for AI packaging (HPCwire)](https://hpcwire.com/off-the-wire/globalfoundries-and-tsmc-sign-us-manufacturing-deal-for-ai-packaging)
* [Japan to invest up to $21 billion in two US chip factories to be run by GlobalFoundries (Korea Times / Reuters)](https://www.koreatimes.co.kr/world/20261014/japan-to-invest-up-to-21-billion-in-two-us-chip-factories-to-be-run-by-globalfoundries)
* [Japan puts up to $21bn into two GlobalFoundries chip fabs in New York (The Next Web)](https://thenextweb.com/news/globalfoundries-japan-21bn-new-york-fabs-us-stake)
* À lire aussi : [Le boom XPU de Broadcom](/blog/fr/broadcom-custom-ai-accelerators-xpu) et [Les hausses de prix de DeepSeek et la revalorisation de l'IA chinoise](/blog/fr/deepseek-price-hikes-china-ai-repricing)
