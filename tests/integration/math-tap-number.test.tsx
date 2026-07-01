import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MathProblemPlayer } from '@/math/components/MathProblemPlayer';
import { renderWithI18n } from '../i18n-test-utils';
import type { MathProblem } from '@/math/types/math.types';

const problem: MathProblem = {
  id: 'addition.2plus3',
  topicId: 'addition',
  type: 'tap-number',
  prompt: { kind: 'expression', value: '2 + 3' },
  choices: [
    { id: 'c0', label: '4' },
    { id: 'c1', label: '5' },
    { id: 'c2', label: '6' },
  ],
  answerId: 'c1',
  narration: 'What is two plus three?',
};

const makeCallbacks = () => ({
  onCorrect: vi.fn(),
  onIncorrect: vi.fn(),
  onReveal: vi.fn(),
  onAdvance: vi.fn(),
});

describe('Math tap-number play-through (child solves an addition problem)', () => {
  it('shows the question caption and choices', () => {
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={makeCallbacks()} />);
    expect(screen.getByText('What is two plus three?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
  });

  it('tap correct → onCorrect, then Next → onAdvance', () => {
    const cb = makeCallbacks();
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={cb} />);
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(cb.onCorrect).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(cb.onAdvance).toHaveBeenCalledOnce();
  });

  it('first wrong tap is gentle (onIncorrect, one retry), second reveals the answer', () => {
    const cb = makeCallbacks();
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={cb} />);
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(cb.onIncorrect).toHaveBeenCalledOnce();
    expect(cb.onReveal).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '6' }));
    expect(cb.onReveal).toHaveBeenCalledOnce();
  });

  it('renders no red / negative feedback styling', () => {
    const { container } = renderWithI18n(<MathProblemPlayer problem={problem} callbacks={makeCallbacks()} />);
    expect(container.querySelectorAll('[style*="red"], .error, .wrong').length).toBe(0);
  });
});
