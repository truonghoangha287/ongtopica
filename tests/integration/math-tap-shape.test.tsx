import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MathProblemPlayer } from '@/math/components/MathProblemPlayer';
import { renderWithI18n } from '../i18n-test-utils';
import type { MathProblem } from '@/math/types/math.types';

const problem: MathProblem = {
  id: 'shapes.triangle_x',
  topicId: 'shapes',
  type: 'tap-shape',
  prompt: { kind: 'shape-name', value: 'triangle' },
  choices: [
    { id: 'c0', shape: 'circle' },
    { id: 'c1', shape: 'triangle' },
    { id: 'c2', shape: 'square' },
  ],
  answerId: 'c1',
  narration: 'Tap the triangle.',
};

const makeCallbacks = () => ({
  onCorrect: vi.fn(),
  onIncorrect: vi.fn(),
  onReveal: vi.fn(),
  onAdvance: vi.fn(),
});

describe('Math tap-shape play-through (child finds a shape)', () => {
  it('labels each shape tile for screen readers', () => {
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={makeCallbacks()} />);
    expect(screen.getByRole('button', { name: 'triangle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'circle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'square' })).toBeInTheDocument();
  });

  it('tapping the triangle is correct and advances', () => {
    const cb = makeCallbacks();
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={cb} />);
    fireEvent.click(screen.getByRole('button', { name: 'triangle' }));
    expect(cb.onCorrect).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(cb.onAdvance).toHaveBeenCalledOnce();
  });

  it('tapping the wrong shape is gentle (one retry)', () => {
    const cb = makeCallbacks();
    renderWithI18n(<MathProblemPlayer problem={problem} callbacks={cb} />);
    fireEvent.click(screen.getByRole('button', { name: 'circle' }));
    expect(cb.onIncorrect).toHaveBeenCalledOnce();
    expect(cb.onReveal).not.toHaveBeenCalled();
  });
});
