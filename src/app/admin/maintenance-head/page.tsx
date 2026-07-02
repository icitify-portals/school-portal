// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { 
    getPendingQuotesAction, 
    reviewRepairQuoteAction,
    getAllGeneralRequestsAction,
    getTechniciansAction,
    assignRequestAction
} from "@/actions/works-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
    Wrench, 
    Clock, 
    CheckCircle2, 
    Building, 
    MapPin, 
    Users, 
    ClipboardList,
    DollarSign,
    AlertTriangle,
    Check,
    X,
    FileText
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

export default function MaintenanceHeadDashboard() {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Review quote state
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
    const [rejectionNotes, setRejectionNotes] = useState("");
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [reviewing, setReviewing] = useState(false);

    // Dispatch state
    const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
    const [selectedTechId, setSelectedTechId] = useState<number | null>(null);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const qRes = await getPendingQuotesAction();
        const rRes = await getAllGeneralRequestsAction();
        const tRes = await getTechniciansAction();

        if (qRes.success && qRes.quotes) {
            setQuotes(qRes.quotes);
        } else {
            toast.error("Failed to load pending quotes");
        }

        if (rRes.success && rRes.requests) {
            setRequests(rRes.requests);
        }

        if (tRes.success && tRes.technicians) {
            setTechnicians(tRes.technicians);
        }
        setLoading(false);
    }

    async function handleApprove(quoteId: number) {
        setReviewing(true);
        const res = await reviewRepairQuoteAction(quoteId, true);
        if (res.success) {
            toast.success("Quote approved and expenditure request submitted to Bursary.");
            loadData();
        } else {
            toast.error(res.error || "Failed to approve quote");
        }
        setReviewing(false);
    }

    async function handleReject() {
        if (!selectedQuoteId) return;
        if (!rejectionNotes.trim()) {
            toast.error("Please supply a reason for rejection.");
            return;
        }

        setReviewing(true);
        const res = await reviewRepairQuoteAction(selectedQuoteId, false, rejectionNotes);
        if (res.success) {
            toast.success(res.message);
            setRejectDialogOpen(false);
            setRejectionNotes("");
            setSelectedQuoteId(null);
            loadData();
        } else {
            toast.error(res.error || "Failed to reject quote");
        }
        setReviewing(false);
    }

    async function handleAssign() {
        if (!selectedReqId || !selectedTechId) {
            toast.error("Please select a technician");
            return;
        }

        setAssigning(true);
        const res = await assignRequestAction(selectedReqId, selectedTechId);
        if (res.success) {
            toast.success(res.message);
            setAssignDialogOpen(false);
            loadData();
        } else {
            toast.error(res.error || "Failed to assign task");
        }
        setAssigning(false);
    }

    // Stats calculations
    const stats = {
        pendingQuotes: quotes.length,
        totalQuoteAmount: quotes.reduce((acc, q) => acc + parseFloat(q.estimatedCost), 0),
        pendingTickets: requests.filter(r => r.status === 'pending').length,
        activeTechs: technicians.filter(t => t.profileStatus === 'active').length,
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 py-6 px-4">
            {/* Header section with rich gradient badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 mb-2 uppercase tracking-wide">
                        <Wrench className="w-3.5 h-3.5" />
                        Supervisor Operations
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Maintenance Supervisor Dashboard</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Review replacement quotes, authorize expenditure requests, and coordinate technician workloads.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Pending Quotes</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.pendingQuotes}</h3>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-lg text-slate-500">
                            <FileText className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Total Outlay Value</p>
                            <h3 className="text-2xl font-black text-indigo-600 mt-1">₦{stats.totalQuoteAmount.toLocaleString()}</h3>
                        </div>
                        <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-500">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest">Pending Dispatches</p>
                            <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.pendingTickets}</h3>
                        </div>
                        <div className="p-2.5 bg-amber-50 rounded-lg text-amber-500">
                            <Clock className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest">Technicians On Duty</p>
                            <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.activeTechs}</h3>
                        </div>
                        <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-500">
                            <Users className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-400 font-medium">
                    Loading supervisor data...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left 2 Cols: Repair Quotes Review */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
                                <CardTitle className="text-lg font-bold text-slate-900">Repair Quotes Awaiting Authorization</CardTitle>
                                <CardDescription>Review and approve estimates. Approved items generate financial expenditure requests.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                {quotes.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400 font-medium">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20 text-emerald-500" />
                                        No pending repair quotes found.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {quotes.map((quote) => (
                                            <div key={quote.id} className="border border-slate-100 rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                                                            Quote #{quote.id}
                                                        </span>
                                                        <h4 className="text-base font-extrabold text-slate-900 uppercase pt-1">
                                                            {quote.itemDescription}
                                                        </h4>
                                                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                                            <Wrench className="w-3.5 h-3.5 text-slate-400" /> Submitted by {quote.technicianName}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-lg font-black text-indigo-600">
                                                            ₦{parseFloat(quote.estimatedCost).toLocaleString()}
                                                        </span>
                                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase">Estimated Cost</p>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 p-3 rounded-lg text-xs font-medium text-slate-600 leading-relaxed">
                                                    <span className="font-bold text-slate-900">Technician Notes:</span> {quote.quoteNotes || "No notes provided."}
                                                </div>

                                                <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-bold text-slate-400">
                                                    <div className="space-y-0.5">
                                                        <span className="flex items-center gap-1">
                                                            <Building className="w-3.5 h-3.5" /> Fault: {quote.requestTitle}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5" /> Location: {quote.buildingName} - {quote.roomOrAreaDescription}
                                                        </span>
                                                    </div>

                                                    <div className="flex gap-2 self-start sm:self-center">
                                                        <Button
                                                            size="sm"
                                                            disabled={reviewing}
                                                            onClick={() => handleApprove(quote.id)}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-[10px] uppercase tracking-widest gap-1"
                                                        >
                                                            <Check className="w-3.5 h-3.5" /> Approve
                                                        </Button>

                                                        <Dialog open={rejectDialogOpen && selectedQuoteId === quote.id} onOpenChange={(open) => {
                                                            setRejectDialogOpen(open);
                                                            if (open) setSelectedQuoteId(quote.id);
                                                        }}>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 text-[10px] font-bold uppercase tracking-widest text-red-600 border-red-200 hover:bg-red-50 gap-1"
                                                                >
                                                                    <X className="w-3.5 h-3.5" /> Reject
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-[425px]">
                                                                <DialogHeader>
                                                                    <DialogTitle>Reject Repair Quote</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="space-y-4 py-4">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="rejectionNotes">Rejection Reason</Label>
                                                                        <Textarea
                                                                            id="rejectionNotes"
                                                                            placeholder="Explain why this quote is rejected (e.g. cost too high, parts already in stock)..."
                                                                            rows={4}
                                                                            value={rejectionNotes}
                                                                            onChange={(e) => setNotesOverride(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button
                                                                        className="bg-red-600 w-full hover:bg-red-700 text-white font-bold h-10 text-xs uppercase tracking-wider"
                                                                        disabled={reviewing}
                                                                        onClick={handleReject}
                                                                    >
                                                                        {reviewing ? "Submitting..." : "Reject Quote"}
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right 1 Col: Dispatch Queue */}
                    <div className="space-y-6">
                        <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
                                <CardTitle className="text-base font-bold text-slate-900">Unassigned Faults</CardTitle>
                                <CardDescription>Dispatch pending tickets to specialists.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4">
                                {requests.filter(r => r.status === 'pending').length === 0 ? (
                                    <div className="py-8 text-center text-xs font-semibold text-slate-400">
                                        No unassigned faults.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
                                        {requests
                                            .filter(r => r.status === 'pending')
                                            .map((req) => (
                                                <div key={req.id} className="py-3 flex flex-col gap-1.5 first:pt-0 last:pb-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h5 className="font-bold text-xs text-slate-900 uppercase truncate">{req.title}</h5>
                                                        <Badge className="text-[9px] font-extrabold uppercase bg-red-50 text-red-600 border-none px-1.5 py-0.5">
                                                            {req.priority}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                                                        <Building className="w-3 h-3" /> {req.buildingName} - {req.roomOrAreaDescription}
                                                    </p>

                                                    <Dialog open={assignDialogOpen && selectedReqId === req.id} onOpenChange={(open) => {
                                                        setAssignDialogOpen(open);
                                                        if (open) setSelectedReqId(req.id);
                                                    }}>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                className="w-full bg-slate-900 text-white font-bold h-7 text-[9px] uppercase tracking-wider mt-1.5"
                                                            >
                                                                Dispatch Crew
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[425px]">
                                                            <DialogHeader>
                                                                    <DialogTitle>Dispatch Technician</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="tech">Select Crew Member</Label>
                                                                    <select
                                                                        id="tech"
                                                                        onChange={(e) => setSelectedTechId(parseInt(e.target.value))}
                                                                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                    >
                                                                        <option value="">-- Choose Specialist --</option>
                                                                        {technicians
                                                                            .filter(t => t.profileStatus === 'active')
                                                                            .map(t => (
                                                                                <option key={t.id} value={t.id}>
                                                                                    {t.name} ({t.specialty.toUpperCase()})
                                                                                </option>
                                                                            ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button
                                                                    className="bg-indigo-600 w-full hover:bg-indigo-700 text-white font-bold h-10 text-xs uppercase tracking-wider"
                                                                    disabled={assigning}
                                                                    onClick={handleAssign}
                                                                >
                                                                    {assigning ? "Assigning..." : "Confirm Dispatch"}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );

    function setNotesOverride(notes: string) {
        setRejectionNotes(notes);
    }
}
