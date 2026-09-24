import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

vi.mock('@/shared/db/db', () => ({
  db: {
    mathTopicProgress: { get: async () => undefined, put: async () => undefined, where: () => ({ equals: () => ({ toArray: async () => [] }) }) },
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
import { MathRewardScreen } from '@/math/components/MathRewardScreen';
import { composeFindXRun } from '@/math/services/find-x-generator';
import { deriveSteps, equationOf } from '@/math/services/find-x-steps';
import type { FindXStats } from '@/math/services/find-x-run';

const STATS: FindXStats = {
  asked: { read: 0, role: 6, operation: 6, operands: 6, compute: 6, check: 6 },
  missed: { read: 0, role: 0, operation: 1, operands: 2, compute: 0, check: 0 },
  reveals: 1,
};

function wrap(stage: string) {
  return render(
    <MemoryRouter initialEntries={[`/math/findx/${stage}`]}>
      <I18nextProvider i18n={i18n}>
        <Routes><Route path="/math/findx/:stage" element={<FindXPage />} /></Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

/**
 * The very first step the guided stage shows. Not hardcoded to `role`: the
 * fixed seed's first problem carries a story, so `deriveSteps` puts a `read`
 * step ahead of it (mirrors `find-x-guided.test.tsx`'s `firstGuidedStep`).
 */
function firstGuidedStep() {
  const first = composeFindXRun('guided', 1)[0];
  return deriveSteps(first, 'guided')[0];
}

describe('Find X accessibility', () => {
  it('passes axe on the guided play screen', async () => {
    const { container } = wrap('findxGuided');
    await screen.findByRole('group');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes axe on the solo play screen', async () => {
    const { container } = wrap('findxSolo');
    // Not the unnamed `findByRole('group')` the guided test above uses: the
    // solo stage opens on the tiles-input `compute` step, whose
    // `NumberTileStrip` nests a second, unnamed group role and makes that
    // query ambiguous (mirrors `find-x-guided.test.tsx`'s `resolves a second
    // stage` test). Name-filter to the one the step card owns.
    await screen.findByRole('group', { name: /bằng bao nhiêu/ });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes axe on the reward screen with a breakdown', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MathRewardScreen
          variant="practice" topicName="Tìm X từng bước" level={7} stars={2}
          streak={1} accuracy={80} breakdown={STATS}
          onNext={() => {}} onBackToHive={() => {}}
        />
      </I18nextProvider>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('marks every Vietnamese region so a screen reader switches language', async () => {
    const user = userEvent.setup();
    wrap('findxGuided');
    const firstStep = firstGuidedStep();
    const groupName = i18n.t(firstStep.promptKey, { ns: 'math', ...firstStep.vars });
    const group = await screen.findByRole('group', { name: groupName });

    // Region 1: the step card's own group.
    expect(group).toHaveAttribute('lang', 'vi');

    // Region 2: the page chrome's question counter ("Bài 1 trên 6").
    expect(screen.getByText(/^Bài \d+ trên \d+$/)).toHaveAttribute('lang', 'vi');

    // Region 3: the trail list, once it has something to show. It renders
    // nothing on a fresh problem (`FindXTrail` returns null for an empty
    // trail), so answer the first decision correctly — by name, from the
    // real derived step, not a guessed click order — to make it appear.
    expect(screen.queryByRole('list')).toBeNull();
    const right = firstStep.options.find((o) => o.correct)!;
    const rightName = right.labelKey ? i18n.t(right.labelKey, { ns: 'math', ...right.vars }) : right.label!;
    await user.click(within(group).getByRole('button', { name: rightName }));
    expect(await screen.findByRole('list')).toHaveAttribute('lang', 'vi');
  });

  /**
   * Shared by both tap-target cases below, so the loop lives in one place
   * rather than being copy-pasted per input kind.
   */
  function expectTapTargetMinimum(buttons: HTMLElement[]) {
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      const min = button.style.minHeight || button.style.height;
      // No conditional: a control with no declared minimum must fail, not
      // be skipped.
      expect(min).toBeTruthy();
      expect(parseInt(min, 10)).toBeGreaterThanOrEqual(48);
    }
  }

  it('gives every answer control a 48px minimum target on the guided (choice) stage', async () => {
    wrap('findxGuided');
    // Scoped to the step card's own group, not the page chrome (exit
    // button, "Tiếp tục") which are not answer controls this rule covers.
    const group = await screen.findByRole('group');
    expectTapTargetMinimum(within(group).getAllByRole('button'));
  });

  it('gives every answer control a 48px minimum target on the solo (tiles) stage', async () => {
    wrap('findxSolo');
    // Named, not the bare `findByRole('group')` the guided case above uses:
    // the solo stage opens on the tiles-input `compute` step, whose
    // `NumberTileStrip` nests a second, unnamed group inside the step
    // card's own group and makes an unnamed query ambiguous (mirrors the
    // "passes axe on the solo play screen" test above).
    const group = await screen.findByRole('group', { name: /bằng bao nhiêu/ });
    expectTapTargetMinimum(within(group).getAllByRole('button'));
  });

  it('gives the play screen one h1 holding the equation, above the step question as an h2', async () => {
    wrap('findxGuided');
    const first = composeFindXRun('guided', 1)[0];
    const firstStep = deriveSteps(first, 'guided')[0];

    const h1s = await screen.findAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(equationOf(first, 'x'));

    const questionText = i18n.t(firstStep.promptKey, { ns: 'math', ...firstStep.vars });
    expect(screen.getByRole('heading', { level: 2, name: questionText })).toBeInTheDocument();
  });
});
