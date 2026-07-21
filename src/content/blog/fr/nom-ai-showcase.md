---
title: "Présentation de NomAI : Le suivi de calories hors ligne propulsé par des LLM locaux"
description: "Une analyse approfondie de NomAI, le premier tracker de calories pour Android open-source, gratuit et entièrement hors ligne, conçu avec Google Gemma et Jetpack Compose."
date: 2026-07-10
tags: [IA, Android, LLM, Développement Mobile]
coverImage: /assets/images/nom-ai-showcase.webp
previewImage: /assets/images/nom-ai-showcase.webp
---

Le suivi des calories est un pilier des apps fitness modernes. Presque tous les trackers populaires du marché partagent les mêmes défauts : ils imposent des abonnements payants, affichent des publicités intrusives, nécessitent une connexion Internet permanente y revendent vos habitudes alimentaires à des courtiers en données tiers.

**NomAI propose une autre voie.** C'est un tracker de calories pour Android gratuit, open-source y entièrement hors ligne, fondé sur le respect absolu de la vie privée y l'IA embarquée sur le smartphone.

* **Dépôt GitHub :** [github.com/breejesh/nom.ai](https://github.com/breejesh/nom.ai)

---

## Les trois piliers de NomAI

NomAI a été conçu dès le départ pour bousculer les architectures mobiles classiques, en s'appuyant sur trois piliers fondamentaux :

### 1. 100 % gratuit et open-source (FOSS)
Aucun abonnement payant, aucun graphique verrouillé, aucune option premium. L'application est publiée sous licence MIT et est entièrement libre d'utilisation, de modification y de redistribution. Le code source complet, y compris les modèles de prompts et les configurations du modèle, está accessible à tous pour être audité, cloné ou amélioré.

### 2. Priorité à la vie privée (aucun serveur)
NomAI ne possède aucun serveur distant. Il n'existe physiquement aucune infrastructure cloud vers laquelle envoyer vos données. Vos mensurations, votre historique de repas y vos objectifs restent exclusivement stockés localement sur votre téléphone, dans la base de données Room. Ce n'est pas une simple charte de confidentialité, c'est un choix d'architecture.

### 3. Inférence LLM locale et hors ligne
L'analyse des repas et l'estimation des calories se font directement sur le téléphone. Propulsée par **Google Gemma-2B** et le runtime **LiteRT** de Google, l'application analyse les descriptions textuelles en langage naturel localement. Aucune connexion réseau n'est requise.

---

## Interface de l'application et captures d'écran

Pour découvrir l'interface et le fonctionnement de NomAI, voici un aperçu des principaux écrans.

### Thèmes système
Voici comment l'interface minimaliste s'adapte automatiquement entre le thème clair (aux teintes chaudes) et le thème sombre (aux couleurs nuit) :

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/home-light.png" width="260" alt="Light Dashboard">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/home-dark.png" width="260" alt="Dark Dashboard">
</p>

---

### L'ajout simplifié
L'enregistrement d'un repas se fait entièrement hors ligne : décrivez ce que vous avez mangé ou prenez une photo, validez les ingrédients extraits par l'IA y enregistrez le tout.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/input-methods.png" width="180" alt="Select Input Method">
  &nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/pompt-add.png" width="180" alt="Describe with AI">
  &nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/image-add.png" width="180" alt="Snap with Vision">
  &nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/meal-breakdown.png" width="180" alt="Meal Breakdown">
</p>

---

### Graphiques, historique y paramètres
Suivez l'évolution de vos macros avec les rapports hebdomadaires, parcourez votre historique ou configurez vos objectifs sans connexion.

<p align="left">
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/dashboard.png" width="240" alt="Dashboard Analytics">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/journal.png" width="240" alt="Meal Journal">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/breejesh/nom.ai/refs/heads/main/doc-images/settings.png" width="240" alt="App Settings">
</p>

---

## Prompt Engineering : Garantir des analyses fiables

Le principal défi technique de NomAI consiste à extraire des **données nutritionnelles structurées et exploitables** depuis un modèle de 2 milliards de paramètres qui n'a pas été spécifiquement entraîné pour la diététique.

La solution repose sur un prompt système rigoureusement structuré afin de canaliser les réponses du modèle :

```kotlin
fun buildNutritionPrompt(userInput: String): String = """
You are a nutritional analysis assistant. Analyze the following meal 
and estimate its nutritional content.

RULES:
- Use USDA standard reference values for common foods
- Use standard serving sizes when portions are not specified
- Round all values to the nearest integer
- Respond ONLY with the JSON below, no other text

OUTPUT FORMAT:
{"items": [{"name": "string", "calories": int, "protein_g": int, 
"carbs_g": int, "fat_g": int, "serving": "string"}], 
"total": {"calories": int, "protein_g": int, "carbs_g": int, "fat_g": int}}

MEAL: $userInput
""".trimIndent()
```

**Pourquoi ce format est efficace :**
- **Définition explicite de la structure :** Empêche le modèle de générer du texte explicatif ou des salutations polies.
- **Consignes négatives** ("no other text") : Limite l'apparition de phrases d'introduction qui feraient échouer le parseur JSON.
- **Ancrage aux valeurs de l'USDA :** Force le modèle à s'appuyer sur des bases nutritionnelles officielles plutôt que d'inventer des chiffres au hasard.
- **Présence du champ `serving` :** Affiche clairement la quantité estimée par le modèle pour permettre à l'utilisateur de la corriger si nécessaire.

### Gestion des erreurs du modèle

Les petits modèles locaux n'étant pas fiables à 100 %, NomAI met en œuvre une stratégie de secours (fallback) à plusieurs niveaux :

1. **Validation du JSON :** La réponse est traitée par un désérialiseur strict. En cas d'erreur de syntaxe, le prompt est renvoyé avec une contrainte encore plus forte (analyse ingrédient par ingrédient).
2. **Contrôles de cohérence :** L'application rejette les estimations absurdes (par exemple, un ingrédient unique évalué à 10 000 calories). Le total des macros est également comparé à la formule standard (calories ≈ protéines×4 + glucides×4 + lipides×9).
3. **Ajustement manuel :** Si l'estimation semble erronée, l'utilisateur peut modifier directement chaque valeur. Ces corrections sont sauvegardées et pourront servir ultérieurement à affiner (fine-tune) ou évaluer le modèle.

---

## Architecture et choix techniques

Conçu selon les standards de développement Android modernes, NomAI intègre les technologies suivantes :

* **Jetpack Compose :** Le framework UI moderne d'Android qui permet de concevoir une interface réactive et fluide. Il est parfaitement adapté à l'inférence asynchrone : les flux de texte générés peuvent s'afficher en temps réel à l'écran.
* **LiteRT-LM SDK :** Le moteur d'exécution de Google optimisé pour l'IA embarquée. Il tire parti de l'accélération matérielle (GPU/NPU) pour exécuter Gemma en limitant l'impact sur la batterie. L'inférence tourne sur `Dispatchers.IO` pour ne pas figer l'affichage.
* **Room Database :** Une couche d'abstraction locale au-dessus de SQLite pour sauvegarder l'historique de repas de manière rapide et sécurisée. L'utilisation des Flows Kotlin permet de mettre à jour instantanément les graphiques à chaque ajout de repas.
* **Hilt (Injection de dépendances) :** Le moteur d'inférence est instancié sous forme de singleton à l'échelle de l'application, évitant ainsi de devoir recharger le fichier de 1,4 Go à chaque action.
* **Coroutines & Flow Kotlin :** Toutes les opérations liées à l'IA sont gérées de façon asynchrone et sécurisée. StateFlow pilote les données de l'interface, tandis que SharedFlow gère les événements ponctuels (alertes, navigation).

---

## Défis techniques et retours d'expérience

Le développement de ce projet a fait émerger plusieurs problématiques complexes :

### Précision sur les plats atypiques oу régionaux
Si Gemma 2B s'en sort très bien sur des aliments occidentaux classiques (œufs, toast, poulet), il peine sur des spécialités régionales ou des produits de marques spécifiques. Par ejemplo, la requête *"J'ai mangé un bol de dhal makhani avec deux rotis"* donnera un total calorique correct, mais les macros (protéines/glucides) pourront varier de 20 à 30 %.

**Solution :** L'application affiche un badge "estimé" sur les résultats de l'IA et encourage l'utilisateur à ajuster les chiffres.

### Flou sur les quantités
Comment interpréter *"J'ai mangé du riz"* ? Le modèle applique par défaut les portions de référence de l'USDA (une tasse de riz cuit, ~200g), mais les habitudes réelles varient grandement d'un utilisateur à l'autre.

**Solution :** Le champ `serving` indique la portion estimée par l'IA pour que l'utilisateur puisse la corriger en connaissance de cause.

### Consommation mémoire (RAM)
Faire tourner un modèle de 2B paramètres parallèlement à une interface Jetpack Compose et une base Room met la RAM de l'appareil à rude épreuve. Sur les smartphones équipés de 6 Go de RAM, l'application doit libérer activement ses ressources (nettoyage des caches d'images, chargement différé des données historiques).

**Solution :** NomAI écoute les alertes système `ComponentCallbacks2`. En cas de manque de mémoire (`TRIM_MEMORY_RUNNING_LOW`), le modèle est temporairement déchargé et un bouton de réactivation est proposé à l'utilisateur.

### Téléchargement initial du modèle
Le fichier du modèle pesant ~1,4 Go, il ne peut pas être intégré directement dans l'APK. NomAI doit donc le télécharger au premier démarrage, ce qui représente une étape sensible de l'onboarding.

**Solution :** L'application intègre une barre de progression claire indiquant le temps restant estimé, gère la reprise des téléchargements interrompus, et permet d'utiliser le mode d'encodage manuel en attendant que l'IA soit prête.

---

## Conclusion

NomAI est plus qu'un simple tracker de calories : c'est un démonstrateur technologique pour une nouvelle génération d'applications mobiles. Il prouve que nous pouvons aujourd'hui concevoir des applications intelligentes, fluides, respectueuses de la vie privée et sans aucun coût d'infrastructure récurrent pour le développeur.

Le code source est disponible sur [GitHub](https://github.com/breejesh/nom.ai). Si l'IA embarquée, la conception hors ligne ou la protection des données vous intéressent, n'hésitez pas à jeter un œil au dépôt et à contribuer.
