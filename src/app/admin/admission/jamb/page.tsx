"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    GraduationCap,
    FileUp,
    Search,
    Users,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
    Database,
    X,
    Settings,
    Calculator
} from "lucide-react";
import Link from "next/link";
import { getJambCandidates, bulkImportJambData } from "@/actions/admission";
import { getCandidateValidationStatus } from "@/actions/admission-validation";
import { UniversalImporter } from "@/components/UniversalImporter";
import { cn } from "@/lib/utils";

export default function AdminAdmissionPage() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showImporter, setShowImporter] = useState(false);
    const [validationStatuses, setValidationStatuses] = useState<{[key: string]: any}>({});

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setLoading(true);
        const data = await getJambCandidates();
        setCandidates(data);
        
        // Fetch validation status for each candidate
        const statuses: {[key: string]: any} = {};
        for (const candidate of data) {
            const status = await getCandidateValidationStatus(candidate.jambRegNo);
            if (status.success) {
                statuses[candidate.jambRegNo] = status;
            }
        }
        setValidationStatuses(statuses);
        setLoading(false);
    };

    // Calculate stats
    const totalCandidates = candidates.length;
    const claimedProfiles = candidates.filter(c => c.isClaimed).length;
    const validCandidates = Object.values(validationStatuses).filter(s => s.validationStatus === 'VALID').length;
    const invalidCandidates = Object.values(validationStatuses).filter(s => s.validationStatus === 'INVALID').length;

    const filteredCandidates = candidates.filter(c =>
        c.jambRegNo.toLowerCase().includes(search.toLowerCase()) ||
        c.surname.toLowerCase().includes(search.toLowerCase()) ||
        c.firstname.toLowerCase().includes(search.toLowerCase())
    );

    return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-650/30 to-indigo-600/30 opacity-50 mix-blend-overlay" />
            <div className="relative z-10 flex-1">
                <div className="flex items-center gap-4 mb-2">
                    <GraduationCap className="w-12 h-12 text-indigo-400 drop-shadow-md" />
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                        Admission Ledger
                    </h2>
                </div>
                <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
                    Scale administrative intake with JAMB candidate synchronization and robust analytics
                </p>
            </div>
            
            <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
                <Button
                    onClick={() => setShowImporter(!showImporter)}
                    className={cn(
                        "font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest border border-white/10 active:scale-95",
                        showImporter ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-indigo-650 hover:bg-indigo-700 text-white"
                    )}
                >
                    {showImporter ? <X className="w-5 h-5" /> : <FileUp className="w-5 h-5" />}
                    {showImporter ? "Cancel Import" : "Import JAMB Data"}
                </Button>
                <Link href="/admin/admission/scoring">
                    <Button className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white border border-white/10 active:scale-95">
                        <Calculator className="w-5 h-5" />
                        Scoring
                    </Button>
                </Link>
                <Link href="/admin/admission/validation">
                    <Button className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md active:scale-95">
                        <Settings className="w-5 h-5" />
                        Validation
                    </Button>
                </Link>
                <Link href="/admin/admission/leads">
                    <Button className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest bg-blue-600 hover:bg-blue-700 text-white border border-white/10 active:scale-95">
                        <Users className="w-5 h-5" />
                        CRM
                    </Button>
                </Link>
                <Link href="/admin/admission/waitlist">
                    <Button className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest bg-amber-600 hover:bg-amber-700 text-white border border-white/10 active:scale-95">
                        <AlertCircle className="w-5 h-5" />
                        Waitlist
                    </Button>
                </Link>
                <Link href="/admin/admission/interviews">
                    <Button className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest bg-purple-650 hover:bg-purple-700 text-white border border-white/10 active:scale-95">
                        <Calculator className="w-5 h-5" />
                        Interviews
                    </Button>
                </Link>
            </div>
        </div>

        {/* Quick search input */}
        <div className="relative w-full md:w-96 shrink-0">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                placeholder="Search Reg No / Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-white/60 rounded-[1.2rem] text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white outline-none transition-all shadow-inner"
            />
        </div>

        {showImporter && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <UniversalImporter
                    title="Candidate Data Synchronization"
                    description="Synchronize institutional records with JAMB master list. Required fields: jambRegNo, surname, firstname, dob (YYYY-MM-DD)."
                    templateColumns={["jambRegNo", "surname", "middlename", "firstname", "dob", "courseId", "facultyId", "deptId", "utmeSubjects"]}
                    onImport={bulkImportJambData}
                    onComplete={() => {
                        fetchCandidates();
                        setShowImporter(false);
                    }}
                />
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-100 rounded-[1.5rem] text-indigo-650 shadow-inner">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Candidates</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{totalCandidates}</p>
                    </div>
                </div>
            </Card>
            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-100 rounded-[1.5rem] text-emerald-650 shadow-inner">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Claimed Profiles</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{claimedProfiles}</p>
                    </div>
                </div>
            </Card>
            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-100 rounded-[1.5rem] text-emerald-650 shadow-inner">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Valid Candidates</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{validCandidates}</p>
                    </div>
                </div>
            </Card>
            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-rose-100 rounded-[1.5rem] text-rose-650 shadow-inner">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Invalid Candidates</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{invalidCandidates}</p>
                    </div>
                </div>
            </Card>
            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-6 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-amber-100 rounded-[1.5rem] text-amber-650 shadow-inner">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pending Intake</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{totalCandidates - claimedProfiles}</p>
                    </div>
                </div>
            </Card>
        </div>

        <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl overflow-hidden rounded-[3rem]">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Candidate Name</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">JAMB Reg No</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">DOB</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Validation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40 bg-white/20">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-650" />
                                </td>
                            </tr>
                        ) : filteredCandidates.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="max-w-xs mx-auto space-y-4">
                                        <Database className="w-12 h-12 text-slate-350 mx-auto animate-pulse" />
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No candidates indexed in the institutional ledger</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredCandidates.map((c) => {
                                const validation = validationStatuses[c.jambRegNo];
                                return (
                                    <tr key={c.id} className="hover:bg-white/40 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-base font-black text-slate-800 uppercase group-hover:text-indigo-700 transition-colors">{c.surname}, {c.firstname} {c.middlename}</span>
                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">Academic Intake 2026/2027</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-4 py-1.5 bg-white/60 border border-white/80 text-slate-800 rounded-xl text-xs font-black tracking-widest shadow-sm font-mono">
                                                {c.jambRegNo}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-slate-500 font-mono">
                                            {c.dob}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit shadow-sm border",
                                                c.isClaimed ? "bg-emerald-100 border-emerald-250 text-emerald-700" : "bg-amber-100 border-amber-250 text-amber-700"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", c.isClaimed ? "bg-emerald-500" : "bg-amber-500")} />
                                                {c.isClaimed ? "Profile Claimed" : "Unclaimed"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            {validation ? (
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit shadow-sm border",
                                                    validation.validationStatus === 'VALID' ? "bg-emerald-100 border-emerald-250 text-emerald-700" :
                                                    validation.validationStatus === 'INVALID' ? "bg-rose-100 border-rose-250 text-rose-700" :
                                                    "bg-amber-100 border-amber-250 text-amber-700"
                                                )}>
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        validation.validationStatus === 'VALID' ? "bg-emerald-500" :
                                                        validation.validationStatus === 'INVALID' ? "bg-rose-500" :
                                                        "bg-amber-500"
                                                    )} />
                                                    {validation.validationStatus}
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 border border-slate-200 text-slate-500 shadow-sm">
                                                    PENDING
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>
    </div>
    );
}
