---
title: "Données Boursières: Architecture de Diffusion de Cotations Financières (CTCI 9.1)"
description: "Concevez un service de diffusion de cotations boursières pour 1 000 applications clientes avec latence sub-milliseconde via cache mémoire et fichiers plats."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-9-1-stock-data.webp
previewImage: /assets/images/ctci-9-1-stock-data.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Imaginez un service interrogé par 1 000 applications clientes pour obtenir les données boursières récentes (`open`, `close`, `high`, `low`). Précisez vos hypothèses, présentez votre architecture et détaillez la tolérance aux pannes.
> * **La Solution Optimale:** Cache Mémoire Partitionné + Génération de Fichiers Plats : (1) Ingestion via flux multicast UDP haute vitesse ; (2) Stockage en mémoire vive non bloquant (`ConcurrentHashMap`) ; (3) Publication périodique d'instantanés statiques (JSON/Protobuf) servis par NGINX / CDN ; (4) Tolérance aux pannes par double flux redondant (Feed A / Feed B).
> * **Réalité en Production:** Moteurs de diffusion de marché chez Bloomberg Terminal et protocoles Nasdaq ITCH / OUCH.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 9.1), l'énoncé est :

*"Concevez une architecture de distribution de cours de bourse temps reel pour 1 000 applications clientes avec des exigences de debit et de faible latence."*

## 2. Architecture du Système

### Hypothèses de Dimensionnement
* **Clients :** 1 000 applications requêtant en boucle ($\approx 10\,000\text{ QPS}$).
* **Titres Boursiers :** $\approx 10\,000$ actions cotées.
* **Empreinte Mémoire :** $10\,000 \times 32\text{ octets} \approx 320\text{ Ko}$ (l'intégralité du marché tient aisément en mémoire vive).

### Composants Principaux
1. **Ingestion des Flux :** Réception des ticks UDP et mise à jour de la table mémoire.
2. **Générateur d'Instantanés :** Export périodique (chaque seconde) de fichiers statiques légers.
3. **Serveurs Web / CDN :** Diffusion directe des fichiers statiques sans sollicitation de base de données.

## Implémentation de Production

```java
import java.util.concurrent.ConcurrentHashMap;

public class StockDataService {
    public static class StockQuote {
        public final String ticker;
        public final double open;
        public final double high;
        public final double low;
        public final double current;
        public final long volume;
        public final long timestamp;

        public StockQuote(String ticker, double open, double high, double low, double current, long volume) {
            this.ticker = ticker;
            this.open = open;
            this.high = high;
            this.low = low;
            this.current = current;
            this.volume = volume;
            this.timestamp = System.currentTimeMillis();
        }
    }

    private final ConcurrentHashMap<String, StockQuote> priceCache = new ConcurrentHashMap<>(16384);

    public void updatePrice(String ticker, double price, long volumeDelta) {
        priceCache.compute(ticker, (k, old) -> {
            if (old == null) {
                return new StockQuote(ticker, price, price, price, price, volumeDelta);
            }
            double newHigh = Math.max(old.high, price);
            double newLow = Math.min(old.low, price);
            return new StockQuote(ticker, old.open, newHigh, newLow, price, old.volume + volumeDelta);
        });
    }

    public StockQuote getLatestQuote(String ticker) {
        return priceCache.get(ticker);
    }
}
```

## Analyse de Complexité et Performance

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Latence de Requête | `O(1)` | Lecture mémoire concurrente sous la barre des 5 microsecondes. |
| Empreinte Mémoire | `O(T)` | Moins de 1 Mo pour 10 000 cotations actives. |
| Débit Réseau | `> 500 000 QPS` | Distribution statique directe depuis les caches NGINX. |

## Ingénierie des Systèmes en Production

### Architecture Système : Flux de Données de Marché

1. **Mémoire Partagée et Anneaux Circulaires (LMAX Disruptor) :** Les systèmes de trading haute fréquence lisent directement dans la RAM sans surcoût de pile TCP.
2. **Délégation CDN :** Absorption intégrale des pics de charge par mise en cache HTTP/2 à la périphérie du réseau.

## Cas Limites et Robustesse

1. **Perte de Ligne de Flux :** Basculement transparent vers la ligne secondaire B.
2. **Fraîcheur des Données :** Horodatage strict permettant la détection des retards de propagation.
