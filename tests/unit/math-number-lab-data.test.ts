import { describe, it, expect } from 'vitest';
import bank from '@/math/data/banks/numberlab.json';
import { PRACTICE_STAGES, getPracticeQuiz } from '@/math/data/number-lab';
import {
  NUMBER_TILE_MAX,
  NUMBER_TILE_MIN,
  PRACTICE_STAGE_COUNT,
  PRACTICE_STAGE_SIZE,
  PRACTICE_WINDOWS,
  TEN_FRAME_CELLS,
} from '@/math/constants/math-constants';
import type { QuizQuestion } from '@/math/types/math.types';
import en from '@/locales/en/math.json';

const QUESTIONS = bank as unknown as QuizQuestion[];

/** Resolve a dotted i18n key against the English math namespace. */
function resolveKey(key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in node) return (node as Record<string, unknown>)[part];
    return undefined;
  }, en);
}

/** Identity of a rendered question, ignoring its generated id. */
function fingerprint(q: QuizQuestion): string {
  return `${q.input}|${q.expr}|${q.answerValue ?? q.options[q.answer]}`;
}

/** Every integer literal appearing in an expression. */
function numeralsIn(expr: string): number[] {
  return (expr.match(/\d+/g) ?? []).map(Number);
}

describe('Number Lab bank shape', () => {
  it('is non-empty and every stage holds a full set of rotating windows', () => {
    expect(QUESTIONS.length).toBe(PRACTICE_STAGE_COUNT * PRACTICE_STAGE_SIZE * PRACTICE_WINDOWS);
    for (const stage of PRACTICE_STAGES) {
      const stageQuestions = QUESTIONS.filter((q) => q.band === stage.index);
      expect(stageQuestions.length).toBe(PRACTICE_STAGE_SIZE * PRACTICE_WINDOWS);
    }
  });

  it('has unique ids and valid stage bands', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of QUESTIONS) {
      expect(q.band).toBeGreaterThanOrEqual(1);
      expect(q.band).toBeLessThanOrEqual(PRACTICE_STAGE_COUNT);
    }
  });

  it('answers every question with tiles or symbols, never a four-option guess', () => {
    for (const q of QUESTIONS) {
      expect(['tiles', 'symbols']).toContain(q.input);
    }
  });

  it('keeps tile questions to a single correct label matching answerValue', () => {
    for (const q of QUESTIONS.filter((x) => x.input === 'tiles')) {
      expect(q.options).toEqual([String(q.answerValue)]);
      expect(q.answer).toBe(0);
      expect(q.answerValue).toBeGreaterThanOrEqual(NUMBER_TILE_MIN);
      expect(q.answerValue).toBeLessThanOrEqual(NUMBER_TILE_MAX);
    }
  });

  it('offers the comparison glyphs in fixed order with a matching answer', () => {
    for (const q of QUESTIONS.filter((x) => x.input === 'symbols')) {
      expect(q.options).toEqual(['<', '>', '=']);
      const [a, b] = numeralsIn(q.expr ?? '');
      const expected = a < b ? 0 : a > b ? 1 : 2;
      expect(q.answer).toBe(expected);
    }
  });

  it('never shows a number above 10 — the whole point of the ≤10 scope', () => {
    for (const q of QUESTIONS) {
      for (const n of numeralsIn(q.expr ?? '')) {
        expect(n).toBeLessThanOrEqual(NUMBER_TILE_MAX);
      }
    }
  });

  it('keeps every ten-frame scaffold within the frame', () => {
    for (const q of QUESTIONS.filter((x) => typeof x.tenFrame === 'number')) {
      expect(q.tenFrame).toBeGreaterThanOrEqual(0);
      expect(q.tenFrame).toBeLessThanOrEqual(TEN_FRAME_CELLS);
    }
  });

  it('serves every distinct question a stage has before repeating any of it', () => {
    // 0..10 is a small world — bonds to 10 have only 27 distinct forms — so a
    // 150-question stage must repeat. It must not repeat *early*: nothing comes
    // back until everything the stage can offer has been asked once.
    for (const stage of PRACTICE_STAGES) {
      const prints = QUESTIONS.filter((q) => q.band === stage.index).map(fingerprint);
      const seen = new Set<string>();
      const firstRepeat = prints.findIndex((f) => (seen.has(f) ? true : (seen.add(f), false)));
      expect(firstRepeat, stage.id).toBe(new Set(prints).size);
    }
  });

  it('resolves every prompt and hint key in the English locale', () => {
    for (const q of QUESTIONS) {
      expect(typeof resolveKey(q.promptKey), q.promptKey).toBe('string');
      expect(typeof resolveKey(q.hintKey), q.hintKey).toBe('string');
    }
  });
});

describe('Number Lab arithmetic', () => {
  /** Re-derive the answer from the printed expression, for all six forms. */
  const CASES: Array<{ re: RegExp; answer: (n: number[]) => number }> = [
    { re: /^(\d+) \+ (\d+)$/, answer: ([a, b]) => a + b },
    { re: /^(\d+) − (\d+)$/, answer: ([a, b]) => a - b },
    { re: /^▢ \+ (\d+) = (\d+)$/, answer: ([b, c]) => c - b },
    { re: /^(\d+) \+ ▢ = (\d+)$/, answer: ([a, c]) => c - a },
    { re: /^(\d+) − (\d+) = ▢$/, answer: ([a, b]) => a - b },
    { re: /^▢ − (\d+) = (\d+)$/, answer: ([b, c]) => b + c },
    { re: /^(\d+) − ▢ = (\d+)$/, answer: ([a, c]) => a - c },
  ];

  it('states an answer that the expression actually implies', () => {
    const tiles = QUESTIONS.filter((q) => q.input === 'tiles');
    let checked = 0;
    for (const q of tiles) {
      const expr = q.expr ?? '';
      const match = CASES.find((c) => c.re.test(expr));
      if (!match) continue; // one-more / one-less carry their operation in the prompt
      const nums = numeralsIn(expr);
      expect(q.answerValue, expr).toBe(match.answer(nums));
      checked++;
    }
    // Guard against the regexes silently matching nothing.
    expect(checked).toBeGreaterThan(tiles.length / 2);
  });

  it('derives one more / one less from the number shown', () => {
    for (const q of QUESTIONS) {
      const n = Number(q.vars?.n);
      if (Number.isNaN(n)) continue;
      const delta = q.promptKey.endsWith('oneMore.prompt') ? 1 : -1;
      expect(q.answerValue, q.expr).toBe(n + delta);
    }
  });
});

describe('Number Lab fact families', () => {
  it('emits each pair adjacently, with the second question undoing the first', () => {
    const pairs = QUESTIONS.filter((q) => q.promptKey.includes('.factAdd.'));
    expect(pairs.length).toBeGreaterThan(0);
    for (const first of pairs) {
      const i = QUESTIONS.indexOf(first);
      const second = QUESTIONS[i + 1];
      expect(second?.promptKey, `after ${first.expr}`).toContain('.factRelated.');
      // The pair must describe the same fact: a + b = c, then c − b = a.
      expect(second.vars).toEqual(first.vars);
      expect(first.answerValue).toBe(Number(first.vars?.c));
      expect(second.answerValue).toBe(Number(second.vars?.a));
    }
  });

  it('never splits a pair across a window boundary', () => {
    for (const stage of PRACTICE_STAGES) {
      for (let attempt = 1; attempt <= PRACTICE_WINDOWS; attempt++) {
        const window = getPracticeQuiz(stage.index, attempt);
        const adds = window.filter((q) => q.promptKey.includes('.factAdd.')).length;
        const relateds = window.filter((q) => q.promptKey.includes('.factRelated.')).length;
        expect(adds).toBe(relateds);
      }
    }
  });
});

describe('getPracticeQuiz', () => {
  it('serves one full, duplicate-free window per attempt', () => {
    for (const stage of PRACTICE_STAGES) {
      for (let attempt = 1; attempt <= PRACTICE_WINDOWS; attempt++) {
        const window = getPracticeQuiz(stage.index, attempt);
        expect(window.length).toBe(PRACTICE_STAGE_SIZE);
        expect(window.every((q) => q.band === stage.index)).toBe(true);
        const fingerprints = window.map((q) => `${q.expr}|${q.options[q.answer]}`);
        expect(new Set(fingerprints).size).toBe(fingerprints.length);
      }
    }
  });

  it('works through the whole stage before a question comes round again', () => {
    for (const stage of PRACTICE_STAGES) {
      const served = new Set<string>();
      for (let attempt = 1; attempt <= PRACTICE_WINDOWS; attempt++) {
        for (const q of getPracticeQuiz(stage.index, attempt)) {
          expect(served.has(q.id), `${stage.id} repeated ${q.id} before the cycle wrapped`).toBe(false);
          served.add(q.id);
        }
      }
      // Fifteen runs of ten cover the stage exactly, then the cycle starts over.
      expect(served.size).toBe(PRACTICE_STAGE_SIZE * PRACTICE_WINDOWS);
      expect(QUESTIONS.filter((q) => q.band === stage.index).every((q) => served.has(q.id))).toBe(true);
    }
  });

  it('rotates windows so a replay is not the same ten questions', () => {
    const first = getPracticeQuiz(4, 1).map((q) => q.id);
    const second = getPracticeQuiz(4, 2).map((q) => q.id);
    expect(second).not.toEqual(first);
  });

  it('wraps back to the first window once every window has been played', () => {
    expect(getPracticeQuiz(4, PRACTICE_WINDOWS + 1)).toEqual(getPracticeQuiz(4, 1));
  });

  it('returns nothing for a stage that does not exist', () => {
    expect(getPracticeQuiz(PRACTICE_STAGE_COUNT + 1)).toEqual([]);
  });
});

describe('the stage that motivated the Number Lab', () => {
  it('teaches an unknown in both subtraction positions, like 10 − ▢ = 8 and ▢ − 2 = 3', () => {
    const takeaway = QUESTIONS.filter((q) => q.band === 4);
    const minuend = takeaway.filter((q) => /^▢ − \d+ = \d+$/.test(q.expr ?? ''));
    const subtrahend = takeaway.filter((q) => /^\d+ − ▢ = \d+$/.test(q.expr ?? ''));
    expect(minuend.length).toBeGreaterThan(0);
    expect(subtrahend.length).toBeGreaterThan(0);
    expect(minuend.length + subtrahend.length).toBe(takeaway.length);
  });
});
