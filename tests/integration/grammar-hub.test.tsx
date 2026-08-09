import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { GrammarHubPage, grammarProgress } from '@/english/grammar/components/GrammarHubPage';
import type { MasteryMap } from '@/english/grammar/services/mastery';

vi.mock('@/shared/utils/speak', () => ({ speak: vi.fn() }));

const renderHub = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <GrammarHubPage />
      </MemoryRouter>
    </I18nextProvider>,
  );

describe('GrammarHubPage', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
  });

  // Queried as buttons, not by text: "b or d" is also the label of the
  // letter.bd rule chip, so a bare getByText would match two elements.
  it('lists all three games as tappable tiles', async () => {
    renderHub();
    expect(await screen.findByRole('button', { name: /^One or Many,/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Who Does What\?,/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^b or d,/ })).toBeInTheDocument();
  });

  it('shows one chip per rule', async () => {
    renderHub();
    await waitFor(() => {
      expect(screen.getAllByTestId('rule-chip')).toHaveLength(11);
    });
  });

  it('marks a gold rule as mastered', async () => {
    await db.ruleMastery.put({
      id: 'child-1:plural.s', childId: 'child-1', ruleId: 'plural.s',
      attempts: 10, correct: 9, streak: 8, gold: true, lastSeenAt: 1,
    });
    renderHub();
    await waitFor(() => {
      const chip = screen.getByTestId('rule-chip-plural.s');
      expect(chip).toHaveAttribute('data-state', 'gold');
    });
  });

  it('marks a weak rule as needing work', async () => {
    await db.ruleMastery.put({
      id: 'child-1:plural.es', childId: 'child-1', ruleId: 'plural.es',
      attempts: 10, correct: 3, streak: 0, gold: false, lastSeenAt: 1,
    });
    renderHub();
    await waitFor(() => {
      expect(screen.getByTestId('rule-chip-plural.es')).toHaveAttribute('data-state', 'weak');
    });
  });

  it('marks an untried rule as unseen', async () => {
    renderHub();
    await waitFor(() => {
      expect(screen.getByTestId('rule-chip-letter.bd')).toHaveAttribute('data-state', 'unseen');
    });
  });
});

describe('grammarProgress', () => {
  it('is 0 with no mastery', () => {
    expect(grammarProgress({})).toBe(0);
  });

  it('is golds over 11', () => {
    const mastery: MasteryMap = {
      'plural.s': { attempts: 10, correct: 9, streak: 8, gold: true },
      'plural.es': { attempts: 10, correct: 9, streak: 8, gold: true },
      'plural.ies': { attempts: 4, correct: 1, streak: 0, gold: false },
    };
    expect(grammarProgress(mastery)).toBeCloseTo(2 / 11);
  });

  it('never exceeds 1', () => {
    expect(grammarProgress({})).toBeLessThanOrEqual(1);
  });
});
