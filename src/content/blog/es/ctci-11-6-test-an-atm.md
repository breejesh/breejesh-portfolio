---
title: "Probar un Cajero Automático: Pruebas en Sistemas Bancarios Distribuidos (CTCI 11.6)"
description: "Formula una matriz exhaustiva de pruebas para un cajero automatico (ATM) cubriendo idempotencia transaccional, cortes de red y fallos de hardware."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-11-6-test-an-atm.webp
previewImage: /assets/images/ctci-11-6-test-an-atm.webp
---

> **TL;DR**
> * **El Problema del Libro:** ¿Como probarias un cajero automatico (ATM) conectado a un sistema bancario distribuido?
> * **La Solución Óptima:** **Matriz de Pruebas Bancarias en 4 Dominios**: (1) **Validación de Hardware**: Lector de tarjetas (chip EMV, NFC, banda magnetica), dispensador de billetes con deteccion de atascos, validador de cheques e impresora termica; (2) **Consistencia Transaccional**: Retiro exacto de efectivo, saldo insuficiente, limites diarios, bloqueo por 3 intentos de PIN y agotamiento de gavetas de dinero; (3) **Tolerancia a Particiones de Red e Idempotencia**: Corte de red a mitad de operacion (protocolo de compensacion Saga / Reversas ISO 8583 para asegurar que jamas se debite una cuenta si la compuerta fisica no entrega el dinero); (4) **Seguridad y Cumplimiento**: Cifrado de PIN en modulos HSM (PCI-DSS), sensores antiskimming y alarmas de apertura de boveda.
> * **Realidad en Producción:** Certificacion de cajeros Diebold Nixdorf / NCR y conmutadores de mensajeria bancaria ISO 8583.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 11.6), se nos plantea:

*"Disena un marco de pruebas integral para validar un cajero automatico (ATM) en una red bancaria distribuida."*

## 2. Matriz de Pruebas de Calidad Bancaria

| Dominio | Escenario Específico | Resultado Esperado |
|---|---|---|
| **Seguridad de PIN** | 3 intentos fallidos consecutivos | Tarjeta bloqueada / retenida y registro de auditoría. |
| **Retiro de Efectivo** | Saldo $\$100$, retiro de $\$80$ en billetes de $\$20$ | Entrega exacta de 4 billetes y saldo actualizado a $\$20$. |
| **Agotamiento de Bóveda** | El cajero se queda sin billetes a mitad de transacción | Operación cancelada, saldo intacto y notificación en pantalla. |
| **Corte de Red en Dispensación** | La red cae tras la autorización pero antes de abrir la compuerta | Mensaje automático de reversa ISO 8583 para restaurar fondos. |
| **Detección de Falsificaciones**| Billete falso ingresado en ranura de depósito | Sensores ópticos y magnéticos rechazan el billete. |

## Implementación de Máquina de Estados Transaccional

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
            System.out.println("Reversa ISO 8583 generada para cuenta " + accountId);
        }
    }
}
```

## Discusión de Ingeniería de Sistemas en Producción

### Arquitectura de Sistemas en Producción: Protocolo de Reversa ISO 8583

1. **Mensajes de Reversa Automática (Mensaje 0420):** Si los sensores de salida no confirman la entrega fisica en 15 segundos, el cajero emite una reversa inmediata para restaurar el saldo.
2. **Modo Fuera de Línea:** Permite retiros minimos de emergencia mediante criptogramas locales cuando no hay conexion con el servidor central.

## Casos Límite y Robustez en Producción

1. **Dinero Olvidado en Bandeja:** Retraccion automatica a un compartimento de purga tras 30 segundos sin recoger el efectivo.
2. **Protección Antiskimming:** Sensores de vibracion mecanica en la ranura de tarjetas.
