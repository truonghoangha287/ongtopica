import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vocabEn from './locales/en/vocab.json';
import mathEn from './locales/en/math.json';

i18n.use(initReactI18next).init({
  resources: { en: { vocab: vocabEn, math: mathEn } },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['vocab', 'math'],
  defaultNS: 'vocab',
  interpolation: { escapeValue: false },
});

export default i18n;
