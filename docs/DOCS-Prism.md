# Documentation Philosophy

## The Rule

**Code is truth for _how_. Docs explain _why_ and _what_.**

Every piece of knowledge gets one authoritative home. If it's in code, don't repeat it in docs.

## What Docs Should Do

| Type         | Purpose                    | Max Length  |
| ------------ | -------------------------- | ----------- |
| README       | "How do I run this?"       | 1 page      |
| ARCHITECTURE | "What's the mental model?" | 2-3 pages   |
| DECISIONS    | "Why did we choose X?"     | 1 page each |

## Remove from Docs

- Version numbers → `package.json`
- Code examples → link to source
- API details → route handlers + TypeScript types
- Config values → config files
- Step-by-step guides → the code itself

## Keep in Docs

- **Why** decisions were made
- **What** the system does (mental model)
- **Where** things live
- **Constraints** that shaped design

## Structure

```
{project-root}/
├── README.md                              # Quick start (~50 lines)
└── docs/
    ├── ARCHITECTURE-{Project}.md          # Mental model (keep lean; link to code)
    ├── DOCS-Prism.md                      # This file (Prism submodule / template)
    ├── CONVENTIONS-{Project}.md           # Naming, URLs, quality commands, component hierarchy
    ├── ADMIN-Prism.md                     # Admin section pattern (auth, shell, routes)
    ├── DATABASE-{Project}.md              # Drizzle / DB mental model (Prism)
    ├── DEPLOYMENT-{Project}.md            # Vercel / env (Prism)
    ├── FEATUREFLAGS-{Project}.md          # Feature flags package (Prism)
    ├── GLOSSARY-{Project}.md              # Domain terms (optional)
    ├── SYNC-{Project}.md                  # Submodule sync (child apps)
    └── decisions/
        └── 001-DECISION-{short-description}.md
```

## Decision Records

Document decisions, not implementation.

**Example:**

```markdown
# 001-DECISION-pnpm-workspaces

## Context

We need a monorepo solution that works with Vercel, supports local `file:` references, and keeps installs reproducible.

## Decision

Use **pnpm** workspaces with local file references (`file:./packages/package-name`).

## Consequences

- ✅ Fast, content-addressable store; strict dependency layout
- ✅ `packageManager` field pins the pnpm version
- ⚠️ Contributors must use pnpm (document in README)
```

## Anti-Patterns

| Pattern      | Problem                    | Fix                           |
| ------------ | -------------------------- | ----------------------------- |
| Encyclopedia | 2000-line doc nobody reads | 200-line mental model + links |
| Duplicate    | Version numbers in docs    | Link to source file           |
| Tutorial     | Step-by-step that drifts   | Code with JSDoc               |
| Snapshot     | Current state without why  | Decision records              |

## Inline Docs

Use JSDoc and TypeScript types. They stay with code, show in IDEs, and can't drift.

```typescript
/** Generates a new app from template. */
export async function generateApp(
  appName: string,
  options?: GenerateOptions
): Promise<string>;
```

## Update Docs When

✅ Architecture changes  
✅ New decisions  
✅ Breaking changes  
❌ Version bumps  
❌ Code changes

## The Test

Before writing docs, ask:

1. Is this already in code?
2. Can I link instead of copy?
3. Is this _why_, not _how_?
4. Can I make it shorter?

**If you need extensive docs to understand code, improve the code.**
