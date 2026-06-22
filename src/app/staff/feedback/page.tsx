"use client";

import { useEffect, useState } from "react";
import { getInstructorPersonalFeedback } from "@/actions/quality-assurance";
import { 
    Award, BarChart2, Star, MessageSquare, Clipboard, HeartHandshake, Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackProfile {
    staffId: number;
    name: string;
    jobTitle: string;
    rank: string | null;
    department: string;
    totalSubmissions: number;
    aggregateScore: number;
    metrics: {
        clarity: number;
        punctuality: number;
        fairness: number;
        engagement: number;
        support: number;
    };
    comments: Array<{
        text: string;
        course: string;
        date: string;
    }>;
}

export default function StaffFeedbackPage() {
    const [profile, setProfile] = useState<FeedbackProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadFeedback() {
            setLoading(true);
            const res = await getInstructorPersonalFeedback();
            if (res.success && res.data) {
                setProfile(res.data as any);
            }
            setLoading(false);
        }
        loadFeedback();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium tracking-tight">Accessing personal evaluation scorecards...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                    <HeartHandshake className="w-10 h-10 text-indigo-600 animate-pulse" />
                    Teacher Reflection Workspace
                </h2>
                <p className="text-slate-500 mt-1 font-medium tracking-tight">
                    Review your student evaluation indices, metrics breakdowns, and anonymous feedback to guide your instructional growth.
                </p>
            </div>

            {profile ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Overall aggregate and ratings */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl -mr-8 -mt-8" />
                            
                            <h3 className="font-black text-sm uppercase tracking-widest text-indigo-300 mb-6">Teaching Index Score</h3>
                            
                            <div className="space-y-2">
                                <div className="text-6xl font-black italic tracking-tighter tabular-nums text-white">
                                    {profile.aggregateScore}
                                </div>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                            key={star} 
                                            className={`w-4.5 h-4.5 ${star <= Math.round(profile.aggregateScore) ? "text-amber-400 fill-amber-400" : "text-white/20"}`} 
                                        />
                                    ))}
                                </div>
                                <p className="text-white/50 text-xs font-medium pt-2">
                                    Calculated average based on <span className="text-white font-bold">{profile.totalSubmissions}</span> anonymous student evaluations.
                                </p>
                            </div>
                        </div>

                        {/* Professional details */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none border-b border-slate-50 pb-2">Instructor Profile</h4>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Designation</p>
                                    <p className="text-xs font-bold text-slate-800">{profile.jobTitle} • {profile.rank || "Academic Tutor"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Department</p>
                                    <p className="text-xs font-bold text-slate-800">{profile.department}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Breakdown & Comments */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Domain Performance */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-xl shadow-slate-100/50 space-y-6">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1 flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-indigo-600" />
                                Domain Performance Indices
                            </h3>
                            
                            <div className="space-y-4">
                                {Object.entries(profile.metrics).map(([key, val]) => (
                                    <div key={key} className="space-y-1">
                                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-600">
                                            <span>{key}</span>
                                            <span className="tabular-nums">{val} / 5</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-600 rounded-full transition-all" 
                                                style={{ width: `${(val / 5) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Qualitative constructive comments */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-xl shadow-slate-100/50 space-y-6">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-indigo-600" />
                                Qualitative Recommendations
                            </h3>

                            {profile.comments.length > 0 ? (
                                <div className="space-y-4">
                                    {profile.comments.map((comm, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                <span>Subject: {comm.course}</span>
                                                <span>Date: {comm.date}</span>
                                            </div>
                                            <p className="text-slate-600 text-xs italic font-semibold">
                                                "{comm.text}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-medium">
                                    No qualitative written recommendations recorded this term yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center gap-4 min-h-[300px]">
                    <Smile className="w-12 h-12 text-slate-300" />
                    <div>
                        <h4 className="text-lg font-black text-slate-700 tracking-tight leading-none mb-1">No Evaluation Records Found</h4>
                        <p className="text-slate-400 text-xs font-medium">You have not received any student evaluation metrics for the current active session yet.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
