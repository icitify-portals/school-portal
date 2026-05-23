"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitTransferRequest } from "@/actions/transfers";
import { toast } from "sonner";
import { Loader2, FileText, ArrowRight, User, School, Building2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function StudentTransferPage() {
    const { data: session } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [faculties, setFaculties] = useState<any[]>([]);
    
    // Form State
    const [proposedFaculty, setProposedFaculty] = useState("");
    const [proposedDept, setProposedDept] = useState("");
    const [proposedLevel, setProposedLevel] = useState("");
    const [proposedDegree, setProposedDegree] = useState("");

    // Simulated data fetching (In a real app, these would come from server actions)
    useEffect(() => {
        // Fetch faculties and depts to populate select
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id) return;

        setIsSubmitting(true);
        try {
            // Placeholder: These would be derived from the student's current record
            const studentData = {
                studentId: parseInt(session.user.id),
                matricNumber: "236296", // Mock
                currentFacultyId: 1, // Science
                currentDeptId: 1, // Chemistry
                currentLevel: 300,
                currentDegreeInView: "Chemistry",
                proposedFacultyId: parseInt(proposedFaculty),
                proposedDeptId: parseInt(proposedDept),
                proposedLevel: parseInt(proposedLevel),
                proposedDegreeInView: proposedDegree
            };

            const result = await submitTransferRequest(studentData);
            if (result.success) {
                toast.success("Application submitted successfully!");
            } else {
                toast.error(result.error || "Failed to submit application");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                                    <p className="text-lg font-bold text-slate-900">Science</p>
                                </div>
                                <div>
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Current Department</Label>
                                    <p className="text-lg font-bold text-slate-900">Chemistry</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Level</Label>
                                        <p className="text-lg font-bold text-slate-900">300</p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Matric Number</Label>
                                        <p className="text-lg font-bold text-slate-900">236296</p>
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
                                    <Select value={proposedFaculty} onValueChange={setProposedFaculty}>
                                        <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200">
                                            <SelectValue placeholder="Select Faculty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Science</SelectItem>
                                            <SelectItem value="2">Arts</SelectItem>
                                            <SelectItem value="3">Education</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                                        <Building2 className="h-3 w-3" /> Proposed Department
                                    </Label>
                                    <Select value={proposedDept} onValueChange={setProposedDept}>
                                        <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200">
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Geography (Science)</SelectItem>
                                            <SelectItem value="2">Computer Science</SelectItem>
                                            <SelectItem value="3">Mathematics</SelectItem>
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
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Degree in View</Label>
                                        <Input 
                                            value={proposedDegree} 
                                            onChange={(e) => setProposedDegree(e.target.value)}
                                            placeholder="e.g. Geography" 
                                            className="rounded-xl h-12 border-slate-200" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* DECLARATION */}
                <Card className="border-amber-100 bg-amber-50/20 rounded-[2rem]">
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
                        disabled={isSubmitting || !proposedDept} 
                        className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-12 font-black tracking-widest uppercase text-xs"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                            </>
                        ) : "Submit Application"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
