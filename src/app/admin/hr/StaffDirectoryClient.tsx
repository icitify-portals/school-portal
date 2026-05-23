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
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalImporter } from "@/components/UniversalImporter";
import { hireStaff, bulkImportStaff } from "@/actions/hr";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AccountManagementModal } from "@/components/admin/AccountManagementModal";

interface StaffDirectoryClientProps {
    initialStaff: any[];
    nonStaffUsers: any[];
    departments: any[];
}

export function StaffDirectoryClient({ initialStaff, nonStaffUsers, departments }: StaffDirectoryClientProps) {
    const [search, setSearch] = useState("");
    const [showImporter, setShowImporter] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const router = useRouter();

    const filteredStaff = initialStaff.filter(s =>
        s.user?.name.toLowerCase().includes(search.toLowerCase()) ||
        s.user?.email.toLowerCase().includes(search.toLowerCase()) ||
        s.staffId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Staff Directory</h1>
                    <p className="text-slate-500 mt-1">Manage institutional human resources and employment status.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setShowImporter(!showImporter)}
                        variant="outline"
                        className="rounded-xl font-bold text-xs uppercase tracking-widest h-10 border-slate-200 bg-white gap-2"
                    >
                        {showImporter ? <X className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                        {showImporter ? "Close Importer" : "Import Staff"}
                    </Button>
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
                {/* Hiring Form */}
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

                {/* Staff List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 uppercase tracking-tight italic">Employment Records</h2>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                />
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
                                        <th className="px-6 py-4 text-right">Actions</th>
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
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedUser(s.user)}
                                                    className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                >
                                                    Account
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStaff.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
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
        </div>
    );
}
