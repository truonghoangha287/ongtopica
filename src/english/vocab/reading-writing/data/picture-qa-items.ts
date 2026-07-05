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
];
