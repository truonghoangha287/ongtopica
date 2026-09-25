import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// --- In-memory Dexie stand-in (no IndexedDB in jsdom). ---
const rows = { topic: new Map<string, { id: string; stars: number; level: number; topicId: string; childId: string }>() };
vi.mock('@/shared/db/db', () => ({
  db: {
    mathTopicProgress: {
      get: async (id: string) => rows.topic.get(id),
      put: async (row: { id: string }) => void rows.topic.set(row.id, row as never),
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

import { NumberLabPillar } from '@/math/components/NumberLabPillar';
import { FindXPage } from '@/math/pages/FindXPage';
import { FINDX_RUN_SIZES } from '@/math/constants/math-constants';

beforeEach(() => rows.topic.clear());

/**
 * Finding 1: no test ever clicked a Find X card through the pillar's own
 * `navigate` call — `find-x-guided.test.tsx` mounts `FindXPage` directly
 * under its own route, bypassing `NumberLabPillar`'s routing ternary
 * entirely. Inverting that ternary (or deleting the app's `/math/findx/:stage`
 * route) left every other test green while the cards shipped dead.
 *
 * This test registers BOTH `/math/findx/:stage` and `/math/practice/:stage`,
 * with a distinguishable stand-in on the practice route, so a wrong-route
 * landing fails loudly instead of silently rendering nothing.
 */
describe('Number Lab pillar — Find X routing', () => {
  it('clicking a Find X card reaches the Find X page, not the practice route', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <I18nextProvider i18n={i18n}>
          <Routes>
            <Route path="/" element={<NumberLabPillar />} />
            <Route path="/math/findx/:stage" element={<FindXPage />} />
            <Route path="/math/practice/:stage" element={<div>PRACTICE STAND-IN</div>} />
          </Routes>
        </I18nextProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Tìm X từng bước/ }));

    // Only FindXPage renders this counter (built from FINDX_RUN_SIZES), so
    // finding it proves the pillar actually routed to the Find X page.
    expect(await screen.findByText(`Bài 1 trên ${FINDX_RUN_SIZES.guided}`)).toBeInTheDocument();
    expect(screen.queryByText('PRACTICE STAND-IN')).toBeNull();
  });
});
