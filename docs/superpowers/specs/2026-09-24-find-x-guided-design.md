# Find X — Guided Practice — Design

**Date:** 2026-09-24
**Status:** Draft — one open assumption (§0), otherwise ready for planning

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
→ the bare question with a hint button.

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

`deriveSteps(problem)` returns the chain. Each step is
`{ kind, promptKey, vars, options }`, each option
`{ label, correct, whyKey }` — `whyKey` is present on **every** option, right or
wrong, so the trail can show the reason for the right one too.

- **`role`** — whole-unknown iff form is `x-a=b`. The other three make x a part.
- **`operation`** — part unknown → subtract; whole unknown → add.
- **`operands`** — the ordered pair. Order is the whole point for subtraction.
- **`compute`** — number tiles, `answerValue = x`.
- **`check`** — the original equation with `x` substituted, against one that
  applies the wrong operation.

### 3.3 Diagnostic distractors

| Step | Wrong option | `whyKey` reads (Vietnamese) |
| --- | --- | --- |
| `role` | wrong role, x is a part | "Cả tổng là {{whole}} — {{a}} và x là hai phần ghép lại." |
| `role` | wrong role, x is the whole | "Đây là phép trừ: {{a}} và {{b}} là hai phần, x mới là cả tổng." |
| `operation` | add when subtract | "Cộng là khi đi tìm cả tổng, mà tổng đã biết rồi." |
| `operation` | subtract when add | "Ở đây thiếu chính cả tổng — hai phần phải ghép lại." |
| `operands` | operands swapped | "Trừ ngược rồi — số lớn phải đứng trước." |
| `operands` | wrong operation applied | "Đó là đi tìm cả tổng, mà tổng đã có sẵn." |
| `compute` | off-by-one | "Đếm lùi lại từ {{b}} xem nào." |
| `compute` | reverse-op result | "Đó là kết quả của phép ngược lại." |
| `check` | wrong operation | "Đề là phép {{op}}, nên thay vào cũng phải {{op}}." |

Distractors are de-duplicated against the correct answer and against each other,
and clamped to 0–20; a step that ends up with fewer than two options is regenerated
with a different problem. Asserted by test.

### 3.4 Word problems

About a third of the problems carry a `story`: *"Trên cành có 14 con chim, bay đi
mất 6 con. Hỏi còn lại mấy con?"* A story problem prepends a **step 0 `read`** —
"Đâu là cả tổng?" — tapping the number in the sentence. Stories come from a small
fixed set of templates (birds, sweets, marbles, stickers) parameterised by `a`/`b`,
so no free text is generated at runtime.

### 3.5 The three stages

| Index | Id | Card | Steps asked | Problems |
| --- | --- | --- | --- | --- |
| 7 | `findxGuided` | Tìm X từng bước | all (0–5) | 6 |
| 8 | `findxShort` | Tìm X gọn | `operands`, `compute`, `check` | 8 |
| 9 | `findxSolo` | Tự tìm X | `compute` only | 10 |

Stages 8 and 9 show a **"Chỉ tôi cách làm"** button that expands the full chain for
the current problem. Using it does not cost anything — the goal is that she stops
reaching for it, and the parent summary reports how often she did.

## 4. Architecture

### 4.1 New files

```text
src/math/
├── types/find-x.types.ts              # FindXProblem, FindXStep, FindXOption, FindXLevel
├── services/
│   ├── find-x-steps.ts                # deriveSteps() + distractors — pure
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

### 4.2 Touched files

| File | Change |
| --- | --- |
| `src/math/types/math.types.ts` | `PracticeStage` gains `activity?: 'findx'` and `runSize?: number` |
| `src/math/data/number-lab.ts` | three new `PRACTICE_STAGES` entries (7–9) |
| `src/math/constants/math-constants.ts` | `PRACTICE_STAGE_COUNT` 6 → 9; new `FINDX_*` block |
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

## 9. Testing

| File | Asserts |
| --- | --- |
| `tests/unit/find-x-steps.test.ts` | every form derives the right role/operation/operand pair; recomputing from the chosen operands returns `x`; no distractor equals its answer; every option carries a `whyKey` |
| `tests/unit/find-x-generator.test.ts` | same seed → identical run; all values within 0–20; no duplicate problem in a run; all four forms present; story ratio within bounds; `x ∉ {0, a, b}` |
| `tests/unit/find-x-run.test.ts` | a wrong answer re-asks the same step; a right answer advances; a missed problem is requeued exactly once; `stats` count per step kind; reveal marks the problem not-first-pass |
| `tests/integration/find-x-guided.test.tsx` | play a full stage-7 run: trail grows, wrong option shows its reason and stays, reward screen renders the breakdown line |
| `tests/integration/find-x-fading.test.tsx` | stage 9 asks only `compute`; "Chỉ tôi cách làm" expands the chain |
| `tests/a11y/find-x.test.tsx` | axe passes on the step screen and on the reward screen |

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
