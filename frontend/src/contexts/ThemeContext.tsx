/**
 * ThemeContext - 主题和渐变色管理
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { THEME_COLORS, ThemeColor, DEFAULT_COLOR } from '../config/theme';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
    setIsDark: (dark: boolean) => void;
    colorTheme: ThemeColor;
    setColorTheme: (theme: ThemeColor) => void;
}

const STORAGE_KEY = 'eduaihub2_theme';

interface StoredTheme {
    isDark: boolean;
    colorTheme: ThemeColor;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(false);
    const [colorTheme, setColorThemeState] = useState<ThemeColor>(DEFAULT_COLOR);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed: StoredTheme = JSON.parse(stored);
                setIsDark(parsed.isDark);
                if (parsed.colorTheme) {
                    const validTheme = THEME_COLORS.find(c => c.id === parsed.colorTheme);
                    setColorThemeState(validTheme ? validTheme.id : DEFAULT_COLOR);
                }
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', colorTheme);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ isDark, colorTheme }));
        } catch {
            // Ignore storage errors
        }
    }, [isDark, colorTheme]);

    const toggleTheme = () => setIsDark(!isDark);
    const setTheme = (dark: boolean) => setIsDark(dark);
    const setColorTheme = (theme: ThemeColor) => setColorThemeState(theme);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, setIsDark: setTheme, colorTheme, setColorTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export { THEME_COLORS };
