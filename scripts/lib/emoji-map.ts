/**
 * Maps each vocabulary word to its Noto Emoji codepoint.
 * Words marked AI_FALLBACK have no suitable emoji. When FAL_KEY is set they are
 * generated via fal.ai Flux; otherwise `generate-custom-images.ts` provides
 * hand-authored flat-vector illustrations (back, brother, sister, sweater).
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
  back:       AI_FALLBACK,   // 🔙 is a direction arrow — custom illustration
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
  shirt:      '👔',           // 👕 is now T-shirt — keep the two visibly distinct
  shoes:      '👟',
  shorts:     '🩳',
  skirt:      '👗',           // shares 👗 with dress — accept overlap
  socks:      '🧦',
  sweater:    AI_FALLBACK,   // no sweater emoji (🧶 yarn ball misreads); custom illustration
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
  brother:    AI_FALLBACK,   // 👦 same as boy — custom illustration (two boys)
  dad:        '👨',
  friend:     '🤝',
  girl:       '👧',
  grandma:    '👵',
  grandpa:    '👴',
  man:        '🧑',
  mum:        '👩',
  sister:     AI_FALLBACK,   // 👧 same as girl — custom illustration (two girls)
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

  // ── Furniture ─────────────────────────────────────────────────────────────
  // The ten below have no Noto emoji — they render as hand-authored SVGs via
  // generate-custom-images.ts. The five after them use ordinary Noto emoji.
  wardrobe:   AI_FALLBACK,
  shelf:      AI_FALLBACK,
  bookcase:   AI_FALLBACK,
  drawer:     AI_FALLBACK,
  carpet:     AI_FALLBACK,
  curtain:    AI_FALLBACK,
  cushion:    AI_FALLBACK,
  blanket:    AI_FALLBACK,
  fridge:     AI_FALLBACK,
  stool:      AI_FALLBACK,
  bin:        '🗑️',
  plant:      '🪴',
  basket:     '🧺',
  candle:     '🕯️',
  vase:       '🏺',

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
  park:       '🏞️',           // 🌳 is now the nature word `tree`
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
  // ── Starters expansion ─────────────────────────────────────────────────────
  donkey: '🫏',
  bee: '🐝',
  finger: '👆',
  body: '🧍',
  cap: '🧢',
  umbrella: '☂️',
  watch: '⌚',
  family: '👨‍👩‍👧‍👦',
  burger: '🍔',
  chips: '🍟',
  cheese: '🧀',
  pear: '🍐',
  watermelon: '🍉',
  tea: '🍵',
  lemonade: '🥤',
  coffee: '☕',
  coconut: '🥥',
  pineapple: '🍍',
  melon: '🍈',
  kiwi: '🥝',
  sweet: '🍭',
  clock: '🕐',
  mirror: '🪞',
  wall: '🧱',
  key: '🔑',
  box: '📦',
  radio: '📻',
  farm: '🏡',
  beach: '🏖️',
  street: '🛣️',
  station: '🚉',
  market: '🏪',
  playground: '🛝',
  paint: '🎨',
  paper: '📄',
  picture: '🖼️',
  scissors: '✂️',
  computer: '💻',
  notebook: '📓',
  badminton: '🏸',
  volleyball: '🏐',
  running: '🏃',
  ski: '⛷️',
  golf: '⛳',
  boxing: '🥊',
  teddy: '🧸',
  balloon: '🎈',
  guitar: '🎸',
  piano: '🎹',
  camera: '📷',
  ship: '🚢',
  truck: '🚚',
  van: '🚐',
  tractor: '🚜',
  scooter: '🛵',
  rainbow: '🌈',
  ice: '🧊',
  star: '⭐',
  moon: '🌙',
  storm: '⛈️',
  cook: '🧑‍🍳',
  pilot: '🧑‍✈️',
  police: '👮',
  clown: '🤡',
  king: '🤴',
  queen: '👸',

  // ── 2026 Starters wordlist audit ───────────────────────────────────────────
  // Words on the official Pre A1 Starters list that the app had never taught.
  // AI_FALLBACK here means "no Noto emoji reads as this word" — those render as
  // hand-authored SVGs in generate-custom-images.ts, same as the furniture set.
  jellyfish: '🪼',
  'polar bear': '🐻‍❄️',
  tail: AI_FALLBACK,          // no tail emoji — custom illustration
  'T-shirt': '👕',
  'baseball cap': '🧢',       // shares 🧢 with `cap` — the same object, both examinable
  handbag: '👜',
  father: '👨',               // shares 👨 with `dad` — synonym pair
  mother: '👩',               // shares 👩 with `mum` — synonym pair
  grandfather: '👴',          // shares 👴 with `grandpa` — synonym pair
  grandmother: '👵',          // shares 👵 with `grandma` — synonym pair
  cousin: AI_FALLBACK,        // no cousin emoji — custom illustration
  child: '🧒',
  kid: '🧒',                  // shares 🧒 with `child` — synonym pair
  person: '🧑',               // shares 🧑 with `man` — synonym pair
  classmate: '🧑‍🤝‍🧑',
  'ice cream': '🍦',
  pie: '🥧',
  lime: '🍋‍🟩',
  meatballs: AI_FALLBACK,     // no meatball emoji — custom illustration
  armchair: AI_FALLBACK,
  bathroom: '🚿',             // shower, not 🛁 — `bath` already owns the tub
  bedroom: '🛌',              // person in bed, not 🛏️ — `bed` already owns the bed
  'dining room': '🍽️',
  'living room': AI_FALLBACK, // 🛋️ is `sofa` — custom illustration
  hall: AI_FALLBACK,
  mat: AI_FALLBACK,
  rug: AI_FALLBACK,
  television: '📺',
  board: AI_FALLBACK,
  classroom: AI_FALLBACK,     // 🏫 is `school` — custom illustration
  rubber: '🧽',               // shares 🧽 with `eraser` — UK/US synonym pair
  tablet: AI_FALLBACK,
  keyboard: '⌨️',
  drawing: AI_FALLBACK,
  painting: AI_FALLBACK,
  photo: AI_FALLBACK,         // 📷 is `camera` — custom illustration
  poster: AI_FALLBACK,
  bookshop: '🏬',
  alien: '👽',
  monster: '👹',
  'board game': '🎲',
  skateboard: '🛹',
  'table tennis': '🏓',
  fishing: '🎣',
  skateboarding: '🛹',        // shares 🛹 with `skateboard` — the board and the sport
  'tennis racket': '🎾',      // shares 🎾 with `tennis` — the racket and the sport
  sea: '🌊',
  sand: '🏜️',
  shell: '🐚',
  tree: '🌳',
  flower: '🌸',
  morning: '🌅',
  afternoon: '🌤️',
  evening: '🌆',
  night: '🌃',
  day: '🌞',                  // 🌞 not ☀️ — `sun` already owns the plain sun
  birthday: '🎉',

  // Depictable words from the same audit. The metalinguistic Starters entries
  // (answer, example, question, sentence, page, word, part, thing) are
  // deliberately absent: they appear in exam rubrics rather than as pictures,
  // and Cambridge's own Starters picture wordlist does not illustrate them.
  animal: '🐾',
  pet: '🐹',                  // a hamster, not 🐕 — `dog` already owns the dog
  clothes: '👚',
  breakfast: '🥞',
  lunch: '🍱',
  dinner: '🍛',
  fruit: '🍓',
  food: '🥘',
  fries: '🍟',                // shares 🍟 with `chips` — US/UK synonym pair
  home: '🏘️',
  flat: '🏢',
  apartment: '🏢',            // shares 🏢 with `flat` — US/UK synonym pair
  TV: '📺',                   // shares 📺 with `television` — same word, short form
  store: '🛍️',                // shares 🛍️ with `shop` — US/UK synonym pair
  letter: '✉️',
  alphabet: '🔤',
  story: '📖',
  tick: '✔️',                 // exam rubric words: "put a tick or a cross"
  cross: '❌',
  sport: '🏅',
  soccer: '⚽',               // shares ⚽ with `football` — US/UK synonym pair
  toy: '🪀',
  music: '🎵',
  song: '🎶',                 // shares its look with `music` — grouped as twins
};

/** Per-set pastel background colours (WCAG 3:1 contrast against dark emoji foreground). */
export const SET_BACKGROUNDS: Record<string, { r: number; g: number; b: number }> = {
  animals:   { r: 200, g: 230, b: 255 }, // sky blue
  body:      { r: 255, g: 220, b: 210 }, // skin peach
  clothes:   { r: 220, g: 210, b: 255 }, // lavender
  colors:    { r: 245, g: 245, b: 200 }, // pale yellow
  family:    { r: 255, g: 225, b: 200 }, // warm peach
  food:      { r: 220, g: 250, b: 215 }, // mint green
  furniture: { r: 240, g: 220, b: 190 }, // warm tan — wood, distinct from home cream
  home:      { r: 255, g: 235, b: 200 }, // cream
  nature:    { r: 214, g: 240, b: 200 }, // leaf green — distinct from sports' mint
  places:    { r: 200, g: 240, b: 230 }, // seafoam
  school:    { r: 215, g: 235, b: 255 }, // light blue
  sports:    { r: 210, g: 255, b: 220 }, // light green
  time:      { r: 255, g: 240, b: 215 }, // warm sand — daylight, distinct from home cream
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
  // Furniture
  wardrobe: 'furniture', shelf: 'furniture', bookcase: 'furniture', drawer: 'furniture',
  carpet: 'furniture', curtain: 'furniture', cushion: 'furniture', blanket: 'furniture',
  fridge: 'furniture', stool: 'furniture', bin: 'furniture', plant: 'furniture',
  basket: 'furniture', candle: 'furniture', vase: 'furniture',
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
  // Starters expansion
  donkey: 'animals', bee: 'animals',
  finger: 'body', body: 'body',
  cap: 'clothes', umbrella: 'clothes', watch: 'clothes',
  family: 'family',
  burger: 'food', chips: 'food', cheese: 'food', pear: 'food', watermelon: 'food',
  tea: 'food', lemonade: 'food', coffee: 'food', coconut: 'food', pineapple: 'food',
  melon: 'food', kiwi: 'food', sweet: 'food',
  clock: 'home', mirror: 'home', wall: 'home', key: 'home', box: 'home', radio: 'home',
  farm: 'places', beach: 'places', street: 'places', station: 'places', market: 'places', playground: 'places',
  paint: 'school', paper: 'school', picture: 'school', scissors: 'school', computer: 'school', notebook: 'school',
  badminton: 'sports', volleyball: 'sports', running: 'sports', ski: 'sports', golf: 'sports', boxing: 'sports',
  teddy: 'toys', balloon: 'toys', guitar: 'toys', piano: 'toys', camera: 'toys',
  ship: 'transport', truck: 'transport', van: 'transport', tractor: 'transport', scooter: 'transport',
  rainbow: 'weather', ice: 'weather', star: 'weather', moon: 'weather', storm: 'weather',
  cook: 'work', pilot: 'work', police: 'work', clown: 'work', king: 'work', queen: 'work',
  // 2026 Starters wordlist audit
  jellyfish: 'animals', 'polar bear': 'animals', tail: 'animals',
  'T-shirt': 'clothes', 'baseball cap': 'clothes', handbag: 'clothes',
  father: 'family', mother: 'family', grandfather: 'family', grandmother: 'family',
  cousin: 'family', child: 'family', kid: 'family', person: 'family', classmate: 'family',
  'ice cream': 'food', pie: 'food', lime: 'food', meatballs: 'food',
  armchair: 'home', bathroom: 'home', bedroom: 'home', 'dining room': 'home',
  'living room': 'home', hall: 'home', mat: 'home', rug: 'home', television: 'home',
  board: 'school', classroom: 'school', rubber: 'school', tablet: 'school', keyboard: 'school',
  drawing: 'school', painting: 'school', photo: 'school', poster: 'school',
  bookshop: 'places',
  alien: 'toys', monster: 'toys', 'board game': 'toys', skateboard: 'toys',
  'table tennis': 'sports', fishing: 'sports', skateboarding: 'sports', 'tennis racket': 'sports',
  sea: 'nature', sand: 'nature', shell: 'nature', tree: 'nature', flower: 'nature',
  morning: 'time', afternoon: 'time', evening: 'time', night: 'time', day: 'time', birthday: 'time',
  animal: 'animals', pet: 'animals',
  clothes: 'clothes',
  breakfast: 'food', lunch: 'food', dinner: 'food', fruit: 'food', food: 'food', fries: 'food',
  home: 'home', flat: 'home', apartment: 'home', TV: 'home',
  store: 'places',
  letter: 'school', alphabet: 'school', story: 'school', tick: 'school', cross: 'school',
  sport: 'sports', soccer: 'sports',
  toy: 'toys', music: 'toys', song: 'toys',
};
