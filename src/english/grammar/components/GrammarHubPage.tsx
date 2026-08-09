import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { speak } from '@/shared/utils/speak';
import { GRAMMAR_GAMES } from '@/english/grammar/services/games';
import { RULE_IDS } from '@/english/grammar/data/rules';
import { useRuleMastery } from '@/english/grammar/hooks/useRuleMastery';
import type { MasteryMap } from '@/english/grammar/services/mastery';
import type { GrammarGame } from '@/english/grammar/types';
import { RuleChips } from './RuleChips';

const GAME_EMOJI: Record<string, string> = {
  plurals: '🍎',
  verbs: '👩‍🏫',
  bd: '🐶',
};

const GAME_BLURB: Record<string, string> = {
  plurals: 'One apple or three?',
  verbs: 'Pick the right ending',
  bd: 'Which letter is it?',
};

/** Golds over the whole catalog — the Grammar track's aggregate progress. */
export function grammarProgress(mastery: MasteryMap): number {
  const golds = RULE_IDS.filter((id) => mastery[id]?.gold).length;
  return golds / RULE_IDS.length;
}

/** Stars (0–4) for one game, from how many of its rules have gone gold. */
export function gameStars(game: GrammarGame, mastery: MasteryMap): number {
  const golds = game.rules.filter((id) => mastery[id]?.gold).length;
  return Math.round((golds / game.rules.length) * 4);
}

/**
 * The Grammar track hub. Unlike the other skill hubs this does not ask for a
 * topic first — grammar rules are cross-topic, so it goes straight to games.
 */
export function GrammarHubPage() {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const { getMastery } = useRuleMastery();
  const [mastery, setMastery] = useState<MasteryMap>({});

  useEffect(() => {
    getMastery().then(setMastery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page">
      <header style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 6 }}>
        <button
          className="icon-btn"
          onClick={() => navigate('/')}
          aria-label={t('grammar.backButton')}
          style={{ fontSize: '1.3rem' }}
        >
          ←
        </button>
        <span
          aria-hidden="true"
          style={{
            width: 54, height: 54, flexShrink: 0, borderRadius: 16,
            display: 'grid', placeItems: 'center', fontSize: '1.8rem',
            background: 'var(--muted)',
          }}
        >
          🪄
        </span>
        <div style={{ lineHeight: 1.15 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>
            {t('grammar.sectionTitle')}
          </h1>
          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--muted-fg)' }}>
            {t('grammar.sectionHint')}
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 22 }}>
        {GRAMMAR_GAMES.map((game) => {
          const stars = gameStars(game, mastery);
          return (
            <button
              key={game.id}
              className="card lift"
              onClick={() => {
                speak(t(`grammar.${game.id}`));
                navigate(`/grammar/${game.id}`);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, width: '100%',
                textAlign: 'left', padding: 18, borderRadius: 24,
              }}
              aria-label={`${t(`grammar.${game.id}`)}, ${stars} of 4 stars`}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 60, height: 60, flexShrink: 0, borderRadius: 18,
                  display: 'grid', placeItems: 'center', fontSize: '1.9rem',
                  background: 'var(--muted)',
                }}
              >
                {GAME_EMOJI[game.id]}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '1.15rem', fontWeight: 900, color: 'var(--ink)' }}>
                  {t(`grammar.${game.id}`)}
                </span>
                <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--muted-fg)' }}>
                  {GAME_BLURB[game.id]}
                </span>
              </span>
              <span aria-hidden="true" style={{ fontSize: '1rem', letterSpacing: '1.5px', flexShrink: 0 }}>
                <span style={{ color: 'var(--star)' }}>{'★'.repeat(stars)}</span>
                <span style={{ color: 'var(--border)' }}>{'☆'.repeat(4 - stars)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <h2 className="section-title" style={{ margin: '26px 4px 13px' }}>
        {t('grammar.howsItGoing')}
      </h2>
      <RuleChips mastery={mastery} />
    </div>
  );
}
