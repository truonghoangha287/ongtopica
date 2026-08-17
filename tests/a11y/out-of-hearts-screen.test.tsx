import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { OutOfHeartsScreen } from '@/english/vocab/components/OutOfHeartsScreen';
import { HeartRow } from '@/english/vocab/components/heart-row';

function wrap(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('A11y: OutOfHeartsScreen', () => {
  it('has no axe violations', async () => {
    const { container } = wrap(
      <OutOfHeartsScreen onTryAgain={vi.fn()} onGoHome={vi.fn()} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('offers Try again and Go home, each a 56 px touch target', () => {
    wrap(<OutOfHeartsScreen onTryAgain={vi.fn()} onGoHome={vi.fn()} />);
    for (const name of [/try again/i, /go home/i]) {
      const btn = screen.getByRole('button', { name });
      expect(btn.style.minHeight).toBe('56px');
    }
  });

  it('calls the right handler for each button', () => {
    const onTryAgain = vi.fn();
    const onGoHome = vi.fn();
    wrap(<OutOfHeartsScreen onTryAgain={onTryAgain} onGoHome={onGoHome} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onTryAgain).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /go home/i }));
    expect(onGoHome).toHaveBeenCalledOnce();
  });
});

describe('A11y: HeartRow', () => {
  it('has no axe violations', async () => {
    const { container } = render(<HeartRow remaining={2} max={3} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
