"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Zap, ZapOff, Activity, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type DataSaverMode = 'off' | 'low' | 'extreme';

interface DataSaverToggleProps {
    mode: DataSaverMode;
    onChange: (mode: DataSaverMode) => void;
}

export default function DataSaverToggle({ mode, onChange }: DataSaverToggleProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={mode === 'off' ? "outline" : "default"}
                    size="icon"
                    className={cn(
                        "rounded-full shadow-lg h-12 w-12 bg-white/90 backdrop-blur text-slate-700 hover:bg-slate-100 border-slate-200 transition-all",
                        mode === 'low' && "bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200",
                        mode === 'extreme' && "bg-red-100 border-red-300 text-red-700 hover:bg-red-200"
                    )}
                    title="Data Saver Settings"
                >
                    {mode === 'off' && <ZapOff className="h-5 w-5" />}
                    {mode === 'low' && <Zap className="h-5 w-5" />}
                    {mode === 'extreme' && <Activity className="h-5 w-5" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent side="left" className="w-64 p-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border-slate-200">
                <div className="space-y-3">
                    <div className="flex flex-col gap-1 mb-2">
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                            <ShieldCheck className="h-4 w-4 text-indigo-600" />
                            Bandwidth Optimization
                        </h4>
                        <p className="text-xs text-slate-500">Choose a mode to conserve your internet data.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <Button
                            variant={mode === 'off' ? 'default' : 'ghost'}
                            size="sm"
                            className="justify-start gap-3 h-10 rounded-xl"
                            onClick={() => onChange('off')}
                        >
                            <ZapOff className="h-4 w-4" />
                            <div className="text-left">
                                <div className="text-xs font-medium">Standard</div>
                                <div className="text-[10px] opacity-70">Best quality (up to 540p)</div>
                            </div>
                        </Button>

                        <Button
                            variant={mode === 'low' ? 'default' : 'ghost'}
                            size="sm"
                            className={cn(
                                "justify-start gap-3 h-10 rounded-xl",
                                mode === 'low' ? "bg-amber-600 hover:bg-amber-700" : "hover:bg-amber-50"
                            )}
                            onClick={() => onChange('low')}
                        >
                            <Zap className="h-4 w-4" />
                            <div className="text-left">
                                <div className="text-xs font-medium">Data Saver</div>
                                <div className="text-[10px] opacity-70">Low resolution (180p)</div>
                            </div>
                        </Button>

                        <Button
                            variant={mode === 'extreme' ? 'default' : 'ghost'}
                            size="sm"
                            className={cn(
                                "justify-start gap-3 h-10 rounded-xl",
                                mode === 'extreme' ? "bg-red-600 hover:bg-red-700" : "hover:bg-red-50"
                            )}
                            onClick={() => onChange('extreme')}
                        >
                            <Activity className="h-4 w-4" />
                            <div className="text-left">
                                <div className="text-xs font-medium">Extreme Saver</div>
                                <div className="text-[10px] opacity-70">Audio only (No incoming video)</div>
                            </div>
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
