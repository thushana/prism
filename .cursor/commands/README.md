# Cursor slash commands (Prism)

Edit these files here. Parent apps refresh their copy with:

```bash
# from porch-scope / timetraveler (repo root)
pnpm prism:sync:commands
```

That **copies** `prism/.cursor/commands/*.md` → `.cursor/commands/` (real files, not a symlink).

Cursor’s `/` menu should list `CHORES`, `CODEREVIEW`, `COMMITMESSAGE`, etc. after sync. If commands are missing, run sync again and fully quit Cursor (`Cmd+Q`), then reopen.

**Do not** symlink `.cursor/commands` to prism — Cursor often does not index symlinked command directories.

Per-file symlinks under `.cursor/commands/*.md` are also unreliable.
