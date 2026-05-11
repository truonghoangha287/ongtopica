import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { FillInBlankActivity } from '@/english/vocab/components/activities/FillInBlankActivity';
import { renderWithI18n } from '../i18n-test-utils';
import type { Word } from '@/shared/types';

const word: Word = {
  id: 'animals.cat', text: 'cat',
  pictureAsset: '/assets/images/cat.webp', audioAsset: '/assets/audio/cat.mp3',
  wordSetId: 'animals', blankLetterIndex: 1, letterChoices: ['a', 'o', 'e'],
};

describe('FillInBlankActivity', () => {
  it('shows blank at correct index (c_t for "cat" at index 1)', () => {
    const callbacks = { onCorrect: vi.fn(), onIncorrect: vi.fn(), onReveal: vi.fn(), onAdvance: vi.fn() };
    renderWithI18n(<FillInBlankActivity word={word} callbacks={callbacks} />);
    expect(screen.getByText('c_t')).toBeInTheDocument();
  });

  it('calls onCorrect + onAdvance on correct letter', async () => {
    const callbacks = { onCorrect: vi.fn(), onIncorrect: vi.fn(), onReveal: vi.fn(), onAdvance: vi.fn() };
    renderWithI18n(<FillInBlankActivity word={word} callbacks={callbacks} />);
    fireEvent.click(screen.getByRole('button', { name: 'letter a' }));
    expect(callbacks.onCorrect).toHaveBeenCalledOnce();
    await waitFor(() => expect(callbacks.onAdvance).toHaveBeenCalledOnce(), { timeout: 1500 });
  });

  it('calls onIncorrect then onReveal on two wrong taps', async () => {
    const callbacks = { onCorrect: vi.fn(), onIncorrect: vi.fn(), onReveal: vi.fn(), onAdvance: vi.fn() };
    renderWithI18n(<FillInBlankActivity word={word} callbacks={callbacks} />);
    fireEvent.click(screen.getByRole('button', { name: 'letter o' }));
    expect(callbacks.onIncorrect).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'letter e' }));
    expect(callbacks.onReveal).toHaveBeenCalledOnce();
  });
});
