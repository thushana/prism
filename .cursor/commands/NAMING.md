Use this when naming variables, props, types, files, or identifiers. Apply consistently across the codebase.

## Philosophy

**Self-documenting and consistent.** Names should read clearly without looking up definitions. One canonical name per concept everywhere (no mapping from "display name" to "internal name") — including user-facing labels, function names, and file names. Prefer clarity and consistency over brevity.

## Rules

- **Logical sequence:** Order parts from broadest to narrowest (e.g. `categorySubVariant`, `sectionTitle`, `buttonSize`).
- **Case conventions:** Use camelCase for variables, props, and functions; PascalCase for types, interfaces, and components; kebab-case for file and folder names; SCREAMING_SNAKE_CASE for constants.
- **Idiomatic:** Follow conventions of TypeScript, Next.js, React, and Tailwind. Use standard terms (e.g. `className`, `children`, `onClick`) and common patterns.
- **No abbreviations:** Avoid acronyms and shortened forms unless in this allowlist: `id`, `ids`, `url`, `html`, `css`, `api`, `ui`, and framework-defined names such as `config` in `next.config.js`. Outside these cases, prefer full words: `background` not `bg`, `database` not `db`, `configuration` not `config` in your own code.
- **Sizing — never shorten:** In Prism and app-owned APIs (props, union types, config keys, literals), shared size steps use full words aligned across **PrismButton**, **PrismIcon**, and **PrismTypography** (`PrismSize`): `small`, `medium`, `large`, `huge`, `gigantic` — not Tailwind-style shorthands like `sm`, `md`, `lg`, `xl`. Framework or third-party props that only accept shortened tokens are the exception; wrap or map at the boundary if you expose your own API.
- **Clear over short:** Prefer longer, explicit names over terse ones. e.g. `rectangleRounded` over `rectRnd`, `disabled` over `dis` when you mean the PrismButton prop.
- **Self-documenting:** The name alone should convey purpose. Avoid generic names like `data`, `value`, `item` when something more specific is possible (e.g. `selectedAppearanceKeys`, `currentView`).
- **Consistent everywhere:** Use the same name for the same concept in props, types, data attributes, class names, file names, and UI labels. Derive kebab-case for DOM from camelCase (e.g. `spacing="tight"` → `data-spacing="tight"`, `gap="none"` → `data-gap="none"`).

## Examples

- **PrismPathBar / admin shell:** `PrismPathBarTitleEntry`, `PrismPathBarSegment`, **`segments`** (on `PrismPathBar` with `mode="explicit"`), `titleByPathPrefix`, `pageTitle`, `prismPathBarTitleByPathPrefix`, **`explicitPrismPathBarSegments`** (on `AdminPageShell`), `prismPathBarIcon`; app map constant `ADMIN_PATH_BAR_TITLE_BY_PATH_PREFIX` in `admin-path-bar-title-by-path-prefix.ts` (not `titlesByPath`, `breadcrumb`, or `adminPathBarTitles`).
- **Props / options:** **PrismButton** variant axes: `shape` (`pill` \| `rectangle` \| `rectangleRounded`), `line` (`full` \| `bottom` \| `none`), `spacing` (`normal` \| `tight`), `gap` (`normal` \| `none`), `textCase`, `paint`, `segmentPosition`; motion opt-outs `disableMotion`, `disableGrow`, `disableColorChange`, `disableIconMotion`; state `inverted`, `disabled`, `toggled`; `asChild` for Radix `Slot`. Palette stays on **`color`** (`ColorName`). Size: `PrismSize` as above. **PrismIcon** `weight`: named `light` \| `thin` \| `regular` \| `bold` \| `heavy` (wght 100 / 200 / 400 / 600 / 700) or numeric **100–700**; **`medium` is size-only**, not a weight name.
- **Booleans / flags:** Use `is`/`has`/`should` for general state (`isLoading`, `hasError`, `shouldRetry`). PrismButton chainables use names above; customizer preset keys may still use `colorBackgroundLight`-style ids.
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
- Mismatched names for the same thing (e.g. prop `toggled` vs. data attribute `data-toggled`).
- Shortened size literals in your own types or props: `sm` / `md` / `lg` / `xl` → use `PrismSize` words (`small` / `medium` / `large` / `huge` / `gigantic`) for Prism UI components.

Apply these rules when creating or renaming identifiers and when reviewing renames.
