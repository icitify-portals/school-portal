"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Template {
    id: number;
    name: string;
    description: string | null;
    applicationFee: string | number | null;
}

interface Props {
    templates: Template[];
}

export function ProgramSelectionModal({ templates }: Props) {
    const [isOpen, setIsOpen] = useState(templates.length > 0);
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const router = useRouter();

    const handleSelect = async (templateId: number) => {
        setLoadingId(templateId);
        try {
            const res = await fetch("/api/applicant/start-application", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId })
            });
            const data = await res.json();
            
            if (data.redirectUrl) {
                setIsOpen(false);
                router.push(data.redirectUrl);
            } else {
                toast.error("Failed to start application");
                setLoadingId(null);
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred. Please try again.");
            setLoadingId(null);
        }
    };

    if (templates.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent 
                className="sm:max-w-xl p-0 overflow-hidden border-none rounded-[2rem] bg-white" 
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/10" />
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-white tracking-tight mb-2">Select Programme</DialogTitle>
                        <DialogDescription className="text-slate-300 font-medium max-w-sm mx-auto">
                            Please select which application exercise you want to start.
                        </DialogDescription>
                    </div>
                </div>
                
                <div className="p-6 md:p-8 space-y-4 bg-slate-50">
                    {templates.map(template => {
                        const isND = template.name.toLowerCase().includes("nd") && !template.name.toLowerCase().includes("hnd");
                        const isHND = template.name.toLowerCase().includes("hnd") || template.name.toLowerCase().includes("higher");
                        
                        return (
                            <Button 
                                key={template.id}
                                variant="outline"
                                onClick={() => handleSelect(template.id)}
                                disabled={loadingId !== null}
                                className={`w-full h-auto p-6 flex items-center justify-between text-left hover:bg-white rounded-[1.5rem] transition-all border-2
                                    ${loadingId === template.id ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:border-indigo-300 hover:shadow-md"}
                                `}
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isHND ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                                            {isHND ? "HND" : isND ? "ND" : "APPLICATION"}
                                        </div>
                                    </div>
                                    <div className="text-lg font-black text-slate-900 tracking-tight leading-tight">{template.name}</div>
                                    <div className="text-sm font-medium text-slate-500 mt-1">
                                        {template.applicationFee ? `Application Fee: ?${parseFloat(template.applicationFee.toString()).toLocaleString()}` : "Free Application"}
                                    </div>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${loadingId === template.id ? "bg-indigo-600" : "bg-slate-100"}`}>
                                    {loadingId === template.id ? (
                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                            </Button>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
