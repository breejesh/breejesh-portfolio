---
title: "Comment fonctionnent les transformers : une carte pratique pour les ingénieurs"
description: "Attention, embeddings, stacks encoder/decoder, fenêtres de contexte et cache KV sans le brouillard des papers. Ce qui compte quand vous servez ou hébergez des LLM."
date: "2026-08-02"
tags: [IA]
coverImage: /assets/images/transformers-explained-engineers.webp
previewImage: /assets/images/transformers-explained-engineers.webp
---

Vous n'avez pas besoin d'un doctorat pour raisonner sur les transformers. Vous avez besoin d'un modèle mental qui tient en production : pourquoi la latence explose avec les longs prompts, pourquoi la VRAM meurt avant le CPU, et pourquoi un "contexte 128k" n'est pas gratuit.

Voici cette carte. Pas de résumé de paper. Pas de hype. Seulement les pièces que vous touchez vraiment quand vous appelez une API, lancez un modèle local ou déboguez un serveur d'inférence.

---

## La version en une ligne

Un transformer transforme une séquence de tokens en prédictions du token suivant en laissant chaque token regarder les autres (ou une fenêtre restreinte) de façon répétée, puis en mélangeant ces signaux via des couches denses.

Tout le reste est de l'ingénierie autour de cette idée : comment représenter les tokens, quelle profondeur de pile, quelle histoire on autorise, et comment éviter de recomputer le travail à chaque nouveau token.

---

## Tokens et embeddings : le texte discret devient des vecteurs

Les modèles ne voient pas des mots. Ils voient des **tokens**, des morceaux de texte (sous-mots, mots entiers, ponctuation, parfois des octets). Le tokenizer est une plomberie ennuyeuse qui fait ou défait vos estimations de coût. La même phrase anglaise peut faire 12 tokens dans une famille de modèles et 20 dans une autre.

Chaque id de token est mappé vers un vecteur appris : l'**embedding**. Voyez-le comme une table `vocab_size x d_model`. Les premières couches raffinent surtout ces vecteurs ; les suivantes les mélangent au contexte jusqu'à ce que le vecteur final serve à prédire le token suivant (ou une tête de classification).

La position compte. L'attention pure n'a pas d'ordre intégré, donc les modèles ajoutent de l'**information positionnelle** (positions absolues, biais relatifs, embeddings rotatifs type RoPE et variantes). Vous n'avez pas besoin de la formule. Vous avez besoin de l'implication : les longues séquences stressent le calcul et la qualité de l'encodage de position.

```
"Transformers are useful."
        |
   [tokenizer]
        |
 [tok1, tok2, tok3, tok4, ...]
        |
  [embedding + position]
        |
  matrix of shape [seq_len, d_model]
```

---

## Attention : l'intuition utile (pas l'algèbre de matrices)

L'attention répond à : pour ce token, à quels autres tokens dois-je écouter maintenant ?

À chaque position, le modèle construit trois projections de l'état caché courant :

| Nom | Rôle (intuition d'ingénierie) |
| --- | --- |
| **Query (Q)** | Qu'est-ce que je cherche ? |
| **Key (K)** | Qu'est-ce que j'annonce contenir ? |
| **Value (V)** | Quel contenu je transmets si je suis sélectionné ? |

La similarité entre Q et K fixe les poids. Ces poids mélangent les vecteurs V en une nouvelle représentation pour cette position. L'attention multi-têtes en lance plusieurs en parallèle : une tête peut suivre la syntaxe, une autre les noms, les nombres ou la structure du code. Le modèle apprend le partage. Vous, vous regardez surtout le coût mémoire et les matmuls.

L'**attention causale (decoder)** masque le futur : le token *t* ne peut voir que `1..t`. C'est ce qui rend la génération gauche-droite valide. L'**attention bidirectionnelle (encoder)** laisse chaque token voir toute l'entrée, comme dans les modèles style BERT pour la compréhension.

Image concrète avec un court prompt :

```
Tokens:  [The] [cat] [sat] [on] [the] [mat]
En prédisant après "sat" :
  "sat" peut voir : The, cat, sat
  "sat" ne peut pas voir : on, the, mat   (masque causal)
```

Le coût célèbre : l'attention pleine naïve est en **O(n²)** sur la longueur de séquence, en calcul comme dans le stockage des scores. Doublez le contexte, multipliez à peu près par 4 le travail d'attention (avant kernels et approximations). C'est pourquoi le long contexte est à la fois une feature produit et un problème système.

---

## Encoder, decoder et les modèles que vous utilisez vraiment

Le paper de 2017 utilisait un stack **encoder-decoder** pour la traduction : l'encoder lit toute la phrase source ; le decoder génère la cible avec attention causale plus cross-attention vers les états de l'encoder.

La carte pratique d'aujourd'hui est plus simple :

| Famille | Motif | Usage typique |
| --- | --- | --- |
| **Encoder seul** | Stack bidirectionnel | Classification, embeddings, NER (style BERT) |
| **Decoder seul** | Stack causal | Chat, code, agents, la plupart des LLM de frontière |
| **Encoder-decoder** | Les deux stacks | Traduction, un peu de résumé / tâches seq2seq |

Quand on dit "LLM" en produit en 2025-2026, on parle presque toujours d'un transformer **decoder only** entraîné à prédire le token suivant, puis instruction-tuné et aligné. Les encoder only comptent encore pour les embeddings de retrieval et le NLP classique. Les encoder-decoder restent utiles en seq2seq spécialisé. Les maths d'attention sont partagées ; le masque et l'objectif d'entraînement changent.

Profondeur, largeur (`d_model`), nombre de têtes et ratio du feed-forward fixent le nombre de paramètres. Plus de paramètres peut vouloir dire plus de qualité, mais aussi plus de poids à charger et plus de FLOPs par token.

---

## Ce qu'une "fenêtre de contexte" signifie vraiment

La **fenêtre de contexte** est le nombre maximal de tokens sur lesquels le modèle peut faire de l'attention en un forward (prompt + tokens déjà générés, selon le comptage du produit).

Ce n'est **pas** :

* De la mémoire illimitée et gratuite pour votre app
* Une garantie que le modèle utilise bien le milieu d'un long prompt
* La même chose que "taille des données d'entraînement"

C'est **bien** :

* Une limite dure d'architecture et de produit (config + positions entraînées + politique de serving)
* Un budget partagé entre system prompt, docs récupérés, historique de chat, traces d'outils et la réponse
* Un levier de coût et de latence, car attention et stockage KV croissent avec les tokens

| Ce que vous mettez dans le contexte | Ce que ça coûte |
| --- | --- |
| Instructions système | Tokens de base stables à chaque requête |
| Chunks RAG | Souvent la plus grande variable |
| Historique multi-tours | Grandit jusqu'à troncature ou résumé |
| Appels d'outils / traces JSON | Facile à sous-estimer |
| La sortie du modèle elle-même | Compte dans la fenêtre pendant la génération |

Règle pratique : traitez le contexte comme un working set, pas comme une décharge. La qualité du retrieval bat le fait d'empiler 20 pages "au cas où". Les modèles long contexte aident, mais ils n'annulent ni un mauvais prompt ni un retrieval négligent.

Surveillez aussi le décalage de tokenizer. Les limites et la facturation sont en **tokens**, pas en mots ou caractères. Un dump de logs plein d'UUID et de base64 peut brûler la fenêtre très vite.

---

## Pourquoi le cache KV compte pour l'inférence

L'entraînement et le prefill sont une histoire. La génération interactive en est une autre.

Quand vous générez token par token, une implémentation naïve relancerait tout le modèle sur le préfixe entier à chaque nouveau token. C'est correct et absurde en coût.

Le **cache KV** stocke les tenseurs Key et Value déjà calculés des tokens passés à chaque couche. Pour le nouveau token, vous calculez seulement son Q/K/V, vous faites attention contre l'historique K/V en cache, puis vous ajoutez le nouveau K/V.

```
Prefill (prompt une fois) :
  for each prompt token: compute K, V → store in cache
  produce first output distribution

Decode (un token à la fois) :
  compute Q, K, V for new token only
  attend to cached K, V (+ new)
  append new K, V
  sample / argmax next token
  repeat
```

Pourquoi un ingénieur s'en soucie :

1. **Forme de la latence :** le prefill est souvent lourd en calcul et parallèle sur le prompt. Le decode est souvent borné par la bande passante mémoire : on stream les poids et un cache qui grossit, avec un batch souvent égal à 1.
2. **VRAM :** la taille du cache croît avec `layers x heads x seq_len x head_dim x precision` (et le batch). Les longs chats et gros batches explosent la mémoire même si les poids tiennent.
3. **Throughput :** continuous batching et paged attention (idées systèmes des stacks de serving prod) existent surtout pour gérer le layout KV et éviter la fragmentation.
4. **API multi-tours :** l'"état de conversation" côté serveur est souvent "garder ou reconstruire le KV". D'où des tarifs parfois différents pour l'input en cache et l'input frais quand un préfixe est réutilisé.

Modèle mental de pression mémoire :

| Levier | Effet sur le cache KV |
| --- | --- |
| Prompt / historique plus long | Croissance linéaire en seq_len |
| Batch plus grand (utilisateurs concurrents) | Croissance linéaire en batch |
| Plus de couches / têtes / largeur | Linéaire dans la forme du modèle |
| FP16 → FP8 / INT8 / KV quantifié | Moins d'octets par élément (qualité variable) |
| Fenêtre glissante / attention sparse | Borne jusqu'où on regarde, peut plafonner le cache |

Si le GPU fait OOM au milieu d'une conversation, les poids ne sont pas toujours le coupable. Le cache l'est souvent.

---

## Assembler le tout : cycle de vie d'une requête

1. **Tokeniser** le prompt.
2. **Embedder** les tokens et ajouter la position.
3. **Prefill** à travers N blocs transformer (attention + feed-forward par bloc), en construisant le cache KV.
4. **Échantillonner** le token suivant depuis les logits finaux (température, top-p, etc. vivent ici).
5. **Decode :** ajouter le token, mettre à jour le cache, rééchantillonner jusqu'à stop ou max tokens.
6. **Détokeniser** pour l'utilisateur.

Où ça fait mal en production :

* D'énormes system prompts font payer un gros prefill à chaque requête (sauf si le prefix caching touche).
* Du RAG sans budget de chunks transforme un chat bon marché en job long contexte.
* Une forte concurrence multiplie la mémoire KV.
* Les plafonds de tokens de sortie limitent le coût, mais l'utilisateur sent le TTFT (time to first token) du prefill et les tokens/s de la bande passante de decode.

---

## Ce qu'il faut retenir pour concevoir des systèmes

* Les **embeddings** projettent des tokens discrets dans l'espace vectoriel de la pile.
* L'**attention** est un mélange sélectif d'information dans la séquence ; les masques causaux rendent la génération possible.
* **Encoder vs decoder**, c'est surtout masque + objectif ; la plupart des LLM de chat sont decoder only.
* La **fenêtre de contexte** est un budget de tokens partagé et un centre de coût à peu près quadratique, pas du stockage gratuit.
* Le **cache KV** rend le decoding interactif faisable et pilote une grande part de la VRAM d'inférence et de la stratégie de batching.

Si vous ne gardez qu'une phrase systèmes : **le prefill construit le cache, le decode lit un cache qui grossit tout en streamant les poids, et la facture suit les tokens dans les deux phases.**

C'est assez pour lire les docs produit, dimensionner des GPU et discuter utilement avec l'équipe modèles sans prétendre avoir réécrit l'algèbre du paper de 2017.
