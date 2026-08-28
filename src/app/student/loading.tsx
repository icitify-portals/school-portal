import { Loader2 } from "lucide-react";

export default function StudentLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500 tracking-wide">Loading student portal...</p>
      </div>
    </div>
  );
}
