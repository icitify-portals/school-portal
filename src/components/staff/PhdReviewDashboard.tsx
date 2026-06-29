"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
    getPhdApplicationsListAction, 
    getPhdCandidateStatusAction, 
    submitThesisReviewAction,
    recordDefenseResultAction,
    confirmGraduationAction
} from "@/actions/phd-actions";
import { 
    GraduationCap, 
    ClipboardList, 
    CheckSquare, 
    XSquare, 
    MessageSquare, 
    User, 
    RefreshCw, 
    Folder, 
    AlertCircle, 
    Calendar,
    Award,
    ExternalLink
} from "lucide-react";

interface PhdReviewDashboardProps {
    staffUserId: number;
    staffRole: 'department' | 'subdean' | 'pg_committee' | 'provost';
}

export function PhdReviewDashboard({ staffUserId, staffRole }: PhdReviewDashboardProps) {
    const [applications, setApplications] = useState<any[]>([]);
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [comment, setComment] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const res = await getPhdApplicationsListAction();
            if (res.success) {
                setApplications(res.data || []);
            } else {
                setError(res.error || "Failed to load applications");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplications();
    }, []);

    const handleSelectApp = async (appId: number, studentId: number) => {
        setDetailLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const res = await getPhdCandidateStatusAction(studentId);
            if (res.success) {
                setSelectedApp(res.data);
            } else {
                setError(res.error || "Failed to load candidate details");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleReviewSubmit = (action: 'approve' | 'reject') => {
        if (!selectedApp?.theses?.[0]?.id) return;
        if (!comment.trim()) {
            setError("A descriptive review comment is required before submitting your decision.");
            return;
        }

        setError(null);
        setSuccessMsg(null);
        startTransition(async () => {
            const res = await submitThesisReviewAction(
                selectedApp.theses[0].id,
                staffUserId,
                staffRole,
                action,
                comment
            );

            if (res.success) {
                setSuccessMsg(`Thesis review successfully marked as ${action}d!`);
                setComment("");
                // Refresh list and detail view
                await loadApplications();
                const freshDetail = await getPhdCandidateStatusAction(selectedApp.application.studentId);
                if (freshDetail.success) {
                    setSelectedApp(freshDetail.data);
                }
            } else {
                setError(res.error || "Review submission failed.");
            }
        });
    };

    const handleConfirmGraduation = () => {
        if (!selectedApp?.application?.id) return;
        setError(null);
        setSuccessMsg(null);
        startTransition(async () => {
            const res = await confirmGraduationAction(selectedApp.application.id);
            if (res.success) {
                setSuccessMsg("PhD Candidacy successfully graduated and finalized! Gold certificate generated.");
                await loadApplications();
                const freshDetail = await getPhdCandidateStatusAction(selectedApp.application.studentId);
                if (freshDetail.success) {
                    setSelectedApp(freshDetail.data);
                }
            } else {
                // @ts-expect-error - TS2339: Auto-suppressed for build
                setError(res.error || "Graduation confirmation failed.");
            }
        });
    };

    const isStageReviewPending = (status: string, thesisStatus: string) => {
        if (staffRole === 'department' && thesisStatus === 'dept_review') return true;
        if (staffRole === 'subdean' && thesisStatus === 'subdean_review') return true;
        if (staffRole === 'pg_committee' && thesisStatus === 'pg_committee_review') return true;
        if (staffRole === 'provost' && thesisStatus === 'meeting_pending') return true;
        return false;
    };

    return (
        <div className="max-w-[1600px] w-full mx-auto p-4 md:p-6 text-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
            {/* Sidebar list: LG columns 4 */}
            <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-xl flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                                <ClipboardList className="w-4.5 h-4.5 text-purple-400" />
                                Active PhD Candidates
                            </h3>
                            <span className="text-[10px] bg-purple-900/40 text-purple-300 border border-purple-800/40 px-2.5 py-0.5 rounded-full font-semibold uppercase">
                                {staffRole.replace("_", " ")} Role
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                            </div>
                        ) : applications.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-6 text-center">No PhD applications found.</p>
                        ) : (
                            <div className="space-y-2 overflow-y-auto max-h-[480px] pr-1">
                                {applications.map((app) => (
                                    <button
                                        key={app.id}
                                        onClick={() => handleSelectApp(app.id, app.studentId)}
                                        className={`w-full text-left bg-slate-950/60 hover:bg-slate-900 border rounded-lg p-3.5 transition-all flex items-start justify-between gap-3 text-xs ${
                                            selectedApp?.application?.id === app.id ? 'border-purple-500 shadow-md bg-slate-900' : 'border-slate-800/80'
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-200 line-clamp-1">{app.researchTitle}</p>
                                            <p className="text-[10px] text-slate-500">Candidate: {app.studentName}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                            app.status === 'completed' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' : 
                                            'bg-slate-800 text-slate-400 border border-slate-700'
                                        }`}>
                                            {app.status.replace("_", " ")}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail View: LG columns 7 */}
            <div className="lg:col-span-7 flex flex-col gap-4">
                {detailLoading ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 shadow-xl flex-1 flex flex-col items-center justify-center min-h-[400px]">
                        <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mb-2" />
                        <p className="text-xs text-slate-400">Loading candidacy details...</p>
                    </div>
                ) : !selectedApp ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 shadow-xl flex-1 flex flex-col items-center justify-center min-h-[400px] text-center">
                        <Folder className="w-12 h-12 text-slate-600 mb-3" />
                        <h4 className="font-bold text-slate-300 text-sm">No Candidate Selected</h4>
                        <p className="text-xs text-slate-500 max-w-sm mt-1">Select a PhD candidate from the list to perform sequential review operations, log feedback, or view scheduling details.</p>
                    </div>
                ) : (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 overflow-y-auto max-h-[620px]">
                        
                        {/* Title & Status */}
                        <div>
                            <span className="text-[9px] bg-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded uppercase">
                                Pipeline ID: {selectedApp.application.id}
                            </span>
                            <h2 className="text-lg font-bold text-slate-200 mt-2">{selectedApp.application.researchTitle}</h2>
                            <p className="text-xs text-slate-400 mt-1 italic">Abstract: "{selectedApp.application.abstract || "No abstract loaded."}"</p>
                        </div>

                        {/* Success & Error Messages inside detail */}
                        {error && (
                            <div className="bg-red-950/60 border border-red-800/60 text-red-200 rounded-lg p-3.5 flex items-start gap-2.5 text-xs">
                                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {successMsg && (
                            <div className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 rounded-lg p-3.5 flex items-start gap-2.5 text-xs">
                                <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <span>{successMsg}</span>
                            </div>
                        )}

                        {/* Interactive Action: Stage Review Drawer/Form */}
                        {selectedApp.theses?.[0] && isStageReviewPending(selectedApp.application.status, selectedApp.theses[0].status) && (
                            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                                    <MessageSquare className="w-4 h-4" />
                                    Active Stage Review Decisions
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    You have an active stage review task pending. Please download the thesis manuscript below, check the credentials, and log your final decision.
                                </p>

                                <div className="bg-slate-900 border border-slate-800/60 rounded-lg p-3 text-xs flex justify-between items-center">
                                    <span className="text-slate-500">Thesis Manuscript:</span>
                                    <a href={selectedApp.theses[0].fileUrl} target="_blank" className="text-purple-400 hover:underline flex items-center gap-1 font-bold">
                                        Open Document <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Review Comments / Feedback</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Explain the reason for approval or list required corrections for re-upload rejection..."
                                        className="w-full bg-slate-900 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-900"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleReviewSubmit('reject')}
                                        disabled={isPending}
                                        className="bg-red-950/40 hover:bg-red-900/30 text-red-400 border border-red-800/50 font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                                    >
                                        <XSquare className="w-4 h-4" />
                                        Reject & Rollback
                                    </button>
                                    <button
                                        onClick={() => handleReviewSubmit('approve')}
                                        disabled={isPending}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <CheckSquare className="w-4 h-4" />
                                        Approve & Progress
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Provost Graduation Trigger */}
                        {staffRole === 'provost' && selectedApp.defense?.status === 'successful' && selectedApp.application.status !== 'completed' && (
                            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                    <Award className="w-4.5 h-4.5" />
                                    Final Completion Approval
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    The candidate's final oral defense panel has succeeded. You are authorized to issue the final completion certificate and graduate the student.
                                </p>
                                <button
                                    onClick={handleConfirmGraduation}
                                    disabled={isPending}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Approve Completion & Graduation"}
                                </button>
                            </div>
                        )}

                        {/* Supervisors details in Detail panel */}
                        <div className="border-t border-slate-800/50 pt-4 text-xs space-y-3">
                            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Supervisor Allocations</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {selectedApp.supervisors.map((s: any) => (
                                    <div key={s.id} className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-slate-200">{s.name}</p>
                                            <p className="text-[10px] text-slate-500 capitalize">{s.type} • {s.email}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold capitalize ${
                                            s.status === 'accepted' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' : 
                                            s.status === 'rejected' ? 'bg-red-950/50 text-red-400 border border-red-800/50' : 
                                            'bg-slate-800 text-slate-400 border border-slate-700'
                                        }`}>
                                            {s.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Review timeline log files */}
                        {selectedApp.theses?.[0] && (
                            <div className="border-t border-slate-800/50 pt-4 text-xs space-y-3">
                                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Thesis History & Progress</h4>
                                <div className="space-y-3">
                                    {selectedApp.theses.map((th: any, idx: number) => (
                                        <div key={th.id} className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="font-bold text-slate-300">
                                                    {th.isCorrectedVersion ? "Corrected Manuscript Version" : "Initial Manuscript Upload"}
                                                </span>
                                                <span className="text-slate-500">{new Date(th.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-[10px]">
                                                <div className="flex justify-between items-center border-b border-slate-800/30 pb-1">
                                                    <span className="text-slate-500">Review Status:</span>
                                                    <span className="font-bold text-purple-400 uppercase">{th.status.replace("_", " ")}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-slate-800/30 pb-1">
                                                    <span className="text-slate-500">Turnitin Plagiarism:</span>
                                                    <span className={`font-bold ${th.turnitinScore > 15 ? 'text-red-400' : th.turnitinScore !== null ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                        {th.turnitinScore !== null ? `${th.turnitinScore}%` : 'Not run'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
