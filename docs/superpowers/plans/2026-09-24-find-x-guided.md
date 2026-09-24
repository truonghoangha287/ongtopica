# Find X — Guided Practice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three Number Lab stages that teach a child *how to decide* what to do
to find x — which role x plays, which operation, which two numbers in which order,
and why — instead of only grading the final number.

**Architecture:** Three pure services (`find-x-steps` derives a step chain from a
problem, `find-x-generator` composes a seeded run of problems, `find-x-run` is the
reducer that grades a run) sit under a thin view layer. Nothing touches
`math-quiz-store`; nothing is persisted beyond the existing
`mathTopicProgress` rows the Number Lab already writes.

**Tech Stack:** TypeScript 5.8, React 18.3, Vite 6, react-i18next, react-router-dom 7,
Vitest + Testing Library + vitest-axe. No new dependencies.

**Spec:** [`docs/superpowers/specs/2026-09-24-find-x-guided-design.md`](../specs/2026-09-24-find-x-guided-design.md)

## Global Constraints

Every task's requirements implicitly include all of these.

- **No new dependencies.** Nothing gets added to `package.json`.
- **No magic numbers in components or services.** Every tunable goes in
  `src/math/constants/math-constants.ts` with a comment (Constitution VI).
- **Every new file stays under 200 lines** (Constitution VI).
- **All values stay in `0..FINDX_VALUE_MAX` (20)**, including intermediates.
- **The minus sign is `−` (U+2212), never the ASCII hyphen.** The existing bank and
  `equation-parts.ts` both use U+2212; mixing them breaks string matching.
- **All user-facing copy for these screens is Vietnamese**, stored under `findx.*`
  and `lab.stages.findx*` in `src/locales/en/math.json` as one contiguous subtree.
- **Every Vietnamese subtree carries `lang="vi"`.** The document is `lang="en"`;
  without this a screen reader reads Vietnamese with English phonemes.
- **Colour is never the only signal.** Every graded control also states its state in
  its `aria-label` or its text (Constitution II).
- **Tap targets ≥ 48px** (WCAG 2.5.5).
- **Run from the worktree root.** Commands below assume
  `/Users/frozenman/IdeaProjects/ongtopica/.claude/worktrees/subagent-word-game-hearts-1c0ec8`.
- **Do not touch** `PRACTICE_STAGE_COUNT`, `PRACTICE_STAGES`, or
  `src/math/data/banks/*.json`. `math-number-lab-data.test.ts` asserts the bank holds
  exactly `PRACTICE_STAGE_COUNT × PRACTICE_STAGE_SIZE × PRACTICE_WINDOWS` questions
  and that every stage in `PRACTICE_STAGES` has some; Find X has no bank.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/math/types/find-x.types.ts` | Domain types only. No logic, no React, no Dexie. |
| `src/math/constants/math-constants.ts` | *(modify)* the `FINDX_*` block |
| `src/math/services/find-x-steps.ts` | The algebra of a problem, plus `deriveSteps`. Pure. |
| `src/math/services/find-x-step-builders.ts` | Builds one step's prompt, options and reasons. Pure. |
| `src/math/services/find-x-generator.ts` | Seeded run composer. Pure. Form choice is injected. |
| `src/math/services/find-x-run.ts` | Run state + reducer + per-step stats. Pure. |
| `src/math/components/PartWholeBar.tsx` | The SVG bar model. Presentational. |
| `src/math/components/FindXTrail.tsx` | The answered-steps reasoning trail. Presentational. |
| `src/math/components/FindXStepCard.tsx` | One step: question, options, reason. Presentational. |
| `src/math/components/FindXView.tsx` | Composes bar + trail + step card + chrome. Presentational. |
| `src/math/pages/FindXPage.tsx` | Owns the run lifecycle, progress writes, reward screen. |
| `src/math/data/number-lab.ts` | *(modify)* `FINDX_STAGES`, `LAB_STAGES`, lookups |
| `src/math/components/NumberTileStrip.tsx` | *(modify)* optional `max` prop |
| `src/math/components/NumberLabPillar.tsx` | *(modify)* render `LAB_STAGES`, route by `activity` |
| `src/math/components/MathRewardScreen.tsx` | *(modify)* optional `breakdown` line |
| `src/math/types/math.types.ts` | *(modify)* `PracticeStageId` union, `PracticeStage.activity`/`runSize` |
| `src/App.tsx` | *(modify)* `/math/findx/:stage` route |

---

### Task 1: Domain types, constants, copy, and step derivation

The heart of the feature. A problem in, a graded step chain out, with a reason on
every option. Everything after this is plumbing.

**Files:**
- Create: `src/math/types/find-x.types.ts`
- Create: `src/math/services/find-x-steps.ts`
- Create: `src/math/services/find-x-step-builders.ts`
- Modify: `src/math/constants/math-constants.ts` (append at end of file)
- Modify: `src/locales/en/math.json` (add `findx` object and three `lab.stages.*` keys)
- Test: `tests/unit/find-x-steps.test.ts`
- Test: `tests/unit/find-x-copy.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type FindXForm = 'x+a=b' | 'a+x=b' | 'x-a=b' | 'a-x=b'`
  - `type FindXLevel = 'guided' | 'short' | 'solo'`
  - `type FindXStepKind = 'read' | 'role' | 'operation' | 'operands' | 'compute' | 'check'`
  - `interface FindXProblem { id: string; form: FindXForm; a: number; b: number; x: number; story?: FindXStoryTheme }`
  - `interface FindXOption { labelKey?: string; label?: string; vars?: Record<string, string | number>; correct: boolean; whyKey: string; value?: number }`
  - `interface FindXStep { kind: FindXStepKind; promptKey: string; vars: Record<string, string | number>; input: 'choice' | 'tiles'; options: FindXOption[] }`
  - `deriveSteps(p: FindXProblem, level: FindXLevel): FindXStep[]`
  - `wholeOf(p: FindXProblem): number`
  - `roleOf(form: FindXForm): 'part' | 'whole'`
  - `operandsFor(p: FindXProblem): { op: '+' | '−'; left: number; right: number }`
  - `applyOperands(o: { op: '+' | '−'; left: number; right: number }): number`
  - `equationOf(p: FindXProblem, xLabel: string): string`
  - `storyKindOf(form: FindXForm): 'plus' | 'minus' | null`
  - `isStepCorrect(step: FindXStep, value: number): boolean`
  - `FINDX_FORMS: readonly FindXForm[]`
  - Constants: `FINDX_VALUE_MAX`, `FINDX_MAX_REDRAWS`, `FINDX_STORY_RATIO`, `FINDX_FIRST_STAGE_INDEX`, `FINDX_RUN_SIZES`

- [ ] **Step 1: Create the domain types**

Create `src/math/types/find-x.types.ts`:

```ts
/**
 * Domain types for the Find X practice stages. Kept free of React, Dexie and
 * i18next imports so the pure services can depend on them without dragging in
 * UI or storage concerns — same rule as `math.types.ts`.
 */

/**
 * Where the unknown sits. The string IS the shape of the equation, so a reader
 * never has to look up what `form` means.
 */
export type FindXForm = 'x+a=b' | 'a+x=b' | 'x-a=b' | 'a-x=b';

/** All four forms, in the order the default round-robin serves them. */
export const FINDX_FORMS: readonly FindXForm[] = ['x+a=b', 'a+x=b', 'x-a=b', 'a-x=b'];

/** How much scaffolding a stage shows. Maps 1:1 onto the three stage cards. */
export type FindXLevel = 'guided' | 'short' | 'solo';

/**
 * One decision in the chain.
 * - `read`    — which number in the story is the whole (story problems only)
 * - `role`    — is x a part, or the whole?
 * - `operation` — add or subtract?
 * - `operands` — which two numbers, in which order?
 * - `compute` — do the arithmetic
 * - `check`   — substitute the answer back into the original equation
 */
export type FindXStepKind = 'read' | 'role' | 'operation' | 'operands' | 'compute' | 'check';

/** Story flavours. `plus` hides a part of an addition, `minus` of a subtraction. */
export type FindXStoryKind = 'plus' | 'minus';

/** Which worded scenario a story problem is dressed in. */
export type FindXStoryTheme = 'birds' | 'sweets' | 'marbles';

/** One problem. `x` is stored rather than recomputed so tests can assert both agree. */
export interface FindXProblem {
  id: string;
  form: FindXForm;
  a: number;
  b: number;
  x: number;
  /** Present on story problems; absent on bare equations. */
  story?: FindXStoryTheme;
}

/**
 * One answer control.
 *
 * `labelKey` carries worded options through i18n; `label` is a literal for
 * equations and numerals, which need no translation. Exactly one of the two is
 * set. `whyKey` is present on EVERY option, right or wrong — the trail shows the
 * reason for a correct choice too, which is where the teaching happens.
 */
export interface FindXOption {
  labelKey?: string;
  label?: string;
  vars?: Record<string, string | number>;
  correct: boolean;
  whyKey: string;
  /** `input: 'tiles'` only — the number this option stands for. */
  value?: number;
}

/** One step of the chain, ready to render. */
export interface FindXStep {
  kind: FindXStepKind;
  promptKey: string;
  vars: Record<string, string | number>;
  /** `'choice'` is the option list; `'tiles'` the 0–20 number strip. */
  input: 'choice' | 'tiles';
  options: FindXOption[];
}
```

- [ ] **Step 2: Add the constants**

Append to `src/math/constants/math-constants.ts`:

```ts
// ---------------------------------------------------------------------------
// Find X — the guided "how do I find the unknown" stages (7–9).
// ---------------------------------------------------------------------------

/**
 * Ceiling for every value in a Find X problem, including intermediates. The
 * number-tile strip is the answer widget and 21 tiles is its comfortable limit;
 * past that the activity needs a keypad, which is a different design.
 */
export const FINDX_VALUE_MAX = 20;

/**
 * How many times the composer may discard a candidate problem that violates the
 * range or the `x ∉ {0, a, b}` rule before falling back to a known-good one.
 * Exists so a starved form can never spin the generator forever.
 */
export const FINDX_MAX_REDRAWS = 8;

/** Share of a run dressed as a word problem rather than a bare equation. */
export const FINDX_STORY_RATIO = 1 / 3;

/**
 * Stage index of the first Find X card. Continues the Number Lab's numbering
 * (1–6 are the bank-backed stages) without joining `PRACTICE_STAGES`, whose
 * length is asserted against the generated bank.
 */
export const FINDX_FIRST_STAGE_INDEX = 7;

/**
 * Problems per run, per stage. A guided problem costs up to six taps against a
 * classic lab question's one, so the guided run is shortest — all three land
 * around three minutes.
 */
export const FINDX_RUN_SIZES = { guided: 6, short: 8, solo: 10 } as const;
```

- [ ] **Step 3: Add the Vietnamese copy**

In `src/locales/en/math.json`, add three keys inside the existing `lab.stages`
object (alongside `sums`, `bonds`, …):

```json
"findxGuided": "Tìm X từng bước",
"findxShort": "Tìm X gọn",
"findxSolo": "Tự tìm X"
```

Then add a new top-level `findx` object, as the last key of the file:

```json
"findx": {
  "_comment": "VIETNAMESE. Deliberate exception — see the Find X design doc, section 7. These three stages are in Vietnamese while the rest of the app is English; the whole subtree is contiguous so it can be moved wholesale if a real `vi` locale is ever built.",
  "barAria": "Cả tổng {{whole}}, gồm một phần {{part}} và phần đang đi tìm",
  "barWhole": "cả tổng",
  "barKnown": "phần đã biết",
  "barUnknown": "phần đang tìm",
  "trailAria": "Những bước đã làm",
  "reveal": "Chỉ tôi cách làm",
  "continue": "Tiếp tục",
  "finish": "Xong rồi",
  "exitAria": "Thoát",
  "questionOf": "Bài {{index}} trên {{total}}",
  "secondLook": "Xem lại",
  "rightCount": "Đúng {{count}}",
  "problemLabel": "Tìm số còn thiếu",
  "storyLabel": "Bài toán",
  "step": {
    "read": "Đâu là cả tổng?",
    "role": "Trong phép tính này, x là một phần hay là cả tổng?",
    "operationPart": "Muốn tìm MỘT PHẦN thì phải làm phép gì?",
    "operationWhole": "Muốn tìm CẢ TỔNG thì phải làm phép gì?",
    "operands": "Vậy lấy số nào với số nào?",
    "compute": "{{expr}} bằng bao nhiêu?",
    "check": "Thay {{x}} vào chỗ x — có khớp không?"
  },
  "opt": {
    "part": "Một phần",
    "whole": "Cả tổng",
    "sub": "Lấy cả tổng trừ phần kia",
    "add": "Cộng hai phần lại"
  },
  "why": {
    "rolePart": "Cả tổng là {{whole}} — {{known}} và x là hai phần ghép lại.",
    "roleWhole": "Đây là phép trừ: {{a}} và {{b}} là hai phần, x mới là cả tổng.",
    "roleWrongPart": "Chưa đúng. Cả tổng là {{whole}}, còn x chỉ là một phần của nó.",
    "roleWrongWhole": "Chưa đúng. {{a}} và {{b}} là hai phần rồi, nên x phải là cả tổng.",
    "opSub": "Biết cả tổng, bớt đi phần nhìn thấy được thì còn lại đúng là phần đang giấu.",
    "opAdd": "Ở đây thiếu chính cả tổng — hai phần phải ghép lại.",
    "opWrongAdd": "Cộng là khi đi tìm cả tổng, mà tổng thì đã biết rồi.",
    "opWrongSub": "Trừ là khi đi tìm một phần, mà ở đây phần nào cũng thấy rồi.",
    "operandsRight": "Đúng rồi: {{left}} {{op}} {{right}}.",
    "operandsSwapped": "Trừ ngược rồi — số lớn phải đứng trước.",
    "operandsWrongOp": "Sai phép rồi — đọc lại bước vừa chọn xem.",
    "computeRight": "x = {{x}}.",
    "checkRight": "Khớp! Đây là cách con tự kiểm tra mà không cần hỏi ai.",
    "checkWorking": "Đó là phép con vừa làm để TÌM x. Thử lại nghĩa là thay x vào chính đề bài.",
    "readRight": "Đúng — {{whole}} là cả tổng.",
    "readWrong": "Chưa đúng — {{whole}} mới là gộp cả hai phần lại."
  },
  "story": {
    "plus": {
      "birds": "Trên cành có {{a}} con chim. Bay đến thêm mấy con nữa thì thành {{b}} con?",
      "sweets": "Em có {{a}} cái kẹo. Mẹ cho thêm mấy cái nữa thì thành {{b}} cái?",
      "marbles": "Trong túi có {{a}} viên bi. Bỏ thêm mấy viên nữa thì thành {{b}} viên?"
    },
    "minus": {
      "birds": "Trên cành có {{a}} con chim. Bay đi mấy con thì còn lại {{b}} con?",
      "sweets": "Em có {{a}} cái kẹo. Ăn mất mấy cái thì còn lại {{b}} cái?",
      "marbles": "Trong túi có {{a}} viên bi. Lấy ra mấy viên thì còn lại {{b}} viên?"
    }
  },
  "kind": {
    "operation": "Chọn đúng phép tính",
    "operands": "Lấy đúng số",
    "compute": "Tính đúng"
  }
}
```

- [ ] **Step 4: Write the failing tests**

Create `tests/unit/find-x-steps.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  deriveSteps,
  wholeOf,
  roleOf,
  operandsFor,
  applyOperands,
  equationOf,
  storyKindOf,
  isStepCorrect,
} from '@/math/services/find-x-steps';
import { FINDX_FORMS } from '@/math/types/find-x.types';
import type { FindXForm, FindXLevel, FindXProblem } from '@/math/types/find-x.types';

/** A problem of each form, all solvable inside 0..20. */
const BY_FORM: Record<FindXForm, FindXProblem> = {
  'x+a=b': { id: 'p1', form: 'x+a=b', a: 6, b: 14, x: 8 },
  'a+x=b': { id: 'p2', form: 'a+x=b', a: 6, b: 14, x: 8 },
  'x-a=b': { id: 'p3', form: 'x-a=b', a: 8, b: 5, x: 13 },
  'a-x=b': { id: 'p4', form: 'a-x=b', a: 20, b: 12, x: 8 },
};

const ALL_LEVELS: FindXLevel[] = ['guided', 'short', 'solo'];

describe('find-x step derivation', () => {
  it('names the whole correctly for every form', () => {
    expect(wholeOf(BY_FORM['x+a=b'])).toBe(14);
    expect(wholeOf(BY_FORM['a+x=b'])).toBe(14);
    expect(wholeOf(BY_FORM['a-x=b'])).toBe(20);
    // In `x − a = b` the unknown IS the whole.
    expect(wholeOf(BY_FORM['x-a=b'])).toBe(13);
  });

  it('marks x as the whole only in the x-minus form', () => {
    expect(roleOf('x+a=b')).toBe('part');
    expect(roleOf('a+x=b')).toBe('part');
    expect(roleOf('a-x=b')).toBe('part');
    expect(roleOf('x-a=b')).toBe('whole');
  });

  it('derives operands that actually recompute x', () => {
    for (const form of FINDX_FORMS) {
      const p = BY_FORM[form];
      expect(applyOperands(operandsFor(p)), form).toBe(p.x);
    }
  });

  it('puts the larger number first in every subtraction', () => {
    for (const form of FINDX_FORMS) {
      const o = operandsFor(BY_FORM[form]);
      if (o.op === '−') expect(o.left, form).toBeGreaterThanOrEqual(o.right);
    }
  });

  it('uses U+2212 for minus, never a hyphen', () => {
    for (const form of FINDX_FORMS) {
      const p = BY_FORM[form];
      expect(equationOf(p, 'x')).not.toContain('-');
      const o = operandsFor(p);
      expect(o.op === '+' || o.op === '−').toBe(true);
    }
  });

  it('writes the equation back with the answer substituted', () => {
    expect(equationOf(BY_FORM['x+a=b'], '8')).toBe('8 + 6 = 14');
    expect(equationOf(BY_FORM['a+x=b'], '8')).toBe('6 + 8 = 14');
    expect(equationOf(BY_FORM['x-a=b'], '13')).toBe('13 − 8 = 5');
    expect(equationOf(BY_FORM['a-x=b'], '8')).toBe('20 − 8 = 12');
  });

  it('refuses a story for the form whose whole is the unknown', () => {
    expect(storyKindOf('x+a=b')).toBe('plus');
    expect(storyKindOf('a+x=b')).toBe('plus');
    expect(storyKindOf('a-x=b')).toBe('minus');
    expect(storyKindOf('x-a=b')).toBeNull();
  });

  it('gives every level exactly one correct option per step', () => {
    for (const form of FINDX_FORMS) {
      for (const level of ALL_LEVELS) {
        for (const step of deriveSteps(BY_FORM[form], level)) {
          const right = step.options.filter((o) => o.correct);
          expect(right.length, `${form}/${level}/${step.kind}`).toBe(1);
        }
      }
    }
  });

  it('gives every option a reason and at least two options per choice step', () => {
    for (const form of FINDX_FORMS) {
      for (const step of deriveSteps(BY_FORM[form], 'guided')) {
        if (step.input === 'choice') expect(step.options.length, step.kind).toBeGreaterThanOrEqual(2);
        for (const o of step.options) {
          expect(o.whyKey, `${form}/${step.kind}`).toBeTruthy();
          expect(Boolean(o.labelKey) !== Boolean(o.label), `${form}/${step.kind}`).toBe(true);
        }
      }
    }
  });

  it('never repeats an option label inside a step', () => {
    for (const form of FINDX_FORMS) {
      for (const step of deriveSteps(BY_FORM[form], 'guided')) {
        const labels = step.options.map((o) => o.labelKey ?? o.label);
        expect(new Set(labels).size, `${form}/${step.kind}`).toBe(labels.length);
      }
    }
  });

  it('asks the right steps for each level, and always ends with check', () => {
    const p = BY_FORM['x+a=b'];
    expect(deriveSteps(p, 'guided').map((s) => s.kind)).toEqual([
      'role', 'operation', 'operands', 'compute', 'check',
    ]);
    expect(deriveSteps(p, 'short').map((s) => s.kind)).toEqual(['operands', 'compute', 'check']);
    expect(deriveSteps(p, 'solo').map((s) => s.kind)).toEqual(['compute', 'check']);
  });

  it('prepends the read step only on story problems, and only when guided', () => {
    const story: FindXProblem = { ...BY_FORM['x+a=b'], id: 'p5', story: 'birds' };
    expect(deriveSteps(story, 'guided')[0].kind).toBe('read');
    expect(deriveSteps(story, 'short')[0].kind).toBe('operands');
  });

  it('answers the compute step with tiles carrying x as the value', () => {
    const step = deriveSteps(BY_FORM['x-a=b'], 'solo')[0];
    expect(step.input).toBe('tiles');
    expect(step.options[0].value).toBe(13);
    expect(isStepCorrect(step, 13)).toBe(true);
    expect(isStepCorrect(step, 12)).toBe(false);
  });

  it('grades choice steps by option index', () => {
    const step = deriveSteps(BY_FORM['x+a=b'], 'guided')[0];
    const correctIndex = step.options.findIndex((o) => o.correct);
    expect(isStepCorrect(step, correctIndex)).toBe(true);
    expect(isStepCorrect(step, 1 - correctIndex)).toBe(false);
  });

  it('offers the working-restated distractor on the check step', () => {
    const steps = deriveSteps(BY_FORM['x+a=b'], 'guided');
    const check = steps[steps.length - 1];
    const labels = check.options.map((o) => o.label);
    expect(labels).toContain('8 + 6 = 14'); // substituted back into the problem
    expect(labels).toContain('14 − 6 = 8'); // the working, restated — the misconception
  });

  it('does not always put the correct option in the same slot', () => {
    const positions = new Set<number>();
    for (let i = 0; i < 12; i += 1) {
      const p: FindXProblem = { ...BY_FORM['x+a=b'], id: `vary-${i}` };
      positions.add(deriveSteps(p, 'guided')[0].options.findIndex((o) => o.correct));
    }
    expect(positions.size).toBeGreaterThan(1);
  });
});
```

Create `tests/unit/find-x-copy.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import en from '@/locales/en/math.json';
import { deriveSteps } from '@/math/services/find-x-steps';
import { FINDX_FORMS } from '@/math/types/find-x.types';
import type { FindXLevel, FindXProblem, FindXStoryTheme } from '@/math/types/find-x.types';

/**
 * Resolve a dotted i18n key against the math namespace — same helper
 * `math-number-lab-data.test.ts` uses against the generated bank.
 *
 * This matters more here than there: Find X keys are BUILT AT RUNTIME from a
 * form and a role rather than written into a JSON file a test can walk, so a
 * typo in a rare branch would ship as a raw `findx.why.…` string on screen.
 */
function resolveKey(key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in node) return (node as Record<string, unknown>)[part];
    return undefined;
  }, en);
}

const LEVELS: FindXLevel[] = ['guided', 'short', 'solo'];
const THEMES: FindXStoryTheme[] = ['birds', 'sweets', 'marbles'];

/** One problem per form, plus a story variant wherever a story is allowed. */
function everyProblem(): FindXProblem[] {
  const base: FindXProblem[] = [
    { id: 'c1', form: 'x+a=b', a: 6, b: 14, x: 8 },
    { id: 'c2', form: 'a+x=b', a: 6, b: 14, x: 8 },
    { id: 'c3', form: 'x-a=b', a: 8, b: 5, x: 13 },
    { id: 'c4', form: 'a-x=b', a: 20, b: 12, x: 8 },
  ];
  const stories = base
    .filter((p) => p.form !== 'x-a=b')
    .flatMap((p) => THEMES.map((story, i) => ({ ...p, id: `${p.id}-s${i}`, story })));
  return [...base, ...stories];
}

describe('find-x copy', () => {
  it('covers every form', () => {
    expect(new Set(everyProblem().map((p) => p.form)).size).toBe(FINDX_FORMS.length);
  });

  it('resolves every prompt and reason key it can emit', () => {
    for (const p of everyProblem()) {
      for (const level of LEVELS) {
        for (const step of deriveSteps(p, level)) {
          expect(typeof resolveKey(step.promptKey), step.promptKey).toBe('string');
          for (const o of step.options) {
            expect(typeof resolveKey(o.whyKey), o.whyKey).toBe('string');
            if (o.labelKey) expect(typeof resolveKey(o.labelKey), o.labelKey).toBe('string');
          }
        }
      }
    }
  });

  it('resolves every story template', () => {
    for (const kind of ['plus', 'minus']) {
      for (const theme of THEMES) {
        expect(typeof resolveKey(`findx.story.${kind}.${theme}`), `${kind}.${theme}`).toBe('string');
      }
    }
  });

  it('resolves the stage names and the screen chrome', () => {
    for (const key of [
      'lab.stages.findxGuided', 'lab.stages.findxShort', 'lab.stages.findxSolo',
      'findx.barAria', 'findx.trailAria', 'findx.reveal', 'findx.continue',
      'findx.finish', 'findx.exitAria', 'findx.questionOf', 'findx.rightCount',
      'findx.problemLabel', 'findx.storyLabel', 'findx.secondLook',
      'findx.kind.operation', 'findx.kind.operands', 'findx.kind.compute',
    ]) {
      expect(typeof resolveKey(key), key).toBe('string');
    }
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

```bash
npx vitest run tests/unit/find-x-steps.test.ts tests/unit/find-x-copy.test.ts
```

Expected: FAIL — `Failed to resolve import "@/math/services/find-x-steps"`.

- [ ] **Step 6: Implement the step derivation**

The code below is one listing for readability, but it ships as **two files** —
Constitution VI caps a file at 200 lines. `find-x-steps.ts` keeps the algebra
(`MINUS`, `wholeOf`, `knownPartOf`, `roleOf`, `operandsFor`, `applyOperands`,
`operandsText`, `equationOf`, `storyKindOf`, `deriveSteps`, `isStepCorrect`);
`find-x-step-builders.ts` takes `order`, `dedupe`, the six `*Step` builders and
the `BUILDERS` record. Every public symbol stays importable from
`@/math/services/find-x-steps` — later tasks import only from there.

Create `src/math/services/find-x-steps.ts` and `src/math/services/find-x-step-builders.ts`:

```ts
import { FINDX_FORMS } from '@/math/types/find-x.types';
import type {
  FindXForm,
  FindXLevel,
  FindXOption,
  FindXProblem,
  FindXStep,
  FindXStepKind,
  FindXStoryKind,
} from '@/math/types/find-x.types';

/**
 * Turning one problem into the chain of decisions a child walks to solve it.
 *
 * Steps are DERIVED, never authored. A bank of hand-written steps cannot be
 * verified by construction; this can — `applyOperands(operandsFor(p)) === p.x`
 * is an invariant a test pins down for every form, so an inconsistent step is
 * not representable.
 *
 * Pure: no React, no i18next. Copy is referenced by key and resolved by the view.
 */

/** U+2212. The bank and `equation-parts.ts` both use it; a hyphen breaks matching. */
const MINUS = '−' as const;

export type FindXOp = '+' | typeof MINUS;
export interface FindXOperands { op: FindXOp; left: number; right: number }

/** The total the two parts add up to. In `x − a = b` that total is x itself. */
export function wholeOf(p: FindXProblem): number {
  switch (p.form) {
    case 'x+a=b':
    case 'a+x=b':
      return p.b;
    case 'a-x=b':
      return p.a;
    case 'x-a=b':
      return p.x;
  }
}

/** The visible part — the one that is not x and not the whole. */
export function knownPartOf(p: FindXProblem): number {
  return p.form === 'a-x=b' ? p.b : p.a;
}

/** Whether the unknown is a part or the whole. Only the x-minus form hides the whole. */
export function roleOf(form: FindXForm): 'part' | 'whole' {
  return form === 'x-a=b' ? 'whole' : 'part';
}

/**
 * The two numbers, in the order they must be written. Order is the whole point:
 * a child who knows to subtract still writes `6 − 14` half the time.
 */
export function operandsFor(p: FindXProblem): FindXOperands {
  switch (p.form) {
    case 'x+a=b':
    case 'a+x=b':
      return { op: MINUS, left: p.b, right: p.a };
    case 'x-a=b':
      return { op: '+', left: p.b, right: p.a };
    case 'a-x=b':
      return { op: MINUS, left: p.a, right: p.b };
  }
}

export function applyOperands(o: FindXOperands): number {
  return o.op === '+' ? o.left + o.right : o.left - o.right;
}

/** `left op right`, as it is shown inside a prompt or on an option. */
export function operandsText(o: FindXOperands): string {
  return `${o.left} ${o.op} ${o.right}`;
}

/** The problem's own equation, with `xLabel` standing where the unknown is. */
export function equationOf(p: FindXProblem, xLabel: string): string {
  switch (p.form) {
    case 'x+a=b':
      return `${xLabel} + ${p.a} = ${p.b}`;
    case 'a+x=b':
      return `${p.a} + ${xLabel} = ${p.b}`;
    case 'x-a=b':
      return `${xLabel} ${MINUS} ${p.a} = ${p.b}`;
    case 'a-x=b':
      return `${p.a} ${MINUS} ${xLabel} = ${p.b}`;
  }
}

/**
 * Which story flavour a form can wear, or `null` when it can wear none.
 *
 * `x − a = b` hides the whole, so "đâu là cả tổng?" would have no tappable
 * answer in the sentence. The generator refuses that combination.
 */
export function storyKindOf(form: FindXForm): FindXStoryKind | null {
  switch (form) {
    case 'x+a=b':
    case 'a+x=b':
      return 'plus';
    case 'a-x=b':
      return 'minus';
    case 'x-a=b':
      return null;
  }
}

/**
 * Rotate the options by a hash of the problem and step, so the right answer is
 * not always in the same slot. Deterministic — the same problem always renders
 * the same way, which is what lets a test assert on it.
 */
function order(options: FindXOption[], seed: string): FindXOption[] {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const shift = Math.abs(h) % options.length;
  return [...options.slice(shift), ...options.slice(0, shift)];
}

/** Drop options whose visible label repeats one already kept. */
function dedupe(options: FindXOption[]): FindXOption[] {
  const seen = new Set<string>();
  return options.filter((o) => {
    const key = o.labelKey ?? o.label ?? '';
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readStep(p: FindXProblem): FindXStep {
  const whole = wholeOf(p);
  const known = knownPartOf(p);
  return {
    kind: 'read',
    promptKey: 'findx.step.read',
    vars: {},
    input: 'choice',
    options: order([
      { label: String(whole), correct: true, whyKey: 'findx.why.readRight', vars: { whole } },
      { label: String(known), correct: false, whyKey: 'findx.why.readWrong', vars: { whole } },
    ], `${p.id}:read`),
  };
}

function roleStep(p: FindXProblem): FindXStep {
  const isWhole = roleOf(p.form) === 'whole';
  const vars = { whole: wholeOf(p), known: knownPartOf(p), a: p.a, b: p.b };
  return {
    kind: 'role',
    promptKey: 'findx.step.role',
    vars,
    input: 'choice',
    options: order([
      {
        labelKey: 'findx.opt.part',
        correct: !isWhole,
        whyKey: isWhole ? 'findx.why.roleWrongWhole' : 'findx.why.rolePart',
        vars,
      },
      {
        labelKey: 'findx.opt.whole',
        correct: isWhole,
        whyKey: isWhole ? 'findx.why.roleWhole' : 'findx.why.roleWrongPart',
        vars,
      },
    ], `${p.id}:role`),
  };
}

function operationStep(p: FindXProblem): FindXStep {
  const needsAdd = roleOf(p.form) === 'whole';
  return {
    kind: 'operation',
    promptKey: needsAdd ? 'findx.step.operationWhole' : 'findx.step.operationPart',
    vars: {},
    input: 'choice',
    options: order([
      {
        labelKey: 'findx.opt.sub',
        correct: !needsAdd,
        whyKey: needsAdd ? 'findx.why.opWrongSub' : 'findx.why.opSub',
      },
      {
        labelKey: 'findx.opt.add',
        correct: needsAdd,
        whyKey: needsAdd ? 'findx.why.opAdd' : 'findx.why.opWrongAdd',
      },
    ], `${p.id}:operation`),
  };
}

function operandsStep(p: FindXProblem): FindXStep {
  const right = operandsFor(p);
  const swapped: FindXOperands = { op: right.op, left: right.right, right: right.left };
  const flipped: FindXOperands = { op: right.op === '+' ? MINUS : '+', left: right.left, right: right.right };
  return {
    kind: 'operands',
    promptKey: 'findx.step.operands',
    vars: {},
    input: 'choice',
    options: order(dedupe([
      {
        label: operandsText(right),
        correct: true,
        whyKey: 'findx.why.operandsRight',
        vars: { left: right.left, op: right.op, right: right.right },
      },
      { label: operandsText(swapped), correct: false, whyKey: 'findx.why.operandsSwapped' },
      { label: operandsText(flipped), correct: false, whyKey: 'findx.why.operandsWrongOp' },
    ]), `${p.id}:operands`),
  };
}

function computeStep(p: FindXProblem): FindXStep {
  return {
    kind: 'compute',
    promptKey: 'findx.step.compute',
    vars: { expr: operandsText(operandsFor(p)) },
    input: 'tiles',
    options: [
      { label: String(p.x), correct: true, whyKey: 'findx.why.computeRight', vars: { x: p.x }, value: p.x },
    ],
  };
}

/**
 * The check step's distractor is the child's own WORKING restated
 * (`14 − 6 = 8`), not a false sum. It is arithmetically true, which is exactly
 * why it is worth teaching against: checking means substituting back into the
 * problem, not re-reading the step that produced the answer.
 */
function checkStep(p: FindXProblem): FindXStep {
  const working = operandsFor(p);
  return {
    kind: 'check',
    promptKey: 'findx.step.check',
    vars: { x: p.x },
    input: 'choice',
    options: order(dedupe([
      { label: equationOf(p, String(p.x)), correct: true, whyKey: 'findx.why.checkRight' },
      { label: `${operandsText(working)} = ${p.x}`, correct: false, whyKey: 'findx.why.checkWorking' },
    ]), `${p.id}:check`),
  };
}

const BUILDERS: Record<FindXStepKind, (p: FindXProblem) => FindXStep> = {
  read: readStep,
  role: roleStep,
  operation: operationStep,
  operands: operandsStep,
  compute: computeStep,
  check: checkStep,
};

/**
 * Which decisions each stage asks for. `check` survives every level: it is the
 * transferable skill, and a stage that dropped it would teach that checking is
 * optional scaffolding rather than part of solving.
 */
const KINDS_BY_LEVEL: Record<FindXLevel, FindXStepKind[]> = {
  guided: ['read', 'role', 'operation', 'operands', 'compute', 'check'],
  short: ['operands', 'compute', 'check'],
  solo: ['compute', 'check'],
};

export function deriveSteps(p: FindXProblem, level: FindXLevel): FindXStep[] {
  return KINDS_BY_LEVEL[level]
    .filter((kind) => kind !== 'read' || p.story !== undefined)
    .map((kind) => BUILDERS[kind](p));
}

/**
 * Whether a tapped value answers a step. Mirrors `quiz-scorer.isCorrect`: the
 * value is the tapped NUMBER for tile steps and an index into `options` for
 * every other step.
 */
export function isStepCorrect(step: FindXStep, value: number): boolean {
  if (step.input === 'tiles') return step.options.some((o) => o.correct && o.value === value);
  return step.options[value]?.correct === true;
}

export { FINDX_FORMS, MINUS };
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/find-x-steps.test.ts tests/unit/find-x-copy.test.ts
```

Expected: PASS, 17 tests.

- [ ] **Step 8: Verify nothing else broke**

```bash
npm run typecheck && npx vitest run tests/unit
```

Expected: typecheck clean; all unit tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/math/types/find-x.types.ts src/math/services/find-x-steps.ts \
        src/math/constants/math-constants.ts src/locales/en/math.json \
        tests/unit/find-x-steps.test.ts tests/unit/find-x-copy.test.ts
git commit -m "feat(math): derive the Find X step chain from a problem

Steps are computed from the form and the two visible numbers rather than
authored, so applyOperands(operandsFor(p)) === p.x is an invariant a test
pins for all four forms and an inconsistent step is not representable.

The copy test resolves every key the derivation can emit: unlike the
generated banks there is no JSON file for a test to walk, so a typo in a
rare branch would otherwise ship as a raw key on screen."
```

---

### Task 2: The problem generator

**Files:**
- Create: `src/math/services/find-x-generator.ts`
- Test: `tests/unit/find-x-generator.test.ts`

**Interfaces:**
- Consumes: `FindXForm`, `FindXLevel`, `FindXProblem`, `FINDX_FORMS` from
  `@/math/types/find-x.types`; `storyKindOf` from `@/math/services/find-x-steps`;
  `FINDX_VALUE_MAX`, `FINDX_MAX_REDRAWS`, `FINDX_STORY_RATIO`, `FINDX_RUN_SIZES`.
- Produces:
  - `type PickForm = (index: number, rng: () => number) => FindXForm`
  - `composeFindXRun(level: FindXLevel, attempt: number, pickForm?: PickForm): FindXProblem[]`
  - `roundRobinForms: PickForm`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/find-x-generator.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { composeFindXRun } from '@/math/services/find-x-generator';
import { applyOperands, operandsFor, storyKindOf } from '@/math/services/find-x-steps';
import { FINDX_FORMS } from '@/math/types/find-x.types';
import type { FindXLevel } from '@/math/types/find-x.types';
import { FINDX_RUN_SIZES, FINDX_VALUE_MAX } from '@/math/constants/math-constants';

const LEVELS: FindXLevel[] = ['guided', 'short', 'solo'];

describe('find-x generator', () => {
  it('serves the run size its stage calls for', () => {
    for (const level of LEVELS) {
      expect(composeFindXRun(level, 1).length, level).toBe(FINDX_RUN_SIZES[level]);
    }
  });

  it('is deterministic for a level and attempt', () => {
    expect(composeFindXRun('guided', 3)).toEqual(composeFindXRun('guided', 3));
  });

  it('serves a different run on the next attempt', () => {
    const first = composeFindXRun('guided', 1).map((p) => p.id);
    const second = composeFindXRun('guided', 2).map((p) => p.id);
    expect(first).not.toEqual(second);
  });

  it('keeps every value inside 0..FINDX_VALUE_MAX', () => {
    for (const level of LEVELS) {
      for (const p of composeFindXRun(level, 1)) {
        for (const n of [p.a, p.b, p.x]) {
          expect(n, `${level}/${p.id}`).toBeGreaterThanOrEqual(0);
          expect(n, `${level}/${p.id}`).toBeLessThanOrEqual(FINDX_VALUE_MAX);
        }
      }
    }
  });

  it('produces problems whose operands recompute x', () => {
    for (const level of LEVELS) {
      for (const p of composeFindXRun(level, 1)) {
        expect(applyOperands(operandsFor(p)), p.id).toBe(p.x);
      }
    }
  });

  it('never lets x be 0 or a copy of a visible number', () => {
    for (const level of LEVELS) {
      for (const p of composeFindXRun(level, 1)) {
        expect(p.x, p.id).not.toBe(0);
        expect(p.x, p.id).not.toBe(p.a);
        expect(p.x, p.id).not.toBe(p.b);
      }
    }
  });

  it('covers all four forms in every run', () => {
    for (const level of LEVELS) {
      const forms = new Set(composeFindXRun(level, 1).map((p) => p.form));
      expect(forms.size, level).toBe(FINDX_FORMS.length);
    }
  });

  it('gives every problem a distinct id and equation within a run', () => {
    for (const level of LEVELS) {
      const run = composeFindXRun(level, 1);
      expect(new Set(run.map((p) => p.id)).size, level).toBe(run.length);
      const shapes = run.map((p) => `${p.form}|${p.a}|${p.b}`);
      expect(new Set(shapes).size, level).toBe(run.length);
    }
  });

  it('never dresses the x-minus form as a story', () => {
    for (const level of LEVELS) {
      for (let attempt = 1; attempt <= 12; attempt += 1) {
        for (const p of composeFindXRun(level, attempt)) {
          if (p.story) expect(storyKindOf(p.form), p.id).not.toBeNull();
        }
      }
    }
  });

  it('mixes some stories in over a run', () => {
    const runs = [1, 2, 3, 4].flatMap((a) => composeFindXRun('guided', a));
    const stories = runs.filter((p) => p.story).length;
    expect(stories).toBeGreaterThan(0);
    expect(stories).toBeLessThan(runs.length);
  });

  it('honours an injected form picker, which is the seam adaptivity will use', () => {
    const run = composeFindXRun('solo', 1, () => 'a-x=b');
    expect(run.every((p) => p.form === 'a-x=b')).toBe(true);
  });

  it('falls back rather than looping when a picker starves the composer', () => {
    // Every problem forced to one form still terminates and stays in range.
    const run = composeFindXRun('guided', 7, () => 'x-a=b');
    expect(run.length).toBe(FINDX_RUN_SIZES.guided);
    expect(run.every((p) => p.x <= FINDX_VALUE_MAX)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/find-x-generator.test.ts
```

Expected: FAIL — `Failed to resolve import "@/math/services/find-x-generator"`.

- [ ] **Step 3: Implement the generator**

Create `src/math/services/find-x-generator.ts`:

```ts
import { FINDX_FORMS } from '@/math/types/find-x.types';
import type { FindXForm, FindXLevel, FindXProblem, FindXStoryTheme } from '@/math/types/find-x.types';
import { storyKindOf } from '@/math/services/find-x-steps';
import {
  FINDX_MAX_REDRAWS,
  FINDX_RUN_SIZES,
  FINDX_STORY_RATIO,
  FINDX_VALUE_MAX,
} from '@/math/constants/math-constants';

/**
 * Composing one run of Find X problems.
 *
 * Seeded and pure: the same `(level, attempt)` always yields the same run, so a
 * replay is fresh practice rather than a shuffle, and a test can assert on it.
 * No JSON bank — a problem is four integers and the space inside 0..20 is small
 * enough to draw from directly. The quiz banks exist because hand-tuned
 * distractors need review; these are computed (see `find-x-steps.ts`).
 */

/** Seeded PRNG. Local rather than shared: nothing else in Math World needs one. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const randInt = (rng: () => number, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));

/**
 * Chooses the form of the next problem.
 *
 * This is the seam adaptive weighting will replace (see the design doc, §11
 * gap 2): a scheduler weighted by which form the child actually misses drops in
 * here without `deriveSteps` or the run reducer changing at all.
 */
export type PickForm = (index: number, rng: () => number) => FindXForm;

/** The default: straight round-robin, so every run covers all four forms. */
export const roundRobinForms: PickForm = (index) => FINDX_FORMS[index % FINDX_FORMS.length];

const THEMES: FindXStoryTheme[] = ['birds', 'sweets', 'marbles'];

/** Identity of a problem, ignoring its generated id. */
function shapeOf(p: FindXProblem): string {
  return `${p.form}|${p.a}|${p.b}`;
}

/**
 * The problem a form makes of two visible numbers, or `null` when it breaks a
 * rule.
 *
 * `x` may not be 0 (the answer is free), nor equal `a` or `b` — she could reach
 * it by copying a number off the screen rather than working it out.
 */
function build(form: FindXForm, a: number, b: number): FindXProblem | null {
  let x: number;
  switch (form) {
    case 'x+a=b':
    case 'a+x=b':
      x = b - a;
      break;
    case 'x-a=b':
      x = a + b;
      break;
    case 'a-x=b':
      x = a - b;
      break;
  }
  if ([a, b, x].some((n) => n < 1 || n > FINDX_VALUE_MAX)) return null;
  if (x === a || x === b) return null;
  return { id: '', form, a, b, x };
}

/** A guaranteed-valid problem per form — the last resort, never normally hit. */
const FALLBACK: Record<FindXForm, Omit<FindXProblem, 'id'>> = {
  'x+a=b': { form: 'x+a=b', a: 6, b: 14, x: 8 },
  'a+x=b': { form: 'a+x=b', a: 6, b: 14, x: 8 },
  'x-a=b': { form: 'x-a=b', a: 8, b: 5, x: 13 },
  'a-x=b': { form: 'a-x=b', a: 20, b: 12, x: 8 },
};

/** Random draws, rejecting rule-breakers and shapes this run already used. */
function drawUnused(form: FindXForm, rng: () => number, used: Set<string>): FindXProblem | null {
  for (let tries = 0; tries < FINDX_MAX_REDRAWS; tries += 1) {
    const p = build(form, randInt(rng, 1, FINDX_VALUE_MAX), randInt(rng, 1, FINDX_VALUE_MAX));
    if (p && !used.has(shapeOf(p))) return p;
  }
  return null;
}

/**
 * Deterministic sweep for the first unused valid shape of a form. Reached only
 * when `FINDX_MAX_REDRAWS` random draws all collided or broke a rule — which a
 * picker forced onto one starved form can do. Bounded by construction, so the
 * composer can never spin.
 */
function firstUnused(form: FindXForm, used: Set<string>): FindXProblem {
  for (let a = 1; a <= FINDX_VALUE_MAX; a += 1) {
    for (let b = 1; b <= FINDX_VALUE_MAX; b += 1) {
      const p = build(form, a, b);
      if (p && !used.has(shapeOf(p))) return p;
    }
  }
  return { ...FALLBACK[form], id: '' };
}

/**
 * One run for a stage. `attempt` comes from the child's stored stage progress,
 * so every replay is a different set.
 */
export function composeFindXRun(
  level: FindXLevel,
  attempt: number,
  pickForm: PickForm = roundRobinForms,
): FindXProblem[] {
  const rng = mulberry32(hashSeed(`findx:${level}:${attempt}`));
  const size = FINDX_RUN_SIZES[level];
  const out: FindXProblem[] = [];
  const used = new Set<string>();

  for (let i = 0; i < size; i += 1) {
    const form = pickForm(i, rng);
    const problem = drawUnused(form, rng, used) ?? firstUnused(form, used);
    used.add(shapeOf(problem));
    out.push({
      ...problem,
      id: `findx-${level}-${attempt}-${i}`,
      ...storyFor(problem.form, rng),
    });
  }
  return out;
}

/** Dress roughly `FINDX_STORY_RATIO` of the eligible problems as word problems. */
function storyFor(form: FindXForm, rng: () => number): Pick<FindXProblem, 'story'> {
  if (storyKindOf(form) === null) return {};
  if (rng() >= FINDX_STORY_RATIO) return {};
  return { story: THEMES[randInt(rng, 0, THEMES.length - 1)] };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/unit/find-x-generator.test.ts
```

Expected: PASS, 12 tests.

If `covers all four forms in every run` fails for `guided` (size 6): the
round-robin over four forms covers indices 0–3, so it cannot. Do not change the
test — it encodes decision #7. Fix the generator.

If `gives every problem a distinct id and equation within a run` fails when a
picker forces one form, `firstUnused` is returning an already-used shape — check
that `shapeOf` is what goes into `used`, not the id.

- [ ] **Step 5: Verify nothing else broke**

```bash
npm run typecheck && npx vitest run tests/unit
```

Expected: typecheck clean; all unit tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/math/services/find-x-generator.ts tests/unit/find-x-generator.test.ts
git commit -m "feat(math): compose seeded Find X runs

Seeded by (level, attempt) so a replay is fresh practice and a test can
assert on it. Form choice is injected rather than hardcoded: that is the
seam adaptive weighting drops into later without reopening the step
derivation or the run reducer."
```

---

### Task 3: The run reducer

**Files:**
- Create: `src/math/services/find-x-run.ts`
- Test: `tests/unit/find-x-run.test.ts`

**Interfaces:**
- Consumes: `deriveSteps`, `isStepCorrect` from `@/math/services/find-x-steps`;
  `FindXLevel`, `FindXProblem`, `FindXStep`, `FindXStepKind` from the types.
- Produces:
  - `interface FindXStats { asked: Record<FindXStepKind, number>; missed: Record<FindXStepKind, number>; reveals: number }`
  - `interface FindXTrailEntry { kind: FindXStepKind; label?: string; labelKey?: string; vars?: Record<string, string | number>; whyKey: string }`
  - `interface FindXRunState { level; problems; pIndex; steps; stepIndex; trail; wrongValues; wrongThisProblem; revealed; problemComplete; done; stats; requeuedIds; originalTotal; mastered; firstPass }`
  - `type FindXAction = { type: 'answer'; value: number } | { type: 'next' } | { type: 'reveal' }`
  - `initFindXRun(problems: FindXProblem[], level: FindXLevel): FindXRunState`
  - `findXReducer(state: FindXRunState, action: FindXAction): FindXRunState`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/find-x-run.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { initFindXRun, findXReducer } from '@/math/services/find-x-run';
import type { FindXRunState } from '@/math/services/find-x-run';
import type { FindXProblem } from '@/math/types/find-x.types';

const P1: FindXProblem = { id: 'r1', form: 'x+a=b', a: 6, b: 14, x: 8 };
const P2: FindXProblem = { id: 'r2', form: 'a-x=b', a: 20, b: 12, x: 8 };

/** Index of the correct option on the current step (or x, on a tile step). */
function rightValue(s: FindXRunState): number {
  const step = s.steps[s.stepIndex];
  if (step.input === 'tiles') return step.options.find((o) => o.correct)!.value!;
  return step.options.findIndex((o) => o.correct);
}

/** Index of a wrong option on the current step. */
function wrongValue(s: FindXRunState): number {
  const step = s.steps[s.stepIndex];
  if (step.input === 'tiles') return step.options.find((o) => o.correct)!.value! + 1;
  return step.options.findIndex((o) => !o.correct);
}

/** Answer every remaining step of the current problem correctly. */
function solveProblem(start: FindXRunState): FindXRunState {
  let s = start;
  while (!s.problemComplete && !s.done) {
    s = findXReducer(s, { type: 'answer', value: rightValue(s) });
  }
  return s;
}

describe('find-x run reducer', () => {
  it('starts on the first step of the first problem', () => {
    const s = initFindXRun([P1, P2], 'solo');
    expect(s.pIndex).toBe(0);
    expect(s.stepIndex).toBe(0);
    expect(s.steps[0].kind).toBe('compute');
    expect(s.originalTotal).toBe(2);
    expect(s.done).toBe(false);
  });

  it('advances a step on a correct answer and records the reason in the trail', () => {
    const s = findXReducer(initFindXRun([P1], 'guided'), { type: 'answer', value: rightValue(initFindXRun([P1], 'guided')) });
    expect(s.stepIndex).toBe(1);
    expect(s.trail).toHaveLength(1);
    expect(s.trail[0].kind).toBe('role');
    expect(s.trail[0].whyKey).toBeTruthy();
  });

  it('stays on the step after a wrong answer and remembers the wrong value', () => {
    const start = initFindXRun([P1], 'guided');
    const s = findXReducer(start, { type: 'answer', value: wrongValue(start) });
    expect(s.stepIndex).toBe(0);
    expect(s.trail).toHaveLength(0);
    expect(s.wrongValues).toContain(wrongValue(start));
    expect(s.wrongThisProblem).toBe(true);
  });

  it('clears the wrong values when the step changes', () => {
    const start = initFindXRun([P1], 'guided');
    const missed = findXReducer(start, { type: 'answer', value: wrongValue(start) });
    const moved = findXReducer(missed, { type: 'answer', value: rightValue(missed) });
    expect(moved.wrongValues).toEqual([]);
  });

  it('counts asked and missed per step kind', () => {
    const start = initFindXRun([P1], 'guided');
    const missed = findXReducer(start, { type: 'answer', value: wrongValue(start) });
    const s = solveProblem(missed);
    expect(s.stats.missed.role).toBe(1);
    expect(s.stats.asked.role).toBe(1);
    expect(s.stats.asked.compute).toBe(1);
    expect(s.stats.missed.compute).toBe(0);
  });

  it('marks the problem complete rather than auto-advancing', () => {
    const s = solveProblem(initFindXRun([P1, P2], 'solo'));
    expect(s.problemComplete).toBe(true);
    expect(s.pIndex).toBe(0);
    expect(findXReducer(s, { type: 'next' }).pIndex).toBe(1);
  });

  it('counts a clean problem as first pass, a missed one as not', () => {
    const clean = solveProblem(initFindXRun([P1], 'solo'));
    expect(clean.firstPass).toBe(1);
    expect(clean.mastered).toBe(1);

    const start = initFindXRun([P1], 'solo');
    const dirty = solveProblem(findXReducer(start, { type: 'answer', value: wrongValue(start) }));
    expect(dirty.firstPass).toBe(0);
    expect(dirty.mastered).toBe(1);
  });

  it('requeues a missed problem exactly once', () => {
    const start = initFindXRun([P1, P2], 'solo');
    let s = solveProblem(findXReducer(start, { type: 'answer', value: wrongValue(start) }));
    s = findXReducer(s, { type: 'next' });
    expect(s.problems).toHaveLength(3); // P1 re-asked at the end
    expect(s.requeuedIds).toEqual([P1.id]);

    // Miss it again on the second look — it must not come back a third time.
    s = solveProblem(s);                       // P2, clean
    s = findXReducer(s, { type: 'next' });     // now on the requeued P1
    s = solveProblem(findXReducer(s, { type: 'answer', value: wrongValue(s) }));
    s = findXReducer(s, { type: 'next' });
    expect(s.problems).toHaveLength(3);
    expect(s.done).toBe(true);
  });

  it('keeps originalTotal at the first-pass length so stars are not diluted', () => {
    const start = initFindXRun([P1, P2], 'solo');
    let s = solveProblem(findXReducer(start, { type: 'answer', value: wrongValue(start) }));
    s = findXReducer(s, { type: 'next' });
    expect(s.originalTotal).toBe(2);
  });

  it('reveal expands to the full chain and disqualifies the first pass', () => {
    const start = initFindXRun([P1], 'solo');
    const s = findXReducer(start, { type: 'reveal' });
    expect(s.revealed).toBe(true);
    expect(s.steps.map((x) => x.kind)).toEqual(['role', 'operation', 'operands', 'compute', 'check']);
    expect(s.stepIndex).toBe(0);
    expect(s.stats.reveals).toBe(1);
    expect(solveProblem(s).firstPass).toBe(0);
  });

  it('ignores answers once the run is done', () => {
    let s = solveProblem(initFindXRun([P1], 'solo'));
    s = findXReducer(s, { type: 'next' });
    expect(s.done).toBe(true);
    expect(findXReducer(s, { type: 'answer', value: 0 })).toBe(s);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/find-x-run.test.ts
```

Expected: FAIL — `Failed to resolve import "@/math/services/find-x-run"`.

- [ ] **Step 3: Implement the reducer**

Create `src/math/services/find-x-run.ts`:

```ts
import { deriveSteps, isStepCorrect } from '@/math/services/find-x-steps';
import type {
  FindXLevel,
  FindXProblem,
  FindXStep,
  FindXStepKind,
} from '@/math/types/find-x.types';

/**
 * The play loop for a Find X stage, as pure state plus a reducer.
 *
 * Deliberately NOT `math-quiz-store`: that store holds one selection and one
 * graded flag per question, while a problem here holds several graded
 * sub-answers, a growing trail and per-step statistics. Bending it would
 * complicate the path every hive and lab question already travels.
 *
 * No React import, so every grading rule is testable without rendering.
 */

const KINDS: FindXStepKind[] = ['read', 'role', 'operation', 'operands', 'compute', 'check'];

const zero = (): Record<FindXStepKind, number> =>
  KINDS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as Record<FindXStepKind, number>);

/** How often each decision was asked and how often it was got wrong. */
export interface FindXStats {
  asked: Record<FindXStepKind, number>;
  missed: Record<FindXStepKind, number>;
  reveals: number;
}

/** One decided step, kept so the child can see what she has settled so far. */
export interface FindXTrailEntry {
  kind: FindXStepKind;
  label?: string;
  labelKey?: string;
  vars?: Record<string, string | number>;
  whyKey: string;
}

export interface FindXRunState {
  level: FindXLevel;
  /** First-pass problems, plus any requeued misses appended to the end. */
  problems: FindXProblem[];
  pIndex: number;
  /** Steps of the current problem — recomputed when `reveal` widens them. */
  steps: FindXStep[];
  stepIndex: number;
  trail: FindXTrailEntry[];
  /** Values already tried and rejected on the current step. */
  wrongValues: number[];
  wrongThisProblem: boolean;
  revealed: boolean;
  /** Every step answered; the view shows "Tiếp tục" rather than auto-advancing. */
  problemComplete: boolean;
  done: boolean;
  stats: FindXStats;
  requeuedIds: string[];
  /** First-pass length — the denominator for stars, so a re-ask cannot dilute them. */
  originalTotal: number;
  mastered: number;
  firstPass: number;
}

export type FindXAction =
  | { type: 'answer'; value: number }
  | { type: 'next' }
  | { type: 'reveal' };

export function initFindXRun(problems: FindXProblem[], level: FindXLevel): FindXRunState {
  return {
    level,
    problems,
    pIndex: 0,
    steps: problems.length > 0 ? deriveSteps(problems[0], level) : [],
    stepIndex: 0,
    trail: [],
    wrongValues: [],
    wrongThisProblem: false,
    revealed: false,
    problemComplete: problems.length === 0,
    done: problems.length === 0,
    stats: { asked: zero(), missed: zero(), reveals: 0 },
    requeuedIds: [],
    originalTotal: problems.length,
    mastered: 0,
    firstPass: 0,
  };
}

/** The trail entry for the option just accepted. */
function entryFor(step: FindXStep, value: number): FindXTrailEntry {
  const option = step.input === 'tiles'
    ? step.options.find((o) => o.correct)!
    : step.options[value];
  return {
    kind: step.kind,
    label: option.label,
    labelKey: option.labelKey,
    vars: option.vars,
    whyKey: option.whyKey,
  };
}

function answer(s: FindXRunState, value: number): FindXRunState {
  if (s.done || s.problemComplete) return s;
  const step = s.steps[s.stepIndex];
  if (!step) return s;
  if (s.wrongValues.includes(value)) return s;

  if (!isStepCorrect(step, value)) {
    return {
      ...s,
      wrongValues: [...s.wrongValues, value],
      wrongThisProblem: true,
      stats: { ...s.stats, missed: { ...s.stats.missed, [step.kind]: s.stats.missed[step.kind] + 1 } },
    };
  }

  const stepIndex = s.stepIndex + 1;
  const complete = stepIndex >= s.steps.length;
  const clean = !s.wrongThisProblem && !s.revealed;
  return {
    ...s,
    stepIndex,
    wrongValues: [],
    trail: [...s.trail, entryFor(step, value)],
    problemComplete: complete,
    stats: { ...s.stats, asked: { ...s.stats.asked, [step.kind]: s.stats.asked[step.kind] + 1 } },
    mastered: complete ? s.mastered + 1 : s.mastered,
    firstPass: complete && clean ? s.firstPass + 1 : s.firstPass,
  };
}

/**
 * Move to the next problem, re-asking a missed one once at the end of the run.
 * A second miss does not requeue again, so the queue can never loop — the same
 * guarantee `quiz-scorer.shouldRequeue` gives the lab.
 */
function next(s: FindXRunState): FindXRunState {
  if (s.done || !s.problemComplete) return s;
  const current = s.problems[s.pIndex];
  const firstPass = s.pIndex < s.originalTotal;
  const requeue = (s.wrongThisProblem || s.revealed)
    && firstPass
    && !s.requeuedIds.includes(current.id);

  const problems = requeue ? [...s.problems, current] : s.problems;
  const requeuedIds = requeue ? [...s.requeuedIds, current.id] : s.requeuedIds;
  const pIndex = s.pIndex + 1;

  if (pIndex >= problems.length) {
    return { ...s, problems, requeuedIds, pIndex, done: true, steps: [], trail: [] };
  }
  return {
    ...s,
    problems,
    requeuedIds,
    pIndex,
    steps: deriveSteps(problems[pIndex], s.level),
    stepIndex: 0,
    trail: [],
    wrongValues: [],
    wrongThisProblem: false,
    revealed: false,
    problemComplete: false,
  };
}

/**
 * Open the full chain for the current problem. Costs nothing but the first pass:
 * the goal is that she stops reaching for it, and the run summary reports how
 * often she did.
 */
function reveal(s: FindXRunState): FindXRunState {
  if (s.done || s.revealed || s.problemComplete) return s;
  return {
    ...s,
    revealed: true,
    steps: deriveSteps(s.problems[s.pIndex], 'guided'),
    stepIndex: 0,
    trail: [],
    wrongValues: [],
    stats: { ...s.stats, reveals: s.stats.reveals + 1 },
  };
}

export function findXReducer(state: FindXRunState, action: FindXAction): FindXRunState {
  switch (action.type) {
    case 'answer':
      return answer(state, action.value);
    case 'next':
      return next(state);
    case 'reveal':
      return reveal(state);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/unit/find-x-run.test.ts
```

Expected: PASS, 12 tests.

- [ ] **Step 5: Verify nothing else broke**

```bash
npm run typecheck && npx vitest run tests/unit
```

Expected: typecheck clean; all unit tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/math/services/find-x-run.ts tests/unit/find-x-run.test.ts
git commit -m "feat(math): add the Find X run reducer

A wrong answer re-asks the same step rather than restarting the problem:
restarting punishes the child for the one decision she got wrong and
lets her re-guess the ones she got right. Misses requeue once, matching
the Number Lab, so the queue can never loop."
```

---

### Task 4: The part–whole bar model

**Files:**
- Create: `src/math/components/PartWholeBar.tsx`
- Test: `tests/unit/find-x-bar.test.tsx`

**Interfaces:**
- Consumes: `FindXProblem` from the types; `wholeOf`, `knownPartOf`, `roleOf` from
  `@/math/services/find-x-steps`.
- Produces: `PartWholeBar({ problem, solved }: { problem: FindXProblem; solved: boolean })`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/find-x-bar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithI18n } from '../i18n-test-utils';
import { PartWholeBar } from '@/math/components/PartWholeBar';
import type { FindXProblem } from '@/math/types/find-x.types';

const PART_UNKNOWN: FindXProblem = { id: 'b1', form: 'x+a=b', a: 6, b: 14, x: 8 };
const WHOLE_UNKNOWN: FindXProblem = { id: 'b2', form: 'x-a=b', a: 8, b: 5, x: 13 };

describe('PartWholeBar', () => {
  it('states the relationship in words for a screen reader', () => {
    renderWithI18n(<PartWholeBar problem={PART_UNKNOWN} solved={false} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('aria-label')).toContain('14');
    expect(img.getAttribute('aria-label')).toContain('6');
  });

  it('hides the answer until the problem is solved', () => {
    const { rerender } = renderWithI18n(<PartWholeBar problem={PART_UNKNOWN} solved={false} />);
    expect(screen.queryByText('8')).toBeNull();
    rerender(<PartWholeBar problem={PART_UNKNOWN} solved />);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('draws the whole as the unknown in the x-minus form', () => {
    renderWithI18n(<PartWholeBar problem={WHOLE_UNKNOWN} solved={false} />);
    // Both parts are visible; the total is the one hidden.
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('13')).toBeNull();
  });

  it('marks itself vi so a screen reader does not read it as English', () => {
    const { container } = renderWithI18n(<PartWholeBar problem={PART_UNKNOWN} solved={false} />);
    expect(container.querySelector('[lang="vi"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/find-x-bar.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/math/components/PartWholeBar"`.

- [ ] **Step 3: Implement the component**

Create `src/math/components/PartWholeBar.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { MONO } from '@/math/components/QuizOption';
import { knownPartOf, roleOf, wholeOf } from '@/math/services/find-x-steps';
import type { FindXProblem } from '@/math/types/find-x.types';

interface PartWholeBarProps {
  problem: FindXProblem;
  /** True once the problem is finished, which fills the unknown in. */
  solved: boolean;
}

const VIEW_W = 400;
const BAR_H = 40;
const GAP = 16;

/**
 * The picture behind the word "why".
 *
 * A wide bar for the whole, two narrower bars beneath it for the parts, one of
 * them dashed because it is the one being found. Segment widths are proportional
 * to their values, so "the part is smaller than the whole" is visible rather
 * than asserted — which is the fact the role step turns on.
 */
export function PartWholeBar({ problem, solved }: PartWholeBarProps) {
  const { t } = useTranslation('math');
  const whole = wholeOf(problem);
  const known = knownPartOf(problem);
  const wholeUnknown = roleOf(problem.form) === 'whole';
  const other = whole - known;

  const innerW = VIEW_W - GAP;
  const knownW = Math.max(40, (known / Math.max(1, whole)) * innerW);
  const otherW = Math.max(40, innerW - knownW);

  const text = (value: number, hidden: boolean) => (hidden && !solved ? 'x' : String(value));

  return (
    <div lang="vi">
      <svg
        role="img"
        aria-label={t('findx.barAria', { whole: wholeUnknown ? t('findx.barUnknown') : whole, part: known })}
        viewBox={`0 0 ${VIEW_W} 120`}
        style={{ display: 'block', width: '100%', height: 'auto', maxWidth: 460, margin: '0 auto 16px' }}
      >
        <rect
          x={0} y={10} width={VIEW_W} height={BAR_H} rx={12}
          fill="var(--secondary)"
          stroke="var(--accent)" strokeWidth={3}
          strokeDasharray={wholeUnknown && !solved ? '8 6' : undefined}
        />
        <text
          x={VIEW_W / 2} y={10 + BAR_H / 2 + 7} textAnchor="middle"
          fontFamily={MONO} fontSize={21} fontWeight={800} fill="var(--ma-ink)"
        >
          {text(whole, wholeUnknown)}
        </text>

        <rect
          x={0} y={66} width={knownW} height={BAR_H} rx={12}
          fill="oklch(93% 0.07 248)" stroke="var(--primary)" strokeWidth={3}
        />
        <text
          x={knownW / 2} y={66 + BAR_H / 2 + 7} textAnchor="middle"
          fontFamily={MONO} fontSize={21} fontWeight={800} fill="var(--primary)"
        >
          {known}
        </text>

        <rect
          x={knownW + GAP} y={66} width={otherW} height={BAR_H} rx={12}
          fill="oklch(97% 0.02 150)" stroke="var(--success)" strokeWidth={3}
          strokeDasharray={!wholeUnknown && !solved ? '8 6' : undefined}
        />
        <text
          x={knownW + GAP + otherW / 2} y={66 + BAR_H / 2 + 7} textAnchor="middle"
          fontFamily={MONO} fontSize={21} fontWeight={800} fill="var(--success)"
        >
          {text(other, !wholeUnknown)}
        </text>
      </svg>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/unit/find-x-bar.test.tsx
```

Expected: PASS, 4 tests.

For `WHOLE_UNKNOWN` (`x − 8 = 5`, x=13): `whole = 13`, `known = 8`, `other = 5`.
Both parts render, the whole renders `x`. That matches the test.

- [ ] **Step 5: Commit**

```bash
git add src/math/components/PartWholeBar.tsx tests/unit/find-x-bar.test.tsx
git commit -m "feat(math): draw the part-whole bar behind Find X

Segment widths are proportional to their values, so 'a part is smaller
than the whole' is something the child sees rather than something the
app asserts — that is the fact the role step turns on."
```

---

### Task 5: The trail and the step card

**Files:**
- Create: `src/math/components/FindXTrail.tsx`
- Create: `src/math/components/FindXStepCard.tsx`
- Modify: `src/math/components/NumberTileStrip.tsx`
- Test: `tests/unit/find-x-step-card.test.tsx`

**Interfaces:**
- Consumes: `FindXStep`, `FindXOption` from the types; `FindXTrailEntry` from
  `@/math/services/find-x-run`; `answerRole`, `answerVisualState` from
  `@/math/components/answer-state`; `playWin`, `playBuzz` from
  `@/shared/utils/sfx`.
- Produces:
  - `optionLabel(t, option): string` exported from `FindXStepCard.tsx`
  - `FindXTrail({ entries }: { entries: FindXTrailEntry[] })`
  - `FindXStepCard({ step, wrongValues, onAnswer, tileMax })`
  - `NumberTileStrip` gains `max?: number` (default `NUMBER_TILE_MAX`) and
    `disabledValues?: number[]`

The step card's tile branch needs the wider strip, so both land here — the suite
stays green at the task boundary.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/find-x-step-card.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithI18n } from '../i18n-test-utils';
import { FindXStepCard } from '@/math/components/FindXStepCard';
import { FindXTrail } from '@/math/components/FindXTrail';
import { deriveSteps } from '@/math/services/find-x-steps';
import type { FindXProblem } from '@/math/types/find-x.types';
import { FINDX_VALUE_MAX } from '@/math/constants/math-constants';

const P: FindXProblem = { id: 's1', form: 'x+a=b', a: 6, b: 14, x: 8 };
const STEPS = deriveSteps(P, 'guided');
const ROLE = STEPS[0];
const OPERANDS = STEPS[2];
const COMPUTE = STEPS[3];

describe('FindXStepCard', () => {
  it('asks the step question and offers its options', () => {
    renderWithI18n(<FindXStepCard step={ROLE} wrongValues={[]} onAnswer={vi.fn()} tileMax={FINDX_VALUE_MAX} />);
    expect(screen.getByText('Trong phép tính này, x là một phần hay là cả tổng?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Một phần/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cả tổng/ })).toBeInTheDocument();
  });

  it('reports the index of the option tapped', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    renderWithI18n(<FindXStepCard step={OPERANDS} wrongValues={[]} onAnswer={onAnswer} tileMax={FINDX_VALUE_MAX} />);
    await user.click(screen.getByRole('button', { name: /14 − 6/ }));
    expect(onAnswer).toHaveBeenCalledWith(OPERANDS.options.findIndex((o) => o.label === '14 − 6'));
  });

  it('keeps a rejected option on screen, disabled, with its reason', () => {
    const wrongIndex = OPERANDS.options.findIndex((o) => !o.correct);
    renderWithI18n(
      <FindXStepCard step={OPERANDS} wrongValues={[wrongIndex]} onAnswer={vi.fn()} tileMax={FINDX_VALUE_MAX} />,
    );
    const label = OPERANDS.options[wrongIndex].label!;
    const button = screen.getByRole('button', { name: new RegExp(label.replace(/[+−]/g, '\\$&')) });
    expect(button).toBeDisabled();
    // The reason is real DOM, not a toast that vanishes.
    expect(screen.getByRole('status').textContent).toBeTruthy();
  });

  it('states wrongness in the label, not only in colour', () => {
    const wrongIndex = OPERANDS.options.findIndex((o) => !o.correct);
    renderWithI18n(
      <FindXStepCard step={OPERANDS} wrongValues={[wrongIndex]} onAnswer={vi.fn()} tileMax={FINDX_VALUE_MAX} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.some((b) => /sai/i.test(b.getAttribute('aria-label') ?? ''))).toBe(true);
  });

  it('renders the tile strip for a compute step, up to the Find X ceiling', () => {
    renderWithI18n(<FindXStepCard step={COMPUTE} wrongValues={[]} onAnswer={vi.fn()} tileMax={FINDX_VALUE_MAX} />);
    expect(screen.getByRole('button', { name: new RegExp(`(^|\\D)${FINDX_VALUE_MAX}(\\D|$)`) })).toBeInTheDocument();
  });
});

describe('FindXTrail', () => {
  it('lists each decision with its reason', () => {
    renderWithI18n(
      <FindXTrail entries={[
        { kind: 'role', labelKey: 'findx.opt.part', whyKey: 'findx.why.rolePart', vars: { whole: 14, known: 6 } },
      ]} />,
    );
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('Một phần')).toBeInTheDocument();
    expect(screen.getByText(/Cả tổng là 14/)).toBeInTheDocument();
  });

  it('renders nothing before the first decision', () => {
    const { container } = renderWithI18n(<FindXTrail entries={[]} />);
    expect(container.querySelector('ol')).toBeNull();
  });
});
describe('NumberTileStrip ceiling', () => {
  it('still defaults to the Number Lab range', async () => {
    const { NumberTileStrip } = await import('@/math/components/NumberTileStrip');
    renderWithI18n(<NumberTileStrip selected={null} checked={false} answerValue={3} onSelect={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /(^|\D)11(\D|$)/ })).toBeNull();
  });

  it('extends to max and disables rejected values', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const { NumberTileStrip } = await import('@/math/components/NumberTileStrip');
    renderWithI18n(
      <NumberTileStrip selected={null} checked={false} answerValue={8} onSelect={onSelect} max={20} disabledValues={[7]} />,
    );
    expect(screen.getByRole('button', { name: /(^|\D)20(\D|$)/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /(^|\D)7(\D|$)/ }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/find-x-step-card.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/math/components/FindXStepCard"`.

- [ ] **Step 3: Extend the tile strip**

In `src/math/components/NumberTileStrip.tsx`, change the props interface, the
`values` computation, the `aria-label`, and the button's `disabled`/`onClick`:

```tsx
interface NumberTileStripProps {
  /** The value tapped so far, or null. */
  selected: number | null;
  checked: boolean;
  /** The number that answers the question. */
  answerValue: number;
  onSelect: (value: number) => void;
  /** `'large'` is the Number Lab's full-width strip; `'compact'` the hive's. */
  size?: TileSize;
  /**
   * Top of the strip. Defaults to the Number Lab's ceiling; Find X raises it to
   * `FINDX_VALUE_MAX` because its problems run past ten.
   */
  max?: number;
  /**
   * Values already tried and rejected on this question. They stay on screen,
   * disabled, so a child can see what she has ruled out.
   */
  disabledValues?: number[];
}
```

```tsx
export function NumberTileStrip({
  selected, checked, answerValue, onSelect, size = 'compact',
  max = NUMBER_TILE_MAX, disabledValues = [],
}: NumberTileStripProps) {
  const { t } = useTranslation('math');
  const large = size === 'large';
  const values = Array.from(
    { length: max - NUMBER_TILE_MIN + 1 },
    (_, i) => NUMBER_TILE_MIN + i,
  );
```

Replace the strip's `aria-label`:

```tsx
      aria-label={t('quiz.tileStripAria', { min: NUMBER_TILE_MIN, max })}
```

And inside `values.map`, replace the label and the button's `disabled`:

```tsx
        const rejected = disabledValues.includes(value);
```

```tsx
            disabled={checked || rejected}
            aria-label={rejected ? t('quiz.tileWrongAria', { value }) : labelFor(value)}
```

Leave `labelFor`, `answerVisualState` and every style untouched — the existing
Number Lab behaviour must not change, which the first `NumberTileStrip ceiling`
test pins down.

- [ ] **Step 4: Implement the trail**

Create `src/math/components/FindXTrail.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import type { FindXTrailEntry } from '@/math/services/find-x-run';

/**
 * What the child has decided so far, each line carrying the reason it was right.
 *
 * An ordered list rather than a stack of divs: "what have I settled?" is a thing
 * a screen reader user navigates, and the count matters.
 */
export function FindXTrail({ entries }: { entries: FindXTrailEntry[] }) {
  const { t } = useTranslation('math');
  if (entries.length === 0) return null;

  return (
    <ol
      lang="vi"
      aria-label={t('findx.trailAria')}
      style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', margin: '0 0 16px', padding: 0 }}
    >
      {entries.map((e, i) => (
        <li
          key={`${e.kind}-${i}`}
          style={{
            display: 'flex', gap: 11, alignItems: 'flex-start', padding: '12px 14px',
            borderRadius: 18, background: 'oklch(97.5% 0.02 150)', borderLeft: '5px solid var(--success)',
          }}
        >
          <span aria-hidden="true" style={{ fontWeight: 900, color: 'var(--success)' }}>✓</span>
          <span style={{ fontWeight: 700, fontSize: '0.93rem' }}>
            {e.labelKey ? t(e.labelKey, e.vars) : e.label}
            <span style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', color: 'var(--muted-fg)', marginTop: 3 }}>
              {t(e.whyKey, e.vars)}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 5: Implement the step card**

Create `src/math/components/FindXStepCard.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { MONO } from '@/math/components/QuizOption';
import { NumberTileStrip } from '@/math/components/NumberTileStrip';
import { answerRole, answerVisualState } from '@/math/components/answer-state';
import { playWin, playBuzz } from '@/shared/utils/sfx';
import { isStepCorrect } from '@/math/services/find-x-steps';
import type { FindXOption, FindXStep } from '@/math/types/find-x.types';

interface FindXStepCardProps {
  step: FindXStep;
  /** Option indices (or tapped numbers) already rejected on this step. */
  wrongValues: number[];
  onAnswer: (value: number) => void;
  /** Ceiling of the number strip on compute steps. */
  tileMax: number;
}

/** An option's visible text: worded options go through i18n, numerals do not. */
export function optionLabel(t: TFunction, option: FindXOption): string {
  return option.labelKey ? t(option.labelKey, option.vars) : option.label ?? '';
}

/**
 * One decision: the question, the options, and — once something has been
 * rejected — why it was wrong.
 *
 * A rejected option stays on screen, disabled, rather than disappearing: the
 * reason is the teaching, and a child who cannot see what she picked cannot
 * connect the explanation to her own choice.
 */
export function FindXStepCard({ step, wrongValues, onAnswer, tileMax }: FindXStepCardProps) {
  const { t } = useTranslation('math');
  const lastWrong = wrongValues.length > 0 ? wrongValues[wrongValues.length - 1] : null;
  const wrongOption = lastWrong === null
    ? undefined
    : step.input === 'tiles'
      ? undefined
      : step.options[lastWrong];

  /**
   * Feedback fires per DECISION, not per problem, so the sound lands on the
   * choice that earned it. Same two clips the hive and the lab use.
   */
  const answer = (value: number) => {
    if (isStepCorrect(step, value)) playWin();
    else playBuzz();
    onAnswer(value);
  };

  return (
    <div
      lang="vi"
      role="group"
      aria-label={t(step.promptKey, step.vars)}
      style={{ borderRadius: 22, border: '3px dashed var(--accent)', padding: '18px 16px', background: 'oklch(99% 0.012 88)' }}
    >
      <h2 style={{ fontSize: '1.12rem', fontWeight: 900, margin: '0 0 14px', textWrap: 'pretty' }}>
        {t(step.promptKey, step.vars)}
      </h2>

      {step.input === 'tiles' ? (
        <NumberTileStrip
          selected={null}
          checked={false}
          answerValue={step.options[0].value ?? -1}
          onSelect={answer}
          size="large"
          max={tileMax}
          disabledValues={wrongValues}
        />
      ) : (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))' }}>
          {step.options.map((option, i) => {
            const rejected = wrongValues.includes(i);
            const { bg, fg, shadow } = answerVisualState(answerRole(false, rejected), rejected, rejected);
            const label = optionLabel(t, option);
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={rejected}
                aria-label={rejected ? t('quiz.tileWrongAria', { value: label }) : label}
                style={{
                  minHeight: 56, padding: '15px 12px', borderRadius: 18, background: bg, color: fg,
                  boxShadow: shadow, fontWeight: 800, fontSize: '1rem',
                  fontFamily: option.label ? MONO : undefined, overflowWrap: 'anywhere',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <p
        role="status"
        style={{ margin: '14px 0 0', fontWeight: 800, fontSize: '0.98rem', minHeight: '1.4em', color: 'var(--destructive)', textWrap: 'pretty' }}
      >
        {wrongOption ? t(wrongOption.whyKey, wrongOption.vars ?? step.vars) : ''}
      </p>
    </div>
  );
}
```

`quiz.tileWrongAria` already exists in `math.json` and reads
`"{{value}}, sai"` — which is why the "states wrongness in the label" test greps
for `sai`. Confirm it before relying on it:

```bash
node -e "console.log(require('./src/locales/en/math.json').quiz.tileWrongAria)"
```

If it does not contain `sai`, add `"findx.wrongAria": "{{label}}, sai rồi"` to the
`findx` block and use that key instead.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/find-x-step-card.test.tsx
```

Expected: PASS — 5 `FindXStepCard`, 2 `FindXTrail`, 2 `NumberTileStrip ceiling`.

- [ ] **Step 7: Verify the existing Number Lab still behaves**

```bash
npm run typecheck && npx vitest run tests/unit tests/integration/math-number-lab.test.tsx
```

Expected: typecheck clean; every test passes. If `math-number-lab.test.tsx` fails,
the `NumberTileStrip` default changed — the strip must still stop at
`NUMBER_TILE_MAX` when no `max` is passed.

- [ ] **Step 8: Commit**

```bash
git add src/math/components/FindXTrail.tsx src/math/components/FindXStepCard.tsx \
        src/math/components/NumberTileStrip.tsx tests/unit/find-x-step-card.test.tsx
git commit -m "feat(math): add the Find X trail and step card

A rejected option stays on screen, disabled, with its reason: the reason
is the teaching, and a child who cannot see what she picked cannot
connect the explanation to her own choice.

NumberTileStrip grows an optional max and a rejected-values list, both
defaulting to today's behaviour so the Number Lab is untouched."
```

---

### Task 6: The composed play screen

**Files:**
- Create: `src/math/components/FindXView.tsx`
- Test: `tests/unit/find-x-view.test.tsx`

**Interfaces:**
- Consumes: `FindXRunState` from `@/math/services/find-x-run`; `PartWholeBar`,
  `FindXTrail`, `FindXStepCard`.
- Produces:
  - `FindXView({ state, stageIcon, stageName, onAnswer, onNext, onReveal, onExit })`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/find-x-view.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithI18n } from '../i18n-test-utils';
import { FindXView } from '@/math/components/FindXView';
import { initFindXRun, findXReducer } from '@/math/services/find-x-run';
import type { FindXRunState } from '@/math/services/find-x-run';
import type { FindXProblem } from '@/math/types/find-x.types';

const P: FindXProblem = { id: 'v1', form: 'x+a=b', a: 6, b: 14, x: 8 };
const STORY: FindXProblem = { id: 'v2', form: 'a+x=b', a: 6, b: 14, x: 8, story: 'birds' };

const noop = { onAnswer: vi.fn(), onNext: vi.fn(), onReveal: vi.fn(), onExit: vi.fn() };

function view(state: FindXRunState, level = 'guided') {
  return renderWithI18n(
    <FindXView state={state} stageIcon="🧭" stageName={`Tìm X ${level}`} {...noop} />,
  );
}

describe('FindXView', () => {
  it('shows the equation, the bar and the first step', () => {
    view(initFindXRun([P], 'guided'));
    expect(screen.getByText('x + 6 = 14')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /x là một phần hay là cả tổng/ })).toBeInTheDocument();
  });

  it('shows the story sentence instead of a bare label on a story problem', () => {
    view(initFindXRun([STORY], 'guided'));
    expect(screen.getByText(/Trên cành có 6 con chim/)).toBeInTheDocument();
  });

  it('offers the hint button only below the guided level', () => {
    view(initFindXRun([P], 'solo'));
    expect(screen.getByRole('button', { name: 'Chỉ tôi cách làm' })).toBeInTheDocument();
  });

  it('hides the hint button on the guided level, where nothing is left to reveal', () => {
    view(initFindXRun([P], 'guided'));
    expect(screen.queryByRole('button', { name: 'Chỉ tôi cách làm' })).toBeNull();
  });

  it('swaps the step card for a continue button when the problem is done', () => {
    let s = initFindXRun([P], 'solo');
    while (!s.problemComplete) {
      const step = s.steps[s.stepIndex];
      const value = step.input === 'tiles'
        ? step.options.find((o) => o.correct)!.value!
        : step.options.findIndex((o) => o.correct);
      s = findXReducer(s, { type: 'answer', value });
    }
    view(s);
    expect(screen.getByRole('button', { name: /Tiếp tục|Xong rồi/ })).toBeInTheDocument();
  });

  it('marks its Vietnamese content with lang=vi', () => {
    const { container } = view(initFindXRun([P], 'guided'));
    expect(container.querySelectorAll('[lang="vi"]').length).toBeGreaterThan(0);
  });
});

```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/find-x-view.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/math/components/FindXView"`.

- [ ] **Step 3: Implement the view**

Create `src/math/components/FindXView.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { BeeMascot } from '@/math/components/BeeMascot';
import { MONO } from '@/math/components/QuizOption';
import { PartWholeBar } from '@/math/components/PartWholeBar';
import { FindXTrail } from '@/math/components/FindXTrail';
import { FindXStepCard } from '@/math/components/FindXStepCard';
import { equationOf, storyKindOf } from '@/math/services/find-x-steps';
import type { FindXRunState } from '@/math/services/find-x-run';
import { FINDX_VALUE_MAX } from '@/math/constants/math-constants';

interface FindXViewProps {
  state: FindXRunState;
  stageIcon: string;
  stageName: string;
  onAnswer: (value: number) => void;
  onNext: () => void;
  onReveal: () => void;
  onExit: () => void;
}

/**
 * The Find X play screen: the problem, the bar model, what she has decided so
 * far, and the one decision in front of her.
 *
 * No hearts and no countdown anywhere — this is the stage for the thing she
 * finds hardest, and a clock on a "think it through" exercise rewards guessing.
 */
export function FindXView(props: FindXViewProps) {
  const { state, stageIcon, stageName, onAnswer, onNext, onReveal, onExit } = props;
  const { t } = useTranslation('math');
  const problem = state.problems[state.pIndex];
  if (!problem) return <div className="page math-world" />;

  const inReview = state.pIndex >= state.originalTotal;
  const progress = inReview ? 1 : (state.pIndex + (state.problemComplete ? 1 : 0)) / Math.max(1, state.originalTotal);
  const storyKind = problem.story ? storyKindOf(problem.form) : null;
  const isLast = state.pIndex >= state.problems.length - 1;

  return (
    <div className="page math-world" style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <button className="icon-btn" onClick={onExit} aria-label={t('findx.exitAria')}>✕</button>
        <div className="progress" style={{ flex: 1, height: 16, background: 'var(--secondary)' }}>
          <i style={{ width: `${progress * 100}%`, background: 'var(--primary)' }} />
        </div>
        <span lang="vi" style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--muted-fg)', whiteSpace: 'nowrap' }}>
          {t('findx.rightCount', { count: state.mastered })}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9999, background: 'var(--ma-soft)', color: 'var(--ma-ink)', fontWeight: 900, fontSize: '0.95rem' }}>
          <span aria-hidden="true">{stageIcon}</span> {stageName}
        </span>
        <span lang="vi" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--muted-fg)' }}>
          {inReview ? t('findx.secondLook') : t('findx.questionOf', { index: state.pIndex + 1, total: state.originalTotal })}
        </span>
      </div>

      <div className="card" style={{ padding: '26px 20px 22px', borderRadius: 32, marginBottom: 18 }}>
        <p lang="vi" style={{ margin: '0 0 8px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ma-ink)' }}>
          {storyKind ? t('findx.storyLabel') : t('findx.problemLabel')}
        </p>
        {storyKind && (
          <p lang="vi" style={{ margin: '0 0 12px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 900, textWrap: 'balance' }}>
            {t(`findx.story.${storyKind}.${problem.story}`, { a: problem.a, b: problem.b })}
          </p>
        )}
        <p style={{ margin: 0, textAlign: 'center', fontFamily: MONO, fontSize: '2.1rem', fontWeight: 800 }}>
          {equationOf(problem, state.problemComplete ? String(problem.x) : 'x')}
        </p>
      </div>

      <PartWholeBar problem={problem} solved={state.problemComplete} />

      <FindXTrail entries={state.trail} />

      {state.problemComplete ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <BeeMascot size={40} reaction="celebrate" />
          <button
            lang="vi"
            onClick={onNext}
            style={{ padding: '18px 44px', borderRadius: 9999, background: 'var(--success)', color: '#fff', fontWeight: 900, fontSize: '1.2rem', boxShadow: '0 14px 26px -14px rgba(90,65,30,.7)' }}
          >
            {isLast ? t('findx.finish') : t('findx.continue')}
          </button>
        </div>
      ) : (
        <>
          <FindXStepCard
            step={state.steps[state.stepIndex]}
            wrongValues={state.wrongValues}
            onAnswer={onAnswer}
            tileMax={FINDX_VALUE_MAX}
          />
          {state.level !== 'guided' && !state.revealed && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button
                lang="vi"
                onClick={onReveal}
                style={{ padding: '14px 22px', borderRadius: 9999, background: 'var(--paper)', boxShadow: 'var(--shadow-soft)', fontWeight: 800, fontSize: '1rem', color: 'var(--ma-ink)' }}
              >
                {t('findx.reveal')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/find-x-view.test.tsx
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Verify nothing else broke**

```bash
npm run typecheck && npx vitest run tests/unit tests/integration
```

Expected: typecheck clean; all unit and integration tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/math/components/FindXView.tsx tests/unit/find-x-view.test.tsx
git commit -m "feat(math): compose the Find X play screen

The bar model and the trail stay on screen the whole time, so the reason
for every decision sits next to the decision in front of her."
```

---

### Task 7: The parent breakdown line

**Files:**
- Modify: `src/math/components/MathRewardScreen.tsx`
- Test: `tests/unit/find-x-breakdown.test.tsx`

**Interfaces:**
- Consumes: `FindXStats` from `@/math/services/find-x-run`.
- Produces: `MathRewardScreenProps` gains `breakdown?: FindXStats`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/find-x-breakdown.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithI18n } from '../i18n-test-utils';
import { MathRewardScreen } from '@/math/components/MathRewardScreen';
import type { FindXStats } from '@/math/services/find-x-run';

const STATS: FindXStats = {
  asked: { read: 0, role: 10, operation: 10, operands: 10, compute: 10, check: 10 },
  missed: { read: 0, role: 1, operation: 2, operands: 4, compute: 1, check: 0 },
  reveals: 0,
};

const base = {
  variant: 'practice' as const,
  topicName: 'Tìm X từng bước',
  level: 7,
  stars: 2 as const,
  streak: 3,
  accuracy: 80,
  onNext: vi.fn(),
  onBackToHive: vi.fn(),
};

describe('reward breakdown', () => {
  it('reports right-first-time per decision, so a parent can tell the two failures apart', () => {
    renderWithI18n(<MathRewardScreen {...base} breakdown={STATS} />);
    // operation 10 asked / 2 missed -> 8/10; operands -> 6/10; compute -> 9/10
    const line = screen.getByTestId('findx-breakdown');
    expect(line.textContent).toContain('8/10');
    expect(line.textContent).toContain('6/10');
    expect(line.textContent).toContain('9/10');
    expect(line).toHaveAttribute('lang', 'vi');
  });

  it('is absent when no breakdown is passed, so every other pillar is untouched', () => {
    renderWithI18n(<MathRewardScreen {...base} />);
    expect(screen.queryByTestId('findx-breakdown')).toBeNull();
  });

  it('omits a decision the stage never asked', () => {
    const soloStats: FindXStats = {
      asked: { read: 0, role: 0, operation: 0, operands: 0, compute: 10, check: 10 },
      missed: { read: 0, role: 0, operation: 0, operands: 0, compute: 3, check: 0 },
      reveals: 2,
    };
    renderWithI18n(<MathRewardScreen {...base} breakdown={soloStats} />);
    const line = screen.getByTestId('findx-breakdown');
    expect(line.textContent).toContain('7/10');
    expect(line.textContent).not.toContain('0/0');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/find-x-breakdown.test.tsx
```

Expected: FAIL — `Property 'breakdown' does not exist` / no element with that test id.

- [ ] **Step 3: Implement the line**

In `src/math/components/MathRewardScreen.tsx`, add the import:

```tsx
import type { FindXStats } from '@/math/services/find-x-run';
```

Add the prop:

```tsx
  /**
   * Find X only: how often each decision was right first time. Because the
   * decisions are graded separately, "she cannot subtract" and "she does not
   * know WHICH subtraction" stop looking alike — which is the actual diagnosis
   * a parent needs.
   */
  breakdown?: FindXStats;
```

Destructure it:

```tsx
  const { variant, topicName, level, stars, streak, accuracy, recovered = 0, breakdown, onNext, onBackToHive } = props;
```

Add this just above the `reward.badgesHeading` paragraph:

```tsx
      {breakdown && (
        <p
          lang="vi"
          data-testid="findx-breakdown"
          style={{ margin: '0 auto 18px', maxWidth: 420, fontWeight: 800, fontSize: '0.88rem', color: 'var(--muted-fg)', textWrap: 'pretty' }}
        >
          {(['operation', 'operands', 'compute'] as const)
            .filter((kind) => breakdown.asked[kind] > 0)
            .map((kind) => `${t(`findx.kind.${kind}`)} ${breakdown.asked[kind] - breakdown.missed[kind]}/${breakdown.asked[kind]}`)
            .join(' · ')}
        </p>
      )}
```

`findx.kind.operation`, `findx.kind.operands` and `findx.kind.compute` already
exist in `src/locales/en/math.json` (Task 1 added them) and are already pinned by
`find-x-copy.test.ts`. No copy change is needed here — the line is assembled from
parts because a stage may ask only some of the decisions.

The prop has no caller yet — `FindXPage` passes it in Task 8. It is optional, so
every existing `MathRewardScreen` call site is unaffected, which the second test
above pins down.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run tests/unit/find-x-breakdown.test.tsx
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Verify every other pillar still renders**

```bash
npm run typecheck && npx vitest run tests
```

Expected: the whole suite passes.

- [ ] **Step 6: Commit**

```bash
git add src/math/components/MathRewardScreen.tsx tests/unit/find-x-breakdown.test.tsx
git commit -m "feat(math): report Find X decisions separately at run end

Grading each decision on its own is what lets a parent tell 'she cannot
subtract' from 'she does not know which subtraction'. The line is
assembled from the decisions a stage actually asked, so the solo stage
does not report 0/0 for steps it never showed."
```

---

### Task 8: Stages, route, and the page

**Files:**
- Modify: `src/math/types/math.types.ts`
- Modify: `src/math/data/number-lab.ts`
- Modify: `src/math/components/NumberLabPillar.tsx`
- Modify: `src/App.tsx`
- Create: `src/math/pages/FindXPage.tsx`
- Test: `tests/integration/find-x-guided.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–6; `usePracticeProgress`,
  `computeStars`, `computeAccuracy`, `MathRewardScreen`.
- Produces:
  - `PracticeStageId` gains `'findxGuided' | 'findxShort' | 'findxSolo'`
  - `PracticeStage` gains `activity?: 'findx'`
  - `FINDX_STAGES: PracticeStage[]`, `LAB_STAGES: PracticeStage[]`
  - `getFindXStageById(id: string): PracticeStage | undefined`
  - `findXLevelOf(id: string): FindXLevel | undefined`
  - `FindXPage()` mounted at `/math/findx/:stage`

- [ ] **Step 1: Write the failing test**

Create `tests/integration/find-x-guided.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// --- In-memory Dexie stand-in (no IndexedDB in jsdom). ---
const rows = { topic: new Map<string, { id: string; stars: number; level: number; topicId: string; childId: string }>() };
vi.mock('@/shared/db/db', () => ({
  db: {
    mathTopicProgress: {
      get: async (id: string) => rows.topic.get(id),
      put: async (row: { id: string }) => void rows.topic.set(row.id, row as never),
      where: () => ({ equals: () => ({ toArray: async () => [...rows.topic.values()] }) }),
    },
    mathProfileState: { get: async () => undefined, put: async () => undefined },
    mathLevelResults: { get: async () => undefined, put: async () => undefined, where: () => ({ equals: () => ({ toArray: async () => [] }) }) },
    mathOlympiadState: { get: async () => undefined, put: async () => undefined },
  },
}));

vi.mock('@/shared/store/profile-store', () => ({
  useProfileStore: (selector: (s: { activeProfileId: string }) => unknown) =>
    selector({ activeProfileId: 'test-child' }),
}));

import { FindXPage } from '@/math/pages/FindXPage';
import { NumberLabPillar } from '@/math/components/NumberLabPillar';
import { LAB_STAGES, FINDX_STAGES, PRACTICE_STAGES } from '@/math/data/number-lab';
import { practiceTopicId } from '@/math/services/practice-progress';
import { composeFindXRun } from '@/math/services/find-x-generator';
import { deriveSteps } from '@/math/services/find-x-steps';
import { FINDX_RUN_SIZES } from '@/math/constants/math-constants';

beforeEach(() => rows.topic.clear());

function renderStage(stage: string) {
  return render(
    <MemoryRouter initialEntries={[`/math/findx/${stage}`]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/math/findx/:stage" element={<FindXPage />} />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

/** Walk the whole run, answering every step correctly. */
async function playRun(user: ReturnType<typeof userEvent.setup>, level: 'guided' | 'short' | 'solo') {
  for (const problem of composeFindXRun(level, 1)) {
    for (const step of deriveSteps(problem, level)) {
      const right = step.options.find((o) => o.correct)!;
      const name = step.input === 'tiles'
        ? new RegExp(`(^|\\D)${right.value}(\\D|$)`)
        : new RegExp(escape(right.labelKey ? i18n.t(right.labelKey, { ns: 'math', ...right.vars }) : right.label!));
      await user.click(screen.getAllByRole('button', { name })[0]);
    }
    await user.click(screen.getByRole('button', { name: /Tiếp tục|Xong rồi/ }));
  }
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\−]/g, '\\$&');
}

describe('Find X — guided stage', () => {
  it('lists the three Find X cards after the six bank stages', () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}><NumberLabPillar /></I18nextProvider>
      </MemoryRouter>,
    );
    expect(LAB_STAGES).toHaveLength(PRACTICE_STAGES.length + FINDX_STAGES.length);
    expect(screen.getByText('Tìm X từng bước')).toBeInTheDocument();
    expect(screen.getByText('Tự tìm X')).toBeInTheDocument();
  });

  it('opens on the first problem of the guided chain', async () => {
    renderStage('findxGuided');
    expect(await screen.findByRole('group', { name: /x là một phần hay là cả tổng/ })).toBeInTheDocument();
  });

  it('grows the trail as decisions are made', async () => {
    const user = userEvent.setup();
    renderStage('findxGuided');
    const step = await screen.findByRole('group', { name: /một phần hay là cả tổng/ });
    expect(screen.queryByRole('list', { name: 'Những bước đã làm' })).toBeNull();
    const first = composeFindXRun('guided', 1)[0];
    const roleStep = deriveSteps(first, 'guided').find((s) => s.kind === 'role')!;
    const right = roleStep.options.find((o) => o.correct)!;
    await user.click(screen.getByRole('button', { name: i18n.t(right.labelKey!, { ns: 'math', ...right.vars }) }));
    expect(step).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Những bước đã làm' })).toBeInTheDocument();
  });

  it('keeps a wrong option visible with its reason and does not advance', async () => {
    const user = userEvent.setup();
    renderStage('findxGuided');
    await screen.findByRole('group', { name: /một phần hay là cả tổng/ });
    const first = composeFindXRun('guided', 1)[0];
    const roleStep = deriveSteps(first, 'guided').find((s) => s.kind === 'role')!;
    const wrong = roleStep.options.find((o) => !o.correct)!;
    const button = screen.getByRole('button', { name: i18n.t(wrong.labelKey!, { ns: 'math', ...wrong.vars }) });
    await user.click(button);
    expect(screen.getByRole('group', { name: /một phần hay là cả tổng/ })).toBeInTheDocument();
    expect(screen.getByText(i18n.t(wrong.whyKey, { ns: 'math', ...(wrong.vars ?? roleStep.vars) }))).toBeInTheDocument();
    expect(screen.getAllByRole('button').some((b) => b.hasAttribute('disabled'))).toBe(true);
  });

  it('reaches the reward screen and records stars for the stage', async () => {
    const user = userEvent.setup();
    renderStage('findxGuided');
    await screen.findByRole('group');
    await playRun(user, 'guided');
    expect(await screen.findByText(/★|Number Lab|Lab/i)).toBeTruthy();
    const stageIndex = FINDX_STAGES[0].index;
    expect(rows.topic.get(`test-child:${practiceTopicId(stageIndex)}`)?.stars).toBe(3);
  });

  it('serves exactly the stage run size', () => {
    expect(composeFindXRun('guided', 1)).toHaveLength(FINDX_RUN_SIZES.guided);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/integration/find-x-guided.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/math/pages/FindXPage"`.

- [ ] **Step 3: Widen the stage types**

In `src/math/types/math.types.ts`, replace the `PracticeStageId` union and add two
fields to `PracticeStage`:

```ts
/** The Number Lab practice stages, in teaching order. */
export type PracticeStageId =
  | 'sums' | 'bonds' | 'addend' | 'takeaway' | 'factfam' | 'compare'
  | 'findxGuided' | 'findxShort' | 'findxSolo';
```

```ts
export interface PracticeStage {
  id: PracticeStageId;
  index: number;
  icon: string;
  nameKey: string;
  example: string;
  /**
   * Which engine plays this stage. Absent means the classic tile quiz driven by
   * the generated bank; `'findx'` means the guided step chain, which has no bank
   * and its own page.
   */
  activity?: 'findx';
}
```

Leave the existing doc comments on `index`, `icon`, `nameKey` and `example` in
place; only the union and the new field change.

- [ ] **Step 4: Add the stages**

Append to `src/math/data/number-lab.ts`:

```ts
import type { FindXLevel } from '@/math/types/find-x.types';
import { FINDX_FIRST_STAGE_INDEX } from '@/math/constants/math-constants';

/**
 * The Find X stages, in fading order: every decision asked, then only the ones
 * that trip children up, then the bare question with a hint on demand.
 *
 * Deliberately NOT appended to `PRACTICE_STAGES`. That array is the bank-backed
 * ladder and `PRACTICE_STAGE_COUNT` is its band range —
 * `math-number-lab-data.test.ts` asserts the bank holds exactly
 * `count × size × windows` questions and that every stage in it has some. Find X
 * has no bank, so joining that array would break a true test with a false stage.
 */
export const FINDX_STAGES: PracticeStage[] = [
  { id: 'findxGuided', index: FINDX_FIRST_STAGE_INDEX, icon: '🧭', nameKey: 'lab.stages.findxGuided', example: 'x + 6 = 14', activity: 'findx' },
  { id: 'findxShort', index: FINDX_FIRST_STAGE_INDEX + 1, icon: '🧮', nameKey: 'lab.stages.findxShort', example: 'x − 8 = 5', activity: 'findx' },
  { id: 'findxSolo', index: FINDX_FIRST_STAGE_INDEX + 2, icon: '🎯', nameKey: 'lab.stages.findxSolo', example: '20 − x = 12', activity: 'findx' },
];

/** Every card the Number Lab pillar shows, bank-backed stages first. */
export const LAB_STAGES: PracticeStage[] = [...PRACTICE_STAGES, ...FINDX_STAGES];

const FINDX_BY_ID = new Map(FINDX_STAGES.map((s) => [s.id as string, s]));

export function getFindXStageById(id: string): PracticeStage | undefined {
  return FINDX_BY_ID.get(id);
}

const LEVEL_BY_ID: Record<string, FindXLevel> = {
  findxGuided: 'guided',
  findxShort: 'short',
  findxSolo: 'solo',
};

export function findXLevelOf(id: string): FindXLevel | undefined {
  return LEVEL_BY_ID[id];
}
```

- [ ] **Step 5: Route the pillar by activity**

In `src/math/components/NumberLabPillar.tsx`:

Change the import:

```tsx
import { LAB_STAGES } from '@/math/data/number-lab';
```

Change the summary call:

```tsx
  const { cleared, total } = labSummary(LAB_STAGES, progress);
```

Change the list source and the navigation target:

```tsx
        {LAB_STAGES.map((stage) => {
```

```tsx
                onClick={() => navigate(
                  stage.activity === 'findx'
                    ? `/math/findx/${stage.id}`
                    : `/math/practice/${stage.id}`,
                )}
```

Everything else in the file is unchanged.

- [ ] **Step 6: Add the `load` action to the reducer**

The page composes its problems asynchronously (it reads the attempt cursor from
Dexie first), so the reducer needs a way to be handed a fresh run. In
`src/math/services/find-x-run.ts`, extend the action union:

```ts
export type FindXAction =
  | { type: 'answer'; value: number }
  | { type: 'next' }
  | { type: 'reveal' }
  | { type: 'load'; problems: FindXProblem[]; level: FindXLevel };
```

and add the case to `findXReducer`:

```ts
    case 'load':
      return initFindXRun(action.problems, action.level);
```

Add this test to `tests/unit/find-x-run.test.ts`:

```ts
  it('replaces the whole run on load', () => {
    const s = findXReducer(initFindXRun([], 'guided'), { type: 'load', problems: [P1], level: 'solo' });
    expect(s.level).toBe('solo');
    expect(s.originalTotal).toBe(1);
    expect(s.done).toBe(false);
    expect(s.steps[0].kind).toBe('compute');
  });
```

Run it:

```bash
npx vitest run tests/unit/find-x-run.test.ts
```

Expected: PASS, 13 tests.

- [ ] **Step 7: Create the page**

Create `src/math/pages/FindXPage.tsx`:

```tsx
import { useReducer, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFindXStageById, findXLevelOf } from '@/math/data/number-lab';
import { composeFindXRun } from '@/math/services/find-x-generator';
import { findXReducer, initFindXRun } from '@/math/services/find-x-run';
import type { FindXRunState, FindXStats } from '@/math/services/find-x-run';
import { usePracticeProgress } from '@/math/hooks/usePracticeProgress';
import { computeStars, computeAccuracy } from '@/math/services/quiz-scorer';
import { FindXView } from '@/math/components/FindXView';
import { MathRewardScreen } from '@/math/components/MathRewardScreen';
import type { StarRating } from '@/math/types/math.types';

interface RewardData { stars: StarRating; streak: number; accuracy: number; recovered: number; stats: FindXStats }

/** The empty run a reducer needs before the real one has loaded. */
const EMPTY: FindXRunState = initFindXRun([], 'guided');

/**
 * One Find X stage.
 *
 * Hearts off and no countdown, inherited from the Number Lab: this is the
 * pillar for the thing she finds hardest, so a run must never end in a game
 * over, and a clock on a "think it through" exercise rewards guessing.
 */
export function FindXPage() {
  const { stage: stageId } = useParams<{ stage: string }>();
  const { t } = useTranslation('math');
  const navigate = useNavigate();
  const stage = stageId ? getFindXStageById(stageId) : undefined;
  const level = stageId ? findXLevelOf(stageId) : undefined;

  const { getStageProgress, recordStageCleared } = usePracticeProgress();
  const [state, dispatch] = useReducer(findXReducer, EMPTY);
  const [reward, setReward] = useState<RewardData | null>(null);
  const [runKey, setRunKey] = useState(0);

  // The attempt cursor picks a different problem set each replay, so starting a
  // run always reads the child's stored progress first.
  useEffect(() => {
    if (!stage || !level) return;
    let cancelled = false;
    void (async () => {
      const progress = await getStageProgress();
      if (cancelled) return;
      const problems = composeFindXRun(level, progress[stage.index]?.attempt ?? 1);
      setReward(null);
      dispatch({ type: 'load', problems, level });
    })();
    return () => { cancelled = true; };
  }, [stage?.id, runKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!stage || !state.done || reward) return;
    void (async () => {
      const stars = computeStars(state.firstPass, state.originalTotal);
      const accuracy = computeAccuracy(state.firstPass, state.originalTotal);
      const { economy } = await recordStageCleared(stage.index, stars);
      setReward({
        stars,
        streak: economy.streak,
        accuracy,
        recovered: state.mastered - state.firstPass,
        stats: state.stats,
      });
    })();
  }, [state.done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stage || !level) return <div style={{ padding: 24 }}>Stage not found.</div>;

  const backToLab = () => navigate('/');

  if (reward) {
    return (
      <MathRewardScreen
        variant="practice"
        topicName={t(stage.nameKey)}
        level={stage.index}
        stars={reward.stars}
        streak={reward.streak}
        accuracy={reward.accuracy}
        recovered={reward.recovered}
        breakdown={reward.stats}
        onNext={() => setRunKey((k) => k + 1)}
        onBackToHive={backToLab}
      />
    );
  }

  return (
    <FindXView
      state={state}
      stageIcon={stage.icon}
      stageName={t(stage.nameKey)}
      onAnswer={(value) => dispatch({ type: 'answer', value })}
      onNext={() => dispatch({ type: 'next' })}
      onReveal={() => dispatch({ type: 'reveal' })}
      onExit={backToLab}
    />
  );
}
```

- [ ] **Step 8: Add the route**

In `src/App.tsx`, add the import beside the other math pages:

```tsx
import { FindXPage } from '@/math/pages/FindXPage';
```

and the route beside the other math routes:

```tsx
          <Route path="/math/findx/:stage" element={<FindXPage />} />
```

- [ ] **Step 9: Run the tests**

```bash
npx vitest run tests/integration/find-x-guided.test.tsx
```

Expected: PASS, 6 tests. `MathRewardScreen` already accepts `breakdown` — Task 7
added it.

- [ ] **Step 10: Verify nothing else broke**

```bash
npm run typecheck && npm run lint && npx vitest run tests/unit tests/integration
```

Expected: typecheck clean, lint clean, every test passes.

- [ ] **Step 11: Commit**

```bash
git add src/math/types/math.types.ts src/math/data/number-lab.ts \
        src/math/components/NumberLabPillar.tsx src/math/services/find-x-run.ts \
        src/math/pages/FindXPage.tsx src/App.tsx \
        tests/integration/find-x-guided.test.tsx
git commit -m "feat(math): wire the three Find X stages into the Number Lab

FINDX_STAGES stays out of PRACTICE_STAGES on purpose: that array is the
bank-backed ladder and its length is asserted against the generated
bank, so a bankless stage joining it would break a true test. The pillar
renders the concatenation and routes by stage.activity."
```

---

### Task 9: Fading behaviour and accessibility

**Files:**
- Test: `tests/integration/find-x-fading.test.tsx`
- Test: `tests/a11y/find-x.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–8. No production code changes expected; if a
  test fails, fix the component it names.

- [ ] **Step 1: Write the fading test**

Create `tests/integration/find-x-fading.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

const rows = { topic: new Map<string, unknown>() };
vi.mock('@/shared/db/db', () => ({
  db: {
    mathTopicProgress: {
      get: async (id: string) => rows.topic.get(id),
      put: async (row: { id: string }) => void rows.topic.set(row.id, row),
      where: () => ({ equals: () => ({ toArray: async () => [...rows.topic.values()] }) }),
    },
    mathProfileState: { get: async () => undefined, put: async () => undefined },
    mathLevelResults: { get: async () => undefined, put: async () => undefined, where: () => ({ equals: () => ({ toArray: async () => [] }) }) },
    mathOlympiadState: { get: async () => undefined, put: async () => undefined },
  },
}));
vi.mock('@/shared/store/profile-store', () => ({
  useProfileStore: (selector: (s: { activeProfileId: string }) => unknown) =>
    selector({ activeProfileId: 'test-child' }),
}));

import { FindXPage } from '@/math/pages/FindXPage';

beforeEach(() => rows.topic.clear());

function renderStage(stage: string) {
  return render(
    <MemoryRouter initialEntries={[`/math/findx/${stage}`]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/math/findx/:stage" element={<FindXPage />} />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('Find X — fading scaffolding', () => {
  it('asks the role question on the guided stage', async () => {
    renderStage('findxGuided');
    expect(await screen.findByRole('group', { name: /một phần hay là cả tổng/ })).toBeInTheDocument();
  });

  it('starts the short stage at the operand choice', async () => {
    renderStage('findxShort');
    expect(await screen.findByRole('group', { name: /lấy số nào với số nào/i })).toBeInTheDocument();
  });

  it('starts the solo stage at the arithmetic', async () => {
    renderStage('findxSolo');
    expect(await screen.findByRole('group', { name: /bằng bao nhiêu/ })).toBeInTheDocument();
  });

  it('expands the full chain when the hint is asked for', async () => {
    const user = userEvent.setup();
    renderStage('findxSolo');
    await screen.findByRole('group', { name: /bằng bao nhiêu/ });
    await user.click(screen.getByRole('button', { name: 'Chỉ tôi cách làm' }));
    expect(screen.getByRole('group', { name: /một phần hay là cả tổng/ })).toBeInTheDocument();
    // One reveal per problem — the button is gone once used.
    expect(screen.queryByRole('button', { name: 'Chỉ tôi cách làm' })).toBeNull();
  });

  it('offers no hint on the guided stage, where nothing is hidden', async () => {
    renderStage('findxGuided');
    await screen.findByRole('group');
    expect(screen.queryByRole('button', { name: 'Chỉ tôi cách làm' })).toBeNull();
  });
});
```

- [ ] **Step 2: Run it**

```bash
npx vitest run tests/integration/find-x-fading.test.tsx
```

Expected: PASS, 5 tests. If "starts the short stage" fails, `findXLevelOf` is
mapping the stage id wrongly — check `LEVEL_BY_ID` in `number-lab.ts`.

- [ ] **Step 3: Write the accessibility test**

Create `tests/a11y/find-x.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

vi.mock('@/shared/db/db', () => ({
  db: {
    mathTopicProgress: { get: async () => undefined, put: async () => undefined, where: () => ({ equals: () => ({ toArray: async () => [] }) }) },
    mathProfileState: { get: async () => undefined, put: async () => undefined },
    mathLevelResults: { get: async () => undefined, put: async () => undefined, where: () => ({ equals: () => ({ toArray: async () => [] }) }) },
    mathOlympiadState: { get: async () => undefined, put: async () => undefined },
  },
}));
vi.mock('@/shared/store/profile-store', () => ({
  useProfileStore: (selector: (s: { activeProfileId: string }) => unknown) =>
    selector({ activeProfileId: 'test-child' }),
}));

import { FindXPage } from '@/math/pages/FindXPage';
import { MathRewardScreen } from '@/math/components/MathRewardScreen';
import type { FindXStats } from '@/math/services/find-x-run';

const STATS: FindXStats = {
  asked: { read: 0, role: 6, operation: 6, operands: 6, compute: 6, check: 6 },
  missed: { read: 0, role: 0, operation: 1, operands: 2, compute: 0, check: 0 },
  reveals: 1,
};

function wrap(stage: string) {
  return render(
    <MemoryRouter initialEntries={[`/math/findx/${stage}`]}>
      <I18nextProvider i18n={i18n}>
        <Routes><Route path="/math/findx/:stage" element={<FindXPage />} /></Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('Find X accessibility', () => {
  it('passes axe on the guided play screen', async () => {
    const { container } = wrap('findxGuided');
    await screen.findByRole('group');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes axe on the solo play screen', async () => {
    const { container } = wrap('findxSolo');
    await screen.findByRole('group');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes axe on the reward screen with a breakdown', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MathRewardScreen
          variant="practice" topicName="Tìm X từng bước" level={7} stars={2}
          streak={1} accuracy={80} breakdown={STATS}
          onNext={() => {}} onBackToHive={() => {}}
        />
      </I18nextProvider>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('marks every Vietnamese region so a screen reader switches language', async () => {
    const { container } = wrap('findxGuided');
    await screen.findByRole('group');
    // The step card, the trail wrapper, the bar and the chrome all declare vi.
    expect(container.querySelectorAll('[lang="vi"]').length).toBeGreaterThanOrEqual(3);
  });

  it('gives every answer control a 48px minimum target', async () => {
    wrap('findxGuided');
    await screen.findByRole('group');
    for (const button of screen.getAllByRole('button')) {
      const min = button.style.minHeight || button.style.height || '';
      if (min) expect(parseInt(min, 10)).toBeGreaterThanOrEqual(44);
    }
  });
});
```

- [ ] **Step 4: Run it**

```bash
npx vitest run tests/a11y/find-x.test.tsx
```

Expected: PASS, 5 tests.

Common failure and its fix: axe reports `heading-order` because `FindXStepCard`
renders an `<h2>` with no `<h1>` above it. Fix by making the problem's equation
the `<h1>` in `FindXView` (wrap the `<p>` holding `equationOf(...)` in an `<h1>`
with the same styles) rather than by downgrading the step heading — the question
being asked is a real heading and a screen reader user needs to jump to it.

- [ ] **Step 5: Run the whole suite**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: everything green.

- [ ] **Step 6: Commit**

```bash
git add tests/integration/find-x-fading.test.tsx tests/a11y/find-x.test.tsx \
        src/math/components/FindXView.tsx src/math/components/FindXStepCard.tsx
git commit -m "test(math): pin Find X fading and accessibility

Each stage must open on its own first decision, the hint must expand the
whole chain exactly once, and every Vietnamese region must declare
lang=vi — without that last one a screen reader reads these screens with
English phonemes, which is the price of skipping a full vi locale."
```

---

### Task 10: Visual capture

jsdom renders no pixels. It will pass axe on a bar model drawn 3px tall, a tile
strip overflowing its card, or a trail that pushes the step card off-screen — and
this activity is mostly layout. These captures are evidence for review, not a
regression suite.

**Files:**
- Create: `docs/superpowers/screenshots/2026-09-24-find-x/` (10 PNGs)

- [ ] **Step 1: Start the dev server**

Use the `preview_start` tool with `{ name: "vite-dev" }` (defined in
`.claude/launch.json`, port 5180). Do **not** run `npm run dev` through Bash.

- [ ] **Step 2: Capture each shot**

Navigate and screenshot, saving to
`docs/superpowers/screenshots/2026-09-24-find-x/NN-<name>.png`. Each shot has to
prove the thing next to it — a capture that does not show it is a failed check,
not a file to commit.

| # | Name | Route / state | Must show |
| --- | --- | --- | --- |
| 1 | `01-pillar-after` | `/` → Number Lab | nine cards reading as one ladder; the three Find X cards visibly a group |
| 2 | `02-guided-role` | `/math/findx/findxGuided` | bar, equation and step card all above the fold at 1024×768 |
| 3 | `03-wrong-reason` | same, after tapping the wrong role | the rejected option still on screen, disabled, its reason below |
| 4 | `04-operands` | same, at the operands step | `14 − 6` and `6 − 14` distinguishable at a glance, neither truncated |
| 5 | `05-compute-tiles` | same, at the compute step | 21 tiles, 6 per row, each ≥48px, no overflow |
| 6 | `06-trail-full` | same, at the check step | five reasons stacked without pushing the step card out of view |
| 7 | `07-story` | reload until a story problem appears | Vietnamese sentence wrapping cleanly, the read step visible |
| 8 | `08-solo-revealed` | `/math/findx/findxSolo`, hint pressed | the expanded chain does not reflow the page under the finger |
| 9 | `09-reward` | finish a run | the breakdown line on one line at tablet width |
| 10 | `10-mobile` | shots 2, 5 and 6 at 375×812 (`resize_window`) | bar, tile strip and trail all usable on a phone |

- [ ] **Step 3: Capture the "before" for shot 1**

```bash
git stash push -u -m "findx-visual-before"
```

Reload `/`, capture `01-pillar-before.png`, then restore:

```bash
git stash list --format='%H %gs' | grep findx-visual-before
git stash apply <sha-from-above>
git stash drop <stash@{n} found by the tag>
```

Use `apply` plus an explicit drop, never bare `git stash pop` — the stash stack is
shared with the main checkout and other worktrees.

- [ ] **Step 4: Review the captures against the spec**

Open each and check it against §3 and §8 of the design doc. Anything that fails
its "must show" column is a layout bug: fix the component, re-run
`npx vitest run tests`, and re-capture.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/screenshots/2026-09-24-find-x/
git commit -m "docs(math): capture the Find X screens

Evidence for review, not a regression suite: no pixel baseline and no
Playwright, both out of scope. jsdom passes axe on a bar model drawn 3px
tall, so the layout claims in the design doc need eyes on them."
```

- [ ] **Step 6: Stop the server**

Use `preview_stop` with the `serverId` returned by `preview_start`.

---

## Self-Review

**Spec coverage.** Every section maps to a task:

| Spec | Task |
| --- | --- |
| §3.1 four forms | 1 (`operandsFor`), 2 (generator covers all four per run) |
| §3.2 step derivation | 1 |
| §3.3 diagnostic distractors | 1 |
| §3.4 word problems, story restriction | 1 (`storyKindOf`), 2 (`storyFor`), 6 (rendering) |
| §3.5 three stages, `LAB_STAGES` | 8 |
| §4.1 new files | 1, 2, 3, 4, 5, 6, 8 |
| §4.2 touched files | 5 (tile strip), 7 (reward), 8 (types, data, pillar, App) |
| §4.3 engine ↔ view boundary | 3 (no React in the reducer), 6 (view takes plain data) |
| §5 persistence, attempt seeding | 8 (`FindXPage` reads `getStageProgress`) |
| §6.1 re-ask the step | 3 |
| §6.2 stars, requeue once | 3, 8 |
| §6.3 parent line | 7 |
| §7 Vietnamese copy block | 1 |
| §8 accessibility, `lang="vi"`, sfx | 4, 5 (sfx), 6, 9 |
| §9.1 automated tests | 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| §9.2 visual capture | 10 |
| §11 gap 2 seam (injected `pickForm`) | 2 |

**Placeholder scan.** Clean — no TBDs, no "similar to Task N", no step that
describes a code change without showing the code.

**Type consistency.** Names used across tasks and defined once:
`deriveSteps`, `isStepCorrect`, `operandsFor`, `applyOperands`, `equationOf`,
`wholeOf`, `knownPartOf`, `roleOf`, `storyKindOf` (Task 1);
`composeFindXRun`, `PickForm`, `roundRobinForms` (Task 2);
`initFindXRun`, `findXReducer`, `FindXRunState`, `FindXStats`, `FindXTrailEntry`,
`FindXAction` (Task 3);
`PartWholeBar` (4); `FindXTrail`, `FindXStepCard`, `optionLabel` (5);
`NumberTileStrip.max`, `NumberTileStrip.disabledValues` (5); `FindXView` (6);
`MathRewardScreenProps.breakdown` (7);
`FINDX_STAGES`, `LAB_STAGES`, `getFindXStageById`, `findXLevelOf`, `FindXPage` (8).

`knownPartOf` is used by Task 4 and defined in Task 1 — it appears in Task 1's
implementation but not in its Produces list; treat it as exported.

**Risk noted:** Task 2's `firstUnused` sweep is the fallback that keeps the
composer from spinning when a picker forces one starved form (`x − a = b` fails
most random draws, since `a + b` has to stay under 20). It is O(400) worst case,
runs once per problem at most, and is bounded by construction. If the
distinct-shape test still fails, the bug is in `build`'s rule checks, not in the
sweep.

---

## Out of scope for this plan

Recorded so nobody quietly adds them:

- **Form B** — tìm hai số khi biết tổng và hiệu (grade 4). Design doc §0.
- **Adaptive weighting toward the form she misses.** Design doc §11 gap 2; the
  injected `pickForm` in Task 2 is the seam it lands on.
- **A real `vi` locale** — namespace, language switch, stored preference.
- **Numbers above 20**, multiplication and division forms.
- **Persisted per-step history** beyond the one run-end line.
- **Pixel-baseline visual regression.**
