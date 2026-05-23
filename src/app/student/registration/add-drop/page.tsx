"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Trash2,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    BookOpen,
    Search
} from "lucide-react";
import { toast } from "sonner";
import {
    submitAddDropRequest
} from "@/actions/registration";
import { getCurrentSession } from "@/actions/portal";
import { getStudentProfile } from "@/actions/students";
import { getAvailableCourses } from "@/actions/courses";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function StudentAddDropPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [student, setStudent] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [availableCourses, setAvailableCourses] = useState<any[]>([]);
    const [registeredCourses, setRegisteredCourses] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sessionData, studentData] = await Promise.all([
                getCurrentSession(),
                getStudentProfile()
            ]);

            setSession(sessionData);
            setStudent(studentData);

            if (studentData) {
                const courses = await getAvailableCourses((studentData as any).deptId, (studentData as any).level);
                setAvailableCourses(courses);
                // Assume studentData has enrollments or fetch them
                setRegisteredCourses((studentData as any).enrollments || []);
            }
        } catch (error) {
            toast.error("Failed to load registration data");
        }
        setLoading(false);
    };

    const handleRequest = async (courseId: number, type: 'add' | 'remove') => {
        if (!confirm(`Are you sure you want to request to ${type} this course?`)) return;

        setSubmitting(true);
        const res = await submitAddDropRequest(student.id, courseId, type);
        if (res.success) {
            toast.success(res.message);
            loadData();
        } else {
            toast.error(res.error);
        }
        setSubmitting(false);
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>;

    if (!session?.isAddDropOpen) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-rose-50">
                    <CardContent className="p-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-rose-100">
                            <Clock className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-rose-900 italic uppercase">Add/Drop Window Closed</h2>
                        <p className="text-rose-700 font-bold max-w-md mx-auto">
                            The academic session's Add/Drop window is currently closed. Please contact your department or the registrar for more information.
                        </p>
                        <Button
                            onClick={() => window.history.back()}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-black px-8 py-6 rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-rose-200"
                        >
                            Return to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const filteredCourses = availableCourses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic uppercase">
                    <BookOpen className="w-10 h-10 text-indigo-600" />
                    Add / Drop Courses
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">
                    {session?.name} Session • {session?.currentSemester === '1' ? 'First' : 'Second'} Semester
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Courses */}
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 bg-slate-900 text-white">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl font-black italic uppercase">Available Courses</CardTitle>
                            <div className="relative w-48">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search..."
                                    className="bg-white/10 border-none text-white text-xs rounded-xl pl-9 focus:ring-indigo-500 placeholder:text-slate-500 font-bold"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 max-h-[600px] overflow-y-auto space-y-4">
                        {filteredCourses.map((course) => {
                            const isRegistered = registeredCourses.some(r => r.courseId === course.id);
                            return (
                                <div key={course.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center transition-all hover:shadow-lg hover:scale-[1.01]">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">{course.code}</p>
                                        <h3 className="font-black text-slate-900 italic">{course.name}</h3>
                                        <p className="text-xs text-slate-500 font-bold mt-1">{course.units} Units</p>
                                    </div>
                                    {isRegistered ? (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-none px-4 py-2 rounded-xl flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Registered
                                        </Badge>
                                    ) : (
                                        <Button
                                            onClick={() => handleRequest(course.id, 'add')}
                                            disabled={submitting}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-4 rounded-xl shadow-lg shadow-indigo-100 flex gap-2 uppercase text-[10px] tracking-widest"
                                        >
                                            <Plus className="w-4 h-4" /> Add
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Registered/Requested Courses */}
                <div className="space-y-8">
                    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 bg-indigo-600 text-white">
                            <CardTitle className="text-xl font-black italic uppercase">Currently Registered</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {registeredCourses.length === 0 && (
                                <p className="text-center py-8 text-slate-400 font-bold italic">No courses registered for this semester</p>
                            )}
                            {registeredCourses.map((reg) => (
                                <div key={reg.id} className="p-6 bg-white rounded-[2rem] border-2 border-slate-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">{reg.course?.code}</p>
                                        <h3 className="font-black text-slate-900 italic">{reg.course?.name}</h3>
                                        <p className="text-xs text-slate-500 font-bold mt-1">{reg.course?.units} Units</p>
                                    </div>
                                    <Button
                                        onClick={() => handleRequest(reg.courseId, 'remove')}
                                        disabled={submitting}
                                        variant="outline"
                                        className="border-rose-200 text-rose-500 hover:bg-rose-50 font-black px-4 py-4 rounded-xl flex gap-2 uppercase text-[10px] tracking-widest transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" /> Drop
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Pending Requests */}
                    {student?.addDropRequests?.some((r: any) => r.status === 'pending') && (
                        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden border-2 border-amber-100">
                            <CardHeader className="p-8 bg-amber-500 text-white">
                                <CardTitle className="text-xl font-black italic uppercase flex items-center gap-3">
                                    <Clock className="w-6 h-6" />
                                    Pending Requests
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {student.addDropRequests.filter((r: any) => r.status === 'pending').map((req: any) => (
                                    <div key={req.id} className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">
                                                Request: {req.type.toUpperCase()}
                                            </p>
                                            <h3 className="font-black text-slate-900 italic">{req.course?.name}</h3>
                                            <p className="text-xs text-slate-500 font-bold mt-1">Submitted at {new Date(req.requestedAt).toLocaleDateString()}</p>
                                        </div>
                                        <Badge className="bg-amber-100 text-amber-700 border-none px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest">
                                            Awaiting Approval
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
