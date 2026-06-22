import { ITSSyncDashboard } from "@/components/ai/ITSSyncDashboard";
import { 
    CloudOff, 
    Wifi, 
    HardDrive, 
    Zap,
    ShieldCheck,
    Info
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ITSSyncPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10">
            {/* Header */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                    <CloudOff className="w-3 h-3" />
                    Institutional Continuity
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
                    Offline <span className="text-indigo-600">Resilience</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg max-w-xl">
                    Ensure your classroom TVs and Projectors have the necessary curriculum data to function without internet connectivity.
                </p>
            </div>

            {/* Critical Info Alert */}
            <Alert className="bg-indigo-600 text-white border-none rounded-2xl p-8 shadow-2xl shadow-indigo-500/30 overflow-hidden relative">
                <Zap className="w-40 h-40 absolute -right-10 -bottom-10 text-white/10 rotate-12" />
                <div className="flex gap-6 relative z-10">
                    <div className="p-4 bg-white/20 rounded-2xl shrink-0">
                        <Info className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                        <AlertTitle className="text-xl font-black uppercase italic tracking-tight">Sync Recommendation</AlertTitle>
                        <AlertDescription className="text-indigo-100 font-medium leading-relaxed max-w-2xl">
                            We recommend performing a full batch sync every Monday morning to preload all scheduled lessons for the week. This ensures zero downtime during lecture delivery regardless of ISP performance.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            {/* Dashboard */}
            <ITSSyncDashboard />

            {/* Multi-Device Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        Network Protocols
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        The ITS uses a <span className="font-bold text-slate-900">Cache-First</span> strategy. It will always attempt to serve lessons from local storage before hitting the network, reducing latency to near-zero.
                    </p>
                </div>
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Data Integrity
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        All synced assets are verified using SHA-256 checksums to ensure curriculum content has not been corrupted during high-latency downloads.
                    </p>
                </div>
            </div>
        </div>
    );
}
