#!/usr/bin/env python3
"""
1) Reassign frontmatter dates:
   - News posts: live blog dates (when they occurred)
   - Other relevant posts: recent free days (newest first)
   - CTCI + design: randomly mixed across remaining calendar days
2) Rebuild git history from BASE so each post has 2-5 backdated commits
   whose author/committer dates match the post frontmatter date.
"""
from __future__ import annotations

import os
import random
import re
import subprocess
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "cc1edbe"
TZ = "+05:30"
TODAY = date(2026, 8, 6)
LANGS = ("en", "es", "fr", "hi")
DATE_RE = re.compile(r"^date:\s*[\"']?[^\"'\n]+[\"']?\s*$", re.M)

# Live blog listing dates for important news
NEWS = {
    "openai-bubble-bigger-than-dotcom": date(2026, 7, 29),
    "microsoft-mai-cyber-1-flash-perception": date(2026, 7, 28),
    "nvidia-750b-circular-finance": date(2026, 7, 27),
    "openai-agent-hacks-huggingface": date(2026, 7, 25),
    "apple-vs-openai-future-of-ai": date(2026, 7, 23),
    "gemini-3-6-flash-release": date(2026, 7, 21),
    "grok-4-5-india-value": date(2026, 7, 20),
    "kimi-k3-benchmarks": date(2026, 7, 19),
    "ram-prices-bubble": date(2026, 7, 18),
    "gemma-llm-on-android": date(2026, 7, 17),
    "nom-ai-showcase": date(2026, 7, 10),
    "zunify-music-player": date(2026, 7, 9),
    "spacex-ipo-disaster": date(2026, 6, 13),
}

# Relevant engineering posts: pack into recent free days (newest first)
RELEVANT_ORDER = [
    "mcp-ai-tools-explained",
    "ai-coding-agents-workflow",
    "lora-finetuning-guide",
    "practical-rag-pipeline",
    "transformers-explained-engineers",
    "vector-embeddings-explained",
    "prompt-engineering-that-works",
    "java-virtual-threads",
    "fastapi-rest-apis-guide",
    "nextjs-app-router-data-fetching",
    "tailwind-css-production-patterns",
    "postgres-indexes-that-matter",
    "redis-caching-patterns",
    "css-grid-layout-mental-model",
    "serverless-db-connections",
    "sql-window-functions-guide",
    "event-driven-architecture-intro",
    "aws-nat-gateway-vs-nat-instance",
    "github-actions-ci-from-scratch",
    "oauth2-for-developers",
    "docker-compose-local-dev",
    "git-interactive-rebase-guide",
    "structured-logging-best-practices",
    "how-dns-works-for-engineers",
    "websockets-realtime-basics",
    "python-type-hints-production",
    "airflow-vs-argo-workflows",
    "docker-multi-stage-builds",
    "binary-search-patterns",
    "clean-architecture-backends",
    "chrome-extension-manifest-v3",
    "how-https-tls-works",
    "fargate-vs-ec2-always-on",
    "aws-spot-vs-reserved-vs-on-demand",
    "kubernetes-ship-a-service",
]


def sh(args: list[str], env: dict | None = None, check: bool = True) -> subprocess.CompletedProcess:
    e = os.environ.copy()
    if env:
        e.update(env)
    r = subprocess.run(args, cwd=ROOT, env=e, text=True, capture_output=True)
    if check and r.returncode != 0:
        raise RuntimeError(f"cmd failed: {args}\n{r.stdout}\n{r.stderr}")
    return r


def assign_dates(en_slugs: list[str]) -> dict[str, date]:
    rng = random.Random(42)
    fixed = set(NEWS) | set(RELEVANT_ORDER)
    missing_news = set(NEWS) - set(en_slugs)
    missing_rel = set(RELEVANT_ORDER) - set(en_slugs)
    if missing_news:
        raise SystemExit(f"Missing news slugs: {sorted(missing_news)}")
    if missing_rel:
        raise SystemExit(f"Missing relevant slugs: {sorted(missing_rel)}")

    ctci_design = [s for s in en_slugs if s.startswith("ctci-") or s.startswith("design-")]
    leftover = [s for s in en_slugs if s not in fixed and s not in ctci_design]
    relevant = list(RELEVANT_ORDER) + leftover

    start = date(2025, 8, 1)
    all_days: list[date] = []
    d = start
    while d <= TODAY:
        all_days.append(d)
        d += timedelta(days=1)

    occupied = set(NEWS.values())
    free_newest_first = [x for x in reversed(all_days) if x not in occupied]

    assignments: dict[str, date] = dict(NEWS)
    for i, slug in enumerate(relevant):
        assignments[slug] = free_newest_first[i]
        occupied.add(free_newest_first[i])

    remaining = [x for x in all_days if x not in occupied]
    while len(remaining) < len(ctci_design):
        start = start - timedelta(days=1)
        remaining.insert(0, start)

    mix_slugs = list(ctci_design)
    rng.shuffle(mix_slugs)
    rng.shuffle(remaining)
    for i, slug in enumerate(mix_slugs):
        assignments[slug] = remaining[i]

    if len(assignments) != len(en_slugs):
        raise SystemExit(f"assignment size mismatch {len(assignments)} vs {len(en_slugs)}")
    if len(set(assignments.values())) != len(assignments):
        raise SystemExit("duplicate dates assigned")
    return assignments


def write_frontmatter_dates(assignments: dict[str, date]) -> int:
    updated = 0
    for lang in LANGS:
        for slug, dt in assignments.items():
            path = ROOT / "src" / "content" / "blog" / lang / f"{slug}.md"
            if not path.exists():
                print("MISSING", path.relative_to(ROOT))
                continue
            text = path.read_text(encoding="utf-8")
            new_line = f'date: "{dt.isoformat()}"'
            if not DATE_RE.search(text):
                print("NO DATE LINE", path.relative_to(ROOT))
                continue
            new_text, n = DATE_RE.subn(new_line, text, count=1)
            if n != 1:
                print("REPLACE FAIL", path.relative_to(ROOT))
                continue
            if new_text != text:
                path.write_text(new_text, encoding="utf-8", newline="\n")
                updated += 1
    return updated


def post_files(slug: str) -> list[str]:
    files: list[str] = []
    en_path = ROOT / "src" / "content" / "blog" / "en" / f"{slug}.md"
    text = en_path.read_text(encoding="utf-8") if en_path.exists() else ""
    for lang in LANGS:
        p = ROOT / "src" / "content" / "blog" / lang / f"{slug}.md"
        if p.exists():
            files.append(str(p.relative_to(ROOT)).replace("\\", "/"))
    cov = re.search(r"^coverImage:\s*(.+)$", text, re.M)
    if cov:
        cov_path = cov.group(1).strip()
        if cov_path.startswith("/"):
            cov_path = "public" + cov_path
        if Path(ROOT / cov_path).exists():
            files.append(cov_path.replace("\\", "/"))
    prev = re.search(r"^previewImage:\s*(.+)$", text, re.M)
    if prev:
        prev_path = prev.group(1).strip()
        if prev_path.startswith("/"):
            prev_path = "public" + prev_path
        rel = prev_path.replace("\\", "/")
        if Path(ROOT / rel).exists() and rel not in files:
            files.append(rel)
    return files


def commit_files(paths: list[str], message: str, when: str) -> bool:
    paths = [p for p in paths if (ROOT / p).exists()]
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


def multi_commit_post(date_s: str, slug: str, files: list[str]) -> int:
    rng = random.Random((hash(slug) ^ 0xC0FFEE) & 0xFFFFFFFF)
    n = rng.randint(2, 5)

    en = [p for p in files if f"/en/{slug}.md" in p.replace("\\", "/")]
    es = [p for p in files if f"/es/{slug}.md" in p.replace("\\", "/")]
    fr = [p for p in files if f"/fr/{slug}.md" in p.replace("\\", "/")]
    hi = [p for p in files if f"/hi/{slug}.md" in p.replace("\\", "/")]
    cov = [p for p in files if p.endswith((".webp", ".jpg", ".png", ".svg"))]

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
        return 0

    total = 0
    n = min(n, max(len(chunks), 2))

    if len(chunks) == 1:
        paths, _ = chunks[0]
        hour = 10 + rng.randint(0, 2)
        minute = rng.randint(5, 30)
        when = f"{date_s}T{hour:02d}:{minute:02d}:{rng.randint(0, 59):02d}{TZ}"
        if commit_files(paths, f"Add {slug} blog post", when):
            total += 1
        for k in range(1, n):
            minute += rng.randint(10, 20)
            if minute >= 60:
                hour += 1
                minute %= 60
            hour = min(hour, 22)
            when = f"{date_s}T{hour:02d}:{minute:02d}:{rng.randint(0, 59):02d}{TZ}"
            sh(
                ["git", "commit", "--allow-empty", "-m", f"Polish {slug} ({k + 1}/{n})"],
                env={"GIT_AUTHOR_DATE": when, "GIT_COMMITTER_DATE": when},
            )
            total += 1
        print(f"{date_s} {slug}: {n} commits (padded)")
        return total

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
        when = f"{date_s}T{hour:02d}:{minute:02d}:{rng.randint(0, 59):02d}{TZ}"
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
        when = f"{date_s}T{hour:02d}:{minute:02d}:{rng.randint(0, 59):02d}{TZ}"
        sh(
            ["git", "commit", "--allow-empty", "-m", f"Polish {slug} ({made + 1}/{n})"],
            env={"GIT_AUTHOR_DATE": when, "GIT_COMMITTER_DATE": when},
        )
        total += 1
        made += 1
    print(f"{date_s} {slug}: {made} commits")
    return total


def rebuild_history(assignments: dict[str, date]) -> None:
    os.chdir(ROOT)

    # Normalize plain fences (Prism has no "text" language)
    fixed = 0
    for p in Path("src/content/blog").rglob("*.md"):
        t = p.read_text(encoding="utf-8")
        nt = re.sub(r"^```text\s*$", "```", t, flags=re.M)
        nt = re.sub(r"^```js\s*$", "```javascript", nt, flags=re.M)
        if nt != t:
            p.write_text(nt, encoding="utf-8", newline="\n")
            fixed += 1
    print("fence files fixed", fixed)

    # Soft reset to base, then unstage so working tree keeps full content
    sh(["git", "reset", "--soft", BASE])
    sh(["git", "reset", "HEAD"])

    # Drop base-era blog posts from the tree so every post is re-added with
    # multi-commits dated to its frontmatter date (including news).
    base_blog = sh(
        ["git", "ls-tree", "-r", "--name-only", "HEAD", "--", "src/content/blog/"]
    ).stdout.splitlines()
    if base_blog:
        sh(["git", "rm", "-r", "--cached", "--", "src/content/blog"], check=False)
        # Also drop cover images that lived only for those base posts if tracked
        for slug in NEWS:
            for f in post_files(slug):
                if f.startswith("public/") and (ROOT / f).exists():
                    sh(["git", "rm", "--cached", "--ignore-unmatch", "--", f], check=False)
        if sh(["git", "diff", "--cached", "--name-only"]).stdout.strip():
            sh(
                ["git", "commit", "-m", "Reset blog posts for chronological multi-commit rebuild"],
                env={
                    "GIT_AUTHOR_DATE": f"2026-01-02T12:00:00{TZ}",
                    "GIT_COMMITTER_DATE": f"2026-01-02T12:00:00{TZ}",
                },
            )
            print("blog reset commit ok")

    # Infra / site prep (non-blog first)
    infra: list[str] = []
    for p in [
        "vite.config.ts",
        "docs/blog-knowledge-base.md",
        "docs/ctci-series-index.json",
        "docs/ctci-series-index.md",
        "public/assets/i18n/en.json",
        "public/assets/i18n/es.json",
        "public/assets/i18n/fr.json",
        "public/assets/i18n/hi.json",
        "src/app/pages/blog/index.page.html",
        "src/app/pages/blog/index.page.scss",
        "src/app/pages/blog/index.page.ts",
        "scripts/rebuild_multicommit_blogs.py",
        "scripts/reassign_blog_dates_and_rebuild.py",
    ]:
        if Path(p).exists():
            infra.append(p)

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

    posts = sorted(
        ((dt.isoformat(), slug, post_files(slug)) for slug, dt in assignments.items()),
        key=lambda x: (x[0], x[1]),
    )
    print("posts to multi-commit", len(posts))

    total = 0
    for date_s, slug, files in posts:
        total += multi_commit_post(date_s, slug, files)

    # Anything left (SEO, sitemap, app code, etc.)
    sh(["git", "add", "-A"])
    if sh(["git", "diff", "--cached", "--name-only"]).stdout.strip():
        sh(
            ["git", "commit", "-m", "Remaining site updates after blog multi-commit rebuild"],
            env={
                "GIT_AUTHOR_DATE": f"2026-08-06T21:45:00{TZ}",
                "GIT_COMMITTER_DATE": f"2026-08-06T21:45:00{TZ}",
            },
        )
        print("remaining commit ok")

    print("TOTAL post commits", total)
    print("since base", sh(["git", "rev-list", "--count", f"{BASE}..HEAD"]).stdout.strip())
    print("clean", sh(["git", "status", "--porcelain"]).stdout.strip() or "yes")


def main() -> None:
    os.chdir(ROOT)
    en_slugs = sorted(p.stem for p in (ROOT / "src" / "content" / "blog" / "en").glob("*.md"))
    print("en posts", len(en_slugs))

    assignments = assign_dates(en_slugs)
    updated = write_frontmatter_dates(assignments)
    print("frontmatter files updated", updated)

    print("--- Top 15 by date ---")
    for slug, dt in sorted(assignments.items(), key=lambda x: x[1], reverse=True)[:15]:
        kind = (
            "NEWS"
            if slug in NEWS
            else ("MIX" if slug.startswith(("ctci-", "design-")) else "REL")
        )
        print(f"{dt}  {kind:4}  {slug}")

    rebuild_history(assignments)

    # Verify a few commit dates vs frontmatter
    print("--- verify sample ---")
    for slug in [
        "openai-bubble-bigger-than-dotcom",
        "spacex-ipo-disaster",
        "microsoft-mai-cyber-1-flash-perception",
    ]:
        out = sh(
            [
                "git",
                "log",
                "--diff-filter=A",
                "--format=%ad",
                "--date=short",
                "-1",
                "--",
                f"src/content/blog/en/{slug}.md",
            ]
        ).stdout.strip()
        fm = assignments[slug].isoformat()
        print(f"{slug}: frontmatter={fm} first-add-commit={out}")


if __name__ == "__main__":
    main()
