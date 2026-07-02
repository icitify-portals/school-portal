"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, Loader2, Search, FileUp, X, FileText, ShieldAlert, QrCode } from "lucide-react";
import { getStudents, approveStudent, bulkImportStudents, toggleFinancialLock } from "@/actions/students";
import { impersonateUser } from "@/actions/impersonation";
import { generateIdentityQRCodeAction } from "@/actions/utility-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { UniversalImporter } from "@/components/UniversalImporter";
import { StudentSeeder } from "@/components/StudentSeeder";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Suspense } from "react";
import { AccountManagementModal } from "@/components/admin/AccountManagementModal";

import { useBranch } from "@/providers/BranchProvider";

function StudentsPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isK12 } = useBranch();
    const settings = { base_currency: ₦ };

    const [students, setStudents] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showImporter, setShowImporter] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const [qrStudent, setQrStudent] = useState<any | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const levelParam = searchParams.get("level");
    const level = levelParam ? parseInt(levelParam) : undefined;

    const levels = isK12 
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        : [100, 200, 300, 400, 500, 600, 700, 800];

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const res = await getStudents({ search, page, pageSize, level });
        if (res.success) {
            setStudents(res.data);
            setTotalCount(res.totalCount);
        }
        setLoading(false);
    }, [search, page, pageSize, level]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleSearch = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set("search", value);
        } else {
            params.delete("search");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleLevelChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set("level", value);
        } else {
            params.delete("level");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleApprove = async (userId: number) => {
        const matric = prompt("Enter Matric Number for this student:");
        if (!matric) return;
        const res = await approveStudent(userId, matric);
        if (res.success) fetchStudents();
    };

    const handleToggleLock = async (studentId: number, currentStatus: boolean, name: string) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'unlock' : 'lock'} the financial status for ${name}?`)) {
            const res = await toggleFinancialLock(studentId, !currentStatus);
            if (res.success) {
                fetchStudents();
            } else {
                alert(res.error);
            }
        }
    };

    const handleViewQR = async (student: any) => {
        setQrStudent(student);
        setQrLoading(true);
        setQrDataUrl(null);
        try {
            // Student ID QR format: std:<matricNumber || admissionNumber || studentId>
            const idVal = student.matricNumber || student.admissionNumber || student.id;
            const res = await generateIdentityQRCodeAction(`std:${idVal}`);
            if (res.success && res.dataUrl) {
                setQrDataUrl(res.dataUrl);
            } else {
                alert(res.error || "Failed to generate ID QR");
                setQrStudent(null);
            }
        } catch (error: any) {
            alert(error.message || "An unexpected error occurred");
            setQrStudent(null);
        } finally {
            setQrLoading(false);
        }
    };

    return (
        <div className="p-8 pb-32 max-w-[1600px] w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Student Management</h2>
                    <p className="text-slate-500 mt-1">Review and manage student records</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    <Button
                        onClick={() => setShowImporter(!showImporter)}
                        variant="outline"
                        className="rounded-xl font-bold text-xs uppercase tracking-widest h-10 border-slate-200 bg-white gap-2"
                    >
                        {showImporter ? <X className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                        {showImporter ? "Close Importer" : "Import Students"}
                    </Button>
                    
                    <select
                        className="px-3 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
                        value={levelParam || ""}
                        onChange={(e) => handleLevelChange(e.target.value)}
                    >
                        <option value="">All Levels</option>
                        {levels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {isK12 ? `Grade ${lvl}` : `${lvl} Level`}
                            </option>
                        ))}
                    </select>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            className="w-full pl-10 pr-4 py-2 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-sm"
                            placeholder="Search students..."
                            defaultValue={search}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSearch((e.target as HTMLInputElement).value);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {showImporter && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <UniversalImporter
                        title="Bulk Student Import"
                        description="Upload an Excel or CSV file containing student names, emails, matriculation numbers, entry modes (UTME/DE), and admission years."
                        templateColumns={["name", "email", "matricNumber", "level", "programmeId", "modeOfEntry", "admissionYear"]}
                        onImport={bulkImportStudents}
                        onComplete={() => {
                            fetchStudents();
                            setShowImporter(false);
                        }}
                    />
                </div>
            )}

            <div className="mb-8">
                <StudentSeeder />
            </div>

            <Card className="border-none shadow-sm overflow-hidden flex flex-col">
                <DataTablePagination
                    totalItems={totalCount}
                    pageSize={pageSize}
                    currentPage={page}
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Matric No.</th>
                                <th className="px-6 py-4">Level</th>
                                <th className="px-6 py-4">Programme</th>
                                <th className="px-6 py-4">Wallet</th>
                                <th className="px-6 py-4">Fin Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                                        No students found.
                                    </td>
                                </tr>
                            ) : (
                                students.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{s.user?.name}</span>
                                                <span className="text-xs text-slate-400">{s.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.matricNumber ? (
                                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold font-mono">
                                                    {s.matricNumber}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-orange-500 font-medium italic">Pending Approval</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-600">
                                                {isK12 ? `Grade ${s.currentLevel}` : `${s.currentLevel} L`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600">{s.programme?.name || 'Not Assigned'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-700">{settings?.base_currency || ₦}{parseFloat(s.walletBalance).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleLock(s.id, s.isFinanciallyLocked, s.user?.name)}
                                                className={`h-8 px-2 text-xs gap-1 rounded-lg border font-bold ${s.isFinanciallyLocked ? 'border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100' : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                                            >
                                                {s.isFinanciallyLocked ? 'Locked' : 'Clear'}
                                            </Button>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    if (confirm(`Do you want to log in as ${s.user?.name}?`)) {
                                                        const res = await impersonateUser(s.userId);
                                                        if (res.success) {
                                                            window.location.href = "/";
                                                        } else {
                                                            alert(res.error);
                                                        }
                                                    }
                                                }}
                                                className="h-8 w-8 p-0 rounded-lg text-amber-600 hover:bg-amber-50"
                                                title="Login As Student"
                                            >
                                                <ShieldAlert className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewQR(s)}
                                                className="h-8 w-8 p-0 rounded-lg text-indigo-600 hover:bg-indigo-50"
                                                title="View Student QR ID"
                                            >
                                                <QrCode className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedUser(s.user)}
                                                className="h-8 px-3 text-xs gap-1 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100"
                                                title="Account Management"
                                            >
                                                <Users className="w-3 h-3" />
                                                Account
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/admin/bursary/ledger/${s.id}`)}
                                                className="h-8 px-3 text-xs gap-1 rounded-lg border-slate-200 text-indigo-600 hover:bg-indigo-50"
                                            >
                                                <FileText className="w-3 h-3" />
                                                Ledger
                                            </Button>
                                            {!s.matricNumber && (
                                                <Button
                                                    onClick={() => handleApprove(s.userId)}
                                                    className="bg-green-600 hover:bg-green-700 h-8 px-3 text-xs gap-1 rounded-lg"
                                                >
                                                    <CheckCircle className="w-3 h-3" />
                                                    Approve
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <DataTablePagination
                    totalItems={totalCount}
                    pageSize={pageSize}
                    currentPage={page}
                />
            </Card>

            <AccountManagementModal 
                user={selectedUser} 
                onClose={() => setSelectedUser(null)}
                onUpdate={fetchStudents}
            />

            {/* Student ID QR Modal */}
            <Dialog open={!!qrStudent} onOpenChange={(open) => {
                if (!open) {
                    setQrStudent(null);
                    setQrDataUrl(null);
                }
            }}>
                <DialogContent className="border-none shadow-2xl rounded-[2.5rem] bg-white max-w-sm p-8">
                    <DialogHeader className="text-center space-y-3">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                            <QrCode className="w-6 h-6 animate-pulse" />
                        </div>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-slate-900">
                            Student QR ID
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium text-xs">
                            Verify student identity using this secure QR code.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        {qrLoading ? (
                            <div className="flex flex-col items-center justify-center space-y-2 h-48">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generating ID Code...</span>
                            </div>
                        ) : qrDataUrl ? (
                            <>
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrDataUrl} alt="Student QR ID Card" className="w-48 h-48 mix-blend-multiply" />
                                </div>
                                {qrStudent && (
                                    <div className="text-center space-y-1">
                                        <p className="font-black text-slate-900 uppercase italic text-sm">{qrStudent.user?.name}</p>
                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                                            {qrStudent.matricNumber ? `MATRIC: ${qrStudent.matricNumber}` : `ID: ${qrStudent.id}`}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{qrStudent.programme?.name || "Not Assigned"}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center text-rose-500 py-6 text-sm font-bold flex flex-col items-center gap-2">
                                <ShieldAlert className="w-8 h-8" />
                                Failed to generate QR code.
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            onClick={() => {
                                setQrStudent(null);
                                setQrDataUrl(null);
                            }}
                            className="w-full bg-slate-900 hover:bg-black text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-slate-100"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function StudentsPage() {
    return (
        <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>}>
            <StudentsPageContent />
        </Suspense>
    );
}
