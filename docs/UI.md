# UI Package Documentation

The `packages/ui` package provides a unified UI system including React components, fonts, and global styles. All UI-related assets are consolidated in this single package for easier management and consistency.

## Package Structure

```
packages/ui/
├── source/              # React components
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── icon.tsx
│   └── index.ts        # Main exports (components + styles)
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
import { Button, Card, Badge, Icon } from "ui";
import { satoshi, sentient, zodiak, gambarino } from "ui";
```

## Components

### Button

A versatile button component with multiple variants and sizes.

**Import:**

```typescript
import { Button } from "ui";
```

**Variants:**

- `default` - Primary button style
- `secondary` - Secondary button style
- `outline` - Outlined button
- `ghost` - Minimal button with hover effect
- `destructive` - Destructive action button
- `link` - Link-style button

**Sizes:**

- `default` - Standard size
- `sm` - Small
- `lg` - Large
- `icon` - Square icon button

**Example:**

```tsx
<Button variant="default" size="default">Click me</Button>
<Button variant="outline" size="sm">Small</Button>
<Button variant="ghost" size="icon">
  <Icon name="settings" />
</Button>
```

### Card

A container component for grouping related content.

**Import:**

```typescript
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "ui";
```

**Example:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Badge

A small status indicator or label component.

**Import:**

```typescript
import { Badge } from "ui";
```

**Variants:**

- `default` - Primary badge
- `secondary` - Secondary badge
- `outline` - Outlined badge
- `destructive` - Destructive badge

**Example:**

```tsx
<Badge variant="default">New</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="outline">Published</Badge>
```

### Icon

A wrapper component for Material Symbols Rounded icons.

**Import:**

```typescript
import { Icon } from "ui";
```

**Props:**

- `name` - Icon name (Material Symbols name)
- `size` - Icon size in pixels (default: 24)
- `fill` - Whether icon should be filled (default: false)
- `weight` - Icon weight (100-700, default: 400)

**Example:**

```tsx
<Icon name="home" size={24} />
<Icon name="settings" size={32} fill />
<Icon name="favorite" weight={600} />
```

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
import { satoshi, sentient, zodiak, gambarino } from "ui";
```

**In Layout:**

```tsx
import { satoshi } from "ui";

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

MUI-style typography classes:

- `.typography-h1` through `.typography-h6` - Heading styles
- `.typography-subtitle1` / `.typography-subtitle2` - Subtitle styles
- `.typography-body1` / `.typography-body2` - Body text styles
- `.typography-button` - Button text style
- `.typography-caption` - Caption text style
- `.typography-overline` - Overline text style
- `.typography-label` - Label text style

**Example:**

```tsx
<h1 className="typography-h1">Heading 1</h1>
<p className="typography-body1">Body text</p>
<span className="typography-caption">Caption</span>
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
import { satoshi } from "ui";
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
import { Button, Card, CardContent, CardHeader, CardTitle } from "ui";

export default function MyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Get Started</Button>
      </CardContent>
    </Card>
  );
}
```

### App-Specific Styles

Each app has its own `globals.css` that:

1. Imports Tailwind CSS
2. Includes `@source` directives to scan workspace packages
3. Can extend or override UI package styles

**Example `apps/web/app/globals.css`:**

```css
@import "tailwindcss";
@source "../**/*.{ts,tsx,js,jsx,mdx}";
@source "../../../packages/ui/source/**/*.{ts,tsx}";
@source "../../../packages/utilities/source/**/*.{ts,tsx}";
```

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

1. Create component file in `packages/ui/source/`
2. Export from `packages/ui/source/index.ts`
3. Follow existing component patterns
4. Use `cn` utility from `utilities` package for class merging

### Adding New Fonts

1. Add font files to `packages/ui/fonts/`
2. Add font configuration to `packages/ui/styles/fonts.ts`
3. Export from `packages/ui/styles/index.ts`
4. Update documentation

### Modifying Theme

Edit `packages/ui/styles/globals.css`:

- Update CSS variables in `:root` and `.dark`
- Add new utility classes in `@layer utilities`
- Modify base styles in `@layer base`

## Best Practices

1. **Import from `ui` package** - Always use `import { Component } from "ui"` not relative paths
2. **Use CSS variables** - Leverage theme variables for colors and spacing
3. **Follow variant patterns** - Use CVA for component variants
4. **Consistent styling** - Use Tailwind utilities and theme variables
5. **Type safety** - All components are fully typed with TypeScript

## Examples

See `apps/admin/app/dev-sheet/page.tsx` for comprehensive examples of:

- All component variants
- Font usage and typography
- Theme variables
- Component combinations

## Migration Notes

If migrating from the old `packages/styles` and `packages/fonts` structure:

1. Update imports: `import { satoshi } from "styles"` → `import { satoshi } from "ui"`
2. Font paths are now relative to `packages/ui/fonts/`
3. All UI-related code is now in `packages/ui/`
