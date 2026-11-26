---
name: commitmessage
description: Write a commit message for the changes on disk
disable-model-invocation: true
---

Write a commit message for the changes on disk

## Before committing

**Run [codereview](../codereview/SKILL.md) first** on the unstaged changes and fix Critical / Important findings. Do not write the commit message or commit until that review has run in this turn (or the user explicitly waived it).

## Philosophy

**One authoritative representation.** The commit message should capture _what_ changed and _why_ (if non-obvious), not _how_ (the code shows that). Be concise but descriptive enough that someone reading git log understands the change.

## Rules

- One line only
- Cover all unstaged changes in the commit holistically
- Format: **Emoji** + **ALL CAPS** slug + dash + brief description
- Do not add Co-authored-by or tag collaborators on commits

```
🎯 EMOJI ALL CAPS SLUG - Brief description of the feature succinctly
```

## Examples

- `🎨 ADMIN UI - Simplify homepage to "Project" and remove unused public assets`
- `🐛 DISPLAY FIX - Resolve image display issues in evaluation builder`
- `✨ HOVER VIEW - Add new global hover state to structure view for metadata display`
- `🗄️ DATABASE - Add Drizzle ORM with SQLite setup and database scripts`
- `⚙️ CONFIG - Update ESLint rules and add new linting scripts`
- `📝 DOCS - Add deployment instructions to README`
- `🔧 HOOKS - Configure lint-staged to auto-stage formatted changes`
- `🎯 DEVSHEET - Add relative time display and reorganize layouts`

## Common Emojis

`🎨` UI `🐛` Fix `✨` Feature `🗄️` Database `⚙️` Config `📝` Docs `🔧` Tooling `🎯` Dev tools `🚀` Deploy `♻️` Refactor `⚡` Performance `🔒` Security

Return it as a copyable Markdown block

## Commit and push (repos with a `prism/` submodule)

**TimeTraveler** (and similar apps): run `pnpm prism:sync:commands` so `.cursor/commands/` is a copy of this folder.

### Commit order

1. **Inside `prism/`** — stage, commit, verify clean (no `-dirty` on the submodule).
2. **Parent repo root** — stage app changes **and** the updated `prism` submodule pointer, then commit.

If only the parent changed (no edits under `prism/`), skip step 1.

### Push order (required)

**Always push `prism` before the parent** so the parent’s submodule SHA already exists on the Prism remote.

1. `cd prism && git push` (from parent: `git -C prism push`)
2. `git push` from the **parent repo root**

If only `prism/` was committed, push step 1 only. If only the parent was committed (submodule pointer unchanged), push step 2 only.

Never push the parent first when the commit updates the `prism` submodule reference — clones and CI will point at a missing SHA.

## Prism version

Versions follow [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).

Prism has one version: `version` in `prism/package.json`. Host apps consume a submodule SHA, not published packages. Leave the `version` fields in `packages/*`, `apps/*`, and `tools/` alone.

The line is `0.x` until an intentional `1.0.0`. While it is `0.x`:

- **patch** (`0.1.0` → `0.1.1`): bugfix, security fix, compatible dependency bump, refactor or performance change with the same exports, docs
- **minor** (`0.1.0` → `0.2.0`): new public API, and any breaking change (renamed or removed export, required config or migration, behavior a host must adapt to)
- **major**: only for an intentional `1.0.0`. Do not choose `1.0.0` as part of a normal change

Skip the bump when the commit only touches `.cursor/`.

If one commit mixes a break and a fix, use the higher bump. Bump inside that same Prism commit:

1. Read `version` from `prism/package.json`.
2. Write the next version into that file and include it in the commit.

After that commit, with a clean `prism/` tree:

1. From inside `prism/`, tag that commit: `git tag -a vX.Y.Z -m "vX.Y.Z"`.
2. Push the branch, then the tag: `git push origin vX.Y.Z`.
3. Then commit and push the parent, in the push order above.

Do not move a tag that already exists. If several qualifying Prism commits land in one session, bump and tag each one.

When the parent commit only advances the submodule pointer, name the Prism version in that message (`Take Prism v0.2.0`). That parent commit still follows **Host app version** below (Take Prism = host patch).

`0.1.0` is the baseline. Tag `v0.1.0` once on current `main` before the next bump. Do not rewrite older commits.

## Host app version

Versions follow [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).

Host apps (City Observatory, TimeTraveler, …) have one version: `version` in the **parent repo root** `package.json`. Leave nested `apps/*` / `packages/*` `version` fields alone. Prism’s version and tags live on the Prism remote; the host’s version and tags live on the host remote — two namespaces.

The line is `0.x` until an intentional `1.0.0`. While it is `0.x`:

- **patch** (`0.1.0` → `0.1.1`): bugfix, security fix, compatible dependency bump, refactor, docs, tooling, and **Take Prism** (submodule pointer advance)
- **minor** (`0.1.0` → `0.2.0`): new user-facing capability, and any breaking change or required migration hosts/users must adapt to
- **major**: only for an intentional `1.0.0`. Do not choose `1.0.0` as part of a normal change

Bump on **every** parent commit (including Take Prism). If one commit mixes a break and a fix, use the higher bump. Bump inside that same parent commit:

1. Read `version` from the parent root `package.json`.
2. Write the next version into that file and include it in the commit.

After that commit, with a clean parent tree:

1. Tag that commit: `git tag -a vX.Y.Z -m "vX.Y.Z"`.
2. Push the branch, then the tag: `git push origin vX.Y.Z`.

Do not move a tag that already exists. If several qualifying parent commits land in one session, bump and tag each one.

`0.1.0` is the host baseline. Tag `v0.1.0` once on current `main` before the next bump. Do not rewrite older commits.

## Commit

Commit and push. Do not ask for confirmation first.

Follow the commit order, push order, Prism version, and Host app version rules above. Still stop without committing when the user said not to commit or not to push, the diff contains secrets (`.env`, credentials), or the tag already exists.
