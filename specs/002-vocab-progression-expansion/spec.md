# Feature Specification: Vocab Progression Expansion — Rotation, Per-Word Unlocks, Achievement Stars

**Feature Branch**: `002-vocab-progression-expansion`
**Created**: 2026-05-17
**Status**: Draft
**Input**: User description: "there is a problem with the learning, it's only show the first 10 words, there are a lot more words. I want the listen & learn should be able to run through other words. The other features can also be unlocked for some words the kid mastered already. There should be an icon to show the progress, maybe the stars to have achievements. Compare this requirement with the existing application."

---

## Clarifications

### Session 2026-05-17

- Q: How are eligible words ordered within a post-Listen-&-Learn activity session (Recognize / Unscramble / Fill-in-blank), and which ones are dropped when more than 10 are eligible? → A: Highest struggle-priority first — reuse the existing per-word priority score so words with more incorrect attempts surface first and correctly answered words drift down.
- Q: Should fully-mastered words (final stage cleared with mastery threshold met) keep appearing in their stage's activity sessions? → A: Yes — they stay in normal selection; struggle-priority will naturally demote them since correct answers lower their score, so they rarely surface unless the eligible pool is thin.
- Q: Where do the Recognize-stage distractor pictures (the 3 wrong options shown alongside the correct picture) come from? → A: Any word in the same WordSet at random — the existing behavior; distractors play no audio and are not labeled, so unfamiliar distractor pictures do not pre-teach.
- Q: When the eligible pool for an activity session is smaller than 10 (small WordSets like Work=4, Weather=5, or any set where few words have cleared the prior stage), how long is the session? → A: Allow shorter sessions equal to the available pool size — no padding, no repetition; the celebration screen still fires at the end regardless of count.
- Q: Which words count as eligible for an activity session at stage X? → A: Words at the target stage OR higher — a word that has cleared a higher activity can still resurface in a lower-stage session for review. Struggle-priority (Q1) naturally keeps already-mastered words at the bottom so they only surface when the pool is thin.

---

## Comparison with the Existing Application *(stakeholder-readable)*

Before the new requirements are stated, this section maps the user's report against today's behavior so the gap is plain to non-technical readers.

| # | What the user observes / wants | What the app does today | Gap |
|---|---|---|---|
| 1 | "Only the first 10 words show up" | Each learning session is intentionally 10 words long. New words all start equal, so the same first 10 words of a set are picked over and over. | The remaining words in larger sets (Animals 31, Food 29, Home 16, Body 13, Clothes 13, Family 12, Toys 12, Colors 11) are never reached. |
| 2 | "Listen & Learn should run through other words" | Listen & Learn (Stage 1) is passive — listening to a word does not move it forward, so the next Listen & Learn session reuses the same 10 words. | No rotation across sessions; the child cannot hear the rest of a set. |
| 3 | "Other features should unlock for words the kid mastered already" | The next activity (Recognize, Unscramble, Fill-in-blank) only unlocks for a whole set after 50% of the set has cleared the prior stage. | A child who has mastered 10 of 31 animals cannot try Recognize on those 10 until 15 more words are introduced. |
| 4 | "An icon for progress, maybe stars for achievements" | A single ⭐ appears on a word card only after full mastery (Stage 4 + 3 consecutive correct). Locked stages show 🔒. | No multi-step progress indicator on a word; no achievements screen; no celebration when a milestone is reached. |
| 5 | "Compare with the existing app" | n/a | Handled by this table. |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Listen & Learn cycles through every word in a set (Priority: P1)

A child taps "Listen & Learn" on the Animals set (31 words). Today they hear the same 10 every time. After this change, the first session presents the first 10, the next session the next 10, then the next 10, and finally rotates back. A small "10 of 31 heard" indicator on the WordSet page lets the child and parent see that there is more to come.

**Why this priority**: This is the user's primary complaint and blocks all other progression — until every word can be heard at Stage 1, the higher stages cannot fill up either.

**Independent Test**: Open a set with more than 10 words, play Listen & Learn three times in a row, and verify that across the three sessions every word in the set was presented at least once and no word was repeated until all others had been heard.

**Acceptance Scenarios**:

1. **Given** a WordSet with 31 words and no prior progress, **When** the child completes one Listen & Learn session, **Then** the next Listen & Learn session presents 10 different words from the set that have not yet been heard.
2. **Given** the child has heard 30 of 31 words across previous sessions, **When** they start a new Listen & Learn session, **Then** the remaining 1 unheard word is included and 9 already-heard words fill the slots (the child is never offered fewer than 10 words while there is still material to review).
3. **Given** the child has heard every word in the set at least once, **When** they start another Listen & Learn session, **Then** the rotation restarts from the beginning of the set in the same predictable order.
4. **Given** the child is on the WordSet page, **When** they look at the Listen & Learn button, **Then** they see a "heard X of N" indicator that updates after each completed session.

---

### User Story 2 — Per-word progress shown as 1–4 stars (Priority: P1)

The child sees each word card decorated with a row of 4 small star outlines. As the word clears each stage (Listen → Recognize → Unscramble → Fill-in-blank), the next star fills in. A word that has cleared all four stages shows four filled stars, which subsumes today's single ⭐ for full mastery.

**Why this priority**: A visible progress indicator is what the user explicitly asked for, and it is the foundation for the per-word unlock behavior in User Story 3 — children and parents need to see *which* words have advanced.

**Independent Test**: Complete one Listen & Learn session on a set, open the word map for that set, and verify that exactly the 10 words just played show 1 filled star while the others show 0 filled stars. Repeat for higher stages and verify the matching number of filled stars.

**Acceptance Scenarios**:

1. **Given** a brand-new WordSet, **When** the child opens the word map, **Then** every word shows 0 of 4 stars filled.
2. **Given** a word that has been heard once in Listen & Learn, **When** the child reopens the word map, **Then** that word shows 1 of 4 stars filled.
3. **Given** a word that has cleared Recognize / Unscramble / Fill-in-blank in turn, **When** the word map is viewed, **Then** the word's star count is 2, 3, and 4 respectively after each milestone.
4. **Given** a word previously shown with the legacy single ⭐ (fully mastered), **When** the new star row renders, **Then** the same word now displays 4 of 4 filled stars and no extra/duplicate ⭐.

---

### User Story 3 — Per-word unlock of the next activity (Priority: P2)

When at least one word in a set has cleared the prior stage, the next activity becomes playable on just those eligible words — without waiting for 50 % of the set. A child who has heard 10 animals can immediately try Recognize on those 10. The existing whole-set 50 % rule is preserved as an additional path so that nothing regresses.

**Why this priority**: This delivers the "unlock for words the kid mastered already" requirement and provides positive reinforcement faster, but it depends on User Story 1 (so the child can actually progress words) and User Story 2 (so it is visible which words are eligible).

**Independent Test**: On a fresh set, complete one Listen & Learn session of 10 words. Confirm that the Recognize activity button is now playable and that starting it produces a session containing exactly those 10 words.

**Acceptance Scenarios**:

1. **Given** at least one word in the set has cleared Listen & Learn, **When** the child taps Recognize, **Then** the activity starts immediately and the session is composed of the words that have cleared Listen & Learn.
2. **Given** no word in the set has cleared Listen & Learn, **When** the child taps Recognize, **Then** the lock indicator and "complete Listen & Learn first" cue still appear, matching today's behavior.
3. **Given** 5 words have cleared Recognize, **When** the child taps Unscramble, **Then** the session contains exactly those 5 words (or fewer if some have already advanced to a higher stage) plus any higher-stage words still relevant for review — no untouched words are added, and the session length matches the available pool rather than padding to 10.
4. **Given** the legacy 50 % whole-set threshold is also met, **When** the child taps an activity, **Then** the unlock continues to work — the per-word path is additive, not a replacement.

---

### User Story 4 — Achievements with star milestones (Priority: P2)

Earning new achievements gives the child a one-time celebration. Initial achievements (kept small for a 6-year-old): "First Listen" (heard 1 word), "Curious Ear" (heard every word in any set), "Sharp Eye" (recognized every word in any set), "Word Builder" (spelled every word in any set), and "Set Master" (4 of 4 stars on every word in a set). A new Achievements screen, reachable from Home, lists earned and locked badges.

**Why this priority**: Achievements amplify the visible-progress requirement and add motivation. They depend on User Story 2 (the star data) and on User Story 1 (real cycling progress) — without those, most achievements are unreachable.

**Independent Test**: On a fresh profile, complete the very first Listen & Learn session and confirm that "First Listen" unlocks with a celebration overlay within 1 second of session end, and that the Achievements screen lists it as earned with a timestamp.

**Acceptance Scenarios**:

1. **Given** the very first Listen & Learn session of a profile completes, **When** the celebration screen appears, **Then** a "First Listen" achievement badge animates in alongside the existing mascot celebration.
2. **Given** all words of any WordSet have been heard, **When** the last new word completes Listen & Learn, **Then** "Curious Ear" unlocks for that set.
3. **Given** an achievement is already earned, **When** the qualifying event happens again, **Then** no re-celebration occurs (each achievement fires once per profile).
4. **Given** the child opens the Achievements screen, **When** the screen loads, **Then** earned badges are colored with the earned date and locked badges are grayed out with a short hint of how to earn them.

---

### User Story 5 — Progress summary on Home (Priority: P3)

Each WordSet tile on Home shows a compact progress number (e.g., "12 / 31") next to a star icon, so a parent can see at a glance how far the child has progressed in each topic without entering the set.

**Why this priority**: Quality-of-life and visibility. Nice-to-have but not required for the core "I can hear more words and unlock more activities" need to be met.

**Independent Test**: Earn at least one star on at least 3 words across 2 different sets, return to Home, and verify each set tile shows the correct earned-stars-over-total-possible count.

**Acceptance Scenarios**:

1. **Given** a child has earned 12 total stars across the 31 words of Animals, **When** Home loads, **Then** the Animals tile shows "12 / 124" (because each word is worth 4 stars, 31 × 4 = 124) or an equivalent compact form chosen for readability.
2. **Given** no progress yet on a set, **When** Home loads, **Then** the set tile shows "0 / N" without an animation or attention-grabbing decoration.

---

### Edge Cases

- A WordSet with fewer than 10 words (Sports 6, Places 7, School 7, Transport 8, Work 4, Weather 5): rotation still works — Listen & Learn shows every word in one session and the indicator reads "N of N heard"; subsequent sessions reuse the same words because there is nothing else.
- A fully-mastered word: remains in the pool of every stage it has cleared (target stage or higher rule), but because struggle-priority is lowest for repeatedly correct words it only resurfaces when the rest of the eligible pool is thin — the child gets occasional review of mastered material without feeling stuck on words they have aced.
- A child resets the profile or clears storage: rotation cursor and achievements reset to zero alongside word progress.
- An existing profile (mid-progression) opens the app after the update: legacy ⭐ words automatically render as 4-star, and the "heard" state is back-filled for any word whose stage is > 1 (because to advance past Listen & Learn the word must have been heard).
- Two children share a tablet and switch profiles: rotation state and achievements are per profile.
- The child plays Listen & Learn back-to-back rapidly: rotation cursor advances correctly even if sessions finish within seconds of each other.
- The "all words heard" milestone fires exactly once even if the child re-enters Listen & Learn after rotation restarts.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present Listen & Learn sessions that, across consecutive sessions, eventually cover every word in the selected WordSet without repeating a word until all others in the set have been heard at least once.
- **FR-002**: System MUST record a per-word "heard" state at the moment a Listen & Learn session containing that word is completed.
- **FR-003**: System MUST display on every word card a 4-star row representing the four progression stages, with stars filling in the order Listen → Recognize → Unscramble → Fill-in-blank.
- **FR-004**: System MUST treat the legacy single "fully mastered" star as equivalent to "4 of 4 stars" so that no word loses a previously earned indicator.
- **FR-005**: System MUST allow a child to enter the Recognize, Unscramble, or Fill-in-blank activity for a WordSet as soon as at least one word in that set has cleared the immediately prior stage, in addition to the existing 50 % whole-set unlock rule.
- **FR-006**: System MUST, when entering an activity at stage X via per-word unlock, compose the session from the set's words that have cleared stage X-1 (i.e., are currently at stage X or any higher stage), ordered by struggle-priority (highest first). The session contains up to ten words; if fewer eligible words exist, the session is shorter and still ends in the standard celebration. No padding, no repetition, no untouched-word filler.
- **FR-007**: System MUST persist per-profile achievement records that include an achievement identifier and an earned timestamp.
- **FR-008**: System MUST trigger a one-time, non-blocking celebration overlay the first time each achievement is earned, using the existing celebration animation primitives.
- **FR-009**: System MUST provide a dedicated Achievements screen accessible from Home that lists every defined achievement, marking earned ones with an earned date and locked ones with a short hint.
- **FR-010**: System MUST show, on the WordSet page, a "heard X of N" indicator next to the Listen & Learn button that updates as the child progresses.
- **FR-011**: System MUST show, on each Home tile, a compact earned-stars-versus-total indicator for that set.
- **FR-012**: System MUST keep all new state (heard, stars, achievements, rotation cursor) per child profile and survive app restarts; it must NOT sync to any external service.
- **FR-013**: System MUST back-fill the "heard" state for any pre-existing word whose stage is already past Listen & Learn so that returning users do not lose visible progress.
- **FR-014**: System MUST draw Recognize-stage distractor pictures from any word in the same WordSet at random, excluding the correct answer; distractors are not gated by the per-word introduced state.

### Key Entities

- **Word Progress**: Per-child, per-word record of stage, mastery, and now a "first heard" timestamp. Drives the star row and per-word unlock logic.
- **Rotation Cursor**: Per-child, per-WordSet pointer that remembers where the last Listen & Learn batch ended so the next session continues from there.
- **Achievement**: Per-child record of an earned milestone, with a stable identifier and a timestamp. Catalog of achievements is fixed in the app.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A child can hear every word in a 31-word set within 4 consecutive Listen & Learn sessions with no manual reset.
- **SC-002**: After completing 1 Listen & Learn session of 10 words, the Recognize activity is playable and starts a session that contains exactly those 10 words.
- **SC-003**: A parent opening a WordSet can determine within 30 seconds how many words the child has heard, recognized, spelled, and mastered in that set without leaving the WordSet page.
- **SC-004**: An achievement celebration appears on screen within 1 second of the qualifying action.
- **SC-005**: A child with mid-progression data from before the change opens the app and sees a star row whose filled-star count matches their existing stage on every word (no perceived regression).
- **SC-006**: 90 % of words in any 14-word set can be heard at least once within 30 minutes of cumulative app use without any external help.
- **SC-007**: At least one achievement can be earned within the first session of a brand-new profile.

---

## Assumptions

- Rotation order within a Listen & Learn cycle matches the order the words appear in the underlying word list, so parents and teachers can predict what comes next.
- "At least one word cleared" is the per-word unlock threshold for the next activity, chosen to minimize friction; this can be tuned later without changing the user-visible contract.
- Sessions entered via per-word unlock contain only words that have cleared the immediately prior stage (currently at the target stage or higher); untouched words are never mixed in. When the eligible pool has fewer than ten words, the session is simply shorter rather than padded.
- The progress indicator uses 4 separate stars (one per stage) rather than a single progressively filled star, matching the existing 4-stage mental model.
- Achievement set is kept small (5 total in the initial release) to avoid overwhelming a 6-year-old.
- Achievements are local-only — no leaderboards, no sharing, no external sync — consistent with the app's existing private-sandbox stance.
- Rotation, achievements, and stars are scoped to a single child profile; switching profiles uses each profile's own state.
- Existing celebration and mascot animation components are reused for achievement celebrations rather than introducing a new animation style.

---

## Out of Scope

- Backend telemetry, cross-device sync, or shared leaderboards.
- Randomized rotation order or shuffling within a Listen & Learn batch.
- Parent-authored or custom achievements.
- New activity types beyond the existing Listen, Recognize, Unscramble, Fill-in-blank progression.
- Changes to the per-word audio, pictures, or scoring formula.

---

## Next Steps

Run `/speckit-clarify` to refine any open questions, or `/speckit-plan` to begin implementation planning. The 3 assumption-resolved questions (rotation order, session composition under per-word unlock, star granularity) are explicit choices in the Assumptions section — flag them in `/speckit-clarify` if they need stakeholder review before planning.
