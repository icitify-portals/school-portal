"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Save, 
    ChevronLeft, 
    ChevronRight, 
    Users, 
    CalendarCheck, 
    Smile, 
    MessageSquare,
    Loader2,
    CheckCircle2,
    ArrowRight,
    Square,
    CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
    getStudentsInClass, 
    getAffectiveTraits, 
    saveBehavioralScores, 
    saveReportRemarks,
    getSchoolSchedule 
} from "@/actions/teachers";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Student {
    id: number;
    firstName: string | null;
    lastName: string | null;
    matricNumber: string | null;
}

interface Trait {
    id: number;
    name: string;
    category: 'affective' | 'psychomotor';
}

interface Props {
    groupId: number;
    sessionId: number;
    term: '1' | '2' | '3';
    staffId: number;
    initialStudentId?: number;
}

export default function ClassPerformanceEntry({ groupId, sessionId, term, staffId, initialStudentId }: Props) {
    const [students, setStudents] = useState<Student[]>([]);
    const [traits, setTraits] = useState<Trait[]>([]);
    const [schedule, setSchedule] = useState<any>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [bulkMode, setBulkMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [present, setPresent] = useState<string>("");
    const [absent, setAbsent] = useState<string>("");
    const [scores, setScores] = useState<Record<number, number>>({});
    const [comment, setComment] = useState("");

    useEffect(() => {
        fetchData();
    }, [groupId, sessionId, term]);

    const fetchData = async () => {
        setLoading(true);
        const [studentList, traitList, scheduleData] = await Promise.all([
            getStudentsInClass(groupId),
            getAffectiveTraits(),
            getSchoolSchedule(sessionId, term)
        ]);
        setStudents(studentList);
        setTraits(traitList);
        setSchedule(scheduleData);

        if (initialStudentId) {
            const index = studentList.findIndex(s => s.id === initialStudentId);
            if (index !== -1) setCurrentIndex(index);
        }
        setLoading(false);
    };

    const currentStudent = students[currentIndex];

    // Attendance calculation logic
    const handlePresentChange = (val: string) => {
        setPresent(val);
        if (schedule?.daysOpen && val) {
            const p = parseInt(val);
            if (!isNaN(p)) setAbsent((schedule.daysOpen - p).toString());
        }
    };

    const handleAbsentChange = (val: string) => {
        setAbsent(val);
        if (schedule?.daysOpen && val) {
            const a = parseInt(val);
            if (!isNaN(a)) setPresent((schedule.daysOpen - a).toString());
        }
    };

    const handleSave = async () => {
        const targetStudentIds = bulkMode ? selectedStudents : [currentStudent.id];
        if (targetStudentIds.length === 0) return toast.error("Select at least one student");
        
        setSaving(true);
        try {
            const batchBehavioral: any[] = [];
            const batchRemarks: any[] = [];

            targetStudentIds.forEach(id => {
                Object.entries(scores).forEach(([traitId, score]) => {
                    batchBehavioral.push({
                        studentId: id,
                        traitId: parseInt(traitId),
                        sessionId,
                        term,
                        score,
                        recordedBy: staffId
                    });
                });

                batchRemarks.push({
                    studentId: id,
                    sessionId,
                    term,
                    classTeacherComment: comment,
                    daysPresent: parseInt(present) || 0,
                    daysAbsent: parseInt(absent) || 0,
                    daysOpen: schedule?.daysOpen || 0,
                    recordedBy: staffId
                });
            });

            await Promise.all([
                saveBehavioralScores(batchBehavioral),
                ...batchRemarks.map(r => saveReportRemarks(r))
            ]);

            toast.success(`Records saved for ${targetStudentIds.length} student(s)`);
            
            // Move to next student if not in bulk mode
            if (!bulkMode && currentIndex < students.length - 1) {
                setCurrentIndex(currentIndex + 1);
                // Clear inputs for next student
                setPresent("");
                setAbsent("");
                setScores({});
                setComment("");
            } else if (bulkMode) {
                setSelectedStudents([]);
            }
        } catch (error) {
            toast.error("Failed to save records");
        } finally {
            setSaving(false);
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedStudents(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] shadow-sm">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading class records...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Student List - Left Sidebar */}
            <Card className="lg:col-span-3 border-none shadow-sm h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            Student List
                        </CardTitle>
                        <CardDescription>{students.length} students enrolled</CardDescription>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("text-[10px] font-black uppercase tracking-widest", bulkMode ? "text-indigo-600" : "text-slate-400")}
                        onClick={() => setBulkMode(!bulkMode)}
                    >
                        {bulkMode ? "Individual Mode" : "Bulk Mode"}
                    </Button>
                </CardHeader>
                {bulkMode && (
                    <div className="p-4 border-b border-slate-100 bg-indigo-50/30 flex justify-between items-center">
                        <span className="text-[10px] font-black text-indigo-600">
                            {selectedStudents.length} SELECTED
                        </span>
                        <Button variant="ghost" size="sm" className="text-[10px] font-bold" onClick={selectAll}>
                            {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                        </Button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {students.map((s, idx) => (
                        <div
                            key={s.id}
                            className={cn(
                                "relative w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group cursor-pointer",
                                !bulkMode && currentIndex === idx 
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                                    : bulkMode && selectedStudents.includes(s.id)
                                        ? "bg-indigo-50 border-indigo-200 border-2"
                                        : "hover:bg-indigo-50 bg-white border border-slate-100"
                            )}
                            onClick={() => bulkMode ? toggleSelection(s.id) : setCurrentIndex(idx)}
                        >
                            <div className="flex items-center gap-3">
                                {bulkMode && (
                                    <Checkbox 
                                        checked={selectedStudents.includes(s.id)}
                                        onChange={() => toggleSelection(s.id)}
                                        className="border-slate-300 rounded cursor-pointer"
                                    />
                                )}
                                <div>
                                    <p className="font-bold text-sm">{s.lastName}, {s.firstName}</p>
                                    <p className={cn("text-[10px] font-mono", !bulkMode && currentIndex === idx ? "text-white/70" : "text-slate-400")}>
                                        {s.matricNumber}
                                    </p>
                                </div>
                            </div>
                            {!bulkMode && currentIndex === idx && <ArrowRight className="w-4 h-4" />}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Entry Form - Main Content */}
            <div className="lg:col-span-9 space-y-6">
                {/* Header Information */}
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl">
                            {bulkMode ? <CheckSquare className="w-8 h-8" /> : (currentStudent?.lastName?.[0] || "?")}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase">
                                {bulkMode ? `${selectedStudents.length} Students Selected` : `${currentStudent?.firstName || ""} ${currentStudent?.lastName || ""}`}
                            </h2>
                            <p className="text-sm font-medium text-slate-500">
                                {bulkMode ? "Bulk Entry Mode - Changes apply to all selected" : "Individual Entry Mode"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Attendance & Comments */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CalendarCheck className="w-5 h-5 text-indigo-600" />
                                    Attendance
                                </CardTitle>
                                <CardDescription>School Days Opened: <span className="font-bold text-slate-900">{schedule?.daysOpen || "Not Set"}</span></CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Times Present</Label>
                                        <Input 
                                            type="number" 
                                            placeholder="0" 
                                            value={present}
                                            onChange={(e) => handlePresentChange(e.target.value)}
                                            className="rounded-xl h-12 border-slate-100 focus:ring-indigo-600" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Times Absent</Label>
                                        <Input 
                                            type="number" 
                                            placeholder="0"
                                            value={absent}
                                            onChange={(e) => handleAbsentChange(e.target.value)}
                                            className="rounded-xl h-12 border-slate-100 focus:ring-indigo-600"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                                    Teacher's Comment
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                    className="min-h-[150px] rounded-2xl border-slate-100 p-4 focus:ring-indigo-600"
                                    placeholder="Enter academic and behavioral remarks for the term..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Behavioral Traits */}
                    <Card className="border-none shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Smile className="w-5 h-5 text-indigo-600" />
                                Behavioral Evaluation
                            </CardTitle>
                            <CardDescription>Rate student behavior on a scale of 1-5</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {['affective', 'psychomotor'].map((cat) => (
                                <div key={cat} className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                                        {cat} Traits
                                    </h4>
                                    <div className="space-y-4">
                                        {traits.filter(t => t.category === cat).map(trait => (
                                            <div key={trait.id} className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-bold text-slate-700">{trait.name}</span>
                                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                        Score: {scores[trait.id] || "0"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-1">
                                                    {[1, 2, 3, 4, 5].map(v => (
                                                        <button
                                                            key={v}
                                                            onClick={() => setScores({...scores, [trait.id]: v})}
                                                            className={cn(
                                                                "h-10 flex-1 rounded-lg font-bold text-sm transition-all",
                                                                scores[trait.id] === v 
                                                                    ? "bg-indigo-600 text-white" 
                                                                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                            )}
                                                        >
                                                            {v}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-between items-center pt-8">
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="gap-2 rounded-xl h-12 px-6 font-bold border-slate-200"
                            disabled={currentIndex === 0}
                            onClick={() => setCurrentIndex(currentIndex - 1)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2 rounded-xl h-12 px-6 font-bold border-slate-200"
                            disabled={currentIndex === students.length - 1}
                            onClick={() => setCurrentIndex(currentIndex + 1)}
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    <Button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl h-12 px-10 font-black shadow-xl shadow-indigo-600/20"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save & Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
