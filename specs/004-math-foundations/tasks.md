# Tasks: Math Foundations (Number Town)

**Feature**: `004-math-foundations` | **Plan**: [plan.md](./plan.md)
Dependency-ordered. `[P]` = parallelisable with siblings. Each task lists the file(s) it touches.

## Phase A — Foundations (types, constants, schema, data)

- [x] **T001** Add math content types — `src/math/types/math.types.ts` (MathProblem, MathTopic, PromptSpec, ChoiceSpec, ShapeKind, MathActivityType).
- [x] **T002** Add named constants — `src/shared/constants/game-constants.ts` (`MATH_SESSION_SIZE`, `MATH_MASTERY_THRESHOLD`, `MATH_TOPIC_UNLOCK_THRESHOLD`, `MATH_CHOICE_COUNT`, `MATH_ACHIEVEMENT_IDS`).
- [x] **T003** Extend DB schema — `src/shared/db/schema.ts` (`MathProgressRow`, `MathProgressTable`) + `src/shared/db/db.ts` (`version(3)` additive `mathProgress` store).
- [x] **T004** [P] Shape catalog — `src/data/math-starters/shapes-catalog.ts` (shape kinds + display labels).
- [x] **T005** Data generator — `scripts/generate-math-data.ts` produces the 7 topic JSON files deterministically.
- [x] **T006** Topic registry + icons — `src/data/math-starters/index.ts`, `src/data/math-starters/icons.ts`.

## Phase B — Logic services (pure, unit-tested)

- [x] **T007** [P] Scorer — `src/math/services/math-scorer.ts` (`isMastered`, `applyCorrect`, `applyIncorrect`).
- [x] **T008** [P] Topic progression — `src/math/services/topic-progression.ts` (`topicMasteryFraction`, `isTopicUnlocked`).
- [x] **T009** [P] Session composer — `src/math/services/math-session-composer.ts` (per contract).
- [x] **T010** [P] Achievement evaluator — `src/math/services/math-achievement-evaluator.ts`.

## Phase C — Persistence hooks & store

- [x] **T011** `useMathProgress` — `src/math/hooks/useMathProgress.ts` (load/record per profile).
- [x] **T012** `useMathAchievements` — `src/math/hooks/useMathAchievements.ts`.
- [x] **T013** `useMathSession` — `src/math/hooks/useMathSession.ts` + `src/math/store/math-session-store.ts`.

## Phase D — Shared narration

- [x] **T014** [P] Speech util — `src/shared/utils/speech.ts` (Web Speech, offline-safe).
- [x] **T015** [P] `SpeakButton` — `src/shared/components/SpeakButton.tsx`.

## Phase E — Activity & screen components

- [x] **T016** [P] `ShapeGlyph` — `src/math/components/ShapeGlyph.tsx` (accessible SVG).
- [x] **T017** [P] `ObjectCluster` — `src/math/components/ObjectCluster.tsx`.
- [x] **T018** `ChoiceButton` — `src/math/components/ChoiceButton.tsx`.
- [x] **T019** `PromptDisplay` — `src/math/components/PromptDisplay.tsx`.
- [x] **T020** `MathProblemPlayer` — `src/math/components/MathProblemPlayer.tsx` (feedback loop).
- [x] **T021** `MathCelebrationScreen` + `MathAchievementsBanner` — `src/math/components/`.
- [x] **T022** `MathSessionPlayer` — `src/math/components/MathSessionPlayer.tsx`.
- [x] **T023** `MathTopicPage` — `src/math/pages/MathTopicPage.tsx`.

## Phase F — Wiring

- [x] **T024** i18n — `src/locales/en/math.json` + register `math` ns in `src/i18n.ts`.
- [x] **T025** Routes — `src/App.tsx` (`/math/:id`, `/math-session`).
- [x] **T026** Home subject switcher — `src/pages/HomePage.tsx` (English/Math tabs + math tiles).

## Phase G — Tests (Constitution VII)

- [x] **T027** [P] Unit — `tests/unit/math-scorer.test.ts`.
- [x] **T028** [P] Unit — `tests/unit/topic-progression.test.ts`.
- [x] **T029** [P] Unit — `tests/unit/math-session-composer.test.ts`.
- [x] **T030** [P] Unit — `tests/unit/math-achievement-evaluator.test.ts`.
- [x] **T031** [P] Integration — one play-through per activity type (5 files).
- [x] **T032** Integration — full session play-through "like a real child".
- [x] **T033** Integration — topic unlock ladder.
- [x] **T034** Integration — Dexie v2→v3 preserves vocab.
- [x] **T035** [P] A11y — `tests/a11y/math-screens.a11y.test.tsx`.

## Phase H — Verify

- [x] **T036** `pnpm typecheck && pnpm lint && pnpm test` all green.
- [x] **T037** Generated data: every topic ≥ 10 problems (SC-006).
