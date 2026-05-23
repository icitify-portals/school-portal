"use client";

import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

interface QuestionStats {
    id: number;
    text: string;
    difficulty: number; // P-value
    discrimination: number; // D-value
    totalAttempts: number;
    correctAttempts: number;
}

interface Props {
    questions: any[];
    attempts: any[];
    responses: any[];
}

export function PsychometricAnalytics({ questions, attempts, responses }: Props) {
    const stats = useMemo(() => {
        if (!attempts.length || !questions.length) return [];

        // 1. Sort attempts by total score to identify upper/lower groups
        const sortedAttempts = [...attempts].sort((a, b) => (b.score || 0) - (a.score || 0));
        const groupSize = Math.max(1, Math.floor(sortedAttempts.length * 0.27));
        const upperGroup = sortedAttempts.slice(groupSize === 0 ? 0 : 0, groupSize);
        const lowerGroup = sortedAttempts.slice(-groupSize);

        const upperIds = new Set(upperGroup.map(a => a.id));
        const lowerIds = new Set(lowerGroup.map(a => a.id));

        return questions.map(q => {
            const qResponses = responses.filter(r => r.questionId === q.id);
            const total = qResponses.length;
            const correct = qResponses.filter(r => r.isCorrect).length;

            // Difficulty (P)
            const P = total > 0 ? correct / total : 0;

            // Discrimination (D)
            const upperCorrect = qResponses.filter(r => upperIds.has(r.attemptId) && r.isCorrect).length;
            const lowerCorrect = qResponses.filter(r => lowerIds.has(r.attemptId) && r.isCorrect).length;

            const Pu = upperGroup.length > 0 ? upperCorrect / upperGroup.length : 0;
            const Pl = lowerGroup.length > 0 ? lowerCorrect / lowerGroup.length : 0;
            const D = Pu - Pl;

            return {
                id: q.id,
                text: q.questionText || q.text,
                difficulty: P,
                discrimination: D,
                totalAttempts: total,
                correctAttempts: correct
            };
        });
    }, [questions, attempts, responses]);

    const getDifficultyLabel = (P: number) => {
        if (P > 0.75) return { label: "Very Easy", color: "bg-emerald-100 text-emerald-700" };
        if (P > 0.60) return { label: "Easy", color: "bg-emerald-50 text-emerald-600" };
        if (P > 0.40) return { label: "Optimal", color: "bg-indigo-50 text-indigo-600" };
        if (P > 0.25) return { label: "Hard", color: "bg-amber-50 text-amber-600" };
        return { label: "Very Hard", color: "bg-red-50 text-red-600" };
    };

    const getDiscriminationLabel = (D: number) => {
        if (D >= 0.4) return { label: "Excellent", color: "text-emerald-600", icon: CheckCircle2 };
        if (D >= 0.3) return { label: "Good", color: "text-indigo-600", icon: TrendingUp };
        if (D >= 0.2) return { label: "Fair", color: "text-amber-600", icon: Info };
        return { label: "Poor / Review", color: "text-red-500", icon: AlertCircle };
    };

    return (
        <div className="space-y-8 p-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Difficulty Chart */}
                <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                            </div>
                            Difficulty Heatmap (P-Value)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="id" hide />
                                <YAxis domain={[0, 1]} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload?.[0]) {
                                            const data = payload[0].payload;
                                            const label = getDifficultyLabel(data.difficulty);
                                            return (
                                                <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 max-w-xs">
                                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Question {data.id}</p>
                                                    <p className="text-sm font-bold text-slate-900 mb-3 truncate">{data.text}</p>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <Badge variant="secondary" className={cn("rounded-lg", label.color)}>{label.label}</Badge>
                                                        <span className="text-xl font-black">{Math.round(data.difficulty * 100)}%</span>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="difficulty" radius={[8, 8, 0, 0]}>
                                    {stats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.difficulty > 0.75 ? '#10b981' : entry.difficulty < 0.25 ? '#ef4444' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 2. Discrimination Summary */}
                <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center">
                                <Info className="w-5 h-5 text-amber-600" />
                            </div>
                            Discrimination Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {stats.sort((a, b) => a.discrimination - b.discrimination).map(q => {
                                const dLabel = getDiscriminationLabel(q.discrimination);
                                const Icon = dLabel.icon;
                                return (
                                    <div key={q.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-4 flex-1 truncate">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-xs text-slate-400 shrink-0">
                                                Q{q.id}
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 truncate">{q.text}</p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            <div className="text-right">
                                                <p className={cn("text-[10px] font-black uppercase", dLabel.color)}>{dLabel.label}</p>
                                                <p className="text-xs font-black">D = {q.discrimination.toFixed(2)}</p>
                                            </div>
                                            <Icon className={cn("w-5 h-5", dLabel.color)} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
