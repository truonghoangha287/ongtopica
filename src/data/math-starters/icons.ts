/** Emoji icon per math topic, mirroring the home-tile style of the English subject. */
export const MATH_TOPIC_ICONS: Record<string, string> = {
  numbers: '🔢',
  counting: '🍎',
  addition: '➕',
  subtraction: '➖',
  patterns: '🔁',
  shapes: '🔺',
  logic: '🧩',
};

export const mathTopicIcon = (id: string): string => MATH_TOPIC_ICONS[id] ?? '⭐';
