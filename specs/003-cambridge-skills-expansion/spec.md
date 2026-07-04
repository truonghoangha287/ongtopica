# Feature Specification: Cambridge Skills Expansion

**Feature Branch**: `004-cambridge-skills-expansion`
**Created**: 2026-06-29
**Status**: Ready for Planning (decisions locked)
**Input**: User description: "Evolve the ongtopica vocab app from a word-level activity ladder into a multi-skill Cambridge YLE curriculum (Starters→Movers→Flyers). Introduce a question-type registry, per-skill progress tracking, a richer content model (word/sentence/scene/story), and new question types prioritizing Listening, Reading & Writing, and vocab games. Speaking is deferred. Full content-authoring pipeline."
**Predecessor proposal**: [proposal.md](./proposal.md)

## Overview

Today the app teaches single words through four fixed activities (Introduce → Recognize → Unscramble → Fill-in-blank), all gated by a per-word mastery ladder. This covers only a slice of the Cambridge Young Learners English (YLE) syllabus — single-word recognition and spelling.

This feature evolves the app into a **multi-skill curriculum** that mirrors the Cambridge YLE papers (Listening, Reading & Writing; Speaking deferred) across all three levels (Starters → Movers → Flyers). It does so by (1) generalizing "activities" into a registry of **question types** organized by **skill** and **level**, (2) tracking mastery **per skill** rather than as one global ladder, (3) expanding the content model beyond single words to **sentences, scenes, and stories**, and (4) establishing a repeatable **content-authoring pipeline** so new content can be added without code changes.

All work preserves the existing constitution: child-first tap/drag UX, accessibility, a safe offline sandbox with no external calls, and progressive mastery.

## Relationship to Prior Specs (Dependencies)

This spec is an **additive expansion** that builds on — and does not restate — the already-specified behavior in:
- **[001-vocab-learning](../001-vocab-learning/spec.md)** — the 4 base activities, `MASTERY_THRESHOLD` progression, spaced-repetition session composition, lazy `WordProgress` persistence, per-set word map, parent dashboard, profile picker, offline audio + audio toggle, no external links.
- **[002-vocab-progression-expansion](../002-vocab-progression-expansion/spec.md)** — Listen & Learn rotation coverage, the 4-star progress row, per-word activity unlock, achievements, Home progress tiles, Dexie v1→v2 migration, Recognize distractor selection.

Those requirements remain in force unless explicitly reshaped below. This feature interacts with them in three ways:

| Prior behavior | This spec's treatment |
|---|---|
| **Preserved as-is** — feedback/celebration/retry-reveal paradigm, profile picker, offline audio + audio toggle, no-external-calls, spaced-repetition priority scoring, achievements framework, lazy per-answer persistence | Reused directly; new question types and screens MUST conform to them (FR-003, FR-020, FR-023, FR-028, FR-029). |
| **Reshaped** — the per-word 4-stage ladder (001) and 4-star row (002) | Generalized into **per-skill progress tracks** (FR-005); the four activities become registered question types under their skills (Assumptions); existing per-word progress is migrated without loss (FR-008); the star row is extended per skill (Assumptions). |
| **Reshaped** — stage-unlock rules: 50%-of-set and one-word per-word unlock (001 FR-003b, 002 FR-005) | Generalized into per-skill question-type gating (FR-006), now additionally toggleable via the FR-006a environment-variable feature flag. |

If a single self-contained document is required (e.g., for an external stakeholder), these three specs can be consolidated into one master spec on request; by default they remain layered per Spec-Kit convention.

**Existing activities are carried over, not dropped.** Each becomes a registered question type under a skill:

| Existing activity | Question type | Skill |
|---|---|---|
| Introduce (Listen & Learn) | `introduce` | Listening |
| Recognize (hear → tap picture) | `recognize` | Listening |
| Unscramble (tap letter tiles to spell) | `unscramble` | Reading & Writing |
| Fill-in-blank (pick missing letter) | `fill-in-blank` | Reading & Writing |

Their existing behavior (per-tile validation, distractor selection, letter-choice count, feedback/retry) is preserved; FR-008 migrates each word's current stage onto the matching skill track.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Listen and Answer a Spoken Question (Priority: P1)

A child taps the "Listening" path. A short question is spoken aloud ("Where is the cat?"). Four picture (or word) choices appear. The child taps the answer. Correct answers celebrate; the first incorrect answer gives a gentle "try again" and replays the question; a second miss reveals the answer with encouragement. The child can replay the audio any time.

**Why this priority**: This is the headline new capability and the simplest sentence-level listening comprehension type. It proves the question-type registry, the richer (sentence) content model, and per-skill progress in one vertical slice — a viable MVP on its own.

**Independent Test**: A Listening session composed only of Listen-and-Answer items can be played end-to-end through `SESSION_WORD_COUNT` questions, with audio auto-play, replay, gentle retry, reveal, and a closing celebration — without any other new question type present.

**Acceptance Scenarios**:

1. **Given** a Listen-and-Answer question loads, **When** the screen appears, **Then** the question audio plays automatically and the answer choices are shown as large tappable options.
2. **Given** the child taps the correct choice, **When** the answer registers, **Then** a celebration animation and positive mascot reaction play before advancing.
3. **Given** the child taps an incorrect choice, **When** the answer registers, **Then** a gentle encouraging cue is shown (never a negative sound or red X) and the question audio replays for one retry.
4. **Given** the child misses twice, **When** the second attempt registers, **Then** the correct choice is highlighted with encouragement and the session advances.
5. **Given** the audio fails to load, **When** the screen appears, **Then** a "tap to retry" speaker control is shown and the question remains answerable (question text shown as fallback).

---

### User Story 2 — Per-Skill Learning Paths (Priority: P1)

From a word set, the child sees separate paths for each skill (Listening, Reading & Writing, Vocabulary Games). Each path shows its own progress. Progress in one skill does not depend on progress in another. Within a skill, harder question types unlock as the child demonstrates mastery on easier ones.

**Why this priority**: Without per-skill structure, new question types have nowhere to live and the single 4-stage ladder cannot represent multiple skills. This is the connective tissue that makes everything else additive.

**Independent Test**: Given a profile with known per-skill progress, the relevant paths display the correct progress and unlock state, and starting a path composes a session containing only that skill's eligible items.

**Acceptance Scenarios**:

1. **Given** a child opens a word set, **When** the set screen loads, **Then** one entry per skill path is shown with that skill's own progress indicator.
2. **Given** a child has made progress in Listening but none in Reading & Writing, **When** the set screen loads, **Then** the Listening path reflects that progress and the Reading & Writing path shows its own independent (un-started) state.
3. **Given** a skill path's harder question type is not yet unlocked, **When** the child taps it, **Then** a gentle locked-state animation guides them to the prerequisite (no negative tone), consistent with existing locked-stage behavior.
4. **Given** a child starts a skill path, **When** the session composes, **Then** it contains only items eligible for that skill.

---

### User Story 3 — Richer Question Types per Skill (Priority: P2)

The child encounters varied question types within each skill:
- **Listening**: Listen & Match (tap the object/spot in a scene that the audio names), Listen & Sequence (order story frames as narrated).
- **Reading & Writing**: True/False about a picture, Build-a-Sentence (order word tiles to caption a picture), Gap-fill (choose the word for a blank in a short text), Answer-the-Question (answer a question about a short picture-story).
- **Vocabulary Games**: Memory Match (picture↔word pairs), Odd-One-Out / Sort (category grouping), Phonics first-sound.

Each type uses tap/drag only, reuses existing feedback/celebration/retry patterns, and is composable into a session.

**Why this priority**: These deliver the breadth of Cambridge skill coverage. They depend on Stories 1–2 being in place but each is independently shippable once the registry and content model exist.

**Independent Test**: For each question type, a single-type session of `SESSION_WORD_COUNT` items can be played end-to-end with correct interaction, feedback, retry/reveal where applicable, and a closing celebration.

**Acceptance Scenarios**:

1. **Given** a Listen & Match scene loads, **When** the audio names a target, **Then** tapping the correct hotspot celebrates and tapping a wrong hotspot gives a gentle cue with one retry.
2. **Given** a True/False question loads, **When** a sentence about the picture is presented, **Then** the child can tap ✓ or ✗ and receives feedback consistent with the Recognize pattern.
3. **Given** a Build-a-Sentence question loads, **When** the child taps word tiles, **Then** tiles place left-to-right with per-step validation consistent with Unscramble (a wrong tile is rejected with a shake, never placed).
4. **Given** a Memory Match game loads, **When** the child flips two cards, **Then** matching picture/word pairs stay revealed with celebration and non-matches flip back gently.
5. **Given** an Odd-One-Out question loads, **When** the child taps the item that does not belong (or sorts items into category buckets), **Then** correct grouping celebrates and incorrect grouping gives a gentle cue.

---

### User Story 4 — Multi-Level Curriculum (Starters → Movers → Flyers) (Priority: P2)

The child (or a parent) can choose a level. Content and question types are tagged by level; harder levels add larger vocabulary, longer texts, and more grammar-bearing sentences. Progress is tracked independently per level so adding Movers/Flyers never resets Starters progress.

**Why this priority**: The architecture must accommodate three levels from the start, but only Starters content ships first. Designing level tagging now avoids a costly retrofit; shipping Movers/Flyers content is sequenced later.

**Independent Test**: With content tagged across two levels, selecting a level shows only that level's word sets and question types, and progress recorded at one level is preserved when switching to and from another.

**Acceptance Scenarios**:

1. **Given** content exists for more than one level, **When** the child opens the app, **Then** a level can be selected and only that level's word sets are shown.
2. **Given** a question type is restricted to a higher level, **When** the child is at a lower level, **Then** that question type does not appear.
3. **Given** a child has progress at Starters, **When** they switch to Movers and back, **Then** Starters progress is unchanged.

---

### User Story 5 — Content-Authoring Pipeline (Priority: P2)

A content author (non-engineer) can add new content — words, sentences, scenes, stories — by editing structured content files validated against a schema, without changing application code. Validation catches missing assets, missing audio, or mismatched answer sets before the content ships.

**Why this priority**: Content volume is the long pole for every listening/reading question type. A validated pipeline is what makes Stories 1, 3, and 4 sustainable rather than one-off.

**Independent Test**: Adding a new valid content item makes it available in a session after a content rebuild; adding an invalid item (e.g., referencing a missing image or audio file, or a True/False item with no truth value) is rejected by validation with a clear message and does not ship.

**Acceptance Scenarios**:

1. **Given** a new content item conforming to its content-kind schema, **When** content is rebuilt, **Then** the item becomes available to sessions for its skill and level.
2. **Given** a content item that references a missing image or audio asset, **When** content validation runs, **Then** validation fails and identifies the offending item and missing asset.
3. **Given** a content item missing a required field for its question type (e.g., no answer set, no truth value, no ordered frames), **When** validation runs, **Then** validation fails with a specific message naming the missing field.

---

### Edge Cases

- **Mixed-skill session vs single-skill path**: A skill path composes only that skill's items; the system must not pad a Listening path with Reading items, and vice-versa.
- **Insufficient eligible content**: If a skill/level has fewer eligible items than `SESSION_WORD_COUNT`, the session uses all available items rather than padding with ineligible ones.
- **Audio failure on a sentence/story**: Any audio-dependent question must remain completable when audio fails — text fallback shown, "tap to retry" available; never a dead-end.
- **Scene with overlapping hotspots**: Tappable regions must not overlap ambiguously; a tap resolves to exactly one target.
- **Story frame count varies**: Sequence/answer-the-question content may have 2–4 frames; the UI must not assume a fixed count.
- **Returning users from earlier versions**: Existing per-word progress must map onto the new per-skill model without visible loss of mastery (e.g., prior Recognize/Unscramble/Fill-blank progress maps to the Listening/Reading skills as appropriate).
- **Question type unavailable for a set**: If a word set has no content for a given question type, that type is simply absent from the path (no empty/broken entry).
- **Child exits mid-session**: Progress for completed items is saved per item (consistent with existing per-answer persistence); the session restarts cleanly.

## Requirements *(mandatory)*

### Functional Requirements

#### Question-Type Registry & Composition
- **FR-001**: The system MUST represent each learning interaction as a registered question type described by its skill, eligible level(s), required content kind, and scoring model — so new question types can be added without changing the session-composition or progression logic.
- **FR-002**: The system MUST compose a session from content items paired with a compatible question type, selecting only items eligible for the chosen skill (and level), and MUST NOT mix items from other skills into a single-skill path.
- **FR-003**: The system MUST preserve the existing spaced-repetition priority model (struggling items reviewed sooner, confident items spaced further) when selecting items for a session.
- **FR-004**: Each session MUST contain at most `SESSION_WORD_COUNT` items; when fewer eligible items exist, the session MUST use all available eligible items without padding from other skills or levels.

#### Per-Skill Progress
- **FR-005**: The system MUST track mastery progress independently per skill for each child profile, so progress in one skill does not advance or regress another.
- **FR-006**: Within a skill, the system MUST gate harder question types behind a mastery threshold on the prerequisite question type(s), consistent with the existing stage-unlock behavior (locked entries show a guiding, non-negative animation on tap).
- **FR-006a**: All progression gating (question-type unlocking within a skill, and level gating) MUST be controlled by a single configurable **feature flag set via an environment variable**. When the flag is enabled (default), gating applies as in FR-006/FR-026. When disabled, all eligible question types and levels are available immediately with no prerequisite gating — a free-play / teacher mode. The flag's value MUST be resolved at build/startup; no in-app UI is required to change it.
- **FR-007**: The word-set screen MUST present one entry per available skill path, each showing that skill's own progress, and MUST omit skills that have no content for the set.
- **FR-008**: The system MUST migrate existing per-word stage progress into the new per-skill model without visible loss of previously earned mastery.

#### New Question Types
- **FR-009**: The system MUST provide a **Listen & Answer** question type: a spoken question with a set of tappable answer choices, auto-playing and replayable audio, one retry, then reveal-with-encouragement.
- **FR-010**: The system MUST provide a **Listen & Match** question type: a scene with tappable regions; the audio names a target and tapping the correct region succeeds with the standard retry/reveal feedback.
- **FR-011**: The system MUST provide a **Listen & Sequence** question type: narrated story frames the child orders; correct ordering celebrates with the standard gentle feedback for mistakes.
- **FR-012**: The system MUST provide a **True/False about a picture** question type: a picture plus a presented sentence the child judges as true or false, with feedback consistent with Recognize.
- **FR-013**: The system MUST provide a **Build-a-Sentence** question type: tappable word tiles assembled left-to-right with per-step validation (a wrong tile is rejected with a shake and never placed), consistent with Unscramble.
- **FR-014**: The system MUST provide a **Gap-fill** question type: a short text with one missing word the child selects from a small set of choices, with one retry then reveal.
- **FR-015**: The system MUST provide an **Answer-the-Question** question type: a short picture-story followed by a comprehension question with tappable answer choices.
- **FR-016**: The system MUST provide a **Memory Match** game: picture↔word pairs the child matches by flipping cards, with celebration on match and gentle flip-back on non-match.
- **FR-017**: The system MUST provide an **Odd-One-Out / Sort** game: the child taps the item that does not belong or sorts items into category buckets, with gentle feedback on mistakes.
- **FR-018**: The system MUST provide a **Phonics first-sound** question type: the child identifies which option begins with a given sound, with the standard gentle feedback.
- **FR-019**: All new question types MUST use tap/drag interactions only — no free-text keyboard entry. Interactions MUST be **tap-first**: because fine motor control is still developing at age 6, name→person and item→target associations SHOULD use two-tap pairing (tap source, then tap target) rather than continuous line-drawing, and tile/answer placement SHOULD use tap-to-place; where a drag is genuinely needed it MUST snap to large drop zones with generous tolerance. Touch targets SHOULD be at least ~2 cm.
- **FR-019a**: Each question type MUST open with a non-scored worked-example/demo turn before its first scored item, so the child learns the mechanic before it counts (mirrors the Cambridge exam's per-part example).
- **FR-019b**: The system SHOULD provide a **Listen & Colour** variant of the scene-based listening type: the child taps a colour from a fixed palette then taps an object to fill it ("colour the bird above the door blue"), exercising vocabulary, colours, and prepositions together — a signature Cambridge listening task.
- **FR-020**: All new question types MUST reuse the existing feedback paradigm: immediate celebration on success, gentle encouragement on error (no negative sounds, red crosses, or shame), `MAX_RETRIES` retry then reveal-with-encouragement where a retry applies.

#### Content Model & Pipeline
- **FR-021**: The content model MUST support multiple content kinds beyond single words — at minimum sentence, scene, and story — each with the fields its question types require (e.g., sentence text + audio + truth value; scene image + named tappable regions; story ordered frames + narration + comprehension question).
- **FR-022**: Every content item MUST be tagged with the level(s) it belongs to (Starters / Movers / Flyers).
- **FR-023**: All content (text, images, audio) MUST be bundled for offline use after first load — no runtime external fetches.
- **FR-024**: The system MUST provide a content-authoring path in which non-engineers add or edit content as structured files validated against a per-content-kind schema, without code changes.
- **FR-025**: Content validation MUST fail with a specific, item-identifying message when an item references a missing asset, omits a required field for its question type, or has an answer/choice set that is internally inconsistent.

#### Multi-Level
- **FR-026**: The system MUST allow selecting a level and MUST show only that level's word sets and eligible question types.
- **FR-027**: The system MUST track and persist progress independently per level so adding or switching levels never resets another level's progress.

#### Cross-Cutting
- **FR-028**: Every audio-dependent question MUST remain fully answerable and advanceable when audio fails to load, showing a child-friendly retry control and a text fallback.
- **FR-029**: All new screens MUST meet the existing accessibility bar (meaningful labels for interactive regions including scene hotspots and story frames; an audio-only or text fallback path; automated accessibility checks).
- **FR-030**: The parent/teacher dashboard MUST surface progress per child broken down by skill (and level), extending the existing per-word visibility.
- **FR-031**: Speaking is explicitly out of scope for this feature, but the question-type registry MUST reserve a place for a speaking skill and a self-assessment scoring model so it can be added later without rework.

### Key Entities *(include if feature involves data)*

- **Skill**: A learning strand — Listening, Reading & Writing, Vocabulary, (reserved) Speaking. Progress is tracked per skill.
- **Level**: A Cambridge YLE band — Starters, Movers, Flyers. Tags content and word sets; gates question-type availability.
- **QuestionType**: A registered interaction described by its skill, eligible levels, required content kind, and scoring model (binary / per-step / self-assess). The unit that replaces the hard-coded activity union.
- **ContentItem**: A piece of learnable content of a given **ContentKind** (word, sentence, scene, story, pair-set, phoneme-tagged word). Carries the fields its question types need and is tagged with level(s).
- **Scene**: A content kind with a background image and named tappable regions (hotspots), plus audio prompts.
- **Story**: A content kind with ordered narrated frames and optional comprehension questions.
- **SkillProgress**: Per child profile, per skill (and level): the child's progress, unlock state of question types, and spaced-repetition priority data — generalizing today's per-word progress.
- **ChildProfile**: Existing entity; now associated with per-skill, per-level progress.
- **ContentSchema**: The validation contract for each content kind, used by the authoring pipeline to accept or reject content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A child can complete a full single-skill Listening session (Listen-and-Answer) end-to-end, including audio replay and gentle retry, in under 8 minutes on a standard tablet (soft target, consistent with current pacing).
- **SC-002**: A child (or parent) can start any available skill path from a word set in at most 2 taps, and each path shows distinct, correct progress for that skill.
- **SC-003**: Adding a new valid content item makes it playable in the relevant skill/level session after a content rebuild, with no application-code change required.
- **SC-004**: 100% of invalid content items (missing asset, missing required field, inconsistent answer set) are caught by validation before shipping, each with a message identifying the item and the problem.
- **SC-005**: 100% of audio-dependent questions remain answerable and advanceable when offline or when audio fails to load.
- **SC-006**: Returning users retain 100% of previously earned word mastery after migration to the per-skill model (no visible loss).
- **SC-007**: At first release (locked MVP), at least 4 new question types — the 3 Tier-A vocabulary games (Memory Match, Odd-One-Out, Phonics) plus Listen & Answer — are playable end-to-end on Starters content; the remaining Listening and Reading & Writing types follow in later phases.
- **SC-008**: Adding Movers or Flyers content does not alter or reset any existing Starters progress (verified by before/after progress comparison).
- **SC-009**: Zero external navigation links or runtime external network calls exist anywhere in the new question types or content loading.
- **SC-010**: Every new screen passes automated accessibility checks with no critical violations.

## Decisions (locked with stakeholder)

These were confirmed during review and are no longer open:

- **First-release scope (MVP)**: Ship the **Tier-A vocabulary games (Memory Match, Odd-One-Out, Phonics) plus Listen & Answer**, on top of the Phase 1 registry + per-skill foundation. This delivers fast value (Tier-A needs no new content) while proving the registry and the sentence content kind via Listen & Answer. Other listening/reading types follow in later phases.
- **Level advancement**: A **manual level selector** (Starters / Movers / Flyers). No automatic promotion on mastery in this feature.
- **Sentence/story audio source**: **TTS generated at build time now**, bundled offline; high-value content may be re-recorded with a human voice later. Voice consistency is a content-authoring concern, not a runtime feature.
- **Content authoring**: Non-engineers add content as **validated structured JSON files** extending the existing per-set convention, with a schema-validation step. No graphical CMS in this feature (possible later enhancement).
- **Unlock feature flag**: Progression gating is toggleable via an environment-variable feature flag (see FR-006a) so it can be disabled for free-play / teacher use.

## Assumptions

- **Speaking deferred**: No microphone capture, recording, or speech scoring is built in this feature; only a reserved registry slot. (Per brainstorming decision.)
- **Level rollout**: Starters content ships first; Movers and Flyers content are sequenced later. This feature delivers the *architecture* for all three levels and the *content* for Starters plus the new question types.
- **Per-skill mastery display**: The existing star-row/progress paradigm is extended per skill; a separate full analytics dashboard beyond the parent view in FR-030 is out of scope.
- **Reused constants & paradigms**: Existing named constants (`SESSION_WORD_COUNT`, `MASTERY_THRESHOLD`, `MAX_RETRIES`, `STAGE_UNLOCK_THRESHOLD`, priority weights) and existing feedback/celebration/locked-state patterns are reused; new constants are introduced only where genuinely new (e.g., per-skill unlock thresholds).
- **Scene/story art**: New images follow the existing child-safe, single-style, `.webp` convention; produced separately from this spec.
- **Existing four activities remain valid**: Introduce, Recognize, Unscramble, and Fill-in-blank become registered question types under the appropriate skills rather than being removed.
- **One profile typically active per device**; multi-profile support is unchanged from today.
- **Research-grounded design constraints** (folded into FRs): tap-first interaction for under-9s, audio always replayable and always paired with a visual cue (a muted device must remain usable), a choice-of-three as the default receptive answer-set size, scaffolding ordered receptive→recognition→cued-recall→production, and systematic-phonics-led literacy blended with meaningful context. Sources: Cambridge YLE test-format/handbook, NN/g child UX guidelines, and early-literacy/SLA research.
