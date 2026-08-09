import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { useAnswerFeedback } from '@/english/vocab/components/answer-feedback';
import { playWin } from '@/shared/utils/sfx';
import { speak } from '@/shared/utils/speak';
import { getGame } from '@/english/grammar/services/games';
import { useRuleMastery } from '@/english/grammar/hooks/useRuleMastery';
import { selectRules } from '@/english/grammar/services/rule-scheduler';
import { makeRng } from '@/english/grammar/services/rng';
import type { MasteryMap } from '@/english/grammar/services/mastery';
import type { DrillItem } from '@/english/grammar/types';
import { BedAnchorCard } from './BedAnchorCard';

const ROUNDS = 10;

/**
 * The shared 10-round engine. It knows nothing about plurals, verbs or letters
 * — a `GrammarGame` supplies the items, and the scheduler decides which rules
 * to draw them from, weighted toward the ones this child is getting wrong.
 */
export function GrammarDrillPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const { signalCorrect, signalWrong, feedbackNode } = useAnswerFeedback();
  const { getMastery, recordAttempt } = useRuleMastery();

  const game = gameId ? getGame(gameId) : undefined;

  const [mastery, setMastery] = useState<MasteryMap | null>(null);
  const [seed, setSeed] = useState(1);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [wrongOption, setWrongOption] = useState<string | null>(null);
  /** First tap on the current item already recorded? */
  const [scored, setScored] = useState(false);
  const [done, setDone] = useState(false);
  const [showAnchor, setShowAnchor] = useState(false);

  useEffect(() => {
    getMastery().then(setMastery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the whole round list once per session so the questions are stable.
  const items = useMemo<DrillItem[]>(() => {
    if (!game || !mastery) return [];
    const rng = makeRng(seed);
    const rules = selectRules(game.rules, mastery, ROUNDS, rng);
    const built: DrillItem[] = [];
    for (const rule of rules) {
      const item = game.buildItem(rule, rng);
      // A rule that can't produce an item is skipped rather than crashing.
      if (item) built.push(item);
    }
    return built;
  }, [game, mastery, seed]);

  const item = items[index];

  useEffect(() => {
    if (item?.hint === 'bed-anchor' && index === 0 && !done) setShowAnchor(true);
  }, [item, index, done]);

  // Speak the *completed* sentence only after a correct answer. Speaking it on
  // arrival would read the answer aloud and make the question free.
  useEffect(() => {
    if (answered && item?.sentence) speak(item.sentence.replace('___', item.answer));
  }, [answered]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (done) playWin();
  }, [done]);

  const restart = useCallback(() => {
    setSeed((s) => s + 1);
    setIndex(0);
    setAnswered(false);
    setWrongOption(null);
    setScored(false);
    setDone(false);
    getMastery().then(setMastery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!game) {
    return (
      <div style={{ padding: 24 }}>
        Game not found. <a href="/">Go home</a>
      </div>
    );
  }

  const handleAnswer = (option: string) => {
    if (answered || !item) return;
    const isCorrect = option === item.answer;

    // Only the first tap counts. Retry-until-right is good for morale but
    // useless as a signal — counting the third guess would make every rule
    // look mastered.
    if (!scored) {
      setScored(true);
      void recordAttempt(item.rule, isCorrect);
    }

    if (isCorrect) {
      signalCorrect();
      setWrongOption(null);
      setAnswered(true);
    } else {
      signalWrong();
      setWrongOption(option);
      setTimeout(() => setWrongOption(null), 400);
    }
  };

  const next = () => {
    setAnswered(false);
    setScored(false);
    if (index + 1 >= items.length) setDone(true);
    else setIndex((i) => i + 1);
  };

  const mascot = answered ? 'celebrate' : wrongOption ? 'encourage' : 'idle';

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <CelebrationEffect active={done} />
      {feedbackNode}

      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <button
          className="icon-btn"
          onClick={() => navigate('/grammar')}
          aria-label={t('grammar.backButton')}
        >
          ✕
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{t(`grammar.${game.id}`)}</h1>
        <span
          className="badge"
          data-testid="drill-progress"
          style={{ marginLeft: 'auto' }}
          aria-live="polite"
        >
          {t('grammar.progress', { done: done ? items.length : index, total: ROUNDS })}
        </span>
      </header>

      {showAnchor && <BedAnchorCard onDismiss={() => setShowAnchor(false)} />}

      {!showAnchor && done && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 24 }}>
          <Mascot reaction="celebrate" />
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{t('grammar.wellDone')}</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-accent" onClick={restart} style={{ minHeight: 52, padding: '0 24px' }}>
              {t('grammar.playAgain')}
            </button>
            <button className="btn-primary" onClick={() => navigate('/grammar')} style={{ minHeight: 52, padding: '0 24px' }}>
              {t('grammar.exit')}
            </button>
          </div>
        </div>
      )}

      {!showAnchor && !done && item && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {Array.from({ length: item.picture.repeat }, (_, i) => (
              <img
                key={i}
                src={item.picture.asset}
                alt={i === 0 ? item.picture.alt : ''}
                aria-hidden={i > 0 ? 'true' : undefined}
                style={{
                  width: item.picture.repeat > 1 ? 88 : 200,
                  height: item.picture.repeat > 1 ? 88 : 150,
                  objectFit: 'contain',
                  borderRadius: 16,
                  background: 'var(--paper)',
                  boxShadow: 'var(--shadow-card)',
                }}
              />
            ))}
          </div>

          {item.sentence && (
            <p style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, textAlign: 'center' }}>
              {item.sentence}
            </p>
          )}

          {answered ? (
            <button
              className="btn-accent"
              onClick={next}
              aria-label={t('grammar.wellDone')}
              style={{ minHeight: 56, padding: '0 40px', fontSize: '1.4rem' }}
            >
              →
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
              {item.options.map((option) => (
                <motion.button
                  key={option}
                  data-testid="drill-option"
                  data-correct={option === item.answer}
                  onClick={() => handleAnswer(option)}
                  animate={wrongOption === option ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
                  transition={{ duration: 0.35 }}
                  whileTap={{ scale: 0.94 }}
                  className="card"
                  style={{
                    minWidth: 128,
                    minHeight: 64,
                    padding: '0 20px',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '1.3rem',
                    fontWeight: 900,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          )}

          {item.hint === 'bed-anchor' && !answered && (
            <button
              className="icon-btn"
              onClick={() => setShowAnchor(true)}
              aria-label={t('grammar.hintButton')}
            >
              💡
            </button>
          )}

          <Mascot reaction={mascot} />
        </div>
      )}
    </div>
  );
}
