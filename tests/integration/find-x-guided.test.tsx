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

import { FindXPage } from '@/math/pages/FindXPage';
import { NumberLabPillar } from '@/math/components/NumberLabPillar';
import { LAB_STAGES, FINDX_STAGES, PRACTICE_STAGES } from '@/math/data/number-lab';
import { practiceTopicId } from '@/math/services/practice-progress';
import { composeFindXRun } from '@/math/services/find-x-generator';
import { deriveSteps } from '@/math/services/find-x-steps';
import { FINDX_RUN_SIZES } from '@/math/constants/math-constants';

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

/** Walk the whole run, answering every step correctly. */
async function playRun(user: ReturnType<typeof userEvent.setup>, level: 'guided' | 'short' | 'solo') {
  for (const problem of composeFindXRun(level, 1)) {
    for (const step of deriveSteps(problem, level)) {
      const right = step.options.find((o) => o.correct)!;
      const name = step.input === 'tiles'
        ? new RegExp(`(^|\\D)${right.value}(\\D|$)`)
        : new RegExp(escape(right.labelKey ? i18n.t(right.labelKey, { ns: 'math', ...right.vars }) : right.label!));
      await user.click(screen.getAllByRole('button', { name })[0]);
    }
    await user.click(screen.getByRole('button', { name: /Tiếp tục|Xong rồi/ }));
  }
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\−]/g, '\\$&');
}

/**
 * The very first step a child sees on the guided stage. NOT hardcoded to
 * `role`: `composeFindXRun('guided', 1)[0]` is a story problem (deterministic
 * for a fixed seed), so `deriveSteps` puts a `read` step ahead of it —
 * asserting on a fixed kind here would silently test the wrong screen.
 */
function firstGuidedStep() {
  const first = composeFindXRun('guided', 1)[0];
  return deriveSteps(first, 'guided')[0];
}

describe('Find X — guided stage', () => {
  it('lists the three Find X cards after the six bank stages, in order', () => {
    const { container } = render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}><NumberLabPillar /></I18nextProvider>
      </MemoryRouter>,
    );
    expect(LAB_STAGES).toHaveLength(PRACTICE_STAGES.length + FINDX_STAGES.length);

    // Read the cards in DOM order — a reversed concatenation must fail this.
    const items = Array.from(container.querySelectorAll('ul > li'));
    expect(items).toHaveLength(LAB_STAGES.length);
    const nameSpans = items.map(
      (li) => li.querySelector('button > span:nth-child(2) > span:first-child') as HTMLElement,
    );
    const names = nameSpans.map((el) => el.textContent);

    const bankNames = PRACTICE_STAGES.map((s) => i18n.t(s.nameKey, { ns: 'math' }));
    expect(names.slice(0, PRACTICE_STAGES.length)).toEqual(bankNames);
    expect(names.slice(-3)).toEqual(['Tìm X từng bước', 'Tìm X gọn', 'Tự tìm X']);

    // Correction A: only the Find X cards' visible names are marked Vietnamese —
    // the document is lang="en", so an unmarked Vietnamese name would be misread.
    const findXSpans = nameSpans.slice(-3);
    for (const span of findXSpans) expect(span).toHaveAttribute('lang', 'vi');
    const bankSpan = nameSpans[0];
    expect(bankSpan).not.toHaveAttribute('lang');
  });

  it('opens on the first problem of the guided chain', async () => {
    renderStage('findxGuided');
    const firstStep = firstGuidedStep();
    const name = i18n.t(firstStep.promptKey, { ns: 'math', ...firstStep.vars });
    expect(await screen.findByRole('group', { name })).toBeInTheDocument();
  });

  it('shows the guided run size the wiring actually loaded, not just what the generator produces', async () => {
    renderStage('findxGuided');
    await screen.findByRole('group');
    expect(screen.getByText(`Bài 1 trên ${FINDX_RUN_SIZES.guided}`)).toBeInTheDocument();
  });

  it('grows the trail as decisions are made', async () => {
    const user = userEvent.setup();
    renderStage('findxGuided');
    const firstStep = firstGuidedStep();
    const groupName = i18n.t(firstStep.promptKey, { ns: 'math', ...firstStep.vars });
    const step = await screen.findByRole('group', { name: groupName });
    expect(screen.queryByRole('list', { name: 'Những bước đã làm' })).toBeNull();
    const right = firstStep.options.find((o) => o.correct)!;
    const rightName = right.labelKey ? i18n.t(right.labelKey, { ns: 'math', ...right.vars }) : right.label!;
    await user.click(screen.getByRole('button', { name: rightName }));
    expect(step).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Những bước đã làm' })).toBeInTheDocument();
  });

  it('keeps a wrong option visible with its reason and disables only that option', async () => {
    const user = userEvent.setup();
    renderStage('findxGuided');
    const firstStep = firstGuidedStep();
    const groupName = i18n.t(firstStep.promptKey, { ns: 'math', ...firstStep.vars });
    await screen.findByRole('group', { name: groupName });
    const wrong = firstStep.options.find((o) => !o.correct)!;
    const wrongName = wrong.labelKey ? i18n.t(wrong.labelKey, { ns: 'math', ...wrong.vars }) : wrong.label!;
    const button = screen.getByRole('button', { name: wrongName });
    await user.click(button);
    expect(screen.getByRole('group', { name: groupName })).toBeInTheDocument();
    expect(screen.getByText(i18n.t(wrong.whyKey, { ns: 'math', ...(wrong.vars ?? firstStep.vars) }))).toBeInTheDocument();
    // Correction C: the specific option the child tapped is the one disabled —
    // not merely "some button somewhere" is disabled.
    expect(button).toBeDisabled();
  });

  it('reaches the reward screen, records stars for the stage, and shows the decision breakdown', async () => {
    const user = userEvent.setup();
    renderStage('findxGuided');
    await screen.findByRole('group');
    await playRun(user, 'guided');
    // The original `findByText(/★|Number Lab|Lab/i)` matched three star glyphs
    // AND the subtitle at once, which `findByText` rejects as ambiguous — it
    // would never pass. An h1 uniquely identifies the reward screen (FindXView
    // has no top-level heading), so this actually proves we got there.
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    const stageIndex = FINDX_STAGES[0].index;
    expect(rows.topic.get(`test-child:${practiceTopicId(stageIndex)}`)?.stars).toBe(3);

    // Correction E: the parent breakdown line (Task 7) must actually be wired
    // through FindXPage's `breakdown={reward.stats}` prop, not merely present in
    // MathRewardScreen's own unit tests. A perfect guided run answers every
    // operation/operands/compute step correctly first try, across all six
    // problems, so every ratio is n/n.
    const n = FINDX_RUN_SIZES.guided;
    const expected = ['operation', 'operands', 'compute']
      .map((kind) => `${i18n.t(`findx.kind.${kind}`, { ns: 'math' })} ${n}/${n}`)
      .join(' · ');
    const line = screen.getByTestId('findx-breakdown');
    expect(line.textContent).toBe(expected);
  });
});
