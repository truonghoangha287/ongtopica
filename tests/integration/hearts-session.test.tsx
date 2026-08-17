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
import { getWordSet } from '@/data/yle-starters/index';
import { HEARTS_ROW_RESERVED_HEIGHT } from '@/shared/constants/game-constants';
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
/** The activity wrapper div: the progress dots' direct parent. */
const activityWrapper = () => screen.getByRole('progressbar').parentElement as HTMLElement;
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
    await tick(900);
  });

  it('spends the heart synchronously with the reveal, so an immediate Next still ends the round', async () => {
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 1);

    tapWrongPicture('cat'); // first wrong tap: the free retry
    await tick(0);
    tapWrongPicture('cat'); // second wrong tap: reveals the answer and must spend the heart right away

    // No waitFor/tick here on purpose: the heart must already be spent in this
    // same synchronous commit, without waiting on the two Dexie round-trips
    // inside recordIncorrect to settle.
    expect(heartRow()).toHaveTextContent('0 of 1 hearts left');

    // Tapping Next immediately (racing the still-pending Dexie writes) must end
    // the round rather than silently advancing past it.
    fireEvent.click(nextButton());
    expect(screen.getByText(/out of hearts/i)).toBeTruthy();

    await tick(900); // let the pending writes settle before teardown
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
    await tick(900);
  });

  it('an Unscramble shatter costs a heart', async () => {
    renderSession(makeSession([['cat', 'unscramble']]), 3);
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    // 't' is wrong for position 2 (expects 'a') → the placed letters shatter
    fireEvent.click(screen.getByRole('button', { name: 'letter t' }));
    await waitFor(() => expect(heartRow()).toHaveTextContent('2 of 3 hearts left'));
    await tick(600);
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
    await tick(900);
  });

  it('the last shatter ends the session only after the break animation', async () => {
    renderSession(makeSession([['cat', 'unscramble']]), 1);
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    fireEvent.click(screen.getByRole('button', { name: 'letter t' }));
    // The break lands first.
    expect(screen.queryByText(/out of hearts/i)).toBeNull();
    await tick(600);
    expect(screen.getByText(/out of hearts/i)).toBeTruthy();
  });

  it('Try again restarts at the first word with a full heart row', async () => {
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 1);
    tapWrongPicture('cat');
    await tick(0);
    tapWrongPicture('cat');
    // The heart itself is spent synchronously with the reveal; this waitFor is
    // just for the assertion to read the committed DOM, not to outlast the
    // (unrelated) Dexie round-trips still in flight from recordIncorrect.
    await waitFor(() => expect(heartRow()).toHaveTextContent('0 of 1 hearts left'));
    fireEvent.click(nextButton());
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => expect(heartRow()).toHaveTextContent('1 of 1 hearts left'));
    expect(itemOnScreen()).toBe(1);
    await tick(900);
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
    await waitFor(() => expect(heartRow()).toHaveTextContent('0 of 1 hearts left'));
    fireEvent.click(nextButton());
    expect(screen.getByText(/out of hearts/i)).toBeTruthy();

    // Nothing is rolled back when the round ends early.
    const row = await db.wordProgress.get('child-1:animals.cat');
    expect(row).toBeTruthy();
    expect(row!.wordId).toBe('animals.cat');
    await tick(900);
  });

  it('hearts on: the activity wrapper reserves top space so content cannot ride up under the heart row', () => {
    renderSession(makeSession([['cat', 'recognize']]), 3);
    expect(heartRow()).toBeTruthy();
    expect(activityWrapper().style.paddingTop).toBe(`${HEARTS_ROW_RESERVED_HEIGHT}px`);
  });

  it('hearts off: the activity wrapper has no reserved space at all (unchanged layout)', () => {
    renderSession(makeSession([['cat', 'recognize']]), 0);
    expect(heartRow()).toBeNull();
    expect(activityWrapper().style.paddingTop).toBe('');
  });
});
