"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Wrench, AlertTriangle, Clock,
    CheckCircle2, Plus, X,
    AlertCircle, Hammer, Zap,
    Droplets, LayoutList
} from "lucide-react";
import {
    createMaintenanceRequest,
    getStudentMaintenanceRequests
} from "@/actions/hostels";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function MaintenanceReporting() {
    const [requests, setRequests] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "plumbing" as const,
        priority: "medium" as const,
    });

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        const data = await getStudentMaintenanceRequests();
        setRequests(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await createMaintenanceRequest(formData);
        if (res.success) {
            toast.success(res.message);
            setShowForm(false);
            setFormData({ title: "", description: "", category: "plumbing", priority: "medium" });
            loadRequests();
        } else {
            toast.error(res.error || "Failed to submit request");
        }
        setSubmitting(false);
    };

    const categories = [
        { id: 'plumbing', icon: Droplets, label: 'Plumbing' },
        { id: 'electrical', icon: Zap, label: 'Electrical' },
        { id: 'carpentry', icon: Hammer, label: 'Carpentry' },
        { id: 'masonry', icon: LayoutList, label: 'Masonry' },
        { id: 'other', icon: Wrench, label: 'Other' },
    ];

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <Wrench className="w-8 h-8 text-indigo-500 animate-spin opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Maintenance History...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-indigo-600" />
                    Room Maintenance
                </h3>
                {!showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 gap-2 shadow-lg shadow-indigo-100"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Report New Issue
                    </Button>
                )}
            </div>

            {showForm && (
                <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] relative">
                    <button
                        onClick={() => setShowForm(false)}
                        className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <CardContent className="p-8 md:p-12">
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="text-center space-y-2">
                                <h4 className="text-2xl font-black text-slate-900">What needs fixing?</h4>
                                <p className="text-slate-500 text-sm">Provide details so our technical team can assist you.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Issue Title</label>
                                    <Input
                                        placeholder="e.g. Leaking sink faucet"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="h-14 rounded-2xl border-slate-200 focus:ring-indigo-500 text-sm font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat.id as any })}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                                                formData.category === cat.id
                                                    ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                                                    : "border-slate-100 hover:border-slate-200 text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            <cat.icon className="w-5 h-5" />
                                            <span className="text-[9px] font-black uppercase tracking-tight">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Priority Level</label>
                                    <div className="flex gap-2">
                                        {['low', 'medium', 'high', 'urgent'].map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, priority: p as any })}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    formData.priority === p
                                                        ? "bg-slate-900 text-white"
                                                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                )}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Detailed Description</label>
                                    <Textarea
                                        placeholder="Explain the problem in detail..."
                                        required
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="rounded-2xl border-slate-200 focus:ring-indigo-500 text-sm font-medium p-4"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-indigo-100"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Submit Maintenance Request
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.map((req) => (
                    <Card key={req.id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl overflow-hidden border border-slate-100">
                        <div className="p-5 flex gap-4">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                req.status === 'pending' ? "bg-amber-50 text-amber-500" :
                                    req.status === 'in-progress' ? "bg-indigo-50 text-indigo-500" :
                                        req.status === 'resolved' ? "bg-emerald-50 text-emerald-500" :
                                            "bg-slate-50 text-slate-400"
                            )}>
                                {req.category === 'plumbing' && <Droplets className="w-6 h-6" />}
                                {req.category === 'electrical' && <Zap className="w-6 h-6" />}
                                {req.category === 'carpentry' && <Hammer className="w-6 h-6" />}
                                {req.category === 'masonry' && <LayoutList className="w-6 h-6" />}
                                {req.category === 'other' && <Wrench className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight line-clamp-1">{req.title}</h5>
                                    <Badge className={cn(
                                        "rounded-md text-[8px] font-black uppercase px-2 py-0.5",
                                        req.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            req.status === 'in-progress' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                                req.status === 'resolved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                    "bg-slate-50 text-slate-400"
                                    )}>
                                        {req.status}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-1">{req.description}</p>
                                <div className="pt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-slate-300 uppercase flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            {format(new Date(req.createdAt), 'MMM dd, yyyy')}
                                        </span>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                                            req.priority === 'urgent' ? "bg-red-50 text-red-600" :
                                                req.priority === 'high' ? "bg-orange-50 text-orange-600" :
                                                    "bg-slate-50 text-slate-400"
                                        )}>
                                            {req.priority}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                        Room {req.room.roomNumber}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                {requests.length === 0 && !showForm && (
                    <div className="md:col-span-2 py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                        <AlertCircle className="w-10 h-10 text-slate-200" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">All systems operational</p>
                            <p className="text-[10px] text-slate-300">You haven't reported any issues with your room yet.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Loader2(props: any) {
    return <Loader2Icon {...props} />;
}

import { Loader2 as Loader2Icon } from "lucide-react";
