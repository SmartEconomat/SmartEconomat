import { createContext } from 'react';
import { getTheme } from '../utils/theme/themes';
import { ThemeContextType } from './theme.types';

export const ThemeContext = createContext<ThemeContextType>({
  currentThemeName: 'light',
  fontSize: 'medium',
  setTheme: () => {},
  setFontSize: () => {},
  isLearningMode: false,
  setLearningMode: () => {},
  siteTheme: getTheme('light', 'medium'),
});
