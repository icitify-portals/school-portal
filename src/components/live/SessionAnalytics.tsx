import { useState, useEffect } from "react";
import { getSessionAnalytics, summarizeLiveClass } from "@/actions/live-class";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Users, MessageSquare, Hand, Smile, ArrowLeft, Loader2, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function SessionAnalytics({ classroomId, onClose }: { classroomId: string, onClose: () => void }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<string | null>(null);
    const [summarizing, setSummarizing] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            const data = await getSessionAnalytics(parseInt(classroomId));
            setStats(data);
            setLoading(false);
        };
        fetchStats();
    }, [classroomId]);

    const handleGenerateSummary = async () => {
        setSummarizing(true);
        try {
            const res = await summarizeLiveClass(parseInt(classroomId));
            if (res.summary) {
                setSummary(res.summary);
            } else if (res.error) {
                throw new Error(res.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSummarizing(false);
        }
    };

    if (loading) return (
        <div className="absolute inset-0 bg-white/95 backdrop-blur z-[60] flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-sm font-medium text-slate-500 animate-pulse">Analyzing class engagement...</p>
            </div>
        </div>
    );

    if (!stats || stats.error) return (
        <div className="absolute inset-0 bg-white/95 backdrop-blur z-[60] flex flex-col items-center justify-center rounded-xl p-8 text-center">
            <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
                <BarChart className="w-8 h-8" />
            </div>
            <p className="text-slate-800 font-bold mb-2">Oops! Analysis Failed</p>
            <p className="text-slate-500 mb-6 text-sm">{stats?.error || "We couldn't aggregate the session data at this time."}</p>
            <Button onClick={onClose} variant="outline" className="border-slate-200 shadow-sm">Close Dashboard</Button>
        </div>
    );

    const students: any[] = Object.values(stats.engagementByStudent || {}).sort((a: any, b: any) => b.score - a.score);

    return (
        <div className="absolute inset-0 bg-white/95 backdrop-blur z-[60] flex flex-col rounded-xl overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white p-4 flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-white/20 text-white rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="font-bold flex items-center gap-2 text-base">
                            <BarChart className="w-5 h-5 text-indigo-200" />
                            Engagement Insights
                        </h2>
                        <p className="text-[10px] text-indigo-100 font-medium opacity-80">Real-time session performance aggregation</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-wider font-extrabold flex items-center gap-1">
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                        Live Data
                    </div>
                </div>
            </div>

            {/* Scrollable Metrics */}
            <ScrollArea className="flex-1 p-6 bg-slate-50/30">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={<Users className="w-4 h-4" />} label="Students" value={students.length} color="text-blue-600" bg="bg-blue-50" border="border-blue-100" />
                    <StatCard icon={<Hand className="w-4 h-4" />} label="Hand Raises" value={stats.handRaises} color="text-amber-500" bg="bg-amber-50" border="border-amber-100" />
                    <StatCard icon={<MessageSquare className="w-4 h-4" />} label="Interactions" value={stats.totalEvents} color="text-emerald-500" bg="bg-emerald-50" border="border-emerald-100" />
                    <StatCard icon={<Smile className="w-4 h-4" />} label="Reactions" value={stats.reactions} color="text-pink-500" bg="bg-pink-50" border="border-pink-100" />
                </div>

                <div className="mb-8 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-indigo-900">Recommended Attendance Scores</h3>
                        <p className="text-[10px] text-indigo-600">Calculated based on active participation (Polls, Hands, Q&A)</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-indigo-100 text-center">
                        <div className="text-xl font-black text-indigo-600">{Math.round(students.reduce((acc, s) => acc + s.weightedScore, 0) / (students.length || 1))}</div>
                        <div className="text-[8px] uppercase font-bold text-slate-400">Class Avg Score</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: AI Hub */}
                    <Card className="border-indigo-100 shadow-sm overflow-hidden bg-gradient-to-br from-indigo-50/30 to-white">
                        <div className="bg-white px-4 py-3 border-b border-indigo-50 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                AI Session Hub
                            </h3>
                            {!summary && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px] font-bold uppercase tracking-wider border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                    onClick={handleGenerateSummary}
                                    disabled={summarizing}
                                >
                                    {summarizing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                    Generate Summary
                                </Button>
                            )}
                        </div>
                        <CardContent className="p-4">
                            {summarizing ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="relative mb-4">
                                        <Sparkles className="w-10 h-10 text-indigo-200 animate-pulse" />
                                        <Loader2 className="absolute inset-0 w-10 h-10 text-indigo-500 animate-spin" />
                                    </div>
                                    <p className="text-xs font-medium text-slate-500">Synthesizing chat and Q&A logs...</p>
                                </div>
                            ) : summary ? (
                                <div className="space-y-4">
                                    <div className="prose prose-sm prose-slate max-w-none text-slate-700 text-xs leading-relaxed">
                                        <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm overflow-auto max-h-[300px] whitespace-pre-wrap">
                                            {summary}
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px] text-slate-400" onClick={() => setSummary(null)}>
                                            Reset Summary
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                                    <FileText className="w-10 h-10 text-slate-100" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 italic">No summary generated yet</p>
                                        <p className="text-[10px] text-slate-300 max-w-[200px]">Click the button above to distill key session highlights using AI.</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Column: Leaderboard */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-white px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                Activity Leaderboard
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top 10 Responders</span>
                        </div>
                        <CardContent className="p-4 space-y-6">
                            {students.slice(0, 10).map((student: any, idx) => {
                                const grade = student.weightedScore > 30 ? 'A+' : student.weightedScore > 20 ? 'A' : student.weightedScore > 10 ? 'B' : 'C';
                                const gradeColor = grade.includes('A') ? 'bg-emerald-500' : 'bg-amber-500';

                                return (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-300 w-4">#{idx + 1}</span>
                                                <span className="text-sm font-semibold text-slate-700">{student.name}</span>
                                                <span className={cn("text-[9px] font-black text-white px-1.5 py-0.5 rounded", gradeColor)}>
                                                    {grade}
                                                </span>
                                            </div>
                                            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                {student.weightedScore} pts
                                            </div>
                                        </div>
                                        <Progress value={Math.min((student.weightedScore / 50) * 100, 100)} className="h-2 bg-slate-100" indicatorcolor="bg-indigo-500" />
                                    </div>
                                );
                            })}
                            {students.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-xs italic">Awaiting first session interaction...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
                <Button onClick={onClose} variant="ghost" className="text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest">
                    Exit Dashboard
                </Button>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color, bg, border }: { icon: any, label: string, value: any, color: string, bg: string, border: string }) {
    return (
        <Card className={`border ${border} ${bg} shadow-sm overflow-hidden transition-all hover:scale-[1.02]`}>
            <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`${color} mb-2 p-1.5 bg-white rounded-lg shadow-sm`}>{icon}</div>
                <div className="text-2xl font-black text-slate-800 tabular-nums leading-none mb-1">{value}</div>
                <div className="text-[9px] uppercase font-black text-slate-400 tracking-wider font-mono">{label}</div>
            </CardContent>
        </Card>
    );
}
