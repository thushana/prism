# Commit Message Style

Human-facing **convention** for `git log`, not implementation. Fits [DOCS-Prism.md](./DOCS-Prism.md): short **what** changed; the diff is **how**.

## Format

```
🎯 EMOJI ALL CAPS SLUG - Brief description of the feature succinctly
```

## Rules

- **Emoji** (optional but recommended) - Visual indicator of change type
- **ALL CAPS** slug (short, descriptive keyword)
- Single dash separator
- Brief explanation covering all unstaged changes in the commit
- One line only

## Examples

- `🎨 ADMIN UI - Simplify homepage to "Project" and remove unused public assets`
- `🐛 DISPLAY FIX - Resolve image display issues in evaluation builder`
- `✨ HOVER VIEW - Add new global hover state to structure view for metadata display`
- `🗄️ DATABASE - Add Drizzle ORM with Neon PostgreSQL setup and database scripts`
- `⚙️ CONFIG - Update ESLint rules and add new linting scripts`
- `📝 DOCS - Add deployment instructions to README`
- `🔧 HOOKS - Configure lint-staged to auto-stage formatted changes`
- `🎯 DEVSHEET - Add relative time display and reorganize layouts`

## Common Emojis

- `🎨` UI changes
- `🐛` Bug fixes
- `✨` New features
- `🗄️` Database changes
- `⚙️` Configuration
- `📝` Documentation
- `🔧` Tooling/Dev tools
- `🎯` Development tools
- `🚀` Deployment
- `♻️` Refactoring
- `⚡` Performance
- `🔒` Security

## Guidelines

- Commit should include all related unstaged changes
- Slug should be a single word or short phrase (e.g., `SETUP`, `DATABASE`, `UI`)
- Description should be concise but descriptive enough to understand the change
- Emoji is optional but helps categorize changes at a glance
