import { useTranslation } from 'react-i18next';
import { RULES } from '@/english/grammar/data/rules';
import type { RuleId } from '@/english/grammar/data/rules';
import { accuracy, isUnseen, isWeak, EMPTY_MASTERY } from '@/english/grammar/services/mastery';
import type { MasteryMap } from '@/english/grammar/services/mastery';

type ChipState = 'gold' | 'weak' | 'learning' | 'unseen';

/**
 * Weak beats gold on purpose: gold is sticky, so a mastered rule that has
 * started slipping must still surface as needing work.
 */
function chipState(mastery: MasteryMap, ruleId: RuleId): ChipState {
  const m = mastery[ruleId];
  if (isUnseen(m)) return 'unseen';
  if (isWeak(m)) return 'weak';
  if (m?.gold) return 'gold';
  return 'learning';
}

const MARK: Record<ChipState, string> = {
  gold: '✅',
  weak: '⚠️',
  learning: '•',
  unseen: '☆',
};

interface RuleChipsProps {
  mastery: MasteryMap;
}

/**
 * The parent-facing view: one chip per rule, so a grown-up can see at a glance
 * which rules are still shaky. This is how you tell whether the app is working,
 * so it ships with the feature rather than later.
 */
export function RuleChips({ mastery }: RuleChipsProps) {
  const { t } = useTranslation('vocab');

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {RULES.map((rule) => {
        const state = chipState(mastery, rule.id);
        const m = mastery[rule.id];
        const detail = m
          ? t('grammar.ruleAttempts', { correct: m.correct, attempts: m.attempts })
          : t('grammar.ruleUnseen');
        return (
          <span
            key={rule.id}
            data-testid="rule-chip"
            data-state={state}
            title={`${rule.example} — ${detail}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 9999,
              fontSize: '0.82rem',
              fontWeight: 800,
              background: state === 'weak' ? 'var(--secondary)' : 'var(--muted)',
              color: 'var(--ink)',
              opacity: state === 'unseen' ? 0.6 : 1,
            }}
          >
            <span data-testid={`rule-chip-${rule.id}`} data-state={state} aria-hidden="true">
              {MARK[state]}
            </span>
            {rule.label}
            <span style={{ color: 'var(--muted-fg)', fontWeight: 700 }}>
              {Math.round(accuracy(m ?? EMPTY_MASTERY) * 100)}%
            </span>
          </span>
        );
      })}
    </div>
  );
}
