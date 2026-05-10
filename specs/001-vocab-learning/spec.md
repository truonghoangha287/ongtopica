# Feature Specification: Vocabulary Learning

**Feature Branch**: `001-vocab-learning`
**Created**: 2026-05-10
**Status**: Draft
**Input**: User description: "Vocabulary learning for a 6-year-old using Cambridge YLE Starters word sets, with a 4-stage learn-then-test progression"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Introduce a New Word (Priority: P1)

A 6-year-old child opens the app and starts a vocabulary session. A picture of an object appears
on screen alongside the written word. The child taps the picture or a play button and hears the
word spoken aloud clearly. They can replay the audio as many times as they like. No correct/wrong
judgment is made — this stage is purely passive exposure.

**Why this priority**: Without exposure, no subsequent recall stage is possible. This is the
entry gate to all vocabulary learning.

**Independent Test**: A session containing only Stage 1 (Introduce) words can be started,
played through 5 words, and completed — with audio playing per word and the session ending in a
celebration screen. No scoring or progression is required.

**Acceptance Scenarios**:

1. **Given** a child opens a new thematic word set, **When** they tap any word card, **Then** the word's picture is shown large on screen and the audio pronunciation plays automatically.
2. **Given** audio is playing, **When** the child taps the replay button, **Then** the audio restarts from the beginning.
3. **Given** the child has seen all 5 words in the session, **When** the last word is viewed, **Then** a "Well done!" celebration screen appears and the session is marked complete.

---

### User Story 2 — Recognize a Word by Hearing (Priority: P1)

The child hears a word spoken aloud and must tap the correct picture from a grid of 4 options.
All 4 images are shown simultaneously. After the child taps, immediate feedback is given — a
cheerful animation for correct, a gentle "try again" cue for incorrect. Incorrect answers allow
one retry on the same question before the system moves on with encouragement.

**Why this priority**: Recognition (hearing → image) is the first active recall stage and
unlocks the mastery progression system.

**Independent Test**: A session containing only Stage 2 (Recognize) words can be played through
5 questions end-to-end, receiving feedback on each, and reaching the celebration screen.

**Acceptance Scenarios**:

1. **Given** a Recognize question loads, **When** the screen appears, **Then** the word's audio plays automatically and 4 picture options are shown in a 2×2 grid.
2. **Given** the child taps the correct picture, **When** the answer registers, **Then** a celebration animation plays and the mascot reacts positively before advancing.
3. **Given** the child taps an incorrect picture, **When** the answer registers, **Then** a gentle encouraging cue is shown (never a negative sound or red X), the wrong option is visually distinguished, and the child may try once more.
4. **Given** the child taps incorrectly a second time, **When** the second attempt registers, **Then** the correct answer is highlighted with encouragement and the session advances.

---

### User Story 3 — Unscramble the Word (Priority: P2)

The child sees a picture of the word. Below the picture, scrambled letter tiles are displayed.
The child drags or taps tiles to arrange them into the correct spelling. When all tiles are
placed in the right order, a celebration plays. If the order is wrong after submission, the tiles
gently reset with an encouraging cue and the child tries again (up to 2 retries before the answer
is revealed).

**Why this priority**: Unscramble introduces active spelling recall without requiring fine motor
keyboard skills, making it appropriate for a 6-year-old.

**Independent Test**: A session of 5 Unscramble activities can be completed end-to-end,
including tile interaction, feedback animations, and session celebration.

**Acceptance Scenarios**:

1. **Given** an Unscramble question loads, **When** the screen appears, **Then** the picture is shown prominently and letter tiles appear scrambled in a random order below.
2. **Given** the child arranges all tiles into the correct word, **When** the last tile is placed, **Then** the word is automatically checked and a celebration plays immediately.
3. **Given** the arrangement is incorrect after the child submits, **When** feedback appears, **Then** tiles gently animate back to scrambled position and an encouraging mascot cue plays.
4. **Given** the child fails twice, **When** the second retry is exhausted, **Then** the correct word snaps into place with an encouraging mascot message and the session advances.

---

### User Story 4 — Fill in the Missing Letter (Priority: P2)

The child sees a picture and the word with one letter replaced by a blank. Below, 3 letter
choices are shown as large tappable buttons. The child taps the correct letter. Feedback and
retry logic match the Recognize stage (one retry, then reveal with encouragement).

**Why this priority**: This stage completes the difficulty progression from passive to full
active spelling, closing the learning loop before mastery is declared.

**Independent Test**: A session of 5 Fill-in-blank activities can be played through completely,
including letter selection, feedback, and session celebration.

**Acceptance Scenarios**:

1. **Given** a Fill-in-blank question loads, **When** the screen appears, **Then** the picture is shown, the partial word is displayed with a clearly marked blank, and 3 letter buttons are shown.
2. **Given** the child taps the correct letter, **When** the answer registers, **Then** the blank fills in with the letter, a celebration animation plays, and the session advances.
3. **Given** the child taps an incorrect letter, **When** the answer registers, **Then** a gentle encouraging cue plays and the child may try once more.
4. **Given** the child taps incorrectly a second time, **Then** the correct letter fills in with encouragement and the session advances.

---

### User Story 5 — Mastery Progression & Session Composition (Priority: P1)

The system tracks each word's stage per child profile. A session of 5 words is automatically
composed by mixing new words (Stages 1–2) and review words (Stages 3–4) based on each word's
current mastery stage. A word advances to the next stage only after the child answers it correctly
`MASTERY_THRESHOLD` consecutive times at its current stage. Once a word completes Stage 4 with
mastery, it is marked "learned" and earns a visual star on the child's word map.

**Why this priority**: Without progression tracking, there is no learning system — only
disconnected mini-games. This is the connective tissue of the feature.

**Independent Test**: Given a child profile with known word stages, the session composer
correctly mixes stage-appropriate words and correct answers increment the mastery counter while
incorrect answers reset it.

**Acceptance Scenarios**:

1. **Given** a child has 3 words at Stage 1 and 2 words at Stage 3, **When** a session starts, **Then** the session contains those 5 words presented in their respective stage activities.
2. **Given** a word is at Stage 2 and the child answers it correctly `MASTERY_THRESHOLD` times across sessions, **When** the threshold is reached, **Then** the word advances to Stage 3.
3. **Given** a child answers a word incorrectly, **When** the answer is recorded, **Then** the consecutive-correct counter for that word resets to zero (stage does not regress).
4. **Given** a word completes Stage 4 with mastery, **When** the session ends, **Then** a star appears on that word's card on the word map screen.

---

### Edge Cases

- What happens if the child exits mid-session? Progress for completed words in that session is saved; the incomplete session restarts from the beginning next time.
- What happens if the audio file for a word fails to load? A visual speaker icon with "tap to retry" is shown; the activity must still be completable without audio.
- What happens if all words in a set are fully learned (Stage 4 mastered)? The word set shows a "Completed!" badge and offers a "Review All" mode replaying Stage 3–4 activities.
- What if a thematic set has fewer than 5 words? The session uses all available words; no padding with words from other sets.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST present vocabulary from Cambridge YLE Starters thematic word sets (e.g., Animals, Food, Clothes, Colors, Body, Toys, Family).
- **FR-002**: Each word MUST have an associated picture and an audio pronunciation.
- **FR-003**: The system MUST support 4 distinct activity stages per word: Introduce, Recognize, Unscramble, Fill-in-blank.
- **FR-004**: A word MUST NOT advance to the next stage until the child answers correctly `MASTERY_THRESHOLD` consecutive times at the current stage.
- **FR-005**: Each session MUST contain exactly `SESSION_WORD_COUNT` words and MUST be completable within `MAX_SESSION_MINUTES`.
- **FR-006**: The system MUST compose each session by selecting words at their current mastery stage for the active child profile.
- **FR-007**: Every correct answer MUST trigger an immediate celebration animation and positive mascot reaction.
- **FR-008**: Every incorrect answer MUST trigger a gentle encouraging response — no negative sounds, red crosses, or shame-inducing feedback.
- **FR-009**: Incorrect answers MUST allow exactly `MAX_RETRIES` retry before the correct answer is revealed with encouragement.
- **FR-010**: The Unscramble activity MUST use draggable/tappable letter tiles — no free keyboard text input.
- **FR-011**: The Fill-in-blank activity MUST present exactly `LETTER_CHOICE_COUNT` letter buttons — no free keyboard text input.
- **FR-012**: A child's mastery stage per word MUST be persisted across sessions.
- **FR-013**: Words fully mastered (Stage 4 complete) MUST be marked on a word map with a visible star.
- **FR-014**: Audio for all word pronunciations MUST be available offline after first load.
- **FR-015**: The system MUST surface a child-friendly offline/error state if audio cannot load — the activity MUST remain completable without audio.
- **FR-016**: A parent or teacher MUST be able to toggle audio on or off from a settings panel accessible from the home screen.

### Key Entities

- **WordSet**: A named thematic group (e.g., "Animals") containing a list of Words.
- **Word**: A vocabulary entry with picture asset reference, audio asset reference, and display text.
- **WordProgress**: Tracks a child's current stage (1–4) and consecutive-correct count for a specific Word. Count resets on incorrect answer; stage advances when count reaches `MASTERY_THRESHOLD`.
- **Session**: A single play session composed of `SESSION_WORD_COUNT` Words, each paired with an Activity matching the word's current stage.
- **Activity**: One of four typed interactions — Introduce, Recognize, Unscramble, Fill-in-blank.
- **ChildProfile**: Identifies the child for progress persistence. A device may support multiple profiles (e.g., siblings).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A child can complete a full 5-word session (all 4 activity types represented) in under 5 minutes on a standard tablet device.
- **SC-002**: Word audio loads and plays within 1 second of the activity screen appearing, on the first or any subsequent session.
- **SC-003**: A child who answers a word correctly `MASTERY_THRESHOLD` consecutive times sees that word's activity advance to the next stage on the following session — with 100% reliability (no data loss between sessions).
- **SC-004**: 100% of activities remain fully operable (answerable, advanceable) when the device is offline after first load.
- **SC-005**: A parent can enable or disable audio in under 2 taps from any screen via the settings control.
- **SC-006**: Zero external navigation links exist anywhere within the vocabulary feature.

## Assumptions

- Each word has exactly one picture and one audio file; multiple pronunciation variants are out of scope for v1.
- The Cambridge YLE Starters word list (~150 words) is the only word set for v1; additional curricula (Movers, Flyers) are architecturally possible but not in scope.
- A "child profile" is identified by a local device profile (name + avatar); cloud sync and login are out of scope for v1.
- Mascot character and all visual/audio assets will be provided separately; this spec does not constrain asset format or design.
- The parent/teacher settings panel is a simple toggle screen accessible from the home screen; a parental-control PIN gate is out of scope for v1.
- Word sets are pre-bundled with the app; dynamic content downloading is out of scope for v1.
- The Fill-in-blank activity always blanks exactly one letter per question, chosen at content-authoring time.
- `MASTERY_THRESHOLD = 3`, `SESSION_WORD_COUNT = 5`, `MAX_SESSION_MINUTES = 5`, `MAX_RETRIES = 1`, `LETTER_CHOICE_COUNT = 3` are the default named constants; all are adjustable without code changes.
