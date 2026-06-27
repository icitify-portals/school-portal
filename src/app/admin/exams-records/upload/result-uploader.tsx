"use client";

import { useState } from "react";
import { UniversalImporter } from "@/components/UniversalImporter";
import { bulkUploadResults } from "@/actions/results_bulk";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export function ResultUploader({ courses, sessions }: { courses: any[], sessions: any[] }) {
    const [courseId, setCourseId] = useState<string>("");
    const [sessionId, setSessionId] = useState<string>("");

    const handleImport = async (data: any[]) => {
        if (!courseId || !sessionId) {
            return { success: false, error: "Please select both a course and an academic session before uploading." };
        }
        return await bulkUploadResults(data, parseInt(courseId), parseInt(sessionId));
    };

    return (
        <div className="space-y-6">
            <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-6 flex flex-col md:flex-row gap-6">
                    <div className="space-y-2 flex-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Target Course</label>
                        <Select value={courseId} onValueChange={setCourseId}>
                            <SelectTrigger className="bg-white text-slate-900 border-slate-200 h-12 rounded-xl">
                                <SelectValue placeholder="Select Course" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.code} - {c.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 flex-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Academic Session</label>
                        <Select value={sessionId} onValueChange={setSessionId}>
                            <SelectTrigger className="bg-white text-slate-900 border-slate-200 h-12 rounded-xl">
                                <SelectValue placeholder="Select Session" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className={!courseId || !sessionId ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                <UniversalImporter
                    title="Upload Results Data"
                    description="Drag and drop your CA and Exam scores CSV file. We will match students by Matric Number."
                    templateColumns={['matricNo', 'caScore', 'examScore']}
                    onImport={handleImport}
                />
            </div>
            
            {!courseId || !sessionId ? (
                <p className="text-center text-sm font-bold text-slate-400 mt-4">
                    ⚠️ Select a Course and Session to enable upload.
                </p>
            ) : null}
        </div>
    );
}
