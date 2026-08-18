import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { UnscrambleActivity } from '@/english/vocab/components/activities/UnscrambleActivity';
import { renderWithI18n } from '../i18n-test-utils';
import type { Word } from '@/shared/types';

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    stop: vi.fn(),
    unload: vi.fn(),
    on: vi.fn(),
  })),
}));

const word: Word = {
  id: 'animals.cat', text: 'cat',
  pictureAsset: '/assets/images/cat.webp', audioAsset: '/assets/audio/cat.mp3',
  wordSetId: 'animals', blankLetterIndex: 1, letterChoices: ['a', 'o', 'e'],
};

function makeCallbacks() {
  return {
    onCorrect: vi.fn(),
    onIncorrect: vi.fn(),
    onReveal: vi.fn(),
    onAdvance: vi.fn(),
    onShatter: vi.fn(),
  };
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

  it('correct tile tap fills the next empty slot', () => {
    renderWithI18n(<UnscrambleActivity word={word} callbacks={makeCallbacks()} />);
    // 'c' is the first expected letter for "cat"
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    expect(screen.getByRole('button', { name: 'slot 1: c' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'empty slot 2' })).toBeTruthy();
  });

  it('wrong tile tap is rejected — tile stays in pool, slot stays empty', () => {
    renderWithI18n(<UnscrambleActivity word={word} callbacks={makeCallbacks()} />);
    // 'a' or 't' tapped first is wrong (position 0 expects 'c')
    fireEvent.click(screen.getByRole('button', { name: 'letter a' }));
    // All slots must still be empty — tile was not placed
    const emptySlots = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label')?.startsWith('empty slot'),
    );
    expect(emptySlots.length).toBe(3);
    // The rejected tile is still in the available pool
    expect(screen.getByRole('button', { name: 'letter a' })).toBeTruthy();
  });

  it('wrong tap after placing letters shatters and starts the word over', () => {
    renderWithI18n(<UnscrambleActivity word={word} callbacks={makeCallbacks()} />);
    // Place 'c' correctly in slot 1
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    expect(screen.getByRole('button', { name: 'slot 1: c' })).toBeTruthy();
    // Tap 't' — wrong for position 2 (expects 'a') → puzzle breaks apart
    fireEvent.click(screen.getByRole('button', { name: 'letter t' }));
    // After the breaking animation, every slot is empty again (start over)
    act(() => { vi.runAllTimers(); });
    const emptySlots = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label')?.startsWith('empty slot'),
    );
    expect(emptySlots.length).toBe(3);
    // The previously placed 'c' is back in the available pool
    expect(screen.getByRole('button', { name: 'letter c' })).toBeTruthy();
  });

  it('tapping a filled slot returns the letter to the available pool', () => {
    renderWithI18n(<UnscrambleActivity word={word} callbacks={makeCallbacks()} />);
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    fireEvent.click(screen.getByRole('button', { name: 'slot 1: c' }));
    expect(screen.getByRole('button', { name: 'letter c' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'empty slot 1' })).toBeTruthy();
  });

  it('calls onCorrect when correct word assembled; Next button triggers onAdvance', () => {
    const callbacks = makeCallbacks();
    renderWithI18n(<UnscrambleActivity word={word} callbacks={callbacks} />);
    clickLettersInOrder(['c', 'a', 't']);
    expect(callbacks.onCorrect).toHaveBeenCalledOnce();
    expect(callbacks.onIncorrect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(callbacks.onAdvance).toHaveBeenCalledOnce();
  });

  it('wrong taps do not fire onIncorrect — only correct assembly fires onCorrect', () => {
    const callbacks = makeCallbacks();
    renderWithI18n(<UnscrambleActivity word={word} callbacks={callbacks} />);
    // tap wrong tiles several times
    fireEvent.click(screen.getByRole('button', { name: 'letter a' }));
    fireEvent.click(screen.getByRole('button', { name: 'letter t' }));
    act(() => { vi.runAllTimers(); });
    expect(callbacks.onIncorrect).not.toHaveBeenCalled();
    expect(callbacks.onCorrect).not.toHaveBeenCalled();
    // now assemble correctly
    clickLettersInOrder(['c', 'a', 't']);
    expect(callbacks.onCorrect).toHaveBeenCalledOnce();
  });

  it('fires onShatter once when placed letters shatter', () => {
    const callbacks = makeCallbacks();
    renderWithI18n(<UnscrambleActivity word={word} callbacks={callbacks} />);
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    // 't' is wrong for position 2 (expects 'a') → the placed 'c' shatters
    fireEvent.click(screen.getByRole('button', { name: 'letter t' }));
    expect(callbacks.onShatter).toHaveBeenCalledOnce();
    act(() => { vi.runAllTimers(); });
  });

  it('reveal spells the word out, marks it solved and offers Next', () => {
    const callbacks = makeCallbacks();
    const { rerender } = renderWithI18n(
      <UnscrambleActivity word={word} callbacks={callbacks} />,
    );
    expect(screen.queryByRole('button', { name: /next/i })).toBeNull();

    rerender(
      <I18nextProvider i18n={i18n}>
        <UnscrambleActivity word={word} callbacks={callbacks} reveal />
      </I18nextProvider>,
    );
    act(() => { vi.runAllTimers(); });

    // Every slot holds its correct letter, in order.
    expect(screen.getByRole('button', { name: 'slot 1: c' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'slot 2: a' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'slot 3: t' })).toBeTruthy();
    // ...styled with the established "solved" green, same as a real solve.
    expect(screen.getByRole('button', { name: 'slot 1: c' }).style.background)
      .toBe('var(--success)');
    // The loose letter pool is gone and a 56 px Next button takes its place.
    expect(screen.queryByRole('button', { name: /^letter/ })).toBeNull();
    const next = screen.getByRole('button', { name: /next/i });
    expect(next.style.minHeight).toBe('56px');

    fireEvent.click(next);
    expect(callbacks.onAdvance).toHaveBeenCalledOnce();
    // A reveal is not a win: it must not be recorded as correct.
    expect(callbacks.onCorrect).not.toHaveBeenCalled();
  });

  it('reveal announces the word through the live region', () => {
    const callbacks = makeCallbacks();
    const { container, rerender } = renderWithI18n(
      <UnscrambleActivity word={word} callbacks={callbacks} />,
    );
    rerender(
      <I18nextProvider i18n={i18n}>
        <UnscrambleActivity word={word} callbacks={callbacks} reveal />
      </I18nextProvider>,
    );
    act(() => { vi.runAllTimers(); });
    const live = container.querySelector('[aria-live="polite"]');
    expect(live!.textContent).toContain('cat');
  });

  it('tiles and slots are inert once revealed', () => {
    const callbacks = makeCallbacks();
    const { rerender } = renderWithI18n(
      <UnscrambleActivity word={word} callbacks={callbacks} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    rerender(
      <I18nextProvider i18n={i18n}>
        <UnscrambleActivity word={word} callbacks={callbacks} reveal />
      </I18nextProvider>,
    );
    act(() => { vi.runAllTimers(); });
    // Tapping a filled slot must not empty it back out again.
    fireEvent.click(screen.getByRole('button', { name: 'slot 2: a' }));
    expect(screen.getByRole('button', { name: 'slot 2: a' })).toBeTruthy();
    expect(callbacks.onShatter).not.toHaveBeenCalled();
  });

  it('a reveal that lands mid-shatter still shows the word', () => {
    const callbacks = makeCallbacks();
    const { rerender } = renderWithI18n(
      <UnscrambleActivity word={word} callbacks={callbacks} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    // Wrong letter → the board shatters and queues its own reset timer.
    fireEvent.click(screen.getByRole('button', { name: 'letter t' }));
    expect(callbacks.onShatter).toHaveBeenCalledOnce();
    rerender(
      <I18nextProvider i18n={i18n}>
        <UnscrambleActivity word={word} callbacks={callbacks} reveal />
      </I18nextProvider>,
    );
    // The queued reset must not wipe the reveal back to empty slots.
    act(() => { vi.runAllTimers(); });
    expect(screen.getByRole('button', { name: 'slot 1: c' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'slot 3: t' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /next/i })).toBeTruthy();
  });

  it('does not fire onShatter for a wrong tap on an empty board', () => {
    const callbacks = makeCallbacks();
    renderWithI18n(<UnscrambleActivity word={word} callbacks={callbacks} />);
    // nothing placed yet — the tile just shakes, and it stays free
    fireEvent.click(screen.getByRole('button', { name: 'letter a' }));
    act(() => { vi.runAllTimers(); });
    expect(callbacks.onShatter).not.toHaveBeenCalled();
  });
});
