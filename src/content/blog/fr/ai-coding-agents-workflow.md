---
title: "Comment utiliser vraiment les agents de code IA sans livrer de la camelote"
description: "Habitudes pratiques style Cursor et Copilot: fenêtres de contexte, boucles de revue, tests d'abord avec des agents, et quand rejeter le code IA."
date: "2026-08-05"
tags: [IA et Machine Learning, Outils Développeur et Régulation]
coverImage: /assets/images/ai-coding-agents-workflow.webp
previewImage: /assets/images/ai-coding-agents-workflow.webp
---

Les agents de code IA excellent à produire du code plausible très vite. Ils excellent aussi à produire des bugs plausibles, de mauvaises abstractions et des "correctifs" qui cassent trois fichiers voisins. L'écart entre les démos et la production n'est pas le QI du modèle. C'est le processus.

Je traite les agents style Cursor et les complétions style Copilot comme un junior très rapide: utiles, infatigables, et tout à fait prêts à inventer quelque chose qui a l'air juste. Votre travail n'est pas de taper moins. Votre travail est de contrôler le contexte, d'exiger des preuves, et de rejeter avec assurance.

Ce billet est un playbook de terrain. Pas de guerre d'outils. Juste des habitudes qui gardent la vitesse sans remplir le dépôt de camelote.

---

## 1. Le contexte est la vraie interface

Les agents ne "comprennent" pas votre codebase. Ils font du pattern matching sur ce que vous placez devant eux. Un mauvais contexte produit du code faux avec confiance. Un bon contexte produit des diffs ennuyeux et mergeables.

**Donnez à l'agent le plus petit paquet honnête:**

1. **L'objectif en une phrase.** "Ajoute des retries idempotents au handler webhook de paiement pour les 5xx Stripe." Pas "améliorer la gestion d'erreurs."
2. **Les fichiers qui portent le comportement.** Handler, service, utilitaire de retry existant, et le fichier de tests. Pas tout l'arbre du module.
3. **Les conventions locales.** Nommage des packages, style de logs, structure des erreurs, client HTTP utilisé.
4. **Les contraintes.** "Pas de nouvelles dépendances." "Respecte la politique de retry actuelle." "Ne change pas l'API publique."
5. **La définition de terminé.** "Les tests unitaires couvrent les IDs d'événement en double et les timeouts réseau. Les tests webhook existants passent encore."

Si le prompt est vague, l'agent inventera de l'architecture. C'est là que commence la plupart de la camelote.

**Les instructions au niveau du dépôt aident**, qu'il s'agisse de règles Cursor, d'un fichier d'instructions projet, ou d'un court extrait `CONTRIBUTING` toujours visible par l'agent. Gardez ces règles courtes et opérationnelles:

- Préférer les helpers existants aux nouvelles utilités
- Ne pas réécrire des fichiers hors sujet
- Suivre le style actuel d'erreurs et de logs
- Ne jamais faire taire des tests en les supprimant

Les longs manifestes sont ignorés. Les règles dures et courtes tiennent.

---

## 2. Gérez la fenêtre de contexte comme une ressource rare

Les fenêtres de contexte semblent immenses jusqu'à ce que vous colliez la moitié d'un monorepo. Une fois la fenêtre remplie de bruit, le modèle perd les lignes importantes: votre invariant, votre cas limite, la fonction qui résolvait déjà le problème.

**Hygiène pratique de la fenêtre:**

- **Nouveau chat pour chaque nouvelle tâche.** L'historique du refactor d'hier biaise le bugfix d'aujourd'hui.
- **Préférez les références de fichiers aux gros collages.** Pointez le fichier réel pour du contenu à jour, pas un snippet périmé.
- **Résumez les décisions, pas les transcripts.** Quand le chat s'allonge, écrivez une courte note "jusqu'ici" et ouvrez une session propre avec cette note et les fichiers actifs.
- **Coupez les impasses.** Si l'agent s'est trompé trois tours, n'empilez pas les corrections. Redémarrez avec une contrainte plus claire.
- **Ne déversez pas des logs entiers.** Collez l'assertion en échec, la frame de pile qui compte, et un payload représentatif.

Modèle mental utile: chaque token inclus concurrence les tokens qui expliquent le bug. Protégez-les.

---

## 3. Écrivez le contrat avant de laisser l'agent coder

Le levier le plus fort avec les agents reste classique: définir le comportement d'abord.

**Le test-first avec un agent ressemble à ceci:**

1. Vous écrivez ou esquissez le test qui échoue (ou le type/interface) qui capture le comportement voulu.
2. Vous demandez à l'agent de faire passer le test avec le plus petit changement.
3. Vous lancez la suite vous-même. Ne croyez pas le "tout vert" de l'agent avant de le voir.
4. Vous revoyez le diff pour le scope creep, puis vous commitez.

Pourquoi ça marche: tests et types réduisent l'espace de recherche. L'agent n'invente pas les exigences produit au milieu du diff. Il résout un problème fermé.

**Bonnes tâches pour l'agent:**

- Implémenter une fonction qui a déjà des tests table-driven
- Migrer un call site vers une nouvelle API en gardant les tests verts
- Ajouter un chemin de null check couvert par une fixture existante
- Générer du boilerplate dont le projet a déjà trois exemples

**Mauvaises tâches (jusqu'à les resserrer):**

- "Construis l'auth"
- "Nettoie ce module"
- "Rends ça plus scalable"
- "Répare le test flaky d'une façon ou d'une autre"

Si vous ne pouvez pas énoncer entrées, sorties et modes d'échec attendus, l'agent non plus. Il produira quand même du code. C'est le problème.

---

## 4. Utilisez une boucle de revue, pas un "ça a l'air bien"

Lire la sortie IA comme un PR d'un inconnu, c'est tout le métier. La vitesse vient de boucles courtes, pas de l'absence de revue.

**Une boucle de revue qui tient en vrai dépôt:**

1. **D'abord la portée du diff.** A-t-il touché des fichiers hors tâche? Annulez tout de suite. Le "nettoyage" non lié cache les régressions subtiles.
2. **Lisez l'intention, pas le style.** Le formatage est pour les outils. Le mauvais contrôle de flux, non.
3. **Tracez le happy path à la main.** Suivez une requête de l'entrée au retour. La forme des données correspond-elle aux callers?
4. **Forcez le chemin d'échec.** Timeouts, listes vides, écritures partielles, événements en double, callers non autorisés. Les agents en génèrent trop peu.
5. **Lancez le plus petit ensemble de tests honnête**, puis une suite plus large si le changement traverse des frontières.
6. **Seulement ensuite** demandez une seconde passe: "Voici ce qui a échoué. Corrige uniquement ça. Ne refactorise pas."

N'acceptez jamais des réécritures multi-fichiers parce que la première tentative a presque marché. Préférez des correctifs chirurgicaux.

**Signaux d'alerte qui vous sauvent:**

- Nouvelle abstraction avec un seul call site
- Utilitaire copié qui existe déjà deux dossiers plus loin
- Grands `try/catch` qui renvoient null ou un succès vide
- Flags "temporaires" sans plan de retrait
- Commentaires qui racontent le code au lieu d'expliquer une contrainte non évidente
- Changements de config sans explication dans la description du PR

Si deux de ces signaux apparaissent, l'agent improvise. Ralentissez.

---

## 5. Quand rejeter purement et simplement le code IA

Rejeter est une compétence. Accepter à moitié une mauvaise structure pour "juste la peaufiner" coûte souvent plus cher qu'une réécriture.

**Rejetez et recommencez quand:**

- L'agent ne peut pas expliquer *pourquoi* le changement est correct en langage clair
- Le correctif dépend d'une librairie ou d'une API qui n'existe pas dans votre projet (ou dans la réalité)
- Il résout un autre problème que celui du ticket
- Les tests ont été édités pour coller à un comportement cassé au lieu de corriger le code
- Des chemins sensibles (auth, crypto, paiements, multi-tenant) ont changé sans passe de design humaine soignée
- Le diff est grand et vous ne pouvez pas tenir tout le changement de comportement en tête

**Réécrivez vous-même quand:**

- La logique métier est subtile et vous connaissez déjà le design
- Le changement fait dix lignes et l'agent propose encore un framework
- Vous apprenez la zone et avez besoin du modèle mental plus que de la vitesse

**Gardez l'agent quand:**

- Le motif se répète (endpoints CRUD, mappers, tables de tests)
- Migrations mécaniques avec le compilateur ou la suite de tests comme filet
- Brouillons de docs, messages de commit ou checklists de revue à partir d'un diff connu
- Explorer deux options d'implémentation sur un spike petit et bien borné

Les agents accélèrent des formes connues. Ils remplacent mal la propriété du design.

---

## 6. Un flux quotidien qui ne livre pas de camelote

Voici la boucle que j'utilise vraiment sur du travail non trivial:

1. **Clarifiez le changement dans une courte note.** Objectif, non-objectifs, fichiers, risques.
2. **Verrouillez le contrat.** Test qui échoue, type ou esquisse d'API d'abord.
3. **Ouvrez une session agent propre** avec seulement les fichiers pertinents et la note.
4. **Demandez le plus petit patch**, pas une refonte.
5. **Lancez tests et linters vous-même.**
6. **Revoyez comme une code review hostile.** Portée, cas limites, sécurité, performance.
7. **Acceptez, demandez un correctif ciblé, ou jetez.** Pas de fidélité au coût irrécupérable d'un mauvais fil.
8. **Commitez avec un message écrit par un humain** qui dit le quoi et le pourquoi. Si vous ne pouvez pas écrire ce message clairement, vous ne comprenez pas encore le changement.

Pour les minuscules complétions (rename, null guard évident, nom de test), les suggestions inline style Copilot suffisent. Dès qu'un changement traverse une frontière de module, passez à la boucle agent complète ci-dessus.

---

## 7. Les habitudes d'équipe comptent plus que les astuces perso

La compétence individuelle aide. Les defaults partagés gardent le codebase sain quand cinq personnes utilisent les agents différemment.

À standardiser:

- **Tests obligatoires pour les PR assistés par IA** dans les mêmes zones déjà exigées pour les PR humains
- **Interdiction des refactors au passage** dans les branches feature, humains ou IA
- **Jamais coller secrets ni accès prod dans les prompts**
- **Un court fichier de règles projet** versionné dans le dépôt
- **Item de checklist reviewer:** "Assistance IA? Les chemins d'échec ont-ils été exercés?"

Vous n'avez pas besoin d'un roman de politique. Vous avez besoin d'un accord: la vitesse n'excuse pas les diffs non revus.

---

## En bref

Les agents de code IA relèvent le plafond de vitesse pour produire du code candidat. Ils ne relèvent pas le plafond de code non revu que votre système peut absorber.

Maîtrisez le contexte. Écrivez le contrat d'abord. Revoyez comme si l'auteur était intelligent et indigne de confiance. Rejetez sans culpabilité. Gardez l'agent sur le travail mécanique bien borné, et gardez les décisions de design humaines.

Faites cela, et les agents cessent d'être une source de dette silencieuse en production. Ils deviennent ce que promettaient les démos: un outil tranchant avec un opérateur responsable.
