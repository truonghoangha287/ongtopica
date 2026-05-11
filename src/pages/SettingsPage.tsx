import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { useProfileStore } from '@/shared/store/profile-store';
import { db } from '@/shared/db/db';
import { wordSetRegistry } from '@/data/yle-starters/index';
import type { WordProgressRow } from '@/shared/db/schema';

export function SettingsPage() {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const [audioEnabled, setAudioEnabled] = useState(localStorage.getItem('audioEnabled') !== 'false');
  const [allProgress, setAllProgress] = useState<WordProgressRow[]>([]);
  const wordProgressHook = useWordProgress();

  useEffect(() => {
    wordProgressHook.getAllProgress().then(setAllProgress);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    localStorage.setItem('audioEnabled', String(next));
  };

  const [unlocking, setUnlocking] = useState(false);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);

  const unlockAllActivities = async () => {
    if (!activeProfileId) return;
    setUnlocking(true);
    // Cycle stages 2→3→4→2 across words so all 4 activity types appear in sessions
    const stages: Array<1 | 2 | 3 | 4> = [2, 3, 4, 2, 3, 4, 2, 3, 4, 2];
    for (const wordSet of wordSetRegistry) {
      for (const [i, word] of wordSet.words.entries()) {
        await db.wordProgress.put({
          id: `${activeProfileId}:${word.id}`,
          childId: activeProfileId,
          wordId: word.id,
          wordSetId: wordSet.id,
          stage: stages[i % stages.length],
          consecutiveCorrect: 0,
          totalIncorrect: 0,
          priorityScore: 1.0,
          lastReviewedAt: Date.now(),
        });
      }
    }
    const updated = await wordProgressHook.getAllProgress();
    setAllProgress(updated);
    setUnlocking(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ minWidth: 48, minHeight: 48, marginBottom: 16 }}>
        ← {t('settings.backButton')}
      </button>
      <h1 style={{ fontSize: '2rem' }}>{t('settings.title')}</h1>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          margin: '24px 0',
          padding: 16,
          border: '2px solid #ddd',
          borderRadius: 12,
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>{t('settings.audioToggle')}</span>
        <button
          onClick={toggleAudio}
          style={{
            minWidth: 60,
            minHeight: 36,
            borderRadius: 20,
            background: audioEnabled ? '#4A90E2' : '#ccc',
            color: '#fff',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {audioEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <div style={{ margin: '24px 0', padding: 16, border: '2px dashed #ddd', borderRadius: 12 }}>
        <p style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#666' }}>
          Unlock all activity types (Recognize, Unscramble, Fill-in-blank) for every word set.
        </p>
        <button
          onClick={unlockAllActivities}
          disabled={unlocking || !activeProfileId}
          style={{
            minWidth: 180, minHeight: 44, fontSize: '1rem', borderRadius: 10,
            background: '#f0a500', color: 'white', border: 'none', cursor: 'pointer',
            opacity: unlocking ? 0.6 : 1,
          }}
        >
          {unlocking ? 'Unlocking…' : '⚡ Unlock All Activities'}
        </button>
      </div>
      {allProgress.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>{t('settings.parentDashboard')}</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Word</th>
                <th style={{ padding: '8px 4px' }}>Stage</th>
                <th style={{ padding: '8px 4px' }}>Errors</th>
              </tr>
            </thead>
            <tbody>
              {allProgress.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 4px' }}>{p.wordId.split('.').pop()}</td>
                  <td style={{ textAlign: 'center', padding: '8px 4px' }}>{p.stage}</td>
                  <td style={{ textAlign: 'center', padding: '8px 4px' }}>{p.totalIncorrect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
