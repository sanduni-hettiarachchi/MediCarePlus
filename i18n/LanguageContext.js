import React, { createContext, useContext, useMemo } from 'react';
import en from './en';
import si from './si';

const dictionaries = { en, si };
const LanguageContext = createContext({ language: 'en', t: (key) => key });

export function LanguageProvider({ language = 'en', children }) {
  const value = useMemo(() => {
    const activeLanguage = language === 'si' ? 'si' : 'en';
    const translateFor = (selectedLanguage, key, values = {}) => {
      const dictionary = dictionaries[selectedLanguage === 'si' ? 'si' : 'en'];
      const template = dictionary[key] || dictionaries.en[key] || key;
      return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
    };
    return {
      language: activeLanguage,
      t: (key, values = {}) => translateFor(activeLanguage, key, values),
      translateFor,
    };
  }, [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT(languageOverride) {
  const context = useContext(LanguageContext);
  return languageOverride
    ? (key, values) => context.translateFor(languageOverride, key, values)
    : context.t;
}

export function useLanguage() {
  return useContext(LanguageContext).language;
}
