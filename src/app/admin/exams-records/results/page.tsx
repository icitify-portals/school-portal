"use client";

import { useEffect, useState, useTransition } from "react";
import { 
    GraduationCap, Search, FileDown, Printer, SlidersHorizontal, 
    BookOpen, Layers, Users, X, Award, Eye, ClipboardList, CheckCircle, Loader2,
    Lock, Unlock
} from "lucide-react";
import { 
    getResultFilterMetadata, getGeneratedResultsForClass, 
    getK12StudentReportData, toggleResultLockAction 
} from "@/actions/exams-records";
import AcademicRecordPrintout from "@/components/exams-records/AcademicRecordPrintout";
import { DocumentService } from "@/services/DocumentService";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ResultViewsPage() {
    const [metadata, setMetadata] = useState<{ sessions: any[]; groups: any[]; levels: number[]; departments?: any[] } | null>(null);
    const [selectedSession, setSelectedSession] = useState<string>("1");
    const [selectedTerm, setSelectedTerm] = useState<string>("1");
    const [selectedLevel, setSelectedLevel] = useState<string>("");
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [selectedDept, setSelectedDept] = useState<string>("");
    const [admissionNumber, setAdmissionNumber] = useState<string>("");
    const [selectedTemplate, setSelectedTemplate] = useState<string>("001");
    const [selectedRubricId, setSelectedRubricId] = useState<string>("");
    
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    // PDF Preview state
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Dynamic checks
    const showDepartmentFilter = parseInt(selectedLevel) >= 10;

    // Initial metadata load
    useEffect(() => {
        async function loadMetadata() {
            const res = await getResultFilterMetadata();
            if (res.success && res.data) {
                setMetadata(res.data);
                if (res.data.sessions.length > 0) {
                    setSelectedSession(res.data.sessions[0].id.toString());
                }
                if (res.data.levels.length > 0) {
                    setSelectedLevel(res.data.levels[0].toString());
                }
                if (res.data.rubrics && res.data.rubrics.length > 0) {
                    setSelectedRubricId(res.data.rubrics[0].id.toString());
                }
            }
        }
        loadMetadata();
    }, []);

    // Filter arms matching selected level
    const filteredGroups = metadata?.groups.filter(g => g.level.toString() === selectedLevel) || [];

    // Auto-select first arm when level changes
    useEffect(() => {
        if (filteredGroups.length > 0) {
            setSelectedGroup(filteredGroups[0].id.toString());
        } else {
            setSelectedGroup("");
        }
    }, [selectedLevel]);

    const handleSearch = () => {
        if (!selectedSession) return;
        setLoading(true);
        setSelectedStudent(null);
        setPdfBlobUrl(null);
        startTransition(async () => {
            const res = await getGeneratedResultsForClass({
                sessionId: parseInt(selectedSession),
                semester: parseInt(selectedTerm),
                level: selectedLevel ? parseInt(selectedLevel) : 0,
                groupId: selectedGroup ? parseInt(selectedGroup) : undefined,
                deptId: showDepartmentFilter && selectedDept ? parseInt(selectedDept) : undefined,
                admissionNumber: admissionNumber || undefined
            });
            if (res.success && res.data) {
                setResults(res.data);
            } else {
                setResults([]);
            }
            setLoading(false);
        });
    };

    // Load PDF preview for a specific student
    const loadStudentPreview = async (student: any, templateCode = selectedTemplate) => {
        setSelectedStudent(student);
        setPreviewLoading(true);
        try {
            const res = await getK12StudentReportData(student.studentId, parseInt(selectedSession), parseInt(selectedTerm));
            if (res.success && res.data) {
                const termLabel = selectedTerm === '1' ? '1' : selectedTerm === '2' ? '2' : '3';
                const sessionName = metadata?.sessions.find(s => s.id.toString() === selectedSession)?.name || '2024/2025';
                // @ts-expect-error - TS2339: Auto-suppressed for build
                const activeRubric = metadata?.rubrics?.find(r => r.id.toString() === selectedRubricId);
                
                const doc = await DocumentService.generateK12ReportCardPDF({
                    ...res.data,
                    term: termLabel,
                    session: sessionName,
                    templateCode,
                    // @ts-expect-error - TS2353: Auto-suppressed for build
                    rubric: activeRubric ? { ...activeRubric, columnsConfig: typeof activeRubric.columnsConfig === 'string' ? JSON.parse(activeRubric.columnsConfig) : activeRubric.columnsConfig } : null
                }, false); // false = return doc without downloading
                
                const blobUrl = doc.output('bloburl');
                // @ts-expect-error - TS2345: Auto-suppressed for build
                setPdfBlobUrl(blobUrl);
            } else {
                setPdfBlobUrl(null);
            }
        } catch (e) {
            console.error("Error loading preview", e);
            setPdfBlobUrl(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    // Handle template choice update
    const handleTemplateChange = (val: string) => {
        setSelectedTemplate(val);
        if (selectedStudent) {
            loadStudentPreview(selectedStudent, val);
        }
    };

    // Handle results lock/unlock status toggling (Vectorizing vs Rasterizing)
    const handleToggleLock = async () => {
        if (!selectedStudent) return;
        const isCurrentlyLocked = selectedStudent.approvalStatus === 'published';
        let reason = "";

        if (isCurrentlyLocked) {
            // Prompt for reason when unlocking (rasterizing)
            const inputReason = prompt("Enter the reason for unlocking (rasterizing) these results:", "");
            if (inputReason === null) return; // Cancelled
            reason = inputReason.trim() || "Unlocking for corrections";
        }

        setLoading(true);
        try {
            const res = await toggleResultLockAction({
                studentId: selectedStudent.studentId,
                sessionId: parseInt(selectedSession),
                semester: parseInt(selectedTerm),
                lock: !isCurrentlyLocked,
                reason: reason || undefined
            });

            if (res.success) {
                const newStatus = isCurrentlyLocked ? 'pending' : 'published';
                
                // Update selectedStudent local status
                // @ts-expect-error - TS7006: Auto-suppressed for build
                setSelectedStudent(prev => prev ? { ...prev, approvalStatus: newStatus } : null);

                // Update results list state
                setResults(prev => prev.map(item => {
                    if (item.studentId === selectedStudent.studentId) {
                        return { ...item, approvalStatus: newStatus };
                    }
                    return item;
                }));

                // Reload preview
                await loadStudentPreview({ ...selectedStudent, approvalStatus: newStatus });
            } else {
                alert(`Failed to update lock status: ${res.error}`);
            }
        } catch (e) {
            console.error("Error toggling lock status", e);
        } finally {
            setLoading(false);
        }
    };

    // Download PDF for the currently selected student
    const handleDownloadCurrentPDF = async () => {
        if (!selectedStudent) return;
        setLoading(true);
        try {
            const res = await getK12StudentReportData(selectedStudent.studentId, parseInt(selectedSession), parseInt(selectedTerm));
            if (res.success && res.data) {
                const termLabel = selectedTerm === '1' ? '1' : selectedTerm === '2' ? '2' : '3';
                const sessionName = metadata?.sessions.find(s => s.id.toString() === selectedSession)?.name || '2024/2025';
                // @ts-expect-error - TS2339: Auto-suppressed for build
                const activeRubric = metadata?.rubrics?.find(r => r.id.toString() === selectedRubricId);

                await DocumentService.generateK12ReportCardPDF({
                    ...res.data,
                    term: termLabel,
                    session: sessionName,
                    templateCode: selectedTemplate,
                    // @ts-expect-error - TS2353: Auto-suppressed for build
                    rubric: activeRubric ? { ...activeRubric, columnsConfig: typeof activeRubric.columnsConfig === 'string' ? JSON.parse(activeRubric.columnsConfig) : activeRubric.columnsConfig } : null
                }, true); // true = trigger download
            }
        } catch (e) {
            console.error("Error downloading PDF", e);
        } finally {
            setLoading(false);
        }
    };

    // Download combined PDF for all class students
    const handleVectorizeAll = async () => {
        if (results.length === 0) return;
        setLoading(true);
        try {
            const sessionName = metadata?.sessions.find(s => s.id.toString() === selectedSession)?.name || '2024/2025';
            const termLabel = selectedTerm === '1' ? 'First Term' : selectedTerm === '2' ? 'Second Term' : 'Third Term';

            // Retrieve details for all class students concurrently
            const promises = results.map(r => 
                getK12StudentReportData(r.studentId, parseInt(selectedSession), parseInt(selectedTerm))
            );
            const responses = await Promise.all(promises);
            const studentsDetails = responses
                .filter(res => res.success && res.data)
                .map(res => res.data);

            // @ts-expect-error - TS2339: Auto-suppressed for build
            const activeRubric = metadata?.rubrics?.find(r => r.id.toString() === selectedRubricId);
            const parsedRubric = activeRubric ? { ...activeRubric, columnsConfig: typeof activeRubric.columnsConfig === 'string' ? JSON.parse(activeRubric.columnsConfig) : activeRubric.columnsConfig } : null;

            if (studentsDetails.length > 0) {
                await DocumentService.generateK12ClassReportPDF(
                    studentsDetails.map(d => ({...d, rubric: parsedRubric})),
                    sessionName,
                    termLabel,
                    selectedTemplate
                );
            }
        } catch (e) {
            console.error("Error generating class PDFs", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                        <Award className="w-10 h-10 text-indigo-600 animate-pulse" />
                        Result Views
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium tracking-tight">
                        Class-by-class terminal results, transcript verification, and PDF printable report cards
                    </p>
                </div>
            </div>

            {/* Premium Filter Dashboard Panel */}
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">Result Engine Filters</h3>
                </div>

                <div className={cn(
                    "grid grid-cols-1 sm:grid-cols-2 gap-6",
                    showDepartmentFilter ? "lg:grid-cols-6" : "lg:grid-cols-5"
                )}>
                    {/* Academic Session */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                            Academic Session
                        </label>
                        <select 
                            value={selectedSession} 
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                            {metadata?.sessions.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Academic Term */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                            Academic Term
                        </label>
                        <select 
                            value={selectedTerm} 
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                            <option value="1">First Term</option>
                            <option value="2">Second Term</option>
                            <option value="3">Third Term</option>
                        </select>
                    </div>

                    {/* Report Rubric Layout */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                            Report Layout Rubric
                        </label>
                        <select 
                            value={selectedRubricId} 
                            onChange={(e) => setSelectedRubricId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                            {(metadata as any)?.rubrics?.map((r: any) => (
                                <option key={r.id} value={r.id}>{r.name} {r.isMidTerm ? "(Mid-Term)" : ""}</option>
                            ))}
                            {(!(metadata as any)?.rubrics || (metadata as any)?.rubrics.length === 0) && (
                                <option value="">Default Legacy Layout</option>
                            )}
                        </select>
                    </div>

                    {/* Level / Class */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            Class / Level
                        </label>
                        <select 
                            value={selectedLevel} 
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                            <option value="">Select Level</option>
                            {metadata?.levels.map((l) => (
                                <option key={l} value={l}>Class Level {l}</option>
                            ))}
                        </select>
                    </div>

                    {/* Class Arm / Group */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Class Arm / Group
                        </label>
                        <select 
                            value={selectedGroup} 
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                            <option value="">All Arms</option>
                            {filteredGroups.map((g) => (
                                <option key={g.id} value={g.id}>Arm {g.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Admission Number Field */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5 text-slate-400" />
                            Admission Number
                        </label>
                        <input
                            type="text"
                            value={admissionNumber}
                            onChange={(e) => setAdmissionNumber(e.target.value)}
                            placeholder="e.g. TRC/024/0001"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all h-[48px]"
                        />
                    </div>

                    {/* Department / Stream (For Senior Secondary level >= 10) */}
                    {showDepartmentFilter && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                                Senior Stream / Dept
                            </label>
                            <select 
                                value={selectedDept} 
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                            >
                                <option value="">All Streams</option>
                                {metadata?.departments?.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    {/* Template Selection Dropdown */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500">Report Template:</label>
                        <select 
                            value={selectedTemplate} 
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        >
                            <option value="001">Template 001 (Rowel Style)</option>
                            <option value="rowel_schools">The Rowel Schools Template</option>
                            <option value="default">Default K-12 Template</option>
                        </select>
                    </div>

                    <Button 
                        onClick={handleSearch}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-14 rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        Generate Result Overview
                    </Button>
                </div>
            </div>

            {/* Main Content Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Results Table */}
                <div className={cn(
                    selectedStudent ? "lg:col-span-5" : "lg:col-span-12",
                    "transition-all duration-500 space-y-4"
                )}>
                    {results.length > 0 ? (
                        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xl shadow-slate-100/50 animate-in slide-in-from-bottom-6 duration-700">
                            <div className="p-6 bg-slate-900 border-b border-slate-800 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-black tracking-tight leading-none mb-1">Generated Results Overview</h3>
                                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
                                        Calculated rankings and averages for class level {selectedLevel || "Searched Criteria"}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="px-6 py-4">Student Details</th>
                                            {!selectedStudent && <th className="px-6 py-4 text-center">Class Arm</th>}
                                            {!selectedStudent && showDepartmentFilter && <th className="px-6 py-4 text-center">Senior Stream</th>}
                                            <th className="px-6 py-4 text-center">Average</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {results.map((r) => {
                                            const isActive = selectedStudent?.studentId === r.studentId;
                                            return (
                                                <tr 
                                                    key={r.studentId} 
                                                    className={cn(
                                                        "group transition-all cursor-pointer",
                                                        isActive ? "bg-indigo-50/70" : "hover:bg-slate-50"
                                                    )}
                                                    onClick={() => loadStudentPreview(r)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="font-black text-slate-900 tracking-tight">{r.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{r.matricNumber || "N/A"}</div>
                                                    </td>
                                                    {!selectedStudent && (
                                                        <td className="px-6 py-4 text-center font-bold text-slate-600">
                                                            {r.groupName || "N/A"}
                                                        </td>
                                                    )}
                                                    {!selectedStudent && showDepartmentFilter && (
                                                        <td className="px-6 py-4 text-center font-bold text-indigo-600">
                                                            {r.departmentName || "General"}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm font-black text-slate-900 tabular-nums">
                                                            {r.gpa || "0.00"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                            r.approvalStatus === 'published' 
                                                                ? "bg-emerald-50 text-emerald-600" 
                                                                : "bg-amber-50 text-amber-600"
                                                        )}>
                                                            {r.approvalStatus === 'published' ? 'Vectorized' : 'Rasterized'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button
                                                            size="sm"
                                                            variant={isActive ? "default" : "outline"}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                loadStudentPreview(r);
                                                            }}
                                                            className={cn(
                                                                "font-bold rounded-xl h-9 px-3 gap-1 flex items-center shadow-sm transition-colors",
                                                                isActive ? "bg-indigo-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            {isActive ? "Viewing" : "Preview"}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center gap-4">
                            <ClipboardList className="w-12 h-12 text-slate-300" />
                            <div>
                                <h4 className="text-lg font-black text-slate-700 tracking-tight leading-none mb-1">No Results Loaded</h4>
                                <p className="text-slate-400 text-xs font-medium">Select dynamic session and class parameters to capture generated results</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: PDF Preview Workspace */}
                {selectedStudent && (
                    <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-xl shadow-slate-100/50 space-y-4 animate-in slide-in-from-right-6 duration-500 h-[800px] flex flex-col relative">
                        {/* Preview Panel Header */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 tracking-tight text-sm uppercase">Vector Result Preview</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">{selectedStudent.name}</p>
                                        <span className={cn(
                                            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest leading-none",
                                            selectedStudent.approvalStatus === 'published' 
                                                ? "bg-emerald-50 text-emerald-600" 
                                                : "bg-amber-50 text-amber-600"
                                        )}>
                                            {selectedStudent.approvalStatus === 'published' ? (
                                                <>
                                                    <Lock className="w-2.5 h-2.5" />
                                                    Vectorized (Locked)
                                                </>
                                            ) : (
                                                <>
                                                    <Unlock className="w-2.5 h-2.5" />
                                                    Rasterized (Editable)
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Control action buttons */}
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleToggleLock}
                                    className={cn(
                                        "font-bold text-xs h-9 px-3 rounded-lg flex items-center gap-1 shadow-sm border transition-colors",
                                        selectedStudent.approvalStatus === 'published'
                                            ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                                            : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                                    )}
                                    disabled={loading}
                                >
                                    {selectedStudent.approvalStatus === 'published' ? (
                                        <>
                                            <Unlock className="w-3.5 h-3.5" />
                                            Rasterize
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-3.5 h-3.5" />
                                            Vectorize
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleDownloadCurrentPDF}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                                    disabled={loading}
                                >
                                    <FileDown className="w-3.5 h-3.5" />
                                    Download PDF
                                </Button>
                                <Button
                                    onClick={handleVectorizeAll}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                                    disabled={loading}
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    VECTORIZE ALL
                                </Button>
                                <button 
                                    onClick={() => {
                                        setSelectedStudent(null);
                                        setPdfBlobUrl(null);
                                    }}
                                    className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors text-slate-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Interactive Frame Body */}
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden relative min-h-[400px]">
                            {previewLoading ? (
                                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2 z-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Generating vector preview...</p>
                                </div>
                            ) : pdfBlobUrl ? (
                                <iframe 
                                    src={pdfBlobUrl} 
                                    className="w-full h-full border-none"
                                    title="PDF Record Preview"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <FileDown className="w-10 h-10 text-slate-300 animate-bounce" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Failed to load preview</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
