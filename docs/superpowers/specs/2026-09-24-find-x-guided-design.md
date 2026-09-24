# Find X — Guided Practice — Design

**Date:** 2026-09-24
**Status:** Draft — one open assumption (§0) and one scope decision (§11, gap 2);
otherwise ready for planning

## 0. The one open assumption

The request was *"tìm x khi biết tổng và hiệu"*, which reads two ways:

- **Form A** — the unknown sits inside one addition or subtraction: `x + 6 = 14`,
  `20 − x = 12`. "Biết tổng" = the total is given; "biết hiệu" = the difference is
  given.
- **Form B** — the grade-4 word problem: two numbers, their sum and their
  difference are given, find both. `Số bé = (Tổng − Hiệu) : 2`.

**This spec is written for Form A.** Three answers point there and none point at B:

1. Number range chosen: **within 20**. Form B's canonical problem is *Tổng 24,
   Hiệu 6* — the sum alone exceeds 20. The two choices cannot both hold.
2. Placement chosen: **a new stage inside the Number Lab**, which is the ≤10
   missing-number pillar. Form B does not belong there.
3. The Number Lab already has `addend` ("hidden in a plus") and `takeaway`
   ("hidden in a minus") — exactly the forms named, and they only ever ask for
   the result, never for the reasoning. That gap matches the complaint.

**If this is wrong**, say so and the numbered decisions below survive: the five-step
chain, the diagnostic distractors, the check step and the fading ladder all carry
over. What changes is the bar model (two offset segments instead of part–part–whole),
the number range (100+), and the step list gains a "find the second number" step.
Roughly a third of the work is re-done, none of the architecture.

## 1. Summary

The Number Lab gains **three new stages** that teach the *decision* rather than
grading the *answer*. Instead of asking `x + 6 = 14 → ?`, a problem is broken into
a chain of steps:

| # | Step | Question | Answered with |
| --- | --- | --- | --- |
| 1 | `role` | Is x a part, or the whole? | 2 choices |
| 2 | `operation` | To find that, do we add or subtract? | 2 choices |
| 3 | `operands` | Which number with which, in which order? | 3 choices |
| 4 | `compute` | What does that come to? | number tiles 0–20 |
| 5 | `check` | Put it back — does it fit? | 2 choices |

Every wrong choice gets **its own explanation**, not a generic "try again". A
part–whole bar is drawn above the equation the whole time, so "why" has a picture
to point at. The three stages fade the scaffolding out: all five steps → steps 3–5
→ compute-and-check with a hint button.

All copy for these stages is **in Vietnamese**; the rest of the app stays English.

## 2. Decisions

Recorded because each one closes off an alternative that will look tempting again.

1. **Its own run engine, not `math-quiz-store`.** That store holds one `selected`
   and one `checked` per question. A problem here holds five graded sub-answers, a
   growing trail, and per-step statistics. Bending the store would complicate the
   code path every existing hive and lab question travels through. Precedent:
   the Math Puzzles design made the same call for the same reason.
2. **Steps are derived, never authored.** `deriveSteps(problem)` is a pure function
   of `(form, a, b)`. A bank of hand-written steps cannot be verified by
   construction; a derivation can — and an inconsistent step is not representable.
3. **A runtime seeded generator, no JSON bank.** A problem is four integers plus a
   form tag; within 20 the space is small and fully enumerable. This diverges from
   `scripts/generate-number-lab-data.ts` deliberately: banks exist because
   hand-tuned distractors need review, and these distractors are computed. Same
   precedent and same argument as the Puzzles pillar.
4. **Wrong step re-asks that step, not the problem.** Restarting the problem
   punishes the child for the one decision she got wrong and lets her re-guess the
   ones she got right. The wrong option stays on screen, greyed, with its reason
   attached.
5. **Distractors are diagnostic, one misconception each.** Not near-misses. A
   reversed subtraction, an added-instead-of-subtracted, an off-by-one: each is a
   thing children actually do, and each names itself when tapped.
6. **The check step is mandatory, not a reward screen flourish.** Substituting the
   answer back is the transferable skill — it is what she will do in an exam when
   no app is there.
7. **All four forms are interleaved inside every run.** Ten consecutive `x + a = b`
   teaches "always subtract", which is the very habit that breaks on `x − a = b`.
   A run that does not contain all four forms is a bug, and the generator test
   asserts it.
8. **Three stages, all open from the start.** Fading is the point of the activity,
   and the Number Lab's existing rule is that the ladder is teaching order, not a
   gate (`practice-progress.ts`). No new unlock state.
9. **Vietnamese copy lives in `src/locales/en/math.json`.** Not a `vi` locale. The
   instruction was to translate *these lessons only*. A real `vi` namespace means a
   language switch, a stored preference, and a decision about `vocab.json` — which
   must stay English, because its whole purpose is teaching English. Deferred
   whole; see §10.
10. **Hearts off, countdown off.** Inherited from the Number Lab (this is the
    pillar for the thing she finds hardest) and confirmed: no timer here. A
    countdown on a "think it through" exercise rewards guessing.

## 3. The activity

### 3.1 The four forms

| Form | Example | x is | x = |
| --- | --- | --- | --- |
| `x+a=b` | `x + 6 = 14` | a part | `b − a` |
| `a+x=b` | `6 + x = 14` | a part | `b − a` |
| `x-a=b` | `x − 8 = 5` | the whole | `b + a` |
| `a-x=b` | `20 − x = 12` | a part | `a − b` |

Constraints: `0 ≤ a, b, x ≤ 20`, every intermediate value in range, and `x` is
never `0` or equal to `a` or `b` (those let a child reach the right answer by
copying a number off the screen).

### 3.2 Step derivation

`deriveSteps(problem, level)` returns the chain. Each step is
`{ kind, promptKey, vars, input, options }`, each option
`{ labelKey | label, vars, correct, whyKey, value? }` — worded options carry a
`labelKey` through i18n, numerals and equations carry a literal `label`, and
`whyKey` is present on **every** option, right or wrong, so the trail can show
the reason for the right one too.

- **`role`** — whole-unknown iff form is `x-a=b`. The other three make x a part.
- **`operation`** — part unknown → subtract; whole unknown → add.
- **`operands`** — the ordered pair. Order is the whole point for subtraction.
- **`compute`** — number tiles, `answerValue = x`.
- **`check`** — the original equation with `x` substituted, against the working
  restated as an equation (see §3.3).

### 3.3 Diagnostic distractors

| Step | Wrong option | `whyKey` reads (Vietnamese) |
| --- | --- | --- |
| `role` | wrong role, x is a part | "Cả tổng là {{whole}} — {{a}} và x là hai phần ghép lại." |
| `role` | wrong role, x is the whole | "Đây là phép trừ: {{a}} và {{b}} là hai phần, x mới là cả tổng." |
| `operation` | add when subtract | "Cộng là khi đi tìm cả tổng, mà tổng đã biết rồi." |
| `operation` | subtract when add | "Ở đây thiếu chính cả tổng — hai phần phải ghép lại." |
| `operands` | operands swapped | "Trừ ngược rồi — số lớn phải đứng trước." |
| `operands` | wrong operation applied | "Đó là đi tìm cả tổng, mà tổng đã có sẵn." |
| `check` | the working, restated | "Đó là phép con vừa làm để TÌM x. Thử lại nghĩa là thay x vào chính đề bài." |

`compute` has no distractors: it is answered on the 0–20 tile strip, where tapping
a number is a real answer rather than an elimination among four near-misses.

The `check` distractor is the child's own working restated (`14 − 6 = 8`), not a
false sum. It is arithmetically *true*, which is exactly why it is worth teaching
against — and unlike a flipped-operator statement it is well-formed and
non-negative for all four forms.

Distractors are de-duplicated against the correct answer and against each other,
and clamped to 0–20; a step that ends up with fewer than two options makes the
generator discard that problem and draw another, up to `FINDX_MAX_REDRAWS` (8)
times before falling back to a known-good problem for that form. A composer that
could spin forever on a starved form is the failure mode the bound exists for.
Asserted by test.

### 3.4 Word problems

About a third of the problems carry a `story`: *"Trên cành có 14 con chim, bay đi
mất 6 con. Hỏi còn lại mấy con?"* A story problem prepends a **step 0 `read`** —
"Đâu là cả tổng?" — tapping the number in the sentence. Stories come from a small
fixed set of templates (birds, sweets, marbles, stickers) parameterised by `a`/`b`,
so no free text is generated at runtime.

Stories are only generated for the three forms whose **whole is a visible number**
(`x+a=b`, `a+x=b` → the whole is `b`; `a-x=b` → the whole is `a`). In `x-a=b` the
whole *is* the unknown, so "đâu là cả tổng?" would have no tappable answer. The
generator refuses that combination and the test asserts it.

### 3.5 The three stages

| Index | Id | Card | Steps asked | Problems |
| --- | --- | --- | --- | --- |
| 7 | `findxGuided` | Tìm X từng bước | all (0–5) | 6 |
| 8 | `findxShort` | Tìm X gọn | `operands`, `compute`, `check` | 8 |
| 9 | `findxSolo` | Tự tìm X | `compute`, `check` | 10 |

**These stages are not appended to `PRACTICE_STAGES`.** That array is the
bank-backed ladder, and `PRACTICE_STAGE_COUNT` is its *band range*:
`math-number-lab-data.test.ts` asserts `bank.length === PRACTICE_STAGE_COUNT ×
PRACTICE_STAGE_SIZE × PRACTICE_WINDOWS` and that every stage in the array has
questions. Find X has no bank, so growing either would break a true test with a
false stage. Instead `FINDX_STAGES` is its own array and
`LAB_STAGES = [...PRACTICE_STAGES, ...FINDX_STAGES]` is what the pillar renders
and what `labSummary` counts.

`check` survives even in the solo stage. Decision #6 makes it the transferable
skill, and a stage that drops it would teach that checking is optional scaffolding
rather than part of solving.

Stages 8 and 9 show a **"Chỉ tôi cách làm"** button that expands the full chain for
the current problem. Using it does not cost anything — the goal is that she stops
reaching for it, and the parent summary reports how often she did.

## 4. Architecture

### 4.1 New files

```text
src/math/
├── types/find-x.types.ts              # FindXProblem, FindXStep, FindXOption, FindXLevel
├── services/
│   ├── find-x-steps.ts                # problem algebra + deriveSteps() — pure
│   ├── find-x-step-builders.ts        # one step's prompt, options, reasons — pure
│   ├── find-x-generator.ts            # seeded problem composer — pure
│   └── find-x-run.ts                  # run reducer + per-step stats — pure
├── components/
│   ├── FindXView.tsx                  # one screen: bar · trail · step card
│   ├── FindXStepCard.tsx              # one step's question + options + reason
│   ├── FindXTrail.tsx                 # the answered-steps reasoning trail
│   └── PartWholeBar.tsx               # the SVG bar model
└── pages/FindXPage.tsx                # route owner: run lifecycle + reward
```

Every file stays under 200 lines (Constitution VI).

`find-x-generator.ts` takes **which form to draw next** as an injected function,
defaulting to a seeded round-robin over the four forms. That seam is the whole
reason adaptive weighting (§11, gap 2) can land later without reopening
`deriveSteps` or the run reducer — a scheduler replaces one argument.

### 4.2 Touched files

| File | Change |
| --- | --- |
| `src/math/types/math.types.ts` | `PracticeStage` gains `activity?: 'findx'` and `runSize?: number` |
| `src/math/data/number-lab.ts` | new `FINDX_STAGES` (7–9) and `LAB_STAGES = [...PRACTICE_STAGES, ...FINDX_STAGES]` |
| `src/math/constants/math-constants.ts` | new `FINDX_*` block; `PRACTICE_STAGE_COUNT` **unchanged** |
| `src/math/components/NumberTileStrip.tsx` | optional `max` prop, defaults to `NUMBER_TILE_MAX` |
| `src/math/components/NumberLabPillar.tsx` | route by `stage.activity` |
| `src/math/components/MathRewardScreen.tsx` | optional `breakdown` line (§6.3) |
| `src/App.tsx` | `/math/findx/:level` route |
| `src/locales/en/math.json` | `lab.stages.findx*`, `findx.*` — Vietnamese |

### 4.3 The engine ↔ view boundary

`find-x-run.ts` exports a reducer over
`{ problems, pIndex, stepIndex, trail, stats, requeued }` and actions
`answer(optionIndex)` / `advance()` / `reveal()`. It never imports React. The page
holds it in `useReducer`; `FindXView` receives plain data and callbacks. Anything a
test needs to assert about grading, re-asking or statistics is reachable without
rendering.

## 5. Data model and persistence

No schema change. Stage results reuse the Number Lab's existing rows in
`mathTopicProgress` under `numberlab:7|8|9` via `practiceTopicId()`, so
`usePracticeProgress` works unmodified and `attempt` keeps seeding fresh runs:

```
seed = hashSeed(`findx:${stageIndex}:${attempt}`)
```

Two consequences to keep in mind, both already true of the existing lab:
`labSummary` now reports "N of 9", and `isMathTopicId` still filters these rows out
of hive star totals.

Per-step statistics are **not** persisted. They are computed for one run and shown
on that run's reward screen; storing a history would be a new table, a new
migration, and a parent-facing feature that was not asked for.

## 6. Grading

### 6.1 Within a problem

A wrong option is marked wrong, disabled, and keeps its reason visible. The step is
re-asked (remaining options only). A problem is **first-pass correct** when no step
was missed and no reveal was used.

### 6.2 Stars

Reuses `computeStars(mastered, total)`. A problem missed on the first pass is
requeued once to the end of the run, matching the Number Lab; getting it right the
second time counts toward `mastered` but not toward `correctCount`. No hearts, no
game over — a run always ends in the reward screen.

### 6.3 The parent line

One extra line on the reward screen, driven by `stats`:

> Chọn đúng phép tính 8/10 · Lấy đúng thứ tự số 6/10 · Tính đúng 9/10

Because each step kind is graded separately, "she cannot subtract" and "she does not
know *which* subtraction" stop looking alike — which is the actual diagnosis a
parent needs.

## 7. Vietnamese copy

New keys go under `findx.*` and `lab.stages.findx*` inside
`src/locales/en/math.json`, with Vietnamese values. This is a deliberate,
documented exception, called out in a comment at the top of the block: the `en`
namespace holds Vietnamese strings for this one activity only. If a real `vi`
locale is built later, this block moves wholesale — it is deliberately one
contiguous subtree so that move is a cut-and-paste.

Everything outside these three stages, including the Number Lab header, the reward
screen chrome and all of Math World's other pillars, stays English.

## 8. Accessibility

- `PartWholeBar` is `role="img"` with an `aria-label` that states the relationship
  in words: *"Cả tổng 14, gồm phần 6 và phần đang tìm."*
- Each step is a `role="group"` labelled by its question, so a screen reader
  announces what is being asked when focus enters.
- Grading feedback lands in `role="status"`; the reason text is real DOM, never a
  transient toast — Constitution II forbids colour as the only signal, and a
  disappearing message is worse than colour.
- Number tiles stay ≥48px (WCAG 2.5.5); 21 tiles lay out 6-per-row, four rows.
- The trail is an ordered list, so "what have I decided so far" is navigable.
- All motion respects `prefers-reduced-motion` via the existing `.ma-*` classes.
- **`lang="vi"` on every Vietnamese subtree.** The document declares `lang="en"`
  and i18next runs `lng: 'en'`, so without this a screen reader pronounces these
  screens with English phonemes — unintelligible. This is a defect created by
  decision #9, and it is the price of skipping a real `vi` locale: the wrapper in
  `FindXView` and the reward breakdown line both carry the attribute explicitly.
- Sound reuses `playWin` / `playBuzz` from `@/shared/utils/sfx`, fired per step
  rather than per problem, so the feedback lands on the decision that earned it.

## 9. Testing

### 9.1 Automated

| File | Asserts |
| --- | --- |
| `tests/unit/find-x-steps.test.ts` | every form derives the right role/operation/operand pair; recomputing from the chosen operands returns `x`; no distractor equals its answer; every option carries a `whyKey` |
| `tests/unit/find-x-generator.test.ts` | same seed → identical run; all values within 0–20; no duplicate problem in a run; all four forms present; story ratio within bounds; `x ∉ {0, a, b}` |
| `tests/unit/find-x-run.test.ts` | a wrong answer re-asks the same step; a right answer advances; a missed problem is requeued exactly once; `stats` count per step kind; reveal marks the problem not-first-pass |
| `tests/integration/find-x-guided.test.tsx` | play a full stage-7 run: trail grows, wrong option shows its reason and stays, reward screen renders the breakdown line |
| `tests/integration/find-x-fading.test.tsx` | stage 9 asks only `compute`; "Chỉ tôi cách làm" expands the chain |
| `tests/a11y/find-x.test.tsx` | axe passes on the step screen and on the reward screen; every Vietnamese subtree carries `lang="vi"` |
| `tests/unit/find-x-copy.test.ts` | **every key `deriveSteps` can emit resolves in `math.json`** — see below |

`find-x-copy.test.ts` matters more here than in any existing bank. Elsewhere the
generator writes `promptKey` into a JSON file a test can walk; here the keys are
produced at runtime from a form and a role, so a typo in one branch ships as a raw
`findx.why.reversedSub` string on screen and nothing catches it. The test enumerates
all four forms × both roles × every step kind, derives the steps, and resolves each
`promptKey`/`whyKey` against `@/locales/en/math.json` — the same `resolveKey` helper
`math-number-lab-data.test.ts` already uses.

### 9.2 Visual capture

None of the above renders pixels. jsdom will happily pass an axe test on a bar model
that is drawn 3px tall, a tile strip that overflows its card, or a trail that pushes
the step card off-screen — and this activity is mostly layout. So each of these gets
captured against the running dev server (`preview_start` → `vite-dev`, port 5180) and
saved to `docs/superpowers/screenshots/2026-09-24-find-x/`:

| # | Shot | What it has to prove |
| --- | --- | --- |
| 1 | Number Lab pillar, full | nine cards read as one ladder; the three new ones are visibly a group, not stage 7 orphaned after `compare` |
| 2 | Stage 7, step `role` | bar model, equation and step card all fit above the fold on tablet |
| 3 | Same, after a wrong tap | the wrong option is greyed **with its reason still on screen** — the single most important frame in the activity |
| 4 | Stage 7, step `operands` | three options, none truncated (`14 − 6` vs `6 − 14` must be distinguishable at a glance) |
| 5 | Step `compute` | 21 tiles, 6 per row, every tile ≥48px, strip not overflowing |
| 6 | Trail at step 5 | five reasons stacked without pushing the step card out of view — the scroll risk |
| 7 | Word-problem variant | Vietnamese sentence wraps cleanly, step 0 visible |
| 8 | Stage 9 + "Chỉ tôi cách làm" expanded | the hint does not reflow the page under the child's finger |
| 9 | Reward screen | the parent breakdown line fits on one line at tablet width, wraps legibly at 375px |
| 10 | Shots 2, 5, 6 at 375×812 | the real failure surface: bar model, tile strip and trail on a phone |

Before/after pairs are required for shot 1 only (the pillar is the one existing
screen that changes). Everything else is new, so a single frame each.

Captures are reviewed against §3 and §8 and committed with the implementation, not
with this spec. They are evidence, not a regression suite: there is no pixel
baseline, no Playwright, and adding either is out of scope (§10).

## 10. Out of scope

- **Form B** (tìm hai số khi biết tổng và hiệu, lớp 4) — see §0.
- **A real `vi` locale**: namespace, language switch, stored preference. Worth doing
  on its own terms; not a prerequisite for this.
- **Numbers above 20** — the tile strip is the answer widget and 21 tiles is already
  its comfortable ceiling. Beyond that the activity needs a keypad, which is a
  different design.
- **Multiplication and division forms** (`x × 4 = 20`). The step chain generalises
  to them cleanly (part/whole becomes factor/product) but nothing asked for it.
- **Persisted per-step history** and any parent dashboard beyond the one run-end line.
- **Pixel-baseline visual regression** (Playwright / snapshot images). §9.2 captures
  evidence for review; it does not gate CI.

## 11. Completeness against the request

The request was: *"con đang yếu phần tìm x… tôi muốn một trắc nghiệm hướng dẫn muốn
tìm X thì phải làm gì, lấy số nào và số nào, tại sao."* Taken clause by clause:

| Asked for | Covered by | Verdict |
| --- | --- | --- |
| "trắc nghiệm" | steps `role`, `operation`, `operands`, `check` are choices | **partial** — see gap 1 |
| "hướng dẫn" | the step chain itself, §3.2 | ✅ |
| "muốn tìm X thì phải làm gì" | step `operation` | ✅ |
| "lấy số nào và số nào" | step `operands`, ordered | ✅ |
| "tại sao" | step `role` + `PartWholeBar` + a `whyKey` on every option | ✅ |
| "con đang bị yếu" | — | **gap 2, the significant one** |

### Gap 1 — `compute` is not multiple choice

Four of six steps are choices; `compute` is the number-tile strip, inherited from the
Number Lab. That is deliberate — tapping a number off a 0–20 strip proves she can do
the arithmetic, where four options let her eliminate her way to it. But it does mean
the activity is not uniformly "trắc nghiệm" as asked. Low stakes and reversible:
`QuizAnswerPad` already switches widget by `input`, so turning `compute` into a
four-option step later is a one-line change to the step derivation.

### Gap 2 — nothing targets the form she is weak at

This is the one worth a decision before implementation.

The stated problem is that she is *weak* at this, but §5 selects problems by a seed
derived from the attempt counter — a round-robin. If she reliably fails `x − a = b`
and sails through `x + a = b`, the twelfth run still serves her roughly the same mix
as the first. The spec measures the weakness (§6.3 counts misses per step kind) and
then throws the measurement away at the end of the run.

The repository already solved this once, for grammar:
`src/english/grammar/services/rule-scheduler.ts` does weighted sampling —
`WEIGHT_WEAK = 5`, `WEIGHT_UNSEEN = 3`, `WEIGHT_GOLD = 1`, never zero so mastered
items resurface — plus `breakRuns` so nothing appears three times consecutively.
`mastery.ts` and `use-rule-mastery` persist the per-item state behind it.

Closing the gap means: persist per-form mastery (four forms, one row per child),
weight the generator's form choice by it, and reuse `breakRuns` so a weak form does
not monopolise a run. Roughly one new service, one new hook, one Dexie table or a
reuse of `mathTopicProgress`, and it interacts with decision #7 (all four forms must
still appear in every run — weighting changes the proportions, not the coverage).

Three options, in the order I would take them:

1. **Ship v1 as specified, add weighting in v2.** The step chain is the change that
   addresses the complaint most directly; adaptive selection makes an already-working
   activity more efficient. It also means v2 is designed against real miss data from
   her actual runs rather than a guess about which form is hard.
2. **Fold weighting into v1.** More faithful to "con đang yếu", noticeably more work,
   and the weights would be picked blind.
3. **Do neither and rely on the three stages.** Not recommended: fading scaffolding
   is orthogonal to *which problem* gets served.

Recommendation is (1), and this spec is written for it. The design does not block
(2): the generator takes form selection as an injected function precisely so a
scheduler can replace the round-robin without touching `deriveSteps`.

### Smaller things checked and deliberately left

- **No session length choice.** Run sizes are fixed per stage (6 / 8 / 10). The
  Number Lab does the same and nobody has asked to change it.
- **No streak or honey award beyond `awardEconomy`**, which `recordStageCleared`
  already calls — these stages inherit it for free.
- **No offline concern.** Everything is computed locally; no new assets, no fetch.
- **No Dexie migration.** §5 reuses existing rows; gap 2 is the only thing that
  might introduce one, and only if it chooses a new table over `mathTopicProgress`.
