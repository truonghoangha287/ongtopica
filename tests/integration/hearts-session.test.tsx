/**
 * Integration test: optional hearts mode inside a real vocab session.
 * Renders SessionPlayer over real Animals words with a real (fake-indexeddb)
 * Dexie, and drives it the way a child would — taps only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { useSessionStore } from '@/english/vocab/store/session-store';
import { SessionPlayer } from '@/english/vocab/components/SessionPlayer';
import { SHATTER_ANIM_MS } from '@/shared/constants/game-constants';
import { getWordSet } from '@/data/yle-starters/index';
import type { ActivityType, Session } from '@/english/vocab/types/vocab.types';

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    stop: vi.fn(),
    unload: vi.fn(),
    on: vi.fn(),
  })),
}));

const animals = getWordSet('animals')!;
const wordNamed = (text: string) => animals.words.find((w) => w.text === text)!;

function makeSession(spec: Array<[string, ActivityType]>): Session {
  return {
    id: 'hearts-test-session',
    wordSetId: 'animals',
    items: spec.map(([text, activityType]) => ({ word: wordNamed(text), activityType })),
    createdAt: 0,
    wordSetTotalCount: animals.words.length,
  };
}

/**
 * `heartsMax` is a plain number in the store; Settings only ever offers 3 or 5.
 * Tests that need to run out fast seed 1.
 */
function renderSession(session: Session, heartsMax: number) {
  useSessionStore.getState().setSession(session, heartsMax);
  return render(
    <I18nextProvider i18n={i18n}>
      <SessionPlayer session={session} onSessionComplete={vi.fn()} onExit={vi.fn()} />
    </I18nextProvider>,
  );
}

/** Let real timers (shatter animation, feedback toast) drain inside act(). */
const tick = (ms: number) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });

/**
 * Shatter timings, derived so they track SHATTER_ANIM_MS rather than pinning a
 * literal that would pass for any non-zero delay. MID lands inside the
 * animation, AFTER safely past it.
 */
const MID_SHATTER = Math.round(SHATTER_ANIM_MS * 0.6);
const AFTER_SHATTER = SHATTER_ANIM_MS + 100;
/** Long enough for the answer-feedback toast to finish and stop re-rendering. */
const FEEDBACK_SETTLE_MS = 900;

/** Tap a Recognize/Listen-Match option that is NOT the answer. */
function tapWrongPicture(answerText: string) {
  const wrong = screen
    .getAllByRole('img')
    .find((img) => img.getAttribute('alt') !== answerText);
  expect(wrong, 'no wrong option on screen').toBeTruthy();
  fireEvent.click(wrong!.closest('button')!);
}

const heartRow = () => screen.queryByTestId('heart-row');
const nextButton = () => screen.getByRole('button', { name: /next/i });
/** 1-based index of the item on screen, read off the progress dots. */
const itemOnScreen = () =>
  Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));

describe('hearts in a vocab session', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
  });

  afterEach(async () => {
    useSessionStore.getState().clearSession();
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
    vi.clearAllMocks();
  });

  it('spends exactly one heart for a failed word, and still reveals the answer', async () => {
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 3);
    expect(heartRow()).toHaveTextContent('3 of 3 hearts left');

    tapWrongPicture('cat'); // first wrong tap: the free retry
    await tick(0);
    expect(heartRow()).toHaveTextContent('3 of 3 hearts left');

    tapWrongPicture('cat'); // second wrong tap: reveals the answer, costs a heart
    await waitFor(() => expect(heartRow()).toHaveTextContent('2 of 3 hearts left'));
    // The teaching moment survives: the answer is on screen with its Next button.
    expect(nextButton()).toBeTruthy();
    expect(screen.queryByText(/out of hearts/i)).toBeNull();
    await tick(FEEDBACK_SETTLE_MS);
  });

  it('hearts off: no heart row, and a failed word never ends the session', async () => {
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 0);
    expect(heartRow()).toBeNull();

    tapWrongPicture('cat');
    await tick(0);
    tapWrongPicture('cat');
    await tick(0);
    fireEvent.click(nextButton());

    await waitFor(() => expect(itemOnScreen()).toBe(2));
    expect(screen.queryByText(/out of hearts/i)).toBeNull();
    await tick(FEEDBACK_SETTLE_MS);
  });

  it('an Unscramble shatter costs a heart and the board starts over', async () => {
    renderSession(makeSession([['cat', 'unscramble']]), 3);
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    // 't' is wrong for position 2 (expects 'a') → the placed letters shatter
    fireEvent.click(screen.getByRole('button', { name: 'letter t' }));
    await waitFor(() => expect(heartRow()).toHaveTextContent('2 of 3 hearts left'));
    // Hearts left over: no reveal, the child just tries again.
    await tick(AFTER_SHATTER);
    expect(screen.getByRole('button', { name: 'empty slot 1' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /next/i })).toBeNull();
    expect(screen.queryByText(/out of hearts/i)).toBeNull();
  });

  it('tapping Next on the last heart shows the end screen, not the next word', async () => {
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 1);
    tapWrongPicture('cat');
    await tick(0);
    tapWrongPicture('cat');
    await waitFor(() => expect(heartRow()).toHaveTextContent('0 of 1 hearts left'));
    // The answer is still on screen — nothing swaps until the child taps Next.
    expect(screen.queryByText(/out of hearts/i)).toBeNull();

    fireEvent.click(nextButton());
    expect(screen.getByText(/out of hearts/i)).toBeTruthy();
    await tick(FEEDBACK_SETTLE_MS);
  });

  it('the last shatter reveals the word, and only Next ends the session', async () => {
    renderSession(makeSession([['cat', 'unscramble']]), 1);
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    fireEvent.click(screen.getByRole('button', { name: 'letter t' }));

    // Still mid-break: nothing has replaced the shattering board yet.
    await tick(MID_SHATTER);
    expect(screen.queryByRole('button', { name: /next/i })).toBeNull();
    expect(screen.queryByText(/out of hearts/i)).toBeNull();

    // Once the break lands, the word is spelled out for the child to read —
    // the same teaching moment the other three activities always give.
    await tick(AFTER_SHATTER - MID_SHATTER);
    expect(screen.getByRole('button', { name: 'slot 1: c' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'slot 2: a' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'slot 3: t' })).toBeTruthy();
    expect(screen.queryByText(/out of hearts/i)).toBeNull();

    // The end screen waits for the child, exactly as on the reveal path.
    fireEvent.click(nextButton());
    expect(screen.getByText(/out of hearts/i)).toBeTruthy();
  });

  it('Try again restarts at the first word with a full heart row', async () => {
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 1);
    tapWrongPicture('cat');
    await tick(0);
    tapWrongPicture('cat');
    await tick(0);
    fireEvent.click(nextButton());
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => expect(heartRow()).toHaveTextContent('1 of 1 hearts left'));
    expect(itemOnScreen()).toBe(1);
    await tick(FEEDBACK_SETTLE_MS);
  });

  it('words answered correctly before running out keep their progress rows', async () => {
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 1);
    fireEvent.click(screen.getByAltText('cat').closest('button')!);
    await waitFor(async () =>
      expect(await db.wordProgress.get('child-1:animals.cat')).toBeTruthy(),
    );
    fireEvent.click(nextButton());
    await waitFor(() => expect(itemOnScreen()).toBe(2));

    tapWrongPicture('dog');
    await tick(0);
    tapWrongPicture('dog');
    await tick(0);
    fireEvent.click(nextButton());
    expect(screen.getByText(/out of hearts/i)).toBeTruthy();

    // Nothing is rolled back when the round ends early.
    const row = await db.wordProgress.get('child-1:animals.cat');
    expect(row).toBeTruthy();
    expect(row!.wordId).toBe('animals.cat');
    await tick(FEEDBACK_SETTLE_MS);
  });
});
