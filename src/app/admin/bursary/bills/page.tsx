
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    FileText,
    Loader2,
    Search,
    Printer,
    Download,
    CreditCard,
    AlertCircle,
    UserCircle,
    Users,
    Building2,
    Layers,
    ChevronRight,
    CheckCircle2
} from "lucide-react";
import {
    generateBillForStudent,
    generateBatchBills,
    getFeeStructures
} from "@/actions/bursary";
import { getStudents } from "@/actions/students";
import { getAcademicSessions } from "@/actions/portal";
import { getDepartments } from "@/actions/departments";
import { getProgrammes } from "@/actions/programmes";
import { cn } from "@/lib/utils";

export default function BursaryBillsPage() {
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [sessionsList, setSessionsList] = useState<any[]>([]);
    const [departmentsList, setDepartmentsList] = useState<any[]>([]);
    const [programmesList, setProgrammesList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Form State
    const [genMode, setGenMode] = useState<'single' | 'batch'>('single');
    const [batchScope, setBatchScope] = useState<'all' | 'department' | 'level' | 'programme'>('all');

    const [selectedStudent, setSelectedStudent] = useState("");
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [selectedProg, setSelectedProg] = useState("");

    const [billNote, setBillNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [resultData, setResultData] = useState<{ count: number, failed: number } | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        const [st, sess, depts, progs] = await Promise.all([
            getStudents(),
            getAcademicSessions(),
            getDepartments(),
            getProgrammes()
        ]);
        setStudentsList((st as any).data || []);
        setSessionsList(sess);
        setDepartmentsList(depts);
        setProgrammesList(progs);

        if (sess.length > 0) setSelectedSession(sess[0].id.toString());
        setLoading(false);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setResultData(null);

        if (!selectedSession) return alert("Select academic session");

        setSubmitting(true);
        try {
            if (genMode === 'single') {
                if (!selectedStudent) return alert("Select student");
                const res = await generateBillForStudent({
                    studentId: parseInt(selectedStudent),
                    sessionId: parseInt(selectedSession),
                    note: billNote
                });
                if (res.success) {
                    alert("Bill generated successfully!");
                    setIsGenerating(false);
                    setBillNote("");
                } else {
                    alert((res as any).error || "Failed to generate bill");
                }
            } else {
                const res = await generateBatchBills({
                    sessionId: parseInt(selectedSession),
                    scope: batchScope as any,
                    filters: {
                        deptId: selectedDept ? parseInt(selectedDept) : undefined,
                        level: selectedLevel ? parseInt(selectedLevel) : undefined,
                        programmeId: selectedProg ? parseInt(selectedProg) : undefined
                    },
                    note: billNote
                });

                if (res.success) {
                    setResultData({ count: res.count || 0, failed: res.failed || 0 });
                    setBillNote("");
                    // Don't close immediately so they can see the count
                } else {
                    alert(res.error || "Batch generation failed");
                }
            }
        } catch (err) {
            alert("An error occurred during generation");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">School Bills</h2>
                    <p className="text-slate-500 mt-1">Generate and manage student fee invoices</p>
                </div>
                <Button
                    onClick={() => {
                        setIsGenerating(!isGenerating);
                        setResultData(null);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/20 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    {isGenerating ? "Hide Form" : "Generate Billing"}
                </Button>
            </div>

            {isGenerating && (
                <Card className="mb-8 border-none shadow-xl bg-white ring-1 ring-slate-200">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold">Billing Interface</CardTitle>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setGenMode('single')}
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                                        genMode === 'single' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    Single Student
                                </button>
                                <button
                                    onClick={() => setGenMode('batch')}
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                                        genMode === 'batch' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    Batch Generation
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {resultData ? (
                            <div className="py-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Process Complete</h3>
                                <p className="text-slate-500 mt-2 max-w-sm">
                                    Successfully generated <span className="font-bold text-indigo-600">{resultData.count}</span> bills.
                                    {resultData.failed > 0 && ` ${resultData.failed} students were skipped or failed.`}
                                </p>
                                <Button
                                    onClick={() => { setIsGenerating(false); setResultData(null); }}
                                    className="mt-6 bg-slate-900 hover:bg-slate-800"
                                >
                                    Continue
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleGenerate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Academic Session</label>
                                        <select
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            value={selectedSession}
                                            onChange={(e) => setSelectedSession(e.target.value)}
                                        >
                                            <option value="">Choose Session...</option>
                                            {sessionsList.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {genMode === 'single' ? (
                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Select Student</label>
                                            <select
                                                required
                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                value={selectedStudent}
                                                onChange={(e) => setSelectedStudent(e.target.value)}
                                            >
                                                <option value="">Choose Student (ID/Name)...</option>
                                                {studentsList.map(s => (
                                                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.matricNumber || s.id})</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Batch Scope</label>
                                                <select
                                                    required
                                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    value={batchScope}
                                                    onChange={(e) => setBatchScope(e.target.value as any)}
                                                >
                                                    <option value="all">Entire School</option>
                                                    <option value="level">By Level</option>
                                                    <option value="department">By Department</option>
                                                    <option value="programme">By Programme</option>
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                {batchScope === 'all' && (
                                                    <div className="h-11 flex items-center px-4 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 text-xs font-medium">
                                                        Applying to all active students
                                                    </div>
                                                )}
                                                {batchScope === 'level' && (
                                                    <select
                                                        required
                                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        value={selectedLevel}
                                                        onChange={(e) => setSelectedLevel(e.target.value)}
                                                    >
                                                        <option value="">Select Level...</option>
                                                        {[100, 200, 300, 400, 500, 600, 700].map(l => (
                                                            <option key={l} value={l}>{l} Level</option>
                                                        ))}
                                                    </select>
                                                )}
                                                {batchScope === 'department' && (
                                                    <select
                                                        required
                                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        value={selectedDept}
                                                        onChange={(e) => setSelectedDept(e.target.value)}
                                                    >
                                                        <option value="">Select Department...</option>
                                                        {departmentsList.map(d => (
                                                            <option key={d.id} value={d.id}>{d.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                {batchScope === 'programme' && (
                                                    <select
                                                        required
                                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 h-11 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        value={selectedProg}
                                                        onChange={(e) => setSelectedProg(e.target.value)}
                                                    >
                                                        <option value="">Select Programme...</option>
                                                        {programmesList.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Important Notes (appears on bill)</label>
                                    <textarea
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 min-h-[100px] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="e.g. Please pay by the end of the first week of lectures. Late fees apply after..."
                                        value={billNote}
                                        onChange={(e) => setBillNote(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsGenerating(false)} className="text-slate-500">Cancel</Button>
                                    <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 px-8 h-11 rounded-xl gap-2 transition-all">
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing Batch...
                                            </>
                                        ) : (
                                            <>
                                                {genMode === 'batch' ? <Users className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                {genMode === 'batch' ? "Run Mass Billing" : "Generate Billing"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6">
                <Card className="border-none shadow-sm overflow-hidden bg-white ring-1 ring-slate-200">
                    <CardHeader className="bg-slate-50/50 flex flex-row justify-between items-center border-b border-slate-100">
                        <CardTitle className="text-lg font-bold text-slate-800">Operational Log</CardTitle>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 w-64 outline-none transition-all"
                                placeholder="Filter bill history..."
                            />
                        </div>
                    </CardHeader>
                    <div className="p-12 text-center text-slate-400 italic">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50">
                            <FileText className="w-8 h-8" />
                        </div>
                        <p className="font-medium text-slate-600">History Log Accessible Below</p>
                        <p className="text-sm mt-1">Visit the "Finance Ledger" for per-student detailed audit trails.</p>
                        <div className="flex justify-center gap-4 mt-8 opacity-40">
                            <Building2 className="w-5 h-5" />
                            <Layers className="w-5 h-5" />
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
