import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MathProblemPlayer } from '@/math/components/MathProblemPlayer';
import { renderWithI18n } from '../i18n-test-utils';
import type { MathProblem } from '@/math/types/math.types';

// 🍎 🍎 🍌 → tap the one that is different (🍌)
const problem: MathProblem = {
  id: 'logic.odd_x',
  topicId: 'logic',
  type: 'odd-one-out',
  prompt: { kind: 'instruction', i18nKey: 'prompts.oddOneOut' },
  choices: [
    { id: 'c0', emoji: '🍎' },
    { id: 'c1', emoji: '🍎' },
    { id: 'c2', emoji: '🍌' },
  ],
  answerId: 'c2',
  narration: 'Which one is different?',
};

const makeCallbacks = () => ({
  onCorrect: vi.fn(),
  onIncorrect: vi.fn(),
  onReveal: vi.fn(),
  onAdvance: vi.fn(),
});

describe('Math odd-one-out play-through (child spots the odd item)', () => {
  it('shows the instruction caption', () => {
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={makeCallbacks()} />);
    expect(screen.getByText('Which one is different?')).toBeInTheDocument();
  });

  it('tapping the different item is correct and advances', () => {
    const cb = makeCallbacks();
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={cb} />);
    fireEvent.click(screen.getByRole('button', { name: '🍌' }));
    expect(cb.onCorrect).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(cb.onAdvance).toHaveBeenCalledOnce();
  });

  it('tapping a matching item is gentle (one retry)', () => {
    const cb = makeCallbacks();
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={cb} />);
    // two tiles share '🍎'; tap the first
    fireEvent.click(screen.getAllByRole('button', { name: '🍎' })[0]);
    expect(cb.onIncorrect).toHaveBeenCalledOnce();
    expect(cb.onReveal).not.toHaveBeenCalled();
  });
});
