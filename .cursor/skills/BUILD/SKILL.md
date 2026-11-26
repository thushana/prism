---
name: BUILD
description: >-
  Execute an approved implementation plan: shard independent work to
  subagents when safe, run phases in order, verify gates, then
  REVIEW → COMMIT per planned commit. Use when building,
  implementing a plan, or the user asks to execute /BUILD.
disable-model-invocation: true
---

# Build

Partner to [PLAN](../PLAN/SKILL.md). The plan already did the thinking — **execute it**. You are the orchestrator: keep coordination in this session; give workers only what they need.

**Scale:** same as planning — small Next.js / Prism apps. DRY, YAGNI, question every abstraction. Prefer idiomatic patterns already in the tree.

## Prerequisites

1. An **approved** plan in planning shape (Why / Success / How / Commits / Names). If none exists, run [PLAN](../PLAN/SKILL.md) first — do not invent a shadow plan mid-build.
2. Read [PLAN](../PLAN/SKILL.md), [REVIEW](../REVIEW/SKILL.md), [COMMIT](../COMMIT/SKILL.md), [NAMING](../NAMING/SKILL.md), and [CHECK](../CHECK/SKILL.md).
3. Reuse the plan’s Names verbatim. Do not invent parallel terms.

## Orchestrator rules

- **Continuous execution.** Do not pause for “should I continue?” between phases. Execute until the plan is done or a stop condition hits.
- **Rulings, not stalls.** When the plan is ambiguous or slightly wrong, make the smallest decision that still satisfies Success, note it briefly (`Ruling: …`), and continue. Do not decide destructive, security-sensitive, or out-of-worktree side effects in secret — those stop you (below).
- **Evidence before “done.”** Run the phase Gate / Verify commands and read the output before claiming the phase is complete. Confidence is not evidence.
- **Keep the main context lean.** Prefer short worker summaries over dumping full logs or whole files back into this session.
- **Narrate lightly.** Progress belongs in todos and commit outcomes, not long status essays.

### Stop and ask (only these)

1. Irreversible or destructive operations  
2. Security-sensitive actions  
3. Side effects outside this worktree that norms say to confirm (merge, push to shared branch, publish) — unless the user already ordered commit/push via COMMIT, or this is the plan’s **final** commit (which pushes once)  
4. Plan so broken that every path forward is a guess → return to [PLAN](../PLAN/SKILL.md)  

## Shard decision

Before each How phase (or within a phase that has independent steps), classify work:

| Situation | Mode |
|-----------|------|
| One small phase, same files, or tight sequential deps | **Inline** in this session |
| Independent steps, **disjoint files**, no shared mutable state | **Parallel subagents** (`Task` / `generalPurpose`) |
| Broad “how does X work?” before coding | **Explore** subagent(s); synthesize, then build |
| Fresh eyes on a finished commit scope | **review** (this session or a read-focused subagent); never skip before COMMIT |
| Same file touched by two workers | **Never parallel** — one owner |

**Parallel rules (pragmatic):**

- Shard only when file sets do not overlap and Success does not require ordering.
- Each worker prompt is self-contained: phase goal, exact files, Names, Gate/Verify, relevant plan excerpts — **not** the whole chat history.
- Workers return: status, files changed, verify command + result, concerns/rulings. No novel architecture.
- Integrate results yourself; resolve conflicts inline before the next phase.
- Prefer a cheaper/faster model for mechanical, fully-specified shards when the harness allows; keep judgment and integration here.
- If the harness cannot run subagents, run inline — never fake a dispatch.

**Do not shard** tiny fixes, single-file work, or steps where phase N+1 needs N’s full in-session understanding.

## Execution loop

1. **Load the plan.** Create todos from How phases / Commits (one todo per phase or per planned commit, whichever is finer).
2. **Pre-flight.** Skim for shared files or interface mismatches across upcoming parallel shards. Sequentialize anything that shares files. Note `Pre-flight: …` only if something changed.
3. **For each phase (dependency order):**
   - Mark todo in progress.
   - Choose inline vs parallel shards (above).
   - Implement only what the phase names. No drive-by refactors. No speculative files (YAGNI).
   - Run the phase **Gate** / Success Verify for that slice; read the output.
   - If the gate fails: fix or debug; do not mark complete.
   - If the plan is wrong: smallest ruling, continue (or stop if condition 4).
4. **For each planned commit** (after its phase scope is green):
   - Run `pnpm run quality:quick` so formatting, lint, and type fixes land in this commit, not a straggler.
   - Run [REVIEW](../REVIEW/SKILL.md) on uncommitted changes; fix Critical / Important.
   - Run [COMMIT](../COMMIT/SKILL.md) (commit / push / version rules live there). Honor the plan’s **interim vs final** markers: local commit only on interim; bump + tag + push only on final.
   - Never COMMIT before REVIEW.
5. **After all commits:** run the full [CHECK](../CHECK/SKILL.md) (adds knip, tests, and the partner repo). If it changes anything, fix, REVIEW, and COMMIT as a follow-up that **may push** (so CI sees the green tree once — fold into the plan’s final commit when possible).
6. **Close out.** Summarize: what shipped, rulings made, any deferred minors. Point at commits. Do not reopen planning unless Success is unmet.

## Worker brief (when dispatching)

Give each implementer subagent:

1. One line: where this shard fits in the plan  
2. Exact goals and **non-goals** for this shard  
3. Create/modify paths and Names (verbatim)  
4. Gate / Verify command and what “pass” looks like  
5. Constraints: DRY, YAGNI, no new abstractions unless the plan named them; follow existing patterns  
6. Report format: `DONE | DONE_WITH_CONCERNS | BLOCKED` + files + verify evidence + concerns  

Implementers do **not** run COMMIT (orchestrator does, after REVIEW). Implementers do **not** spawn their own reviewers.

## Partner skills

| Skill | Role in build |
|-------|----------------|
| [PLAN](../PLAN/SKILL.md) | Source of truth for scope and sequence |
| [NAMING](../NAMING/SKILL.md) | Locked identifiers |
| [REVIEW](../REVIEW/SKILL.md) | Required before every commit |
| [COMMIT](../COMMIT/SKILL.md) | Required after review |
| [CHECK](../CHECK/SKILL.md) | End-of-build (and anytime a gate names it) |

## Out of scope for this skill

- Writing or rewriting the plan (that is PLAN)
- Mandatory TDD / red-green on every step (use gates the plan named)
- Superpowers-style ledger scripts, worktree mandates, or per-task reviewer ceremony
- Parallel edits to the same files
- Speculative features or abstractions not in the plan
