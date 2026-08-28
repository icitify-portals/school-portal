import { Loader2 } from "lucide-react";

export default function RegistrarLoading() {
  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-[1600px] w-full mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-72 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-80 bg-slate-100 rounded animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        
        <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      </div>
    </div>
  );
}
