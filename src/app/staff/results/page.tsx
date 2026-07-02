import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import {
    courses,
    courseLecturers,
    staffProfiles,
    academicSessions
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function ResultGradingDashboard() {
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

    // 2. Get Current Session
    const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

    // 3. Get Courses assigned to this staff
    const assignedCourses = await db.select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        description: courses.description
    })
        .from(courseLecturers)
        .innerJoin(courses, eq(courseLecturers.courseId, courses.id))
        .where(and(
            eq(courseLecturers.staffId, staff.id),
            eq(courseLecturers.sessionId, currentSession?.id || 0)
        ));

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Result Grading</h1>
                <p className="text-slate-500 font-medium">Enter and manage student subject results for your assigned courses.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedCourses.map((course) => (
                    <Card key={course.id} className="hover:shadow-lg transition-all border-slate-200 group">
                        <CardHeader className="pb-3 text-left bg-slate-50/50 border-b border-slate-100 p-6">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 mb-2 w-fit">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-lg font-bold group-hover:text-indigo-600 transition-colors">{course.name}</CardTitle>
                            <CardDescription className="font-mono text-xs">{course.code}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-left py-2 p-6">
                             <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                                 {course.description || "Enter CA and Examination scores for the current session."}
                             </p>
                            <Link href={`/staff/courses/${course.id}/grading`}>
                                <Button className="w-full gap-2 bg-slate-900 group-hover:bg-indigo-600 transition-colors" size="sm">
                                    Grade Students
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {assignedCourses.length === 0 && (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
                    <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-slate-600 font-medium">No courses assigned for result entry.</h3>
                    <p className="text-slate-400 text-sm">Contact the academic office if your assignments are missing.</p>
                </div>
            )}
        </div>
    );
}
