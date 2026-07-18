---
title: "La taxe cachée du Cloud : Pourquoi votre NAT Gateway dévore votre budget"
description: "Comment réduire votre facture AWS mensuelle en remplaçant votre NAT Gateway par une instance NAT autogérée et économique."
date: 2026-01-01
tags: [AWS, Optimisation des coûts, DevOps]
coverImage: /assets/images/aws-cost-spike.webp
previewImage: /assets/images/aws-cost-spike.webp
---

Nous sommes tous passés par là. Vous examinez votre facture AWS mensuelle, en vous attendant aux montants prévisibles habituels, pour y découvrir une hausse massive. Votre esprit s'emballe, cherchant à comprendre ce qui a échoué. Un script est-il devenu incontrôlable ? Le trafic a-t-il soudainement doublé ?

Puis vous plongez dans le Cost Explorer et découvrez le coupable : **NAT Gateway**.

C'est une véritable douche froide, surtout lorsque vous réalisez que vous êtes facturé non seulement pour l'activation de la passerelle, mais aussi pour chaque gigaoctet de données qui la traverse. Si vous exécutez des charges de travail gourmandes en données, téléchargez de volumineuses images de conteneurs ou communiquez constamment avec des API externes, les frais de traitement des données de NAT Gateway peuvent rapidement devenir votre plus importante taxe cloud cachée.

Pourtant, vous n'êtes pas obligé de continuer à payer simplement parce que "c'est ainsi que tout le monde fait". Si vous souhaitez faire un pas significatif vers une réelle optimisation des coûts, il est temps d'évoquer une alternative plus légère et plus économique : **L'instance NAT** (NAT Instance).

---

## Le coût réel : NAT Gateway vs. Instance NAT

Avant de passer à la solution, analysons pourquoi NAT Gateway vide votre portefeuille aussi rapidement. AWS facture environ **~0,045 $/heure** uniquement pour faire fonctionner un NAT Gateway (soit environ **32,40 $/mois** avant tout transfert de données), plus **0,045 $ par Go** de données traitées. Si votre architecture transfère des téraoctets de données vers Internet ou d'autres services AWS situés en dehors de votre VPC, ces frais de traitement s'accumulent rapidement — et ils augmentent de manière linéaire avec votre volume de trafic, sans aucune remise sur le volume pour vous sauver.

Une **instance NAT**, en revanche, change complètement la donne :

* **Aucun frais de traitement des données :** Vous payez strictement pour la taille de l'instance EC2 sous-jacente que vous choisissez. Que vous transfériez 10 Go ou 10 To, le coût de traitement des données est de zéro.
* **Tarification flexible :** Vous choisissez la famille d'instances. Besoin d'une configuration minimale pour un environnement de staging ? Utilisez une `t4g.nano` ou une `t4g.micro` pour quelques centimes par jour.
* **Contrôle total :** S'agissant d'une instance EC2 standard exécutant Linux, vous pouvez surveiller le trafic directement, appliquer des règles de pare-feu personnalisées ou l'éteindre en dehors des heures de bureau pour économiser encore plus.

### Comparaison des coûts à l'échelle

Voici à quoi ressemblent les chiffres réels pour une charge de travail typique dans la région `us-east-1` :

| Transfert mensuel de données | Coût NAT Gateway | Instance NAT (`t4g.small`) | Économies |
|---|---|---|---|
| 100 Go | 32,40 $ + 4,50 $ = **36,90 $** | **~12,26 $** | **67%** |
| 1 To | 32,40 $ + 45,00 $ = **77,40 $** | **~12,26 $** | **84%** |
| 5 To | 32,40 $ + 225,00 $ = **257,40 $** | **~12,26 $** | **95%** |
| 10 To | 32,40 $ + 450,00 $ = **482,40 $** | **~12,26 $** | **97%** |

*Tarifs de l'instance NAT : `t4g.small` On-Demand à ~0,0168 $/h. Les tarifs standard de transfert de données EC2 s'appliquent (les premiers 100 Go/mois sont gratuits, puis 0,09 $/Go), mais les frais de traitement NAT par Go sont entièrement éliminés.*

Les chiffres parlent d'eux-mêmes. Pour les charges de travail intensives en données, les économies sont spectaculaires.

---

## Étape par étape : Configuration de votre instance NAT

Prêt à vous libérer de ces factures surprises incessantes ? La configuration d'une instance NAT est simple. Voici comment procéder.

### Étape 1 : Lancer l'instance

> **Note :** L'ancienne AMI NAT préconfigurée d'AWS (`amzn-ami-vpc-nat`) était basée sur Amazon Linux 1, qui est en fin de vie depuis décembre 2023. Vous devez utiliser une AMI moderne de type **Amazon Linux 2023** et configurer le NAT manuellement (décrit à l'étape 2), ou utiliser l'AMI maintenue par la communauté [fck-nat](https://fck-nat.dev/) qui automatise l'ensemble de la configuration sur une instance Graviton moderne basée sur ARM.

1. Allez sur le tableau de bord EC2 et cliquez sur **Launch Instance**.
2. Sélectionnez **Amazon Linux 2023** (ARM/Graviton pour réduire les coûts) ou recherchez l'AMI communautaire **fck-nat**.
3. Choisissez une taille d'instance adaptée à vos besoins en bande passante (une `t4g.small` gère jusqu'à 5 Gbps en rafale et constitue un excellent point de départ).
4. Lancez-la dans votre **Sous-réseau Public**. Assurez-vous qu'elle reçoit une adresse IP publique ou associez-y une Elastic IP.

### Étape 2 : Configurer le NAT avec iptables

Si vous utilisez une AMI Amazon Linux 2023 standard (et non fck-nat), vous devez activer le transfert d'IP (IP forwarding) et configurer les règles de masquage (masquerade). Connectez-vous en SSH à votre instance et exécutez :

```bash
# Activer le transfert d'IP (persiste après redémarrage)
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/90-nat.conf
sudo sysctl -p /etc/sysctl.d/90-nat.conf

# Configurer iptables pour masquer le trafic sortant
sudo iptables -t nat -A POSTROUTING -o ens5 -j MASQUERADE

# Persister les règles iptables après redémarrage
sudo yum install -y iptables-services
sudo service iptables save
sudo systemctl enable iptables
```

> Remplacez `ens5` par le nom de l'interface réseau principale de votre instance (vérifiez avec `ip link show`).

### Étape 3 : Désactiver le contrôle de source/destination (Source/Destination Checking)

C'est l'étape que tout le monde oublie. Par défaut, les instances EC2 n'acceptent ou n'envoient du trafic que si elles en sont la source ou la destination. Puisque cette instance agira comme intermédiaire (en routant le trafic pour d'autres serveurs), vous devez désactiver ce contrôle.

1. Sélectionnez votre nouvelle instance NAT dans la console EC2.
2. Cliquez sur **Actions** > **Networking** > **Change Source/Destination Check**.
3. Choisissez **Stop/Disable**.

### Étape 4 : Mettre à jour vos tables de routage (Route Tables)

À présent, vous devez configurer vos sous-réseaux privés pour qu'ils envoient leur trafic sortant vers Internet via votre nouvelle instance plutôt que vers l'ancienne passerelle.

1. Allez sur le tableau de bord VPC et sélectionnez **Route Tables**.
2. Trouvez la table de routage associée à vos **Sous-réseaux Privés**.
3. Modifiez les routes. Recherchez la destination `0.0.0.0/0`.
4. Remplacez la cible (target) de votre ancien `nat-xxxxxxxxxxxx` par votre nouvelle **Instance** (`i-xxxxxxxxxxxx`).
5. Enregistrez les modifications.

### Étape 5 : Sécuriser avec les groupes de sécurité (Security Groups)

Un avantage souvent négligé d'une instance NAT par rapport à un NAT Gateway est le **support des groupes de sécurité**. Les NAT Gateways ne prennent en charge que les NACL, tandis qu'une instance NAT peut utiliser les groupes de sécurité pour un contrôle granulaire :

* **Règle entrante (Inbound) :** Autoriser uniquement le trafic provenant des blocs CIDR de vos sous-réseaux privés (par exemple, `10.0.2.0/24` et `10.0.3.0/24` sur tous les ports).
* **Règle sortante (Outbound) :** Autoriser HTTPS (443) et HTTP (80) vers `0.0.0.0/0`, ainsi que tout port spécifique requis par vos charges de travail (par exemple, 5432 pour PostgreSQL externe).
* **Accès SSH :** Restreindre SSH (22) à votre hôte bastion (bastion host) ou au CIDR de votre VPN pour l'administration.

Cela vous offre un contrôle beaucoup plus fin sur le trafic autorisé à quitter votre VPC par rapport à ce que propose un NAT Gateway.

---

## Rendre l'instance auto-corrective avec Auto Scaling

La principale préoccupation opérationnelle concernant une instance NAT est sa disponibilité : si l'instance EC2 tombe en panne, vos sous-réseaux privés perdent leur connexion Internet. Vous pouvez atténuer ce risque avec un groupe d'Auto Scaling (Auto Scaling Group) auto-correcteur :

**Stratégie :** Créez un ASG avec une capacité minimale, maximale et souhaitée de **1**. Associez-le à un modèle de lancement (Launch Template) et à une Elastic IP. Si l'instance s'arrête (défaillance matérielle, réclamation d'instance spot, etc.), l'ASG lance automatiquement une instance de remplacement. Utilisez un script de données utilisateur (user data script) simple pour réassocier l'Elastic IP et mettre à jour la table de routage au démarrage :

```bash
#!/bin/bash
INSTANCE_ID=$(ec2-metadata -i | cut -d' ' -f2)
ALLOC_ID="eipalloc-0abcdef1234567890"        # ID d'allocation de votre Elastic IP
ROUTE_TABLE_ID="rtb-0abcdef1234567890"        # ID de la table de routage de votre sous-réseau privé

# Associer l'Elastic IP
aws ec2 associate-address \
  --instance-id "$INSTANCE_ID" \
  --allocation-id "$ALLOC_ID" \
  --allow-reassociation

# Mettre à jour la table de routage pour pointer vers cette instance
aws ec2 replace-route \
  --route-table-id "$ROUTE_TABLE_ID" \
  --destination-cidr-block "0.0.0.0/0" \
  --instance-id "$INSTANCE_ID"
```

> Assurez-vous que le rôle IAM de l'instance possède les permissions pour `ec2:AssociateAddress` et `ec2:ReplaceRoute`.

Avec cette configuration, la récupération après une défaillance d'instance prend généralement moins de **2 à 3 minutes** — ce n'est pas instantané comme la haute disponibilité intégrée de NAT Gateway, mais c'est amplement suffisant pour les environnements de non-production.

---

## Comparatif des fonctionnalités

Bien que les économies de coûts soient spectaculaires, le choix d'une instance NAT est un compromis délibéré. Voici comment elles se comparent sur chaque aspect :

| Fonctionnalité | NAT Gateway | Instance NAT |
|---|---|---|
| **Gestion** | Entièrement géré par AWS | Vous gérez l'OS, les correctifs et la config NAT |
| **Bande passante** | Jusqu'à 100 Gbps (mise à l'échelle auto) | Limitée par le type d'instance EC2 (ex. 5 Gbps pour `t4g.small`) |
| **Disponibilité** | Redondance multi-AZ par défaut | Instance unique ; nécessite un ASG pour l'auto-correction |
| **Frais de traitement Go** | 0,045 $/Go | Aucun |
| **Coût horaire** | ~0,045 $/h (32,40 $/mois) | Dépend du type d'instance (~12 $/mois pour `t4g.small`) |
| **Groupes de sécurité** | ❌ Non supporté (NACL uniquement) | ✅ Support complet des groupes de sécurité |
| **Redirection de ports** | ❌ Non supporté | ✅ Configurable avec iptables |
| **Combo Bastion Host** | ❌ Ressource distincte requise | ✅ Peut également servir de bastion |

---

## Réduisez vos dépenses, conservez vos performances

Il est tout à fait logique de modifier votre architecture lorsque les choix par défaut ne correspondent plus à vos objectifs financiers. Vous n'avez pas à accepter des factures exorbitantes simplement parce qu'un NAT Gateway est la recommandation standard.

Si vous gérez des environnements de développement, de staging ou des pipelines de données qui ne requièrent pas une disponibilité de 99,99 % de niveau opérateur, remplacer la passerelle par une instance NAT est une victoire simple et majeure pour votre budget mensuel. Même pour des charges de travail de production aux besoins en bande passante modérés, une instance NAT correctement configurée avec un groupe d'Auto Scaling peut fournir un service fiable pour une fraction du coût.

Essayez cette approche, surveillez les performances et appréciez de voir votre facture AWS revenir à un niveau raisonnable.
