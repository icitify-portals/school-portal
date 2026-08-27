"use client";

import { useState } from "react";
import { UniversalImporter } from "@/components/UniversalImporter";
import { bulkUploadResults, fetchCourseEnrollmentTemplate } from "@/actions/results_bulk";
import { Button } from "@/components/ui/button";
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
            <Card className="-200 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
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
                <div className="flex justify-end mb-4">
                    <Button 
                        onClick={async () => {
                            if (!courseId || !sessionId) return;
                            const res = await fetchCourseEnrollmentTemplate(parseInt(courseId), parseInt(sessionId));
                            if (!res.success || !res.data) {
                                alert(res.error || "Failed to generate template");
                                return;
                            }
                            
                            // Simple CSV generator
                            const headers = Object.keys(res.data[0]);
                            const csvContent = [
                                headers.join(","),
                                ...res.data.map((row: any) => headers.map(h => `"${row[h] || ''}"`).join(","))
                            ].join("\n");
                            
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.setAttribute("download", `Result_Template_Course_${courseId}_Session_${sessionId}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        disabled={!courseId || !sessionId}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold"
                    >
                        ⬇️ Download Pre-filled Template
                    </Button>
                </div>
                <UniversalImporter
                    title="Upload Results Data"
                    description="Drag and drop your completed CA and Exam scores CSV file."
                    templateColumns={['Matric No', 'Name', 'CA Score', 'Exam Score']}
                    onImport={handleImport}
                />
            </div>
            
            {!courseId || !sessionId ? (
                <p className="text-center text-sm font-bold text-slate-400 mt-4">
                    ⚠️ Select a Course and Session to enable template download and result upload.
                </p>
            ) : null}
        </div>
    );
}
