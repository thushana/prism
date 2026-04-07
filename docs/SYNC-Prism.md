# Prism Sync (Child Applications)

## Why This Exists

When Prism lives inside your application as a **Git submodule**, you have two trees with their own `package.json` files and tooling. **Sync** is the supported way to pull Prism’s submodule forward and keep the parent app aligned—without hand-copying scripts, Cursor command files, or shared dependency ranges.

The exact step order is implemented in [`scripts/sync.ts`](../scripts/sync.ts); this document describes **what** the pipeline does and **where** to look when behavior changes.

## Commands (Parent Application)

From the **root of your application** (the directory that contains the `prism/` submodule), package scripts typically include:

| Script | Role |
|--------|------|
| `pnpm run prism:sync` | Full pipeline: git submodule, scripts, Cursor commands, dependency range alignment, then `pnpm install` in the parent and in `prism/`. |
| `pnpm run prism:sync:git` | Submodule update only. |
| `pnpm run prism:sync:scripts` | Merge scripts from Prism’s workspace `package.json` into the parent `package.json`. |
| `pnpm run prism:sync:commands` | Copy Cursor command files into the parent repo. |
| `pnpm run prism:sync:dependencies` | **Dry run:** print drift between parent `package.json` and `prism/apps/web/package.json` for an allowlisted set of packages. Does not write files. |

Dependency alignment during `prism:sync` runs the same logic as `sync-dependencies.ts` with `--update`, so the parent’s allowlisted ranges match the reference Next app in Prism (`apps/web`).

**Allowlisted package names** live in [`scripts/sync-dependencies.ts`](../scripts/sync-dependencies.ts); that file is the source of truth for *which* dependencies are mirrored.

## Git Workflow

Changes that touch Prism should usually be **committed in the `prism` repository first**, then the parent repository should record the new submodule commit. Otherwise clones of the parent can point at a submodule SHA that does not exist on the remote.

## Related

- [GLOSSARY-Prism.md](./GLOSSARY-Prism.md) — term **Sync**
- [GENERATE-Prism.md](./GENERATE-Prism.md) — scaffolding apps with the submodule layout
