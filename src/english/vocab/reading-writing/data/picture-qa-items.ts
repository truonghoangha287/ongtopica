/**
 * Content pool for the Picture-scene Q&A activity (Cambridge Starters R&W Part 5).
 * Each item is a big emoji "scene" plus 1–2 WH-questions. Every question is
 * multiple-choice with 3 options (one of which is the answer). Content targets
 * Starters-level reading: WH-questions, prepositions and present-continuous,
 * kept child-safe. The `answer` string MUST appear in that question's `options`.
 */
export interface PictureQaQuestion {
  text: string;
  options: string[];
  answer: string;
}

export interface PictureQaItem {
  id: string;
  sceneEmoji: string;
  /** Alt text for the emoji scene (screen-reader description). */
  sceneLabel: string;
  questions: PictureQaQuestion[];
}

export const PICTURE_QA_ITEMS: PictureQaItem[] = [
  {
    id: 'plane',
    sceneEmoji: '✈️',
    sceneLabel: 'a plane flying in the sky',
    questions: [
      { text: 'Where are they?', options: ['in a plane', 'in a car', 'in a boat'], answer: 'in a plane' },
      { text: 'What is the plane doing?', options: ['swimming', 'flying', 'sleeping'], answer: 'flying' },
    ],
  },
  {
    id: 'beach',
    sceneEmoji: '🏖️',
    sceneLabel: 'a sunny beach with an umbrella',
    questions: [
      { text: 'Where are they?', options: ['at the beach', 'at school', 'at the shop'], answer: 'at the beach' },
      { text: 'What is the weather like?', options: ['rainy', 'snowy', 'sunny'], answer: 'sunny' },
    ],
  },
  {
    id: 'dog',
    sceneEmoji: '🐶',
    sceneLabel: 'a happy dog',
    questions: [
      { text: 'What animal is it?', options: ['a cat', 'a dog', 'a bird'], answer: 'a dog' },
      { text: 'What color are dogs often?', options: ['brown', 'purple', 'green'], answer: 'brown' },
    ],
  },
  {
    id: 'kitchen',
    sceneEmoji: '🍽️',
    sceneLabel: 'a plate and knife and fork on a table',
    questions: [
      { text: 'Where is the food?', options: ['on the plate', 'in the bed', 'under the car'], answer: 'on the plate' },
      { text: 'What are they going to do?', options: ['read', 'eat', 'swim'], answer: 'eat' },
    ],
  },
  {
    id: 'park',
    sceneEmoji: '🌳',
    sceneLabel: 'a big green tree in a park',
    questions: [
      { text: 'Where are they?', options: ['in the park', 'in the sea', 'in a plane'], answer: 'in the park' },
      { text: 'What is next to them?', options: ['a tree', 'a bus', 'a fish'], answer: 'a tree' },
    ],
  },
  {
    id: 'football',
    sceneEmoji: '⚽',
    sceneLabel: 'a football on the grass',
    questions: [
      { text: 'What game is it?', options: ['football', 'reading', 'sleeping'], answer: 'football' },
      { text: 'What are they doing?', options: ['playing', 'eating', 'flying'], answer: 'playing' },
    ],
  },
  {
    id: 'bus',
    sceneEmoji: '🚌',
    sceneLabel: 'a yellow bus on the road',
    questions: [
      { text: 'What is it?', options: ['a bus', 'a boat', 'a plane'], answer: 'a bus' },
      { text: 'Where does it go?', options: ['on the road', 'in the sea', 'in the sky'], answer: 'on the road' },
    ],
  },
  {
    id: 'rain',
    sceneEmoji: '🌧️',
    sceneLabel: 'grey clouds with rain falling',
    questions: [
      { text: 'What is the weather like?', options: ['sunny', 'rainy', 'snowy'], answer: 'rainy' },
      { text: 'What do you need?', options: ['an umbrella', 'a hat', 'a bike'], answer: 'an umbrella' },
    ],
  },
  {
    id: 'cat-sleep',
    sceneEmoji: '😴',
    sceneLabel: 'someone sleeping',
    questions: [
      { text: 'What are they doing?', options: ['running', 'sleeping', 'jumping'], answer: 'sleeping' },
      { text: 'When do we sleep?', options: ['at night', 'at lunch', 'in class'], answer: 'at night' },
    ],
  },
  {
    id: 'apple',
    sceneEmoji: '🍎',
    sceneLabel: 'a red apple',
    questions: [
      { text: 'What fruit is it?', options: ['a banana', 'an apple', 'a grape'], answer: 'an apple' },
      { text: 'What color is it?', options: ['red', 'blue', 'black'], answer: 'red' },
    ],
  },
  {
    id: 'fish',
    sceneEmoji: '🐟',
    sceneLabel: 'a fish swimming',
    questions: [
      { text: 'Where does a fish live?', options: ['in water', 'in the sky', 'in a tree'], answer: 'in water' },
      { text: 'What is the fish doing?', options: ['swimming', 'flying', 'reading'], answer: 'swimming' },
    ],
  },
  {
    id: 'birthday',
    sceneEmoji: '🎂',
    sceneLabel: 'a birthday cake with candles',
    questions: [
      { text: 'What is it?', options: ['a cake', 'a car', 'a cat'], answer: 'a cake' },
      { text: 'What day is it?', options: ['a birthday', 'a school day', 'a rainy day'], answer: 'a birthday' },
    ],
  },
  {
    id: 'lion',
    sceneEmoji: '🦁',
    sceneLabel: 'a big lion',
    questions: [
      { text: 'What animal is it?', options: ['a lion', 'a dog', 'a cat'], answer: 'a lion' },
      { text: 'Where does it live?', options: ['in the zoo', 'in the sea', 'in a plane'], answer: 'in the zoo' },
    ],
  },
  {
    id: 'elephant',
    sceneEmoji: '🐘',
    sceneLabel: 'a grey elephant',
    questions: [
      { text: 'What animal is it?', options: ['an elephant', 'a mouse', 'a fish'], answer: 'an elephant' },
      { text: 'Is it big or small?', options: ['big', 'small', 'cold'], answer: 'big' },
    ],
  },
  {
    id: 'bird',
    sceneEmoji: '🐦',
    sceneLabel: 'a little bird',
    questions: [
      { text: 'What animal is it?', options: ['a bird', 'a fish', 'a cat'], answer: 'a bird' },
      { text: 'What can a bird do?', options: ['fly', 'read', 'cook'], answer: 'fly' },
    ],
  },
  {
    id: 'frog',
    sceneEmoji: '🐸',
    sceneLabel: 'a green frog',
    questions: [
      { text: 'What animal is it?', options: ['a frog', 'a duck', 'a bee'], answer: 'a frog' },
      { text: 'What can a frog do?', options: ['jump', 'drive', 'read'], answer: 'jump' },
    ],
  },
  {
    id: 'car',
    sceneEmoji: '🚗',
    sceneLabel: 'a red car',
    questions: [
      { text: 'What is it?', options: ['a car', 'a boat', 'a plane'], answer: 'a car' },
      { text: 'Where does it go?', options: ['on the road', 'in the sky', 'in the sea'], answer: 'on the road' },
    ],
  },
  {
    id: 'bike',
    sceneEmoji: '🚲',
    sceneLabel: 'a bike',
    questions: [
      { text: 'What is it?', options: ['a bike', 'a bus', 'a car'], answer: 'a bike' },
      { text: 'What do you do with it?', options: ['ride it', 'eat it', 'read it'], answer: 'ride it' },
    ],
  },
  {
    id: 'school',
    sceneEmoji: '🏫',
    sceneLabel: 'a school building',
    questions: [
      { text: 'What place is it?', options: ['a school', 'a shop', 'a farm'], answer: 'a school' },
      { text: 'What do you do there?', options: ['learn', 'swim', 'sleep'], answer: 'learn' },
    ],
  },
  {
    id: 'teacher',
    sceneEmoji: '👩‍🏫',
    sceneLabel: 'a teacher at a board',
    questions: [
      { text: 'Who is it?', options: ['a teacher', 'a doctor', 'a farmer'], answer: 'a teacher' },
      { text: 'Where does she work?', options: ['at school', 'at the zoo', 'at the beach'], answer: 'at school' },
    ],
  },
  {
    id: 'doctor',
    sceneEmoji: '👨‍⚕️',
    sceneLabel: 'a doctor',
    questions: [
      { text: 'Who is it?', options: ['a doctor', 'a cook', 'a pilot'], answer: 'a doctor' },
      { text: 'Where does he work?', options: ['in a hospital', 'in a shop', 'in a park'], answer: 'in a hospital' },
    ],
  },
  {
    id: 'hat',
    sceneEmoji: '🎩',
    sceneLabel: 'a black hat',
    questions: [
      { text: 'What is it?', options: ['a hat', 'a shoe', 'a sock'], answer: 'a hat' },
      { text: 'Where do you wear it?', options: ['on your head', 'on your foot', 'on your hand'], answer: 'on your head' },
    ],
  },
  {
    id: 'book',
    sceneEmoji: '📖',
    sceneLabel: 'an open book',
    questions: [
      { text: 'What is it?', options: ['a book', 'a bag', 'a pen'], answer: 'a book' },
      { text: 'What do you do with it?', options: ['read it', 'kick it', 'drink it'], answer: 'read it' },
    ],
  },
  {
    id: 'milk',
    sceneEmoji: '🥛',
    sceneLabel: 'a glass of milk',
    questions: [
      { text: 'What is it?', options: ['milk', 'juice', 'water'], answer: 'milk' },
      { text: 'What color is milk?', options: ['white', 'black', 'green'], answer: 'white' },
    ],
  },
  {
    id: 'sun',
    sceneEmoji: '☀️',
    sceneLabel: 'a bright sun',
    questions: [
      { text: 'What is it?', options: ['the sun', 'the moon', 'a star'], answer: 'the sun' },
      { text: 'When do you see the sun?', options: ['in the day', 'at night', 'in bed'], answer: 'in the day' },
    ],
  },
  {
    id: 'moon',
    sceneEmoji: '🌙',
    sceneLabel: 'a moon at night',
    questions: [
      { text: 'What is it?', options: ['the moon', 'the sun', 'a tree'], answer: 'the moon' },
      { text: 'When do you see the moon?', options: ['at night', 'in the day', 'at school'], answer: 'at night' },
    ],
  },
  {
    id: 'snowman',
    sceneEmoji: '⛄',
    sceneLabel: 'a snowman in the snow',
    questions: [
      { text: 'What is the weather like?', options: ['snowy', 'sunny', 'rainy'], answer: 'snowy' },
      { text: 'Is it hot or cold?', options: ['cold', 'hot', 'wet'], answer: 'cold' },
    ],
  },
  {
    id: 'rainbow',
    sceneEmoji: '🌈',
    sceneLabel: 'a colourful rainbow',
    questions: [
      { text: 'What is it?', options: ['a rainbow', 'a star', 'a cloud'], answer: 'a rainbow' },
      { text: 'When do you see it?', options: ['after rain', 'in bed', 'at school'], answer: 'after rain' },
    ],
  },
  {
    id: 'banana',
    sceneEmoji: '🍌',
    sceneLabel: 'a yellow banana',
    questions: [
      { text: 'What fruit is it?', options: ['a banana', 'an apple', 'a pear'], answer: 'a banana' },
      { text: 'What color is it?', options: ['yellow', 'blue', 'red'], answer: 'yellow' },
    ],
  },

  // --- More animals ---
  {
    id: 'cow',
    sceneEmoji: '🐮',
    sceneLabel: 'a cow',
    questions: [
      { text: 'What animal is it?', options: ['a cow', 'a horse', 'a goat'], answer: 'a cow' },
      { text: 'What does a cow give us?', options: ['milk', 'juice', 'bread'], answer: 'milk' },
    ],
  },
  {
    id: 'horse',
    sceneEmoji: '🐴',
    sceneLabel: 'a brown horse',
    questions: [
      { text: 'What animal is it?', options: ['a horse', 'a cow', 'a dog'], answer: 'a horse' },
      { text: 'What can a horse do?', options: ['run', 'fly', 'swim'], answer: 'run' },
    ],
  },
  {
    id: 'rabbit',
    sceneEmoji: '🐰',
    sceneLabel: 'a white rabbit',
    questions: [
      { text: 'What animal is it?', options: ['a rabbit', 'a mouse', 'a cat'], answer: 'a rabbit' },
      { text: 'What does it eat?', options: ['a carrot', 'a cake', 'a fish'], answer: 'a carrot' },
    ],
  },
  {
    id: 'bear',
    sceneEmoji: '🐻',
    sceneLabel: 'a brown bear',
    questions: [
      { text: 'What animal is it?', options: ['a bear', 'a lion', 'a tiger'], answer: 'a bear' },
      { text: 'What color is it?', options: ['brown', 'blue', 'pink'], answer: 'brown' },
    ],
  },
  {
    id: 'tiger',
    sceneEmoji: '🐯',
    sceneLabel: 'a tiger with stripes',
    questions: [
      { text: 'What animal is it?', options: ['a tiger', 'a cat', 'a dog'], answer: 'a tiger' },
      { text: 'What color is a tiger?', options: ['orange', 'green', 'purple'], answer: 'orange' },
    ],
  },
  {
    id: 'duck',
    sceneEmoji: '🦆',
    sceneLabel: 'a duck on the water',
    questions: [
      { text: 'What animal is it?', options: ['a duck', 'a bird', 'a hen'], answer: 'a duck' },
      { text: 'Where is the duck?', options: ['on the water', 'in a tree', 'in a car'], answer: 'on the water' },
    ],
  },
  {
    id: 'penguin',
    sceneEmoji: '🐧',
    sceneLabel: 'a penguin',
    questions: [
      { text: 'What animal is it?', options: ['a penguin', 'a parrot', 'a bee'], answer: 'a penguin' },
      { text: 'Is it hot or cold where it lives?', options: ['cold', 'hot', 'wet'], answer: 'cold' },
    ],
  },
  {
    id: 'monkey',
    sceneEmoji: '🐵',
    sceneLabel: 'a monkey',
    questions: [
      { text: 'What animal is it?', options: ['a monkey', 'a mouse', 'a frog'], answer: 'a monkey' },
      { text: 'What does a monkey eat?', options: ['a banana', 'a shoe', 'a book'], answer: 'a banana' },
    ],
  },
  {
    id: 'snake',
    sceneEmoji: '🐍',
    sceneLabel: 'a green snake',
    questions: [
      { text: 'What animal is it?', options: ['a snake', 'a fish', 'a bird'], answer: 'a snake' },
      { text: 'What color is it?', options: ['green', 'blue', 'pink'], answer: 'green' },
    ],
  },
  {
    id: 'bee',
    sceneEmoji: '🐝',
    sceneLabel: 'a little bee',
    questions: [
      { text: 'What is it?', options: ['a bee', 'a bird', 'a cat'], answer: 'a bee' },
      { text: 'Where does a bee fly?', options: ['to a flower', 'to a car', 'to a bed'], answer: 'to a flower' },
    ],
  },

  // --- Transport ---
  {
    id: 'train',
    sceneEmoji: '🚂',
    sceneLabel: 'a train',
    questions: [
      { text: 'What is it?', options: ['a train', 'a bus', 'a boat'], answer: 'a train' },
      { text: 'What do you do with a train?', options: ['ride it', 'eat it', 'drink it'], answer: 'ride it' },
    ],
  },
  {
    id: 'sailboat',
    sceneEmoji: '⛵',
    sceneLabel: 'a boat on the sea',
    questions: [
      { text: 'What is it?', options: ['a boat', 'a car', 'a plane'], answer: 'a boat' },
      { text: 'Where does a boat go?', options: ['on the water', 'on the road', 'in the sky'], answer: 'on the water' },
    ],
  },
  {
    id: 'helicopter',
    sceneEmoji: '🚁',
    sceneLabel: 'a helicopter',
    questions: [
      { text: 'What is it?', options: ['a helicopter', 'a plane', 'a bus'], answer: 'a helicopter' },
      { text: 'Where does it fly?', options: ['in the sky', 'in the sea', 'on the road'], answer: 'in the sky' },
    ],
  },

  // --- Clothes ---
  {
    id: 'dress',
    sceneEmoji: '👗',
    sceneLabel: 'a pink dress',
    questions: [
      { text: 'What is it?', options: ['a dress', 'a hat', 'a shoe'], answer: 'a dress' },
      { text: 'Who wears a dress?', options: ['a girl', 'a car', 'a fish'], answer: 'a girl' },
    ],
  },
  {
    id: 'shirt',
    sceneEmoji: '👕',
    sceneLabel: 'a blue shirt',
    questions: [
      { text: 'What is it?', options: ['a shirt', 'a sock', 'a boot'], answer: 'a shirt' },
      { text: 'Where do you wear it?', options: ['on your body', 'on your head', 'on your foot'], answer: 'on your body' },
    ],
  },
  {
    id: 'boots',
    sceneEmoji: '👢',
    sceneLabel: 'a pair of boots',
    questions: [
      { text: 'What are they?', options: ['boots', 'gloves', 'a hat'], answer: 'boots' },
      { text: 'Where do you wear boots?', options: ['on your feet', 'on your head', 'on your hand'], answer: 'on your feet' },
    ],
  },

  // --- Food ---
  {
    id: 'pizza',
    sceneEmoji: '🍕',
    sceneLabel: 'a pizza',
    questions: [
      { text: 'What is it?', options: ['a pizza', 'an apple', 'an egg'], answer: 'a pizza' },
      { text: 'What do you do with it?', options: ['eat it', 'read it', 'ride it'], answer: 'eat it' },
    ],
  },
  {
    id: 'orange',
    sceneEmoji: '🍊',
    sceneLabel: 'an orange fruit',
    questions: [
      { text: 'What fruit is it?', options: ['an orange', 'a banana', 'a pear'], answer: 'an orange' },
      { text: 'What color is it?', options: ['orange', 'blue', 'black'], answer: 'orange' },
    ],
  },
  {
    id: 'carrot',
    sceneEmoji: '🥕',
    sceneLabel: 'a carrot',
    questions: [
      { text: 'What is it?', options: ['a carrot', 'a tomato', 'a potato'], answer: 'a carrot' },
      { text: 'What color is a carrot?', options: ['orange', 'purple', 'blue'], answer: 'orange' },
    ],
  },

  // --- Home & objects ---
  {
    id: 'clock',
    sceneEmoji: '🕐',
    sceneLabel: 'a clock',
    questions: [
      { text: 'What is it?', options: ['a clock', 'a lamp', 'a phone'], answer: 'a clock' },
      { text: 'What does a clock tell us?', options: ['the time', 'the food', 'the color'], answer: 'the time' },
    ],
  },
  {
    id: 'house',
    sceneEmoji: '🏠',
    sceneLabel: 'a house',
    questions: [
      { text: 'What is it?', options: ['a house', 'a school', 'a shop'], answer: 'a house' },
      { text: 'What do you do in a house?', options: ['live', 'swim', 'fly'], answer: 'live' },
    ],
  },
  {
    id: 'bed',
    sceneEmoji: '🛏️',
    sceneLabel: 'a bed',
    questions: [
      { text: 'What is it?', options: ['a bed', 'a chair', 'a table'], answer: 'a bed' },
      { text: 'What do you do in bed?', options: ['sleep', 'run', 'eat'], answer: 'sleep' },
    ],
  },
  {
    id: 'phone',
    sceneEmoji: '📱',
    sceneLabel: 'a phone',
    questions: [
      { text: 'What is it?', options: ['a phone', 'a book', 'a bag'], answer: 'a phone' },
      { text: 'What do you do with a phone?', options: ['talk', 'kick', 'drink'], answer: 'talk' },
    ],
  },

  // --- Jobs ---
  {
    id: 'nurse',
    sceneEmoji: '👩‍⚕️',
    sceneLabel: 'a nurse',
    questions: [
      { text: 'Who is it?', options: ['a nurse', 'a pilot', 'a clown'], answer: 'a nurse' },
      { text: 'Where does a nurse work?', options: ['in a hospital', 'in a zoo', 'on a farm'], answer: 'in a hospital' },
    ],
  },
];
