---
title: "Grok 4.5 à ₹6 500/an : pourquoi SuperGrok bat les plans IA à ₹24k en Inde"
description: "SuperGrok / Grok 4.5 coûte ₹6 500 par an en Inde vs ~₹24 000 pour ChatGPT Plus, Claude Pro et Gemini. Benchmarks Artificial Analysis, graphiques live et crédits."
date: 2026-07-20
tags: [IA, LLM, Grok, SuperGrok, Inde, Prix, Benchmarks, SpaceXAI]
coverImage: /assets/images/grok-4-5-india-value-cover.webp
previewImage: /assets/images/grok-4-5-india-value-cover.webp
---

**₹6 500 par an** pour de l'IA near-frontier. Ou **~₹2 000 par mois** pour ChatGPT Plus, Claude Pro ou Gemini AI Pro.

Si vous payez depuis un compte bancaire personnel en Inde, c'est tout l'argument. SuperGrok avec **Grok 4.5** n'est pas "le meilleur modèle au monde". Les boards indépendants le placent dans le pack high-50s en intelligence, pas au-dessus de Fable 5. Pour freelances, étudiants et indie builders, la métrique utile est **l'intelligence par roupie**.

Voici les maths de coût, puis les preuves [Artificial Analysis](https://artificialanalysis.ai/models/grok-4-5), avec liens graphiques live et crédits sources.

### L'écart de prix en Inde (à partager)

Prix listés courants en Inde mi-2026 (ordre de grandeur ; GST et promos bougent) :

| Plan | Prix Inde | Total annuel | vs SuperGrok |
| --- | --- | --- | --- |
| **SuperGrok (Grok 4.5)** | **₹6 500 / an** | **₹6 500** (~₹542/mois) | baseline |
| ChatGPT Plus | ~₹1 999 / mois | ~₹23 988 | **~₹17 500 de plus** |
| Claude Pro | ~₹2 000 / mois (facturation annuelle) | ~₹24 000 | **~₹17 500 de plus** |
| Google AI Pro (Gemini) | ~₹1 950 / mois | ~₹23 400 | **~₹16 900 de plus** |

SuperGrok, c'est à peu près **un quart** d'un siège consumer occidental. Vous pourriez acheter **deux années complètes** de SuperGrok et encore dépenser moins qu'un an de ChatGPT Plus.

Le listage USD global SuperGrok tourne souvent autour de **$30/mois** ou **$300/an** ([x.ai/pricing](https://x.ai/pricing)). La facturation annuelle Inde à **₹6 500** change l'équation pour qui gagne en roupies. Les tiers power comme ChatGPT Pro (~₹19 900/mois) sont de l'argent carte entreprise.

### Ce qu'est vraiment Grok 4.5

SpaceXAI a livré **Grok 4.5** le **8 juillet 2026**. L'accès consumer passe par SuperGrok : apps/web, limites hautes, raisonnement, vision, Imagine, coding via Grok Build. Des write-ups tiers citent une échelle **~1,5T paramètres** (divulgation lab, pas des poids ouverts).

Tarifs API (hors SuperGrok), via [Artificial Analysis](https://artificialanalysis.ai/models/grok-4-5) :

- **$2 / 1M input**, **$6 / 1M output**
- Cache hit ~**$0,50 / 1M** (-75%)
- Contexte : **500k tokens**
- Multimodal : texte + image in, texte out

### Benchmarks indépendants (pas les slides vendor)

Snapshot public le plus propre : **[Grok 4.5 (high) sur Artificial Analysis](https://artificialanalysis.ai/models/grok-4-5)**.

| Métrique | Valeur (AA, mi-juillet 2026) | Pourquoi ça compte |
| --- | --- | --- |
| Intelligence Index v4.1 | **54** | Bande near-frontier (médiane pairs ~31) |
| Rang de classe | ~**#9 / 187** | Bouge quand de nouveaux modèles arrivent |
| Vitesse de sortie | **~69,6 tokens/s** | Utilisable au quotidien |
| Verbosité d'index | **~60M** tokens de sortie | Près de la médiane (~63M) |
| Coût suite d'index | ~**$602** | Moins cher à évaluer que les max verbeux |
| Contexte | **500k** | Large ; certains rivaux annoncent 1M |

D'après l'[analyse de lancement AA](https://artificialanalysis.ai/articles/grok-4-5-brings-spacexai-to-the-the-intelligence-frontier) :

- **Coding Agent Index : 76** dans Grok Build (au niveau GPT-5.5 Codex, sous Fable 5 Claude Code)
- ~**$0,31** par tâche Intelligence Index
- ~**$2,49-$2,59** par tâche coding agent vs Fable 5 ~$11,80 et GPT-5.5 ~$5,07
- ~**1,9M** tokens par tâche coding vs ~7,2M (Fable 5) et ~6,2M (GPT-5.5)

C'est l'histoire builder : pas toujours le Elo max, mais de bons scores agent **et** une faible consommation de tokens.

#### Graphiques (intégrés + live)

![Graphique intelligence vs coût Grok 4.5 (Artificial Analysis)](https://cdn.sanity.io/images/6vfeftx9/articles/4a57186a3b74c34496fcee3eb85bebe1ecffcfff-4640x4288.png?w=1200&auto=format)

*Source : [Artificial Analysis, analyse de lancement Grok 4.5](https://artificialanalysis.ai/articles/grok-4-5-brings-spacexai-to-the-the-intelligence-frontier)*

![Graphique Coding Agent Index Grok 4.5 (Artificial Analysis)](https://cdn.sanity.io/images/6vfeftx9/articles/9bcd6f1df704ca86d96b2616219bedd487ab091e-4640x3466.png?w=1200&auto=format)

*Source : [Artificial Analysis](https://artificialanalysis.ai/articles/grok-4-5-brings-spacexai-to-the-the-intelligence-frontier)*

| Chart / board live | Ce qu'il montre | Lien |
| --- | --- | --- |
| Page modèle Grok 4.5 | Intelligence Index, vitesse, prix | [artificialanalysis.ai/models/grok-4-5](https://artificialanalysis.ai/models/grok-4-5) |
| Section Intelligence | Leaderboard live | [AA Grok 4.5 #intelligence](https://artificialanalysis.ai/models/grok-4-5#intelligence) |
| Article de lancement AA | Coding agent + Pareto | [AA article](https://artificialanalysis.ai/articles/grok-4-5-brings-spacexai-to-the-the-intelligence-frontier) |
| Terminal-Bench 2.1 | Coding terminal agentique | [AA Terminal-Bench](https://artificialanalysis.ai/evaluations/terminalbench-v2-1) |
| Peer Kimi K3 | Comparaison open-weight | [AA Kimi K3](https://artificialanalysis.ai/models/kimi-k3/) |
| Pricing SpaceXAI | Matrice SuperGrok | [x.ai/pricing](https://x.ai/pricing) |

### Position face aux rivaux

| Modèle | AA Index (approx.) | Angle consumer Inde |
| --- | --- | --- |
| Classe Claude Fable 5 / GPT-5.6 Sol | au-dessus de 54 | Pic frontière fermée ; argent Max/Pro |
| Kimi K3 | **57** | Open-weight fort ; pas un substitut SuperGrok à ₹6,5k |
| **Grok 4.5 (high)** | **54** | Chemin SuperGrok + API abordable |
| Classe Opus 4.8 / GPT-5.5 | bande mid-50s au lancement Grok | Le voisinage où Grok a été mesuré |

### Coût par année utile

- SuperGrok seul : **₹6 500**/an
- Plus / Claude Pro / Gemini seuls : **~₹23k-₹24k**/an
- Plus + Claude : **~₹48 000**/an
- SuperGrok + free tiers : **₹6 500** + quotas free

Si vous payez **₹2 000/mois** aujourd'hui, SuperGrok à **₹6 500/an** libère ~**₹1 450/mois**.

### Où ce n'est pas automatique

1. **Écosystème.** ChatGPT pour les GPTs. Gemini pour Docs/Drive/Gmail. Claude pour la prose longue.
2. **Elo coding de pointe.** Fable 5 reste devant sur le Coding Agent Index.
3. **Hallucinations.** AA a noté plus d'accuracy *et* plus d'hallucinations vs Grok précédent.
4. **Contexte.** 500k est large ; certains annoncent 1M.
5. **Les prix bougent.** Revérifiez le checkout.

### Qui devrait acheter en Inde

**Oui si** vous payez sur revenu personnel, voulez chat et coding near-frontier sans taxe à ₹2k/mois, et allez utiliser un modèle payant principal pendant 12 mois.

**Non si** vous avez besoin d'IA Google Workspace toute la journée, êtes déjà remboursé Plus/Claude, ou n'ouvrez l'app que deux fois par semaine.

### En bref

Grok 4.5 n'est **pas** Fable 5 gratuit. Les boards le placent near-frontier : **Intelligence Index 54**, **Coding Agent Index 76** dans Grok Build, avec une forte **efficacité coût/tokens**.

Pour les Indiens qui paient de leur poche, **₹6 500 par an**, c'est environ **un quart** de ChatGPT Plus, Claude Pro ou Gemini AI Pro aux prix listés courants. En IA grand public 2026, un tel écart de prix est rare.

Si votre métrique est **l'intelligence utile par roupie**, SuperGrok est l'un des oui les plus faciles. Confirmez le checkout, utilisez-le un mois de vrai travail, et ne gardez un second siège payant que si un écosystème vous y force.

### Sources et crédits

1. [Grok 4.5 (high) sur Artificial Analysis](https://artificialanalysis.ai/models/grok-4-5)
2. [Grok 4.5 brings SpaceXAI to the intelligence frontier](https://artificialanalysis.ai/articles/grok-4-5-brings-spacexai-to-the-the-intelligence-frontier)
3. [Méthodologie Intelligence Index AA](https://artificialanalysis.ai/methodology/intelligence-benchmarking)
4. [Terminal-Bench 2.1 sur Artificial Analysis](https://artificialanalysis.ai/evaluations/terminalbench-v2-1)
5. [Pricing SpaceXAI](https://x.ai/pricing)
6. [Kimi K3 sur Artificial Analysis](https://artificialanalysis.ai/models/kimi-k3/)
7. Plans consumer Inde (ordre de grandeur INR) : ChatGPT Plus ~₹1 999/mois, Claude Pro ~₹2 000/mois annuel, Gemini AI Pro ~₹1 950/mois
8. SuperGrok annuel Inde utilisé ici : **₹6 500/an**

Images de graphiques issues d'Artificial Analysis (CDN de leur article Grok 4.5). Prix et classements changent. Préférez le checkout live et la page AA pour un achat.
