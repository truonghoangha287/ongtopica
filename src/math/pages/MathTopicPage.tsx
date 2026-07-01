import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMathTopic, mathTopicRegistry, topicIndex } from '@/data/math-starters/index';
import { mathTopicIcon } from '@/data/math-starters/icons';
import { useMathSession } from '@/math/hooks/useMathSession';
import { useMathProgress } from '@/math/hooks/useMathProgress';
import { isTopicUnlocked, masteredCount } from '@/math/services/topic-progression';
import type { MathProgressMap } from '@/math/types/math.types';

export function MathTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('math');
  const navigate = useNavigate();
  const topic = id ? getMathTopic(id) : undefined;
  const { composeSession, isComposing } = useMathSession();
  const { getAllProgress } = useMathProgress();
  const [progressMap, setProgressMap] = useState<MathProgressMap>({});

  useEffect(() => {
    getAllProgress().then((rows) => {
      setProgressMap(Object.fromEntries(rows.map((r) => [r.problemId, r])));
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!topic) return <div style={{ padding: 24 }}>{t('topicPage.notFound')}</div>;

  const index = topicIndex(topic.id);
  const unlocked = isTopicUnlocked(index, mathTopicRegistry, progressMap);
  const total = topic.problems.length;
  const mastered = masteredCount(topic, progressMap);
  const prevTopicId = index > 0 ? mathTopicRegistry[index - 1].id : null;

  const handlePlay = async () => {
    const session = await composeSession(topic);
    navigate('/math-session', { state: { session } });
  };

  return (
    <div className="page">
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button className="icon-btn" onClick={() => navigate('/')} aria-label={t('topicPage.backButton')}>
          ←
        </button>
        <span aria-hidden="true" style={{ fontSize: '1.8rem' }}>{mathTopicIcon(topic.id)}</span>
        <h1 style={{ fontSize: '1.9rem', margin: 0 }}>{t(`topics.${topic.id}`)}</h1>
        {mastered === total && total > 0 && (
          <span className="badge" style={{ marginLeft: 'auto', background: 'var(--success)', color: 'white' }}>
            {t('topicPage.masteredBadge')}
          </span>
        )}
      </header>

      {!unlocked ? (
        <section className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div aria-hidden="true" style={{ fontSize: '3rem' }}>🔒</div>
          <p style={{ fontWeight: 700 }}>
            {t('topicPage.lockedHint', { topic: prevTopicId ? t(`topics.${prevTopicId}`) : '' })}
          </p>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ minHeight: 52, padding: '0 24px' }}>
            {t('topicPage.backButton')}
          </button>
        </section>
      ) : (
        <section className="card" style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>⭐ {t('topicPage.progressTitle')}</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted-fg)', fontWeight: 700 }}>
              {t('topicPage.masteredIndicator', { mastered, total })}
            </span>
          </div>
          <div className="progress" style={{ marginBottom: 16 }} aria-label={t('topicPage.masteredIndicator', { mastered, total })}>
            <i style={{ width: `${total ? (mastered / total) * 100 : 0}%` }} />
          </div>
          <button
            className="activity-btn"
            onClick={handlePlay}
            disabled={isComposing}
            aria-label={t('topicPage.playButton')}
          >
            <span aria-hidden="true">▶️</span>
            <span>{t('topicPage.playButton')}</span>
            <span className="chev" aria-hidden="true">›</span>
          </button>
        </section>
      )}
    </div>
  );
}
