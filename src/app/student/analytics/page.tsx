import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import {
    results,
    courses,
    enrollments,
    academicSessions,
    studentProgress,
    students,
    users
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    TrendingUp,
    Award,
    Clock,
    BookOpen,
    CheckCircle2,
    Activity,
    LineChart as ChartIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function StudentAnalyticsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = parseInt(session.user.id);
    const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);

    if (!student) {
        return <div className="p-8">Student profile not found.</div>;
    }

    // 1. Overall GPA / Grade stats
    const allResults = await db.select({
        totalScore: results.totalScore,
        grade: results.grade,
        courseCode: courses.code,
        courseName: courses.name
    })
        .from(results)
        .innerJoin(enrollments, eq(results.enrollmentId, enrollments.id))
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(enrollments.studentId, student.id));

    const avgScore = allResults.length > 0
        ? allResults.reduce((acc, r) => acc + Number(r.totalScore || 0), 0) / allResults.length
        : 0;

    // 2. Course Progress
    const registeredCourses = await db.select({
        id: courses.id,
        name: courses.name,
        code: courses.code
    })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(and(
            eq(enrollments.studentId, student.id),
            eq(enrollments.status, 'approved')
        ));

    // Total lessons vs completed
    const progressStats = await db.select({
        courseId: studentProgress.courseId,
        completedCount: sql<number>`count(${studentProgress.id})`
    })
        .from(studentProgress)
        .where(and(
            eq(studentProgress.studentId, student.id),
            eq(studentProgress.isCompleted, true),
            sql`${studentProgress.lessonId} IS NOT NULL`
        ))
        .groupBy(studentProgress.courseId);

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div className="text-left">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Learning Center</h1>
                    <p className="text-slate-500 font-medium">Your academic growth and performance insights.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl shadow-indigo-100 rounded-2xl bg-indigo-600 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-500">
                        <ChartIcon className="w-24 h-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Overall Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <p className="text-5xl font-black italic">{avgScore.toFixed(0)}</p>
                            <p className="text-indigo-200 font-bold uppercase text-[10px] mb-2 tracking-widest">Average Score</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/10 w-fit px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
                            <TrendingUp className="w-3 h-3 text-emerald-400" /> +5.2% from last semester
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden relative">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Credits Earned</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-5xl font-black text-slate-900 italic uppercase">128.5</p>
                        <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" /> Level 400 Student
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Learning Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-5xl font-black text-slate-900 italic uppercase">42<span className="text-2xl ml-1">hrs</span></p>
                        <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" /> 12h this week
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Course Progress List */}
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Course Progress</CardTitle>
                            <CardDescription className="text-xl font-black text-slate-900 uppercase italic">Completion Monitor</CardDescription>
                        </div>
                        <Button variant="ghost" className="h-10 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-slate-100">See All Courses</Button>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-2">
                            {registeredCourses.slice(0, 5).map(course => {
                                const prog = progressStats.find(p => p.courseId === course.id);
                                // Mock total lessons for now - ideally we fetch this
                                const totalLessons = 10;
                                const completed = prog?.completedCount || 0;
                                const percentage = (completed / totalLessons) * 100;

                                return (
                                    <div key={course.id} className="p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors">{course.name}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{course.code}</p>
                                            </div>
                                            <span className="text-xs font-black text-slate-900 italic uppercase">{percentage}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-indigo-500 transition-all duration-1000 group-hover:bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Trends Mockup */}
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Score Matrix</CardTitle>
                        <CardDescription className="text-xl font-black text-slate-900 uppercase italic">Recent Results</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {allResults.slice(0, 5).map((result, i) => (
                                <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-white transition-colors">
                                            {result.courseCode.substring(0, 3)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{result.courseName}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{result.courseCode}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-black text-slate-900 italic uppercase">{result.totalScore}</span>
                                            <Badge className={cn(
                                                "rounded-lg font-black uppercase text-[10px] px-2 py-0.5",
                                                result.grade === 'A' ? "bg-emerald-100 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                                            )}>
                                                {result.grade}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {allResults.length === 0 && (
                            <div className="p-20 text-center space-y-4">
                                <Activity className="w-12 h-12 text-slate-200 mx-auto" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No results recorded yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
