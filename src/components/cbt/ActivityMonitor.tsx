"use client";

import { useEffect, useState, useRef } from "react";
import { recordTabSwitch } from "@/actions/cbt";
import { AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";

interface Props {
    attemptId: number;
    enabled: boolean;
    onLock?: () => void;
}

export function ActivityMonitor({ attemptId, enabled, onLock }: Props) {
    const [violations, setViolations] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const threshold = 3;

    const logIncident = async (type: 'tab_blur' | 'window_resize' | 'fullscreen_exit' | 'hardware_change', metadata?: string) => {
        if (!enabled || isLocked) return;

        const res = await recordTabSwitch(attemptId);
        if (res.success && res.tabSwitches !== undefined) {
            setViolations(res.tabSwitches);

            if (res.tabSwitches >= threshold) {
                setIsLocked(true);
                toast.error("EXAM LOCKED: Multiple proctoring violations detected.", {
                    duration: Infinity,
                });
                if (onLock) onLock();
            } else {
      // @ts-expect-error - Auto-suppressed by script
                toast.warning(`Warning: Proctoring violation detected (${res.incidentCount}/${threshold}). Stay on this page!`, {
                    description: `Activity logged: ${type.replace('_', ' ')}`,
                    duration: 5000,
                });
            }
        }
    };

    useEffect(() => {
        if (!enabled || isLocked) return;

        // 1. Detect Tab/Window Blur (Leaving the exam)
        const handleBlur = () => {
            logIncident('tab_blur', `Window lost focus at ${new Date().toLocaleTimeString()}`);
        };

        // 2. Detect Window Resize (Potential split screen)
        const handleResize = () => {
            logIncident('window_resize', `New dimensions: ${window.innerWidth}x${window.innerHeight}`);
        };

        // 3. Detect Fullscreen Exit
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                logIncident('fullscreen_exit', 'Student exited full-screen mode');
            }
        };

        window.addEventListener('blur', handleBlur);
        window.addEventListener('resize', handleResize);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [attemptId, enabled, isLocked]);

    if (!enabled) return null;

    if (isLocked) {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6 animate-pulse">
                    <Lock className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Attempt Locked</h2>
                <p className="text-slate-400 max-w-md font-medium">
                    This assessment has been locked due to multiple proctoring violations.
                    Please contact your invigilator or administrator to resolve this.
                </p>
                <div className="mt-8 pt-8 border-t border-slate-800 w-full max-w-xs">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Incident ID</p>
                    <p className="font-mono text-slate-300 text-sm">ATTEMPT_ID_{attemptId}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-[50]">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 shadow-2xl transition-all duration-300 ${violations > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-900 animate-bounce'
                    : 'bg-white border-slate-100 text-slate-600'
                }`}>
                <div className={`w-2 h-2 rounded-full ${violations > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Proctoring Active</span>
                    <span className="text-xs font-bold leading-none">
                        {violations > 0 ? `${violations} Violations Tracked` : 'Monitoring Environment'}
                    </span>
                </div>
                {violations > 0 && <AlertTriangle className="w-4 h-4 text-amber-500 ml-1" />}
            </div>
        </div>
    );
}
