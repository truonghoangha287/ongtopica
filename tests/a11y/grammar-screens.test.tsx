import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { axe } from 'vitest-axe';
import i18n from '@/i18n';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { GrammarHubPage } from '@/english/grammar/components/GrammarHubPage';
import { GrammarDrillPage } from '@/english/grammar/components/GrammarDrillPage';

vi.mock('@/shared/utils/speak', () => ({ speak: vi.fn() }));
vi.mock('@/shared/utils/sfx', () => ({
  playWin: vi.fn(), playCorrect: vi.fn(), playBuzz: vi.fn(),
}));

const renderDrill = (gameId: string) =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[`/grammar/${gameId}`]}>
        <Routes>
          <Route path="/grammar/:gameId" element={<GrammarDrillPage />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );

describe('A11y: grammar screens', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
  });

  it('grammar hub has no violations', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <GrammarHubPage />
        </MemoryRouter>
      </I18nextProvider>,
    );
    await screen.findByText('One or Many');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('plurals drill has no violations', async () => {
    const { container } = renderDrill('plurals');
    await screen.findAllByTestId('drill-option');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('bed anchor card has no violations', async () => {
    const { container } = renderDrill('bd');
    await screen.findByText(/make a bed/i);
    expect(await axe(container)).toHaveNoViolations();
  });
});
