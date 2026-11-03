"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import {
    Stethoscope, Loader2, Search, FileText, CheckCircle2,
    XCircle, Download, Eye, Filter, Printer, Heart, Activity,
    UserCheck, Scale, ArrowRight, ShieldCheck, AlertCircle, Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { getMedicalRecords, getMedicalRecordStats, updateStudentMedicalByOfficer } from "@/actions/medical-records";
import { viewableAssetUrl } from "@/lib/assets";
import { toast } from "sonner";

const DEPARTMENTS = [
    { id: 54, name: "Computer Science" },
    { id: 55, name: "Artificial Intelligence" },
    { id: 56, name: "Networking & Cloud Computing" },
    { id: 57, name: "Statistics" },
    { id: 58, name: "Business Administration" },
    { id: 59, name: "Accountancy" },
];

export default function MedicalRecordsPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filterDept, setFilterDept] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    // Measurement & Update Modal state
    const [activeStudent, setActiveStudent] = useState<any>(null);
    const [isSaving, startSaving] = useTransition();

    // Measurement Form fields
    const [measurementData, setMeasurementData] = useState({
        height: "",
        weight: "",
        bloodPressure: "",
        bloodGroup: "",
        genotype: "",
        healthStatus: "cleared" as "cleared" | "flagged" | "pending",
        healthNotes: "",
        allergies: "",
        medicalHistory: "",
        currentMedications: "",
        commonIllness: "",
        illnessFrequency: "",
        lastOccurrence: "",
        illnessDescription: "",
        kinName: "",
        kinPhone: "",
        kinAddress: "",
    });

    const [showFullHistory, setShowFullHistory] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const loadRecords = useCallback(async () => {
        setLoading(true);
        const [res, statsRes] = await Promise.all([
            getMedicalRecords({
                departmentId: filterDept !== "all" ? parseInt(filterDept) : undefined,
                status: filterStatus !== "all" ? filterStatus : undefined,
                search: debouncedSearch || undefined,
                page,
                limit: pageSize,
            }),
            getMedicalRecordStats(),
        ]);
        if (res.success) {
            setRecords(res.data);
            setTotal(res.total);
        }
        if (statsRes.success) setStats(statsRes.data);
        setLoading(false);
    }, [filterDept, filterStatus, debouncedSearch, page]);

    useEffect(() => { 
        loadRecords(); 
    }, [loadRecords]);

    const openMeasurementModal = (student: any) => {
        setActiveStudent(student);
        setShowFullHistory(false);
        setMeasurementData({
            height: student.height === "Pending Clinic Measurement" ? "" : (student.height || ""),
            weight: student.weight === "Pending Clinic Measurement" ? "" : (student.weight || ""),
            bloodPressure: student.bloodPressure === "Pending Clinic Measurement" ? "" : (student.bloodPressure || ""),
            bloodGroup: student.bloodGroup === "Pending Test" ? "" : (student.bloodGroup || ""),
            genotype: student.genotype === "Pending Test" ? "" : (student.genotype || ""),
            healthStatus: (student.healthStatus as any) || "cleared",
            healthNotes: student.healthNotes || "",
            allergies: student.allergies || "",
            medicalHistory: student.medicalHistory || "",
            currentMedications: student.currentMedications || "",
            commonIllness: student.commonIllness || "",
            illnessFrequency: student.illnessFrequency || "",
            lastOccurrence: student.lastOccurrence || "",
            illnessDescription: student.illnessDescription || "",
            kinName: student.kinName || "",
            kinPhone: student.kinPhone || "",
            kinAddress: student.kinAddress || "",
        });
    };

    const handleSaveMeasurements = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeStudent) return;

        startSaving(async () => {
            const res = await updateStudentMedicalByOfficer({
                studentId: activeStudent.studentId,
                ...measurementData,
            });

            if (res.success) {
                toast.success("Medical measurements and clearance saved successfully!");
                // Update local record in list
                setRecords(prev => prev.map(r => {
                    if (r.studentId === activeStudent.studentId) {
                        return {
                            ...r,
                            height: measurementData.height,
                            weight: measurementData.weight,
                            bloodPressure: measurementData.bloodPressure,
                            bloodGroup: measurementData.bloodGroup,
                            genotype: measurementData.genotype,
                            healthStatus: measurementData.healthStatus,
                            healthNotes: measurementData.healthNotes,
                            medicalFormSubmittedAt: r.medicalFormSubmittedAt || new Date().toISOString(),
                        };
                    }
                    return r;
                }));
                // Keep modal open with success message or let officer print immediately
                setActiveStudent((prev: any) => ({
                    ...prev,
                    ...measurementData,
                    medicalFormSubmittedAt: prev.medicalFormSubmittedAt || new Date().toISOString(),
                    _savedSuccessfully: true,
                }));
            } else {
                toast.error(res.error || "Failed to update medical record.");
            }
        });
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-800 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                            <Stethoscope size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clinic Health & Medical Records</h1>
                            <p className="text-sm font-medium text-slate-500">
                                Student physical examination, clinical measurements, and official medical form clearance
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/health">
                            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-2xl flex items-center gap-2">
                                <Activity className="w-4 h-4 text-rose-500" />
                                Health Directory & Vitals
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="rounded-2xl border-slate-200 shadow-sm"><CardContent className="p-4 text-center">
                        <p className="text-2xl font-black text-slate-900">{stats?.total || total}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Total Students</p>
                    </CardContent></Card>
                    <Card className="rounded-2xl border-slate-200 shadow-sm"><CardContent className="p-4 text-center">
                        <p className="text-2xl font-black text-emerald-800">{stats?.submitted || 0}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Forms Submitted</p>
                    </CardContent></Card>
                    <Card className="rounded-2xl border-slate-200 shadow-sm"><CardContent className="p-4 text-center">
                        <p className="text-2xl font-black text-teal-700">{stats?.cleared || 0}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Medically Cleared</p>
                    </CardContent></Card>
                    <Card className="rounded-2xl border-slate-200 shadow-sm"><CardContent className="p-4 text-center">
                        <p className="text-2xl font-black text-amber-600">{stats?.pending || 0}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Pending Clearance</p>
                    </CardContent></Card>
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <Label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">
                                Search Student (Name, Matric No, or JAMB/Admission No)
                            </Label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <Input 
                                    placeholder="Type student name, matric number, or JAMB number..." 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)} 
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl font-medium" 
                                />
                            </div>
                        </div>
                        <div className="w-full sm:w-56">
                            <Label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Department</Label>
                            <Select value={filterDept} onValueChange={setFilterDept}>
                                <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {DEPARTMENTS.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full sm:w-44">
                            <Label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Clearance Status</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="cleared">Cleared</SelectItem>
                                    <SelectItem value="submitted">Form Submitted</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Students Medical Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                                    <th className="py-4 px-4">Student Particulars</th>
                                    <th className="py-4 px-4">Matric / JAMB No.</th>
                                    <th className="py-4 px-4">Department & Level</th>
                                    <th className="py-4 px-4">Measurements (General Health)</th>
                                    <th className="py-4 px-4 text-center">Clearance Status</th>
                                    <th className="py-4 px-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-400">
                                            <Loader2 className="w-8 h-8 animate-spin text-emerald-800 mx-auto mb-2" />
                                            <span>Loading medical records...</span>
                                        </td>
                                    </tr>
                                ) : records.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-400">
                                            No student records found matching your query.
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((rec) => {
                                        const hasMeasurements = rec.height && rec.height !== "Pending Clinic Measurement";
                                        return (
                                            <tr key={rec.studentId} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-900 font-black flex items-center justify-center overflow-hidden flex-shrink-0 text-xs border border-emerald-200">
                                                            {rec.imageUrl ? (
                                                                <img src={viewableAssetUrl(rec.imageUrl) || rec.imageUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                rec.studentName?.charAt(0) || "S"
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900">{rec.studentName}</div>
                                                            <div className="text-[10px] text-slate-400 capitalize">{rec.gender || 'N/A'} • {rec.dob || 'DOB N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 font-mono">
                                                    <div className="font-bold text-emerald-900">{rec.matricNumber || 'NOT ASSIGNED'}</div>
                                                    <div className="text-[10px] text-slate-400">{rec.jambNumber || rec.admissionNumber || 'N/A'}</div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-medium text-slate-800">{rec.deptName || 'General Studies'}</div>
                                                    <div className="text-[10px] font-bold text-slate-500 uppercase">{rec.programmeType} Level {rec.currentLevel}</div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {hasMeasurements ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                                                                    {rec.height}
                                                                </span>
                                                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                                                                    {rec.weight}
                                                                </span>
                                                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                                                                    {rec.bloodPressure}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 font-semibold">
                                                                Blood: <strong className="text-rose-700">{rec.bloodGroup || 'N/A'}</strong> | Genotype: <strong className="text-indigo-700">{rec.genotype || 'N/A'}</strong>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="border-dashed border-amber-300 text-amber-700 bg-amber-50 text-[10px] font-bold">
                                                            Measurement Pending
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <Badge className={`text-[10px] font-bold tracking-wider uppercase ${
                                                        rec.healthStatus === 'cleared' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                                                        rec.healthStatus === 'flagged' ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' :
                                                        'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                                    }`}>
                                                        {rec.healthStatus || 'pending'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => openMeasurementModal(rec)}
                                                            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center gap-1 h-8 px-3"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                            <span>Measure / Update</span>
                                                        </Button>
                                                        <a 
                                                            href={`/admin/students/${rec.studentId}/medical`} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                        >
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                className="rounded-xl text-xs flex items-center gap-1 h-8 px-3 text-slate-700 hover:text-emerald-900 border-slate-200"
                                                            >
                                                                <Printer className="w-3.5 h-3.5" />
                                                                <span>Print</span>
                                                            </Button>
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-200 text-xs text-slate-500">
                            <span>Showing page {page} of {totalPages} ({total} total records)</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl h-8">
                                    Previous
                                </Button>
                                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl h-8">
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* CLINICAL MEASUREMENT & CLEARANCE MODAL */}
                {activeStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto border border-slate-200">
                            
                            {/* Modal Header */}
                            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-900 rounded-2xl flex items-center justify-center font-black text-lg overflow-hidden border border-emerald-200 flex-shrink-0">
                                        {activeStudent.imageUrl ? (
                                            <img src={viewableAssetUrl(activeStudent.imageUrl) || activeStudent.imageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            activeStudent.studentName?.charAt(0) || "S"
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">{activeStudent.studentName}</h3>
                                        <p className="text-xs text-slate-500 font-mono">
                                            Matric: <strong className="text-emerald-900">{activeStudent.matricNumber || 'NOT ASSIGNED'}</strong> • {activeStudent.deptName || 'General Studies'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setActiveStudent(null)} 
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Saved Notification Banner if successfully updated */}
                            {activeStudent._savedSuccessfully && (
                                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-950 text-xs">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                                        <span className="font-bold">Medical examination records updated and certified!</span>
                                    </div>
                                    <a 
                                        href={`/admin/students/${activeStudent.studentId}/medical`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                    >
                                        <Button size="sm" className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl h-8 gap-1.5 font-bold shadow-sm">
                                            <Printer className="w-3.5 h-3.5" /> Print Form Now
                                        </Button>
                                    </a>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSaveMeasurements} className="mt-6 space-y-6">
                                
                                {/* SECTION: GENERAL HEALTH MEASUREMENTS */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-emerald-800/20 pb-2">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                                            <Scale className="w-4 h-4 text-emerald-700" />
                                            <span>General Health Measurements (Taken by Health Officer)</span>
                                        </h4>
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Physical Vitals</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                                                Height (e.g. 175 cm)
                                            </Label>
                                            <Input 
                                                value={measurementData.height}
                                                onChange={e => setMeasurementData(prev => ({ ...prev, height: e.target.value }))}
                                                placeholder="e.g. 175 cm"
                                                className="h-10 bg-slate-50 border-slate-200 font-semibold rounded-xl text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                                                Weight (e.g. 68 kg)
                                            </Label>
                                            <Input 
                                                value={measurementData.weight}
                                                onChange={e => setMeasurementData(prev => ({ ...prev, weight: e.target.value }))}
                                                placeholder="e.g. 68 kg"
                                                className="h-10 bg-slate-50 border-slate-200 font-semibold rounded-xl text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                                                Blood Pressure (e.g. 120/80)
                                            </Label>
                                            <Input 
                                                value={measurementData.bloodPressure}
                                                onChange={e => setMeasurementData(prev => ({ ...prev, bloodPressure: e.target.value }))}
                                                placeholder="e.g. 120/80"
                                                className="h-10 bg-slate-50 border-slate-200 font-semibold rounded-xl text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                                                Blood Group
                                            </Label>
                                            <Select 
                                                value={measurementData.bloodGroup} 
                                                onValueChange={v => setMeasurementData(prev => ({ ...prev, bloodGroup: v }))}
                                            >
                                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl font-bold">
                                                    <SelectValue placeholder="Select Blood Group..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                                                Genotype
                                            </Label>
                                            <Select 
                                                value={measurementData.genotype} 
                                                onValueChange={v => setMeasurementData(prev => ({ ...prev, genotype: v }))}
                                            >
                                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl font-bold">
                                                    <SelectValue placeholder="Select Genotype..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['AA', 'AS', 'SS', 'AC', 'SC'].map(gt => (
                                                        <SelectItem key={gt} value={gt}>{gt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: CLINICAL CLEARANCE STATUS & NOTES */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between border-b border-emerald-800/20 pb-2">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                                            <span>Clinical Assessment & Endorsement</span>
                                        </h4>
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Physician Endorsement</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                                                Clearance Decision
                                            </Label>
                                            <Select 
                                                value={measurementData.healthStatus} 
                                                onValueChange={(v: any) => setMeasurementData(prev => ({ ...prev, healthStatus: v }))}
                                            >
                                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl font-bold">
                                                    <SelectValue placeholder="Decision..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cleared">Cleared (Certified Medically Fit)</SelectItem>
                                                    <SelectItem value="pending">Pending Further Tests</SelectItem>
                                                    <SelectItem value="flagged">Flagged / Special Care Needed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                                                Physician Observations / Remarks
                                            </Label>
                                            <Input 
                                                value={measurementData.healthNotes}
                                                onChange={e => setMeasurementData(prev => ({ ...prev, healthNotes: e.target.value }))}
                                                placeholder="e.g. Satisfactory vital signs. Fit for study."
                                                className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* TOGGLE: View & Update Health History / Next of Kin */}
                                <div className="pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowFullHistory(!showFullHistory)}
                                        className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 underline underline-offset-4"
                                    >
                                        {showFullHistory ? "Hide Health History & Next of Kin" : "View / Edit Health History & Next of Kin details"}
                                    </button>

                                    {showFullHistory && (
                                        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
                                            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                                                Next of Kin Information
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div>
                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Name</Label>
                                                    <Input 
                                                        value={measurementData.kinName}
                                                        onChange={e => setMeasurementData(prev => ({ ...prev, kinName: e.target.value }))}
                                                        className="h-9 bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Phone</Label>
                                                    <Input 
                                                        value={measurementData.kinPhone}
                                                        onChange={e => setMeasurementData(prev => ({ ...prev, kinPhone: e.target.value }))}
                                                        className="h-9 bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Address</Label>
                                                    <Input 
                                                        value={measurementData.kinAddress}
                                                        onChange={e => setMeasurementData(prev => ({ ...prev, kinAddress: e.target.value }))}
                                                        className="h-9 bg-white"
                                                    />
                                                </div>
                                            </div>

                                            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pt-2 pb-1 border-b border-slate-200">
                                                Health History
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Known Allergies</Label>
                                                    <Input 
                                                        value={measurementData.allergies}
                                                        onChange={e => setMeasurementData(prev => ({ ...prev, allergies: e.target.value }))}
                                                        placeholder="None"
                                                        className="h-9 bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Current Medications</Label>
                                                    <Input 
                                                        value={measurementData.currentMedications}
                                                        onChange={e => setMeasurementData(prev => ({ ...prev, currentMedications: e.target.value }))}
                                                        placeholder="None"
                                                        className="h-9 bg-white"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Medical History / Past Surgeries</Label>
                                                    <Input 
                                                        value={measurementData.medicalHistory}
                                                        onChange={e => setMeasurementData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                                                        placeholder="None"
                                                        className="h-9 bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Actions */}
                                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setActiveStudent(null)}
                                        className="rounded-xl h-10 px-5"
                                    >
                                        Close
                                    </Button>

                                    <div className="flex items-center gap-2">
                                        <a 
                                            href={`/admin/students/${activeStudent.studentId}/medical`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                        >
                                            <Button 
                                                type="button" 
                                                variant="outline"
                                                className="rounded-xl h-10 px-4 text-emerald-800 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 flex items-center gap-1.5"
                                            >
                                                <Printer className="w-4 h-4" /> Print Form
                                            </Button>
                                        </a>

                                        <Button 
                                            type="submit" 
                                            disabled={isSaving}
                                            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl h-10 px-6 shadow-md flex items-center gap-2"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            <span>{isSaving ? "Saving..." : "Submit & Certify Record"}</span>
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
