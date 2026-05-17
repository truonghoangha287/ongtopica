# Implementation Plan: Vocab Progression Expansion

**Branch**: `claude/hardcore-kepler-847d3a` | **Date**: 2026-05-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-vocab-progression-expansion/spec.md`

## Summary

Lift the hidden "first 10 words" ceiling in Listen & Learn by adding a per-set rotation cursor, expose per-word progress as a 4-star row, let any activity unlock as soon as one word has cleared the prior stage, add a small per-profile achievements layer, and back-fill existing data so returning users do not lose visible progress. All changes are local-first: extend Dexie schema (v2 migration), thread two new fields (`introducedAt`, `rotationCursor`) through existing hooks/services, replace the single-⭐ render in `WordMap`, and add one new screen + one new store slice for achievements. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 5.8 / React 18.3 (Vite 6)
**Primary Dependencies**: React, Zustand, Dexie 4 (IndexedDB), framer-motion, react-router-dom 7, howler (audio), workbox-window (PWA)
**Storage**: IndexedDB via Dexie (existing `ongtopica-vocab` DB); JSON vocabulary in `src/data/yle-starters/*.json` (read-only)
**Testing**: Vitest + Testing Library + vitest-axe (already wired)
**Target Platform**: Web PWA, tablet-primary, offline-first after first load
**Project Type**: Single-project frontend (existing `src/english/vocab` + `src/shared`)
**Performance Goals**: Activity loads < 2 s (Constitution V); session compose < 50 ms on cold start; star-row render < 16 ms per word card
**Constraints**: All new state local to the device, per-profile, no external sync (Constitution IV); Dexie migration must not lose existing word progress (FR-013); session length is variable now (could be < 10) — UI must not assume a fixed count
**Scale/Scope**: 14 WordSets, 174 words total, ≤ 5 achievement types in initial release, 1 child profile typically active per device session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Child-First UX | ✅ PASS | New rotation indicator + star row + achievement celebrations all use existing button/animation/audio paradigms. No new text-heavy controls. |
| II. Accessibility by Default | ✅ PASS | Star row exposes `aria-label="N of 4 stars earned"`; achievement banner uses existing announce-celebration pattern. axe-core tests added for new screen. |
| III. Progressive Mastery (NON-NEGOTIABLE) | ✅ PASS | Rotation does **not** let the child skip stages — it only changes which Stage-1 words the child sees. Per-word unlock (FR-005) still requires the prior stage to be cleared on at least one word. Stage advancement remains driven by `priority-scorer.ts`. |
| IV. Safe & Private Sandbox | ✅ PASS | All new fields/tables local. No external calls. No links. Achievements are local-only. |
| V. Performance & Offline | ✅ PASS | Dexie v2 migration adds two scalar fields + one new table; no large data motion. All UI changes are CSS/text. Service worker manifest unaffected (no new bundles routed externally). |
| VI. Code Quality & Reusability | ✅ PASS | Two new constants (`ROTATION_BATCH_SIZE`, `ACHIEVEMENT_IDS`) added to `game-constants.ts`. No magic numbers. New files < 200 lines. Existing utilities (`priority-scorer`, `selectDistractors`, `CelebrationEffect`) reused. |
| VII. Test Coverage for Logic & Behavior | ✅ PASS | New tests: rotation-composer unit tests, per-word unlock decision tests, achievement-trigger tests, Dexie v1→v2 migration tests, axe-core test for AchievementsPage. |

No violations. No Complexity Tracking table required.

## Project Structure

### Documentation (this feature)

```text
specs/002-vocab-progression-expansion/
├── plan.md              # this file
├── spec.md              # feature spec with 5 clarifications session
├── research.md          # Phase 0 output (this command)
├── data-model.md        # Phase 1 output (this command)
├── quickstart.md        # Phase 1 output (this command)
├── contracts/
│   └── session-composer.contract.md   # session-composition contract
└── checklists/
    └── requirements.md  # produced by /speckit-specify
```

### Source Code (repository root)

Single-project frontend layout — extend the existing tree, no new top-level directories.

```text
src/
├── shared/
│   ├── constants/
│   │   └── game-constants.ts          # + ROTATION_BATCH_SIZE, ACHIEVEMENT_IDS
│   ├── db/
│   │   ├── schema.ts                  # + introducedAt, rotationCursor, achievements
│   │   └── db.ts                      # + version(2).stores() upgrade hook
│   └── store/
│       └── profile-store.ts           # unchanged
├── english/
│   └── vocab/
│       ├── components/
│       │   ├── WordMap.tsx            # ⭐ → 4-star row
│       │   ├── WordSetPage.tsx        # per-word unlock + rotation indicator
│       │   ├── AchievementsPage.tsx   # NEW: list earned / locked
│       │   ├── achievement-banner.tsx # NEW: in-celebration one-shot banner
│       │   ├── star-row.tsx           # NEW: 4-star visual primitive
│       │   └── home-progress-tile.tsx # NEW: aggregate progress on HomePage tile
│       ├── hooks/
│       │   ├── useSession.ts          # branch into rotation flow for stage 1
│       │   ├── useWordProgress.ts     # + recordIntroduced
│       │   └── useAchievements.ts     # NEW: load + record
│       ├── services/
│       │   ├── session-composer.ts    # rotation + ≥stage filter; remove untouched-fill
│       │   ├── priority-scorer.ts     # unchanged
│       │   ├── rotation-cursor.ts     # NEW: next-batch picker
│       │   └── achievement-evaluator.ts # NEW: pure trigger logic
│       └── store/
│           └── session-store.ts       # unchanged
└── App.tsx                            # + /achievements route

tests/
├── unit/
│   ├── session-composer.rotation.test.ts        # NEW
│   ├── session-composer.eligible-stage-or-higher.test.ts # NEW
│   ├── achievement-evaluator.test.ts            # NEW
│   ├── rotation-cursor.test.ts                  # NEW
│   └── star-row.test.tsx                        # NEW
├── integration/
│   ├── listen-and-learn-rotation.test.tsx       # NEW: 4 sessions cover all 31 animals
│   ├── per-word-unlock.test.tsx                 # NEW: 10 words cleared → recognize playable
│   └── dexie-migration-v1-v2.test.ts            # NEW: existing data preserved
└── a11y/
    └── achievements-page.test.tsx               # NEW: axe pass
```

**Structure Decision**: Extend the existing `src/english/vocab` feature module — three new components (`star-row.tsx`, `achievement-banner.tsx`, `AchievementsPage.tsx`, `home-progress-tile.tsx`), two new services (`rotation-cursor.ts`, `achievement-evaluator.ts`), one new hook (`useAchievements.ts`), and incremental edits to existing files. No new top-level packages, no monorepo split. Aligns with Constitution VI's subject-folder rule.

## Phase 0: Research

See [research.md](./research.md).

**Unknowns resolved**:
1. Dexie v1→v2 migration shape for additive fields (verified: `db.version(2).stores(...).upgrade(...)`).
2. Where to persist the rotation cursor (decision: new table `wordSetState`, not abused via existing `wordProgress`).
3. Whether `introducedAt` can be derived from `stage > 1` alone (decision: no — need explicit field because Stage 1 words can also be "heard but not advanced" once the L&L session ends).
4. Achievement catalog scope (decision: 5 fixed IDs in code, no runtime catalog).
5. Whether to introduce a generic "achievement engine" or hardcode triggers (decision: pure function `evaluateAchievements(progressMap, profileAchievements)` returns array of newly-earned IDs — KISS).

No NEEDS CLARIFICATION remains.

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](./data-model.md). Three deltas:
- `WordProgressRow` gains optional `introducedAt: number | null`.
- New table `wordSetState` keyed by `${childId}:${wordSetId}` with field `rotationCursor: number`.
- New table `achievements` keyed by `${childId}:${achievementId}` with field `earnedAt: number`.

### Contracts

See [contracts/session-composer.contract.md](./contracts/session-composer.contract.md). The session-composer signature gains a `rotationCursor` parameter (Listen & Learn only) and changes its eligibility rule from `p?.stage === targetStage` to `(p?.stage ?? 1) >= targetStage`. Return type unchanged.

### Quickstart

See [quickstart.md](./quickstart.md) for the end-to-end test path used to validate this plan.

### Agent context update

Update the `<!-- SPECKIT START --> ... <!-- SPECKIT END -->` markers in `CLAUDE.md` to reference `specs/002-vocab-progression-expansion/plan.md`.

## Complexity Tracking

*No constitution violations requiring justification.*
