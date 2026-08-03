"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Search, CheckCircle, Loader2, Edit, CreditCard, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { getGraduates, bulkAllocateFeeToGraduates, updateStudentStatus } from "@/actions/graduates";
import { getDepartments } from "@/actions/departments";
import { getFeeStructures } from "@/actions/bursary";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function GraduatesPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [graduates, setGraduates] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());

    // Search and Filters
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const programmeType = searchParams.get("programmeType") as any || "all";
    const status = searchParams.get("status") as any || "all";
    const deptId = searchParams.get("deptId") ? parseInt(searchParams.get("deptId")!) : undefined;

    // Modals
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedFeeStructureId, setSelectedFeeStructureId] = useState("");
    const [isAllocating, setIsAllocating] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [editStatus, setEditStatus] = useState("");
    const [editLevel, setEditLevel] = useState<number>(0);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [gradRes, depts, fees] = await Promise.all([
            getGraduates({ page, pageSize, search, programmeType, status, deptId }),
            getDepartments(),
            getFeeStructures()
        ]);
        
        if (gradRes.success) {
            setGraduates(gradRes.data!);
            setTotalCount(gradRes.totalCount!);
        }
        setDepartments(depts);
        setFeeStructures(fees.filter((f: any) => f.status === 'approved'));
        setLoading(false);
    }, [page, pageSize, search, programmeType, status, deptId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const toggleSelection = (id: number) => {
        const newSet = new Set(selectedStudents);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedStudents(newSet);
    };

    const toggleAll = () => {
        if (selectedStudents.size === graduates.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(graduates.map(g => g.id)));
        }
    };

    const handleBulkAllocate = async () => {
        if (!selectedFeeStructureId || selectedStudents.size === 0) return;
        
        setIsAllocating(true);
        const res = await bulkAllocateFeeToGraduates(Array.from(selectedStudents), parseInt(selectedFeeStructureId));
        if (res.success) {
            toast.success(`Successfully attached fee to ${res.count} graduates`);
            setIsPaymentModalOpen(false);
            setSelectedStudents(new Set());
            setSelectedFeeStructureId("");
        } else {
            toast.error(res.error || "Failed to attach payment");
        }
        setIsAllocating(false);
    };

    const handleEditSave = async () => {
        if (!editingStudent) return;
        setIsUpdatingStatus(true);
        const res = await updateStudentStatus(editingStudent.id, editStatus, editLevel);
        if (res.success) {
            toast.success("Student status updated successfully");
            setIsEditModalOpen(false);
            fetchData();
        } else {
            toast.error(res.error || "Failed to update status");
        }
        setIsUpdatingStatus(false);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <GraduationCap className="h-8 w-8 text-indigo-600" />
                    Graduates Registry
                </h1>
                <p className="text-slate-500 mt-1">
                    Manage graduated students, update statuses, and attach mandatory fees.
                </p>
            </div>

            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-6">
                    <div className="flex gap-3 flex-wrap w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                placeholder="Search name or matric..."
                                defaultValue={search}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') updateFilter('search', e.currentTarget.value);
                                }}
                            />
                        </div>
                        <select 
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                            value={programmeType}
                            onChange={(e) => updateFilter('programmeType', e.target.value)}
                        >
                            <option value="all">All Programmes</option>
                            <option value="ND">ND</option>
                            <option value="HND">HND</option>
                        </select>
                        <select 
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white"
                            value={status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                        >
                            <option value="all">All Grad Statuses</option>
                            <option value="nd_graduated">ND Graduated</option>
                            <option value="hnd_graduated">HND Graduated</option>
                            <option value="active">Active (Pending Grad)</option>
                        </select>
                        <select 
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white max-w-[200px]"
                            value={deptId?.toString() || "all"}
                            onChange={(e) => updateFilter('deptId', e.target.value)}
                        >
                            <option value="all">All Departments</option>
                            {departments.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    {selectedStudents.size > 0 && (
                        <Button 
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200"
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Attach Payment ({selectedStudents.size})
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-6 py-4">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-slate-700 bg-slate-800 focus:ring-indigo-500 w-4 h-4"
                                        checked={graduates.length > 0 && selectedStudents.size === graduates.length}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Student</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Matric No</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Programme</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                                    </td>
                                </tr>
                            ) : graduates.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        No graduates found
                                    </td>
                                </tr>
                            ) : (
                                graduates.map((grad: any) => (
                                    <tr key={grad.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                                checked={selectedStudents.has(grad.id)}
                                                onChange={() => toggleSelection(grad.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {grad.imageUrl ? (
                                                    <img src={grad.imageUrl} alt={grad.name} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
                                                        {grad.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{grad.name}</p>
                                                    <p className="text-xs text-slate-500">{grad.departmentName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-bold text-slate-600">{grad.matricNumber || grad.admissionNumber || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full border border-slate-200 inline-flex items-center gap-1">
                                                {grad.programmeType} <span className="opacity-50">•</span> Lvl {grad.currentLevel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-3 py-1 font-black uppercase text-[10px] tracking-widest rounded-full inline-flex items-center gap-1.5",
                                                grad.status.includes('graduated') ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                            )}>
                                                {grad.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingStudent(grad);
                                                    setEditStatus(grad.status);
                                                    setEditLevel(grad.currentLevel);
                                                    setIsEditModalOpen(true);
                                                }}
                                                className="h-8 px-2 text-slate-500 hover:text-indigo-600"
                                            >
                                                <Edit className="w-4 h-4 mr-1" /> Edit
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                Total: {totalCount} records
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => updateFilter('page', (page - 1).toString())}
                                    className="h-8 text-xs font-bold"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => updateFilter('page', (page + 1).toString())}
                                    className="h-8 text-xs font-bold"
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attach Payment Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <CreditCard className="w-6 h-6 text-indigo-600" />
                            Attach Bulk Payment
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Allocate a standard fee structure to {selectedStudents.size} selected graduate(s).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Select Fee Structure</label>
                            <select 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                                value={selectedFeeStructureId}
                                onChange={(e) => setSelectedFeeStructureId(e.target.value)}
                            >
                                <option value="">-- Choose a fee --</option>
                                {feeStructures.map((fee: any) => (
                                    <option key={fee.id} value={fee.id}>
                                        {fee.name} (₦{parseFloat(fee.totalAmount || '0').toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleBulkAllocate} 
                            disabled={!selectedFeeStructureId || isAllocating}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-6"
                        >
                            {isAllocating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                            Apply Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Status Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Edit className="w-6 h-6 text-slate-600" />
                            Edit Student Status
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Manually correct the academic status and level for {editingStudent?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Academic Status</label>
                            <select 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-slate-500"
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                            >
                                <option value="active">Active</option>
                                <option value="nd_graduated">ND Graduated</option>
                                <option value="hnd_graduated">HND Graduated</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Current Level</label>
                            <input 
                                type="number"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-slate-500"
                                value={editLevel}
                                onChange={(e) => setEditLevel(parseInt(e.target.value) || 0)}
                            />
                            <p className="text-xs text-slate-400 mt-1">E.g., 1 for ND1/HND1, 2 for ND2/HND2. Use 0 if not applicable.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleEditSave} 
                            disabled={isUpdatingStatus}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold px-6"
                        >
                            {isUpdatingStatus ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function GraduatesPage() {
    return (
        <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
            <GraduatesPageContent />
        </Suspense>
    );
}
