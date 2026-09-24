import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
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
    // FindXStepCard is the only element in this tree with role="group" — its
    // absence is what "swaps" (rather than merely "adds a button") means.
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('marks its own Vietnamese labels with lang=vi', () => {
    view(initFindXRun([P], 'guided'));
    expect(screen.getByText('Đúng 0')).toHaveAttribute('lang', 'vi');
    expect(screen.getByText('Bài 1 trên 1')).toHaveAttribute('lang', 'vi');
    expect(screen.getByText('Tìm số còn thiếu')).toHaveAttribute('lang', 'vi');
  });
});
