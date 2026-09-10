"use client";
import { useState, useEffect } from "react";

export function AtRiskList({ courseId }: { courseId?: number }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      try {
        const { getAtRiskStudents } = await import("@/actions/analytics");
        const res: any = await (getAtRiskStudents as any)(courseId);
        setData(res.data || []);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [courseId]);
  if (loading) return <div className="text-xs text-slate-400">Loading at-risk...</div>;
  if (data.length === 0) return <div className="text-xs text-slate-400">No at-risk students (time &lt;30% avg + grade F)</div>;
  return (
    <div className="space-y-2">
      {data.map((s: any) => (
        <div key={s.studentId} className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex justify-between items-center">
          <div><p className="text-sm font-bold text-rose-800">{s.name}</p><p className="text-xs text-rose-600">{s.matric} — time {s.timePct}% avg, grade {s.grade}</p></div>
          <span className="text-xs font-black bg-rose-600 text-white px-2 py-1 rounded-full">AT RISK</span>
        </div>
      ))}
    </div>
  );
}
