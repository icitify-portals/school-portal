"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CheckCircle,
    XCircle,
    Loader2,
    User,
    BookOpen,
    Clock,
    AlertCircle,
    ChevronRight,
    Search,
    CheckSquare,
    Square
} from "lucide-react";
import { getPendingRegistrations, processRegistration, batchProcessRegistrations } from "@/actions/registration";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RegistrationApprovals() {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [batchProcessing, setBatchProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getPendingRegistrations();
        setRegistrations(data);
        setSelectedIds(new Set()); // Reset selection on refresh
        setLoading(false);
    };

    const handleAction = async (reg: any, action: 'approved' | 'rejected') => {
        const id = `${reg.studentId}-${reg.academicYear}-${reg.semester}`;
        setProcessing(id);
        const res = await processRegistration(reg.studentId, reg.academicYear, reg.semester, action);
        if (res.success) {
            toast.success(`Registration ${action} successfully`);
            fetchData();
        } else {
            toast.error(res.error);
        }
        setProcessing(null);
    };

    const handleBatchAction = async (action: 'approved' | 'rejected') => {
        if (selectedIds.size === 0) {
            toast.error("Please select at least one registration");
            return;
        }

        setBatchProcessing(true);
        const selectedRegs = registrations.filter(r => {
            const id = `${r.studentId}-${r.academicYear}-${r.semester}`;
            return selectedIds.has(id);
        }).map(r => ({
            studentId: r.studentId,
            academicYear: r.academicYear,
            semester: r.semester
        }));

        const res = await batchProcessRegistrations(selectedRegs, action);
        if (res.success) {
            toast.success(`Batch ${action} completed successfully`);
            fetchData();
        } else {
            toast.error(res.error);
        }
        setBatchProcessing(false);
    };

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedIds(newSelection);
    };

    const filtered = registrations.filter(r =>
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.matricNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedIds.size === filtered.length && filtered.length > 0) {
            setSelectedIds(new Set());
        } else {
            const newSelection = new Set(filtered.map(r => `${r.studentId}-${r.academicYear}-${r.semester}`));
            setSelectedIds(newSelection);
        }
    };

    const isAllSelected = filtered.length > 0 && selectedIds.size === filtered.length;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                        Registration Approvals
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Review and approve student course selections per semester</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search student or matric number..."
                            className="w-full pl-12 pr-4 h-12 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Batch Action Bar */}
            {selectedIds.size > 0 && (
                <div className="sticky top-4 z-10 bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-3xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest">
                            {selectedIds.size} Selected
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedIds(new Set())}
                            className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600"
                        >
                            Deselect All
                        </Button>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            disabled={batchProcessing}
                            onClick={() => handleBatchAction('rejected')}
                            className="h-12 px-8 rounded-xl border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100"
                        >
                            {batchProcessing ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : "Batch Reject"}
                        </Button>
                        <Button
                            disabled={batchProcessing}
                            onClick={() => handleBatchAction('approved')}
                            className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20"
                        >
                            {batchProcessing ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Batch Approve Selected"}
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3 mb-2 px-2">
                <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 group"
                >
                    <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        isAllSelected ? "bg-emerald-600 border-emerald-600" : "border-slate-200 group-hover:border-slate-300"
                    )}>
                        {isAllSelected && <CheckSquare className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {isAllSelected ? "Deselect All Listed" : "Select All Listed Students"}
                    </span>
                </button>
            </div>

            {loading ? (
                <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>
            ) : filtered.length === 0 ? (
                <Card className="border-none shadow-sm p-20 text-center space-y-4 rounded-[2.5rem]">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
                        <p className="text-slate-500">No pending registrations found.</p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filtered.map((reg) => {
                        const id = `${reg.studentId}-${reg.academicYear}-${reg.semester}`;
                        const isProcessing = processing === id;
                        const isSelected = selectedIds.has(id);

                        return (
                            <Card key={id} className={cn(
                                "border-none shadow-sm overflow-hidden hover:shadow-md transition-all rounded-[2rem] bg-white group relative",
                                isSelected && "ring-2 ring-emerald-500 shadow-xl"
                            )}>
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                                        <div className="lg:col-span-4 p-8 border-r border-slate-50 bg-slate-50/30 relative">
                                            {/* Checkbox */}
                                            <button
                                                onClick={() => toggleSelection(id)}
                                                className="absolute top-6 left-6 z-10"
                                            >
                                                <div className={cn(
                                                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    isSelected ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-200 group-hover:border-slate-300"
                                                )}>
                                                    {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                                                </div>
                                            </button>

                                            <div className="flex items-start gap-4 mb-6 pl-10">
                                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                                    <User className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-lg text-slate-900 leading-tight">{reg.studentName}</h3>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{reg.matricNumber || 'NO MATRIC'}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-6 border-t border-slate-100">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year</span>
                                                    <span className="text-xs font-bold text-slate-700">{reg.academicYear}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester</span>
                                                    <span className="text-xs font-bold text-slate-700">{reg.semester === 1 ? 'First' : 'Second'}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Units</span>
                                                    <span className={cn("text-lg font-black", reg.totalUnits > 24 ? "text-rose-500" : "text-emerald-600")}>
                                                        {reg.totalUnits} <span className="text-[10px] text-slate-300">Units</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-8 p-8 flex flex-col justify-between">
                                            <div className="space-y-4 mb-8">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <BookOpen className="w-3.5 h-3.5" /> Selected Courses
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {reg.courses.map((course: any) => (
                                                        <div key={course.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 group-hover:border-slate-200 transition-colors">
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-800">{course.code}</p>
                                                                <p className="text-[10px] font-medium text-slate-400 truncate w-32 md:w-48 capitalize">{course.name.toLowerCase()}</p>
                                                            </div>
                                                            <span className="text-xs font-black text-slate-400 underline decoration-slate-200 decoration-2 underline-offset-4">{course.units}U</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3">
                                                <Button
                                                    variant="outline"
                                                    disabled={isProcessing}
                                                    onClick={() => handleAction(reg, 'rejected')}
                                                    className="h-12 px-8 rounded-xl border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
                                                >
                                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject"}
                                                </Button>
                                                <Button
                                                    disabled={isProcessing}
                                                    onClick={() => handleAction(reg, 'approved')}
                                                    className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 transition-all"
                                                >
                                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve & Enroll"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
