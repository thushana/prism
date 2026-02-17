Use this when naming variables, props, types, files, or identifiers. Apply consistently across the codebase.

## Philosophy

**Self-documenting and consistent.** Names should read clearly without looking up definitions. One canonical name per concept everywhere (no mapping from "display name" to "internal name") — including user-facing labels, function names, and file names. Prefer clarity and consistency over brevity.

## Rules

- **Logical sequence:** Order parts from broadest to narrowest (e.g. `categorySubVariant`, `sectionTitle`, `buttonSize`).
- **Case conventions:** Use camelCase for variables, props, and functions; PascalCase for types, interfaces, and components; kebab-case for file and folder names; SCREAMING_SNAKE_CASE for constants.
- **Idiomatic:** Follow conventions of TypeScript, Next.js, React, and Tailwind. Use standard terms (e.g. `className`, `children`, `onClick`) and common patterns.
- **No abbreviations:** Avoid acronyms and shortened forms unless in this allowlist: `id`, `ids`, `url`, `html`, `css`, `api`, `ui`, and framework-defined names such as `config` in `next.config.js`. Outside these cases, prefer full words: `background` not `bg`, `database` not `db`, `configuration` not `config` in your own code.
- **Clear over short:** Prefer longer, explicit names over terse ones. e.g. `shapeRectangleRounded` over `rectRnd`, `stateDisabled` over `dis`.
- **Self-documenting:** The name alone should convey purpose. Avoid generic names like `data`, `value`, `item` when something more specific is possible (e.g. `selectedAppearanceKeys`, `currentView`).
- **Consistent everywhere:** Use the same name for the same concept in props, types, data attributes, class names, file names, and UI labels. Derive kebab-case or other formats from that single canonical name (e.g. `shapeTight` → `data-shape-tight`, `.shapeTight`).

## Examples

- **Props / options:** `shapeRectangle`, `shapeLineNo`, `stateToggled`, `colorVariant`, `segmentPosition` (not `rectangle`, `lineNo`, `toggled` in isolation when you have a naming scheme).
- **Booleans / flags:** Use `is`/`has`/`should` for general state (`isLoading`, `hasError`, `shouldRetry`). Use domain prefixes when part of a naming scheme (`animationNoGrow`, `stateDisabled`, `shapeLineNo`).
- **Event handlers:** Props use `on` prefix (`onClick`, `onSubmit`); internal handler functions use `handle` prefix (`handleClick`, `handleSubmit`).
- **Files / modules:** `selector-time.tsx`, `journeys-map.tsx` (kebab-case, descriptive).
- **Types:** `ButtonProps`, `AppearanceKey`, `ColorName` (PascalCase, no abbreviations).
- **Constants:** `MAX_RETRY_COUNT`, `API_BASE_URL` (SCREAMING_SNAKE_CASE).

## Anti-patterns

- `bg` → `background`
- `db` → `database`
- `cfg` / `conf` → `configuration` (or `config` only where it’s the standard, e.g. Next `config`)
- `btn` → `button`
- `opt` → `option`
- Mismatched names for the same thing (e.g. prop `stateToggled` vs. data attribute `data-toggled`).

Apply these rules when creating or renaming identifiers and when reviewing renames.
