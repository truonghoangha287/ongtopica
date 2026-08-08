/** Emoji icon per word set, mirroring the "Ongtopica Adventures" home tiles. */
export const WORD_SET_ICONS: Record<string, string> = {
  animals: '🐾',
  body: '✋',
  clothes: '👕',
  colors: '🎨',
  family: '👨‍👩‍👧',
  food: '🍎',
  furniture: '🛋️',
  home: '🏠',
  places: '🏖️',
  school: '🏫',
  sports: '⚽',
  toys: '🧸',
  transport: '🚗',
  weather: '☀️',
  work: '👷',
};

export const wordSetIcon = (id: string): string => WORD_SET_ICONS[id] ?? '⭐';
