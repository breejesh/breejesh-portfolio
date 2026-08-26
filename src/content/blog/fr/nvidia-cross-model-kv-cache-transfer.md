---
title: "L'Astuce d'Algebre Lineaire de Nvidia: Le Transfert de Cache KV Sans Recalcul"
description: "Nvidia publie une methode de transformation lineaire permettant de transferer le cache KV d'un petit LLM vers un grand modele sans temps de latence."
date: "2026-08-19"
tags: [Matériel et Semiconducteurs, IA et Machine Learning, Backend et Bases de Données]
coverImage: /assets/images/nvidia-cross-model-kv-cache-transfer.webp
previewImage: /assets/images/nvidia-cross-model-kv-cache-transfer.webp
---

> **TL;DR**
> * **Le Probleme:** Transmettre un historique de 32k tokens d'un petit modele a un grand transformeur exige un recalcul complet et lent du contexte.
> * **L'Axe Technique:** Une projection lineaire directe du cache KV entre modeles d'une meme famille sans phase de prefill redondante.
> * **Le Resultat:** Latence de transfert reduite de 7.1s a 0.28s tout en conservant 98% de la precision d'origine.
