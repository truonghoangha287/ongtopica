# Tasks: Vocabulary Learning (001-vocab-learning)

**Input**: Design documents from `/specs/001-vocab-learning/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Unit + integration + a11y tests included (required by Constitution Principle VII).

**Organization**: Tasks grouped by user story — each story is independently implementable and testable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US5) this task belongs to
- Exact file paths included in every task

---

## Phase 1: Setup

**Purpose**: Convert Node.js skeleton to Vite + React 18 + TypeScript PWA; install all dependencies; configure toolchain.

- [X] T001 Replace package.json with Vite + React 18 + TypeScript + pnpm project; add all dependencies: dexie, zustand, howler, @dnd-kit/core, framer-motion, canvas-confetti, react-i18next, i18next, react-router-dom, vite-plugin-pwa; devDependencies: @types/react, @types/react-dom, @types/howler, @types/canvas-confetti, vitest, @vitest/ui, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom, vitest-axe, eslint, typescript; add pnpm scripts per quickstart.md (dev, build, preview, test, test:unit, test:int, test:a11y, lint, typecheck)
- [X] T002 [P] Configure vite.config.ts: React plugin, vite-plugin-pwa with Workbox pre-cache for all assets in public/assets/ (audio + images), manifest with short_name, display=standalone, theme_color
- [X] T003 [P] Configure vitest.config.ts: environment jsdom, globals true, setupFiles with @testing-library/jest-dom + vitest-axe matchers
- [X] T004 [P] Configure tsconfig.json: strict mode, paths alias `@/*` → `src/*`, jsx react-jsx, target ES2020
- [X] T005 [P] Configure eslint.config.js: TypeScript + React hooks rules; no-hardcoded-strings rule if available
- [X] T006 Create full directory structure per plan.md: src/english/vocab/{components/activities,hooks,services,store,types}, src/shared/{components,db,constants,hooks,store,types}, src/pages, src/locales/en, src/data/yle-starters, tests/{unit,integration,a11y}, public/assets/{images,audio}

**Checkpoint**: `pnpm dev` starts without errors; `pnpm build` produces dist/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, Dexie DB, constants, pure-function services, Zustand stores, hooks — all must be complete before any user story begins.

**⚠️ CRITICAL**: No user story implementation starts until this phase is complete.

- [X] T007 [P] Create src/shared/types/index.ts: export interfaces Word (id, text, pictureAsset, audioAsset, wordSetId, blankLetterIndex, letterChoices), WordSet (id, displayName, words), ChildProfile (id, name, avatarId, createdAt)
- [X] T008 [P] Create src/english/vocab/types/vocab.types.ts: export ActivityType union, SessionItem, Session, ActivityCallbacks, IntroduceActivityProps, RecognizeActivityProps, UnscrambleActivityProps, FillInBlankActivityProps, SessionPlayerProps, WordMapProps — per contracts/activities.md exactly
- [X] T009 Create src/shared/constants/game-constants.ts: export all named constants MASTERY_THRESHOLD=3, SESSION_WORD_COUNT=10, MAX_SESSION_MINUTES=8, MAX_RETRIES=1, LETTER_CHOICE_COUNT=3, INITIAL_PRIORITY=1.0, STRUGGLE_WEIGHT=2.0, CONFIDENCE_WEIGHT=1.5 — no magic numbers elsewhere
- [X] T010 [P] Create src/shared/db/schema.ts: export ChildProfileRow interface, WordProgressRow interface (id composite `${childId}:${wordId}`, childId, wordId, wordSetId, stage 1|2|3|4, consecutiveCorrect, totalIncorrect, priorityScore, lastReviewedAt); export Dexie table type declarations string per data-model.md indexes
- [X] T011 Create src/shared/db/db.ts: Dexie singleton class extending Dexie; declare `childProfiles: Table<ChildProfileRow>` and `wordProgress: Table<WordProgressRow>`; schema version 1 with `'id, createdAt'` for childProfiles and `'id, childId, [childId+wordSetId], [childId+stage]'` for wordProgress; export singleton `db` instance
- [X] T012 [P] Create src/i18n.ts: init react-i18next with en namespace vocab, fallbackLng en; create src/locales/en/vocab.json with all keys from contracts/locale-keys.md (wordSets.*, activities.*, session.*, profiles.*, settings.*, errors.*)
- [X] T013 [P] Create src/english/vocab/services/priority-scorer.ts: export pure functions `applyCorrect(current: WordProgressRow): Partial<WordProgressRow>` (consecutiveCorrect++, priorityScore /= CONFIDENCE_WEIGHT, stage++ + reset if threshold reached), `applyIncorrect(current: WordProgressRow): Partial<WordProgressRow>` (consecutiveCorrect=0, totalIncorrect++, priorityScore *= STRUGGLE_WEIGHT), `shouldAdvanceStage(progress: WordProgressRow): boolean`; no side effects; import constants from game-constants.ts
- [X] T014 Create src/english/vocab/services/session-composer.ts: export pure function `composeSession(wordSet, progressMap, options): SessionItem[]`; algorithm: (1) gather in-progress words sorted by priorityScore DESC, (2) take up to sessionWordCount, (3) fill remaining slots with next unstarted words from wordSet.words at Stage 1, (4) return SessionItem[] with activityType derived from stage; no async, no DB access per contracts/stores.md
- [X] T015 [P] Create src/english/vocab/store/session-store.ts: Zustand store with SessionState interface per contracts/stores.md (session, currentIndex, retryCount; actions: setSession, advance, incrementRetry, clearSession); not persisted
- [X] T016 [P] Create src/shared/store/profile-store.ts: Zustand store with ProfileState interface per contracts/stores.md (activeProfileId; actions: setActiveProfile, clearActiveProfile)
- [X] T017 Create src/english/vocab/hooks/useWordProgress.ts: custom hook returning UseWordProgressReturn per contracts/stores.md; getProgress, getWordSetProgress, getAllProgress query Dexie db.wordProgress; recordCorrect creates/upserts WordProgress applying applyCorrect from priority-scorer (lazy creation on first word appearance); recordIncorrect applies applyIncorrect; uses activeProfileId from profile-store
- [X] T018 Create src/english/vocab/hooks/useSession.ts: custom hook returning UseSessionReturn per contracts/stores.md; composeSession fetches WordProgress via db.wordProgress.where('[childId+wordSetId]'), calls pure composeSession(), creates Session with UUID id; sets session in session-store
- [X] T019 [P] Create src/shared/hooks/useAudio.ts: Howler.js wrapper returning UseAudioReturn per contracts/stores.md (play(src), stop, isPlaying, hasError); reads audioEnabled from localStorage; if audioEnabled false, play() no-ops; hasError true when Howler fires onloaderror; cleanup on unmount
- [X] T020 [P] Create src/data/yle-starters/animals.json with 10 Word entries (id: "animals.{name}", text, pictureAsset: "/assets/images/{name}.webp", audioAsset: "/assets/audio/{name}.mp3", wordSetId: "animals", blankLetterIndex: valid index, letterChoices: [correct, distractor1, distractor2]); create src/data/yle-starters/index.ts exporting WordSet[] registry with the animals set

**Checkpoint**: `pnpm typecheck` passes; all types, constants, DB, stores, services, and hooks compile cleanly.

---

## Phase 3: User Story 1 — Introduce a New Word (Priority: P1) 🎯 MVP

**Goal**: Child can open the app, pick a profile, start a session, see word picture + text, hear audio auto-play, replay audio, complete 10 words, and reach a celebration screen.

**Independent Test**: A session with 10 Stage 1 words renders IntroduceActivity for each, audio plays per word, celebration screen appears on completion. `pnpm test:int -- introduce`

- [X] T021 [P] [US1] Create src/shared/components/Mascot.tsx: accept `reaction: 'idle' | 'celebrate' | 'encourage'` prop; Framer Motion animate between reaction variants (bounce for celebrate, gentle nod for encourage, still for idle); aria-hidden decorative
- [X] T022 [P] [US1] Create src/shared/components/CelebrationEffect.tsx: canvas-confetti wrapper; fires confetti burst on mount when `active` prop true; canvas-based, zero DOM nodes, cleans up on unmount
- [X] T023 [P] [US1] Create src/shared/components/AudioPlayer.tsx: renders play/replay button using useAudio hook; shows FR-015 offline state (speaker icon + `t('errors.audioUnavailable')`) when hasError; auto-plays src on mount if autoPlay prop true; min 48×48px touch target
- [X] T024 [P] [US1] Create src/english/vocab/components/WordCard.tsx: displays word.pictureAsset as large img (alt=word.text) + word.text below; responsive sizing; role="img" with descriptive aria-label
- [X] T025 [US1] Create src/english/vocab/components/activities/IntroduceActivity.tsx: IntroduceActivityProps per contract; renders WordCard + AudioPlayer (autoPlay=true); replay button always visible; Next button calls onComplete; no scoring; uses `t('activities.introduce.*')`
- [X] T026 [US1] Create src/shared/components/ProfilePicker.tsx: fetches ChildProfile[] from db.childProfiles; renders each as large avatar button (min 80×80px) + name; on tap: read name aloud via useAudio + call setActiveProfile; Add-child flow (name + avatarId input, writes to db.childProfiles); `t('profiles.*')`
- [X] T027 [US1] Create src/english/vocab/components/SessionPlayer.tsx: SessionPlayerProps per contract; renders IntroduceActivity for activityType='introduce', placeholder div for other stages (guarded by stage check); tracks currentIndex via session-store; on IntroduceActivity onComplete: calls useWordProgress.recordCorrect + store.advance; on last item: shows celebration screen (CelebrationEffect + Mascot celebrate + `t('session.celebration')`); always-visible exit button calls onExit
- [X] T028 [US1] Create src/pages/HomePage.tsx: thin routing shell; renders ProfilePicker; on profile selected navigates to /word-sets; renders word set card list (from data/yle-starters/index.ts) after profile picked; each card navigates to /word-sets/:id
- [X] T029 [US1] Create src/pages/WordSetPage.tsx: reads wordSetId from route params; loads WordSet from registry; renders word map placeholder + "Start Session" CTA; on CTA tap: calls useSession.composeSession(wordSet) then navigates to session view with composed session; shows loading state during composition
- [X] T030 [US1] Wire App.tsx: react-router-dom BrowserRouter with routes: `/` → HomePage, `/word-sets/:id` → WordSetPage, `/session` → SessionPlayer (passes session via location state); wrap with I18nextProvider and i18n instance; add main.tsx PWA entry importing i18n + App
- [X] T031 [US1] Integration test in tests/integration/introduce-activity.test.tsx: render IntroduceActivity with mock word; assert picture img rendered; assert AudioPlayer play called on mount; simulate Next button 10 times; assert onComplete called 10 times; render SessionPlayer end-to-end for 10 Stage-1 items and assert celebration screen appears

**Checkpoint**: `pnpm dev` → select profile → tap Animals → Start Session → see 10 IntroduceActivity screens with audio → celebration screen. `pnpm test:int -- introduce` passes.

---

## Phase 4: User Story 2 — Recognize a Word by Hearing (Priority: P1)

**Goal**: Child hears a word, taps the correct picture from 4 options; correct answer triggers celebration; incorrect allows 1 retry then reveals answer with encouragement.

**Independent Test**: A session of 10 Stage 2 words renders RecognizeActivity, audio plays, 2×2 grid shown, correct/incorrect/reveal callbacks fire correctly. `pnpm test:int -- recognize`

- [X] T032 [P] [US2] Create src/english/vocab/components/activities/RecognizeActivity.tsx: RecognizeActivityProps per contract (word + distractors[3] + callbacks); audio auto-plays on mount via AudioPlayer; renders 2×2 grid of 4 picture buttons (word + distractors shuffled); correct tap → Mascot celebrate + CelebrationEffect → onCorrect() → onAdvance(); 1st incorrect → Mascot encourage + gentle visual cue on tapped option (not red X) → onIncorrect(); 2nd incorrect (MAX_RETRIES=1 exhausted) → correct option highlighted → onReveal() → onAdvance(); `t('activities.recognize.*')`
- [X] T033 [US2] Extend src/english/vocab/components/SessionPlayer.tsx to render RecognizeActivity for activityType='recognize'; pass word + 3 distractors selected from same WordSet (exclude target word, pick random 3 from wordSet.words); wire callbacks to useWordProgress.recordCorrect/recordIncorrect + session-store advance/incrementRetry
- [X] T034 [US2] Add distractor selection helper in src/english/vocab/services/session-composer.ts: `selectDistractors(word, wordSet, count): Word[]` — picks count words from same WordSet excluding target, shuffled; export for use by SessionPlayer
- [X] T035 [US2] Integration test in tests/integration/recognize-activity.test.tsx: render RecognizeActivity; assert audio plays on mount; simulate correct picture tap → assert onCorrect + onAdvance called; simulate 2 incorrect taps → assert onIncorrect then onReveal + onAdvance called; assert no red/negative feedback elements rendered

**Checkpoint**: Stage 2 words in sessions render RecognizeActivity with 4-picture grid. `pnpm test:int -- recognize` passes.

---

## Phase 5: User Story 5 — Mastery Progression & Session Composition (Priority: P1)

**Goal**: Priority scores update per answer, stages advance at MASTERY_THRESHOLD, session composer prioritizes struggling words, WordMap shows stars for mastered words, parent dashboard shows per-word stats.

**Independent Test**: Unit tests verify priority-scorer math and session-composer algorithm; WordMap renders stars for stage-4 mastered words; SettingsPage shows per-child stats.

- [X] T036 [P] [US5] Write tests/unit/priority-scorer.test.ts: test applyCorrect increments consecutiveCorrect + divides priorityScore by CONFIDENCE_WEIGHT; test applyCorrect at MASTERY_THRESHOLD increments stage + resets consecutiveCorrect; test applyIncorrect resets consecutiveCorrect + multiplies priorityScore by STRUGGLE_WEIGHT; test shouldAdvanceStage returns true only when consecutiveCorrect >= MASTERY_THRESHOLD; test stage does not exceed 4
- [X] T037 [P] [US5] Write tests/unit/session-composer.test.ts: test session fills all SESSION_WORD_COUNT slots from in-progress words sorted by priorityScore DESC; test remaining slots filled with unstarted words at Stage 1 when in-progress count < SESSION_WORD_COUNT; test struggling word (high priorityScore) appears before lower-priority word at same stage; test stage advance: word with consecutiveCorrect=MASTERY_THRESHOLD promoted to next stage in next session; test WordSet boundary: no words from other sets fill slots
- [X] T038 [P] [US5] Create src/english/vocab/components/WordMap.tsx: WordMapProps per contracts/activities.md; renders all wordSet.words as grid of word cards; words where progressMap[word.id].stage===4 AND consecutiveCorrect>=MASTERY_THRESHOLD show a visible star icon; unstarted words show default card; scope strictly to wordSet.words (no cross-set bleed per FR-013); optional onWordTap handler
- [X] T039 [US5] Update src/pages/WordSetPage.tsx to render WordMap below the "Start Session" CTA: fetch progress via useWordProgress.getWordSetProgress(wordSetId); pass progressMap to WordMap; show "Completed!" badge + `t('session.reviewAllButton')` when all words mastered; "Review All" mode composes session with Stage 3–4 words only
- [X] T040 [US5] Create src/pages/SettingsPage.tsx: audio toggle reads/writes localStorage key `audioEnabled` (boolean); navigates back on `t('settings.backButton')`; parent dashboard section shows useWordProgress.getAllProgress() table: per-word row with word.text, stage, totalIncorrect; `t('settings.*')`; link to SettingsPage added to HomePage header
- [X] T041 [US5] Verify session-store.advance() in src/english/vocab/components/SessionPlayer.tsx correctly writes WordProgress after each answer (not batched): useWordProgress.recordCorrect/recordIncorrect called inside onCorrect/onReveal callbacks before store.advance() — ensures mid-session exit does not lose answered-word progress per FR-012

**Checkpoint**: `pnpm test:unit` passes. WordMap shows stars for mastered words. SettingsPage renders audio toggle + per-child stats.

---

## Phase 6: User Story 3 — Unscramble the Word (Priority: P2)

**Goal**: Child sees picture, arranges scrambled letter tiles into correct word; correct arrangement triggers celebration; 2 retries before answer revealed.

**Independent Test**: A session of 10 Stage 3 words renders UnscrambleActivity with tile interaction, correct/incorrect/reveal callbacks fire. `pnpm test:int -- unscramble`

- [X] T042 [P] [US3] Create src/english/vocab/components/activities/UnscrambleActivity.tsx: UnscrambleActivityProps per contract; @dnd-kit/core DndContext with useSortable tiles; seeded shuffle of word.text letters (deterministic, not random on re-render); primary UX: tap tile to select (highlight) + tap target slot to place; secondary: drag-and-drop; 48px+ tile hit targets; auto-checks when all tiles placed — if correct: onCorrect() + CelebrationEffect + onAdvance(); 1st incorrect: tiles animate back to scrambled + Mascot encourage + onIncorrect(); 2nd incorrect (retries exhausted): correct word snaps in + onReveal() + onAdvance(); `t('activities.unscramble.*')`
- [X] T043 [US3] Extend src/english/vocab/components/SessionPlayer.tsx to render UnscrambleActivity for activityType='unscramble'; wire callbacks identically to RecognizeActivity (recordCorrect/recordIncorrect + advance/incrementRetry)
- [X] T044 [US3] Integration test in tests/integration/unscramble-activity.test.tsx: render UnscrambleActivity; simulate tiles arranged in correct order → assert onCorrect + onAdvance; simulate 2 incorrect arrangements → assert onIncorrect then onReveal + onAdvance; assert no tiles re-rendered with new random order on re-render (seeded shuffle)

**Checkpoint**: Stage 3 words render tile-based spelling activity. `pnpm test:int -- unscramble` passes.

---

## Phase 7: User Story 4 — Fill in the Missing Letter (Priority: P2)

**Goal**: Child sees picture + partial word with blank, taps correct letter from 3 choices; 1 retry then reveal with encouragement.

**Independent Test**: A session of 10 Stage 4 words renders FillInBlankActivity, letter buttons work, callbacks fire. `pnpm test:int -- fill-in-blank`

- [X] T045 [P] [US4] Create src/english/vocab/components/activities/FillInBlankActivity.tsx: FillInBlankActivityProps per contract (word.blankLetterIndex, word.letterChoices); renders word.pictureAsset; displays word.text with word.text[blankLetterIndex] replaced by styled blank `_`; shuffles word.letterChoices into 3 large tappable buttons (min 56×56px); correct tap: blank fills with letter + CelebrationEffect + onCorrect() + onAdvance(); 1st incorrect tap: gentle cue + onIncorrect(); 2nd incorrect: correct letter fills + onReveal() + onAdvance(); `t('activities.fillInBlank.*')`
- [X] T046 [US4] Extend src/english/vocab/components/SessionPlayer.tsx to render FillInBlankActivity for activityType='fill-in-blank'; complete all 4 activity type branches (Introduce / Recognize / Unscramble / FillInBlank) — SessionPlayer is now fully wired
- [X] T047 [US4] Integration test in tests/integration/fill-in-blank-activity.test.tsx: render FillInBlankActivity with a word; assert partial word with blank displayed; simulate correct letter button tap → assert onCorrect + onAdvance; simulate 2 incorrect taps → assert onIncorrect then onReveal + onAdvance

**Checkpoint**: All 4 activity types functional in sessions. `pnpm test:int -- fill-in-blank` passes.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: A11y, offline hardening, final validation, remaining word sets.

- [X] T048 [P] Write tests/a11y/screens.a11y.test.tsx: run axe-core via vitest-axe on rendered snapshots of: HomePage, WordSetPage, each of the 4 ActivityComponents, SessionPlayer celebration screen, SettingsPage; assert no WCAG AA violations; `pnpm test:a11y` must pass clean
- [X] T049 [P] Audit src/shared/components/AudioPlayer.tsx and all 4 activity components: verify FR-015 offline state renders speaker icon + `t('errors.audioUnavailable')` when useAudio.hasError is true; assert activity remains completable (Next/correct-answer buttons still enabled) without audio
- [X] T050 [P] Audit src/english/vocab/components/SessionPlayer.tsx: confirm always-visible exit button present (not hidden by activity UI); confirm mid-session exit saves already-answered words' WordProgress but does not save in-progress word; confirm session restarts from beginning on re-entry per spec edge case
- [X] T051 [P] Audit vite.config.ts Workbox config: globPatterns must cover `**/*.{mp3,webp,png}` in public/assets/; run `pnpm build` and inspect dist/sw.js precache manifest to confirm all audio + image asset hashes are listed
- [X] T052 Add remaining Cambridge YLE Starters word sets in src/data/yle-starters/: food.json, clothes.json, colors.json, body.json, toys.json, family.json (10 words each per Word schema); register all in src/data/yle-starters/index.ts
- [X] T053 Run `pnpm lint && pnpm typecheck` — resolve all errors; no `any` types in public API surfaces; all i18n strings use `t()` (no hardcoded English strings in JSX)
- [X] T054 Run `pnpm build && pnpm preview`; open Chrome DevTools → Application → Service Workers → check Offline; verify all 4 activity types work offline; verify audio shows FR-015 fallback state; confirm SC-001 (session under 8 min) and SC-006 (zero external links) pass manually

**Checkpoint**: `pnpm test` (all suites) passes clean. Offline mode fully functional. App ready for demo.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — MVP entry point
- **Phase 4 (US2)**: Depends on Phase 2 — can start after Phase 2 (parallel with US1 if staffed)
- **Phase 5 (US5)**: Depends on Phase 2 (pure functions already written); unit tests independent; WordMap depends on Phase 3 components
- **Phase 6 (US3)**: Depends on Phase 2 and Phase 3 (SessionPlayer scaffold)
- **Phase 7 (US4)**: Depends on Phase 2 and Phase 3 (SessionPlayer scaffold); parallel with Phase 6 if staffed
- **Phase 8 (Polish)**: Depends on all prior phases

### User Story Dependencies

- **US1 (P1)**: First story — establishes SessionPlayer, all shared components, routing
- **US2 (P1)**: Can start after Phase 2; SessionPlayer extension after T027 (US1)
- **US5 (P1)**: Unit tests (T036, T037) independent after Phase 2; UI tasks (T038–T041) after T027 + T029
- **US3 (P2)**: Requires SessionPlayer (T027) for extension in T043
- **US4 (P2)**: Requires SessionPlayer (T027) for extension in T046; parallel with US3

### Parallel Opportunities Within Phases

| Phase | Parallel group |
|-------|---------------|
| 1 | T002, T003, T004, T005 together |
| 2 | T007+T008, T010+T012+T013+T019+T020 together; T011 after T010; T017 after T011; T014 after T007+T008+T013 |
| 3 | T021, T022, T023, T024 together; T025 after T023+T024; T027 after T025+T021+T022 |
| 5 | T036, T037, T038 together |
| 6 | T042 independent; T043 after T027+T042 |
| 7 | T045 independent; T046 after T027+T045 |
| 8 | T048, T049, T050, T051 together |

---

## Parallel Example: Phase 2 Foundational

```bash
# Batch 1 — all independent, launch together:
Task: "Create src/shared/types/index.ts"                   # T007
Task: "Create src/english/vocab/types/vocab.types.ts"      # T008
Task: "Create src/shared/db/schema.ts"                     # T010
Task: "Create src/i18n.ts + src/locales/en/vocab.json"     # T012
Task: "Create src/english/vocab/services/priority-scorer.ts" # T013
Task: "Create src/shared/hooks/useAudio.ts"                # T019
Task: "Create src/data/yle-starters/animals.json + index.ts" # T020

# Batch 2 — after Batch 1 settles:
Task: "Create src/shared/constants/game-constants.ts"      # T009
Task: "Create src/shared/db/db.ts"                         # T011 (needs T010)
Task: "Create src/english/vocab/store/session-store.ts"    # T015
Task: "Create src/shared/store/profile-store.ts"           # T016
Task: "Create src/english/vocab/services/session-composer.ts" # T014 (needs T013)

# Batch 3 — after DB singleton ready:
Task: "Create src/english/vocab/hooks/useWordProgress.ts"  # T017 (needs T011)
Task: "Create src/english/vocab/hooks/useSession.ts"       # T018 (needs T014+T017)
```

---

## Implementation Strategy

### MVP First (US1 Only → Playable Introduce sessions)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**critical blocker**)
3. Complete Phase 3: US1 — Introduce activity
4. **STOP and VALIDATE**: Run `pnpm test:int -- introduce`; open app, play 10-word session
5. Ship/demo MVP

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → playable introduce sessions (MVP)
3. US2 → recognize sessions added → richer learning loop
4. US5 → progression tracking + WordMap stars + parent dashboard → full learning system
5. US3 → unscramble adds spelling challenge
6. US4 → fill-in-blank completes all 4 stages → full product
7. Polish → production-ready

### Parallel Team Strategy (3 developers)

After Phase 2 completes:
- **Dev A**: US1 (T021–T031) — shared components + introduce flow
- **Dev B**: US2 (T032–T035) + US5 unit tests (T036–T037) — recognize + mastery math
- **Dev C**: US3 (T042–T044) + US4 (T045–T047) — spelling activities (after T027 lands)

---

## Notes

- `[P]` = different files, no blocking dependencies — safe to parallelize
- `[USn]` label maps each task to a specific user story for traceability
- Each user story is independently completable and testable — stop at any checkpoint to validate
- No `any` types in exported interfaces; all game parameters via `game-constants.ts` only
- Files must stay under 200 lines — split into sub-components or helper modules if exceeded
- All UI strings via `t('vocab.<key>')` — zero hardcoded English in JSX per Constitution IV
- Commit after each logical task group; run `pnpm typecheck` before each commit
