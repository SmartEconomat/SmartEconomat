import React, { useState, useLayoutEffect } from 'react';
import { getTheme, ThemeName, FontSize } from '../utils/theme/themes';
import { ThemeContext } from './theme.context';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "ThemeContextProvider" en smart-economat-frontend (SPA).
 * @undefined {{ children: React.ReactNode; }} {
 *   children,
 * } - Entrada efectiva esperada por el contrato.
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/jsx-runtime").JSX.Element} Datos efectivos después de ejecutar la operación.
 */
export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeName, setThemeName] = useState<ThemeName>('light');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [isLearningMode, setLearningModeState] = useState(false);

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') as ThemeName;
    const savedFontSize = localStorage.getItem('appFontSize') as FontSize;

    if (
      savedTheme &&
      ['light', 'dark', 'highContrastLight', 'highContrastDark'].includes(
        savedTheme
      )
    ) {
      setThemeName(savedTheme);
    }

    if (savedFontSize && ['small', 'medium', 'large'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize);
    }

    const savedLearningMode = localStorage.getItem('appLearningMode');
    if (savedLearningMode !== null) {
      setLearningModeState(savedLearningMode === 'true');
    }
  }, []);

  /**
   * Ejecuta la lógica de set theme dentro del flujo de la aplicación.
   *
   * @param name Parámetro de entrada para la operación.
   */
  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem('appTheme', name);
  };

  /**
   * Ejecuta la lógica de set font size dentro del flujo de la aplicación.
   *
   * @param size Parámetro de entrada para la operación.
   */
  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('appFontSize', size);
  };

  /**
   * Ejecuta la lógica de set learning mode dentro del flujo de la aplicación.
   *
   * @param mode Parámetro de entrada para la operación.
   */
  const setLearningMode = (mode: boolean) => {
    setLearningModeState(mode);
    localStorage.setItem('appLearningMode', String(mode));
  };

  const siteTheme = getTheme(themeName, fontSize);

  return (
    <ThemeContext.Provider
      value={{
        currentThemeName: themeName,
        fontSize,
        setTheme,
        setFontSize,
        isLearningMode,
        setLearningMode,
        siteTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
