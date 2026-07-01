# Requirements Quality Checklist: Math Foundations

Gate before implementation. Each item maps to a spec requirement / Constitution principle.

## Completeness
- [x] Every user story has at least one acceptance scenario and an independent test.
- [x] All functional requirements (FR-001..FR-015) are testable and unambiguous.
- [x] Success criteria (SC-001..SC-006) are measurable.
- [x] Out-of-scope explicitly listed (no multiplication, dashboards, extra languages).

## Constitution alignment
- [x] I. Child-First — 3-option single tap, mascot, celebration, gentle retry, no dead-ends.
- [x] II. Accessibility — visual+caption for every prompt (no audio-only), keyboard/touch, axe tests, SVG titles.
- [x] III. Progressive Mastery — exact mandated sequence; ordered unlock; per-problem mastery; unit-tested gating.
- [x] IV. Safe Sandbox — no network/links/UGC/ads; on-device speech; local-only storage.
- [x] V. Performance & Offline — additive migration, inline SVG + emoji (no asset fetches), reduced-motion respected.
- [x] VI. Code Quality — named constants, subject isolation, files < 200 lines, DRY single player.
- [x] VII. Test Coverage — logic unit-tested; one play-through per activity; migration test; axe.

## Clarity / no ambiguity
- [x] Mastery defined (consecutive-correct threshold) — not vague.
- [x] Unlock rule defined (prior-topic mastery fraction ≥ threshold).
- [x] Session size and choice count are fixed named constants.
- [x] Feedback contract (correct/retry/reveal) is identical across all activity types.

## Data
- [x] Each of 7 topics has ≥ 10 problems generated (SC-006).
- [x] Distractor strategy specified per topic (research R5).
- [x] Choices and answers baked into data (no runtime guessing).

All checks pass — cleared for `/speckit.tasks` and implementation.
