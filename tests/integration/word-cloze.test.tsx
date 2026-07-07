import { screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { WordClozePage } from '@/english/vocab/reading-writing/WordClozePage';
import { renderWithI18n } from '../i18n-test-utils';

// Silence audio/speech side-effects in jsdom.
vi.mock('@/shared/utils/sfx', () => ({
  playPop: vi.fn(),
  playCorrect: vi.fn(),
  playBuzz: vi.fn(),
  playWin: vi.fn(),
}));
vi.mock('@/shared/utils/speak', () => ({ speak: vi.fn() }));

const renderPage = () =>
  renderWithI18n(
    <MemoryRouter>
      <WordClozePage />
    </MemoryRouter>
  );

describe('WordClozePage', () => {
  it('renders the prompt and a word bank with options', () => {
    renderPage();
    expect(screen.getByText('Tap a picture-word to fill each gap')).toBeInTheDocument();
    const bank = screen.getByRole('group', { name: /word bank/i });
    // Bank always shows at least the correct answers plus distractors.
    expect(within(bank).getAllByRole('button').length).toBeGreaterThanOrEqual(3);
  });

  it('fills a gap with success styling when a bank word is placed correctly', () => {
    renderPage();
    const bank = screen.getByRole('group', { name: /word bank/i });
    const bankButtons = within(bank).getAllByRole('button');

    // We don't know which bank word answers the first gap, so try each in turn.
    // A correctly-placed word turns the gap green (success background) and marks
    // it data-filled; a wrong word leaves the gap untouched.
    const firstGap = () => screen.getAllByRole('button', { name: /^gap$/i })[0];
    expect(firstGap()).toBeTruthy();

    let filledGap: HTMLElement | null = null;
    for (const btn of bankButtons) {
      if (btn.hasAttribute('disabled')) continue;
      fireEvent.click(btn); // select the bank word
      fireEvent.click(firstGap()); // try to place it in the first gap
      filledGap = document.querySelector('[data-filled="true"]');
      if (filledGap) break;
    }

    expect(filledGap).not.toBeNull();
    expect(filledGap!.style.background).toContain('--success');
  });
});
