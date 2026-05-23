import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { gradingRubrics, courses, staffProfiles, courseLecturers, rubricCriteria } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, BookOpen, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function RubricManagementPage() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'staff') {
        redirect("/login");
    }

    const userId = parseInt(session.user.id);
    const staffRows = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
    const staff = staffRows[0];

    if (!staff) return <div className="p-8">Staff profile not found.</div>;

    // Get courses assigned to staff
    const assignedCourses = await db.select({ id: courseLecturers.courseId })
        .from(courseLecturers)
        .where(eq(courseLecturers.staffId, staff.id));

    const courseIds = assignedCourses.map(c => c.id);

    // Get rubrics for these courses or global ones (if courseId is null)
    const rubricsRaw = await db.select({
        rubric: gradingRubrics,
        course: courses
    })
        .from(gradingRubrics)
        .leftJoin(courses, eq(gradingRubrics.courseId, courses.id))
        .where(courseIds.length > 0 ? sql`${gradingRubrics.courseId} IN (${sql.join(courseIds, sql`, `)}) OR ${gradingRubrics.courseId} IS NULL` : eq(gradingRubrics.courseId, sql`NULL`));

    const criteria = await db.select().from(rubricCriteria);

    const rubrics = rubricsRaw.map(r => ({
        ...r.rubric,
        course: r.course,
        criteria: criteria.filter(c => c.rubricId === r.rubric.id)
    }));

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Grading Rubrics</h1>
                    <p className="text-slate-500">Create and manage reusable rubrics for your assignments.</p>
                </div>
                <Link
                    href="/staff/grading/rubrics/new"
                    className="inline-flex items-center justify-center h-10 px-4 rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Rubric
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rubrics.map((rubric) => (
                    <Card key={rubric.id} className="hover:shadow-md transition-shadow group">
                        <CardHeader className="text-left">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] uppercase">
                                    {rubric.course?.name || "Global / Template"}
                                </Badge>
                                <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-indigo-600 border-indigo-100 bg-indigo-50/30">
                                        {rubric.criteria.length} Criteria
                                    </Badge>
                                </div>
                            </div>
                            <CardTitle className="text-lg font-bold text-slate-800">{rubric.title}</CardTitle>
                            <CardDescription className="line-clamp-2 text-xs mt-1">{rubric.description || "No description provided."}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-2">
                            <Link
                                href={`/staff/grading/rubrics/${rubric.id}/edit`}
                                className="flex-1 inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-900 transition-colors"
                            >
                                Edit Rubric
                            </Link>
                            <Button variant="outline" size="sm" className="px-3 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100">
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {rubrics.length === 0 && (
                <div className="bg-white p-16 rounded-2xl border border-dashed border-slate-200 text-center">
                    <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Rubrics Found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm italic">
                        Rubrics help maintain consistency and provide clear expectations for students. Start by creating your first one.
                    </p>
                    <Link
                        href="/staff/grading/rubrics/new"
                        className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        Create Your First Rubric
                    </Link>
                </div>
            )}
        </div>
    );
}
