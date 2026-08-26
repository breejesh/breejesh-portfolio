---
title: "Fine-tuning LoRA pour les LLM : rangs, modules cibles et calcul mémoire"
description: "Guide ingénieur de LoRA et QLoRA : quand les adapters battent le fine-tune complet, comment choisir rank et modules, VRAM approximative et échecs qui gâchent un week-end."
date: "2026-08-04"
tags: [IA et Machine Learning]
coverImage: /assets/images/lora-finetuning-guide.webp
previewImage: /assets/images/lora-finetuning-guide.webp
---

Le fine-tune complet gagne encore sur certains jobs. Pour la plupart du travail produit, c'est le mauvais défaut. **LoRA** gèle les poids de base et entraîne une paire de matrices de bas rang sur chaque couche choisie. **QLoRA** garde cette idée et charge le modèle de base en 4 bits, ce qui permet d'entraîner un 7B ou 13B sur une seule carte 24 Go.

Voici la checklist que j'utilise avant de brûler des heures GPU.

---

## Quand LoRA est le bon outil

Choisis LoRA (ou QLoRA) quand :

1. **Tu as un modèle de base solide** et tu as seulement besoin de style, de format, de jargon métier ou d'habitudes de tool-calling. Les checkpoints instruction-tuned 7B-70B savent déjà le langage. Tu orientes, tu n'apprends pas l'anglais depuis zéro.
2. **La VRAM est la contrainte.** Un AdamW complet sur un 7B en FP16, c'est grosso modo poids + gradients + deux états d'optimiseur : environ 14 + 14 + 28 = **56 Go** avant activations et KV cache. Une GPU 24 Go ne finit pas ce job tranquillement.
3. **Tu veux beaucoup d'adapters bon marché.** Une base gelée, N packs LoRA par client ou produit. Tu swaps les adapters au chargement. Le fine-tune complet t'oblige à stocker et servir N copies entières.
4. **Les données sont petites ou moyennes.** Des milliers à quelques centaines de milliers d'exemples, c'est la plage habituelle de LoRA. Si tu as un corpus de domaine de plusieurs milliards de tokens et que tu vises le pic de qualité, le full (ou le continued pretrain) a encore sa place.

Passe LoRA quand tu as besoin d'un vrai changement de capacité : langues quasi absentes du pretrain, gros gains de raisonnement multi-étapes, ou chirurgie d'architecture. Le bas rang n'invente pas une capacité que la base n'a jamais eue.

---

## Ce que LoRA entraîne vraiment

Pour une matrice de poids gelée \(W \in \mathbb{R}^{d \times k}\), LoRA apprend \(A \in \mathbb{R}^{r \times k}\) et \(B \in \mathbb{R}^{d \times r}\), et le forward devient \(W x + B A x\) (avec un facteur d'échelle \(\alpha / r\)).

Le nombre de paramètres entraînables par matrice est \(r(d + k)\). Pour des projections d'attention avec \(d = k = 4096\) et rank \(r = 16\) :

\[
16 \times (4096 + 4096) = 131{,}072 \text{ paramètres}
\]

C'est minuscule à côté d'une matrice complète 4096x4096 (16,7M poids). Sur toutes les couches ciblées, tu finis souvent entre **0,1 % et 2 %** des paramètres de base, ce qui explique pourquoi l'état d'optimiseur tient enfin.

**QLoRA** (Dettmers et al., 2023) quantifie les poids de base en **NF4**, peut double-quantifier les constantes, et utilise des optimiseurs paged pour éviter les OOM sur les pics d'optimiseur. Les adapters s'entraînent toujours en précision plus haute (souvent BF16/FP16).

---

## Rank : commence petit, mesure, puis monte

| Rank | Usage typique | Notes |
|---|---|---|
| 4-8 | Style, ton de chat, formatage léger | Rapide, peu de risque d'overfit sur petits sets |
| 16 | Premier essai par défaut pour SFT instruction / domaine | Bon équilibre qualité / coût sur 7B-13B |
| 32-64 | Décalage de domaine plus dur, adapters multi-tâches | Plus de VRAM et plus de données |
| 128+ | Rarement utile en SFT | Coûte souvent presque comme un full sans l'égaler |

Règle simple : **rank 16, alpha 32** (alpha = 2r) est un point de départ sain sur les modèles type Llama. Si les evals plafonnent et que les données sont propres, monte à 32 ou 64. Si le train loss s'effondre et que l'eval empire, le rank (ou le learning rate) est trop agressif pour la taille du set.

Alpha scale la contribution de l'adapter. Choisis alpha fixe ou alpha = 2r, garde ce schéma fixe pendant le sweep de rank, et log les deux valeurs. Changer les deux en même temps rend les ablations inutiles.

---

## Les modules cibles comptent plus qu'on ne l'admet

Les papiers LoRA classiques adaptaient souvent **query et value** seulement. C'est moins cher. Sur les LLM decoder modernes, adapter **toutes les projections linéaires d'attention et de MLP** gagne en général :

```
# Noms style Llama (PEFT / Hugging Face)
target_modules = [
  "q_proj", "k_proj", "v_proj", "o_proj",
  "gate_proj", "up_proj", "down_proj",
]
```

Si la VRAM est juste, retire d'abord le MLP et garde l'attention. Si la qualité ne bouge pas, ajoute des modules avant de passer le rank de 16 à 128. La couverture des modules déplace souvent plus l'aiguille qu'une hausse aveugle de rank.

N'oublie pas **embedding / lm_head** quand la tâche ajoute beaucoup de nouveaux tokens (tags d'outils, codes métier). Laisse-les gelés sauf si le comportement token-level est faux.

---

## Calcul mémoire sur une serviette

VRAM stationnaire approximative pour un dense **7B** (ordre de grandeur, pas un profiler) :

| Setup | Poids de base | Entraînables + états Adam | Total indicatif* |
|---|---|---|---|
| Full FT, FP16 | ~14 Go | ~42 Go | **56 Go+** |
| LoRA r=16, base FP16 | ~14 Go | quelques centaines de Mo | **16-20 Go** |
| QLoRA 4-bit + LoRA | ~3,5-4,5 Go | quelques centaines de Mo | **6-12 Go** |

\*Activations, longueur de séquence, batch size et gradient checkpointing dominent le reste. Un long contexte (4k-8k) avec de gros micro-batches fera encore OOM un setup qui « tient en théorie ».

Quand tu es limite : `gradient_checkpointing=True`, micro-batch 1-2 avec accumulation, packing ou groupement par longueur, BF16 sur Ampere+, et pour QLoRA bitsandbytes NF4 plus double quant.

Un SFT QLoRA 13B avec rank 16 et longueur 2048 tient souvent sur une GPU 24 Go. Un job QLoRA 70B veut du multi-GPU ou de l'offload.

---

## Échecs courants (et les correctifs ennuyeux)

**1. Effondrement de style ou boucles « je ne suis qu'un modèle de langage »**  
Learning rate trop haut, ou set minuscule entraîné trop d'époques. Commence vers **1e-4 à 2e-4** pour LoRA (souvent plus haut que full FT). Early stop sur un held-out. Une à trois époques suffisent pour beaucoup de SFT.

**2. Train loss superbe, eval produit nulle**  
Mauvais template. Entraîne avec le **même** chat template et system prompt qu'en inférence. Si la prod wrap les tools en XML et que le training utilisait du texte brut, l'adapter apprend la mauvaise surface.

**3. OOM au step 1 avec QLoRA**  
Ce n'est pas les adapters. Mémoire d'activation ou pic d'optimiseur non paged. Active le gradient checkpointing, coupe `max_seq_length`, active AdamW paged, et vérifie que tu ne dégèles pas tout le modèle par accident.

**4. L'adapter ne fait rien après merge**  
Mauvais noms dans `target_modules` pour l'architecture, ou tu n'as sauvegardé que l'état d'optimiseur. Affiche le nombre de paramètres entraînables au démarrage. S'il est zéro ou ridicule, arrête avant le run de nuit.

**5. Overfit de quelques centaines d'exemples à rank 64**  
Dropout sur les couches LoRA (0,05-0,1), rank plus bas, données plus diversifiées, ou early stopping fort sur l'eval. Un rank haut n'est pas de la capacité gratuite ; c'est de la capacité gratuite pour mémoriser.

**6. Multi-GPU plus lent qu'une seule GPU**  
Overhead de communication et tenseurs entraînables minuscules. Pour de petits jobs LoRA, une seule carte forte avec accumulation bat souvent un DDP mal scalé.

---

## Une forme d'entraînement minimale qui marche

```python
from peft import LoraConfig, get_peft_model, TaskType

config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
)
model = get_peft_model(model, config)
model.print_trainable_parameters()
```

Packe les données sur le chat template, maske les tokens de prompt si tu ne veux que la loss de completion, évalue toutes les N steps sur de vraies tâches (pas seulement la perplexity), et exporte l'adapter plus un checkpoint merged si le serving ne charge pas PEFT au runtime.

---

## En clair

LoRA ne remplace pas la qualité des données. Ça dépense le budget GPU sur les tranches du réseau qui bougent ta métrique produit. Commence par **QLoRA + rank 16 + modules attention/MLP complets** sur une base instruction solide. Mesure avec les mêmes prompts qu'en production. Monte le rank ou dégèle davantage seulement quand l'eval dit qu'il te faut de la capacité.

Si le fine-tune complet gagne encore sur ta suite offline et que tu peux payer le hardware, prends-le. Sinon, livre l'adapter et garde la base gelée.
