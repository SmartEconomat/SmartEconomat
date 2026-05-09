import { Theme } from "@mui/material/styles";

import { FontSize, ThemeName } from "@renderer/utils/theme/themes";

/** Contrato tipado público (ThemeContextType). */
export interface ThemeContextType {
  currentThemeName: ThemeName;
  fontSize: FontSize;
  setTheme: (name: ThemeName) => void;
  setFontSize: (size: FontSize) => void;
  isLearningMode: boolean;
  setLearningMode: (mode: boolean) => void;
  siteTheme: Theme;
}
