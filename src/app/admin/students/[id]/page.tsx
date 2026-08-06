"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, User, Mail, Phone, Calendar, Briefcase, Droplet, Hash, BookOpen, MapPin, Activity } from "lucide-react";
import { getStudentById } from "@/actions/students";
import { useBranch } from "@/providers/BranchProvider";
import Image from "next/image";

export default function StudentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = parseInt(params.id as string);
    const { isK12 } = useBranch();

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        const fetchStudent = async () => {
            setLoading(true);
            const data = await getStudentById(studentId);
            setStudent(data);
            setLoading(false);
        };
        fetchStudent();
    }, [studentId]);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-8 pb-32 max-w-5xl mx-auto text-center space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">Student Not Found</h2>
                <Button onClick={() => router.push("/admin/students")} variant="outline">Back to Students</Button>
            </div>
        );
    }

    return (
        <div className="p-8 pb-32 max-w-[1200px] w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/admin/students")} className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Student Details</h2>
                    <p className="text-slate-500 mt-1">View comprehensive student profile and records</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Overview */}
                <Card className="border-none shadow-sm md:col-span-1 h-fit">
                    <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                        <div className="w-32 h-32 rounded-[2rem] bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center border-4 border-white shadow-xl overflow-hidden relative">
                            {student.imageUrl ? (
                                <Image src={student.imageUrl} alt="Profile" fill className="object-cover" />
                            ) : (
                                <User className="w-12 h-12" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{student.user?.name}</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">{student.matricNumber || 'No Matric Number'}</p>
                            <div className="flex items-center justify-center gap-2 mt-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${student.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {student.status}
                                </span>
                                {student.isFinanciallyLocked && (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-700">
                                        Fin Locked
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Information */}
                <div className="md:col-span-2 space-y-6">
                    {/* Academic Info */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-600" /> Academic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Programme</span>
                                <p className="text-sm font-medium text-slate-900">{student.programme?.name || 'Not Assigned'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Level</span>
                                <p className="text-sm font-medium text-slate-900">{isK12 ? `Grade ${student.currentLevel}` : `Level ${student.currentLevel}`}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admission Year</span>
                                <p className="text-sm font-medium text-slate-900">{student.admissionYear || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">JAMB / Admission Number</span>
                                <p className="text-sm font-medium text-slate-900">{student.jambNumber || student.admissionNumber || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Info */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-600" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                                <p className="text-sm font-medium text-slate-900">{student.user?.email || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span>
                                <p className="text-sm font-medium text-slate-900">{student.user?.phone || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date of Birth</span>
                                <p className="text-sm font-medium text-slate-900">{student.dob || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gender</span>
                                <p className="text-sm font-medium text-slate-900 capitalize">{student.gender || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medical / Health Info */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-600" /> Medical & Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Droplet className="w-3 h-3" /> Blood Group</span>
                                <p className="text-sm font-medium text-slate-900">{student.bloodGroup || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Hash className="w-3 h-3" /> Genotype</span>
                                <p className="text-sm font-medium text-slate-900">{student.genotype || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Next of Kin / Guardian */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-indigo-600" /> Guardian / Next of Kin
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Guardian Name</span>
                                <p className="text-sm font-medium text-slate-900">{student.guardianName || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Guardian Phone</span>
                                <p className="text-sm font-medium text-slate-900">{student.guardianPhone || 'N/A'}</p>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Guardian Address</span>
                                <p className="text-sm font-medium text-slate-900">{student.guardianAddress || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
