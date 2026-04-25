import React, { useLayoutEffect, useState } from "react";

import { FontSize, getTheme, ThemeName } from "@renderer/utils/theme/themes";

import { ThemeContext } from "./theme.context";

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeName, setThemeName] = useState<ThemeName>("light");
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [isLearningMode, setLearningModeState] = useState(false);

  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem("appTheme") as ThemeName;
    const savedFontSize = localStorage.getItem("appFontSize") as FontSize;

    if (
      savedTheme &&
      ["light", "dark", "highContrastLight", "highContrastDark"].includes(
        savedTheme,
      )
    ) {
      setThemeName(savedTheme);
    }

    if (savedFontSize && ["small", "medium", "large"].includes(savedFontSize)) {
      setFontSizeState(savedFontSize);
    }

    const savedLearningMode = localStorage.getItem("appLearningMode");
    if (savedLearningMode !== null) {
      setLearningModeState(savedLearningMode === "true");
    }
  }, []);

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem("appTheme", name);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem("appFontSize", size);
  };

  const setLearningMode = (mode: boolean) => {
    setLearningModeState(mode);
    localStorage.setItem("appLearningMode", String(mode));
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
