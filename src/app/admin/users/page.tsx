"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { getAllUsers } from "@/actions/user-actions";
import { getFaculties } from "@/actions/faculties";
import { getDepartments } from "@/actions/departments";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Users,
    UserPlus,
    Upload,
    Download,
    Search,
    Loader2,
    Mail,
    Shield,
    CheckCircle2,
    XCircle,
    ShieldAlert
} from "lucide-react";
import { UniversalImporter } from "@/components/UniversalImporter";
import { bulkImportUsers } from "@/actions/user-actions";
import { cn } from "@/lib/utils";
import { impersonateUser } from "@/actions/impersonation";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Suspense } from "react";
import { AccountManagementModal } from "@/components/admin/AccountManagementModal";

function UserManagementPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [users, setUsers] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showImport, setShowImport] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchString = searchParams.get("search") || "";
    const facultyId = searchParams.get("facultyId") ? parseInt(searchParams.get("facultyId")!) : undefined;
    const deptId = searchParams.get("deptId") ? parseInt(searchParams.get("deptId")!) : undefined;
    const level = searchParams.get("level") ? parseInt(searchParams.get("level")!) : undefined;

    const [faculties, setFaculties] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        getFaculties().then(setFaculties);
        getDepartments().then(setDepartments);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await getAllUsers({ search: searchString, page, pageSize, facultyId, deptId, level });
        if (res.success) {
            setUsers(res.data);
            setTotalCount(res.totalCount);
        }
        setLoading(false);
    }, [searchString, page, pageSize, facultyId, deptId, level]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSearch = (value: string) => {
        handleFilterChange("search", value);
    };

    const handleExport = async () => {
        setIsExporting(true);
        const res = await getAllUsers({ search: searchString, facultyId, deptId, level, exportMode: true });
        if (res.success && res.data) {
            const csv = Papa.unparse(res.data.map((u: any) => ({
                Name: u.name,
                Email: u.email,
                Role: u.role,
                Status: u.status,
                Faculty: u.faculty || 'N/A',
                Department: u.department || 'N/A',
                Level: u.level || 'N/A',
                Session: u.session || 'N/A',
                Joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'
            })));
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Users_Export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Export failed");
        }
        setIsExporting(false);
    };

    const handleImport = async (data: any[]) => {
        const res = await bulkImportUsers(data);
        if (res.success) {
            alert(res.message);
            setShowImport(false);
            fetchData();
        } else {
            alert(res.error);
        }
        return res as { success: boolean; message?: string; error?: string };
    };

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-600" />
                        User Management
                    </h1>
                    <p className="text-slate-500 font-medium">Manage system users, roles, and authentication</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 border-slate-200 text-indigo-700 hover:bg-indigo-50"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowImport(!showImport)}
                        className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 border-slate-200"
                    >
                        <Upload className="w-4 h-4 mr-2" /> {showImport ? "Cancel Import" : "Bulk Import"}
                    </Button>
                    <Button className="rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 bg-slate-900 hover:bg-black shadow-lg">
                        <UserPlus className="w-4 h-4 mr-2" /> Add User
                    </Button>
                </div>
            </div>

            {showImport && (
                <Card className="border-2 border-dashed border-indigo-100 bg-indigo-50/30 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-900">Bulk User Import (CSV/XLSX)</CardTitle>
                        <p className="text-xs text-indigo-600">Columns required: <span className="font-bold underline">name, email</span>. Optional: <span className="font-bold">role, type, level, jobTitle</span></p>
                    </CardHeader>
                    <CardContent>
                        <UniversalImporter
                            title="User Import"
                            description="Upload a CSV or XLSX file with user data"
                            templateColumns={["name", "email", "role", "type", "level", "jobTitle"]}
                            onImport={handleImport}
                        />
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6">
                <Card className="border-none shadow-sm overflow-hidden flex flex-col">
                    <CardHeader className="border-b border-slate-50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pb-4">
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search users..."
                                    className="pl-11 h-10 bg-slate-50 border-none rounded-xl text-sm font-medium"
                                    defaultValue={searchString}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleSearch((e.target as HTMLInputElement).value);
                                        }
                                    }}
                                />
                            </div>
                            <select 
                                className="h-10 bg-slate-50 border-none rounded-xl text-sm font-medium px-4 text-slate-600 outline-none w-full md:w-auto"
                                value={facultyId || ""}
                                onChange={(e) => handleFilterChange("facultyId", e.target.value)}
                            >
                                <option value="">All Faculties</option>
                                {faculties.map((f: any) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <select 
                                className="h-10 bg-slate-50 border-none rounded-xl text-sm font-medium px-4 text-slate-600 outline-none w-full md:w-auto"
                                value={deptId || ""}
                                onChange={(e) => handleFilterChange("deptId", e.target.value)}
                            >
                                <option value="">All Departments</option>
                                {departments.filter((d: any) => !facultyId || d.facultyId === facultyId).map((d: any) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                            <select 
                                className="h-10 bg-slate-50 border-none rounded-xl text-sm font-medium px-4 text-slate-600 outline-none w-full md:w-auto"
                                value={level || ""}
                                onChange={(e) => handleFilterChange("level", e.target.value)}
                            >
                                <option value="">All Levels</option>
                                <option value="100">100 Level</option>
                                <option value="200">200 Level</option>
                                <option value="300">300 Level</option>
                                <option value="400">400 Level</option>
                                <option value="500">500 Level</option>
                                <option value="600">600 Level</option>
                            </select>
                        </div>
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">
                            Total Users: {totalCount}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                                        <th className="px-6 py-4">User Details</th>
                                        <th className="px-6 py-4">Current Role</th>
                                        <th className="px-6 py-4">Academic Info</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Joined</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" />
                                                <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving user data...</p>
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                                                No users found matching your search.
                                            </td>
                                        </tr>
                                    ) : users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <Users className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{user.name}</p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                                            <Mail className="w-3.3 h-3.3" /> {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Shield className={cn("w-3.5 h-3.5",
                                                        user.role === 'admin' ? "text-rose-500" :
                                                            user.role === 'staff' ? "text-blue-500" : "text-slate-400"
                                                    )} />
                                                    <span className={cn("text-[10px] font-black uppercase tracking-tighter",
                                                        user.role === 'admin' ? "text-rose-600" :
                                                            user.role === 'staff' ? "text-blue-600" : "text-slate-500"
                                                    )}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.department || user.level ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black uppercase text-slate-700">
                                                            {user.department || 'N/A'} {user.faculty ? `(${user.faculty})` : ""}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-500">
                                                            Level: {user.level || 'N/A'} | Session: {user.session || 'N/A'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-medium text-slate-400 italic">Not Applicable</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    {user.status === 'active' ? (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                    ) : (
                                                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                                    )}
                                                    <span className="text-[10px] font-bold text-slate-600 capitalize">
                                                        {user.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] font-medium text-slate-500">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={async () => {
                                                        if (confirm(`Do you want to log in as ${user.name}?`)) {
                                                            const res = await impersonateUser(user.id);
                                                            if (res.success) {
                                                                window.location.href = "/";
                                                            } else {
                                                                alert(res.error);
                                                            }
                                                        }
                                                    }}
                                                    className="h-8 w-8 p-0 rounded-lg text-amber-600 hover:bg-amber-50"
                                                    title="Login As"
                                                >
                                                    <ShieldAlert className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setSelectedUser(user)}
                                                    className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                >
                                                    Manage
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <DataTablePagination
                            totalItems={totalCount}
                            pageSize={pageSize}
                            currentPage={page}
                        />
                    </CardContent>
                </Card>
            </div>

            <AccountManagementModal 
                user={selectedUser} 
                onClose={() => setSelectedUser(null)}
                onUpdate={fetchData}
            />
        </div>
    );
}

export default function UserManagementPage() {
    return (
        <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>}>
            <UserManagementPageContent />
        </Suspense>
    );
}
