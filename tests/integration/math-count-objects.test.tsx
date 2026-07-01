import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MathProblemPlayer } from '@/math/components/MathProblemPlayer';
import { renderWithI18n } from '../i18n-test-utils';
import type { MathProblem } from '@/math/types/math.types';

const problem: MathProblem = {
  id: 'counting.04_x',
  topicId: 'counting',
  type: 'count-objects',
  prompt: { kind: 'dots', count: 4, emoji: '🦆' },
  choices: [
    { id: 'c0', label: '3' },
    { id: 'c1', label: '4' },
    { id: 'c2', label: '5' },
  ],
  answerId: 'c1',
  narration: 'Count them. How many are there?',
};

const makeCallbacks = () => ({
  onCorrect: vi.fn(),
  onIncorrect: vi.fn(),
  onReveal: vi.fn(),
  onAdvance: vi.fn(),
});

describe('Math count-objects play-through (child counts ducks)', () => {
  it('renders four objects to count', () => {
    const { container } = renderWithI18n(<MathProblemPlayer problem={problem} callbacks={makeCallbacks()} />);
    // 4 duck glyphs in the prompt cluster (choices are numerals, not ducks)
    const ducks = [...container.querySelectorAll('span')].filter((s) => s.textContent === '🦆');
    expect(ducks.length).toBe(4);
  });

  it('tapping 4 is correct and advances', () => {
    const cb = makeCallbacks();
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={cb} />);
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(cb.onCorrect).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(cb.onAdvance).toHaveBeenCalledOnce();
  });

  it('a wrong count is gentle and offers one retry', () => {
    const cb = makeCallbacks();
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={cb} />);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(cb.onIncorrect).toHaveBeenCalledOnce();
    expect(cb.onReveal).not.toHaveBeenCalled();
  });
});
