# Ongtopica — Consolidated Product Specification

**Status**: Living consolidation (merges all feature specs to date)
**Created**: 2026-06-29
**Sources merged**:
- [001-vocab-learning](./001-vocab-learning/spec.md) — foundation (4-stage word learning)
- [002-vocab-progression-expansion](./002-vocab-progression-expansion/spec.md) — rotation, per-word unlocks, achievement stars
- [003-cambridge-skills-expansion](./003-cambridge-skills-expansion/spec.md) — multi-skill YLE curriculum, question-type registry

> **Purpose**: a single self-contained document covering the full product for handoff/review. The three source specs remain the authoritative per-feature records; this file integrates them and flags where the newest spec **reshapes** earlier requirements. Requirement IDs are namespaced by source to preserve traceability:
> - `VL-###` = Vocab Learning (001)
> - `VP-###` = Vocab Progression (002)
> - `CS-###` = Cambridge Skills (003)

---

## 1. Product Overview

Ongtopica is a **local-first, offline-capable PWA** that teaches English to young children (~6 years old) following the **Cambridge Young Learners English (YLE)** syllabus. It is tablet-primary, child-first (tap/drag, audio-led, no negative feedback), private (no external calls, per-device child profiles), and built for progressive mastery.

The product is delivered in three layers:

1. **Foundation (001)** — single-word vocabulary learning through a 4-stage ladder (Introduce → Recognize → Unscramble → Fill-in-blank) with spaced-repetition session composition, per-word mastery, profiles, parent dashboard, and offline audio.
2. **Progression expansion (002)** — lets Listen & Learn rotate through *all* words in a set, shows per-word progress as a 4-star row, unlocks activities per-word, and adds an achievements layer.
3. **Cambridge skills expansion (003)** — generalizes "activities" into a **question-type registry** organized by **skill** (Listening, Reading & Writing, Vocabulary; Speaking reserved) and **level** (Starters → Movers → Flyers), tracks mastery **per skill**, expands content to sentences/scenes/stories, adds new question types, and establishes a content-authoring pipeline.

---

## 2. Reconciliation — How Layer 3 Reshapes Layers 1–2

Where the newest spec changes earlier behavior, **the newer requirement takes precedence**. Everything not listed here is carried forward unchanged.

| Earlier behavior | Source | Reshaped by (003) | Net effect |
|---|---|---|---|
| Per-word **4-stage ladder** (Introduce→Recognize→Unscramble→Fill-blank) | VL-003, VP-003 | CS-001, CS-005, CS-008 | The four activities become **registered question types**; mastery is tracked **per skill**, not as one global per-word ladder. Existing per-word progress is migrated without loss. |
| **4-star row** per word | VP-003, VP-004 | CS-005 + Assumptions | Star/progress display is **extended per skill**; legacy 4-of-4 mastery still maps with no visible loss. |
| Activity unlock: **50%-of-set** and **one-word per-word** rules | VL-FR-003b, VP-005 | CS-006, CS-006a | Generalized into **per-skill question-type gating**, now toggleable via an **environment-variable feature flag** (free-play/teacher mode). |
| Content = **single words** only | VL-001/002 | CS-021, CS-022 | Content model expands to **word / sentence / scene / story**, each tagged by level. Words remain a valid content kind. |
| Fixed `ActivityType` union of 4 | VL-003 | CS-001 | Replaced by an extensible **question-type registry** (skill · level · content kind · scoring model). |

Everything else from 001 and 002 — feedback paradigm, retry/reveal, profiles, offline audio + toggle, no-external-calls, spaced-repetition priority scoring, achievements, rotation, lazy persistence — is **preserved as-is** and applies to all new question types.

### 2.1 Existing Activities → Skill / Question-Type Mapping (no feature is dropped)

The four currently-running activities are **not removed** — each becomes a registered question type under a skill. This makes the carry-over explicit:

| Existing activity (001/002) | Becomes question type | Skill | Notes |
|---|---|---|---|
| **Introduce** (Listen & Learn) | `introduce` | Listening | Passive exposure; still drives Listen & Learn rotation (VP-001). |
| **Recognize** (hear word → tap picture) | `recognize` | Listening | Word-level listening comprehension; distractor rule VP-014 preserved. |
| **Unscramble** ("scramble words" — tap letter tiles to spell) | `unscramble` | Reading & Writing | Per-tile validation preserved (VL-010); Build-a-Sentence (CS-013) reuses this mechanic. |
| **Fill-in-blank** (pick the missing letter) | `fill-in-blank` | Reading & Writing | `LETTER_CHOICE_COUNT` choices preserved (VL-011). |

The legacy per-word 4-star order (Listen → Recognize → Unscramble → Fill-blank) therefore splits across two skill tracks: **Listening** = {Introduce, Recognize, + new listening types} and **Reading & Writing** = {Unscramble, Fill-in-blank, + new R&W types}. Per-skill progress (CS-005) and the star row (VP-003, extended per skill) reflect this split; migration (CS-008) maps each word's existing stage onto the matching skill track with no visible loss.

---

## 3. Glossary & Named Constants

- **Skill**: Listening · Reading & Writing · Vocabulary · (reserved) Speaking.
- **Level**: Starters · Movers · Flyers (Cambridge YLE bands).
- **Question Type**: a registered interaction (skill, eligible levels, content kind, scoring model). Replaces the old fixed activity list.
- **Content Kind**: word · sentence · scene · story · pair-set · phoneme-tagged word.
- **WordSet**: a themed group of words (Animals, Food, …). 14 sets, ~174 words at Starters.
- **Named constants** (adjustable without code changes): `SESSION_WORD_COUNT=10`, `MASTERY_THRESHOLD=3`, `MAX_SESSION_MINUTES=8` (soft), `MAX_RETRIES=1`, `LETTER_CHOICE_COUNT=3`, `INITIAL_PRIORITY=1.0`, `STRUGGLE_WEIGHT=2.0`, `CONFIDENCE_WEIGHT=1.5`, `STAGE_UNLOCK_THRESHOLD=0.5`, `ROTATION_BATCH_SIZE=SESSION_WORD_COUNT`, plus new per-skill unlock thresholds and the unlock-gating feature flag.

---

## 4. User Stories (consolidated, grouped by area)

### A. Core word learning *(from 001)*
- **A1 — Introduce a new word** (P1): picture + auto-played audio, replayable, no judgment. Pure exposure.
- **A2 — Recognize by hearing** (P1): hear a word, tap the correct picture of 4; celebrate / gentle retry / reveal.
- **A3 — Unscramble** (P2): tap letter tiles, per-tile validation (wrong tile shakes, never placed); undo by tapping a filled slot.
- **A4 — Fill in the missing letter** (P2): pick the missing letter from `LETTER_CHOICE_COUNT` buttons; one retry then reveal.
- **A5 — Mastery progression & session composition** (P1): per-word stage + struggle history; spaced-repetition session of `SESSION_WORD_COUNT`; advance after `MASTERY_THRESHOLD` consecutive correct; per-set word map with stars.

### B. Progression expansion *(from 002)*
- **B1 — Listen & Learn cycles through every word** (P1): rotation across sessions covers the whole set without repeats until all heard; "heard X of N" indicator.
- **B2 — Per-word progress as 1–4 stars** (P1): a 4-star row per word, filling Listen→Recognize→Unscramble→Fill-blank; legacy single ⭐ = 4/4.
- **B3 — Per-word unlock of the next activity** (P2): an activity unlocks as soon as ≥1 word cleared the prior stage (additive to the 50% rule).
- **B4 — Achievements with star milestones** (P2): 5 fixed achievements, one-time celebration, Achievements screen from Home.
- **B5 — Progress summary on Home** (P3): compact earned-stars-vs-total per set tile.

### C. Cambridge skills expansion *(from 003)*
- **C1 — Listen & Answer** (P1): hear a spoken question, tap a picture/word answer; replay, gentle retry, reveal. *(Headline new type.)*
- **C2 — Per-skill learning paths** (P1): separate Listening / Reading & Writing / Vocabulary paths per set, each with its own progress and gating.
- **C3 — Richer question types per skill** (P2): Listen & Match, Listen & Sequence, True/False, Build-a-Sentence, Gap-fill, Answer-the-Question, Memory Match, Odd-One-Out/Sort, Phonics (+ Listen & Colour variant).
- **C4 — Multi-level curriculum** (P2): manual level selector; content/question-types tagged by level; per-level progress preserved across switches.
- **C5 — Content-authoring pipeline** (P2): non-engineers add validated JSON content (word/sentence/scene/story); validation rejects missing assets/fields.

*(Full acceptance scenarios for each story live in the source specs; this consolidation preserves their priorities and intent.)*

---

## 5. Functional Requirements (consolidated)

### 5.1 Foundation — Word Learning *(001)*
- **VL-001**: Present vocabulary from Cambridge YLE Starters thematic word sets.
- **VL-002**: Each word MUST have a picture and an audio pronunciation.
- **VL-003**: Support 4 activity stages per word: Introduce, Recognize, Unscramble, Fill-in-blank. *(→ generalized by CS-001.)*
- **VL-003a**: WordSet screen shows one session-entry button per activity stage, each composing a spaced-repetition session filtered to that stage.
- **VL-003b**: Stage buttons 2–4 locked until `STAGE_UNLOCK_THRESHOLD` (50%) of the set is mastered at the prior stage; locked tap shows guiding shake/pulse, no negative tone. *(→ generalized by CS-006/006a.)*
- **VL-004**: A word advances only after `MASTERY_THRESHOLD` consecutive correct at its current stage.
- **VL-005**: Each session contains `SESSION_WORD_COUNT` words; `MAX_SESSION_MINUTES` is a soft target.
- **VL-005a**: When in-progress words < `SESSION_WORD_COUNT`, fill remaining slots with next unstarted words from the same set at Stage 1. *(Note: 002 changes the fill rule for per-word-unlock sessions — see VP-006.)*
- **VL-006**: Compose sessions via spaced-repetition priority: (1) struggling due words, (2) stage-appropriate by interval, (3) new unstarted Stage-1 words.
- **VL-006a**: Record every incorrect answer as a struggle event against the word in the active profile.
- **VL-006b**: Each word holds a numeric priority score; incorrect ×`STRUGGLE_WEIGHT`, correct ÷`CONFIDENCE_WEIGHT`; composer fills highest-priority eligible words first.
- **VL-007**: Every correct answer triggers immediate celebration + positive mascot reaction.
- **VL-008**: Every incorrect answer triggers gentle encouragement — no negative sounds, red crosses, or shame.
- **VL-009**: Incorrect answers allow exactly `MAX_RETRIES` retry before reveal-with-encouragement.
- **VL-010**: Unscramble uses tappable/draggable letter tiles — no free keyboard input.
- **VL-011**: Fill-in-blank presents exactly `LETTER_CHOICE_COUNT` letter buttons — no free keyboard input.
- **VL-012**: Persist per-word mastery across sessions; write `WordProgress` after each answer (not batched); create records lazily on first appearance.
- **VL-013**: Each WordSet shows its own word map; fully-mastered words marked with a star.
- **VL-014**: Word audio available offline after first load.
- **VL-015**: Child-friendly offline/error state if audio cannot load; activity remains completable without audio.
- **VL-016**: Parent/teacher can toggle audio on/off from settings reachable from Home.
- **VL-017**: On launch, show a profile picker (large avatar + name); tapping reads the name aloud and enters that profile.
- **VL-018**: Parent/teacher dashboard shows, per child per word: total sessions, total incorrect attempts, current stage.

### 5.2 Progression Expansion *(002)*
- **VP-001**: Listen & Learn sessions cover every word in the set across consecutive sessions without repeating until all heard.
- **VP-002**: Record a per-word "heard" state when a Listen & Learn session containing it completes.
- **VP-003**: Display a 4-star row per word, filling Listen→Recognize→Unscramble→Fill-blank. *(→ extended per skill by CS-005.)*
- **VP-004**: Treat the legacy single mastery star as 4/4 stars — no lost indicator.
- **VP-005**: Allow entering Recognize/Unscramble/Fill-blank as soon as ≥1 word cleared the prior stage (additive to the 50% rule). *(→ generalized by CS-006/006a.)*
- **VP-006**: For a per-word-unlock session at stage X, compose from words at stage X or higher, ordered by struggle-priority; up to 10; shorter if fewer eligible; no padding/repetition/filler.
- **VP-007**: Persist per-profile achievement records (identifier + earned timestamp).
- **VP-008**: One-time, non-blocking celebration overlay the first time each achievement is earned, reusing existing celebration primitives.
- **VP-009**: Dedicated Achievements screen from Home listing earned (with date) and locked (with hint) badges.
- **VP-010**: "heard X of N" indicator next to the Listen & Learn button, updating with progress.
- **VP-011**: Compact earned-stars-vs-total indicator on each Home tile.
- **VP-012**: All new state (heard, stars, achievements, rotation cursor) is per-profile, survives restarts, never synced externally.
- **VP-013**: Back-fill "heard" state for any pre-existing word past Listen & Learn so returning users keep visible progress.
- **VP-014**: Recognize distractor pictures drawn at random from the same WordSet (excluding the answer); not gated by introduced state.

### 5.3 Cambridge Skills Expansion *(003)*
**Registry & composition**
- **CS-001**: Represent each interaction as a registered question type (skill, eligible levels, content kind, scoring model) so new types need no composer/progression changes.
- **CS-002**: Compose a session from content items paired with a compatible question type, only items eligible for the chosen skill/level; never mix other skills into a single-skill path.
- **CS-003**: Preserve the existing spaced-repetition priority model when selecting items.
- **CS-004**: Session contains at most `SESSION_WORD_COUNT` items; fewer eligible → use all available, no cross-skill/level padding.

**Per-skill progress**
- **CS-005**: Track mastery independently per skill per profile.
- **CS-006**: Within a skill, gate harder question types behind a mastery threshold on prerequisites (guiding, non-negative locked state).
- **CS-006a**: All progression gating (question-type + level) is controlled by a single **environment-variable feature flag**; enabled by default, disabled = free-play/teacher mode (everything open). Resolved at build/startup; no in-app UI required.
- **CS-007**: WordSet screen shows one entry per available skill path with its own progress; omit skills with no content for the set.
- **CS-008**: Migrate existing per-word stage progress into the per-skill model with no visible loss.

**New question types**
- **CS-009**: **Listen & Answer** — spoken question + tappable choices; auto-play/replay; one retry then reveal.
- **CS-010**: **Listen & Match** — scene with tappable regions; audio names a target.
- **CS-011**: **Listen & Sequence** — order narrated story frames.
- **CS-012**: **True/False about a picture** — judge a sentence about a picture.
- **CS-013**: **Build-a-Sentence** — assemble word tiles left-to-right, per-step validation (consistent with Unscramble).
- **CS-014**: **Gap-fill** — choose the missing word in a short text; one retry then reveal.
- **CS-015**: **Answer-the-Question** — comprehension question on a short picture-story.
- **CS-016**: **Memory Match** — match picture↔word pairs by flipping cards.
- **CS-017**: **Odd-One-Out / Sort** — tap the misfit or sort into category buckets.
- **CS-018**: **Phonics first-sound** — identify which option begins with a given sound.
- **CS-019**: All new types use tap/drag only — no free-text. **Tap-first**: two-tap pairing instead of line-drawing; tap-to-place instead of free drag; any drag snaps to large zones; targets ≥ ~2 cm.
- **CS-019a**: Each question type opens with a non-scored worked-example/demo turn before its first scored item.
- **CS-019b**: Provide a **Listen & Colour** scene variant (tap colour from a fixed palette, tap object to fill) — exercises vocab + colours + prepositions.
- **CS-020**: All new types reuse the existing feedback paradigm (celebrate on success; gentle encouragement on error; `MAX_RETRIES` then reveal where applicable).

**Content model & pipeline**
- **CS-021**: Support content kinds beyond words — at least sentence, scene, story — each with the fields its question types need.
- **CS-022**: Every content item tagged with its level(s).
- **CS-023**: All content bundled for offline use; no runtime external fetches.
- **CS-024**: Non-engineers add/edit content as structured files validated against a per-content-kind schema, no code changes.
- **CS-025**: Validation fails with a specific, item-identifying message on missing asset, missing required field, or inconsistent answer/choice set.

**Multi-level**
- **CS-026**: Allow selecting a level; show only that level's word sets and eligible question types.
- **CS-027**: Track/persist progress independently per level; switching/adding levels never resets another.

**Cross-cutting**
- **CS-028**: Every audio-dependent question remains answerable/advanceable when audio fails (retry control + text fallback).
- **CS-029**: All new screens meet the accessibility bar (labels for hotspots/frames; audio-only or text fallback; automated checks).
- **CS-030**: Parent/teacher dashboard surfaces progress per child by skill (and level), extending VL-018.
- **CS-031**: Speaking out of scope, but the registry reserves a speaking skill + self-assessment scoring model for later.

---

## 6. Key Entities (consolidated)

- **WordSet** — themed group of Words; tagged by level.
- **Word** — vocabulary entry (text, picture, audio, blank-letter index, letter choices); one kind of ContentItem.
- **ContentItem / ContentKind** — word · sentence · scene · story · pair-set · phoneme-tagged word; carries question-type fields; level-tagged.
- **Scene** — background image + named tappable regions (hotspots) + audio prompts.
- **Story** — ordered narrated frames + optional comprehension questions.
- **QuestionType** — registered interaction (skill, levels, content kind, scoring model). Replaces the fixed activity union.
- **Skill / Level** — learning strand / Cambridge band; gate availability and group progress.
- **WordProgress** — per-child per-word stage, consecutive-correct, total incorrect, priority score, first-heard timestamp.
- **SkillProgress** — per-child per-skill (and level) progress, unlock state, spaced-repetition data — generalizes WordProgress.
- **Rotation Cursor** — per-child per-WordSet pointer for Listen & Learn rotation.
- **Achievement** — per-child earned milestone (id + timestamp); fixed catalog.
- **ChildProfile** — local device profile (name + avatar); owns all per-profile state.
- **ContentSchema** — validation contract per content kind, used by the authoring pipeline.

---

## 7. Success Criteria (consolidated)

**Foundation (001)**
- **VL-SC-001**: Full 10-word session (all 4 activity types) completable in < 8 min on a tablet (soft).
- **VL-SC-002**: Word audio plays within 1 s of the activity appearing.
- **VL-SC-003**: `MASTERY_THRESHOLD` consecutive correct advances the word next session, 100% reliable.
- **VL-SC-004**: 100% of activities operable offline after first load.
- **VL-SC-005**: Audio enable/disable in ≤ 2 taps from any screen.
- **VL-SC-006**: Zero external navigation links in the vocab feature.

**Progression (002)**
- **VP-SC-001**: Every word in a 31-word set heard within 4 consecutive Listen & Learn sessions, no manual reset.
- **VP-SC-002**: After 1 Listen & Learn session of 10 words, Recognize is playable on exactly those 10.
- **VP-SC-003**: A parent can determine heard/recognized/spelled/mastered counts for a set within 30 s on the WordSet page.
- **VP-SC-004**: Achievement celebration appears within 1 s of the qualifying action.
- **VP-SC-005**: Mid-progression users see a star row matching their existing stage — no perceived regression.
- **VP-SC-006**: 90% of words in any 14-word set heard within 30 min of cumulative use, unaided.
- **VP-SC-007**: At least one achievement earnable in the first session of a new profile.

**Cambridge skills (003)**
- **CS-SC-001**: A full single-skill Listen & Answer session completable end-to-end in < 8 min on a tablet.
- **CS-SC-002**: Any available skill path startable in ≤ 2 taps, each showing distinct correct progress.
- **CS-SC-003**: A new valid content item is playable after a content rebuild, no code change.
- **CS-SC-004**: 100% of invalid content items caught by validation with an identifying message.
- **CS-SC-005**: 100% of audio-dependent questions answerable/advanceable offline or on audio failure.
- **CS-SC-006**: Returning users retain 100% of earned word mastery after migration to per-skill.
- **CS-SC-007**: At first release (MVP), ≥ 4 new question types — the 3 Tier-A vocab games + Listen & Answer — playable end-to-end on Starters; remaining types follow later.
- **CS-SC-008**: Adding Movers/Flyers content does not alter/reset existing Starters progress.
- **CS-SC-009**: Zero external links or runtime external network calls in new question types or content loading.
- **CS-SC-010**: Every new screen passes automated accessibility checks with no critical violations.

---

## 8. Decisions (locked) & Roadmap

**Locked decisions (003 review):**
- **MVP**: Tier-A vocab games (Memory Match, Odd-One-Out, Phonics) + Listen & Answer, on the registry + per-skill foundation.
- **Level advancement**: manual selector; architecture spans all three levels.
- **Audio**: TTS at build time now (bundled offline), human re-record top content later.
- **Authoring**: validated JSON files extending the current per-set convention.
- **Unlock gating**: env-var feature flag (CS-006a), on by default.

**Phased roadmap (003):** P1 registry + per-skill migration → P2 Tier-A games → P3 content pipeline + schemas → P4 Listening suite → P5 Reading & Writing suite → P6 Movers level → P7 Flyers + revisit Speaking.

---

## 9. Assumptions (consolidated)

- **Curriculum**: Cambridge YLE; Starters content ships first, Movers/Flyers sequenced later; the architecture supports all three.
- **Speaking deferred**: no microphone/recording/scoring this cycle; registry slot reserved.
- **Audio/visual assets**: child-safe `.webp` images, `.mp3` audio, one picture + one audio per word; mascot/animation provided separately.
- **Profiles**: local device profiles, typically one active; no cloud sync/login.
- **Reuse**: existing constants, feedback/celebration/locked-state patterns, and the four base activities (now question types) are reused, not replaced.
- **Research-grounded design** (folded into CS-019/019a + cross-cutting): tap-first for under-9s; audio always replayable and paired with a visual cue; choice-of-three default; receptive→recognition→cued-recall→production scaffolding; systematic-phonics-led literacy in meaningful context. *(Sources: Cambridge YLE handbook/test-format; NN/g child-UX; early-literacy/SLA research.)*
- **Star granularity**: 4 separate stars (one per stage), extended per skill.
- **Achievements**: 5 fixed, local-only, no leaderboards/sharing/sync.

---

## 10. Out of Scope

- Backend telemetry, cross-device sync, shared leaderboards.
- Parent-authored/custom achievements; randomized Listen & Learn shuffle order.
- Speaking/pronunciation capture and scoring (deferred; reserved in registry).
- Graphical content CMS (validated JSON files instead this cycle).
- Changes to per-word audio, pictures, or the core scoring formula (beyond the per-skill generalization).
- Multiple pronunciation variants per word.

---

## 11. Traceability Summary

| Layer | Source spec | Stories | FRs | Success criteria |
|---|---|---|---|---|
| Foundation | 001-vocab-learning | A1–A5 | VL-001 … VL-018 (incl. 003a/b, 005a, 006a/b) | VL-SC-001 … 006 |
| Progression | 002-vocab-progression-expansion | B1–B5 | VP-001 … VP-014 | VP-SC-001 … 007 |
| Skills | 003-cambridge-skills-expansion | C1–C5 | CS-001 … CS-031 (incl. 006a, 019a/b) | CS-SC-001 … 010 |

**Precedence rule**: where a `CS-` requirement reshapes a `VL-`/`VP-` requirement (see §2), the `CS-` version governs. All other earlier requirements remain in force.
