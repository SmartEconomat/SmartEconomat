import React from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

/**
 * Language selector using MUI ToggleButtonGroup.
 *
 * Highlights the currently active language and calls `i18n.changeLanguage`
 * when the user picks the other option.  Renders ES / EN buttons.
 *
 * @example
 * <LanguageSwitcher />
 */
export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const handleChange = (
    _: React.MouseEvent<HTMLElement>,
    newLng: string | null
  ) => {
    if (newLng) {
      void i18n.changeLanguage(newLng);
    }
  };

  return (
    <ToggleButtonGroup
      value={i18n.language}
      exclusive
      onChange={handleChange}
      size="small"
      aria-label={t('perfil.preferencias.idioma')}
    >
      <ToggleButton value="es" aria-label={t('comun.idioma.es')}>
        {t('comun.idioma.es')}
      </ToggleButton>
      <ToggleButton value="en" aria-label={t('comun.idioma.en')}>
        {t('comun.idioma.en')}
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
