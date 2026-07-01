# Feature Specification: Math Foundations (Number Town)

**Feature Branch**: `004-math-foundations`
**Created**: 2026-06-30
**Status**: Draft
**Input**: User description: "Brainstorm another section for a kid to learn math — references like Timo (Thailand International Mathematical Olympiad) and similar early-years competition math (Math Kangaroo, Singapore Math, Matific). Use the Spec Kit framework to implement it: generate the specs, implement the code, create all the learning data, then test it like a real child is using it."

## Context & References

Ongtopica already ships an English vocabulary subject for 6-year-olds. The Constitution
(Principle III) already names the required math sequence:

> Math content MUST be sequenced: number recognition → counting → basic addition/subtraction →
> patterns → shapes → simple logic puzzles.

This feature adds the **Math** subject as a peer of English, following that exact sequence.

**Inspiration (early-years competition math):**
- **Timo / TIMO** (Thailand International Mathematical Olympiad) — pre-Echelon & Kindergarten papers
  emphasise *number sense, counting, simple operations, pattern recognition, shapes, and visual
  logic* with picture-based, language-light questions.
- **Math Kangaroo (Pre-Ecolier)** — single-answer multiple-choice with 3 picture options for the
  youngest band; no writing required.
- **Singapore Math / Matific** — concrete → pictorial → abstract; count objects before symbols.

Design takeaways applied here: **picture-first, language-light, single-tap multiple choice with 3
options, immediate gentle feedback, and a strict easy→hard topic ladder.**

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Recognise a Number (Priority: P1)

A child opens the Math subject and starts the first topic, **Numbers**. A large numeral, a cluster
of dots, or a spoken number word is presented. The child taps the matching numeral from 3 large
picture-style tiles. Correct → celebration; incorrect → gentle "try again" with one retry, then the
right tile is revealed with encouragement.

**Why this priority**: Number recognition is the entry gate to all later math (Constitution III).
Without it, counting and arithmetic are impossible.

**Independent Test**: A Numbers session of 8 problems can be played start→finish, each giving
feedback, ending in a celebration screen. No other topic need be unlocked.

**Acceptance Scenarios**:

1. **Given** a Numbers problem loads, **When** the screen appears, **Then** the prompt (numeral / dots / spoken word) is shown with a narration auto-played and 3 numeral tiles are shown.
2. **Given** the child taps the correct tile, **When** it registers, **Then** a celebration animation + happy sound play and the mascot reacts before advancing.
3. **Given** the child taps a wrong tile, **When** it registers, **Then** a gentle encouraging cue is shown (never red X / negative sound) and one retry is allowed.
4. **Given** the child taps wrong a second time, **When** it registers, **Then** the correct tile is highlighted with encouragement and the activity advances.

---

### User Story 2 — Count Objects (Priority: P1)

The child sees a group of friendly objects (apples, stars, ducks…) and taps how many there are
from 3 numeral choices.

**Why this priority**: Counting bridges number symbols to quantity — the core of early math sense.

**Independent Test**: A Counting session of 8 problems plays through end-to-end with per-problem
feedback and a celebration.

**Acceptance Scenarios**:

1. **Given** a Counting problem loads, **Then** a cluster of N identical objects is shown with 3 numeral choices.
2. **Given** the child taps the numeral equal to N, **Then** celebration + advance.
3. **Given** a wrong tap, **Then** gentle retry, then reveal — identical feedback contract to US-1.

---

### User Story 3 — Add and Take Away (Priority: P2)

The child sees a picture-supported expression (e.g. `2 + 3` shown with object groups, or `5 − 2`)
and taps the answer from 3 numeral choices. Addition unlocks after Counting; Subtraction after
Addition.

**Why this priority**: Operations are the first abstract math step and depend on counting mastery.

**Independent Test**: An Adding session and a Taking-Away session each play through 8 problems
end-to-end with feedback and celebration.

**Acceptance Scenarios**:

1. **Given** an Adding problem, **Then** the expression and supporting object groups are shown with 3 numeral choices, one correct.
2. **Given** a Taking-Away problem, **Then** the minuend objects are shown with some crossed/removed and 3 numeral choices.
3. Feedback contract identical to US-1.

---

### User Story 4 — Patterns, Shapes & Logic (Priority: P3)

- **Patterns**: a sequence (`🔴 🔵 🔴 🔵 ❓`) is shown; the child taps what comes next.
- **Shapes**: the mascot names a shape ("Tap the **triangle**"); the child taps the matching shape.
- **Thinking Puzzles (logic)**: a row of items with one that does not belong; the child taps the
  odd one out (or "tap the bigger group").

**Why this priority**: These broaden reasoning but build on numbers/counting; lowest of the ladder.

**Independent Test**: Each of Patterns, Shapes, and Logic sessions can be played to completion.

**Acceptance Scenarios**:

1. **Given** a Pattern problem, **Then** the sequence with a trailing "?" is shown and 3 choices appear; tapping the correct continuation celebrates.
2. **Given** a Shape problem, **Then** the target shape name is spoken + written and 3 shape tiles appear.
3. **Given** a Logic problem, **Then** items are shown and tapping the odd-one-out (or correct comparison) celebrates.

---

### User Story 5 — Progress, Unlocks & Celebrations (Priority: P2)

Topics unlock in the Constitution-mandated order. A topic is reachable only once the previous topic
crosses a mastery threshold. Each topic shows a progress bar (mastered / total). Mastering a whole
topic earns an achievement badge. Returning to the app preserves all progress (local, per profile).

**Why this priority**: Progression integrity is the highest-risk learning logic (Constitution III).

**Acceptance Scenarios**:

1. **Given** a fresh profile, **Then** only **Numbers** is unlocked; all later topics show a lock.
2. **Given** the child masters ≥ 50% of Numbers problems, **Then** **Counting** unlocks.
3. **Given** the child masters every problem in a topic, **Then** the topic's "master" achievement is awarded once.
4. **Given** the child closes and reopens the app, **Then** topic progress and unlocks are restored from local storage.

---

### Edge Cases

- A topic with fewer problems than the session size composes a shorter session (never pads with locked content).
- Tapping a locked topic shakes the lock and pulses the prerequisite (no dead-end; Constitution I).
- Audio narration unavailable (no Web Speech / muted by parent) → the visual prompt + caption fully convey the question (Constitution II — no audio-only).
- No active profile → progress reads return empty and writes are no-ops (mirrors English subject).
- Reduced-motion users get no janky animation (Constitution V; `prefers-reduced-motion`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST add a **Math** subject selectable from the home screen alongside English, using the same single mascot and design system.
- **FR-002**: Math content MUST be organised into 7 topics in this fixed order: `numbers`, `counting`, `addition`, `subtraction`, `patterns`, `shapes`, `logic`.
- **FR-003**: Each topic MUST contain a set of single-answer problems presented as **3-option multiple choice**, tappable by touch, mouse, and keyboard.
- **FR-004**: Every problem MUST present its question visually (numeral, dots, object groups, expression, sequence, or shape) AND provide an audio narration with an on-screen caption equivalent (no audio-only instruction).
- **FR-005**: A correct answer MUST trigger an immediate positive celebration (animation + sound + mascot). An incorrect answer MUST give gentle encouragement, allow exactly one retry, then reveal the correct option — never punish.
- **FR-006**: The system MUST track per-problem mastery: a problem is **mastered** after `MATH_MASTERY_THRESHOLD` consecutive correct answers.
- **FR-007**: A topic's progress MUST be shown as mastered-count / total with a progress bar.
- **FR-008**: Topic `numbers` MUST always be unlocked. Topic *N* MUST unlock only when topic *N−1* has at least `MATH_TOPIC_UNLOCK_THRESHOLD` of its problems mastered. Skipping is prohibited (Constitution III).
- **FR-009**: A session MUST contain at most `MATH_SESSION_SIZE` problems, prioritising not-yet-mastered and previously-missed problems, shuffled.
- **FR-010**: Mastering every problem in a topic MUST award that topic's achievement exactly once, and answering any first problem correctly MUST award a "first steps" achievement.
- **FR-011**: All progress MUST be stored locally per child profile (IndexedDB) and survive reload. No external network calls, links, ads, or tracking (Constitution IV).
- **FR-012**: Adding the Math subject MUST NOT alter or lose existing English vocabulary progress (additive Dexie migration).
- **FR-013**: All game parameters (session size, thresholds, choice count) MUST be named constants (Constitution VI).
- **FR-014**: Every new screen MUST pass automated axe-core accessibility checks and expose semantic labels for the mascot prompt, choices, and progress (Constitution II).
- **FR-015**: All UI strings MUST come from an i18n `math` namespace; no hardcoded UI text.

### Key Entities

- **MathTopic**: an ordered learning unit (`id`, ordered `problems`). Order encodes the difficulty ladder.
- **MathProblem**: `id`, `topicId`, `type` (one of 5 activity renderers), `prompt` (what is shown), `choices` (3 options), `answerId`, `narration`.
- **MathProgressRow** (per child, per problem): `consecutiveCorrect`, `totalIncorrect`, `mastered`, `lastReviewedAt`.
- **AchievementRow** (reused): math achievement ids (`math_first_steps`, `topic_master:<topicId>`).

## Success Criteria *(mandatory)*

- **SC-001**: A child can complete a full 8-problem session in any unlocked topic in under 5 minutes (Constitution I).
- **SC-002**: 100% of progression, scoring, and unlock logic is covered by unit tests; each of the 5 activity renderers has an integration play-through test (Constitution VII).
- **SC-003**: All Math screens report **zero** axe-core violations.
- **SC-004**: Topics unlock strictly in order; no path lets a child reach a topic whose prerequisite is unmastered.
- **SC-005**: Existing English vocabulary progress is unchanged after the Dexie migration (verified by test).
- **SC-006**: Every topic ships with at least 10 ready-to-play problems generated into data files.

## Out of Scope

- Multi-digit arithmetic, multiplication/division, fractions, time, money (later levels).
- Parent/teacher dashboards beyond the existing progress views.
- Additional languages beyond English UI (i18n architecture is in place for later).
- Pre-recorded human voice assets (narration uses the device speech synthesiser, offline-safe).
