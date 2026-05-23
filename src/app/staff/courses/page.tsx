import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { courses, courseModules, courseLessons } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Edit, FileText, Video, Settings } from "lucide-react";

export default async function StaffCoursesPage() {
    const session = await auth();
    if (!session?.user || (session.user as any).role === 'student') {
        redirect("/");
    }

    // Fetch courses with some stats (count modules/lessons)
    const allCourses = await db.select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        description: courses.description,
        moduleCount: sql<number>`count(distinct ${courseModules.id})`,
        lessonCount: sql<number>`count(distinct ${courseLessons.id})`,
    })
        .from(courses)
        .leftJoin(courseModules, eq(courseModules.courseId, courses.id))
        .leftJoin(courseLessons, eq(courseLessons.moduleId, courseModules.id))
        .groupBy(courses.id);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Course Management</h1>
                    <p className="text-slate-500 mt-2">Manage course content, modules, and lessons.</p>
                </div>
                {/* <Button>Create New Course</Button> (Courses are created by Admin in Academics) */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allCourses.map((course) => (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow border-slate-200">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mb-2 w-fit">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-600">{course.code}</span>
                            </div>
                            <CardTitle className="line-clamp-1">{course.name}</CardTitle>
                            <CardDescription className="line-clamp-2 h-10">
                                {course.description || "No description provided."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                                <div className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    <span>{course.moduleCount} Modules</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Video className="w-4 h-4" />
                                    <span>{course.lessonCount} Lessons</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <Link href={`/staff/courses/${course.id}/editor`} className="w-full">
                                    <Button className="w-full gap-2 border-slate-200" variant="outline" size="sm">
                                        <Edit className="w-4 h-4" />
                                        Content
                                    </Button>
                                </Link>
                                <Link href={`/staff/courses/${course.id}/grading`} className="w-full">
                                    <Button className="w-full gap-2 border-indigo-100 text-indigo-700 bg-indigo-50 hover:bg-indigo-100" variant="outline" size="sm">
                                        <Settings className="w-4 h-4" />
                                        Grading
                                    </Button>
                                </Link>
                                <Link href={`/courses/${course.id}`} className="w-full col-span-2">
                                    <Button className="w-full gap-2" variant="secondary" size="sm">
                                        <BookOpen className="w-4 h-4" />
                                        Preview Course
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {allCourses.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No Courses Found</h3>
                        <p className="text-slate-500">Contact the admin to create courses in the Academic settings.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
