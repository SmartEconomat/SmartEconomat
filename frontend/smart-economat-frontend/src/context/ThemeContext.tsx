import React, { createContext, useState, useContext, useLayoutEffect } from 'react';
import { Theme } from '@mui/material/styles';
import { getTheme, ThemeName, FontSize } from '../theme/themes';

interface ThemeContextType {
    currentThemeName: ThemeName;
    fontSize: FontSize;
    setTheme: (name: ThemeName) => void;
    setFontSize: (size: FontSize) => void;
    siteTheme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({
    currentThemeName: 'light',
    fontSize: 'medium',
    setTheme: () => { },
    setFontSize: () => { },
    siteTheme: getTheme('light', 'medium'),
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeName, setThemeName] = useState<ThemeName>('light');
    const [fontSize, setFontSizeState] = useState<FontSize>('medium');

    useLayoutEffect(() => {
        const savedTheme = localStorage.getItem('appTheme') as ThemeName;
        const savedFontSize = localStorage.getItem('appFontSize') as FontSize;

        if (savedTheme && ['light', 'dark', 'highContrastLight', 'highContrastDark'].includes(savedTheme)) {
            setThemeName(savedTheme);
        }

        if (savedFontSize && ['small', 'medium', 'large'].includes(savedFontSize)) {
            setFontSizeState(savedFontSize);
        }
    }, []);

    const setTheme = (name: ThemeName) => {
        setThemeName(name);
        localStorage.setItem('appTheme', name);
    };

    const setFontSize = (size: FontSize) => {
        setFontSizeState(size);
        localStorage.setItem('appFontSize', size);
    };

    const siteTheme = getTheme(themeName, fontSize);

    return (
        <ThemeContext.Provider value={{
            currentThemeName: themeName,
            fontSize,
            setTheme,
            setFontSize,
            siteTheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
