import { useTranslation } from 'react-i18next';
import type { FindXTrailEntry } from '@/math/services/find-x-run';

/**
 * What the child has decided so far, each line carrying the reason it was right.
 *
 * An ordered list rather than a stack of divs: "what have I settled?" is a thing
 * a screen reader user navigates, and the count matters.
 */
export function FindXTrail({ entries }: { entries: FindXTrailEntry[] }) {
  const { t } = useTranslation('math');
  if (entries.length === 0) return null;

  return (
    <ol
      lang="vi"
      aria-label={t('findx.trailAria')}
      style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', margin: '0 0 16px', padding: 0 }}
    >
      {entries.map((e, i) => (
        <li
          key={`${e.kind}-${i}`}
          style={{
            display: 'flex', gap: 11, alignItems: 'flex-start', padding: '12px 14px',
            borderRadius: 18, background: 'oklch(97.5% 0.02 150)', borderLeft: '5px solid var(--success)',
          }}
        >
          <span aria-hidden="true" style={{ fontWeight: 900, color: 'var(--success)' }}>✓</span>
          <span style={{ fontWeight: 700, fontSize: '0.93rem' }}>
            {e.labelKey ? t(e.labelKey, e.vars) : e.label}
            <span style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', color: 'var(--muted-fg)', marginTop: 3 }}>
              {t(e.whyKey, e.vars)}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
