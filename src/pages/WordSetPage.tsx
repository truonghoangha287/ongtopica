import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getWordSet } from '@/data/yle-starters/index';
import { useSession } from '@/english/vocab/hooks/useSession';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { WordMap } from '@/english/vocab/components/WordMap';
import { MASTERY_THRESHOLD, STAGE_UNLOCK_THRESHOLD } from '@/shared/constants/game-constants';
import type { WordProgressRow } from '@/shared/db/schema';

const STAGE_DEFS = [
  { stage: 1, i18nKey: 'wordSetPage.stageIntroduce' },
  { stage: 2, i18nKey: 'wordSetPage.stageRecognize' },
  { stage: 3, i18nKey: 'wordSetPage.stageUnscramble' },
  { stage: 4, i18nKey: 'wordSetPage.stageFillInBlank' },
];

function isUnlocked(stage: number, total: number, progressMap: Record<string, WordProgressRow>): boolean {
  if (stage === 1) return true;
  const advanced = Object.values(progressMap).filter((p) => p.stage > stage - 1).length;
  return advanced / total >= STAGE_UNLOCK_THRESHOLD;
}

export function WordSetPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const wordSet = id ? getWordSet(id) : undefined;
  const { composeSession, isComposing } = useSession();
  const wordProgressHook = useWordProgress();
  const [progressMap, setProgressMap] = useState<Record<string, WordProgressRow>>({});
  // shakingStage / pulsingStage drive the locked-button animations (FR-003b)
  const [shakingStage, setShakingStage] = useState<number | null>(null);
  const [pulsingStage, setPulsingStage] = useState<number | null>(null);

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

  const handleStageStart = async (stage: number) => {
    const session = await composeSession(wordSet, stage);
    navigate('/session', { state: { session } });
  };

  const handleLockedTap = (stage: number) => {
    setShakingStage(stage);
    setPulsingStage(stage - 1);
    setTimeout(() => { setShakingStage(null); setPulsingStage(null); }, 600);
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '16px auto' }}>
        {STAGE_DEFS.map(({ stage, i18nKey }) => {
          const unlocked = isUnlocked(stage, total, progressMap);
          return (
            <motion.button
              key={stage}
              animate={
                shakingStage === stage
                  ? { x: [0, -8, 8, -8, 8, 0] }
                  : pulsingStage === stage
                  ? { scale: [1, 1.12, 1] }
                  : {}
              }
              transition={{ duration: 0.4 }}
              onClick={() => unlocked ? handleStageStart(stage) : handleLockedTap(stage)}
              disabled={isComposing && unlocked}
              aria-label={unlocked ? t(i18nKey) : `${t(i18nKey)} — ${t('wordSetPage.locked')}`}
              style={{
                minWidth: 280,
                minHeight: 56,
                fontSize: '1.2rem',
                borderRadius: 14,
                cursor: isComposing ? 'default' : 'pointer',
                border: '2px solid',
                borderColor: unlocked ? '#4A90E2' : '#ccc',
                background: unlocked ? '#4A90E2' : '#f5f5f5',
                color: unlocked ? 'white' : '#aaa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              {!unlocked && <span aria-hidden="true">🔒</span>}
              {t(i18nKey)}
            </motion.button>
          );
        })}
      </div>

      <WordMap wordSet={wordSet} progressMap={progressMap} />
    </div>
  );
}
