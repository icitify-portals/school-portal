"use client";

import { useTranslation, SUPPORTED_LANGUAGES } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { 
    Globe, 
    Check, 
    Search,
    ChevronDown,
    Languages
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
    const { language, setLanguage, dir } = useTranslation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

    const filteredLanguages = SUPPORTED_LANGUAGES.filter(l => 
        l.name.toLowerCase().includes(search.toLowerCase()) || 
        l.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    className="h-10 px-4 rounded-xl border border-slate-100 bg-white/50 backdrop-blur-md hover:bg-white hover:shadow-sm transition-all gap-2"
                >
                    <span className="text-base">{currentLang.flag}</span>
                    <span className="text-xs font-black uppercase tracking-widest hidden md:inline">{currentLang.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-8 bg-slate-900 text-white relative overflow-hidden">
                    <div className="relative z-10 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                                <Languages className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Institutional Hub</span>
                        </div>
                        <DialogTitle className="text-3xl font-black italic tracking-tighter">Universal Language Portal</DialogTitle>
                        <p className="text-slate-400 text-sm font-medium">Select your preferred institutional tongue.</p>
                    </div>
                    <Globe className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Search languages..."
                            className="h-12 pl-12 rounded-2xl bg-slate-50 border-none focus-visible:ring-indigo-500/20 font-bold"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                        {filteredLanguages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-2xl transition-all border",
                                    language === lang.code 
                                        ? "bg-indigo-50 border-indigo-200" 
                                        : "hover:bg-slate-50 border-transparent hover:border-slate-100"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl">{lang.flag}</span>
                                    <div className="text-left">
                                        <div className="text-sm font-black text-slate-900 leading-none">{lang.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{lang.code}</div>
                                    </div>
                                </div>
                                {language === lang.code && (
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100/50 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Serving 12+ Pan-African Nations</p>
                    <Button variant="ghost" className="h-8 text-[10px] font-bold uppercase tracking-widest" onClick={() => setOpen(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
