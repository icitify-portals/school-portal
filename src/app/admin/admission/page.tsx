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
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic">
                        <GraduationCap className="w-10 h-10 text-indigo-600" />
                        ADMISSION LEDGER
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Scale administrative intake with JAMB candidate synchronization</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button
                        onClick={() => setShowImporter(!showImporter)}
                        className={cn(
                            "font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest",
                            showImporter ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                        )}
                    >
                        {showImporter ? <X className="w-5 h-5" /> : <FileUp className="w-5 h-5" />}
                        {showImporter ? "Cancel Import" : "Import JAMB Data"}
                    </Button>
                    <Link href="/admin/admission/scoring">
                        <Button className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Calculator className="w-5 h-5" />
                            Scoring Config
                        </Button>
                    </Link>
                    <Link href="/admin/admission/validation">
                        <Button className="font-black px-6 py-6 rounded-2xl shadow-lg transition-all flex gap-3 uppercase text-xs tracking-widest bg-white hover:bg-slate-50 text-slate-700 border border-slate-200">
                            <Settings className="w-5 h-5" />
                            Validation Dashboard
                        </Button>
                    </Link>
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-sm"
                            placeholder="Search Reg No / Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
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

            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
                <Card className="border-none shadow-sm bg-indigo-50/50 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Candidates</p>
                            <p className="text-2xl font-black text-slate-900">{totalCandidates}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Claimed Profiles</p>
                            <p className="text-2xl font-black text-slate-900">{claimedProfiles}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid Candidates</p>
                            <p className="text-2xl font-black text-slate-900">{validCandidates}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none shadow-sm bg-rose-50/50 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-100 rounded-2xl text-rose-600">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invalid Candidates</p>
                            <p className="text-2xl font-black text-slate-900">{invalidCandidates}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none shadow-sm bg-amber-50/50 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Intake</p>
                            <p className="text-2xl font-black text-slate-900">{totalCandidates - claimedProfiles}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="border-none shadow-xl overflow-hidden rounded-[2.5rem] italic">
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
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
                                    </td>
                                </tr>
                            ) : filteredCandidates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto space-y-4">
                                            <Database className="w-12 h-12 text-slate-200 mx-auto" />
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No candidates indexed in the institutional ledger</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCandidates.map((c) => {
                                    const validation = validationStatuses[c.jambRegNo];
                                    return (
                                        <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 uppercase">{c.surname}, {c.firstname} {c.middlename}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Academic Intake 2026/2027</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black tracking-widest">
                                                    {c.jambRegNo}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-xs text-slate-500 font-bold">
                                                {c.dob}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit",
                                                    c.isClaimed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", c.isClaimed ? "bg-emerald-500" : "bg-amber-500")} />
                                                    {c.isClaimed ? "Profile Claimed" : "Unclaimed"}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                {validation ? (
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit",
                                                        validation.validationStatus === 'VALID' ? "bg-emerald-100 text-emerald-700" :
                                                        validation.validationStatus === 'INVALID' ? "bg-rose-100 text-rose-700" :
                                                        "bg-amber-100 text-amber-700"
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
                                                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500">
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
    );
}
