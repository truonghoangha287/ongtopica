import { screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PictureQaPage } from '@/english/vocab/reading-writing/PictureQaPage';
import { PICTURE_QA_ITEMS } from '@/english/vocab/reading-writing/data/picture-qa-items';
import { renderWithI18n } from '../i18n-test-utils';

// Silence audio/speech side-effects — they are enhancements, not under test.
vi.mock('@/shared/utils/sfx', () => ({
  playPop: vi.fn(),
  playCorrect: vi.fn(),
  playWin: vi.fn(),
  playBuzz: vi.fn(),
}));
vi.mock('@/shared/utils/speak', () => ({ speak: vi.fn() }));

function renderPage() {
  vi.spyOn(Math, 'random').mockReturnValue(0);
  return renderWithI18n(
    <MemoryRouter>
      <PictureQaPage />
    </MemoryRouter>,
  );
}

// The page picks a random session; read the scene it actually rendered so the
// test asserts against whichever authored item is on screen.
function currentItem() {
  const scene = screen.getByRole('img');
  const label = scene.getAttribute('aria-label');
  return PICTURE_QA_ITEMS.find((i) => i.sceneLabel === label)!;
}

describe('PictureQaPage', () => {
  it('renders the prompt, scene and the first question with its option chips', () => {
    renderPage();
    expect(screen.getByText(/Answer each question/i)).toBeInTheDocument();

    const item = currentItem();
    expect(item).toBeDefined();

    const q0 = item.questions[0];
    const group = screen.getByRole('group', { name: q0.text });
    for (const opt of q0.options) {
      expect(within(group).getByRole('button', { name: opt })).toBeInTheDocument();
    }
  });

  it('marks a correct chip green/locked and keeps a wrong chip retryable', () => {
    renderPage();
    const q0 = currentItem().questions[0];
    const group = screen.getByRole('group', { name: q0.text });

    // Wrong option first: stays enabled (retryable).
    const wrong = q0.options.find((o) => o !== q0.answer)!;
    const wrongBtn = within(group).getByRole('button', { name: wrong });
    fireEvent.click(wrongBtn);
    expect(wrongBtn).not.toBeDisabled();

    // Correct option: turns success-colored and locks all chips in the group.
    const correctBtn = within(group).getByRole('button', { name: q0.answer });
    fireEvent.click(correctBtn);
    expect(correctBtn).toBeDisabled();
    expect(correctBtn.style.background).toContain('--success');
    expect(within(group).getByRole('button', { name: wrong })).toBeDisabled();
  });
});
