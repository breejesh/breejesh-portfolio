---
title: "Tout le monde facture 2 et 10 dollars : la guerre des prix des modèles de pointe s'est soldée par un match nul, et s'est déplacée là où on la voit moins"
description: "Claude Sonnet 5.5, Gemini 4 Argon et GPT-6.1 Sol d'OpenAI se sont tous posés autour de 2 dollars le million de tokens en entrée et 10 en sortie. Haiku 5.5 est descendu à 0,10. Les vraies différences de prix se cachent désormais dans les niveaux d'effort, les tokeniseurs, les seuils de contexte et les périodes promotionnelles."
date: "2026-10-14"
tags: [IA et Machine Learning, Économie Tech et Finance]
coverImage: /assets/images/frontier-model-price-convergence.webp
previewImage: /assets/images/frontier-model-price-convergence.webp
---

> **TL;DR**
> * **Le déclencheur :** Entre le 22 septembre et le 13 octobre, Anthropic a livré Opus 5.5, Sonnet 5.5 et Haiku 5.5, OpenAI a fait passer ChatGPT à GPT-6 et a référencé GPT-6.1 Sol dans son API, et Google a rendu Gemini 4 Argon disponible pour tous. Le segment des modèles de travail a convergé vers environ 2 dollars le million de tokens en entrée et 10 en sortie.
> * **Le mécanisme :** Quand les prix catalogue sont identiques, les fournisseurs se battent sur les parties de la facture les plus difficiles à comparer : tokens par tâche, niveaux d'effort, changements de tokeniseur, surcoûts de contexte long, prix du cache et tarifs de lancement qui expirent. Le prix de Gemini 4 Argon double après le 30 novembre. Celui de Haiku 5.5 est multiplié par 5 au-delà de 100 000 tokens.
> * **La perspective :** Le prix par token ne permet plus de comparer. Les équipes qui choisissent un modèle sur sa grille tarifaire paieront trop. Celles qui mesurent le coût par tâche menée à bien sur leurs propres charges, et remesurent après chaque mise à jour, non.

J'ai ouvert quatre pages de tarifs cette semaine, et j'ai eu l'étrange impression de voir les deux mêmes chiffres sur trois d'entre elles.

2 dollars le million de tokens en entrée. 10 dollars le million de tokens en sortie.

Claude Sonnet 5.5. Gemini 4 Argon, à son prix de lancement. Et, selon les traqueurs de prix, GPT-6.1 Sol d'OpenAI. Trois laboratoires qui ont passé deux ans à se casser les prix ont abouti, pour leurs principaux modèles de travail, à la même grille.

Cela ne veut pas dire que la guerre des prix est finie. Cela veut dire qu'elle a déménagé.

---

## Les grilles tarifaires, côte à côte

| Modèle | Sortie | Entrée / Sortie (par million de tokens) | Remarques |
| --- | --- | --- | --- |
| Claude Fable 5.1 | Plus tôt en 2026 | 10 $ / 50 $ | Le haut de gamme d'Anthropic |
| GPT-6 Astra | 3 sept. | 10 $ / 50 $ | Premier modèle « Critical » en cyber ; tâches offensives restreintes |
| Claude Opus 5.5 | 22 sept. | 4 $ / 20 $ | En baisse depuis 5 $ / 25 $ ; lectures de cache à 0,20 $ (contre 0,50 $) ; mode rapide 8 $ / 40 $ |
| Claude Sonnet 5.5 | 28 sept. | 2 $ / 10 $ | Même prix catalogue que Sonnet 5 ; Anthropic annonce jusqu'à 30 % de moins par tâche |
| GPT-6.1 Sol | Fin sept. | 2 $ / 10 $ (selon les traqueurs de prix) | Contexte de 1,1 M rapporté |
| Gemini 4 Argon | Disponible le 13 oct. | 2 $ / 10 $ en lancement, puis 4 $ / 20 $ dès le 1er déc. | Entrée en cache 95 % moins chère ; jusqu'à 1 M de tokens |
| Gemini 3.8 Flash | 3 sept. | 0,75 $ / 3,75 $ | Prix de lancement jusqu'au 31 déc. |
| Claude Haiku 5.5 | 7 oct. | 0,10 $ / 0,50 $ sous 100 K tokens ; 0,50 $ / 2,50 $ au-delà | Contexte de 1 M, sortie de 128 K ; lectures de cache de Sonnet 5.5 divisées par deux le même jour |

Les gammes sont désormais évidentes. Une gamme premium à 10 $ / 50 $, de plus en plus réservée selon l'identité pour les capacités les plus sensibles. Une gamme de travail autour de 2 $ / 10 $. Une gamme économique de 0,10 à 0,75 $ en entrée. Opus d'Anthropic se place entre les deux premières, et c'est un choix délibéré : assez proche du prix de travail pour que les gros utilisateurs arrêtent de le contourner.

---

## Où se trouve désormais le vrai prix

Si l'étiquette est la même, la facture ne l'est pas. Voici où les écarts se sont déplacés.

### 1. Les tokens par tâche

L'argument d'Anthropic pour Sonnet 5.5 n'est pas un tarif plus bas. C'est que le modèle termine le même travail avec moins de tokens, donc qu'on paie jusqu'à 30 % de moins par tâche. C'est un effet réel quand il se vérifie. Mais des évaluateurs indépendants ont relevé le revers : au niveau d'effort maximal, le modèle atteint les meilleurs scores en dépensant beaucoup plus de tokens, et la facture peut monter au lieu de baisser. Une analyse estime que le seul réglage d'effort peut faire varier le coût d'un facteur vingt.

### 2. Niveaux d'effort et réglages par défaut

L'affirmation selon laquelle Opus 5.5 est « environ 40 % moins cher à faire tourner qu'Opus 5 » compare chaque modèle à son effort par défaut, moyen pour Opus 5.5 et élevé pour Opus 5. Les victoires sur les benchmarks, elles, ont été annoncées à effort maximal. Les deux affirmations peuvent être vraies. Elles décrivent simplement des produits différents.

### 3. Les tokeniseurs

Une analyse de Haiku 5.5 a montré que son nouveau tokeniseur compte le même texte comme environ 30 % de tokens en plus que Haiku 4.5. Un prix 75 % plus bas sur 30 % de tokens en plus reste une forte baisse, mais ce n'est pas celle du titre. Chaque fois qu'un fournisseur change de tokeniseur, votre comparaison par token se casse sans bruit.

### 4. Seuils et paliers

* Haiku 5.5 coûte 5 fois plus cher par token pour les prompts de plus de 100 K tokens.
* Les 2 $ / 10 $ de Gemini 4 Argon sont un prix de lancement. Après le 30 novembre, ils passent à 4 $ / 20 $ pour le modèle public.
* Le prix de Gemini 3.8 Flash est un prix de lancement jusqu'au 31 décembre.

Si vous faites vos benchmarks en octobre pour un système qui tournera en janvier, vous évaluez un prix qui n'existera plus.

### 5. Le prix du cache

Pour les charges d'agents qui relisent la même base de code ou le même corpus, le prix de lecture du cache compte plus que le prix d'entrée. Anthropic a réduit de 60 % les lectures de cache d'Opus 5.5 et divisé par deux celles de Sonnet 5.5. Google facture l'entrée en cache d'Argon 95 % moins cher que l'entrée fraîche. Pour un agent de programmation qui tourne longtemps, ces chiffres dominent la facture.

---

## Pourquoi cette convergence

Plusieurs forces ont poussé la gamme de travail vers le même point au même moment :

* **Une économie matérielle commune.** Les laboratoires achètent des accélérateurs comparables, chez Nvidia ou en silicium sur mesure fabriqué par Broadcom, à des prix comparables, avec les mêmes contraintes de HBM. Les coûts de service convergent, donc les prix aussi.
* **Les achats des grandes entreprises.** Les gros clients utilisent de plus en plus des routeurs multi-modèles. Un modèle 30 % plus cher que ses pairs à qualité égale perd tout simplement du trafic.
* **La gamme premium porte la marge.** Avec les capacités les plus avancées réservées (Daybreak chez OpenAI, Fairwind chez Google, et Mythos 5.1 d'Anthropic, ouvert le 6 octobre aux seuls défenseurs cyber et chercheurs en sciences du vivant vérifiés), l'accès le plus précieux se vend sur la confiance et l'identité, pas sur le prix par token.
* **L'échelle grand public.** ChatGPT compte désormais plus de 1,2 milliard d'utilisateurs hebdomadaires, et GPT-6 Sol et Luna ont été déployés pour les utilisateurs gratuits comme payants la première semaine d'octobre. Quand le produit grand public est le canal de distribution, le prix de l'API devient moins un centre de profit qu'un point de référence.

---

## Comment je choisirais un modèle ce trimestre

| Question | Pourquoi c'est plus important que la grille tarifaire |
| --- | --- |
| Quel est le coût par tâche *menée à bien* sur mon jeu d'évaluation ? | Réunit tokens par tâche, nouvelles tentatives et échecs en un seul chiffre |
| À quel niveau d'effort ? | Le même modèle peut être l'option la moins chère ou la plus chère selon ce réglage |
| Combien de mes prompts dépassent 100 K tokens ? | Les surcoûts de contexte long peuvent dominer une charge RAG ou d'agents |
| Quel est mon taux de succès du cache ? | Pour les agents, le prix de lecture du cache compte souvent plus que le prix d'entrée |
| Quand le prix de lancement prend-il fin ? | Budgétez le prix que vous paierez, pas celui que vous avez testé |
| Le tokeniseur a-t-il changé ? | Refaites la mesure après chaque mise à jour de modèle, même au sein d'une famille |

Le schéma du routeur est le bon réglage par défaut. Envoyez l'essentiel du trafic vers un modèle économique, escaladez vers un modèle de travail quand l'économique échoue à un contrôle qualité, et gardez la gamme premium pour la petite part de tâches où elle change le résultat. Puis mesurez chaque mois, car les fournisseurs, eux, le feront.

---

## Ce qui reste

Il y a quelque chose de presque drôle à voir trois concurrents atterrir sur 2 et 10 dollars. On dirait la paix.

Ce n'en est pas une. Le combat s'est juste déplacé dans les notes de bas de page : un tokeniseur, un effort par défaut, un seuil à 100 000 tokens, une date de fin au 30 novembre. Le modèle le moins cher est désormais celui dont on lit vraiment les notes de bas de page.

---

## Sources

* [Claude Opus 5.5 launch and price cut (BetaNews)](https://betanews.com/article/claude-opus-5-5-launch-price-cut/)
* [Claude Opus 5.5: benchmarks, pricing and real costs (MetricNexus)](https://metricnexus.ai/blog/claude-opus-5-5-benchmarks-pricing)
* [Claude Sonnet 5.5: benchmarks, pricing and real costs (MetricNexus)](https://metricnexus.ai/blog/claude-sonnet-5-5-benchmarks-pricing)
* [Reading the Claude Haiku 5.5 price table (BrainDetox)](https://braindetox.kr/en/posts/claude_haiku_5_5_release_pricing_2026.html)
* [Introducing Gemini 4 Argon (Google)](https://blog.google/intl/en-in/products/introducing-gemini-4-argon/)
* [GPT-6.1 Sol pricing (AnotherWrapper)](https://anotherwrapper.com/llm-pricing/gpt-6.1-sol)
* [OpenAI launches GPT-6 with Intelligent UI (TechStartups)](https://techstartups.com/2026/10/07/openai-launches-gpt-6-with-intelligent-ui-turning-chatgpt-into-an-interactive-visual-experience/)
* [Top Tech News Today, October 8, 2026 (TechStartups)](https://techstartups.com/2026/10/08/top-tech-news-today-october-8-2026-globalfoundries-google-manus-microsoft-nvidia-openai-tencent-more/)
* À lire aussi : [Gemini 3.8 Flash et Flash Cyber](/blog/fr/gemini-3-8-flash-cyber)
