import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithI18n } from '../i18n-test-utils';
import { BedAnchorCard } from '@/english/grammar/components/BedAnchorCard';

describe('BedAnchorCard', () => {
  it('shows the bed mnemonic', () => {
    renderWithI18n(<BedAnchorCard onDismiss={() => {}} />);
    // Both the title ("Make a bed...") and body ("...spell bed.") contain
    // "bed", so a single getByText(/bed/i) matches two elements. Assert on
    // all matches instead of picking one arbitrarily.
    expect(screen.getAllByText(/bed/i).length).toBeGreaterThan(0);
  });

  it('calls onDismiss when the button is tapped', async () => {
    const onDismiss = vi.fn();
    renderWithI18n(<BedAnchorCard onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('labels the b and d halves for screen readers', () => {
    renderWithI18n(<BedAnchorCard onDismiss={() => {}} />);
    expect(screen.getByRole('img', { name: /b.*d|hands/i })).toBeInTheDocument();
  });
});
