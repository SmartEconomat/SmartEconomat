import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "LoginForm" en smart-economat-frontend (SPA).
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/jsx-runtime").JSX.Element} Datos efectivos después de ejecutar la operación.
 */
export const LoginForm: React.FC = () => {
  const { t } = useTranslation();

  return (
    <form>
      <h2>{t('auth.login.title')}</h2>
      <label htmlFor="username">{t('auth.login.username')}</label>
      <input id="username" name="username" />
      <label htmlFor="password">{t('auth.login.password')}</label>
      <input id="password" name="password" type="password" />
      <button type="submit">{t('auth.login.submit')}</button>
    </form>
  );
};
