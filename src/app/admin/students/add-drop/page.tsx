"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Users,
    BookOpen,
    Filter,
    Search,
    UserCheck,
    History
} from "lucide-react";
import { toast } from "sonner";
import {
    getAddDropRequests,
    processAddDropRequest
} from "@/actions/registration";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AdviserAddDropPage() {
    const { data: authSession } = useSession();
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        // In a real scenario, we'd get the adviser's department ID from their profile
        const data = await getAddDropRequests();
        setRequests(data);
        setLoading(false);
    };

    const handleAction = async (requestId: number, action: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;

        setProcessingId(requestId);
        const processorId = (authSession?.user as any).id;
        const res = await processAddDropRequest(requestId, action, processorId);

        if (res.success) {
            toast.success(res.message);
            loadData();
        } else {
            toast.error(res.error);
        }
        setProcessingId(null);
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>;

    const filteredRequests = requests.filter(r =>
        r.student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.student.regNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic uppercase">
                        <UserCheck className="w-10 h-10 text-indigo-600" />
                        Add/Drop Approvals
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Manage course adjustment requests for your department</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search students or courses..."
                            className="rounded-2xl border-slate-200 py-6 pl-10 font-bold shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={loadData} variant="outline" className="rounded-2xl px-6 py-6 border-slate-200 font-black uppercase text-[10px] tracking-widest">
                        Refresh
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {filteredRequests.length === 0 ? (
                    <Card className="border-none shadow-xl rounded-[3rem] bg-slate-50 border-2 border-dashed border-slate-200">
                        <CardContent className="p-20 text-center space-y-4">
                            <Users className="w-16 h-16 mx-auto text-slate-300" />
                            <h3 className="text-xl font-black text-slate-400 italic uppercase">No Pending Requests</h3>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">All course adjustments have been processed</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredRequests.map((req) => (
                        <Card key={req.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden group transition-all hover:shadow-2xl">
                            <div className="flex flex-col lg:flex-row">
                                <div className="p-8 lg:w-1/3 bg-slate-900 text-white space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center font-black text-lg">
                                            {req.student.user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-black italic uppercase text-lg leading-tight">{req.student.user.name}</h3>
                                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">{req.student.regNo || "No Reg No"}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Level</p>
                                            <p className="font-bold text-sm">{req.student.level}L</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Semester</p>
                                            <p className="font-bold text-sm">{req.semester === 1 ? "1st" : "2nd"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 flex-1 bg-white flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <Badge className={cn(
                                                    "px-3 py-1 rounded-full font-black uppercase text-[9px] tracking-widest",
                                                    req.type === 'add' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                )}>
                                                    {req.type === 'add' ? "Addition Request" : "Removal Request"}
                                                </Badge>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                    Submitted {new Date(req.requestedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-900 italic uppercase">
                                                {req.course.code}: {req.course.name}
                                            </h2>
                                            <p className="text-slate-500 font-bold text-sm italic">
                                                Reason: {req.reason || "No reason provided"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-slate-900 leading-tight">{req.course.units}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-4">
                                        <Button
                                            onClick={() => handleAction(req.id, 'approved')}
                                            disabled={processingId === req.id}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-8 rounded-[1.5rem] shadow-xl shadow-indigo-100 uppercase text-xs tracking-widest flex gap-3"
                                        >
                                            {processingId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                            Approve Request
                                        </Button>
                                        <Button
                                            onClick={() => handleAction(req.id, 'rejected')}
                                            disabled={processingId === req.id}
                                            variant="outline"
                                            className="px-8 py-8 rounded-[1.5rem] border-rose-200 text-rose-500 hover:bg-rose-50 font-black uppercase text-xs tracking-widest flex gap-3"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
