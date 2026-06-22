"use client";

import { useEffect, useState, useTransition } from "react";
import { 
    getStudentPendingEvaluations, submitCourseEvaluation 
} from "@/actions/quality-assurance";
import { 
    GraduationCap, Award, CheckCircle, HelpCircle, 
    MessageSquare, Send, ShieldAlert, Star, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EvaluationItem {
    enrollmentId: number;
    courseId: number;
    courseCode: string;
    courseName: string;
    semester: number;
    sessionId: number;
    sessionName: string;
    assignedStaff: {
        staffId: number;
        name: string;
        jobTitle: string;
        imageUrl: string | null;
    };
    academicTier: string;
}

export default function StudentEvaluationsPage() {
    const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
    const [selectedEval, setSelectedEval] = useState<EvaluationItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Form states
    const [ratings, setRatings] = useState<Record<string, number>>({
        clarity: 5,
        punctuality: 5,
        fairness: 5,
        engagement: 5,
        support: 5
    });
    const [comments, setComments] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(true);

    const loadPending = async () => {
        setLoading(true);
        const res = await getStudentPendingEvaluations();
        if (res.success && res.data) {
            setEvaluations(res.data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadPending();
    }, []);

    const handleSelectEval = (item: EvaluationItem) => {
        setSelectedEval(item);
        setRatings({
            clarity: 5,
            punctuality: 5,
            fairness: 5,
            engagement: 5,
            support: 5
        });
        setComments("");
        setIsAnonymous(true);
    };

    const handleSubmit = () => {
        if (!selectedEval) return;

        startTransition(async () => {
            const res = await submitCourseEvaluation({
                courseId: selectedEval.courseId,
                staffId: selectedEval.assignedStaff.staffId,
                sessionId: selectedEval.sessionId,
                semester: selectedEval.semester,
                ratings,
                comments,
                isAnonymous
            });

            if (res.success) {
                // Clear selection and reload list
                setSelectedEval(null);
                loadPending();
            } else {
                alert(res.error || "Submission failed");
            }
        });
    };

    // Helper: Map metric identifiers to simple question strings
    const getMetricLabel = (key: string, isK12: boolean) => {
        if (isK12) {
            switch(key) {
                case "clarity": return "Does the teacher explain lessons clearly and well?";
                case "punctuality": return "Is the teacher always punctual and ready for class?";
                case "fairness": return "Is the teacher friendly and fair to all children?";
                case "engagement": return "Does the teacher make the class fun and active?";
                case "support": return "Does the teacher help you when you have difficulties?";
            }
        } else {
            switch(key) {
                case "clarity": return "Instructional Clarity & pacings of course syllabuses";
                case "punctuality": return "Punctual attendance and class organization professionalism";
                case "fairness": return "Fairness in evaluations and transparency of criteria";
                case "engagement": return "Promoting active discussion and stimulating student interests";
                case "support": return "Responsiveness, supportiveness, and office hours availability";
            }
        }
        return key;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium tracking-tight">Accessing pending tutor evaluations...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                    <UserCheck className="w-10 h-10 text-indigo-600 animate-bounce" />
                    Tutor Feedback Center
                </h2>
                <p className="text-slate-500 mt-1 font-medium tracking-tight">
                    Evaluate your course tutors anonymously on standard performance parameters to drive educational quality.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: List of teachers to evaluate */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl">
                        <h3 className="font-black text-sm uppercase tracking-widest text-indigo-300 leading-none mb-1">Evaluating List</h3>
                        <p className="text-white/50 text-xs">Classes & teachers awaiting feedback this term</p>
                    </div>

                    {evaluations.length > 0 ? (
                        <div className="space-y-4">
                            {evaluations.map((item) => (
                                <button
                                    key={item.courseId}
                                    onClick={() => handleSelectEval(item)}
                                    className={cn(
                                        "w-full text-left p-6 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4",
                                        selectedEval?.courseId === item.courseId
                                            ? "bg-indigo-600 text-white border-indigo-700 shadow-xl shadow-indigo-100"
                                            : "bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200 shadow-sm"
                                    )}
                                >
                                    <div className="space-y-1.5">
                                        <div className={cn(
                                            "inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest leading-none",
                                            selectedEval?.courseId === item.courseId 
                                                ? "bg-white/20 text-white" 
                                                : "bg-indigo-50 text-indigo-600"
                                        )}>
                                            {item.courseCode}
                                        </div>
                                        <h4 className={cn(
                                            "font-black text-sm tracking-tight leading-tight",
                                            selectedEval?.courseId === item.courseId ? "text-white" : "text-slate-800"
                                        )}>
                                            {item.courseName}
                                        </h4>
                                        <p className={cn(
                                            "text-xs font-medium",
                                            selectedEval?.courseId === item.courseId ? "text-white/70" : "text-slate-400"
                                        )}>
                                            Tutor: <span className="font-bold">{item.assignedStaff.name}</span>
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl text-center space-y-4">
                            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                            <div>
                                <h4 className="font-black text-emerald-900 tracking-tight">All Evaluated!</h4>
                                <p className="text-emerald-600/80 text-xs font-medium mt-1">You have submitted constructive feedback for all instructors. Thank you!</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Interactive Evaluation Form */}
                <div className="lg:col-span-2">
                    {selectedEval ? (
                        <div className="bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-100/50 overflow-hidden animate-in slide-in-from-right-6 duration-500">
                            {/* Form Header */}
                            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                                <div>
                                    <div className="inline-block px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest leading-none mb-2">
                                        {selectedEval.courseCode} EVALUATION
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight leading-none mb-1">{selectedEval.courseName}</h3>
                                    <p className="text-white/50 text-xs font-medium">Instructor: {selectedEval.assignedStaff.name} • {selectedEval.assignedStaff.jobTitle}</p>
                                </div>
                            </div>

                            {/* Ratings Panel */}
                            <div className="p-8 space-y-8">
                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-amber-900 leading-normal">
                                        Your evaluations are kept strictly confidential. Ratings and qualitative recommendations are pooled anonymously to support self-improvement and staff metrics.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {Object.keys(ratings).map((metricKey) => (
                                        <div key={metricKey} className="space-y-2 border-b border-slate-50 pb-4">
                                            <div className="flex justify-between items-center gap-4">
                                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                                    {metricKey}
                                                </h4>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    {ratings[metricKey]} / 5 (Excellent)
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-xs font-medium">
                                                {getMetricLabel(metricKey, selectedEval.academicTier === "k12")}
                                            </p>
                                            
                                            {/* Stars Component */}
                                            <div className="flex gap-2 pt-1.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setRatings(prev => ({ ...prev, [metricKey]: star }))}
                                                        className="text-slate-200 hover:text-amber-400 transition-colors"
                                                    >
                                                        <Star 
                                                            className={cn(
                                                                "w-7 h-7",
                                                                star <= ratings[metricKey] 
                                                                    ? "text-amber-500 fill-amber-500 animate-pulse" 
                                                                    : "text-slate-200"
                                                            )} 
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Comments Textarea */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <MessageSquare className="w-4 h-4 text-slate-400" />
                                        Constructive Feedback / Recommendations
                                    </label>
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Share specific things you like or suggestions for improvement..."
                                        rows={4}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                    />
                                </div>

                                {/* Privacy Controls */}
                                <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="anon"
                                            checked={isAnonymous}
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                            className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                        />
                                        <label htmlFor="anon" className="text-xs font-black text-slate-700 uppercase tracking-widest cursor-pointer select-none">
                                            Evaluate Anonymously
                                        </label>
                                    </div>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isPending}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 h-12 rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        Submit Feedback
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center gap-4 min-h-[400px]">
                            <HelpCircle className="w-12 h-12 text-slate-300" />
                            <div>
                                <h4 className="text-lg font-black text-slate-700 tracking-tight leading-none mb-1">Select Course or Subject</h4>
                                <p className="text-slate-400 text-xs font-medium">Select a pending course/teacher card from the list on the left to start your evaluation</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
