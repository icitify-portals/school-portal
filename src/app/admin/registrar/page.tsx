import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, AlertTriangle, GraduationCap, FileCheck2, School } from "lucide-react";
import { db } from "@/db/db";
import { students } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function RegistrarDashboardPage() {
    let totalStudents = 0;
    
    try {
        const studentCountData = await db.select({ value: count() }).from(students);
        totalStudents = studentCountData[0].value;
    } catch (e) {
        console.error("Registrar Dashboard Stats Error:", e);
    }

    // Mock stats for modules that will be built in the next phases
    const pendingClearances = 0; 
    const activeConductCases = 0; 

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Office of the Registrar</h1>
                    <p className="text-slate-500 mt-1">
                        Central academic governance, clearances, and records management.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="/50 -100 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Enrolled</CardTitle>
                        <Users className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="text-2xl font-bold text-slate-900">{totalStudents.toLocaleString()}</div>
                        <p className="text-xs text-slate-500 mt-1">Active student records</p>
                    </CardContent>
                </Card>

                <Card className="/50 -100 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-sm font-medium text-slate-600">Pending Clearances</CardTitle>
                        <FileCheck2 className="h-5 w-5 text-amber-600" />
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="text-2xl font-bold text-slate-900">{pendingClearances}</div>
                        <p className="text-xs text-slate-500 mt-1">Graduation audit queue</p>
                    </CardContent>
                </Card>

                <Card className="/50 -100 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-sm font-medium text-slate-600">Active Disciplinary</CardTitle>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="text-2xl font-bold text-slate-900">{activeConductCases}</div>
                        <p className="text-xs text-slate-500 mt-1">Pending Senate review</p>
                    </CardContent>
                </Card>
                
                <Card className="/50 -100 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-sm font-medium text-slate-600">Alumni Registry</CardTitle>
                        <GraduationCap className="h-5 w-5 text-emerald-600" />
                    </CardHeader>
                    <CardContent className=" p-6">
                        <div className="text-2xl font-bold text-slate-900">0</div>
                        <p className="text-xs text-slate-500 mt-1">Graduated students</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                <Link href="/admin/registrar/clearance" className="group">
                    <Card className="h-full transition-all duration-200 hover: hover:-300 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                                <FileCheck2 className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-slate-900">Graduation & Clearance</h3>
                                <p className="text-sm text-slate-500 mt-2">Manage final degree audits and multi-department graduation clearances.</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/registrar/conduct" className="group">
                    <Card className="h-full transition-all duration-200 hover: hover:-300 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-red-100 text-red-600 group-hover:scale-110 transition-transform">
                                <AlertTriangle className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-slate-900">Senate & Conduct</h3>
                                <p className="text-sm text-slate-500 mt-2">Log student infractions and enforce Senate sanctions globally.</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/registrar/alumni" className="group">
                    <Card className="h-full transition-all duration-200 hover: hover:-300 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
                                <GraduationCap className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-slate-900">Alumni Transition</h3>
                                <p className="text-sm text-slate-500 mt-2">Migrate cleared students to the alumni registry and issue certificates.</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                
                <Link href="/admin/exams-records" className="group">
                    <Card className="h-full transition-all duration-200 hover: hover:-300 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
                                <School className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-slate-900">Exams & Records</h3>
                                <p className="text-sm text-slate-500 mt-2">Access the Exams & Records module to manage transcripts and results.</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
