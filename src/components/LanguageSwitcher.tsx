"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation, SUPPORTED_LANGUAGES } from "@/i18n/LanguageProvider";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
    const { language, setLanguage } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-sm"
                aria-label="Change language"
            >
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-600">{currentLang?.flag} {currentLang?.code.toUpperCase()}</span>
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50">
                    {SUPPORTED_LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => { setLanguage(lang.code); setOpen(false); }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors ${language === lang.code ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'}`}
                        >
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
