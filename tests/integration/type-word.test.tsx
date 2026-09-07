import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import i18n from '@/i18n';
import { TypeWordPage } from '@/english/vocab/reading-writing/TypeWordPage';
import { moversWordSetRegistry } from '@/data/yle-movers/index';
import { isPictorial } from '@/english/vocab/services/pictorial';
import { isTypeable } from '@/english/vocab/services/type-word';

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    stop: vi.fn(),
    unload: vi.fn(),
    on: vi.fn(),
  })),
}));

const recordCorrect = vi.fn();
vi.mock('@/english/vocab/hooks/useWordProgress', () => ({
  useWordProgress: () => ({
    getWordSetProgress: () => Promise.resolve([]),
    recordCorrect: (...args: unknown[]) => recordCorrect(...args),
  }),
}));

const TOPIC = 'movers-animals';

/** The word the page will present first, derived the same way the page does. */
function firstWord(): string {
  const set = moversWordSetRegistry.find((s) => s.id === TOPIC)!;
  return set.words
    .filter((w) => isPictorial(w) && isTypeable(w))
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))[0].text;
}

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[`/type/${TOPIC}`]}>
        <Routes>
          <Route path="/type/:id" element={<TypeWordPage />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

const keypad = () => screen.getByRole('group', { name: /letter keys/i });
const tapLetter = (letter: string) =>
  fireEvent.click(within(keypad()).getByRole('button', { name: `letter ${letter}` }));

/** Slots the child has filled, read off their accessible names. */
const typedSoFar = () =>
  within(screen.getByRole('group', { name: /the word you are typing/i }))
    .queryAllByLabelText(/^letter \d+: (?!empty)/)
    .length;

describe('TypeWordPage', () => {
  beforeEach(() => {
    recordCorrect.mockClear();
    localStorage.clear();
  });

  it('shows a picture, a slot per letter, and the A-Z keypad', async () => {
    renderPage();
    const target = firstWord();
    await waitFor(() => expect(keypad()).toBeTruthy());

    const slots = within(screen.getByRole('group', { name: /the word you are typing/i }));
    expect(slots.getAllByLabelText(/^letter \d+:/)).toHaveLength(target.length);
    expect(within(keypad()).getAllByRole('button')).toHaveLength(27); // 26 letters + backspace
  });

  it('fills a slot for each correct letter', async () => {
    renderPage();
    const target = firstWord();
    await waitFor(() => expect(keypad()).toBeTruthy());

    tapLetter(target[0].toLowerCase());
    await waitFor(() => expect(typedSoFar()).toBe(1));
    tapLetter(target[1].toLowerCase());
    await waitFor(() => expect(typedSoFar()).toBe(2));
  });

  it('clears every typed letter when one is wrong', async () => {
    renderPage();
    const target = firstWord();
    await waitFor(() => expect(keypad()).toBeTruthy());

    tapLetter(target[0].toLowerCase());
    tapLetter(target[1].toLowerCase());
    await waitFor(() => expect(typedSoFar()).toBe(2));

    // Any letter that is not the next one.
    const wrong = 'abcdefghijklmnopqrstuvwxyz'
      .split('')
      .find((l) => l !== target[2].toLowerCase())!;
    tapLetter(wrong);

    await waitFor(() => expect(typedSoFar()).toBe(0));
  });

  it('accepts a physical keyboard as well as the on-screen keys', async () => {
    renderPage();
    const target = firstWord();
    await waitFor(() => expect(keypad()).toBeTruthy());

    fireEvent.keyDown(window, { key: target[0].toLowerCase() });
    await waitFor(() => expect(typedSoFar()).toBe(1));

    fireEvent.keyDown(window, { key: 'Backspace' });
    await waitFor(() => expect(typedSoFar()).toBe(0));
  });

  it('celebrates and records progress once the word is spelled', async () => {
    renderPage();
    const target = firstWord();
    await waitFor(() => expect(keypad()).toBeTruthy());

    for (const letter of target) tapLetter(letter.toLowerCase());

    await waitFor(() => expect(screen.getByRole('button', { name: /next/i })).toBeTruthy());
    expect(recordCorrect).toHaveBeenCalledWith(expect.stringContaining(TOPIC), TOPIC);
  });

  it('shows the heart row only when a grown-up turned hearts on', async () => {
    renderPage();
    await waitFor(() => expect(keypad()).toBeTruthy());
    expect(screen.queryByTestId('heart-row')).toBeNull();
  });

  it('spends a heart on the second mistake, not the first', async () => {
    localStorage.setItem('heartsMode', '3');
    renderPage();
    const target = firstWord();
    await waitFor(() => expect(keypad()).toBeTruthy());

    const wrongAt = (index: number) =>
      'abcdefghijklmnopqrstuvwxyz'.split('').find((l) => l !== target[index].toLowerCase())!;
    const hearts = () => screen.getByTestId('heart-row').textContent ?? '';
    const before = hearts();

    // Type a correct letter first, so the clear is something the assertion can
    // actually observe -- the slots are already empty before any tap.
    tapLetter(target[0].toLowerCase());
    await waitFor(() => expect(typedSoFar()).toBe(1));
    tapLetter(wrongAt(1));
    await waitFor(() => expect(typedSoFar()).toBe(0));
    expect(hearts(), 'the first mistake is free').toBe(before);

    tapLetter(wrongAt(0));
    await waitFor(() => expect(hearts()).not.toBe(before));
    expect(hearts()).toContain('2 of 3');
  });
});
