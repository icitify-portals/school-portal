"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, MoreHorizontal, Edit2, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGradebookScores } from "@/actions/course-gradebook";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StudentGrade {
    studentId: number;
    fullName: string;
    regNo: string;
    caScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
    status: string;
}

export default function GradebookTable({
    initialStudents,
    courseId,
    sessionId
}: {
    initialStudents: StudentGrade[],
    courseId: number,
    sessionId: number
}) {
    const [students, setStudents] = useState(initialStudents);
    const [editingRow, setEditingRow] = useState<number | null>(null);
    const [editData, setEditData] = useState<{ caScore: string; examScore: string }>({ caScore: "", examScore: "" });
    const [saving, setSaving] = useState(false);

    const handleEdit = (student: StudentGrade) => {
        setEditingRow(student.studentId);
        setEditData({
            caScore: student.caScore.toString(),
            examScore: student.examScore.toString()
        });
    };

    const handleCancel = () => {
        setEditingRow(null);
    };

    const handleSave = async (studentId: number) => {
        setSaving(true);
        const ca = parseFloat(editData.caScore) || 0;
        const exam = parseFloat(editData.examScore) || 0;

        const res = await updateGradebookScores(courseId, sessionId, [{
            studentId,
            caScore: ca,
            examScore: exam
        }]);

        if (res.success) {
            toast.success("Grade updated successfully");
            setStudents(prev => prev.map(s => s.studentId === studentId ? {
                ...s,
                caScore: ca,
                examScore: exam,
                totalScore: ca + exam,
                grade: calculateGrade(ca + exam)
            } : s));
            setEditingRow(null);
        } else {
            toast.error(res.error || "Failed to update grade");
        }
        setSaving(false);
    };

    const calculateGrade = (total: number) => {
        if (total >= 70) return 'A';
        if (total >= 60) return 'B';
        if (total >= 50) return 'C';
        if (total >= 45) return 'D';
        if (total >= 40) return 'E';
        return 'F';
    };

    return (
        <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow>
                    <TableHead className="w-[300px] pl-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Identity</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">CA Score (40)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Exam Score (60)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Total (100)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Grade</TableHead>
                    <TableHead className="text-right pr-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.map((student) => {
                    const isEditing = editingRow === student.studentId;
                    const isFailing = student.totalScore < 40;

                    return (
                        <TableRow key={student.studentId} className={cn(
                            "hover:bg-slate-50/50 transition-colors border-b border-slate-50",
                            isFailing && !isEditing && "bg-rose-50/30"
                        )}>
                            <TableCell className="pl-8 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-slate-100">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{student.fullName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student.regNo}</p>
                                    </div>
                                    {isFailing && !isEditing && (
                                        <Badge className="bg-rose-100 text-rose-600 hover:bg-rose-200 border-none h-5 px-1.5 flex gap-1">
                                            <AlertTriangle className="w-3 h-3" /> <span className="text-[8px] font-black uppercase tracking-tight">At Risk</span>
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>

                            <TableCell className="text-center">
                                {isEditing ? (
                                    <Input
                                        type="number"
                                        className="h-9 w-20 mx-auto text-center font-bold text-xs rounded-lg border-2 border-indigo-100 focus:border-indigo-500"
                                        value={editData.caScore}
                                        onChange={(e) => setEditData({ ...editData, caScore: e.target.value })}
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-slate-600">{student.caScore.toFixed(1)}</span>
                                )}
                            </TableCell>

                            <TableCell className="text-center">
                                {isEditing ? (
                                    <Input
                                        type="number"
                                        className="h-9 w-20 mx-auto text-center font-bold text-xs rounded-lg border-2 border-indigo-100 focus:border-indigo-500"
                                        value={editData.examScore}
                                        onChange={(e) => setEditData({ ...editData, examScore: e.target.value })}
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-slate-600">{student.examScore.toFixed(1)}</span>
                                )}
                            </TableCell>

                            <TableCell className="text-center font-black text-slate-900">
                                <span className={cn(
                                    "text-sm uppercase italic",
                                    isFailing ? "text-rose-600" : "text-indigo-600"
                                )}>
                                    {student.totalScore.toFixed(1)}
                                </span>
                            </TableCell>

                            <TableCell className="text-center">
                                <Badge className={cn(
                                    "rounded-lg font-black uppercase px-3 py-1",
                                    student.grade === 'A' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none" :
                                        student.grade === 'F' ? "bg-rose-100 text-rose-700 hover:bg-rose-100 border-none" :
                                            "bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none"
                                )}>
                                    {student.grade}
                                </Badge>
                            </TableCell>

                            <TableCell className="text-right pr-8">
                                {isEditing ? (
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleSave(student.studentId)}
                                            disabled={saving}
                                            className="h-8 bg-emerald-500 hover:bg-emerald-600 rounded-lg px-2 group"
                                        >
                                            <Check className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleCancel}
                                            className="h-8 hover:bg-rose-50 rounded-lg px-2 group"
                                        >
                                            <X className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-all font-bold" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(student)}
                                        className="h-9 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all rounded-xl font-bold uppercase text-[9px] tracking-widest px-4"
                                    >
                                        <Edit2 className="w-3.5 h-3.5 mr-2" /> Quick Edit
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
