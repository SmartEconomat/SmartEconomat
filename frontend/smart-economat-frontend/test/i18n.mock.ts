import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from '../src/i18n/es.json';

// Configuración de i18n simplificada para el entorno de tests
void i18n.use(initReactI18next).init({
  resources: {
    es: {
      translation: es,
    },
  },
  lng: 'es',
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
