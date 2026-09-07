import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

vi.mock('@/shared/db/db', () => ({
  db: {
    mathTopicProgress: {
      get: async () => undefined,
      put: async () => undefined,
      where: () => ({ equals: () => ({ toArray: async () => [] }) }),
    },
    mathProfileState: { get: async () => undefined, put: async () => undefined },
    mathLevelResults: {
      get: async () => undefined,
      put: async () => undefined,
      where: () => ({ equals: () => ({ toArray: async () => [] }) }),
    },
    mathOlympiadState: { get: async () => undefined, put: async () => undefined },
  },
}));

vi.mock('@/shared/store/profile-store', () => ({
  useProfileStore: (selector: (s: { activeProfileId: string }) => unknown) =>
    selector({ activeProfileId: 'test-child' }),
}));

import { NumberLabQuizPage } from '@/math/pages/NumberLabQuizPage';
import { useMathQuizStore } from '@/math/store/math-quiz-store';
import { QUICK_REACT_SECONDS } from '@/math/constants/math-constants';

function renderStage() {
  return render(
    <MemoryRouter initialEntries={['/math/practice/takeaway']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/math/practice/:stage" element={<NumberLabQuizPage />} />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

/**
 * Advance the countdown. Each tick is a React state update that schedules the
 * next one, so the clock has to be stepped a second at a time with a flush in
 * between — a single long jump only fires the first tick.
 */
async function tick(seconds: number) {
  for (let i = 0; i < seconds; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
  }
}

/** Let the countdown run all the way out, plus the tick that fires expiry. */
async function runOutTheClock() {
  await tick(QUICK_REACT_SECONDS + 1);
}

beforeEach(() => {
  localStorage.clear();
  useMathQuizStore.getState().reset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('quick-react countdown', () => {
  it('is absent unless a grown-up has switched it on', async () => {
    renderStage();
    await screen.findByRole('group', { name: 'Numbers 0 to 10' });
    expect(screen.queryByRole('timer')).toBeNull();
  });

  it('counts down from the configured seconds when switched on', async () => {
    localStorage.setItem('mathQuickReact', 'on');
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderStage();
    await screen.findByRole('group', { name: 'Numbers 0 to 10' });

    const timer = screen.getByRole('timer');
    expect(timer.getAttribute('aria-label')).toBe(`${QUICK_REACT_SECONDS} seconds left`);
    // Per-second updates must not be announced, or they drown out the question.
    expect(timer.getAttribute('aria-live')).toBe('off');

    await tick(2);
    expect(screen.getByRole('timer').getAttribute('aria-label')).toBe(
      `${QUICK_REACT_SECONDS - 2} seconds left`,
    );
  });

  it('reveals the answer when time runs out, and costs her nothing', async () => {
    localStorage.setItem('mathQuickReact', 'on');
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderStage();
    await screen.findByRole('group', { name: 'Numbers 0 to 10' });

    const before = useMathQuizStore.getState();
    const missedId = before.questions[0].id;
    const answer = before.questions[0].answerValue;

    await runOutTheClock();

    const after = useMathQuizStore.getState();
    expect(after.checked).toBe(true);
    expect(after.timedOut).toBe(true);
    // No heart lost (there are none), no wrong answer counted against her, and
    // the question comes back around for a second look.
    expect(after.hearts).toBe(before.hearts);
    expect(after.correctCount).toBe(0);
    expect(after.requeuedIds).toEqual([missedId]);
    expect(screen.queryByRole('img', { name: /hearts/i })).toBeNull();

    expect(screen.getByRole('status').textContent).toBe(
      i18n.t('lab.timer.timeUpMood', { ns: 'math', answer: String(answer) }),
    );
    expect(screen.getByRole('button', { name: /^Continue$/ })).toBeTruthy();
  });

  it('holds the clock while feedback is on screen instead of expiring twice', async () => {
    localStorage.setItem('mathQuickReact', 'on');
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderStage();
    await screen.findByRole('group', { name: 'Numbers 0 to 10' });

    await runOutTheClock();
    const requeuedOnce = useMathQuizStore.getState().requeuedIds.length;
    await runOutTheClock();
    expect(useMathQuizStore.getState().requeuedIds.length).toBe(requeuedOnce);
  });
});
