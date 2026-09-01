---
title: "Kubernetes Concepts You Need to Ship a Service"
description: "Pods, Deployments, Services, Ingress, probes, ConfigMaps, and Secrets: the minimal path to run one HTTP service on Kubernetes without a certification dump."
date: "2026-06-21"
tags: [Cloud & DevOps]
coverImage: /assets/images/kubernetes-ship-a-service.webp
previewImage: /assets/images/kubernetes-ship-a-service.webp
---


Kubernetes feels overwhelming when approached as an encyclopedia of fifty distinct YAML resources. In practice, shipping a reliable service centers on mastering four core primitives: Deployments, Services, Ingress, and health probes.

That is the practical path. Everything else (Jobs, CronJobs, StatefulSets, NetworkPolicies, CRDs) can wait until the first service is healthy.

---

## The mental model

Think in layers, bottom to top:

```
Internet
   |
 Ingress  (HTTP routing, TLS termination)
   |
 Service  (stable DNS + load balance across Pods)
   |
 Deployment  (desired replicas, rollouts, rollback)
   |
 Pod(s)  (one or more containers + volumes + probes)
   |
 ConfigMap / Secret  (injected as env or files)
```

Cluster networking, nodes, and the control plane exist under this. You care about them when something is broken. Day one, you care about the stack above.

**One rule that saves pain:** a Pod is replaceable. Never point a load balancer at a Pod IP. Point it at a Service. Deployments create new Pods on every rollout; IPs change.

---

## Pod: the unit that actually runs

A Pod is the smallest deployable unit. One Pod usually runs **one main container** (your app). Sidecars are optional.

You rarely create Pods by hand in production. You create them through a controller (Deployment). Still, the Pod template is where you put:

* container image and command
* ports
* environment variables
* volume mounts
* resource requests/limits
* probes

If the process exits, the Pod dies. Restart policy and the Deployment decide what happens next.

---

## Deployment: desired count and safe rollouts

A **Deployment** says: "I want N copies of this Pod template, and I want rollouts to be controlled."

What you get for free:

* **replicas:** scale from 1 to N
* **rolling updates:** new Pods come up before old ones go down (within surge/unavailable settings)
* **rollback:** previous ReplicaSet is still around for a while
* **self-heal:** if a node dies, the controller schedules replacements elsewhere

Without a Deployment (or similar controller), a dead Pod stays dead. That is fine for a one-off debug Pod. It is not fine for a service.

Minimal knobs that matter early:

* `replicas: 2` (or more) once you care about a node failure
* `resources.requests` so the scheduler can place you
* a readiness probe so the Service does not send traffic to cold Pods during a rollout

---

## Service: stable name inside the cluster

A **Service** selects Pods by labels and gives them a stable virtual IP and DNS name.

Typical pattern for an HTTP app:

* Pod labels: `app: billing-api`
* Service selector: `app: billing-api`
* Service type: `ClusterIP` (default)
* targetPort: the container port (e.g. `8080`)

Inside the cluster, other workloads call `http://billing-api:8080` (or the namespace-qualified DNS name). They never need Pod IPs.

Service types in one line:

| Type | Use when |
| --- | --- |
| **ClusterIP** | Internal only (most microservices) |
| **NodePort** | Quick external access without a load balancer (labs, some bare metal) |
| **LoadBalancer** | Cloud provider provisions an external LB to this Service |
| **ExternalName** | DNS alias to something outside the cluster |

For browser or public API traffic, people usually put **Ingress** in front of a ClusterIP Service, not a LoadBalancer per app (unless the platform standard says otherwise).

---

## Ingress: HTTP from the outside world

**Ingress** is an API object that describes HTTP(S) routing: host, path, backend Service. An **Ingress controller** (nginx, Traefik, cloud controller, etc.) turns that into real config.

Sketch:

```
api.example.com/billing  ->  Service billing-api:80  ->  Pods on 8080
api.example.com/users    ->  Service users-api:80    ->  Pods on 8080
```

TLS often terminates at the Ingress. Cert management (cert-manager or cloud certs) is separate from the app Deployment.

Note: Kubernetes is moving many teams toward the **Gateway API**. The mental model is the same: something at the edge routes HTTP to Services. If your cluster standard is Gateway, use that; the Pod / Deployment / Service story below does not change.

---

## Probes: when traffic is allowed

Probes are how Kubernetes learns app health without reading your mind.

| Probe | Question it answers | Typical action |
| --- | --- | --- |
| **readiness** | Can this Pod take traffic *now*? | Remove from Service endpoints until ready |
| **liveness** | Is the process stuck? | Restart the container |
| **startup** | Is a slow boot still in progress? | Hold off liveness until startup succeeds |

Practical defaults for a normal HTTP API:

* **readiness:** `GET /health` or `/ready`, short timeout, fail a few times before removing from Service
* **liveness:** something that fails only on deadlock or permanent hang, not on slow dependencies
* **startup:** use if boot takes longer than your liveness grace (JVM, large models, migrations)

Common mistake: a liveness probe that hits the database. A DB blip then restarts every Pod and makes the outage worse. Keep liveness local. Put dependency checks on readiness (or on a separate status that degrades gracefully).

---

## ConfigMap and Secret

**ConfigMap:** non-secret config (feature flags, public URLs, log level).

**Secret:** credentials, tokens, private keys. Base64 in etcd by default is not encryption at rest unless the cluster enables it. Treat Secrets as better than plain env in Git, not as a vault replacement. For real secret stores, many teams still inject from AWS Secrets Manager, GCP Secret Manager, or Vault via CSI or init jobs.

Injection patterns:

1. **Environment variables** from `configMapKeyRef` / `secretKeyRef`
2. **Files** via volume mounts (good for multi-line config and TLS material)

Do not bake production secrets into the image. Do not commit raw Secret YAML with live passwords to a public repo.

---

## Minimal deploy sketch

Below is a single-file mental sketch for one HTTP service. Names and ports are examples. Split into separate files in real repos if you prefer.

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

Apply order that matches dependency thinking:

```bash
kubectl apply -f configmap.yaml -f secret.yaml
kubectl apply -f deployment.yaml -f service.yaml
kubectl apply -f ingress.yaml
kubectl rollout status deployment/billing-api
kubectl get pods,svc,ingress -l app=billing-api
```

If Pods are `Running` but not `Ready`, check readiness probe path and logs before blaming Ingress.

---

## Labels are the glue

Deployments, Services, and NetworkPolicies find Pods by **labels**, not by name. Keep a small, consistent set:

* `app: billing-api`
* optional: `version: v1` (or let Deployment/rollout tooling own that)

If the Service selector does not match Pod labels, endpoints stay empty and traffic dies with no obvious Deployment error. First debugging step: `kubectl get endpoints billing-api` (or `EndpointSlice`).

---

## What you can skip on day one

You can ship a real service without these, then add them when the need is concrete:

* **HPA / VPA** until you have traffic patterns worth auto-scaling
* **PDB** once you run multi-replica and care about voluntary disruption
* **NetworkPolicy** when multi-tenant or zero-trust rules are required
* **StatefulSet + PVC** when you need stable identity or local disk (databases need more design than a stateless API)
* **Service mesh** until mTLS and traffic policy across many services justify the cost
* **Custom operators** until a CRD actually owns a lifecycle you cannot express with Deployments

Certs, DNS, and image pull secrets are platform setup. Wire them once; app YAML stays thin.

---

## A short ship checklist

1. Image runs locally and answers `/ready` and `/live` (or your chosen paths).
2. Deployment with resource requests and at least the probes you need.
3. Service with matching labels; endpoints non-empty.
4. ConfigMap / Secret for anything that changes per environment.
5. Ingress (or Gateway / LoadBalancer) for external HTTP if required.
6. `kubectl rollout status` green; hit the public path once.
7. Confirm a bad deploy rolls back: `kubectl rollout undo deployment/billing-api`.

That is enough Kubernetes to own a service end to end. Learn the rest when a failure or a product requirement forces it, not because a syllabus listed it.

