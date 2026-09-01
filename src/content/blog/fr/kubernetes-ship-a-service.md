---
title: "Concepts Kubernetes pour publier un service"
description: "Pods, Deployments, Services, Ingress, probes, ConfigMaps et Secrets : le chemin minimal pour faire tourner un service HTTP sur Kubernetes sans fiche de certification."
date: "2026-06-21"
tags: [Cloud et DevOps]
coverImage: /assets/images/kubernetes-ship-a-service.webp
previewImage: /assets/images/kubernetes-ship-a-service.webp
---


Vous n'avez pas besoin de chaque objet Kubernetes pour publier un service. La plupart des API de production qui atterrissent sur un cluster utilisent le même petit stack : un **Pod** qui exécute le conteneur, un **Deployment** qui maintient le bon nombre de Pods vivants, un **Service** qui leur donne un nom réseau stable, un **Ingress** (ou Gateway) qui accepte le HTTP depuis l'extérieur, des **probes** pour que la plateforme sache quand le trafic est sûr, et **ConfigMap / Secret** pour la config et les identifiants.

C'est le chemin pratique. Tout le reste (Jobs, CronJobs, StatefulSets, NetworkPolicies, CRDs) peut attendre que le premier service soit sain.

---

## Le modèle mental

Pensez en couches, du bas vers le haut :

```
Internet
   |
 Ingress  (routage HTTP, terminaison TLS)
   |
 Service  (DNS stable + répartition entre Pods)
   |
 Deployment  (réplicas désirées, rollouts, rollback)
   |
 Pod(s)  (un ou plusieurs conteneurs + volumes + probes)
   |
 ConfigMap / Secret  (injectés en env ou en fichiers)
```

Le réseau du cluster, les nœuds et le control plane existent en dessous. Ils comptent quand quelque chose casse. Le jour un, c'est le stack du dessus qui compte.

**Une règle qui évite la douleur :** un Pod est remplaçable. Ne pointez jamais un load balancer vers l'IP d'un Pod. Pointez-le vers un Service. Les Deployments créent de nouveaux Pods à chaque rollout ; les IP changent.

---

## Pod : l'unité qui tourne vraiment

Un Pod est la plus petite unité déployable. Un Pod exécute en général **un conteneur principal** (votre app). Les sidecars sont optionnels.

Vous créez rarement des Pods à la main en production. Vous les créez via un controller (Deployment). La template du Pod reste l'endroit où vous mettez :

* image du conteneur et command
* ports
* variables d'environnement
* montages de volumes
* requests/limits de ressources
* probes

Si le process sort, le Pod meurt. La restart policy et le Deployment décident de la suite.

---

## Deployment : nombre désiré et rollouts sûrs

Un **Deployment** dit : "je veux N copies de cette template de Pod, et je veux des rollouts contrôlés."

Ce que vous obtenez gratuitement :

* **replicas :** scaler de 1 à N
* **rolling updates :** de nouveaux Pods montent avant que les anciens descendent (dans les limites surge/unavailable)
* **rollback :** le ReplicaSet précédent reste un moment
* **self-heal :** si un nœud meurt, le controller place des remplacements ailleurs

Sans Deployment (ou controller équivalent), un Pod mort reste mort. Acceptable pour un Pod de debug. Inacceptable pour un service.

Réglages minimaux qui comptent tôt :

* `replicas: 2` (ou plus) dès qu'une panne de nœud vous importe
* `resources.requests` pour que le scheduler puisse vous placer
* une readiness probe pour que le Service n'envoie pas de trafic vers des Pods froids pendant un rollout

---

## Service : nom stable dans le cluster

Un **Service** sélectionne des Pods par labels et leur donne une IP virtuelle stable et un nom DNS.

Schéma typique pour une app HTTP :

* labels du Pod : `app: billing-api`
* selector du Service : `app: billing-api`
* type de Service : `ClusterIP` (défaut)
* targetPort : le port du conteneur (ex. `8080`)

Dans le cluster, les autres workloads appellent `http://billing-api:8080` (ou le DNS qualifié par namespace). Ils n'ont jamais besoin des IP de Pod.

Types de Service en une ligne :

| Type | À utiliser quand |
| --- | --- |
| **ClusterIP** | Interne seulement (la plupart des microservices) |
| **NodePort** | Accès externe rapide sans load balancer (labs, un peu de bare metal) |
| **LoadBalancer** | Le cloud provisionne un LB externe vers ce Service |
| **ExternalName** | Alias DNS vers quelque chose hors cluster |

Pour le trafic navigateur ou API publique, on met en général un **Ingress** devant un Service ClusterIP, pas un LoadBalancer par app (sauf si le standard de la plateforme dit le contraire).

---

## Ingress : le HTTP depuis le monde extérieur

**Ingress** est un objet d'API qui décrit le routage HTTP(S) : host, path, Service backend. Un **Ingress controller** (nginx, Traefik, controller cloud, etc.) en fait de la config réelle.

Schéma :

```
api.example.com/billing  ->  Service billing-api:80  ->  Pods sur 8080
api.example.com/users    ->  Service users-api:80    ->  Pods sur 8080
```

Le TLS se termine souvent à l'Ingress. La gestion des certificats (cert-manager ou certs cloud) est séparée du Deployment de l'app.

Note : Kubernetes pousse beaucoup d'équipes vers la **Gateway API**. Le modèle mental est le même : quelque chose en bordure route le HTTP vers des Services. Si le standard de votre cluster est Gateway, utilisez-le ; l'histoire Pod / Deployment / Service ci-dessous ne change pas.

---

## Probes : quand le trafic est autorisé

Les probes sont la façon dont Kubernetes apprend la santé de l'app sans lire dans vos pensées.

| Probe | Question à laquelle elle répond | Action typique |
| --- | --- | --- |
| **readiness** | Ce Pod peut-il prendre du trafic *maintenant* ? | Retirer des endpoints du Service jusqu'à prêt |
| **liveness** | Le process est-il bloqué ? | Redémarrer le conteneur |
| **startup** | Un boot lent est-il encore en cours ? | Suspendre la liveness jusqu'au succès du startup |

Defaults pratiques pour une API HTTP normale :

* **readiness :** `GET /health` ou `/ready`, timeout court, quelques échecs avant de sortir du Service
* **liveness :** quelque chose qui échoue seulement en deadlock ou hang permanent, pas sur des dépendances lentes
* **startup :** à utiliser si le boot dépasse la grâce de liveness (JVM, gros modèles, migrations)

Erreur fréquente : une liveness probe qui tape la base de données. Un blip DB redémarre alors tous les Pods et aggrave l'outage. Gardez la liveness locale. Mettez les checks de dépendances en readiness (ou sur un status qui dégrade proprement).

---

## ConfigMap et Secret

**ConfigMap :** config non secrète (feature flags, URLs publiques, log level).

**Secret :** identifiants, tokens, clés privées. Le Base64 dans etcd par défaut n'est pas du chiffrement au repos sauf si le cluster l'active. Traitez les Secrets comme mieux que de l'env en clair dans Git, pas comme un remplacement de vault. Pour de vrais stores, beaucoup d'équipes injectent encore depuis AWS Secrets Manager, GCP Secret Manager ou Vault via CSI ou jobs d'init.

Patterns d'injection :

1. **Variables d'environnement** via `configMapKeyRef` / `secretKeyRef`
2. **Fichiers** via montages de volumes (bon pour la config multi-lignes et le matériel TLS)

N'intégrez pas de secrets de production dans l'image. Ne poussez pas de YAML Secret avec des mots de passe live dans un dépôt public.

---

## Esquisse de deploy minimale

Ci-dessous, une esquisse mentale en un fichier pour un service HTTP. Noms et ports sont des exemples. En vrai repo, vous pouvez découper en fichiers si vous préférez.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: billing-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: billing-api
  template:
    metadata:
      labels:
        app: billing-api
    spec:
      containers:
        - name: app
          image: registry.example.com/billing-api:1.4.2
          ports:
            - containerPort: 8080
          env:
            - name: LOG_LEVEL
              valueFrom:
                configMapKeyRef:
                  name: billing-api-config
                  key: logLevel
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: billing-api-secret
                  key: dbPassword
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
            limits:
              memory: "512Mi"
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /live
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: billing-api
spec:
  selector:
    app: billing-api
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: billing-api
spec:
  ingressClassName: nginx
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /billing
            pathType: Prefix
            backend:
              service:
                name: billing-api
                port:
                  number: 80
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: billing-api-config
data:
  logLevel: info
---
apiVersion: v1
kind: Secret
metadata:
  name: billing-api-secret
type: Opaque
stringData:
  dbPassword: "replace-me"
```

Ordre d'apply aligné sur les dépendances :

```bash
kubectl apply -f configmap.yaml -f secret.yaml
kubectl apply -f deployment.yaml -f service.yaml
kubectl apply -f ingress.yaml
kubectl rollout status deployment/billing-api
kubectl get pods,svc,ingress -l app=billing-api
```

Si les Pods sont `Running` mais pas `Ready`, vérifiez le path de readiness et les logs avant d'accuser l'Ingress.

---

## Les labels sont la colle

Deployments, Services et NetworkPolicies trouvent les Pods par **labels**, pas par nom. Gardez un petit set cohérent :

* `app: billing-api`
* optionnel : `version: v1` (ou laissez l'outil de rollout le gérer)

Si le selector du Service ne matche pas les labels des Pods, les endpoints restent vides et le trafic meurt sans erreur évidente de Deployment. Premier pas de debug : `kubectl get endpoints billing-api` (ou `EndpointSlice`).

---

## Ce que vous pouvez ignorer le jour un

Vous pouvez publier un vrai service sans ceci, puis l'ajouter quand le besoin est concret :

* **HPA / VPA** tant que vous n'avez pas de patterns de trafic qui justifient l'auto-scaling
* **PDB** une fois en multi-réplica et sensibles aux disruptions volontaires
* **NetworkPolicy** pour du multi-tenant ou des règles zero-trust
* **StatefulSet + PVC** quand vous avez besoin d'identité stable ou de disque local (les bases demandent plus de design qu'une API stateless)
* **Service mesh** tant que mTLS et la politique de trafic entre beaucoup de services ne justifient pas le coût
* **Operators custom** tant qu'un CRD ne possède pas vraiment un cycle de vie impossible à exprimer avec des Deployments

Certs, DNS et image pull secrets sont du setup plateforme. Branchez-les une fois ; le YAML de l'app reste mince.

---

## Checklist courte pour publier

1. L'image tourne en local et répond sur `/ready` et `/live` (ou vos paths).
2. Deployment avec resource requests et au moins les probes nécessaires.
3. Service avec labels qui matchent ; endpoints non vides.
4. ConfigMap / Secret pour ce qui change par environnement.
5. Ingress (ou Gateway / LoadBalancer) pour le HTTP externe si besoin.
6. `kubectl rollout status` au vert ; un hit sur le path public.
7. Confirmer qu'un mauvais deploy rollback : `kubectl rollout undo deployment/billing-api`.

C'est assez de Kubernetes pour posséder un service de bout en bout. Apprenez le reste quand une panne ou un besoin produit vous y force, pas parce qu'un syllabus l'a listé.

