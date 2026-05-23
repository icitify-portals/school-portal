"use client";

import { useState, useEffect } from "react";
import { 
    Sparkles, 
    Lightbulb, 
    ArrowRight, 
    BookOpen, 
    TrendingUp, 
    BrainCircuit,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPersonalizedRecommendations } from "@/actions/students";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AIRecommendations() {
    const [data, setData] = useState<{ recommendations: any[], coachingNote?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const res = await getPersonalizedRecommendations();
            if (res.success && res.recommendations) {
                setData({
                    recommendations: res.recommendations,
                    coachingNote: res.coachingNote
                });
            }
            setIsLoading(false);
        }
        load();
    }, []);

    if (isLoading) {
        return (
            <Card className="border-none shadow-xl bg-indigo-50/50 animate-pulse h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </Card>
        );
    }

    if (!data || data.recommendations.length === 0) return null;

    return (
        <Card className="border-none shadow-2xl shadow-indigo-500/10 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-16 -mb-16 blur-2xl" />
                
                <div className="flex items-center justify-between relative">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <BrainCircuit className="w-8 h-8" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tight">SmartPath</CardTitle>
                            <Badge className="bg-emerald-400 text-emerald-950 border-none font-black uppercase text-[10px] tracking-widest mt-1">AI Personalization</Badge>
                        </div>
                    </div>
                    <TrendingUp className="w-12 h-12 text-white/20" />
                </div>

                {data.coachingNote && (
                    <div className="mt-8 p-6 bg-white/10 rounded-[1.5rem] border border-white/10 backdrop-blur-sm relative">
                        <Sparkles className="w-5 h-5 text-amber-300 absolute -top-2 -right-2 animate-pulse" />
                        <p className="text-sm font-bold italic leading-relaxed opacity-90">
                            "{data.coachingNote}"
                        </p>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recommended for your mastery</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.recommendations.map((rec) => (
                        <Link key={rec.id} href={`/student/courses/${rec.courseId}/lessons/${rec.id}`}>
                            <div className="group p-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50/30 hover:border-indigo-600 hover:bg-white hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                        {rec.title}
                                    </h4>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-indigo-600/60">{rec.reason}</span>
                                    <ArrowRight className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <Button variant="ghost" className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-indigo-600">
                    See Full Learning Roadmap
                </Button>
            </CardContent>
        </Card>
    );
}
