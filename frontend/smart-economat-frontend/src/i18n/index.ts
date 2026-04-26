/**
 * Documentación en español.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import es from './es.json';
import tutorialEn from './locales/tutorial.en.json';
import tutorialEs from './locales/tutorial.es.json';

const enMerged = { ...en, ...tutorialEn } as Record<string, unknown>;
const esMerged = { ...es, ...tutorialEs } as Record<string, unknown>;

export const resources = {
  en: { translation: enMerged },
  es: { translation: esMerged },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'es',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
