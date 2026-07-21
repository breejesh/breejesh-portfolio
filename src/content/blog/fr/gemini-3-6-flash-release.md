---
title: "Gemini 3.6 Flash : 17 % de tokens en moins, Lite à 350 tok/s, et un spécialiste cyber"
description: "Google sort Gemini 3.6 Flash, 3.5 Flash-Lite et 3.5 Flash Cyber dans CodeMender. Benchmarks, tarifs $1.50/$7.50, 350 tok/s et computer use natif."
date: 2026-07-21
tags: [IA, Gemini, LLM, Google, Benchmarks, Cybersécurité]
coverImage: /assets/images/gemini-3-6-flash-cover.webp
previewImage: /assets/images/gemini-3-6-flash-cover.webp
---

Google a publié trois modèles légers d'un coup : **Gemini 3.6 Flash**, **Gemini 3.5 Flash-Lite** et **Gemini 3.5 Flash Cyber**.

Si vous faites tourner des agents en production, le goulot n'est presque jamais seulement "le modèle est-il assez intelligent ?". C'est souvent la brûlure de tokens, la latence et le coût par tâche finie. Cette sortie vise cette boucle : moins de verbiage, décodage plus rapide, et une variante sécurité pour CodeMender.

Carte rapide des trois :

| Modèle | Rôle | Chiffre clé |
| --- | --- | --- |
| **3.6 Flash** | Cheval de trait (code, multimodal, général) | ~17 % de tokens de sortie en moins vs 3.5 Flash |
| **3.5 Flash-Lite** | Haut débit, volume bon marché | **350** tokens de sortie/s |
| **3.5 Flash Cyber** | Agent sécu dans CodeMender | Scores CyberGym frontière au coût Flash |

---

## Gemini 3.6 Flash : meilleures réponses, moins de bavardage

3.6 Flash remplace 3.5 Flash comme modèle principal code et multimodal. Google ne le vend pas comme un flex de paramètres. Le message, ce sont des runs d'agents plus propres : moins de tokens gaspillés pendant que les outils bouclent.

![Efficacité tokens et concision de Gemini 3.6 Flash sur OSWorld (Google)](https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-3-6-flash__evals__figure-.width-1200.format-webp.webp)

*Source : [Google Blog, annonce Gemini 3.6 Flash](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)*

### Chiffres d'efficacité utiles

* **~17 % de tokens de sortie en moins** sur l'index Artificial Analysis versus 3.5 Flash pour le même travail.
* **Jusqu'à ~65 % de tokens de sortie en moins sur le code** (style DeepSWE), grâce à moins de boucles mortes et d'édits plus serrés.
* **Prix :** **$1.50 / 1M entrée** et **$7.50 / 1M sortie**.

Pour les agents multi-étapes, vous payez moins deux fois : générations plus courtes, et un tarif plus bas sur le reste.

![Gains de Gemini 3.6 Flash sur DeepSWE, MLE Bench et OSWorld (Google)](https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-3-6-flash__evals__quality.width-1200.format-webp.webp)

*Source : [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)*

### Qualité (pas seulement moins cher)

| Benchmark | 3.5 Flash | 3.6 Flash | Ce qu'il mesure |
| --- | --- | --- | --- |
| DeepSWE | 37.0% | **49.0%** | Précision d'édition de code et résolution d'issues |
| MLE Bench | 49.7% | **63.9%** | Workflows d'ingénierie ML |
| OSWorld-Verified | 78.4% | **83.0%** | Computer use et navigation GUI |
| GDPval-AA v2 | 1349 | **1421** | Documents multimodaux et raisonnement |

### Computer use natif côté client

Le computer use devient un outil client de première classe dans l'API Gemini et Gemini Enterprise. Plus besoin d'une pile de wrappers pour lire l'écran, cliquer et piloter une UI.

Google a aussi durci la résistance aux jailbreaks CBRN et cyber-offense, en essayant de ne pas casser les prompts dev normaux.

---

## Gemini 3.5 Flash-Lite : 350 tokens par seconde

Quand le job est le volume et la latence, pas le raisonnement multi-hop profond, **3.5 Flash-Lite** est le SKU volume.

![Positionnement prix/perf de Gemini 3.5 Flash-Lite (Google)](https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-3-5-flash-lite__evals__co.width-1200.format-webp.webp)

*Source : [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)*

* **Vitesse :** **350 tokens de sortie/s** sur l'index Artificial Analysis (le plus rapide de la famille 3.5 cité ici).
* **Prix :** **$0.30 / 1M entrée**, **$2.50 / 1M sortie**.
* **Convient à :** extraction documentaire en masse, agents de recherche à haut QPS, pipelines de reçus, boucles de proto UI serrées.

Face aux anciens Flash-Lite, Google annonce un vrai pas de qualité sans abandonner les réponses sub-seconde sous fort QPS.

---

## Gemini 3.5 Flash Cyber et CodeMender

Trouver et corriger des failles est un problème d'agents avec une courbe de coût moche si chaque étape utilise un géant généraliste.

**3.5 Flash Cyber** est la variante Flash spécialisée sécu qui tourne dans **CodeMender**, la stack d'agents de sécurité code de Google.

![Perf de Gemini 3.5 Flash Cyber dans CodeMender sur CyberGym (Google)](https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-3-5-flash-cyber__evals__c.width-1200.format-webp.webp)

*Source : [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)*

* Plusieurs agents Cyber peuvent tourner en parallèle dans CodeMender : audit, validation, propositions de patch.
* CyberGym est décrit comme niveau frontière au coût Flash.
* Accès limité : partenaires enterprise et gouvernements de confiance via CodeMender ; politique dual-use.

---

## Prix côte à côte

| Modèle | Entrée / 1M | Sortie / 1M | Idéal quand |
| --- | --- | --- | --- |
| **3.6 Flash** | $1.50 | $7.50 | Agent / code / multimodal par défaut |
| **3.5 Flash-Lite** | $0.30 | $2.50 | Débit et jobs de volume |
| **3.5 Flash Cyber** | partner | partner | Agents sécu CodeMender seulement |

Les tarifs Flash publics sont ceux listés par Google. Revérifiez toujours la [page pricing](https://ai.google.dev/pricing) avant de budgéter une flotte.

---

## Disponibilité et la suite annoncée

* **3.6 Flash :** API Gemini, AI Studio, Gemini Enterprise, app grand public Gemini.
* **3.5 Flash-Lite :** API et AI Studio maintenant, déploiement Search mentionné.
* **3.5 Pro :** tests partenaires, sortie publique "bientôt" dans le langage Google.
* **Gemini 4 :** pré-entraînement en cours (déclaration Google, pas de date de ship).

---

## Qui devrait s'en soucier

* **Builders d'agents :** 3.6 Flash est le swap par défaut si les boucles d'outils mangeaient la facture.
* **Pipelines haut QPS :** Flash-Lite à 350 tok/s et $0.30/$2.50 est la voie volume.
* **Équipes sécu déjà sur le chemin enterprise Google :** Cyber + CodeMender est la voie spécialisée, pas un free-for-all public.

Si vous ne testez qu'une chose cette semaine, lancez la même suite d'agents sur 3.5 Flash vs 3.6 Flash et logguez **tokens par tâche finie** plus le taux de réussite. Cet A/B dit souvent plus qu'un graphe de blog.

Annonce complète : [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/).
