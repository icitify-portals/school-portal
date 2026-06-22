"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
    getPhdCandidateStatusAction, 
    verifyCandidacyFeesAction, 
    uploadInitialThesisAction,
    submitCorrectedThesisAction
} from "@/actions/phd-actions";
import { 
    GraduationCap, 
    UserCheck, 
    Wallet, 
    UploadCloud, 
    Hourglass, 
    FileCheck, 
    Calendar, 
    Award, 
    ShieldCheck, 
    CheckCircle, 
    AlertTriangle, 
    RefreshCw,
    ExternalLink
} from "lucide-react";

interface PhdStudentPortalProps {
    studentId: number;
    sessionId: number;
}

export function PhdStudentPortal({ studentId, sessionId }: PhdStudentPortalProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState("");
    const [turnitinUrl, setTurnitinUrl] = useState("");
    const [turnitinScore, setTurnitinScore] = useState<number>(0);
    const [isPending, startTransition] = useTransition();
    const [verificationMsg, setVerificationMsg] = useState<string | null>(null);

    const loadCandidacyData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getPhdCandidateStatusAction(studentId);
            if (res.success) {
                setData(res.data);
            } else {
                setError(res.error || "Failed to load candidacy record");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCandidacyData();
    }, [studentId]);

    const handleFeesCheck = () => {
        if (!data?.application?.id) return;
        setVerificationMsg(null);
        startTransition(async () => {
            const res = await verifyCandidacyFeesAction(data.application.id, sessionId);
            if (res.success) {
                setVerificationMsg("Fees check successful! Your account is cleared for thesis upload.");
                await loadCandidacyData();
            } else {
                setError(res.error || "Bursary clearance failed.");
            }
        });
    };

    const handleInitialUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileUrl) return;
        setVerificationMsg(null);
        startTransition(async () => {
            const res = await uploadInitialThesisAction(data.application.id, fileUrl);
            if (res.success) {
                setVerificationMsg("Thesis successfully submitted to HOD tray!");
                setFileUrl("");
                await loadCandidacyData();
            } else {
                setError(res.error || "Upload failed.");
            }
        });
    };

    const handleCorrectedUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileUrl || !turnitinUrl || turnitinScore === undefined) return;
        setVerificationMsg(null);
        startTransition(async () => {
            const res = await submitCorrectedThesisAction(
                data.application.id,
                fileUrl,
                turnitinUrl,
                turnitinScore
            );
            if (res.success) {
                setVerificationMsg("Corrected thesis and Turnitin report uploaded successfully!");
                setFileUrl("");
                setTurnitinUrl("");
                setTurnitinScore(0);
                await loadCandidacyData();
            } else {
                setError(res.error || "Upload failed.");
            }
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mb-2" />
                <p className="text-sm font-medium">Retrieving PhD candidacy pipeline...</p>
            </div>
        );
    }

    if (!data?.application) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-lg mx-auto shadow-2xl">
                <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-200 mb-2">No PhD Candidacy Found</h3>
                <p className="text-slate-400 text-sm">
                    You currently have no active PhD candidacy record. Please contact the PG College of Postgraduate Studies to register.
                </p>
            </div>
        );
    }

    const { application, supervisors, theses, examiners, defense } = data;
    const currentThesis = theses?.[0];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "from-emerald-500 to-teal-500 text-white";
            case "approved_corrections": return "from-amber-500 to-orange-500 text-white";
            case "defense_scheduled": return "from-cyan-500 to-blue-500 text-white";
            case "under_review": return "from-indigo-500 to-purple-500 text-white";
            case "thesis_uploaded": return "from-blue-500 to-sky-500 text-white";
            case "fees_paid": return "from-teal-500 to-emerald-500 text-white";
            default: return "from-slate-700 to-slate-800 text-slate-300";
        }
    };

    const getTimelineStepClass = (stepNum: number, currentStep: number) => {
        if (currentStep > stepNum) return "bg-emerald-500 text-white border-emerald-500";
        if (currentStep === stepNum) return "bg-purple-600 text-white border-purple-500 ring-4 ring-purple-900/30 animate-pulse";
        return "bg-slate-900 text-slate-500 border-slate-800";
    };

    const getStepNumber = (status: string) => {
        switch (status) {
            case "applied": return 1;
            case "supervisors_pending": return 1;
            case "supervisors_accepted": return 2;
            case "fees_pending": return 2;
            case "fees_paid": return 3;
            case "thesis_uploaded": return 4;
            case "under_review": return 4;
            case "approved_corrections": return 5;
            case "defense_scheduled": return 6;
            case "completed": return 7;
            default: return 1;
        }
    };

    const currentStep = getStepNumber(application.status);

    return (
        <div className="space-y-6 max-w-[1600px] w-full mx-auto p-4 md:p-6 text-slate-100">
            {/* Header Glassmorphic card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-purple-900/50 text-purple-300 border border-purple-800/50 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                PhD Candidate Portal
                            </span>
                            <span className="text-slate-400 text-xs">•</span>
                            <span className="text-slate-400 text-xs">ID: {application.id}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                            {application.researchTitle}
                        </h1>
                        <p className="text-slate-400 text-sm mt-2 max-w-3xl line-clamp-2 italic">
                            "{application.abstract || "No abstract details provided."}"
                        </p>
                    </div>

                    <div className="flex-shrink-0">
                        <div className={`bg-gradient-to-r ${getStatusColor(application.status)} font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg border border-white/10 text-center`}>
                            {application.status.replace("_", " ")}
                        </div>
                    </div>
                </div>

                {/* Interactive Status Timeline */}
                <div className="mt-8 pt-6 border-t border-slate-800/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Candidacy Progression Pipeline</h3>
                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-[18px] left-[20px] right-[20px] h-[3px] bg-slate-800 -z-10" />
                        
                        {[
                            { step: 1, name: "Supervisors", icon: UserCheck },
                            { step: 2, name: "Fees Clearance", icon: Wallet },
                            { step: 3, name: "Thesis Upload", icon: UploadCloud },
                            { step: 4, name: "Stage Review", icon: Hourglass },
                            { step: 5, name: "Corrections & Turnitin", icon: FileCheck },
                            { step: 6, name: "Defense Panel", icon: Calendar },
                            { step: 7, name: "Convocation", icon: Award }
                        ].map((s) => {
                            const IconComp = s.icon;
                            return (
                                <div key={s.step} className="flex md:flex-col items-center gap-3 md:gap-2 flex-1 w-full md:w-auto">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 text-sm ${getTimelineStepClass(s.step, currentStep)}`}>
                                        {currentStep > s.step ? <CheckCircle className="w-5 h-5" /> : s.step}
                                    </div>
                                    <div className="text-left md:text-center">
                                        <p className={`text-xs font-bold ${currentStep >= s.step ? "text-slate-200" : "text-slate-600"}`}>
                                            {s.name}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Error & Warning Banners */}
            {error && (
                <div className="bg-red-950/60 border border-red-800/60 text-red-200 rounded-xl p-4 flex items-start gap-3 backdrop-blur-md">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-sm">Action Blocked</h4>
                        <p className="text-xs text-red-300 mt-0.5">{error}</p>
                        <button onClick={() => setError(null)} className="text-xs underline text-red-400 font-medium mt-2 block hover:text-red-300">
                            Acknowledge
                        </button>
                    </div>
                </div>
            )}

            {verificationMsg && (
                <div className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 rounded-xl p-4 flex items-start gap-3 backdrop-blur-md">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-sm">System Verification Success</h4>
                        <p className="text-xs text-emerald-300 mt-0.5">{verificationMsg}</p>
                    </div>
                </div>
            )}

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Bento Card: Supervisors Panel */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                                <UserCheck className="w-4.5 h-4.5 text-purple-400" />
                                Department Supervisors
                            </h3>
                            <span className="text-xs text-slate-400 font-semibold uppercase bg-slate-800 px-2 py-0.5 rounded">
                                Stage 1
                            </span>
                        </div>
                        
                        {supervisors.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No supervisors have been assigned yet. Waiting for HOD selection.</p>
                        ) : (
                            <div className="space-y-3">
                                {supervisors.map((s: any) => (
                                    <div key={s.id} className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 flex items-center justify-between gap-3 text-xs">
                                        <div>
                                            <p className="font-bold text-slate-200">{s.name}</p>
                                            <p className="text-[10px] text-slate-500">{s.type} • {s.email}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            s.status === 'accepted' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' : 
                                            s.status === 'rejected' ? 'bg-red-950/50 text-red-400 border border-red-800/50' : 
                                            'bg-slate-800 text-slate-400 border border-slate-700'
                                        }`}>
                                            {s.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bento Card: Fees Clearance Panel */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                                <Wallet className="w-4.5 h-4.5 text-teal-400" />
                                Bursary & Tuition Gating
                            </h3>
                            <span className="text-xs text-slate-400 font-semibold uppercase bg-slate-800 px-2 py-0.5 rounded">
                                Stage 2
                            </span>
                        </div>
                        
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            Your account is locked until the current session tuition and postgraduate fees are fully cleared. Let the engine sync with your billings.
                        </p>

                        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 text-xs space-y-2 mb-4">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Bill Sync Status:</span>
                                <span className={`font-bold ${application.status === 'applied' || application.status === 'supervisors_pending' || application.status === 'supervisors_accepted' || application.status === 'fees_pending' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {application.status === 'applied' || application.status === 'supervisors_pending' || application.status === 'supervisors_accepted' || application.status === 'fees_pending' ? 'Verification Required' : 'Cleared'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {currentStep === 2 && (
                        <button
                            onClick={handleFeesCheck}
                            disabled={isPending}
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                        >
                            {isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Verify Session Payments"}
                        </button>
                    )}
                </div>

                {/* Bento Card: Thesis Submissions */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                                <UploadCloud className="w-4.5 h-4.5 text-cyan-400" />
                                Thesis Repository
                            </h3>
                            <span className="text-xs text-slate-400 font-semibold uppercase bg-slate-800 px-2 py-0.5 rounded">
                                Stage 3/5
                            </span>
                        </div>

                        {theses.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No thesis uploads detected. Clearing billing is required first.</p>
                        ) : (
                            <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 text-xs space-y-2 mb-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Current Status:</span>
                                    <span className="font-bold text-purple-400 uppercase">{currentThesis.status.replace("_", " ")}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">File Url:</span>
                                    <a href={currentThesis.fileUrl} target="_blank" className="text-purple-400 hover:underline flex items-center gap-1">
                                        View File <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                {currentThesis.turnitinScore !== null && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Turnitin Score:</span>
                                        <span className={`font-bold ${currentThesis.turnitinScore > 15 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {currentThesis.turnitinScore}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {currentStep === 3 && (
                        <form onSubmit={handleInitialUpload} className="space-y-2">
                            <input
                                type="url"
                                required
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                placeholder="Enter PDF File S3/Cloud URL"
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                            />
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                            >
                                {isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Upload Initial Thesis"}
                            </button>
                        </form>
                    )}

                    {/* Reupload Required for corrections (Turnitin score check triggered by Student after final reviews) */}
                    {application.status === 'approved_corrections' && (
                        <form onSubmit={handleCorrectedUpload} className="space-y-2 border-t border-slate-800/50 pt-4 mt-2">
                            <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Corrected Version Re-upload</h4>
                            <input
                                type="url"
                                required
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                placeholder="Corrected Thesis URL"
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                            />
                            <input
                                type="url"
                                required
                                value={turnitinUrl}
                                onChange={(e) => setTurnitinUrl(e.target.value)}
                                placeholder="Turnitin Report URL"
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                            />
                            <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                value={turnitinScore}
                                onChange={(e) => setTurnitinScore(parseInt(e.target.value))}
                                placeholder="Plagiarism Index (%)"
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                            />
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                            >
                                {isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Submit Corrections"}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Stage Reviews Timeline (Detailed View for Stage 4) */}
            {currentThesis && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2">
                        <Hourglass className="w-4.5 h-4.5 text-indigo-400 animate-spin-slow" />
                        Thesis Stage Review logs
                    </h3>
                    
                    <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
                        {[
                            { label: "Department Head (HOD)", activeStates: ["dept_review", "subdean_review", "pg_committee_review", "meeting_pending", "approved"] },
                            { label: "Faculty Subdean", activeStates: ["subdean_review", "pg_committee_review", "meeting_pending", "approved"] },
                            { label: "Postgraduate Committee", activeStates: ["pg_committee_review", "meeting_pending", "approved"] },
                            { label: "Provost Approval", activeStates: ["meeting_pending", "approved"] }
                        ].map((phase, idx) => {
                            const isPast = phase.activeStates.includes(currentThesis.status) && currentThesis.status !== phase.activeStates[0];
                            const isCurrent = currentThesis.status === phase.activeStates[0];
                            
                            return (
                                <div key={idx} className="relative">
                                    {/* Indicator dot */}
                                    <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 ${
                                        isPast ? 'bg-emerald-500 border-emerald-500' : 
                                        isCurrent ? 'bg-purple-600 border-purple-500 animate-pulse' : 
                                        'bg-slate-950 border-slate-800'
                                    }`} />
                                    <div>
                                        <p className={`text-xs font-bold ${isPast || isCurrent ? "text-slate-200" : "text-slate-500"}`}>
                                            {phase.label}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            {isPast ? "Cleared & Approved" : isCurrent ? "Under Active Review" : "Pending prior approvals"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Defense Scheduler details (Stage 6) */}
            {defense && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2">
                        <Calendar className="w-4.5 h-4.5 text-cyan-400" />
                        Scheduled Final Presentation & Defense
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-4 text-xs space-y-2">
                            <h4 className="font-bold text-slate-400">Schedule Details</h4>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Date:</span>
                                <span className="text-slate-200 font-bold">{new Date(defense.defenseDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Time:</span>
                                <span className="text-slate-200 font-bold">{new Date(defense.defenseDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Location:</span>
                                <span className="text-slate-200 font-bold">{defense.location}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Result:</span>
                                <span className={`font-bold capitalize ${defense.status === 'successful' ? 'text-emerald-400' : defense.status === 'failed' ? 'text-red-400' : 'text-blue-400'}`}>
                                    {defense.status}
                                </span>
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-slate-950/60 border border-slate-800/60 rounded-lg p-4 text-xs">
                            <h4 className="font-bold text-slate-400 mb-3">Defense Examination Panel</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {examiners.map((ex: any) => (
                                    <div key={ex.id} className="bg-slate-900/60 border border-slate-800/60 rounded p-2.5 flex items-center justify-between gap-2">
                                        <div>
                                            <p className="font-bold text-slate-200">{ex.name}</p>
                                            <p className="text-[10px] text-slate-500 capitalize">{ex.type} Examiner</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-purple-400">{settings?.base_currency || '₦'}{parseFloat(ex.honorariumAmount).toLocaleString()}</p>
                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest">{ex.paymentStatus.replace("_", " ")}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
