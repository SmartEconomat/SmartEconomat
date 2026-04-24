import React, { useState, useLayoutEffect } from 'react';
import { getTheme, ThemeName, FontSize } from '../utils/theme/themes';
import { ThemeContext } from './theme.context';

/**
 * Provides the application theme context to all child components.
 *
 * On mount it reads persisted preferences from `localStorage` (`appTheme`,
 * `appFontSize`, `appLearningMode`) and restores them as the initial state.
 * Any subsequent calls to `setTheme`, `setFontSize`, or `setLearningMode`
 * also persist the new value to `localStorage`.
 *
 * @param {{ children: React.ReactNode }} props - Component props
 * @returns JSX rendered context provider wrapping children
 *
 * @example
 * // Wrap the application root so every component can consume the theme
 * <ThemeContextProvider>
 *   <App />
 * </ThemeContextProvider>
 */
export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeName, setThemeName] = useState<ThemeName>('light');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [isLearningMode, setLearningModeState] = useState(false);

  /**
   * Reads persisted theme preferences from `localStorage` and applies them
   * before the browser paints, preventing a flash of the default theme.
   *
   * @returns {void}
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
   * Updates the active theme and persists the selection to `localStorage`.
   *
   * @param {ThemeName} name - The name of the theme to activate.
   * @returns {void}
   *
   * @example
   * setTheme('dark'); // switches to dark mode and persists
   */
  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem('appTheme', name);
  };

  /**
   * Updates the global font size and persists the selection to `localStorage`.
   *
   * @param {FontSize} size - The font-size variant to apply ('small' | 'medium' | 'large').
   * @returns {void}
   *
   * @example
   * setFontSize('large'); // increases base font size
   */
  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('appFontSize', size);
  };

  /**
   * Enables or disables learning mode and persists the preference to
   * `localStorage`.
   *
   * @param {boolean} mode - `true` to enable learning mode, `false` to disable.
   * @returns {void}
   *
   * @example
   * setLearningMode(true); // activates learning-mode UI hints
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
