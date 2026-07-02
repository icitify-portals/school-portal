"use client";

import { useState, useEffect } from "react";
import { getAdminGrievances, updateGrievanceStatus } from "@/actions/disciplinary";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Scale, CheckCircle2, Search, Filter, AlertTriangle, Eye, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function AdminGrievancesPage() {
    const [grievances, setGrievances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGrievance, setSelectedGrievance] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Update state
    const [updateStatus, setUpdateStatus] = useState<string>('');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const res = await getAdminGrievances();
        if (res.success) {
            setGrievances(res.grievances || []);
        }
        setLoading(false);
    };

    const handleUpdate = async () => {
        if (!selectedGrievance) return;
        
        setUpdating(true);
        const res = await updateGrievanceStatus(
            selectedGrievance.id, 
            updateStatus as any, 
            resolutionNotes
        );

        if (res.success) {
            toast.success("Grievance updated successfully.");
            setIsDialogOpen(false);
            loadData();
        } else {
            toast.error(res.error || "Failed to update grievance.");
        }
        setUpdating(false);
    };

    const openDialog = (g: any) => {
        setSelectedGrievance(g);
        setUpdateStatus(g.status);
        setResolutionNotes(g.resolutionNotes || '');
        setIsDialogOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'submitted': return 'bg-blue-100 text-blue-800';
            case 'under_investigation': return 'bg-amber-100 text-amber-800';
            case 'resolved': return 'bg-emerald-100 text-emerald-800';
            case 'dismissed': return 'bg-slate-100 text-slate-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <Scale className="w-8 h-8 text-rose-600" />
                        Grievances & Appeals
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Review formal complaints and coordinate disciplinary actions.</p>
                </div>
                
                <Link href="/admin/registrar/conduct/new">
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 px-5 shadow-sm">
                        Log Conduct Infraction <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </Link>
            </div>

            <Card className="-200 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="text-lg">Grievance Inbox</CardTitle>
                    <CardDescription>All submitted complaints from staff and students.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Loading complaints...</div>
                    ) : grievances.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <CheckCircle2 className="w-12 h-12 text-emerald-200 mb-3" />
                            <h3 className="text-lg font-bold text-slate-700">Inbox Zero</h3>
                            <p className="text-slate-500 mt-1">No active grievances require your attention.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {grievances.map((g) => (
                                <div key={g.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-slate-800 text-lg">{g.title}</h3>
                                            <Badge variant="secondary" className={`${getStatusColor(g.status)} capitalize`}>
                                                {g.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                                            <span><strong>Reporter:</strong> {g.reporter?.name} ({g.reporter?.matricNo})</span>
                                            {g.target && <span><strong>Target:</strong> {g.target?.name} ({g.target?.matricNo})</span>}
                                            <span className="text-slate-400">{format(new Date(g.createdAt), "MMM d, yyyy")}</span>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="shrink-0 font-bold"
                                        onClick={() => openDialog(g)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" /> Review
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Scale className="w-5 h-5 text-rose-600" />
                            Review Grievance
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedGrievance && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Reporter</p>
                                    <p className="font-medium text-slate-900">{selectedGrievance.reporter?.name}</p>
                                    <p className="text-sm text-slate-500">{selectedGrievance.reporter?.matricNo}</p>
                                </div>
                                {selectedGrievance.target && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Target (Accused)</p>
                                        <p className="font-medium text-slate-900">{selectedGrievance.target?.name}</p>
                                        <p className="text-sm text-slate-500">{selectedGrievance.target?.matricNo}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase mb-2">Grievance Title</h3>
                                <p className="text-lg font-bold text-slate-900">{selectedGrievance.title}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase mb-2">Description</h3>
                                <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border">
                                    {selectedGrievance.description}
                                </p>
                            </div>

                            <div className="border-t pt-6 space-y-4">
                                <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    Administrative Action
                                </h3>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Update Status</label>
                                    <Select value={updateStatus} onValueChange={setUpdateStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="submitted">Submitted</SelectItem>
                                            <SelectItem value="under_investigation">Under Investigation</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="dismissed">Dismissed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Resolution Notes (Visible to Reporter)</label>
                                    <Textarea 
                                        placeholder="Add notes about the investigation outcome or reasoning..." 
                                        value={resolutionNotes}
                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={updating} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                            {updating ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
