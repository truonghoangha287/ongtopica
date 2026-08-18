/**
 * Integration test: optional hearts mode inside a real vocab session.
 * Renders SessionPlayer over real Animals words with a real (fake-indexeddb)
 * Dexie, and drives it the way a child would — taps only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { render, renderHook, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { useSessionStore } from '@/english/vocab/store/session-store';
import { SessionPlayer } from '@/english/vocab/components/SessionPlayer';
import { useSession } from '@/english/vocab/hooks/useSession';
import { SHATTER_ANIM_MS, HEARTS_ROW_RESERVED_HEIGHT } from '@/shared/constants/game-constants';
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
 * Tests that isolate the very last heart seed 1 to get there in one word; the
 * drain test below uses a real count of 3 so the across-words behaviour is
 * genuinely exercised.
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

  it('drains a realistic 3 hearts across separate words: 3 → 2 → 1 → 0', async () => {
    // A real Settings count, and one heart per word, so the run only reaches
    // the end screen if hearts survive advance() — which is the invariant here.
    renderSession(
      makeSession([
        ['cat', 'recognize'],
        ['dog', 'recognize'],
        ['bird', 'recognize'],
        ['cow', 'recognize'],
      ]),
      3,
    );
    expect(heartRow()).toHaveTextContent('3 of 3 hearts left');

    const failCurrentWord = async (answer: string) => {
      tapWrongPicture(answer); // the free retry
      await tick(0);
      tapWrongPicture(answer); // reveals the answer, costs a heart
      await tick(0);
    };

    await failCurrentWord('cat');
    await waitFor(() => expect(heartRow()).toHaveTextContent('2 of 3 hearts left'));
    fireEvent.click(nextButton());
    await waitFor(() => expect(itemOnScreen()).toBe(2));
    // Crossing a word boundary must not hand back the heart just spent.
    expect(heartRow()).toHaveTextContent('2 of 3 hearts left');

    await failCurrentWord('dog');
    await waitFor(() => expect(heartRow()).toHaveTextContent('1 of 3 hearts left'));
    fireEvent.click(nextButton());
    await waitFor(() => expect(itemOnScreen()).toBe(3));
    expect(heartRow()).toHaveTextContent('1 of 3 hearts left');

    await failCurrentWord('bird');
    await waitFor(() => expect(heartRow()).toHaveTextContent('0 of 3 hearts left'));
    // The fourth word is never reached: the round ends on the child's Next tap.
    expect(screen.queryByText(/out of hearts/i)).toBeNull();
    fireEvent.click(nextButton());
    expect(screen.getByText(/out of hearts/i)).toBeTruthy();
    await tick(FEEDBACK_SETTLE_MS);
  });

  it('hearts on and every answer right still reaches the celebration', async () => {
    // The out-of-hearts guard sits directly in front of advance(), which is the
    // only route to the celebration — so a clean run has to be pinned too.
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 3);

    fireEvent.click(screen.getByAltText('cat').closest('button')!);
    await tick(0);
    fireEvent.click(nextButton());
    await waitFor(() => expect(itemOnScreen()).toBe(2));

    fireEvent.click(screen.getByAltText('dog').closest('button')!);
    await tick(0);
    fireEvent.click(nextButton());

    await waitFor(() => expect(screen.getByText(/well done/i)).toBeTruthy());
    expect(screen.queryByText(/out of hearts/i)).toBeNull();
    await tick(FEEDBACK_SETTLE_MS);
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

    await tick(FEEDBACK_SETTLE_MS); // let the pending writes settle before teardown
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

/**
 * The Settings → session seam: useSession is the only code that reads the
 * stored setting and seeds the store, and every test above bypasses it by
 * calling setSession directly.
 */
describe('the stored hearts setting reaches a composed session', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
    localStorage.clear();
  });

  afterEach(async () => {
    useSessionStore.getState().clearSession();
    localStorage.clear();
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
    vi.clearAllMocks();
  });

  it('seeds heartsMax from the stored choice', async () => {
    localStorage.setItem('heartsMode', '3');
    const { result } = renderHook(() => useSession());
    await act(async () => {
      await result.current.composeSession(animals);
    });
    expect(useSessionStore.getState().heartsMax).toBe(3);
    expect(useSessionStore.getState().heartsRemaining).toBe(3);
  });

  it('seeds 0 hearts when the setting is off', async () => {
    localStorage.setItem('heartsMode', 'off');
    const { result } = renderHook(() => useSession());
    await act(async () => {
      await result.current.composeSession(animals);
    });
    expect(useSessionStore.getState().heartsMax).toBe(0);
    expect(useSessionStore.getState().heartsRemaining).toBe(0);
  });

  it('a Listen & Learn session reads the same setting', async () => {
    localStorage.setItem('heartsMode', '5');
    const { result } = renderHook(() => useSession());
    await act(async () => {
      await result.current.composeListenMatch(animals);
    });
    expect(useSessionStore.getState().heartsMax).toBe(5);
  });
});
