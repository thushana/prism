# Prism playgrounds (admin component demos)

This file sits next to **[DOCS-Prism.md](./DOCS-Prism.md)** and follows the same rule: **code is truth for how; docs explain why, what, and where.** Class names, grid recipes, and `PrismCodeBlock` props live in source; here we only pin the **mental model** and **constraints** so new demos stay consistent without duplicating an encyclopedia.

**Related docs**

- **[ADMIN-Prism.md](./ADMIN-Prism.md)** — auth, `AdminPageShell`, `/admin` route tree, and how hub pages gate with `requireAdminPage`.
- **[UI-Prism.md](./UI-Prism.md)** — deliberate `@ui` usage reference when you need prop-level examples (keep long snippets there or in JSDoc, not here).

## What a “playground” is

In a consuming app, each entry in `PRISM_ADMIN_COMPONENT_REGISTRY` (`prism/packages/admin/source/registry.ts`) maps a slug to a **zero-prop `Demo` component**. The dynamic admin route renders that `Demo` under `AdminPageShell` (`prism/packages/authentication/source/admin-layout.tsx`). The shell owns title, description, and chrome; the **demo owns everything below**—that is the playground surface.

## Mental model: three-part spine (then optional depth)

Reference implementation: **`PrismEmojiDemo`** in `prism/packages/admin/source/prism-emoji.tsx` (e.g. `/admin/prism/components/prism-emoji`).

| Block           | Role                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------- |
| **Customize**   | State + controls = the **API surface** readers touch first.                                     |
| **Example**     | One **live preview** bound to that state.                                                       |
| **Code sample** | A string fed to **`PrismCodeBlock`**, generated from the **same** state as Customize + Example. |

**Why Customize is first:** props-before-output matches how people read on small screens (controls before scroll-heavy preview) and matches how authors reason about the component.

After the spine, demos may add optional sections (compare grids, inline labs, preset matrices). Shorter demos (e.g. `PrismColorPickerDemo`, `PrismTableDemo`) often stop at the spine only—see their files under `prism/packages/admin/source/`.

## Layout and typography (what we standardized)

Intent only—**exact classes and prop lists live in** `prism/packages/admin/source/prism-emoji.tsx` (and peers). At a glance:

1. **Demo root** — one wrapper with **consistent vertical rhythm** between major blocks so Customize, Example, and Code read as separate beats without one-off margins.

2. **Major sections** — each is a **`section`** with **tight internal rhythm** so the heading, any helper copy, and the body stay one visual unit.

3. **Section titles** (“Customize”, “Example”, …) — **sans title scale** on an **`h2`**, not monospace; that is the playground **segment header** voice.

4. **Control groups** — **semantic grouping** (e.g. `fieldset` + `legend`) with a **small overline-style** group label; option text is **mono-flavoured** so values feel API-adjacent, and **inactive** options recede via **semantic muted** text, not custom colours.

5. **Example runway** — give the live preview a clear **stage** (spacing and/or a very light frame) so it reads separately from admin chrome. **Do not wrap previews in `PrismCard` (or other card / elevated surfaces)**—playgrounds are not marketing tiles; card chrome fights components that already draw their own edges (tables, maps, charts). For compact single widgets, a **low-contrast bordered panel** is fine (see `prism-emoji.tsx`). For **wide or grid-heavy** demos (e.g. `PrismTable`), prefer **`overflow-x-auto` + `min-w-0`** and light vertical padding only—let the component’s own border and zebra read as the surface.

6. **Code sample** — a **card-mode** code panel with a **Prism colour spec** so syntax sits on a **tinted wash** (token-driven). Implementation: `prism/packages/ui/components/prism-code-block.tsx` and `PrismColor.syntax`. **Card mode applies to the code block only**, not to the live Example preview.

## Constraint (non-negotiable)

**Snippet string and preview must share one source of truth** (typically `useMemo` from the same state object). If they drift, the doc philosophy in [DOCS-Prism.md](./DOCS-Prism.md) is violated: readers cannot trust the playground as documentation.

## Where to look (authoritative files)

| Question                                          | File                                                                    |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| Which demos exist and hub copy?                   | `prism/packages/admin/source/registry.ts`                               |
| Reference layout (full spine + optional sections) | `prism/packages/admin/source/prism-emoji.tsx`                           |
| Shorter spine-only examples                       | `prism/packages/admin/source/prism-color-picker.tsx`, `prism-table.tsx` |
| Shell, path bar, sign-out                         | `prism/packages/authentication/source/admin-layout.tsx`                 |
| Code panel fill and copy affordances              | `prism/packages/ui/components/prism-code-block.tsx`                     |

## When to update this doc

Update when the **playground contract** changes (e.g. we rename the spine, change the mandatory Demo shape, or move the hub route). Do **not** update for every new toggle on a single demo—that belongs in code and JSDoc per [DOCS-Prism.md](./DOCS-Prism.md).
