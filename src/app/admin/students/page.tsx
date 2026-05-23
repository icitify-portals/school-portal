"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, Loader2, Search, FileUp, X, FileText, ShieldAlert } from "lucide-react";
import { getStudents, approveStudent, bulkImportStudents } from "@/actions/students";
import { impersonateUser } from "@/actions/impersonation";
import { UniversalImporter } from "@/components/UniversalImporter";
import { StudentSeeder } from "@/components/StudentSeeder";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Suspense } from "react";
import { AccountManagementModal } from "@/components/admin/AccountManagementModal";

function StudentsPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [students, setStudents] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showImporter, setShowImporter] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const res = await getStudents({ search, page, pageSize });
        if (res.success) {
            setStudents(res.data);
            setTotalCount(res.totalCount);
        }
        setLoading(false);
    }, [search, page, pageSize]);

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

    const handleApprove = async (userId: number) => {
        const matric = prompt("Enter Matric Number for this student:");
        if (!matric) return;
        const res = await approveStudent(userId, matric);
        if (res.success) fetchStudents();
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Student Management</h2>
                    <p className="text-slate-500 mt-1">Review and manage student records</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        onClick={() => setShowImporter(!showImporter)}
                        variant="outline"
                        className="rounded-xl font-bold text-xs uppercase tracking-widest h-10 border-slate-200 bg-white gap-2"
                    >
                        {showImporter ? <X className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                        {showImporter ? "Close Importer" : "Import Students"}
                    </Button>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
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
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Matric No.</th>
                                <th className="px-6 py-4">Programme</th>
                                <th className="px-6 py-4">Wallet</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
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
                                            <span className="text-sm text-slate-600">{s.programme?.name || 'Not Assigned'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-700">₦{parseFloat(s.walletBalance).toLocaleString()}</span>
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
