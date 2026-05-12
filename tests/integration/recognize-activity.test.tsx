import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecognizeActivity } from '@/english/vocab/components/activities/RecognizeActivity';
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
  id: 'animals.cat',
  text: 'cat',
  pictureAsset: '/assets/images/cat.webp',
  audioAsset: '/assets/audio/cat.mp3',
  wordSetId: 'animals',
  blankLetterIndex: 1,
  letterChoices: ['a', 'o', 'e'],
};

const distractors: Word[] = ['dog', 'bird', 'fish'].map((t) => ({
  ...word,
  id: `animals.${t}`,
  text: t,
  pictureAsset: `/assets/images/${t}.webp`,
}));

describe('RecognizeActivity', () => {
  it('calls onCorrect then onAdvance when Next button clicked', () => {
    const callbacks = {
      onCorrect: vi.fn(),
      onIncorrect: vi.fn(),
      onReveal: vi.fn(),
      onAdvance: vi.fn(),
    };
    renderWithI18n(
      <RecognizeActivity word={word} distractors={distractors} callbacks={callbacks} />
    );
    const correctBtn = screen.getByAltText('cat').closest('button')!;
    fireEvent.click(correctBtn);
    expect(callbacks.onCorrect).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(callbacks.onAdvance).toHaveBeenCalledOnce();
  });

  it('calls onIncorrect on first wrong tap, then onReveal on second', async () => {
    const callbacks = {
      onCorrect: vi.fn(),
      onIncorrect: vi.fn(),
      onReveal: vi.fn(),
      onAdvance: vi.fn(),
    };
    renderWithI18n(
      <RecognizeActivity word={word} distractors={distractors} callbacks={callbacks} />
    );
    const wrongBtn = screen.getByAltText('dog').closest('button')!;
    fireEvent.click(wrongBtn);
    expect(callbacks.onIncorrect).toHaveBeenCalledOnce();
    fireEvent.click(wrongBtn);
    expect(callbacks.onReveal).toHaveBeenCalledOnce();
  });

  it('renders no red negative feedback elements', () => {
    const callbacks = {
      onCorrect: vi.fn(),
      onIncorrect: vi.fn(),
      onReveal: vi.fn(),
      onAdvance: vi.fn(),
    };
    const { container } = renderWithI18n(
      <RecognizeActivity word={word} distractors={distractors} callbacks={callbacks} />
    );
    const redElements = container.querySelectorAll('[style*="red"], .error, .wrong');
    expect(redElements.length).toBe(0);
  });
});
