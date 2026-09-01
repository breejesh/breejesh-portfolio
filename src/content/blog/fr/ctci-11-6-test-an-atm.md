---
title: "Tester un Distributeur (DAB): Architecture Bancaire Distribuée (CTCI 11.6)"
description: "Élaborez une matrice de validation pour distributeur automatique de billets (DAB/ATM) : idempotence transactionnelle, pannes réseau et matérielles."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-11-6-test-an-atm.webp
previewImage: /assets/images/ctci-11-6-test-an-atm.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Comment testeriez-vous un distributeur automatique de billets (DAB / ATM) connecté à un système bancaire distribué ?
> * **La Solution Optimale:** **Matrice de Tests Bancaires en 4 Domaines** : (1) **Validation Matérielle** : Lecteur de carte (puce EMV, NFC, bande magnétique), mécanisme de distribution de billets avec détection de bourrage, scanner de chèques et imprimante thermique ; (2) **Cohérence Transactionnelle** : Retrait exact, solde insuffisant, plafonds quotidiens, blocage après 3 essais de code PIN et rupture de stock dans les cassettes de billets ; (3) **Tolérance aux Pannes Réseau et Idempotence** : Déconnexion réseau en cours d'opération (protocole de compensation Saga / Extourne ISO 8583 garantissant qu'un compte n'est jamais débité si la trappe mécanique ne délivre pas les billets) ; (4) **Sécurité et Conformité** : Chiffrement du code PIN via modules HSM (PCI-DSS), capteurs anti-skimming et alarmes d'ouverture de coffre.
> * **Réalité en Production:** Homologation des automates Diebold Nixdorf / NCR et passerelles de routage interbancaires ISO 8583.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 11.6), l'énoncé est :

*"Formalisez une strategie de tests exhaustive pour valider le fonctionnement d'un distributeur de billets (DAB) interconnecte a un reseau bancaire distribue."*

## 2. Matrice d'Assurance Qualité Bancaire

| Domaine | Scénario Évalué | Résultat Attendu |
|---|---|---|
| **Sécurité PIN** | 3 saisies erronées consécutives | Carte capturée/verrouillée et alerte d'audit. |
| **Distribution Billets** | Solde $100 \$$, retrait de $80 \$$ en coupures de $20 \$$ | Sortie exacte de 4 billets et solde mis à jour à $20 \$$. |
| **Épuisement Cassette** | Rupture de billets de $20 \$$ pendant l'opération | Annulation de transaction, solde intact et message à l'écran. |
| **Coupure Réseau lors du Tirage** | Déconnexion après accord serveur mais avant ouverture de trappe | Message d'extourne ISO 8583 automatique recréditant le compte. |
| **Détection Faux Billets** | Dépôt d'une contrefaçon dans la fente | Rejet immédiat par capteurs optiques et magnétiques. |

## Implémentation de la Machine à États

```java
public class ATMTransactionEngine {
    public enum TransactionState {
        IDLE, CARD_AUTHENTICATED, DISPENSING_CASH, COMPLETED, ROLLED_BACK
    }

    public static class ATMContext {
        public TransactionState state = TransactionState.IDLE;
        public int vaultCashAvailable = 50000;
        public boolean networkConnected = true;
        public boolean mechanicalShutterFailed = false;

        public boolean processWithdrawal(int accountId, int amount) {
            if (amount > vaultCashAvailable) {
                return false;
            }

            state = TransactionState.CARD_AUTHENTICATED;

            if (!networkConnected) {
                state = TransactionState.ROLLED_BACK;
                return false;
            }

            state = TransactionState.DISPENSING_CASH;
            if (mechanicalShutterFailed) {
                rollbackLedgerTransaction(accountId, amount);
                state = TransactionState.ROLLED_BACK;
                return false;
            }

            vaultCashAvailable -= amount;
            state = TransactionState.COMPLETED;
            return true;
        }

        private void rollbackLedgerTransaction(int accountId, int amount) {
            System.out.println("Extourne ISO 8583 emise pour le compte " + accountId);
        }
    }
}
```

## Ingénierie des Systèmes en Production

### Architecture Système : Protocole d'Extourne ISO 8583

1. **Avis d'Extourne (Message 0420) :** Si les capteurs de sortie ne confirment pas la prise physique des billets sous 15 secondes, le DAB émet une annulation d'écriture pour restituer immédiatement les fonds.
2. **Mode Dégradé Hors-Ligne :** Autorisation de retraits d'urgence plafonnés via cryptogramme de puce lors de coupures réseau majeures.

## Cas Limites et Robustesse

1. **Billets Oubliés :** Aspiration dans un bac de purge sécurisé après 30 secondes sans retrait par le client.
2. **Protection Anti-Skimming :** Micro-vibrations mécaniques lors de l'insertion pour neutraliser les têtes de lecture magnétiques illicites.
