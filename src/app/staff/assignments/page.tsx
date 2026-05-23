import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import {
    assignments,
    courses,
    courseLecturers,
    staffProfiles,
    assignmentSubmissions
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
import { BookOpen, FileText, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default async function AssignmentsDashboard() {
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
            <div className="p-8 text-center text-slate-500 font-medium">
                No courses assigned as a lecturer.
            </div>
        );
    }

    // 3. Get Assignments with submission counts
    const assignmentStats = await db.select({
        id: assignments.id,
        title: assignments.title,
        courseId: assignments.courseId,
        courseName: courses.name,
        dueDate: assignments.dueDate,
        totalSubmissions: sql<number>`count(${assignmentSubmissions.id})`,
        pendingGrading: sql<number>`count(CASE WHEN ${assignmentSubmissions.score} IS NULL THEN 1 END)`
    })
        .from(assignments)
        .innerJoin(courses, eq(assignments.courseId, courses.id))
        .leftJoin(assignmentSubmissions, eq(assignments.id, assignmentSubmissions.assignmentId))
        .where(sql`${assignments.courseId} IN (${sql.join(courseIds, sql`, `)})`)
        .groupBy(assignments.id, courses.name)
        .orderBy(assignments.dueDate);

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Assignments Hub</h1>
                    <p className="text-slate-500 font-medium">Manage student submissions and evaluations.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignmentStats.map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 text-left">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">
                                    {assignment.courseName}
                                </Badge>
                                {assignment.pendingGrading > 0 ? (
                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">
                                        {assignment.pendingGrading} Pending
                                    </Badge>
                                ) : (
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">
                                        Completed
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-lg font-bold line-clamp-1">{assignment.title}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1 font-medium text-slate-500">
                                <Clock className="w-4 h-4" />
                                Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('en-GB') : "No Date"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-left">
                            <div className="flex justify-between items-center text-sm mb-4 bg-slate-50 p-3 rounded-lg">
                                <div className="text-center">
                                    <p className="text-slate-500 text-xs">Submissions</p>
                                    <p className="font-bold text-slate-800">{assignment.totalSubmissions}</p>
                                </div>
                                <div className="w-px h-8 bg-slate-200" />
                                <div className="text-center">
                                    <p className="text-slate-500 text-xs">Graded</p>
                                    <p className="font-bold text-slate-800">{assignment.totalSubmissions - assignment.pendingGrading}</p>
                                </div>
                            </div>
                            <Link
                                href={`/staff/grading/${assignment.id}`}
                                className="w-full inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium transition-colors bg-slate-900 text-white hover:bg-slate-800"
                            >
                                View Submissions
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {assignmentStats.length === 0 && (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-slate-600 font-medium">No active assignments found.</h3>
                    <p className="text-slate-400 text-sm">Assignments you create in your courses will appear here.</p>
                </div>
            )}
        </div>
    );
}
