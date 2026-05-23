"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// Import translations statically
import en from "./en.json";
import fr from "./fr.json";
import ar from "./ar.json";
import ha from "./ha.json";
import ig from "./ig.json";
import yo from "./yo.json";
import sw from "./sw.json";

type Translations = Record<string, Record<string, string>>;

const translations: Record<string, Translations> = { en, fr, ar, ha, ig, yo, sw };

export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬', dir: 'ltr' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬', dir: 'ltr' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬', dir: 'ltr' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪', dir: 'ltr' },
    { code: 'am', name: 'Amharic', flag: '🇪🇹', dir: 'ltr' },
    { code: 'zu', name: 'isiZulu', flag: '🇿🇦', dir: 'ltr' },
    { code: 'xh', name: 'isiXhosa', flag: '🇿🇦', dir: 'ltr' },
    { code: 'om', name: 'Afaan Oromoo', flag: '🇪🇹', dir: 'ltr' },
    { code: 'wo', name: 'Wolof', flag: '🇸🇳', dir: 'ltr' },
    { code: 'pt', name: 'Português', flag: '🇦🇴', dir: 'ltr' },
];

interface LanguageContextType {
    language: string;
    setLanguage: (lang: string) => void;
    t: (key: string) => string;
    dir: string;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => {},
    t: (key) => key,
    dir: 'ltr',
});

export function LanguageProvider({ children, initialLanguage = 'en' }: { children: React.ReactNode; initialLanguage?: string }) {
    const [language, setLanguageState] = useState(initialLanguage);


    useEffect(() => {
        // Load saved language preference
        const saved = localStorage.getItem('portal-language');
        if (saved && translations[saved]) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = useCallback((lang: string) => {
        setLanguageState(lang);
        localStorage.setItem('portal-language', lang);
        // Set document direction for RTL languages
        const langDef = SUPPORTED_LANGUAGES.find(l => l.code === lang);
        if (langDef) {
            document.documentElement.dir = langDef.dir;
            document.documentElement.lang = lang;
            // Set cookie for SSR
            document.cookie = `portal-language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
        }
    }, []);

    const t = useCallback((key: string): string => {
        // Key format: "section.key" e.g. "common.dashboard"
        const [section, ...rest] = key.split('.');
        const subKey = rest.join('.');
        const dict = translations[language] || translations['en'];
        const sectionDict = dict[section];
        if (sectionDict && subKey in sectionDict) {
            return sectionDict[subKey];
        }
        // Fallback to English
        const enDict = translations['en'][section];
        if (enDict && subKey in enDict) {
            return enDict[subKey];
        }
        return key; // Return key as fallback
    }, [language]);

    const dir = SUPPORTED_LANGUAGES.find(l => l.code === language)?.dir || 'ltr';

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    return useContext(LanguageContext);
}
