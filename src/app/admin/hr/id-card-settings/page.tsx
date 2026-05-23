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
        <div className="p-8 max-w-4xl mx-auto space-y-8 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">Issuance Governance</h1>
                    <p className="text-slate-500 font-medium tracking-tight">Human Resources control panel for institutional identity credentials.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Global Kill Switch */}
                <Card className={`border-none shadow-xl rounded-[32px] overflow-hidden transition-all ${settings.enabled ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                    <CardContent className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${settings.enabled ? 'bg-white/20' : 'bg-slate-100'}`}>
                                <Power className={`w-8 h-8 ${settings.enabled ? 'text-white' : 'text-slate-400'}`} />
                            </div>
                            <div>
                                <h2 className={`text-2xl font-black uppercase italic tracking-tight ${settings.enabled ? 'text-white' : 'text-slate-900'}`}>
                                    System Status: {settings.enabled ? 'Active' : 'Offline'}
                                </h2>
                                <p className={`text-sm font-bold ${settings.enabled ? 'text-white/60' : 'text-slate-400'}`}>
                                    {settings.enabled ? 'All ID Card services are operational across the portal.' : 'ID Card generation and management are globally disabled.'}
                                </p>
                            </div>
                        </div>
                        <form action={handleToggle.bind(null, 'enabled')}>
                            <Button className={`rounded-xl font-black uppercase text-xs tracking-widest px-8 h-12 ${settings.enabled ? 'bg-white text-indigo-600 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                                {settings.enabled ? 'Disable System' : 'Enable System'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Student Window */}
                    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                <CardTitle className="text-lg font-black uppercase italic tracking-tight">Student Window</CardTitle>
                            </div>
                            <CardDescription>Open for new sessions or registration cycles.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl text-center">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${settings.studentWindow === 'open' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    Current Status
                                </span>
                                <h3 className={`text-3xl font-black uppercase italic tracking-tight ${settings.studentWindow === 'open' ? 'text-slate-900' : 'text-slate-300'}`}>
                                    {settings.studentWindow.toUpperCase()}
                                </h3>
                            </div>
                            <form action={handleToggle.bind(null, 'studentWindow')}>
                                <Button className={`w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest ${settings.studentWindow === 'open' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                    {settings.studentWindow === 'open' ? 'Close Window' : 'Open for Students'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Staff Window */}
                    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="w-5 h-5 text-slate-900" />
                                <CardTitle className="text-lg font-black uppercase italic tracking-tight">Staff Window</CardTitle>
                            </div>
                            <CardDescription>Open during promotion or recruitment cycles.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl text-center">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${settings.staffWindow === 'open' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    Current Status
                                </span>
                                <h3 className={`text-3xl font-black uppercase italic tracking-tight ${settings.staffWindow === 'open' ? 'text-slate-900' : 'text-slate-300'}`}>
                                    {settings.staffWindow.toUpperCase()}
                                </h3>
                            </div>
                            <form action={handleToggle.bind(null, 'staffWindow')}>
                                <Button className={`w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest ${settings.staffWindow === 'open' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                                    {settings.staffWindow === 'open' ? 'Close Window' : 'Open for Staff'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex gap-4 p-6 bg-amber-50 rounded-[24px] border border-amber-100">
                    <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                    <div>
                        <p className="text-xs font-black text-amber-900 uppercase tracking-widest leading-none mb-1">Human Resources Policy</p>
                        <p className="text-sm text-amber-700 font-medium">
                            Issuance windows should only be opened during official administrative periods. When windows are closed, users will still retain a read-only view of their credentials but will be unable to generate or download documents.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
