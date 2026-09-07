import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { LetterKeypad } from '@/english/vocab/components/LetterKeypad';
import { TypeWordPage } from '@/english/vocab/reading-writing/TypeWordPage';

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(), stop: vi.fn(), unload: vi.fn(), on: vi.fn(),
  })),
}));

vi.mock('@/english/vocab/hooks/useWordProgress', () => ({
  useWordProgress: () => ({
    getWordSetProgress: () => Promise.resolve([]),
    recordCorrect: vi.fn(),
  }),
}));

describe('A11y: Type the Word', () => {
  it('LetterKeypad has no violations', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <LetterKeypad onLetter={vi.fn()} onBackspace={vi.fn()} />
      </I18nextProvider>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('TypeWordPage has no violations', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/type/movers-animals']}>
          <Routes>
            <Route path="/type/:id" element={<TypeWordPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );
    // Wait past the loading state so the real activity is what gets audited.
    await waitFor(() => expect(screen.getByRole('group', { name: /letter keys/i })).toBeTruthy());
    expect(await axe(container)).toHaveNoViolations();
  });
});
