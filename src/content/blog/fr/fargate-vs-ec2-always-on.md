---
title: "Fargate vs EC2 pour les services always-on : quand la prime n'a plus de sens"
description: "Fargate convient bien au travail en pics. Pour les API et workers qui ne dorment jamais, la prime par vCPU s'accumule. Voici le calcul 2026 et le trade-off ops."
date: "2026-06-23"
tags: [AWS, Cloud]
coverImage: /assets/images/fargate-vs-ec2-always-on.webp
previewImage: /assets/images/fargate-vs-ec2-always-on.webp
---

Fargate est la réponse par défaut dans beaucoup d'architecture reviews. Pas d'AMI. Pas de capacity providers. Pas de "qui a patché le nœud." Vous définissez CPU et mémoire, vous poussez une task, AWS l'exécute.

C'est le bon produit pour beaucoup de charges. C'est le mauvais produit pour beaucoup de charges **always-on**. La facture le montre après quelques mois de trafic 24/7 stable.

C'est le même réflexe de coût que pour les NAT Gateways et d'autres commodités managées : vous payez une prime pour ne pas posséder une machine. La prime est acceptable quand l'utilisation est irrégulière. Elle est chère quand l'utilisation est plate.

---

## Ce que vous achetez vraiment

| Modèle | Vous payez | Vous gérez |
| --- | --- | --- |
| **Fargate** | vCPU-heure + Go-heure pour chaque task en cours | Task definition, réseau, IAM, logging |
| **ECS sur EC2** | L'instance (On-Demand, Spot ou Savings Plan) | Capacité, packing, AMI/OS, plus de modes de panne |
| **EC2 brut + Docker/systemd** | L'instance | Presque tout |

Fargate facture la **tranche réservée** de chaque task. Si une task demande 1 vCPU et utilise 15 % d'un cœur presque toute la nuit, vous payez quand même 1 vCPU toute la nuit. Sur EC2, cette marge idle peut être partagée avec d'autres tasks sur le même hôte, ou vous réduisez la taille de l'hôte.

AWS le publie depuis des années dans ses propres notes de coût ECS : à faible densité de packing, Fargate peut paraître moins cher qu'un EC2 à moitié vide. À utilisation haute et stable, EC2 gagne en général sur les dollars de compute purs.

---

## Calcul mensuel approximatif (us-east-1, ordre de grandeur)

Les chiffres bougent avec les Savings Plans et la région. Prenez-les comme une **forme**, pas un devis.

| Workload | Fargate (toujours allumé) | Équivalent EC2 proche | Notes |
| --- | --- | --- | --- |
| 0.5 vCPU / 1 Go, 1 task | ~$18/mois | classe `t3.micro` / `t4g.micro` | Fargate gagne encore sur la simplicité ops pour un tout petit service |
| 1 vCPU / 2 Go, 2 tasks (HA) | ~$70/mois | Un petit hôte multi-vCPU ou deux micros | Le break-even dépend du packing |
| 2 vCPU / 4 Go, 4 tasks | ~$280/mois | packing type `t3.large` / `m7i` | EC2 commence à prendre l'avantage si les hôtes restent occupés |
| 4 vCPU / 16 Go, flotte stable | Des centaines+/mois | `m7i.xlarge` et compagnie | État stable + engagements 1 an favorisent encore plus EC2 |

Règles de pouce qui tiennent sur le terrain :

1. **Une petite API always-on** avec peu de deploys : Fargate vaut souvent la taxe.
2. **Une flotte de workers et d'API toute la journée, tous les jours** : packez-les sur ECS/EC2 ou nœuds EKS et prenez un Compute Savings Plan.
3. **Batch en pics** (jobs d'entraînement, ETL de nuit, preview envs) : Fargate ou Fargate Spot évite de payer du métal idle.

Si le CPU moyen de vos tasks Fargate reste sous ~30 % pendant des mois, vous n'êtes pas "efficaces." Vous louez de la capacité réservée que vous n'utilisez pas, à un prix unitaire plus élevé qu'EC2.

---

## L'ops est le vrai second prix

Les dollars purs ne sont que la moitié de la décision.

**Fargate gagne quand :**

* Vous ne voulez pas d'histoire d'upgrade de nœuds
* Les équipes livrent beaucoup de petits services et détestent le capacity planning
* Le scale-to-zero ou quasi-zéro compte (avec de bons min task counts)
* La conformité est plus simple quand AWS possède l'hôte de runtime

**EC2 (avec ECS ou EKS) gagne quand :**

* Vous avez déjà une platform team qui patche et surveille les nœuds
* Vous avez besoin de DaemonSets, de modules kernel custom ou d'agents host que Fargate bloque ou complique
* GPU, fort débit réseau ou bin-packing dense comptent
* Vous pouvez garder un packing assez haut pour que la prime Fargate soit du pur gaspillage

Le piège est de prétendre avoir une platform team quand ce n'est pas le cas. Un cluster EC2 mal tenu coûte plus cher que Fargate une fois que vous comptez les pages, les deploys ratés et les week-ends "pourquoi le disque est plein."

---

## Un chemin de décision simple

```
Le service est-il idle la plupart de la journée ou très bursty ?
  oui -> Fargate (ou Lambda si le runtime convient)
  non -> continue

Opérez-vous déjà bien des nœuds de conteneurs ?
  non -> restez sur Fargate jusqu'à ce que la facture mensuelle fasse plus mal que le temps ops
  oui -> modélisez EC2 avec un % de packing réel

Pouvez-vous garder une utilisation moyenne d'hôte saine (environ >50-60 % de ce que vous payez) ?
  oui -> ECS sur EC2 ou EKS avec Savings Plans
  non -> Fargate reste moins cher que des instances vides
```

Mesurez le packing avec de vraies métriques : CPU, mémoire et **réseau** (les gens oublient le réseau). Right-sizez les réservations de tasks avant de migrer. Déplacer une task Fargate sur-réservée vers EC2 sans corriger requests/limits ne fait que déplacer le gaspillage sur une autre ligne de facture.

---

## Un pattern de migration qui ne casse pas la prod

Si vous êtes déjà sur Fargate et que la facture fait mal :

1. **Exportez 30 jours de CloudWatch** pour CPU, mémoire et task count. Cherchez le plancher, pas le pic du slide marketing.
2. **Coupez CPU/mémoire des tasks** là où le headroom est une fiction. Beaucoup d'équipes découvrent que 50 % de la facture Fargate est de la sur-réservation, pas Fargate lui-même.
3. **Choisissez un service** always-on et ennuyeux (API interne, queue worker). Déplacez celui-là d'abord.
4. **Tournez en double capacité** un moment : service Fargate + capacity provider EC2, basculez le trafic avec des poids ou un feature flag.
5. **Achetez de l'engagement seulement après** stabilisation de la forme. Un Savings Plan de la mauvaise taille est une seconde taxe.

Regardez aussi le reste de la facture pendant que vous y êtes. Il est courant d'"optimiser le compute" et de continuer à saigner sur le data processing NAT, des load balancers multi-AZ idle et des logs trop bavards. Le compute est rarement la seule taxe idle.

---

## En bref

Fargate n'est pas une arnaque. C'est une **prime de commodité**. Payez-la pour le travail en pics, les petites équipes et les services où gérer l'hôte est le vrai risque.

Pour des flottes always-on avec des planchers prévisibles, de la capacité EC2 (ECS ou EKS) plus un packing honnête et un Savings Plan est en général le choix adulte. Faites le calcul sur **vos** taux de réservation et **votre** coût ops, pas sur un slide de conférence qui suppose un bin packing parfait ou zéro temps d'ingénieur.

Si la facture cloud de janvier a déjà un goût de gueule de bois, commencez par un service always-on, trente jours de métriques et un tableur. L'architecture review peut attendre que les chiffres soient ennuyeux.
