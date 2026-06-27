import { db } from "@/db/db";
import { academicCarryOvers, students, courses, academicSessions } from "@/db/schema";
import { Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CarryOversPage() {
    // Fetch all carry-overs with related data
    const carryOversList = await db
        .select({
            id: academicCarryOvers.id,
            status: academicCarryOvers.status,
            studentName: students.name,
            matricNumber: students.matricNumber,
            courseCode: courses.code,
            courseTitle: courses.title,
            originalSession: academicSessions.name,
            createdAt: academicCarryOvers.createdAt,
        })
        .from(academicCarryOvers)
        .leftJoin(students, eq(academicCarryOvers.studentId, students.id))
        .leftJoin(courses, eq(academicCarryOvers.courseId, courses.id))
        .leftJoin(academicSessions, eq(academicCarryOvers.originalSessionId, academicSessions.id))
        .orderBy(desc(academicCarryOvers.createdAt));

    const pendingCount = carryOversList.filter(c => c.status === 'pending').length;
    const resolvedCount = carryOversList.filter(c => c.status === 'resolved').length;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Search className="w-8 h-8 text-amber-600" />
                        Carry-Over Tracker
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">
                        Monitor and enforce mandatory course retakes for students who failed prerequisite modules.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Pending Carry-Overs</p>
                            <h2 className="text-3xl font-black text-amber-900">{pendingCount}</h2>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Resolved Carry-Overs</p>
                            <h2 className="text-3xl font-black text-emerald-900">{resolvedCount}</h2>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg border-slate-200">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Active Retake Register</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Course</th>
                                    <th className="px-6 py-4">Failed In</th>
                                    <th className="px-6 py-4">Date Logged</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {carryOversList.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{record.matricNumber}</div>
                                            <div className="text-xs text-slate-500">{record.studentName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700">{record.courseCode}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{record.courseTitle}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">{record.originalSession}</td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">{record.createdAt?.toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            {record.status === 'resolved' ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Resolved</Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Pending Retake</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {carryOversList.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">
                                            No carry-over records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
