import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeProgressTile } from '@/english/vocab/components/home-progress-tile';
import { speak } from '@/shared/utils/speak';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { wordSetIcon } from '@/data/yle-starters/icons';
import type { WordProgressRow } from '@/shared/db/schema';

const LEVELS = ['Starters', 'Movers', 'Flyers'] as const;

const RW_ACTIVITIES = [
  { key: 'wordCloze', emoji: '📖', route: '/rw/cloze' },
  { key: 'yesNo', emoji: '✅', route: '/rw/yes-no' },
  { key: 'preposition', emoji: '📦', route: '/rw/preposition' },
  { key: 'pictureQa', emoji: '🖼️', route: '/rw/picture-qa' },
] as const;

interface EnglishHomeProps {
  /** wordSetId → (wordId → progress row) for the active child. */
  progressBySet: Record<string, Record<string, WordProgressRow>>;
}

/** The English subject body: CEFR level switch + word-set grid. */
export function EnglishHome({ progressBySet }: EnglishHomeProps) {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div className="segmented" role="tablist" aria-label="Levels">
          {LEVELS.map((lvl, i) => (
            <button
              key={lvl}
              className={`seg-btn${i === 0 ? ' active' : ''}`}
              role="tab"
              aria-selected={i === 0}
              disabled={i !== 0}
            >
              {lvl}{i !== 0 && ' 🔒'}
            </button>
          ))}
        </div>
      </div>

      <section className="card" style={{ padding: 18, marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: '1.15rem', margin: 0 }}>✍️ {t('readingWriting.sectionTitle')}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted-fg)', fontWeight: 700, margin: '4px 0 0' }}>
            {t('readingWriting.sectionHint')}
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          {RW_ACTIVITIES.map((a) => (
            <button
              key={a.key}
              className="activity-btn"
              onClick={() => {
                speak(t(`readingWriting.${a.key}`));
                navigate(a.route);
              }}
              aria-label={t(`readingWriting.${a.key}`)}
            >
              <span aria-hidden="true">{a.emoji}</span>
              <span>{t(`readingWriting.${a.key}`)}</span>
              <span className="chev" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {wordSetRegistry.map((ws) => (
          <button
            key={ws.id}
            className="card"
            onClick={() => {
              speak(t(`wordSets.${ws.id}`));
              navigate(`/word-sets/${ws.id}`);
            }}
            style={{ padding: 18, minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, textAlign: 'left' }}
          >
            <span aria-hidden="true" style={{ fontSize: '2rem', lineHeight: 1 }}>{wordSetIcon(ws.id)}</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t(`wordSets.${ws.id}`)}</span>
            <HomeProgressTile wordSet={ws} progressMap={progressBySet[ws.id] ?? {}} />
          </button>
        ))}
      </div>
    </div>
  );
}
