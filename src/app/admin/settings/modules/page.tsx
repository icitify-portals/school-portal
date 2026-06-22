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
import { cn } from "@/lib/utils";

export default async function ModuleManagerPage() {
    const modules = await getAllModules();

    return (
        <div className="p-5 md:p-6 max-w-[1600px] w-full mx-auto space-y-6 animate-in fade-in duration-700">
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                    <Settings2 className="w-3 h-3" />
                    System Governance
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                    Module <span className="text-indigo-600">Governance</span>
                </h1>
                <p className="text-slate-500 font-medium text-sm md:text-base max-w-3xl">
                    Enable or disable entire ecosystem modules. Disabled modules are hidden from all user menus and restricted from access.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {modules.map((mod) => (
                    <Card key={mod.key} className="border border-slate-100 shadow-sm hover:shadow-md rounded-2xl overflow-hidden group hover:border-indigo-200 transition-all">
                        <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-3 rounded-xl transition-all duration-500 shrink-0",
                                    mod.isEnabled ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-slate-100 text-slate-400"
                                )}>
                                    <BrainCircuit className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h3 className="text-base font-black text-slate-900 uppercase italic truncate">{mod.name}</h3>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{mod.description}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                <Badge className={cn(
                                    "font-bold text-[9px] uppercase tracking-widest",
                                    mod.isEnabled ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                                )}>
                                    {mod.isEnabled ? "Active" : "Inactive"}
                                </Badge>
                                <ModuleToggleButton 
                                    moduleKey={mod.key}
                                    isEnabled={mod.isEnabled || false}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

