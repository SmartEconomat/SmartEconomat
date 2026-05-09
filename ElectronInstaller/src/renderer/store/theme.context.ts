import { createContext } from "react";

import { getTheme } from "@renderer/utils/theme/themes";

import { ThemeContextType } from "./theme.types";

/** Constantes exportadas (ThemeContext) compartidas por el instalador. */
export const ThemeContext = createContext<ThemeContextType>({
  currentThemeName: "light",
  fontSize: "medium",
  setTheme: () => {},
  setFontSize: () => {},
  isLearningMode: false,
  setLearningMode: () => {},
  siteTheme: getTheme("light", "medium"),
});
