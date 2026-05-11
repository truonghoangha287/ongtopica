import type { WordSet, Word } from '@/shared/types';
import animalsData from './animals.json';
import foodData from './food.json';
import clothesData from './clothes.json';
import colorsData from './colors.json';
import bodyData from './body.json';
import toysData from './toys.json';
import familyData from './family.json';

export const wordSetRegistry: WordSet[] = [
  { id: 'animals', displayName: 'Animals', words: animalsData as Word[] },
  { id: 'food', displayName: 'Food', words: foodData as Word[] },
  { id: 'clothes', displayName: 'Clothes', words: clothesData as Word[] },
  { id: 'colors', displayName: 'Colors', words: colorsData as Word[] },
  { id: 'body', displayName: 'Body', words: bodyData as Word[] },
  { id: 'toys', displayName: 'Toys', words: toysData as Word[] },
  { id: 'family', displayName: 'Family', words: familyData as Word[] },
];

export function getWordSet(id: string): WordSet | undefined {
  return wordSetRegistry.find((ws) => ws.id === id);
}
