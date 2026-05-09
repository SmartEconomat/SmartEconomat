import { createContext } from 'react';
import { getTheme } from '../utils/theme/themes';
import { ThemeContextType } from './theme.types';

/** Constantes públicas (ThemeContext) expuestas en smart-economat-frontend (SPA). */
export const ThemeContext = createContext<ThemeContextType>({
  currentThemeName: 'light',
  fontSize: 'medium',
  setTheme: () => {},
  setFontSize: () => {},
  isLearningMode: false,
  setLearningMode: () => {},
  siteTheme: getTheme('light', 'medium'),
});
