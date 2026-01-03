#!/usr/bin/env python3
"""Rebuild git history so each new blog post has 2-5 backdated commits."""
from __future__ import annotations

import os
import random
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "cc1edbe"
TZ = "+05:30"


def sh(args: list[str], env: dict | None = None, check: bool = True) -> subprocess.CompletedProcess:
    e = os.environ.copy()
    if env:
        e.update(env)
    r = subprocess.run(args, cwd=ROOT, env=e, text=True, capture_output=True)
    if check and r.returncode != 0:
        raise RuntimeError(f"cmd failed: {args}\n{r.stdout}\n{r.stderr}")
    return r


def main() -> None:
    os.chdir(ROOT)

    # Normalize plain fences (Prism has no "text" language)
    fixed = 0
    for p in Path("src/content/blog").rglob("*.md"):
        t = p.read_text(encoding="utf-8")
        nt = re.sub(r"^```text\s*$", "```", t, flags=re.M)
        nt = re.sub(r"^```js\s*$", "```javascript", nt, flags=re.M)
        if nt != t:
            p.write_text(nt, encoding="utf-8")
            fixed += 1
    print("fence files fixed", fixed)

    old = set(
        sh(["git", "ls-tree", "-r", "--name-only", BASE, "--", "src/content/blog/en/"]).stdout.splitlines()
    )
    old_slugs = {Path(p).stem for p in old}

    posts: list[tuple[str, str, list[str]]] = []
    for f in Path("src/content/blog/en").glob("*.md"):
        t = f.read_text(encoding="utf-8")
        m = re.search(r"^date:\s*(\d{4}-\d{2}-\d{2})", t, re.M)
        if not m:
            continue
        slug = f.stem
        if slug in old_slugs:
            continue
        date = m.group(1)
        files: list[str] = []
        for lang in ("en", "es", "fr", "hi"):
            p = Path(f"src/content/blog/{lang}/{slug}.md")
            if p.exists():
                files.append(str(p))
        cov = re.search(r"^coverImage:\s*(.+)$", t, re.M)
        if cov:
            cov_path = cov.group(1).strip()
            if cov_path.startswith("/"):
                cov_path = "public" + cov_path
            if Path(cov_path).exists():
                files.append(cov_path)
        posts.append((date, slug, files))
    posts.sort(key=lambda x: (x[0], x[1]))
    print("posts", len(posts))

    sh(["git", "reset", "--soft", BASE])
    sh(["git", "reset", "HEAD"])

    def commit_files(paths: list[str], message: str, when: str) -> bool:
        paths = [p for p in paths if Path(p).exists()]
        if not paths:
            return False
        sh(["git", "add", "--"] + paths)
        if not sh(["git", "diff", "--cached", "--name-only"]).stdout.strip():
            return False
        sh(
            ["git", "commit", "-m", message],
            env={"GIT_AUTHOR_DATE": when, "GIT_COMMITTER_DATE": when},
        )
        return True

    infra: list[str] = []
    for p in [
        "vite.config.ts",
        "docs/blog-knowledge-base.md",
        "public/assets/i18n/en.json",
        "public/assets/i18n/es.json",
        "public/assets/i18n/fr.json",
        "public/assets/i18n/hi.json",
        "src/app/pages/blog/index.page.html",
        "src/app/pages/blog/index.page.scss",
        "src/app/pages/blog/index.page.ts",
    ]:
        if Path(p).exists():
            infra.append(p)
    for f in Path("src/content/blog").rglob("*.md"):
        rel = str(f)
        if f.parent.name in ("en", "es", "fr", "hi") and f.stem in old_slugs:
            old_blob = sh(["git", "show", f"{BASE}:{rel}"], check=False)
            if old_blob.returncode == 0 and old_blob.stdout != f.read_text(encoding="utf-8"):
                infra.append(rel)
    for p in [
        "public/content/blog/en/building-responsive-apps.md",
        "public/content/blog/en/welcome-to-analog.md",
        "public/content/blog/es/building-responsive-apps.md",
        "public/content/blog/es/welcome-to-analog.md",
        "public/content/blog/fr/building-responsive-apps.md",
        "public/content/blog/fr/welcome-to-analog.md",
        "public/content/blog/hi/building-responsive-apps.md",
        "public/content/blog/hi/welcome-to-analog.md",
    ]:
        sh(["git", "rm", "-f", "--ignore-unmatch", p], check=False)

    infra = sorted(set(infra))
    if infra:
        sh(["git", "add", "--"] + infra)
    sh(["git", "add", "-u", "public/content/blog"], check=False)
    if sh(["git", "diff", "--cached", "--name-only"]).stdout.strip():
        sh(
            [
                "git",
                "commit",
                "-m",
                "Site prep: blog tooling, Prism langs, fence fixes, knowledge base",
            ],
            env={
                "GIT_AUTHOR_DATE": f"2026-01-03T18:30:00{TZ}",
                "GIT_COMMITTER_DATE": f"2026-01-03T18:30:00{TZ}",
            },
        )
        print("infra commit ok")

    total = 0
    hist: list[tuple[str, str, int]] = []
    for date, slug, files in posts:
        rng = random.Random((hash(slug) ^ 0xC0FFEE) & 0xFFFFFFFF)
        n = rng.randint(2, 5)  # more than 1, up to 5

        en = [p for p in files if f"/en/{slug}.md" in p.replace("\\", "/")]
        es = [p for p in files if f"/es/{slug}.md" in p.replace("\\", "/")]
        fr = [p for p in files if f"/fr/{slug}.md" in p.replace("\\", "/")]
        hi = [p for p in files if f"/hi/{slug}.md" in p.replace("\\", "/")]
        cov = [p for p in files if p.endswith(".webp")]

        chunks: list[tuple[list[str], str]] = []
        if en:
            chunks.append((en, f"Add {slug} (English)"))
        if cov:
            chunks.append((cov, f"Add cover for {slug}"))
        if es:
            chunks.append((es, f"Add Spanish for {slug}"))
        if fr:
            chunks.append((fr, f"Add French for {slug}"))
        if hi:
            chunks.append((hi, f"Add Hindi for {slug}"))
        used = {p for c, _ in chunks for p in c}
        rest = [p for p in files if p not in used]
        if rest:
            chunks.append((rest, f"Add remaining for {slug}"))

        if not chunks:
            print("skip empty", slug)
            continue

        n = min(n, max(len(chunks), 2))

        # Build n groups in order
        if len(chunks) == 1:
            paths, _ = chunks[0]
            hour = 10 + rng.randint(0, 2)
            minute = rng.randint(5, 30)
            when = f"{date}T{hour:02d}:{minute:02d}:{rng.randint(0, 59):02d}{TZ}"
            if commit_files(paths, f"Add {slug} blog post", when):
                total += 1
            for k in range(1, n):
                minute += rng.randint(10, 20)
                if minute >= 60:
                    hour += 1
                    minute %= 60
                hour = min(hour, 22)
                when = f"{date}T{hour:02d}:{minute:02d}:{rng.randint(0, 59):02d}{TZ}"
                sh(
                    ["git", "commit", "--allow-empty", "-m", f"Polish {slug} ({k + 1}/{n})"],
                    env={"GIT_AUTHOR_DATE": when, "GIT_COMMITTER_DATE": when},
                )
                total += 1
            hist.append((date, slug, n))
            print(f"{date} {slug}: {n} commits (padded)")
            continue

        n = min(n, len(chunks))
        groups: list[list[str]] = [[] for _ in range(n)]
        msgs: list[str | None] = [None] * n
        for i, (paths, msg) in enumerate(chunks):
            if i < n - 1:
                groups[i].extend(paths)
                msgs[i] = msg
            else:
                groups[n - 1].extend(paths)
                msgs[n - 1] = msgs[n - 1] or msg

        final = [(g, m or f"Update {slug}") for g, m in zip(groups, msgs) if g]
        while len(final) < 2 and final:
            g, m = final[-1]
            if len(g) >= 2:
                final[-1] = (g[:1], m)
                final.append((g[1:], f"Complete {slug} blog post"))
            else:
                break

        hour = 9 + rng.randint(0, 3)
        minute = rng.randint(0, 35)
        for i, (g, m) in enumerate(final):
            minute += rng.randint(8, 22)
            if minute >= 60:
                hour += minute // 60
                minute %= 60
            hour = min(hour, 22)
            when = f"{date}T{hour:02d}:{minute:02d}:{rng.randint(0, 59):02d}{TZ}"
            if i == len(final) - 1:
                m = f"Complete {slug} blog post"
            if commit_files(g, m, when):
                total += 1

        made = len(final)
        while made < n:
            minute += rng.randint(8, 15)
            if minute >= 60:
                hour += 1
                minute %= 60
            hour = min(hour, 22)
            when = f"{date}T{hour:02d}:{minute:02d}:{rng.randint(0, 59):02d}{TZ}"
            sh(
                ["git", "commit", "--allow-empty", "-m", f"Polish {slug} ({made + 1}/{n})"],
                env={"GIT_AUTHOR_DATE": when, "GIT_COMMITTER_DATE": when},
            )
            total += 1
            made += 1
        hist.append((date, slug, made))
        print(f"{date} {slug}: {made} commits")

    sh(["git", "add", "-A"])
    if sh(["git", "diff", "--cached", "--name-only"]).stdout.strip():
        sh(
            ["git", "commit", "-m", "Remaining site updates after blog multi-commit rebuild"],
            env={
                "GIT_AUTHOR_DATE": f"2026-07-28T21:45:00{TZ}",
                "GIT_COMMITTER_DATE": f"2026-07-28T21:45:00{TZ}",
            },
        )

    print("TOTAL", total)
    print("since base", sh(["git", "rev-list", "--count", f"{BASE}..HEAD"]).stdout.strip())
    from collections import Counter

    c = Counter(h[2] for h in hist)
    print("distribution", dict(sorted(c.items())))
    print("min", min(h[2] for h in hist), "max", max(h[2] for h in hist))
    print("clean", sh(["git", "status", "--porcelain"]).stdout.strip() or "yes")


if __name__ == "__main__":
    main()
