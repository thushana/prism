---
name: CHORE
description: >-
  Run the monthly dependency and code-health ritual (report-only by default).
  Use when the user asks for /CHORE, monthly chores, or a health pass.
disable-model-invocation: true
---

# Chore

**Source of truth:** `PROJECT-HEALTH-Prism.md` §6 “For agents” — at `prism/docs/` from a host app, or `docs/` from the Prism root. Read it before acting; it defines modes, guardrails, the deliverable, and apply/commit steps. This skill only picks the mode.

**Deterministic runner:** `pnpm run chores` from the app repo root (`prism/scripts/chores.ts`). It runs the **report** steps only. Flags: `-- --pull`, `--quarterly`, `--skip-quality`, `--strict`, `--help`. Apply-updates and commit remain agent-driven.

**Working directory:** app repo root (directory that contains `prism/` for embedder apps).

**Mode** (infer from the user message; default `report-only`):

| User said | Mode |
|-----------|------|
| (nothing / `/CHORE` / chores / health pass) | `report-only` |
| `apply-updates`, “apply the updates”, named packages to bump | `apply-updates` (only what they approved) |
| `quarterly` | `quarterly` (+ `report-only` unless they also said apply) |
| “commit”, “push” | allow §6 step 7 **only** when combined with an explicit apply or they confirm changes |

**Deliverable (report-only):** the short sections listed in §6 (toolchain, git/submodule, outdated, dependency sync dry-run, audit, knip, quality, build, recommended next actions) and an explicit “no changes made”.

**Commits:** follow [COMMIT](../COMMIT/SKILL.md) when the user asked to commit.
