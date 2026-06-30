export const MASTERY_THRESHOLD = 3;
export const SESSION_WORD_COUNT = 10;
export const MAX_SESSION_MINUTES = 8;
export const MAX_RETRIES = 1;
export const LETTER_CHOICE_COUNT = 3;
// Number of picture hotspots shown in a Listen & Match round (1 correct + distractors)
export const LISTEN_MATCH_OPTION_COUNT = 6;
// Number of word pairs in a Memory Match game
export const MEMORY_MATCH_PAIRS = 6;
export const INITIAL_PRIORITY = 1.0;
export const STRUGGLE_WEIGHT = 2.0;
export const CONFIDENCE_WEIGHT = 1.5;
// Fraction of a WordSet's words that must have advanced past stage N before stage N+1 button unlocks
export const STAGE_UNLOCK_THRESHOLD = 0.5;
// Number of words per Listen & Learn rotation batch
export const ROTATION_BATCH_SIZE = SESSION_WORD_COUNT;
// Achievement identifier roots (append `:${wordSetId}` for per-set variants)
export const ACHIEVEMENT_IDS = {
  FIRST_LISTEN: 'first_listen',
  CURIOUS_EAR: 'curious_ear',
  SHARP_EYE: 'sharp_eye',
  WORD_BUILDER: 'word_builder',
  SET_MASTER: 'set_master',
} as const;
