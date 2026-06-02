# Cursor slash commands (Prism)

Edit these files here. Parent apps refresh their copy with:

```bash
# from porch-scope / timetraveler (repo root)
pnpm prism:sync:commands
```

That **copies** `prism/.cursor/commands/*.md` → `.cursor/commands/` (real files, not a symlink).

**Keeps in sync automatically** when you:

- run `pnpm prism:sync` or `pnpm prism:sync:git` (after submodule pull)
- run `pnpm install` (via `prepare`, only copies if prism files are newer)
- run `pnpm prism:sync:commands` manually after editing commands in `prism/`
- run `git pull` (Husky **`post-merge`** — install with `pnpm prism:sync:hooks` or `prism generate`)

Edit commands **only under `prism/.cursor/commands/`** — the parent copy is generated.

Cursor’s `/` menu should list `CHORES`, `CODEREVIEW`, `COMMITMESSAGE`, etc. after sync. If commands are missing, run sync again and fully quit Cursor (`Cmd+Q`), then reopen.

**Do not** symlink `.cursor/commands` to prism — Cursor often does not index symlinked command directories.

Per-file symlinks under `.cursor/commands/*.md` are also unreliable.
