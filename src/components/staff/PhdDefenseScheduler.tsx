"use client";

import React, { useState, useTransition } from "react";
import { scheduleDefenseAction } from "@/actions/phd-actions";
import { 
    Calendar, 
    MapPin, 
    Users, 
    UserPlus, 
    Trash2, 
    AlertTriangle, 
    CheckCircle, 
    RefreshCw, 
    PlusCircle,
    UserCheck,
    Coins
} from "lucide-react";

interface PhdDefenseSchedulerProps {
    phdApplicationId: number;
    onSuccess?: () => void;
}

interface ExaminerInput {
    name: string;
    email: string;
    type: 'internal' | 'external';
    honorarium: number;
}

export function PhdDefenseScheduler({ phdApplicationId, onSuccess }: PhdDefenseSchedulerProps) {
    const [defenseDate, setDefenseDate] = useState("");
    const [defenseTime, setDefenseTime] = useState("");
    const [location, setLocation] = useState("");
    const [examiners, setExaminers] = useState<ExaminerInput[]>([
        { name: "", email: "", type: "external", honorarium: 150000 },
        { name: "", email: "", type: "external", honorarium: 150000 },
        { name: "", email: "", type: "external", honorarium: 150000 },
        { name: "", email: "", type: "internal", honorarium: 80000 },
        { name: "", email: "", type: "internal", honorarium: 80000 },
    ]);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleAddExaminer = () => {
        setExaminers([
            ...examiners,
            { name: "", email: "", type: "external", honorarium: 100000 }
        ]);
    };

    const handleRemoveExaminer = (index: number) => {
        const list = [...examiners];
        list.splice(index, 1);
        setExaminers(list);
    };

    const handleExaminerChange = (index: number, field: keyof ExaminerInput, value: any) => {
        const list = [...examiners];
        list[index] = {
            ...list[index],
            [field]: value
        };
        setExaminers(list);
    };

    const externalsCount = examiners.filter(e => e.type === 'external').length;
    const internalsCount = examiners.filter(e => e.type === 'internal').length;
    const isPanelValid = externalsCount === 3 && internalsCount === 2;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        if (!defenseDate || !defenseTime || !location) {
            setError("All defense scheduling details (date, time, venue location) must be specified.");
            return;
        }

        if (!isPanelValid) {
            setError(`Invalid Panel Structure: A PhD oral defense panel must consist of exactly 3 External Examiners and 2 Internal Examiners. Currently you have: ${externalsCount} External and ${internalsCount} Internal examiners allocated.`);
            return;
        }

        // Validate individual examiner fields
        for (let i = 0; i < examiners.length; i++) {
            const ex = examiners[i];
            if (!ex.name.trim() || !ex.email.trim() || ex.honorarium <= 0) {
                setError(`Please complete all fields (name, email, and honorarium) for Examiner #${i + 1}.`);
                return;
            }
        }

        const dateObj = new Date(`${defenseDate}T${defenseTime}`);

        startTransition(async () => {
            const res = await scheduleDefenseAction(
                phdApplicationId,
                dateObj,
                location,
                examiners
            );

            if (res.success) {
                setSuccessMsg("PhD Oral Defense and Examiner Panels scheduled successfully! Notification links dispatched.");
                if (onSuccess) onSuccess();
            } else {
                setError(res.error || "Failed to schedule defense.");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 text-slate-100 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                    <Calendar className="w-4.5 h-4.5 text-purple-400" />
                    Configure Oral Defense Panel & Schedule
                </h3>
                <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-semibold uppercase">
                    HOD Command Board
                </span>
            </div>

            {/* General Schedule Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-400" />
                        Defense Date
                    </label>
                    <input
                        type="date"
                        required
                        value={defenseDate}
                        onChange={(e) => setDefenseDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-400" />
                        Start Time
                    </label>
                    <input
                        type="time"
                        required
                        value={defenseTime}
                        onChange={(e) => setDefenseTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-purple-400" />
                        Location Venue
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. PG Seminar Room B"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            {/* Live Panel Constraints Check */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 backdrop-blur-md transition-all duration-300 ${
                isPanelValid 
                    ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200' 
                    : 'bg-amber-950/40 border-amber-800/50 text-amber-200'
            }`}>
                {isPanelValid ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                    <h4 className="font-bold text-xs">Panel Allocation Verification</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        A final defense panel requires exactly <strong className="text-slate-200">3 External</strong> and <strong className="text-slate-200">2 Internal</strong> examiners.
                    </p>
                    <div className="flex gap-4 mt-2.5 text-[10px] font-bold">
                        <span className={`px-2 py-0.5 rounded-full border ${externalsCount === 3 ? 'bg-emerald-900/50 border-emerald-850 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                            External: {externalsCount} / 3
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border ${internalsCount === 2 ? 'bg-emerald-900/50 border-emerald-850 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                            Internal: {internalsCount} / 2
                        </span>
                    </div>
                </div>
            </div>

            {/* Dynamic Examiner Forms */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-400" />
                        Allocated Examiners Details
                    </h4>
                    <button
                        type="button"
                        onClick={handleAddExaminer}
                        className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                        <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                        Add Panel Member
                    </button>
                </div>

                <div className="space-y-3">
                    {examiners.map((ex, index) => (
                        <div key={index} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end relative group">
                            
                            <div className="sm:col-span-3 space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <UserCheck className="w-3 h-3 text-purple-500" />
                                    Examiner Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Prof. David Finch"
                                    value={ex.name}
                                    onChange={(e) => handleExaminerChange(index, "name", e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="sm:col-span-3 space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="dfinch@oxford.edu"
                                    value={ex.email}
                                    onChange={(e) => handleExaminerChange(index, "email", e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                    Examiner Type
                                </label>
                                <select
                                    value={ex.type}
                                    onChange={(e) => handleExaminerChange(index, "type", e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                                >
                                    <option value="external">External</option>
                                    <option value="internal">Internal</option>
                                </select>
                            </div>

                            <div className="sm:col-span-3 space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <Coins className="w-3 h-3 text-teal-400" />
                                    Honorarium (₦)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={ex.honorarium}
                                    onChange={(e) => handleExaminerChange(index, "honorarium", parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-900 border border-slate-800/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="sm:col-span-1 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveExaminer(index)}
                                    className="text-slate-500 hover:text-red-400 p-2 rounded hover:bg-slate-900 transition-colors flex items-center justify-center"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status alerts */}
            {error && (
                <div className="bg-red-950/60 border border-red-800/60 text-red-200 rounded-lg p-3 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-400 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {successMsg && (
                <div className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 rounded-lg p-3 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Submission buttons */}
            <button
                type="submit"
                disabled={isPending}
                className={`w-full font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isPanelValid 
                        ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
            >
                {isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    "Authorize Panel & Dispatch Invitations"
                )}
            </button>
        </form>
    );
}
