---
title: "Exécuter des LLM localement sur Android : Gemma 2B avec LiteRT"
description: "Comment faire fonctionner les modèles Gemma de Google hors ligne sur Android grâce à LiteRT, avec une analyse concrète de NomAI, le tracker de calories open-source."
date: 2026-07-17
tags: [IA, Android, LLM, Développement Mobile]
coverImage: /assets/images/gemma-android.webp
previewImage: /assets/images/gemma-android.webp
---

L'exécution de modèles de langage de grande taille (LLM) était autrefois le domaine exclusif des clusters cloud multi-GPU. Aujourd'hui, le matériel grand public a progressé au point que nous pouvons exécuter des modèles de 2 milliards de paramètres directement dans notre poche.

Avec **LiteRT** de Google (anciennement TensorFlow Lite) et la famille de modèles ouverts **Gemma**, les développeurs Android peuvent intégrer une IA générative locale rapide, 100 % privée et fonctionnant entièrement hors ligne.

---

## Pourquoi exécuter des LLM sur l'appareil ?

Pendant longtemps, le modèle standard pour l'IA mobile était basé sur des API : envoyer une requête à un serveur distant, attendre qu'un modèle s'exécute dans le cloud et analyser la réponse. Bien que simple, cette approche présente des inconvénients majeurs :

* **Risques pour la vie privée :** Les données utilisateur, l'historique des discussions et les données personnelles quittent le téléphone pour être stockés sur des serveurs tiers. Pour les données médicales, financières ou privées, c'est souvent rédhibitoire.
* **Dépendance réseau :** Si l'utilisateur capte mal ou est en mode avion, l'IA ne fonctionne plus. Dans de nombreuses régions du monde, on ne peut pas supposer une connexion Internet mobile fiable.
* **Coûts de serveurs récurrents :** Chaque appel d'API génère des frais d'exécution qui augmentent proportionnellement avec votre nombre d'utilisateurs. Une application virale peut faire grimper la facture de 50 $ à 50 000 $ par mois du jour au lendemain.
* **Latence :** Même sur les connexions rapides, un aller-retour vers un LLM cloud ajoute 500 ms à 2 s de latence. L'inférence locale peut répondre en moins de 300 ms pour des requêtes courtes.

**L'IA embarquée résout tous ces problèmes.** En utilisant LiteRT et un modèle Gemma compressé, votre application réalise l'inférence localement. Vos utilisateurs profitent de réponses instantanées, d'une confidentialité totale et d'aucune consommation de données mobiles.

---

## Choisir le bon modèle

Toutes les versions de Gemma ne sont pas adaptées aux smartphones. Le choix du modèle et du niveau de quantification est crucial pour garantir une expérience utilisateur fluide :

| Modèle | Paramètres | Quantification | Taille du fichier | RAM requise | Usage recommandé |
|---|---|---|---|---|---|
| Gemma 2B | 2B | INT4 | ~1,4 Go | ~2,5 Go | Appareils d'entrée de gamme, inférence rapide |
| Gemma 2B | 2B | INT8 | ~2,5 Go | ~4 Go | Meilleure qualité, appareils de milieu de gamme |
| Gemma 2B | 2B | FP16 | ~5 Go | ~6 Go | Meilleure qualité, modèles phares uniquement |
| Gemma 7B | 7B | INT4 | ~4,5 Go | ~8 Go | Modèles phares avec plus de 12 Go de RAM |

**Recommandation pratique :** Pour la majorité des applications en production, **Gemma 2B avec quantification INT4** est le meilleur compromis. Il produit des résultats cohérents tout en s'intégrant sans problème sur des appareils dotés de 6 Go de RAM ou plus (soit la majorité des téléphones Android vendus depuis 2021).

> La quantification INT4 compresse chaque poids du modèle de 16 bits à 4 bits, réduisant ainsi la taille du fichier d'environ 75 % avec une dégradation de qualité minime pour la plupart des tâches.

---

## Exemple concret : Le tracker de calories NomAI

Un excellent exemple concret est **NomAI**, une application de suivi des calories open-source et hors ligne pour Android.

La plupart des trackers du marché imposent de créer un compte, affichent des publicités et revendent vos données à des réseaux publicitaires. NomAI change la donne en exécutant **Gemma-2B** localement sur votre smartphone pour analyser les descriptions de repas et estimer leurs valeurs nutritionnelles.

* **Dépôt GitHub :** [github.com/breejesh/nom.ai](https://github.com/breejesh/nom.ai)

Dans NomAI, lorsqu'un utilisateur saisit *"J'ai mangé deux œufs brouillés et une tranche de pain grillé"*, le modèle Gemma local analyse la phrase, estime les macros (protéines, glucides, lipides) y renvoie une réponse structurée entièrement sur l'appareil, sans aucune API cloud.

---

## Configurer Gemma sur Android avec LiteRT-LM

Pour commencer l'inférence locale dans votre application Android, vous pouvez utiliser le SDK **LiteRT-LM** de Google :

### 1. Ajouter les dépendances

Ajoutez la dépendance d'exécution de LiteRT-LM dans votre fichier `build.gradle.kts` :

```kotlin
dependencies {
    implementation("com.google.ai.edge.litertlm:litertlm-android:latest.release")
}
```

### 2. Télécharger le modèle

Sur mobile, vous devez utiliser des modèles quantifiés. Vous trouverez des modèles pré-convertis sur :
- **Kaggle :** Recherchez des modèles Gemma LiteRT sur [kaggle.com/models/google/gemma](https://kaggle.com/models/google/gemma)
- **Hugging Face :** Recherchez des modèles convertis par la communauté au format `.task` sur la page de la communauté LiteRT

Placez le fichier du modèle dans le stockage interne de votre application (et non dans `assets/`, car le fichier est trop volumineux pour l'APK). En général, vous le téléchargerez au premier démarrage ou l'intégrerez sous forme d'Asset Pack d'Android App Bundle.

### 3. Initialiser le moteur

Le chargement d'un modèle de ~1,4 Go en mémoire prenant quelques secondes, veillez à toujours exécuter l'initialisation sur un thread d'arrière-plan. Voici un exemple simple en coroutines Kotlin :

```kotlin
import com.google.ai.edge.litert.lm.LlmInference
import com.google.ai.edge.litert.lm.LlmInferenceOptions

class GemmaEngine(private val context: Context) {
    private var inference: LlmInference? = null

    suspend fun initialize(modelPath: String) = withContext(Dispatchers.IO) {
        val options = LlmInferenceOptions.builder()
            .setModelPath(modelPath)
            .setMaxTokens(1024)
            .build()

        inference = LlmInference.createInstance(options)
    }

    suspend fun generate(prompt: String): String = withContext(Dispatchers.IO) {
        inference?.generateResponse(prompt)
            ?: throw IllegalStateException("Moteur non initialisé")
    }

    // Flux de résultats partiels pour les mises à jour de l'UI en temps réel
    fun generateAsync(
        prompt: String,
        onPartialResult: (String) -> Unit,
        onComplete: (String) -> Unit,
        onError: (Exception) -> Unit
    ) {
        inference?.generateResponseAsync(prompt)?.let { task ->
            task.addOnSuccessListener { result -> onComplete(result) }
            task.addOnFailureListener { e -> onError(e) }
        }
    }

    fun close() {
        inference?.close()
        inference = null
    }
}
```

### 4. L'intégrer à votre interface

Associez le moteur à votre interface Jetpack Compose ou vos Views classiques :

```kotlin
// Dans votre ViewModel
class ChatViewModel(application: Application) : AndroidViewModel(application) {
    private val engine = GemmaEngine(application)
    private val _response = MutableStateFlow("")
    val response: StateFlow<String> = _response

    init {
        viewModelScope.launch {
            val modelPath = "${application.filesDir}/gemma-2b-it-int4.bin"
            engine.initialize(modelPath)
        }
    }

    fun sendMessage(prompt: String) {
        viewModelScope.launch {
            _response.value = engine.generate(prompt)
        }
    }

    override fun onCleared() {
        super.onCleared()
        engine.close()  // Important : libérer la mémoire du modèle
    }
}
```

> **Important :** Fermez toujours le moteur via `close()` lorsqu'il n'est plus utilisé. Un modèle de 2 milliards de paramètres occupe plus de 2 Go de RAM ; ne pas libérer cette mémoire provoquera des arrêts brutaux de votre application par l'OS.

---

## Prompt Engineering pour des résultats structurés

L'une des plus grandes difficultés avec les LLM embarqués consiste à obtenir des **données structurées fiables**. Les modèles cloud comme GPT-4 ou Gemini Pro suivent très bien les consignes, mais un petit modèle de 2B requiert des instructions beaucoup más précises.

Pour le cas d'usage de NomAI, un prompt système bien structuré fait toute la différence :

```
Vous êtes un assistant en analyse nutritionnelle. À partir d'une description 
de repas, estimez les calories et macros et répondez UNIQUEMENT en JSON.

Format :
{"items": [{"name": "nom de l'aliment", "calories": nombre, "protein_g": nombre, 
"carbs_g": nombre, "fat_g": nombre}], "total": {"calories": nombre, 
"protein_g": nombre, "carbs_g": nombre, "fat_g": nombre}}

Règles :
- Utilisez des portions standard si aucune quantité n'est indiquée
- Arrondissez toutes les valeurs à l'entier le plus proche
- N'ajoutez aucun texte en dehors du bloc JSON

Repas : {user_input}
```

**Conseils pour fiabiliser les sorties structurées des petits modèles :**
- **Soyez extrêmement précis** sur le format attendu, quitte à inclure un exemple type dans le prompt.
- **Ajoutez des instructions négatives** ("Ne pas inclure de texte en dehors du JSON") car ces modèles ont tendance à commenter leur réponse.
- **Validez et re-tentez :** interceptez les erreurs d'analyse du JSON dans un bloc try/catch et relancez le prompt avec une formulation simplifiée si nécessaire. Prévoyez 5 à 10 % de taux d'échec au premier essai.
- **Restez concis.** Les modèles 2B disposent de fenêtres de contexte limitées (généralement 2048 à 8192 tokens). Des prompts système trop longs réduisent l'espace alloué à la réponse.

---

## Optimisations indispensables

Pour garantir la fluidité de votre application mobile et éviter les plantages :

* **Exécution asynchrone :** Exécutez toujours l'initialisation et la génération via des coroutines sur `Dispatchers.IO` pour ne pas bloquer le thread principal (UI). Le chargement du modèle peut prendre de 3 à 8 secondes sur des téléphones de milieu de gamme.
* **Accélération matérielle :** LiteRT utilise automatiquement le **GPU delegate** ou le **NNAPI delegate** s'ils sont disponibles. Sur les puces dotées de NPU dédiés (comme Google Tensor ou Qualcomm Hexagon), les performances d'inférence peuvent être doublées.
* **Gestion de la mémoire :** Les OS mobiles ferment sans sommation les applications qui dépassent la RAM autorisée. Avant d'initialiser le modèle, vérifiez la RAM disponible avec `ActivityManager.getMemoryInfo()` et proposez une alternative simplifiée si la mémoire est inférieure à 4 Go.
* **Pré-chargement :** Lancez le chargement du modèle en tâche de fond dès l'ouverture de l'application, afin que le moteur soit prêt lorsque l'utilisateur accède à la fonctionnalité d'IA.
* **Régulation thermique :** L'inférence prolongée fait chauffer l'appareil. Surveillez la température avec `PowerManager.getThermalStatus()` pour ralentir la cadence de génération ou limiter la taille des lots (batches) en cas de surchauffe.

---

## Performances constatées

Voici les vitesses d'exécution moyennes (mesurées sur Gemma 2B INT4) :

| Gamme d'appareil | Exemple de smartphone | Tokens par seconde | Temps de chargement | RAM utilisée |
|---|---|---|---|---|
| Entrée de gamme | Pixel 6a | ~8-12 tok/s | ~6-8s | ~2,5 Go |
| Milieu de gamme | Pixel 8 | ~15-20 tok/s | ~3-5s | ~2,5 Go |
| Haut de gamme | Pixel 9 Pro | ~25-35 tok/s | ~2-3s | ~2,5 Go |
| Haut de gamme + NPU | Samsung S24 Ultra | ~30-40 tok/s | ~2-3s | ~2,5 Go |

*Ces mesures sont indicatives y varient en fonction de la longueur de la requête, de l'état thermique de l'appareil et de la version d'Android.*

La vitesse de lecture humaine moyenne se situant autour de 4 tokens/seconde, les performances sur mobile sont largement suffisantes pour offrir une expérience très réactive.

---

## Limites et points de vigilance

Avant de déployer une solution de LLM embarqué, gardez à l'esprit ces contraintes :

* **Fiabilité des réponses :** Un modèle 2B aura tendance à halluciner plus fréquemment qu'un modèle cloud de plus de 70B. Intégrez toujours des avertissements et des couches de validation pour les applications sensibles (médical, bancaire).
* **Poids de l'application :** Le modèle compressé pèse ~1,4 Go. Vous devez prévoir une étape de téléchargement après l'installation, ce qui peut décourager les utilisateurs disposant de connexions limitées.
* **Compatibilité matérielle :** Les LLM embarqués ciblent principalement les appareils équipés de plus de 6 Go de RAM (sortis après 2020). Prévoyez une solution de repli (API cloud ou désactivation du module) pour les téléphones plus anciens.
* **Fenêtre de contexte :** Gemma 2B gère par défaut 8192 tokens, mais un historique trop long ralentira l'exécution. Pensez à tronquer ou résumer les conversations.
* **Expérience utilisateur (UX) :** La phase de chargement du modèle est cruciale. Affichez une barre de progression claire et permettez à l'utilisateur d'utiliser le reste de l'application pendant ce temps.

---

## Conclusion

L'exécution locale de Gemma via LiteRT représente une vraie révolution dans l'architecture des applications mobiles. Elle permet aux développeurs de concevoir des applications intelligentes, réactives, totalement privées et à coût d'infrastructure nul.

Bien que la technologie comporte des contraintes (taille du modèle, compatibilité matérielle), elle est aujourd'hui parfaitement viable et prête pour la production pour des usages tels que les journaux intimes, les traducteurs de poche ou le suivi alimentaire. Des projets comme **NomAI** prouvent que l'avenir de l'IA mobile se trouve directement dans votre poche.
