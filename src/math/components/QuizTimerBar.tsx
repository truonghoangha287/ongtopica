import { useTranslation } from 'react-i18next';
import { MONO } from '@/math/components/QuizOption';
import { QUICK_REACT_WARN_SECONDS } from '@/math/constants/math-constants';

interface QuizTimerBarProps {
  secondsLeft: number;
  totalSeconds: number;
}

/**
 * The "quick react" countdown. The remaining seconds are shown as a numeral as
 * well as a bar, so the state is never carried by width or colour alone.
 *
 * `aria-live="off"` on purpose: a per-second announcement would drown out the
 * question. The one moment that matters — running out — is announced through
 * the runner's existing `role="status"` mood line instead.
 */
export function QuizTimerBar({ secondsLeft, totalSeconds }: QuizTimerBarProps) {
  const { t } = useTranslation('math');
  const left = Math.max(0, secondsLeft);
  const fraction = totalSeconds > 0 ? left / totalSeconds : 0;
  const warning = left <= QUICK_REACT_WARN_SECONDS;

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={t('lab.timer.secondsLeft', { count: left })}
      style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 340, margin: '0 auto 14px' }}
    >
      <span aria-hidden="true" style={{ fontSize: '1rem' }}>⏱</span>
      <div className="ma-timer-bar" style={{ flex: 1, height: 8, borderRadius: 9999, background: 'var(--ma-soft)', overflow: 'hidden' }}>
        <i
          style={{
            display: 'block',
            height: '100%',
            width: `${fraction * 100}%`,
            borderRadius: 9999,
            background: warning ? 'oklch(60% 0.19 25)' : 'var(--ma)',
          }}
        />
      </div>
      <span aria-hidden="true" style={{ fontFamily: MONO, fontWeight: 900, fontSize: '0.95rem', minWidth: '2ch', textAlign: 'right', color: warning ? 'oklch(60% 0.19 25)' : 'var(--ma-ink)' }}>
        {left}
      </span>
    </div>
  );
}
