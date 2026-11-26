---
name: PLAN
description: >-
  Draft implementation plans with Why, Success, How (phased), predefined
  commits, and a naming pass. Use when planning, in Plan mode, or when the
  user asks for an implementation plan or /PLAN.
disable-model-invocation: true
---

# Plan

Produce a light, agent-executable plan for a **cold executor** who was not in the conversation. Lock decisions they cannot invent (files, names, verify commands). Do not over-plan spikes or one-file fixes.

**Scale:** small Next.js apps (TypeScript, React, Tailwind, Radix, Drizzle, Neon, Vercel) with Prism as the shared Rails-minded core. Not Google-scale — prefer powerful defaults over new infrastructure.

Prefer **DRY** and **YAGNI** — reuse what exists; do not plan speculative abstractions, optional features, or “while we’re here” scope. **Question every abstraction:** a new wrapper/helper/module must earn another file. Simple and clear beats clever. Ship, but craft matters. Prefer idiomatic TypeScript/React/Next already in the tree (Zod for external/config data, Tailwind over inline styles, small focused units).

## Before drafting

1. **Explore the codebase.** Read the relevant code, patterns, call sites, and upstream imports until you can explain how things work today and what this change would touch. Prefer looking over asking. When the change touches Prism shared surface or host conventions, check Prism’s `DOCS-Prism.md`, `CONVENTIONS-Prism.md`, and `ARCHITECTURE-Prism.md` under `docs/` from the Prism package root, or `prism/docs/` from a host app (and the host’s matching docs if present).
2. **Read** [REVIEW](../REVIEW/SKILL.md), [COMMIT](../COMMIT/SKILL.md), and [NAMING](../NAMING/SKILL.md). Do not copy their rules here; plans must be reviewable and committable under those skills.
3. Surface **major design questions** before locking the plan. For each, state options with brief pros and cons, then recommend one. Do not bury open A-vs-B choices under How. Prefer a concrete proposal they can correct over menus of obvious options. Ask at most 1–2 clarifying questions at a time, and only when the answer would change what gets built. Never ask what the request or codebase already answers.
4. **Spikes:** keep throwaway and shallow. Keeping spike code is a new request that goes back through planning.

## Required sections

Use exactly these section headings (verbatim):

### Why are we making this change?

Problem today, needed outcomes, locked approach. Briefly note rejected alternatives and why (reuse the pros/cons from the design questions once decided). Call out existing code/patterns you will reuse (DRY) and what you will deliberately not build (YAGNI). Call out pain deferred vs pain created if a technical choice will hurt later.

### What does success look like?

Observable checks (`Verify:` where useful), explicit non-goals, and **anti-goals** (what would count as failure even if it technically works). Include that the planned data flow works and that someone else could maintain this in six months.

### How are we going to make these changes?

Be detailed and phased and in a logical sequence as possible for an agent to execute on.

- Map **create/modify** file paths and responsibilities before phases.
- Each phase ends with a gate; put high-risk work early; scale depth to risk.
- Phase boundaries should be independently reviewable (a reviewer could reject one phase and keep its neighbor). Fold scaffolding into the phase that needs it.
- Question every new abstraction at plan time; fit our scale; stay idiomatic to the stack already in use.
- Decide; do not transcribe. No “TBD”, no full function bodies the signature + verify already determine, no plan longer than the code it describes.

### Commits

Predefined commit sequence. Each entry is a draft one-liner in **COMMIT** format (`Emoji ALL CAPS SLUG - description`), scoped to what that commit contains. Order must match Prism rules (Prism submodule commit before parent when both change). Every How phase maps to one or more commits; no orphan phases; no mega-commit mixing unrelated concerns.

**Interim vs final (push / bump / tag):**

- All but the last commit for a given repo in this plan are **interim**: local commit only (no push, no `package.json` bump, no `v*` tag). Mark those lines `interim`.
- Mark the **final** commit per repo that needs a release (usually the last Prism commit and/or the last parent commit in the list) with `final — bump + tag + push` so COMMIT applies semver once for the whole plan delta and pushes once (avoids thrashing GitHub / Fly / Vercel).
- Single-commit plans: that one commit is final (bump + tag + push), unless the change is `.cursor/`-only (then skip bump/tag per COMMIT; still push on final).
- Do not invent mid-plan tags or pushes. Net semver for the plan is decided on the final commit (higher bump wins if the delta mixes levels).

**Execution order (required):** after implementing each commit’s scope, run [REVIEW](../REVIEW/SKILL.md) on the unstaged changes, fix what it flags, then run [COMMIT](../COMMIT/SKILL.md). Never COMMIT before REVIEW.

### Names

List every new file, type, prop, or concept the plan introduces. Each must already satisfy **naming**. Prefer extending existing names over inventing parallel ones (DRY). Execution must reuse these names — no parallel terms.

## Workflow

1. Explore the codebase (and Prism/host docs when relevant); read review, commit, and naming
2. Identify major design questions; present options with pros/cons and a recommendation; wait for decisions that would change the plan
3. Draft the three questions → Commits → Names (only locked choices — no open A-vs-B under How)
4. Naming pass: list new identifiers/paths; fix violations before presenting
5. Commit pass: map every phase to commits; mark interim vs final (bump + tag + push only on final per repo); each commit step implies review → commit
6. Self-review: every success criterion maps to a phase; names consistent across phases; create/modify paths listed; DRY/YAGNI held; every new abstraction earned; data flow and six-month maintainability checked; plan is decisions not a transcript; scale-appropriate
7. Present via CreatePlan (or equivalent); keep the body concise

## Template

```markdown
# Title

## Why are we making this change?
...
Reuse: ...
Not building (YAGNI): ...
Pain deferred vs created: ...

## What does success look like?
- [ ] Criterion — Verify: ...
- Non-goals: ...
- Anti-goals: ...

## How are we going to make these changes?
Be detailed and phased and in a logical sequence as possible for an agent to execute on.

Files:
- Create: `path`
- Modify: `path` — responsibility

### Phase N — ...
- Steps (files/actions)
- Gate: ...

## Commits
1. `✨ SLUG - ...` — covers Phase … (paths / scope) — interim
   Then: review → commit
2. `♻️ SLUG - ...` — covers Phase … — interim
   Then: review → commit
3. `🔧 PRISM - Take Prism vX.Y.Z` / host wrap-up — final — bump + tag + push
   Then: review → commit

## Names
- `canonicalName` — meaning / where used
- `kebab-file-name.ts` — ...
```

## After the plan is approved

Hand off to [BUILD](../BUILD/SKILL.md) to execute: it shards independent work to subagents when safe, runs phase gates, then REVIEW → COMMIT per planned commit (honoring interim vs final markers).

## Out of scope for this skill

- Full copies of build / review / commit / naming rules
- Executing the plan (that is build)
- Mandatory red-green-refactor per step
- Speculative features, premature abstractions, or parallel names for the same concept
