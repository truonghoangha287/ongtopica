import { describe, it, expect } from 'vitest';
import { BLANK, counterGroups, equationParts, equationText } from '@/math/services/equation-parts';
import { PRACTICE_STAGES, getPracticeQuiz } from '@/math/data/number-lab';
import type { QuizQuestion } from '@/math/types/math.types';

/** A tile question, which is every Number Lab band except comparison. */
function tiles(expr: string, answerValue: number): QuizQuestion {
  return {
    id: 'q', band: 1, type: 'expr', promptKey: 'p', hintKey: '',
    expr, options: [String(answerValue)], answer: 0, input: 'tiles', answerValue,
  };
}

/** A comparison question: the blank is a glyph, not a number. */
function symbols(expr: string, answerIndex: number): QuizQuestion {
  return {
    id: 'q', band: 6, type: 'expr', promptKey: 'p', hintKey: '',
    expr, options: ['<', '>', '='], answer: answerIndex, input: 'symbols',
  };
}

describe('equationText', () => {
  it('leaves a statement that already carries the blank alone', () => {
    expect(equationText(tiles('5 + ▢ = 7', 2))).toBe('5 + ▢ = 7');
    expect(equationText(tiles('▢ − 1 = 2', 3))).toBe('▢ − 1 = 2');
  });

  it('completes a bare sum into the statement it is really asking', () => {
    expect(equationText(tiles('4 + 5', 9))).toBe('4 + 5 = ▢');
    expect(equationText(tiles('10 − 2', 8))).toBe('10 − 2 = ▢');
  });

  it('draws only the box when the prompt, not an equation, asks the question', () => {
    // "One more than 8" ships the 8 in its prompt; `8 = ▢` would be a lie.
    expect(equationText(tiles('8', 9))).toBe(BLANK);
    expect(equationText(tiles('', 3))).toBe(BLANK);
  });
});

describe('equationParts', () => {
  it('marks the box and writes the current answer into it', () => {
    expect(equationParts(tiles('5 + ▢ = 7', 2), '2')).toEqual([
      { text: '5', blank: false },
      { text: '+', blank: false },
      { text: '2', blank: true },
      { text: '=', blank: false },
      { text: '7', blank: false },
    ]);
  });

  it('shows a question mark while nothing has been tapped', () => {
    const parts = equationParts(tiles('4 + 5', 9), '?');
    expect(parts[parts.length - 1]).toEqual({ text: '?', blank: true });
  });
});

describe('counterGroups', () => {
  it('lays out the two parts of a sum', () => {
    expect(counterGroups(tiles('4 + 5', 9))).toEqual([4, 5]);
    expect(counterGroups(tiles('1 + ▢ = 10', 9))).toEqual([1, 9]);
  });

  it('lays out what is left and what was taken for a subtraction', () => {
    expect(counterGroups(tiles('10 − 4 = ▢', 6))).toEqual([6, 4]);
    expect(counterGroups(tiles('▢ − 1 = 2', 3))).toEqual([2, 1]);
    expect(counterGroups(tiles('10 − 2', 8))).toEqual([8, 2]);
  });

  it('lays out both sides of a comparison, whose answer is a glyph', () => {
    expect(counterGroups(symbols('6 ▢ 5', 1))).toEqual([6, 5]);
  });

  it('counts the step for a question whose equation is only a prompt', () => {
    expect(counterGroups(tiles('8', 9))).toEqual([8, 1]);
  });

  it('gives up rather than draw a pile too big to count at a glance', () => {
    expect(counterGroups(tiles('40 + 30', 70))).toBeNull();
  });
});

describe('the shipped Number Lab bank', () => {
  it('can always show dots, and never more than fit on one line', () => {
    for (const stage of PRACTICE_STAGES) {
      for (const question of getPracticeQuiz(stage.index)) {
        const groups = counterGroups(question);
        expect(groups, `${stage.id}: ${question.expr}`).not.toBeNull();
        expect(groups![0] + groups![1]).toBeLessThanOrEqual(20);
      }
    }
  });

  it('renders exactly one box per question', () => {
    for (const stage of PRACTICE_STAGES) {
      for (const question of getPracticeQuiz(stage.index)) {
        const blanks = equationParts(question, '?').filter((p) => p.blank);
        expect(blanks, `${stage.id}: ${question.expr}`).toHaveLength(1);
      }
    }
  });
});
