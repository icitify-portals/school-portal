
import { getK12ReportData } from "@/actions/results";
import { db } from "@/db/db";
import { academicSessions, students } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, School, User, CalendarDays, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function StudentReportCardPage({ 
    searchParams 
}: { 
    searchParams: { session?: string, term?: string } 
}) {
    const sessionToken = await auth();
    if (!sessionToken?.user?.id) return <div>Unauthorized</div>;

    const [student] = await db.select().from(students).where(eq(students.userId, parseInt(sessionToken.user.id))).limit(1);
    if (!student) return <div>Student profile not found</div>;

    const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
    
    const sessionId = searchParams.session ? parseInt(searchParams.session) : currentSession?.id;
    const term = searchParams.term || "1";

    if (!sessionId) return <div>No active session found</div>;

    const data = await getK12ReportData(student.id, sessionId, term);

    if (!data) return <div>Failed to load report data.</div>;

    const averageScore = data.results.length > 0 
        ? data.results.reduce((acc, r) => acc + parseFloat(r.totalScore || "0"), 0) / data.results.length 
        : 0;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 print:p-0 print:m-0">
            {/* Header Actions */}
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Academic Report Card</h1>
                    <p className="text-slate-500">View and download your terminal performance reports.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        PDF
                    </Button>
                    <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200">
                        <Printer className="w-4 h-4" />
                        Print
                    </Button>
                </div>
            </div>

            {/* Official Report Layout */}
            <Card className="border-2 border-slate-200 shadow-none rounded-none print:border-none">
                <CardContent className="p-12 space-y-12">
                    {/* Institution Header */}
                    <div className="flex justify-between items-center border-b-2 border-indigo-600 pb-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                                <School className="w-12 h-12" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                                    {data.student?.unit || "Institutional School Portal"}
                                </h2>
                                <p className="text-indigo-600 font-bold uppercase tracking-widest text-sm">Official Progress Report</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-100 text-lg py-1 px-4">
                                {data.session} - {data.term} Term
                            </Badge>
                        </div>
                    </div>

                    {/* Student Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50 p-6 border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Student Name</p>
                                <p className="font-bold text-slate-800">{data.student?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500">
                                <CalendarDays className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Class / Level</p>
                                <p className="font-bold text-slate-800">Grade {data.student?.level}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Admission Number</p>
                                <p className="font-bold text-slate-800">{data.student?.matricNumber}</p>
                            </div>
                        </div>
                    </div>

                    {/* Academic Results Table */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-800 border-l-4 border-indigo-600 pl-4">Cognitive Assessment</h3>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Subject</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">CA (40)</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Exam (60)</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Total (100)</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Grade</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Rank</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.results.map((res) => (
                                        <tr key={res.id} className="hover:bg-slate-50/50">
                                            <td className="p-4">
                                                <p className="font-bold text-slate-800">{res.courseName}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{res.courseCode}</p>
                                            </td>
                                            <td className="p-4 text-center font-medium text-slate-600">{res.caScore}</td>
                                            <td className="p-4 text-center font-medium text-slate-600">{res.examScore}</td>
                                            <td className="p-4 text-center font-black text-slate-900">{res.totalScore}</td>
                                            <td className="p-4 text-center">
                                                <Badge className={`
                                                    ${res.grade === 'A' ? 'bg-emerald-50 text-emerald-700' : 
                                                      res.grade === 'B' ? 'bg-blue-50 text-blue-700' : 
                                                      res.grade === 'F' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'}
                                                `}>
                                                    {res.grade}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-center text-xs font-bold text-indigo-600">{res.rankClass || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Behavioral & Affective Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-800 border-l-4 border-indigo-600 pl-4">Affective & Psychomotor Traits</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {data.behaviors.map((b, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{b.name}</span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(step => (
                                                <div key={step} className={`w-2 h-4 rounded-sm ${step <= (b.score || 0) ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary & Attendance */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-800 border-l-4 border-indigo-600 pl-4">Attendance Summary</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 border-2 border-indigo-50 rounded-2xl text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Days Open</p>
                                    <p className="text-2xl font-black text-indigo-600">{data.remarks?.daysOpen || '-'}</p>
                                </div>
                                <div className="p-4 border-2 border-emerald-50 rounded-2xl text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Present</p>
                                    <p className="text-2xl font-black text-emerald-600">{data.remarks?.daysPresent || '-'}</p>
                                </div>
                                <div className="p-4 border-2 border-rose-50 rounded-2xl text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Absent</p>
                                    <p className="text-2xl font-black text-rose-600">{data.remarks?.daysAbsent || '-'}</p>
                                </div>
                            </div>

                            <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Average Performance</p>
                                    <h4 className="text-4xl font-black mt-2">{averageScore.toFixed(2)}%</h4>
                                    <p className="text-xs text-indigo-200 mt-4 italic">Next Term Begins: {data.remarks?.nextTermStarts ? new Date(data.remarks.nextTermStarts).toLocaleDateString() : 'TBA'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Remarks Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                        <div className="space-y-2">
                            <p className="text-xs font-black text-slate-400 uppercase">Class Teacher's Remark</p>
                            <p className="text-slate-700 italic leading-relaxed border-b border-slate-200 pb-4">
                                "{data.remarks?.classTeacherComment || "No comment provided yet."}"
                            </p>
                            <div className="flex justify-between items-end pt-4">
                                <div className="w-32 border-b-2 border-slate-300 h-8" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Signature</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-black text-slate-400 uppercase">Head Teacher's Remark</p>
                            <p className="text-slate-700 italic leading-relaxed border-b border-slate-200 pb-4">
                                "{data.remarks?.headTeacherComment || "No comment provided yet."}"
                            </p>
                            <div className="flex justify-between items-end pt-4">
                                <div className="w-32 border-b-2 border-slate-300 h-8" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Official Stamp</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
