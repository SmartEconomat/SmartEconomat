import { useContext } from 'react';
import { ThemeContext } from './theme.context';

/**
 * Custom hook that provides convenient access to the application's
 * `ThemeContext`.
 *
 * Must be called from within a component that is a descendant of
 * `ThemeContextProvider`; otherwise the context values will be `undefined`.
 *
 * @returns {ThemeContextType} The current theme context value, including
 *   `currentThemeName`, `fontSize`, `isLearningMode`, `siteTheme`,
 *   `setTheme`, `setFontSize`, and `setLearningMode`.
 *
 * @example
 * const { currentThemeName, setTheme } = useThemeContext();
 * setTheme('dark');
 */
export const useThemeContext = () => useContext(ThemeContext);
