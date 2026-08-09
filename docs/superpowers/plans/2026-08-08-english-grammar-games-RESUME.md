# Grammar Games — Resume Handoff

**Status: 12 of 16 tasks complete.** Branch `feat/grammar-games`, pushed to origin.
Suite green: 271 tests, exit 0. `tsc --noEmit` clean. `npm run lint` clean.

## How to resume

Say: *"resume the grammar games plan"*.

- **Plan:** `docs/superpowers/plans/2026-08-08-english-grammar-games.md`
- **Spec:** `docs/superpowers/specs/2026-08-08-english-grammar-games-design.md`
- **Worktree:** `.claude/worktrees/grammar-games` (has its own `node_modules`; the local ledger `.superpowers/sdd/progress.md` lives there but is gitignored)
- **Method:** `superpowers:subagent-driven-development` — one implementer subagent per task, then a task reviewer (spec + quality), fix loop until clean.

If the worktree is gone, recreate it from the branch — every commit is on origin.

## Completed (all reviewed clean)

| Task | Deliverable | Head commit |
|---|---|---|
| 1 | Rule catalog (11 rules) | `e41d79b` |
| 2 | Seeded RNG helpers | `07d41a4` |
| 3 | Plural form table | `c0a4cfc` |
| 4 | Verb form table | `302e66f` |
| 5 | b/d derivation + data integrity guard | `7ac72f3` |
| 6 | Mastery maths (sticky gold) | `a49e05c` |
| 7 | Adaptive rule scheduler | `90ae318` |
| 8 | Dexie v5 `ruleMastery` table | `92bb570` |
| 9 | `useRuleMastery` hook | `004da52` |
| 10 | Three game item builders | `c1b5e90` |
| 11 | Bed-anchor card + `grammar` i18n block | `cfc8ca3` |
| 12 | Shared 10-round drill engine | `ff32fe7` |

## Remaining

- **Task 13** — `GrammarHubPage` + `RuleChips`, exports `grammarProgress` (golds ÷ 11) and `gameStars`
- **Task 14** — wire the track in: `TopicSkillId` split in `skills.ts`, grammar tile in `EnglishHome`, `grammarPct` through `HomePage`, `/grammar` + `/grammar/:gameId` routes in `App.tsx`. **Nothing is reachable in the app until this lands.**
- **Task 15** — axe coverage for the hub and drill screens
- **Task 16** — end-to-end adaptive test, full verification, manual browser check

Then: final whole-branch review (most capable model), then `superpowers:finishing-a-development-branch`.

## Deviations from the plan already applied

Each is committed and the plan document has been updated to match:

1. `RuleMasteryRow` uses `childId`, not `profileId` — matches every other table.
2. Plural table stores ~55 exceptions with a `+s` default, guarded by a regex integrity test, rather than ~225 hand entries.
3. Verb sentences use *"the teacher / the teachers"*, not *"She / They"* — no gender data needed, and it reinforces plurals.
4. Grammar gets its own `/grammar` route instead of a branch inside `SkillHubPage`.
5. `boots`/`chips`/`shoes`/`socks` moved from `plural.tantum` to excluded — they have ordinary singulars; the plan was wrong.
6. `police-catch` verb entry dropped — `work.police` is excluded, so it could never be usable.
7. `breakRuns` rebuilt as a greedy max-count rearrangement — the plan's forward-only swap could not fix a run at the list tail.
8. `fake-indexeddb` added as a devDependency (approved) — the repo previously had no way to test real Dexie.

## Minor findings deferred to the final whole-branch review

- **T3:** `food.chicken` has no wordId exclusion; `pluralOf` claims *chickens* though the food sense is a mass noun. Harmless today (bucket dedup picks `animals.chicken`).
- **T5:** the "distractor is never a real vocabulary word" test currently passes vacuously — no b/d flip collides with today's vocabulary.
- **T6:** gold/weak threshold boundaries are under-tested; a `>` vs `>=` slip would pass all 15 tests. Implementation verified correct by hand.
- **T9 (Important):** `recordAttempt` is an unguarded read-modify-write; two rapid taps on the same rule could lose one attempt. Same pattern already shipped in `useWordProgress`. Consider a Dexie transaction.
- **T9:** `row.ruleId as RuleId` is an unchecked cast; a retired rule id in the DB would surface as an invalid key.
- **T10:** multi-seed invariant loops cover only 4 of 11 rules.

## Bug found in existing app code (fixed, commit `b2a6a7f`)

`src/english/vocab/components/answer-feedback.tsx` animated the wrong-answer shake as a 6-value keyframe array under a `spring` transition. Framer Motion v12 rejects this outright. That toast is the shared wrong-answer feedback for **every** activity in the app. Fixed by moving only the `x` shake onto a tween while other properties keep their spring; reduced-motion behaviour unchanged.

## Environment notes

- Run tests from inside the worktree. From the repo root, `npm run test` also walks the six nested worktrees under `.claude/worktrees/` and reports unrelated failures — that is pre-existing noise, not this branch.
- Another session was committing to the main checkout during this work, which is why this branch lives in an isolated worktree.
