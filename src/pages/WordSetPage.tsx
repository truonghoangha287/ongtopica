import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getWordSet } from '@/data/yle-starters/index';
import { useSession } from '@/english/vocab/hooks/useSession';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { WordMap } from '@/english/vocab/components/WordMap';
import { MASTERY_THRESHOLD } from '@/shared/constants/game-constants';
import type { WordProgressRow } from '@/shared/db/schema';

export function WordSetPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const wordSet = id ? getWordSet(id) : undefined;
  const { composeSession, isComposing } = useSession();
  const wordProgressHook = useWordProgress();
  const [progressMap, setProgressMap] = useState<Record<string, WordProgressRow>>({});

  useEffect(() => {
    if (!wordSet) return;
    wordProgressHook.getWordSetProgress(wordSet.id).then((rows) => {
      setProgressMap(Object.fromEntries(rows.map((r) => [r.wordId, r])));
    });
  }, [wordSet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!wordSet) return <div style={{ padding: 24 }}>Word set not found.</div>;

  const allMastered = wordSet.words.every((w) => {
    const p = progressMap[w.id];
    return p && p.stage === 4 && p.consecutiveCorrect >= MASTERY_THRESHOLD;
  });

  const handleStart = async () => {
    const session = await composeSession(wordSet);
    navigate('/session', { state: { session } });
  };

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <button onClick={() => navigate(-1)} style={{ float: 'left', minWidth: 48, minHeight: 48 }}>
        ←
      </button>
      <h1 style={{ fontSize: '2.5rem' }}>{t(`wordSets.${wordSet.id}`)}</h1>
      {allMastered && (
        <p style={{ color: '#4A90E2', fontWeight: 'bold', fontSize: '1.2rem' }}>
          {t('session.completedBadge')}
        </p>
      )}
      <button
        onClick={handleStart}
        disabled={isComposing}
        style={{ minWidth: 200, minHeight: 56, fontSize: '1.3rem', borderRadius: 12, margin: '16px 0', cursor: 'pointer' }}
      >
        {isComposing ? '...' : allMastered ? t('session.reviewAllButton') : 'Start Session'}
      </button>
      <WordMap wordSet={wordSet} progressMap={progressMap} />
    </div>
  );
}
