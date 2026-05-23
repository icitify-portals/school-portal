
import { getLeaderboard, getStudentGamification } from "@/actions/gamification";
import { 
    Trophy, 
    Medal, 
    Crown, 
    Star, 
    ChevronRight,
    Users,
    Zap,
    Flame,
    TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";

export default async function LeaderboardPage() {
    const leaderboard = await getLeaderboard();
    const myStats = await getStudentGamification();
    const session = await auth();

    const topThree = leaderboard.slice(0, 3);
    const others = leaderboard.slice(3);

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Hero Header */}
            <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-600 font-black uppercase text-[10px] tracking-widest shadow-sm">
                    <Trophy className="w-4 h-4 fill-current" />
                    Institutional Hall of Fame
                </div>
                <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic uppercase">
                    The <span className="text-indigo-600">Leaderboard</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">
                    Behold the legends of the academy. Consistent effort leads to eternal glory.
                </p>
            </div>

            {/* Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-12">
                {/* 2nd Place */}
                {topThree[1] && (
                    <div className="order-2 md:order-1 flex flex-col items-center gap-6 group">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-[2rem] bg-slate-200 border-4 border-white shadow-2xl flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                                <Medal className="w-10 h-10" />
                            </div>
                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-slate-400 rounded-full flex items-center justify-center text-white font-black text-xl border-4 border-white">2</div>
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="font-black text-xl text-slate-900">{topThree[1].name}</h3>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-black text-[10px]">Level {topThree[1].level}</Badge>
                        </div>
                        <div className="w-full h-40 bg-slate-50 border border-slate-100 rounded-t-[3rem] shadow-inner flex flex-col items-center justify-center p-6">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Points</p>
                             <p className="text-2xl font-black text-slate-900">{topThree[1].totalXp?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                    <div className="order-1 md:order-2 flex flex-col items-center gap-8 group">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-amber-400 border-4 border-white shadow-2xl flex items-center justify-center text-amber-900 group-hover:scale-110 transition-transform">
                                <Crown className="w-16 h-16" />
                            </div>
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-black text-2xl border-4 border-white shadow-lg animate-bounce">1</div>
                            <Star className="absolute -bottom-4 -left-4 w-10 h-10 text-amber-300 animate-pulse fill-current" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="font-black text-3xl text-slate-900 tracking-tight">{topThree[0].name}</h3>
                            <Badge className="bg-indigo-600 text-white border-none font-black px-4 py-2 rounded-xl text-xs uppercase">Level {topThree[0].level} • Grandmaster</Badge>
                        </div>
                        <div className="w-full h-64 bg-indigo-50 border-x-4 border-t-4 border-indigo-200 rounded-t-[4rem] shadow-2xl flex flex-col items-center justify-center p-8 gap-4 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.03]">
                                <Zap className="w-full h-full text-indigo-600" />
                            </div>
                             <p className="text-xs font-black uppercase text-indigo-400 tracking-[0.3em] relative z-10">Total XP</p>
                             <p className="text-5xl font-black text-indigo-900 italic relative z-10">{topThree[0].totalXp?.toLocaleString() || 0}</p>
                             <Flame className="w-8 h-8 text-rose-500 fill-current animate-pulse relative z-10" />
                        </div>
                    </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                    <div className="order-3 md:order-3 flex flex-col items-center gap-6 group">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-orange-100 border-4 border-white shadow-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                <Medal className="w-8 h-8" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-black text-lg border-4 border-white">3</div>
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="font-black text-lg text-slate-900">{topThree[2].name}</h3>
                            <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-black text-[10px]">Level {topThree[2].level}</Badge>
                        </div>
                        <div className="w-full h-32 bg-slate-50 border border-slate-100 rounded-t-[2.5rem] shadow-inner flex flex-col items-center justify-center p-6">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Points</p>
                             <p className="text-xl font-black text-slate-900">{topThree[2].totalXp?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* List Table */}
            <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[3rem] overflow-hidden bg-white">
                <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-black uppercase tracking-tight italic">Hall of <span className="text-indigo-600">Scholars</span></CardTitle>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="px-4 py-2 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors">Global</Badge>
                        <Badge variant="outline" className="px-4 py-2 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors">My House</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                        {others.map((student, idx) => (
                            <div key={student.id} className={cn(
                                "p-8 flex items-center justify-between hover:bg-slate-50 transition-all group",
                                student.name === session?.user?.name && "bg-indigo-50/50"
                            )}>
                                <div className="flex items-center gap-8">
                                    <span className="text-2xl font-black italic text-slate-200 w-8">{idx + 4}</span>
                                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-110 transition-transform">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-lg">{student.name}</h4>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                                {(student.level ?? 0) >= 20 ? <Star className="w-3 h-3 text-amber-500 fill-current" /> : null}
                                                Level {student.level ?? 1}
                                            </p>
                                            {student.badgeCount > 0 && (
                                                <Badge className="bg-amber-50 text-amber-600 border-none font-black text-[8px] h-4 flex items-center gap-1">
                                                    <Medal className="w-2 h-2" />
                                                    {student.badgeCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-slate-900 tracking-tight">{student.totalXp?.toLocaleString() || 0} <span className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">XP</span></p>
                                    <div className="flex items-center gap-1 justify-end text-emerald-500">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">+12% Today</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* My Rank Footer */}
                    {myStats && (
                        <div className="p-8 bg-slate-900 text-white flex items-center justify-between rounded-b-[3rem]">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                    <Zap className="w-8 h-8 text-indigo-400 fill-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Your Status</p>
                                    <h4 className="text-xl font-black italic uppercase tracking-tight">{session?.user?.name || 'Student'}</h4>
                                </div>
                            </div>
                            <div className="flex gap-12">
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Global Rank</p>
                                    <p className="text-3xl font-black tracking-tighter italic">#12</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Current Level</p>
                                    <p className="text-3xl font-black tracking-tighter italic">{myStats.level}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
