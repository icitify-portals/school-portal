"use client";
import { useState, useEffect } from "react";

export function CAWeightValidator({ courseId, sessionId }: { courseId: number; sessionId: number }) {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { getGradingConfigurations } = await import("@/actions/course-gradebook");
        // @ts-ignore
        const res = await (getGradingConfigurations as any)(courseId, sessionId);
        const configs = res.data || res || [];
        const sum = configs.reduce((a: number, c: any) => a + (Number(c.weight) || 0), 0);
        setTotal(sum);
      } catch {
        setTotal(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId, sessionId]);

  if (loading) return <div className="text-xs text-slate-400">Checking CA weights...</div>;
  if (total === null) return null;
  const isValid = Math.abs(total - 100) <= 1;
  // Simple pie via conic-gradient
  const pieStyle = { background: `conic-gradient(#6366f1 0% ${Math.min(total,100)}%, #e2e8f0 ${Math.min(total,100)}% 100%)` } as any;
  return (
    <div className={`p-4 rounded-xl border ${isValid ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"} flex items-center gap-4`}>
      <div className="w-12 h-12 rounded-full border-2 border-white shadow-inner" style={pieStyle} />
      <div>
        <p className={`text-xs font-black uppercase tracking-wider ${isValid ? "text-emerald-700" : "text-rose-700"}`}>
          CA Weights: {total}% {isValid ? "✓ Valid (100% ±1%)" : "✗ Must sum to 100%"}
        </p>
        <p className="text-[11px] text-slate-500">Assignment 30% + Quiz 20% + Exam 50% = 100% — {isValid ? "Publish enabled" : "Publish blocked until 100%"}</p>
      </div>
    </div>
  );
}
