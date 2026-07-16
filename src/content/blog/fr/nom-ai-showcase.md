---
title: "Présentation de NomAI : le tracker de calories hors ligne propulsé par des LLM locaux"
description: "Un aperçu approfondi de NomAI, la première application de suivi des calories pour Android gratuite, open-source et entièrement hors ligne, construite avec Google Gemma et Jetpack Compose."
date: 2026-07-10
tags: [Android, Gemma LLM, Innovation Mobile, Open Source, Confidentialité]
coverImage: /assets/images/nom-ai-showcase.webp
previewImage: /assets/images/nom-ai-showcase.webp
---

Le suivi des calories est devenu un pilier des parcours de remise en forme modernes. Cependant, presque tous les trackers de calories populaires sur le marché partagent les mêmes frustrations : ils imposent des abonnements mensuels, affichent des publicités constantes, nécessitent une connexion Internet permanente et revendent vos habitudes alimentaires à des courtiers de données tiers.

**NomAI est l'antidote.** C'est le premier tracker de calories pour Android gratuit, open-source et entièrement hors ligne au monde, basé sur une confidentialité absolue et une IA locale de pointe.

* **Dépôt GitHub :** [github.com/breejesh/nom.ai](https://github.com/breejesh/nom.ai)

---

## Les trois piliers de NomAI

NomAI a été conçu dès le départ pour bousculer les modèles de conception standard dans le développement d'applications mobiles, en se concentrant sur trois piliers fondamentaux :

### 1. 100 % gratuit et open-source (FOSS)
Il n'y a pas d'abonnements premium, pas de graphiques verrouillés, ni de passerelles de paiement. L'ensemble de l'application est sous licence MIT et totalement gratuite à utiliser, à modifier et à développer.

### 2. Priorité à la confidentialité (aucun serveur cloud)
NomAI ne dispose pas de serveur distant. Nous ne pouvons pas collecter, analyser ou partager vos données physiques ou votre historique de repas car nous n'avons aucune infrastructure backend vers laquelle les envoyer. Vos données restent exclusivement stockées dans la base de données locale de votre appareil.

### 3. Inférence LLM locale et hors ligne
Toutes les analyses de repas et les estimations de macronutriments sont effectuées sur l'appareil. Propulsée par **Google Gemma-2B** et le moteur de rendu de Google **LiteRT**, l'application analyse les entrées de texte en langage naturel directement dans votre téléphone. Aucune connexion Internet n'est requise.

---

## L'innovation en action : comment ça marche

Les applications traditionnelles nécessitent des moteurs de recherche pour faire correspondre les aliments avec des bases de données en ligne. Au contraire, NomAI vous permet de décrire vos repas en texte naturel :

> *"J'ai mangé deux œufs brouillés, une tranche de pain complet grillée et un café noir."*

En coulisses, NomAI transmet cette requête à un modèle local Gemma-2B. Grâce à une ingénierie de prompt spécialisée, le modèle analyse les aliments, calcule les portions estimées et génère des estimations nutritionnelles structurées (calories, protéines, glucides et graisses).

Comme l'inférence s'exécute sur l'appareil, la réponse est quasi instantanée, consomme zéro donnée mobile et reste entièrement privée.

---

## Stack technique et architecture

Construit selon les normes Android modernes, NomAI représente une implémentation de pointe de l'apprentissage automatique sur l'appareil :

* **Jetpack Compose :** Un toolkit d'interface utilisateur déclaratif moderne qui maintient l'interface fluide, réactive et élégante.
* **LiteRT-LM SDK :** Le moteur d'exécution d'IA générative haute performance de Google, utilisant l'accélération matérielle (GPU/NPU) pour exécuter les modèles Gemma avec un impact minimal sur la batterie.
* **Room Database :** Une couche d'abstraction SQLite locale pour stocker en toute sécurité et rapidement l'historique des repas et les objectifs de l'utilisateur.

---

## Conclusion

NomAI est bien plus qu'un simple tracker de fitness ; c'est une preuve de concept pour l'avenir de la conception de logiciels mobiles. Il prouve que nous pouvons créer des applications robustes et hautement intelligentes qui respectent la vie privée des utilisateurs, fonctionnent hors ligne et s'exécutent gratuitement. Découvrez le code source sur GitHub pour explorer l'implémentation ou téléchargez l'application dès aujourd'hui !
