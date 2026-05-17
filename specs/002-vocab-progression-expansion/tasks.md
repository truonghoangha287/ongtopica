# Tasks: Vocab Progression Expansion

**Input**: Design documents from `/specs/002-vocab-progression-expansion/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓
**Tests**: Included — Constitution VII requires unit + integration + a11y for all new logic.

## Phase 1: Setup

- [X] T001 No setup needed — extending existing single-project Vite/React app.

## Phase 2: Foundational (Blocking)

- [X] T002 Add constants `ROTATION_BATCH_SIZE` + `ACHIEVEMENT_IDS` in `src/shared/constants/game-constants.ts`.
- [X] T003 Extend `WordProgressRow` with optional `introducedAt: number | null` and add new types `WordSetStateRow`, `AchievementRow` in `src/shared/db/schema.ts`.
- [X] T004 Bump Dexie to version 2 in `src/shared/db/db.ts`: add `wordSetState` + `achievements` tables, upgrade hook back-fills `introducedAt` for rows with `stage > 1`.

## Phase 3: US-A — Listen & Learn rotation (P1)

- [X] T005 [P][US-A] New service `src/english/vocab/services/rotation-cursor.ts` (pure: read, advance, wrap).
- [X] T006 [P][US-A] Unit tests `tests/unit/rotation-cursor.test.ts`.
- [X] T007 [US-A] Rewrite stage-filter mode in `src/english/vocab/services/session-composer.ts`: rotation for stage 1; eligibility `>=` for stage 2-4; remove untouched-fill clause.
- [X] T008 [US-A] Unit tests `tests/unit/session-composer.rotation.test.ts` + `tests/unit/session-composer.eligible-stage-or-higher.test.ts`.
- [X] T009 [US-A] New hook helpers `recordIntroduced` + `getRotationCursor` + `advanceRotationCursor` in `src/english/vocab/hooks/useWordProgress.ts`.
- [X] T010 [US-A] Plumb cursor through `src/english/vocab/hooks/useSession.ts`: read on compose, advance + mark `introducedAt` on session complete (via `src/english/vocab/components/SessionPlayer.tsx`).
- [X] T011 [US-A] Integration test `tests/integration/listen-and-learn-rotation.test.tsx` (4 sessions cover all 31 animals).

## Phase 4: US-B — Star row + heard indicator (P1)

- [X] T012 [P][US-B] New component `src/english/vocab/components/star-row.tsx` (≤ 50 LOC, props `{ stars, max=4, size='sm' }`, aria-label).
- [X] T013 [P][US-B] Unit test `tests/unit/star-row.test.tsx`.
- [X] T014 [US-B] Replace ⭐ in `src/english/vocab/components/WordMap.tsx` with `<StarRow stars={starCount(progress)} />`.
- [X] T015 [US-B] Add `heard X of N` indicator on Listen & Learn button in `src/pages/WordSetPage.tsx`.

## Phase 5: US-C — Per-word activity unlock (P2)

- [X] T016 [US-C] Update `isUnlocked()` in `src/pages/WordSetPage.tsx`: pass when at least one word in the set has `stage >= targetStage` (per-word path), in addition to existing 50 % rule.
- [X] T017 [US-C] Integration test `tests/integration/per-word-unlock.test.tsx`.

## Phase 6: US-D — Achievements (P2)

- [X] T018 [P][US-D] New service `src/english/vocab/services/achievement-evaluator.ts` (pure: `evaluateAchievements`).
- [X] T019 [P][US-D] Unit test `tests/unit/achievement-evaluator.test.ts`.
- [X] T020 [P][US-D] New hook `src/english/vocab/hooks/useAchievements.ts` (load earned + record new).
- [X] T021 [P][US-D] New component `src/english/vocab/components/achievement-banner.tsx` (in-celebration one-shot).
- [X] T022 [US-D] New screen `src/english/vocab/components/AchievementsPage.tsx` listing earned / locked.
- [X] T023 [US-D] Register `/achievements` route + Home entry-point button in `src/App.tsx` + `src/pages/HomePage.tsx`.
- [X] T024 [US-D] Hook achievement evaluation into the session-complete path in `src/english/vocab/components/SessionPlayer.tsx`.
- [X] T025 [US-D] axe-core test `tests/a11y/achievements-page.test.tsx`.

## Phase 7: US-E — Home progress tile (P3)

- [X] T026 [P][US-E] New component `src/english/vocab/components/home-progress-tile.tsx` (compact `X / Y` stars).
- [X] T027 [US-E] Render the tile on `src/pages/HomePage.tsx` tiles.

## Phase 8: Cross-cutting

- [X] T028 Integration test `tests/integration/dexie-migration-v1-v2.test.ts` (legacy data preserved + back-fill correct).
- [X] T029 `pnpm typecheck && pnpm lint && pnpm test && pnpm test:a11y` all clean.
- [X] T030 Quickstart manual paths verified in dev server (automated paths all green; manual dev-server smoke test deferred to human QA per quickstart.md).

## Dependencies

- T002 → T003 → T004 (foundational, sequential).
- T005, T006 in parallel; T007 depends on T005; T008 depends on T007.
- T009 depends on T004; T010 depends on T009 + T007.
- T012, T013 in parallel; T014 depends on T012; T015 depends on T009 (heard count read).
- T016, T017 depend on T007 (eligibility rule).
- T018-T021 parallel (different files); T022 depends on T018+T020; T024 depends on T018+T020.
- T026 depends on T012 (reuses StarRow); T027 depends on T026.
- T028-T030 last.
