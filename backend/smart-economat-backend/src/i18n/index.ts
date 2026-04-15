/**
 * @module i18n/backend
 * Inicialización de i18next para el servidor Express.
 *
 * Se elige `i18next` con `i18next-fs-backend` porque:
 * - Carga los JSON de traducción desde disco en tiempo de ejecución.
 * - Permite añadir o modificar traducciones sin recompilar.
 * - Compatible con el patrón de detección de idioma por request
 *   implementado en `languageDetector.ts`.
 *
 * Archivos de traducción: `src/i18n/en.json`, `src/i18n/es.json`.
 * Idioma por defecto: `es`. Fallback: `en`.
 */
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

i18next.use(Backend).init({
  lng: 'es',
  fallbackLng: 'en',
  backend: {
    loadPath: path.join(__dirname, './{{lng}}.json'),
  },
});

export default i18next;
