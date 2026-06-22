"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    getScholarships,
    createScholarship,
    allocateScholarship,
    getScholarshipAllocations
} from "@/actions/bursary";
import { getCurrentSession } from "@/actions/portal";
import {
    GraduationCap,
    Plus,
    Loader2,
    Search,
    UserCheck,
    FileText,
    Clock,
    Building2,
    Calendar,
    Users
} from "lucide-react";
import StudentSearch from "@/components/shared/StudentSearch";
import { toast } from "sonner";

export default function ScholarshipsPage() {
    const [scholarships, setScholarships] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isAllocating, setIsAllocating] = useState(false);
    const [selectedScholarship, setSelectedScholarship] = useState<any>(null);
    const [currentSession, setCurrentSession] = useState<any>(null);

    // Form state (New Scholarship)
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [provider, setProvider] = useState("");
    const [type, setType] = useState<'full' | 'partial_fixed' | 'partial_percentage'>("full");
    const [amount, setAmount] = useState("");
    const [percentage, setPercentage] = useState("");

    // Form state (Allocation)
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [data, session, allocs] = await Promise.all([
            getScholarships(),
            getCurrentSession(),
            getScholarshipAllocations()
        ]);
        setScholarships(data);
        setCurrentSession(session);
        setAllocations(allocs);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!name) return toast.error("Scholarship name is required");
        const res = await createScholarship({
            name, description, provider, type, amount, percentage
        });
        if (res.success) {
            setIsAdding(false);
            setName("");
            fetchData();
            toast.success("Scholarship protocol created");
        } else {
            toast.error(res.error || "Failed to create scholarship");
        }
    };

    const handleAllocate = async () => {
        if (!selectedScholarship || !currentSession || !selectedStudent) {
            return toast.error("Please select a student");
        }
        const res = await allocateScholarship({
            scholarshipId: selectedScholarship.id,
            studentId: selectedStudent.id,
            sessionId: currentSession.id
        });
        if (res.success) {
            setIsAllocating(false);
            setSelectedStudent(null);
            fetchData();
            toast.success(`Scholarship granted to ${selectedStudent.user?.name}`);
        } else {
            toast.error(res.error || "Failed to allocate scholarship");
        }
    };

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 italic uppercase">
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100 italic">
                            <GraduationCap className="w-8 h-8" />
                        </div>
                        Scholarships <span className="text-emerald-600">&</span> Sponsorships
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Manage institutional funding and external aid protocols
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl h-12 shadow-md hover:shadow-lg transition-all font-bold px-6 border-b-4 border-emerald-800"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus className="w-5 h-5 mr-2" /> New Protocol
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="protocols" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 mb-8">
                    <TabsTrigger value="protocols" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Funding Protocols
                    </TabsTrigger>
                    <TabsTrigger value="active" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Active Grants ({allocations.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="protocols" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    {isAdding && (
                        <Card className="border-2 border-emerald-100 shadow-xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 p-6">
                                <CardTitle className="text-xl font-black italic uppercase text-emerald-900">Configure New Funding Protocol</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scholarship Identity</Label>
                                    <Input placeholder="e.g. Presidential Merit Award" className="h-12 rounded-xl text-lg font-bold" value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Funding Provider</Label>
                                    <Input placeholder="e.g. Federal Ministry of Education" className="h-12 rounded-xl text-lg font-bold" value={provider} onChange={e => setProvider(e.target.value)} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coverage Description</Label>
                                    <Input placeholder="Detailed scope of funding..." className="h-12 rounded-xl text-lg font-bold" value={description} onChange={e => setDescription(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Protocol Type</Label>
                                    <Select value={type} onValueChange={(val: any) => setType(val)}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200">
                                            <SelectItem value="full">100% Full Tuition Coverage</SelectItem>
                                            <SelectItem value="partial_fixed">Fixed Amount Reduction</SelectItem>
                                            <SelectItem value="partial_percentage">Percentage-Based Aid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {type === 'partial_fixed' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grant Amount (₦)</Label>
                                        <Input type="number" placeholder="50000" className="h-12 rounded-xl text-lg font-bold" value={amount} onChange={e => setAmount(e.target.value)} />
                                    </div>
                                )}
                                {type === 'partial_percentage' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aid Percentage (%)</Label>
                                        <Input type="number" placeholder="50" max="100" className="h-12 rounded-xl text-lg font-bold" value={percentage} onChange={e => setPercentage(e.target.value)} />
                                    </div>
                                )}

                                <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <Button variant="outline" className="h-12 rounded-xl px-8 font-bold" onClick={() => setIsAdding(false)}>Cancel</Button>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl px-8 font-bold" onClick={handleCreate}>Deploy Protocol</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {isAllocating && (
                        <Card className="border-2 border-indigo-100 shadow-xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 p-6">
                                <CardTitle className="text-xl font-black italic uppercase text-indigo-900">Grant Scholarship: {selectedScholarship?.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Beneficiary</Label>
                                    <StudentSearch
                                        onSelect={setSelectedStudent}
                                        placeholder="Type name or matric number..."
                                        className="max-w-xl"
                                    />
                                    {selectedStudent && (
                                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                    <UserCheck className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedStudent.user?.name}</p>
                                                    <p className="text-[10px] text-emerald-600 font-bold tracking-widest uppercase">{selectedStudent.matricNumber || 'NO MATRIC'}</p>
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-600/10 text-emerald-700 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase">Selected</Badge>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <Button variant="outline" className="h-12 rounded-xl px-8 font-bold" onClick={() => setIsAllocating(false)}>Cancel</Button>
                                    <Button
                                        disabled={!selectedStudent}
                                        className="bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl px-8 font-bold disabled:opacity-50"
                                        onClick={handleAllocate}
                                    >
                                        Confirm Accession
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {scholarships.map(s => (
                            <Card key={s.id} className="group border-none shadow-md hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between p-6">
                                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl transition-transform group-hover:scale-110 duration-500">
                                        <GraduationCap className="w-6 h-6" />
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border-slate-200 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors">
                                        {s.type.replace('_', ' ')}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <h3 className="font-black text-2xl text-slate-900 mb-2 tracking-tighter italic uppercase underline decoration-emerald-500 underline-offset-4 decoration-2">{s.name}</h3>
                                    <p className="text-xs text-slate-400 mb-6 font-bold uppercase tracking-widest flex items-center gap-1">
                                        <Building2 className="w-3 h-3" />
                                        {s.provider || "Institutional Funding"}
                                    </p>

                                    <div className="text-4xl font-black text-slate-800 mb-8 tracking-tighter italic">
                                        {s.type === 'full' && '100% FREE'}
                                        {s.type === 'partial_fixed' && `₦${parseFloat(s.amount).toLocaleString()}`}
                                        {s.type === 'partial_percentage' && `${parseFloat(s.percentage)}% OFF`}
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full h-14 gap-3 bg-slate-900 border-none text-white hover:bg-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-200 group-hover:-translate-y-1 transition-transform"
                                        onClick={() => { setSelectedScholarship(s); setIsAllocating(true); }}
                                    >
                                        <UserCheck className="w-5 h-5" /> Grant To Student
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {!loading && scholarships.length === 0 && (
                        <div className="text-center py-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] animate-pulse">
                            <GraduationCap className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-slate-400 uppercase italic tracking-widest">No Active Protocols</h3>
                            <p className="text-slate-300 max-w-sm mx-auto mt-4 font-medium italic">Deploy institutional grant frameworks to assist qualified students with tuition obligations.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="active" className="animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-8 py-6">Beneficiary Identity</th>
                                        <th className="px-8 py-6">Grant Details</th>
                                        <th className="px-8 py-6">Academic Period</th>
                                        <th className="px-8 py-6">Status</th>
                                        <th className="px-8 py-6 bg-slate-800/50">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allocations.map((a) => (
                                        <tr key={a.allocation.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black italic shadow-inner">
                                                        {a.user?.name?.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{a.user?.name}</span>
                                                        <span className="text-[10px] text-indigo-600 font-bold tracking-[0.1em] font-mono">{a.student?.matricNumber || 'PENDING MATRIC'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-black text-slate-700 uppercase italic group-hover:text-indigo-600 transition-colors underline decoration-indigo-200 underline-offset-4 decoration-2">{a.scholarship?.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{a.scholarship?.type.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 italic uppercase">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Current Academic Cycle
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <Badge className="bg-emerald-50 text-emerald-700 border-none font-black uppercase text-[9px] tracking-widest px-3">Active</Badge>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 bg-slate-50/50">
                                                <Button variant="outline" size="sm" className="h-10 rounded-xl px-4 font-black uppercase text-[9px] tracking-widest border-slate-200 bg-white hover:bg-slate-900 hover:text-white transition-all">
                                                    Revoke Grant
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {allocations.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                                <p className="text-slate-300 font-black uppercase tracking-widest text-xs italic">No disbursements processed for this cycle.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {loading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
                </div>
            )}
        </div>
    );
}
