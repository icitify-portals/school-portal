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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, User, Calculator, Download, Search, CheckSquare, ShieldCheck } from "lucide-react";
import { submitExamScores, publishCourseResults, toggleProration } from "@/actions/grading";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

interface StudentScore {
    studentId: number;
    enrollmentId: number;
    name: string;
    matricNumber: string | null;
    autoCA: number;
    manualCA: number;
    examScore: number;
    total: number;
    grade: string;
    isProrated: boolean;
}

interface Props {
    courseId: number;
    sessionId: number;
    semester: '1' | '2';
    students: StudentScore[];
}

export default function ScoreEntry({ courseId, sessionId, semester, students: initialStudents }: Props) {
    const router = useRouter();
    const [students, setStudents] = useState(initialStudents);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [selectedEnrollments, setSelectedEnrollments] = useState<number[]>([]);
    const [toggling, setToggling] = useState(false);

    const updateScore = (studentId: number, field: 'manualCA' | 'examScore', value: string) => {
        const numVal = parseFloat(value) || 0;
        setStudents(students.map(s => {
            if (s.studentId === studentId) {
                const newTotal = (field === 'manualCA' ? numVal : s.manualCA) + (field === 'examScore' ? numVal : s.examScore) + s.autoCA;
                return { ...s, [field]: numVal, total: newTotal };
            }
            return s;
        }));
    };

    const handlePublish = async () => {
        if (!confirm("Are you sure you want to publish these results? This will finalize grades and trigger GPA calculations for all students.")) return;

        setPublishing(true);
        const res = await publishCourseResults(courseId, sessionId, semester);
        if (res.success) {
            toast.success("Results published and GPA summaries updated!");
            router.refresh();
        } else {
            toast.error(res.error || "Failed to publish results");
        }
        setPublishing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const scores = students.map(s => ({
            enrollmentId: s.enrollmentId,
            caScore: s.autoCA + s.manualCA,
            examScore: s.examScore,
            studentId: s.studentId,
            courseId: courseId
        }));

        const res = await submitExamScores(sessionId, scores);
        if (res.success) {
            toast.success("Scores submitted successfully!");
        } else {
            toast.error(res.error || "Failed to submit scores");
        }
        setSaving(false);
    };

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.matricNumber?.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggleProration = async (enable: boolean) => {
        if (selectedEnrollments.length === 0) return;
        setToggling(true);
        const res = await toggleProration(selectedEnrollments, enable);
        if (res.success) {
            toast.success(`Proration ${enable ? 'enabled' : 'disabled'} for ${selectedEnrollments.length} students`);
            router.refresh();
            setSelectedEnrollments([]);
        } else {
            toast.error(res.error || "Failed to update proration");
        }
        setToggling(false);
    };

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedEnrollments(filtered.map(s => s.enrollmentId));
        } else {
            setSelectedEnrollments([]);
        }
    };

    const toggleOne = (enrollmentId: number, checked: boolean) => {
        if (checked) {
            setSelectedEnrollments([...selectedEnrollments, enrollmentId]);
        } else {
            setSelectedEnrollments(selectedEnrollments.filter(id => id !== enrollmentId));
        }
    };

    return (
        <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
                <div>
                    <CardTitle className="text-lg">Student Score Sheet</CardTitle>
                    <CardDescription>Enter examination scores and verify CA totals.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Filter students..."
                            className="pl-9 h-9 text-xs"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 mr-4 bg-slate-100 p-1 rounded-xl">
                        <Button 
                            onClick={() => handleToggleProration(true)} 
                            disabled={toggling || selectedEnrollments.length === 0}
                            size="sm" 
                            className="gap-2 bg-slate-900 border-none text-white h-7 text-[10px] uppercase font-black"
                        >
                            <ShieldCheck className="w-3 h-3" />
                            Enable Proration
                        </Button>
                        <Button 
                            onClick={() => handleToggleProration(false)} 
                            disabled={toggling || selectedEnrollments.length === 0}
                            size="sm" 
                            variant="outline"
                            className="h-7 text-[10px] uppercase font-black border-slate-200"
                        >
                            Disable
                        </Button>
                    </div>

                    <Button onClick={handlePublish} disabled={publishing || saving || toggling} variant="secondary" className="gap-2 font-bold h-9 bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                        <Calculator className="w-4 h-4" />
                        {publishing ? "Publishing..." : "Publish Results"}
                    </Button>
                    <Button onClick={handleSave} disabled={saving || publishing || toggling} size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 font-bold h-9">
                        <Save className="w-4 h-4" />
                        {saving ? "Processing..." : "Submit Results"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50/30">
                        <TableRow>
                            <TableHead className="w-[50px] text-center">
                                <Checkbox 
                                    checked={selectedEnrollments.length === filtered.length && filtered.length > 0}
                                    onChange={(e) => toggleAll(e.target.checked)}
                                />
                            </TableHead>
                            <TableHead className="w-[300px]">Student Info</TableHead>
                            <TableHead className="text-center">Auto CA</TableHead>
                            <TableHead className="text-center">Manual CA</TableHead>
                            <TableHead className="text-center font-bold text-indigo-700">Exam</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((s) => (
                            <TableRow key={s.studentId} className={s.isProrated ? "bg-amber-50/30" : ""}>
                                <TableCell className="text-center">
                                    <Checkbox 
                                        checked={selectedEnrollments.includes(s.enrollmentId)}
                                        onChange={(e) => toggleOne(s.enrollmentId, e.target.checked)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 relative">
                                            <User className="w-4 h-4" />
                                            {s.isProrated && <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow-sm" title="Prorated Grading" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-slate-900">{s.name}</p>
                                                {s.isProrated && <Badge className="text-[8px] h-4 bg-amber-100 text-amber-700 border-none hover:bg-amber-100">PRO-RATA</Badge>}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-mono">{s.matricNumber || "NO-MATRIC"}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-bold text-slate-700">{s.autoCA}</span>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-tighter">Aggregated</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Input
                                        type="number"
                                        value={s.manualCA}
                                        onChange={(e) => updateScore(s.studentId, 'manualCA', e.target.value)}
                                        className="h-8 w-16 mx-auto text-center font-bold text-xs bg-slate-50 border-none"
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                    <Input
                                        type="number"
                                        value={s.examScore}
                                        onChange={(e) => updateScore(s.studentId, 'examScore', e.target.value)}
                                        className="h-8 w-20 mx-auto text-center font-black text-sm bg-indigo-50 border-indigo-200 text-indigo-700 focus:ring-indigo-200"
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="font-black text-sm px-3 py-1 bg-slate-900 text-white border-none">
                                        {s.total}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={cn(
                                        "font-black text-lg",
                                        s.grade === 'F' ? "text-rose-600" : "text-emerald-600"
                                    )}>
                                        {s.grade}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {filtered.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No students found for this course.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
