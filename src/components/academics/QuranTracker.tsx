"use client";

import React, { useState, useEffect } from "react";
import { getStudentQuranLogs, saveQuranMemorizationLog } from "@/actions/quran-memorization";
import { BookOpen, Star, Save, CheckCircle, HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SURAHS = [
    "An-Nas", "Al-Falaq", "Al-Ikhlas", "Al-Masad", "An-Nasr",
    "Al-Kafirun", "Al-Kauthar", "Al-Ma'un", "Quraish", "Al-Fil",
    "Al-Humazah", "Al-Asr", "At-Takathur", "Al-Qari'ah", "Al-Adiyat",
    "Al-Zilzal", "Al-Bayyinah", "Al-Qadr", "Al-Alaq", "At-Tin",
    "Al-Inshirah", "Ad-Duha"
];

interface QuranLog {
    id: number;
    surahName: string;
    status: 'memorized' | 'in_progress' | 'not_started';
    tajweedRating: number;
    fluencyRating: number;
    teacherRemark: string | null;
}

export default function QuranTracker({
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logs, setLogs] = useState<QuranLog[]>([]);
    
    // Editor State
    const [selectedSurah, setSelectedSurah] = useState(SURAHS[0]);
    const [status, setStatus] = useState<'memorized' | 'in_progress' | 'not_started'>('not_started');
    const [tajweed, setTajweed] = useState(0);
    const [fluency, setFluency] = useState(0);
    const [remark, setRemark] = useState("");

    useEffect(() => {
        loadQuranLogs();
    }, [studentId, sessionId, term]);

    // Update form when selectedSurah changes
    useEffect(() => {
        const match = logs.find(l => l.surahName === selectedSurah);
        if (match) {
            setStatus(match.status);
            setTajweed(match.tajweedRating);
            setFluency(match.fluencyRating);
            setRemark(match.teacherRemark || "");
        } else {
            setStatus('not_started');
            setTajweed(0);
            setFluency(0);
            setRemark("");
        }
    }, [selectedSurah, logs]);

    const loadQuranLogs = async () => {
        setLoading(true);
        const res = await getStudentQuranLogs(studentId, sessionId, term);
        if (res.success && res.data) {
            setLogs(res.data as any);
        } else {
            toast.error("Failed to load memorization logs");
        }
        setLoading(false);
    };

    const handleSaveLog = async () => {
        setSaving(true);
        const res = await saveQuranMemorizationLog({
            studentId,
            sessionId,
            term,
            surahName: selectedSurah,
            status,
            tajweedRating: tajweed,
            fluencyRating: fluency,
            teacherRemark: remark
        });

        if (res.success) {
            toast.success(`Quran progress for Surah ${selectedSurah} saved!`);
            await loadQuranLogs();
        } else {
            toast.error("Failed to save progress");
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-4" />
                <p className="text-sm font-medium">Fetching Quran memorization logs...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/40 p-6 max-w-4xl mx-auto">
            <div className="border-b border-slate-50 pb-5 mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-500" />
                    Quran Hifz & Tajweed Tracker
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                    Manage recitation accuracy, memorization checkpoints, and teacher remarks for <span className="font-semibold text-slate-600">{studentName}</span>.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Surah Select Sidebar */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-[420px] overflow-y-auto">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Select Surah</h4>
                    <div className="space-y-1">
                        {SURAHS.map(sName => {
                            const matchingLog = logs.find(l => l.surahName === sName);
                            const active = selectedSurah === sName;
                            
                            return (
                                <button
                                    key={sName}
                                    onClick={() => setSelectedSurah(sName)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-all font-medium ${
                                        active
                                            ? "bg-teal-600 text-white shadow-md shadow-teal-100/50"
                                            : "hover:bg-slate-100 text-slate-600 hover:text-slate-800"
                                    }`}
                                >
                                    <span>{sName}</span>
                                    {matchingLog?.status === 'memorized' && (
                                        <CheckCircle className={`w-4 h-4 ${active ? "text-white" : "text-emerald-500"}`} />
                                    )}
                                    {matchingLog?.status === 'in_progress' && (
                                        <div className={`w-2.5 h-2.5 rounded-full ${active ? "bg-white" : "bg-amber-400 animate-pulse"}`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Rating & Comments Portal */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 space-y-5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-md font-bold text-slate-800">
                                Surah {selectedSurah} Progress
                            </h4>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                status === 'memorized'
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : status === 'in_progress'
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-slate-100 text-slate-500"
                            }`}>
                                {status === 'memorized' ? "Memorized" : status === 'in_progress' ? "In Progress" : "Not Started"}
                            </span>
                        </div>

                        {/* Status Radio Choices */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Hifz Status</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'not_started', label: 'Not Started' },
                                    { value: 'in_progress', label: 'In Progress' },
                                    { value: 'memorized', label: 'Completed' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setStatus(opt.value as any)}
                                        className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition ${
                                            status === opt.value
                                                ? "bg-teal-50 border-teal-200 text-teal-700"
                                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tajweed Rating */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Tajweed / Accuracy (1-5)</label>
                            <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setTajweed(num)}
                                        className="focus:outline-none transition active:scale-95"
                                    >
                                        <Star
                                            className={`w-6 h-6 ${
                                                num <= tajweed ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-amber-200"
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Fluency Rating */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Recitation Fluency (1-5)</label>
                            <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setFluency(num)}
                                        className="focus:outline-none transition active:scale-95"
                                    >
                                        <Star
                                            className={`w-6 h-6 ${
                                                num <= fluency ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-amber-200"
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comments */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Teacher Remarks</label>
                            <textarea
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                placeholder="Write positive feedback, tajweed corrections, or encouragement notes..."
                                className="w-full text-sm border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl p-3 h-24 resize-none transition"
                            />
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveLog}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-teal-100/50 hover:shadow-teal-100 disabled:shadow-none"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {saving ? "Saving Hifz progress..." : `Save Surah ${selectedSurah}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
