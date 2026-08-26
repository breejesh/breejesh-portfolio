---
title: "La stratégie d'Intel à Hot Chips 2026 : les 256 coeurs de Diamond Rapids et le pari sans HBM de Crescent Island"
description: "Intel a dévoilé deux architectures à Hot Chips visant directement l'hégémonie de Nvidia sur les accélérateurs. Diamond Rapids intègre 256 coeurs P en 18A-P pour l'IA agentique. Crescent Island se passe complètement de mémoire HBM, exploitant 480 Go de LPDDR5X pour une inférence refroidie par air à 350W."
date: "2026-08-24"
tags: [Matériel et Semiconducteurs, IA et Machine Learning]
coverImage: /assets/images/intel-hot-chips-2026-diamond-rapids-crescent-island.webp
previewImage: /assets/images/intel-hot-chips-2026-diamond-rapids-crescent-island.webp
---

> **TL;DR**
> * **Diamond Rapids (Xeon 7) :** 256 coeurs de performance Panther Cove, procédé Intel 18A-P, 1.28 Go de cache de dernier niveau (LLC), 16 canaux mémoire DDR5-12800, CXL 3.0, PCIe Gen6. Destiné à l'IA agentique et aux centres de données d'entreprise en 2027.
> * **Crescent Island (Xe3P) :** 32 coeurs Xe, refroidissement par air à 350W, jusqu'à 480 Go de LPDDR5X (sans HBM). Optimisé pour l'efficacité énergétique en tokens par watt sur serveurs standards.
> * **Le pari à contre-courant :** Tandis que le secteur privilégie des accélérateurs à refroidissement liquide dépendants de mémoires HBM coûteuses, Intel cible les 80% de baies de serveurs qui ne seront jamais équipées de circuits liquides.

## Deux architectures pour une même thèse industrielle

Les présentations d'Intel à la conférence Hot Chips 2026 ont exposé une stratégie technique claire : concurrencer l'écosystème d'accélérateurs de Nvidia sur deux segments où son architecture actuelle laisse des opportunités.

Diamond Rapids mise sur la capacité de calcul généraliste : doter le CPU d'une puissance suffisante pour exécuter des flux d'IA agentique qui ne nécessitent pas la puissance matricielle brute d'un GPU, mais requièrent un grand nombre de threads d'exécution, une bande passante mémoire élevée et un accès rapide à de vastes contextes de travail.

Crescent Island privilégie l'efficacité de déploiement : concevoir un accélérateur d'inférence dédié aux baies de serveurs conventionnelles refroidies par air, utilisant de la mémoire LPDDR5X standard plutôt que des modules HBM rares et onéreux, et rivalisant sur le ratio tokens par watt plutôt que sur les capacités de calcul théoriques maximales.

## Diamond Rapids : le processeur comme moteur d'IA

| Caractéristique | Diamond Rapids (Xeon 7) |
|-----------------|------------------------|
| Nombre de coeurs | 256 coeurs P Panther Cove |
| Finesse de gravure | Intel 18A-P (chiplets de calcul) |
| Architecture chiplet | 16 chiplets de 16 coeurs chacun |
| Assemblage | Foveros Direct 3D hybrid bonding + interconnexions UCIe-S |
| Cache de dernier niveau (LLC) | **1.28 Go** |
| Canaux mémoire | 16 canaux DDR5 jusqu'à 12 800 MT/s |
| PCIe | 128 lignes Gen6 |
| CXL | 3.0 |
| Extensions ISA | APX (Advanced Performance Extensions), AMX étendu |
| Lancement prévu | 2027 |

La capacité de 1.28 Go de cache LLC constitue l'élément déterminant de cette conception. À titre de comparaison, cela représente une quantité de mémoire SRAM intégrée supérieure à la mémoire vive totale de certains serveurs. Cette dimension répond aux exigences de l'IA agentique : des charges de travail qui mobilisent de nombreux threads simultanés, maintenant de grands contextes et des états d'appels d'outils. Ces processus sont limités par la latence mémoire plutôt que par la vitesse pure de calcul. Un cache massif réduit les accès à la mémoire DRAM et améliore la réactivité des agents.

L'assemblage met en valeur les capacités de fabrication intégrée d'Intel. Les chiplets de calcul en 18A-P sont fixés sur des dalles de base en Intel 3-T via Foveros Direct, tandis que les dalles d'interconnexion en Intel 3 utilisent le protocole UCIe-S. L'ensemble de la chaîne est produit dans les usines d'Intel sans dépendance envers TSMC.

256 coeurs P sur un seul socket permettent d'exécuter des modèles de taille intermédiaire (7 à 30 milliards de paramètres) directement sur le processeur, évitant ainsi le recours à des cartes accélératrices dédiées pour de nombreux usages d'entreprise.

## Crescent Island : l'accélérateur d'inférence sans HBM

| Caractéristique | Crescent Island |
|-----------------|----------------|
| Architecture | Xe3P |
| Coeurs Xe | 32 (4 blocs de 8) |
| Moteurs vectoriels | 256 au total |
| Accélérateurs matriciels XMX | 256 au total (matrice systolique à 16 niveaux) |
| Registres (GRF) | 1 Mo par coeur |
| Cache L1/SLM | 512 Ko par coeur |
| Cache L2 | 32 Mo unifié |
| Mémoire | **LPDDR5X, jusqu'à 480 Go** (référence : 160 Go) |
| TDP | **350W, refroidissement par air** |
| Formats pris en charge | FP4, MXFP4, FP8, BF16, FP16, FP32, FP64 |
| Format | Carte PCIe standard |

Cette orientation se distingue nettement des choix industriels dominants. Les solutions concurrentes (Nvidia H100/H200/B200, AMD MI300X/MI400) recourent systématiquement à la mémoire HBM. Bien que très rapide (>3 To/s sur H200), la HBM impose des contraintes sévères :

- **Un coût unitaire élevé.** La mémoire HBM4 est facturée 20% à 30% plus cher que la HBM3e, le poste mémoire pouvant dépasser $5 000 par composant.
- **Des goulets d'étranglement d'approvisionnement.** Les capacités d'assemblage CoWoS chez TSMC demeurent limitées à l'échelle mondiale.
- **Des besoins thermiques importants.** Les cartes B200 et MI300X requièrent des systèmes de refroidissement liquide, incompatibles avec la majorité des infrastructures en place sans travaux lourds.

Crescent Island utilise de la mémoire LPDDR5X standard, disponible en volume et environ 5 fois moins chère par gigaoctet. Avec une capacité maximale de 480 Go, elle offre 2.4 fois la mémoire d'un modèle H200 (80 Go HBM3e) à un coût nettement inférieur. Bien que la bande passante soit moindre, de nombreuses opérations d'inférence sont limitées par la capacité de stockage des paramètres et des contextes plutôt que par la vitesse de transfert brute.

Une carte PCIe de 350W s'installe dans un serveur standard sans nécessiter de modification d'infrastructure, offrant une solution adaptée aux entreprises ne disposant pas d'installations de type hyperscale.

## Positionnement concurrentiel

La proposition d'Intel ne vise pas à dépasser Nvidia sur les pointes de calcul brut, mais s'articule autour de deux axes :

**Pour Diamond Rapids :** Proposer une solution CPU capable d'exécuter des flux agentiques grâce à 256 coeurs rapides, 1.28 Go de cache et le support de CXL 3.0 pour adresser de grands volumes de mémoire.

**Pour Crescent Island :** Fournir une carte d'inférence de 350W dotée de 480 Go de LPDDR5X, exploitable dans des infrastructures existantes sans surcoût d'aménagement hydraulique.

Le défi pour Intel réside dans la régularité d'exécution industrielle : les rendements de gravure en 18A-P et la maturité de l'environnement logiciel seront les critères déterminants lors du lancement prévu en 2027.

---

*Données d'architecture issues des présentations Hot Chips 2026 rapportées par TechPowerUp, Tom's Hardware, Serve the Home et TrendForce. Analyse comparative basée sur les caractéristiques publiques des gammes Nvidia et AMD.*
