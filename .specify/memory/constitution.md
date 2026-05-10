<!--
SYNC IMPACT REPORT
==================
Version change: [TEMPLATE] → 1.0.0 (initial ratification — all placeholders replaced)

Modified principles:
  [PRINCIPLE_1_NAME] → I. Child-First User Experience
  [PRINCIPLE_2_NAME] → II. Accessibility by Default
  [PRINCIPLE_3_NAME] → III. Progressive Mastery (NON-NEGOTIABLE)
  [PRINCIPLE_4_NAME] → IV. Safe & Private Sandbox
  [PRINCIPLE_5_NAME] → V. Performance & Offline Reliability
  Added: VI. Code Quality & Reusability
  Added: VII. Test Coverage for Logic & Behavior

Added sections:
  "Visual & Audio Design Standards" (replaces [SECTION_2_NAME])
  "Content & Curriculum Standards"  (replaces [SECTION_3_NAME])

Removed sections: none

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check gates reference these principles; no structural change required, gates auto-derive from this file
  ✅ .specify/templates/spec-template.md — FR format unchanged; accessibility/safety requirements now named-constant-driven per Principle VI
  ✅ .specify/templates/tasks-template.md — task categories unchanged; axe-core accessibility tasks now expected per Principle II; PWA/offline tasks per Principle V

Deferred TODOs: none
-->

# Ongtopica Constitution

## Core Principles

### I. Child-First User Experience

Every screen, interaction, and feedback loop MUST be designed for a child aged 4–10, assuming
minimal reading ability for the youngest users. Specifically:

- Navigation MUST rely on large buttons, bright distinguishable colors, icons, and audio labels —
  not text — as the primary wayfinding mechanism.
- Every correct answer MUST trigger an immediate positive celebration (animation, sound, mascot
  reaction). Every incorrect answer MUST respond with gentle encouragement — never punishment,
  shame, or negative tone.
- Each activity session MUST be completable in under 5 minutes to match children's attention spans.
- Every activity MUST provide a clearly visible, always-reachable "back" or "exit" control.
  Dead-ends are prohibited — the child MUST never feel lost or stuck.
- A consistent, friendly mascot character MUST guide the child through all activities, providing
  contextual cues and transitions.

**Rationale**: The primary user cannot self-advocate. The UI is the product's single most critical
safety net. Violations here directly harm the child's experience and learning outcome.

### II. Accessibility by Default

All interactive elements MUST meet or exceed WCAG AA standards from day one — not as a retrofit:

- Full keyboard navigation MUST be supported across all screens and activities.
- All interactive elements MUST expose semantic roles and labels for screen reader compatibility.
- Color contrast ratios MUST meet WCAG AA minimum (4.5:1 for normal text, 3:1 for large/UI).
- No interaction or instruction MUST rely on audio alone — every audio cue MUST have a visual
  equivalent (icon, animation, or on-screen text).
- All activities MUST be fully operable by touch (tablet) and by mouse/keyboard (desktop).
- Automated accessibility testing with axe-core MUST run on every new or modified screen before
  merge.

**Rationale**: Children with visual, motor, or auditory differences are in our target audience.
Accessibility is a product requirement, not an enhancement.

### III. Progressive Mastery (NON-NEGOTIABLE)

The learning engine MUST enforce gradual difficulty progression:

- A child MUST demonstrate mastery of the current level before the system unlocks the next.
  Skipping levels is prohibited unless explicitly overridden by a parent/teacher role.
- English content MUST be sequenced: alphabet → phonics → sight words → simple sentences →
  listening comprehension.
- Math content MUST be sequenced: number recognition → counting → basic addition/subtraction →
  patterns → shapes → simple logic puzzles.
- All content MUST be reviewed for age-appropriateness before implementation.
- All scoring and progression logic MUST be covered by unit tests. Progression decisions are
  the highest-risk logic in the system.

**Rationale**: Jumping levels without mastery undermines learning science and frustrates children.
Progression logic is too important to leave untested or undocumented.

### IV. Safe & Private Sandbox

The application MUST operate as a fully closed, child-safe environment:

- Zero external links MUST exist anywhere in the application — no link that navigates a child
  outside the app is permitted under any circumstance.
- No user-generated content is permitted.
- No social features, in-app chat, or peer communication of any kind.
- No third-party advertising or ad networks.
- No third-party tracking, analytics SDKs, or telemetry that transmit child data externally.
- All images, audio, character assets, and written content MUST be age-appropriate and
  culturally inclusive before inclusion in the build.

**Rationale**: Children cannot evaluate online risks. The application is responsible for
enforcing a completely safe perimeter around their experience.

### V. Performance & Offline Reliability

The application MUST perform reliably under real-world home/classroom conditions:

- Every activity MUST load within 2 seconds on a standard home internet connection.
- Animations MUST NOT cause layout shifts (CLS score 0) or janky frame rates.
- The application MUST be fully usable offline after first load (PWA with service worker caching).
- All assets required for activities MUST be pre-cached; network failures MUST surface a
  friendly, child-appropriate offline state — never a browser error.

**Rationale**: Many children use the app in environments with unreliable connectivity. Offline
support is a curriculum-continuity requirement.

### VI. Code Quality & Reusability

All code MUST follow these non-negotiable standards:

- All game parameters — timers, score thresholds, difficulty levels, attempt limits — MUST be
  defined as named constants. Magic numbers are prohibited.
- All components MUST be reusable, clearly named, and focused on a single responsibility.
- The folder structure MUST separate subjects (`english/`, `math/`), difficulty levels, and
  shared UI components (`shared/`). No cross-subject component entanglement.
- Files MUST stay under 200 lines; split when exceeded.
- Comments are REQUIRED on all progression logic, scoring calculations, and difficulty
  decision points — these are non-obvious and high-stakes.
- Code MUST follow YAGNI/KISS/DRY. No speculative abstractions.

**Rationale**: This is a long-lived educational product. Poor modularity directly increases
the cost of adding new content, correcting curriculum, and onboarding contributors.

### VII. Test Coverage for Logic & Behavior

Testing MUST be treated as a first-class product requirement:

- All scoring, progression, and level-unlock logic MUST have unit tests before the logic ships.
- Each activity type MUST have at least one integration test covering a full play-through
  (start → answer interactions → completion → progression).
- Automated accessibility tests (axe-core) MUST run on every new screen.
- Failing tests MUST block merge. Tests MUST NOT be disabled or mocked to pass CI.
- Multilingual content switching MUST be tested if i18n is activated.

**Rationale**: The consequences of a broken progression system are invisible in QA but
immediately apparent to a child who cannot advance or is sent backward without cause.

## Visual & Audio Design Standards

- A single mascot character MUST appear consistently across all screens, activities, and
  feedback moments. The mascot's design MUST be culturally neutral and inclusive.
- Color palettes MUST be bright and saturated but NOT overwhelming — avoid pure #FF0000-style
  primaries; prefer friendly, slightly desaturated child-app palettes.
- Sound effects and voice narration MUST be toggleable by parents/teachers via a settings
  panel they control — not the child.
- Animations MUST be purposeful: they MUST celebrate progress, signal transitions, or guide
  attention. Decorative-only animations that could cause distraction or motion sensitivity
  issues are discouraged.
- All visual designs MUST be reviewed against WCAG color contrast requirements before
  implementation.

## Content & Curriculum Standards

- All curriculum content MUST be reviewed for age-appropriateness by at least one
  domain-knowledgeable reviewer before implementation.
- Content MUST be sequenced per Principle III — no out-of-order content delivery.
- The i18n architecture (locale keys, translation file structure) MUST be in place from day
  one, even if only one language is initially shipped. Hardcoded UI strings are prohibited.
- All instructional content MUST have both audio narration and a visual text/icon equivalent
  to satisfy Principle II.
- Parent and teacher dashboards MUST show progress per subject, per level, and per child
  — no opaque aggregates without drill-down.

## Governance

This Constitution supersedes all other design, UX, and engineering decisions in the Ongtopica
project. Amendments require:

1. A written rationale explaining why the current principle is insufficient or incorrect.
2. A version bump following semantic versioning:
   - **MAJOR**: Removing or fundamentally redefining an existing principle.
   - **MINOR**: Adding a new principle or materially expanding guidance.
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements.
3. Update of this file with a new Sync Impact Report comment block.
4. All open PRs MUST be reviewed against the amended principles before merge.

All pull requests and code reviews MUST verify compliance with the principles relevant to
the change. A Constitution Check section in each plan.md MUST explicitly list which
principles were evaluated and confirmed.

**Version**: 1.0.0 | **Ratified**: 2026-05-10 | **Last Amended**: 2026-05-10
