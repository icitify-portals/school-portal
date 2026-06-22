"use client";

import { useState, useEffect } from "react";
import { 
    TreeDeciduous, 
    Leaf, 
    Zap, 
    Star, 
    ChevronRight,
    Trophy,
    BookOpen,
    CircleDashed,
    CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Branch {
    id: string;
    subject: string;
    mastery: number; // 0-100
    topics: { title: string, completed: boolean }[];
}

const mockBranches: Branch[] = [
    { 
        id: "1", 
        subject: "Mathematics", 
        mastery: 85,
        topics: [
            { title: "Calculus Basics", completed: true },
            { title: "Trigonometry", completed: true },
            { title: "Complex Numbers", completed: false }
        ]
    },
    { 
        id: "2", 
        subject: "Physics", 
        mastery: 45,
        topics: [
            { title: "Newtonian Mechanics", completed: true },
            { title: "Thermodynamics", completed: false },
            { title: "Electromagnetism", completed: false }
        ]
    },
    { 
        id: "3", 
        subject: "English Language", 
        mastery: 95,
        topics: [
            { title: "Grammar & Syntax", completed: true },
            { title: "Literary Analysis", completed: true },
            { title: "Creative Writing", completed: true }
        ]
    },
];

export function KnowledgeTree() {
    const [activeBranch, setActiveBranch] = useState<Branch | null>(mockBranches[0]);

    return (
        <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[3rem] overflow-hidden bg-white h-[600px] flex flex-col">
            <CardHeader className="bg-slate-900 p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                            <TreeDeciduous className="w-8 h-8" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tight italic">Knowledge <span className="text-emerald-400">Forest</span></CardTitle>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Visualizing Academic Mastery</p>
                        </div>
                    </div>
                    <Badge className="bg-emerald-500 text-emerald-950 border-none font-black px-4 py-2 rounded-xl">
                        {mockBranches.reduce((acc, b) => acc + b.mastery, 0) / mockBranches.length}% Total Bloom
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col md:flex-row overflow-hidden">
                {/* Branches List */}
                <div className="w-full md:w-80 border-r border-slate-50 overflow-y-auto p-6 space-y-4">
                    {mockBranches.map((branch) => (
                        <div 
                            key={branch.id}
                            onClick={() => setActiveBranch(branch)}
                            className={cn(
                                "p-6 rounded-2xl border-2 transition-all cursor-pointer group",
                                activeBranch?.id === branch.id 
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200" 
                                    : "bg-slate-50 border-transparent hover:border-slate-200"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <Leaf className={cn("w-6 h-6", activeBranch?.id === branch.id ? "text-emerald-300" : "text-emerald-500")} />
                                <span className="text-xs font-black">{branch.mastery}%</span>
                            </div>
                            <h4 className="font-black text-lg leading-tight uppercase tracking-tight">{branch.subject}</h4>
                            <div className="mt-4 w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                                <div 
                                    className={cn("h-full transition-all duration-1000", activeBranch?.id === branch.id ? "bg-white" : "bg-indigo-600")}
                                    style={{ width: `${branch.mastery}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Branch Visualization */}
                <div className="flex-1 bg-slate-50/30 p-12 relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                        <TreeDeciduous className="w-[500px] h-[500px]" />
                    </div>

                    {activeBranch && (
                        <div className="relative z-10 w-full max-w-lg space-y-12">
                            <div className="text-center space-y-4">
                                <Badge className="bg-white text-indigo-600 shadow-sm border-none px-6 py-2 rounded-full font-black uppercase text-xs tracking-widest animate-bounce">
                                    Current Focus
                                </Badge>
                                <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">{activeBranch.subject}</h3>
                            </div>

                            <div className="space-y-6">
                                {activeBranch.topics.map((topic, idx) => (
                                    <div 
                                        key={idx}
                                        className={cn(
                                            "flex items-center gap-6 p-6 rounded-[2.5rem] bg-white border-2 transition-all group",
                                            topic.completed ? "border-emerald-100 shadow-lg shadow-emerald-500/5" : "border-slate-100 opacity-60 grayscale"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                            topic.completed ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                                        )}>
                                            {topic.completed ? <CheckCircle2 className="w-6 h-6" /> : <CircleDashed className="w-6 h-6 animate-spin-slow" />}
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{topic.title}</h5>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {topic.completed ? "Topic Mastered" : "In Progress"}
                                            </p>
                                        </div>
                                        {topic.completed && <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />}
                                    </div>
                                ))}
                            </div>

                            {activeBranch.mastery === 100 && (
                                <div className="p-8 bg-amber-50 rounded-2xl border-2 border-amber-200 text-center space-y-4 animate-in zoom-in duration-500">
                                    <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
                                    <h4 className="text-xl font-black text-amber-900 uppercase tracking-tighter">Perfect Bloom!</h4>
                                    <p className="text-xs font-medium text-amber-700">You have achieved full sessional mastery in {activeBranch.subject}. Legendary status unlocked!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
