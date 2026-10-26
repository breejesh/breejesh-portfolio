---
title: "Concevoir Google Drive : synchronisation par blocs, stockage adressé par contenu, versions et conflits"
description: "Comment fonctionne la synchronisation de fichiers dans le cloud : découper les fichiers en blocs hachés pour ne transférer que les changements, stockage de blocs adressé par contenu, service de métadonnées avec journaux de modifications par espace de noms, notifications qui signalent aux appareils de se synchroniser, concurrence optimiste, copies en conflit, versions, partage et stockage froid."
date: "2026-02-10"
tags: [Design Système et Architecture]
coverImage: /assets/images/design-google-drive.webp
previewImage: /assets/images/design-google-drive.webp
---

> **TL;DR**
> * **Le problème :** Garder le même dossier identique sur un ordinateur portable, un téléphone et un navigateur, pour des dizaines de millions d'utilisateurs possédant chacun des gigaoctets, sur des réseaux capricieux, alors que les gens modifient les mêmes fichiers hors ligne et s'attendent à ce que rien ne soit jamais perdu.
> * **La conception :** Découper les fichiers en blocs de taille fixe identifiés par leur hachage, n'envoyer que les blocs que le serveur n'a pas encore, et valider chaque nouvelle version comme une liste de hachages de blocs dans une base de métadonnées. Chaque validation s'ajoute à un journal de modifications par espace de noms ; un service de notification signale aux autres appareils de récupérer les changements postérieurs à leur curseur. Les validations utilisent la concurrence optimiste, et perdre une course produit une copie en conflit plutôt qu'un écrasement silencieux.
> * **Le résultat :** Modifier un gros fichier envoie des mégaoctets au lieu de gigaoctets, un contenu identique n'est stocké qu'une fois, les appareils se mettent à jour avec une requête de curseur, et le seul scénario de perte de données restant est celui que les utilisateurs provoquent volontairement.

Un produit de synchronisation fait une promesse qui paraît simple et ne l'est pas : *le dossier est le même partout*. En dessous, c'est un système distribué où chaque ordinateur portable est un réplica qui disparaît pendant des jours, et où les utilisateurs qui le modifient écrivent eux-mêmes les conflits.

Dropbox a popularisé l'architecture décrite ici, et Google Drive, OneDrive et iCloud Drive résolvent le même problème de manière assez proche.

---

## Exigences et chiffres

**Fonctionnelles :** envoyer, télécharger et synchroniser fichiers et dossiers entre appareils ; historique des versions et restauration ; partage avec permissions ; modifications hors ligne synchronisées plus tard ; notifications quand un contenu partagé change.

**Non fonctionnelles :** ne jamais perdre de données validées ; synchroniser les changements en quelques secondes quand les appareils sont en ligne ; rester efficace sur les réseaux lents et facturés au volume ; passer à des centaines de pétaoctets.

| Hypothèse | Valeur | Conséquence |
| --- | --- | --- |
| Utilisateurs | 50 M | |
| Stockage moyen par utilisateur | 10 Go | ~500 Po logiques, avant déduplication et compression |
| Modifications de fichiers par utilisateur et par jour | ~2 | ~100 M de validations/jour, ~1 200/s en moyenne |
| Taille moyenne d'un fichier | ~500 Ko, avec une longue traîne de fichiers de plusieurs Go | La plupart des validations sont petites ; quelques-unes dominent la bande passante |
| Appareils par utilisateur | 2 à 3 | Chaque changement est téléchargé par 1 ou 2 autres appareils |

---

## L'architecture

![Architecture d'un drive dans le cloud : les clients ordinateur portable, téléphone et web atteignent un répartiteur de charge ; le service de blocs envoie et déduplique des blocs adressés par contenu dans un magasin de blocs, l'API de métadonnées valide les versions de fichiers dans une base de métadonnées partitionnée par espace de noms, les validations s'ajoutent à un journal de modifications par espace de noms, un service de notification signale aux autres appareils qu'un changement a eu lieu, et les anciens blocs passent dans un niveau froid](/assets/images/hld/design-drive-architecture.webp)

* **Client de synchronisation du portable.** La pièce la plus complexe. Il surveille le système de fichiers, tient une base locale de ce qu'il croit que le serveur possède, découpe les fichiers modifiés en blocs, envoie, valide et applique les changements distants. Dropbox a réécrit le sien (le moteur « Nucleus », en Rust) précisément parce que la justesse de la synchronisation est aussi difficile.
* **Téléphone / Web.** En général, ils ne répliquent pas tout le dossier ; ils parcourent les métadonnées et téléchargent les fichiers à la demande.
* **Load Balancer.** Envoie le trafic de blocs et le trafic de métadonnées vers des flottes séparées, car leurs profils diffèrent : de gros corps en streaming d'un côté, de petites requêtes transactionnelles de l'autre.
* **Block Service (envoi, déduplication).** Accepte des blocs adressés par leur hachage. Si un bloc avec ce hachage existe déjà, l'envoi est ignoré. Prend en charge la reprise des transferts.
* **Block Store (adressé par contenu).** Un stockage objet dont la clé est le hachage du bloc. Immuable : un bloc n'est jamais modifié, seulement référencé ou collecté. Dropbox a déplacé en 2016 l'essentiel de ce niveau d'Amazon S3 vers son propre système à l'échelle de l'exaoctet, Magic Pocket.
* **Metadata API (fichiers, versions).** Le registre faisant autorité sur l'arborescence : chemins, versions, listes de blocs, permissions. Chaque changement y est une transaction.
* **Metadata DB (partitionnée par espace de noms).** Un espace de noms est la racine d'un utilisateur ou un dossier partagé. Partitionner par espace de noms garde tout l'historique d'un dossier et son journal sur une seule partition, si bien que les validations sont des transactions mono-partition.
* **Change Journal (par espace de noms).** Un journal ordonné de chaque validation dans un espace de noms. Chaque appareil retient son curseur (sa position dans le journal).
* **Notification (long-poll / WebSocket).** Ne transporte pas les changements, seulement « quelque chose a changé dans l'espace de noms N ». L'appareil demande alors à l'API de métadonnées tout ce qui suit son curseur.
* **Cold tier.** Les blocs référencés uniquement par d'anciennes versions ou par des fichiers rarement consultés passent sur un stockage moins cher.

---

## Pourquoi les blocs changent tout

![Flux d'envoi et de validation : découper le fichier en blocs de 4 Mo, hacher chaque bloc, demander au serveur quels hachages manquent, n'envoyer que les blocs manquants, puis valider une nouvelle version avec la version parente attendue ; si le parent correspond, la version 8 est enregistrée et les appareils prévenus, et si une autre validation est arrivée avant, le client enregistre une copie en conflit](/assets/images/hld/design-drive-upload-commit.webp)

Traiter les fichiers comme des objets entiers signifie que modifier un octet d'une vidéo de 1 Go renvoie 1 Go. Les traiter comme des listes de blocs règle trois problèmes d'un coup :

1. **La synchronisation différentielle.** Seuls les blocs modifiés voyagent. Dropbox a indiqué utiliser des blocs de 4 Mo. Une modification au milieu d'un gros fichier touche en général un ou deux blocs. (Des blocs de taille fixe se décalent quand on insère des octets au début d'un fichier ; le découpage défini par le contenu avec un hachage glissant, l'idée derrière rsync et de nombreux outils de sauvegarde, garde des frontières stables au prix d'une complexité plus grande.)
2. **La déduplication.** Les blocs identiques ne sont stockés qu'une fois, qu'ils viennent de la version précédente du même fichier, d'une copie faite par l'utilisateur ou du même installeur téléchargé par de nombreux utilisateurs. La déduplication entre utilisateurs a des implications pour la vie privée : un attaquant peut savoir si un contenu existe déjà en observant la vitesse d'envoi, donc beaucoup de services limitent la déduplication à un même compte.
3. **La reprise.** Un envoi interrompu reprend au prochain bloc manquant, pas à zéro.

**Le protocole de validation :**

1. Le client hache les blocs et demande « lesquels de ces hachages te manquent ? ».
2. Le client n'envoie que ceux-là.
3. Le client valide `fichier X, nouvelle liste de blocs, version parente v7`.
4. Le serveur n'accepte que si la version actuelle est toujours v7, puis l'ajoute au journal.

La note verte en est le bénéfice pratique. La note rouge est la règle de concurrence qui fait fonctionner la section suivante.

---

## Les conflits : ne jamais choisir un gagnant en silence

Deux appareils modifient le même fichier hors ligne. Les deux se reconnectent. Les deux valident avec le parent v7. Le premier gagne et devient v8. Le second reçoit « conflit : le parent a changé ».

Que doit faire le client ? Tous les grands produits de synchronisation ont fait le même choix : **garder les deux**. La modification perdante est enregistrée à côté, sous un nom comme `report (Alice's conflicted copy 2026-02-10).docx`. C'est laid. C'est aussi la seule réponse qui ne détruit jamais le travail de quelqu'un.

Les éditeurs collaboratifs en temps réel (Google Docs, Office en ligne) évitent cela autrement : ils synchronisent des opérations fines par transformation opérationnelle ou CRDT, pas des fichiers entiers. La synchronisation de fichiers et la collaboration sur documents sont des produits différents, et pour cause.

D'autres cas de conflit à traiter explicitement :

| Cas | Résolution raisonnable |
| --- | --- |
| Modification sur un appareil, suppression sur un autre | Garder le fichier modifié ; une suppression ne doit pas détruire une modification plus récente |
| Renommage sur un appareil, modification sur un autre | Appliquer les deux : le fichier est renommé et porte le nouveau contenu |
| Deux dossiers créés avec le même nom | Fusionner si c'est sûr, sinon suffixer l'un des deux |
| Renommages ne portant que sur la casse, sur des systèmes insensibles à la casse | À traiter avec soin ; source classique de bugs de synchronisation |

---

## Versions, restauration et suppression

Comme les blocs sont immuables et que les versions sont des listes de hachages, l'historique des versions est presque gratuit : chaque version est une petite ligne de métadonnées. Restaurer une ancienne version, c'est une nouvelle validation qui pointe vers l'ancienne liste de blocs.

Supprimer est plus difficile qu'il n'y paraît. Un bloc ne peut être effacé que lorsqu'aucune version d'aucun fichier ne le référence, et les versions sont conservées pendant une fenêtre de rétention (par exemple 30 jours ou plus sur les offres payantes). Le ramasse-miettes est un traitement de fond délicat, par comptage de références ou marquage et balayage des métadonnées, car supprimer un bloc encore référencé est une perte de données définitive.

---

## Le partage

Un dossier partagé est son propre espace de noms, monté dans l'arborescence de chaque membre. Les permissions vivent sur l'espace de noms (lecteur, commentateur, éditeur). Comme le journal et les notifications sont par espace de noms, une modification faite par un membre prévient les appareils de tous les membres par exactement le même chemin que les changements d'un utilisateur seul.

Les liens (« toute personne disposant du lien ») sont une autorisation séparée et révocable, avec expiration et mot de passe optionnels, vérifiée par l'API de métadonnées à chaque accès.

---

## Modes de défaillance

| Défaillance | Comportement |
| --- | --- |
| Envoi interrompu | Reprise au prochain bloc manquant |
| Validation réussie, mais le client plante avant de l'enregistrer | Au redémarrage, le client interroge le journal et voit sa propre validation |
| Service de notification indisponible | Les clients se rabattent sur une interrogation périodique de leur curseur |
| Partition de métadonnées indisponible | Cet espace de noms ne peut plus valider ; les autres ne sont pas touchés. Les clients mettent en file leurs changements locaux |
| Bloc corrompu dans le stockage | L'écart de hachage est détecté à la lecture ; réparation depuis un réplica ou des fragments à codes d'effacement |
| Un bug client supprime tout en local | L'historique des versions côté serveur et la corbeille permettent de récupérer ; limitez et confirmez les suppressions massives |

---

## Liste de contrôle pour la production

- [ ] Hachage des blocs et négociation des blocs manquants avant l'envoi
- [ ] Stockage de blocs adressé par contenu et immuable, avec contrôle d'intégrité à la lecture
- [ ] Métadonnées partitionnées par espace de noms ; validations en transactions mono-partition
- [ ] Concurrence optimiste avec versions parentes ; copies en conflit, jamais d'écrasement silencieux
- [ ] Journal de modifications par espace de noms et curseurs par appareil
- [ ] Notifications en tant qu'indices, avec interrogation périodique en secours
- [ ] Politique de rétention des versions et ramasse-miettes sûr et audité
- [ ] Protection contre les suppressions massives et corbeille
- [ ] Tableaux de bord : latence de synchronisation (de la validation à son application sur un autre appareil), taux de conflits, octets d'envoi économisés par la déduplication, retard du journal

---

## Ce qui reste

La magie d'un dossier synchronisé, c'est qu'on oublie qu'il existe. On enregistre un fichier sur son portable le soir et on l'ouvre sur son téléphone le matin sans penser aux centaines de blocs, hachages, journaux et curseurs entre les deux.

Le jour où l'on se souvient qu'il existe, c'est souvent celui où il a créé une copie en conflit. Un nom laid, les deux versions intactes. Ce fichier, c'est le système qui tient sa seule vraie promesse.

---

## Sources

* [Dropbox Tech Blog : Rewriting the heart of our sync engine (Nucleus)](https://dropbox.tech/infrastructure/rewriting-the-heart-of-our-sync-engine)
* [Dropbox Tech Blog : Inside the Magic Pocket](https://dropbox.tech/infrastructure/inside-the-magic-pocket)
* [Dropbox Tech Blog : Streaming file synchronization](https://dropbox.tech/infrastructure/streaming-file-synchronization)
* [Aide Dropbox : copies en conflit](https://help.dropbox.com/organize/conflicted-copy)
* [Tridgell et Mackerras, « The rsync algorithm »](https://rsync.samba.org/tech_report/)
* Dans la même série : [Concevoir un magasin clé-valeur](/blog/fr/design-key-value-store), [Concevoir une plateforme vidéo à l'échelle de YouTube](/blog/fr/design-youtube-streaming), [Concevoir un système de notifications](/blog/fr/design-notification-system)
