# UX Requirements Checklist: Stage-Button Unlock Change

**Purpose**: Validate requirements quality for the WordSet detail screen stage-entry buttons and unlock mechanic (FR-003a, FR-003b, STAGE_UNLOCK_THRESHOLD)
**Created**: 2026-05-11
**Feature**: [spec.md](../spec.md)

## Requirement Completeness

- [ ] CHK001 - Are requirements defined for all 4 stage buttons (Introduce / Recognize / Unscramble / Fill-in-blank) covering both unlocked and locked visual states? [Completeness, Spec §FR-003a]
- [ ] CHK002 - Is the WordSet detail screen layout specified — where do the stage buttons appear relative to the word map and other UI elements? [Completeness, Gap]
- [ ] CHK003 - Is the initial state for a brand-new child profile specified — is Introduce always unlocked by default with no prerequisite? [Completeness, Spec §FR-003b]
- [ ] CHK004 - Is the `STAGE_UNLOCK_THRESHOLD` constant documented with its default value, allowed range, and the exact formula used to compute it? [Completeness, Spec §Assumptions]
- [ ] CHK005 - Are acceptance scenarios for the stage-button feature added to the User Stories section (or a new User Story)? [Completeness, Gap]

## Requirement Clarity

- [ ] CHK006 - Is "mastered at the previous stage" unambiguously defined — does it mean `stage > N` in `WordProgress`, or `consecutiveCorrect >= MASTERY_THRESHOLD` at stage N? [Clarity, Spec §FR-003b]
- [ ] CHK007 - Is the unlock percentage formula explicitly stated — is it `(words where stage > N) / (total words in WordSet)` or another calculation? [Clarity, Gap]
- [ ] CHK008 - Is the shake/bounce animation on the locked button described with enough precision to be objectively implemented — duration, amplitude, easing type? [Clarity, Spec §FR-003b]
- [ ] CHK009 - Is the pulse/bounce on the prerequisite stage button clearly distinguished from the locked-button animation (different timing, visual weight, or color)? [Clarity, Spec §FR-003b]
- [ ] CHK010 - Are requirements clear on whether tapping a locked button replays the animation if tapped repeatedly, or only triggers once per tap? [Clarity, Gap]

## Requirement Consistency

- [ ] CHK011 - Are stage-button unlock requirements consistent with the mastery progression model in FR-004 — does "mastered at previous stage" align with `MASTERY_THRESHOLD`? [Consistency, Spec §FR-003b, FR-004]
- [ ] CHK012 - Does the stage-filtered session requirement (FR-003a) align with SESSION_WORD_COUNT — is it specified what happens when fewer eligible words exist than the required count? [Consistency, Spec §FR-003a, FR-005]
- [ ] CHK013 - Does the locked-button animation requirement align with FR-008 (no negative sounds, no shame-inducing feedback) — is there a sound prohibition on the locked-tap interaction? [Consistency, Spec §FR-003b, FR-008]
- [ ] CHK014 - Is the stage-button feature consistent with the existing session composer (FR-006) — does adding a stage filter break the spaced repetition priority model? [Consistency, Spec §FR-003a, FR-006]

## Acceptance Criteria Quality

- [ ] CHK015 - Can the unlock condition be objectively verified from `WordProgress` data alone without additional UI instrumentation? [Measurability, Spec §FR-003b]
- [ ] CHK016 - Are the animation requirements for locked buttons measurable (e.g., animation completes within Xms, frame rate ≥ 60fps)? [Measurability, Spec §FR-003b]

## Scenario Coverage

- [ ] CHK017 - Are requirements defined for what happens when a stage-filtered session has fewer eligible words than `SESSION_WORD_COUNT`? [Coverage, Edge Case, Gap]
- [ ] CHK018 - Are requirements defined for the case where all WordSet words are fully mastered (Stage 4) — are all 4 buttons shown, active, and meaningful? [Coverage, Edge Case]
- [ ] CHK019 - Are requirements defined for the unlock threshold recalculation timing — does it update immediately after a session ends, or only on next app launch? [Coverage, Gap]
- [ ] CHK020 - Are requirements defined for what the child sees if they open a WordSet they have never started (zero `WordProgress` records)? [Coverage, Edge Case, Spec §FR-003b]

## Non-Functional Requirements

- [ ] CHK021 - Are animation performance requirements specified for the stage-button interactions (target frame rate, max animation duration)? [Non-Functional, Gap]
- [ ] CHK022 - Are accessibility requirements defined for locked buttons — are they reachable by assistive technology and is the locked state communicated non-visually (e.g., `aria-disabled`, screen reader label)? [Non-Functional, Gap]

## Dependencies & Assumptions

- [ ] CHK023 - Is it documented that the unlock mechanic depends on `WordProgress` records existing — and that a brand-new child with no history always sees only Stage 1 unlocked? [Assumption, Spec §FR-003b]
- [ ] CHK024 - Is the dependency on the existing session composer (FR-006) for stage-filtered sessions explicitly noted as a reuse — not a replacement? [Dependency, Spec §FR-003a]

## Notes

- Items marked `[Gap]` indicate requirements not yet present in the spec and needing addition before planning.
- Resolve CHK006, CHK007, CHK017, CHK019 before running `/speckit-plan` — these directly affect data model and session logic.
