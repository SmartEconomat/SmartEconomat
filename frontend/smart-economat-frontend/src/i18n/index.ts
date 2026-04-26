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

const savedLng =
  typeof window !== 'undefined'
    ? localStorage.getItem('i18nextLng') || 'es'
    : 'es';

i18n.use(initReactI18next).init({
  resources,
  lng: savedLng,
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  /**
   * Red de seguridad: Si falta una key, la humanizamos en lugar de mostrarla tal cual.
   * Ej: 'user.name' -> 'Name' | 'status.PENDIENTE' -> 'Pendiente'
   */
  parseMissingKeyHandler: (key) => {
    // Si la key contiene un punto, tomamos la última parte (ej: 'user.name' -> 'name')
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1];

    // Reemplazamos guiones bajos por espacios y capitalizamos
    return lastPart
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2') // CamelCase a Spaced
      .replace(/^\w/, (c) => c.toUpperCase());
  },
});

export default i18n;
