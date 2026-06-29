---
title: "Airflow vs Argo Workflows : choisissez l'orchestrateur qui colle à votre runtime"
description: "DAGs Python et base de métadonnées, ou étapes Kubernetes-native et YAML. Quand Airflow gagne encore, quand Argo Workflows est plus propre, et quand on le confond avec Argo CD."
date: "2026-06-29"
tags: [DevOps, Backend]
coverImage: /assets/images/airflow-vs-argo-workflows.webp
previewImage: /assets/images/airflow-vs-argo-workflows.webp
---

Les gens disent « Airflow vs Argo » comme s'il s'agissait d'un face-à-face d'un seul produit. Ce n'est pas le cas.

**Apache Airflow** est un orchestrateur de workflows avec une longue histoire côté data : DAGs Python, scheduler, workers et une base de métadonnées. **Argo Workflows** est un moteur de workflows natif Kubernetes : chaque étape est en général un pod, les définitions sont du YAML (ou du YAML généré), et le control plane vit dans le cluster.

**Argo CD** est un autre outil (déploiements GitOps). Si le débat est « Airflow vs Argo » et que quelqu'un parle de CD, arrêtez et renommez la conversation.

Ce billet compare Airflow et **Argo Workflows** pour des pipelines : ETL, chaînes d'entraînement ML, jobs batch de features, reporting, tout graphe d'étapes avec retries et dépendances.

---

## La version courte

| Dimension | Airflow | Argo Workflows |
| --- | --- | --- |
| **Langage natif** | DAGs Python | YAML / CRs (souvent générés) |
| **Où tournent les étapes** | Workers, executors Celery/K8s/Local, operators | Surtout des pods Kubernetes |
| **État** | DB de métadonnées Postgres/MySQL | Kubernetes + status du workflow CR |
| **UI / culture ops** | UI mature, riche écosystème de providers | kubectl + UI Argo, modèle mental K8s-native |
| **Défaut raisonnable** | Plateforme data avec systèmes mixtes | Vous vivez déjà dans Kubernetes |

Si l'entreprise est « une équipe data qui a aussi un cluster », Airflow reste souvent le centre de gravité. Si c'est « une équipe platform où chaque job est un conteneur », Argo Workflows colle avec moins de friction.

---

## Ce qu'Airflow fait bien

Airflow modélise le temps et la logique métier en Python. Ça sonne soft. Ce n'est pas soft. Sensors, branching, dynamic task mapping, datasets et un énorme catalogue de providers (warehouses, files, APIs SaaS) expliquent pourquoi il est resté.

Forces concrètes :

* **Systèmes hétérogènes.** Un DAG peut toucher Snowflake, S3, une API HTTP, puis un job Spark sans forcer chaque étape dans une image que vous maintenez.
* **Culture de scheduling.** Schedules type cron, catchup, backfills et la pensée « data interval » sont de première classe. Les data engineers vivent là-dedans.
* **Écosystème d'operators.** Vous inventez rarement le hook Snowflake ou BigQuery from scratch.
* **UI pour des humains qui ne sont pas SRE.** Clear d'une task en échec, vue graphe, logs et ratés de SLA sont des gestes du quotidien.

Coûts concrets :

* **Vous opérez une app distribuée.** Scheduler, webserver, workers, DB de métadonnées, broker si Celery. C'est du vrai toil.
* **Parse des DAGs Python et complexité.** DAGs dynamiques et fichiers monstrueux deviennent leur propre problème de perf.
* **Kubernetes est optionnel, pas l'identité.** KubernetesExecutor/PodOperator aident, mais Airflow n'est pas « juste des CRDs ».

Airflow 2.x (et les features TaskFlow / datasets de l'ère 2.x standardisées en 2024-2025) a beaucoup réduit l'ancienne douleur des DAGs. Ça n'a pas transformé Airflow en produit léger uniquement sidecars.

---

## Ce qu'Argo Workflows fait bien

Argo Workflows part du principe que l'unité de travail est un conteneur sur Kubernetes. Steps, DAGs, retries, artifacts et exit handlers reposent sur cette hypothèse.

Forces concrètes :

* **Même runtime que les services de prod.** Build once, même image en Job/pod avec de la colle workflow.
* **Scaling natif du cluster.** Pas d'histoire de flotte Celery séparée si le cluster scale déjà les nœuds.
* **Définitions en forme de Git.** YAML dans le repo, review en PR, souvent généré (Hera, Couler, codegen).
* **Bon fit ML et batch sur K8s.** Nœuds GPU, volume claims, service accounts, network policies : objets K8s normaux.

Coûts concrets :

* **Tout devient conteneur.** « Lance juste ce SQL dans le warehouse » implique image, credentials et cycle de vie de pod même pour un client de query de 200 ms.
* **La logique métier Python vit ailleurs.** Soit vous l'emballez dans des images, soit vous maintenez une couche de génération. Vous n'avez pas gratuitement le « édite un DAG et pense en Python » d'Airflow.
* **Multi-cluster / hors K8s est maladroit.** Le modèle providers d'Airflow reste plus fort quand la moitié de l'estate n'est pas dans le cluster.

Si vous ne pilotez pas déjà bien Kubernetes, Argo Workflows ne supprime pas la complexité. Il la déplace vers CRDs, controllers et RBAC.

---

## Tests de décision qui marchent vraiment

### 1. Où les étapes s'exécutent-elles aujourd'hui ?

* Surtout warehouses, APIs SaaS, VMs, jobs multi-cloud → **Airflow** (ou Airflow managé) est le cerveau le moins frottant.
* Surtout conteneurs sur un ou quelques clusters → **Argo Workflows** est cohérent.

### 2. Qui écrit les pipelines ?

* Analytics/data engineers en notebooks Python et SQL warehouse → **Airflow**.
* Platform/ML engineers qui écrivent déjà du Deployment YAML et des Dockerfiles → **Argo**.

### 3. Quel failure domain voulez-vous ?

* Airflow : scheduler + DB + workers. Quand la DB de métadonnées souffre, tout souffre.
* Argo : API Kubernetes + workflow controller. Quand le cluster souffre, les workflows souffrent avec les apps.

Choisissez le failure domain que votre on-call comprend déjà.

### 4. Avez-vous besoin de backfills de première classe ?

Backfills et retraitement historique restent un sport d'équipes data. Le modèle Airflow y est rodé. Argo peut relancer des workflows ; la culture produit autour des data intervals et du catchup est plus fine.

### 5. Êtes-vous sur le point d'« utiliser les deux » ?

Parfois c'est juste :

* **Argo** pour les étapes compute lourdes sur K8s (training, spark-on-k8s, gros builds d'images)
* **Airflow** comme schedule métier externe et colle inter-systèmes

L'anti-pattern : deux orchestrateurs pour le même graphe sans ligne d'ownership. Ensuite vous debuggez deux fois.

---

## Un mapping pratique

| Type de pipeline | Penchez vers |
| --- | --- |
| Transforms warehouse de nuit + extracts SaaS | Airflow |
| Entraînement ML multi-étapes sur nœuds GPU | Argo Workflows |
| Batch type CI (build → test → scan → publish) sur K8s | Argo Workflows |
| Colle multi-cloud avec beaucoup d'operators | Airflow |
| DAGs courts, event-ish, 100 % conteneur | Argo Workflows |
| Gros backfills sur des années de partitions | Airflow |

Les options managées changent la math ops (MWAA, Cloud Composer, Astro, installers Argo), pas le modèle mental. Airflow managé pense encore en DAGs et providers. Argo packagé ou managé pense encore en pods et CRDs.

---

## Notes d'implémentation qu'on saute

**Airflow**

* Gardez les DAGs fins : poussez le lourd vers warehouses, Spark ou conteneurs ; ne tournez pas des boucles CPU de 40 minutes dans un PythonOperator.
* Traitez la DB de métadonnées comme de la data de prod. Backup. Surveillez les connection counts.
* Préférez pools et SLAs explicites pour la capacité workers partagée.

**Argo Workflows**

* Standardisez images de base et entrypoints ou vous noyez sous les conteneurs one-off.
* Utilisez des dépôts d'artifacts volontairement (S3/GCS/MinIO). « logs dans le pod » n'est pas un contrat de données.
* Générez le YAML depuis le code si les humains ne peuvent pas review des specs de 2 000 lignes.

**Les deux**

* Secrets dans un vrai secret store. Aucun des deux ne pardonne le plaintext éternel dans les DAGs ou ConfigMaps.
* Définissez l'ownership : qui est réveillé quand le pipeline de 3h rate le dashboard.

---

## En bref

Airflow et Argo Workflows résolvent le même titre (exécuter un graphe d'étapes de façon fiable) avec des terrains de jeu différents.

* Choisissez **Airflow** quand le graphe traverse des systèmes et que les auteurs pensent en Python et en temps data.
* Choisissez **Argo Workflows** quand le graphe est container-native et que les auteurs opèrent déjà Kubernetes comme runtime.
* Ne choisissez pas selon la mode des billets de blog. Choisissez selon où le travail tourne, qui écrit les pipelines, et quel control plane vous acceptez de garder sain à 3h du matin.

Si le cluster est jeune et le data stack large, commencez par Airflow. Si chaque job est déjà un conteneur et que le warehouse n'est qu'un autre client API dans un pod, Argo Workflows se sentira moins faux.
