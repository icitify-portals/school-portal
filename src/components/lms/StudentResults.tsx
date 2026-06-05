"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronDown,
    ChevronRight,
    Download,
    BookOpen,
    GraduationCap,
    Award,
    Calendar,
    FileText
} from "lucide-react";
import { DocumentService } from "@/services/DocumentService";
import { cn } from "@/lib/utils";

interface SemesterData {
    number: string;
    gpa: number;
    tcr: number;
    tce: number;
    courses: {
        code: string;
        title: string;
        units: number;
        score: number;
        grade: string;
        gp: number;
    }[];
}

interface SessionData {
    name: string;
    semesters: SemesterData[];
}

interface Props {
    student: {
        name: string;
        matricNumber: string;
        department: string;
        level: number;
        programme: string;
        unitId?: number;
        academicTier?: string;
    };
    sessions: SessionData[];
    cgpa: number;
    branding: { name: string; motto: string; logoUrl?: string };
    signatures?: {
        registrar?: { name: string; signatureUrl?: string };
        head?: { name: string; signatureUrl?: string };
    };
}

export default function StudentResults({ student, sessions, cgpa, branding, signatures }: Props) {
    const [expandedSession, setExpandedSession] = useState<string | null>(sessions[0]?.name || null);

    const downloadResultSlip = (sessionName: string, semester: SemesterData) => {
        const isTertiary = student.academicTier === 'tertiary' || student.level >= 100;
        DocumentService.generateResultSlip({
            institution: branding,
            student,
            session: sessionName,
            semester: semester.number,
            results: semester.courses,
            summary: {
                gpa: semester.gpa,
                cgpa: cgpa,
                tcr: semester.tcr,
                tce: semester.tce
            },
            unitId: student.unitId,
            headSignature: signatures?.head,
            templateCode: isTertiary ? 'tertiary_semester' : undefined
        });
    };

    const downloadTranscript = () => {
        DocumentService.generateTranscript({
            institution: branding,
            student,
            sessions: sessions.map(s => ({
                name: s.name,
                semesters: s.semesters.map(sem => ({
                    number: sem.number,
                    results: sem.courses,
                    summary: { gpa: sem.gpa, tcr: sem.tcr, tce: sem.tce }
                }))
            })),
            finalCgpa: cgpa,
            unitId: student.unitId,
            registrarSignature: signatures?.registrar
        });
    };

    return (
        <div className="space-y-8">
            {/* Header Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-indigo-600 text-white shadow-xl shadow-indigo-100 border-none">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-xl">
                            <GraduationCap className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white/70">Cumulative GPA</p>
                            <h2 className="text-4xl font-black">{cgpa.toFixed(2)}</h2>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                            <Award className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Academic Standing</p>
                            <h2 className="text-2xl font-bold text-slate-800">
                                {cgpa >= 3.5 ? "First Class" : cgpa >= 3.0 ? "Upper Second" : "Active"}
                            </h2>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-100 shadow-sm flex items-center justify-center">
                    <Button
                        onClick={downloadTranscript}
                        variant="outline"
                        className="h-full w-full border-2 border-dashed border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all font-bold gap-3"
                    >
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Download Full Transcript
                    </Button>
                </Card>
            </div>

            {/* Sessions List */}
            <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Semester Breakdown
                </h3>

                {sessions.map((session) => (
                    <div key={session.name} className="space-y-2">
                        <button
                            onClick={() => setExpandedSession(expandedSession === session.name ? null : session.name)}
                            className={cn(
                                "w-full flex items-center justify-between p-4 rounded-xl transition-all border",
                                expandedSession === session.name
                                    ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            <span className="font-bold text-lg">{session.name} Academic Session</span>
                            {expandedSession === session.name ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                        </button>

                        {expandedSession === session.name && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2 animate-in slide-in-from-top-2">
                                {session.semesters.map((sem) => (
                                    <Card key={sem.number} className="overflow-hidden border-slate-200">
                                        <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between py-4">
                                            <div>
                                                <CardTitle className="text-base font-bold">Semester {sem.number}</CardTitle>
                                                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-indigo-600">
                                                    GPA: {sem.gpa.toFixed(2)}
                                                </CardDescription>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => downloadResultSlip(session.name, sem)}
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="max-h-[300px] overflow-y-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-[10px] text-slate-500 uppercase font-black bg-slate-50/50">
                                                        <tr>
                                                            <th className="px-4 py-2">Course</th>
                                                            <th className="px-4 py-2 text-center">Units</th>
                                                            <th className="px-4 py-2 text-center">Score</th>
                                                            <th className="px-4 py-2 text-center">Grade</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {sem.courses.map((course) => (
                                                            <tr key={course.code} className="hover:bg-slate-50/30">
                                                                <td className="px-4 py-3">
                                                                    <p className="font-bold text-slate-900 leading-tight">{course.code}</p>
                                                                    <p className="text-[10px] text-slate-500 line-clamp-1">{course.title}</p>
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-medium text-slate-600">{course.units}</td>
                                                                <td className="px-4 py-3 text-center font-bold text-slate-700">{course.score}</td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className={cn(
                                                                        "font-black",
                                                                        course.grade === 'F' ? "text-rose-500" : "text-emerald-500"
                                                                    )}>
                                                                        {course.grade}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {sessions.length === 0 && (
                    <div className="p-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                        <BookOpen className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">No available results.</h3>
                        <p className="text-slate-300">Your results will appear here once they are published by the department.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
