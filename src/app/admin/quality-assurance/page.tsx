"use client";

import { useEffect, useState, useTransition } from "react";
import { getInstructorQAProfiles } from "@/actions/quality-assurance";
import { getResultFilterMetadata } from "@/actions/exams-records";
import { 
    Award, Layers, Users, BookOpen, ClipboardList, 
    Printer, Star, MessageSquare, ShieldCheck, HeartPulse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface InstructorProfile {
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

export default function QualityAssurancePage() {
    const [metadata, setMetadata] = useState<{ sessions: any[]; groups: any[]; levels: number[]; departments: any[] } | null>(null);
    const [profiles, setProfiles] = useState<InstructorProfile[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [selectedTerm, setSelectedTerm] = useState<string>("1");
    const [selectedDept, setSelectedDept] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Appraisal print view state
    const [printProfile, setPrintProfile] = useState<InstructorProfile | null>(null);

    // Initial load
    useEffect(() => {
        async function init() {
            const metaRes = await getResultFilterMetadata();
            if (metaRes.success && metaRes.data) {
                setMetadata(metaRes.data as any);
                if (metaRes.data.sessions.length > 0) {
                    setSelectedSession(metaRes.data.sessions[0].id.toString());
                }
            }
            
            // Load QA stats
            setLoading(true);
            const qaRes = await getInstructorQAProfiles();
            if (qaRes.success && qaRes.data) {
                setProfiles(qaRes.data as any);
            }
            setLoading(false);
        }
        init();
    }, []);

    const handleSearch = () => {
        setLoading(true);
        startTransition(async () => {
            const qaRes = await getInstructorQAProfiles({
                sessionId: selectedSession ? parseInt(selectedSession) : undefined,
                semester: selectedTerm,
                deptId: selectedDept ? parseInt(selectedDept) : undefined
            });
            if (qaRes.success && qaRes.data) {
                setProfiles(qaRes.data as any);
            }
            setLoading(false);
        });
    };

    const handlePrint = (prof: InstructorProfile) => {
        setPrintProfile(prof);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    if (printProfile) {
        // High fidelity printable appraisal sheet
        return (
            <div className="bg-white p-12 max-w-4xl mx-auto space-y-8 border-[6px] border-slate-900 rounded-2xl shadow-none print:border-none print:p-0 print:shadow-none animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-8 border-b-4 border-slate-900 pb-6 print:hidden">
                    <Button onClick={() => setPrintProfile(null)} variant="outline" className="font-bold rounded-xl">
                        Back to QA Console
                    </Button>
                    <Button onClick={() => window.print()} className="bg-indigo-600 font-bold rounded-xl gap-2 shadow-lg shadow-indigo-100">
                        <Printer className="w-5 h-5" />
                        Trigger PDF Appraisal Slip
                    </Button>
                </div>

                {/* Institution Letterhead */}
                <div className="text-center space-y-2 border-b-2 border-slate-200 pb-6">
                    <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900">Quality Assurance Board</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.25em] text-xs">Instructor Performance & Promotion Appraisal</p>
                    <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest mt-1">CONFIDENTIAL REPORT</p>
                </div>

                {/* Instructor Profile Details */}
                <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructor Name</p>
                            <p className="text-lg font-black text-slate-900">{printProfile.name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department/Stream</p>
                            <p className="text-sm font-bold text-slate-700">{printProfile.department}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Designation</p>
                            <p className="text-sm font-bold text-slate-700">{printProfile.jobTitle}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appraisal Index Score</p>
                            <p className="text-lg font-black text-indigo-600">{printProfile.aggregateScore} / 5.00</p>
                        </div>
                    </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-2">Appraisal Metric Breakdown</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(printProfile.metrics).map(([key, val]) => (
                            <div key={key} className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <span>{key} score</span>
                                    <span>{val} / 5.00</span>
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

                {/* Qualitative Feedback */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-2">Student Performance Reviews</h3>
                    {printProfile.comments.length > 0 ? (
                        <div className="space-y-4">
                            {printProfile.comments.map((comm, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                                    <div className="flex justify-between items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Course: {comm.course}</span>
                                        <span>Date: {comm.date}</span>
                                    </div>
                                    <p className="text-slate-600 text-xs italic font-medium">"{comm.text}"</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-xs italic font-medium">No qualitative comments recorded this appraisal term.</p>
                    )}
                </div>

                {/* Signatures */}
                <div className="mt-20 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="space-y-4">
                        <div className="w-36 h-px bg-slate-200 border-dashed border-t-2 mx-auto" />
                        <p>Evaluator / QA Director</p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-36 h-px bg-slate-200 border-dashed border-t-2 mx-auto" />
                        <p>Principal Registrar / Provost</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                        <ShieldCheck className="w-10 h-10 text-indigo-600" />
                        Quality Assurance Console
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium tracking-tight">
                        Aggregate student feedback, monitor instructor teaching metrics, and export appraisal slips for promotional reviews.
                    </p>
                </div>
            </div>

            {/* Filters Dashboard */}
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Session */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                            Session
                        </label>
                        <select 
                            value={selectedSession} 
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                            <option value="">All Sessions</option>
                            {metadata?.sessions.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Term */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                            Term / Semester
                        </label>
                        <select 
                            value={selectedTerm} 
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                            <option value="1">First Term / Semester 1</option>
                            <option value="2">Second Term / Semester 2</option>
                            <option value="3">Third Term</option>
                        </select>
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            Department / stream
                        </label>
                        <select 
                            value={selectedDept} 
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                            <option value="">All Departments</option>
                            {metadata?.departments?.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Generate Button */}
                    <div className="flex items-end">
                        <Button 
                            onClick={handleSearch}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            <Star className="w-5 h-5 animate-spin" />
                            Analyze QA Scorecards
                        </Button>
                    </div>
                </div>
            </div>

            {/* QA Scorecards List */}
            {profiles.length > 0 ? (
                <div className="space-y-6">
                    {profiles.map((prof) => (
                        <div key={prof.staffId} className="bg-white border border-slate-100 rounded-2xl p-8 shadow-xl shadow-slate-100/50 grid grid-cols-1 lg:grid-cols-3 gap-8 hover:border-slate-200 transition-all duration-300">
                            
                            {/* Left Panel: Tutor Info & Aggregate Score */}
                            <div className="lg:col-span-1 space-y-4 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{prof.name}</h3>
                                    <p className="text-indigo-600 text-xs font-black uppercase tracking-widest">{prof.jobTitle}</p>
                                    <p className="text-slate-400 text-xs font-bold">Department: {prof.department}</p>
                                </div>

                                <div className="bg-slate-900 text-white rounded-2xl p-6 flex items-center justify-between gap-4 shadow-xl">
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Aggregate Rating</p>
                                        <div className="text-4xl font-black italic tracking-tighter mt-1">{prof.aggregateScore}</div>
                                        <p className="text-[10px] text-white/50 font-medium">From {prof.totalSubmissions} student submissions</p>
                                    </div>
                                    <Button 
                                        size="sm"
                                        onClick={() => handlePrint(prof)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md h-10 px-4 gap-1.5 flex items-center"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Appraise
                                    </Button>
                                </div>
                            </div>

                            {/* Middle Panel: Metric Breakdown */}
                            <div className="lg:col-span-1 space-y-4 justify-center flex flex-col border-y lg:border-y-0 lg:border-x border-slate-100 py-6 lg:py-0 lg:px-8">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Detailed Metric Performance</h4>
                                
                                <div className="space-y-3.5">
                                    {Object.entries(prof.metrics).map(([key, val]) => (
                                        <div key={key} className="space-y-1">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                                                <span>{key}</span>
                                                <span>{val} / 5</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-600 rounded-full" 
                                                    style={{ width: `${(val / 5) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Panel: Student Comments */}
                            <div className="lg:col-span-1 space-y-4 flex flex-col justify-between">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3 flex items-center gap-1">
                                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                        Qualitative Student Feedback
                                    </h4>
                                    
                                    {prof.comments.length > 0 ? (
                                        <div className="max-h-[160px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                                            {prof.comments.map((comm, idx) => (
                                                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                                                    <div className="flex justify-between gap-4 text-[9px] font-black text-slate-400">
                                                        <span>{comm.course}</span>
                                                        <span>{comm.date}</span>
                                                    </div>
                                                    <p className="text-slate-600 text-xs italic font-semibold">"{comm.text}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-xs italic font-medium">No written recommendations recorded this term.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center gap-4">
                    <HeartPulse className="w-12 h-12 text-slate-300" />
                    <div>
                        <h4 className="text-lg font-black text-slate-700 tracking-tight leading-none mb-1">No Quality Appraisal Data</h4>
                        <p className="text-slate-400 text-xs font-medium">Select academic search parameters to run student evaluations scorecard analytics</p>
                    </div>
                </div>
            )}
        </div>
    );
}
