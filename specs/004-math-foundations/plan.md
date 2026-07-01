# Implementation Plan: Math Foundations (Number Town)

**Branch**: `004-math-foundations` | **Date**: 2026-06-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-math-foundations/spec.md`

## Summary

Add **Math** as a second subject beside English, following the Constitution's mandated ladder
(number recognition → counting → addition/subtraction → patterns → shapes → logic). Mirror the
proven English architecture: a subject folder (`src/math/`), JSON data sets per topic, a session
composer + scorer, a Dexie-backed per-profile progress store, achievements, and child-first
activity screens. To stay DRY, all 5 Timo-style activity types are rendered by **one universal
`MathProblemPlayer`** (prompt + 3 tappable choices + identical feedback loop); the variety lives in
the **data** and small visual primitives (numerals, dots, object clusters, SVG shapes). Narration
uses the device Web Speech API (offline-safe, no audio assets). All new state is local-first via an
additive Dexie v3 migration. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 5.8 / React 18.3 (Vite 6)
**Primary Dependencies**: React, Zustand, Dexie 4 (IndexedDB), framer-motion, react-router-dom 7, react-i18next, howler (existing), Web Speech API (built-in)
**Storage**: IndexedDB via Dexie (existing `ongtopica-vocab` DB, new `mathProgress` table in v3); JSON math sets in `src/data/math-starters/*.json` (generated, read-only at runtime)
**Testing**: Vitest + Testing Library + vitest-axe (already wired)
**Target Platform**: Web PWA, tablet-primary, offline-first after first load
**Project Type**: Single-project frontend; new subject module `src/math/` peer to `src/english/`
**Performance Goals**: Activity loads < 2 s; session compose < 50 ms; choice render < 16 ms
**Constraints**: All state local & per-profile; no external sync/links/ads; topic ladder strictly ordered; sessions ≤ 8 problems and < 5 min
**Scale/Scope**: 7 topics, ≥ 70 problems total, 5 activity renderers, 2 achievement families

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Child-First UX | ✅ PASS | Single-tap 3-option MCQ, big tiles, owl mascot reused, celebration on every correct, gentle retry/reveal, always-present exit, no dead-ends (locked topic shakes + pulses prerequisite). |
| II. Accessibility by Default | ✅ PASS | Every prompt has a visual + text caption (never audio-only); choices are real `<button>`s with `aria-label`; SVG shapes carry titles; progress exposes `aria-label`; axe tests on all new screens. |
| III. Progressive Mastery (NON-NEGOTIABLE) | ✅ PASS | Exactly the Constitution math sequence. Topic *N* gated on topic *N−1* mastery fraction; per-problem mastery via consecutive-correct threshold. All gating logic unit-tested. |
| IV. Safe & Private Sandbox | ✅ PASS | New table + JSON only. No network, links, UGC, ads, telemetry. Narration is on-device speech synthesis. |
| V. Performance & Offline | ✅ PASS | Additive Dexie v3 (one new table, no data motion). Shapes are inline SVG, objects are emoji — zero new asset downloads. Speech degrades silently offline/in tests. Animations honour `prefers-reduced-motion`. |
| VI. Code Quality & Reusability | ✅ PASS | New constants in `game-constants.ts` (no magic numbers). One universal player + small primitives (DRY). Subject isolated in `src/math/`; no cross-subject component imports. Files < 200 lines. Progression/scoring commented. |
| VII. Test Coverage for Logic & Behavior | ✅ PASS | Unit tests: scorer, topic-progression unlock, session-composer, achievement-evaluator. Integration: one full play-through per activity renderer + topic unlock + Dexie v2→v3 preservation. axe tests for math screens. |

No violations. No Complexity Tracking table required.

## Project Structure

### Documentation (this feature)

```text
specs/004-math-foundations/
├── plan.md              # this file
├── spec.md              # feature spec
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── math-session-composer.contract.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

Extend the existing tree; add the `src/math/` subject peer to `src/english/`.

```text
src/
├── shared/
│   ├── constants/game-constants.ts     # + MATH_* constants & MATH_ACHIEVEMENT_IDS
│   ├── db/schema.ts                     # + MathProgressRow + table type
│   ├── db/db.ts                         # + version(3).stores({ mathProgress })
│   ├── utils/speech.ts                  # NEW: offline-safe Web Speech narration
│   └── components/SpeakButton.tsx       # NEW: replay-narration button (visual equiv)
├── data/
│   └── math-starters/
│       ├── index.ts                     # NEW: mathTopicRegistry + getMathTopic
│       ├── icons.ts                     # NEW: per-topic emoji
│       ├── numbers.json … logic.json    # NEW: generated problem sets (7 files)
│       └── shapes-catalog.ts            # NEW: shape kind list + labels
├── math/
│   ├── types/math.types.ts              # NEW: MathProblem, MathTopic, prompt/choice specs
│   ├── services/
│   │   ├── math-scorer.ts               # NEW: applyCorrect/applyIncorrect/isMastered
│   │   ├── topic-progression.ts         # NEW: isTopicUnlocked, masteryFraction
│   │   ├── math-session-composer.ts     # NEW: compose N problems (priority + shuffle)
│   │   └── math-achievement-evaluator.ts# NEW: pure newly-earned id logic
│   ├── hooks/
│   │   ├── useMathProgress.ts           # NEW: load/record progress
│   │   ├── useMathSession.ts            # NEW: compose + stash session
│   │   └── useMathAchievements.ts       # NEW: load/record math achievements
│   ├── store/math-session-store.ts      # NEW: currentIndex/advance/clear
│   ├── components/
│   │   ├── MathProblemPlayer.tsx        # NEW: universal activity (prompt+choices+feedback)
│   │   ├── PromptDisplay.tsx            # NEW: render the prompt visual
│   │   ├── ChoiceButton.tsx             # NEW: render one choice (numeral/object/shape)
│   │   ├── ShapeGlyph.tsx               # NEW: accessible inline-SVG shapes
│   │   ├── ObjectCluster.tsx            # NEW: render N emoji objects
│   │   ├── MathSessionPlayer.tsx        # NEW: drive a session of problems
│   │   ├── MathCelebrationScreen.tsx    # NEW: math-namespace celebration
│   │   └── MathAchievementsBanner.tsx   # NEW: one-shot in-celebration banner
│   └── pages/
│       └── MathTopicPage.tsx            # NEW: topic detail + session launch
├── pages/HomePage.tsx                   # + English/Math subject switcher
├── locales/en/math.json                 # NEW: math namespace strings
├── i18n.ts                              # + register `math` namespace
└── App.tsx                              # + /math/:id and /math-session routes

scripts/
└── generate-math-data.ts               # NEW: deterministic problem-set generator

tests/
├── unit/
│   ├── math-scorer.test.ts                     # NEW
│   ├── topic-progression.test.ts               # NEW
│   ├── math-session-composer.test.ts           # NEW
│   └── math-achievement-evaluator.test.ts      # NEW
├── integration/
│   ├── math-tap-number.test.tsx                # NEW: child plays a number-recognition problem
│   ├── math-count-objects.test.tsx             # NEW
│   ├── math-pick-next.test.tsx                 # NEW
│   ├── math-tap-shape.test.tsx                 # NEW
│   ├── math-odd-one-out.test.tsx               # NEW
│   ├── math-session-playthrough.test.tsx       # NEW: full topic session like a real child
│   ├── math-topic-unlock.test.tsx              # NEW: ladder gating
│   └── dexie-migration-v2-v3.test.ts           # NEW: English progress preserved
└── a11y/
    └── math-screens.a11y.test.tsx              # NEW: axe on math screens
```

**Structure Decision**: New isolated subject module `src/math/`, peer to `src/english/`, per
Constitution VI's subject-folder rule. Shared, subject-neutral helpers (speech, speak button) live
in `src/shared/`. Data is generated by a script into `src/data/math-starters/` mirroring the
`yle-starters` pattern. No monorepo split, no new top-level packages, no new dependencies.

## Phase 0: Research

See [research.md](./research.md).

**Unknowns resolved**:
1. Narration without audio assets → **Web Speech API** (`speechSynthesis`), gated by the existing `audioEnabled` flag, degrades silently in jsdom/offline. Visual caption always present (no audio-only).
2. One player vs five activity components → **one `MathProblemPlayer`**; variety encoded in data + small visual primitives (DRY, KISS). Each renderer still has its own integration test.
3. Shapes rendering → **inline accessible SVG** (`ShapeGlyph`) — no image assets, crisp at any size, `<title>` for SR.
4. Progress storage → **new `mathProgress` table** (additive Dexie v3), fully decoupled from `wordProgress` (no cross-subject entanglement).
5. Data authoring → **generator script** produces deterministic JSON (no `Math.random()` at runtime in data), matching the repo's `scripts/generate-vocab-*` convention.

No NEEDS CLARIFICATION remains.

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](./data-model.md). Deltas:
- New `MathProblem` / `MathTopic` types in `src/math/types/math.types.ts`.
- New `MathProgressRow` + `mathProgress` Dexie table (v3, additive).
- Reuse the existing `achievements` table for math achievement ids.

### Contracts

See [contracts/math-session-composer.contract.md](./contracts/math-session-composer.contract.md):
`composeMathSession(topic, progressMap, { sessionSize })` returns ≤ `sessionSize` problems,
prioritising unmastered then previously-missed, shuffled, never including content the child has not
unlocked (topic-level gating is enforced upstream in the UI).

### Quickstart

See [quickstart.md](./quickstart.md) for the end-to-end "play as a child" validation path.

### Agent context update

Update the `CLAUDE.md` plan pointer to reference `specs/004-math-foundations/plan.md` once this
feature is the active work.

## Complexity Tracking

*No constitution violations requiring justification.*
