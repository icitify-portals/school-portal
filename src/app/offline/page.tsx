"use client";

import { WifiOff, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="relative">
                    <div className="w-32 h-32 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border-4 border-indigo-500/20">
                        <WifiOff className="w-16 h-16 text-indigo-400" />
                    </div>
                    <div className="absolute top-0 right-1/4 w-8 h-8 bg-rose-500 rounded-full border-4 border-slate-900 animate-pulse" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                        Offline <span className="text-indigo-400">Mode</span>
                    </h1>
                    <p className="text-slate-400 font-medium leading-relaxed">
                        It looks like you've lost your connection. Don't worry, your offline SmartBooks and cached grades are still available.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4">
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-16 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        Try to Reconnect
                    </button>
                    <Link 
                        href="/"
                        className="w-full bg-white/5 hover:bg-white/10 text-white h-16 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all border border-white/10"
                    >
                        <Home className="w-5 h-5" />
                        Go to Dashboard
                    </Link>
                </div>

                <div className="pt-8 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">
                        Institutional Continuity Protocol v1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
