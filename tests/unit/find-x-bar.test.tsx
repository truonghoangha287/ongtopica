import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithI18n } from '../i18n-test-utils';
import { PartWholeBar } from '@/math/components/PartWholeBar';
import type { FindXProblem } from '@/math/types/find-x.types';

const PART_UNKNOWN: FindXProblem = { id: 'b1', form: 'x+a=b', a: 6, b: 14, x: 8 };
const WHOLE_UNKNOWN: FindXProblem = { id: 'b2', form: 'x-a=b', a: 8, b: 5, x: 13 };

describe('PartWholeBar', () => {
  it('states the relationship in words for a screen reader', () => {
    renderWithI18n(<PartWholeBar problem={PART_UNKNOWN} solved={false} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('aria-label')).toContain('14');
    expect(img.getAttribute('aria-label')).toContain('6');
  });

  it('hides the answer until the problem is solved', () => {
    const { rerender } = renderWithI18n(<PartWholeBar problem={PART_UNKNOWN} solved={false} />);
    expect(screen.queryByText('8')).toBeNull();
    rerender(<PartWholeBar problem={PART_UNKNOWN} solved />);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('draws the whole as the unknown in the x-minus form', () => {
    renderWithI18n(<PartWholeBar problem={WHOLE_UNKNOWN} solved={false} />);
    // Both parts are visible; the total is the one hidden.
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('13')).toBeNull();
  });

  it('marks itself vi so a screen reader does not read it as English', () => {
    const { container } = renderWithI18n(<PartWholeBar problem={PART_UNKNOWN} solved={false} />);
    expect(container.querySelector('[lang="vi"]')).not.toBeNull();
  });
});
