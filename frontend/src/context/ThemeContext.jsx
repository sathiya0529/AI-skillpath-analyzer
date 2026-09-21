import { createContext, useContext, useEffect, useState } from 'react';

const ThemeCtx = createContext();
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('skillpath_theme') || 'system');

  useEffect(() => {
    const apply = () => {
      let t = theme;
      if (t === 'system') t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', t);
    };
    apply();
    localStorage.setItem('skillpath_theme', theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, [theme]);

  const cycle = () => setTheme((t) => (t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light'));

  return <ThemeCtx.Provider value={{ theme, setTheme, cycle }}>{children}</ThemeCtx.Provider>;
}
