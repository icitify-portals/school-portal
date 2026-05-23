import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import {
    assignmentSubmissions,
    assignments,
    students,
    gradingRubrics,
    rubricCriteria,
    courses
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import GradingInterface from "@/components/lms/GradingInterface";
import { Badge } from "@/components/ui/badge";
import { User, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageProps {
    params: Promise<{
        submissionId: string;
    }>;
}

export default async function GradingPage(props: PageProps) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'staff') {
        redirect("/login");
    }

    const submissionId = parseInt(params.submissionId);

    // 1. Get Submission Detail
    const subRows = await db.select({
        submission: assignmentSubmissions,
        assignment: assignments,
        course: courses,
        student: students
    })
        .from(assignmentSubmissions)
        .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
        .innerJoin(courses, eq(assignments.courseId, courses.id))
        .innerJoin(students, eq(assignmentSubmissions.studentId, students.id))
        .where(eq(assignmentSubmissions.id, submissionId))
        .limit(1);

    if (subRows.length === 0) {
        return <div className="p-8">Submission not found.</div>;
    }

    const submission = {
        ...subRows[0].submission,
        assignment: {
            ...subRows[0].assignment,
            course: subRows[0].course
        },
        student: subRows[0].student
    };

    if (!submission) {
        return <div className="p-8">Submission not found.</div>;
    }

    // 2. Get Rubric if exists
    let rubric = null;
    if (submission.assignment.rubricId) {
        const rubricRows = await db.select().from(gradingRubrics).where(eq(gradingRubrics.id, submission.assignment.rubricId)).limit(1);
        if (rubricRows.length > 0) {
            const criteria = await db.select().from(rubricCriteria).where(eq(rubricCriteria.rubricId, rubricRows[0].id)).orderBy(asc(rubricCriteria.order));
            rubric = {
                ...rubricRows[0],
                criteria
            };
        }
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Minimal Sub-header */}
            <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                <div className="flex items-center gap-6">
                    <Link
                        href={`/staff/grading/${submission.assignment.id}`}
                        className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            {(submission.student.firstName || "")[0]}{(submission.student.lastName || "")[0]}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 leading-none mb-1">
                                {submission.student.firstName || ""} {submission.student.lastName || ""}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                {submission.student.matricNumber || "No Matric Number"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Status</p>
                        <Badge variant="outline" className={cn(
                            "py-0 h-5 px-2 text-[10px] font-bold border-none",
                            submission.status === 'late' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                            {submission.status === 'late' ? "LATE SUBMISSION" : "ON TIME"}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-8 bg-slate-50/50">
                <GradingInterface
                    submission={submission}
                    assignment={submission.assignment}
                    rubric={rubric}
                    gradedBy={parseInt((session.user as any).id)}
                />
            </div>
        </div>
    );
}
