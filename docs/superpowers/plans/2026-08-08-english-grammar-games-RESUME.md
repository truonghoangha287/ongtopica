# Grammar Games — Complete

**Status: all 16 tasks done, plus the final review pass.**
Suite green: 298 tests across 46 files, exit 0. `tsc --noEmit` clean, `npm run lint`
clean, `npm run build` succeeds. Verified by hand in the browser.

- **Plan:** `docs/superpowers/plans/2026-08-08-english-grammar-games.md`
- **Spec:** `docs/superpowers/specs/2026-08-08-english-grammar-games-design.md`

## What shipped

A fourth English skill track — **🪄 Grammar** — with three games driven by one
shared 10-round adaptive drill engine that tracks mastery per grammar rule:

| Game | Rules | Question |
|---|---|---|
| One or Many | the 6 plural rules | plural quantity shown by repeating the picture |
| Who Does What? | the 4 verb-agreement rules | fill the blank in a sentence |
| b or d | `letter.bd` | real word vs its b/d flip, behind the bed-anchor card |

Mastery lives in a new Dexie `ruleMastery` table at `version(5)`, one row per
child per rule. The hub doubles as the parent view: 11 chips, one per rule,
each showing gold / weak / learning / unseen plus a live accuracy figure.

## Task commits

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
| 13 | `GrammarHubPage` + `RuleChips` | `4805ccb` |
| 14 | Track wired into home, routes, skill types | `da770bc` |
| 15 | axe coverage for hub + drill screens | `08ba38f` |
| 16 | Adaptive behaviour end to end | `66345f8` |
| — | Final review: six deferred findings closed | `23ad334` |

## Deviations from the plan, all deliberate

The plan document has been updated to match each of these:

1. `RuleMasteryRow` uses `childId`, not `profileId` — matches every other table.
2. Plural table stores ~55 exceptions with a `+s` default, guarded by a regex
   integrity test, rather than ~225 hand entries.
3. Verb sentences use *"the teacher / the teachers"*, not *"She / They"* — no
   gender data needed, and it reinforces plurals.
4. Grammar gets its own `/grammar` route instead of a branch inside `SkillHubPage`.
5. `boots`/`chips`/`shoes`/`socks` moved from `plural.tantum` to excluded — they
   have ordinary singulars; the plan was wrong.
6. `police-catch` verb entry dropped — `work.police` is excluded, so it could
   never be usable.
7. `breakRuns` rebuilt as a greedy max-count rearrangement — the plan's
   forward-only swap could not fix a run at the list tail.
8. `fake-indexeddb` added as a devDependency (approved) — the repo previously
   had no way to test real Dexie.
9. **Task 14 touched a fourth file the plan did not list.** The `TopicSkillId`
   split also broke `src/pages/TopicActivitiesPage.tsx`; it now redirects to
   `/grammar` the same way `SkillHubPage` does.
10. **Two hub tests query by role, not text.** "b or d" is both a game title and
    the `letter.bd` chip label, so the plan's `getByText` matched two elements.

## Final review — all six deferred findings closed (`23ad334`)

| Was | Now |
|---|---|
| **T9 (Important)** `recordAttempt` was an unguarded read-modify-write; the drill engine fires it without awaiting, so overlapping answers on one rule lost attempts | wrapped in a Dexie `rw` transaction. Regression test proves it: without the transaction, 3 concurrent calls record **1** attempt |
| **T9** `row.ruleId as RuleId` was an unchecked cast | `getMastery` skips rows whose id is no longer in the catalog |
| **T3** `food.chicken` claimed the plural *chickens* though the meat is a mass noun | excluded by wordId, like `colors.orange` |
| **T5** the "distractor is never a real word" test passed vacuously | `bdCandidates` takes an injectable word list; the collision rule is now proved against a list built to trigger it |
| **T6** gold/weak thresholds were under-tested — a `>` vs `>=` slip passed all 15 tests | boundary pairs added; all five threshold mutations now fail the suite |
| **T10** multi-seed invariant loops covered 4 of 11 rules | the item-builder invariants run over 40 seeds for every rule |

## Manual browser check (all seven steps of Task 16, Step 4)

Fourth 🪄 Grammar tile appears · tapping it goes straight to three games, not a
topic picker · One or Many renders three pictures for a plural answer and one
for a singular, reaching celebration at 10 rounds · the bed card opens the b/d
game and the 💡 button brings it back · rule chips update after play · progress
survives a reload. No console errors.

## Environment notes

- Run tests from inside a worktree that has its own `node_modules`. From the
  repo root, `npm run test` also walks the nested worktrees under
  `.claude/worktrees/` and reports unrelated failures — pre-existing noise.
- A fresh worktree needs `pnpm install`; the repo-root `node_modules` predates
  the `fake-indexeddb` devDependency and every Dexie test fails to resolve it.

## Known gaps carried forward

- `plural.ies` remains a thin bucket. Task 3 pre-seeds extra `-y` entries and
  the integrity test fails loudly below 4, so it cannot silently degrade.
- `useWordProgress` still has the same unguarded read-modify-write that was
  fixed here for `useRuleMastery`. Out of scope for this branch; worth a
  follow-up.
