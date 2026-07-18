---
title: "Gérer les connexions aux bases de données à l'échelle dans les fonctions Serverless"
description: "Comment éviter l'épuisement des connexions aux bases de données dans AWS Lambda et gérer efficacement les pools de connexions."
date: 2026-01-03
tags: [Serverless, Base de données, AWS, Conception de systèmes]
coverImage: /assets/images/serverless-database.webp
previewImage: /assets/images/serverless-database.webp
---

Les architectures serverless comme AWS Lambda s'adaptent instantanément pour gérer les pics de trafic. Cependant, las bases de données relationnelles traditionnelles comme PostgreSQL et MySQL n'ont pas été conçues pour ce modèle d'exécution éphémère. Elles s'attendent à un pool stable de connexiones à longue durée de vie, et non à des milliers de connexions créées et détruites en quelques secondes.

Lorsque des centaines ou des milliers de fonctions Lambda démarrent simultanément, elles peuvent facilement saturer votre base de données, entraînant **l'épuisement du pool de connexions**, des pannes en cascade et des interruptions de service.

---

## La cause originelle : Les tempêtes de connexion

Dans une architecture serveur traditionnelle, une seule instance d'application établit un pool de connexions (par exemple, 20 connexions) y le partage entre toutes les requêtes simultanées. Trois instances derrière un répartiteur de charge signifient 60 connexions au total : un chiffre prévisible et facile à gérer.

Dans un modèle serverless, ce contrat est rompu :

* Chaque instance active de Lambda s'exécute dans son propre **conteneur isolé**.
* Chaque conteneur établit sa propre connexion à la base de données.
* Si votre application monte en charge à **1 000 exécutions simultanées**, vous effectuerez **1 000 requêtes de connexion distinctes** à la base de datos.
* La plupart des instances PostgreSQL acceptent par défaut un maximum de 100 connexions (`max_connections = 100`). Un RDS `db.t3.medium` supporte environ **150 connexions**. Vos 1 000 instances Lambda dépasseront cette limite instantanément, renvoyant l'erreur `FATAL: too many connections`.

Le problème est amplifié par les **démarrages à froid (cold starts)** : lors d'un pic de trafic, Lambda lance simultanément de nombreux conteneurs. Chacun tente d'ouvrir une connexion avant même de traiter la moindre requête, provoquant une surcharge de connexions.

---

## Stratégie 1 : Réutilisation des connexions lors des démarrages à chaud (Warm Starts)

L'optimisation la plus simple consiste à déclarer le client de base de données **en dehors** de la fonction handler. Les conteneurs Lambda persistant entre les appels lors des démarrages à chaud, une connexion établie lors de la première exécution sera réutilisée pour les requêtes suivantes.

```javascript
const { Client } = require('pg');

// Initialisé en dehors du handler — réutilisé lors des démarrages à chaud
let client = null;

async function getClient() {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
      statement_timeout: 30000,
    });
    await client.connect();
  }
  return client;
}

exports.handler = async (event) => {
  const db = await getClient();
  
  try {
    const res = await db.query('SELECT id, name FROM users WHERE active = $1', [true]);
    return { statusCode: 200, body: JSON.stringify(res.rows) };
  } catch (err) {
    // Gérer les connexions perdues suite au gel/dégel du conteneur Lambda
    if (err.code === 'EPIPE' || err.code === 'ECONNRESET') {
      client = null; // Forcer la reconnexion au prochain appel
      throw err;
    }
    throw err;
  }
};
```

**Points clés :**
- Les **requêtes paramétrées** (`$1`) évitent les injections SQL. N'insérez jamais de variables utilisateur directement dans vos chaînes de requête.
- **`connectionTimeoutMillis`** évite que la fonction Lambda ne reste bloquée indéfiniment si la base de données est saturée.
- **La gestion des sockets obsolètes (stale connections)** est cruciale. Lambda fige les conteneurs inactifs. Si le gel dure trop longtemps, le serveur de base de données peut fermer la connexion sans que le client Node.js n'en soit averti, provoquant des erreurs réseau.

### Fermeture propre des connexions

Les conteneurs Lambda finissent par être recyclés. Vous pouvez enregistrer un écouteur pour fermer proprement les connexions actives :

```javascript
process.on('beforeExit', async () => {
  if (client) {
    await client.end();
    client = null;
  }
});
```

Cela évite d'abandonner des connexions "fantômes" qui encombrent inutilement la base de données.

---

## Stratégie 2 : Utiliser un proxy de connexion

La réutilisation des connexions aide, mais ne règle pas le problème fondamental : **N conteneurs Lambda = N connexions**. Pour décorréler la scalabilité de Lambda de celle de votre base de données, vous devez interposer un proxy de connexion (connection pooler).

### AWS RDS Proxy (Géré)

**AWS RDS Proxy** se place entre vos fonctions Lambda et votre base de données RDS. Il maintient un pool de connexions persistant vers la base de données et y multiplexe les connexions éphémères de vos fonctions Lambda.

**Fonctionnement :**
1. Votre fonction Lambda se connecte au proxy au lieu de la base de données.
2. Le proxy maintient un pool stable (ex: 50 connexions) avec la base de données réelle.
3. Lorsqu'un conteneur Lambda effectue une requête, le proxy lui attribue une connexion libre du pool, puis la récupère immédiatement après l'exécution.
4. Une autre fonction réutilise la même connexion de base de données l'instant d'après.

**Avantages :**
- Transparent pour le code de votre application (seule la chaîne de connexion change).
- Supporte l'authentification IAM d'AWS, évitant de stocker des mots de passe dans les variables d'environnement.
- Gère automatiquement le basculement (failover) vers les réplicas en cas de panne de l'instance principale.

**Inconvénient :** RDS Proxy coûte environ $15-25/mois par proxy + $0,015 par vCPU-heure. Pour les applications de production, ce coût est dérisoire face à la stabilité obtenue.

### PgBouncer (Auto-hébergé)

**PgBouncer** est le pooler open-source le plus populaire pour PostgreSQL, idéal si vous souhaitez garder le contrôle ou si vous déployez hors d'AWS.

PgBouncer fonctionne selon trois modes :

| Mode | Comportement | Usage idéal |
|---|---|---|
| **Session** | Une connexion serveur dédiée par client pour toute la durée de sa session | Requêtes interactives |
| **Transaction** | Connexion libérée dès la fin de chaque transaction SQL | **La majorité des usages serverless** |
| **Statement** | Connexion libérée dès la fin de chaque requête SQL | Requêtes unitaires uniquement |

En serverless, le **mode transaction** est presque toujours le bon choix. Il permet à un pool de 50 connexions serveur de traiter les requêtes de milliers de conteneurs Lambda, car les connexions ne sont occupées que pendant l'exécution effective de chaque transaction.

**Déploiement :**
- **Sidecar sur EC2/ECS :** Déployez PgBouncer sur une petite instance dans le même VPC que votre base de datos.
- **Services gérés :** Des hébergeurs comme Supabase, Neon ou Crunchy Bridge intègrent PgBouncer par défaut dans leurs offres PostgreSQL.

### Comparatif des solutions de pooling

| Solution | Type | PostgreSQL | MySQL | Tarification | Usage idéal |
|---|---|---|---|---|---|
| **AWS RDS Proxy** | Géré | ✅ | ✅ | ~$20/mois + vCPU-heures | Projets AWS-native sans maintenance |
| **PgBouncer** | Auto-hébergé | ✅ | ❌ | Coût de l'instance d'hébergement | Projets multi-cloud avec contrôle total |
| **Prisma Accelerate** | Géré | ✅ | ✅ | Gratuit puis à l'usage | Projets Node.js utilisant l'ORM Prisma |
| **Neon Serverless Driver** | Géré | ✅ | ❌ | Inclus avec Neon | Projets utilisant Neon PostgreSQL |

---

## Stratégie 3 : Réduire la taille du pool interne

Si vous utilisez un ORM ou une bibliothèque gérant un pool de connexions (comme pg-pool) dans votre code Lambda, définissez la taille maximale du pool (`max`) à **1**. Cela peut sembler contre-intuitif, mais c'est essentiel :

```javascript
// Configuration Knex.js pour Lambda
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 0,  // Permet de fermer toutes les connexions inactives
    max: 1,  // Une seule connexion par conteneur Lambda
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
  },
});
```

**Pourquoi `max: 1` ?** Un conteneur Lambda ne traite qu'une seule requête à la fois. Il n'y a pas de parallélisme au sein d'un même conteneur. Conserver un pool local de 10 connexions signifie que 9 resteront inutilisées mais bloqueront quand même des slots de connexion sur votre serveur de base de données.

> Configurez également `min: 0`. Si le conteneur reste actif mais ne reçoit pas de trafic, `min: 1` maintiendrait une connexion ouverte inutilement. Avec `min: 0`, le pool local ferme la connexion après expiration du délai d'inactivité (`idleTimeoutMillis`).

---

## Stratégie 4 : Gérer les démarrages à froid (Cold Starts)

C'est lors des démarrages à froid que la charge est la plus critique. Lors d'un pic soudain de trafic, Lambda instancie simultanément des dizaines ou centaines de conteneurs, provoquant un afflux massif de demandes de connexion au même instant.

### Concurrence provisionnée (Provisioned Concurrency)

Cette option d'AWS Lambda maintient un nombre prédéfini de conteneurs actifs et chauds. Leurs connexions à la base de données étant déjà établies, les requêtes entrantes sont traitées sans délai ni nouvelle connexion.

```bash
aws lambda put-provisioned-concurrency-config \
  --function-name ma-fonction-api \
  --qualifier prod \
  --provisioned-concurrent-executions 50
```

**Coût :** Vous payez pour les instances actives en permanence (~$0.0000041667/Go-seconde). Pour une fonction de 512 Mo et 50 instances, cela représente environ **$2,70/jour**, un investissement rentable pour une API de production.

### Concurrence réservée (Reserved Concurrency)

Si vous ne pouvez pas utiliser de proxy et devez limiter strictement les connexions, configurez une limite de concurrence réservée sur votre fonction Lambda correspondant à la capacité de la base de données :

```bash
aws lambda put-function-concurrency \
  --function-name ma-fonction-api \
  --reserved-concurrent-executions 100
```

Si le trafic dépasse cette limite, les requêtes seront rejetées (HTTP 429) au lieu de faire planter le serveur de base de données.

---

## Stratégie 5 : Surveiller l'état des connexions

Pour éviter les pannes en production, vous devez disposer de métriques claires sur les connexions de votre base de données.

### Requêtes de surveillance PostgreSQL

Exécutez régulièrement ces requêtes pour auditer l'utilisation des connexions :

```sql
-- Nombre de connexions par état
SELECT state, count(*) 
FROM pg_stat_activity 
WHERE datname = 'votre_base'
GROUP BY state;

-- Connexions par application (pour identifier la fonction Lambda responsable)
SELECT application_name, count(*), state
FROM pg_stat_activity 
WHERE datname = 'votre_base'
GROUP BY application_name, state
ORDER BY count DESC;

-- Détecter les connexions inactives depuis plus de 5 minutes (fuites potentielles)
SELECT pid, usename, application_name, state, 
       now() - state_change AS idle_duration
FROM pg_stat_activity 
WHERE state = 'idle' 
  AND now() - state_change > interval '5 minutes';
```

### Alertes CloudWatch

Définissez des alertes sur les indicateurs suivants :

* **`DatabaseConnections`** (RDS) : Alerte à 80 % de `max_connections` pour intervenir avant la panne.
* **Lambda `Throttles`** : Si vous utilisez la concurrence réservée, pour savoir quand votre trafic s'approche des limites configurées.
* **Lambda `ConcurrentExecutions`** : Pour suivre le nombre de conteneurs actifs et dimensionner vos pools.

> **Astuce :** Spécifiez le paramètre de connexion `application_name` dans votre client SQL pour y inclure le nom de votre fonction Lambda. Cela rendra les rapports de `pg_stat_activity` immédiatement lisibles.

```javascript
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  application_name: `${process.env.AWS_LAMBDA_FUNCTION_NAME}-${process.env.AWS_LAMBDA_FUNCTION_VERSION}`,
});
```

---

## Conclusion

Faire monter en charge des architectures serverless impose d'adapter sa gestion des bases de données relationnelles. Le modèle traditionnel (pools locaux partagés et persistants) n'est plus adapté à des conteneurs isolés et éphémères.

Une architecture robuste repose sur la combinaison de ces méthodes :

1. **Réutiliser les connexions** sur les conteneurs actifs (warm starts).
2. **Utiliser un proxy de connexion** (RDS Proxy ou PgBouncer) pour isoler la base de données.
3. **Limiter la taille des pools locaux** à un maximum de 1.
4. **Dimensionner la concurrence** Lambda (provisionnée ou réservée) pour amortir les pics de charge.
5. **Surveiller activement** les connexions via `pg_stat_activity` et des alertes.

Dans la pratique, l'utilisation d'un proxy reste la solution la plus efficace, complétée par les optimisations de code pour garantir une stabilité maximale.
