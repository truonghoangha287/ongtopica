import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithI18n } from '../i18n-test-utils';
import { FindXView } from '@/math/components/FindXView';
import { initFindXRun, findXReducer } from '@/math/services/find-x-run';
import type { FindXRunState } from '@/math/services/find-x-run';
import type { FindXProblem } from '@/math/types/find-x.types';

const P: FindXProblem = { id: 'v1', form: 'x+a=b', a: 6, b: 14, x: 8 };
const P2: FindXProblem = { id: 'v3', form: 'x+a=b', a: 5, b: 12, x: 7 };
const STORY: FindXProblem = { id: 'v2', form: 'a+x=b', a: 6, b: 14, x: 8, story: 'birds' };

const noop = { onAnswer: vi.fn(), onNext: vi.fn(), onReveal: vi.fn(), onExit: vi.fn() };

function view(state: FindXRunState, level = 'guided') {
  return renderWithI18n(
    <FindXView state={state} stageIcon="🧭" stageName={`Tìm X ${level}`} {...noop} />,
  );
}

/** Answer every remaining step of the current problem correctly. */
function solve(start: FindXRunState): FindXRunState {
  let s = start;
  while (!s.problemComplete) {
    const step = s.steps[s.stepIndex];
    const value = step.input === 'tiles'
      ? step.options.find((o) => o.correct)!.value!
      : step.options.findIndex((o) => o.correct);
    s = findXReducer(s, { type: 'answer', value });
  }
  return s;
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

  it.each(['solo', 'short'] as const)('offers the hint button below the guided level (%s)', (level) => {
    view(initFindXRun([P], level));
    expect(screen.getByRole('button', { name: 'Chỉ tôi cách làm' })).toBeInTheDocument();
  });

  it('hides the hint button on the guided level, where nothing is left to reveal', () => {
    view(initFindXRun([P], 'guided'));
    expect(screen.queryByRole('button', { name: 'Chỉ tôi cách làm' })).toBeNull();
  });

  it('swaps the step card for a continue button when the problem is done', () => {
    view(solve(initFindXRun([P], 'solo')));
    expect(screen.getByRole('button', { name: 'Xong rồi' })).toBeInTheDocument();
    // FindXStepCard is the only element in this tree with role="group" — its
    // absence is what "swaps" (rather than merely "adds a button") means.
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('labels the continue button "Tiếp tục" when more problems remain, not "Xong rồi"', () => {
    view(solve(initFindXRun([P, P2], 'solo')));
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeInTheDocument();
  });

  it('puts the step card ahead of the trail, so a long trail cannot bury the question', () => {
    // The trail grows ~67px per decided step. Rendered first, it pushed the step
    // card below the fold by the check step — a question the child could not see.
    let s = initFindXRun([P], 'guided');
    const step = s.steps[s.stepIndex];
    s = findXReducer(s, { type: 'answer', value: step.options.findIndex((o) => o.correct) });

    const { container } = view(s);
    const card = container.querySelector('[role="group"]')!;
    const list = container.querySelector('ol')!;
    expect(card).not.toBeNull();
    expect(list).not.toBeNull();
    // DOCUMENT_POSITION_FOLLOWING === the list comes after the step card.
    expect(card.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('says "Tiếp tục", not "Xong rồi", when the last problem is about to be re-asked', () => {
    // `problems.length` has not grown yet — `next()` decides the requeue after
    // this render, so the button must read the same signals `next()` does.
    let s = initFindXRun([P], 'solo');
    s = findXReducer(s, { type: 'answer', value: 0 }); // wrong tile: requeues P
    s = solve(s);
    expect(s.problems).toHaveLength(1);
    view(s);
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Xong rồi' })).toBeNull();
  });

  it('keeps the exit route and the bee instead of going blank when the run ends', () => {
    // Every run passes through this state: `next()` sets `done` and the reward
    // screen only appears once a Dexie write and `awardEconomy` have resolved.
    let s = findXReducer(solve(initFindXRun([P], 'solo')), { type: 'next' });
    expect(s.done).toBe(true);
    expect(s.problems[s.pIndex]).toBeUndefined();
    const { container } = view(s);
    expect(screen.getByRole('button', { name: 'Thoát' })).toBeInTheDocument();
    expect(container.textContent).toContain('🐝');
  });

  it('marks its own Vietnamese labels with lang=vi', () => {
    view(initFindXRun([P], 'guided'));
    expect(screen.getByText('Đúng 0')).toHaveAttribute('lang', 'vi');
    expect(screen.getByText('Bài 1 trên 1')).toHaveAttribute('lang', 'vi');
    expect(screen.getByText('Tìm số còn thiếu')).toHaveAttribute('lang', 'vi');
    expect(screen.getByText('Tìm X guided')).toHaveAttribute('lang', 'vi');
    // The exit button's only copy is its aria-label, which is Vietnamese too.
    expect(screen.getByRole('button', { name: 'Thoát' })).toHaveAttribute('lang', 'vi');
  });
});
