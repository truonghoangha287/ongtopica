import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { Mascot } from '@/shared/components/Mascot';
import { WordCard } from '@/english/vocab/components/WordCard';
import { IntroduceActivity } from '@/english/vocab/components/activities/IntroduceActivity';
import { FillInBlankActivity } from '@/english/vocab/components/activities/FillInBlankActivity';
import { UnscrambleActivity } from '@/english/vocab/components/activities/UnscrambleActivity';
import type { Word } from '@/shared/types';

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(), stop: vi.fn(), unload: vi.fn(), on: vi.fn(),
  })),
}));

const word: Word = {
  id: 'animals.cat', text: 'cat',
  pictureAsset: '/assets/images/cat.webp', audioAsset: '/assets/audio/cat.mp3',
  wordSetId: 'animals', blankLetterIndex: 1, letterChoices: ['a', 'o', 'e'],
};

const callbacks = {
  onCorrect: vi.fn(), onIncorrect: vi.fn(), onReveal: vi.fn(), onAdvance: vi.fn(),
};

function wrap(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('A11y: activity components', () => {
  it('Mascot has no violations', async () => {
    const { container } = wrap(<Mascot reaction="idle" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('WordCard has no violations', async () => {
    const { container } = wrap(<WordCard word={word} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('IntroduceActivity has no violations', async () => {
    const { container } = wrap(<IntroduceActivity word={word} onComplete={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('FillInBlankActivity has no violations', async () => {
    const { container } = wrap(<FillInBlankActivity word={word} callbacks={callbacks} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('UnscrambleActivity has no violations', async () => {
    const { container } = wrap(<UnscrambleActivity word={word} callbacks={callbacks} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
