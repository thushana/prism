# Documentation Philosophy

## The Rule

**Code is truth for *how*. Docs explain *why* and *what*.**

Every piece of knowledge gets one authoritative home. If it's in code, don't repeat it in docs.

## What Docs Should Do

| Type | Purpose | Max Length |
|------|---------|------------|
| README | "How do I run this?" | 1 page |
| ARCHITECTURE | "What's the mental model?" | 2-3 pages |
| DECISIONS | "Why did we choose X?" | 1 page each |

## Remove From Docs

- Version numbers → `package.json`
- Code examples → link to source
- API details → route handlers + TypeScript types
- Config values → config files
- Step-by-step guides → the code itself

## Keep In Docs

- **Why** decisions were made
- **What** the system does (mental model)
- **Where** things live
- **Constraints** that shaped design

## Structure

```
{project-root}/
├── README.md                              # Quick start (~50 lines)
└── docs/
    ├── ARCHITECTURE-{Project}.md          # Mental model (~200 lines)
    ├── GLOSSARY-{Project}.md              # Domain terms
    ├── CONVENTIONS-{Project}.md           # Code conventions
    └── decisions/
        └── 001-DECISION-{short-description}.md
```

## Decision Records

Document decisions, not implementation.

**Example:**

```markdown
# 001-DECISION-npm-workspaces-over-pnpm

## Context
We need a monorepo solution that works with Vercel and supports local file references.

## Decision
Use npm workspaces with local file references (`file:./packages/package-name`).

## Consequences
- ✅ Native npm support, no extra tooling
- ✅ Works out-of-the-box with Vercel
- ⚠️ Slower installs than pnpm (acceptable trade-off)
```

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Encyclopedia | 2000-line doc nobody reads | 200-line mental model + links |
| Duplicate | Version numbers in docs | Link to source file |
| Tutorial | Step-by-step that drifts | Code with JSDoc |
| Snapshot | Current state without why | Decision records |

## Inline Docs

Use JSDoc and TypeScript types. They stay with code, show in IDEs, and can't drift.

```typescript
/** Generates a new app from template. */
export async function generateApp(
  appName: string,
  options?: GenerateOptions
): Promise<string>
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
3. Is this *why*, not *how*?
4. Can I make it shorter?

**If you need extensive docs to understand code, improve the code.**