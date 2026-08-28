import { Loader2 } from "lucide-react";

export default function AdminDashboardLoading() {
  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-[1600px] w-full mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-slate-100 rounded animate-pulse" />
        </div>
        
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
        
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      </div>
    </div>
  );
}
