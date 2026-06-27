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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                        <GraduationCap className="w-10 h-10 text-indigo-600" />
                        Exams and Records
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium tracking-tight">Academic history, transcript processing, and record verification</p>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a href="/admin/exams-records/broadsheet" className="group">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Target className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Senate Broadsheet</h3>
                        <p className="text-sm text-slate-500 mt-1">Compile and view official class results for Senate approval.</p>
                    </div>
                </a>
                <a href="/admin/exams-records/upload" className="group">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:emerald-300 transition-all">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Bulk Result Upload</h3>
                        <p className="text-sm text-slate-500 mt-1">Upload CA and Exam scores via CSV for processing.</p>
                    </div>
                </a>
                <a href="/admin/exams-records/carry-overs" className="group">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:amber-300 transition-all">
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Search className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Carry-Over Tracker</h3>
                        <p className="text-sm text-slate-500 mt-1">Monitor and enforce mandatory course retakes.</p>
                    </div>
                </a>
            </div>

            <div className="flex gap-4 w-full md:w-auto p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50 w-fit">
                    <button
                        onClick={() => setActiveTab('graduating')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                            activeTab === 'graduating'
                                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Target className="w-4 h-4" />
                        Graduating
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                            activeTab === 'search'
                                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-700"
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
