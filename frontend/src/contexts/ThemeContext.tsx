/**
 * ThemeContext - 主题和渐变色管理
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface GradientConfig {
    from: string;
    to: string;
    direction: string;
}

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
    gradient: GradientConfig;
    setGradient: (config: GradientConfig) => void;
    getGradientStyle: () => React.CSSProperties;
}

const defaultGradient: GradientConfig = {
    from: '#6750A4',
    to: '#7D5260',
    direction: '135deg',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'eduaihub2_theme';

interface StoredTheme {
    isDark: boolean;
    gradient: GradientConfig;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(false);
    const [gradient, setGradientState] = useState<GradientConfig>(defaultGradient);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed: StoredTheme = JSON.parse(stored);
                setIsDark(parsed.isDark);
                setGradientState(parsed.gradient || defaultGradient);
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    // Apply dark mode class
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    // Save to localStorage
    const saveToStorage = (dark: boolean, grad: GradientConfig) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ isDark: dark, gradient: grad }));
        } catch {
            // Ignore storage errors
        }
    };

    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        saveToStorage(newDark, gradient);
    };

    const setGradient = (config: GradientConfig) => {
        setGradientState(config);
        saveToStorage(isDark, config);
    };

    const getGradientStyle = (): React.CSSProperties => ({
        background: `linear-gradient(${gradient.direction}, ${gradient.from} 0%, ${gradient.to} 100%)`,
    });

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, gradient, setGradient, getGradientStyle }}>
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

// Preset gradients
export const PRESET_GRADIENTS: { name: string; config: GradientConfig }[] = [
    { name: '紫罗兰', config: { from: '#6750A4', to: '#7D5260', direction: '135deg' } },
    { name: '海洋', config: { from: '#0061A4', to: '#006874', direction: '135deg' } },
    { name: '日落', config: { from: '#9C4146', to: '#7E5700', direction: '135deg' } },
    { name: '森林', config: { from: '#006E1C', to: '#006874', direction: '135deg' } },
    { name: '极光', config: { from: '#6750A4', to: '#006874', direction: '135deg' } },
    { name: '火焰', config: { from: '#9C4146', to: '#7E5700', direction: '45deg' } },
];
