Write a commit message for the changes on disk

## Philosophy

**One authoritative representation.** The commit message should capture *what* changed and *why* (if non-obvious), not *how* (the code shows that). Be concise but descriptive enough that someone reading git log understands the change.

## Rules

- One line only
- Cover all unstaged changes in the commit holistically
- Format: **Emoji** + **ALL CAPS** slug + dash + brief description
- If repository has submodules, commit submodules first (deepest first), then main repo
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

Ask the user if they'd like to have it committed for them. If so, commit the submodules with the deepest first (to establish their commit hashes), then commit this repository so the submodule references can be updated. Once commited, push the code.