import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Global language selector component.
 *
 * Renders two buttons that allow the user to switch the application language
 * between Spanish (`es`) and English (`en`). The button labels are i18n
 * strings so the display name can be adjusted per locale if required.
 *
 * @example
 * <LanguageSwitcher />
 */
export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div>
      <button onClick={() => changeLanguage('es')}>
        {t('comun.idioma.es')}
      </button>
      <button onClick={() => changeLanguage('en')}>
        {t('comun.idioma.en')}
      </button>
    </div>
  );
};
