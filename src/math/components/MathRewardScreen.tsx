import { useTranslation } from 'react-i18next';
import { BeeMascot } from '@/math/components/BeeMascot';
import { MONO } from '@/math/components/QuizOption';
import { HONEY_PER_HIVE } from '@/math/constants/math-constants';
import type { StarRating } from '@/math/types/math.types';

interface MathRewardScreenProps {
  isOlympiad: boolean;
  topicName: string;
  level: number;
  stars: StarRating;
  streak: number;
  accuracy: number;
  onNext: () => void;
  onBackToHive: () => void;
}

const GOLD = 'var(--star)';
const DIM = 'oklch(88% 0.02 85)';

/** Confetti fleck (CSS-only so it works offline and pauses on reduced-motion). */
function Fleck({ left, top, color, round, delay }: { left: number; top: number; color: string; round?: boolean; delay: number }) {
  return (
    <span aria-hidden="true" className="ma-confetti" style={{ position: 'absolute', top, left, width: 10, height: 10, background: color, borderRadius: round ? '50%' : 3, animationDelay: `${delay}s` }} />
  );
}

const tile: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '13px 18px', borderRadius: 18, background: 'var(--paper)', boxShadow: '0 6px 18px -12px rgba(80,60,30,.4)' };

/** End-of-hive celebration: stars, rewards, badges, and onward buttons. */
export function MathRewardScreen(props: MathRewardScreenProps) {
  const { isOlympiad, topicName, level, stars, streak, accuracy, onNext, onBackToHive } = props;
  const { t } = useTranslation('math');

  return (
    <div className="page math-world" style={{ position: 'relative', textAlign: 'center', overflow: 'hidden' }}>
      <Fleck left={40} top={20} color="var(--ma)" delay={0} />
      <Fleck left={150} top={12} color="var(--primary)" delay={0.3} />
      <Fleck left={260} top={26} color={GOLD} delay={0.6} />
      <Fleck left={210} top={16} color="var(--success)" round delay={0.15} />

      <div style={{ marginTop: 16 }}>
        <BeeMascot size={42} reaction="celebrate" />
      </div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '6px 0 2px' }}>
        {isOlympiad ? t('reward.champion') : t('reward.hiveCleared')}
      </h1>
      <p style={{ margin: '0 0 16px', color: 'var(--muted-fg)', fontWeight: 800 }}>
        {isOlympiad ? t('reward.olympiadSub') : t('reward.hiveSub', { topic: topicName, level })}
      </p>

      <div role="img" aria-label={t('reward.starsAria', { count: stars })} style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 10, marginBottom: 20 }}>
        <span className="ma-pop" style={{ fontSize: '2.9rem', color: stars >= 1 ? GOLD : DIM }}>★</span>
        <span className="ma-pop" style={{ fontSize: '3.9rem', color: stars >= 2 ? GOLD : DIM, animationDelay: '0.15s' }}>★</span>
        <span className="ma-pop" style={{ fontSize: '2.9rem', color: stars >= 3 ? GOLD : DIM, animationDelay: '0.3s' }}>★</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 11, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={tile}>
          <span aria-hidden="true" style={{ position: 'relative', width: 40, height: 52, borderRadius: '8px 8px 12px 12px', border: '3px solid var(--star)', overflow: 'hidden', background: '#fff' }}>
            <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '78%', background: 'var(--star)' }} />
          </span>
          <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>{t('reward.honey', { count: HONEY_PER_HIVE })}</span>
        </div>
        <div style={tile}>
          <span aria-hidden="true" style={{ fontSize: '1.4rem' }}>🔥</span>
          <span style={{ fontWeight: 900, fontSize: '1rem' }}>{streak}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted-fg)', fontWeight: 800 }}>{t('reward.streak')}</span>
        </div>
        <div style={tile}>
          <span style={{ fontFamily: MONO, fontWeight: 900, fontSize: '1.3rem', color: 'var(--success)' }}>{accuracy}%</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted-fg)', fontWeight: 800 }}>{t('reward.accuracy')}</span>
        </div>
      </div>

      <p style={{ margin: '0 0 8px', fontWeight: 900, fontSize: '0.76rem', color: 'var(--muted-fg)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t('reward.badgesHeading')}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 11, marginBottom: 22 }}>
        {[
          { icon: '🔢', label: t('reward.badgeCounter'), on: true },
          { icon: '👁️', label: t('reward.badgeSharpEye'), on: true },
          { icon: '🔥', label: t('reward.badge7day'), on: true },
          { icon: '🔒', label: t('reward.badgeLocked'), on: false },
        ].map((b) => (
          <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: b.on ? 1 : 0.5 }}>
            <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 50, height: 50, borderRadius: 16, background: b.on ? 'var(--ma-soft)' : 'var(--muted)', border: b.on ? '2px solid var(--ma)' : 'none', fontSize: '1.4rem' }}>{b.icon}</span>
            <span style={{ fontSize: '0.64rem', fontWeight: 800, color: b.on ? undefined : 'var(--muted-fg)' }}>{b.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto' }}>
        <button onClick={onNext} style={{ padding: 15, borderRadius: 9999, background: 'var(--ma)', color: '#fff', fontWeight: 900, fontSize: '1.05rem', boxShadow: '0 14px 26px -12px var(--ma)' }}>
          {t('reward.nextHive')}
        </button>
        <button className="card" onClick={onBackToHive} style={{ padding: 13, borderRadius: 9999, fontWeight: 800 }}>
          {t('reward.backToHive')}
        </button>
      </div>
    </div>
  );
}
