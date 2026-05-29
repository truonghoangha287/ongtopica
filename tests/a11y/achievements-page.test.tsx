import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { AchievementsPage } from '@/english/vocab/components/AchievementsPage';

// Mock Dexie db so no IndexedDB needed in jsdom
vi.mock('@/shared/db/db', () => ({
  db: {
    achievements: {
      where: () => ({ equals: () => ({ toArray: async () => [] }) }),
    },
  },
}));

// Mock profile store — provide a fake active profile
vi.mock('@/shared/store/profile-store', () => ({
  useProfileStore: (selector: (s: { activeProfileId: string }) => unknown) =>
    selector({ activeProfileId: 'test-child' }),
}));

function wrap(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </MemoryRouter>,
  );
}

describe('A11y: AchievementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has no axe violations on initial render (no earned achievements)', async () => {
    const { container } = wrap(<AchievementsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
