import { getAllModules } from "@/actions/modules";
import { ModuleToggleButton } from "@/components/settings/ModuleToggleButton";
import { 
    LayoutGrid, 
    Zap, 
    ShieldCheck, 
    Globe, 
    Wallet, 
    UserCheck, 
    BookOpen, 
    BrainCircuit,
    Settings2,
    Eye,
    EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { revalidatePath } from "next/cache";

export default async function ModuleManagerPage() {
    const modules = await getAllModules();

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                    <Settings2 className="w-3 h-3" />
                    System Governance
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
                    Module <span className="text-indigo-600">Governance</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg max-w-2xl">
                    Enable or disable entire ecosystem modules. Disabled modules are hidden from all user menus and restricted from access.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modules.map((mod) => (
                    <Card key={mod.key} className="border border-slate-100 shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden group hover:border-indigo-200 transition-all">
                        <CardContent className="p-8 flex items-center gap-6">
                            <div className={cn(
                                "p-5 rounded-2xl transition-all duration-500",
                                mod.isEnabled ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-100 text-slate-400"
                            )}>
                                <BrainCircuit className="w-8 h-8" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black text-slate-900 uppercase italic">{mod.name}</h3>
                                    <Badge className={cn(
                                        "font-black text-[9px] uppercase tracking-widest",
                                        mod.isEnabled ? "bg-emerald-500" : "bg-slate-200 text-slate-500"
                                    )}>
                                        {mod.isEnabled ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{mod.description}</p>
                            </div>
                            <ModuleToggleButton 
                                moduleKey={mod.key}
                                isEnabled={mod.isEnabled || false}
                            />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
