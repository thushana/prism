---
name: planning
description: >-
  Draft implementation plans with Why, Success, How (phased), predefined
  commits, and a naming pass. Use when planning, in Plan mode, or when the
  user asks for an implementation plan.
disable-model-invocation: true
---

# Planning

Produce a light, agent-executable plan. Do not over-plan spikes or one-file fixes.

## Before drafting

1. **Read** [commitmessage](../commitmessage/SKILL.md) and [naming](../naming/SKILL.md). Do not copy their rules here; follow them when writing Commits and Names.
2. Surface **major design questions** before locking the plan. For each, state options with brief pros and cons, then recommend one. Do not bury open A-vs-B choices under How.
3. Ask at most 1–2 clarifying questions at a time when a decision would change the plan (including those design questions).

## Required sections

Use exactly these section headings (verbatim):

### Why are we making this change?

Problem today, needed outcomes, locked approach. Briefly note rejected alternatives and why (reuse the pros/cons from the design questions once decided).

### What does success look like?

Observable checks (`Verify:` where useful) and explicit non-goals.

### How are we going to make these changes?

Be detailed and phased and in a logical sequence as possible for an agent to execute on. Each phase ends with a gate. Put high-risk work early. Scale depth to risk.

### Commits

Predefined commit sequence. Each entry is a draft one-liner in **commitmessage** format (`Emoji ALL CAPS SLUG - description`), scoped to what that commit contains. Order must match Prism rules (Prism submodule commit before parent when both change). Mention version bump/tag only when commitmessage requires it. Every How phase maps to one or more commits; no orphan phases; no mega-commit mixing unrelated concerns.

### Names

List every new file, type, prop, or concept the plan introduces. Each must already satisfy **naming**. Execution must reuse these names — no parallel terms.

## Workflow

1. Read commitmessage and naming
2. Identify major design questions; present options with pros/cons and a recommendation; wait for decisions that would change the plan
3. Draft the three questions → Commits → Names (only locked choices — no open A-vs-B under How)
4. Naming pass: list new identifiers/paths; fix violations before presenting
5. Commit pass: map every phase to commits
6. Present via CreatePlan (or equivalent); keep the body concise

## Template

```markdown
# Title

## Why are we making this change?
...

## What does success look like?
- [ ] Criterion — Verify: ...
- Non-goals: ...

## How are we going to make these changes?
Be detailed and phased and in a logical sequence as possible for an agent to execute on.

### Phase N — ...
- Steps (files/actions)
- Gate: ...

## Commits
1. `✨ SLUG - ...` — covers Phase … (paths / scope)
2. ...

## Names
- `canonicalName` — meaning / where used
- `kebab-file-name.ts` — ...
```

## Out of scope for this skill

- Full copies of commitmessage / naming rules
- Mandatory red-green-refactor per step
- Parallel-wave / subagent executor machinery
