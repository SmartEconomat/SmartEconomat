/**
 * i18n initialization with browser detection and local storage persistence.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import es from './es.json';
import tutorialEn from './locales/tutorial.en.json';
import tutorialEs from './locales/tutorial.es.json';

const enMerged = { ...en, ...tutorialEn } as Record<string, unknown>;
const esMerged = { ...es, ...tutorialEs } as Record<string, unknown>;

/** Constantes públicas (resources) expuestas en smart-economat-frontend (SPA). */
export const resources = {
  en: { translation: enMerged },
  es: { translation: esMerged },
};

const isTestEnv =
  // Vitest expone `import.meta.env.MODE === 'test'` y/o `import.meta.env.VITEST`
  // (según versión/config). En tests no necesitamos detección ni persistencia.
  import.meta.env.MODE === 'test' || Boolean(import.meta.env.VITEST);

// Configuration for the language detector
const detectorOptions = {
  // Order of detection
  order: ['localStorage', 'navigator'],
  // Key to use in localStorage
  lookupLocalStorage: 'sm_language',
  // Cache the selection in localStorage
  caches: ['localStorage'],
};

i18n.use(initReactI18next);

if (!isTestEnv) {
  i18n.use(LanguageDetector);
}

i18n.init({
  resources,
  fallbackLng: 'es', // Default fallback: Spanish
  ...(isTestEnv ? {} : { detection: detectorOptions }),
  interpolation: { escapeValue: false },
  // Only allow 'es' and 'en'
  supportedLngs: ['es', 'en'],
  // If language has region (e.g. 'en-US'), just use 'en'
  nonExplicitSupportedLngs: true,
});

export default i18n;
