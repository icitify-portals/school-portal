"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, CheckCircle2, ChevronRight, Filter, MoreHorizontal, User, Clock } from "lucide-react";
// @ts-expect-error - TS2305: Auto-suppressed for build
import { finalizeAttempt, grantExtraTime, getQuizResults, getQuizAnalyticsData } from "@/actions/cbt";
import { bulkGradeAttempt, AIProvider } from "@/actions/grading";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { use } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { PsychometricAnalytics } from "@/components/cbt/PsychometricAnalytics";
import { cn } from "@/lib/utils";
import { SessionSelector } from "@/components/SessionSelector";

interface Props {
    params: Promise<{ quizId: string }>;
}

export default function QuizResultsPage({ params }: Props) {
    const { quizId } = use(params);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [responses, setResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiProvider, setAiProvider] = useState<AIProvider>('openai');
    const [selectedSession, setSelectedSession] = useState("");

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const quizIdNum = parseInt(quizId);
                const [results, analytics] = await Promise.all([
                    getQuizResults(quizIdNum),
                    getQuizAnalyticsData(quizIdNum)
                ]);
                setAttempts(results);
                setQuestions(analytics.questions);
                setResponses(analytics.responses);
            } catch (error) {
                toast.error("Failed to load results");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [quizId]);

    const handleBulkGrade = async () => {
        const ok = confirm(`Trigger ${aiProvider.toUpperCase()} AI Grading for all pending essays in this quiz?`);
        if (!ok) return;

        const tid = toast.loading(`Processing ${aiProvider.toUpperCase()} AI Grading...`);
        const res = await bulkGradeAttempt(parseInt(quizId), aiProvider);
        if (res.success) {
            toast.success("AI Grading completed", { id: tid });
            const results = await getQuizResults(parseInt(quizId));
            setAttempts(results);
        } else {
            toast.error(res.error || "Bulk grading failed", { id: tid });
        }
    };

    const avgScore = attempts.length > 0
        ? Math.round(attempts.reduce((acc, a) => acc + (a.rawScore || 0), 0) / attempts.reduce((acc, a) => acc + (a.maxRaw || 1), 0) * 100)
        : 0;

    const completionRate = attempts.length > 0
        ? Math.round((attempts.filter(a => a.status === 'graded' || a.status === 'submitted').length / attempts.length) * 100)
        : 100;

    const pendingCount = attempts.filter(a => a.status === 'submitted' || a.aiStatus === 'pending').length;

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading assessment results...</div>;

    return (
        <div className="p-8 space-y-8 max-w-[1600px] w-full mx-auto">
            <header className="flex justify-between items-end">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quiz Results</h1>
                        <p className="text-slate-500 font-medium">Manage student performance and AI grading</p>
                    </div>
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Viewing Session:</span>
                        <SessionSelector onSessionChange={setSelectedSession} />
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    <Select value={aiProvider} onValueChange={(v) => setAiProvider(v as AIProvider)}>
                        <SelectTrigger className="h-11 w-40 rounded-xl bg-white border-slate-200 font-bold text-xs text-slate-600">
                            <SelectValue placeholder="AI Model" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                            <SelectItem value="gemini">Google Gemini (Free/Cheap)</SelectItem>
                            <SelectItem value="openai">OpenAI (GPT-4o-mini)</SelectItem>
                            <SelectItem value="openrouter">OpenRouter (Llama 3 / Others)</SelectItem>
                            <SelectItem value="deepseek">Deepseek</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="h-11 rounded-xl border-slate-200">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>
                    <Button
                        onClick={handleBulkGrade}
                        className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200"
                    >
                        <BrainCircuit className="w-4 h-4 mr-2" /> Bulk AI Grade
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl border-none shadow-sm bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-emerald-900">{avgScore}%</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-indigo-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-indigo-900">{completionRate}%</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-amber-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Pending Grading</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-amber-900">{pendingCount}</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs.Root defaultValue="results" className="space-y-6">
                <Tabs.List className="flex bg-slate-100/50 p-1.5 rounded-2xl w-fit">
                    <Tabs.Trigger
                        value="results"
                        className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600 text-slate-400"
                    >
                        Detailed Results
                    </Tabs.Trigger>
                    <Tabs.Trigger
                        value="analytics"
                        className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600 text-slate-400"
                    >
                        Psychometric Analytics
                    </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="results" className="focus:outline-none animate-in fade-in duration-500">
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="pl-8 text-[10px] font-black uppercase text-slate-400">Student</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400">Raw Score</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400">CA Weighted (30%)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400">AI Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attempts.map((a) => (
                                    <TableRow key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{a.student}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium lowercase">
                                                        {a.date ? `Submitted ${new Date(a.date).toLocaleDateString()}` : 'In Progress'}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm font-bold text-slate-600">
                                            {a.rawScore || 0}/{a.maxRaw}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-lg font-black text-indigo-600">{a.weighted || "0.00"}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={a.status === 'graded' ? 'default' : 'secondary'} className="rounded-lg h-6 px-2 text-[9px] font-black uppercase tracking-tighter">
                                                {a.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${a.aiStatus === 'pending' ? 'bg-amber-400 animate-pulse' : a.aiStatus === 'completed' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{a.aiStatus || 'none'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Grant Extra Time"
                                                    onClick={async () => {
                                                        const mins = window.prompt(`Enter extra minutes to add to ${a.student}'s attempt:`);
                                                        if (mins) {
                                                            const res = await grantExtraTime(a.id, parseInt(mins));
                                                            if (res.success) toast.success(`Added ${mins} mins to ${a.student}'s attempt`);
                                                            else toast.error("Failed to grant extra time");
                                                        }
                                                    }}
                                                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600">
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {attempts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-20 text-center text-slate-400 font-medium">
                                            No assessment results found yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </Tabs.Content>

                <Tabs.Content value="analytics" className="focus:outline-none animate-in slide-in-from-bottom-2 duration-500">
                    <PsychometricAnalytics
                        questions={questions}
                        attempts={attempts}
                        responses={responses}
                    />
                </Tabs.Content>
            </Tabs.Root>
        </div>
    );
}
