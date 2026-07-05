import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getWordSet } from '@/data/yle-starters/index';
import { useSession } from '@/english/vocab/hooks/useSession';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { WordMap } from '@/english/vocab/components/WordMap';
import { wordSetIcon } from '@/data/yle-starters/icons';
import { MASTERY_THRESHOLD } from '@/shared/constants/game-constants';
import type { WordProgressRow } from '@/shared/db/schema';

const STAGE_DEFS = [
  { stage: 1, i18nKey: 'wordSetPage.stageIntroduce', emoji: '🎧' },
  { stage: 2, i18nKey: 'wordSetPage.stageRecognize', emoji: '❓' },
  { stage: 3, i18nKey: 'wordSetPage.stageUnscramble', emoji: '🔤' },
  { stage: 4, i18nKey: 'wordSetPage.stageFillInBlank', emoji: '✏️' },
] as const;

export function WordSetPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const wordSet = id ? getWordSet(id) : undefined;
  const { composeSession, composeListenMatch, isComposing } = useSession();
  const wordProgressHook = useWordProgress();
  const [progressMap, setProgressMap] = useState<Record<string, WordProgressRow>>({});

  useEffect(() => {
    if (!wordSet) return;
    wordProgressHook.getWordSetProgress(wordSet.id).then((rows) => {
      setProgressMap(Object.fromEntries(rows.map((r) => [r.wordId, r])));
    });
  }, [wordSet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!wordSet) return <div style={{ padding: 24 }}>Word set not found.</div>;

  const total = wordSet.words.length;
  const allMastered = wordSet.words.every((w) => {
    const p = progressMap[w.id];
    return p && p.stage === 4 && p.consecutiveCorrect >= MASTERY_THRESHOLD;
  });

  // FR-010: count words with introducedAt set
  const heardCount = Object.values(progressMap).filter((p) => p.introducedAt != null).length;
  // Vocabulary-games progress: words that have advanced past Listen & Learn
  const gamesCleared = Object.values(progressMap).filter((p) => p.stage >= 2).length;

  const handleStageStart = async (stage: number) => {
    const session = await composeSession(wordSet, stage as 1 | 2 | 3 | 4);
    navigate('/session', { state: { session } });
  };

  const handleListenMatch = async () => {
    const session = await composeListenMatch(wordSet);
    navigate('/session', { state: { session } });
  };

  const renderActivityButton = (def: (typeof STAGE_DEFS)[number]) => {
    const { stage, i18nKey, emoji } = def;
    return (
      <button
        key={stage}
        className="activity-btn"
        onClick={() => handleStageStart(stage)}
        disabled={isComposing}
        aria-label={t(i18nKey)}
      >
        <span aria-hidden="true">{emoji}</span>
        <span>{t(i18nKey)}</span>
        <span className="chev" aria-hidden="true">›</span>
      </button>
    );
  };

  return (
    <div className="page">
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('settings.backButton')}>
          ←
        </button>
        <span aria-hidden="true" style={{ fontSize: '1.8rem' }}>{wordSetIcon(wordSet.id)}</span>
        <h1 style={{ fontSize: '1.9rem', margin: 0 }}>{t(`wordSets.${wordSet.id}`)}</h1>
        {allMastered && (
          <span className="badge" style={{ marginLeft: 'auto', background: 'var(--success)', color: 'white' }}>
            {t('session.completedBadge')}
          </span>
        )}
      </header>

      {/* Listening */}
      <section className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontSize: '1.15rem', margin: 0 }}>🎧 {t('wordSetPage.sectionListening', 'Listening')}</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-fg)', fontWeight: 700 }}>
            {t('wordSetPage.heardIndicator', { heard: heardCount, total })}
          </span>
        </div>
        <div className="progress" style={{ marginBottom: 14 }}>
          <i style={{ width: `${total ? (heardCount / total) * 100 : 0}%` }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {renderActivityButton(STAGE_DEFS[0])}
          <button
            className="activity-btn"
            onClick={() => handleListenMatch()}
            disabled={isComposing}
            aria-label={t('wordSetPage.listenMatch')}
          >
            <span aria-hidden="true">👂</span>
            <span>{t('wordSetPage.listenMatch')}</span>
            <span className="chev" aria-hidden="true">›</span>
          </button>
        </div>
      </section>

      {/* Vocabulary Games */}
      <section className="card" style={{ padding: 18, marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.15rem', margin: '0 0 10px' }}>🎲 {t('wordSetPage.sectionGames', 'Vocabulary Games')}</h2>
        <div className="progress" style={{ marginBottom: 14 }}>
          <i style={{ width: `${total ? (gamesCleared / total) * 100 : 0}%` }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <button
            className="activity-btn"
            onClick={() => navigate(`/memory/${wordSet.id}`)}
            aria-label={t('wordSetPage.memoryMatch')}
          >
            <span aria-hidden="true">🧠</span>
            <span>{t('wordSetPage.memoryMatch')}</span>
            <span className="chev" aria-hidden="true">›</span>
          </button>
          {STAGE_DEFS.slice(1).map(renderActivityButton)}
        </div>
      </section>

      <h2 style={{ fontSize: '1.25rem', margin: '0 0 12px' }}>{t('wordSetPage.wordMap', 'Word Map')}</h2>
      <WordMap wordSet={wordSet} progressMap={progressMap} />
    </div>
  );
}
