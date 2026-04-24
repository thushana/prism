# UI Package Documentation

The `packages/ui` package provides a unified UI system including React components, fonts, and global styles. All UI-related assets are consolidated in this single package for easier management and consistency.

This file is the **canonical usage reference** for the UI package (import paths, props, patterns). It includes examples by design; [DOCS-Prism.md](./DOCS-Prism.md) still applies: avoid duplicating version numbers and keep one home for each fact—link here for “how to use” UI, not as a second copy of `package.json`.

## Package Structure

```
packages/ui/
├── components/          # React components (main exports)
│   ├── prism-divider.tsx
│   ├── prism-code-block.tsx
│   ├── prism-card.tsx
│   ├── prism-icon.tsx
│   ├── prism-layout.tsx
│   ├── prism-button.tsx
│   └── index.ts
├── source/              # Presets and secondary modules
│   ├── prism-button-presets.ts
│   ├── prism-meta-chip.ts
│   └── index.ts
├── styles/             # Font configurations and global CSS
│   ├── fonts.ts        # Next.js font configurations
│   ├── globals.css     # Global styles and theme
│   └── index.ts        # Style exports
└── fonts/              # Font files (.woff2)
    ├── Satoshi-Variable.woff2
    ├── Satoshi-VariableItalic.woff2
    ├── Sentient-Variable.woff2
    ├── Sentient-VariableItalic.woff2
    ├── Zodiak-Variable.woff2
    ├── Zodiak-VariableItalic.woff2
    └── Gambarino-Regular.woff2
```

## Installation

The UI package is automatically available in all apps via npm workspaces. No installation needed - just import:

```typescript
import {
  PrismButton,
  PrismCard,
  PRISM_META_CHIP_OUTLINE_CLASS,
  PrismDivider,
  PrismCodeBlock,
  PrismIcon,
  PrismLayoutText,
  PrismLayoutBreakout,
} from "@ui";
import { satoshi, sentient, zodiak, gambarino } from "@ui";
```

## Components

### PrismPathBar

Path row for admin-style navigation: **explicit** `mode="explicit"` with **`segments`**, or **auto** mode from `pathname` + authoritative **`titleByPathPrefix`** and **`pageTitle`** (see `buildPrismPathBarAutoSegmentList` in `prism-path-segments.ts`). Prop names follow [NAMING.md](../.cursor/commands/NAMING.md). Crumbs use **Next `Link`** and **`PrismTypography`** (not `PrismButton`). The UI package lists **Next** as a `peerDependency`; `PrismPathBar` imports `next/link` accordingly.

Types: **`PrismPathBarSegment`**, **`PrismPathBarTitleEntry`**, **`PrismPathBarIcon`**.

```tsx
import { PrismPathBar } from "@ui";

<PrismPathBar
  mode="auto"
  pathname="/admin/prism/components/prism-button"
  titleByPathPrefix={ADMIN_PATH_BAR_TITLE_BY_PATH_PREFIX}
  pageTitle="PrismButton"
/>;

<PrismPathBar
  mode="explicit"
  segments={[
    { label: "Docs", href: "/docs" },
    { label: "Current page" },
  ]}
/>;
```

### PrismButton

The shared **`PrismButton`** (`packages/ui/components/prism-button.tsx`) is the **only** first-class button in `@ui`: Material **`color`** (`ColorName`), Lucide icons, optional GSAP motion, and variant axes **`shape`**, **`line`**, **`spacing`**, **`gap`**, **`textCase`**, **`paint`**, plus **`segmentPosition`** for segmented rows. Motion opt-outs: **`disableMotion`**, **`disableGrow`**, **`disableColorChange`**, **`disableIconMotion`**. It requires **`color`** and **`label`**. Sizes use shared **`PrismSize`**: `small` \| `medium` \| `large` \| `huge` \| `gigantic`. Use **`asChild`** (Radix `Slot`) when the styled root must not be a native `<button>`. For thin native actions use `<button className="…">` with Tailwind tokens, or wrap with Radix/shadcn locally—there is no separate generic `Button` export.

Admin demo: **`/admin/prism/components/prism-button`** — **`PrismButtonDemo`** from **`@admin`** (packages/admin `prism-button.tsx`).

### PrismCard

Container for grouped content (shadcn-style slots). Subcomponents: **`PrismCardHeader`**, **`PrismCardTitle`**, **`PrismCardDescription`**, **`PrismCardAction`**, **`PrismCardContent`**, **`PrismCardFooter`**.

**Import:**

```typescript
import {
  PrismCard,
  PrismCardHeader,
  PrismCardTitle,
  PrismCardContent,
  PrismCardFooter,
} from "@ui";
```

**Example:**

```tsx
<PrismCard>
  <PrismCardHeader>
    <PrismCardTitle>Card Title</PrismCardTitle>
  </PrismCardHeader>
  <PrismCardContent>
    <p>Card content goes here</p>
  </PrismCardContent>
  <PrismCardFooter>
    <PrismButton color="blue" label="Action" variant="plain" />
  </PrismCardFooter>
</PrismCard>
```

### Read-only metadata chips

Small labels (timezone, commit SHA, etc.) use Tailwind bundles from **`source/prism-meta-chip.ts`**: **`PRISM_META_CHIP_OUTLINE_CLASS`**, **`PRISM_META_CHIP_SECONDARY_CLASS`**, and optional **`PRISM_META_CHIP_INTERACTIVE_CLASS`** when the chip sits inside `<a>`. Use **`PrismButton`** for actions—there is no separate badge component.

**Import:**

```typescript
import {
  PRISM_META_CHIP_OUTLINE_CLASS,
  PRISM_META_CHIP_SECONDARY_CLASS,
} from "@ui";
```

**Example:**

```tsx
<span className={PRISM_META_CHIP_OUTLINE_CLASS}>Published</span>
<span className={PRISM_META_CHIP_SECONDARY_CLASS}>Draft</span>
```

### PrismDivider

Horizontal section rule for **flex-safe** layouts (full-width bar `div`, not `<hr>`, so it behaves under **`PrismLayoutMain`** / `.content-main`). **Variant axes** (see [Prop Ergonomics](#prop-ergonomics--variant-axes)): **`lineWeight`**, **`tone`**, **`spacing`**; **`roundedBar`** is a boolean (pill bar when `true`). Semantic line colour uses **`tone`** (not **`color`** / `ColorName`). Optional **`lineClassName`** / **`lineStyle`** for gradients or overrides. Center content: **`emblem`** (React node) wins, else **`letter`** (first character via **`PrismTypography`**), else **`iconName`** with **`iconSize`**, **`iconWeight`**, **`iconFill`** matching **`PrismIcon`**. **`surfaceClassName`** defaults to **`bg-background`** so the emblem disc visually cuts the line—use **`bg-card`** when the parent surface is a card.

**Import:**

```typescript
import { PrismDivider } from "@ui";
```

**Example:**

```tsx
<PrismDivider spacing="comfortable" lineWeight="thin" tone="default" />
<PrismDivider
  lineWeight="medium"
  tone="primary"
  roundedBar
  letter="G"
/>
```

Exports: **`PrismDivider`**, **`PrismDividerProps`**, **`prismDividerRootVariants`**, **`prismDividerBarVariants`**, line/tone/spacing type aliases.

Admin demo: **`/admin/prism/components/prism-divider`** — **`PrismDividerDemo`** from **`@admin`** (same interactive pattern as **`PrismButtonDemo`**).

### PrismCodeBlock

Read-only code panel: language chip **inside** top-right, copy **inside** bottom-right (optional via **`disableCopyButton`**), optional line-number gutter, and syntax hint coloring for seven languages. Pass a Material **family name** (no shade) as **`color`** (e.g. **`purple`**). Keywords, tags, and braces use that family’s shade ramp; **string** uses the ring family at **+1**, **property** at **−1**, **number** at **−2** (e.g. **purple → deep-purple, pink, red**) so accents sit as **tonal neighbours** on the ordered hue list. Every color resolves to **`var(--color-{family}-{n})`** in **`colors.css`**. When **`mode="card"`**, the panel wash uses the same family at **50** (light, with a half-`white` veil) and **900** (dark). **`mode="transparent"`** skips the panel fill. Unknown family strings fall back to **`blue`**.

**`children: string` is a deliberate constraint** — content between tags only (template literal or variable). This keeps the data model unambiguous: the string is both what is rendered and what is copied to the clipboard.

**Import:**

```typescript
import { PrismCodeBlock } from "@ui";
```

**Minimal usage:**

```tsx
<PrismCodeBlock language="tsx">{snippet}</PrismCodeBlock>
```

**Override example:**

```tsx
<PrismCodeBlock
  language="tsx"
  mode="transparent"
  disableLineNumbers
  disableLanguageLabel
  characterMaxWidth={240}
>
  {snippet}
</PrismCodeBlock>
```

**More examples:**

```tsx
// JavaScript
<PrismCodeBlock language="js">{`const total = items.reduce((a, b) => a + b, 0);`}</PrismCodeBlock>

// TypeScript
<PrismCodeBlock language="ts">{`type User = { id: string; name: string };`}</PrismCodeBlock>

// HTML (default mode="card")
<PrismCodeBlock language="html">
  {`<section><h1>Hello</h1><p>World</p></section>`}
</PrismCodeBlock>

// Markdown, no line numbers
<PrismCodeBlock language="markdown" disableLineNumbers>
  {`# Title\n\n- One\n- Two`}
</PrismCodeBlock>

// CSS, wider clamp
<PrismCodeBlock language="css" characterMaxWidth={160}>
  {`.button { display: inline-flex; gap: 8px; }`}
</PrismCodeBlock>

// JSON, no language chip
<PrismCodeBlock language="json" disableLanguageLabel>
  {`{ "id": "abc", "enabled": true }`}
</PrismCodeBlock>

// Unknown language → plain monospace, chip still shows label
<PrismCodeBlock language="python">{`print("hello")`}</PrismCodeBlock>

// No language → inherits page defaults, chip shows "code"
<PrismCodeBlock>{dump}</PrismCodeBlock>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `string` | required | Code body; rendered, highlighted, and copied verbatim |
| `language` | `string` | — | Optional. Drives label, `aria-label`, and highlighter selection |
| `mode` | `"card"` \| `"transparent"` | `"card"` | **`card`**: Material wash from **`color`** (light: step **50** + **50%** `white` veil; dark: **900**; **`grey`** uses **100** / **900**). **`transparent`**: no panel background (see [Color & Surface Inheritance](#color--surface-inheritance)) |
| `surfaceClassName` | `string` | — | Extra classes merged on the outer panel shell |
| `disableLineNumbers` | `boolean` | `false` | Hides the faint line-number gutter |
| `disableLanguageLabel` | `boolean` | `false` | Hides the small mono language chip |
| `characterMaxWidth` | `number` \| `null` | `80` | Panel width is `min(100%, Nch)` so wide layouts grow up to **N** monospace characters; `null` removes the cap |
| `color` | Material family string | `"blue"` | Kebab-case name only (e.g. **`purple`**, **`deep-purple`**). Token ramp from that family; accents use ring **+1** / **−1** / **−2**. See `buildSyntaxTokenMapFromFamily` in `prism-code-block.tsx`. Invalid values fall back to **`blue`**. **`grey`** maps to a neutral grey-only ramp |
| `disableCopyButton` | `boolean` | `false` | When **`true`**, the copy control is not rendered |
| `className` | `string` | — | Root wrapper |

**Syntax token → color roles** (accent families are **ring neighbours**: +1 / −1 / −2 from **`color`**; comments and punctuation use fixed neutrals):

| Token category | Role | Used for |
|---|---|---|
| keyword | Primary family, strong shades | `const`, `type`, `#` headings |
| string | Ring **+1** family | `"…"`, `'…'`, template backticks |
| comment | `blue-grey` | `//`, `/* */`, `<!-- -->` |
| tag / element | Primary family | `<div>`, `<Component>` |
| property / attribute | Ring **−1** family | prop names, CSS properties |
| number / literal | Ring **−2** family | `42`, numeric literals |
| brace | Primary family | `{` `}` blocks |
| punctuation | `grey` | `<`, `/>`, separators |
| plain | (inherits `text-foreground`) | identifiers, prose |

When adding a new language, map its token categories to this same table so colors stay consistent across highlighters.

**Highlighted languages (v1):** `tsx`, `ts`, `js`, `html`, `markdown`, `css`, `json`. Any other `language` value renders plain monospace — the chip and `aria-label` still use the string you passed.

**Copy `aria-label`:** `Copy ${language}` when language is set; `Copy code` when omitted.

**Exports:** `PrismCodeBlock`, `PrismCodeBlockProps`, `PrismCodeBlockMode`, `PrismCodeBlockHighlightLanguage`, `PrismCodeBlockSyntaxColorFamily`, `PRISM_CODE_BLOCK_MATERIAL_COLOR_FAMILIES`.

Admin demo: **`/admin/prism/components/prism-code-block`** — **`PrismCodeBlockDemo`** from **`@admin`** — section titles use **`PrismTypography`** **sans** with **`typography-title-large`** + **bold** for **Customize** and **`typography-title-small`** + **bold** for **Example** and **CodeBlock**. **Example** follows **Customize** (language sample, mode, **`color`**, width, toggles, **`disableCopyButton`**). **CodeBlock** shows generated JSX that **updates with Customize** (so matching props can be copied), but the **preview chrome is fixed**: **`language="tsx"`**, **line numbers on**, **language chip on**, **`mode="card"`**, **`color="grey"`**, copy on, **monospace** body — it does not mirror mode / color / width / checkbox state visually.

### PrismIcon

Material Symbols Rounded glyph wrapper. `name` is the ligature name (e.g. `"home"`, `"cable_car"`) from the Material Symbols name set. **`size`** uses the same **`PrismSize`** named steps as **PrismButton** (`small` \| `medium` \| `large` \| `huge` \| `gigantic`; maps to pixel heights in the component, with **opsz** clamped 20–48) or a **raw pixel number** for layout-driven sizing. **`weight`** is `"light"` \| `"thin"` \| `"regular"` \| `"bold"` \| `"heavy"` (named steps map to **wght** 100 / 200 / 400 / 600 / 700) or any raw **wght** integer **`100`–`700`** — use a number when you need a step not covered by the five names (for example **300** between thin and regular). **`fill`** is `"on"` \| `"off"` (FILL axis). The **GRAD** axis is fixed at `0` (no `grade` prop).

**Import:**

```typescript
import { PrismIcon } from "@ui";
```

**Props (`PrismIconProps`):** `name`, `size`, `weight`, `fill`, optional **`color`** (`PartialPrismColorSpec` — solid via **`prismColorSpecToHex`**; **`gradient.swatches`** via **`prismColorSpecToIconGlyphPaint`** + background-clip text because `color` cannot be a gradient), `className`.

**Example:**

```tsx
<PrismIcon name="home" size="medium" weight="regular" fill="off" />
<PrismIcon
  name="settings"
  size="large"
  weight="regular"
  fill="off"
  color={{ swatchPrimary: "indigo", shade: 500 }}
/>
<PrismIcon name="favorite" size="medium" weight="regular" fill="on" />
<PrismIcon name="star" size="large" weight="light" fill="off" />
```

**Shared vocabulary:** **PrismIcon** and **PrismButton** use the same **`PrismSize`** literals; **PrismTypography** uses the same size tokens for the type scale.

Admin demo: **`/admin/prism/components/prism-icon`** — **`PrismIconDemo`** from **`@admin`**. **Customize** adds names to the Example strip, includes **`PrismColorPicker`** for **`color`**, toggles **size** / **weight** / **fill**, then **Example**, **Code sample** (first preview icon + emitted `color` block), and **All icon names** (separate grid filter; click a cell to copy JSX, toast feedback).

### Layout wrappers (`prism-layout.tsx`)

Width bands and breakout sections (see `styles/layout-wrappers.css`): **`PrismLayoutText`**, **`PrismLayoutMain`**, **`PrismGraphicsMain`**, **`PrismGraphicsLarge`**, **`PrismGraphicsFull`**, **`PrismLayoutBreakout`**, **`PrismLayoutWrapperBar`**, **`PrismLayoutWrappersReference`**. Type **`PrismLayoutWrapperBarVariant`** for reference-bar variants.

## Fonts

The UI package includes four custom font families configured for Next.js.

### Available Fonts

1. **Satoshi** - Sans-serif variable font (weights: 300-900)
2. **Sentient** - Serif variable font (weights: 200-800)
3. **Zodiak** - Serif variable font (weights: 100-900)
4. **Gambarino** - Display font (weight: 400, regular only)

### Using Fonts

**Import:**

```typescript
import { satoshi, sentient, zodiak, gambarino } from "@ui";
```

**In Layout:**

```tsx
import { satoshi } from "@ui";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${satoshi.variable} antialiased`}>{children}</body>
    </html>
  );
}
```

**CSS Variables:**
Each font exports a CSS variable that can be used in your styles:

- `--font-satoshi` - Satoshi font family
- `--font-sentient` - Sentient font family
- `--font-zodiak` - Zodiak font family
- `--font-gambarino` - Gambarino font family

**Using in CSS:**

```css
.my-heading {
  font-family: var(--font-sentient);
  font-weight: 600;
}
```

**Using in Tailwind:**
The fonts are configured in `globals.css` and available via Tailwind utilities:

```tsx
<h1 className="font-sans">Uses Satoshi</h1>
<p style={{ fontFamily: "var(--font-sentient)" }}>Uses Sentient</p>
```

### Font Configuration Details

All fonts use Next.js `localFont` with:

- `display: "swap"` - Optimizes font loading
- CSS variable exports - For use in CSS/Tailwind
- Variable font support - Multiple weights in single file

## Global Styles

The `packages/ui/styles/globals.css` file contains:

### Theme Variables

CSS custom properties for colors, spacing, and other design tokens:

**Color System:**

- `--background` / `--foreground` - Base colors
- `--primary` / `--primary-foreground` - Primary brand colors
- `--secondary` / `--secondary-foreground` - Secondary colors
- `--muted` / `--muted-foreground` - Muted/subtle colors
- `--accent` / `--accent-foreground` - Accent colors
- `--destructive` - Error/destructive actions
- `--border` / `--input` / `--ring` - Form and border colors
- `--card` / `--card-foreground` - Card component colors
- `--popover` / `--popover-foreground` - Popover colors
- `--sidebar-*` - Sidebar component colors
- `--chart-1` through `--chart-5` - Chart color palette

**Spacing & Radius:**

- `--radius` - Base border radius (0.625rem)
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` - Variants

**Dark Mode:**
All color variables have dark mode variants defined in `.dark` class.

### Typography Utilities

**Font family (sans / serif / mono):**

- `.font-sans` – Prism sans (Satoshi)
- `.font-serif` – Prism serif (Sentient)
- `.font-mono` – Monospace stack (ui-monospace, SF Mono, Menlo, …)

Use on any element to set `font-family` to the bound Prism variable.

**Type scale classes** (implementation layer — prefer the component below in app code):

- `.typography-{role}-{size}` for each combination of `role` ∈ `display` | `headline` | `title` | `body` | `label` | `overline` and `size` ∈ `small` | `medium` | `large` | `huge` | `gigantic` (30 rules total).

### PrismTypography component

Use `<PrismTypography>` from `@ui` instead of applying `typography-*` or ad-hoc `text-*` / `font-*` on raw `h*` / `p` / `span` for the Prism type scale. Prefer the **`tone`** prop or `className` for semantic colour (e.g. `tone="muted"` or `className="text-muted-foreground"`), plus spacing utilities as needed.

**Exports:** `PrismTypography`, `PrismTypographyProps`, `PrismTypographyRole`, `PrismTypographySize`, `PrismTypographyFont`, `PrismTypographyTone`, `PrismTypographyAnimationZone`, `PrismTypographyAnimationKind`, `PRISM_TYPOGRAPHY_ROLES`, `PRISM_TYPOGRAPHY_SIZES`.

**Props (`PrismTypographyProps`):**

- `role` (required): `display` | `headline` | `title` | `body` | `label` | `overline`
- `size` (optional): `small` | `medium` | `large` | `huge` | `gigantic` — defaults to `medium`
- `tone` (optional): maps to shadcn-style `text-*` tokens (`foreground`, `muted`, `primary`, …); default `inherit`
- `font` (optional): `sans` (default) | `serif` | `mono` — maps to `.font-serif` / `.font-mono`
- `fontFamily` (optional): inline CSS stack; when set, `font` classes are not applied
- `animationZone` / `animationKind` (optional): scroll-reveal via GSAP (`SplitText`); see source for defaults when a zone is set without a kind
- `as` (optional): override the rendered element for semantics or layout

**Default element per role × size:** `display` / `headline` → `h1`–`h3` by size; `title` → `h4`–`h6` by size; `body` → `p`; `label` / `overline` → `span`. **Overline** styles (uppercase, semibold, letter-spacing, block) live in `.typography-overline-*`. Use `className` (e.g. `inline`) if you need non-block overlines.

**Example:**

```tsx
import { PrismTypography } from "@ui";

<PrismTypography role="headline" size="large">Heading 1</PrismTypography>
<PrismTypography role="body" size="medium" tone="muted">
  Body text
</PrismTypography>
<PrismTypography role="overline" size="small" tone="muted">
  Section label
</PrismTypography>
```

**Exception:** when semantic `code` is needed with scale styling, use `<PrismTypography as="code" ...>`.

### Layout Wrappers

Named width wrappers for content vs graphics (defined in `styles/layout-wrappers.css`). Widths use Tailwind breakpoint values (px), centered with `margin-inline: auto` except graphics-full:

- **`.content-text`** – sm 640px. Use for narrow text columns, captions.
- **`.content-main`** – xl 1280px. Use for main content, headers, controls.
- **`.graphics-main`** – xl 1280px. Use for charts/visuals that match content width.
- **`.graphics-large`** – 2xl 1536px. Use for wider charts and visuals.
- **`.graphics-full`** – Full width, edge to edge. Use for full-bleed sections.

**Example:**

```tsx
<div className="content-main">…text and controls…</div>
<div className="graphics-large"><LineChart … /></div>
```

### Base Styles

The `@layer base` section includes:

- Global border and outline styles
- Body background and text color
- Heading (h1-h6) default styles
- Material Symbols font configuration

## Integration in Apps

### Setting Up Fonts

In your app's root layout (`app/layout.tsx`):

```tsx
import { satoshi } from "@ui";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${satoshi.variable} antialiased`}>{children}</body>
    </html>
  );
}
```

### Using Components

Simply import and use:

```tsx
import {
  PrismButton,
  PrismCard,
  PrismCardContent,
  PrismCardHeader,
  PrismCardTitle,
} from "@ui";

export default function MyPage() {
  return (
    <PrismCard>
      <PrismCardHeader>
        <PrismCardTitle>Welcome</PrismCardTitle>
      </PrismCardHeader>
      <PrismCardContent>
        <PrismButton color="blue" label="Get Started" variant="plain" />
      </PrismCardContent>
    </PrismCard>
  );
}
```

### App-Specific Styles

Each app has its own `globals.css` that:

1. Imports Prism's base styles from the UI package
2. Adds `@source` directives to scan app-specific files
3. Can extend or override UI package styles

**Example `apps/web/ui/styles/globals.css`:**

```css
/* Import Prism's base styles (includes Tailwind + all package scanning) */
@import "ui/styles/globals.css";

/* Scan app-specific files */
@source "../**/*.{ts,tsx,js,jsx,mdx}";
```

**Key Benefits:**

- **Location Independence**: Apps never use relative paths to packages - all scanning happens in `ui/styles/globals.css`
- **Rails-like Framework**: One import gives you everything (Tailwind, theme, components, all package scanning)
- **Works Everywhere**: The UI package's `@source` paths work in both monorepo and standalone:
  - Monorepo: `../../utilities` from `packages/ui/styles/` → `packages/utilities/`
  - Standalone: `../../utilities` from `node_modules/ui/styles/` → `node_modules/utilities/`
- **Future-Proof**: Works with npm packages, git submodules, or monorepo workspaces

## Package Dependencies

The UI package depends on:

- `react` - React framework
- `next` - Next.js (for `localFont`)
- `class-variance-authority` - Component variant management
- `clsx` - Conditional class names
- `tailwind-merge` - Tailwind class merging
- `lucide-react` - Icon library (if used)
- `utilities` - Workspace package for `cn` utility

## Development

### Adding New Components

1. Create component file in `packages/ui/components/`
2. Export from `packages/ui/components/index.ts` (re-exported by `packages/ui/source/index.ts` for the package)
3. Follow existing component patterns
4. Use `cn` utility from `utilities` package for class merging

### Adding New Fonts

1. Add font files to `packages/ui/fonts/`
2. Add font configuration to `packages/ui/styles/fonts.ts`
3. Export from `packages/ui/styles/index.ts`
4. Update documentation

### Package-Level CSS Architecture

Prism uses a **centralized CSS scanning** approach where the UI package handles all Tailwind source scanning:

```
packages/
├── ui/
│   └── styles/
│       └── globals.css          # Main styles + scans all Prism packages
├── admin/
│   └── source/                  # Scanned by ui/styles/globals.css
└── utilities/
    └── source/                  # Scanned by ui/styles/globals.css
```

**How it works:**

1. `packages/ui/styles/globals.css` contains all `@source` directives:

   ```css
   @source "../components/**/*.{ts,tsx}"; /* UI package */
   @source "../source/**/*.{ts,tsx}"; /* UI package (presets) */
   @source "../../utilities/source/**/*.{ts,tsx}"; /* Utilities package */
   @source "../../admin/source/**/*.{ts,tsx}"; /* Admin package */
   ```

2. These paths work in both contexts:
   - **Monorepo**: `../../utilities` from `packages/ui/styles/` → `packages/utilities/`
   - **Standalone**: `../../utilities` from `node_modules/ui/styles/` → `node_modules/utilities/`

3. Apps import `ui/styles/globals.css` once to get everything (Tailwind, theme, all package scanning)

4. Apps only need to scan their own files: `@source "../**/*.{ts,tsx,js,jsx,mdx}"`

**Benefits:**

- Apps never use relative paths to packages
- Each package is self-contained
- Works identically in monorepo and standalone contexts
- Rails-like: one import gives you the full framework

### Modifying Theme

Edit `packages/ui/styles/globals.css`:

- Update CSS variables in `:root` and `.dark`
- Add new utility classes in `@layer utilities`
- Modify base styles in `@layer base`

## Color & Surface Inheritance

Prism components follow a single rule: **inherit the page cascade by default; only break out of it when a `tone` prop explicitly requests a surface.**

This means a component placed on any page or inside any card renders in the ambient text and background colors without needing configuration. Overrides are opt-in.

### Semantic tokens

All Prism component styling uses CSS custom properties exposed as Tailwind utilities. Never use raw palette classes (`text-sky-600`, `bg-zinc-100`, hex, or oklch literals) in component source — doing so creates a parallel color system that breaks in dark mode and brand-theme contexts.

| Token | Role |
|---|---|
| `bg-background` / `text-foreground` | Page-level base |
| `bg-muted` / `text-muted-foreground` | Secondary UI — subtle panels, placeholders, line numbers |
| `bg-card` / `text-card-foreground` | Content container surfaces |
| `bg-primary` / `text-primary` | Brand accent — interactive emphasis, keywords |
| `bg-secondary` / `text-secondary-foreground` | Secondary accent |
| `text-foreground/{opacity}` | Semantic alpha tints (e.g. `/20` for gutters, `/80` for property names) |

### Surface `tone` axis

Components that render a visible background surface expose a `tone` prop:

- **`"muted"`** (default on most) — `bg-muted`. Utility surface: code blocks, input areas, subdued panels.
- **`"card"`** — `bg-card`. Content container surface: matches `PrismCard` and any `.card` background.
- **`"transparent"`** — no background applied; the component fully inherits the parent surface.

Use `surfaceClassName` for one-off overrides (gradient backgrounds, nested surfaces) without changing the `tone` axis.

**PrismCodeBlock** is an exception: it uses **`mode`** (`"card"` \| `"transparent"`), not `tone`. **`card`** applies a Material palette wash from **`color`**; **`transparent`** skips the panel fill.

### Light/dark

All CSS custom properties have dark mode variants under `.dark`. Components that use only semantic tokens automatically adapt — no per-component dark-mode CSS is needed.

---

## Prop Ergonomics & Variant Axes

Prism UI follows the industry pattern often called **variant axes** (discriminated variant props / cva-style recipes): each *orthogonal* visual concern is one **string-literal union prop**, not a pile of mutually exclusive booleans. That removes impossible states (for example `rectangle` and `rectangleRounded` both true) and keeps JSX self-explanatory.

### Why (short audit)

- **Boolean sprawl:** Mutually exclusive choices were modeled as parallel flags; callers could express invalid combinations.
- **Inconsistent negation:** Mix of `noXxx`, `XxxNo`, and positive animation flags. Prism standardizes motion opt-outs on **`disableXxx`** (MUI-style).
- **Name collisions:** `color` meant different things on `PrismButton` (palette) vs `PrismTypography` (semantic text) — typography now uses **`tone`**.
- **Fragmented size vocabulary:** One shared **`PrismSize`** (`small` \| `medium` \| `large` \| `huge` \| `gigantic`) applies to `PrismButton`, `PrismIcon` (named steps), and `PrismTypography` type scale. `normal` → `medium`; old `large2x` → `huge`. **`medium` stays size-only** — it does not appear on `PrismIcon` **`weight`** (avoids `size="medium" weight="medium"` confusion).

### Nine rules (cheat sheet)

1. **One concern → one union prop** when values are mutually exclusive.
2. **Booleans only** for independent flags (`disabled`, `loading`, `iconOnly`, …).
3. **Opt-outs:** `disableMotion`, `disableGrow`, … — not `noGrow` / `gapNo`.
4. **camelCase** prop names; **lowercase or camelCase** literals per existing Prism tokens (`gap="none"`, `shape="rectangleRounded"`).
5. **Shared `PrismSize`** everywhere Prism renders stepped scale (see `packages/ui/source/prism-size.ts`).
6. **Palette vs semantic colour:** `PrismButton` **`color`** = `ColorName`; `PrismTypography` **`tone`** = semantic `text-*` role.
7. **Prefer `asChild`** (Radix `Slot`) over ad-hoc span wrappers for composition.
8. **Admin + `@admin`** are the live JSX reference: `/admin/prism/components/[component]` drives **`PRISM_ADMIN_COMPONENT_REGISTRY`** (for example **`PrismButtonDemo`** in `packages/admin/source/prism-button.tsx`). Typography previews live in **`PrismTypographyDemo`** (`packages/admin/source/prism-typography.tsx`) — not on **`SystemSheetPage`** (the system sheet stays env/apps/components only).
9. **Docs stay canonical:** this section + per-component headings below; do not duplicate long prose in side files.

### Before → after (illustrative)

```tsx
// Before (booleans + legacy names)
<PrismButton
  rectangleRounded
  lineNo
  gapNo
  colorVariant="monochrome"
  noGrow
  asSpan
/>

// After (axes + Radix composition)
<PrismButton
  shape="rectangleRounded"
  line="none"
  gap="none"
  paint="monochrome"
  disableGrow
  asChild
/>
```

```tsx
// PrismTypography: semantic colour + animation axes
<PrismTypography role="body" size="medium" tone="muted" />
<PrismTypography
  role="headline"
  size="large"
  animationZone="line"
  animationKind="fadeIn"
/>
```

### Migration cheatsheet

| Old | New |
| --- | --- |
| `color` (on Typography) | `tone` |
| `colorVariant`, kebab paint literals | `paint` (camelCase union) |
| `lineNo` / `lineBottom` booleans | `line="none"` \| `"bottom"` \| `"full"` |
| `gapNo` | `gap="none"` |
| `rectangle` / `rectangleRounded` | `shape="rectangle"` \| `"rectangleRounded"` |
| `typeUppercase` / `typeLowercase` | `textCase="uppercase"` \| `"lowercase"` |
| `noGrow`, `noMotion`, … | `disableGrow`, `disableMotion`, … |
| `asSpan` | `asChild` |
| `size="normal"`, `large2x` | `size="medium"`, `size="huge"` |
| `PrismIcon` `weight="medium"` | `weight="regular"` or numeric |
| `explicitModeSegmentList` | `mode="explicit"` + `segments` |
| `PrismColorPicker` `isDisabled` | `disabled` |

### New component checklist

- Prefer **union axes** over boolean pairs for exclusive visuals.
- Reuse **`PrismSize`** if the component has a stepped scale aligned with buttons/icons/type.
- Motion opt-outs: **`disable*`** only.
- Export **`*Props`** types from the component module when consumers need them.
- Update **this file** and, if applicable, **`prism/.cursor/commands/NAMING.md`** in the same change.

---

## Naming Conventions (Option Names)

Prism UI and the admin demos use a **single canonical form** for option names so you only maintain one spelling. For the rationale and rules that govern new props, read **[Prop Ergonomics & Variant Axes](#prop-ergonomics--variant-axes)** above.

| Where                                 | Form                | Notes                                                                                                            |
| ------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Code** (keys, state, props)         | **camelCase**       | `gap="none"`, `disableGrow`, `paint="monochrome"`. This is the source of truth.                               |
| **Display labels** (button demo toggles) | **bare tokens**    | Same pattern as PrismIcon demo (see `packages/admin/source/prism-icon.tsx`).                                              |
| **DOM data attributes**               | **data-kebab-case** | PrismButton exposes semantic values (e.g. `data-gap="none"`, `data-line="bottom"`) via `camelToKebab`.        |

**Rules:**

- **Canonical = camelCase props** with explicit string unions where it helps (`line`, `gap`, `paint`, …).
- **Customizer labels** are short display strings aligned with those unions.
- **Data attributes = derived** from camelCase keys; values mirror the prop literals where applicable.

This keeps one list of option names (camelCase) and avoids drift between labels, props, and data attributes.

## Best Practices

1. **Import from `@ui` package** - Always use `import { Component } from "@ui"` not relative paths
2. **CSS imports use package names** - Use `@import "ui/styles/globals.css"` not relative paths like `../../../packages/ui/styles/globals.css`
3. **Use CSS variables** - Leverage theme variables for colors and spacing
4. **Follow variant patterns** - Use class-variance-authority for component variants
5. **Consistent styling** - Use Tailwind utilities and theme variables
6. **Type safety** - All components are fully typed with TypeScript
7. **Never hardcode package paths** - Apps should work identically in monorepo and standalone contexts

