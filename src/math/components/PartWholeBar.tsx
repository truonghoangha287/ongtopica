import { useTranslation } from 'react-i18next';
import { MONO } from '@/math/components/QuizOption';
import { knownPartOf, roleOf, wholeOf } from '@/math/services/find-x-steps';
import type { FindXProblem } from '@/math/types/find-x.types';

interface PartWholeBarProps {
  problem: FindXProblem;
  /** True once the problem is finished, which fills the unknown in. */
  solved: boolean;
}

const VIEW_W = 400;
const BAR_H = 40;
const GAP = 16;
const MIN_BAR_W = 40;

/**
 * The picture behind the word "why".
 *
 * A wide bar for the whole, two narrower bars beneath it for the parts, one of
 * them dashed because it is the one being found. Segment widths are proportional
 * to their values, so "the part is smaller than the whole" is visible rather
 * than asserted — which is the fact the role step turns on.
 */
export function PartWholeBar({ problem, solved }: PartWholeBarProps) {
  const { t } = useTranslation('math');
  const whole = wholeOf(problem);
  const known = knownPartOf(problem);
  const wholeUnknown = roleOf(problem.form) === 'whole';
  const other = whole - known;

  const innerW = VIEW_W - GAP;
  const knownW = Math.min(
    Math.max(MIN_BAR_W, (known / Math.max(1, whole)) * innerW),
    innerW - MIN_BAR_W,
  );
  const otherW = innerW - knownW;

  const text = (value: number, hidden: boolean) => (hidden && !solved ? 'x' : String(value));

  return (
    <div lang="vi">
      <svg
        role="img"
        aria-label={wholeUnknown
          ? t('findx.barAriaWhole', { known, other })
          : t('findx.barAria', { whole, part: known })}
        viewBox={`0 0 ${VIEW_W} 120`}
        style={{ display: 'block', width: '100%', height: 'auto', maxWidth: 460, margin: '0 auto 16px' }}
      >
        <rect
          x={0} y={10} width={VIEW_W} height={BAR_H} rx={12}
          fill="var(--secondary)"
          stroke="var(--accent)" strokeWidth={3}
          strokeDasharray={wholeUnknown && !solved ? '8 6' : undefined}
        />
        <text
          x={VIEW_W / 2} y={10 + BAR_H / 2 + 7} textAnchor="middle"
          fontFamily={MONO} fontSize={21} fontWeight={800} fill="var(--ma-ink)"
        >
          {text(whole, wholeUnknown)}
        </text>

        <rect
          x={0} y={66} width={knownW} height={BAR_H} rx={12}
          fill="oklch(93% 0.07 248)" stroke="var(--primary)" strokeWidth={3}
        />
        <text
          x={knownW / 2} y={66 + BAR_H / 2 + 7} textAnchor="middle"
          fontFamily={MONO} fontSize={21} fontWeight={800} fill="var(--primary)"
        >
          {known}
        </text>

        <rect
          x={knownW + GAP} y={66} width={otherW} height={BAR_H} rx={12}
          fill="oklch(97% 0.02 150)" stroke="var(--success)" strokeWidth={3}
          strokeDasharray={!wholeUnknown && !solved ? '8 6' : undefined}
        />
        <text
          x={knownW + GAP + otherW / 2} y={66 + BAR_H / 2 + 7} textAnchor="middle"
          fontFamily={MONO} fontSize={21} fontWeight={800} fill="var(--success)"
        >
          {text(other, !wholeUnknown)}
        </text>
      </svg>
    </div>
  );
}
