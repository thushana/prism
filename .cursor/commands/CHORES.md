Run the monthly dependency and code-health ritual.

**Deterministic runner:** `pnpm run chores` from the app repo root (add `-- --pull`, `--quarterly`, `--help` as needed). Implemented in `prism/scripts/chores.ts`.

**Source of truth:** [PROJECT-HEALTH-Prism.md §6 — For agents](../../docs/PROJECT-HEALTH-Prism.md#for-agents-cursor--automation) (modes, guardrails, apply/commit steps). The script runs **report** steps only; apply-updates and commit remain manual or agent-driven.

**Working directory:** app repo root (directory that contains `prism/` for embedder apps).

**Mode** (infer from the user message; default `report-only`):

| User said | Mode |
|-----------|------|
| (nothing / `/CHORES` / chores / health pass) | `report-only` |
| `apply-updates`, “apply the updates”, named packages to bump | `apply-updates` (only what they approved) |
| `quarterly` | `quarterly` (+ `report-only` unless they also said apply) |
| “commit”, “push” | allow step 7 **only** when combined with an explicit apply or they confirm changes |

**Commits:** follow [COMMITMESSAGE.md](./COMMITMESSAGE.md) when the user asked to commit; submodule push order is in §6 step 7.
