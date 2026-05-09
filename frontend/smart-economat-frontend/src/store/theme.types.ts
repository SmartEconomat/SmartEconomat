import { Theme } from '@mui/material/styles';
import { ThemeName, FontSize } from '../utils/theme/themes';

/** Contrato de tipos público (ThemeContextType). Contexto: smart-economat-frontend (SPA). */
export interface ThemeContextType {
  currentThemeName: ThemeName;
  fontSize: FontSize;
  setTheme: (name: ThemeName) => void;
  setFontSize: (size: FontSize) => void;
  isLearningMode: boolean;
  setLearningMode: (mode: boolean) => void;
  siteTheme: Theme;
}
