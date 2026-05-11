import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vocabEn from './locales/en/vocab.json';

i18n.use(initReactI18next).init({
  resources: { en: { vocab: vocabEn } },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['vocab'],
  defaultNS: 'vocab',
  interpolation: { escapeValue: false },
});

export default i18n;
