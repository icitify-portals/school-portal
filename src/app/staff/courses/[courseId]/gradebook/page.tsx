import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { courses, academicSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getGradebookData } from "@/actions/course-gradebook";
import GradebookTable from "@/components/staff/GradebookTable";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Filter, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
    params: Promise<{
        courseId: string;
    }>;
}

export default async function CourseGradebookPage(props: PageProps) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'staff') {
        redirect("/login");
    }

    const courseId = parseInt(params.courseId);

    // Get Course & Session info
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

    if (!course || !currentSession) {
        return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">Course or Session not found.</div>;
    }

    const gradebookResult = await getGradebookData(courseId, currentSession.id);
    const students = (gradebookResult.success ? gradebookResult.data : []) || [];

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="text-left">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                        <Link href="/staff/grading" className="hover:text-indigo-600 transition-colors">Grading Dashboard</Link>
                        <span>/</span>
                        <span className="text-slate-800">{course.code}</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Course Gradebook</h1>
                    <p className="text-slate-500 font-medium">{course.name} • {currentSession.name} Academic Session</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="border-none bg-white shadow-sm hover:bg-slate-100 rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px]">
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100">
                        <Save className="w-4 h-4 mr-2" /> Publish All
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-black text-slate-900 uppercase italic leading-none">{students.length}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-black text-indigo-600 uppercase italic leading-none">
                            {students.length > 0 ? (students.reduce((acc, s) => acc + (s.totalScore || 0), 0) / students.length).toFixed(1) : "0.0"}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Passing Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-black text-emerald-500 uppercase italic leading-none">
                            {students.length > 0 ? ((students.filter(s => (s.totalScore || 0) >= 40).length / students.length) * 100).toFixed(0) : "0"}%
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">At Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-black text-rose-500 uppercase italic leading-none">
                            {students.filter(s => (s.totalScore || 0) < 40).length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 flex flex-row justify-between items-center">
                    <div className="text-left">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Student Results</CardTitle>
                        <CardDescription className="text-2xl font-black text-slate-900 uppercase italic leading-none">Academic Performance Log</CardDescription>
                    </div>
                    <div className="flex gap-4">
                        <div className="relative group">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            <input
                                placeholder="Search by name or reg no..."
                                className="bg-white border-2 border-slate-100 rounded-2xl h-11 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-64"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <GradebookTable
                        initialStudents={students as any}
                        courseId={courseId}
                        sessionId={currentSession.id}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
