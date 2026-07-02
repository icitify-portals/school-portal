import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getIDCardSettings, updateIDCardSettings } from "@/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Calendar, Users, AlertTriangle, Power } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function HRIDCardSettingsPage() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'admin') {
        redirect("/login");
    }

    const settings = await getIDCardSettings();

    async function handleToggle(key: 'enabled' | 'studentWindow' | 'staffWindow') {
        "use server";
        const current = await getIDCardSettings();
        const updated: { enabled: boolean; studentWindow: 'open' | 'closed'; staffWindow: 'open' | 'closed' } = { ...(current as any) };

        if (key === 'enabled') updated.enabled = !current.enabled;
        if (key === 'studentWindow') updated.studentWindow = current.studentWindow === 'open' ? 'closed' : 'open';
        if (key === 'staffWindow') updated.staffWindow = current.staffWindow === 'open' ? 'closed' : 'open';

        await updateIDCardSettings(updated);
    }

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-650/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <ShieldCheck className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Issuance Governance
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Human Resources control panel for institutional identity credentials
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
            {/* Global Kill Switch */}
            <Card className={`border border-white/40 shadow-xl rounded-[3rem] overflow-hidden transition-all ${settings.enabled ? 'bg-indigo-650 text-white' : 'bg-white/60 backdrop-blur-3xl'}`}>
                <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-md ${settings.enabled ? 'bg-white/20' : 'bg-slate-200/50 text-slate-400'}`}>
                            <Power className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-black uppercase italic tracking-tight ${settings.enabled ? 'text-white' : 'text-slate-900'}`}>
                                System Status: {settings.enabled ? 'Active' : 'Offline'}
                            </h2>
                            <p className={`text-sm font-bold mt-1 ${settings.enabled ? 'text-white/70' : 'text-slate-500'}`}>
                                {settings.enabled ? 'All ID Card services are operational across the portal.' : 'ID Card generation and management are globally disabled.'}
                            </p>
                        </div>
                    </div>
                    <form action={handleToggle.bind(null, 'enabled')}>
                        <Button className={`rounded-xl font-black uppercase text-xs tracking-widest px-8 h-12 active:scale-95 transition-all shadow-md ${settings.enabled ? 'bg-white text-indigo-600 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                            {settings.enabled ? 'Disable System' : 'Enable System'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Student Window */}
                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-white/40 bg-white/40">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-6 h-6 text-indigo-500" />
                            <CardTitle className="text-lg font-black uppercase italic tracking-tight">Student Window</CardTitle>
                        </div>
                        <CardDescription className="text-slate-500 font-bold uppercase tracking-wider text-xs">Open for new sessions or registration cycles.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex flex-col items-center p-6 bg-white/45 border border-white/60 rounded-[2rem] text-center shadow-inner">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${settings.studentWindow === 'open' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                Current Status
                            </span>
                            <h3 className={`text-3xl font-black uppercase italic tracking-tight ${settings.studentWindow === 'open' ? 'text-emerald-600' : 'text-slate-350'}`}>
                                {settings.studentWindow}
                            </h3>
                        </div>
                        <form action={handleToggle.bind(null, 'studentWindow')}>
                            <Button className={`w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-sm ${settings.studentWindow === 'open' ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-indigo-650 text-white hover:bg-indigo-700'}`}>
                                {settings.studentWindow === 'open' ? 'Close Window' : 'Open for Students'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Staff Window */}
                <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-white/40 bg-white/40">
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6 text-indigo-500" />
                            <CardTitle className="text-lg font-black uppercase italic tracking-tight">Staff Window</CardTitle>
                        </div>
                        <CardDescription className="text-slate-500 font-bold uppercase tracking-wider text-xs">Open during promotion or recruitment cycles.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex flex-col items-center p-6 bg-white/45 border border-white/60 rounded-[2rem] text-center shadow-inner">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${settings.staffWindow === 'open' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                Current Status
                            </span>
                            <h3 className={`text-3xl font-black uppercase italic tracking-tight ${settings.staffWindow === 'open' ? 'text-emerald-600' : 'text-slate-350'}`}>
                                {settings.staffWindow}
                            </h3>
                        </div>
                        <form action={handleToggle.bind(null, 'staffWindow')}>
                            <Button className={`w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-sm ${settings.staffWindow === 'open' ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                                {settings.staffWindow === 'open' ? 'Close Window' : 'Open for Staff'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div className="flex gap-4 p-6 bg-amber-50/50 rounded-[2rem] border border-amber-200 shadow-sm">
                <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                <div>
                    <p className="text-xs font-black text-amber-900 uppercase tracking-widest leading-none mb-1">Human Resources Policy</p>
                    <p className="text-sm text-amber-700 font-bold leading-relaxed">
                        Issuance windows should only be opened during official administrative periods. When windows are closed, users will still retain a read-only view of their credentials but will be unable to generate or download documents.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
