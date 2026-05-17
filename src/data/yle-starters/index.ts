import type { WordSet, Word } from '@/shared/types';
import animalsData from './animals.json';
import bodyData from './body.json';
import clothesData from './clothes.json';
import colorsData from './colors.json';
import familyData from './family.json';
import foodData from './food.json';
import homeData from './home.json';
import placesData from './places.json';
import schoolData from './school.json';
import sportsData from './sports.json';
import toysData from './toys.json';
import transportData from './transport.json';
import weatherData from './weather.json';
import workData from './work.json';

export const wordSetRegistry: WordSet[] = [
  { id: 'animals', displayName: 'Animals', words: animalsData as Word[] },
  { id: 'body', displayName: 'Body', words: bodyData as Word[] },
  { id: 'clothes', displayName: 'Clothes', words: clothesData as Word[] },
  { id: 'colors', displayName: 'Colors', words: colorsData as Word[] },
  { id: 'family', displayName: 'Family', words: familyData as Word[] },
  { id: 'food', displayName: 'Food', words: foodData as Word[] },
  { id: 'home', displayName: 'Home', words: homeData as Word[] },
  { id: 'places', displayName: 'Places', words: placesData as Word[] },
  { id: 'school', displayName: 'School', words: schoolData as Word[] },
  { id: 'sports', displayName: 'Sports', words: sportsData as Word[] },
  { id: 'toys', displayName: 'Toys', words: toysData as Word[] },
  { id: 'transport', displayName: 'Transport', words: transportData as Word[] },
  { id: 'weather', displayName: 'Weather', words: weatherData as Word[] },
  { id: 'work', displayName: 'Work', words: workData as Word[] },
];

export function getWordSet(id: string): WordSet | undefined {
  return wordSetRegistry.find((ws) => ws.id === id);
}
