---
title: "Gérer les connexions aux bases de données à l'échelle dans les fonctions Serverless"
description: "Comment éviter l'épuisement des connexions aux bases de données dans AWS Lambda et gérer efficacement les pools de connexions."
date: 2026-01-03
tags: [Serverless, Base de Données, AWS Lambda, PostgreSQL, Conception de Systèmes]
coverImage: /assets/images/serverless-database.webp
previewImage: /assets/images/serverless-database.webp
---

Les architectures Serverless comme AWS Lambda s'adaptent instantanément pour gérer les pics de trafic. Cependant, las bases de données relationnelles traditionnelles comme PostgreSQL et MySQL n'ont pas été conçues pour ce modèle de mise à l'échelle éphémère. Elles nécessitent un pool stable de connexions à longue durée de vie.

Lorsque des milliers de fonctions Lambda s'activent simultanément, elles peuvent facilement surcharger votre base de données, entraînant **l'épuisement du pool de connexions** et l'interruption de l'application.

---

## La cause profonde : les pics de connexion

Dans une architecture de serveur traditionnelle, une seule instance d'application établit un pool de connexions (par exemple, 20 connexions) et le partage entre toutes les requêtes simultanées.

Dans un modèle Serverless :
* Chaque instance Lambda active s'exécute dans son propre conteneur isolé.
* Chaque conteneur établit sa propre connexion à la base de données.
* Si votre application passe à **1 000 exécutions simultanées**, vous effectuerez **1 000 requêtes de connexion distinctes** à votre base de données. La plupart des moteurs de base de données manqueront de mémoire ou dépasseront leurs limites maximales de connexion, renvoyant des erreurs `Too Many Connections`.

---

## Bonnes pratiques pour les connexions BD Serverless

Pour éviter l'épuisement des connexions et assurer le bon fonctionnement de votre application serverless, implémentez ces patterns :

### 1. Initialiser les connexions en dehors du handler
Dans AWS Lambda, déclarez votre client de base de données *en dehors* de la fonction handler. Cela permet à la connexion de persister lors des invocations ultérieures de la même instance de conteneur (démarrages à chaud ou warm starts).

```javascript
// Client de base de données initialisé en dehors du handler (s'exécute une fois lors d'un démarrage à froid)
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
let isConnected = false;

exports.handler = async (event) => {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  
  const res = await client.query('SELECT NOW()');
  return { statusCode: 200, body: JSON.stringify(res.rows) };
};
```

### 2. Utiliser un proxy de base de données
Au lieu de vous connecter directement à la base de données, acheminez vos requêtes de connexion via un proxy. Un proxy intercepte les requêtes, regroupe les connexions à la base de données et les partage efficacement entre des milliers de fonctions éphémères.

* **AWS RDS Proxy :** Un proxy de base de données entièrement géré qui regroupe les connexions à la base de données, améliore la sécurité et gère les basculements de manière transparente.
* **Prisma Accelerate :** Un proxy de base de données serverless populaire pour les applications Node.js.

### 3. Minimiser la taille des pools
Si vous utilisez un ORM ou une bibliothèque de pool de connexions au sein de votre fonction serverless, définissez la taille maximale du pool (`max`) sur **1**. Il n'est pas nécessaire qu'un seul conteneur Lambda conserve un pool de 10 connexions, car un conteneur ne traite qu'une seule requête à la fois.

---

## Résumé

La mise à l'échelle des architectures serverless nécessite de repenser la façon de gérer les bases de données relationnelles. En mettant en cache les clients de connexion en dehors du handler, en minimisant la taille des pools internes et en utilisant un proxy de base de données comme AWS RDS Proxy, vous pouvez éviter les plantages de connexion à la base de données et créer des applications serverless résilientes à l'échelle du cloud.
