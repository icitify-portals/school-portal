"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ScoreEntry from "@/components/lms/ScoreEntry";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Since we need to fetch students with their existing scores, we'll use a small client-side fetcher or a server action
import { getStudentsForSubjectGrading } from "@/actions/grading"; 

export default function SubjectEntryPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    
    const courseId = parseInt(params.courseId as string);
    const groupId = parseInt(params.groupId as string);
    const sessionId = parseInt(searchParams.get("sessionId") || "0");
    const term = searchParams.get("term") || "1";

    const [studentData, setStudentData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (courseId && groupId && sessionId) {
            loadStudents();
        }
    }, [courseId, groupId, sessionId, term]);

    const loadStudents = async () => {
        setLoading(true);
        // We call the existing grading action logic
        const data = await getStudentsForSubjectGrading(courseId, sessionId, term as any, groupId);
        setStudentData(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading class list...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/staff/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-black text-slate-900 uppercase">Subject Grading Entry</h1>
            </div>

            <ScoreEntry 
                courseId={courseId}
                sessionId={sessionId}
                semester={term as any}
                students={studentData}
            />
        </div>
    );
}
