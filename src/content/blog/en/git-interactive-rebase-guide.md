---
title: "Git Interactive Rebase for Real Teams: Squash, Fixup, and Clean History"
description: "A practical guide to git rebase -i: squash, reword, fixup, reorder commits, when not to rebase shared branches, and how to recover with reflog when things go wrong."
date: "2026-07-04"
tags: [Productivity, DevOps]
coverImage: /assets/images/git-interactive-rebase-guide.webp
previewImage: /assets/images/git-interactive-rebase-guide.webp
---

Interactive rebase is the tool I reach for when a feature branch looks like a lab notebook: five "wip" commits, one typo fix on a typo fix, and a message I would never merge as-is. Used well, it turns that noise into a short story a reviewer can follow. Used on the wrong branch, it rewrites history other people already built on and lights up the group chat.

This is the playbook I use on real teams: the commands, the todo verbs that matter, when to stop, and how to get out when you botch it.

---

## What interactive rebase actually does

A normal rebase replays your commits on top of another base (often `main`). Interactive rebase does the same thing, but first it opens a **todo list** so you can change each commit before it is replayed.

```bash
# Rewrite the last 4 commits on the current branch
git rebase -i HEAD~4

# Replay your branch onto updated main, and edit along the way
git fetch origin
git rebase -i origin/main
```

Git opens your editor with lines like this (oldest at the top):

```
pick a1b2c3d add login form
pick d4e5f6a fix typo in label
pick 7890abc wip validation
pick bcdef01 tests for login
```

You edit the **verb** at the start of each line (and optionally reorder or delete lines). Save and quit. Git then replays commits in that new plan.

Two rules that prevent most disasters:

1. Only rewrite commits that are **not** on a shared remote branch other people pull from (or that you own alone).
2. Before a risky rebase, note a recovery point: `git rev-parse HEAD` or rely on `ORIG_HEAD` and `reflog` (covered below).

---

## The todo verbs you actually use

You do not need every verb on day one. These six cover almost all team work.

| Verb | Effect | When I use it |
| --- | --- | --- |
| `pick` | Keep the commit as-is | Default; leave alone |
| `reword` | Keep the diff, edit the message | Typos, "wip", missing ticket id |
| `edit` | Pause so you can amend or split | Forgot a file; want two commits instead of one |
| `squash` | Fold into previous commit; **edit combined message** | Several related WIP commits that should become one story |
| `fixup` | Fold into previous; **drop this message** | Tiny follow-ups: lint, missing import, test fix |
| `drop` (or delete the line) | Remove the commit | Experiment that should never ship |

There is also `exec` for running a command after a commit (handy for `npm test` after each step when you are cleaning a messy series). I use it rarely on day-to-day PR cleanup.

### Squash vs fixup

Both collapse a commit into the one above it. The difference is the message.

* **`squash`**: you will open an editor and craft the combined commit message. Use when the child commit had real intent you want in the final message.
* **`fixup`**: the child's message is discarded. Use when the child is pure repair noise ("fix tests", "oops").

Example todo list:

```
pick a1b2c3d add rate limiter middleware
fixup d4e5f6a fix off-by-one in window
fixup 7890abc missing unit test
reword bcdef01 document env vars
```

Result: two commits. The first has all three diffs and the original middleware message (unless you reword later). The second keeps its own tree but gets a cleaned-up message.

Shortcut when you already know you want fixup commits as you work:

```bash
# Stage a small fix that belongs in the previous commit
git commit --fixup HEAD

# Later, autosquash those fixup commits during rebase
git rebase -i --autosquash origin/main
```

`--autosquash` reorders `fixup! ...` and `squash! ...` commits under their targets and sets the right verb. You still confirm in the editor.

---

## Reword without changing code

Bad messages are the most common cleanup. You do not need to touch the diff.

```bash
git rebase -i HEAD~3
# change "pick" to "reword" on the lines you care about
```

Git stops at each `reword`, opens the message editor, then continues. Prefer this over `git commit --amend` when the bad message is **not** the tip commit.

If it *is* the tip and nothing has been pushed (or you are alone on the branch):

```bash
git commit --amend
# or only the message:
git commit --amend -m "feat(auth): validate session before refresh"
```

---

## Edit: amend mid-history or split a commit

`edit` pauses the rebase on that commit. Your working tree is at that snapshot. Common jobs:

**Forgot a file in an older commit**

```bash
git rebase -i HEAD~5
# mark the target commit as "edit"
# when Git stops:
git add path/to/missing-file
git commit --amend --no-edit
git rebase --continue
```

**Split one commit into two**

```bash
# when paused on "edit":
git reset HEAD^
git add -p   # stage the first logical change
git commit -m "first half"
git add -p
git commit -m "second half"
git rebase --continue
```

`git reset HEAD^` here is soft enough that the changes stay in the working tree/index area you can re-stage. You are not deleting work; you are re-cutting the commits.

---

## Reorder commits

Sometimes the story is out of order: tests before the code they test, or a refactor in the middle of a feature.

In the todo list, **move lines**. Oldest stays top; the order of lines is the new history order.

```
pick aaa1111 add API handler
pick bbb2222 add unit tests for handler
pick ccc3333 wire route in main
```

If a later commit depends on an earlier one, reordering can cause conflicts. That is fine. Resolve, `git add`, `git rebase --continue`. If the dependency is real, put the foundation commit first.

---

## A full cleanup pass (the usual PR ritual)

Before opening or updating a PR I often want:

1. Branch is based on current `main`.
2. WIP noise is gone.
3. Messages match the team style (ticket, scope, why).

```bash
git fetch origin
git rebase -i origin/main
```

Todo list sketch:

```
pick 111aaaa feat: add checkout retry
fixup 222bbbb wip
fixup 333cccc fix tests
reword 444dddd more logging
pick 555eeee docs: note retry env flag
```

Then:

```bash
# If this branch was already pushed, history changed:
git push --force-with-lease
```

Always prefer `--force-with-lease` over `--force`. Lease refuses the push if the remote moved since your last fetch (someone else pushed). That is a cheap seatbelt.

---

## When NOT to rebase

Interactive rebase rewrites commit SHAs. Anything that already depends on the old SHAs will disagree with you.

**Do not rebase:**

* **`main` / `master` / shared release branches** that many people pull. Full stop.
* **Any branch multiple people push to** unless the team has an explicit agreement and a freeze window.
* **Commits that already landed in other long-lived branches** via merge. You create duplicate commits or messy dual histories.
* **Public tags and release SHAs** that CI, deploy configs, or audit trails pin to.

**Prefer merge (or leave history alone) when:**

* The branch is a shared integration branch.
* Auditors care about the exact original commit chain.
* You are not confident you can coordinate a force-push with every collaborator.

**Safe default for feature work:** rebase *your own* feature branch onto `main`, clean locally, force-with-lease your feature remote, open/update the PR. Never rewrite `main`.

Some teams ban rebase entirely on remote branches and only allow squash-on-merge in GitHub/GitLab. That is a valid policy. Interactive rebase still helps *before* first push, or on branches only you use.

---

## Conflicts during rebase

A conflict is not a failure. Git stopped so you can decide.

```bash
# See which paths conflict
git status

# Fix files, then:
git add path/that/you/fixed
git rebase --continue

# Or abandon the whole rebase and go back:
git rebase --abort
```

If you are mid-rebase and need a clean tree to think:

```bash
git rebase --abort   # returns to pre-rebase state (when possible)
```

`--abort` is the escape hatch. Prefer it over half-resolved trees and "I will fix it later."

---

## Recovering from mistakes

### ORIG_HEAD

Many rebase operations set `ORIG_HEAD` to the tip before the operation.

```bash
# Inspect where you were
git log --oneline ORIG_HEAD -5

# Hard reset branch tip back (destructive to current tip only)
git reset --hard ORIG_HEAD
```

Only do a hard reset if you understand you are discarding the rewritten tip in favor of the pre-rebase tip. Uncommitted work is a separate problem; commit or stash first.

### Reflog is the real safety net

Every tip move is recorded locally for a while (default often ~90 days, config-dependent).

```bash
git reflog
# example lines:
# abc1234 HEAD@{0}: rebase (finish): returning to refs/heads/feature/x
# def5678 HEAD@{1}: rebase (start): checkout origin/main
# 999aaaa HEAD@{2}: commit: wip
```

Find the SHA from **before** the bad rebase (`HEAD@{n}`), then:

```bash
git reset --hard HEAD@{2}
# or
git reset --hard 999aaaa
```

Reflog is **local**. It does not save you on another clone. It does save you on the machine where you rewrote history, which is usually enough for "I squashed the wrong thing five minutes ago."

### Recover a dropped commit still in the object database

If you dropped a commit but remember a message fragment:

```bash
git fsck --lost-found
# or search dangling commits
git log --all --oneline --grep='partial message'

# once you have the SHA:
git show deadbeef
git branch rescue/deadbeef deadbeef
```

Then cherry-pick or reset onto that rescue branch as needed.

### Undo a bad force push (coordination required)

If you force-pushed a broken tip and someone else already fetched:

1. Recover the good SHA from your reflog (or theirs).
2. `git push --force-with-lease` the good SHA back.
3. Tell the team: `git fetch` and `git reset --hard origin/your-branch` on that feature branch only.

This is why force-pushing shared branches is a process problem, not just a Git problem.

---

## Team conventions that keep rebase useful

A few norms I have seen work:

1. **Feature branches are disposable history.** Clean them. Squash on merge is optional if the PR already has clean commits.
2. **Never rewrite `main`.** Protect it in the host settings.
3. **Force-with-lease only on branches you own.** Name branches with your handle if the org is large.
4. **CI must re-run after force-push.** Most hosts do; verify.
5. **Prefer small fixup commits while coding, autosquash before review.** Keeps local flow fast and the PR readable.
6. **If two people co-own a long branch, merge from `main` instead of everyone rebasing,** or assign one person as history owner.

---

## Quick reference

```bash
# Start interactive rebase for last N commits
git rebase -i HEAD~N

# Onto updated main
git fetch origin && git rebase -i origin/main

# Create fixup commits as you go
git commit --fixup <sha-or-HEAD>

# Apply fixups automatically in the todo list
git rebase -i --autosquash origin/main

# Conflict flow
git add <files> && git rebase --continue
git rebase --abort

# After rewrite of your feature branch
git push --force-with-lease

# Recovery
git reflog
git reset --hard ORIG_HEAD
git reset --hard HEAD@{n}
```

---

## Closing mental model

Think of interactive rebase as **editing a patch series**, not as "deleting the past." The old commits often still exist in reflog until garbage collection. The shared story is what you push.

Use it to make review cheaper: fewer commits, honest messages, linear story on top of current `main`. Stop using it the moment the commits are a shared contract. That boundary, more than any verb in the todo list, is what separates a clean history from a team incident.
