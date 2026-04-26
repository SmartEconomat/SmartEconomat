import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Documentación en español.
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
