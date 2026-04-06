import React, { createContext, useContext, useState } from 'react';
import { translations } from './i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('db_lang') || 'en');

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

  const setLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('db_lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}