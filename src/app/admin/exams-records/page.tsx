"use client";

import { useState } from "react";
import { GraduationCap, Users, Search, Target } from "lucide-react";
import GraduatingStudentList from "@/components/exams-records/GraduatingStudentList";
import GeneralStudentSearch from "@/components/exams-records/GeneralStudentSearch";
import { cn } from "@/lib/utils";

export default function ExamsRecordsAdminPage() {
    const [activeTab, setActiveTab] = useState<'graduating' | 'search'>('graduating');

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <GraduationCap className="w-12 h-12 text-indigo-400" />
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md">
                                Exams & Records
                            </h1>
                        </div>
                        <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                            Academic history, transcript processing, Senate broadsheets, and record verification.
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/admin/exams-records/broadsheet" className="group">
                    <div className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-3xl p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all shadow-inner">
                            <Target className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Senate Broadsheet</h3>
                        <p className="text-sm font-medium text-slate-500 mt-2">Compile and view official class results for Senate approval.</p>
                    </div>
                </a>
                <a href="/admin/exams-records/upload" className="group">
                    <div className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-3xl p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-100 transition-all shadow-inner">
                            <Users className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Bulk Result Upload</h3>
                        <p className="text-sm font-medium text-slate-500 mt-2">Upload CA and Exam scores via CSV for processing.</p>
                    </div>
                </a>
                <a href="/admin/exams-records/carry-overs" className="group">
                    <div className="bg-white/60 backdrop-blur-3xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-3xl p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-100 transition-all shadow-inner">
                            <Search className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Carry-Over Tracker</h3>
                        <p className="text-sm font-medium text-slate-500 mt-2">Monitor and enforce mandatory course retakes.</p>
                    </div>
                </a>
            </div>

            <div className="flex gap-2 p-1.5 bg-slate-200/50 backdrop-blur-xl rounded-2xl w-fit border border-slate-200 shadow-inner">
                <button
                    onClick={() => setActiveTab('graduating')}
                    className={cn(
                        "px-8 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-wider flex items-center gap-2",
                        activeTab === 'graduating'
                            ? "bg-white text-indigo-700 shadow-md scale-105"
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    )}
                >
                    <Target className="w-4 h-4" />
                    Graduating
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={cn(
                        "px-8 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-wider flex items-center gap-2",
                        activeTab === 'search'
                            ? "bg-white text-indigo-700 shadow-md scale-105"
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    )}
                >
                    <Search className="w-4 h-4" />
                    All Students
                </button>
            </div>

            <div className="pt-4">
                {activeTab === 'graduating' ? (
                    <div className="space-y-6">
                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-center gap-6">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-indigo-900 tracking-tight leading-none mb-1">Final Year List</h3>
                                <p className="text-indigo-600/70 text-xs font-bold uppercase tracking-widest">Heuristic filtering for graduating students</p>
                            </div>
                        </div>
                        <GraduatingStudentList />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-slate-900 p-6 rounded-2xl flex items-center gap-6 text-white shadow-xl">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <Search className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight leading-none mb-1">Global Record Search</h3>
                                <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Search all student records for transcripts and results</p>
                            </div>
                        </div>
                        <GeneralStudentSearch />
                    </div>
                )}
            </div>
        </div>
    );
}
