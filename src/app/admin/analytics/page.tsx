
import { db } from "@/db/db";
import { 
    results, 
    courses, 
    departments, 
    students, 
    institutionalUnits,
    academicSessions,
    enrollments
} from "@/db/schema";
import { eq, sql, desc, avg, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    TrendingUp, 
    Users, 
    GraduationCap, 
    AlertTriangle,
    BarChart,
    PieChart,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

export default async function AdminAnalyticsPage() {
    // 1. High Level Stats
    const totalStudents = await db.select({ count: count() }).from(students);
    const avgScore = await db.select({ avg: avg(sql`CAST(${results.totalScore} AS DECIMAL(10,2))`) }).from(results);
    const failureCount = await db.select({ count: count() }).from(results).where(eq(results.grade, 'F'));

    // 2. Performance by Level
    const levelPerformance = await db.select({
        level: students.currentLevel,
        avgScore: avg(sql`CAST(${results.totalScore} AS DECIMAL(10,2))`)
    })
    .from(results)
    .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .groupBy(students.currentLevel)
    .orderBy(students.currentLevel);

    // 3. Top Performers (Best Subject Scores)
    const topPerformers = await db.select({
        score: results.totalScore,
        course: courses.name,
        studentId: students.id,
        level: students.currentLevel
    })
    .from(results)
    .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .orderBy(desc(sql`CAST(${results.totalScore} AS DECIMAL(10,2))`))
    .limit(5);

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Performance Intelligence</h1>
                    <p className="text-slate-500 mt-1 italic">Real-time academic health monitoring and analytics.</p>
                </div>
                <div className="flex gap-3">
                    <Badge className="bg-indigo-600 text-white py-2 px-4 rounded-xl shadow-lg">Session: 2026/27</Badge>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Enrolled Students", value: totalStudents[0]?.count || 0, icon: Users, color: "blue", trend: "+12%" },
                    { label: "Global Avg. Score", value: `${Math.round(parseFloat(avgScore[0]?.avg || "0"))}%`, icon: TrendingUp, color: "emerald", trend: "+2.4%" },
                    { label: "Distinction Rate", value: "24.5%", icon: GraduationCap, color: "indigo", trend: "+5.1%" },
                    { label: "Critical Failures", value: failureCount[0]?.count || 0, icon: AlertTriangle, color: "rose", trend: "-4%", inverse: true },
                ].map((stat, idx) => (
                    <Card key={idx} className="border-none shadow-sm overflow-hidden group">
                        <CardContent className="p-6 relative">
                            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all scale-150`}>
                                <stat.icon className="w-16 h-16" />
                            </div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    <h2 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h2>
                                </div>
                                <Badge className={`
                                    flex items-center gap-1 border-none shadow-none text-[10px] font-bold
                                    ${stat.inverse ? (stat.trend.startsWith('-') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600') : 
                                      (stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}
                                `}>
                                    {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {stat.trend}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Level-by-Level Distribution */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart className="w-5 h-5 text-indigo-500" />
                            Grade Distribution by Level
                        </CardTitle>
                        <CardDescription>Average performance across all academic tiers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {levelPerformance.map((lp, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-slate-600 uppercase">Grade {lp.level}</span>
                                        <span className="text-sm font-black text-slate-900">{Math.round(parseFloat(lp.avgScore || "0"))}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000"
                                            style={{ width: `${lp.avgScore}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Performers Spotlight */}
                <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
                        <Trophy className="w-32 h-32" />
                    </div>
                    <CardHeader className="relative z-10">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-indigo-400" />
                            Subject Spotlight
                        </CardTitle>
                        <CardDescription className="text-slate-400">Top subject scores this term.</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-6">
                        {topPerformers.map((perf, idx) => (
                            <div key={idx} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    #{idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{perf.course}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Grade {perf.level}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-emerald-400">{perf.score}%</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Trophy({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 22V18" />
            <path d="M14 22V18" />
            <path d="M18 4H6v7a6 6 0 0 0 12 0V4Z" />
        </svg>
    )
}
