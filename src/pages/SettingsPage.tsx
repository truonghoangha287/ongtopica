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

  // Grown-ups-only gate: a simple sum keeps a 6-year-old out of Settings, where
  // they could silence the app or wipe progress.
  const [gateA] = useState(() => 2 + Math.floor(Math.random() * 6));
  const [gateB] = useState(() => 2 + Math.floor(Math.random() * 6));
  const [gateAnswer, setGateAnswer] = useState('');
  const [gateOpen, setGateOpen] = useState(false);
  const submitGate = () => {
    if (Number(gateAnswer) === gateA + gateB) setGateOpen(true);
    else setGateAnswer('');
  };

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

  if (!gateOpen) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('settings.backButton')}>
            ←
          </button>
          <h1 style={{ fontSize: '1.9rem', margin: 0 }}>⚙️ {t('settings.title')}</h1>
        </header>
        <div className="card" style={{ padding: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>🔒 {t('settings.gateTitle')}</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            {gateA} + {gateB} = ?
          </p>
          <input
            inputMode="numeric"
            value={gateAnswer}
            onChange={(e) => setGateAnswer(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && submitGate()}
            aria-label={t('settings.gateTitle')}
            style={{ fontSize: '1.4rem', padding: '10px 16px', borderRadius: 12, textAlign: 'center', width: 120 }}
            autoFocus
          />
          <button className="btn-accent" onClick={submitGate} style={{ minWidth: 140, minHeight: 48 }}>
            {t('settings.gateButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('settings.backButton')}>
          ←
        </button>
        <h1 style={{ fontSize: '1.9rem', margin: 0 }}>⚙️ {t('settings.title')}</h1>
      </header>

      <div
        className="card"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16, padding: 18 }}
      >
        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t('settings.audioToggle')}</span>
        <button
          onClick={toggleAudio}
          aria-pressed={audioEnabled}
          style={{
            minWidth: 64,
            minHeight: 38,
            borderRadius: 9999,
            background: audioEnabled ? 'var(--primary)' : 'var(--border)',
            color: audioEnabled ? 'var(--primary-fg)' : 'var(--muted-fg)',
            fontWeight: 800,
            boxShadow: audioEnabled ? 'var(--shadow-pop)' : 'none',
          }}
        >
          {audioEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Developer-only shortcut — never shipped to children in production. */}
      {import.meta.env.DEV && (
        <div className="card" style={{ marginBottom: 16, padding: 18, border: '2px dashed var(--border)', boxShadow: 'none', background: 'transparent' }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--muted-fg)' }}>
            Unlock all activity types (Recognize, Unscramble, Fill-in-blank) for every word set.
          </p>
          <button
            className="btn-accent"
            onClick={unlockAllActivities}
            disabled={unlocking || !activeProfileId}
            style={{ minWidth: 200, minHeight: 48, fontSize: '1rem', padding: '0 22px' }}
          >
            {unlocking ? 'Unlocking…' : '⚡ Unlock All Activities'}
          </button>
        </div>
      )}

      {allProgress.length > 0 && (
        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: '1.3rem', margin: '0 0 12px' }}>{t('settings.parentDashboard')}</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-fg)' }}>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Word</th>
                <th style={{ padding: '8px 4px' }}>Stage</th>
                <th style={{ padding: '8px 4px' }}>Errors</th>
              </tr>
            </thead>
            <tbody>
              {allProgress.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 4px', fontWeight: 700 }}>{p.wordId.split('.').pop()}</td>
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
