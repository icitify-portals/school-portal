"use client";

import { useState, useEffect } from "react";
import { 
    ArrowRightLeft, 
    Search, 
    User, 
    Building2, 
    ArrowRight, 
    Info,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInstitutionalUnits } from "@/actions/institutional_units";
import { transferStudent } from "@/lib/mobility";
import { useBranch } from "@/providers/BranchProvider";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function StudentTransferPage() {
    const { activeUnit } = useBranch();
    const { data: session } = useSession();
    const [units, setUnits] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [targetUnitId, setTargetUnitId] = useState<string>("");
    const [newMatric, setNewMatric] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getInstitutionalUnits().then(setUnits);
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        // In a real app, this would call a server action to find student by matric
        // Mocking finding a student for the demonstration
        setTimeout(() => {
            setSelectedStudent({
                id: 1,
                userId: 101,
                name: "Adebayo Kolawole",
                matricNumber: "OSH-2024-045",
                unitName: activeUnit?.name || "Current School"
            });
            setLoading(false);
        }, 800);
    };

    const handleTransfer = async () => {
        if (!selectedStudent || !targetUnitId || !newMatric) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);
        const res = await transferStudent({
            studentId: selectedStudent.id,
            toUnitId: Number(targetUnitId),
            newMatricNumber: newMatric,
            reason: reason,
            movedBy: Number(session?.user?.id || 1)
        });

        if (res.success) {
            toast.success("Student transferred successfully!");
            setSelectedStudent(null);
            setTargetUnitId("");
            setNewMatric("");
            setReason("");
        } else {
            toast.error(res.error || "Transfer failed");
        }
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <div className="bg-indigo-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ArrowRightLeft className="w-8 h-8 text-indigo-600" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 italic uppercase">Records Mobility Portal</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Transfer students between branches and annexes</p>
            </div>

            {/* Step 1: Search */}
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 italic">
                        <Search className="w-5 h-5 text-indigo-400" />
                        Search Student
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="flex gap-4">
                        <Input 
                            placeholder="Current Admission/Matric Number..." 
                            className="rounded-2xl border-slate-200 py-6 font-bold"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button 
                            onClick={handleSearch}
                            disabled={loading || !searchQuery}
                            className="bg-slate-900 hover:bg-black text-white px-8 h-auto rounded-2xl font-black uppercase text-[10px] tracking-widest"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Identify Student"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {selectedStudent && (
                <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                    <Card className="bg-indigo-600 text-white border-none shadow-xl rounded-[2.5rem] p-8 relative overflow-hidden">
                        <User className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic">{selectedStudent.name}</h2>
                                <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mt-1">Current Branch: {selectedStudent.unitName}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none shadow-2xl rounded-[3rem] p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Target Branch</label>
                                    <select 
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-black text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={targetUnitId}
                                        onChange={(e) => setTargetUnitId(e.target.value)}
                                    >
                                        <option value="">Select Destination Branch</option>
                                        {units.filter(u => u.unit.id !== activeUnit?.id).map((u) => (
                                            <option key={u.unit.id} value={u.unit.id}>{u.unit.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 italic">New Admission Number</label>
                                    <Input 
                                        placeholder="e.g. SUR-2024-001" 
                                        className="rounded-2xl border-slate-200 py-6 font-bold"
                                        value={newMatric}
                                        onChange={(e) => setNewMatric(e.target.value)}
                                    />
                                    <p className="text-[9px] text-slate-400 font-bold px-1 italic">The old number ({selectedStudent.matricNumber}) will be kept as a reference.</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Reason for Transfer</label>
                                    <textarea 
                                        className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Explain the reason for this branch movement..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-slate-100 rounded-[2rem] border border-slate-200 border-dashed">
                            <div className="flex items-start gap-4">
                                <Info className="w-5 h-5 text-indigo-600 mt-1 shrink-0" />
                                <div className="text-[11px] text-slate-600 font-bold leading-relaxed italic">
                                    Upon execution, all academic records, financial history, and personal data will be migrated to the target branch.
                                    The current school will retain <span className="text-indigo-600 font-black">Read-Only</span> access to the student&apos;s past records.
                                </div>
                            </div>
                        </div>

                        <Button 
                            onClick={handleTransfer}
                            disabled={loading || !targetUnitId || !newMatric}
                            className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white py-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02]"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Finalize & Execute Transfer"}
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );
}
