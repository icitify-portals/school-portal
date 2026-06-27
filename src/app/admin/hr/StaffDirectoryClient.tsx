"use client";

import { useState } from "react";
import {
    Users,
    UserPlus,
    Briefcase,
    Building2,
    Calendar,
    Search,
    FileUp,
    X,
    QrCode,
    Loader2,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalImporter } from "@/components/UniversalImporter";
import { hireStaff, bulkImportStaff } from "@/actions/hr";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AccountManagementModal } from "@/components/admin/AccountManagementModal";
import { generateIdentityQRCodeAction } from "@/actions/utility-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface StaffDirectoryClientProps {
    initialStaff: any[];
    nonStaffUsers: any[];
    departments: any[];
    userRole: string;
}

export function StaffDirectoryClient({ initialStaff, nonStaffUsers, departments, userRole }: StaffDirectoryClientProps) {
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [gradeFilter, setGradeFilter] = useState("");
    const [showImporter, setShowImporter] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const router = useRouter();

    const [qrStaff, setQrStaff] = useState<any | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);

    const handleViewQR = async (staff: any) => {
        setQrStaff(staff);
        setQrLoading(true);
        setQrDataUrl(null);
        try {
            // Staff ID QR format: stf:<staffId || staffRecordId>
            const idVal = staff.staffId || staff.id;
            const res = await generateIdentityQRCodeAction(`stf:${idVal}`);
            if (res.success && res.dataUrl) {
                setQrDataUrl(res.dataUrl);
            } else {
                alert(res.error || "Failed to generate ID QR");
                setQrStaff(null);
            }
        } catch (error: any) {
            alert(error.message || "An unexpected error occurred");
            setQrStaff(null);
        } finally {
            setQrLoading(false);
        }
    };

    const canManageStaff = ["admin", "superadmin", "registrar", "dvc"].includes(userRole);

    const filteredStaff = initialStaff.filter(s => {
        const matchesSearch = 
            s.user?.name.toLowerCase().includes(search.toLowerCase()) ||
            s.user?.email.toLowerCase().includes(search.toLowerCase()) ||
            s.staffId?.toLowerCase().includes(search.toLowerCase());
        
        const matchesCategory = 
            !categoryFilter || s.staffCategory === categoryFilter;

        const matchesDepartment = 
            !departmentFilter || s.departmentId === parseInt(departmentFilter);

        const matchesGrade = 
            !gradeFilter || s.gradeLevel === gradeFilter;

        return matchesSearch && matchesCategory && matchesDepartment && matchesGrade;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Staff Directory</h1>
                    <p className="text-slate-500 mt-1">Manage institutional human resources and employment status.</p>
                </div>
                <div className="flex items-center gap-4">
                    {canManageStaff && (
                        <Button
                            onClick={() => setShowImporter(!showImporter)}
                            variant="outline"
                            className="rounded-xl font-bold text-xs uppercase tracking-widest h-10 border-slate-200 bg-white gap-2"
                        >
                            {showImporter ? <X className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                            {showImporter ? "Close Importer" : "Import Staff"}
                        </Button>
                    )}
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <Users className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1">Total Employees</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{initialStaff.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {showImporter && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <UniversalImporter
                        title="Bulk Staff Import"
                        description="Import staff records from Excel/CSV. Ensure columns match: name, email, jobTitle, departmentId, gradeLevel, staffId."
                        templateColumns={["name", "email", "jobTitle", "departmentId", "gradeLevel", "staffId"]}
                        onImport={bulkImportStaff}
                        onComplete={() => {
                            setShowImporter(false);
                            router.refresh();
                        }}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Hiring Form - Only shown to authorized roles */}
                {canManageStaff && (
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-8">
                            <div className="flex items-center gap-2 mb-6 text-blue-600">
                                <UserPlus className="w-5 h-5" />
                                <h2 className="font-bold uppercase tracking-tight italic">Hire New Staff</h2>
                            </div>

                            <form action={async (formData) => {
                                const userId = parseInt(formData.get("userId") as string);
                                const departmentId = parseInt(formData.get("departmentId") as string);
                                const jobTitle = formData.get("jobTitle") as string;
                                const gradeLevel = formData.get("gradeLevel") as string;

                                await hireStaff({
                                    userId,
                                    departmentId,
                                    jobTitle,
                                    gradeLevel
                                });
                                router.refresh();
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Select User</label>
                                    <select name="userId" required className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                        <option value="">Choose a user...</option>
                                        {nonStaffUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Job Title</label>
                                    <input name="jobTitle" type="text" placeholder="e.g. Senior Lecturer" required className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Department</label>
                                    <select name="departmentId" required className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                        <option value="">Select Department</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Grade Level</label>
                                    <select name="gradeLevel" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                        <option value="L1">Level 1</option>
                                        <option value="L2">Level 2</option>
                                        <option value="L3">Level 3</option>
                                        <option value="L4">Level 4</option>
                                        <option value="L5">Level 5</option>
                                    </select>
                                </div>

                                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-700 transition shadow-lg mt-2">
                                    Complete Onboarding
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Staff List */}
                <div className={cn(canManageStaff ? "lg:col-span-2" : "lg:col-span-3")}>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="font-bold text-slate-800 uppercase tracking-tight italic">Employment Records</h2>
                            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                                <select
                                    className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    <option value="academic">Academic</option>
                                    <option value="non-academic">Non-Academic</option>
                                    <option value="management">Management</option>
                                    <option value="security">Security</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>

                                <select
                                    className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
                                    value={gradeFilter}
                                    onChange={(e) => setGradeFilter(e.target.value)}
                                >
                                    <option value="">All Levels</option>
                                    <option value="L1">Level 1</option>
                                    <option value="L2">Level 2</option>
                                    <option value="L3">Level 3</option>
                                    <option value="L4">Level 4</option>
                                    <option value="L5">Level 5</option>
                                </select>

                                <select
                                    className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                >
                                    <option value="">All Departments</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id.toString()}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>

                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search staff..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm w-48 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Designation</th>
                                        <th className="px-6 py-4">Department</th>
                                        <th className="px-6 py-4">Joined</th>
                                        <th className="px-6 py-4">Status</th>
                                        {canManageStaff && <th className="px-6 py-4 text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 italic">
                                    {filteredStaff.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">
                                                        {s.user?.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm leading-none mb-1">{s.user?.name}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{s.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-700">{s.jobTitle}</span>
                                                </div>
                                                <span className="text-[9px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 tracking-tighter">{s.gradeLevel}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-700">{s.department?.name || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {new Date(s.employmentDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                                    s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                )}>
                                                    {s.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            {canManageStaff && (
                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewQR(s)}
                                                        className="h-8 w-8 p-0 rounded-lg text-indigo-600 hover:bg-indigo-50 flex items-center justify-center"
                                                        title="View Staff QR ID"
                                                    >
                                                        <QrCode className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedUser(s.user)}
                                                        className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                    >
                                                        Account
                                                    </Button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredStaff.length === 0 && (
                                        <tr>
                                            <td colSpan={canManageStaff ? 6 : 5} className="px-6 py-12 text-center text-slate-400 italic">
                                                No staff records found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <AccountManagementModal 
                user={selectedUser} 
                onClose={() => setSelectedUser(null)}
                onUpdate={() => router.refresh()}
            />

            {/* Staff ID QR Modal */}
            <Dialog open={!!qrStaff} onOpenChange={(open) => {
                if (!open) {
                    setQrStaff(null);
                    setQrDataUrl(null);
                }
            }}>
                <DialogContent className="border-none shadow-2xl rounded-[2.5rem] bg-white max-w-sm p-8">
                    <DialogHeader className="text-center space-y-3">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                            <QrCode className="w-6 h-6 animate-pulse" />
                        </div>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-slate-900">
                            Staff QR ID
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium text-xs">
                            Verify staff identity using this secure QR code.
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
                                    <img src={qrDataUrl} alt="Staff QR ID Card" className="w-48 h-48 mix-blend-multiply" />
                                </div>
                                {qrStaff && (
                                    <div className="text-center space-y-1">
                                        <p className="font-black text-slate-900 uppercase italic text-sm">{qrStaff.user?.name}</p>
                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                                            {qrStaff.staffId ? `STAFF ID: ${qrStaff.staffId}` : `RECORD ID: ${qrStaff.id}`}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{qrStaff.jobTitle}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{qrStaff.department?.name || 'N/A'}</p>
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
                                setQrStaff(null);
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
