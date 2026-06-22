import { getStudentITSAnalytics } from "@/actions/parent_its";
import { 
    BrainCircuit, 
    Target, 
    Zap, 
    Clock, 
    ChevronRight, 
    ShieldCheck, 
    BarChart3,
    Trophy,
    BookOpen,
    Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ParentITSView({ params }: { params: { id: string } }) {
    const analytics = await getStudentITSAnalytics(parseInt(params.id));

    if (!analytics) return <div>Error loading ITS analytics</div>;

    const summaryStats = [
        { label: "AI Engagement", value: `${analytics.avgEngagement}%`, icon: Eye, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Quiz Mastery", value: `${analytics.assessmentScore}%`, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Study Duration", value: `${analytics.totalMinutes}m`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Honor Points", value: "+450", icon: Trophy, color: "text-indigo-600", bg: "bg-indigo-50" },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        <BrainCircuit className="w-3 h-3" />
                        ITS Learning Insight
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Intelligent <span className="text-indigo-600">Journey</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-xl">
                        Monitor how your child interacts with the AI Tutor and their progress across the national curriculum.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {summaryStats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all bg-white">
                        <CardContent className="p-8 flex items-center gap-6">
                            <div className={cn("p-4 rounded-2xl", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Curriculum Mastery */}
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="p-10 border-b border-slate-50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <span className="w-2 h-8 bg-indigo-600 rounded-full" />
                                Curriculum Standards Mastery
                            </CardTitle>
                            <Badge className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2">NUC CCMAS Aligned</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10">
                        <div className="space-y-6">
                            {[
                                { name: "Computational Theory", progress: 85, color: "bg-indigo-600" },
                                { name: "System Architecture", progress: 62, color: "bg-emerald-500" },
                                { name: "Algorithmic Logic", progress: 94, color: "bg-amber-500" },
                                { name: "Data Ethics", progress: 40, color: "bg-rose-500" },
                            ].map((topic, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <h4 className="font-black text-slate-900 uppercase italic text-sm tracking-tight">{topic.name}</h4>
                                        <span className="text-xs font-black text-slate-400">{topic.progress}% Mastery</span>
                                    </div>
                                    <Progress value={topic.progress} className="h-3 bg-slate-50" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* AI Engagement Timeline */}
                <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
                    <Zap className="w-60 h-60 absolute -right-20 -bottom-20 text-white/5 rotate-12" />
                    <CardHeader className="p-10 relative z-10">
                        <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <span className="w-2 h-8 bg-indigo-500 rounded-full" />
                            Engagement Pulse
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 pt-0 relative z-10 space-y-8">
                        <div className="h-40 flex items-end gap-2">
                            {[...Array(12)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="flex-1 bg-indigo-500/30 rounded-t-lg group relative"
                                    style={{ height: `${30 + Math.random() * 70}%` }}
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500 text-white text-[10px] font-black px-2 py-1 rounded-md">
                                        {Math.floor(Math.random() * 20) + 80}%
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <p className="text-xs font-medium text-white/60 leading-relaxed">
                                Engagement is calculated by the ITS Vision AI analyzing facial focus and participation triggers during classroom sessions.
                            </p>
                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Privacy Verified Mode</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lesson Log */}
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-indigo-600 rounded-full" />
                    Interactive Lesson Log
                </h2>
                <div className="grid grid-cols-1 gap-4">
                    {analytics.sessions.map((item: any) => (
                        <Card key={item.session.id} className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden group hover:border-indigo-200 transition-all">
                            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:bg-indigo-600 transition-colors">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none">{item.lesson.title}</h3>
                                    <div className="flex flex-wrap gap-4 items-center">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-100">{item.topic.name}</Badge>
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-amber-500" />
                                            <span className="text-[10px] font-black uppercase text-slate-400">{item.session.engagementScore}% Engagement</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-indigo-500" />
                                            <span className="text-[10px] font-black uppercase text-slate-400">{new Date(item.session.startedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" className="h-12 px-6 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 font-black uppercase text-[10px] tracking-widest gap-3 transition-all">
                                    Full Audit
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
