---
title: "Rebase interactivo de Git para equipos reales: squash, fixup e historial limpio"
description: "Guía práctica de git rebase -i: squash, reword, fixup, reordenar commits, cuándo no reescribir ramas compartidas y cómo recuperarte con reflog si algo sale mal."
date: "2026-07-04"
tags: [Herramientas de Desarrollo]
coverImage: /assets/images/git-interactive-rebase-guide.webp
previewImage: /assets/images/git-interactive-rebase-guide.webp
---

El rebase interactivo es la herramienta a la que llego cuando una rama de feature parece un cuaderno de laboratorio: cinco commits "wip", un arreglo de un typo sobre otro typo, y un mensaje que jamás fusionaría tal cual. Bien usado, convierte ese ruido en una historia corta que un revisor puede seguir. Usado en la rama equivocada, reescribe historial sobre el que otra gente ya construyó y enciende el chat del equipo.

Esta es la guía que uso en equipos reales: los comandos, los verbos del todo que importan, cuándo parar y cómo salir cuando la cagas.

---

## Qué hace de verdad el rebase interactivo

Un rebase normal vuelve a aplicar tus commits encima de otra base (a menudo `main`). El interactivo hace lo mismo, pero primero abre una **lista todo** para que puedas cambiar cada commit antes de reaplicarlo.

```bash
# Reescribir los últimos 4 commits de la rama actual
git rebase -i HEAD~4

# Reaplicar tu rama sobre main actualizado, editando por el camino
git fetch origin
git rebase -i origin/main
```

Git abre el editor con líneas así (el más antiguo arriba):

```
pick a1b2c3d add login form
pick d4e5f6a fix typo in label
pick 7890abc wip validation
pick bcdef01 tests for login
```

Editas el **verbo** al inicio de cada línea (y opcionalmente reordenas o borras líneas). Guardas y sales. Git reaplica los commits según ese plan nuevo.

Dos reglas que evitan la mayoría de desastres:

1. Solo reescribe commits que **no** están en una rama remota compartida de la que otros hacen pull (o que solo usas tú).
2. Antes de un rebase arriesgado, anota un punto de recuperación: `git rev-parse HEAD` o confía en `ORIG_HEAD` y `reflog` (abajo).

---

## Los verbos del todo que de verdad usas

No necesitas todos el primer día. Estos seis cubren casi todo el trabajo en equipo.

| Verbo | Efecto | Cuándo lo uso |
| --- | --- | --- |
| `pick` | Deja el commit igual | Por defecto; no lo toques |
| `reword` | Mantiene el diff, edita el mensaje | Typos, "wip", falta el id del ticket |
| `edit` | Pausa para amend o partir el commit | Olvidaste un archivo; quieres dos commits en vez de uno |
| `squash` | Lo funde con el anterior; **editas el mensaje combinado** | Varios WIP relacionados que deben ser una sola historia |
| `fixup` | Lo funde con el anterior; **tira este mensaje** | Arreglos minúsculos: lint, import, test |
| `drop` (o borrar la línea) | Elimina el commit | Experimento que no debe llegar a main |

También existe `exec` para ejecutar un comando tras un commit (útil con `npm test` en cada paso cuando limpias una serie sucia). Lo uso poco en el día a día de un PR.

### Squash frente a fixup

Ambos pliegan un commit en el de arriba. La diferencia es el mensaje.

* **`squash`**: se abre el editor para redactar el mensaje combinado. Úsalo cuando el commit hijo tenía intención real que quieres en el mensaje final.
* **`fixup`**: el mensaje del hijo se descarta. Úsalo cuando es puro ruido de reparación ("fix tests", "oops").

Lista todo de ejemplo:

```
pick a1b2c3d add rate limiter middleware
fixup d4e5f6a fix off-by-one in window
fixup 7890abc missing unit test
reword bcdef01 document env vars
```

Resultado: dos commits. El primero tiene los tres diffs y el mensaje del middleware (salvo que lo reword después). El segundo mantiene su árbol pero con mensaje limpio.

Atajo cuando ya sabes que quieres commits fixup mientras trabajas:

```bash
# Prepara un arreglo pequeño que pertenece al commit anterior
git commit --fixup HEAD

# Luego, autosquash de esos fixup en el rebase
git rebase -i --autosquash origin/main
```

`--autosquash` reordena los commits `fixup! ...` y `squash! ...` bajo sus objetivos y pone el verbo correcto. Sigues confirmando en el editor.

---

## Reword sin tocar el código

Los mensajes malos son la limpieza más habitual. No hace falta tocar el diff.

```bash
git rebase -i HEAD~3
# cambia "pick" por "reword" en las líneas que te importan
```

Git se detiene en cada `reword`, abre el editor del mensaje y sigue. Prefiere esto a `git commit --amend` cuando el mensaje malo **no** es el commit de la punta.

Si *sí* es la punta y no se ha pusheado (o la rama es solo tuya):

```bash
git commit --amend
# o solo el mensaje:
git commit --amend -m "feat(auth): validate session before refresh"
```

---

## Edit: amend a mitad de historial o partir un commit

`edit` pausa el rebase en ese commit. El working tree queda en ese snapshot. Tareas habituales:

**Olvidaste un archivo en un commit viejo**

```bash
git rebase -i HEAD~5
# marca el commit objetivo como "edit"
# cuando Git para:
git add path/to/missing-file
git commit --amend --no-edit
git rebase --continue
```

**Partir un commit en dos**

```bash
# en la pausa de "edit":
git reset HEAD^
git add -p   # primera mitad lógica
git commit -m "first half"
git add -p
git commit -m "second half"
git rebase --continue
```

`git reset HEAD^` deja los cambios en el árbol para que los vuelvas a stagear. No estás borrando trabajo; estás recortando los commits de otra forma.

---

## Reordenar commits

A veces la historia va al revés: tests antes del código que prueban, o un refactor en medio de la feature.

En la lista todo, **mueve líneas**. Lo más antiguo sigue arriba; el orden de las líneas es el nuevo historial.

```
pick aaa1111 add API handler
pick bbb2222 add unit tests for handler
pick ccc3333 wire route in main
```

Si un commit posterior depende de uno anterior, reordenar puede traer conflictos. Está bien. Resuelves, `git add`, `git rebase --continue`. Si la dependencia es real, pon primero el commit base.

---

## Una pasada de limpieza completa (el ritual habitual del PR)

Antes de abrir o actualizar un PR suelo querer:

1. La rama basada en el `main` actual.
2. Sin ruido WIP.
3. Mensajes al estilo del equipo (ticket, alcance, por qué).

```bash
git fetch origin
git rebase -i origin/main
```

Boceto de lista todo:

```
pick 111aaaa feat: add checkout retry
fixup 222bbbb wip
fixup 333cccc fix tests
reword 444dddd more logging
pick 555eeee docs: note retry env flag
```

Luego:

```bash
# Si la rama ya estaba en el remoto, el historial cambió:
git push --force-with-lease
```

Siempre prefiere `--force-with-lease` a `--force`. Lease rechaza el push si el remoto se movió desde tu último fetch (alguien más pusheó). Cinturón barato.

---

## Cuándo NO hacer rebase

El rebase interactivo reescribe los SHA. Cualquier cosa que ya dependa de los SHA viejos va a chocar contigo.

**No hagas rebase de:**

* **`main` / `master` / ramas de release compartidas** de las que mucha gente hace pull. Punto.
* **Cualquier rama a la que empujen varias personas**, salvo acuerdo explícito y una ventana de freeze.
* **Commits que ya entraron en otras ramas de larga vida** vía merge. Generas duplicados o historial doble sucio.
* **Tags públicos y SHA de release** que CI, deploys o auditoría fijan.

**Prefiere merge (o deja el historial) cuando:**

* La rama es de integración compartida.
* Auditoría cuida la cadena original exacta de commits.
* No confías en coordinar un force-push con cada colaborador.

**Por defecto seguro en features:** rebase *tu* rama de feature sobre `main`, limpia en local, force-with-lease a tu remoto de feature, abre o actualiza el PR. Nunca reescribas `main`.

Algunos equipos prohíben rebase en ramas remotas y solo permiten squash-on-merge en GitHub/GitLab. Es una política válida. El rebase interactivo sigue sirviendo *antes* del primer push, o en ramas solo tuyas.

---

## Conflictos durante el rebase

Un conflicto no es un fallo. Git paró para que decidas.

```bash
# Ver qué rutas conflictúan
git status

# Arregla archivos, luego:
git add path/that/you/fixed
git rebase --continue

# O abandona todo el rebase y vuelve:
git rebase --abort
```

Si estás a medias y necesitas un árbol limpio para pensar:

```bash
git rebase --abort   # vuelve al estado previo al rebase (cuando es posible)
```

`--abort` es la salida de emergencia. Mejor que un árbol a medias y "ya lo arreglo luego."

---

## Recuperarte de errores

### ORIG_HEAD

Muchas operaciones de rebase ponen `ORIG_HEAD` en la punta anterior a la operación.

```bash
# Ver dónde estabas
git log --oneline ORIG_HEAD -5

# Hard reset de la punta de la rama (destructivo solo para la punta actual)
git reset --hard ORIG_HEAD
```

Solo haz hard reset si entiendes que descartas la punta reescrita a favor de la pre-rebase. El trabajo sin commit es otro tema; haz commit o stash antes.

### Reflog es la red real

Cada movimiento de la punta se registra en local un tiempo (a menudo ~90 días por defecto, según config).

```bash
git reflog
# líneas de ejemplo:
# abc1234 HEAD@{0}: rebase (finish): returning to refs/heads/feature/x
# def5678 HEAD@{1}: rebase (start): checkout origin/main
# 999aaaa HEAD@{2}: commit: wip
```

Busca el SHA de **antes** del mal rebase (`HEAD@{n}`), luego:

```bash
git reset --hard HEAD@{2}
# o
git reset --hard 999aaaa
```

El reflog es **local**. No te salva en otro clone. Sí te salva en la máquina donde reescribiste el historial, que suele bastar para "aplasté lo equivocado hace cinco minutos."

### Recuperar un commit droppeado que sigue en la base de objetos

Si droppeaste un commit pero recuerdas un fragmento del mensaje:

```bash
git fsck --lost-found
# o buscar commits colgantes
git log --all --oneline --grep='partial message'

# cuando tengas el SHA:
git show deadbeef
git branch rescue/deadbeef deadbeef
```

Luego cherry-pick o reset sobre esa rama de rescate.

### Deshacer un force push malo (hace falta coordinación)

Si hiciste force-push de una punta rota y alguien ya hizo fetch:

1. Recupera el buen SHA de tu reflog (o del de ellos).
2. `git push --force-with-lease` del buen SHA.
3. Avisa al equipo: `git fetch` y `git reset --hard origin/tu-rama` solo en esa feature branch.

Por eso force-pushear ramas compartidas es un problema de proceso, no solo de Git.

---

## Convenciones de equipo que mantienen útil el rebase

Normas que he visto funcionar:

1. **Las feature branches son historial desechable.** Límpialas. Squash-on-merge es opcional si el PR ya trae commits limpios.
2. **Nunca reescribas `main`.** Protégelo en el hosting.
3. **Force-with-lease solo en ramas que posees.** Nombra ramas con tu handle si la org es grande.
4. **CI debe volver a correr tras force-push.** La mayoría de hosts lo hacen; compruébalo.
5. **Prefiere commits fixup pequeños mientras codes y autosquash antes del review.** Flujo local rápido y PR legible.
6. **Si dos personas co-poseen una rama larga, merge desde `main` en vez de que todos hagan rebase,** o asigna un dueño del historial.

---

## Referencia rápida

```bash
# Rebase interactivo de los últimos N commits
git rebase -i HEAD~N

# Sobre main actualizado
git fetch origin && git rebase -i origin/main

# Commits fixup mientras trabajas
git commit --fixup <sha-or-HEAD>

# Aplicar fixups en la lista todo
git rebase -i --autosquash origin/main

# Flujo de conflicto
git add <files> && git rebase --continue
git rebase --abort

# Tras reescribir tu feature branch
git push --force-with-lease

# Recuperación
git reflog
git reset --hard ORIG_HEAD
git reset --hard HEAD@{n}
```

---

## Modelo mental de cierre

Piensa el rebase interactivo como **editar una serie de parches**, no como "borrar el pasado." Los commits viejos suelen seguir en el reflog hasta el garbage collection. La historia compartida es lo que pusheas.

Úsalo para abaratar la review: menos commits, mensajes honestos, historia lineal sobre el `main` actual. Déjalo en el momento en que los commits son un contrato compartido. Ese límite, más que cualquier verbo del todo, es lo que separa un historial limpio de un incidente de equipo.
