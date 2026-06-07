---
title: "Concevoir un système de notifications : push, SMS, email, files et fiabilité"
description: "Comment fonctionne un système de notifications, expliqué pour débutants : canaux, préférences, modèles, files d'attente, retries, et le chemin d'un événement commande expédiée jusqu'à l'alerte sur le téléphone."
date: "2026-06-07"
tags: [Conception de systèmes]
coverImage: /assets/images/design-notification-system.webp
previewImage: /assets/images/design-notification-system.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Comment fonctionne un système de notifications, expliqué pour débutants : canaux, préférences, modèles, files d'attente, retries, et le chemin d'un événement commande expédiée jusqu'à l'alerte sur le téléphone.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Imaginez le secrétariat d'une école qui doit prévenir les parents des nouvelles importantes. Parfois il envoie un SMS. Parfois un email. Parfois une courte note qui s'affiche sur le téléphone d'un parent. Le secrétariat ne crie pas dans la rue en espérant qu'on l'entende. Il tient une liste de parents, vérifie comment chacun veut être joint, remplit un formulaire standard avec le nom de l'enfant et la nouvelle, puis seulement envoie le message. Si le SMS échoue parce que le téléphone est éteint, il réessaie plus tard. Ce secrétariat est la bonne image d'un **système de notifications**.

Ce billet enseigne ce design depuis zéro. Pas de jargon d'entretien d'abord. Des pièces simples, puis un parcours complet de « commande expédiée » jusqu'à la vibration du téléphone.

---

## Quel problème résout-on ?

Une app a beaucoup de raisons de parler à une personne :

- Votre colis a quitté l'entrepôt.
- Voici votre code de connexion.
- Votre carte a été débitée.
- Un ami a aimé votre photo.

Ce sont des **événements**. Un système de notifications transforme des événements en messages que les gens peuvent voir : **push** sur le téléphone, **SMS** ou **email**. Les autres services produit ne devraient pas réinventer l'envoi de textes et d'emails. Ils disent au système de notifications « préviens cet utilisateur de cet événement » et le système fait le reste.

Dans l'image de l'école :

| Secrétariat de l'école | Système de notifications |
| --- | --- |
| Nouvelle sur un élève | Événement produit (commande expédiée, reset de mot de passe) |
| Fiche contact du parent | Profil utilisateur (email, téléphone, tokens d'appareil) |
| Règles « appeler seulement en urgence » | Préférences utilisateur (opt-in / opt-out) |
| Lettre type avec des blancs | Templates (modèles) |
| Corbeille de départ qui attend le coursier | File d'attente (queue) |
| Coursier qui appelle ou envoie | Worker qui parle à Apple, SMS ou email |
| Réessayer si la ligne est occupée | Retries (réessais) |

---

## Canaux : les trois portes des messages

Un **canal** est simplement *comment* le message est livré.

### 1. Push

Une alerte courte sur l'écran de verrouillage. Vous ne parlez pas vous-même à la radio du téléphone. Vous envoyez à **Apple** (APNs pour iPhone) ou à **Google** (FCM pour beaucoup d'Android). Ils livrent quand l'appareil est joignable.

Image de l'école : une note rapide sur le téléphone du parent, pas une longue lettre.

### 2. SMS

Un texto vers un numéro. Vous payez une passerelle (Twilio et similaires). Elles parlent aux opérateurs. Le SMS est cher et sert souvent aux codes et aux alertes urgentes.

Image de l'école : un vrai SMS au numéro du parent.

### 3. Email

Un message plus long vers une boîte. La plupart des équipes utilisent des plateformes email (SendGrid, Amazon SES, Mailgun) pour ne pas réinventer les bounces et la réputation.

Image de l'école : une lettre complète dans la boîte mail du parent.

**Règle de design :** chaque canal a la même forme : *file → worker → fournisseur externe*. Cerveau partagé, messagers différents.

Vous ne possédez presque jamais le dernier kilomètre. Apple, les opérateurs et les réseaux email le font. Votre travail est de demander correctement, de mémoriser ce que vous avez demandé, et de vous rétablir quand ils échouent.

---

## Préférences : n'écrivez pas à qui a dit non

Les parents s'énervent si l'école SMS le menu de la cantine chaque jour. Les utilisateurs coupent le son des apps qui spamment. Donc le système stocke des **préférences** :

- Canal : push oui, SMS non, email oui.
- Catégorie : sécurité oui, marketing non, conseils produit oui.
- Heures calmes : pas de marketing à 2h du matin dans le fuseau de l'utilisateur.

Avant d'envoyer, le secrétariat lit la fiche :

1. Charge les réglages pour cet utilisateur, ce canal et cette catégorie.
2. Ignore si opt-out.
3. Pour les nouvelles non liées à la sécurité, respecte les heures calmes.
4. Les messages de sécurité et d'argent (reset de mot de passe, paiement échoué) passent souvent quand même si le marketing est off. Produit et loi décident. Dites-le clairement.

Respecter les préférences n'est pas seulement de la politesse. Cela protège la confiance et la délivrabilité email. Un système qui ignore le silence est cassé.

---

## Templates : lettres types avec des blancs

Vous ne voulez pas que chaque équipe écrive du HTML d'email dans son propre service. Le système de notifications possède les **templates** : texte approuvé avec des blancs.

Exemple de template push :

```
Votre commande {{order_id}} a été expédiée. Suivi : {{tracking_url}}
```

À l'envoi, le système remplit les blancs avec de vraies données : id de commande, nom, montant, lien.

Les templates doivent être :

- **Par canal** (push court ; email HTML long ; SMS avec budget de caractères serré).
- **Par langue** si vous avez plusieurs locales.
- **Versionnés** pour pouvoir annuler une mauvaise publication.
- **Sûrs** : échapper le texte contrôlé par l'utilisateur pour qu'un nom bizarre ne casse pas le HTML.

Image de l'école : une pile de formulaires. Le personnel n'improvise pas le texte légal à chaque appel.

---

## Files d'attente : la corbeille de départ

Si le directeur reste en ligne avec chaque opérateur pendant que les parents s'accumulent au guichet, tout le secrétariat se fige. Pareil en logiciel.

Une **file d'attente** est une file d'attente de travail :

1. Quelque chose d'important se produit (commande expédiée).
2. L'**API** de notifications enregistre l'intention et met des jobs dans la file.
3. Elle répond « accepté » vite (style HTTP 202).
4. Des **workers** séparés tirent les jobs et parlent à Apple, SMS ou email.

Pourquoi les files comptent :

- Les pics (soldes, campagne) tombent dans la corbeille au lieu d'écraser l'API.
- Une panne SMS ne bloque pas le push. Donnez à chaque canal sa propre file.
- Les jobs en échec peuvent attendre et réessayer sans bloquer le service d'origine.

```
[ Service commandes ]
       |
       v
[ API de notifications ]
  vérifie utilisateur, prefs, template
  écrit une ligne de log
       |
       +---> [ File push ]  --> workers push  --> Apple / Google
       |
       +---> [ File SMS ]   --> workers SMS   --> fournisseur SMS
       |
       +---> [ File email ] --> workers email --> fournisseur email
```

**Découplez accepter et livrer.** Accepter signifie « on a noté et mis dans la corbeille. » Livrer signifie « le monde extérieur l'a reçu. » Ce sont deux étapes.

---

## Retries : réessayez, mais pas pour toujours

Les réseaux échouent. Les fournisseurs répondent « occupé. » Les téléphones sont hors ligne. Donc les workers **réessayent**.

Règles simples :

| Ce qui a échoué | Que faire |
| --- | --- |
| Erreur temporaire (timeout, 503) | Attendre de plus en plus longtemps (backoff), réessayer |
| Token invalide ou email mort | Échec permanent ; arrêter pour cette destination |
| Limite du fournisseur | Ralentir ; remettre en file avec délai |
| Message poison (données de template cassées) | Après N essais, **file dead-letter** et alerter des humains |

Plafonnez les tentatives. Un retry infini sur un template cassé devient une auto-attaque de votre facture fournisseur.

Aussi : le monde est **at-least-once**, pas exactement-once parfait. Un timeout peut vous laisser sans savoir si le SMS est déjà parti. Les appelants doivent envoyer une **clé d'idempotence** (un id unique « on a déjà demandé ce reçu une fois »). Le système la mémorise et jette les doublons exacts dans une fenêtre. Les gens détestent plus un reset de mot de passe perdu qu'un double push rare, mais vous dédupliquez quand même fort quand c'est possible.

---

## Données de contact à stocker

Sans adresses, rien ne sort du bâtiment.

| Donnée | Pourquoi |
| --- | --- |
| Email, téléphone | Destinations email et SMS |
| Tokens push d'appareil | Un utilisateur peut avoir plusieurs téléphones ; les tokens expirent |
| Locale et fuseau | Langue et heures calmes |
| Préférences | Interrupteurs canal et catégorie |
| Log de notifications | Ce que vous avez tenté, statut, ids fournisseur |

Les tokens arrivent à l'install de l'app ou à la connexion. Quand Apple ou Google disent qu'un token est mort pour de bon, marquez-le inactif. N'assumez jamais un seul téléphone pour toujours.

---

## Parcours d'un événement : commande expédiée → vibration du téléphone

Suivez une histoire de bout en bout.

**Scène :** l'entrepôt marque la commande `ord_9f3a` comme expédiée pour l'utilisateur `cus_12`. Le produit veut push et email. L'utilisateur a refusé le SMS marketing, mais c'est une mise à jour transactionnelle d'expédition.

### Étape 1 : L'événement

Le service commandes appelle le service de notifications :

```http
POST /internal/v1/notifications

{
  "idempotency_key": "ord_9f3a:shipped:v1",
  "user_id": "cus_12",
  "template_id": "order_shipped",
  "channels": ["email", "push"],
  "category": "transactional",
  "data": {
    "order_id": "ord_9f3a",
    "tracking_url": "https://shop.example/t/abc"
  }
}
```

Seuls des services internes de confiance devraient appeler ici. Les secrets Apple et SMS vivent dans un secret store, pas dans le chat ni dans des configs au hasard.

### Étape 2 : Le secrétariat lit la fiche

L'API de notifications :

1. Authentifie l'appelant.
2. Vérifie que la même clé d'idempotence n'est pas déjà traitée.
3. Charge email, appareils, préférences et le template `order_shipped`.
4. Ignore le SMS (non demandé). Garde email et push si les réglages le permettent.
5. Vérifie les rate limits pour qu'un service n'inonde pas un utilisateur ni ne brûle le budget SMS.
6. Écrit une ligne de **log de notifications** en statut `pending` (l'intention est enregistrée).
7. Met en file un job email et un job push (ou un push par appareil actif).
8. Renvoie `202 Accepted` avec un `notification_id`. Le service commandes n'attend pas Apple.

Image de l'école : le personnel tamponne le formulaire, dépose des fiches dans la corbeille et dit à l'entrepôt « on a bien reçu. »

### Étape 3 : Worker email

1. Tire le job de la file email.
2. Remplit le template avec l'id de commande et le lien de suivi.
3. Appelle le fournisseur email.
4. Stocke l'id de message du fournisseur.
5. Marque le log `sent` (ou `failed` avec une raison).

### Étape 4 : Worker push (le chemin vers le téléphone)

1. Tire le job push.
2. Cherche les tokens d'appareil actifs de `cus_12`.
3. Construit un payload court depuis le template push.
4. Poste vers APNs ou FCM pour chaque token.
5. Sur « token invalide », désactive cette ligne d'appareil.
6. Sur erreur temporaire, réessaie avec backoff.
7. Met à jour le log.

### Étape 5 : Le téléphone

Apple ou Google livrent quand l'appareil est en ligne. L'utilisateur voit : « Votre commande ord_9f3a a été expédiée... » Un deep link optionnel ouvre le suivi.

### Étape 6 : Accusés plus tard

Les fournisseurs peuvent envoyer des webhooks : livré, bounce, ouvert. Cela met à jour l'analytics sans bloquer l'envoi. Le chemin chaud reste mince.

Voilà la colonne vertébrale : **événement → préférences → enregistrer l'intention → file → worker → fournisseur → appareil**.

---

## Un design que vous pouvez défendre (forme entretien)

Si on vous demande de le dessiner au tableau, dites :

1. **API de notifications sans état** pour auth, validation, préférences, rate limits et idempotence.
2. **Base + cache** pour utilisateurs, appareils, réglages, templates et le log.
3. **Files et workers par canal** avec adaptateurs push, SMS et email.
4. **Templates** rendus dans les workers, versionnés et localisés.
5. Livraison **at-least-once** avec retries, dead-letter queue et clés d'idempotence.
6. **Monitoring** de l'âge des files et des taux d'erreur fournisseur.

Compromis à dire à voix haute :

- Une seule file est plus simple ; des files par canal isolent les pannes.
- L'envoi synchrone est plus facile à déboguer et meurt quand un fournisseur est lent.
- L'exactly-once parfait à travers les opérateurs n'est pas gratuit ; idempotence et dédup sont la barre pratique.
- Les campagnes marketing et les codes de mot de passe ne doivent pas partager la même priorité ni le même budget.
- Faire tourner ses propres serveurs email semble bon marché jusqu'à ce que la réputation mange l'équipe.

Exemple d'échelle (à ajuster avec l'intervieweur) : des millions de push par jour, moins de SMS car le SMS coûte cher, soft real-time (des secondes suffisent pour une expédition ; un OTP a besoin d'un chemin prioritaire rapide).

---

## Récap pour un ami

Un système de notifications, c'est le secrétariat de votre produit. Les autres services apportent des nouvelles. Le secrétariat regarde comment chaque personne veut être jointe, remplit un formulaire standard, note la demande dans un log et dépose le travail dans des corbeilles d'attente. Des coursiers différents gèrent push, SMS et email via des entreprises externes. Si un envoi échoue pour une raison temporaire, ils réessayent quelques fois. S'il est cassé pour de bon, ils s'arrêtent et préviennent quelqu'un. Qui a dit « non aux textos marketing » ne reçoit pas de textos marketing. Un événement « commande expédiée » devient une courte alerte téléphone parce que l'API a accepté le job, un worker a rempli le template, et Apple ou Google l'ont livré quand le téléphone était prêt. Le dur n'est pas le JSON envoyé à un fournisseur. Le dur, c'est d'accepter le travail vite, de respecter les préférences, de survivre à des tiers capricieux, et de ne jamais perdre en silence les messages importants.

---

## Clôture

Construisez bien le secrétariat : **canaux** pour les portes, **préférences** pour le consentement, **templates** pour un libellé cohérent, **files** pour que le guichet ne se fige pas, et **retries** pour qu'une panne temporaire ne soit pas un silence permanent. Découplez accepter et livrer. Isolez les canaux. Traitez les fournisseurs externes comme des collègues peu fiables. Tout le reste s'accroche à cette colonne.