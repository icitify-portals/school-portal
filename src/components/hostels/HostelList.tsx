"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Home, Users, Settings, Plus, Building2,
    ArrowRight, CheckCircle2, XCircle, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HostelListProps {
    hostels: any[];
    onViewStructure: (id: number) => void;
    onViewApplications: (id: number) => void;
    onViewSettings: (id: number) => void;
}

export default function HostelList({
    hostels,
    onViewStructure,
    onViewApplications,
    onViewSettings
}: HostelListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostels.map((h) => (
                <Card key={h.id} className="relative overflow-hidden border-none shadow-xl bg-white group transition-all duration-500 hover:-translate-y-2">
                    {/* Header with Background Pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 -mr-16 -mt-16 rounded-full transition-all duration-700 group-hover:scale-150" />

                    <div className="p-6 relative space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                <Home className="w-6 h-6 text-indigo-600" />
                            </div>
                            <Badge variant={h.isActive ? "success" : "secondary"} className="rounded-lg font-black uppercase tracking-widest text-[10px]">
                                {h.isActive ? "Active Hall" : "Inactive"}
                            </Badge>
                        </div>

                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                                {h.name}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                                CODE: {h.code}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" /> Blocks
                                </p>
                                <p className="text-lg font-black text-slate-900">{h.roomCount || 0} Rooms</p>
                            </div>
                            <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> Occupancy
                                </p>
                                <p className="text-lg font-black text-indigo-900">
                                    {h.occupiedCount || 0} / {h.capacity || 0}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Availability</span>
                                <span>{Math.round(((h.capacity - h.occupiedCount) / h.capacity) * 100) || 0}% Free</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-1000"
                                    style={{ width: `${(h.occupiedCount / h.capacity) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => onViewApplications(h.id)}
                                className="rounded-xl h-11 text-[10px] font-black uppercase tracking-widest gap-2 bg-white hover:bg-indigo-50 border-slate-200"
                            >
                                <Users className="w-3.5 h-3.5" />
                                Applications
                            </Button>
                            <Button
                                onClick={() => onViewStructure(h.id)}
                                className="rounded-xl h-11 text-[10px] font-black uppercase tracking-widest gap-2 bg-slate-900 hover:bg-black shadow-lg"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                Manage
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}

            <button className="h-full min-h-[300px] border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group hover:border-indigo-200 transition-all duration-500 hover:bg-indigo-50/30">
                <div className="w-16 h-16 bg-white rounded-3xl shadow-lg border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Inaugurate Hall</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Add new hostel to registry</p>
                </div>
            </button>
        </div>
    );
}
