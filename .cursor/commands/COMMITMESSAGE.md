Write a commit message for the changes on disk

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

---

Ask the user if they'd like you to commit. If yes, follow the commit and push order above.
