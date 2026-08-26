---
title: "Rebase interactif Git pour les vraies équipes: squash, fixup et historique propre"
description: "Guide pratique de git rebase -i: squash, reword, fixup, réordonner les commits, quand ne pas rebaser les branches partagées, et comment se rattraper avec le reflog."
date: "2026-07-04"
tags: [Outils Développeur et Régulation, Cloud et DevOps]
coverImage: /assets/images/git-interactive-rebase-guide.webp
previewImage: /assets/images/git-interactive-rebase-guide.webp
---

Le rebase interactif est l'outil que j'ouvre quand une branche feature ressemble à un carnet de labo: cinq commits "wip", un correctif de typo sur un correctif de typo, et un message que je ne mergerais jamais tel quel. Bien utilisé, ça transforme ce bruit en une courte histoire qu'un reviewer peut suivre. Sur la mauvaise branche, ça réécrit un historique sur lequel d'autres ont déjà construit, et le chat d'équipe s'enflamme.

Voici le playbook que j'utilise en équipe: les commandes, les verbes de todo qui comptent, quand s'arrêter, et comment s'en sortir quand ça tourne mal.

---

## Ce que fait vraiment le rebase interactif

Un rebase classique rejoue vos commits sur une autre base (souvent `main`). L'interactif fait la même chose, mais ouvre d'abord une **liste todo** pour modifier chaque commit avant le rejeu.

```bash
# Réécrire les 4 derniers commits de la branche courante
git rebase -i HEAD~4

# Rejouer votre branche sur un main à jour, en éditant en route
git fetch origin
git rebase -i origin/main
```

Git ouvre l'éditeur avec des lignes de ce genre (le plus ancien en haut):

```
pick a1b2c3d add login form
pick d4e5f6a fix typo in label
pick 7890abc wip validation
pick bcdef01 tests for login
```

Vous changez le **verbe** en début de ligne (et éventuellement l'ordre ou vous supprimez des lignes). Enregistrez, quittez. Git rejoue les commits selon ce nouveau plan.

Deux règles qui évitent la plupart des catastrophes:

1. Ne réécrivez que des commits qui **ne** sont **pas** sur une branche distante partagée que d'autres pullent (ou qui ne sont qu'à vous).
2. Avant un rebase risqué, notez un point de reprise: `git rev-parse HEAD`, ou comptez sur `ORIG_HEAD` et le `reflog` (plus bas).

---

## Les verbes de todo que vous utilisez vraiment

Pas besoin de tous le premier jour. Ces six couvrent presque tout le travail d'équipe.

| Verbe | Effet | Quand je l'utilise |
| --- | --- | --- |
| `pick` | Garde le commit tel quel | Par défaut; ne touchez pas |
| `reword` | Garde le diff, édite le message | Typos, "wip", id de ticket manquant |
| `edit` | Pause pour amend ou découpe | Fichier oublié; vouloir deux commits au lieu d'un |
| `squash` | Fusionne dans le précédent; **édite le message combiné** | Plusieurs WIP liés qui doivent devenir une seule histoire |
| `fixup` | Fusionne dans le précédent; **jette ce message** | Micro-correctifs: lint, import, test |
| `drop` (ou supprimer la ligne) | Supprime le commit | Expérience qui ne doit jamais ship |

Il y a aussi `exec` pour lancer une commande après un commit (pratique pour `npm test` à chaque étape quand vous nettoyez une série sale). Je m'en sers rarement au quotidien sur un PR.

### Squash vs fixup

Les deux plient un commit dans celui du dessus. La différence, c'est le message.

* **`squash`**: un éditeur s'ouvre pour rédiger le message combiné. À utiliser quand le commit enfant avait une vraie intention à garder dans le message final.
* **`fixup`**: le message de l'enfant est jeté. À utiliser pour du pur bruit de réparation ("fix tests", "oops").

Exemple de liste todo:

```
pick a1b2c3d add rate limiter middleware
fixup d4e5f6a fix off-by-one in window
fixup 7890abc missing unit test
reword bcdef01 document env vars
```

Résultat: deux commits. Le premier porte les trois diffs et le message middleware d'origine (sauf reword plus tard). Le second garde son arbre avec un message nettoyé.

Raccourci quand vous savez déjà vouloir des fixup en cours de route:

```bash
# Stage d'un petit fix qui appartient au commit précédent
git commit --fixup HEAD

# Plus tard, autosquash de ces fixup pendant le rebase
git rebase -i --autosquash origin/main
```

`--autosquash` réordonne les commits `fixup! ...` et `squash! ...` sous leurs cibles et met le bon verbe. Vous confirmez encore dans l'éditeur.

---

## Reword sans toucher au code

Les mauvais messages sont le nettoyage le plus courant. Pas besoin de toucher au diff.

```bash
git rebase -i HEAD~3
# remplacez "pick" par "reword" sur les lignes concernées
```

Git s'arrête à chaque `reword`, ouvre l'éditeur de message, puis continue. Préférez ça à `git commit --amend` quand le mauvais message **n'est pas** le commit de tête.

Si c'*est* la tête et que rien n'a été push (ou que la branche est à vous seul):

```bash
git commit --amend
# ou seulement le message:
git commit --amend -m "feat(auth): validate session before refresh"
```

---

## Edit: amend en milieu d'historique ou découper un commit

`edit` met le rebase en pause sur ce commit. Le working tree est à ce snapshot. Cas fréquents:

**Fichier oublié dans un vieux commit**

```bash
git rebase -i HEAD~5
# marquez le commit cible en "edit"
# quand Git s'arrête:
git add path/to/missing-file
git commit --amend --no-edit
git rebase --continue
```

**Découper un commit en deux**

```bash
# en pause sur "edit":
git reset HEAD^
git add -p   # première moitié logique
git commit -m "first half"
git add -p
git commit -m "second half"
git rebase --continue
```

`git reset HEAD^` laisse les changements dans l'arbre pour les re-stager. Vous ne supprimez pas le travail; vous recoupez les commits.

---

## Réordonner les commits

Parfois l'histoire est dans le désordre: tests avant le code qu'ils testent, ou un refactor au milieu d'une feature.

Dans la liste todo, **déplacez les lignes**. Le plus ancien reste en haut; l'ordre des lignes est le nouvel historique.

```
pick aaa1111 add API handler
pick bbb2222 add unit tests for handler
pick ccc3333 wire route in main
```

Si un commit plus récent dépend d'un plus ancien, réordonner peut créer des conflits. Ce n'est pas grave. Résolvez, `git add`, `git rebase --continue`. Si la dépendance est réelle, mettez d'abord le commit fondation.

---

## Une passe de nettoyage complète (le rituel habituel du PR)

Avant d'ouvrir ou de mettre à jour un PR, je veux souvent:

1. Branche basée sur le `main` courant.
2. Plus de bruit WIP.
3. Messages au style de l'équipe (ticket, scope, pourquoi).

```bash
git fetch origin
git rebase -i origin/main
```

Esquisse de liste todo:

```
pick 111aaaa feat: add checkout retry
fixup 222bbbb wip
fixup 333cccc fix tests
reword 444dddd more logging
pick 555eeee docs: note retry env flag
```

Ensuite:

```bash
# Si la branche était déjà pushée, l'historique a changé:
git push --force-with-lease
```

Préférez toujours `--force-with-lease` à `--force`. Lease refuse le push si le remote a bougé depuis votre dernier fetch (quelqu'un d'autre a push). Ceinture pas chère.

---

## Quand NE PAS rebaser

Le rebase interactif réécrit les SHA. Tout ce qui dépend déjà des anciens SHA va diverger.

**Ne rebaser pas:**

* **`main` / `master` / branches de release partagées** que beaucoup de gens pullent. Point final.
* **Toute branche sur laquelle plusieurs personnes pushent**, sauf accord explicite et fenêtre de freeze.
* **Des commits déjà entrés dans d'autres branches longues** via merge. Vous créez des doublons ou un double historique sale.
* **Tags publics et SHA de release** que le CI, les deploys ou l'audit épinglent.

**Préférez un merge (ou laissez l'historique) quand:**

* La branche est d'intégration partagée.
* L'audit tient à la chaîne exacte des commits d'origine.
* Vous n'êtes pas sûr de coordonner un force-push avec chaque collaborateur.

**Défaut sûr pour les features:** rebasez *votre* branche feature sur `main`, nettoyez en local, force-with-lease sur votre remote feature, ouvrez/mettez à jour le PR. Ne réécrivez jamais `main`.

Certaines équipes interdisent le rebase sur les branches distantes et n'autorisent que le squash-on-merge côté GitHub/GitLab. C'est une politique valide. Le rebase interactif reste utile *avant* le premier push, ou sur des branches qui ne sont qu'à vous.

---

## Conflits pendant le rebase

Un conflit n'est pas un échec. Git s'est arrêté pour que vous décidiez.

```bash
# Voir les chemins en conflit
git status

# Corrigez les fichiers, puis:
git add path/that/you/fixed
git rebase --continue

# Ou abandonnez tout le rebase et revenez:
git rebase --abort
```

Si vous êtes en plein milieu et voulez un arbre propre pour réfléchir:

```bash
git rebase --abort   # revient à l'état pré-rebase (quand c'est possible)
```

`--abort` est la sortie de secours. Mieux qu'un arbre à moitié résolu et un "je corrigerai plus tard."

---

## Se rattraper après une erreur

### ORIG_HEAD

Beaucoup d'opérations de rebase posent `ORIG_HEAD` sur la tête d'avant l'opération.

```bash
# Voir où vous étiez
git log --oneline ORIG_HEAD -5

# Hard reset de la tête de branche (destructif pour la tête actuelle seulement)
git reset --hard ORIG_HEAD
```

Ne faites un hard reset que si vous comprenez que vous jetez la tête réécrite au profit de la pré-rebase. Le travail non commité est un autre sujet; committez ou stash d'abord.

### Le reflog est le vrai filet

Chaque mouvement de tête est enregistré en local un moment (souvent ~90 jours par défaut, selon la config).

```bash
git reflog
# lignes d'exemple:
# abc1234 HEAD@{0}: rebase (finish): returning to refs/heads/feature/x
# def5678 HEAD@{1}: rebase (start): checkout origin/main
# 999aaaa HEAD@{2}: commit: wip
```

Trouvez le SHA d'**avant** le mauvais rebase (`HEAD@{n}`), puis:

```bash
git reset --hard HEAD@{2}
# ou
git reset --hard 999aaaa
```

Le reflog est **local**. Il ne vous sauve pas sur un autre clone. Il vous sauve sur la machine où vous avez réécrit l'historique, ce qui suffit souvent pour "j'ai squash le mauvais truc il y a cinq minutes."

### Récupérer un commit droppé encore dans la base d'objets

Si vous avez droppé un commit mais vous souvenez d'un fragment de message:

```bash
git fsck --lost-found
# ou chercher des commits dangling
git log --all --oneline --grep='partial message'

# une fois le SHA en main:
git show deadbeef
git branch rescue/deadbeef deadbeef
```

Puis cherry-pick ou reset sur cette branche de secours.

### Annuler un mauvais force push (coordination requise)

Si vous avez force-push une mauvaise tête et que quelqu'un a déjà fetch:

1. Récupérez le bon SHA dans votre reflog (ou le leur).
2. `git push --force-with-lease` du bon SHA.
3. Prévenez l'équipe: `git fetch` et `git reset --hard origin/votre-branche` uniquement sur cette feature branch.

C'est pour ça qu'un force-push sur une branche partagée est un problème de process, pas seulement de Git.

---

## Conventions d'équipe qui gardent le rebase utile

Quelques normes qui tiennent la route:

1. **Les branches feature sont un historique jetable.** Nettoyez-les. Le squash-on-merge est optionnel si le PR a déjà des commits propres.
2. **Ne réécrivez jamais `main`.** Protégez-le côté hébergeur.
3. **Force-with-lease seulement sur les branches que vous possédez.** Préfixez le handle dans le nom de branche si l'org est grande.
4. **Le CI doit relancer après force-push.** La plupart des hôtes le font; vérifiez.
5. **Préférez de petits commits fixup en codant, autosquash avant la review.** Flux local rapide, PR lisible.
6. **Si deux personnes co-possèdent une longue branche, mergez depuis `main` plutôt que tout le monde rebase,** ou nommez un propriétaire de l'historique.

---

## Aide-mémoire

```bash
# Rebase interactif des N derniers commits
git rebase -i HEAD~N

# Sur un main à jour
git fetch origin && git rebase -i origin/main

# Commits fixup en cours de route
git commit --fixup <sha-or-HEAD>

# Appliquer les fixups dans la liste todo
git rebase -i --autosquash origin/main

# Flux de conflit
git add <files> && git rebase --continue
git rebase --abort

# Après réécriture de votre feature branch
git push --force-with-lease

# Récupération
git reflog
git reset --hard ORIG_HEAD
git reset --hard HEAD@{n}
```

---

## Modèle mental de fin

Voyez le rebase interactif comme **l'édition d'une série de patches**, pas comme "effacer le passé." Les vieux commits restent souvent dans le reflog jusqu'au garbage collection. L'histoire partagée, c'est ce que vous push.

Utilisez-le pour rendre la review moins chère: moins de commits, messages honnêtes, histoire linéaire sur le `main` actuel. Arrêtez-vous dès que les commits sont un contrat partagé. Cette frontière, plus que n'importe quel verbe de la todo, sépare un historique propre d'un incident d'équipe.
