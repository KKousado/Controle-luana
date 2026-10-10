import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'auto',
  effectiveTheme: 'light',
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('doces_luana_theme') as ThemeMode) || 'auto';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const effectiveTheme = themeMode === 'auto' ? systemTheme : themeMode;

  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [effectiveTheme]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('doces_luana_theme', mode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, effectiveTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
