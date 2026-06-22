"use client";

import React, { useState, useEffect } from "react";
import { getStudentTraitsAction, saveStudentTraitsAction } from "@/actions/traits";
import { useBranch } from "@/providers/BranchProvider";
import { Star, Save, Smile, Heart, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TraitItem {
    traitId: number;
    name: string;
    originalName: string;
    group: string;
    rating: number | null;
}

export default function AffectiveRatingSheet({
    studentId,
    studentName,
    sessionId,
    term
}: {
    studentId: number;
    studentName: string;
    sessionId: number;
    term: number;
}) {
    const { activeUnit } = useBranch();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [traits, setTraits] = useState<TraitItem[]>([]);
    const [editedRatings, setEditedRatings] = useState<Record<number, number>>({});

    useEffect(() => {
        loadStudentTraits();
    }, [studentId, sessionId, term]);

    const loadStudentTraits = async () => {
        setLoading(true);
        const res = await getStudentTraitsAction(studentId, sessionId, term, activeUnit?.id);
        if (res.success && res.data) {
            setTraits(res.data);
            const initialRatings: Record<number, number> = {};
            res.data.forEach((t: any) => {
                if (t.rating !== null) {
                    initialRatings[t.traitId] = t.rating;
                }
            });
            setEditedRatings(initialRatings);
        } else {
            toast.error("Failed to load student traits");
        }
        setLoading(false);
    };

    const handleRate = (traitId: number, rating: number) => {
        setEditedRatings(prev => ({
            ...prev,
            [traitId]: rating
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        const formattedRatings = Object.entries(editedRatings).map(([traitId, rating]) => ({
            traitId: Number(traitId),
            rating
        }));

        const res = await saveStudentTraitsAction({
            studentId,
            sessionId,
            term,
            ratings: formattedRatings
        });

        if (res.success) {
            toast.success("Behavioral ratings saved successfully!");
            loadStudentTraits();
        } else {
            toast.error(res.error || "Failed to save ratings");
        }
        setSaving(false);
    };

    // Group traits by category/group
    const groups = Array.from(new Set(traits.map(t => t.group)));

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-4" />
                <p className="text-sm font-medium">Fetching behavioral records...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/40 p-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 pb-6 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-teal-500" />
                        Affective & Psychomotor Domains
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Evaluate <span className="font-semibold text-slate-600">{studentName}</span> on character development and motor skills (rated 1 to 5).
                    </p>
                </div>
                
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-4 md:mt-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-teal-100/50 hover:shadow-teal-100 disabled:shadow-none"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? "Saving Changes..." : "Save Ratings"}
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <Smile className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium">No behavioral traits configured for this level.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {groups.map(group => (
                        <div key={group} className="bg-slate-50/50 border border-slate-100 rounded-xl p-5">
                            <h4 className="text-sm font-extrabold text-teal-800 capitalize tracking-wide border-b border-teal-100/40 pb-2 mb-4">
                                {group} Traits
                            </h4>
                            
                            <div className="space-y-4">
                                {traits
                                    .filter(t => t.group === group)
                                    .map(trait => {
                                        const activeRating = editedRatings[trait.traitId] || 0;
                                        return (
                                            <div key={trait.traitId} className="flex items-center justify-between bg-white border border-slate-50 rounded-lg p-3 shadow-sm">
                                                <span className="text-sm font-medium text-slate-700 capitalize">
                                                    {trait.name}
                                                </span>
                                                
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(num => (
                                                        <button
                                                            key={num}
                                                            onClick={() => handleRate(trait.traitId, num)}
                                                            className="focus:outline-none transition-transform active:scale-95 group"
                                                        >
                                                            <Star
                                                                className={`w-5 h-5 transition ${
                                                                    num <= activeRating
                                                                        ? "fill-amber-400 text-amber-400"
                                                                        : "text-slate-200 group-hover:text-amber-200"
                                                                }`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
