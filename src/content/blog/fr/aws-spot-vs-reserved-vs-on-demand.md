---
title: "Tarification AWS EC2 : Comparatif des Instances On-Demand, Spot et Réservées"
description: "Comparez les modèles de tarification AWS EC2 avec les coûts horaires réels, la mécanique d'interruption spot, les risques d'engagement et la stratégie hybride."
date: "2026-06-22"
tags: [Cloud et DevOps]
coverImage: /assets/images/aws-spot-reserved-ondemand.webp
previewImage: /assets/images/aws-spot-reserved-ondemand.webp
---


Le calcul informatique représente souvent plus de la moitié de la facture mensuelle AWS d'une entreprise. Pourtant, de nombreuses équipes d'ingénierie choisissent par défaut des instances On-Demand par habitude. D'autres évitent totalement les instances Spot après avoir subi une seule interruption inattendue, ou s'engagent sur 3 ans pour des charges de travail qui évoluent en six mois.

Choisir un mauvais modèle de tarification EC2 entraîne des dépenses superflues. Comprendre les différences exactes entre On-Demand, Spot et Instances Réservées (y compris les Savings Plans) permet de réduire les coûts d'infrastructure de 50% à 70% sans compromettre la disponibilité.

---

## Instances On-Demand : Flexibilité Maximale, Coût Unitaire Élevé

La tarification On-Demand est le tarif de base d'AWS. Vous payez la capacité de calcul à la seconde (avec un minimum de 60 secondes) sans engagement à long terme ni paiement initial.

### Profil de Coût Réel

Pour une instance optimisée pour le calcul comme `c6i.2xlarge` (8 vCPU, 16 Go de RAM) dans la région `us-east-1` :

* **Tarif On-Demand :** 0,34 $ par heure
* **Coût Mensuel (24/7) :** ~248,20 $ par mois

### Quand Utiliser On-Demand

* Charges de travail à court terme durant moins de quelques semaines.
* Pics de trafic imprévisibles nécessitant une augmentation immédiate de la capacité.
* Environnements de développement et de test fonctionnant sur des intervalles courts et irréguliers.
* Tests initiaux d'applications avant d'établir une estimation précise des besoins en ressources.

### Le Problème du 100% On-Demand

Exécuter des charges de production uniquement en On-Demand revient à payer le prix fort pour chaque serveur 24h/24 et 7j/7. Si un service fonctionne en continu pendant plus de deux mois, le maintenir en On-Demand génère un gaspillage financier.

---

## Instances Spot : Jusqu'à 90% de Réduction avec Gestion de la Préemption

Les instances Spot vous permettent de bénéficier de la capacité EC2 inutilisée d'AWS. AWS propose ces serveurs vacants avec des réductions importantes, généralement de 65% à 75% par rapport aux prix On-Demand, et jusqu'à 90% pour des types d'instances moins fréquents.

### Profil de Coût Réel

Pour la même instance `c6i.2xlarge` dans `us-east-1` :

* **Tarif Spot :** ~0,091 $ par heure (varie dynamiquement selon l'offre et la demande)
* **Coût Mensuel (24/7) :** ~66,42 $ par mois
* **Économies :** ~73% de réduction par rapport au Tarif On-Demand

### La Contrainte : Préemption et Interruption de Capacité

AWS peut réclamer une instance Spot à tout moment lorsque la demande d'instances On-Demand augmente. Lorsque AWS a besoin de récupérer de la capacité, un **préavis d'interruption de 2 minutes** est envoyé.

La capacité Spot est organisée en pools. Un pool Spot est défini par trois critères :

1. Type d'instance (par exemple `c6i.2xlarge`)
2. Zone de Disponibilité (par exemple `us-east-1a`)
3. Région (par exemple `us-east-1`)

Si un pool spécifique manque de matériel disponible, AWS interrompt les nœuds Spot de ce pool.

### Chronologie de l'Interruption Spot

* **0:00:** AWS signale l'interruption via IMDS ou EventBridge.
* **0:05:** Node Handler marque le nœud non planifiable (`kubectl cordon`).
* **0:10:** Les pods actifs reçoivent `SIGTERM`, les nouveaux pods dévient.
* **1:50:** Fin de la sauvegarde de l'état sur disque ou réseau.
* **2:00:** AWS termine l'instance EC2.

### Concevoir une Architecture Fiable avec Spot

1. **Diversification des Instances :** Ne comptez jamais sur un seul type d'instance. Configurez vos Auto Scaling Groups ou Kubernetes Karpenter pour demander plusieurs familles d'instances dans plusieurs Zones de Disponibilité (par exemple : `c6i.2xlarge`, `c5.2xlarge`, `c6a.2xlarge`, `m6i.2xlarge`).
2. **Automatiser le Vidage des Nœuds :** Interceptez le préavis de 2 minutes via le Service de Métadonnées d'Instance (IMDS) à l'adresse `http://169.254.169.254/latest/meta-data/spot/instance-action` ou EventBridge `EC2 Instance State-change Notification`.
3. **Utiliser la Recommandation de Rééquilibrage :** AWS fournit le signal `EC2 Instance-rebalance-recommendation` jusqu'à 15 minutes avant la récupération effective lorsque la capacité du pool diminue.

### Meilleures Charges de Travail pour Spot

* Serveurs web sans état et microservices d'API derrière un équilibreur de charge.
* Nœuds de travail Kubernetes hébergeant des pods tolérants aux pannes.
* Traitements par lots (AWS Batch, EMR, Ray, Spark).
* Agents de build CI/CD et exécuteurs de tests automatisés.

### À Éviter sur Spot

* Bases de données relationnelles (RDS PostgreSQL, MySQL) et stockages de données à nœud unique.
* Applications monolithiques sans gestionnaire d'arrêt propre.
* Applications avec état sans réplication en temps réel entre les nœuds.

---

## Instances Réservées et Savings Plans : Réductions en Échange d'un Engagement

Pour des charges de travail stables et prévisibles, AWS propose des réductions en échange d'un engagement sur 1 an ou 3 ans.

### RIs ou Savings Plans

Bien que les Instances Réservées (RIs) traditionnelles existent toujours, les AWS Savings Plans représentent aujourd'hui la référence pour obtenir des réductions par engagement.

| Option de Prix | Engagement | Flexibilité | Réduction Habituelle |
|---|---|---|---|
| **Compute Savings Plans** | 1 ou 3 Ans | Maximale. S'applique aux familles d'instances, OS, régions, Fargate et Lambda. | 37% (1 An) à 66% (3 Ans) |
| **EC2 Instance Savings Plans** | 1 ou 3 Ans | Moyenne. Limité à une famille d'instances dans une seule région. | 40% (1 An) à 72% (3 Ans) |
| **RIs Standard** | 1 ou 3 Ans | Faible. Limité au type d'instance, OS et région. Revendable sur la Place de Marché RI. | 35% (1 An) à 60% (3 Ans) |
| **RIs Convertibles** | 1 ou 3 Ans | Moyenne. Permet de changer pour d'autres spécifications d'instances. | 30% (1 An) à 54% (3 Ans) |

### Profil de Coût Réel

Exemple pour `c6i.2xlarge` dans `us-east-1` :

* **On-Demand :** 0,340 $ par heure (248,20 $ / mois)
* **1-Year Compute Savings Plan (Sans acompte) :** ~0,214 $ par heure (156,22 $ / mois, 37% d'économie)
* **3-Year EC2 Instance Savings Plan (Tout acompte payé) :** ~0,095 $ par heure (69,35 $ / mois, 72% d'économie)

### Le Risque de Verrouillage Financial

Le principal inconvénient de l'engagement réside dans le verrouillage financier. Si vous souscrivez un EC2 Instance Savings Plan de 3 ans pour des instances `c6i` et que votre équipe fait évoluer l'architecture vers des processeurs Graviton `c7g` ou AWS Lambda six mois plus tard, vous reste redevable des 2,5 années restantes sur l'engagement `c6i`.

Les Compute Savings Plans réduisent ce risque en appliquant automatiquement l'engagement horaire en dollars à toutes les familles d'instances, architectures (x86 ou ARM) et services de calcul (EC2, Fargate, Lambda).

---

## Comparatif Direct des Tarifs et Fonctionnalités

Voici la comparaison des quatre options principales pour une empreinte de serveur de 8 vCPU et 16 Go de RAM (équivalent `c6i.2xlarge`) :

| Fonctionnalité / Tarif | On-Demand | Instances Spot | 1-Yr Compute Savings Plan | 3-Yr EC2 Instance Savings Plan |
|---|---|---|---|---|
| **Prix Horaire** | 0,340 $ | ~0,091 $ | ~0,214 $ | ~0,095 $ |
| **Facture Mensuelle** | 248,20 $ | ~66,42 $ | ~156,22 $ | ~69,35 $ |
| **Réduction vs. OD** | 0% | 65% - 75% | ~37% | ~72% |
| **Engagement** | Aucun | Aucun | 1 An | 3 Ans |
| **Risque d'Interruption** | Aucun | Élevé (préavis 2 min) | Aucun | Aucun |
| **Flexibilité Famille** | Immédiate | Immédiate | Élevée (automatique) | Faible (famille fixe) |
| **Flexibilité Région** | Immédiate | Immédiate | Élevée (globale) | Faible (région fixe) |

---

## La Stratégie Hybride 70/20/10 en Production

Les architectures cloud les plus performantes ne s'appuient pas sur un seul modèle tarifaire. Elles combinent les trois dans une structure d'allocation hybride.

### Structure d'Allocation Hybride

* **Socle Fixe (60% à 70%) :** Compute Savings Plans (1 ou 3 Ans) pour l'infrastructure centrale.
* **Échelle (20% à 30%) :** Instances Spot sur plusieurs zones et familles d'instances.
* **Pics de Trafic (10%) :** Auto Scaling Groups On-Demand pour la marge de sécurité.

### Découpage de l'Architecture

1. **60% à 70% Socle Fixe (Compute Savings Plans) :** Couvrez votre consommation minimale quotidienne avec des Compute Savings Plans sur 1 ou 3 ans. Cela englobe les bases de données, le plan de contrôle et les serveurs web de base.
2. **20% à 30% Calcul Scalable (Instances Spot) :** Utilisez des instances Spot pour absorber la montée en charge des applications sans état pendant les heures de pointe. Configurez Karpenter ou des Auto Scaling Groups avec au moins 4 à 6 types d'instances.
3. **10% Marge de Sécurité (On-Demand) :** Conservez la tarification On-Demand en secours. Si les pools Spot s'épuisent, les Auto Scaling Groups démarreront temporairement des instances On-Demand jusqu'au retour de la capacité Spot.

### Calcul du ROI : Charge de Travail de 100 vCPU

Imaginons une infrastructure nécessitant 100 vCPUs (l'équivalent de douze instances `c6i.2xlarge`) fonctionnant en continu :

* **Stratégie 100% On-Demand :** 12 x 248,20 $ = **2 978,40 $ par mois**
* **Stratégie 100% 3-Year EC2 Savings Plan :** 12 x 69,35 $ = **832,20 $ par mois** (Risque : aucune agilité)
* **Stratégie Hybride 70/20/10 :**
  * 8 nœuds sur Compute Savings Plan (3 Ans) : 8 x 95,00 $ = 760,00 $
  * 3 nœuds sur Instances Spot : 3 x 66,42 $ = 199,26 $
  * 1 nœud en On-Demand (secours) : 1 x 248,20 $ = 248,20 $
  * **Coût Total Hybride :** **1 207,46 $ par mois**

Cette approche hybride réduit la dépense mensuelle de **59,4%** tout en préservant l'agilité technique et en éliminant les risques de panne unique lors des interruptions d'instances Spot.

---

## Grille de Décision

Avant de choisir un modèle de tarification pour vos instances EC2, évaluez vos besoins selon ces critères :

* La charge de travail peut-elle tolérer l'arrêt d'un nœud avec un préavis de 2 minutes ? **Choisissez Spot.**
* S'agit-il d'une base de données avec état ou d'un composant d'infrastructure central fonctionnant 24h/24 ? **Choisissez un Savings Plan.**
* S'agit-il d'un prototype récent ou d'un pic de charge imprévisible de courte durée ? **Choisissez On-Demand.**
* Envisagez-vous de faire évoluer vos architectures ou types d'instances d'ici 12 mois ? **Privilégiez les Compute Savings Plans par rapport aux EC2 Instance Savings Plans.**

