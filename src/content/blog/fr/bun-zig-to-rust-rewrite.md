---
title: "Bun a réécrit 535 000 lignes de Zig vers Rust en 11 jours avec 64 agents Claude"
description: "Soutenu par Anthropic, Bun a migré l'intégralité de son code de Zig vers Rust grâce à 64 agents IA en parallèle, corrigeant 128 bugs et réduisant les binaires de 20%, mais le mouvement a déclenché une dispute publique avec le créateur de Zig."
date: "2026-08-13"
tags: [IA et Machine Learning, Backend et Bases de Données]
coverImage: /assets/images/bun-zig-to-rust-rewrite.webp
previewImage: /assets/images/bun-zig-to-rust-rewrite.webp
---

> **TL;DR**
> * **Le problème :** Le code Zig de Bun souffrait de bugs mémoire chroniques dus au mélange d'allocateurs manuels avec le ramasse-miettes de JavaScriptCore. Les politiques anti-IA de Zig et son instabilité pré-1.0 empêchaient toute maintenance automatisée après l'acquisition par Anthropic.
> * **L'approche :** Plutôt qu'une migration humaine de plusieurs années, Bun a déployé 64 agents Claude en parallèle avec des réviseurs contradictoires pour porter 535 000 lignes dans 1 448 fichiers en 11 jours.
> * **Le résultat :** 128 bugs historiques corrigés, binaires 20% plus petits, fuite mémoire du serveur de développement éliminée. Coût de calcul estimé : 165 000 dollars. Le créateur de Zig, Andrew Kelley, a publiquement qualifié les benchmarks de trompeurs.

En 2000, Joel Spolsky publiait l'un des essais les plus cités en ingénierie logicielle, affirmant que réécrire un logiciel de production depuis zéro est la pire erreur stratégique qu'une entreprise puisse commettre. Il citait Netscape, qui avait passé trois ans à reconstruire son navigateur pendant que Microsoft dévorait ses parts de marché.

Pendant 26 ans, cette règle n'a pratiquement pas été contestée. En mai 2026, Bun l'a brisée.

---

## Pourquoi Bun était bloqué

Bun intègre le moteur JavaScriptCore (JSC) d'Apple plutôt que le V8 de Google. JSC utilise un ramasse-miettes précis pour gérer les objets JavaScript. Le problème : le code natif du runtime de Bun était écrit en Zig, un langage où la mémoire est gérée manuellement.

La moitié des objets de Bun résidait dans le tas géré par le ramasse-miettes de JSC. L'autre moitié résidait dans des tampons mémoire Zig avec des allocateurs manuels. Les deux moitiés maintenaient des pointeurs bruts l'une vers l'autre, et garder ces pointeurs synchronisés exigeait une discipline rigoureuse que le code ne respectait pas assez souvent.

Les changelogs de Bun regorgeaient de bugs issus de ce décalage : du code lisant de la mémoire déjà libérée, libérant la même mémoire deux fois, ou ne la libérant jamais. Le serveur de développement fuyait 3 Mo à chaque rechargement à chaud parce qu'un seul chemin d'erreur dans le bundler oubliait de nettoyer après lui. Ce n'étaient pas des cas limites exotiques. C'étaient les conséquences structurelles du mélange de deux modèles de gestion mémoire incompatibles dans un codebase d'un million de lignes.

Après l'acquisition de Bun par Anthropic fin 2025, un second problème est apparu. La majorité du développement futur allait être rédigé par Claude. Or Zig est hostile au code généré par IA : le projet refuse les pull requests produites par LLM et ferme les rapports de sécurité si l'IA a trouvé le bug. De surcroît, Zig n'a pas atteint la version 1.0, continue d'introduire des ruptures de compatibilité, et ne représente qu'une fraction infime des dépôts de code publics, si bien que les modèles produisent du Zig médiocre comparé à des langages plus établis.

Rust résolvait les deux problèmes. Son borrow checker déplace la gestion mémoire dans le système de types, transformant la plupart des erreurs de pointeurs en erreurs de compilation plutôt qu'en crashes à l'exécution. Et des modèles comme Claude produisent du Rust idiomatique de haute qualité grâce à des décennies de code open source.

---

## Comment ils ont procédé

Jared Sumner, fondateur de Bun, a décidé début mai de porter les 535 000 lignes de Zig vers Rust. La migration n'a pas été réalisée par une équipe de programmeurs systèmes humains. Elle a été effectuée par 64 agents Claude fonctionnant en parallèle.

Le processus s'est déroulé en trois phases :

**Phase 1 : Cartographie du code.** Claude a passé des heures à étudier le code source de Bun pour produire un guide de portage. Un workflow séparé a retracé la durée de vie de chaque champ de structure dans un tableur, documentant des années de savoir tribal sur la propriété mémoire et les moments de libération.

**Phase 2 : Traduction parallèle.** 64 agents Claude ont travaillé sur quatre Git worktrees, convertissant simultanément des sous-systèmes indépendants : le parseur HTTP, le moteur de bundling, la couche WebSocket, le gestionnaire de paquets. Au pic de débit, l'essaim produisait 1 300 lignes de Rust par minute.

**Phase 3 : Revue contradictoire.** Chaque agent implémenteur était associé à deux agents réviseurs fonctionnant dans des contextes isolés. Le seul travail des réviseurs : partir du principe que le code était faux et découvrir pourquoi. Les pull requests étaient bloquées tant que les deux réviseurs n'avaient pas validé les changements.

Onze jours, 6 052 commits et environ 165 000 dollars de calcul plus tard, l'intégralité de la suite de tests de Bun passait sur chaque plateforme.

---

## Les chiffres

| Métrique | Zig (Bun v1.1) | Rust (Bun v1.2) | Variation |
|---|---|---|---|
| Lignes de code système | 535 000 | 498 000 | -6,9% |
| Taille du binaire de release | 92,4 Mo | 73,9 Mo | -20% |
| Fuite mémoire du dev server | 3,2 Mo par rebuild | 0,0 Mo | Éliminée |
| Bugs historiques corrigés | Base | 128 fermés | Corrigés lors du portage |
| Débit HTTP hello world | 142 000 req/s | 145 200 req/s | +2,2% |
| Temps de compilation complète | 42 secondes | 3 min 18 sec | ~4,7x plus lent |

Selon l'annonce de Bun, le portage Rust fait tourner Claude Code depuis juin sans que personne ne s'en soit aperçu.

---

## La réponse d'Andrew Kelley

Tout le monde n'a pas célébré. Andrew Kelley, le créateur de Zig, a publié une réponse qui montrait clairement que ce divorce se préparait depuis des années.

Kelley a expliqué que l'équipe Zig avait passé des années à regarder Bun embarrasser leur langage avec un code qu'ils utilisaient en interne comme l'exemple type de ce qu'il ne faut pas faire en Zig. Il a accusé Jared Sumner de "produire du code bâclé bien avant l'existence des LLM", souligné que Sumner avait quitté l'université à 18 ans pour prendre l'argent de Peter Thiel, et relayé des témoignages indirects selon lesquels Sumner n'était pas un manager exemplaire.

Sous les attaques personnelles se trouvaient des objections techniques légitimes :

1. **Les gains de performance sont surestimés.** Kelley soutient que les améliorations de vitesse proviennent principalement de l'activation du Link-Time Optimization (LTO), que Zig supporte depuis toujours. Les builds Zig de Bun ne l'avaient jamais activé.

2. **La réduction de taille du binaire n'est pas un mérite de Rust.** La réduction de 20% provient du LTO et de l'élimination de code mort, non de propriétés propres à Rust.

3. **Les temps de compilation ont considérablement empiré.** La compilation complète de Bun est passée de 42 secondes à plus de 3 minutes. Kelley note que l'annonce de Bun a commodément omis toute mention des temps de compilation, une métrique où Zig l'emporte nettement.

4. **L'équipe Zig est "soulagée."** Kelley a déclaré qu'avoir Bun comme utilisateur le plus visible de Zig était un handicap, car le code donnait aux observateurs extérieurs une image déformée de ce qu'est du bon Zig.

---

## Qui remporte l'opinion publique

Probablement personne. Zig a perdu son utilisateur le plus célèbre. Kelley a perdu son sang-froid avec des attaques personnelles qui ont éclipsé ses points techniques valides. Et Sumner s'est vu publiquement diagnostiquer une "énergie de débutant" par un ingénieur compilateur.

La réécriture elle-même est pourtant difficile à contester sur le plan pratique. 128 bugs corrigés, une fuite mémoire chronique éliminée, des binaires 20% plus petits, et un codebase que des agents IA peuvent désormais maintenir de façon autonome. La régression des temps de compilation est réelle et significative pour le développement local, mais pour un projet dont la main-d'oeuvre future se compose principalement d'agents Claude tournant en CI, ce compromis peut être acceptable.

La vraie question est ce que cela signifie pour les réécritures pilotées par l'IA en général. Bun bénéficiait d'avantages inhabituels : Anthropic possédait à la fois l'IA et le projet, éliminant toute préoccupation de coût de calcul. Le codebase disposait d'une suite de tests complète. Et le langage cible (Rust) est un de ceux où les modèles performent bien. La plupart des équipes qui tenteraient la même chose sans ces avantages auraient la tâche bien plus ardue.

---

## Références

* [The most controversial rewrite in history just shipped, Fireship / The Code Report](https://www.youtube.com/watch?v=CXSvKcLovAk)
* [Things You Should Never Do, Part I, Joel Spolsky (2000)](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/)
* [Bun Official Documentation](https://bun.sh/docs)
* [The Zig Programming Language](https://ziglang.org/documentation/master/)
