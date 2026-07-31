"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export function ToggleableStatCard({ 
    name, 
    value, 
    desc, 
    color, 
    bg, 
    iconBgNode, 
    iconSmallNode 
}: {
    name: string;
    value: string;
    desc: string;
    color: string;
    bg: string;
    iconBgNode: React.ReactNode;
    iconSmallNode: React.ReactNode;
}) {
    const isSensitive = name === "Previous Payments" || name === "Wallet Balance";
    const [hidden, setHidden] = useState(isSensitive);

    return (
        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] hover:shadow-2xl transition-all relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform ${color}`}>
                {iconBgNode}
            </div>
            <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${bg} shadow-inner`}>
                            {iconSmallNode}
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{name}</span>
                    </div>
                    {isSensitive && (
                        <button 
                            onClick={() => setHidden(!hidden)}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10 relative cursor-pointer"
                        >
                            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    )}
                </div>
                <h3 className="text-3xl font-black text-slate-900 italic uppercase drop-shadow-sm">
                    {(isSensitive && hidden) ? "••••••" : value}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">{desc}</p>
            </CardContent>
        </Card>
    );
}
