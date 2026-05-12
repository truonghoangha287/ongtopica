import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IntroduceActivity } from '@/english/vocab/components/activities/IntroduceActivity';
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

const mockWord: Word = {
  id: 'animals.cat',
  text: 'cat',
  pictureAsset: '/assets/images/cat.webp',
  audioAsset: '/assets/audio/cat.mp3',
  wordSetId: 'animals',
  blankLetterIndex: 1,
  letterChoices: ['a', 'o', 'e'],
};

describe('IntroduceActivity', () => {
  it('renders word picture and text', () => {
    const onComplete = vi.fn();
    renderWithI18n(<IntroduceActivity word={mockWord} onComplete={onComplete} />);
    expect(screen.getByAltText('cat')).toBeInTheDocument();
    expect(screen.getByText('cat')).toBeInTheDocument();
  });

  it('calls onComplete when Next is clicked', () => {
    const onComplete = vi.fn();
    renderWithI18n(<IntroduceActivity word={mockWord} onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Next'));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete for each of 10 words in sequence', () => {
    const words: Word[] = Array.from({ length: 10 }, (_, i) => ({
      ...mockWord,
      id: `animals.word${i}`,
      text: `word${i}`,
    }));
    const onComplete = vi.fn();

    words.forEach((w) => {
      const { unmount } = renderWithI18n(<IntroduceActivity word={w} onComplete={onComplete} />);
      fireEvent.click(screen.getByText('Next'));
      unmount();
    });

    expect(onComplete).toHaveBeenCalledTimes(10);
  });
});
