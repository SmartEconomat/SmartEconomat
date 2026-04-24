/**
 * @module i18n/frontend
 * Configuración centralizada de internacionalización para React.
 *
 * Se elige `react-i18next` + `i18next` porque:
 * - Es la solución oficial y más extendida para React.
 * - Proporciona el hook `useTranslation()` que re-renderiza automáticamente
 *   los componentes al cambiar el idioma, sin necesidad de Context manual.
 * - Soporta interpolación, pluralización y namespaces listos para usar.
 *
 * Idioma fijo: `es` (español de España). Fallback: `en`.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import es from './es.json';

export const resources = {
  en: { translation: en },
  es: { translation: es },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'es',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
