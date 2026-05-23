"use client";

import { useEffect, useState } from "react";
import { getStudents } from "@/actions/students";
import { getStaffProfiles } from "@/actions/hr";
import { IdentityCard } from "@/components/IdentityCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Printer, ShieldCheck, UserCircle2, Download, RefreshCw } from "lucide-react";

export default function IdentityCenter() {
    const [students, setStudents] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const [stu, stf] = await Promise.all([getStudents(), getStaffProfiles()]);
        setStudents((stu as any).data || []);
        setStaff(stf);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const allUsers = [
        ...students.map(s => ({ ...s, type: 'student', displayId: s.matricNumber || "NOT_APPROVED" })),
        ...staff.map(s => ({ ...s, type: 'staff', displayId: s.staffId || "NO_ID" }))
    ];

    const filteredUsers = allUsers.filter(u =>
        u.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.displayId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-blue-600" /> Identity Management Center
                    </h1>
                    <p className="text-slate-500 font-medium">Digital ID issuance and secure authentication monitoring</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <Button variant="ghost" className="rounded-lg font-bold text-[10px] uppercase tracking-widest h-9 px-4 bg-white shadow-sm border border-slate-200">Issue Portal</Button>
                    <Button variant="ghost" className="rounded-lg font-bold text-[10px] uppercase tracking-widest h-9 px-4 text-slate-500">Access Logs</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Search & List */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Find User or ID..."
                            className="pl-12 h-12 rounded-2xl bg-white border-none shadow-sm font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center p-12">
                                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        ) : filteredUsers.map((u) => (
                            <div
                                key={u.id + u.type}
                                onClick={() => setSelectedUser(u)}
                                className={`p-4 rounded-2xl cursor-pointer transition-all border-2 flex items-center justify-between ${selectedUser?.id === u.id && selectedUser?.type === u.type
                                    ? "bg-blue-50 border-blue-600 shadow-md"
                                    : "bg-white border-transparent hover:border-slate-100"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${u.type === 'student' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-900'}`}>
                                        <UserCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm leading-none mb-1">{u.user?.name}</p>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{u.displayId}</p>
                                    </div>
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${u.type === 'student' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                                    {u.type}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ID Card Preview */}
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-sm min-h-[600px] bg-slate-50/50 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                        {selectedUser ? (
                            <>
                                <div className="z-10 animate-in fade-in zoom-in duration-500">
                                    <IdentityCard
                                        name={selectedUser.user?.name}
                                        id={selectedUser.displayId}
                                        role={selectedUser.type}
                                        department={selectedUser.department?.name || selectedUser.programme?.name}
                                        barcode={selectedUser.barcode}
                                    />
                                </div>

                                <div className="mt-12 flex gap-4 z-10">
                                    <Button className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-black font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl">
                                        <Printer className="w-4 h-4" /> Print ID Card
                                    </Button>
                                    <Button variant="outline" className="h-12 px-8 rounded-2xl border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest gap-2">
                                        <Download className="w-4 h-4" /> Download PDF
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center space-y-4 opacity-30">
                                <ShieldCheck className="w-24 h-24 mx-auto text-slate-200" />
                                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Select a user to preview Identity Card</p>
                            </div>
                        )}

                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] select-none pointer-events-none">
                            <ShieldCheck className="w-[500px] h-[500px]" />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
