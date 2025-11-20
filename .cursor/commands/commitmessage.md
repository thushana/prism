Write a commit message for the changes on disk

```
🎯 EMOJI ALL CAPS SLUG - Brief description of the feature succinctly
```

## Rules

- **Emoji** + **ALL CAPS** slug + dash + brief description
- One line only
- Cover all unstaged changes in the commit

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

## Staging for GitHub Desktop

To prefill the message in GitHub Desktop:

```bash
echo "YOUR_COMMIT_MESSAGE" > .git/COMMIT_EDITMSG
```

**Important**:

- Close and reopen GitHub Desktop after writing the file
- Then stage files → click "Commit" → message will be prefilled

**Alternative** (if above doesn't work): Copy the message and paste it manually in GitHub Desktop's commit text area.
