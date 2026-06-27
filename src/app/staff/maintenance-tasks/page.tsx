"use client";

import { useState, useEffect } from "react";
import { getMyTasksAction, resolveRequestAction, submitRepairQuoteAction } from "@/actions/works-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
    Wrench, 
    Clock, 
    CheckCircle2, 
    Building, 
    MapPin, 
    AlertTriangle,
    CheckCircle,
    ClipboardCheck,
    FileText,
    DollarSign
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

export default function TechnicianTasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [notes, setNotes] = useState("");
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    
    // Dialog control states
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

    // Quote form state
    const [itemDescription, setItemDescription] = useState("");
    const [estimatedCost, setEstimatedCost] = useState("");
    const [quoteNotes, setQuoteNotes] = useState("");
    const [submittingQuote, setSubmittingQuote] = useState(false);

    useEffect(() => {
        loadTasks();
    }, []);

    async function loadTasks() {
        setLoading(true);
        const res = await getMyTasksAction();
        if (res.success && res.tasks) {
            setTasks(res.tasks);
        } else {
            toast.error(res.error || "Failed to load assigned tasks");
        }
        setLoading(false);
    }

    async function handleResolve() {
        if (!selectedTaskId) return;
        if (!notes.trim()) {
            toast.error("Please enter resolution notes detailing the fix.");
            return;
        }

        setUpdating(true);
        const res = await resolveRequestAction(selectedTaskId, notes);
        if (res.success) {
            toast.success(res.message);
            setResolveDialogOpen(false);
            setNotes("");
            setSelectedTaskId(null);
            loadTasks();
        } else {
            toast.error(res.error || "Failed to update task status");
        }
        setUpdating(false);
    }

    async function handleQuoteSubmit() {
        if (!selectedTaskId) return;
        if (!itemDescription.trim()) {
            toast.error("Item/Appliance description is required.");
            return;
        }
        const costNum = parseFloat(estimatedCost);
        if (isNaN(costNum) || costNum <= 0) {
            toast.error("Please enter a valid estimated cost.");
            return;
        }

        setSubmittingQuote(true);
        const res = await submitRepairQuoteAction({
            requestId: selectedTaskId,
            itemDescription,
            estimatedCost: costNum,
            quoteNotes
        });

        if (res.success) {
            toast.success(res.message);
            setQuoteDialogOpen(false);
            setItemDescription("");
            setEstimatedCost("");
            setQuoteNotes("");
            setSelectedTaskId(null);
            loadTasks();
        } else {
            toast.error(res.error || "Failed to submit quote");
        }
        setSubmittingQuote(false);
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
            {/* Header section with rich gradient badge */}
            <div className="border-b border-slate-100 pb-5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 mb-2 uppercase tracking-wide">
                    <Wrench className="w-3.5 h-3.5" />
                    Technician Work Orders
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Assigned Tasks</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Review and manage maintenance work orders assigned to you.</p>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-400 font-medium">
                    Loading assigned tasks...
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-slate-300 stroke-[1.5]" />
                    <h3 className="font-extrabold text-slate-800 text-lg uppercase">All Caught Up!</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 max-w-xs mx-auto">You have no pending or active maintenance tasks assigned to you.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <Card key={task.id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className={`text-[10px] font-bold uppercase py-0.5 px-2 border-none ${
                                                task.priority === 'urgent' ? 'bg-red-50 text-red-600' :
                                                task.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                                                'bg-slate-50 text-slate-400'
                                            }`}>
                                                {task.priority} Priority
                                            </Badge>
                                            <Badge variant="outline" className={`text-[10px] font-bold uppercase py-0.5 px-2 gap-1 ${
                                                task.status === 'pending' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                                                task.status === 'in-progress' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' :
                                                task.status === 'resolved' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                                'text-slate-400 bg-slate-50 border-slate-100'
                                            }`}>
                                                {task.status}
                                            </Badge>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{task.title}</h3>
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{task.description}</p>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-[11px] font-bold text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Building className="w-3.5 h-3.5" /> {task.buildingName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" /> {task.roomOrAreaDescription}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" /> Filed: {new Date(task.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {task.status !== 'resolved' && (
                                        <div className="flex flex-col gap-2 self-start sm:self-center">
                                            {/* Dialog for completing tasks */}
                                            <Dialog open={resolveDialogOpen && selectedTaskId === task.id} onOpenChange={(open) => {
                                                setResolveDialogOpen(open);
                                                if (open) setSelectedTaskId(task.id);
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button 
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-[10px] uppercase tracking-widest w-full"
                                                    >
                                                        Complete Task
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[425px]">
                                                    <DialogHeader>
                                                        <DialogTitle>Complete Maintenance Job</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="notes">Resolution Notes</Label>
                                                            <Textarea
                                                                id="notes"
                                                                placeholder="Detail what was fixed (e.g. replaced compressor capacitor, refilled R410 refrigerant)"
                                                                rows={4}
                                                                value={notes}
                                                                onChange={(e) => setNotes(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            className="bg-indigo-600 w-full hover:bg-indigo-700 text-white font-bold h-10 text-xs uppercase tracking-wider"
                                                            disabled={updating}
                                                            onClick={handleResolve}
                                                        >
                                                            {updating ? "Submitting..." : "Submit Resolution & Close Ticket"}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>

                                            {/* Dialog for submitting repair quotes */}
                                            <Dialog open={quoteDialogOpen && selectedTaskId === task.id} onOpenChange={(open) => {
                                                setQuoteDialogOpen(open);
                                                if (open) setSelectedTaskId(task.id);
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button 
                                                        variant="outline"
                                                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold h-9 text-[10px] uppercase tracking-widest w-full gap-1"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" /> Submit Quote
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[425px]">
                                                    <DialogHeader>
                                                        <DialogTitle>Submit Repair Quote</DialogTitle>
                                                        <CardDescription>Submit pricing estimate for parts replacement or outsourced repair.</CardDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="item">Appliance / Replacement Part</Label>
                                                            <Input
                                                                id="item"
                                                                placeholder="e.g. 1.5HP AC Compressor"
                                                                value={itemDescription}
                                                                onChange={(e) => setItemDescription(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="cost" className="flex items-center gap-0.5"><DollarSign className="w-3.5 h-3.5" /> Estimated Cost (₦)</Label>
                                                            <Input
                                                                id="cost"
                                                                type="number"
                                                                placeholder="e.g. 45000"
                                                                value={estimatedCost}
                                                                onChange={(e) => setEstimatedCost(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="qnotes">Explanatory Notes</Label>
                                                            <Textarea
                                                                id="qnotes"
                                                                placeholder="Details about parts, suppliers, or vendor warranty terms..."
                                                                rows={3}
                                                                value={quoteNotes}
                                                                onChange={(e) => setQuoteNotes(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            className="bg-indigo-600 w-full hover:bg-indigo-700 text-white font-bold h-10 text-xs uppercase tracking-wider"
                                                            disabled={submittingQuote}
                                                            onClick={handleQuoteSubmit}
                                                        >
                                                            {submittingQuote ? "Submitting..." : "Submit Quote to Supervisor"}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
