"use client";

import React, { useState, useEffect, useTransition } from "react";
import { getRefereeInvitationAction, submitRefereeResponseAction } from "@/actions/referee-actions";
import { 
    UserCheck, 
    FileText, 
    Award, 
    CheckCircle, 
    AlertTriangle, 
    RefreshCw, 
    HelpCircle, 
    Sparkles 
} from "lucide-react";

interface RefereeResponseFormProps {
    token: string;
}

export function RefereeResponseForm({ token }: RefereeResponseFormProps) {
    const [invitation, setInvitation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Form inputs
    const [relationshipCapacity, setRelationshipCapacity] = useState("");
    const [relationshipYears, setRelationshipYears] = useState<number>(0);
    const [recommendationLevel, setRecommendationLevel] = useState<'highly_recommend' | 'recommend' | 'reservations' | 'no_recommend'>('recommend');
    const [referenceLetter, setReferenceLetter] = useState("");
    const [ratings, setRatings] = useState<Record<string, number>>({});

    const loadInvitation = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getRefereeInvitationAction(token);
            if (res.success) {
                setInvitation(res.data);
                // Initialize ratings based on invitation application type
                const initialRatings: Record<string, number> = {};
                const criteria = res.data.applicationType === 'postgraduate' ? academicCriteria : professionalCriteria;
                criteria.forEach(c => {
                    initialRatings[c.key] = 4; // Default to "Above Average" / "Very Good"
                });
                setRatings(initialRatings);
            } else {
                setError(res.error || "Failed to retrieve referee recommendation invitation.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected system error occurred.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            loadInvitation();
        }
    }, [token]);

    const academicCriteria = [
        { key: "intellectual_capability", label: "Intellectual Capability" },
        { key: "research_potential", label: "Research & Analytical Potential" },
        { key: "writing_capability", label: "Academic Writing Excellence" },
        { key: "oral_expression", label: "Oral Expression & Communication" },
        { key: "emotional_stability", label: "Emotional Stability & Resilience" },
        { key: "originality_creativity", label: "Originality & Creative Ingenuity" },
    ];

    const academicOptions = [
        { value: 6, label: "Top 5%" },
        { value: 5, label: "Top 10%" },
        { value: 4, label: "Top 25%" },
        { value: 3, label: "Above Average" },
        { value: 2, label: "Average" },
        { value: 1, label: "Below Average" },
        { value: 0, label: "Unable to Assess" },
    ];

    const professionalCriteria = [
        { key: "professional_integrity", label: "Professional Integrity & Ethics" },
        { key: "teamwork_collaboration", label: "Teamwork & Collaboration Capability" },
        { key: "leadership_potential", label: "Leadership & Initiative Potential" },
        { key: "punctuality_reliability", label: "Punctuality, Reliability & Focus" },
        { key: "technical_skill", label: "Technical & Professional Competency" },
        { key: "emotional_intelligence", label: "Emotional Intelligence & Tact" },
    ];

    const professionalOptions = [
        { value: 5, label: "Exceptional" },
        { value: 4, label: "Excellent" },
        { value: 3, label: "Very Good" },
        { value: 2, label: "Satisfactory" },
        { value: 1, label: "Needs Improvement" },
        { value: 0, label: "Unsatisfactory" },
    ];

    const handleRatingChange = (criterionKey: string, score: number) => {
        setRatings({
            ...ratings,
            [criterionKey]: score
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        if (!relationshipCapacity.trim() || relationshipYears <= 0 || !referenceLetter.trim()) {
            setError("Please fill out all sections of this recommendation form, including capacity, duration, and reference letter.");
            return;
        }

        startTransition(async () => {
            const res = await submitRefereeResponseAction(token, {
                relationshipCapacity,
                relationshipYears,
                recommendationLevel,
                referenceLetter,
                ratings
            });

            if (res.success) {
                setSuccessMsg("Your recommendation response has been logged successfully. Thank you for your time!");
                setInvitation({ ...invitation, status: 'completed' });
            } else {
                setError(res.error || "Submission failed.");
            }
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mb-2" />
                <p className="text-sm font-medium">Securing recommendation session...</p>
            </div>
        );
    }

    if (error && !invitation) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-lg mx-auto shadow-2xl">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-slate-200 mb-2">Access Token Denied</h3>
                <p className="text-slate-400 text-sm">{error}</p>
            </div>
        );
    }

    if (invitation.status === 'completed') {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-lg mx-auto shadow-2xl">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-200 mb-2">Recommendation Submitted</h3>
                <p className="text-slate-400 text-sm">
                    Thank you! Your reference form response has been processed and saved. The selection panel has been updated.
                </p>
            </div>
        );
    }

    const isAcademic = invitation.applicationType === 'postgraduate';
    const criteria = isAcademic ? academicCriteria : professionalCriteria;
    const ratingOptions = isAcademic ? academicOptions : professionalOptions;

    return (
        <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md max-w-4xl mx-auto space-y-6 text-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-10" />
            
            {/* Header info */}
            <div className="border-b border-slate-800 pb-5">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-900/50 text-purple-300 border border-purple-800/50 text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                        Confidential Reference Portal
                    </span>
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-200">
                    Referee Evaluation: {invitation.refereeName}
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                    Providing recommendation for candidate in <strong className="text-slate-300 capitalize">{invitation.applicationType}</strong> pipeline.
                </p>
            </div>

            {/* Basic context & relationship duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-950/60 border border-slate-850 rounded-xl p-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                        Relationship Capacity
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Academic Supervisor, Chief Technical Officer"
                        value={relationshipCapacity}
                        onChange={(e) => setRelationshipCapacity(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Years Known Applicant
                    </label>
                    <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 3"
                        value={relationshipYears || ""}
                        onChange={(e) => setRelationshipYears(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            {/* Dynamic Competency Evaluation Grid */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Interactive Competency Rating Grid
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                    Compare the applicant with others of similar background and experience. Choose the rating that best reflects their abilities.
                </p>

                <div className="overflow-x-auto border border-slate-850 rounded-xl">
                    <table className="w-full border-collapse text-xs text-left bg-slate-950/40">
                        <thead>
                            <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                <th className="p-3.5 min-w-[200px]">Evaluation Metric</th>
                                {ratingOptions.map((opt) => (
                                    <th key={opt.value} className="p-3.5 text-center font-bold">
                                        {opt.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {criteria.map((c) => (
                                <tr key={c.key} className="border-b border-slate-800/80 hover:bg-slate-900/40 transition-colors">
                                    <td className="p-3.5 font-bold text-slate-200">{c.label}</td>
                                    {ratingOptions.map((opt) => (
                                        <td key={opt.value} className="p-3.5 text-center">
                                            <input
                                                type="radio"
                                                name={c.key}
                                                required
                                                checked={ratings[c.key] === opt.value}
                                                onChange={() => handleRatingChange(c.key, opt.value)}
                                                className="w-4 h-4 text-purple-600 bg-slate-950 border-slate-800 focus:ring-purple-900 focus:ring-offset-slate-900 accent-purple-600 cursor-pointer"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recommendation Levels */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Candidacy Recommendation</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { value: 'highly_recommend', label: "Highly Recommend" },
                        { value: 'recommend', label: "Recommend" },
                        { value: 'reservations', label: "With Reservations" },
                        { value: 'no_recommend', label: "Do Not Recommend" },
                    ].map((lvl) => (
                        <button
                            key={lvl.value}
                            type="button"
                            onClick={() => setRecommendationLevel(lvl.value as any)}
                            className={`py-2 px-3.5 rounded-lg border text-xs font-bold transition-all text-center ${
                                recommendationLevel === lvl.value 
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/20' 
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                        >
                            {lvl.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Narrative text block */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    Reference Appraisal Narrative
                </label>
                <textarea
                    required
                    rows={6}
                    value={referenceLetter}
                    onChange={(e) => setReferenceLetter(e.target.value)}
                    placeholder="Provide a comprehensive appraisal of the applicant's character, academic capacity, professional drive, achievements, and general potential..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-900 leading-relaxed"
                />
            </div>

            {/* Error banner */}
            {error && (
                <div className="bg-red-950/60 border border-red-800/60 text-red-200 rounded-xl p-4 flex items-start gap-2.5 text-xs">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-400 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Success banner */}
            {successMsg && (
                <div className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 rounded-xl p-4 flex items-start gap-2.5 text-xs">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950"
            >
                {isPending ? (
                    <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                ) : (
                    "Submit Confidential Appraisal"
                )}
            </button>
        </form>
    );
}
