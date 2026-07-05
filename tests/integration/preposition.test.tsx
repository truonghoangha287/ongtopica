import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi } from 'vitest';
import i18n from '@/i18n';
import { PrepositionPage } from '@/english/vocab/reading-writing/PrepositionPage';

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    stop: vi.fn(),
    unload: vi.fn(),
    on: vi.fn(),
  })),
}));

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <PrepositionPage />
      </MemoryRouter>
    </I18nextProvider>
  );
}

describe('PrepositionPage', () => {
  it('renders the prompt and in/on/under chips', () => {
    renderPage();
    expect(screen.getByText(/Tap the right word/i)).toBeTruthy();
    const group = screen.getByRole('group');
    expect(within(group).getByRole('button', { name: 'in' })).toBeTruthy();
    expect(within(group).getByRole('button', { name: 'on' })).toBeTruthy();
    expect(within(group).getByRole('button', { name: 'under' })).toBeTruthy();
  });

  it('shows positive feedback (Next) after tapping the correct chip', () => {
    renderPage();
    // The scene emoji's aria-label encodes the correct answer: "<object> <answer> the box".
    const scene = screen.getByLabelText(/the box$/i);
    const answer = scene.getAttribute('aria-label')!.split(' ')[1];

    expect(screen.queryByRole('button', { name: /next|done/i })).toBeNull();

    const group = screen.getByRole('group');
    fireEvent.click(within(group).getByRole('button', { name: answer }));

    // Next (or Done on the last item) appears once the answer is correct.
    expect(screen.getByRole('button', { name: /next|done/i })).toBeTruthy();
    // The chosen chip turns to the success color.
    const chip = within(group).getByRole('button', { name: answer });
    expect(chip.getAttribute('style')).toContain('var(--success)');
  });
});
