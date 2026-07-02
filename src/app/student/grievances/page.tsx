"use client";

import { useState, useEffect } from "react";
import { getGrievancesByReporter, submitGrievance } from "@/actions/disciplinary";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, ShieldAlert, CheckCircle2, Clock, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StudentGrievancesPage() {
    const [grievances, setGrievances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        // SECURITY: No userId passed — server derives it from the session cookie
        const res = await getGrievancesByReporter();
        if (res.success) {
            setGrievances(res.grievances || []);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.description) {
            toast.error("Title and description are required.");
            return;
        }

        setSubmitting(true);
        // SECURITY: No reporterId passed — server derives it from the session cookie
        const res = await submitGrievance({
            title: form.title,
            description: form.description,
        });

        if (res.success) {
            toast.success("Grievance submitted successfully. It will be reviewed confidentially.");
            setForm({ title: "", description: "" });
            loadData();
        } else {
            toast.error(res.error || "Failed to submit grievance");
        }
        setSubmitting(false);
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
        <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-3 border-b pb-4">
                <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Grievance & Incident Reporting</h1>
                    <p className="text-slate-500 font-medium mt-1">Submit formal complaints or report incidents securely.</p>
                </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-800 font-bold">Confidentiality Notice</AlertTitle>
                <AlertDescription className="text-blue-700 text-sm mt-1">
                    Your identity is required to process the grievance, but it will be kept strictly <strong>confidential</strong> by the Registrar's Office and the Disciplinary Committee. It will not be shared with the accused without your explicit consent.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Submission Form */}
                <Card className="lg:col-span-1 -200 h-fit border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="w-5 h-5 text-slate-500" />
                            File a Grievance
                        </CardTitle>
                        <CardDescription>
                            Please provide as much detail as possible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Incident Title</label>
                                <Input 
                                    placeholder="e.g. Unfair Grading, Harassment, etc." 
                                    value={form.title}
                                    onChange={(e) => setForm({...form, title: e.target.value})}
                                    className="bg-slate-50"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Detailed Description</label>
                                <Textarea 
                                    placeholder="Describe the incident, including dates, times, and any witnesses..." 
                                    value={form.description}
                                    onChange={(e) => setForm({...form, description: e.target.value})}
                                    className="min-h-[150px] bg-slate-50"
                                    required
                                />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={submitting} 
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-11"
                            >
                                {submitting ? "Submitting..." : "Submit Grievance Confidentially"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* History */}
                <Card className="lg:col-span-2 -200 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-lg">My Submissions</CardTitle>
                        <CardDescription>Track the status of your reported grievances.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Loading history...</div>
                        ) : grievances.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center border-b border-slate-100">
                                <CheckCircle2 className="w-12 h-12 text-emerald-200 mb-3" />
                                <h3 className="text-lg font-bold text-slate-700">No Grievances</h3>
                                <p className="text-slate-500 mt-1">You haven't filed any grievances.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {grievances.map((g) => (
                                    <div key={g.id} className="p-6 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-slate-800 text-lg">{g.title}</h3>
                                            <Badge variant="secondary" className={`${getStatusColor(g.status)} capitalize px-3 py-1`}>
                                                {g.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-2 mb-3">
                                            <Clock className="w-4 h-4" />
                                            {format(new Date(g.createdAt), "PPP 'at' p")}
                                        </div>
                                        <p className="text-slate-600 text-sm whitespace-pre-wrap bg-white border p-3 rounded-lg">
                                            {g.description}
                                        </p>
                                        
                                        {g.resolutionNotes && (
                                            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                                                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Resolution / Response</h4>
                                                <p className="text-sm text-emerald-700">{g.resolutionNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
