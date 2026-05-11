import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UnscrambleActivity } from '@/english/vocab/components/activities/UnscrambleActivity';
import { renderWithI18n } from '../i18n-test-utils';
import type { Word } from '@/shared/types';

const word: Word = {
  id: 'animals.cat', text: 'cat',
  pictureAsset: '/assets/images/cat.webp', audioAsset: '/assets/audio/cat.mp3',
  wordSetId: 'animals', blankLetterIndex: 1, letterChoices: ['a', 'o', 'e'],
};

function makeCallbacks() {
  return { onCorrect: vi.fn(), onIncorrect: vi.fn(), onReveal: vi.fn(), onAdvance: vi.fn() };
}

// Click available letter tiles in given order (by letter content)
function clickLettersInOrder(letters: string[]) {
  for (const letter of letters) {
    const tile = screen.getAllByRole('button').find(
      (b) => b.getAttribute('aria-label') === `letter ${letter}`,
    );
    expect(tile, `letter tile "${letter}" not found in available pool`).toBeTruthy();
    fireEvent.click(tile!);
  }
}

describe('UnscrambleActivity', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

  it('renders answer slots for each letter', () => {
    renderWithI18n(<UnscrambleActivity word={word} callbacks={makeCallbacks()} />);
    const slots = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-label')?.includes('slot'));
    expect(slots.length).toBe(3);
  });

  it('seeded shuffle is deterministic across re-renders', () => {
    const { unmount } = renderWithI18n(<UnscrambleActivity word={word} callbacks={makeCallbacks()} />);
    const tiles1 = screen.getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label')?.startsWith('letter'))
      .map((b) => b.textContent);
    unmount();
    renderWithI18n(<UnscrambleActivity word={word} callbacks={makeCallbacks()} />);
    const tiles2 = screen.getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label')?.startsWith('letter'))
      .map((b) => b.textContent);
    expect(tiles1).toEqual(tiles2);
  });

  it('tile tap auto-fills the next empty slot (no slot-tap needed)', () => {
    renderWithI18n(<UnscrambleActivity word={word} callbacks={makeCallbacks()} />);
    const firstTile = screen.getAllByRole('button').find(
      (b) => b.getAttribute('aria-label')?.startsWith('letter'),
    )!;
    const letter = firstTile.textContent!;
    fireEvent.click(firstTile);
    expect(screen.getByRole('button', { name: `slot 1: ${letter}` })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'empty slot 2' })).toBeTruthy();
  });

  it('tapping a filled slot returns the letter to the available pool', () => {
    renderWithI18n(<UnscrambleActivity word={word} callbacks={makeCallbacks()} />);
    const firstTile = screen.getAllByRole('button').find(
      (b) => b.getAttribute('aria-label')?.startsWith('letter'),
    )!;
    const letter = firstTile.textContent!;
    fireEvent.click(firstTile);
    const filledSlot = screen.getByRole('button', { name: `slot 1: ${letter}` });
    fireEvent.click(filledSlot);
    expect(screen.getByRole('button', { name: `letter ${letter}` })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'empty slot 1' })).toBeTruthy();
  });

  it('calls onCorrect when correct word assembled; advance button triggers onAdvance', () => {
    const callbacks = makeCallbacks();
    renderWithI18n(<UnscrambleActivity word={word} callbacks={callbacks} />);
    clickLettersInOrder(['c', 'a', 't']);
    expect(callbacks.onCorrect).toHaveBeenCalledOnce();
    expect(callbacks.onIncorrect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(callbacks.onAdvance).toHaveBeenCalledOnce();
  });

  it('shows error state and resets tiles on incorrect arrangement (within retries)', async () => {
    const callbacks = makeCallbacks();
    renderWithI18n(<UnscrambleActivity word={word} callbacks={callbacks} />);
    clickLettersInOrder(['t', 'a', 'c']); // wrong order → "tac"
    expect(callbacks.onIncorrect).toHaveBeenCalledTimes(1);
    expect(callbacks.onCorrect).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(700); });
    await waitFor(() => {
      const emptySlots = screen.getAllByRole('button').filter(
        (b) => b.getAttribute('aria-label')?.startsWith('empty slot'),
      );
      expect(emptySlots.length).toBe(3);
    });
  });

  it('calls onReveal after MAX_RETRIES exhausted; no further interaction', async () => {
    const callbacks = makeCallbacks();
    renderWithI18n(<UnscrambleActivity word={word} callbacks={callbacks} />);
    // First wrong attempt
    clickLettersInOrder(['t', 'a', 'c']);
    expect(callbacks.onIncorrect).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(700); });
    // Second wrong attempt — retries exhausted → onReveal
    await waitFor(() => expect(
      screen.getAllByRole('button').some((b) => b.getAttribute('aria-label')?.startsWith('letter')),
    ).toBe(true));
    clickLettersInOrder(['t', 'a', 'c']);
    expect(callbacks.onReveal).toHaveBeenCalledOnce();
    expect(callbacks.onCorrect).not.toHaveBeenCalled();
  });
});
