/**
 * Maps each vocabulary word to its Noto Emoji codepoint.
 * Words marked AI_FALLBACK have no suitable emoji and are generated via fal.ai Flux.
 */

export const AI_FALLBACK = 'AI_FALLBACK' as const;

export type EmojiEntry = string | typeof AI_FALLBACK;

export const EMOJI_MAP: Record<string, EmojiEntry> = {
  // ── Animals ───────────────────────────────────────────────────────────────
  bear:       '🐻',
  bird:       '🐦',
  cat:        '🐱',
  chicken:    '🐔',
  cow:        '🐄',
  crocodile:  '🐊',
  dog:        '🐶',
  duck:       '🦆',
  elephant:   '🐘',
  fish:       '🐟',
  frog:       '🐸',
  giraffe:    '🦒',
  goat:       '🐐',
  hippo:      '🦛',
  horse:      '🐴',
  kangaroo:   '🦘',
  lion:       '🦁',
  lizard:     '🦎',
  monkey:     '🐒',
  mouse:      '🐭',
  panda:      '🐼',
  parrot:     '🦜',
  penguin:    '🐧',
  rabbit:     '🐰',
  shark:      '🦈',
  sheep:      '🐑',
  snake:      '🐍',
  spider:     '🕷️',
  tiger:      '🐯',
  whale:      '🐳',
  zebra:      '🦓',

  // ── Body ──────────────────────────────────────────────────────────────────
  arm:        '💪',
  back:       AI_FALLBACK,   // 🔙 is a direction arrow — not body
  ear:        '👂',
  eye:        '👁️',
  face:       '😊',
  foot:       '🦶',
  hair:       '💇',
  hand:       '✋',
  head:       '🗣️',
  leg:        '🦵',
  mouth:      '👄',
  nose:       '👃',
  tooth:      '🦷',

  // ── Clothes ───────────────────────────────────────────────────────────────
  boots:      '🥾',
  dress:      '👗',
  gloves:     '🧤',
  pants:      '👖',
  scarf:      '🧣',
  glasses:    '👓',
  hat:        '🎩',
  jacket:     '🧥',
  jeans:      '👖',
  shirt:      '👕',
  shoes:      '👟',
  shorts:     '🩳',
  skirt:      '👗',           // shares 👗 with dress — accept overlap
  socks:      '🧦',
  sweater:    '🧶',           // yarn ball — knitted-wool stand-in
  trousers:   '👖',           // shares 👖 with jeans/pants — synonyms in EN

  // ── Colors ────────────────────────────────────────────────────────────────
  black:      '⚫',
  blue:       '🔵',
  brown:      '🟤',
  green:      '🟢',
  grey:       '🩶',
  orange:     '🟠',
  pink:       '🩷',
  purple:     '🟣',
  red:        '🔴',
  white:      '⚪',
  yellow:     '🟡',

  // ── Family ────────────────────────────────────────────────────────────────
  baby:       '👶',
  boy:        '👦',
  brother:    AI_FALLBACK,   // 👦 same as boy — ambiguous
  dad:        '👨',
  friend:     '🤝',
  girl:       '👧',
  grandma:    '👵',
  grandpa:    '👴',
  man:        '🧑',
  mum:        '👩',
  sister:     AI_FALLBACK,   // 👧 same as girl — ambiguous
  woman:      '👩',

  // ── Food ──────────────────────────────────────────────────────────────────
  apple:      '🍎',
  banana:     '🍌',
  bean:       '🫘',
  bread:      '🍞',
  cake:       '🎂',
  carrot:     '🥕',
  // chicken already mapped in animals (food context uses 🍗)
  chocolate:  '🍫',
  egg:        '🥚',
  grape:      '🍇',
  juice:      '🧃',
  lemon:      '🍋',
  mango:      '🥭',
  meat:       '🥩',
  milk:       '🥛',
  onion:      '🧅',
  pea:        '🫛',
  pizza:      '🍕',
  potato:     '🥔',
  rice:       '🍚',
  salad:      '🥗',
  sandwich:   '🥪',
  sausage:    '🌭',
  soup:       '🍲',
  sugar:      '🍬',
  tomato:     '🍅',
  water:      '💧',

  // ── Home ──────────────────────────────────────────────────────────────────
  bath:       '🛁',
  bed:        '🛏️',
  chair:      '🪑',
  cupboard:   '🗄️',
  desk:       '🖥️',
  door:       '🚪',
  floor:      '🟫',           // brown square — reads as wooden/tiled floor
  garden:     '🌻',
  house:      '🏠',
  kitchen:    '🍳',
  lamp:       '💡',
  phone:      '📱',
  sofa:       '🛋️',
  table:      '🪑',
  toilet:     '🚽',
  window:     '🪟',

  // ── Places ────────────────────────────────────────────────────────────────
  cinema:     '🎬',
  hospital:   '🏥',
  park:       '🌳',
  school:     '🏫',
  shop:       '🛍️',
  town:       '🏙️',
  zoo:        '🦒',   // use giraffe (not lion — lion is already in animals)

  // ── School ────────────────────────────────────────────────────────────────
  bag:        '🎒',
  book:       '📚',
  crayon:     '🖍️',
  eraser:     '🧽',           // sponge — closest "rubs things out" emoji
  pen:        '🖊️',
  pencil:     '✏️',
  ruler:      '📏',

  // ── Sports ────────────────────────────────────────────────────────────────
  baseball:   '⚾',
  basketball: '🏀',
  football:   '⚽',
  hockey:     '🏒',
  swimming:   '🏊',
  tennis:     '🎾',

  // ── Toys ──────────────────────────────────────────────────────────────────
  ball:       '🏐',   // use volleyball (⚽ reserved for football in sports)
  bat:        '🏏',
  bike:       '🚲',
  block:      '🟦',
  card:       '🃏',
  doll:       '🪆',
  drum:       '🥁',
  game:       '🎮',
  kite:       '🪁',
  puzzle:     '🧩',
  robot:      '🤖',
  train:      '🚂',

  // ── Transport ─────────────────────────────────────────────────────────────
  boat:       '⛵',
  bus:        '🚌',
  car:        '🚗',
  helicopter: '🚁',
  lorry:      '🚛',
  motorbike:  '🏍️',
  plane:      '✈️',
  taxi:       '🚕',

  // ── Weather ───────────────────────────────────────────────────────────────
  cloud:      '☁️',
  rain:       '🌧️',
  snow:       '❄️',
  sun:        '☀️',
  wind:       '💨',

  // ── Work ──────────────────────────────────────────────────────────────────
  doctor:     '👨‍⚕️',
  farmer:     '👨‍🌾',
  nurse:      '👩‍⚕️',
  teacher:    '👩‍🏫',
};

/** Per-set pastel background colours (WCAG 3:1 contrast against dark emoji foreground). */
export const SET_BACKGROUNDS: Record<string, { r: number; g: number; b: number }> = {
  animals:   { r: 200, g: 230, b: 255 }, // sky blue
  body:      { r: 255, g: 220, b: 210 }, // skin peach
  clothes:   { r: 220, g: 210, b: 255 }, // lavender
  colors:    { r: 245, g: 245, b: 200 }, // pale yellow
  family:    { r: 255, g: 225, b: 200 }, // warm peach
  food:      { r: 220, g: 250, b: 215 }, // mint green
  home:      { r: 255, g: 235, b: 200 }, // cream
  places:    { r: 200, g: 240, b: 230 }, // seafoam
  school:    { r: 215, g: 235, b: 255 }, // light blue
  sports:    { r: 210, g: 255, b: 220 }, // light green
  toys:      { r: 255, g: 215, b: 230 }, // light pink
  transport: { r: 200, g: 220, b: 245 }, // steel blue
  weather:   { r: 230, g: 245, b: 255 }, // pale sky
  work:      { r: 240, g: 230, b: 255 }, // soft purple
};

const DEFAULT_BG = { r: 240, g: 240, b: 240 };

export function getSetBackground(setName: string): { r: number; g: number; b: number } {
  return SET_BACKGROUNDS[setName] ?? DEFAULT_BG;
}

/** Words that need AI-generated images instead of emoji */
export const AI_FALLBACK_WORDS = Object.entries(EMOJI_MAP)
  .filter(([, v]) => v === AI_FALLBACK)
  .map(([k]) => k);

/** Words that use emoji rendering */
export const EMOJI_WORDS = Object.entries(EMOJI_MAP)
  .filter(([, v]) => v !== AI_FALLBACK)
  .map(([k]) => k);

/** Maps every vocabulary word to its set name. */
export const WORD_SET: Record<string, string> = {
  // Animals
  bear: 'animals', bird: 'animals', cat: 'animals', chicken: 'animals', cow: 'animals',
  crocodile: 'animals', dog: 'animals', duck: 'animals', elephant: 'animals', fish: 'animals',
  frog: 'animals', giraffe: 'animals', goat: 'animals', hippo: 'animals', horse: 'animals',
  kangaroo: 'animals', lion: 'animals', lizard: 'animals', monkey: 'animals', mouse: 'animals',
  panda: 'animals', parrot: 'animals', penguin: 'animals', rabbit: 'animals', shark: 'animals',
  sheep: 'animals', snake: 'animals', spider: 'animals', tiger: 'animals', whale: 'animals',
  zebra: 'animals',
  // Body
  arm: 'body', back: 'body', ear: 'body', eye: 'body', face: 'body', foot: 'body',
  hair: 'body', hand: 'body', head: 'body', leg: 'body', mouth: 'body', nose: 'body', tooth: 'body',
  // Clothes
  boots: 'clothes', dress: 'clothes', gloves: 'clothes', pants: 'clothes', scarf: 'clothes',
  glasses: 'clothes', hat: 'clothes', jacket: 'clothes', jeans: 'clothes', shirt: 'clothes',
  shoes: 'clothes', shorts: 'clothes', skirt: 'clothes', socks: 'clothes', sweater: 'clothes',
  trousers: 'clothes',
  // Colors
  black: 'colors', blue: 'colors', brown: 'colors', green: 'colors', grey: 'colors',
  orange: 'colors', pink: 'colors', purple: 'colors', red: 'colors', white: 'colors', yellow: 'colors',
  // Family
  baby: 'family', boy: 'family', brother: 'family', dad: 'family', friend: 'family',
  girl: 'family', grandma: 'family', grandpa: 'family', man: 'family', mum: 'family',
  sister: 'family', woman: 'family',
  // Food
  apple: 'food', banana: 'food', bean: 'food', bread: 'food', cake: 'food', carrot: 'food',
  chocolate: 'food', egg: 'food', grape: 'food', juice: 'food', lemon: 'food', mango: 'food',
  meat: 'food', milk: 'food', onion: 'food', pea: 'food', pizza: 'food', potato: 'food',
  rice: 'food', salad: 'food', sandwich: 'food', sausage: 'food', soup: 'food', sugar: 'food',
  tomato: 'food', water: 'food',
  // Home
  bath: 'home', bed: 'home', chair: 'home', cupboard: 'home', desk: 'home', door: 'home',
  floor: 'home', garden: 'home', house: 'home', kitchen: 'home', lamp: 'home', phone: 'home',
  sofa: 'home', table: 'home', toilet: 'home', window: 'home',
  // Places
  cinema: 'places', hospital: 'places', park: 'places', school: 'places', shop: 'places',
  town: 'places', zoo: 'places',
  // School
  bag: 'school', book: 'school', crayon: 'school', eraser: 'school', pen: 'school',
  pencil: 'school', ruler: 'school',
  // Sports
  baseball: 'sports', basketball: 'sports', football: 'sports', hockey: 'sports',
  swimming: 'sports', tennis: 'sports',
  // Toys
  ball: 'toys', bat: 'toys', bike: 'toys', block: 'toys', card: 'toys', doll: 'toys',
  drum: 'toys', game: 'toys', kite: 'toys', puzzle: 'toys', robot: 'toys', train: 'toys',
  // Transport
  boat: 'transport', bus: 'transport', car: 'transport', helicopter: 'transport', lorry: 'transport',
  motorbike: 'transport', plane: 'transport', taxi: 'transport',
  // Weather
  cloud: 'weather', rain: 'weather', snow: 'weather', sun: 'weather', wind: 'weather',
  // Work
  doctor: 'work', farmer: 'work', nurse: 'work', teacher: 'work',
};
