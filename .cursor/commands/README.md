# Cursor slash commands (Prism)

Edit these files here. Parent apps link this folder into their workspace:

```bash
# from timetraveler (or other Prism consumer)
pnpm prism:sync:commands
```

That creates `.cursor/commands` → `prism/.cursor/commands` (directory symlink). Cursor’s `/` menu lists `CODEREVIEW`, `COMMITMESSAGE`, etc. from this directory.

Per-file symlinks under `.cursor/commands/*.md` are **not** reliably discovered — use the directory symlink.
