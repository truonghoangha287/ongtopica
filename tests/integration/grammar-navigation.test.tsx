import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { EnglishHome } from '@/english/vocab/components/EnglishHome';
import { GrammarHubPage } from '@/english/grammar/components/GrammarHubPage';
import { SKILLS, SKILL_ACTIVITIES } from '@/english/vocab/data/skills';

vi.mock('@/shared/utils/speak', () => ({ speak: vi.fn() }));

describe('grammar track wiring', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
  });

  it('registers grammar as a fourth skill', () => {
    expect(SKILLS.map((s) => s.id)).toEqual(['listening', 'reading', 'vocab', 'grammar']);
  });

  it('gives grammar three activities', () => {
    expect(SKILL_ACTIVITIES.grammar).toHaveLength(3);
  });

  it('routes the grammar tile to /grammar, not /skill/grammar', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<EnglishHome progressBySet={{}} grammarPct={0} />} />
            <Route path="/grammar" element={<GrammarHubPage />} />
            <Route path="/skill/:skillId" element={<div>topic picker</div>} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Grammar/i }));
    expect(await screen.findByText('One or Many')).toBeInTheDocument();
    expect(screen.queryByText('topic picker')).not.toBeInTheDocument();
  });

  it('shows the grammar tile with its progress percentage', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <EnglishHome progressBySet={{}} grammarPct={27} />
        </MemoryRouter>
      </I18nextProvider>,
    );
    expect(screen.getByRole('button', { name: /Grammar, 27% complete/i })).toBeInTheDocument();
  });
});
