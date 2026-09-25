import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

const rows = { topic: new Map<string, unknown>() };
vi.mock('@/shared/db/db', () => ({
  db: {
    mathTopicProgress: {
      get: async (id: string) => rows.topic.get(id),
      put: async (row: { id: string }) => void rows.topic.set(row.id, row),
      where: () => ({ equals: () => ({ toArray: async () => [...rows.topic.values()] }) }),
    },
    mathProfileState: { get: async () => undefined, put: async () => undefined },
    mathLevelResults: { get: async () => undefined, put: async () => undefined, where: () => ({ equals: () => ({ toArray: async () => [] }) }) },
    mathOlympiadState: { get: async () => undefined, put: async () => undefined },
  },
}));
vi.mock('@/shared/store/profile-store', () => ({
  useProfileStore: (selector: (s: { activeProfileId: string }) => unknown) =>
    selector({ activeProfileId: 'test-child' }),
}));

import { FindXPage } from '@/math/pages/FindXPage';

beforeEach(() => rows.topic.clear());

function renderStage(stage: string) {
  return render(
    <MemoryRouter initialEntries={[`/math/findx/${stage}`]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/math/findx/:stage" element={<FindXPage />} />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

/**
 * Entering a stage, before the problems exist.
 *
 * The reducer starts on an EMPTY run — no problems — which every "is the run
 * over?" test in the code reads as FINISHED: `done`, and `pIndex >= originalTotal`,
 * so the progress bar computed to 1 and the run-end branch drew a celebrating bee.
 * Every entry into every Find X stage flashed the celebration before the first
 * question. The other integration tests `await` the step group and skip straight
 * past this render, so nothing covered it.
 */
describe('Find X — entering a stage', () => {
  it('shows a loader, not a finished run, before the problems have loaded', () => {
    const { container } = renderStage('findxSolo');

    // Synchronous first render: the Dexie read has not resolved.
    const loader = screen.getByRole('status');
    expect(loader).toHaveTextContent(i18n.t('findx.loading', { ns: 'math' }));
    expect(loader).toHaveAttribute('lang', 'vi');
    // No celebration, and no progress chrome to be full of.
    expect(container.textContent).not.toContain('🐝');
    expect(container.querySelector('.progress')).toBeNull();
  });

  it('opens on the first question with an empty progress bar', async () => {
    const { container } = renderStage('findxSolo');
    await screen.findByRole('group', { name: /bằng bao nhiêu/ });
    // By text, not by role: the step card's "why" line is a live region too.
    expect(screen.queryByText(i18n.t('findx.loading', { ns: 'math' }))).toBeNull();
    expect(container.querySelector('.progress i')).toHaveStyle({ width: '0%' });
  });
});
