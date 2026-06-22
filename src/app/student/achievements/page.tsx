
import { db } from "@/db/db";
import { badges, issuedBadges, students } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { 
    Trophy, 
    Star, 
    Zap, 
    Shield, 
    Medal, 
    Lock, 
    CheckCircle2,
    Sparkles,
    Flame
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function AchievementsPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userId = parseInt(session.user.id);
    const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
    if (!student) return null;

    // 1. Fetch All Potential Badges
    const allBadges = await db.select().from(badges);

    // 2. Fetch Student's Issued Badges
    const myBadges = await db.select()
        .from(issuedBadges)
        .where(eq(issuedBadges.studentId, student.id));

    const myBadgeIds = new Set(myBadges.map(b => b.badgeId));

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        <Sparkles className="w-3 h-3" />
                        Honor Roll
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Academic <span className="text-indigo-600">Achievements</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-lg">
                        Your virtual trophy cabinet. Every badge represents a milestone in your journey toward mastery.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center p-6 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 min-w-[150px]">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Earned</p>
                        <p className="text-4xl font-black text-indigo-600">{myBadges.length}</p>
                    </div>
                    <div className="text-center p-6 bg-slate-900 rounded-2xl shadow-xl min-w-[150px]">
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Completion</p>
                        <p className="text-4xl font-black text-white">{allBadges.length > 0 ? Math.round((myBadges.length / allBadges.length) * 100) : 0}%</p>
                    </div>
                </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allBadges.map((badge) => {
                    const isUnlocked = myBadgeIds.has(badge.id);
                    return (
                        <Card 
                            key={badge.id}
                            className={cn(
                                "border-none shadow-2xl shadow-indigo-500/5 rounded-[3rem] overflow-hidden transition-all group relative",
                                isUnlocked ? "bg-white" : "bg-slate-50 grayscale opacity-60"
                            )}
                        >
                            <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
                                {/* Badge Icon Container */}
                                <div className="relative">
                                    <div className={cn(
                                        "w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 duration-500",
                                        isUnlocked 
                                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-200" 
                                            : "bg-slate-200 text-slate-400 shadow-none"
                                    )}>
                                        <Trophy className="w-12 h-12" />
                                    </div>
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Lock className="w-8 h-8 text-slate-600/20" />
                                        </div>
                                    )}
                                    {isUnlocked && (
                                        <div className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg animate-in zoom-in duration-500">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{badge.name}</h3>
                                        {badge.rarity === 'legendary' && <Star className="w-4 h-4 text-amber-500 fill-current animate-pulse" />}
                                    </div>
                                    <Badge className={cn(
                                        "uppercase font-black text-[8px] tracking-[0.2em] px-4 py-1 rounded-full border-none",
                                        badge.rarity === 'legendary' ? "bg-amber-100 text-amber-600" :
                                        badge.rarity === 'epic' ? "bg-purple-100 text-purple-600" :
                                        badge.rarity === 'rare' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                                    )}>
                                        {badge.rarity}
                                    </Badge>
                                </div>

                                <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                                    "{badge.description}"
                                </p>

                                {!isUnlocked && (
                                    <div className="pt-4 w-full">
                                        <div className="bg-slate-200/50 p-4 rounded-2xl">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Requirement</p>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase leading-loose">
                                                {badge.name === 'The Scholar' && "Complete 5 Practice Quizzes"}
                                                {badge.name === 'First Blood' && "Complete your first Quiz"}
                                                {badge.name === 'Elite Rank' && "Reach Level 10"}
                                                {badge.name === 'Session Ready' && "Finalize Course Registration"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            
                            {/* Decorative background star for unlocked */}
                            {isUnlocked && (
                                <Sparkles className="absolute bottom-6 right-6 w-12 h-12 text-indigo-500/5 pointer-events-none" />
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
