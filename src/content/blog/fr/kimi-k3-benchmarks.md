---
title: "Kimi K3 derrière le hype : est-ce vraiment un tueur de Fable 5 ?"
description: "Derrière le hype Kimi K3 : benchmarks Artificial Analysis, LMArena et Moonshot face à Claude Fable 5. Spoiler : fort modèle open, pas un tueur net de Fable 5."
date: 2026-07-19
tags: [IA, LLM, Benchmarks, Kimi, Moonshot AI]
coverImage: /assets/images/kimi-k3-cover.webp
previewImage: /assets/images/kimi-k3-cover.webp
---

Le timeline a traité **Kimi K3** comme l'enterrement de **Claude Fable 5**. Un modèle open 2,8T, #1 sur une arena coding, scores d'intelligence près de la frontière. Puis les posts "la Chine ferme la frontière".

Alors : K3 est-il vraiment un tueur de Fable 5 ?

**Non.** Pas en capacité globale. Moonshot admet que K3 reste derrière **Claude Fable 5** et **GPT-5.6 Sol**. Les boards indépendants le placent près de la classe Opus, pas au-dessus de Fable. Sur quelques boards coding, il frappe fort. Sur le prix, la vitesse et la verbosité, ce n'est pas de la puissance gratuite.

La suite, ce sont les preuves : scores vendor vs indépendants, et là où le hype dépasse les données. Les boards live à bookmarker sont en fin d'article.

### Ce qu'est vraiment Kimi K3

D'après le [post de lancement Moonshot](https://www.kimi.com/blog/kimi-k3) :

- **2,8T de paramètres** au total, positionné open de classe 3T
- **Stable LatentMoE** : 896 experts, **16 actifs par token**
- **Kimi Delta Attention (KDA)** et **Attention Residuals** pour les longues séquences et la profondeur
- **Multimodal natif** : texte + image (workflows vidéo et screenshots dans les demos produit)
- Contexte de **1 048 576 tokens**, tarif API plat sur toute la fenêtre
- Environ **2,5x d'efficacité de scaling** vs Kimi K2, selon Moonshot
- Notes train/serving : poids MXFP4 avec activations MXFP8, supernode recommandé de **64+ accélérateurs** pour le self-hosting

Tarifs API au lancement : **0,30 $ / 1M input cache hit**, **3,00 $ / 1M input cache miss**, **15,00 $ / 1M output**. Moonshot indique souvent **plus de 90% de cache hits** sur son stack coding.

C'est cher pour un lab chinois, plus proche des tiers occidentaux mid-high que des anciens tarifs Kimi. Le pari : le coding long horizon et le knowledge work amortissent la facture tokens.

### Benchmarks indépendants (pas les slides vendor)

#### Artificial Analysis Intelligence Index

[Artificial Analysis](https://artificialanalysis.ai/models/kimi-k3/) reste la photo tierce publique la plus propre juste après le lancement.

| Métrique | Valeur rapportée (AA) | Notes |
| --- | --- | --- |
| Intelligence Index v4.1 | **57** | Environ **#4 sur 186** modèles dans le ranking de classe AA |
| Vitesse de sortie | **~36,9 tokens/s** | Nettement lent vs médiane des pairs |
| Prix input / output | **3 $ / 15 $** par 1M tokens | Cache hit input **0,30 $** |
| Verbosité d'éval | **~130M** tokens de sortie sur la run d'index | Bien au-dessus d'une médiane ~63M |
| Fenêtre de contexte | **1M** tokens | Input multimodal texte + image |
| Coût total d'éval | environ **2,7 k$** pour la suite d'index | L'usage de tokens pousse le coût |

L'index v4.1 mélange neuf évals, dont GDPval-AA v2, Terminal-Bench v2.1, SciCode, Humanity's Last Exam, GPQA Diamond, CritPt, AA-Omniscience et AA-LCR. La méthodologie complète est sur [Artificial Analysis](https://artificialanalysis.ai/methodology/intelligence-benchmarking).

**Comment lire le graphique :** ouvrez la [section Intelligence de Kimi K3](https://artificialanalysis.ai/models/kimi-k3/#intelligence) et le [scatter coût par tâche](https://artificialanalysis.ai/models/kimi-k3/) sur la même page. La capacité est frontière-adjacente. L'efficacité n'est pas gratuite.

Les couvertures de lancement placent aussi K3 à peu près au niveau de **Claude Opus 4.8** et **GPT-5.5** sur cet index, et derrière **Claude Fable 5** et **GPT-5.6 Sol**. Cela colle à la ligne de Moonshot.

#### Vals Index

[Vals](https://www.vals.ai/models/kimi_kimi-k3) liste Kimi K3 à **74,70% ± 0,96** sur le Vals Index (release datée du 16 juillet 2026), avec 1M de contexte. Vals est une suite enterprise séparée : ne mélangez pas le 74,7 avec le 57 d'AA comme s'ils partageaient la même échelle.

#### LMArena Frontend Code Arena

Après unblinding, K3 a débuté **#1 sur le Frontend Code Arena de LMArena à 1679 Elo**, devant Claude Fable 5 sur ce board, avec un gros saut depuis Kimi K2.6. Les récits sont dans la [note BenchLM](https://benchlm.ai/blog/posts/kimi-3-release-data-coming-soon) et le [billet de Simon Willison](https://simonwillison.net/2026/Jul/16/kimi-k3/).

Un board de préférence n'est pas toute la frontière. C'est tout de même un signal public fort pour le frontend et l'UI, aligné avec les demos "vision in the loop" de Moonshot.

### Scores coding Moonshot (vendor-reported)

Ces chiffres viennent de la [table de benchmarks officielle](https://www.kimi.com/blog/kimi-k3#full-benchmark-table). La plupart des lignes K3 ont été jouées avec le harness **Kimi Code** à effort de raisonnement max. Les autres modèles utilisent souvent leur meilleur harness (Claude Code, Codex, Terminus). Lisez cela comme une preuve produit, pas un bake-off pur de modèles.

Graphiques officiels de lancement (suite auto-déclarée) :

![Graphique officiel de comparaison des benchmarks Kimi K3 (Moonshot AI)](https://kimi-file.moonshot.cn/prod-chat-kimi/kfs/4/2/2026-07-16/1d9chlgn6rtp4tqfnnmjg?x-tos-process=image%2Fauto-orient%2C1%2Fstrip%2Fignore-error%2C1)

*Source : [Moonshot AI, Kimi K3: Open Frontier Intelligence](https://www.kimi.com/blog/kimi-k3)*

![Deuxième graphique officiel de comparaison Kimi K3 (Moonshot AI)](https://kimi-file.moonshot.cn/prod-chat-kimi/kfs/4/2/2026-07-16/1d9chlbnf2ena6205244g?x-tos-process=image%2Fauto-orient%2C1%2Fstrip%2Fignore-error%2C1)

*Source : [post de lancement Moonshot AI](https://www.kimi.com/blog/kimi-k3)*

| Benchmark | Kimi K3 | Ce qu'il mesure | Board public / notes |
| --- | --- | --- | --- |
| Terminal-Bench 2.1 | **88,3** | Tâches terminal agentiques | Croiser avec [AA Terminal-Bench](https://artificialanalysis.ai/evaluations/terminalbench-v2-1) |
| FrontierSWE | **81,2** dominance | SWE / research difficile | [frontierswe.com](https://www.frontierswe.com/) (K3 peut retarder l'affichage public) |
| ProgramBench | **77,8** raw pass rate | Reconstruire des programmes depuis binaire + docs | [programbench.com](https://programbench.com/) / [Vals ProgramBench](https://www.vals.ai/benchmarks/programbench) |
| DeepSWE | **67,5** (Kimi Code) ; **67,3** mini-SWE-agent | Fix d'issues multi-repo frais | [deepswe.datacurve.ai](https://deepswe.datacurve.ai/) |
| SWE Marathon | **42,0** | Travail projet multi-heures | [swe-marathon.org](https://www.swe-marathon.org/) |

Nuances utiles si vous achetez pour une équipe :

1. **Raw pass rate ≠ fully resolved.** Le 77,8 de ProgramBench est un taux au niveau des tests, pas "77,8% des programmes entièrement reconstruits".
2. **Le harness fait partie du score.** Moonshot prévient que K3 est sensible à l'**historique de thinking préservé**. Sans lui, la qualité peut vaciller.
3. **La dominance est une proba de victoire pairwise**, pas un pourcentage de tâches terminées.
4. Plusieurs lignes K3 ont été jouées par le vendor avant le refresh de chaque board owner. Privilégiez les pages indépendantes dès qu'elles se mettent à jour.

### Coût, vitesse et appétit en tokens

Mesures indépendantes et retours terrain convergent :

- Score d'intelligence fort, **decode lent** (classe ~37 t/s chez AA)
- **Forte verbosité** sur les evals dures (plus de tokens de sortie que la médiane)
- Coût par tâche Intelligence Index compétitif avec **GPT-5.6 Sol** dans certains récits, moins cher que des tiers Claude max lourds, mais ce n'est pas du "open model low-cost"
- Les cache hits comptent énormément : 0,30 $ vs 3,00 $ en input, soit un facteur 10x sur le contexte repo répété

Sur des chats courts, K3 peut paraître cher et trop proactif. Sur des agents coding multi-heures avec préfixes stables et bon reuse de cache, la facture change.

### Vision native et travail long horizon

K3 est multimodal par design. Les case studies Moonshot poussent l'optimisation de kernels, le travail compilateur, les boucles jeu/UI avec screenshots live, des sandboxes chip design et des pipelines research-to-code. Ce sont des demos, pas des leaderboards. Elles expliquent quand même le pitch : sessions longues, tools, feedback visuel, moins de babysitting.

Côté produit, Moonshot liste [kimi.com](https://www.kimi.com/), [Kimi Work](https://www.kimi.com/products/kimi-work), [Kimi Code](https://www.kimi.com/code) et l'[API Kimi](https://platform.kimi.ai/) (`kimi-k3`).

### Qui devrait s'y intéresser maintenant

**Un pilot a du sens si vous :**

- Avez besoin d'agents coding long horizon sur de gros repos
- Voulez une qualité proche de la frontière avec un chemin vers le **self-host des poids** après le 27 juillet
- Travaillez surtout le frontend / UI, où Arena a déjà placé K3 premier
- Pouvez mesurer le **coût par PR accepté**, pas seulement le coût par million de tokens

**Ce n'est probablement pas votre default si vous :**

- Avez besoin de chat basse latence ou de completions cheap à haut QPS
- Ne tolérez pas des agents proactifs qui improvisent sur des tâches ambiguës
- Avez besoin cette semaine de boards indépendants same-harness pour le procurement

### Résumé honnête

Kimi K3 n'a pas couronné un nouveau #1 mondial. Il a fait quelque chose de plus intéressant pour les builders : compresser l'écart **open vs closed** à quelques mois, mettre des poids open de classe 3T au calendrier, et montrer un coding agent compétitif pendant que des labs indépendants le placent encore juste derrière Fable 5 et GPT-5.6 Sol.

Trois marqueurs concrets à suivre :

1. Release des poids du 27 juillet (licence, checkpoints, stack de serving)
2. Boards indépendants publiant K3 avec traces, coûts et intervalles de confiance
3. Votre propre bake-off : harness fixe, budget fixe, vrais repos

### Graphiques et boards en direct

Gardez ces liens pour les chiffres à jour, pas une capture figée dans ce billet. Les graphiques clés sont aussi liés plus haut, à côté des scores qu'ils soutiennent.

| Graphique / board | Ce qu'il montre | Lien |
| --- | --- | --- |
| Page modèle Artificial Analysis | Intelligence Index, vitesse, prix, coût par tâche, usage tokens | [artificialanalysis.ai/models/kimi-k3](https://artificialanalysis.ai/models/kimi-k3/) |
| Accueil Artificial Analysis | Qualité, prix et vitesse entre modèles | [artificialanalysis.ai](https://artificialanalysis.ai/) |
| Terminal-Bench 2.1 (AA) | Résultats indépendants de coding terminal agentique | [artificialanalysis.ai/evaluations/terminalbench-v2-1](https://artificialanalysis.ai/evaluations/terminalbench-v2-1) |
| Page Vals | Vals Index et suite enterprise / coding | [vals.ai/models/kimi_kimi-k3](https://www.vals.ai/models/kimi_kimi-k3) |
| DeepSWE | Réparation d'issues sur des repos frais | [deepswe.datacurve.ai](https://deepswe.datacurve.ai/) |
| FrontierSWE | Tâches dures d'implémentation / perf / recherche | [frontierswe.com](https://www.frontierswe.com/) |
| ProgramBench | Reconstruire des programmes à partir du comportement + docs | [programbench.com](https://programbench.com/) |
| SWE Marathon | Ingénierie multi-heures à l'échelle projet | [swe-marathon.org](https://www.swe-marathon.org/) |
| Post de lancement Moonshot | Architecture et table complète des scores | [kimi.com/blog/kimi-k3](https://www.kimi.com/blog/kimi-k3) |
| Route OpenRouter | Tarifs API live et routage providers | [openrouter.ai/moonshotai/kimi-k3](https://openrouter.ai/moonshotai/kimi-k3) |

### Sources et crédits

Sources primaires et indépendantes utilisées pour les chiffres et graphiques de ce billet :

1. [Kimi K3: Open Frontier Intelligence](https://www.kimi.com/blog/kimi-k3) : post de lancement Moonshot AI, architecture, tarifs, table complète, graphiques officiels
2. [Kimi K3 sur Artificial Analysis](https://artificialanalysis.ai/models/kimi-k3/) : Intelligence Index, vitesse, prix, verbosité, graphiques de coût
3. [Méthodologie Intelligence Index Artificial Analysis](https://artificialanalysis.ai/methodology/intelligence-benchmarking)
4. [Terminal-Bench 2.1 sur Artificial Analysis](https://artificialanalysis.ai/evaluations/terminalbench-v2-1)
5. [Kimi K3 sur Vals](https://www.vals.ai/models/kimi_kimi-k3) : Vals Index et évals liées
6. [DeepSWE leaderboard](https://deepswe.datacurve.ai/)
7. [ProgramBench](https://programbench.com/)
8. [FrontierSWE](https://www.frontierswe.com/)
9. [SWE Marathon](https://www.swe-marathon.org/)
10. [OpenRouter : moonshotai/kimi-k3](https://openrouter.ai/moonshotai/kimi-k3)
11. [Simon Willison sur Kimi K3](https://simonwillison.net/2026/Jul/16/kimi-k3/) : contexte de lancement, highlights AA, notes API pratiques
12. [BenchLM : note de release Kimi K3](https://benchlm.ai/blog/posts/kimi-3-release-data-coming-soon) : Elo Arena et cadre des index indépendants

Les scores changent quand les boards se rafraîchissent. Préférez les liens de la section graphiques live ci-dessus pour les classements à jour.
