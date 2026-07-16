---
title: "Exécuter des LLM localement sur Android : Gemma 2B avec LiteRT"
description: "Comment exécuter les modèles Gemma de Google hors ligne sur Android avec LiteRT, avec un aperçu concret de NomAI, le tracker de calories open-source."
date: 2026-07-17
tags: [Android, LiteRT, Gemma LLM, IA sur l'Appareil, Développement Mobile]
coverImage: /assets/images/gemma-android.webp
previewImage: /assets/images/gemma-android.webp
---

L'exécution de grands modèles de langage (LLM) était autrefois le domaine exclusif des clusters cloud multi-GPU. Aujourd'hui, le matériel embarqué a progressé à un point tel que nous pouvons exécuter des modèles à 2 milliards de paramètres directement dans nos poches.

Avec **LiteRT de Google** (anciennement TensorFlow Lite) et la famille de modèles ouverts **Gemma**, les développeurs Android peuvent intégrer une IA générative locale qui soit rapide, 100 % privée et qui fonctionne complètement hors ligne.

---

## Pourquoi exécuter des LLM sur l'appareil ?

Pendant longtemps, le modèle standard pour l'IA mobile a été basé sur des API : envoyer une requête à un serveur distant, attendre qu'un modèle s'exécute dans le cloud et analyser la réponse. Bien que simple, ce modèle présente des inconvénients majeurs :
* **Risques pour la vie privée :** Les données de l'utilisateur, l'historique des discussions et les entrées personnelles quittent le téléphone et atterrissent sur des serveurs externes.
* **Dépendance au réseau :** Si l'utilisateur a une mauvaise connexion ou est en mode avion, l'IA ne fonctionne plus.
* **Coûts de serveur récurrents :** Chaque appel d'API entraîne des frais d'exécution serverless qui augmentent de manière linéaire avec votre base d'utilisateurs.

**L'IA sur l'appareil résout ces trois problèmes.** En utilisant LiteRT et un modèle Gemma compressé, votre application peut exécuter des inférences localement. Vos utilisateurs bénéficient de réponses instantanées, d'une confidentialité totale et d'aucun frais de réseau.

---

## Exemple concret : le tracker de calories NomAI

**NomAI**, un tracker de calories open-source et hors ligne pour Android, est une fantastique démonstration concrète de cette technologie.

La plupart des trackers de calories exigent la création d'un compte, affichent des publicités et envoient les données de vos repas à des réseaux publicitaires. NomAI change la donne en exécutant **Gemma-2B** localement sur votre appareil Android pour analyser les descriptions de repas et estimer les valeurs nutritionnelles.

* **Dépôt GitHub :** [github.com/breejesh/nom.ai](https://github.com/breejesh/nom.ai)

Dans NomAI, lorsqu'un utilisateur écrit *\"J'ai mangé deux œufs brouillés et une tranche de pain grillé\"*, le modèle local Gemma analyse la requête, estime les macronutriments (protéines, glucides, lipides) et renvoie une réponse structurée—entièrement sur l'appareil, sans aucune API tierce.

---

## Configuration de Gemma sur Android avec LiteRT-LM

Pour commencer l'inférence locale dans votre propre application Android, vous pouvez utiliser le SDK officiel **LiteRT-LM** :

### 1. Ajouter les dépendances
Incluez la dépendance du runtime LiteRT-LM dans votre fichier `build.gradle.kts` :
```kotlin
dependencies {
    implementation("com.google.ai.edge.litertlm:litertlm-android:latest.release")
}
```

### 2. Télécharger et quantifier le modèle
Pour les appareils mobiles, vous devez utiliser des versions quantifiées du modèle (comme `Gemma-2B` au format entier 4 bits). Vous pouvez trouver des modèles `.litertlm` pré-convertis sur l'espace communautaire LiteRT de Hugging Face.

### 3. Initialiser le moteur
Le chargement d'un modèle de 1,5 Go en mémoire prenant quelques secondes, initialisez le moteur d'inférence sur un thread d'arrière-plan :

```kotlin
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig

// Configurer et initialiser le moteur
val config = EngineConfig(modelPath = "/data/local/tmp/gemma-2b.litertlm")
val engine = Engine(config)
engine.initialize()

// Créer une session de conversation
val session = engine.createConversation()

// Envoyer le prompt et diffuser la réponse
session.sendMessageAsync("Translate to Spanish: Hello, how are you?").collect { chunk ->
    print(chunk)
}
```

---

## Optimisations essentielles

Pour que votre application mobile reste fluide et éviter les plantages :
* **Exécution en arrière-plan :** Exécutez toujours les boucles d'initialisation et de génération dans des coroutines ou des threads d'arrière-plan pour éviter de bloquer le thread principal de l'interface utilisateur.
* **Accélération matérielle :** Assurez-vous que votre configuration délègue les calculs au GPU/NPU via des délégués (comme XNNPack ou ML Drift) pour une accélération matérielle.
* **Limites de mémoire :** Les systèmes d'exploitation mobiles ferment activement les applications qui dépassent les limites de mémoire. Vérifiez toujours la RAM disponible avant d'initialiser un modèle 2B sur des appareils bas de gamme.

---

## Conclusion

L'exécution locale de Gemma via LiteRT-LM représente un changement majeur dans la conception des applications mobiles. Elle permet aux développeurs de créer des systèmes intelligents et profondément interactifs qui respectent la vie privée des utilisateurs, fonctionnent hors ligne et n'entraînent aucun coût d'hébergement dans le cloud. Des projets comme **NomAI** prouvent que les LLM sur l'appareil ne sont pas seulement une idée futuriste, mais un modèle de conception viable et prêt pour la production dans les écosystèmes Android d'aujourd'hui.
