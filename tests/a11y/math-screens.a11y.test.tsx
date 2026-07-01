import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { MathProblemPlayer } from '@/math/components/MathProblemPlayer';
import { ShapeGlyph } from '@/math/components/ShapeGlyph';
import { MathCelebrationScreen } from '@/math/components/MathCelebrationScreen';
import { MathAchievementsBanner } from '@/math/components/MathAchievementsBanner';
import { MATH_ACHIEVEMENT_IDS } from '@/shared/constants/game-constants';
import type { MathProblem } from '@/math/types/math.types';
import type { ReactElement } from 'react';

const callbacks = {
  onCorrect: () => {}, onIncorrect: () => {}, onReveal: () => {}, onAdvance: () => {},
};

const problem = (over: Partial<MathProblem>): MathProblem => ({
  id: 'p', topicId: 'numbers', type: 'tap-number',
  prompt: { kind: 'numeral', value: 3 },
  choices: [{ id: 'c0', label: '2' }, { id: 'c1', label: '3' }, { id: 'c2', label: '4' }],
  answerId: 'c1', narration: 'Find the number three.',
  ...over,
});

function wrap(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('A11y: Math screens', () => {
  it('tap-number problem has no violations', async () => {
    const { container } = wrap(<MathProblemPlayer problem={problem({})} callbacks={callbacks} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('tap-shape problem has no violations', async () => {
    const p = problem({
      type: 'tap-shape', prompt: { kind: 'shape-name', value: 'triangle' },
      choices: [{ id: 'c0', shape: 'circle' }, { id: 'c1', shape: 'triangle' }, { id: 'c2', shape: 'square' }],
      narration: 'Tap the triangle.',
    });
    const { container } = wrap(<MathProblemPlayer problem={p} callbacks={callbacks} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('count-objects problem has no violations', async () => {
    const p = problem({
      type: 'count-objects', prompt: { kind: 'dots', count: 4, emoji: '🦆' }, narration: 'How many?',
    });
    const { container } = wrap(<MathProblemPlayer problem={p} callbacks={callbacks} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('ShapeGlyph with a title is labelled (img role)', async () => {
    const { container } = wrap(<ShapeGlyph shape="star" title="star" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('celebration screen with an achievement banner has no violations', async () => {
    const { container } = wrap(
      <MathCelebrationScreen
        onDone={() => {}}
        banner={<MathAchievementsBanner achievementIds={[MATH_ACHIEVEMENT_IDS.FIRST_STEPS]} />}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
