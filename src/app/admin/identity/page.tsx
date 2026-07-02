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
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck className="w-12 h-12 text-blue-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic">
                                    Identity Center
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Digital ID issuance and secure authentication monitoring
                            </p>
                        </div>
                        <div className="flex bg-white/10 p-1 rounded-2xl backdrop-blur-md border border-white/10">
                            <Button variant="ghost" className="rounded-xl font-black text-xs uppercase tracking-widest h-11 px-6 bg-white text-blue-600 shadow-md hover:bg-white hover:text-blue-700">Issue Portal</Button>
                            <Button variant="ghost" className="rounded-xl font-black text-xs uppercase tracking-widest h-11 px-6 text-slate-300 hover:text-white hover:bg-white/10">Access Logs</Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Search & List */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Find User or ID..."
                                className="pl-12 h-14 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/50 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                <div className="flex items-center justify-center p-12 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50">
                                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                                </div>
                            ) : filteredUsers.map((u) => (
                                <div
                                    key={u.id + u.type}
                                    onClick={() => setSelectedUser(u)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-center justify-between group hover:-translate-y-1 ${selectedUser?.id === u.id && selectedUser?.type === u.type
                                        ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/30 text-white"
                                        : "bg-white/60 backdrop-blur-xl border-white/40 shadow-sm hover:shadow-md hover:border-blue-300"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedUser?.id === u.id && selectedUser?.type === u.type ? 'bg-white/20 text-white' : u.type === 'student' ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'}`}>
                                            <UserCircle2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm leading-none mb-1 ${selectedUser?.id === u.id && selectedUser?.type === u.type ? 'text-white' : 'text-slate-900'}`}>{u.user?.name}</p>
                                            <p className={`text-[10px] font-black uppercase tracking-tighter ${selectedUser?.id === u.id && selectedUser?.type === u.type ? 'text-blue-200' : 'text-slate-500'}`}>{u.displayId}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${selectedUser?.id === u.id && selectedUser?.type === u.type ? 'bg-white text-blue-600 shadow-sm' : u.type === 'student' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                        {u.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ID Card Preview */}
                    <div className="lg:col-span-2">
                        <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 min-h-[600px] bg-white/60 backdrop-blur-3xl rounded-[2.5rem] flex flex-col items-center justify-center p-8 relative overflow-hidden">
                            {selectedUser ? (
                                <>
                                    <div className="z-10 animate-in fade-in zoom-in duration-500 scale-110">
                                        <IdentityCard
                                            name={selectedUser.user?.name}
                                            id={selectedUser.displayId}
                                            role={selectedUser.type}
                                            department={selectedUser.department?.name || selectedUser.programme?.name}
                                            barcode={selectedUser.barcode}
                                        />
                                    </div>

                                    <div className="mt-16 flex gap-4 z-10">
                                        <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black font-black uppercase text-xs tracking-widest gap-2 shadow-xl hover:-translate-y-1 transition-all">
                                            <Printer className="w-5 h-5" /> Print ID Card
                                        </Button>
                                        <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/50 bg-white/50 backdrop-blur-md font-black uppercase text-xs tracking-widest gap-2 hover:-translate-y-1 hover:shadow-lg transition-all text-slate-700">
                                            <Download className="w-5 h-5" /> Download PDF
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center space-y-6 opacity-40 z-10">
                                    <div className="w-32 h-32 bg-slate-200/50 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                                        <ShieldCheck className="w-16 h-16 text-slate-400" />
                                    </div>
                                    <p className="text-sm font-black uppercase tracking-widest text-slate-500">Select a user to preview Identity Card</p>
                                </div>
                            )}

                            {/* Background Decor */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] select-none pointer-events-none">
                                <ShieldCheck className="w-[800px] h-[800px]" />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
