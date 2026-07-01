# Phase 0 Research: Math Foundations

## R1 — Narration without pre-recorded audio assets

**Question**: The English subject ships per-word `.mp3` files. Generating spoken audio for every
math prompt (numbers, expressions, shape names, "what comes next") would be a large asset pipeline.
How do we satisfy Constitution II (every instruction needs an audio + visual equivalent) cheaply and
offline?

**Decision**: Use the browser **Web Speech API** (`window.speechSynthesis`) wrapped in
`src/shared/utils/speech.ts`. It:
- honours the existing `audioEnabled` localStorage flag (parent-controlled, Constitution VAD),
- degrades silently where unavailable (jsdom in tests, locked-down browsers),
- needs **zero** downloaded assets → offline-safe (Constitution V).

The **visual prompt + on-screen text caption is always rendered**, so the question is never
audio-only — speech is an enhancement, not a dependency. A `SpeakButton` provides replay.

**Rejected**: fal.ai TTS asset generation (heavy, network, per-locale rework); bundling a TTS lib
(bundle bloat, against YAGNI).

## R2 — One universal activity vs five components

**Question**: The English subject has one component per activity. Math has 5 Timo-style formats.
Five near-duplicate components would violate DRY.

**Decision**: A single **`MathProblemPlayer`** owns the interaction contract shared by all formats
(auto-narrate on mount, show prompt, render 3 tappable choices, correct → celebrate, wrong → one
retry → reveal, then advance). Format-specific rendering is delegated to:
- `PromptDisplay` — switches on `prompt.kind` (numeral, dots, word, expression, sequence, shape-name, instruction),
- `ChoiceButton` — switches on the choice payload (numeral label, object emoji, or `ShapeGlyph`).

This keeps each file small, removes duplication, and still lets us write **one integration test per
activity type** by feeding the player a problem of that type (Constitution VII satisfied).

**Rejected**: five sibling components (duplication, drift risk).

## R3 — Shape rendering

**Decision**: `ShapeGlyph` renders **inline SVG** for circle/square/triangle/rectangle/star/heart/
diamond/oval with a `<title>` element for screen readers and a solid friendly fill from the design
tokens. No raster assets, crisp at any tile size, fully offline.

**Rejected**: emoji shapes (inconsistent cross-platform rendering, weak SR semantics); image files
(asset weight, blurry scaling).

## R4 — Progress storage & Dexie migration

**Decision**: Add a **new `mathProgress` table** in **Dexie v3** (additive). Math progress is fully
decoupled from `wordProgress` — no shared rows, no cross-subject entanglement (Constitution VI).
v3 only *adds* a store; the v2 upgrade hook for English is untouched, so existing vocab progress is
preserved (verified by `dexie-migration-v2-v3.test.ts`, FR-012/SC-005).

Index: `mathProgress: 'id, childId, [childId+topicId]'` — supports per-profile and per-topic queries
exactly like `wordProgress`.

Math **achievements reuse** the existing `achievements` table (it is generic infra in `shared/db`,
not a subject component) with ids `math_first_steps` and `topic_master:<topicId>`.

## R5 — Data authoring strategy

**Decision**: A deterministic **generator script** `scripts/generate-math-data.ts` (run with `tsx`)
emits the 7 JSON files. Benefits: reproducible, easy to expand counts, no runtime `Math.random()` in
data (stable ids and pre-shuffled choices), matches the existing `scripts/generate-vocab-*.ts`
convention. Choices (the correct answer + 2 distractors) are baked into the data so the runtime
never has to synthesise plausible wrong answers.

Distractor heuristics per topic:
- numbers/counting/operations → near-miss numerals (±1, ±2) clamped to range, deduped.
- patterns → the true next item + 2 other items from the sequence's alphabet.
- shapes → the target shape + 2 other shapes.
- logic (odd-one-out) → the odd member is the answer; choices are the row members.

**Rejected**: hand-written JSON (tedious, error-prone, hard to scale to ≥ 70 problems).

## R6 — Topic ladder & unlock rule

**Decision**: Topic order is fixed in `mathTopicRegistry` (numbers→counting→addition→subtraction→
patterns→shapes→logic), exactly Constitution III. `isTopicUnlocked(index, registry, progressMap)`:
- index 0 → always unlocked;
- index *i* → previous topic's mastery fraction ≥ `MATH_TOPIC_UNLOCK_THRESHOLD`.

Per-problem mastery: `consecutiveCorrect >= MATH_MASTERY_THRESHOLD`. All thresholds are named
constants (Constitution VI) and the gating is pure + unit-tested (Constitution III/VII).

## Resolved constants

| Constant | Value | Rationale |
|---|---|---|
| `MATH_SESSION_SIZE` | 8 | < 5-minute sessions for 6-year-olds (Constitution I). |
| `MATH_MASTERY_THRESHOLD` | 2 | Two consecutive correct = mastered; lighter than vocab (3) since MCQ is lower-effort. |
| `MATH_TOPIC_UNLOCK_THRESHOLD` | 0.5 | Half a topic mastered opens the next — momentum without skipping. |
| `MATH_CHOICE_COUNT` | 3 | Matches Math Kangaroo Pre-Ecolier / TIMO youngest band. |

No open unknowns remain.
