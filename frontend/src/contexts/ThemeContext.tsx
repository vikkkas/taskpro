import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('taskpro-theme') as Theme;
    return savedTheme || defaultTheme;
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateEffectiveTheme = () => {
      let newEffectiveTheme: 'light' | 'dark' = theme;
      const root = document.documentElement;
      root.classList.add('changing-theme');
      root.classList.remove('light', 'dark');
      root.classList.add(newEffectiveTheme);
      root.offsetHeight;
      setTimeout(() => {
        root.classList.remove('changing-theme');
      }, 1);
      setEffectiveTheme(newEffectiveTheme);
    };

    updateEffectiveTheme();
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.add('changing-theme');
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    let newEffectiveTheme: 'light' | 'dark';
    
    root.classList.remove('light', 'dark');
    root.classList.add(newEffectiveTheme);
    
    root.offsetHeight;
    
    setTimeout(() => {
      root.classList.remove('changing-theme');
    }, 1);
    
    setTheme(newTheme);
    localStorage.setItem('taskpro-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
