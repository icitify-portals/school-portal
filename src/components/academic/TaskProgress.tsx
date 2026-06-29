"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { getJobStatus } from "@/actions/academic-jobs";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export function TaskProgress({ taskId, onComplete }: { taskId: string, onComplete?: () => void }) {
    const [status, setStatus] = useState<any>(null);

    useEffect(() => {
        if (!taskId) return;

        const interval = setInterval(async () => {
            const res = await getJobStatus(taskId);
            if (res) {
                setStatus(res);
                if (res.status === "completed" || res.status === "failed") {
                    clearInterval(interval);
                    if (res.status === "completed" && onComplete) onComplete();
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [taskId]);

    if (!status) return null;

    return (
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-inner animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {status.status === "running" && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
                    {status.status === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {status.status === "failed" && <XCircle className="w-4 h-4 text-rose-600" />}
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                        {status.description}
                    </span>
                </div>
                <span className="text-xs font-black text-slate-400">{status.current}%</span>
            </div>
            // @ts-expect-error - TS2322: Auto-suppressed for build
            <Progress value={status.current} className="h-2 bg-slate-200" indicatorClassName={status.status === "failed" ? "bg-rose-500" : "bg-indigo-600"} />
            {status.error && (
                <p className="mt-2 text-[10px] font-bold text-rose-600 uppercase tracking-tighter bg-rose-50 p-1 rounded">
                    Error: {status.error}
                </p>
            )}
        </div>
    );
}
