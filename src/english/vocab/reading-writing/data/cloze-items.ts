/**
 * Content pool for the Word-bank cloze activity (Cambridge Starters R&W Part 4).
 * A child reads a short connected text with 1–2 gaps and taps picture-words
 * from a word bank to fill them.
 *
 * Vocabulary is Cambridge Starters level and child-safe. Each item's sentence is
 * an ordered list of parts: plain text runs (`{ text }`) and gaps (`{ answer }`).
 * The `bank` holds the tappable options — always the correct answers plus 1–3
 * distractors — each carrying an emoji so pre-readers get a picture cue.
 */

/** A run of literal text in the sentence. */
export interface ClozeTextPart {
  text: string;
}

/** A gap the child must fill; `answer` matches a bank option `key`. */
export interface ClozeGapPart {
  answer: string;
}

export type ClozePart = ClozeTextPart | ClozeGapPart;

export const isGap = (part: ClozePart): part is ClozeGapPart =>
  (part as ClozeGapPart).answer !== undefined;

/** A tappable picture-word in the bank. */
export interface ClozeBankOption {
  key: string;
  emoji: string;
  label: string;
}

export interface ClozeItem {
  id: string;
  /** Ordered sentence parts: text runs interleaved with gaps. */
  sentence: ClozePart[];
  /** Bank options: correct answers + distractors, in author order (shuffled at play time). */
  bank: ClozeBankOption[];
  /** Optional decorative emoji shown beside the sentence. */
  emojiHint?: string;
}

const opt = (key: string, emoji: string, label: string): ClozeBankOption => ({ key, emoji, label });

/** ~14 varied items across animals, food, home, family and weather themes. */
export const CLOZE_ITEMS: ClozeItem[] = [
  {
    id: 'food-apple',
    sentence: [
      { text: 'I come from a ' },
      { answer: 'tree' },
      { text: '. I am a green ' },
      { answer: 'fruit' },
      { text: ' to eat.' },
    ],
    bank: [
      opt('tree', '🌳', 'tree'),
      opt('fruit', '🍏', 'fruit'),
      opt('bag', '👜', 'bag'),
      opt('kitchen', '🍳', 'kitchen'),
    ],
    emojiHint: '🍏',
  },
  {
    id: 'animals-cat',
    sentence: [
      { text: 'The ' },
      { answer: 'cat' },
      { text: ' likes to drink ' },
      { answer: 'milk' },
      { text: '.' },
    ],
    bank: [opt('cat', '🐱', 'cat'), opt('milk', '🥛', 'milk'), opt('car', '🚗', 'car'), opt('ball', '⚽', 'ball')],
    emojiHint: '🐱',
  },
  {
    id: 'animals-dog',
    sentence: [
      { text: 'My ' },
      { answer: 'dog' },
      { text: ' runs in the ' },
      { answer: 'garden' },
      { text: '.' },
    ],
    bank: [opt('dog', '🐶', 'dog'), opt('garden', '🌷', 'garden'), opt('boat', '⛵', 'boat'), opt('cup', '☕', 'cup')],
    emojiHint: '🐶',
  },
  {
    id: 'weather-sun',
    sentence: [
      { text: 'The ' },
      { answer: 'sun' },
      { text: ' is hot and the ' },
      { answer: 'sky' },
      { text: ' is blue.' },
    ],
    bank: [opt('sun', '☀️', 'sun'), opt('sky', '🌤️', 'sky'), opt('rain', '🌧️', 'rain'), opt('snow', '❄️', 'snow')],
    emojiHint: '☀️',
  },
  {
    id: 'weather-rain',
    sentence: [
      { text: 'When it is ' },
      { answer: 'rain' },
      { text: ', I take my ' },
      { answer: 'umbrella' },
      { text: '.' },
    ],
    bank: [
      opt('rain', '🌧️', 'rain'),
      opt('umbrella', '☂️', 'umbrella'),
      opt('hat', '🎩', 'hat'),
      opt('kite', '🪁', 'kite'),
    ],
    emojiHint: '🌧️',
  },
  {
    id: 'family-mum',
    sentence: [
      { text: 'My ' },
      { answer: 'mother' },
      { text: ' reads me a ' },
      { answer: 'book' },
      { text: ' at night.' },
    ],
    bank: [
      opt('mother', '👩', 'mother'),
      opt('book', '📖', 'book'),
      opt('clock', '🕐', 'clock'),
      opt('shoe', '👟', 'shoe'),
    ],
    emojiHint: '👩',
  },
  {
    id: 'family-baby',
    sentence: [
      { text: 'The ' },
      { answer: 'baby' },
      { text: ' sleeps in a small ' },
      { answer: 'bed' },
      { text: '.' },
    ],
    bank: [opt('baby', '👶', 'baby'), opt('bed', '🛏️', 'bed'), opt('bike', '🚲', 'bike'), opt('duck', '🦆', 'duck')],
    emojiHint: '👶',
  },
  {
    id: 'home-kitchen',
    sentence: [
      { text: 'We make ' },
      { answer: 'cake' },
      { text: ' in the ' },
      { answer: 'kitchen' },
      { text: '.' },
    ],
    bank: [
      opt('cake', '🎂', 'cake'),
      opt('kitchen', '🍳', 'kitchen'),
      opt('bath', '🛁', 'bath'),
      opt('door', '🚪', 'door'),
    ],
    emojiHint: '🎂',
  },
  {
    id: 'animals-fish',
    sentence: [
      { text: 'The ' },
      { answer: 'fish' },
      { text: ' swims in the ' },
      { answer: 'water' },
      { text: '.' },
    ],
    bank: [opt('fish', '🐟', 'fish'), opt('water', '💧', 'water'), opt('tree', '🌳', 'tree'), opt('bird', '🐦', 'bird')],
    emojiHint: '🐟',
  },
  {
    id: 'animals-bird',
    sentence: [
      { text: 'A little ' },
      { answer: 'bird' },
      { text: ' can ' },
      { answer: 'fly' },
      { text: ' high.' },
    ],
    bank: [opt('bird', '🐦', 'bird'), opt('fly', '🕊️', 'fly'), opt('run', '🏃', 'run'), opt('frog', '🐸', 'frog')],
    emojiHint: '🐦',
  },
  {
    id: 'food-banana',
    sentence: [
      { text: 'The ' },
      { answer: 'monkey' },
      { text: ' eats a yellow ' },
      { answer: 'banana' },
      { text: '.' },
    ],
    bank: [
      opt('monkey', '🐵', 'monkey'),
      opt('banana', '🍌', 'banana'),
      opt('lemon', '🍋', 'lemon'),
      opt('pig', '🐷', 'pig'),
    ],
    emojiHint: '🍌',
  },
  {
    id: 'home-window',
    sentence: [
      { text: 'I look through the ' },
      { answer: 'window' },
      { text: ' and see a ' },
      { answer: 'star' },
      { text: '.' },
    ],
    bank: [
      opt('window', '🪟', 'window'),
      opt('star', '⭐', 'star'),
      opt('chair', '🪑', 'chair'),
      opt('lamp', '💡', 'lamp'),
    ],
    emojiHint: '⭐',
  },
  {
    id: 'weather-snow',
    sentence: [
      { text: 'The ' },
      { answer: 'snow' },
      { text: ' is white and very ' },
      { answer: 'cold' },
      { text: '.' },
    ],
    bank: [opt('snow', '❄️', 'snow'), opt('cold', '🥶', 'cold'), opt('fire', '🔥', 'fire'), opt('leaf', '🍃', 'leaf')],
    emojiHint: '❄️',
  },
  {
    id: 'food-egg',
    sentence: [
      { text: 'The ' },
      { answer: 'hen' },
      { text: ' gives us an ' },
      { answer: 'egg' },
      { text: '.' },
    ],
    bank: [opt('hen', '🐔', 'hen'), opt('egg', '🥚', 'egg'), opt('cow', '🐮', 'cow'), opt('bread', '🍞', 'bread')],
    emojiHint: '🥚',
  },

  // --- Body & clothes ---
  {
    id: 'body-eyes',
    sentence: [
      { text: 'I see with my ' },
      { answer: 'eyes' },
      { text: ' and hear with my ' },
      { answer: 'ears' },
      { text: '.' },
    ],
    bank: [opt('eyes', '👀', 'eyes'), opt('ears', '👂', 'ears'), opt('nose', '👃', 'nose'), opt('hand', '✋', 'hand')],
    emojiHint: '👀',
  },
  {
    id: 'clothes-hat',
    sentence: [
      { text: 'I put a ' },
      { answer: 'hat' },
      { text: ' on my ' },
      { answer: 'head' },
      { text: '.' },
    ],
    bank: [opt('hat', '🎩', 'hat'), opt('head', '🧑', 'head'), opt('sock', '🧦', 'sock'), opt('cup', '☕', 'cup')],
    emojiHint: '🎩',
  },
  {
    id: 'clothes-shoes',
    sentence: [
      { text: 'I wear ' },
      { answer: 'shoes' },
      { text: ' on my ' },
      { answer: 'feet' },
      { text: '.' },
    ],
    bank: [opt('shoes', '👟', 'shoes'), opt('feet', '🦶', 'feet'), opt('gloves', '🧤', 'gloves'), opt('book', '📖', 'book')],
    emojiHint: '👟',
  },

  // --- Colors ---
  {
    id: 'colors-grass',
    sentence: [
      { text: 'The ' },
      { answer: 'grass' },
      { text: ' is ' },
      { answer: 'green' },
      { text: '.' },
    ],
    bank: [opt('grass', '🌱', 'grass'), opt('green', '🟢', 'green'), opt('red', '🔴', 'red'), opt('milk', '🥛', 'milk')],
    emojiHint: '🟢',
  },
  {
    id: 'colors-sun',
    sentence: [
      { text: 'The ' },
      { answer: 'sun' },
      { text: ' is ' },
      { answer: 'yellow' },
      { text: '.' },
    ],
    bank: [opt('sun', '☀️', 'sun'), opt('yellow', '🟡', 'yellow'), opt('blue', '🔵', 'blue'), opt('snow', '❄️', 'snow')],
    emojiHint: '🟡',
  },

  // --- School ---
  {
    id: 'school-pen',
    sentence: [
      { text: 'I write with a ' },
      { answer: 'pen' },
      { text: ' in my ' },
      { answer: 'book' },
      { text: '.' },
    ],
    bank: [opt('pen', '🖊️', 'pen'), opt('book', '📖', 'book'), opt('ball', '⚽', 'ball'), opt('fish', '🐟', 'fish')],
    emojiHint: '🖊️',
  },
  {
    id: 'school-bag',
    sentence: [
      { text: 'I keep my ' },
      { answer: 'book' },
      { text: ' in my ' },
      { answer: 'bag' },
      { text: '.' },
    ],
    bank: [opt('book', '📖', 'book'), opt('bag', '🎒', 'bag'), opt('bed', '🛏️', 'bed'), opt('hat', '🎩', 'hat')],
    emojiHint: '🎒',
  },

  // --- Sports & toys ---
  {
    id: 'sports-football',
    sentence: [
      { text: 'I kick the ' },
      { answer: 'ball' },
      { text: ' in the ' },
      { answer: 'park' },
      { text: '.' },
    ],
    bank: [opt('ball', '⚽', 'ball'), opt('park', '🌳', 'park'), opt('kitchen', '🍳', 'kitchen'), opt('moon', '🌙', 'moon')],
    emojiHint: '⚽',
  },
  {
    id: 'sports-swim',
    sentence: [
      { text: 'I like to ' },
      { answer: 'swim' },
      { text: ' in the ' },
      { answer: 'water' },
      { text: '.' },
    ],
    bank: [opt('swim', '🏊', 'swim'), opt('water', '💧', 'water'), opt('sleep', '😴', 'sleep'), opt('tree', '🌳', 'tree')],
    emojiHint: '🏊',
  },
  {
    id: 'toys-kite',
    sentence: [
      { text: 'My ' },
      { answer: 'kite' },
      { text: ' flies in the ' },
      { answer: 'wind' },
      { text: '.' },
    ],
    bank: [opt('kite', '🪁', 'kite'), opt('wind', '🌬️', 'wind'), opt('ball', '⚽', 'ball'), opt('bed', '🛏️', 'bed')],
    emojiHint: '🪁',
  },

  // --- Transport & places ---
  {
    id: 'transport-bus',
    sentence: [
      { text: 'I go to ' },
      { answer: 'school' },
      { text: ' on the ' },
      { answer: 'bus' },
      { text: '.' },
    ],
    bank: [opt('school', '🏫', 'school'), opt('bus', '🚌', 'bus'), opt('boat', '⛵', 'boat'), opt('bed', '🛏️', 'bed')],
    emojiHint: '🚌',
  },
  {
    id: 'transport-boat',
    sentence: [
      { text: 'The ' },
      { answer: 'boat' },
      { text: ' goes on the ' },
      { answer: 'water' },
      { text: '.' },
    ],
    bank: [opt('boat', '⛵', 'boat'), opt('water', '💧', 'water'), opt('sky', '🌤️', 'sky'), opt('car', '🚗', 'car')],
    emojiHint: '⛵',
  },
  {
    id: 'places-zoo',
    sentence: [
      { text: 'I see a big ' },
      { answer: 'lion' },
      { text: ' at the ' },
      { answer: 'zoo' },
      { text: '.' },
    ],
    bank: [opt('lion', '🦁', 'lion'), opt('zoo', '🦓', 'zoo'), opt('shop', '🏪', 'shop'), opt('house', '🏠', 'house')],
    emojiHint: '🦁',
  },
  {
    id: 'places-shop',
    sentence: [
      { text: 'I buy ' },
      { answer: 'bread' },
      { text: ' at the ' },
      { answer: 'shop' },
      { text: '.' },
    ],
    bank: [opt('bread', '🍞', 'bread'), opt('shop', '🏪', 'shop'), opt('farm', '🚜', 'farm'), opt('star', '⭐', 'star')],
    emojiHint: '🏪',
  },

  // --- Work (jobs) ---
  {
    id: 'work-doctor',
    sentence: [
      { text: 'The ' },
      { answer: 'doctor' },
      { text: ' works in the ' },
      { answer: 'hospital' },
      { text: '.' },
    ],
    bank: [opt('doctor', '👨‍⚕️', 'doctor'), opt('hospital', '🏥', 'hospital'), opt('garden', '🌷', 'garden'), opt('zoo', '🦓', 'zoo')],
    emojiHint: '👨‍⚕️',
  },
  {
    id: 'work-farmer',
    sentence: [
      { text: 'The ' },
      { answer: 'farmer' },
      { text: ' works on the ' },
      { answer: 'farm' },
      { text: '.' },
    ],
    bank: [opt('farmer', '👨‍🌾', 'farmer'), opt('farm', '🚜', 'farm'), opt('beach', '🏖️', 'beach'), opt('shop', '🏪', 'shop')],
    emojiHint: '👨‍🌾',
  },

  // --- More animals & family ---
  {
    id: 'animals-elephant',
    sentence: [
      { text: 'The big ' },
      { answer: 'elephant' },
      { text: ' has a long ' },
      { answer: 'nose' },
      { text: '.' },
    ],
    bank: [opt('elephant', '🐘', 'elephant'), opt('nose', '👃', 'nose'), opt('cat', '🐱', 'cat'), opt('hat', '🎩', 'hat')],
    emojiHint: '🐘',
  },
  {
    id: 'family-brother',
    sentence: [
      { text: 'My ' },
      { answer: 'brother' },
      { text: ' rides a ' },
      { answer: 'bike' },
      { text: '.' },
    ],
    bank: [opt('brother', '👦', 'brother'), opt('bike', '🚲', 'bike'), opt('cake', '🎂', 'cake'), opt('book', '📖', 'book')],
    emojiHint: '👦',
  },
  {
    id: 'weather-rainbow',
    sentence: [
      { text: 'After the ' },
      { answer: 'rain' },
      { text: ' I see a ' },
      { answer: 'rainbow' },
      { text: '.' },
    ],
    bank: [opt('rain', '🌧️', 'rain'), opt('rainbow', '🌈', 'rainbow'), opt('snow', '❄️', 'snow'), opt('moon', '🌙', 'moon')],
    emojiHint: '🌈',
  },
  {
    id: 'home-bath',
    sentence: [
      { text: 'I wash in the ' },
      { answer: 'bath' },
      { text: ' with warm ' },
      { answer: 'water' },
      { text: '.' },
    ],
    bank: [opt('bath', '🛁', 'bath'), opt('water', '💧', 'water'), opt('bed', '🛏️', 'bed'), opt('door', '🚪', 'door')],
    emojiHint: '🛁',
  },

  // --- More animals ---
  {
    id: 'animals-cow',
    sentence: [{ text: 'The ' }, { answer: 'cow' }, { text: ' gives us ' }, { answer: 'milk' }, { text: '.' }],
    bank: [opt('cow', '🐮', 'cow'), opt('milk', '🥛', 'milk'), opt('egg', '🥚', 'egg'), opt('apple', '🍎', 'apple')],
    emojiHint: '🐮',
  },
  {
    id: 'animals-rabbit',
    sentence: [{ text: 'The ' }, { answer: 'rabbit' }, { text: ' eats a ' }, { answer: 'carrot' }, { text: '.' }],
    bank: [opt('rabbit', '🐰', 'rabbit'), opt('carrot', '🥕', 'carrot'), opt('cake', '🎂', 'cake'), opt('sock', '🧦', 'sock')],
    emojiHint: '🐰',
  },
  {
    id: 'animals-bear',
    sentence: [{ text: 'The ' }, { answer: 'bear' }, { text: ' climbs the ' }, { answer: 'tree' }, { text: '.' }],
    bank: [opt('bear', '🐻', 'bear'), opt('tree', '🌳', 'tree'), opt('boat', '⛵', 'boat'), opt('cup', '☕', 'cup')],
    emojiHint: '🐻',
  },
  {
    id: 'animals-horse',
    sentence: [{ text: 'The ' }, { answer: 'horse' }, { text: ' runs on the ' }, { answer: 'farm' }, { text: '.' }],
    bank: [opt('horse', '🐴', 'horse'), opt('farm', '🚜', 'farm'), opt('star', '⭐', 'star'), opt('bed', '🛏️', 'bed')],
    emojiHint: '🐴',
  },
  {
    id: 'animals-tiger',
    sentence: [{ text: 'The ' }, { answer: 'tiger' }, { text: ' has ' }, { answer: 'orange' }, { text: ' stripes.' }],
    bank: [opt('tiger', '🐯', 'tiger'), opt('orange', '🟠', 'orange'), opt('purple', '🟣', 'purple'), opt('milk', '🥛', 'milk')],
    emojiHint: '🐯',
  },

  // --- Body ---
  {
    id: 'body-hand',
    sentence: [{ text: 'I wave with my ' }, { answer: 'hand' }, { text: ' and jump on my ' }, { answer: 'feet' }, { text: '.' }],
    bank: [opt('hand', '✋', 'hand'), opt('feet', '🦶', 'feet'), opt('hair', '💇', 'hair'), opt('ear', '👂', 'ear')],
    emojiHint: '✋',
  },
  {
    id: 'body-teeth',
    sentence: [{ text: 'I eat with my ' }, { answer: 'mouth' }, { text: ' and my ' }, { answer: 'teeth' }, { text: '.' }],
    bank: [opt('mouth', '👄', 'mouth'), opt('teeth', '🦷', 'teeth'), opt('nose', '👃', 'nose'), opt('eye', '👁️', 'eye')],
    emojiHint: '🦷',
  },

  // --- More clothes ---
  {
    id: 'clothes-jacket',
    sentence: [{ text: 'I wear a ' }, { answer: 'jacket' }, { text: ' when it is ' }, { answer: 'cold' }, { text: '.' }],
    bank: [opt('jacket', '🧥', 'jacket'), opt('cold', '🥶', 'cold'), opt('hot', '🔥', 'hot'), opt('wet', '💧', 'wet')],
    emojiHint: '🧥',
  },
  {
    id: 'clothes-dress',
    sentence: [{ text: 'The ' }, { answer: 'girl' }, { text: ' has a pink ' }, { answer: 'dress' }, { text: '.' }],
    bank: [opt('girl', '👧', 'girl'), opt('dress', '👗', 'dress'), opt('boy', '👦', 'boy'), opt('hat', '🎩', 'hat')],
    emojiHint: '👗',
  },

  // --- More colors ---
  {
    id: 'colors-cat',
    sentence: [{ text: 'The ' }, { answer: 'cat' }, { text: ' is ' }, { answer: 'black' }, { text: '.' }],
    bank: [opt('cat', '🐱', 'cat'), opt('black', '⚫', 'black'), opt('white', '⚪', 'white'), opt('pink', '🩷', 'pink')],
    emojiHint: '⚫',
  },
  {
    id: 'colors-apple',
    sentence: [{ text: 'The ' }, { answer: 'apple' }, { text: ' is ' }, { answer: 'red' }, { text: '.' }],
    bank: [opt('apple', '🍎', 'apple'), opt('red', '🔴', 'red'), opt('blue', '🔵', 'blue'), opt('green', '🟢', 'green')],
    emojiHint: '🔴',
  },

  // --- More family ---
  {
    id: 'family-grandma',
    sentence: [{ text: 'My ' }, { answer: 'grandma' }, { text: ' makes a ' }, { answer: 'cake' }, { text: '.' }],
    bank: [opt('grandma', '👵', 'grandma'), opt('cake', '🎂', 'cake'), opt('ball', '⚽', 'ball'), opt('car', '🚗', 'car')],
    emojiHint: '👵',
  },
  {
    id: 'family-sister',
    sentence: [{ text: 'My ' }, { answer: 'sister' }, { text: ' plays with a ' }, { answer: 'doll' }, { text: '.' }],
    bank: [opt('sister', '👧', 'sister'), opt('doll', '🪆', 'doll'), opt('drum', '🥁', 'drum'), opt('fish', '🐟', 'fish')],
    emojiHint: '👧',
  },

  // --- More food ---
  {
    id: 'food-pizza',
    sentence: [{ text: 'I eat ' }, { answer: 'pizza' }, { text: ' and drink ' }, { answer: 'juice' }, { text: '.' }],
    bank: [opt('pizza', '🍕', 'pizza'), opt('juice', '🧃', 'juice'), opt('soup', '🍲', 'soup'), opt('book', '📖', 'book')],
    emojiHint: '🍕',
  },
  {
    id: 'food-cheese',
    sentence: [{ text: 'The ' }, { answer: 'mouse' }, { text: ' likes to eat ' }, { answer: 'cheese' }, { text: '.' }],
    bank: [opt('mouse', '🐭', 'mouse'), opt('cheese', '🧀', 'cheese'), opt('banana', '🍌', 'banana'), opt('bread', '🍞', 'bread')],
    emojiHint: '🧀',
  },
  {
    id: 'food-salad',
    sentence: [{ text: 'I make a ' }, { answer: 'salad' }, { text: ' with a ' }, { answer: 'tomato' }, { text: '.' }],
    bank: [opt('salad', '🥗', 'salad'), opt('tomato', '🍅', 'tomato'), opt('cake', '🎂', 'cake'), opt('milk', '🥛', 'milk')],
    emojiHint: '🥗',
  },

  // --- More home objects ---
  {
    id: 'home-sofa',
    sentence: [{ text: 'I sit on the ' }, { answer: 'sofa' }, { text: ' and see the ' }, { answer: 'clock' }, { text: '.' }],
    bank: [opt('sofa', '🛋️', 'sofa'), opt('clock', '🕐', 'clock'), opt('door', '🚪', 'door'), opt('lamp', '💡', 'lamp')],
    emojiHint: '🛋️',
  },
  {
    id: 'home-door',
    sentence: [{ text: 'I open the ' }, { answer: 'door' }, { text: ' and see the ' }, { answer: 'garden' }, { text: '.' }],
    bank: [opt('door', '🚪', 'door'), opt('garden', '🌷', 'garden'), opt('window', '🪟', 'window'), opt('wall', '🧱', 'wall')],
    emojiHint: '🚪',
  },

  // --- More school ---
  {
    id: 'school-picture',
    sentence: [{ text: 'I draw a ' }, { answer: 'picture' }, { text: ' with a ' }, { answer: 'crayon' }, { text: '.' }],
    bank: [opt('picture', '🖼️', 'picture'), opt('crayon', '🖍️', 'crayon'), opt('scissors', '✂️', 'scissors'), opt('ball', '⚽', 'ball')],
    emojiHint: '🖍️',
  },
  {
    id: 'school-computer',
    sentence: [{ text: 'I use the ' }, { answer: 'computer' }, { text: ' and read a ' }, { answer: 'book' }, { text: '.' }],
    bank: [opt('computer', '💻', 'computer'), opt('book', '📖', 'book'), opt('phone', '📱', 'phone'), opt('cup', '☕', 'cup')],
    emojiHint: '💻',
  },

  // --- More sports & toys ---
  {
    id: 'sports-tennis',
    sentence: [{ text: 'I play ' }, { answer: 'tennis' }, { text: ' with a ' }, { answer: 'ball' }, { text: '.' }],
    bank: [opt('tennis', '🎾', 'tennis'), opt('ball', '⚽', 'ball'), opt('bike', '🚲', 'bike'), opt('drum', '🥁', 'drum')],
    emojiHint: '🎾',
  },
  {
    id: 'toys-train',
    sentence: [{ text: 'I play with my ' }, { answer: 'train' }, { text: ' and my ' }, { answer: 'robot' }, { text: '.' }],
    bank: [opt('train', '🚂', 'train'), opt('robot', '🤖', 'robot'), opt('teddy', '🧸', 'teddy'), opt('cake', '🎂', 'cake')],
    emojiHint: '🚂',
  },

  // --- More transport & weather ---
  {
    id: 'transport-plane',
    sentence: [{ text: 'The ' }, { answer: 'plane' }, { text: ' flies in the ' }, { answer: 'sky' }, { text: '.' }],
    bank: [opt('plane', '✈️', 'plane'), opt('sky', '🌤️', 'sky'), opt('water', '💧', 'water'), opt('train', '🚂', 'train')],
    emojiHint: '✈️',
  },
  {
    id: 'weather-storm',
    sentence: [{ text: 'In a ' }, { answer: 'storm' }, { text: ' we see a lot of ' }, { answer: 'rain' }, { text: '.' }],
    bank: [opt('storm', '⛈️', 'storm'), opt('rain', '🌧️', 'rain'), opt('sun', '☀️', 'sun'), opt('snow', '❄️', 'snow')],
    emojiHint: '⛈️',
  },

  // --- More jobs (work) ---
  {
    id: 'work-nurse',
    sentence: [{ text: 'The ' }, { answer: 'nurse' }, { text: ' works in the ' }, { answer: 'hospital' }, { text: '.' }],
    bank: [opt('nurse', '👩‍⚕️', 'nurse'), opt('hospital', '🏥', 'hospital'), opt('school', '🏫', 'school'), opt('shop', '🏪', 'shop')],
    emojiHint: '👩‍⚕️',
  },
  {
    id: 'work-pilot',
    sentence: [{ text: 'The ' }, { answer: 'pilot' }, { text: ' flies the ' }, { answer: 'plane' }, { text: '.' }],
    bank: [opt('pilot', '👨‍✈️', 'pilot'), opt('plane', '✈️', 'plane'), opt('bus', '🚌', 'bus'), opt('boat', '⛵', 'boat')],
    emojiHint: '👨‍✈️',
  },
];

/** Pick `count` random distinct items for one play. */
export function pickClozeItems(count: number, pool: ClozeItem[] = CLOZE_ITEMS): ClozeItem[] {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));
}
