"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitTransferRequest, getStudentTransferPageData } from "@/actions/transfers";
import { toast } from "sonner";
import { Loader2, FileText, ArrowRight, User, School, Building2, Clock, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function StudentTransferPage() {
    const { data: session } = useSession();
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Page Data
    const [studentData, setStudentData] = useState<any>(null);
    const [currentDept, setCurrentDept] = useState<any>(null);
    const [currentFaculty, setCurrentFaculty] = useState<any>(null);
    const [activeRequest, setActiveRequest] = useState<any>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [faculties, setFaculties] = useState<any[]>([]);
    const [transferFee, setTransferFee] = useState<number>(0);
    
    // Form State
    const [proposedFaculty, setProposedFaculty] = useState("");
    const [proposedDept, setProposedDept] = useState("");
    const [proposedLevel, setProposedLevel] = useState("");
    const [proposedDegree, setProposedDegree] = useState("");

    useEffect(() => {
        if (session?.user?.id) {
            loadData(parseInt(session.user.id));
        }
    }, [session]);

    const loadData = async (userId: number) => {
        setLoading(true);
        try {
            const data = await getStudentTransferPageData(userId);
            if (data) {
                setStudentData(data.student);
                setCurrentDept(data.currentDept);
                setCurrentFaculty(data.currentFaculty);
                setActiveRequest(data.activeRequest);
                setFaculties(data.faculties);
                setDepartments(data.departments);
                if (data.transferFee) setTransferFee(data.transferFee);
            }
        } catch (error) {
            toast.error("Failed to load transfer data.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentData) return;

        setIsSubmitting(true);
        try {
            const submitData = {
                studentId: studentData.id,
                matricNumber: studentData.matricNumber,
                currentFacultyId: currentFaculty?.id || 0,
                currentDeptId: currentDept?.id || 0,
                currentLevel: studentData.currentLevel || 100,
                currentDegreeInView: currentDept?.name || "Unknown",
                proposedFacultyId: parseInt(proposedFaculty),
                proposedDeptId: parseInt(proposedDept),
                proposedLevel: parseInt(proposedLevel),
                proposedDegreeInView: proposedDegree
            };

            const result = await submitTransferRequest(submitData);
            if (result.success) {
                toast.success("Application submitted successfully!");
                if (result.paymentUrl) {
                    window.location.href = result.paymentUrl;
                    return;
                }
                if (session?.user?.id) {
                    loadData(parseInt(session.user.id));
                }
            } else {
                toast.error(result.error || "Failed to submit application");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading transfer portal...</p>
            </div>
        );
    }

    const availableDepts = departments.filter(d => d.facultyId === parseInt(proposedFaculty));

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <FileText className="h-10 w-10 text-indigo-600" /> Change of Course
                    </h1>
                    <p className="text-slate-500 font-medium">Digital Application Form for University Transfer</p>
                </div>
            </div>

            {activeRequest ? (
                // TRACKING DASHBOARD
                <Card className="border-indigo-100 shadow-xl shadow-indigo-100/50 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-white to-indigo-50/20">
                    <CardHeader className="bg-indigo-50 border-b border-indigo-100">
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                            <Clock className="h-5 w-5" /> Application In Progress
                        </CardTitle>
                        <CardDescription>
                            You have an active transfer request pending approval.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label className="text-[10px] font-black uppercase text-slate-400">Current Department</Label>
                                <p className="text-lg font-bold text-slate-900">{activeRequest.currentDept?.name || "N/A"}</p>
                            </div>
                            <div>
                                <Label className="text-[10px] font-black uppercase text-slate-400">Proposed Department</Label>
                                <p className="text-lg font-bold text-indigo-600">{activeRequest.proposedDept?.name || "N/A"}</p>
                            </div>
                            <div>
                                <Label className="text-[10px] font-black uppercase text-slate-400">Application Date</Label>
                                <p className="text-lg font-bold text-slate-900">{new Date(activeRequest.createdAt || Date.now()).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <Label className="text-[10px] font-black uppercase text-slate-400">Status</Label>
                                <div className="mt-1 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full w-fit text-sm font-bold border border-amber-100">
                                    <Loader2 className="w-4 h-4 animate-spin" /> {activeRequest.feeStatus === "pending" ? "Awaiting Payment" : "Pending Review"}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 mb-4">Approval Progress</h3>
                            <div className="space-y-4">
                                {[
                                    { label: "Present HOD", status: activeRequest.presentHodStatus },
                                    { label: "Present Dean", status: activeRequest.presentDeanStatus },
                                    { label: "Admissions Officer", status: activeRequest.admissionsOfficerStatus },
                                    { label: "Proposed HOD", status: activeRequest.proposedHodStatus },
                                    { label: "Proposed Dean", status: activeRequest.proposedDeanStatus },
                                ].map((step, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                                        <span className="font-medium text-slate-700">{step.label}</span>
                                        {step.status ? (
                                            <span className={`text-xs font-bold uppercase tracking-wider ${step.status.includes('not') ? 'text-rose-600' : 'text-emerald-600'} flex items-center gap-1`}>
                                                <CheckCircle2 className="w-4 h-4" /> {step.status.replace('_', ' ')}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                                <Clock className="w-4 h-4" /> Awaiting
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                // APPLICATION FORM
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* CURRENT STATUS */}
                        <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-xs uppercase tracking-widest text-slate-400 font-black flex items-center gap-2">
                                    <User className="h-3 w-3" /> Present Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Current Faculty</Label>
                                        <p className="text-lg font-bold text-slate-900">{currentFaculty?.name || "Unassigned"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Current Department</Label>
                                        <p className="text-lg font-bold text-slate-900">{currentDept?.name || "Unassigned"}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-[10px] font-black uppercase text-slate-400">Level</Label>
                                            <p className="text-lg font-bold text-slate-900">{studentData?.currentLevel || 100}</p>
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-black uppercase text-slate-400">Matric Number</Label>
                                            <p className="text-lg font-bold text-slate-900">{studentData?.matricNumber || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* PROPOSED STATUS */}
                        <Card className="border-indigo-100 shadow-xl shadow-indigo-100/50 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-white to-indigo-50/20">
                            <CardHeader className="bg-indigo-500/5 border-b border-indigo-100">
                                <CardTitle className="text-xs uppercase tracking-widest text-indigo-400 font-black flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3" /> Proposed Transfer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                                            <School className="h-3 w-3" /> Proposed Faculty
                                        </Label>
                                        <Select value={proposedFaculty} onValueChange={(val) => { setProposedFaculty(val); setProposedDept(""); }}>
                                            <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200">
                                                <SelectValue placeholder="Select Faculty" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {faculties.map(f => (
                                                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                                            <Building2 className="h-3 w-3" /> Proposed Department
                                        </Label>
                                        <Select value={proposedDept} onValueChange={setProposedDept} disabled={!proposedFaculty}>
                                            <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200">
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableDepts.map(d => (
                                                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400">Proposed Level</Label>
                                            <Select value={proposedLevel} onValueChange={setProposedLevel}>
                                                <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200">
                                                    <SelectValue placeholder="Level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="100">100</SelectItem>
                                                    <SelectItem value="200">200</SelectItem>
                                                    <SelectItem value="300">300</SelectItem>
                                                    <SelectItem value="400">400</SelectItem>
                                                    <SelectItem value="500">500</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400">Degree in View</Label>
                                            <Input 
                                                value={proposedDegree} 
                                                onChange={(e) => setProposedDegree(e.target.value)}
                                                placeholder="e.g. Geography" 
                                                className="rounded-xl h-12 border-slate-200 bg-white" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* DECLARATION */}
                    <Card className="border-amber-100 bg-amber-50/20 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex gap-4 items-start">
                                <div className="p-3 bg-amber-100 rounded-2xl">
                                    <FileText className="h-6 w-6 text-amber-600" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-slate-900">Student Declaration</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                        I hereby confirm that I am proposing the above change of faculty/department with the consent of my sponsor. 
                                        I agree that any false or incomplete information given by me can be used against me to invalidate my transfer, if approved.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="ghost" className="rounded-2xl h-14 px-8 font-bold text-slate-500">Cancel</Button>
                        <Button 
                            disabled={isSubmitting || !proposedDept || !proposedLevel || !proposedDegree} 
                            className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-12 font-black tracking-widest uppercase text-xs"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                                </>
                            ) : (transferFee > 0 ? `Pay ₦${transferFee.toLocaleString()} & Submit` : "Submit Application")}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
