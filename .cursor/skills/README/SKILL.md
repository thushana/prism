---
name: README
description: >-
  Explain Prism Cursor skills layout and sync. Use when asking about Prism
  skills, slash skills, or /README.
disable-model-invocation: true
---

# Prism Cursor skills

Edit skills under `prism/.cursor/skills/<NAME>/SKILL.md`. Folder and frontmatter `name` are **ALLCAPS** so Prism skills are easy to spot next to other agents’ skills. Slash names are short imperatives in one grammar space (`/PLAN`, `/BUILD`, `/COMMIT`, …).

Parent apps refresh their copy with:

```bash
# from the host app repo root
pnpm prism:sync:commands
```

That **copies** `prism/.cursor/skills/*/SKILL.md` → `.cursor/skills/` (real files, not a symlink). Host `.cursor/skills/` is gitignored; Prism is the source of truth.

**Keeps in sync automatically** when you:

- run `pnpm prism:sync` or `pnpm prism:sync:git` (after submodule pull)
- run `pnpm install` (via `prepare`, only copies if prism files are newer)
- run `pnpm prism:sync:commands` manually after editing skills in `prism/`
- run `git pull` (Husky **`post-merge`** — install with `pnpm prism:sync:hooks` or `prism generate`)

Edit skills **only under `prism/.cursor/skills/`** — the parent copy is generated.

Cursor’s skill / slash menu should list `BUILD`, `CHECK`, `CHORE`, `COMMIT`, `NAMING`, `PLAN`, `README`, `REVIEW` after sync. If skills are missing, run sync again and fully quit Cursor (`Cmd+Q`), then reopen.

**Do not** symlink `.cursor/skills` to prism — Cursor often does not index symlinked skill directories.
