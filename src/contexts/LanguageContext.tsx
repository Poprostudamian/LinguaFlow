// src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, Language, TranslationKeys } from '../locales/translations';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Sprawdź localStorage
    const saved = localStorage.getItem('language') as Language;
    // Domyślnie 'en' (angielski)
    return saved && (saved === 'en' || saved === 'pl') ? saved : 'en';
  });

  useEffect(() => {
    // Zapisz do localStorage
    localStorage.setItem('language', language);
    
    // Ustaw atrybut lang w HTML
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'pl' : 'en');
  };

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ 
      language, 
      toggleLanguage, 
      setLanguage: handleSetLanguage,
      t 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}