"use client";
import { useState, useEffect } from "react";

interface QueuedItem {
  id: string;
  courseId: number;
  lessonId: number;
  fileName: string;
  status: "queued" | "syncing" | "failed";
}

export function OfflineQueue({ courseId }: { courseId: number }) {
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    // Load from IndexedDB (mock via localStorage for now)
    const stored = localStorage.getItem(`offline-queue-${courseId}`);
    if (stored) setQueue(JSON.parse(stored));
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [courseId]);

  const syncNow = async () => {
    if (queue.length === 0) return;
    setQueue(q => q.map(i => ({ ...i, status: "syncing" as const })));
    // Simulate POST to /api/assignments/submit for each
    for (const item of queue) {
      await new Promise(r => setTimeout(r, 500));
    }
    setQueue([]);
    localStorage.removeItem(`offline-queue-${courseId}`);
  };

  if (queue.length === 0 && isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 min-w-[280px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-600">Offline Queue</span>
        <span className={`text-xs px-2 py-1 rounded-full font-bold ${isOnline ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{isOnline ? "Online" : "Offline"}</span>
      </div>
      <p className="text-xs text-slate-500">{queue.length} assignment{queue.length !== 1 ? "s" : ""} queued</p>
      <div className="mt-2 space-y-1">
        {queue.map(item => (
          <div key={item.id} className="text-xs bg-slate-50 rounded-lg px-2 py-1 flex justify-between">
            <span>{item.fileName}</span>
            <span className={`font-bold ${item.status === "queued" ? "text-amber-600" : item.status === "syncing" ? "text-blue-600" : "text-rose-600"}`}>{item.status}</span>
          </div>
        ))}
      </div>
      <button onClick={syncNow} disabled={queue.length === 0 || !isOnline} className="mt-3 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50">Sync Now</button>
    </div>
  );
}
