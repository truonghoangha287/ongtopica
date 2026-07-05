import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { YesNoPage } from '@/english/vocab/reading-writing/YesNoPage';

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    stop: vi.fn(),
    unload: vi.fn(),
    on: vi.fn(),
  })),
}));

function renderYesNo() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <YesNoPage />
      </MemoryRouter>
    </I18nextProvider>
  );
}

describe('YesNoPage', () => {
  it('renders the prompt, a picture and both ✓/✗ buttons', () => {
    renderYesNo();
    expect(screen.getByText(/tap ✓ or ✗/i)).toBeInTheDocument();
    // Picture has an alt attribute (the word text).
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt');
    expect(img.getAttribute('alt')).toBeTruthy();
    // Both answer buttons are present with real aria-labels.
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('advances after the correct answer is tapped', () => {
    renderYesNo();
    const yes = screen.getByRole('button', { name: 'Yes' });
    const no = screen.getByRole('button', { name: 'No' });

    // Exactly one of the two answers is correct; tapping the correct one reveals
    // the amber Next (→) button. Tap both — the wrong one just shakes and stays.
    fireEvent.click(yes);
    let nextBtn = screen.queryByText('→');
    if (!nextBtn) {
      fireEvent.click(no);
      nextBtn = screen.queryByText('→');
    }
    expect(nextBtn).toBeInTheDocument();
  });

  it('shows progress as done/total', () => {
    renderYesNo();
    // Initial progress badge: "0 of 6".
    expect(screen.getByText(/0 of 6/i)).toBeInTheDocument();
  });
});
