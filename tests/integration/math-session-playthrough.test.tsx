/**
 * Integration test: a real child plays a whole math session start → finish.
 *
 * Renders the actual MathSessionPlayer and taps the correct answer + Next through
 * every problem, asserting the celebration screen appears at the end. With no
 * active profile the progress hooks no-op (no IndexedDB needed in jsdom).
 */
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MathSessionPlayer } from '@/math/components/MathSessionPlayer';
import { useMathSessionStore } from '@/math/store/math-session-store';
import { useProfileStore } from '@/shared/store/profile-store';
import { renderWithI18n } from '../i18n-test-utils';
import type { MathProblem, MathSession } from '@/math/types/math.types';

const tapNumber = (id: string, answer: string, wrong: string): MathProblem => ({
  id,
  topicId: 'numbers',
  type: 'tap-number',
  prompt: { kind: 'numeral', value: answer },
  choices: [
    { id: 'c0', label: wrong },
    { id: 'c1', label: answer },
    { id: 'c2', label: String(Number(answer) + 2) },
  ],
  answerId: 'c1',
  narration: `Find the number.`,
});

const session: MathSession = {
  id: 's1',
  topicId: 'numbers',
  problems: [
    tapNumber('numbers.a', '5', '3'),
    tapNumber('numbers.b', '2', '4'),
    tapNumber('numbers.c', '7', '1'),
  ],
  createdAt: 0,
};

describe('Math full-session play-through', () => {
  beforeEach(() => {
    // Ensure no active profile → progress hooks no-op (no IndexedDB), and a clean store.
    useProfileStore.setState({ activeProfileId: null });
    useMathSessionStore.getState().clearSession();
  });

  it('answers every problem correctly and reaches the celebration screen', async () => {
    const onComplete = vi.fn();
    renderWithI18n(
      <MathSessionPlayer session={session} onSessionComplete={onComplete} onExit={vi.fn()} />,
    );

    for (const answer of ['5', '2', '7']) {
      // The current problem's correct numeral tile is on screen.
      fireEvent.click(screen.getByRole('button', { name: answer }));
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    }

    // Celebration heading from the math namespace.
    expect(await screen.findByText('Great math! 🌟')).toBeInTheDocument();
    // Tapping Done completes the session.
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('exposes a progress bar across the session', () => {
    renderWithI18n(
      <MathSessionPlayer session={session} onSessionComplete={vi.fn()} onExit={vi.fn()} />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '3');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
  });

  it('the exit control is always reachable (no dead-ends)', () => {
    const onExit = vi.fn();
    renderWithI18n(
      <MathSessionPlayer session={session} onSessionComplete={vi.fn()} onExit={onExit} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /exit/i }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
