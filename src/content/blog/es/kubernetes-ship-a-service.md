---
title: "Conceptos de Kubernetes que necesitas para publicar un servicio"
description: "Pods, Deployments, Services, Ingress, probes, ConfigMaps y Secrets: el camino mínimo para correr un servicio HTTP en Kubernetes sin un temario de certificación."
date: "2026-06-21"
tags: [Contenedores, DevOps, Nube]
coverImage: /assets/images/kubernetes-ship-a-service.webp
previewImage: /assets/images/kubernetes-ship-a-service.webp
---

No necesitas cada objeto de Kubernetes para publicar un servicio. La mayoría de las APIs de producción que aterrizan en un cluster usan el mismo stack pequeño: un **Pod** que corre el contenedor, un **Deployment** que mantiene el número correcto de Pods vivos, un **Service** que les da un nombre de red estable, un **Ingress** (o Gateway) que acepta HTTP desde fuera, **probes** para que la plataforma sepa cuándo el tráfico es seguro, y **ConfigMap / Secret** para configuración y credenciales.

Ese es el camino práctico. Todo lo demás (Jobs, CronJobs, StatefulSets, NetworkPolicies, CRDs) puede esperar hasta que el primer servicio esté sano.

---

## El modelo mental

Piensa en capas, de abajo hacia arriba:

```
Internet
   |
 Ingress  (enrutado HTTP, terminación TLS)
   |
 Service  (DNS estable + balanceo entre Pods)
   |
 Deployment  (réplicas deseadas, rollouts, rollback)
   |
 Pod(s)  (uno o más contenedores + volúmenes + probes)
   |
 ConfigMap / Secret  (inyectados como env o archivos)
```

La red del cluster, los nodos y el control plane existen debajo. Te importan cuando algo falla. El día uno, te importa el stack de arriba.

**Una regla que evita dolor:** un Pod es reemplazable. Nunca apuntes un load balancer a la IP de un Pod. Apúntalo a un Service. Los Deployments crean Pods nuevos en cada rollout; las IPs cambian.

---

## Pod: la unidad que realmente corre

Un Pod es la unidad desplegable más pequeña. Un Pod suele correr **un contenedor principal** (tu app). Los sidecars son opcionales.

Casi nunca creas Pods a mano en producción. Los creas a través de un controller (Deployment). Aun así, la plantilla del Pod es donde pones:

* imagen del contenedor y command
* puertos
* variables de entorno
* montajes de volúmenes
* requests/limits de recursos
* probes

Si el proceso sale, el Pod muere. La restart policy y el Deployment deciden qué pasa después.

---

## Deployment: conteo deseado y rollouts seguros

Un **Deployment** dice: "quiero N copias de esta plantilla de Pod, y quiero rollouts controlados."

Lo que obtienes de regalo:

* **replicas:** escala de 1 a N
* **rolling updates:** suben Pods nuevos antes de bajar los viejos (dentro de surge/unavailable)
* **rollback:** el ReplicaSet anterior sigue un rato
* **self-heal:** si un nodo muere, el controller agenda reemplazos en otro sitio

Sin un Deployment (o un controller similar), un Pod muerto se queda muerto. Vale para un Pod de debug. No vale para un servicio.

Perillas mínimas que importan pronto:

* `replicas: 2` (o más) cuando te importe un fallo de nodo
* `resources.requests` para que el scheduler pueda colocarte
* una readiness probe para que el Service no mande tráfico a Pods fríos durante un rollout

---

## Service: nombre estable dentro del cluster

Un **Service** selecciona Pods por labels y les da una IP virtual estable y un nombre DNS.

Patrón típico para una app HTTP:

* labels del Pod: `app: billing-api`
* selector del Service: `app: billing-api`
* tipo de Service: `ClusterIP` (por defecto)
* targetPort: el puerto del contenedor (p. ej. `8080`)

Dentro del cluster, otros workloads llaman a `http://billing-api:8080` (o el DNS con namespace). Nunca necesitan IPs de Pod.

Tipos de Service en una línea:

| Tipo | Úsalo cuando |
| --- | --- |
| **ClusterIP** | Solo interno (la mayoría de microservicios) |
| **NodePort** | Acceso externo rápido sin load balancer (labs, algo de bare metal) |
| **LoadBalancer** | El cloud provisiona un LB externo hacia este Service |
| **ExternalName** | Alias DNS a algo fuera del cluster |

Para tráfico de browser o API pública, la gente suele poner **Ingress** delante de un Service ClusterIP, no un LoadBalancer por app (salvo que el estándar de la plataforma diga otra cosa).

---

## Ingress: HTTP desde el mundo exterior

**Ingress** es un objeto de API que describe el enrutado HTTP(S): host, path, Service backend. Un **Ingress controller** (nginx, Traefik, controller del cloud, etc.) lo convierte en config real.

Esquema:

```
api.example.com/billing  ->  Service billing-api:80  ->  Pods en 8080
api.example.com/users    ->  Service users-api:80    ->  Pods en 8080
```

TLS suele terminar en el Ingress. La gestión de certificados (cert-manager o certs del cloud) es aparte del Deployment de la app.

Nota: Kubernetes está llevando a muchos equipos hacia la **Gateway API**. El modelo mental es el mismo: algo en el borde enruta HTTP hacia Services. Si el estándar de tu cluster es Gateway, úsalo; la historia Pod / Deployment / Service de abajo no cambia.

---

## Probes: cuándo se permite el tráfico

Las probes son cómo Kubernetes aprende la salud de la app sin leerte la mente.

| Probe | Pregunta que responde | Acción típica |
| --- | --- | --- |
| **readiness** | ¿Puede este Pod tomar tráfico *ahora*? | Quitar de los endpoints del Service hasta que esté listo |
| **liveness** | ¿El proceso está atascado? | Reiniciar el contenedor |
| **startup** | ¿Un boot lento sigue en curso? | Pausar liveness hasta que startup pase |

Defaults prácticos para una API HTTP normal:

* **readiness:** `GET /health` o `/ready`, timeout corto, fallar unas veces antes de salir del Service
* **liveness:** algo que falle solo en deadlock o cuelgue permanente, no en dependencias lentas
* **startup:** úsala si el boot tarda más que la gracia de liveness (JVM, modelos grandes, migraciones)

Error común: una liveness probe que pega a la base de datos. Un blip de DB entonces reinicia todos los Pods y empeora el outage. Mantén liveness local. Pon checks de dependencias en readiness (o en un status que degrade con elegancia).

---

## ConfigMap y Secret

**ConfigMap:** config no secreta (feature flags, URLs públicas, log level).

**Secret:** credenciales, tokens, claves privadas. Base64 en etcd por defecto no es cifrado en reposo salvo que el cluster lo active. Trata los Secrets como mejor que env plano en Git, no como un reemplazo de un vault. Para stores reales, muchos equipos siguen inyectando desde AWS Secrets Manager, GCP Secret Manager o Vault vía CSI o jobs de init.

Patrones de inyección:

1. **Variables de entorno** desde `configMapKeyRef` / `secretKeyRef`
2. **Archivos** vía montajes de volumen (bien para config multilínea y material TLS)

No metas secretos de producción en la imagen. No subas YAML de Secret con contraseñas vivas a un repo público.

---

## Esquema mínimo de deploy

Abajo va un esquema mental en un solo archivo para un servicio HTTP. Nombres y puertos son ejemplos. En repos reales puedes partirlo en archivos si prefieres.

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

Orden de apply que encaja con el pensamiento de dependencias:

```bash
kubectl apply -f configmap.yaml -f secret.yaml
kubectl apply -f deployment.yaml -f service.yaml
kubectl apply -f ingress.yaml
kubectl rollout status deployment/billing-api
kubectl get pods,svc,ingress -l app=billing-api
```

Si los Pods están `Running` pero no `Ready`, revisa la path de readiness y los logs antes de culpar al Ingress.

---

## Las labels son el pegamento

Deployments, Services y NetworkPolicies encuentran Pods por **labels**, no por nombre. Mantén un set pequeño y consistente:

* `app: billing-api`
* opcional: `version: v1` (o deja que el tooling de rollout lo gestione)

Si el selector del Service no coincide con las labels del Pod, los endpoints se quedan vacíos y el tráfico muere sin un error obvio del Deployment. Primer paso de debug: `kubectl get endpoints billing-api` (o `EndpointSlice`).

---

## Lo que puedes saltarte el día uno

Puedes publicar un servicio real sin esto y añadirlo cuando la necesidad sea concreta:

* **HPA / VPA** hasta que tengas patrones de tráfico que merezcan auto-scaling
* **PDB** cuando corras multi-réplica y te importen las disrupciones voluntarias
* **NetworkPolicy** cuando haya multi-tenant o reglas zero-trust
* **StatefulSet + PVC** cuando necesites identidad estable o disco local (las bases de datos piden más diseño que una API stateless)
* **Service mesh** hasta que mTLS y política de tráfico entre muchos servicios justifiquen el coste
* **Operators custom** hasta que un CRD realmente posea un ciclo de vida que no puedas expresar con Deployments

Certs, DNS e image pull secrets son setup de plataforma. Conéctalos una vez; el YAML de la app se queda delgado.

---

## Checklist corto para publicar

1. La imagen corre en local y responde `/ready` y `/live` (o las paths que elijas).
2. Deployment con resource requests y al menos las probes que necesitas.
3. Service con labels que coinciden; endpoints no vacíos.
4. ConfigMap / Secret para lo que cambia por entorno.
5. Ingress (o Gateway / LoadBalancer) para HTTP externo si hace falta.
6. `kubectl rollout status` en verde; pega una vez a la path pública.
7. Confirma que un deploy malo hace rollback: `kubectl rollout undo deployment/billing-api`.

Eso es suficiente Kubernetes para poseer un servicio de punta a punta. Aprende el resto cuando un fallo o un requisito de producto lo fuerce, no porque un temario lo listó.
