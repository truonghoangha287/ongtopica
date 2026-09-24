import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithI18n } from '../i18n-test-utils';
import { FindXStepCard } from '@/math/components/FindXStepCard';
import { FindXTrail } from '@/math/components/FindXTrail';
import { deriveSteps } from '@/math/services/find-x-steps';
import type { FindXProblem } from '@/math/types/find-x.types';
import { FINDX_VALUE_MAX } from '@/math/constants/math-constants';

const P: FindXProblem = { id: 's1', form: 'x+a=b', a: 6, b: 14, x: 8 };
const STEPS = deriveSteps(P, 'guided');
const ROLE = STEPS[0];
const OPERANDS = STEPS[2];
const COMPUTE = STEPS[3];

describe('FindXStepCard', () => {
  it('asks the step question and offers its options', () => {
    renderWithI18n(<FindXStepCard step={ROLE} wrongValues={[]} onAnswer={vi.fn()} tileMax={FINDX_VALUE_MAX} />);
    expect(screen.getByText('Trong phép tính này, x là một phần hay là cả tổng?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Một phần/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cả tổng/ })).toBeInTheDocument();
  });

  it('reports the index of the option tapped', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    renderWithI18n(<FindXStepCard step={OPERANDS} wrongValues={[]} onAnswer={onAnswer} tileMax={FINDX_VALUE_MAX} />);
    await user.click(screen.getByRole('button', { name: /14 − 6/ }));
    expect(onAnswer).toHaveBeenCalledWith(OPERANDS.options.findIndex((o) => o.label === '14 − 6'));
  });

  it('keeps a rejected option on screen, disabled, with its reason', () => {
    const wrongIndex = OPERANDS.options.findIndex((o) => !o.correct);
    renderWithI18n(
      <FindXStepCard step={OPERANDS} wrongValues={[wrongIndex]} onAnswer={vi.fn()} tileMax={FINDX_VALUE_MAX} />,
    );
    const label = OPERANDS.options[wrongIndex].label!;
    const button = screen.getByRole('button', { name: new RegExp(label.replace(/[+−]/g, '\\$&')) });
    expect(button).toBeDisabled();
    // The reason is real DOM, not a toast that vanishes.
    expect(screen.getByRole('status').textContent).toBeTruthy();
  });

  it('states wrongness in the label, not only in colour', () => {
    const wrongIndex = OPERANDS.options.findIndex((o) => !o.correct);
    renderWithI18n(
      <FindXStepCard step={OPERANDS} wrongValues={[wrongIndex]} onAnswer={vi.fn()} tileMax={FINDX_VALUE_MAX} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.some((b) => /chưa đúng/i.test(b.getAttribute('aria-label') ?? ''))).toBe(true);
  });

  it('renders the tile strip for a compute step, up to the Find X ceiling', () => {
    renderWithI18n(<FindXStepCard step={COMPUTE} wrongValues={[]} onAnswer={vi.fn()} tileMax={FINDX_VALUE_MAX} />);
    expect(screen.getByRole('button', { name: new RegExp(`(^|\\D)${FINDX_VALUE_MAX}(\\D|$)`) })).toBeInTheDocument();
  });
});

describe('FindXTrail', () => {
  it('lists each decision with its reason', () => {
    renderWithI18n(
      <FindXTrail entries={[
        { kind: 'role', labelKey: 'findx.opt.part', whyKey: 'findx.why.rolePart', vars: { whole: 14, known: 6 } },
      ]} />,
    );
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('Một phần')).toBeInTheDocument();
    expect(screen.getByText(/Cả tổng là 14/)).toBeInTheDocument();
  });

  it('renders nothing before the first decision', () => {
    const { container } = renderWithI18n(<FindXTrail entries={[]} />);
    expect(container.querySelector('ol')).toBeNull();
  });
});
describe('NumberTileStrip ceiling', () => {
  it('still defaults to the Number Lab range', async () => {
    const { NumberTileStrip } = await import('@/math/components/NumberTileStrip');
    renderWithI18n(<NumberTileStrip selected={null} checked={false} answerValue={3} onSelect={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /(^|\D)11(\D|$)/ })).toBeNull();
  });

  it('extends to max and disables rejected values', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const { NumberTileStrip } = await import('@/math/components/NumberTileStrip');
    renderWithI18n(
      <NumberTileStrip selected={null} checked={false} answerValue={8} onSelect={onSelect} max={20} disabledValues={[7]} />,
    );
    expect(screen.getByRole('button', { name: /(^|\D)20(\D|$)/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /(^|\D)7(\D|$)/ }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('speaks its own aria labels in Vietnamese when Find X passes ariaKeys', async () => {
    const { NumberTileStrip } = await import('@/math/components/NumberTileStrip');
    renderWithI18n(
      <NumberTileStrip
        selected={null}
        checked={false}
        answerValue={8}
        onSelect={vi.fn()}
        max={20}
        disabledValues={[7]}
        ariaKeys={{ tile: 'findx.tile.tap', wrong: 'findx.tile.wrong', strip: 'findx.tile.strip' }}
      />,
    );
    expect(screen.getByRole('group', { name: /^Các số từ 0 đến 20$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^7, chưa đúng$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Chạm số 9$/ })).toBeInTheDocument();
  });
});
