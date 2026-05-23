import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import {
    assignments,
    assignmentSubmissions,
    students,
    users,
    enrollments,
    courses
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, FileText, User } from "lucide-react";
import Link from "next/link";

interface PageProps {
    params: Promise<{
        assignmentId: string;
    }>;
}

export default async function AssignmentSubmissionsPage(props: PageProps) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'staff') {
        redirect("/login");
    }

    const assignmentId = parseInt(params.assignmentId);

    // 1. Get Assignment Details
    const assignmentRows = await db.select({
        assignment: assignments,
        course: courses
    })
        .from(assignments)
        .innerJoin(courses, eq(assignments.courseId, courses.id))
        .where(eq(assignments.id, assignmentId))
        .limit(1);

    if (assignmentRows.length === 0) {
        return <div className="p-8">Assignment not found.</div>;
    }

    const assignment = {
        ...assignmentRows[0].assignment,
        course: assignmentRows[0].course
    };

    if (!assignment) {
        return <div className="p-8">Assignment not found.</div>;
    }

    // 2. Get All Students enrolled in this course
    const enrolledStudents = await db.select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        matricNumber: students.matricNumber,
        userId: students.userId,
    })
        .from(enrollments)
        .innerJoin(students, eq(enrollments.studentId, students.id))
        .where(and(
            eq(enrollments.courseId, assignment.courseId),
            eq(enrollments.status, 'approved')
        ));

    // 3. Get All Submissions for this assignment
    const submissions = await db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.assignmentId, assignmentId));

    const submissionMap = new Map();
    submissions.forEach(s => submissionMap.set(s.studentId, s));

    return (
        <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1 uppercase tracking-wider font-bold">
                        <Link href="/staff/grading" className="hover:text-indigo-600 transition-colors">Grading</Link>
                        <span>/</span>
                        <span>{assignment.course.name}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">{assignment.title}</h1>
                    <p className="text-slate-500 text-sm max-w-2xl">
                        Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : "No Due Date"}
                        {assignment.cutOffDate && ` | Cut-off: ${new Date(assignment.cutOffDate).toLocaleString()}`}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 font-bold">
                        <TableRow>
                            <TableHead className="w-[300px]">Student</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted At</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {enrolledStudents.map((student) => {
                            const submission = submissionMap.get(student.id);
                            return (
                                <TableRow key={student.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{student.firstName} {student.lastName}</p>
                                                <p className="text-xs text-slate-500 font-mono">{student.matricNumber || "N/A"}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {submission ? (
                                            <div className="flex items-center gap-2">
                                                {submission.status === 'late' ? (
                                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1.5 py-1">
                                                        <Clock className="w-3 h-3" /> Late
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1.5 py-1">
                                                        <CheckCircle className="w-3 h-3" /> On Time
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-400 border-slate-200 bg-slate-50 py-1">
                                                Missing
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {submission ? new Date(submission.submittedAt).toLocaleString() : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {submission?.score !== null && submission?.score !== undefined ? (
                                            <div className="font-bold text-indigo-600">
                                                {submission.score} / {assignment.maxScore}
                                            </div>
                                        ) : submission ? (
                                            <span className="text-amber-500 text-xs font-semibold uppercase tracking-tighter">Needs Grading</span>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {submission ? (
                                            <Link
                                                href={`/staff/grading/submission/${submission.id}`}
                                                className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-all"
                                            >
                                                {submission.score !== null ? "Review Result" : "Grade Submission"}
                                            </Link>
                                        ) : (
                                            <Button variant="ghost" size="sm" disabled className="text-slate-300">
                                                No Submission
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {enrolledStudents.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No students are currently enrolled in this course.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
