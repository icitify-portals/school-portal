"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Download, X } from "lucide-react";

export function ServiceWorkerRegistrar() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Register service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => {
                    console.log("SW registered:", reg.scope);
                })
                .catch((err) => {
                    console.warn("SW registration failed:", err);
                });
        }

        // Capture install prompt
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
            // Show banner after a short delay
            const dismissed = localStorage.getItem("pwa-install-dismissed");
            if (!dismissed) {
                setTimeout(() => setShowBanner(true), 3000);
            }
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);
        return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === "accepted") {
            setShowBanner(false);
            setInstallPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    };

    if (!showBanner || !installPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4">
            <div className="bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-600/30 p-4 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl shrink-0">
                    <Download className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-xs uppercase tracking-widest">
                        Install App
                    </p>
                    <p className="text-[10px] text-indigo-200 font-medium">
                        Add to home screen for quick access
                    </p>
                </div>
                <button
                    onClick={handleInstall}
                    className="px-3 py-1.5 bg-white text-indigo-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-50 transition-all shrink-0"
                >
                    Install
                </button>
                <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-white/10 rounded-lg transition-all shrink-0"
                >
                    <X className="w-4 h-4 text-indigo-200" />
                </button>
            </div>
        </div>
    );
}
