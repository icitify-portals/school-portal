"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Save,
    CheckCircle,
    FileText,
    MessageSquare,
    ExternalLink,
    AlertCircle,
    Mic,
    Link as LinkIcon,
    Cloud,
    PenTool,
    ChevronRight,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { gradeAssignmentSubmission } from "@/actions/lms";
import { toast } from "sonner";
import RichTextEditor from "./RichTextEditor";
import PDFAnnotator from "./PDFAnnotator";

interface GradingInterfaceProps {
    submission: any;
    assignment: any;
    rubric?: any;
    gradedBy: number;
}

export default function GradingInterface({ submission, assignment, rubric, gradedBy }: GradingInterfaceProps) {
    const [score, setScore] = useState<number>(submission.score || 0);
    const [feedback, setFeedback] = useState(submission.feedback || "");
    const [annotations, setAnnotations] = useState(submission.annotations || "");
    const [rubricGrades, setRubricGrades] = useState<Record<number, { points: number; feedback?: string }>>({});
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("content");

    const handleLevelSelect = (criterionId: number, points: number) => {
        setRubricGrades(prev => ({
            ...prev,
            [criterionId]: { ...prev[criterionId], points }
        }));
    };

    useEffect(() => {
        if (rubric && Object.keys(rubricGrades).length > 0) {
            const total = Object.values(rubricGrades).reduce((acc, g) => acc + g.points, 0);
            setScore(total);
        }
    }, [rubricGrades, rubric]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await gradeAssignmentSubmission({
                submissionId: submission.id,
                gradedBy,
                score,
                feedback,
                annotations,
                rubricGrades: Object.entries(rubricGrades).map(([critId, data]) => ({
                    criterionId: parseInt(critId),
                    points: data.points,
                    feedback: data.feedback
                }))
            });

            if (res.success) {
                toast.success("Submission graded successfully!");
            } else {
                toast.error((res as any).error || "Failed to save points");
            }
        } catch (error) {
            toast.error("An error occurred during grading.");
        }
        setSaving(false);
    };

    const externalLinks = JSON.parse(submission.externalLinks || '[]');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full bg-slate-50/30 p-4">
            {/* Left Column: Submission Workspace */}
            <div className="lg:col-span-8 flex flex-col h-full space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl h-12 shadow-sm">
                            <TabsTrigger value="content" className="rounded-xl px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                                <FileText className="w-4 h-4 mr-2" /> Content
                            </TabsTrigger>
                            {submission.fileUrl && (
                                <TabsTrigger value="annotate" className="rounded-xl px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                                    <PenTool className="w-4 h-4 mr-2" /> Annotations
                                </TabsTrigger>
                            )}
                        </TabsList>
                        
                        <div className="flex items-center gap-2">
                             <Badge variant="outline" className="h-6 text-[10px] font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50">
                                SUBMISSION ID: #{submission.id}
                             </Badge>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <TabsContent value="content" className="m-0 h-full overflow-y-auto space-y-4 pr-2">
                            {/* Text Submission */}
                            {submission.onlineText && (
                                <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                                    <CardHeader className="bg-white border-b border-slate-50">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-indigo-500" /> Online Text Submission
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium">
                                        {submission.onlineText}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Audio Submission */}
                            {submission.audioUrl && (
                                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-indigo-900 text-white">
                                    <CardContent className="p-8 flex items-center gap-6">
                                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center animate-pulse">
                                            <Mic className="w-8 h-8 text-indigo-200" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-2">Audio Submission</h3>
                                            <audio controls className="w-full h-10 filter invert brightness-200">
                                                <source src={submission.audioUrl} type="audio/mpeg" />
                                            </audio>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Link Submission */}
                            {externalLinks.length > 0 && (
                                <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <LinkIcon className="w-4 h-4 text-emerald-500" /> External Links
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 p-6 pt-0">
                                        {externalLinks.map((link: any, i: number) => (
                                            <a 
                                                key={i} 
                                                href={link.url} 
                                                target="_blank" 
                                                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm group-hover:border-emerald-200">
                                                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                                                    </div>
                                                    <span className="font-bold text-slate-700">{link.title || 'Attached Link'}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-300" />
                                            </a>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Cloud / File Submission */}
                            {(submission.fileUrl || submission.cloudFileUrl) && (
                                <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                                     <CardHeader>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-rose-500" /> Attached Document
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0 flex flex-col items-center justify-center text-center">
                                        <div className="p-6 bg-slate-50 rounded-full mb-4">
                                            {submission.cloudFileUrl ? <Cloud className="w-12 h-12 text-blue-500" /> : <FileText className="w-12 h-12 text-slate-400" />}
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-lg mb-1">
                                            {submission.cloudFileUrl ? "Cloud Shared Resource" : "Submitted File"}
                                        </h4>
                                        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                                            The student has attached a full document for review.
                                        </p>
                                        <div className="flex gap-3">
                                            <Button variant="outline" className="rounded-2xl h-12 px-6 shadow-sm" onClick={() => window.open(submission.fileUrl || submission.cloudFileUrl, '_blank')}>
                                                <ExternalLink className="w-4 h-4 mr-2" /> Open in New Tab
                                            </Button>
                                            {submission.fileUrl && (
                                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-12 px-6 shadow-md" onClick={() => setActiveTab("annotate")}>
                                                    <PenTool className="w-4 h-4 mr-2" /> Start Markups
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="annotate" className="m-0 h-full">
                            <PDFAnnotator 
                                fileUrl={submission.fileUrl} 
                                initialData={annotations}
                                onSave={(data) => {
                                    setAnnotations(data);
                                    toast.success("Visual markups captured!");
                                }}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* Right Column: Feedback & Score */}
            <div className="lg:col-span-4 space-y-6 flex flex-col h-full overflow-y-auto pr-2 pb-8">
                {/* Score Section */}
                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
                    <CardHeader className="bg-indigo-600 text-white p-6">
                        <div className="flex justify-between items-center mb-4">
                            <Badge className="bg-white/20 text-white border-none text-[10px] h-6 flex items-center font-black">MARKING MODE</Badge>
                            <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Residue: {(assignment.maxScore - score).toFixed(0)} pts</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase text-indigo-200 tracking-tighter mb-2">Final Evaluation Score</p>
                                <div className="flex items-center gap-3">
                                    <Input 
                                        type="number" 
                                        value={score} 
                                        onChange={(e) => setScore(Number(e.target.value))}
                                        className="h-16 text-3xl font-black bg-indigo-700/50 border-none text-white focus:ring-2 focus:ring-white p-0 text-center rounded-2xl"
                                    />
                                    <span className="text-2xl font-bold text-indigo-300">/ {assignment.maxScore}</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Button
                            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100 uppercase tracking-widest disabled:opacity-50"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? "Processing..." : "Finish Grading"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Feedback Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" /> Qualitative Feedback
                        </h4>
                    </div>
                    <RichTextEditor 
                        value={feedback} 
                        onChange={setFeedback} 
                        placeholder="Write detailed corrections..." 
                    />
                </div>

                {/* Rubric Section */}
                {rubric && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Rubric Criteria</h4>
                        {rubric.criteria.map((crit: any) => (
                            <Card key={crit.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="p-4 bg-slate-50/50 flex flex-row items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">{crit.title}</span>
                                    <Badge className="bg-indigo-100 text-indigo-700 border-none text-[10px]">
                                        {rubricGrades[crit.id]?.points || 0} / {crit.weight}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-2 grid grid-cols-2 gap-1">
                                    {JSON.parse(crit.levels || '[]').map((lvl: any, i: number) => {
                                        const isSelected = rubricGrades[crit.id]?.points === lvl.points;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleLevelSelect(crit.id, lvl.points)}
                                                className={cn(
                                                    "text-left p-2 rounded-xl border transition-all",
                                                    isSelected ? "bg-indigo-50 border-indigo-500" : "bg-white border-transparent hover:bg-slate-50"
                                                )}
                                            >
                                                <p className={cn("text-[8px] font-black uppercase", isSelected ? "text-indigo-700" : "text-slate-400")}>{lvl.label}</p>
                                                <p className={cn("text-[10px] font-bold", isSelected ? "text-indigo-600" : "text-slate-700")}>{lvl.points} pts</p>
                                            </button>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
