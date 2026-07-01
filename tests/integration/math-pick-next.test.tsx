import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MathProblemPlayer } from '@/math/components/MathProblemPlayer';
import { renderWithI18n } from '../i18n-test-utils';
import type { MathProblem } from '@/math/types/math.types';

// Pattern 🔴🔵🔴🔵 ? → next is 🔴
const problem: MathProblem = {
  id: 'patterns.x',
  topicId: 'patterns',
  type: 'pick-next',
  prompt: {
    kind: 'sequence',
    sequence: [
      { id: 's0', emoji: '🔴' },
      { id: 's1', emoji: '🔵' },
      { id: 's2', emoji: '🔴' },
      { id: 's3', emoji: '🔵' },
      { id: 'q', label: '?' },
    ],
  },
  choices: [
    { id: 'c0', emoji: '🔴' },
    { id: 'c1', emoji: '🔵' },
    { id: 'c2', emoji: '🟢' },
  ],
  answerId: 'c0',
  narration: 'What comes next?',
};

const makeCallbacks = () => ({
  onCorrect: vi.fn(),
  onIncorrect: vi.fn(),
  onReveal: vi.fn(),
  onAdvance: vi.fn(),
});

describe('Math pick-next play-through (child continues a pattern)', () => {
  it('shows the sequence with a "?" placeholder', () => {
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={makeCallbacks()} />);
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('What comes next?')).toBeInTheDocument();
  });

  it('tapping the correct next item advances', () => {
    const cb = makeCallbacks();
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={cb} />);
    fireEvent.click(screen.getByRole('button', { name: '🔴' }));
    expect(cb.onCorrect).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(cb.onAdvance).toHaveBeenCalledOnce();
  });

  it('a wrong continuation is gentle (one retry)', () => {
    const cb = makeCallbacks();
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={cb} />);
    fireEvent.click(screen.getByRole('button', { name: '🟢' }));
    expect(cb.onIncorrect).toHaveBeenCalledOnce();
    expect(cb.onReveal).not.toHaveBeenCalled();
  });
});
