---
title: "Concevoir Google Drive : comment un dossier magique marche sur chaque appareil"
description: "Stockage façon Google Drive pour débutants absolus : upload, download, sync, morceaux, versions, partage, et ce qui se passe quand deux téléphones éditent le même fichier hors ligne."
date: "2026-02-10"
tags: [Design Système et Architecture]
coverImage: /assets/images/design-google-drive.webp
previewImage: /assets/images/design-google-drive.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Stockage façon Google Drive pour débutants absolus : upload, download, sync, morceaux, versions, partage, et ce qui se passe quand deux téléphones éditent le même fichier hors ligne.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Imaginez un dossier magique. Vous y glissez une photo sur le portable. Vous ouvrez le téléphone dans le bus et la même photo est déjà là. Vous modifiez un tableur au bureau. À la maison, la tablette affiche les nouveaux chiffres. On ne sent pas un "serveur". On sent un seul dossier qui vit partout à la fois.

C'est le produit quand on dit "concevoir Google Drive". Sous le verre, ce n'est pas de la magie. C'est de l'ingénierie soignée autour de six idées : **upload**, **download**, **sync**, **morceaux (chunks)**, **versions** et **partage (share)**. Ce billet explique chacune comme je le ferais avec un élève brillant qui n'a jamais dessiné de schéma système.

On laisse de côté la coédition en direct (plusieurs personnes qui tapent en même temps dans un Google Doc). C'est un autre produit, plus dur. Ici on conçoit un dossier de fichiers ordinaires : PDF, photos, zips, documents bureautiques.

---

## Le dossier magique, en langage simple

Vos appareils ne sont pas le vrai foyer des fichiers. Le vrai foyer est un grand système soigneux dans le cloud. Chaque téléphone ou portable garde une **copie** des fichiers qui vous importent (ou une liste d'eux, s'ils sont énormes). Quand vous changez quelque chose, l'appareil le dit au cloud. Quand le cloud apprend un changement, il le dit à vos autres appareils. Le "dossier qui apparaît partout" est l'illusion créée par cette boucle.

Deux missions ne doivent jamais échouer :

1. **Les octets ne doivent pas disparaître.** Si vous uploadez la vidéo d'un mariage, la perdre n'est pas un bug. C'est un désastre.
2. **Les noms et "quelle version est la dernière" doivent s'accorder** sur chaque appareil concerné. Si le téléphone dit que `budget.xlsx` est vide et le portable a les chiffres de la semaine dernière, les gens croiront que des données ont été effacées même si les octets sont encore en sécurité.

Tout ce qui suit sert ces deux missions.

---

## Upload : mettre un fichier dans le cloud

**Upload** signifie : "prends ce fichier depuis mon appareil et range-le loin d'ici, en sécurité."

Pour un petit fichier (une courte note texte), l'app peut envoyer le fichier entier d'un coup. Pour un gros fichier (une vidéo de 2 Go sur des données mobiles instables), un long envoi se casse souvent en cours de route. Les systèmes sérieux façon Drive utilisent donc un **upload résumable** :

1. L'app demande au serveur : "Je veux uploader un fichier de cette taille, avec ce nom, dans ce dossier."
2. Le serveur ouvre une **session** et répond : "OK. Envoie-moi des morceaux. Si tu te déconnectes, demande-moi jusqu'où on en était."
3. L'app envoie le fichier en morceaux. Si le Wi-Fi meurt à 70 %, elle se reconnecte et reprend à 70 %, pas à zéro.

Avant d'accepter le corps, le serveur vérifie des règles simples : l'utilisateur a-t-il le droit d'écrire ici ? Le fichier est-il sous la limite de taille ? Reste-t-il du quota ?

**Note de cours :** ne dites jamais à l'utilisateur "upload terminé" tant que deux choses ne sont pas vraies : les octets du fichier sont stockés en sécurité, et la ligne de base de données qui pointe vers ces octets est enregistrée. Si vous ne sauvez qu'une des deux, vous obtenez des fichiers fantômes ou des données orphelines.

---

## Download : ramener un fichier

**Download** est l'inverse : "donne-moi les octets de ce fichier pour que je l'ouvre ou le sauve."

Les gros systèmes poussent rarement d'énormes fichiers à travers les mêmes petits serveurs d'API qui gèrent login et listes de dossiers. Un motif courant est :

1. Votre app demande : "Puis-je télécharger le fichier X ?"
2. L'API vérifie les droits.
3. L'API renvoie un lien spécial de courte durée (une **URL signée**) vers le grand entrepôt de fichiers.
4. Votre app récupère les octets directement depuis cet entrepôt.

Pour des apps de sync qui ont déjà la majeure partie d'un fichier, on télécharge souvent seulement les **pièces changées** (voir morceaux plus bas), pas le fichier entier une nouvelle fois.

---

## Sync : garder chaque appareil honnête

**Sync** est le cœur du dossier magique. Cela signifie : après qu'un changement arrive n'importe où, les autres endroits rattrapent.

Une histoire simple :

1. Vous renommez `voyage.jpg` en `paris.jpg` sur le portable.
2. Le portable dit au cloud : "ce fichier s'appelle maintenant paris.jpg."
3. Le cloud enregistre ce fait et prévient votre téléphone : "quelque chose a changé dans ce dossier."
4. Le téléphone demande la liste des changements, voit le renommage et met à jour le nom local.

Si le téléphone était hors ligne (mode avion), il a raté le signal. Quand il revient en ligne, il dit : "la dernière fois que je connaissais le monde, c'était le changement numéro 1200. Que s'est-il passé après ?" Le cloud envoie une liste de rattrapage. Ce numéro s'appelle souvent un **curseur** ou un **change id**. Voyez-le comme un signet dans l'histoire du dossier.

Sync n'est pas la même chose que "s'envoyer le fichier par mail." Sync est continu, automatique et bidirectionnel (quand le produit permet d'éditer depuis plusieurs appareils).

---

## Morceaux (chunks) : casser les gros fichiers en pièces

Réuploader un diaporama de 50 Mo parce que vous avez corrigé une coquille, c'est brûler forfait mobile et patience.

Le système **découpe donc souvent un fichier en morceaux** (aussi appelés **blocs**). Une taille de cours typique est de quelques mégaoctets par morceau.

Imaginez un long train de wagons. Chaque wagon est un morceau. Chaque wagon reçoit une empreinte (un **hash**) : un court code calculé à partir de ses octets exacts. Les mêmes octets donnent toujours la même empreinte.

Ce que le cloud stocke :

- Les objets de morceaux bruts dans un énorme entrepôt (object storage).
- Une recette pour chaque **version** d'un fichier : "la version 7 de rapport.pdf est le morceau A, puis B, puis C, dans cet ordre."

Quand vous éditez et que seul le milieu change :

1. L'app re-calcule le hash des nouveaux morceaux.
2. Les morceaux inchangés vivent déjà dans l'entrepôt. Ne les uploadez pas encore.
3. Seules les nouvelles empreintes sont uploadées.
4. Une nouvelle recette (version 8) pointe vers la nouvelle liste ordonnée d'empreintes.

**Pourquoi c'est important :**

- **Delta sync :** n'envoyer que ce qui a changé.
- **Déduplication :** si deux fichiers partagent un morceau identique (même empreinte), on peut stocker ce morceau une seule fois (au moins dans un compte).
- **Historique sans copies complètes :** les anciennes versions gardent leurs recettes. Les morceaux partagés inchangés ne sont pas dupliqués à chaque version.

Pour ouvrir un fichier, le client lit la recette, télécharge les wagons manquants, puis les colle dans l'ordre.

---

## Versions : la piste d'annulation

Les utilisateurs adorent "il me faut la copie de mardi dernier." Un système façon Drive garde des **versions** d'un fichier.

Chaque sauvegarde réussie peut créer une nouvelle ligne de version : qui a sauvé, quand, taille, checksum, et la liste ordonnée de morceaux. L'arbre de dossiers pointe vers la version **courante** pour chaque nom de fichier. Les anciennes versions restent dans l'historique jusqu'à ce qu'une politique de rétention les retire.

Règle de design importante : traitez les versions comme **append-only** (on n'ajoute qu'à la fin). N'écrasez pas l'ancienne recette sur place. Faites pointer le fichier vers une nouvelle version quand la nouvelle est entièrement prête. Ainsi un upload à moitié fini ne devient jamais "le fichier officiel."

---

## Partage : laisser entrer d'autres personnes

**Partage** signifie : "cette personne peut lire (ou éditer) ce fichier ou ce dossier."

Derrière la scène, c'est une **ACL** (liste de contrôle d'accès) : des lignes qui disent "l'utilisateur B a le rôle writer sur le dossier Projets." Chaque download et chaque lecture de métadonnées doit vérifier ces règles. Un lien de download signé doit être de courte durée et difficile à deviner, ou lié à la bonne personne, pour qu'un lien fuité ne vive pas pour toujours.

Le partage affecte aussi le sync. Quand vous partagez un dossier avec un collègue, ses appareils doivent commencer à apprendre les changements de ce dossier. Quand vous révoquez l'accès, ses clients doivent arrêter de recevoir ces changements (et peuvent perdre des copies locales, selon la politique produit).

---

## Conflit : l'histoire des deux téléphones

Voici l'histoire que j'utilise en cours.

Vous avez deux téléphones. Les deux ont le dossier magique. Les deux passent hors ligne dans un avion. Sur le téléphone A vous éditez `notes.txt` et écrivez "Acheter du lait." Sur le téléphone B vous éditez le même `notes.txt` et écrivez "Acheter des œufs." Aucun téléphone ne peut encore parler au cloud, donc chacun croit que son édition est correcte.

Vous atterrissez. Le téléphone A revient en ligne en premier et uploade sa version. Le cloud l'accepte. `notes.txt` sur le serveur dit maintenant "Acheter du lait."

Le téléphone B revient en ligne et tente d'uploader "Acheter des œufs." Le cloud regarde le tampon de version (un **etag** ou un id de version) et dit : "Ta base était vieille. Quelqu'un a déjà sauvé une version plus récente."

Que doit faire le produit ?

**Mauvaise idée :** ne garder en silence que le dernier upload. Les utilisateurs du téléphone A perdent "Acheter du lait" sans avertissement. Ça ressemble à une perte de données.

**Bonne idée pour des fichiers ordinaires :** garder les deux. Le premier écrivain gagne comme fichier principal. Le second écrivain garde ses octets sous quelque chose comme `notes (conflit téléphone B).txt`, ou l'app affiche un écran de conflit clair pour qu'un humain choisisse ou fusionne à la main.

La fusion automatique est raisonnable pour du texte pur avec des outils soignés. Elle n'est pas gratuite pour un `.xlsx` quelconque ou une photo. Pour un Drive général, **copies de conflit plus choix utilisateur** est honnête. La coédition multi-curseurs en direct est l'autre produit laissé hors scope.

La même idée s'applique si deux personnes éditent en ligne : le serveur sérialise les commits. La première sauvegarde réussie gagne le pointeur principal. Le perdant est invité à résoudre.

---

## Un dessin simple du système

Vous n'avez pas besoin de cinquante boîtes. Vous avez besoin de quelques rôles :

```
Vos appareils (web, desktop, téléphone)
        |
   Répartiteur de charge
        |
   Serveurs API  ----  "Qui es-tu ? Quel est l'arbre de dossiers ? Qui peut éditer ?"
        |
   Base de métadonnées  (noms, versions, partages, historique des changements)
        |
   Chemin morceaux / blocs ---- Entrepôt d'objets (les vraies pièces du fichier)
        |
   Chemin de notifications  (réveille les appareils : "quelque chose a changé")
```

- **Serveurs API** gèrent login, listage des dossiers, démarrage des uploads, partage et "cet upload est-il fini ?"
- **Object storage** tient des morceaux durables. Il est fait pour garder les octets en sécurité sur plusieurs machines et lieux.
- **Base de métadonnées** tient la vérité sur noms, parents, version courante et ACLs. Cette partie a besoin d'un accord fort : deux appareils ne doivent pas diverger sur "quelle est la dernière."
- **Notifications** (long poll, push ou similaire) réveillent les clients inactifs pour qu'ils n'assaillent pas "liste tout" chaque seconde.

La version jouet du jour un peut être un serveur d'app et un dossier sur disque. Elle meurt quand le disque se remplit, la machine tombe, ou trois appareils ont besoin d'un éventail fiable de changements. Le dessin ci-dessus est la forme adulte attendue en entretien.

---

## Flux d'upload, de bout en bout (encore une fois, lentement)

1. Le client crée une session d'upload (nom, dossier parent, taille).
2. Le serveur enregistre une entrée en attente et renvoie comment envoyer les morceaux.
3. Le client uploade les morceaux. Le serveur les range dans l'entrepôt.
4. Quand tous les morceaux sont là et que les checksums collent, le serveur écrit une nouvelle recette de version et fait basculer le pointeur du fichier dessus.
5. Le serveur publie un événement de changement.
6. Les autres appareils se réveillent, tirent la nouvelle recette, téléchargent seulement les morceaux manquants et mettent à jour le fichier local.

Si l'étape 4 échoue après l'arrivée des morceaux, un job de nettoyage supprime plus tard les morceaux inutilisés. Ne laissez jamais le pointeur principal à moitié mis à jour.

---

## À quoi ressemble le "bien fait"

| Objectif | Sens simple |
| --- | --- |
| Durabilité | Les fichiers utilisateur survivent aux pannes de machines |
| Métadonnées fortes | Tout le monde s'accorde sur le nom et la version les plus récents |
| Sync bon marché | Seuls les morceaux changés traversent le réseau |
| Partage juste | Permissions vérifiées à chaque action sensible |
| Conflits honnêtes | Pas d'écrasement silencieux quand deux éditions se croisent |

Chiffres d'entretien approximatifs si on vous les demande : des dizaines de millions d'utilisateurs quotidiens, des quotas gratuits mesurés en gigaoctets par personne, des centaines d'uploads moyens par seconde à l'échelle du système, et bien plus de quota de stockage qu'une seule base SQL ne devrait jamais tenir en corps de fichiers bruts. Les blobs vivent dans l'object storage. Les bases tiennent de petits faits sur ces blobs.

---

## Récap pour un ami

Si vous aviez soixante secondes dans un café :

Google Drive est un **dossier magique** qui semble vivre sur chaque appareil. En réalité, chaque appareil garde une copie, et un système cloud est la source de vérité. **Uploader** envoie votre fichier vers le haut (en morceaux s'il est gros, et résumable si le réseau meurt). **Downloader** le ramène, souvent via un lien spécial court vers un entrepôt de fichiers. **Sync** est la boucle qui dit aux autres appareils "quelque chose a changé" et leur permet de rattraper avec un signet des derniers changements vus. Les **morceaux** cassent les fichiers en pièces à empreinte pour qu'une petite édition ne renvoie pas tout le fichier, et pour que l'historique réutilise les pièces inchangées. Les **versions** sont des recettes append-only de "à quoi ressemblait le fichier à la sauvegarde." **Partager** est une liste de permissions vérifiée à chaque ouverture. Quand **deux téléphones éditent hors ligne**, les deux éditions comptent : la première à atteindre le serveur devient le fichier principal, et la seconde devrait devenir une copie de conflit ou un choix clair pour un humain, jamais une perte silencieuse.

Protégez les octets. Mettez-vous d'accord sur le dernier. N'envoyez que ce qui a changé. Dites la vérité quand deux éditions se heurtent.

C'est le design.

