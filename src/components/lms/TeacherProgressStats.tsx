"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
    BookOpen, 
    Users, 
    CheckCircle2, 
    ArrowRight, 
    LayoutDashboard,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProgressItem {
    id: string;
    type: 'class' | 'subject';
    title: string;
    subtitle: string;
    percentage: number;
    total: number;
    link: string;
}

interface Props {
    items: ProgressItem[];
}

export default function TeacherProgressStats({ items }: Props) {
    if (!items || items.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-slate-50/50">
                <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <LayoutDashboard className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No Assignments Found</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">
                        You haven't been assigned as a Class Teacher or Subject Teacher for this session yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
                <Card key={`${item.type}-${item.id}`} className="group hover:shadow-xl transition-all duration-300 border-none shadow-sm relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className={cn(
                        "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 group-hover:scale-110 transition-transform duration-700",
                        item.type === 'class' ? "bg-indigo-600" : "bg-emerald-600"
                    )} />

                    <CardHeader className="pb-2 relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <div className={cn(
                                "p-3 rounded-xl",
                                item.type === 'class' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                            )}>
                                {item.type === 'class' ? <Users className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {item.type === 'class' ? 'Class Teacher' : 'Subject Teacher'}
                                </span>
                                <p className="text-2xl font-black text-slate-900">{item.percentage}%</p>
                            </div>
                        </div>
                        <CardTitle className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {item.title}
                        </CardTitle>
                        <p className="text-sm font-medium text-slate-500">{item.subtitle}</p>
                    </CardHeader>
                    
                    <CardContent className="relative z-10">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <span>Progress</span>
                                    <span>{item.total} Students</span>
                                </div>
                                <Progress 
                                    value={item.percentage} 
                                    className="h-2 rounded-full bg-slate-100" 
                                    indicatorcolor={cn(
                                        item.percentage === 100 ? "bg-emerald-500" : item.type === 'class' ? "bg-indigo-600" : "bg-emerald-600"
                                    )}
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                {item.percentage === 100 ? (
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 w-full font-bold text-sm">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Task Completed
                                    </div>
                                ) : (
                                    <Link href={item.link} className="w-full">
                                        <Button className={cn(
                                            "w-full gap-2 rounded-xl h-11 font-bold shadow-lg transition-all",
                                            item.type === 'class' 
                                                ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20" 
                                                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                        )}>
                                            {item.percentage > 0 ? "Continue Entry" : "Start Record Entry"}
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
