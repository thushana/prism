---
name: COMMIT
description: >-
  Write a one-line commit message for the changes on disk, then commit.
  On final commits: bump/tag versions and push (prism first). Use after
  REVIEW or when the user asks for /COMMIT.
disable-model-invocation: true
---

# Commit

## Before committing

**Run [REVIEW](../REVIEW/SKILL.md) first** on the unstaged changes and fix Critical / Important findings. Do not write the commit message or commit until that review has run in this turn (or the user explicitly waived it).

## Philosophy

**One authoritative representation.** The commit message should capture _what_ changed and _why_ (if non-obvious), not _how_ (the code shows that). Be concise but descriptive enough that someone reading git log understands the change.

## Rules

- One line only
- Cover all uncommitted changes in that repo holistically (stage with `git add -A`, including new files); when running a planned commit from BUILD, cover only that commit's scope
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

## Interim vs final

A **plan** is one intentional delta (e.g. a `/PLAN` Commits list, a feature branch, or an explicitly scoped set of commits).

Treat a commit as **final** when any of these is true:

1. The plan marks it `final — bump + tag + push` (or equivalent).
2. The user says the plan/delta is done, to release, or to bump/tag/push.
3. This is a lone `/COMMIT` with no open multi-commit plan.

Otherwise treat as **interim**.

| | Interim | Final |
|--|---------|--------|
| Message + local commit | yes | yes |
| `git push` (branch) | **no** | **yes** |
| Version bump | no | yes (net semver for the whole plan delta) |
| `v*` tag + push tag | no | yes |

**Why defer push:** avoid thrashing GitHub Actions, Fly, and Vercel on every sub-commit.

**Override:** if the user explicitly asks to push an interim commit, push that once; still skip bump/tag until final unless they also ask to release.

Do not move a tag that already exists. Do not backfill tags onto interim commits.

## Commit and push (repos with a `prism/` submodule)

Applies to host apps (City Observatory, TimeTraveler, …). A Prism change and its host change get **separate** messages — one per repo.

### Commit order

1. **Inside `prism/`** — stage, commit, verify clean (no `-dirty` on the submodule).
2. **Parent repo root** — stage app changes **and** the updated `prism` submodule pointer, then commit.

If only the parent changed (no edits under `prism/`), skip step 1.

### Push order (final commits only)

**Always push `prism` before the parent** so the parent’s submodule SHA already exists on the Prism remote.

1. `cd prism && git push` (from parent: `git -C prism push`)
2. `git push` from the **parent repo root**

If only `prism/` was committed, push step 1 only. If only the parent was committed (submodule pointer unchanged), push step 2 only.

Never push the parent first when the commit updates the `prism` submodule reference — clones and CI will point at a missing SHA.

On **interim** commits: stop after the local commit(s); do not push either repo.

## Prism version

Versions follow [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).

Prism has one version: `version` in `prism/package.json`. Host apps consume a submodule SHA, not published packages. Leave the `version` fields in `packages/*`, `apps/*`, and `tools/` alone.

The line is `0.x` until an intentional `1.0.0`. While it is `0.x`:

- **patch** (`0.1.0` → `0.1.1`): bugfix, security fix, compatible dependency bump, refactor or performance change with the same exports, docs
- **minor** (`0.1.0` → `0.2.0`): new public API, and any breaking change (renamed or removed export, required config or migration, behavior a host must adapt to)
- **major**: only for an intentional `1.0.0`. Do not choose `1.0.0` as part of a normal change

Skip the bump when the commit only touches `.cursor/`.

Bump and tag only on the **final** Prism commit of a plan (see **Interim vs final**). Interim Prism commits leave `version` unchanged and untagged. Choose one semver bump for the **net** change across the whole plan (higher bump wins if the delta mixes levels).

On a final Prism commit that needs a bump:

1. Read `version` from `prism/package.json`.
2. Write the next version into that file and include it in the commit.

After that commit, with a clean `prism/` tree:

1. From inside `prism/`, tag that commit: `git tag -a vX.Y.Z -m "vX.Y.Z"`.
2. Push the branch, then the tag: `git push origin vX.Y.Z`.
3. Then commit and push the parent (when applicable), in the push order above.

When the parent’s final commit only advances the submodule pointer to a newly tagged Prism version, name that version in the message (`🔧 PRISM - Take Prism v0.2.0`). That parent final commit still follows **Host app version** (Take Prism = host patch).

## Host app version

Versions follow [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).

Host apps (City Observatory, TimeTraveler, …) have one version: `version` in the **parent repo root** `package.json`. Leave nested `apps/*` / `packages/*` `version` fields alone. Prism’s version and tags live on the Prism remote; the host’s version and tags live on the host remote — two namespaces.

The line is `0.x` until an intentional `1.0.0`. While it is `0.x`:

- **patch** (`0.1.0` → `0.1.1`): bugfix, security fix, compatible dependency bump, refactor, docs, tooling, and **Take Prism** (submodule pointer advance)
- **minor** (`0.1.0` → `0.2.0`): new user-facing capability, and any breaking change or required migration hosts/users must adapt to
- **major**: only for an intentional `1.0.0`. Do not choose `1.0.0` as part of a normal change

Bump and tag only on the **final** parent commit of a plan (see **Interim vs final**), including when that commit is Take Prism. Interim parent commits leave `version` unchanged and untagged. Net semver for the whole plan; higher bump wins if mixed.

On a final parent commit that needs a bump:

1. Read `version` from the parent root `package.json`.
2. Write the next version into that file and include it in the commit.

After that commit, with a clean parent tree:

1. Tag that commit: `git tag -a vX.Y.Z -m "vX.Y.Z"`.
2. Push the branch, then the tag: `git push origin vX.Y.Z`.

## Commit

Commit without asking for confirmation first. On interim commits: message + local commit only. On final commits: bump (when required), tag, and push per the rules above.

Still stop without committing when the user said not to commit or not to push, the diff contains secrets (`.env`, credentials), or the tag already exists.
