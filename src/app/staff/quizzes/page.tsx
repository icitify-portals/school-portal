import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import {
    quizzes,
    courses,
    courseLecturers,
    staffProfiles,
    quizAttempts
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, BrainCircuit, Clock } from "lucide-react";
import Link from "next/link";

export default async function QuizzesDashboard() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'staff') {
        redirect("/login");
    }

    const userId = parseInt(session.user.id);

    // 1. Get Staff Profile
    const [staff] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);

    if (!staff) {
        return <div className="p-8">Staff profile not found.</div>;
    }

    // 2. Get Courses assigned to this staff
    const assignedCourses = await db.select({
        courseId: courseLecturers.courseId
    })
        .from(courseLecturers)
        .where(eq(courseLecturers.staffId, staff.id));

    const courseIds = assignedCourses.map(c => c.courseId);

    if (courseIds.length === 0) {
        return (
            <div className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-800">No Courses Assigned</h2>
                <p className="text-slate-500">You are not currently assigned to any courses.</p>
            </div>
        );
    }

    // 3. Get Quizzes for these courses with attempt counts
    const quizStats = await db.select({
        id: quizzes.id,
        title: quizzes.title,
        courseId: quizzes.courseId,
        courseName: courses.name,
        timeLimit: quizzes.timeLimitMinutes,
        totalAttempts: sql<number>`count(${quizAttempts.id})`,
        avgScore: sql<number>`avg(${quizAttempts.score})`
    })
        .from(quizzes)
        .innerJoin(courses, eq(quizzes.courseId, courses.id))
        .leftJoin(quizAttempts, eq(quizzes.id, quizAttempts.quizId))
        .where(sql`${quizzes.courseId} IN (${sql.join(courseIds, sql`, `)})`)
        .groupBy(quizzes.id, courses.name);

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">CBT Quiz Management</h1>
                    <p className="text-slate-500 font-medium">Manage computer-based assessments and performance analytics.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizStats.map((quiz) => (
                    <Card key={quiz.id} className="hover:shadow-lg transition-all border-slate-200 group">
                        <CardHeader className="pb-3 text-left">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 font-bold border-none">
                                    {quiz.courseName}
                                </Badge>
                                <Badge className="bg-slate-100 text-slate-600 font-bold border-none capitalize">
                                    {quiz.timeLimit} MINS
                                </Badge>
                            </div>
                            <CardTitle className="text-lg font-black line-clamp-1">{quiz.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1 font-medium italic text-[10px] text-slate-400">
                                Computer-Based Testing Module
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-left">
                            <div className="flex justify-between items-center text-sm mb-4 bg-purple-50/30 border border-purple-100 p-3 rounded-lg">
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-400 font-black uppercase">Attempts</p>
                                    <p className="font-black text-slate-800 text-lg">{quiz.totalAttempts}</p>
                                </div>
                                <div className="w-px h-8 bg-purple-100" />
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-400 font-black uppercase">Avg Score</p>
                                    <p className="font-black text-purple-600 text-lg">{quiz.avgScore ? Math.round(quiz.avgScore) : 0}%</p>
                                </div>
                            </div>
                            <Link
                                href={`/staff/quizzes/${quiz.id}`}
                                className="w-full inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-bold transition-all bg-slate-900 text-white hover:bg-purple-600 shadow-md"
                            >
                                Quiz Analytics
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {quizStats.length === 0 && (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
                    <BrainCircuit className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-slate-600 font-medium">No CBT quizzes found.</h3>
                    <p className="text-slate-400 text-sm">Create quizzes in your courses to see performance metrics here.</p>
                </div>
            )}
        </div>
    );
}
