import React, { createContext, useContext } from 'react';

const ThemeContext = createContext({ largeText: false, highContrast: false });

export function ThemeProvider({ largeText = false, highContrast = false, children }) {
  return <ThemeContext.Provider value={{ largeText, highContrast }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
